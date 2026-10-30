import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { conversationContinuityContext, conversationSceneBoundary, messageContinuityBoundary, messageHistoryContextLabel, normalizeMessageStoryClock } from '../src/domain/message-continuity.js'
import { ensureDirectConversation, normalizeContactCollections } from '../src/domain/contacts.js'
import { normalizePreferences } from '../src/domain/preferences.js'
import { assemblePocketContext } from '../src/backend/roleplay-context.js'
import { roleplayPhoneRecall } from '../src/backend/roleplay-phone-recall.js'
import { canonicalNarrativeName, narrativeSourceFingerprint, recentNarrativeWindow } from '../src/backend/narrative-retrieval.js'
import { centerMessageInThread, renderMessagesView } from '../src/frontend/apps/messages.js'
import type { MessagesViewHost } from '../src/frontend/apps/messages.js'
import type { PhoneMessage, PhoneState, PocketRelay, PocketRoleplayClockSnapshot } from '../src/types.js'

const oldAt = '2026-10-27T08:17:00Z', now = '2026-10-28T10:52:00Z'
const exact = (roleplayNow: string): PocketRoleplayClockSnapshot => ({ roleplayNow, source: 'narrative', precision: 'exact', label: '' })
function fixture() {
  const collections = normalizeContactCollections({ contacts: [{ id: 'dane', name: 'Dane', source: { kind: 'npc', origin: 'manual' } }] }, { characterId: '_none', characterName: '', now, personaActorId: 'me', makeId: prefix => prefix + '-test' })
  const contact = collections.contacts[0], conversation = ensureDirectConversation(collections, contact.id, oldAt, () => 'thread')
  conversation.messages = [
    { id: 'earlier', sender: 'contact', senderActorId: contact.id, senderContactId: contact.id, senderName: 'Dane', senderAccent: '', text: "Be there in 20, keep my spot warm.", createdAt: oldAt, storyClock: exact(oldAt), read: true, status: 'read' },
    { id: 'current', sender: 'persona', senderActorId: 'me', senderName: 'Noah', senderAccent: '', text: 'I spent the night at a laptop screen.', createdAt: now, storyClock: exact(now), read: true, status: 'sent' },
  ]
  const state = { version: 11, chatId: 'chat', characterId: '_none', characterName: '', pocketPersonaActorId: 'me', pocketPersona: { displayName: 'Noah' },
    roleplayNow: now, roleplayClockSource: 'narrative', roleplayClockPrecision: 'exact', roleplayTimezoneOffsetMinutes: 0,
    ...collections, discoveredActors: [], actorMemories: [], relays: [], references: [], events: [], notes: [], trackers: [], sceneSnapshot: null, weather: { location: 'Home', condition: 'Clear' },
  } as unknown as PhoneState
  return { state, conversation, contact }
}
function consumedRelay(f: ReturnType<typeof fixture>, kind: 'local' | 'arrival' = 'local'): PocketRelay {
  return { id: 'relay', conversationId: f.conversation.id, contactId: f.contact.id, kind, actorState: kind === 'arrival' ? 'arriving' : 'arrived', reason: 'arrived', sourceMessageId: 'earlier',
    conversationTail: { text: 'Keep my spot warm.', recentMessageIds: ['earlier'] }, latestExchange: 'Keep my spot warm.', timelineEventId: '', status: 'consumed', createdAt: oldAt, consumedAt: oldAt,
    continuation: { state: 'completed' },
  } as PocketRelay
}



