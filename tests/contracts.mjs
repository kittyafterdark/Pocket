import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('spindle.json', root), 'utf8'))
const backendSource = await readFile(new URL('src/backend.ts', root), 'utf8')
const frontendSource = await readFile(new URL('src/frontend.ts', root), 'utf8')
const controllerSource = await readFile(new URL('src/frontend/controller.ts', root), 'utf8')
const surfaceSource = await readFile(new URL('src/frontend/surface.ts', root), 'utf8')
const stylesSource = await readFile(new URL('src/styles.ts', root), 'utf8')

assert.equal(manifest.identifier, 'lumiphone')
assert.equal(manifest.name, 'Pocket')
assert.equal(manifest.entry_backend, 'dist/backend.js')
assert.equal(manifest.entry_frontend, 'dist/frontend.js')
for (const permission of ['generation', 'interceptor', 'tools', 'chats', 'chat_mutation', 'characters', 'images', 'image_gen', 'ui_panels']) {
  assert.ok(manifest.permissions.includes(permission), `missing ${permission} permission`)
}

for (const token of ['phone_action', 'lumi-phone', 'registerInterceptor', 'resolveSwarmProfile', 'generateStream', 'owner_chat_id', 'PocketActivity', 'materializeTracker', 'syncSceneContacts', 'resolveContactProfile']) {
  assert.ok(backendSource.includes(token), `backend contract missing ${token}`)
}
for (const token of ['createFloatWidget', 'requestDockPanel', 'setFullscreen', 'registerTagInterceptor', 'registerInputBarAction', 'spindle:desktop-widget-returned', 'handsetScale', 'activityReceipt', 'renderContactsView']) {
  assert.ok(`${frontendSource}\n${controllerSource}\n${surfaceSource}`.includes(token), `frontend contract missing ${token}`)
}
for (const token of ['.lp-thread', '.lp-camera', '.lp-timeline', '.lp-progress', '@media (max-width: 720px)']) {
  assert.ok(stylesSource.includes(token), `style contract missing ${token}`)
}
assert.doesNotMatch(backendSource, /\beval\s*\(|new\s+Function\s*\(/)
assert.doesNotMatch(frontendSource, /innerHTML\s*=\s*(?:payload|state|message|note|event|tracker)/)
assert.doesNotMatch(controllerSource, /innerHTML\s*=\s*(?:payload|state|message|note|event|tracker)/)

const storage = new Map()
const frontendMessages = []
const backendEvents = new Map()
let frontendHandler = null
let interceptorHandler = null
let registeredTool = null
const quietRequests = []

const permissions = new Set(manifest.permissions)
storage.set('phones/chat-a__char-a.json', {
  version: 0,
  chatId: 'wrong-scope-is-ignored',
  characterId: 'wrong-character-is-ignored',
  settings: { handsetScale: 1.15, accent: '#abcdef', bezelColor: '#010203', wallpaper: 'url(javascript:bad)' },
  notes: [null, { title: 'Migrated note', body: 'Still safe.', pinned: true }],
  trackers: [{ id: 'legacy-meter', label: 'Affinity', value: 42, min: 0, max: 100, unit: '%', ratePerHour: 2, lastUpdated: '2026-01-01T00:00:00.000Z' }],
})
globalThis.spindle = {
  permissions: {
    has: (name) => permissions.has(name),
    onChanged: () => () => {},
  },
  frontendCapabilities: { declare: () => () => {} },
  onFrontendMessage: (handler) => { frontendHandler = handler; return () => {} },
  sendToFrontend: (payload) => frontendMessages.push(payload),
  registerTool: (tool) => { registeredTool = tool },
  unregisterTool: () => {},
  registerInterceptor: (handler) => { interceptorHandler = handler; return () => {} },
  on: (name, handler) => { backendEvents.set(name, handler); return () => {} },
  log: { info: () => {}, warn: () => {}, error: () => {} },
  userStorage: {
    getJson: async (path, options) => storage.has(path) ? structuredClone(storage.get(path)) : structuredClone(options?.fallback),
    setJson: async (path, value) => storage.set(path, structuredClone(value)),
    list: async (prefix = '') => [...storage.keys()].filter((path) => path.startsWith(prefix)),
    delete: async (path) => { storage.delete(path) },
  },
  characters: {
    get: async (id) => id === 'missing-character' ? null : ({ id, name: id === 'char-b' ? 'Bob' : 'Alice', description: 'A curious traveler.', personality: 'Warm and observant.' }),
    list: async () => ({ data: [{ id: 'char-a', name: 'Alice', description: 'A curious traveler.' }, { id: 'char-b', name: 'Bob', description: 'A careful scout.' }], total: 2 }),
  },
  chats: {
    getActive: async () => ({ id: 'chat-a', character_id: 'char-a' }),
    get: async () => ({ id: 'chat-a', character_id: 'char-a' }),
  },
  chat: { getMessages: async () => [{ role: 'user', content: 'At the market.' }, { role: 'assistant', content: 'Mira, the flower seller, waves from her stall.' }] },
  council: {
    getMembers: async () => [{ memberId: 'member-luna', itemId: 'item-luna', name: 'Luna', role: 'Dream director', avatarUrl: '', definition: 'A lunar dream guide.', personality: 'Gentle', behavior: 'Poetic' }],
    getAvailableLumiaItems: async () => [],
  },
  macros: {
    resolve: async (template) => ({
      text: template
        .replace('{{char_base}}', 'silver hair, violet eyes')
        .replace('{{persona_base}}', 'red coat')
        .replace('{{swarm_negative}}', 'blurry')
        .replace('{{swarm_preset}}', '<preset:cinematic>')
        .replace('{{swarm_checkpoint}}', 'illustrious')
        .replace('{{swarm_aspect}}', '4:3'),
      diagnostics: [],
    }),
  },
  generate: { quiet: async (request) => { quietRequests.push(request); return { content: 'Meet me by the station.', finish_reason: 'stop' } } },
  connections: {
    list: async () => [
      { id: 'rp-default', name: 'Roleplay Default', provider: 'openai', model: 'test-model', is_default: true, has_api_key: true },
      { id: 'pocket-sidecar', name: 'Pocket Sidecar', provider: 'openrouter', model: 'sidecar-model', is_default: false, has_api_key: true },
    ],
    get: async (id) => id === 'rp-default' ? { id, name: 'Roleplay Default', provider: 'openai', model: 'test-model', is_default: true, has_api_key: true } : null,
  },
  images: { list: async () => ({ data: [], total: 0 }) },
  imageGen: {
    listConnections: async () => [],
    getProviders: async () => [],
    generate: async () => ({ imageId: 'image-a', imageUrl: '/api/v1/image-gen/results/image-a' }),
  },
  push: { getStatus: async () => ({ available: false, subscriptionCount: 0 }), send: async () => ({ sent: 0 }) },
}

await import(`${new URL('dist/backend.js', root).href}?backend-contract=${Date.now()}`)
assert.equal(typeof frontendHandler, 'function')
assert.equal(registeredTool?.name, 'phone_action')
assert.equal(typeof interceptorHandler, 'function')

await frontendHandler({ type: 'lumiphone:get_state', requestId: 'state-1', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
const firstState = frontendMessages.find((message) => message.type === 'lumiphone:state')
assert.equal(firstState.state.chatId, 'chat-a')
assert.equal(firstState.state.characterId, 'char-a')
assert.equal(firstState.state.characterName, 'Alice')
assert.equal(firstState.state.version, 3)
assert.equal(firstState.state.contacts[0].source.kind, 'character')
assert.equal(firstState.state.conversations.length, 1)
assert.equal(firstState.state.trackers[0].kind, 'meter')
assert.equal(firstState.state.trackers[0].clock, 'real')
assert.equal(firstState.state.trackers[0].target.type, 'custom')
assert.equal(firstState.state.settings, undefined)
assert.equal(firstState.preferences.handsetScale, 1.15)
assert.ok(storage.has('device/preferences.json'))
assert.equal(storage.get('phones/chat-a__char-a.json').settings, undefined)
assert.equal(storage.get('phones/chat-a__char-a.json').chatId, 'chat-a')
assert.equal(firstState.swarmProfile.source, 'swarm_studio')

await frontendHandler({
  type: 'lumiphone:action', requestId: 'message-1', chatId: 'chat-a', characterId: 'char-a',
  action: 'message', payload: { text: 'Hello from the phone.', sender: 'user' },
}, 'user-a')
const latestState = frontendMessages.filter((message) => message.type === 'lumiphone:state').at(-1).state
assert.equal(latestState.conversations[0].messages.at(-1).text, 'Hello from the phone.')
assert.equal(latestState.conversations[0].messages.at(-1).sender, 'persona')
assert.equal(latestState.notifications.length, 0, 'user send must not notify the sender')

const firstConversationId = latestState.conversations[0].id
await frontendHandler({ type: 'lumiphone:view_state', requestId: 'view-thread', chatId: 'chat-a', characterId: 'char-a', open: true, route: { app: 'messages', conversationId: firstConversationId } }, 'user-a')
const visibleNotificationsBefore = storage.get('phones/chat-a__char-a.json').notifications.length
await backendEvents.get('TOOL_INVOCATION')({
  toolName: 'phone_action', requestId: 'visible-incoming', args: {
    action: 'message', chat_id: 'chat-a', character_id: 'char-a', payload: { conversationId: firstConversationId, text: 'Visible incoming', senderContactId: 'char-a' },
  },
}, 'user-a')
let notificationState = storage.get('phones/chat-a__char-a.json')
assert.equal(notificationState.notifications.length, visibleNotificationsBefore, 'exact visible destination must suppress notification')
assert.equal(notificationState.conversations.find((entry) => entry.id === firstConversationId).messages.at(-1).status, 'read')

await frontendHandler({ type: 'lumiphone:view_state', requestId: 'view-home', chatId: 'chat-a', characterId: 'char-a', open: true, route: { app: 'home' } }, 'user-a')
await backendEvents.get('TOOL_INVOCATION')({
  toolName: 'phone_action', requestId: 'elsewhere-incoming', args: {
    action: 'message', chat_id: 'chat-a', character_id: 'char-a', payload: { conversationId: firstConversationId, text: 'Elsewhere incoming', senderContactId: 'char-a' },
  },
}, 'user-a')
notificationState = storage.get('phones/chat-a__char-a.json')
const elsewhereNotification = notificationState.notifications.find((entry) => entry.body === 'Elsewhere incoming')
assert.equal(elsewhereNotification.route.conversationId, firstConversationId, 'notification must retain a typed deep link')
const messageCountBeforeDismiss = notificationState.conversations.find((entry) => entry.id === firstConversationId).messages.length
await frontendHandler({ type: 'lumiphone:notification_dismiss', requestId: 'dismiss-incoming', chatId: 'chat-a', characterId: 'char-a', notificationId: elsewhereNotification.id }, 'user-a')
notificationState = storage.get('phones/chat-a__char-a.json')
assert.equal(notificationState.conversations.find((entry) => entry.id === firstConversationId).messages.length, messageCountBeforeDismiss, 'dismiss must not delete its message')
assert.ok(notificationState.notifications.find((entry) => entry.id === elsewhereNotification.id).dismissedAt)

await frontendHandler({ type: 'lumiphone:save_preferences', requestId: 'auto-reply-on', chatId: 'chat-a', characterId: 'char-a', preferences: { autoReplyAfterSend: true, generationMode: 'roleplay' } }, 'user-a')
const autoQuiet = spindle.generate.quiet
let autoDecisionCalls = 0
spindle.generate.quiet = async () => { autoDecisionCalls += 1; return { content: '{"reply":false}' } }
let autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
const beforeFalseDecision = autoConversation.messages.length
await frontendHandler({ type: 'lumiphone:action', requestId: 'auto-false-send', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'No response needed', sender: 'persona' } }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 40))
autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
assert.equal(autoDecisionCalls, 1, 'false decision must perform only the bounded decision call')
assert.equal(autoConversation.messages.length, beforeFalseDecision + 1, 'false decision must not generate a reply')

autoDecisionCalls = 0
spindle.generate.quiet = async () => {
  autoDecisionCalls += 1
  return autoDecisionCalls === 1 ? { content: '{"reply":true}' } : { content: 'I can reply now.' }
}
const beforeTrueDecision = autoConversation.messages.length
await frontendHandler({ type: 'lumiphone:action', requestId: 'auto-true-send', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'Please reply', sender: 'persona' } }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 60))
autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
assert.equal(autoDecisionCalls, 2, 'true decision must trigger exactly one separate reply generation')
assert.equal(autoConversation.messages.length, beforeTrueDecision + 2)
assert.equal(autoConversation.messages.at(-1).text, 'I can reply now.')
spindle.generate.quiet = autoQuiet
await frontendHandler({ type: 'lumiphone:save_preferences', requestId: 'auto-reply-off', chatId: 'chat-a', characterId: 'char-a', preferences: { autoReplyAfterSend: false } }, 'user-a')

