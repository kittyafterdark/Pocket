import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { PocketCalls, normalizeCallReply, type CallHost } from '../src/backend/calls.js'
import { normalizeContactCollections, ensureDirectConversation } from '../src/domain/contacts.js'
import { actorAsGenerationContact } from '../src/domain/actors.js'
import { serializePocketReference } from '../src/backend/references.js'
import type { PhoneState, PocketActivity } from '../src/types.js'
import { VoiceMessagePlayer } from '../src/frontend/components/voice-message.js'
import { LiveCallUi } from '../src/frontend/components/live-call.js'
import { defaultPreferences } from '../src/domain/preferences.js'
import { buildPhoneScreen } from '../src/frontend/phone-screen.js'
import { refreshActivityConnectors } from '../src/frontend/components/activity-connectors.js'

const now = '2026-10-14T18:00:00.000Z'
function fixture(expressions: Record<string, string> = {}, expressionGroups: Record<string, Record<string, string>> = {}) {
  let sequence = 0
  const makeId = (prefix: string) => `${prefix}_${++sequence}`
  const collections = normalizeContactCollections({ contacts: [{ id: 'alice', name: 'Alice', source: { kind: 'character', characterId: 'alice-card' } }] }, { characterId: 'narrator', characterName: 'Narrator', now, makeId, personaActorId: 'persona' })
  const conversation = ensureDirectConversation(collections, 'alice', now, makeId)
  let state = { version: 11, chatId: 'chat', characterId: 'narrator', roleplayNow: now, ...collections, discoveredActors: [], pocketPersonaActorId: 'persona', pocketPersona: { displayName: 'Player', accent: '#fff' }, references: [], actorMemories: [] } as unknown as PhoneState
  const sent: any[] = [], prompts: Array<Array<{ role: string; content: string }>> = []
  let generate: CallHost['generate'] = async (_id, messages) => { prompts.push(messages); return { message: 'Hello there.', expression: 'happy', choices: ['Hello!', 'How are you?'] } }
  let lock = Promise.resolve()
  const host: CallHost = {
    load: async () => structuredClone(state), save: async value => { state = structuredClone(value) },
    lock: (_chatId, _characterId, action) => { const next = lock.catch(() => {}).then(action); lock = next.then(() => {}, () => {}); return next },
    publish: async () => {}, send: payload => sent.push(payload), id: makeId, timestamp: () => now,
    contact: actor => actorAsGenerationContact(actor, now), profile: async contact => ({ name: contact.name, description: 'A patient friend.', personality: 'Kind.', behavior: '' }),
    character: async () => ({ extensions: { expressions: { mappings: expressions }, expression_groups: expressionGroups } }), background: async () => 'The player is at home.',
    generate: (...args) => generate(...args), remember: () => {},
  }
  const calls = new PocketCalls(host), input = { chatId: 'chat', characterId: 'narrator', conversationId: conversation.id, deviceOwnerActorId: 'persona', requestId: 'start', mode: 'video' }
  return { calls, input, sent, prompts, state: () => state, generation: (next: CallHost['generate']) => { generate = next }, callId: () => sent.find(row => row.type === 'lumiphone:call_ready')?.callId }
}

test('video requires the linked card’s expression pack and uses only its labels', async () => {
  const video = fixture({ neutral: 'image-neutral', happy: 'image-happy' })
  await video.calls.handle('lumiphone:call_start', video.input, 'user')
  expect(video.sent.find(row => row.type === 'lumiphone:call_ready')).toMatchObject({ video: true, expressions: { happy: '/api/v1/images/image-happy' } })
  expect(video.prompts[0][0].content).toContain('Video is working')
  expect(video.state().conversations[0].messages.at(-1)?.callTurn).toMatchObject({ expression: 'happy' })
  expect(normalizeCallReply({ message: 'Safe text', expression: 'https://evil', choices: ['x', 'x', 42] }, { neutral: 'image' })).toEqual({ text: 'Safe text', expression: 'neutral', choices: ['x'], end: false })
  const audio = fixture()
  await audio.calls.handle('lumiphone:call_start', audio.input)
  expect(audio.sent.find(row => row.type === 'lumiphone:call_ready').video).toBe(false)
  expect(audio.prompts[0][0].content).toContain('invent a short believable in-character reason')
})

test('video supports grouped expression packs with unambiguous character labels', async () => {
  const f = fixture({}, { Alice: { neutral: 'alice-neutral' }, Bob: { happy: 'bob-happy' } })
  f.generation(async (_id, messages) => { f.prompts.push(messages); return { message: 'Hello from Bob.', expression: 'Bob: happy', choices: ['Hello Bob!'] } })
  await f.calls.handle('lumiphone:call_start', f.input)
  expect(f.sent.find(row => row.type === 'lumiphone:call_ready')).toMatchObject({ video: true, expressions: { 'Alice: neutral': '/api/v1/images/alice-neutral', 'Bob: happy': '/api/v1/images/bob-happy' } })
  expect(f.prompts[0][0].content).toContain('Alice: neutral, Bob: happy')
  expect(f.state().conversations[0].messages.at(-1)?.callTurn?.expression).toBe('Bob: happy')
})

