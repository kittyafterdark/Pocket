import type { DevicePreferences, PhoneMessage, PhoneState, PocketConversation, PocketContact } from '../types.js'
import { conversationActorIds, resolvePocketActor } from '../domain/actors.js'
import { pocketPersonaActorId } from '../domain/device.js'
import { createPocketReference } from './references.js'
import { callAvailabilityContext } from '../domain/call-availability.js'
import { callSummary } from '../domain/phone-events.js'
import { ensureDirectConversation } from '../domain/contacts.js'

type Input = Record<string, any>
export interface CallHost {
  preferences?(userId?: string): Promise<DevicePreferences>
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
export function normalizeCallReply(raw: unknown, expressions: Record<string, string>): { text: string; expression: string; choices: string[]; end: boolean; scene?: string } {
  const value = raw && typeof raw === 'object' ? raw as Input : {}
  const text = clean(value.message, 4_000)
  if (!text) throw new Error('The character did not return spoken dialogue. Try again.')
  return { text, expression: typeof value.expression === 'string' && Object.hasOwn(expressions, value.expression) ? value.expression : Object.keys(expressions)[0] || '',
    choices: [...new Set((Array.isArray(value.choices) ? value.choices : []).map(row => clean(row, 180)).filter(Boolean))].slice(0, 3), end: value.end === true,
    ...(clean(value.scene, 600) ? { scene: clean(value.scene, 600) } : {}) }
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
  private incomingFlights = new Set<string>()
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
    if (type === 'lumiphone:call_camera') { await this.camera(input, userId); return }
    if (type === 'lumiphone:call_decline' || type === 'lumiphone:call_ignore') { await this.end({ ...input, declined: type === 'lumiphone:call_decline', ignored: type === 'lumiphone:call_ignore' }, userId); return }
    if (type === 'lumiphone:call_end') { await this.end(input, userId); return }
    const scope = this.key(input, userId)
    if (this.flights.has(scope)) throw new Error('Wait for the current call reply or end the call.')
    const abort = new AbortController(); this.flights.set(scope, abort)
    const timer = setTimeout(() => abort.abort(new Error('Call reply timed out. Try again.')), 120_000)
    try {
      let state = await this.host.load(input.chatId, input.characterId, userId)
      let conversation = this.conversation(state, input)
      const preferences = await this.host.preferences?.(userId)
      if (type === 'lumiphone:call_accept') {
        const incoming = this.marker(conversation, clean(input.callId, 180), true)
        if (incoming.direction !== 'incoming' || incoming.status !== 'ringing' || !incoming.incomingOpening) throw new Error('This incoming call has ended or is unavailable.')
        if (!preferences?.incomingCallScenes || preferences.roleplayContextMode === 'off') { await this.end({ ...input, declined: true }, userId); return }
      }
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
              call: { callId, status: 'ringing', speakerphone: false, mode, interactive: true, direction: 'outgoing', personaCamera: mode === 'video' ? input.personaCamera !== false : undefined } })
          }
        } else this.marker(conversation, callId, type === 'lumiphone:call_resume' || type === 'lumiphone:call_accept')
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
      if (ringing && marker.direction === 'incoming' && type !== 'lumiphone:call_accept') {
        this.host.send({ type: 'lumiphone:call_incoming', requestId: input.requestId, chatId: state.chatId, characterId: state.characterId, conversationId: conversation.id, callId, contactId: contact.id, name: actor.name, mode: marker.mode || 'voice' }, userId)
        return
      }
      const briefScenes = ringing && preferences?.briefCallScenes === true && preferences.roleplayContextMode !== 'off'
      const ready = () => this.host.send({ type: 'lumiphone:call_ready', requestId: input.requestId, chatId: state.chatId, characterId: state.characterId, conversationId: conversation.id,
        callId, name: actor.name, actorId: actor.actorId, mode: marker.mode || mode, video, expressions, turns, personaCamera: marker.personaCamera !== false }, userId)
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
      messages[0].content += `\nPLAYER CAMERA\n${marker.mode !== 'video' ? 'Audio only: you cannot see the caller.' : marker.personaCamera === false ? 'The caller’s persona camera is hidden. You cannot see their face, body, gestures, or surroundings. Do not infer visual facts from spoken text.' : 'The caller’s persona camera is shown. You may refer only to their established RP appearance and explicitly narrated visible actions. No real webcam or human image is provided.'}\nBRIEF PICKUP SCENES\n${briefScenes ? 'Opt-in enabled. If your current situation fits, you may answer briefly with scene="a small audible slice of your current life (visible too only if video works)", then message="your spoken realization/apology that you are busy and goodbye", end=true, choices=[]. Ground it in current RP context; do not create a major offscreen event or speak for the player. Scene is background context, not narration to read aloud. This is optional, not every call.' : 'Disabled. Do not return a scene snippet. Normal brief busy dialogue is still allowed.'}`
      const opening = ringing && marker.direction === 'incoming' && type === 'lumiphone:call_accept' ? marker.incomingOpening : undefined
      const raw = opening ? { decision: 'answer', message: opening.text, scene: opening.scene, expression: opening.expression, choices: [], end: true } : await this.host.generate(input.requestId, messages, abort.signal, userId)
      abort.signal.throwIfAborted()
      const decision = normalizeCallDecision(ringing ? raw : { ...(raw as Input), decision: 'answer' }, expressions)
      const reply = decision.reply
      if (reply?.scene && !briefScenes && !opening) delete reply.scene
      if (reply?.scene) { reply.end = true; reply.choices = [] }
      const availabilityKey = decision.followUp ? await this.availabilityKey(state, contact, conversation, userId) : ''
      await this.host.lock(input.chatId, input.characterId, async () => {
        abort.signal.throwIfAborted()
        const latest = await this.host.load(input.chatId, input.characterId, userId), thread = this.conversation(latest, input)
        const live = this.marker(thread, callId, ringing)
        if (ringing) {
          const attempt = thread.messages.find(row => row.call === live)!
          live.status = decision.decision === 'answer' ? 'connected' : 'missed'
          live.outcome = decision.decision === 'reject' ? 'declined' : decision.decision === 'ignore' ? 'ignored' : undefined
          delete live.incomingOpening
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
          senderName: actor.name, recipientActorIds: [pocketPersonaActorId(latest)], text: reply.text, format: 'voice', callTurn: { callId, expression: reply.expression, choices: reply.choices, scene: reply.scene },
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
    const spoken = conversation.messages.filter(row => row.callTurn?.callId === callId || row.callCamera?.callId === callId)
    const reference = createPocketReference({ state, conversation: { ...conversation, messages: spoken.length ? spoken : conversation.messages.filter(row => row.call?.callId === callId).slice(-1) }, scope: 'conversation', createdAt: new Date().toISOString(), makeId: () => `call_reference_${callId}` })
    reference.snapshot = `Spoken ${call?.mode === 'video' ? 'video' : 'phone'} call transcript. Call ID: ${callId}. Call state: ${call?.status || 'connected'}. ${call?.status === 'ended' ? 'The call is already ended in Pocket; do not recreate its end action.' : 'The call is still connected.'} These lines already happened as speech, not text messages. Only the call participants heard them; this does not establish physical presence. ${reference.snapshot}`.slice(0, 600)
    if (call?.mode === 'video') reference.snapshot = `Persona camera: ${call.personaCamera === false ? 'hidden; the NPC cannot see the persona' : 'shown; only established RP visuals are available'}. Camera control entries are not spoken dialogue. ${reference.snapshot}`.slice(0, 600)
    for (const message of reference.messages) {
      const source = spoken.find(row => row.id === message.messageId)
      if (source?.callTurn?.scene) message.text = `[Call background: ${source.callTurn.scene}] ${message.text}`.slice(0, 420)
    }
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
          prior.status = input.declined || input.ignored ? 'missed' : 'ended'; prior.outcome = input.declined ? 'declined' : input.ignored ? 'ignored' : 'cancelled'
          delete prior.incomingOpening
          conversation.messages.find(row => row.call === prior)!.text = callSummary(prior)
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
  private async camera(input: Input, userId?: string): Promise<void> {
    await this.host.lock(input.chatId, input.characterId, async () => {
      if (this.flights.has(this.key(input, userId))) throw new Error('Wait for the current spoken reply before changing camera visibility.')
      const state = await this.host.load(input.chatId, input.characterId, userId), conversation = this.conversation(state, input)
      const marker = this.marker(conversation, clean(input.callId, 180))
      if (marker.mode !== 'video' || typeof input.visible !== 'boolean') throw new Error('Camera visibility is available only during a video call.')
      if (marker.personaCamera !== input.visible) {
        marker.personaCamera = input.visible
        conversation.messages.push({ id: this.host.id('msg'), sender: 'persona', senderName: state.pocketPersona.displayName || 'You', senderActorId: pocketPersonaActorId(state), senderAccent: state.pocketPersona.accent,
          text: `[Call camera ${input.visible ? 'shown' : 'hidden'}]`, callCamera: { callId: marker.callId, visible: input.visible }, createdAt: this.host.timestamp(state), read: true, status: 'read' })
        this.attachReference(state, conversation, marker.callId)
        await this.host.save(state, userId); await this.host.publish(state, userId)
      }
      this.host.send({ type: 'lumiphone:call_camera', requestId: input.requestId, callId: marker.callId, visible: marker.personaCamera !== false }, userId)
    })
  }
  /** One bounded decision after a new RP source; repeated refreshes never cause calls. */
  async offerIncoming(input: Input, userId?: string): Promise<void> {
    input = { ...input, sourceKey: clean(input.sourceKey, 1_600) }
    const preferences = await this.host.preferences?.(userId), scope = this.key(input, userId)
    if (!preferences?.incomingCallScenes || preferences.roleplayContextMode === 'off' || !input.seed || !clean(input.sourceKey, 1_600) || this.incomingFlights.has(scope)) return
    this.incomingFlights.add(scope)
    try {
      let state = await this.host.load(input.chatId, input.characterId, userId)
      if (state.callSceneCheck?.sourceKey === input.sourceKey) return
      // A call ignored through another RP turn must not keep ringing or replay an outdated scene.
      await this.host.lock(input.chatId, input.characterId, async () => {
        state = await this.host.load(input.chatId, input.characterId, userId)
        let changed = false
        for (const conversation of state.conversations) for (const message of conversation.messages) {
          const call = message.call
          if (call?.interactive && call.direction === 'incoming' && call.status === 'ringing') {
            call.status = 'missed'; call.outcome = 'ignored'; delete call.incomingOpening; message.text = callSummary(call)
            this.attachReference(state, conversation, call.callId); changed = true
            this.host.send({ type: 'lumiphone:call_ended', callId: call.callId }, userId)
          }
        }
        if (changed) { await this.host.save(state, userId); await this.host.publish(state, userId) }
      })
      const active = new Map(state.conversations.flatMap(row => row.messages).filter(row => row.call?.interactive).map(row => [row.call!.callId, row.call!]))
      if ([...active.values()].some(row => row.status === 'ringing' || row.status === 'connected')) return
      const lastOfferRevision = state.callSceneCheck?.lastOfferRevision ?? -10
      let reserved = false
      await this.host.lock(input.chatId, input.characterId, async () => {
        state = await this.host.load(input.chatId, input.characterId, userId)
        if (state.callSceneCheck?.sourceKey === input.sourceKey) return
        state.callSceneCheck = { sourceKey: input.sourceKey, lastOfferRevision }
        await this.host.save(state, userId); reserved = true
      })
      if (!reserved || (state.stateRevision || 0) - lastOfferRevision < 3) return
      const contacts = state.contacts.filter(row => row.generationPolicy.relevant && row.messagingPolicy.remoteEligible).slice(0, 6)
      if (!contacts.length) return
      const candidates = await Promise.all(contacts.map(async contact => {
        const profile = await this.host.profile(contact, userId)
        const conversation = state.conversations.find(row => row.kind === 'direct' && row.includesPocketPersona && conversationActorIds(row).includes(contact.id)) || { id: '', kind: 'direct', title: contact.name, messages: [], availability: { state: 'remote' }, participantActorIds: [contact.id], participantContactIds: [contact.id], includesPocketPersona: true, unread: 0, createdAt: '', updatedAt: '' } as PocketConversation
        return { contactId: contact.id, name: contact.name, identity: profile.description, personality: profile.personality, behavior: profile.behavior, context: (await this.host.background(state, contact, conversation, userId)).slice(0, 3_000) }
      }))
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 60_000)
      let raw: Input
      try {
        raw = await this.host.generate(`incoming_call_${this.host.id('scene')}`, [{ role: 'system', content: `Optional slice-of-life phone call. The player opted in to occasional incoming calls after RP turns. Prefer no call unless current character activity naturally supports a brief accidental or distracted pickup. Choose ONE contact from the supplied candidates, or none. Return JSON {"decision":"none|call","contactId":"candidate id","scene":"short audible background moment from their current life","message":"ONLY this NPC’s spoken words: realizes the call, apologizes, says busy, and goodbye"}. The phone remains silent until the player accepts. No major new event, player speech/actions, secrets from another actor’s private context, or fabricated established facts. Ordinary minor incidental details are allowed. This is always a short audio call that ends after this single NPC turn.\n${JSON.stringify(candidates)}` }, { role: 'user', content: 'Does this RP moment fit one brief incoming call? None is a valid choice.' }], controller.signal, userId) as Input
        controller.signal.throwIfAborted()
      } finally { clearTimeout(timer) }
      if (raw?.decision !== 'call') return
      const contact = contacts.find(row => row.id === raw.contactId), opening = clean(raw.message, 2_000), scene = clean(raw.scene, 600)
      if (!contact || !opening || !scene) return
      await this.host.lock(input.chatId, input.characterId, async () => {
        const latest = await this.host.load(input.chatId, input.characterId, userId)
        const currentPreferences = await this.host.preferences?.(userId)
        if (!currentPreferences?.incomingCallScenes || currentPreferences.roleplayContextMode === 'off' || latest.callSceneCheck?.sourceKey !== input.sourceKey || latest.lastReconciliation?.sourceKey && clean(latest.lastReconciliation.sourceKey, 1_600) !== input.sourceKey) return
        const latestActive = new Map(latest.conversations.flatMap(row => row.messages).filter(row => row.call?.interactive).map(row => [row.call!.callId, row.call!]))
        if ([...latestActive.values()].some(row => row.status === 'ringing' || row.status === 'connected') || !latest.contacts.some(row => row.id === contact.id)) return
        const conversation = ensureDirectConversation(latest, contact.id, this.host.timestamp(latest), prefix => this.host.id(prefix)), callId = this.host.id('call')
        conversation.messages.push({ id: this.host.id('msg'), sender: 'contact', senderName: contact.name, senderActorId: contact.id, senderContactId: contact.id, senderAccent: contact.accent, text: 'Incoming phone call', createdAt: this.host.timestamp(latest), read: true, status: 'read',
          call: { callId, status: 'ringing', speakerphone: false, mode: 'voice', interactive: true, direction: 'incoming', incomingOpening: { text: opening, scene, expression: '' } } })
        latest.callSceneCheck = { sourceKey: input.sourceKey, lastOfferRevision: latest.stateRevision || 0 }
        await this.host.save(latest, userId); await this.host.publish(latest, userId)
        this.host.send({ type: 'lumiphone:call_incoming', chatId: latest.chatId, characterId: latest.characterId, conversationId: conversation.id, callId, contactId: contact.id, name: contact.name, mode: 'voice' }, userId)
      })
    } finally { this.incomingFlights.delete(scope) }
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