test('RP recall follows the active card source and excludes other private threads and uncommitted texts', () => {
  const f = fixture()
  f.state.characterId = 'card-dane'; f.state.characterName = 'Dane'
  f.contact.source = { kind: 'character', characterId: 'card-dane' }
  f.conversation.messages.push(
    { ...f.conversation.messages[0], id: 'current-dane', text: 'I am home after our date.' },
    { ...f.conversation.messages[0], id: 'draft-dane', text: 'PROVISIONAL-SECRET', candidateCommitState: 'provisional' },
    { ...f.conversation.messages[0], id: 'failed-dane', text: 'FAILED-TEXT', status: 'failed' },
  )
  f.state.conversations.push({ ...f.conversation, id: 'other-private', participantActorIds: ['other'], participantContactIds: ['other'], messages: [{ ...f.conversation.messages[0], text: 'OTHER-PRIVATE-SECRET' }] })
  const context = roleplayPhoneRecall(f.state)
  expect(context).toContain('POCKET PHONE RECALL — PRIVATE TO Dane')
  expect(context).toContain('I am home after our date.')
  expect(context).toContain('channel already exists')
  expect(context).not.toContain('OTHER-PRIVATE-SECRET')
  expect(context).not.toContain('PROVISIONAL-SECRET')
  expect(context).not.toContain('FAILED-TEXT')
  f.conversation.messages = []
  expect(roleplayPhoneRecall(f.state)).toBe('')
})

test('RP recall respects message-level group audiences and stable cross-app identity links', () => {
  const f = fixture()
  f.state.characterId = 'card-dane'; f.contact.source = { kind: 'character', characterId: 'card-dane' }
  f.conversation.kind = 'group'
  f.conversation.messages = [
    { ...f.conversation.messages[0], id: 'heard', senderActorId: 'other', recipientActorIds: [f.contact.id], text: 'VISIBLE-GROUP-TEXT' },
    { ...f.conversation.messages[0], id: 'not-heard', senderActorId: 'other', recipientActorIds: ['third'], text: 'OTHER-RECIPIENTS-SECRET' },
  ]
  f.state.social = { dmThreads: [
    { id: 'known-social', owner: 'me', app: 'tumblr', account: { id: 'linked', name: 'Dane', cardId: 'card-dane' }, messages: [{ id: 'known', sender: 'account', text: 'OUR-TUMBLR-TEXT' }] },
    { id: 'same-name-social', owner: 'me', app: 'instagram', account: { id: 'stranger', name: 'Dane' }, messages: [{ id: 'stranger', sender: 'account', text: 'STRANGER-TEXT' }] },
  ] } as unknown as NonNullable<PhoneState['social']>
  const context = roleplayPhoneRecall(f.state)
  expect(context).toContain('VISIBLE-GROUP-TEXT')
  expect(context).toContain('OUR-TUMBLR-TEXT')
  expect(context).not.toContain('OTHER-RECIPIENTS-SECRET')
  expect(context).not.toContain('STRANGER-TEXT')
})

test('RP recall stays bounded with escaped text and keeps the newest communication', () => {
  const f = fixture()
  f.state.characterId = 'card-dane'; f.contact.source = { kind: 'character', characterId: 'card-dane' }
  f.conversation.messages = Array.from({ length: 20 }, (_, index) => ({
    ...f.conversation.messages[0], id: String(index), text: index === 19 ? 'LATEST-CANON ' + '"\\'.repeat(2_000) : 'OLD-EXCHANGE '.repeat(100),
  }))
  expect(roleplayPhoneRecall(f.state).length).toBeLessThanOrEqual(3_200)
  expect(roleplayPhoneRecall(f.state)).toContain('LATEST-CANON')
  expect(roleplayPhoneRecall(f.state, 800).length).toBeLessThanOrEqual(800)
})

test('narrative retrieval resolves only unambiguous actor aliases', () => {
  expect(canonicalNarrativeName('Ivan', ['Jock!Ivan', 'Till'])).toBe('Jock!Ivan')
  expect(canonicalNarrativeName('Mina', ['Mina Ashido', 'Mina Park'])).toBe('Mina')
  expect(canonicalNarrativeName('Ann', ['Joanna'])).toBe('Ann')
  expect(canonicalNarrativeName('Shoto', ['Shōto Todoroki'])).toBe('Shōto Todoroki')
  expect(canonicalNarrativeName('Ivan', ['Jock!Ivan', 'Ivan Park'])).toBe('Ivan')
})

