import type { PhoneMessage, PhoneState, PocketConversation, PocketContact } from '../types.js'
import { conversationActorIds, resolvePocketActor } from '../domain/actors.js'
import { pocketPersonaActorId } from '../domain/device.js'
import { createPocketReference } from './references.js'
import { callAvailabilityContext } from '../domain/call-availability.js'
import { callSummary } from '../domain/phone-events.js'

type Input = Record<string, any>
export interface CallHost {
  load(chatId: string, characterId: string, userId?: string): Promise<PhoneState>
  save(state: PhoneState, userId?: string): Promise<void>
  lock<T>(chatId: string, characterId: string, action: () => Promise<T>): Promise<T>
  publish(state: PhoneState, userId?: string): Promise<void>
  send(payload: unknown, userId?: string): void
  id(prefix: string): string
  timestamp(state: PhoneState): string
  contact(actor: NonNullable<ReturnType<typeof resolvePocketActor>>): PocketContact
  profile(contact: PocketContact, userId?: string): Promise<{ name: string; description: string; personality: string; behavior: string }>
  character(id: string, userId?: string): Promise<any>
  background(state: PhoneState, contact: PocketContact, conversation: PocketConversation, userId?: string): Promise<string>
  generate(requestId: string, messages: Array<{ role: string; content: string }>, signal: AbortSignal, userId?: string): Promise<unknown>
  remember(state: PhoneState, conversation: PocketConversation, message: PhoneMessage): void
  availabilityKey?(state: PhoneState, contact: PocketContact, conversation: PocketConversation, userId?: string): Promise<string>
  sendText?(input: { chatId: string; characterId: string; conversationId: string; actorId: string; text: string; requestId: string }, userId?: string): Promise<void>
}

function clean(value: unknown, max: number): string { return typeof value === 'string' ? value.trim().slice(0, max) : '' }
function callExpressions(character: any): Record<string, string> {
  const entries = new Map<string, string>()
  const add = (mappings: unknown, prefix = '') => {
    if (!mappings || typeof mappings !== 'object' || Array.isArray(mappings)) return
    for (const [label, imageId] of Object.entries(mappings)) {
      const key = `${prefix}${label}`
      if (!label.trim() || key.length > 80 || typeof imageId !== 'string' || !imageId) continue
      if (entries.size >= 100) return
      entries.set(key, `/api/v1/images/${encodeURIComponent(imageId)}`)
    }
  }
  add(character?.extensions?.expressions?.mappings)
  const groups = character?.extensions?.expression_groups
  if (groups && typeof groups === 'object' && !Array.isArray(groups)) {
    for (const [name, mappings] of Object.entries(groups)) add(mappings, `${name}: `)
  }
  return Object.fromEntries(entries)
}
export function normalizeCallReply(raw: unknown, expressions: Record<string, string>): { text: string; expression: string; choices: string[]; end: boolean } {
  const value = raw && typeof raw === 'object' ? raw as Input : {}
  const text = clean(value.message, 4_000)
  if (!text) throw new Error('The character did not return spoken dialogue. Try again.')
  return { text, expression: typeof value.expression === 'string' && Object.hasOwn(expressions, value.expression) ? value.expression : Object.keys(expressions)[0] || '',
    choices: [...new Set((Array.isArray(value.choices) ? value.choices : []).map(row => clean(row, 180)).filter(Boolean))].slice(0, 3), end: value.end === true }
}
export function normalizeCallDecision(raw: unknown, expressions: Record<string, string>) {
  const value = raw && typeof raw === 'object' ? raw as Input : {}
  const decision = value.decision === undefined ? 'answer' : value.decision
  if (!['answer', 'reject', 'ignore'].includes(decision)) throw new Error('The character did not decide whether to answer. Try again.')
  const follow = value.followUp
  const followUp = follow && (follow.when === 'now' || follow.when === 'later') && clean(follow.text, 1_000)
    ? { when: follow.when as 'now' | 'later', text: clean(follow.text, 1_000), status: 'pending' as const, availabilityKey: '' } : undefined
  return { decision: decision as 'answer' | 'reject' | 'ignore', reply: decision === 'answer' ? normalizeCallReply(value, expressions) : undefined, followUp }
}