const intercepted = await interceptorHandler([{ role: 'user', content: 'Continue.' }], {
  chatId: 'chat-a', characterId: 'char-a', userId: 'user-a',
})
assert.equal(intercepted.messages.length, 2)
assert.match(intercepted.messages[1].content, /Current Pocket snapshot/)
assert.doesNotMatch(intercepted.messages[1].content, /Hello from the phone/)

const toolResult = await backendEvents.get('TOOL_INVOCATION')({
  toolName: 'phone_action', requestId: 'tool-1', args: {
    action: 'note', chat_id: 'chat-a', character_id: 'char-a', payload: { title: 'Private thought', body: 'Remember the station.' },
  },
})
assert.equal(JSON.parse(toolResult).ok, true)
await backendEvents.get('TOOL_INVOCATION')({
  toolName: 'phone_action', requestId: 'tool-1', args: {
    action: 'note', chat_id: 'chat-a', character_id: 'char-a', payload: { title: 'Private thought', body: 'Remember the station.' },
  },
})
assert.equal(storage.get('phones/chat-a__char-a.json').notes.filter((note) => note.title === 'Private thought').length, 1)
assert.equal(storage.get('phones/chat-a__char-a.json').activities.filter((activity) => activity.title === 'Journal updated').length, 1)

const readState = storage.get('phones/chat-a__char-a.json')
const now = new Date().toISOString()
readState.contacts.push({
  id: 'bob-contact', name: 'Bob', role: 'Scout', description: 'A careful scout.', avatarUrl: '', accent: '#55bfa3',
  source: { kind: 'character', characterId: 'char-b' }, presence: { inScene: false, lastSceneAt: '' }, contextPolicy: { pinned: false }, createdAt: now, updatedAt: now,
})
readState.conversations = [
  { id: 'dm-alice', kind: 'direct', title: 'Alice', participantContactIds: ['char-a'], unread: 1, createdAt: now, updatedAt: now, messages: [{ id: 'm-a', sender: 'contact', senderContactId: 'char-a', senderName: 'Alice', senderAccent: '#8b7dff', text: 'A', createdAt: now, read: false, status: 'delivered' }] },
  { id: 'dm-bob', kind: 'direct', title: 'Bob', participantContactIds: ['bob-contact'], unread: 1, createdAt: now, updatedAt: now, messages: [{ id: 'm-b', sender: 'contact', senderContactId: 'bob-contact', senderName: 'Bob', senderAccent: '#55bfa3', text: 'B', createdAt: now, read: false, status: 'delivered' }] },
]
readState.notifications.push({ id: 'weather-unread', app: 'weather', title: 'Rain', body: '', createdAt: new Date().toISOString(), read: false, route: { app: 'weather' } })
storage.set('phones/chat-a__char-a.json', readState)
await frontendHandler({ type: 'lumiphone:mark_read', requestId: 'read-weather', chatId: 'chat-a', characterId: 'char-a', app: 'weather' }, 'user-a')
assert.deepEqual(storage.get('phones/chat-a__char-a.json').conversations.map((conversation) => conversation.unread), [1, 1])
await frontendHandler({ type: 'lumiphone:mark_read', requestId: 'read-messages-root', chatId: 'chat-a', characterId: 'char-a', app: 'messages' }, 'user-a')
assert.deepEqual(storage.get('phones/chat-a__char-a.json').conversations.map((conversation) => conversation.unread), [1, 1])
await frontendHandler({ type: 'lumiphone:mark_read', requestId: 'read-one', chatId: 'chat-a', characterId: 'char-a', app: 'messages', contactId: 'char-a' }, 'user-a')
assert.deepEqual(storage.get('phones/chat-a__char-a.json').conversations.map((conversation) => conversation.unread), [0, 1])