test('narrative cache tracks full visible turns without treating hidden reasoning as evidence', () => {
  const opening = 'Earlier setup. '.repeat(500)
  const first = [{ id: 'same-turn', role: 'assistant', content: opening + 'He went HOME.' }]
  const edited = [{ id: 'same-turn', role: 'assistant', content: opening + 'He went AWAY.' }]
  expect(narrativeSourceFingerprint(first)).not.toBe(narrativeSourceFingerprint(edited))
  expect(narrativeSourceFingerprint([{ role: 'assistant', content: '<think>old reasoning</think>Visible scene.' }]))
    .toBe(narrativeSourceFingerprint([{ role: 'assistant', content: '<think>new reasoning</think>Visible scene.' }]))
})

test('retrieval reserves room for the latest long-turn ending within a hard budget', () => {
  const messages = Array.from({ length: 6 }, (_, index) => ({ id: String(index), role: 'assistant', content: ('Long earlier prose ' + index + '. ').repeat(800) + (index === 5 ? 'LATEST-ENDING: He arrived home.' : 'OLD-ENDING') }))
  const result = recentNarrativeWindow(messages)
  expect(result.text.length).toBeLessThanOrEqual(10_400)
  expect(result.text).toContain('LATEST-ENDING: He arrived home.')
  expect(result.text).toContain('LATEST COMMITTED TURN')
  expect(result.messages.at(-1)?.id).toBe('5')
  expect(result.messages.length).toBeLessThanOrEqual(4)
  expect(result.text).not.toContain('Long earlier prose 0.')
})

test('a new story day is explicit even when a direct-message request omits the phone-thread block', async () => {
  const f = fixture(); f.state.relays = [consumedRelay(f)]
  f.state.events = [
    { id: 'done', title: 'Dane came over', completed: true, whenText: 'Yesterday', participantActorIds: ['dane'] },
    { id: 'open', title: 'Tomorrow at the café', completed: false, whenText: 'Tomorrow', participantActorIds: ['dane'] },
  ] as PhoneState['events']
  const result = await assemblePocketContext({ ...f, preferences: normalizePreferences({ roleplayContextMode: 'off' }), includePhoneThread: false, includeRoleplayBackground: false })
  expect(result.text).toContain('CURRENT STORY TIME: 2026-10-28 10:52')
  expect(result.text).toContain('story calendar advanced 1 day')
  expect(result.text).toContain('COMPLETED HANDOFF')
  expect(result.text).toContain('COMPLETED TIMELINE: Dane came over')
  expect(result.text).toContain('OPEN TIMELINE: Tomorrow at the café')
  expect(result.text).toContain('elapsed time alone does not prove completion')
  expect(result.text).toContain('LATEST PHONE MESSAGE (Noah): I spent the night')
  expect(result.text).not.toContain('PHONE THREAD\n')
  expect(messageHistoryContextLabel(f.state, f.conversation.messages[0])).toContain('EARLIER STORY DAY')
  expect(messageHistoryContextLabel(f.state, f.conversation.messages[1])).not.toContain('EARLIER STORY DAY')
})

test('a consumed arrival bridge is not proof of arrival, while current presence wins over an old approach', () => {
  const f = fixture(); f.state.relays = [consumedRelay(f, 'arrival')]; f.conversation.availability = { state: 'arriving' }
  let context = conversationContinuityContext(f.state, f.conversation)
  expect(context).toContain('CONSUMED ARRIVAL BRIDGE')
  expect(context).toContain('this receipt alone does not prove arrival')
  expect(context).toContain('CURRENT CHANNEL: arriving is still recorded')
  expect(context).not.toContain('already here with the phone owner')
  f.contact.presence.inScene = true; f.conversation.availability = { state: 'local', reason: 'arrived' }
  context = conversationContinuityContext(f.state, f.conversation)
  expect(context).toContain('Dane is already here with the phone owner')
  expect(context).toContain('CURRENT CHANNEL: continued in person (arrived)')
  f.state.relays[0].status = 'pending'
  expect(conversationContinuityContext(f.state, f.conversation)).toContain('PENDING ARRIVAL BRIDGE: still pending')
})