/** Every mutation rechecks the persisted call; ending a call can cancel generation without waiting for it. */
export class PocketCalls {
  private flights = new Map<string, AbortController>()
  private followUpFlights = new Set<string>()
  constructor(private host: CallHost) {}
  private key(input: Input, userId?: string): string { return `${userId || '_'}:${input.chatId}:${input.characterId}` }
  private conversation(state: PhoneState, input: Input): PocketConversation {
    const conversation = state.conversations.find(row => row.id === input.conversationId)
    if (!conversation || conversation.kind !== 'direct' || !conversation.includesPocketPersona) throw new Error('Choose a direct conversation on your Pocket Persona’s phone.')
    if (input.deviceOwnerActorId && input.deviceOwnerActorId !== pocketPersonaActorId(state)) throw new Error('Calls are unavailable while inspecting another phone.')
    return conversation
  }
  private marker(conversation: PocketConversation, callId: string, allowRinging = false) {
    const marker = conversation.messages.filter(row => row.call?.callId === callId && row.candidateCommitState !== 'provisional').at(-1)?.call
    if (!marker || marker.status !== 'connected' && !(allowRinging && marker.status === 'ringing')) throw new Error('This call has ended or has not been answered. Start a new call.')
    return marker
  }
  async handle(type: string, input: Input, userId?: string): Promise<void> {
    if (type === 'lumiphone:call_end') { await this.end(input, userId); return }
    const scope = this.key(input, userId)
    if (this.flights.has(scope)) throw new Error('Wait for the current call reply or end the call.')
    const abort = new AbortController(); this.flights.set(scope, abort)
    const timer = setTimeout(() => abort.abort(new Error('Call reply timed out. Try again.')), 120_000)
    try {
      let state = await this.host.load(input.chatId, input.characterId, userId)
      let conversation = this.conversation(state, input)
      const actor = conversationActorIds(conversation).map(actorId => resolvePocketActor(state, actorId)).find(row => row && row.kind !== 'persona')
      if (!actor) throw new Error('This call’s contact is unavailable.')
      const contact = this.host.contact(actor), profile = await this.host.profile(contact, userId)
      abort.signal.throwIfAborted()
      const character = contact.source.kind === 'character' ? await this.host.character(contact.source.characterId, userId) : null
      const expressions = callExpressions(character)
      const mode = input.mode === 'video' ? 'video' : 'voice'
      let callId = clean(input.callId, 180)
      await this.host.lock(input.chatId, input.characterId, async () => {
        abort.signal.throwIfAborted()
        state = await this.host.load(input.chatId, input.characterId, userId); conversation = this.conversation(state, input)
        if (type === 'lumiphone:call_start') {
          const activeCalls = new Map(state.conversations.flatMap(row => row.messages).filter(row => row.call?.interactive).map(row => [row.call!.callId, row.call!]))
          const retry = callId && conversation.messages.find(row => row.call?.callId === callId && row.call.status === 'ringing')
          if (!retry) {
            if ([...activeCalls.values()].some(row => row.status === 'connected' || row.status === 'ringing')) throw new Error('Resume or end the current call first.')
            callId = this.host.id('call')
            conversation.messages.push({ id: this.host.id('msg'), sender: 'persona', senderAccent: state.pocketPersona.accent, senderActorId: pocketPersonaActorId(state), senderName: state.pocketPersona.displayName || 'You',
              text: 'Calling…', createdAt: this.host.timestamp(state), read: true, status: 'read',
              call: { callId, status: 'ringing', speakerphone: false, mode, interactive: true } })
          }
        } else this.marker(conversation, callId, type === 'lumiphone:call_resume')
        const spoken = clean(input.text, 4_000)
        if (type === 'lumiphone:call_reply' && spoken && !conversation.messages.some(row => row.callTurn?.callId === callId && row.generation?.requestId === input.requestId && row.sender === 'persona')) {
          const message: PhoneMessage = { id: this.host.id('msg'), sender: 'persona', senderAccent: state.pocketPersona.accent, senderActorId: pocketPersonaActorId(state), senderName: state.pocketPersona.displayName || 'You',
            recipientActorIds: [actor.actorId], text: spoken, callTurn: { callId }, createdAt: this.host.timestamp(state), read: true, status: 'read', generation: { requestId: input.requestId } }
          conversation.messages.push(message); this.host.remember(state, conversation, message)
        }
        conversation.updatedAt = new Date().toISOString()
        await this.host.save(state, userId)
      })
      const marker = this.marker(conversation, callId, true)
      const ringing = marker.status === 'ringing'
      const video = marker.mode === 'video' && Object.keys(expressions).length > 0
      const turns = conversation.messages.filter(row => row.callTurn?.callId === callId)
      const ready = () => this.host.send({ type: 'lumiphone:call_ready', requestId: input.requestId, chatId: state.chatId, characterId: state.characterId, conversationId: conversation.id,
        callId, name: actor.name, actorId: actor.actorId, mode: marker.mode || mode, video, expressions, turns }, userId)
      if (ringing) this.host.send({ type: 'lumiphone:call_ringing', requestId: input.requestId, chatId: state.chatId, characterId: state.characterId, callId, name: actor.name }, userId)
      else ready()
      if (type === 'lumiphone:call_resume' && !ringing) return
      // A retry with the same request id never creates duplicate dialogue or charges for another completed answer.
      const completed = turns.find(row => row.sender === 'contact' && row.generation?.requestId === input.requestId)
      if (completed) { this.host.send({ type: 'lumiphone:call_turn', requestId: input.requestId, callId, message: completed }, userId); return }
      const background = await this.host.background(state, contact, { ...conversation, messages: conversation.messages.filter(row => row.callTurn?.callId !== callId && row.call?.callId !== callId) }, userId)
      const messages = [
        { role: 'system', content: `You are ${actor.name} ${ringing ? 'receiving' : 'on a live'} ${marker.mode === 'video' ? 'video' : 'phone'} call with ${state.pocketPersona.displayName || 'the player'}. Speak only as this contact. Never speak for the player or invent their answers. This is remote spoken dialogue, not texting and not physical presence. Do not emit Pocket tools/tags. Return strict JSON: {${ringing ? '"decision":"answer|reject|ignore",' : ''}"message":"spoken dialogue only when answered","expression":"expression label","choices":["short optional player reply", "another reply"],"end":false,"followUp":null}. ${ringing ? 'Decide whether to answer using your personality, relationship, current activity, status and story. Here/Away are physical location, not hard phone availability rules. Busy or Away can answer, decline, or ignore. You may pick up briefly and speak quietly (e.g. you are busy and will talk later), then hang up with end=true. reject means decline; ignore means no answer. Both must have empty message/choices and end=false: no speech happened. No answer alone is valid; never force an excuse or follow-up.' : ''} Keep each spoken turn brief, natural and in character. Offer 2–3 meaningful short player replies unless hanging up; these are suggestions only, never spoken or committed until selected. end=true only if you actually say goodbye and hang up. Optional followUp={"when":"now|later","text":"a short discreet text"} ONLY when you choose to send a separate text and it fits your circumstances. now means feasible now; later waits for your activity/status to change and another feasibility check. Leave null to send nothing. Do not reveal private activity to the caller unless you actually say or text it. ${video ? `If answered, video is working. Choose ONLY one of these expression labels: ${Object.keys(expressions).join(', ')}.` : marker.mode === 'video' ? 'If answered, the webcam does not work. In your FIRST spoken turn, invent a short believable in-character reason for the broken webcam, then continue by voice. Never mention expression assets, cards, sprites, programming, or UI.' : 'This is an audio-only phone call.'}\nCALL AVAILABILITY\n${callAvailabilityContext(contact, conversation)}\nCHARACTER IDENTITY\n${profile.description}\n${profile.personality}\n${profile.behavior}\nPOCKET CONTINUITY (reference only; call ownership stays with the two named participants)\n${background}` },
        ...turns.slice(-24).map(row => ({ role: row.sender === 'persona' ? 'user' : 'assistant', content: row.text })),
        { role: 'user', content: ringing ? '[Call control: incoming call. Decide whether to answer, reject, or ignore. Only greet the caller if you answer.]' : '[Call control: respond to the last spoken turn. If it was yours, continue briefly without inventing player speech.]' },
      ]
      const raw = await this.host.generate(input.requestId, messages, abort.signal, userId)
      abort.signal.throwIfAborted()
      const decision = normalizeCallDecision(ringing ? raw : { ...(raw as Input), decision: 'answer' }, expressions)
      const reply = decision.reply
      const availabilityKey = decision.followUp ? await this.availabilityKey(state, contact, conversation, userId) : ''
      await this.host.lock(input.chatId, input.characterId, async () => {
        abort.signal.throwIfAborted()
        const latest = await this.host.load(input.chatId, input.characterId, userId), thread = this.conversation(latest, input)
        const live = this.marker(thread, callId, ringing)
        if (ringing) {
          const attempt = thread.messages.find(row => row.call === live)!
          live.status = decision.decision === 'answer' ? 'connected' : 'missed'
          live.outcome = decision.decision === 'reject' ? 'declined' : decision.decision === 'ignore' ? 'ignored' : undefined
          attempt.text = callSummary(live)
        }
        if (decision.followUp) live.followUp = { ...decision.followUp, availabilityKey }
        if (!reply) {
          this.attachReference(latest, thread, callId)
          await this.host.save(latest, userId); await this.host.publish(latest, userId)
          this.host.send({ type: 'lumiphone:call_result', requestId: input.requestId, chatId: latest.chatId, characterId: latest.characterId, callId, name: actor.name, outcome: live.outcome, summary: callSummary(live) }, userId)
          return
        }
        const message: PhoneMessage = { id: this.host.id('msg'), sender: 'contact', senderAccent: actor.accent, senderActorId: actor.actorId, senderContactId: actor.contact?.id,
          senderName: actor.name, recipientActorIds: [pocketPersonaActorId(latest)], text: reply.text, format: 'voice', callTurn: { callId, expression: reply.expression, choices: reply.choices },
          createdAt: this.host.timestamp(latest), read: true, status: 'read', generation: { requestId: input.requestId } }
        thread.messages.push(message); thread.messages = thread.messages.slice(-240); thread.updatedAt = message.createdAt
        if (reply.end) thread.messages.push({ id: this.host.id('msg'), sender: 'contact', senderAccent: actor.accent, senderActorId: actor.actorId, senderName: actor.name,
          text: 'Call ended', call: { ...live, followUp: live.followUp && { ...live.followUp }, status: 'ended' }, createdAt: message.createdAt, read: true, status: 'read' })
        this.host.remember(latest, thread, message)
        this.attachReference(latest, thread, callId)
        await this.host.save(latest, userId); await this.host.publish(latest, userId)
        if (ringing) ready()
        this.host.send({ type: 'lumiphone:call_turn', requestId: input.requestId, callId, message, ended: reply.end }, userId)
      })
      // Let the frontend finish the goodbye audio before it closes the call.
    } finally { clearTimeout(timer); if (this.flights.get(scope) === abort) this.flights.delete(scope) }
  }
  private attachReference(state: PhoneState, conversation: PocketConversation, callId: string): void {
    const referenceId = `call_reference_${callId}`
    const existing = state.references.find(row => row.id.startsWith(referenceId) && (row.status === 'armed' || row.status === 'failed'))
    const call = conversation.messages.filter(row => row.call?.callId === callId).at(-1)?.call
    const spoken = conversation.messages.filter(row => row.callTurn?.callId === callId)
    const reference = createPocketReference({ state, conversation: { ...conversation, messages: spoken.length ? spoken : conversation.messages.filter(row => row.call?.callId === callId).slice(-1) }, scope: 'conversation', createdAt: new Date().toISOString(), makeId: () => `call_reference_${callId}` })
    reference.snapshot = `Spoken ${call?.mode === 'video' ? 'video' : 'phone'} call transcript. Call ID: ${callId}. Call state: ${call?.status || 'connected'}. ${call?.status === 'ended' ? 'The call is already ended in Pocket; do not recreate its end action.' : 'The call is still connected.'} These lines already happened as speech, not text messages. Only the call participants heard them; this does not establish physical presence. ${reference.snapshot}`.slice(0, 600)
    if (!spoken.length) reference.snapshot = `Phone call attempt. Call ID: ${callId}. Outcome: ${call ? callSummary(call) : 'No answer'}. Technical call history only: no connection or spoken exchange occurred. Do not invent dialogue, a private reason, or knowledge of the recipient’s activity. The caller only knows this outcome. This does not establish physical presence.`
    if (!reference.messages.length) return
    if (existing) Object.assign(existing, reference)
    else { // Never overwrite an in-flight or consumed reference id.
      if (state.references.some(row => row.id === reference.id)) reference.id = `${referenceId}_${this.host.id('part')}`
      state.references.push(reference); state.references = state.references.slice(-24)
    }
  }
  async end(input: Input, userId?: string): Promise<void> {
    this.flights.get(this.key(input, userId))?.abort()
    await this.host.lock(input.chatId, input.characterId, async () => {
      const state = await this.host.load(input.chatId, input.characterId, userId), conversation = this.conversation(state, input)
      const prior = conversation.messages.filter(row => input.callId ? row.call?.callId === input.callId : row.call?.interactive).at(-1)?.call
      if (!prior) return
      if (prior.status === 'connected' || prior.status === 'ringing') {
        if (prior.status === 'ringing') {
          prior.status = 'ended'; prior.outcome = 'cancelled'
          conversation.messages.find(row => row.call === prior)!.text = 'Call cancelled'
        } else {
          conversation.messages.push({ id: this.host.id('msg'), sender: 'persona', senderAccent: state.pocketPersona.accent, senderActorId: pocketPersonaActorId(state), senderName: state.pocketPersona.displayName || 'You', text: 'Call ended',
            call: { ...prior, status: 'ended' }, createdAt: this.host.timestamp(state), read: true, status: 'read' })
        }
        this.attachReference(state, conversation, prior.callId)
        await this.host.save(state, userId); await this.host.publish(state, userId)
      }
      this.host.send({ type: 'lumiphone:call_ended', callId: prior.callId, requestId: input.requestId }, userId)
    })
  }
  private async availabilityKey(state: PhoneState, contact: PocketContact, conversation: PocketConversation, userId?: string): Promise<string> {
    return (this.host.availabilityKey ? await this.host.availabilityKey(state, contact, conversation, userId) : callAvailabilityContext(contact, conversation)).slice(0, 4_000)
  }
  /** No timer: deferred texts are reconsidered only after relevant story/status changes. */
  async processFollowUps(input: Input, userId?: string): Promise<void> {
    const scope = this.key(input, userId)
    if (!this.host.sendText || this.followUpFlights.has(scope)) return
    this.followUpFlights.add(scope)
    try {
      const state = await this.host.load(input.chatId, input.characterId, userId)
      for (const conversation of state.conversations.filter(row => row.kind === 'direct' && row.includesPocketPersona)) {
        const latestCalls = new Map(conversation.messages.filter(row => row.call?.interactive).map(row => [row.call!.callId, row.call!]))
        for (const call of latestCalls.values()) {
          const follow = call.followUp
          if (!follow || follow.status !== 'pending' || call.status === 'ringing') continue
          const actor = conversationActorIds(conversation).map(actorId => resolvePocketActor(state, actorId)).find(row => row && row.kind !== 'persona')
          if (!actor) continue
          const contact = this.host.contact(actor), availabilityKey = await this.availabilityKey(state, contact, conversation, userId)
          if (follow.when === 'later' && availabilityKey === follow.availabilityKey) continue
          let message = follow.text, status: 'pending' | 'sent' | 'cancelled' = 'sent'
          if (follow.when === 'later') {
            const profile = await this.host.profile(contact, userId), background = await this.host.background(state, contact, conversation, userId)
            const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 60_000)
            try {
              const raw = await this.host.generate(`call_followup_check_${call.callId}_${this.host.id('check')}`, [{ role: 'system', content: `You are ${actor.name}. After a phone call you considered texting ${state.pocketPersona.displayName || 'the caller'} later. Decide whether it is feasible and in character NOW. No text is obligatory. Return strict JSON {"decision":"send|wait|cancel","message":"short discreet text only if send"}. Preserve current story timing; do not invent a new event or user response. Refresh the text for current circumstances instead of sending a stale excuse.\n${profile.description}\n${profile.personality}\n${profile.behavior}\n${callAvailabilityContext(contact, conversation)}\n${background}` }, { role: 'user', content: `Earlier optional text: ${JSON.stringify(follow.text)}. Call outcome: ${callSummary(call)}. Can you discreetly text now?` }], controller.signal, userId) as Input
              controller.signal.throwIfAborted()
              if (raw?.decision === 'send' && clean(raw.message, 1_000)) message = clean(raw.message, 1_000)
              else if (raw?.decision === 'cancel') status = 'cancelled'
              else status = 'pending'
            } finally { clearTimeout(timer) }
          }
          if (status === 'sent') await this.host.sendText({ chatId: state.chatId, characterId: state.characterId, conversationId: conversation.id, actorId: actor.actorId, text: message, requestId: `call_followup_${call.callId}` }, userId)
          await this.host.lock(input.chatId, input.characterId, async () => {
            const latest = await this.host.load(input.chatId, input.characterId, userId)
            const thread = latest.conversations.find(row => row.id === conversation.id)
            for (const row of thread?.messages || []) if (row.call?.callId === call.callId && row.call.followUp) Object.assign(row.call.followUp, { status, availabilityKey })
            await this.host.save(latest, userId)
          })
        }
      }
    } finally { this.followUpFlights.delete(scope) }
  }
}