await frontendHandler({
  type: 'lumiphone:action', requestId: 'private-tracker-create', chatId: 'chat-a', characterId: 'char-a', action: 'tracker',
  payload: { id: 'private-tracker', key: 'private_meter', label: 'Private Meter', kind: 'meter', value: 5, min: 0, max: 100, updateMode: 'model', allowModelWrite: false },
}, 'user-a')
const deniedTrackerTool = await backendEvents.get('TOOL_INVOCATION')({
  toolName: 'phone_action', requestId: 'private-tracker-tool', args: { action: 'tracker', chat_id: 'chat-a', character_id: 'char-a', payload: { trackerId: 'private-tracker', operation: 'add', amount: 5 } },
})
assert.match(deniedTrackerTool, /does not allow model updates/)
await frontendHandler({
  type: 'lumiphone:action', requestId: 'private-tracker-user', chatId: 'chat-a', characterId: 'char-a', action: 'tracker',
  payload: { trackerId: 'private-tracker', operation: 'add', amount: 5 },
}, 'user-a')
assert.equal(storage.get('phones/chat-a__char-a.json').trackers.find((tracker) => tracker.id === 'private-tracker').value, 10)

await frontendHandler({
  type: 'lumiphone:action', requestId: 'writable-tracker-create', chatId: 'chat-a', characterId: 'char-a', action: 'tracker',
  payload: { id: 'writable-tracker', key: 'writable_meter', label: 'Writable Meter', kind: 'meter', value: 1, min: 0, max: 100, updateMode: 'model', allowModelWrite: true },
}, 'user-a')
const allowedTrackerTool = await backendEvents.get('TOOL_INVOCATION')({
  toolName: 'phone_action', requestId: 'writable-tracker-tool', args: { action: 'tracker', chat_id: 'chat-a', character_id: 'char-a', payload: { key: 'writable_meter', operation: 'add', amount: 4, reason: 'story change' } },
})
assert.equal(JSON.parse(allowedTrackerTool).ok, true)
const writableTracker = storage.get('phones/chat-a__char-a.json').trackers.find((tracker) => tracker.id === 'writable-tracker')
assert.equal(writableTracker.value, 5)
assert.equal(writableTracker.history.at(-1).source, 'model')
const trackerCountBeforeClear = storage.get('phones/chat-a__char-a.json').trackers.length
await frontendHandler({ type: 'lumiphone:notifications_clear', requestId: 'clear-notifications', chatId: 'chat-a', characterId: 'char-a', mode: 'all' }, 'user-a')
assert.equal(storage.get('phones/chat-a__char-a.json').trackers.length, trackerCountBeforeClear, 'clear all must not delete trackers')