test('unknown and approximate clocks never become an invented elapsed day', () => {
  const f = fixture()
  f.state.roleplayClockPrecision = 'unknown'; f.state.roleplayClockLabel = ''
  f.conversation.messages[0].storyClock = { ...exact(oldAt), precision: 'approximate', label: 'Evening' }
  f.conversation.messages[1].storyClock = { ...exact(now), precision: 'unknown' }
  expect(messageContinuityBoundary(f.state, f.conversation.messages[0], f.conversation.messages[1])).toBeUndefined()
  expect(messageContinuityBoundary(f.state, f.conversation.messages[0])).toBeUndefined()
  expect(conversationContinuityContext(f.state, f.conversation)).not.toContain('calendar advanced')
  expect(conversationContinuityContext(f.state, f.conversation)).toContain('do not invent a date or elapsed duration')
  expect(messageHistoryContextLabel(f.state, f.conversation.messages[0])).toContain('Evening (approximate)')
  delete f.conversation.messages[0].storyClock
  expect(messageHistoryContextLabel(f.state, f.conversation.messages[0])).toContain('legacy clock precision not recorded')
  expect(messageContinuityBoundary(f.state, f.conversation.messages[0], f.conversation.messages[1])).toBeUndefined()
})

test('story-day boundaries use the story timezone and do not split an ordinary same-day exchange', () => {
  const f = fixture(); f.state.roleplayTimezoneOffsetMinutes = 180
  const a = { ...f.conversation.messages[0], storyClock: exact('2026-10-28T01:30:00Z') }, b = { ...f.conversation.messages[1], storyClock: exact('2026-10-28T02:30:00Z') }
  expect(messageContinuityBoundary(f.state, a, b)).toBeUndefined()
  b.storyClock = exact('2026-10-28T04:30:00Z')
  expect(messageContinuityBoundary(f.state, a, b)?.label).toBe('Wednesday, October 28')
})

test('message clock precision survives normalization without inventing timestamps for invalid exact clocks', () => {
  const f = fixture()
  const normalized = normalizeContactCollections({ contacts: f.state.contacts, conversations: f.state.conversations }, { characterId: '_none', characterName: '', now, personaActorId: 'me', makeId: prefix => prefix + '-id' })
  expect(normalized.conversations[0].messages[0].storyClock).toEqual(exact(oldAt))
  expect(normalizeMessageStoryClock({ source: 'manual', precision: 'exact', roleplayNow: 'bad' })).toBeUndefined()
  expect(normalizeMessageStoryClock({ source: 'narrative', precision: 'relative', label: 'Evening', roleplayNow: now })?.precision).toBe('relative')
})