test('call turns persist as spoken dialogue and arm a bounded RP reference without creating user speech from choices', async () => {
  const f = fixture()
  await f.calls.handle('lumiphone:call_start', { ...f.input, mode: 'voice' })
  expect(f.state().conversations[0].messages.filter(row => row.sender === 'persona' && row.callTurn)).toHaveLength(0)
  await f.calls.handle('lumiphone:call_reply', { ...f.input, requestId: 'reply-1', callId: f.callId(), text: 'I am glad you called.' })
  const reference = f.state().references[0]
  expect(reference.status).toBe('armed')
  const serialized = serializePocketReference(reference)
  expect(serialized).toContain('Spoken phone call transcript')
  expect(serialized).toContain('Call state: connected')
  expect(serialized).toContain(`Call ID: ${f.callId()}`)
  expect(serialized).toContain('I am glad you called.')
  expect(serialized).toContain('does not hand off')
  expect(serialized.length).toBeLessThanOrEqual(2200)
  await f.calls.handle('lumiphone:call_end', { ...f.input, callId: f.callId() })
  expect(f.state().conversations[0].messages.at(-1)?.call?.status).toBe('ended')
  expect(serializePocketReference(f.state().references[0])).toContain('Call state: ended')
  expect(serializePocketReference(f.state().references[0])).toContain('do not recreate its end action')
  await expect(f.calls.handle('lumiphone:call_reply', { ...f.input, requestId: 'late', callId: f.callId(), text: 'Late' })).rejects.toThrow('has ended')
})

test('ending during generation suppresses late answers while preserving already spoken words', async () => {
  const f = fixture()
  await f.calls.handle('lumiphone:call_start', f.input)
  let deliver!: (value: unknown) => void, reached!: () => void
  const started = new Promise<void>(resolve => { reached = resolve })
  f.generation(async () => { reached(); return new Promise(resolve => { deliver = resolve }) })
  const pending = f.calls.handle('lumiphone:call_reply', { ...f.input, callId: f.callId(), requestId: 'slow', text: 'Can you hear me?' })
  const outcome = pending.catch(error => error)
  await started
  await f.calls.handle('lumiphone:call_end', { ...f.input, callId: f.callId() })
  deliver({ message: 'This stale response must never arrive.' })
  expect((await outcome).name).toBe('AbortError')
  const messages = f.state().conversations[0].messages
  expect(messages.some(row => row.text === 'Can you hear me?')).toBe(true)
  expect(messages.some(row => row.text.includes('stale response'))).toBe(false)
  expect(messages.at(-1)?.call?.status).toBe('ended')
})

test('retries deduplicate completed turns and resume uses persisted history without another generation', async () => {
  const f = fixture()
  await f.calls.handle('lumiphone:call_start', f.input)
  const request = { ...f.input, callId: f.callId(), requestId: 'reply', text: 'Hello again.' }
  await f.calls.handle('lumiphone:call_reply', request)
  const count = f.state().conversations[0].messages.length
  await f.calls.handle('lumiphone:call_reply', request)
  expect(f.state().conversations[0].messages).toHaveLength(count)
  expect(f.prompts).toHaveLength(2)
  await f.calls.handle('lumiphone:call_resume', { ...f.input, callId: f.callId(), requestId: 'resume' })
  expect(f.prompts).toHaveLength(2)
  expect(f.sent.at(-1).turns).toHaveLength(3)
  const normalized = normalizeContactCollections(f.state(), { characterId: 'narrator', characterName: 'Narrator', now, makeId: prefix => prefix, personaActorId: 'persona' })
  expect(normalized.conversations[0].messages.at(-1)?.callTurn?.choices).toEqual(['Hello!', 'How are you?'])
})

test('inspection and group calls fail before generating or changing state', async () => {
  const f = fixture()
  await expect(f.calls.handle('lumiphone:call_start', { ...f.input, deviceOwnerActorId: 'alice' })).rejects.toThrow('inspecting')
  f.state().conversations[0].kind = 'group'
  await expect(f.calls.handle('lumiphone:call_start', f.input)).rejects.toThrow('direct conversation')
  expect(f.prompts).toHaveLength(0)
  expect(f.state().conversations[0].messages).toHaveLength(0)
})