await frontendHandler({
  type: 'lumiphone:model_action', requestId: 'tag-action', chatId: 'chat-a', characterId: 'char-a', messageId: 'host-message-a',
  attrs: { action: 'note', title: 'Tag journal' }, content: 'Accepted from a hidden tag', fullMatch: '<lumi-phone action="note">Accepted from a hidden tag</lumi-phone>',
  idempotencyKey: 'tag:host-message-a:note',
}, 'user-a')
const tagActivity = storage.get('phones/chat-a__char-a.json').activities.find((activity) => activity.title === 'Journal updated' && activity.source?.messageId === 'host-message-a')
assert.ok(tagActivity, 'accepted tag did not create a source-scoped activity')

await frontendHandler({ type: 'lumiphone:list_contact_sources', requestId: 'sources', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
const sourceResult = frontendMessages.find((message) => message.type === 'lumiphone:contact_sources' && message.requestId === 'sources')
assert.ok(sourceResult.sources.some((source) => source.kind === 'character' && source.sourceId === 'char-b'))
assert.ok(sourceResult.sources.some((source) => source.kind === 'council' && source.sourceId === 'member-luna'))
await frontendHandler({ type: 'lumiphone:import_contact', requestId: 'import-luna', chatId: 'chat-a', characterId: 'char-a', kind: 'council', sourceId: 'member-luna', itemId: 'item-luna' }, 'user-a')
let contactState = storage.get('phones/chat-a__char-a.json')
const luna = contactState.contacts.find((contact) => contact.source.kind === 'council')
assert.ok(luna, 'Council source was not imported')
const lunaDirect = contactState.conversations.find((conversation) => conversation.kind === 'direct' && conversation.participantContactIds[0] === luna.id)
const quietBeforeCouncil = quietRequests.length
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'reply-luna', chatId: 'chat-a', characterId: 'char-a', conversationId: lunaDirect.id }, 'user-a')
assert.equal(quietRequests.length, quietBeforeCouncil + 1)
assert.match(quietRequests.at(-1).messages[0].content, /Source: council:member-luna/)
contactState = storage.get('phones/chat-a__char-a.json')
assert.equal(contactState.conversations.find((conversation) => conversation.id === lunaDirect.id).messages.at(-1).senderContactId, luna.id)