test('the thread separates story days and retains current-presence evidence alongside consumed handoff history', () => {
  const f = fixture(), previousDocument = globalThis.document, previousRaf = globalThis.requestAnimationFrame, dom = new JSDOM('<body></body>')
  globalThis.document = dom.window.document
  globalThis.requestAnimationFrame = callback => { callback(0); return 1 }
  const host = new Proxy({ state: f.state, selectedConversationId: f.conversation.id, selectedView: 'thread', deviceOwnerActorId: 'me', readOnlyDevice: false,
    selectedMessageId: '', busyConversations: new Map(), draft: '', generationAvailable: true, manualOverride: false,
    iconButton: (_name: string, label: string) => { const button = document.createElement('button'); button.setAttribute('aria-label', label); return button },
  }, { get: (target, key) => key in target ? (target as any)[key] : () => {} }) as unknown as MessagesViewHost
  try {
    let view = renderMessagesView(host)
    expect(view.querySelectorAll('[role="separator"]')).toHaveLength(1)
    const separator = view.querySelector('[role="separator"]')!
    expect(separator.getAttribute('aria-label')).toContain('Wednesday, October 28')
    expect(separator.previousElementSibling?.getAttribute('data-message-id')).toBe('earlier')
    expect(separator.nextElementSibling?.getAttribute('data-message-id')).toBe('current')
    expect(view.querySelector('[data-message-id="current"]')?.getAttribute('data-burst-continuation')).toBe('false')
    f.state.relays = [consumedRelay(f)]; f.conversation.availability = { state: 'local', reason: 'arrived' }; f.contact.presence.inScene = true
    view = renderMessagesView(host)
    expect(view.querySelector('[data-relay-id="relay"]')?.getAttribute('data-state')).toBe('completed')
    expect(view.querySelector('[data-current-presence="true"]')?.textContent).toBe('Dane is here now.')
    expect(view.querySelector('form')).toBeNull()
  } finally { globalThis.document = previousDocument; globalThis.requestAnimationFrame = previousRaf; dom.window.close() }
})

test('call history uses labelled divider stripes without bubbles, delivery receipts or message controls', () => {
  const previousDocument=globalThis.document,previousRaf=globalThis.requestAnimationFrame,dom=new JSDOM('<body></body>')
  globalThis.document=dom.window.document;globalThis.requestAnimationFrame=callback=>{callback(0);return 1}
  try {
    for(const kind of ['direct','group'] as const) {
      const f=fixture();f.conversation.kind=kind
      for(const [status,text] of [['connected','Call connected · Speakerphone'],['ended','Call ended · Speakerphone · 2:05'],['missed','Missed call']] as const)
        f.conversation.messages.push({...f.conversation.messages[1],id:'call-'+status,sender:'system',senderActorId:undefined,senderName:'Pocket',text,status:'read',call:{callId:'test-call',status,speakerphone:status!=='missed',...(status==='ended'?{durationSeconds:125}:{})}})
      const host=new Proxy({state:f.state,selectedConversationId:f.conversation.id,selectedView:'thread',deviceOwnerActorId:'me',readOnlyDevice:false,selectedMessageId:'call-ended',busyConversations:new Map(),draft:'',generationAvailable:true,manualOverride:false,selectedGroupSpeakerId:'',
        iconButton:(_name:string,label:string)=>{const button=document.createElement('button');button.setAttribute('aria-label',label);return button}
      },{get:(target,key)=>key in target?(target as any)[key]:()=>{}}) as unknown as MessagesViewHost
      const view=renderMessagesView(host),markers=[...view.querySelectorAll<HTMLElement>('.lp-call-history')]
      expect(markers).toHaveLength(3)
      for(const marker of markers) {
        expect(marker.classList.contains('lp-conversation-status')).toBe(true);expect(marker.classList.contains('lp-bubble')).toBe(false)
        expect(marker.getAttribute('role')).toBe('separator');expect(marker.getAttribute('aria-label')).toContain(marker.querySelector('span')!.textContent!)
        expect(marker.querySelector('time')?.dateTime).toBe(now)
        expect(marker.querySelector('button,.lp-bubble-time,.lp-avatar')).toBeNull();expect(marker.closest('.lp-group-message')).toBeNull()
      }
      expect(view.querySelector('[data-message-id="call-ended"]')?.textContent).toContain('2:05')
      expect(view.querySelector('[data-message-id="call-ended"]')?.getAttribute('data-selected')).toBe('true')
    }
  } finally {globalThis.document=previousDocument;globalThis.requestAnimationFrame=previousRaf;dom.window.close()}
})