async function domFixture(run: (dom: JSDOM) => Promise<void>) {
  const dom = new JSDOM('<body><main></main></body>', { url: 'http://localhost/' })
  const bindings = { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Event: dom.window.Event }
  const saved = new Map(Object.keys(bindings).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  Object.entries(bindings).forEach(([key, value]) => Object.defineProperty(globalThis, key, { value, writable: true, configurable: true }))
  try { await run(dom) } finally { for (const [key, value] of saved) { if (value) Object.defineProperty(globalThis, key, value); else delete (globalThis as any)[key] }; dom.window.close() }
}
test('call controls offer VN, typed and STT replies; microphone results need review and late results are discarded', async () => domFixture(async dom => {
  const sent: any[] = [], spoken: any[] = []; let resolveSpeech!: (value: { text: string }) => void, cancelled = false
  Object.assign(dom.window, { speechSynthesis: { getVoices: () => [], speak: (value: any) => spoken.push(value), cancel() {} }, SpeechSynthesisUtterance: class { constructor(public text: string) {} } })
  const ui = new LiveCallUi({ root: dom.window.document.querySelector('main')!, preferences: defaultPreferences, player: new VoiceMessagePlayer(), roleplay() {},
    send: (type, payload) => { const requestId = `r${sent.length}`; sent.push({ type, ...payload, requestId }); return requestId },
    speech: { start: () => ({ ready: Promise.resolve(), result: new Promise(resolve => { resolveSpeech = resolve }), stop: async () => {}, cancel: () => { cancelled = true } }) } })
  ui.start({ chatId: 'chat', characterId: 'card', conversationId: 'dm', deviceOwnerActorId: 'persona' }, 'video')
  ui.receive({ type: 'lumiphone:call_ready', requestId: 'r0', chatId: 'chat', characterId: 'card', callId: 'call', name: 'Alice', video: true, expressions: { happy: '/api/v1/images/happy' }, turns: [] })
  const message: any = { id: 'turn', text: 'Hello!', senderName: 'Alice', callTurn: { callId: 'call', expression: 'happy', choices: ['Hi!'] } }
  ui.receive({ type: 'lumiphone:call_turn', requestId: 'r0', callId: 'call', message })
  await Promise.resolve()
  expect(spoken[0].text).toBe('Hello!')
  expect(dom.window.document.querySelector('.lp-call-caption')?.textContent).toBe('Hello!')
  const selector = dom.window.document.querySelector('select')!
  expect([...selector.options].map(row => row.value)).toEqual(['vn', 'type', 'stt'])
  selector.value = 'stt'; selector.dispatchEvent(new dom.window.Event('change'))
  const record = [...dom.window.document.querySelectorAll('button')].find(row => row.textContent === 'Start microphone')!
  record.click(); resolveSpeech({ text: 'My speech' }); await new Promise(resolve => setTimeout(resolve, 0))
  expect(dom.window.document.querySelector('textarea')?.value).toBe('My speech')
  expect(sent).toHaveLength(1)
  record.click(); ui.close(); resolveSpeech({ text: 'late' }); await Promise.resolve()
  expect(cancelled).toBe(true); expect(dom.window.document.querySelector('[role=dialog]')).toBeNull()
  expect(sent.at(-1).type).toBe('lumiphone:call_end')
}))

test('inline phone and merged cards mount real voice controls without nested buttons or automatic playback', async () => domFixture(async dom => {
  let plays = 0
  Object.assign(dom.window, { speechSynthesis: { getVoices: () => [], speak: () => { plays++ }, cancel() {} }, SpeechSynthesisUtterance: class { constructor(public text: string) {} } })
  const player = new VoiceMessagePlayer(), activity: PocketActivity = { id: 'a', kind: 'message', title: 'Alice', summary: 'Hello inline', scope: { chatId: 'chat', characterId: 'card' }, route: { app: 'messages', conversationId: 'dm', messageId: 'voice' }, createdAt: now,
    presentation: { kind: 'sent', senderName: 'Alice', format: 'voice' } }
  const options = { appearance: 'phone' as const, renderVoiceMessage: (message: any) => player.render(message) }
  const phone = buildPhoneScreen(activity, () => {}, options)!
  dom.window.document.body.append(phone)
  expect(plays).toBe(0); expect(phone.querySelector('button button')).toBeNull()
  phone.querySelector<HTMLButtonElement>('.lp-voice-play')!.click(); expect(plays).toBe(1)
  const host = dom.window.document.createElement('div'); dom.window.document.body.append(host)
  refreshActivityConnectors([{ host, activity, options, owner: 'persona' }], () => {})
  expect(host.querySelector('pocket-inline-ui')?.shadowRoot?.querySelector('.lp-voice-play')).toBeTruthy()
  expect(host.querySelector('pocket-inline-ui')?.shadowRoot?.querySelector('button button')).toBeNull()
  player.stop()
}))