await frontendHandler({ type: 'lumiphone:create_conversation', requestId: 'group-create', chatId: 'chat-a', characterId: 'char-a', title: 'Night Shift', participantContactIds: ['char-a', luna.id] }, 'user-a')
const groupId = frontendMessages.find((message) => message.type === 'lumiphone:conversation_opened' && message.requestId === 'group-create').conversationId
const groupBefore = storage.get('phones/chat-a__char-a.json').conversations.find((conversation) => conversation.id === groupId).messages.length
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'group-reply', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, speakerContactId: luna.id }, 'user-a')
const groupAfter = storage.get('phones/chat-a__char-a.json').conversations.find((conversation) => conversation.id === groupId)
assert.equal(groupAfter.messages.length, groupBefore + 1, 'group generation must append exactly one reply')
assert.equal(groupAfter.messages.at(-1).senderContactId, luna.id)
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'group-invalid-speaker', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, speakerContactId: 'not-a-participant' }, 'user-a')
assert.ok(frontendMessages.some((message) => message.type === 'lumiphone:error' && message.requestId === 'group-invalid-speaker'))

const sceneQuiet = spindle.generate.quiet
spindle.generate.quiet = async () => ({ content: '{"name":"Kestrel","role":"Courier","description":"An off-scene courier."}' })
await frontendHandler({ type: 'lumiphone:generate_contact', requestId: 'npc-progress', chatId: 'chat-a', characterId: 'char-a', description: 'A courier named Kestrel' }, 'user-a')
const npcPhases = frontendMessages.filter((message) => message.type === 'lumiphone:operation_progress' && message.requestId === 'npc-progress').map((message) => message.phase)
assert.deepEqual(npcPhases, ['generating', 'parsing', 'saving', 'complete'])
assert.ok(storage.get('phones/chat-a__char-a.json').contacts.some((contact) => contact.name === 'Kestrel'))
spindle.generate.quiet = async () => ({ content: '{"contacts":[{"name":"Mira","role":"Flower seller","description":"A bright-eyed merchant at the market."}]}' })
await frontendHandler({ type: 'lumiphone:sync_scene_contacts', requestId: 'scene-one', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
let mira = storage.get('phones/chat-a__char-a.json').contacts.find((contact) => contact.name === 'Mira')
assert.equal(mira.presence.inScene, true)
spindle.generate.quiet = async () => ({ content: '{"contacts":[]}' })
await frontendHandler({ type: 'lumiphone:sync_scene_contacts', requestId: 'scene-two', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
mira = storage.get('phones/chat-a__char-a.json').contacts.find((contact) => contact.name === 'Mira')
assert.equal(mira.presence.inScene, false, 'absent scene-derived contacts must be retained and marked away')
spindle.generate.quiet = sceneQuiet

await frontendHandler({
  type: 'lumiphone:test_generation', requestId: 'sidecar-test', chatId: 'chat-a', characterId: 'char-a',
  generationMode: 'sidecar', sidecarConnectionId: 'pocket-sidecar',
}, 'user-a')
assert.equal(quietRequests.at(-1).connection_id, 'pocket-sidecar', 'sidecar test must use the selected connection')
const sidecarRun = storage.get('device/preferences.json').generationHistory.find((entry) => entry.requestId === 'sidecar-test')
assert.deepEqual({ connectionId: sidecarRun.connectionId, model: sidecarRun.model, status: sidecarRun.status }, { connectionId: 'pocket-sidecar', model: 'sidecar-model', status: 'completed' })

const originalQuiet = spindle.generate.quiet
spindle.generate.quiet = async () => { throw new Error('planner unavailable') }
await frontendHandler({
  type: 'lumiphone:camera_generate', requestId: 'camera-fallback', chatId: 'chat-a', characterId: 'char-a',
  scene: 'Alice at the station', enhance: true,
}, 'user-a')
assert.ok(frontendMessages.some((message) => message.type === 'lumiphone:camera_done' && message.requestId === 'camera-fallback'))
spindle.generate.quiet = originalQuiet

let resolveLateImage
spindle.imageGen.generate = async () => new Promise((resolve) => { resolveLateImage = resolve })
const cancelledGeneration = frontendHandler({
  type: 'lumiphone:camera_generate', requestId: 'camera-cancelled', chatId: 'chat-a', characterId: 'char-a',
  scene: 'A late image', enhance: false,
}, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 0))
await frontendHandler({ type: 'lumiphone:camera_cancel', requestId: 'camera-cancelled', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
resolveLateImage({ imageId: 'late-image', imageUrl: '/api/v1/image-gen/results/late-image' })
await cancelledGeneration
assert.ok(!frontendMessages.some((message) => message.type === 'lumiphone:camera_done' && message.requestId === 'camera-cancelled'))

await frontendHandler({
  type: 'lumiphone:import_data', requestId: 'future-import', chatId: 'chat-a', characterId: 'char-a',
  data: { state: { version: 999 } },
}, 'user-a')
assert.ok(frontendMessages.some((message) => message.type === 'lumiphone:error' && message.requestId === 'future-import'))
storage.set('device/preferences.json', { version: 999, handsetScale: 42, futureToken: 'preserve-me' })
await frontendHandler({ type: 'lumiphone:get_state', requestId: 'future-preferences', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
assert.deepEqual(storage.get('device/preferences.json'), { version: 999, handsetScale: 42, futureToken: 'preserve-me' })

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  requestAnimationFrame: (callback) => { callback(0); return 1 },
  cancelAnimationFrame: () => {},
})
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
dom.window.HTMLElement.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() })

let backendReceiver = null
let tagReceiver = null
const frontendSends = []
const drawerRoot = document.createElement('div')
const widgetRoot = document.createElement('div')
const dockRoot = document.createElement('div')
const messageBubble = document.createElement('article')
document.body.append(drawerRoot, widgetRoot, dockRoot, messageBubble)
const drawerHandle = {
  root: drawerRoot,
  setBadge: () => {},
  activate: () => {},
  onActivate: () => () => {},
  destroy: () => {},
}
const inputHandle = {
  onClick: () => () => {}, destroy: () => {}, setLabel: () => {}, setSubtitle: () => {}, setEnabled: () => {},
}
const widgetHandle = {
  root: widgetRoot, widgetId: 'widget-a', moveTo: () => {}, getPosition: () => ({ x: 0, y: 0 }),
  setSize: (width, height) => { widgetHandle.width = width; widgetHandle.height = height }, setVisible: () => {}, isVisible: () => true,
  setFullscreen: (value) => { widgetHandle.fullscreen = value }, isFullscreen: () => Boolean(widgetHandle.fullscreen),
  destroy: () => {}, onDragEnd: () => () => {},
}
const dockHandle = {
  root: dockRoot, panelId: 'pocket-dock', collapsed: true, size: 0,
  collapse() { this.collapsed = true }, expand() { this.collapsed = false }, isCollapsed() { return this.collapsed },
  setTitle: () => {}, setSize(size) { this.size = size }, destroy: () => { dockDestroyCount += 1 }, onVisibilityChange: () => () => {},
}
let dockRequestCount = 0
let dockDestroyCount = 0
const injected = []
const frontendContext = {
  dom: {
    addStyle: () => () => {},
    findMessageElement: (messageId) => messageId === 'host-message-a' ? messageBubble : null,
    inject: (target, html) => { const wrapper = document.createElement('span'); wrapper.innerHTML = html; target.appendChild(wrapper); injected.push(wrapper); return wrapper },
    uninject: (element) => element.remove(),
  },
  ui: {
    registerDrawerTab: () => drawerHandle,
    registerInputBarAction: () => inputHandle,
    createFloatWidget: () => widgetHandle,
    requestDockPanel: (options) => { dockRequestCount += 1; assert.equal(options.chromeless, true); assert.equal(options.centerContent, true); return dockHandle },
    showModal: () => ({ root: document.createElement('div'), onDismiss: () => () => {}, dismiss: () => {} }),
  },
  messages: { registerTagInterceptor: (_options, handler) => { tagReceiver = handler; return () => {} } },
  events: { on: () => () => {} },
  permissions: { getGranted: async () => manifest.permissions, request: async () => manifest.permissions },
  getActiveChat: () => ({ chatId: 'chat-a', characterId: 'char-a' }),
  sendToBackend: (payload) => frontendSends.push(payload),
  onBackendMessage: (handler) => { backendReceiver = handler; return () => {} },
  ready: () => {},
}
const { setup } = await import(`${new URL('dist/frontend.js', root).href}?frontend-contract=${Date.now()}`)
const cleanup = setup(frontendContext)
await new Promise((resolve) => setTimeout(resolve, 0))
backendReceiver(firstState)
const launcher = widgetRoot.querySelector('.lumiphone-launcher')
assert.ok(launcher, 'float launcher was not rendered')
launcher.click()
assert.equal(widgetRoot.querySelector('.lumiphone-shell'), null, 'interactive phone leaked into draggable launcher float')
assert.ok(dockRoot.querySelector('.lumiphone-shell:not([hidden])'), 'phone did not open in the interactive desktop dock')
assert.equal(dockRequestCount, 1)
const dismissPhone = dockRoot.querySelector('.lumiphone-dismiss')
dismissPhone.click()
assert.equal(dockDestroyCount, 1, 'closing Pocket must destroy the dock handle')
launcher.click()
assert.equal(dockRequestCount, 2, 'reopening Pocket must request a fresh dock handle')
assert.ok(dockRoot.querySelector('.lumiphone-shell:not([hidden])'))
const handsetHost = dockRoot.querySelector('.lumiphone-handset-host')
assert.ok(Math.abs((parseFloat(handsetHost.style.width) / parseFloat(handsetHost.style.height)) - (9 / 16)) < 0.01, 'desktop phone bounds are not 9:16')
assert.equal(dockRoot.querySelectorAll('.lp-app-icon').length, 9)
const settingsIcon = [...dockRoot.querySelectorAll('.lp-app-icon')].find((node) => node.textContent.includes('Settings'))
settingsIcon.click()
const scaleInput = [...dockRoot.querySelectorAll('input[type="range"]')].find((node) => node.min === '0.8' && node.max === '1.25')
assert.ok(scaleInput, 'semantic phone scale control was not rendered')
const initialDockSize = dockHandle.size
scaleInput.value = '0.8'
scaleInput.dispatchEvent(new Event('input', { bubbles: true }))
assert.ok(Math.abs((parseFloat(handsetHost.style.width) / parseFloat(handsetHost.style.height)) - (9 / 16)) < 0.01, 'scale update broke 9:16 bounds')
assert.ok(dockHandle.size < initialDockSize, 'scale control did not derive a new semantic dock size')

dockRoot.querySelector('.lumiphone-homebar button').click()
const messagesIcon = [...dockRoot.querySelectorAll('.lp-app-icon')].find((node) => node.textContent.includes('Messages'))
messagesIcon.click()
const conversationCard = dockRoot.querySelector('.lp-content .lp-card[data-clickable="true"]')
conversationCard.click()
assert.equal(dockRoot.querySelector('.lp-nav-action:last-child').textContent, 'Info', 'thread header must expose info instead of a duplicate generation action')
const messageTextarea = dockRoot.querySelector('.lp-compose textarea')
const sendButton = dockRoot.querySelector('.lp-compose button[aria-label="Send message"]')
const actionCountBeforeClick = frontendSends.filter((message) => message.type === 'lumiphone:action' && message.action === 'message').length
messageTextarea.value = 'Sent with the paper plane'
sendButton.click()
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:action' && message.action === 'message').length, actionCountBeforeClick + 1, 'paper-plane click must submit exactly once')
messageTextarea.value = 'Sent with Enter'
messageTextarea.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:action' && message.action === 'message').length, actionCountBeforeClick + 2, 'Enter must submit exactly once')
messageTextarea.value = 'keep editing'
messageTextarea.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }))
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:action' && message.action === 'message').length, actionCountBeforeClick + 2, 'Shift+Enter must not submit')
const activeConversationId = firstState.state.conversations[0].id
backendReceiver({ type: 'lumiphone:message_progress', requestId: 'typing-ui', chatId: 'chat-a', characterId: 'char-a', conversationId: activeConversationId, speakerContactId: 'char-a', phase: 'pending' })
assert.equal(dockRoot.querySelectorAll('.lp-typing-dots i').length, 3, 'pending reply must render three typing dots')
assert.ok(!dockRoot.textContent.includes('Writing…'), 'pending reply must not render the literal Writing label')
backendReceiver({ type: 'lumiphone:message_progress', requestId: 'typing-ui', chatId: 'chat-a', characterId: 'char-a', conversationId: activeConversationId, speakerContactId: 'char-a', phase: 'done' })