test('message reveal centers only its own scroller at normal and zoomed handset sizes', () => {
  const dom = new JSDOM('<body><div id="outer"><div id="thread"><div id="target"></div></div></div></body>')
  const outer = dom.window.document.querySelector<HTMLElement>('#outer')!, thread = dom.window.document.querySelector<HTMLElement>('#thread')!, target = dom.window.document.querySelector<HTMLElement>('#target')!
  let ancestorCalls = 0
  target.scrollIntoView = () => { ancestorCalls++ }
  outer.scrollTop = 70
  Object.defineProperties(thread, { clientHeight: { value: 400 }, offsetHeight: { value: 400 }, scrollHeight: { value: 1200 } })
  try {
    for (const scale of [1, 1.5]) {
      thread.scrollTop = 200
      thread.getBoundingClientRect = () => ({ top: 100 * scale, height: 400 * scale }) as DOMRect
      target.getBoundingClientRect = () => ({ top: 250 * scale, height: 80 * scale }) as DOMRect
      centerMessageInThread(thread, target)
      expect(thread.scrollTop).toBe(190)
      expect(outer.scrollTop).toBe(70)
    }
    expect(ancestorCalls).toBe(0)
  } finally { dom.window.close() }
})

test('selected-message highlighting does not repeat navigation scrolling on a refresh or detached frame', () => {
  const f = fixture(), previousDocument = globalThis.document, previousRaf = globalThis.requestAnimationFrame, dom = new JSDOM('<body></body>'), frames: FrameRequestCallback[] = []
  globalThis.document = dom.window.document
  globalThis.requestAnimationFrame = callback => { frames.push(callback); return frames.length }
  const base = { state: f.state, selectedConversationId: f.conversation.id, selectedView: 'thread', deviceOwnerActorId: 'me', readOnlyDevice: false,
    selectedMessageId: 'earlier', busyConversations: new Map(), draft: '', generationAvailable: true, manualOverride: false,
    iconButton: (_name: string, label: string) => { const button = document.createElement('button'); button.setAttribute('aria-label', label); return button },
  }
  const host = (scrollToMessageId: string) => new Proxy({ ...base, scrollToMessageId, preserveThreadScroll: true }, { get: (target, key) => key in target ? (target as any)[key] : () => {} }) as unknown as MessagesViewHost
  const metrics = (view: HTMLElement, top: number) => {
    const thread = view.querySelector<HTMLElement>('[data-pocket-thread]')!, target = view.querySelector<HTMLElement>('[data-message-id="earlier"]')!
    Object.defineProperties(thread, { clientHeight: { value: 400 }, offsetHeight: { value: 400 }, scrollHeight: { value: 1200 } })
    thread.scrollTop = top
    thread.getBoundingClientRect = () => ({ top: 100, height: 400 }) as DOMRect
    target.getBoundingClientRect = () => ({ top: 250, height: 80 }) as DOMRect
    target.scrollIntoView = () => { throw new Error('Message navigation must not scroll an ancestor') }
    return thread
  }
  const flush = () => { for (const callback of frames.splice(0)) callback(0) }
  try {
    const first = renderMessagesView(host('earlier')); document.body.append(first)
    const initial = metrics(first, 200); flush()
    expect(initial.scrollTop).toBe(190)
    const refreshed = renderMessagesView(host('')); first.replaceWith(refreshed)
    const retained = metrics(refreshed, 275); flush()
    expect(retained.scrollTop).toBe(275)
    expect(refreshed.querySelector('[data-message-id="earlier"]')?.getAttribute('data-selected')).toBe('true')
    const detached = renderMessagesView(host('earlier')), stale = metrics(detached, 88)
    flush(); expect(stale.scrollTop).toBe(88)
  } finally { globalThis.document = previousDocument; globalThis.requestAnimationFrame = previousRaf; dom.window.close() }
})

test('oversized conversation state stays compact while retaining every current-state category', () => {
  const f = fixture(), repeat = 'Very long historical detail. '.repeat(300)
  f.state.contacts = Array.from({ length: 80 }, (_, index) => ({ ...f.contact, id: `member-${index}`, name: `Present actor ${index} ${repeat}`, presence: { inScene: true, lastSceneAt: now } }))
  f.conversation.kind = 'group'; f.conversation.participantActorIds = f.state.contacts.map(contact => contact.id)
  f.conversation.participantContactIds = [...f.conversation.participantActorIds]
  f.conversation.availability = { state: 'local', reason: 'continued_in_person' }
  f.conversation.messages[1].senderName = 'Current sender ' + repeat
  f.conversation.messages[1].text = 'LATEST_CURRENT_MESSAGE ' + repeat
  const done = consumedRelay(f), pending = { ...consumedRelay(f, 'arrival'), id: 'pending', status: 'pending' as const }
  f.state.relays = [...Array.from({ length: 100 }, (_, index) => ({ ...done, id: `old-relay-${index}` })), done, pending]
  f.state.events = Array.from({ length: 100 }, (_, index) => ({ id: `old-${index}`, title: `OLD_PLAN_${index} ${repeat}`, whenText: repeat, completed: index % 2 === 0, source: { app: 'messages', conversationId: f.conversation.id } })) as PhoneState['events']
  f.state.events.push(
    { ...f.state.events[0], id: 'latest-done', title: 'LATEST_COMPLETED_PLAN ' + repeat, completed: true },
    { ...f.state.events[1], id: 'latest-open', title: 'LATEST_OPEN_PLAN ' + repeat, completed: false },
  )
  for (const legacy of [false, true]) {
    f.conversation.messages[0].storyClock = legacy ? undefined : exact(oldAt)
    const summary = conversationContinuityContext(f.state, f.conversation)
    expect(summary.length).toBeLessThanOrEqual(2400)
    expect(summary).toContain('CURRENT STORY TIME: 2026-10-28 10:52')
    expect(summary).toContain('CURRENT PRESENCE: Present actor')
    expect(summary).toContain('CURRENT CHANNEL: continued in person')
    expect(summary).toContain('LATEST_CURRENT_MESSAGE')
    expect(summary).toContain('COMPLETED HANDOFF')
    expect(summary).toContain('PENDING ARRIVAL BRIDGE')
    expect(summary).toContain('COMPLETED TIMELINE: LATEST_COMPLETED_PLAN')
    expect(summary).toContain('OPEN TIMELINE: LATEST_OPEN_PLAN')
    expect(summary).toContain('elapsed time alone does not prove completion')
    expect(summary).toContain('Only recorded consumed/completed/presence evidence resolves an action')
    expect(summary).not.toContain('OLD_PLAN_')
  }
})


test('echoed DM routing and clock metadata are removed without deleting normal dialogue', async () => {
  const { cleanPhoneMessageText } = await import('../src/backend/narrative-content.js')
  expect(cleanPhoneMessageText('[DM TURN: Jock!Ivan → Till]\nSaved story timestamp: 2026-10-27 09:05 (legacy clock\nprecision not recorded)\nhey, are you awake?')).toBe('hey, are you awake?')
  expect(cleanPhoneMessageText('Story time: 2026-10-29 10:00\nhello there')).toBe('hello there')
  expect(cleanPhoneMessageText('I said Story time: is my favorite phrase.')).toBe('I said Story time: is my favorite phrase.')
})