dockRoot.querySelector('.lumiphone-homebar button').click()
const trackerIcon = [...dockRoot.querySelectorAll('.lp-app-icon')].find((node) => node.textContent.includes('Trackers'))
trackerIcon.click()
const addTracker = [...dockRoot.querySelectorAll('.lp-nav-action')].find((node) => node.textContent === 'Add')
addTracker.click()
const saveTracker = [...dockRoot.querySelectorAll('.lp-nav-action')].find((node) => node.textContent === 'Save')
assert.equal(saveTracker.disabled, false, 'Tracker Save must be enabled by the page action contract')
const trackerActionsBefore = frontendSends.filter((message) => message.type === 'lumiphone:action' && message.action === 'tracker').length
saveTracker.click()
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:action' && message.action === 'tracker').length, trackerActionsBefore + 1, 'Tracker Save must dispatch its action')
const activity = { ...tagActivity, route: { app: 'notes', noteId: 'missing-safe-fallback' } }
backendReceiver({ type: 'lumiphone:activity', activity })
backendReceiver({ type: 'lumiphone:activity', activity })
assert.equal(messageBubble.querySelectorAll('.pocket-receipt').length, 1, 'accepted activity receipt was not deduplicated')
messageBubble.querySelector('.pocket-receipt').click()
assert.ok(dockRoot.textContent.includes('Notes'), 'activity route did not open Pocket safely')
tagReceiver({
  messageId: 'message-a', chatId: 'chat-a', attrs: { action: 'notify', app: 'home', title: 'Ping' },
  content: 'Open the phone', fullMatch: '<lumi-phone>Open the phone</lumi-phone>', isStreaming: false,
})
assert.ok(frontendSends.some((message) => message.type === 'lumiphone:model_action'))
cleanup()

console.log('Pocket contracts passed.')