test('same-clock event handoffs fence planning history and distinguish started from completed scenes', async () => {
  const f = fixture()
  for (const message of f.conversation.messages) { message.createdAt = now; message.storyClock = exact(now) }
  f.conversation.messages[0].text = 'I will be there at 5:15 by the green awning.'
  f.conversation.messages[1].text = 'See you Thursday at five thirty, then.'
  f.state.events = [{ id: 'coffee', title: 'Coffee together', description: 'At the cafe', whenText: 'Thursday at 5:30', startedAt: now, completed: false,
    source: { app: 'messages', conversationId: f.conversation.id },
    phoneHistoryBoundary: { conversationId: f.conversation.id, messageIds: ['earlier', 'current'] },
  }] as PhoneState['events']
  expect(messageContinuityBoundary(f.state, f.conversation.messages[0], f.conversation.messages[1])).toBeUndefined()
  expect(conversationSceneBoundary(f.state, f.conversation)?.index).toBe(1)
  let summary = conversationContinuityContext(f.state, f.conversation)
  expect(summary).toContain('STARTED TIMELINE: Coffee together'); expect(summary).not.toContain('OPEN TIMELINE: Coffee together')
  expect(summary).toContain('No new human phone message'); expect(summary).toContain('Do not resume or clarify old ETAs')
  expect(summary).not.toContain('LATEST PHONE MESSAGE')
  expect(messageHistoryContextLabel(f.state, f.conversation.messages[0], f.conversation)).toContain('BEFORE ROLEPLAY EVENT')
  const message: PhoneMessage = { ...f.conversation.messages[1], id: 'after-scene', text: 'I had a good time. Did you make it home?' }
  f.conversation.messages.push(message); f.state.events[0].completed = true
  summary = conversationContinuityContext(f.state, f.conversation)
  expect(summary).toContain('COMPLETED TIMELINE: Coffee together'); expect(summary).not.toContain('STARTED TIMELINE: Coffee together')
  expect(summary).toContain('LATEST PHONE MESSAGE (Noah): I had a good time')
  expect(messageHistoryContextLabel(f.state, message, f.conversation)).not.toContain('BEFORE ROLEPLAY EVENT')
  const assembled = await assemblePocketContext({ ...f, preferences: normalizePreferences({ roleplayContextMode: 'off' }), includePhoneThread: false, includeRoleplayBackground: false })
  expect(assembled.text).toContain('EVENT PHONE BOUNDARY'); expect(assembled.text).toContain('COMPLETED TIMELINE: Coffee together')
  const other = { ...f.conversation, id: 'another-thread' }
  expect(conversationSceneBoundary(f.state, other)).toBeUndefined()
  f.conversation.messages.splice(1, 1)
  expect(conversationSceneBoundary(f.state, f.conversation)?.index).toBe(0)
})

test('same-day event separation appears once at the saved message boundary and survives rerender', () => {
  const f = fixture(), previousDocument = globalThis.document, previousRaf = globalThis.requestAnimationFrame, dom = new JSDOM('<body></body>')
  globalThis.document = dom.window.document; globalThis.requestAnimationFrame = callback => { callback(0); return 1 }
  for (const message of f.conversation.messages) { message.createdAt = now; message.storyClock = exact(now) }
  f.state.events = [{ id: 'coffee', title: 'Coffee together', startedAt: now, completed: true,
    phoneHistoryBoundary: { conversationId: f.conversation.id, messageIds: ['earlier'] },
  }] as PhoneState['events']
  const host = new Proxy({ state: f.state, selectedConversationId: f.conversation.id, selectedView: 'thread', deviceOwnerActorId: 'me', readOnlyDevice: false,
    selectedMessageId: '', busyConversations: new Map(), draft: '', generationAvailable: true, manualOverride: false,
    iconButton: (_name: string, label: string) => { const button = document.createElement('button'); button.setAttribute('aria-label', label); return button },
  }, { get: (target, key) => key in target ? (target as any)[key] : () => {} }) as unknown as MessagesViewHost
  try {
    for (let count = 0; count < 2; count++) {
      const view = renderMessagesView(host), separators = view.querySelectorAll('[data-event-boundary="coffee"]')
      expect(separators).toHaveLength(1)
      expect(separators[0].getAttribute('role')).toBe('separator'); expect(separators[0].getAttribute('aria-label')).toContain('This event has been completed')
      expect(separators[0].previousElementSibling?.getAttribute('data-message-id')).toBe('earlier')
      expect(separators[0].nextElementSibling?.getAttribute('data-message-id')).toBe('current')
      expect(view.querySelector('[data-message-id="current"]')?.getAttribute('data-burst-continuation')).toBe('false')
    }
  } finally { globalThis.document = previousDocument; globalThis.requestAnimationFrame = previousRaf; dom.window.close() }
})
