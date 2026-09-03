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
for (const permission of ['generation', 'interceptor', 'tools', 'chats', 'chat_mutation', 'characters', 'images', 'cors_proxy', 'image_gen', 'ui_panels']) {
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
const appendedChatMessages = []
const updatedChatMessages = []
const macroResolveCalls = []
const hostImages = new Map([
  ['image-a', { id: 'image-a', url: '/api/v1/images/image-a', original_filename: 'Scene.png', mime_type: 'image/png' }],
])
let uploadedImageCount = 0

const permissions = new Set(manifest.permissions)
storage.set('phones/chat-a__char-a.json', {
  version: 0,
  chatId: 'wrong-scope-is-ignored',
  characterId: 'wrong-character-is-ignored',
  settings: { handsetScale: 1.15, accent: '#abcdef', bezelColor: '#010203', wallpaper: 'url(javascript:bad)' },
  notes: [null, { title: 'Migrated note', body: 'Still safe.', pinned: true }],
  events: [{ id: 'legacy-handoff', title: 'Already happened', kind: 'phone-handoff', completed: false }],
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
  chat: {
    getMessages: async () => [{ id: 'BED-111', index_in_chat: 0, role: 'user', content: 'At the market.' }, { id: 'KITCHEN-222', index_in_chat: 1, role: 'assistant', content: 'Mira, the flower seller, waves from her stall.' }],
    appendMessage: async (chatId, message, options) => { appendedChatMessages.push({ chatId, message, options }); return { id: `host-message-${appendedChatMessages.length}`, generationId: options?.triggerGeneration ? `generation-${appendedChatMessages.length}` : undefined } },
    updateMessage: async (chatId, messageId, patch) => { updatedChatMessages.push({ chatId, messageId, patch }) },
    setMessageHidden: async () => {},
  },
  personas: { getActive: async () => ({ id: 'persona-test', name: 'Test Persona' }) },
  council: {
    getMembers: async () => [{ memberId: 'member-luna', itemId: 'item-luna', name: 'Luna', role: 'Dream director', avatarUrl: '', definition: 'A lunar dream guide.', personality: 'Gentle', behavior: 'Poetic' }],
    getAvailableLumiaItems: async () => [],
  },
  macros: {
    resolve: async (template, options) => {
      macroResolveCalls.push({ template, options })
      if (!options?.userId) throw new Error('userId is required for operator-scoped extensions')
      return ({
      text: template
        .replace('{{char_base}}', 'silver hair, violet eyes')
        .replace('{{persona_base}}', 'red coat')
        .replace('{{swarm_negative}}', 'blurry')
        .replace('{{swarm_preset}}', '<preset:cinematic>')
        .replace('{{swarm_checkpoint}}', 'illustrious')
        .replace('{{swarm_aspect}}', '4:3'),
      diagnostics: [],
      })
    },
  },
  generate: { quiet: async (request) => { quietRequests.push(request); return { content: 'Meet me by the station.', finish_reason: 'stop' } } },
  connections: {
    list: async () => [
      { id: 'rp-default', name: 'Roleplay Default', provider: 'openai', model: 'test-model', is_default: true, has_api_key: true },
      { id: 'pocket-sidecar', name: 'Pocket Sidecar', provider: 'openrouter', model: 'sidecar-model', is_default: false, has_api_key: true },
    ],
    get: async (id) => id === 'rp-default' ? { id, name: 'Roleplay Default', provider: 'openai', model: 'test-model', is_default: true, has_api_key: true } : null,
  },
  images: {
    list: async () => ({ data: [], total: 0 }),
    get: async (id) => hostImages.get(id) || null,
    uploadFromDataUrl: async () => {
      uploadedImageCount += 1
      const id = uploadedImageCount === 1 ? 'uploaded-wallpaper' : `cached-remote-${uploadedImageCount}`
      const image = { id, url: `/api/v1/images/${id}`, original_filename: 'Wallpaper.png', mime_type: 'image/png' }
      hostImages.set(id, image)
      return image
    },
  },
  cors: async () => ({ status: 200, statusText: 'OK', headers: { 'content-type': 'image/png' }, body: 'iVBORw0KGgo=', encoding: 'base64' }),
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
assert.equal(firstState.state.version, 9)
assert.deepEqual(firstState.state.references, [])
assert.deepEqual(firstState.state.groupBatches, [])
assert.equal(firstState.state.contacts[0].source.kind, 'character')
assert.equal(firstState.state.conversations.length, 1)
assert.equal(firstState.state.events.find((entry) => entry.id === 'legacy-handoff').completed, true)
assert.equal(firstState.state.trackers[0].kind, 'meter')
assert.equal(firstState.state.trackers[0].clock, 'real')
assert.equal(firstState.state.trackers[0].target.type, 'custom')
assert.equal(firstState.state.settings, undefined)
assert.equal(firstState.preferences.handsetScale, 1.15)
assert.equal(firstState.preferences.uiScale, 1)
assert.equal(firstState.activePersona.id, 'persona-test')
assert.ok(storage.has('device/preferences.json'))
assert.equal(storage.get('phones/chat-a__char-a.json').settings, undefined)
assert.equal(storage.get('phones/chat-a__char-a.json').chatId, 'chat-a')
assert.equal(firstState.swarmProfile.source, 'swarm_studio')
assert.equal(firstState.swarmProfile.status, 'connected')
assert.equal(firstState.swarmProfile.fields.char_base.detected, true)
assert.equal(macroResolveCalls.at(-1).options.userId, 'user-a')

await frontendHandler({ type: 'lumiphone:gallery_add_to_chat', requestId: 'attach-image', chatId: 'chat-a', characterId: 'char-a', imageId: 'image-a', imageUrl: '/api/v1/images/image-a', filename: 'Scene.png' }, 'user-a')
assert.equal(updatedChatMessages.at(-1).chatId, 'chat-a')
assert.equal(updatedChatMessages.at(-1).messageId, 'KITCHEN-222')
assert.match(updatedChatMessages.at(-1).patch.content, /!\[Scene\.png\]\(\/api\/v1\/images\/image-a\)/)

await frontendHandler({ type: 'lumiphone:gallery_set_wallpaper', requestId: 'gallery-wallpaper', chatId: 'chat-a', characterId: 'char-a', imageId: 'image-a', target: 'home' }, 'user-a')
assert.deepEqual(storage.get('device/preferences.json').homeWallpaper.source, { kind: 'gallery', imageId: 'image-a' })
assert.deepEqual(frontendMessages.filter((message) => message.type === 'lumiphone:state').at(-1).resolvedWallpapers.deviceHome, {
  url: '/api/v1/images/image-a', status: 'ready', sourceKind: 'gallery', sourceLabel: 'Lumiverse Gallery',
})
await frontendHandler({ type: 'lumiphone:upload_wallpaper_asset', requestId: 'upload-wallpaper', chatId: 'chat-a', characterId: 'char-a', target: 'device-chat', filename: 'wall.png', dataUrl: 'data:image/png;base64,AA==' }, 'user-a')
assert.deepEqual(storage.get('device/preferences.json').chatWallpaper.source, { kind: 'asset', assetId: 'uploaded-wallpaper' })
assert.deepEqual(frontendMessages.filter((message) => message.type === 'lumiphone:state').at(-1).resolvedWallpapers.deviceChat, {
  url: '/api/v1/images/uploaded-wallpaper', status: 'ready', sourceKind: 'asset', sourceLabel: 'Uploaded asset',
})
assert.doesNotMatch(JSON.stringify(storage.get('device/preferences.json')), /data:image/, 'device preferences must retain only the durable asset id')

const personaPreferences = structuredClone(storage.get('device/preferences.json'))
personaPreferences.personaAppearance['persona-test'] = {
  enabled: true, theme: personaPreferences.theme, colors: structuredClone(personaPreferences.colors), customCss: '',
  homeWallpaper: { source: null, fit: 'cover', focalX: .5, focalY: .5, scrim: .22 },
  chatWallpaper: { source: null, fit: 'cover', focalX: .5, focalY: .5, scrim: .22 },
}
await frontendHandler({ type: 'lumiphone:save_preferences', requestId: 'persona-appearance', chatId: 'chat-a', characterId: 'char-a', preferences: personaPreferences }, 'user-a')
await frontendHandler({ type: 'lumiphone:set_wallpaper', requestId: 'url-wallpaper', chatId: 'chat-a', characterId: 'char-a', target: 'persona-home', personaId: 'persona-test', source: { kind: 'url', url: 'https://example.test/wall.png' } }, 'user-a')
assert.deepEqual(storage.get('device/preferences.json').personaAppearance['persona-test'].homeWallpaper.source, { kind: 'url', url: 'https://example.test/wall.png' })
const urlWallpaperState = frontendMessages.filter((message) => message.type === 'lumiphone:state').at(-1)
assert.deepEqual(urlWallpaperState.resolvedWallpapers.personaHome, {
  url: '/api/v1/images/cached-remote-2', status: 'ready', sourceKind: 'url', sourceLabel: 'Image URL',
})
assert.doesNotMatch(JSON.stringify(storage.get('device/preferences.json')), /cached-remote/, 'URL preferences must retain the URL rather than its resolver cache asset')

for (const source of [
  { kind: 'gallery', imageId: 'image-a' },
  { kind: 'asset', assetId: 'uploaded-wallpaper' },
  { kind: 'url', url: 'https://example.test/wall.png' },
]) {
  for (const target of ['device-home', 'device-chat', 'persona-home', 'persona-chat']) {
    await frontendHandler({ type: 'lumiphone:set_wallpaper', requestId: `persist-${source.kind}-${target}`, chatId: 'chat-a', characterId: 'char-a', target, personaId: target.startsWith('persona-') ? 'persona-test' : undefined, source }, 'user-a')
    const saved = storage.get('device/preferences.json')
    const wallpaper = target === 'device-home' ? saved.homeWallpaper
      : target === 'device-chat' ? saved.chatWallpaper
        : target === 'persona-home' ? saved.personaAppearance['persona-test'].homeWallpaper
          : saved.personaAppearance['persona-test'].chatWallpaper
    assert.deepEqual(wallpaper.source, source, `${source.kind} source must persist for ${target}`)
  }
}
const beforeInvalidWallpaper = structuredClone(storage.get('device/preferences.json').homeWallpaper)
await frontendHandler({ type: 'lumiphone:set_wallpaper', requestId: 'missing-wallpaper', chatId: 'chat-a', characterId: 'char-a', target: 'device-home', source: { kind: 'asset', assetId: 'missing-asset' } }, 'user-a')
assert.deepEqual(storage.get('device/preferences.json').homeWallpaper, beforeInvalidWallpaper, 'an unresolvable source must not be committed')
assert.ok(frontendMessages.some((message) => message.type === 'lumiphone:error' && message.requestId === 'missing-wallpaper' && /missing/i.test(message.error)))

const userActivityCount = storage.get('phones/chat-a__char-a.json').activities.length
await frontendHandler({
  type: 'lumiphone:action', requestId: 'message-1', chatId: 'chat-a', characterId: 'char-a',
  action: 'message', payload: { text: 'Hello from the phone.', sender: 'user' },
}, 'user-a')
const latestState = frontendMessages.filter((message) => message.type === 'lumiphone:state').at(-1).state
assert.equal(latestState.conversations[0].messages.at(-1).text, 'Hello from the phone.')
assert.equal(latestState.conversations[0].messages.at(-1).sender, 'persona')
assert.equal(latestState.notifications.length, 0, 'user send must not notify the sender')
assert.equal(latestState.activities.length, userActivityCount, 'user send must not emit a user-visible Pocket activity')

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

await frontendHandler({ type: 'lumiphone:save_preferences', requestId: 'auto-reply-on', chatId: 'chat-a', characterId: 'char-a', preferences: { autoReplyAfterSend: true, replyCadence: 'instant', generationMode: 'roleplay' } }, 'user-a')
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
const beforeBurst = autoConversation.messages.length
await frontendHandler({ type: 'lumiphone:action', requestId: 'burst-one', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'First part', sender: 'persona' } }, 'user-a')
await frontendHandler({ type: 'lumiphone:action', requestId: 'burst-two', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'Second part', sender: 'persona' } }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 40))
autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
assert.equal(autoDecisionCalls, 1, 'one settled outgoing burst must produce one reply decision')
assert.equal(autoConversation.messages.length, beforeBurst + 2)
assert.equal(autoConversation.outgoingBurst.messageIds.length, 2)

autoDecisionCalls = 0
spindle.generate.quiet = async () => { autoDecisionCalls += 1; return { content: '{"action":"none"}' } }
await frontendHandler({ type: 'lumiphone:action', requestId: 'held-send', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'Wait, I am still typing', sender: 'persona' } }, 'user-a')
await frontendHandler({ type: 'lumiphone:composer_state', requestId: 'held-focus', chatId: 'chat-a', characterId: 'char-a', conversationId: firstConversationId, held: true }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 40))
autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
assert.equal(autoDecisionCalls, 0, 'composer activity must postpone reply evaluation')
assert.equal(autoConversation.outgoingBurst.open, true)
assert.equal(autoConversation.outgoingBurst.held, true)
await frontendHandler({ type: 'lumiphone:composer_state', requestId: 'held-blur', chatId: 'chat-a', characterId: 'char-a', conversationId: firstConversationId, held: false }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 40))
autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
assert.equal(autoDecisionCalls, 1, 'blur must resume and finalize the held burst once')
assert.equal(autoConversation.outgoingBurst.finalized, true)

let manualGenerationCalls = 0
spindle.generate.quiet = async () => { manualGenerationCalls += 1; return { content: 'Manual flush reply.' } }
const beforeManualFlush = autoConversation.messages.length
await frontendHandler({ type: 'lumiphone:action', requestId: 'manual-flush-send', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'Answer this now', sender: 'persona' } }, 'user-a')
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'manual-flush-generate', chatId: 'chat-a', characterId: 'char-a', conversationId: firstConversationId }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 40))
autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
assert.equal(manualGenerationCalls, 1, 'manual generation must flush the burst without a separate reply decision')
assert.equal(autoConversation.messages.length, beforeManualFlush + 2)
assert.equal(autoConversation.messages.at(-1).text, 'Manual flush reply.')
assert.equal(autoConversation.outgoingBurst.finalized, true)

spindle.generate.quiet = async () => ({ content: '{"action":"pause","reason":"busy"}' })
const beforePauseDecision = autoConversation.messages.length
await frontendHandler({ type: 'lumiphone:action', requestId: 'auto-pause-send', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'See you when you get here', sender: 'persona' } }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 40))
autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
assert.equal(autoConversation.messages.length, beforePauseDecision + 1, 'pause decision must not generate a remote reply')
assert.deepEqual(autoConversation.pause.reason, 'busy')

spindle.generate.quiet = async () => ({ content: '{"action":"handoff","reason":"arriving"}' })
await frontendHandler({ type: 'lumiphone:action', requestId: 'auto-handoff-send', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'The door is open', sender: 'persona' } }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 40))
autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
assert.deepEqual(autoConversation.availability, { state: 'arriving' }, 'arriving must remain a usable remote transition until scene presence corroborates it')

const handoffState = storage.get('phones/chat-a__char-a.json')
handoffState.contacts.find((entry) => entry.id === 'char-a').presence.inScene = true
storage.set('phones/chat-a__char-a.json', handoffState)
autoDecisionCalls = 0
spindle.generate.quiet = async () => { autoDecisionCalls += 1; return { content: '{"action":"none"}' } }
await frontendHandler({ type: 'lumiphone:action', requestId: 'present-handoff-send', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'You are literally standing here', sender: 'persona' } }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 60))
autoConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === firstConversationId)
assert.equal(autoDecisionCalls, 0, 'scene-present actors must hand off deterministically without asking the reply model for none')
assert.deepEqual(autoConversation.availability, { state: 'local', reason: 'arrived' })
assert.equal(storage.get('phones/chat-a__char-a.json').relays.filter((entry) => entry.status === 'pending').length, 1)
assert.equal(storage.get('phones/chat-a__char-a.json').events.filter((entry) => entry.kind === 'phone-handoff' && entry.id !== 'legacy-handoff').length, 1)
assert.equal(storage.get('phones/chat-a__char-a.json').events.find((entry) => entry.kind === 'phone-handoff' && entry.id !== 'legacy-handoff').completed, true, 'Timeline records the occurred handoff independently of relay consumption')
assert.equal(appendedChatMessages.at(-1).options.triggerGeneration, true, 'handoff must trigger native main roleplay generation')
const pendingRelay = storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.status === 'pending')
assert.equal(pendingRelay.burstId, autoConversation.lastDecision.burstId, 'relay must persist its creating decision burst')
assert.equal(pendingRelay.continuation.state, 'accepted', 'host return with generation id accepts the continuation request')
assert.equal(pendingRelay.continuation.method, 'spindle.chat.appendMessage(triggerGeneration)')
assert.equal(pendingRelay.continuation.permissions.chatMutation, true)
assert.equal(pendingRelay.continuation.permissions.generation, true)
const ordinaryIntercept = await interceptorHandler([{ role: 'user', content: 'An unrelated next turn.' }], { chatId: 'chat-a', characterId: 'char-a', userId: 'user-a', generationId: 'unrelated-generation' })
assert.doesNotMatch(ordinaryIntercept.messages.at(-1).content, /POCKET CONTINUITY RELAY/, 'ordinary generations must not receive every pending relay')
// Match the current real Lumiverse payload: interceptor context supplies the chat,
// but not characterId/generationId and the internal continuation row may omit metadata.
const pendingIntercept = await interceptorHandler([{ role: 'user', content: 'Continue.' }], { chatId: 'chat-a', userId: 'user-a' })
assert.equal(pendingIntercept.messages.length, 3, 'the urgent relay must be a separate system contribution after generic Pocket memory')
assert.match(pendingIntercept.messages.at(-2).content, /"contacts":\[\{/, 'the generic snapshot must load the authoritative chat/character phone')
assert.match(pendingIntercept.messages.at(-1).content, /=== POCKET CONTINUITY RELAY — NEWER STATE ===/, 'pending relay must outrank stale scene context')
assert.match(pendingIntercept.messages.at(-1).content, /You are literally standing here/)
assert.equal(pendingIntercept.breakdown.at(-1).name, 'Pocket continuity relay — newer state')
let injectedRelay = storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === pendingRelay.id)
assert.equal(injectedRelay.injectedGenerationId, pendingRelay.continuation.generationId)
assert.ok(injectedRelay.injectedAt)
assert.equal(injectedRelay.serializedRelay, pendingIntercept.messages.at(-1).content)
await backendEvents.get('GENERATION_STARTED')({ chatId: 'chat-a', generationId: pendingRelay.continuation.generationId }, 'user-a')
assert.equal(storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === pendingRelay.id).continuation.state, 'started', 'a real host start event must be observed separately from request acceptance')

await frontendHandler({ type: 'lumiphone:action', requestId: 'second-present-handoff', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: firstConversationId, text: 'A distinct later handoff', sender: 'persona' } }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 60))
const pendingAfterSecondBurst = storage.get('phones/chat-a__char-a.json').relays.filter((entry) => entry.status === 'pending')
assert.equal(pendingAfterSecondBurst.length, 2, 'a new decision burst must not reuse an older pending relay')
assert.notEqual(pendingAfterSecondBurst[0].burstId, pendingAfterSecondBurst[1].burstId)
const secondRelay = pendingAfterSecondBurst[1]
const permissionState = storage.get('phones/chat-a__char-a.json')
permissionState.relays.find((entry) => entry.id === secondRelay.id).continuation = { state: 'started', generationId: 'generation-without-injection' }
storage.set('phones/chat-a__char-a.json', permissionState)
await backendEvents.get('GENERATION_ENDED')({ chatId: 'chat-a', generationId: 'generation-without-injection', messageId: 'uninformed-rp-message' }, 'user-a')
const uninjectedRelay = storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === secondRelay.id)
assert.equal(uninjectedRelay.status, 'pending', 'a generation cannot consume a relay it never received')
assert.match(uninjectedRelay.injectionError, /without a confirmed matching Pocket relay injection/i)
uninjectedRelay.continuation = { state: 'idle' }
storage.set('phones/chat-a__char-a.json', storage.get('phones/chat-a__char-a.json'))
permissions.delete('chat_mutation')
await frontendHandler({ type: 'lumiphone:continue_relay', requestId: 'blocked-continuation', chatId: 'chat-a', characterId: 'char-a', conversationId: firstConversationId }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 30))
assert.match(storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === secondRelay.id).continuation.error, /Chat mutation permission/i)
assert.equal(storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === secondRelay.id).status, 'pending')
await backendEvents.get('GENERATION_ENDED')({ chatId: 'chat-a', generationId: pendingRelay.continuation.generationId, messageId: 'continued-rp-message' }, 'user-a')
assert.equal(storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === pendingRelay.id).status, 'consumed', 'relay must be consumed only after a successful matching injected generation')
permissions.add('chat_mutation')
await frontendHandler({ type: 'lumiphone:continue_relay', requestId: 'retry-continuation', chatId: 'chat-a', characterId: 'char-a', conversationId: firstConversationId }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 30))
assert.equal(storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === secondRelay.id).continuation.state, 'accepted', 'retry must use the same native continuation path')
const retriedRelay = storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === secondRelay.id)
const retryIntercept = await interceptorHandler([{ role: 'user', content: 'Continue retry.', sourceMessageMetadata: { pocketContinuation: true, pocketRelayId: retriedRelay.id } }], { chatId: 'chat-a', userId: 'user-a' })
assert.equal(retryIntercept.messages.length, 3, 'message provenance must target a relay even when runtime context omits character and generation IDs')
assert.match(retryIntercept.messages.at(-1).content, /A distinct later handoff/)
const retriedInjectedRelay = storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === secondRelay.id)
await backendEvents.get('GENERATION_STARTED')({ chatId: 'chat-a', generationId: retriedInjectedRelay.continuation.generationId }, 'user-a')
await backendEvents.get('GENERATION_ENDED')({ chatId: 'chat-a', generationId: retriedInjectedRelay.continuation.generationId, messageId: 'retried-rp-message' }, 'user-a')
assert.equal(storage.get('phones/chat-a__char-a.json').relays.find((entry) => entry.id === secondRelay.id).status, 'consumed')

const resumedState = storage.get('phones/chat-a__char-a.json')
resumedState.contacts.find((entry) => entry.id === 'char-a').presence.inScene = false
resumedState.conversations.find((entry) => entry.id === firstConversationId).availability = { state: 'remote' }
storage.set('phones/chat-a__char-a.json', resumedState)
autoConversation = resumedState.conversations.find((entry) => entry.id === firstConversationId)

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
assert.equal(autoConversation.pause, undefined, 'a successful new incoming reply must resume a paused conversation')
spindle.generate.quiet = autoQuiet
await frontendHandler({ type: 'lumiphone:save_preferences', requestId: 'auto-reply-off', chatId: 'chat-a', characterId: 'char-a', preferences: { autoReplyAfterSend: false } }, 'user-a')

const intercepted = await interceptorHandler([{ role: 'user', content: 'Continue.' }], {
  chatId: 'chat-a', characterId: 'char-a', userId: 'user-a',
})
assert.equal(intercepted.messages.length, 2)
assert.match(intercepted.messages[1].content, /Current Pocket snapshot/)
assert.doesNotMatch(intercepted.messages[1].content, /POCKET CONTINUITY RELAY/, 'consumed relay urgency must disappear')
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
await frontendHandler({ type: 'lumiphone:import_contact', requestId: 'import-bob', chatId: 'chat-a', characterId: 'char-a', kind: 'character', sourceId: 'char-b' }, 'user-a')
let bobState = storage.get('phones/chat-a__char-a.json')
const bob = bobState.contacts.find((contact) => contact.source.kind === 'character' && contact.source.characterId === 'char-b')
const bobDirect = bobState.conversations.find((conversation) => conversation.kind === 'direct' && conversation.participantContactIds[0] === bob.id)
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'reply-bob', chatId: 'chat-a', characterId: 'char-a', conversationId: bobDirect.id }, 'user-a')
bobState = storage.get('phones/chat-a__char-a.json')
const generatedBob = bobState.conversations.find((conversation) => conversation.id === bobDirect.id).messages.at(-1)
assert.equal(generatedBob.generation.info.source, 'character:char-b', 'non-active Character contacts must resolve their own source card')
assert.equal(generatedBob.generation.info.activeCharacterUsed, false, 'non-active Character generation must not fall back to the active card')
await frontendHandler({ type: 'lumiphone:import_contact', requestId: 'import-luna', chatId: 'chat-a', characterId: 'char-a', kind: 'council', sourceId: 'member-luna', itemId: 'item-luna' }, 'user-a')
let contactState = storage.get('phones/chat-a__char-a.json')
const luna = contactState.contacts.find((contact) => contact.source.kind === 'council')
assert.ok(luna, 'Council source was not imported')
const lunaDirect = contactState.conversations.find((conversation) => conversation.kind === 'direct' && conversation.participantContactIds[0] === luna.id)
const quietBeforeCouncil = quietRequests.length
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'reply-luna', chatId: 'chat-a', characterId: 'char-a', conversationId: lunaDirect.id }, 'user-a')
assert.equal(quietRequests.length, quietBeforeCouncil + 1)
contactState = storage.get('phones/chat-a__char-a.json')
assert.equal(contactState.conversations.find((conversation) => conversation.id === lunaDirect.id).messages.at(-1).senderContactId, luna.id)
const generatedLuna = contactState.conversations.find((conversation) => conversation.id === lunaDirect.id).messages.at(-1)
assert.equal(generatedLuna.generation.requestId, 'reply-luna')
assert.equal(generatedLuna.generation.info.source, 'council:member-luna')
const retryQuiet = spindle.generate.quiet
spindle.generate.quiet = async (request) => { quietRequests.push(request); return { content: 'A different lunar answer.' } }
await frontendHandler({ type: 'lumiphone:retry_message', requestId: 'retry-luna', chatId: 'chat-a', characterId: 'char-a', conversationId: lunaDirect.id, messageId: generatedLuna.id }, 'user-a')
contactState = storage.get('phones/chat-a__char-a.json')
const retriedLunaThread = contactState.conversations.find((conversation) => conversation.id === lunaDirect.id)
assert.equal(retriedLunaThread.messages.length, 1, 'retry must replace the generated slot in place')
assert.equal(retriedLunaThread.messages[0].text, 'A different lunar answer.')
assert.equal(retriedLunaThread.messages[0].generation.retryOf, generatedLuna.id)
spindle.generate.quiet = retryQuiet

await frontendHandler({ type: 'lumiphone:create_conversation', requestId: 'group-create', chatId: 'chat-a', characterId: 'char-a', title: 'Night Shift', participantContactIds: ['char-a', luna.id] }, 'user-a')
const groupId = frontendMessages.find((message) => message.type === 'lumiphone:conversation_opened' && message.requestId === 'group-create').conversationId
const groupBefore = storage.get('phones/chat-a__char-a.json').conversations.find((conversation) => conversation.id === groupId).messages.length
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'group-reply', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, speakerContactId: luna.id }, 'user-a')
const groupAfter = storage.get('phones/chat-a__char-a.json').conversations.find((conversation) => conversation.id === groupId)
assert.equal(groupAfter.messages.length, groupBefore + 1, 'group generation must append exactly one reply')
assert.equal(groupAfter.messages.at(-1).senderContactId, luna.id)
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'group-invalid-speaker', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, speakerContactId: 'not-a-participant' }, 'user-a')
assert.ok(frontendMessages.some((message) => message.type === 'lumiphone:error' && message.requestId === 'group-invalid-speaker'))

const groupBatchState = storage.get('phones/chat-a__char-a.json')
for (const contactId of groupBatchState.conversations.find((entry) => entry.id === groupId).participantContactIds) {
  const contact = groupBatchState.contacts.find((entry) => entry.id === contactId)
  contact.presence.inScene = false
  contact.messagingPolicy.remoteEligible = true
}
storage.set('phones/chat-a__char-a.json', groupBatchState)
const groupBatchQuiet = spindle.generate.quiet
let groupBatchCalls = 0
spindle.generate.quiet = async (request) => {
  quietRequests.push(request)
  groupBatchCalls += 1
  return { content: JSON.stringify({ messages: [
    { speakerId: 'char-a', text: 'The first group reaction.' },
    { speakerId: luna.id, text: 'I am reacting to that first message.' },
    { speakerId: luna.id, text: 'Wait—one more thing.' },
  ] }) }
}
const beforeBatch = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === groupId).messages.length
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'group-auto-batch', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, speakerContactId: 'auto' }, 'user-a')
const groupBatchResult = storage.get('phones/chat-a__char-a.json')
const groupAfterBatch = groupBatchResult.conversations.find((entry) => entry.id === groupId)
assert.equal(groupBatchCalls, 1, 'one Auto trigger must use one structured group generation call')
assert.equal(groupAfterBatch.messages.length, beforeBatch + 3, 'one Auto trigger must reveal the bounded ordered batch')
assert.deepEqual(groupAfterBatch.messages.slice(-3).map((entry) => entry.senderContactId), ['char-a', luna.id, luna.id])
assert.equal(groupAfterBatch.messages.at(-1).generation.info.groupBatch.position, 3)
assert.equal(groupAfterBatch.messages.at(-1).generation.info.groupBatch.size, 3)
assert.equal(groupBatchResult.groupBatches.at(-1).status, 'completed')
assert.ok(groupBatchResult.groupBatches.at(-1).messages.every((entry) => entry.state === 'delivered'))
assert.match(quietRequests.at(-1).messages[0].content, /later messages may directly react to earlier generated messages/i)
assert.match(quietRequests.at(-1).messages[1].content, /talkativeness=/)
await frontendHandler({ type: 'lumiphone:save_preferences', requestId: 'group-auto-on', chatId: 'chat-a', characterId: 'char-a', preferences: { autoReplyAfterSend: true, replyCadence: 'instant' } }, 'user-a')
const callsBeforeAutomaticGroup = groupBatchCalls
const messagesBeforeAutomaticGroup = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === groupId).messages.length
await frontendHandler({ type: 'lumiphone:action', requestId: 'group-user-burst', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: groupId, text: 'What does everyone think?', sender: 'persona' } }, 'user-a')
await new Promise((resolve) => setTimeout(resolve, 60))
const automaticGroup = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === groupId)
assert.equal(groupBatchCalls, callsBeforeAutomaticGroup + 1, 'a settled user group burst must trigger exactly one group-native generation')
assert.equal(automaticGroup.messages.length, messagesBeforeAutomaticGroup + 4, 'the user message and its three generated replies must become canonical in reveal order')
assert.equal(automaticGroup.messages.at(-4).sender, 'persona')
await frontendHandler({ type: 'lumiphone:save_preferences', requestId: 'group-auto-off', chatId: 'chat-a', characterId: 'char-a', preferences: { autoReplyAfterSend: false } }, 'user-a')
spindle.generate.quiet = groupBatchQuiet

const pendingBatchState = storage.get('phones/chat-a__char-a.json')
pendingBatchState.groupBatches.push({
  id: 'batch-stale', requestId: 'batch-stale-request', conversationId: groupId,
  eligibleContactIds: ['char-a', luna.id], status: 'delivering', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  messages: [
    { id: 'slot-delivered', speakerId: 'char-a', text: 'Already visible', state: 'delivered', deliveredMessageId: 'existing-message' },
    { id: 'slot-stale', speakerId: luna.id, text: 'This future reply is stale', state: 'queued' },
  ],
})
storage.set('phones/chat-a__char-a.json', pendingBatchState)
const quietBeforeOverlap = quietRequests.length
await frontendHandler({ type: 'lumiphone:generate_message', requestId: 'group-overlap', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, speakerContactId: 'auto' }, 'user-a')
assert.equal(quietRequests.length, quietBeforeOverlap, 'a persisted active group batch must block an overlapping generation call')
assert.ok(frontendMessages.some((message) => message.type === 'lumiphone:error' && message.requestId === 'group-overlap'))
await frontendHandler({ type: 'lumiphone:action', requestId: 'interrupt-group-batch', chatId: 'chat-a', characterId: 'char-a', action: 'message', payload: { conversationId: groupId, text: 'A newer user interruption', sender: 'persona' } }, 'user-a')
const cancelledBatch = storage.get('phones/chat-a__char-a.json').groupBatches.find((entry) => entry.id === 'batch-stale')
assert.equal(cancelledBatch.status, 'cancelled', 'a new user message must cancel the undelivered remainder')
assert.equal(cancelledBatch.messages[0].state, 'delivered', 'already delivered batch messages remain canonical')
assert.equal(cancelledBatch.messages[1].state, 'cancelled', 'undelivered generated replies must never enter canonical history')

const referenceEventsBefore = storage.get('phones/chat-a__char-a.json').events.length
await frontendHandler({ type: 'lumiphone:arm_reference', requestId: 'reference-group', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, scope: 'conversation' }, 'user-a')
let referenceState = storage.get('phones/chat-a__char-a.json')
let pocketReference = referenceState.references.at(-1)
assert.equal(pocketReference.status, 'armed')
assert.equal(pocketReference.conversationKind, 'group')
assert.equal(pocketReference.conversationTitle, 'Night Shift')
assert.ok(pocketReference.participants.some((entry) => entry.name === 'Luna'))
assert.ok(pocketReference.messages.length > 0 && pocketReference.messages.length <= 8)
assert.equal(referenceState.events.length, referenceEventsBefore, 'arming a reference must not create a Timeline event')
const regenerationWithReferenceArmed = await interceptorHandler([{ role: 'user', content: 'Regenerate this.' }], {
  chatId: 'chat-a', characterId: 'char-a', userId: 'user-a', generationId: 'reference-regen', generationType: 'regenerate', isDryRun: false,
})
assert.doesNotMatch(regenerationWithReferenceArmed.messages.at(-1).content, /POCKET USER REFERENCE/, 'a regeneration must not steal an armed one-shot reference')
assert.equal(storage.get('phones/chat-a__char-a.json').references.at(-1).status, 'armed')
const syntheticNormalPrompt = await interceptorHandler([{ role: 'user', content: 'Synthetic instruction without a stored host turn.' }], {
  chatId: 'chat-a', characterId: 'char-a', userId: 'user-a', generationId: 'reference-synthetic', generationType: 'normal', isDryRun: false,
})
assert.doesNotMatch(syntheticNormalPrompt.messages.at(-1).content, /POCKET USER REFERENCE/, 'synthetic user-shaped prompts must not steal an armed reference')
assert.equal(storage.get('phones/chat-a__char-a.json').references.at(-1).status, 'armed')
const normalReferenceIntercept = await interceptorHandler([{
  role: 'user', content: 'Mizi says you are all useless.', __isChatHistory: true, sourceMessageId: 'rp-user-reference',
}], {
  chatId: 'chat-a', characterId: 'char-a', userId: 'user-a', generationId: 'reference-generation', generationType: 'normal', isDryRun: false,
})
assert.equal(normalReferenceIntercept.messages.length, 3, 'the ordinary Pocket snapshot and explicit reference must remain separate prompt contributions')
assert.match(normalReferenceIntercept.messages.at(-1).content, /POCKET USER REFERENCE — THIS TURN/)
assert.match(normalReferenceIntercept.messages.at(-1).content, /Conversation: Night Shift/)
assert.match(normalReferenceIntercept.messages.at(-1).content, /Participants: .*Luna/)
assert.match(normalReferenceIntercept.messages.at(-1).content, /does not hand off the conversation, change channel ownership, or establish that any participant is physically present/i)
assert.ok(normalReferenceIntercept.messages.at(-1).content.length <= 2_200, 'reference serialization must respect its total prompt budget')
assert.equal(normalReferenceIntercept.breakdown.at(-1).name, 'Pocket user reference — this turn')
referenceState = storage.get('phones/chat-a__char-a.json')
pocketReference = referenceState.references.at(-1)
assert.equal(pocketReference.status, 'injected')
assert.equal(pocketReference.injectedGenerationId, 'reference-generation')
assert.equal(pocketReference.boundUserMessageId, 'rp-user-reference')
assert.equal(pocketReference.serializedReferenceChars, normalReferenceIntercept.messages.at(-1).content.length)
const overlappingReferenceIntercept = await interceptorHandler([{ role: 'user', content: 'Another message.' }], {
  chatId: 'chat-a', characterId: 'char-a', userId: 'user-a', generationId: 'reference-other-generation', generationType: 'normal', isDryRun: false,
})
assert.doesNotMatch(overlappingReferenceIntercept.messages.at(-1).content, /POCKET USER REFERENCE/, 'an injected reference must never double-dip into another generation')
await backendEvents.get('GENERATION_STARTED')({ chatId: 'chat-a', generationId: 'reference-generation' }, 'user-a')
await backendEvents.get('GENERATION_ENDED')({ chatId: 'chat-a', generationId: 'reference-generation', messageId: 'rp-answer-reference' }, 'user-a')
pocketReference = storage.get('phones/chat-a__char-a.json').references.at(-1)
assert.equal(pocketReference.status, 'consumed')
assert.equal(pocketReference.consumedMessageId, 'rp-answer-reference')
assert.equal(storage.get('phones/chat-a__char-a.json').events.length, referenceEventsBefore, 'consuming a reference must still not create a Timeline event')
const afterReferenceConsumed = await interceptorHandler([{ role: 'user', content: 'Later turn.' }], {
  chatId: 'chat-a', characterId: 'char-a', userId: 'user-a', generationId: 'reference-later', generationType: 'normal', isDryRun: false,
})
assert.doesNotMatch(afterReferenceConsumed.messages.at(-1).content, /POCKET USER REFERENCE/, 'a consumed reference must remain one-shot')

const referenceConversation = storage.get('phones/chat-a__char-a.json').conversations.find((entry) => entry.id === groupId)
const selectedReferenceIds = referenceConversation.messages.slice(-2).map((entry) => entry.id)
await frontendHandler({ type: 'lumiphone:arm_reference', requestId: 'reference-selected', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, scope: 'selected_messages', messageIds: selectedReferenceIds }, 'user-a')
pocketReference = storage.get('phones/chat-a__char-a.json').references.at(-1)
assert.equal(pocketReference.scope, 'selected_messages')
assert.deepEqual(pocketReference.messages.map((entry) => entry.messageId), selectedReferenceIds)
await frontendHandler({ type: 'lumiphone:cancel_reference', requestId: 'reference-cancel', chatId: 'chat-a', characterId: 'char-a', referenceId: pocketReference.id }, 'user-a')
assert.equal(storage.get('phones/chat-a__char-a.json').references.at(-1).status, 'cancelled')

await frontendHandler({ type: 'lumiphone:arm_reference', requestId: 'reference-failure', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, scope: 'recent_messages' }, 'user-a')
pocketReference = storage.get('phones/chat-a__char-a.json').references.at(-1)
await interceptorHandler([{ role: 'user', content: 'Use this context.', __isChatHistory: true, sourceMessageId: 'rp-user-failure' }], {
  chatId: 'chat-a', characterId: 'char-a', userId: 'user-a', generationId: 'reference-failure-generation', generationType: 'normal', isDryRun: false,
})
await backendEvents.get('GENERATION_ENDED')({ chatId: 'chat-a', generationId: 'reference-failure-generation', error: 'Provider unavailable' }, 'user-a')
pocketReference = storage.get('phones/chat-a__char-a.json').references.at(-1)
assert.equal(pocketReference.status, 'failed', 'failed RP generation must not consume its reference')
assert.match(pocketReference.error, /Provider unavailable/)
await frontendHandler({ type: 'lumiphone:rearm_reference', requestId: 'reference-rearm', chatId: 'chat-a', characterId: 'char-a', referenceId: pocketReference.id }, 'user-a')
assert.equal(storage.get('phones/chat-a__char-a.json').references.at(-1).status, 'armed')
await frontendHandler({ type: 'lumiphone:cancel_reference', requestId: 'reference-rearm-cancel', chatId: 'chat-a', characterId: 'char-a', referenceId: pocketReference.id }, 'user-a')

const sceneQuiet = spindle.generate.quiet
spindle.generate.quiet = async () => ({ content: '{"name":"Kestrel","role":"Courier","identityBrief":"An off-scene courier.","talkativeness":72,"fragmentation":61}' })
const contactsBeforeDraft = storage.get('phones/chat-a__char-a.json').contacts.length
await frontendHandler({ type: 'lumiphone:generate_contact', requestId: 'npc-progress', chatId: 'chat-a', characterId: 'char-a', description: 'A courier named Kestrel' }, 'user-a')
const npcPhases = frontendMessages.filter((message) => message.type === 'lumiphone:operation_progress' && message.requestId === 'npc-progress').map((message) => message.phase)
assert.deepEqual(npcPhases, ['generating', 'parsing', 'complete'])
assert.equal(storage.get('phones/chat-a__char-a.json').contacts.length, contactsBeforeDraft, 'generation must not create a Contact before Use')
const kestrelDraft = frontendMessages.find((message) => message.type === 'lumiphone:contact_draft' && message.requestId === 'npc-progress').draft
assert.deepEqual(kestrelDraft.messagingStyle, { talkativeness: 72, fragmentation: 61 })
spindle.generate.quiet = async () => ({ content: '{"name":"Kestrel Two","role":"Scout","identityBrief":"A better draft.","talkativeness":35,"fragmentation":20}' })
await frontendHandler({ type: 'lumiphone:generate_contact', requestId: 'npc-retry', chatId: 'chat-a', characterId: 'char-a', description: 'A courier named Kestrel' }, 'user-a')
assert.equal(storage.get('phones/chat-a__char-a.json').contacts.length, contactsBeforeDraft, 'reroll must still not create duplicate Contacts')
const retryDraft = frontendMessages.find((message) => message.type === 'lumiphone:contact_draft' && message.requestId === 'npc-retry').draft
await frontendHandler({ type: 'lumiphone:save_contact', requestId: 'npc-use', chatId: 'chat-a', characterId: 'char-a', contact: {
  ...retryDraft, description: retryDraft.identityBrief,
  source: { kind: 'npc', origin: 'generated', description: retryDraft.identityBrief },
  messagingPolicy: { remoteEligible: true }, messagingStyle: retryDraft.messagingStyle,
} }, 'user-a')
const generatedContacts = storage.get('phones/chat-a__char-a.json').contacts.filter((contact) => contact.name.startsWith('Kestrel'))
assert.equal(generatedContacts.length, 1, 'Use must commit exactly one generated Contact')
assert.equal(generatedContacts[0].name, 'Kestrel Two')
const editableLuna = storage.get('phones/chat-a__char-a.json').contacts.find((contact) => contact.id === luna.id)
await frontendHandler({ type: 'lumiphone:save_contact', requestId: 'save-luna-accent', chatId: 'chat-a', characterId: 'char-a', contact: {
  ...editableLuna, accent: '#12abef', colorMode: 'pocket',
  messagingStyle: { talkativeness: 82, fragmentation: 17 },
} }, 'user-a')
const savedLuna = storage.get('phones/chat-a__char-a.json').contacts.find((contact) => contact.id === luna.id)
assert.equal(savedLuna.accent, '#12abef', 'Contact Save must persist a changed manual accent')
assert.deepEqual(savedLuna.messagingStyle, { talkativeness: 82, fragmentation: 17 })
assert.equal(frontendMessages.findLast((message) => message.type === 'lumiphone:contact_saved' && message.requestId === 'save-luna-accent').contact.accent, '#12abef', 'save acknowledgement must carry the returned Contact')
spindle.generate.quiet = async () => ({ content: '{"contacts":[{"name":"Alice","role":"Primary character"},{"name":"Test Persona","role":"Active persona"},{"name":"Mira","role":"Flower seller","description":"A bright-eyed merchant at the market."}]}' })
await frontendHandler({ type: 'lumiphone:sync_scene_contacts', requestId: 'scene-one', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
let mira = storage.get('phones/chat-a__char-a.json').contacts.find((contact) => contact.name === 'Mira')
assert.equal(mira.presence.inScene, true)
const sceneOneState = storage.get('phones/chat-a__char-a.json')
assert.equal(sceneOneState.contacts.filter((contact) => contact.name === 'Alice').length, 1, 'Scene Sync must not create a Character duplicate')
assert.equal(sceneOneState.contacts.some((contact) => contact.name === 'Test Persona'), false, 'Scene Sync must never turn the active Persona into a Contact')
assert.deepEqual(sceneOneState.sceneSnapshot.actors.map((actor) => actor.contactId), [mira.id])
assert.equal(sceneOneState.sceneSnapshot.sourceMessageId, 'KITCHEN-222')
await backendEvents.get('GENERATION_ENDED')({ chatId: 'chat-a', messageId: 'NEXT-TURN-333' }, 'user-a')
assert.equal(storage.get('phones/chat-a__char-a.json').sceneSnapshot.stale, true, 'a newly committed RP turn must mark the prior scene snapshot stale')
const overfullSceneContacts = Array.from({ length: 8 }, (_, index) => ({
  name: `Bounded actor ${index + 1}`, role: 'R'.repeat(180), identityBrief: 'I'.repeat(600), sceneNote: 'S'.repeat(400),
}))
spindle.generate.quiet = async () => ({ content: JSON.stringify({ contacts: overfullSceneContacts }) })
await frontendHandler({ type: 'lumiphone:sync_scene_contacts', requestId: 'scene-bounds', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
const boundedActors = storage.get('phones/chat-a__char-a.json').contacts.filter((contact) => contact.name.startsWith('Bounded actor'))
assert.equal(boundedActors.length, 6, 'Scene Sync must commit at most six complete contacts')
assert.ok(boundedActors.every((contact) => contact.role.length <= 120 && contact.identityBrief.length <= 350 && contact.sceneNote.length <= 220))
const sceneMutationSurface = (state) => JSON.stringify({
  contacts: state.contacts,
  sceneSnapshot: state.sceneSnapshot,
  conversations: state.conversations,
})
const beforeInvalidScene = sceneMutationSurface(storage.get('phones/chat-a__char-a.json'))
spindle.generate.quiet = async () => ({ content: '{"wrong":[]}' })
await frontendHandler({ type: 'lumiphone:sync_scene_contacts', requestId: 'scene-invalid', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
assert.equal(sceneMutationSurface(storage.get('phones/chat-a__char-a.json')), beforeInvalidScene, 'invalid Scene Sync output must not partially mutate contact state')
assert.ok(frontendMessages.some((message) => message.type === 'lumiphone:error' && message.requestId === 'scene-invalid'))
spindle.generate.quiet = async () => ({ content: '{"contacts":[]}' })
await frontendHandler({ type: 'lumiphone:sync_scene_contacts', requestId: 'scene-two', chatId: 'chat-a', characterId: 'char-a' }, 'user-a')
mira = storage.get('phones/chat-a__char-a.json').contacts.find((contact) => contact.name === 'Mira')
assert.equal(mira.presence.inScene, false, 'absent scene-derived contacts must be retained and marked away')
spindle.generate.quiet = sceneQuiet

await frontendHandler({
  type: 'lumiphone:test_generation', requestId: 'sidecar-test', chatId: 'chat-a', characterId: 'char-a',
  generationMode: 'sidecar', sidecarConnectionId: 'pocket-sidecar', sidecarModelOverride: 'discovered-model',
}, 'user-a')
assert.equal(quietRequests.at(-1).connection_id, 'pocket-sidecar', 'sidecar test must use the selected connection')
assert.equal(quietRequests.at(-1).parameters.model, 'discovered-model', 'sidecar test must pass the model override through parameters.model')
const sidecarRun = storage.get('device/preferences.json').generationHistory.find((entry) => entry.requestId === 'sidecar-test')
assert.deepEqual({ connectionId: sidecarRun.connectionId, model: sidecarRun.model, status: sidecarRun.status }, { connectionId: 'pocket-sidecar', model: 'discovered-model', status: 'completed' })

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
let handoffScrollCount = 0
dom.window.HTMLElement.prototype.scrollIntoView = () => { handoffScrollCount += 1 }

let backendReceiver = null
let tagReceiver = null
const frontendSends = []
const drawerRoot = document.createElement('div')
const widgetRoot = document.createElement('div')
const dockRoot = document.createElement('div')
const shownModals = []
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
  components: { mountModelCombobox: () => ({ getValue: () => '', refresh: () => {}, update: () => {}, destroy: () => {} }) },
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
    showModal: (options) => {
      const record = { options, root: document.createElement('div'), dismissed: false }
      shownModals.push(record)
      return { root: record.root, onDismiss: () => () => {}, dismiss: () => { record.dismissed = true } }
    },
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
assert.equal(dockRoot.querySelectorAll('[data-settings-category]').length, 8, 'Settings root must render category navigation')
dockRoot.querySelector('[data-settings-category="appearance"]').click()
const uiScaleInput = [...dockRoot.querySelectorAll('input[type="range"]')].find((node) => node.min === '0.7' && node.max === '1.3')
assert.ok(uiScaleInput, 'UI density scale control was not rendered')
const scaleInput = [...dockRoot.querySelectorAll('input[type="range"]')].find((node) => node.min === '0.8' && node.max === '1.25')
assert.ok(scaleInput, 'semantic phone scale control was not rendered')
const initialDockSize = dockHandle.size
uiScaleInput.value = '0.75'
uiScaleInput.dispatchEvent(new Event('input', { bubbles: true }))
assert.equal(dockHandle.size, initialDockSize, 'UI density must not resize the desktop handset')
scaleInput.value = '0.8'
scaleInput.dispatchEvent(new Event('input', { bubbles: true }))
assert.ok(Math.abs((parseFloat(handsetHost.style.width) / parseFloat(handsetHost.style.height)) - (9 / 16)) < 0.01, 'scale update broke 9:16 bounds')
assert.ok(dockHandle.size < initialDockSize, 'scale control did not derive a new semantic dock size')

dockRoot.querySelector('.lumiphone-homebar button').click()
const messagesIcon = [...dockRoot.querySelectorAll('.lp-app-icon')].find((node) => node.textContent.includes('Messages'))
messagesIcon.click()
const conversationCard = dockRoot.querySelector('.lp-content .lp-card[data-clickable="true"]')
conversationCard.click()
assert.equal(dockRoot.querySelector('.lp-conversation-menu > summary').textContent, '⋯', 'thread header must use a compact conversation menu instead of the overloaded Info button')
assert.equal(dockRoot.querySelector('.lp-conversation-menu > summary').getAttribute('aria-label'), 'Conversation menu')
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
backendReceiver({ type: 'lumiphone:message_progress', requestId: 'checking-ui', chatId: 'chat-a', characterId: 'char-a', conversationId: activeConversationId, speakerContactId: 'char-a', phase: 'checking' })
assert.match(dockRoot.textContent, /Checking for reply/, 'reply decision status must be observable')
backendReceiver({ type: 'lumiphone:message_progress', requestId: 'checking-ui', chatId: 'chat-a', characterId: 'char-a', conversationId: activeConversationId, speakerContactId: 'char-a', phase: 'done' })
backendReceiver({ type: 'lumiphone:message_progress', requestId: 'typing-ui', chatId: 'chat-a', characterId: 'char-a', conversationId: activeConversationId, speakerContactId: 'char-a', phase: 'pending' })
assert.equal(dockRoot.querySelectorAll('.lp-typing-dots i').length, 3, 'pending reply must render three typing dots')
assert.ok(!dockRoot.textContent.includes('Writing…'), 'pending reply must not render the literal Writing label')
backendReceiver({ type: 'lumiphone:message_progress', requestId: 'typing-ui', chatId: 'chat-a', characterId: 'char-a', conversationId: activeConversationId, speakerContactId: 'char-a', phase: 'done' })
const pausedUiState = structuredClone(firstState)
pausedUiState.state.conversations[0].availability = { state: 'arriving' }
backendReceiver(pausedUiState)
assert.match(dockRoot.textContent, /Alice is on the way\./, 'arriving must render Pocket-owned transition copy')
assert.ok(dockRoot.querySelector('.lp-compose'), 'arriving must keep remote messaging usable until the actor becomes local')

const localUiState = structuredClone(pausedUiState)
const localConversation = localUiState.state.conversations[0]
const handoffSource = localConversation.messages.at(-1) || {
  id: 'handoff-source-ui', sender: 'persona', senderName: 'You', senderAccent: '', text: 'See you here',
  createdAt: new Date().toISOString(), read: true, status: 'sent',
}
if (!localConversation.messages.length) localConversation.messages.push(handoffSource)
localConversation.availability = { state: 'local', reason: 'arrived' }
localConversation.lastDecision = {
  rawAction: 'handoff', normalizedAction: 'handoff', reason: 'arrived', normalizationReason: '',
  contactInScene: true, remoteEligible: true, explicitRemoteOverride: false,
  createdAt: new Date().toISOString(), relayId: 'relay-ui', burstId: 'burst-ui',
}
localUiState.state.relays = [{
  id: 'relay-ui', chatId: 'chat-a', characterId: 'char-a', contactId: 'char-a', conversationId: localConversation.id,
  burstId: 'burst-ui', reason: 'arrived', actorState: 'arrived', sourceMessageId: handoffSource.id,
  conversationTail: { text: 'You: See you here', recentMessageIds: [handoffSource.id], updatedAt: new Date().toISOString() },
  latestExchange: 'You: See you here', timelineEventId: 'timeline-ui', createdAt: new Date().toISOString(), status: 'pending',
  continuation: { state: 'launching', invokedAt: new Date().toISOString() },
}]
backendReceiver(localUiState)
await new Promise((resolve) => setTimeout(resolve, 0))
let handoffActivityNode = dockRoot.querySelector('[data-relay-id="relay-ui"]')
assert.equal(handoffActivityNode.dataset.state, 'preparing')
assert.match(handoffActivityNode.textContent, /Preparing roleplay handoff/)
assert.ok(dockRoot.querySelector(`[data-message-id="${handoffSource.id}"]`).nextElementSibling?.matches('[data-relay-id="relay-ui"]'), 'handoff activity must be anchored immediately after its chronological source message')
assert.equal(handoffScrollCount, 1, 'a newly local conversation must scroll its handoff activity into view once')

const acceptedUiState = structuredClone(localUiState)
acceptedUiState.state.relays[0].continuation = { ...acceptedUiState.state.relays[0].continuation, state: 'accepted', hostAcceptedAt: new Date().toISOString(), generationId: 'gen-ui' }
backendReceiver(acceptedUiState)
handoffActivityNode = dockRoot.querySelector('[data-relay-id="relay-ui"]')
assert.equal(handoffActivityNode.dataset.state, 'accepted')
assert.match(handoffActivityNode.textContent, /Host accepted the handoff/)
assert.equal(handoffScrollCount, 1, 'relay progress rerenders must not repeatedly steal scroll')

const generatingUiState = structuredClone(acceptedUiState)
generatingUiState.state.relays[0].injectedAt = new Date().toISOString()
generatingUiState.state.relays[0].injectedGenerationId = 'gen-ui'
generatingUiState.state.relays[0].serializedRelayChars = 812
generatingUiState.state.relays[0].serializedRelay = '=== POCKET CONTINUITY RELAY — NEWER STATE ==='
generatingUiState.state.relays[0].continuation.state = 'started'
backendReceiver(generatingUiState)
handoffActivityNode = dockRoot.querySelector('[data-relay-id="relay-ui"]')
assert.equal(handoffActivityNode.dataset.state, 'generating')
assert.match(handoffActivityNode.textContent, /Continuing in roleplay/)
assert.equal(handoffActivityNode.querySelector('.lp-typing-dots'), null, 'handoff generation must not masquerade as an incoming DM typing indicator')
assert.match(handoffActivityNode.querySelector('.lp-handoff-diagnostics').textContent, /Injected: yes · gen-ui/)
assert.match(handoffActivityNode.querySelector('.lp-handoff-diagnostics').textContent, /Serialized relay: 812 chars/)

const failedUiState = structuredClone(generatingUiState)
failedUiState.state.relays[0].injectionError = 'Host rejected the generation.'
failedUiState.state.relays[0].continuation.state = 'failed'
failedUiState.state.relays[0].continuation.error = 'Host rejected the generation.'
backendReceiver(failedUiState)
handoffActivityNode = dockRoot.querySelector('[data-relay-id="relay-ui"]')
assert.equal(handoffActivityNode.dataset.state, 'failed')
const retryHandoff = [...handoffActivityNode.querySelectorAll('button')].find((node) => node.textContent === 'Retry')
const continuationRequestsBefore = frontendSends.filter((message) => message.type === 'lumiphone:continue_relay').length
retryHandoff.click()
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:continue_relay').length, continuationRequestsBefore + 1)

const completedUiState = structuredClone(generatingUiState)
completedUiState.state.relays[0].status = 'consumed'
completedUiState.state.relays[0].continuation.state = 'completed'
completedUiState.state.relays[0].continuation.generationCompletedAt = new Date().toISOString()
backendReceiver(completedUiState)
handoffActivityNode = dockRoot.querySelector('[data-relay-id="relay-ui"]')
assert.equal(handoffActivityNode.dataset.state, 'completed')
assert.match(handoffActivityNode.textContent, /Continued in roleplay/)
assert.ok([...handoffActivityNode.querySelectorAll('button')].some((node) => node.textContent === 'Open RP'))

const groupUiState = structuredClone(completedUiState)
groupUiState.state = structuredClone(storage.get('phones/chat-a__char-a.json'))
backendReceiver(groupUiState)
backendReceiver({ type: 'lumiphone:conversation_opened', conversationId: groupId })
assert.equal(dockRoot.querySelector('.lp-speaker-select'), null, 'the permanent speaker dropdown must not occupy the composer row')
assert.match(dockRoot.querySelector('.lp-speaker-menu summary').textContent, /contacts · Auto speaker/)
const conversationMenu = dockRoot.querySelector('.lp-conversation-menu')
conversationMenu.open = true
assert.ok([...conversationMenu.querySelectorAll('button')].some((node) => node.textContent === 'Participants'))
const referenceMenuAction = [...conversationMenu.querySelectorAll('button')].find((node) => node.textContent === 'Reference in roleplay')
referenceMenuAction.click()
const referenceModal = shownModals.at(-1)
assert.equal(referenceModal.options.title, 'Reference in roleplay')
assert.equal(referenceModal.root.querySelectorAll('[data-reference-scope]').length, 3)
const selectedScope = referenceModal.root.querySelector('[data-reference-scope="selected_messages"]')
selectedScope.checked = true
selectedScope.dispatchEvent(new Event('change', { bubbles: true }))
const selectableReferenceMessages = [...referenceModal.root.querySelectorAll('[data-reference-message]')]
assert.ok(selectableReferenceMessages.length > 1)
selectableReferenceMessages.at(-1).checked = true
selectableReferenceMessages.at(-1).dispatchEvent(new Event('change', { bubbles: true }))
const referenceRequestsBefore = frontendSends.filter((message) => message.type === 'lumiphone:arm_reference').length
referenceModal.root.querySelector('.lp-button-primary').click()
const referenceRequest = frontendSends.filter((message) => message.type === 'lumiphone:arm_reference').at(-1)
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:arm_reference').length, referenceRequestsBefore + 1)
assert.equal(referenceRequest.scope, 'selected_messages')
assert.deepEqual(referenceRequest.messageIds, [selectableReferenceMessages.at(-1).value])
assert.equal(referenceModal.dismissed, true)

const armedReferenceUiState = structuredClone(groupUiState)
const sourceReference = armedReferenceUiState.state.references.find((entry) => entry.conversationId === groupId) || pocketReference
armedReferenceUiState.state.references.push({
  ...structuredClone(sourceReference), id: 'reference-ui', conversationId: groupId, conversationTitle: 'Night Shift', status: 'armed',
  injectedAt: undefined, injectedGenerationId: undefined, boundUserMessageId: undefined, serializedReferenceChars: undefined,
  serializedReference: undefined, consumedAt: undefined, consumedMessageId: undefined, error: undefined,
})
backendReceiver(armedReferenceUiState)
let referenceBanner = dockRoot.querySelector('[data-reference-id="reference-ui"]')
assert.equal(referenceBanner.dataset.state, 'armed')
assert.match(referenceBanner.textContent, /Attached to next roleplay turn/)
assert.match(referenceBanner.textContent, /does not move any participant into the scene/i)
const cancelReferenceRequestsBefore = frontendSends.filter((message) => message.type === 'lumiphone:cancel_reference').length
;[...referenceBanner.querySelectorAll('button')].find((node) => node.textContent === 'Cancel').click()
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:cancel_reference').length, cancelReferenceRequestsBefore + 1)

const injectedReferenceUiState = structuredClone(armedReferenceUiState)
Object.assign(injectedReferenceUiState.state.references.at(-1), {
  status: 'injected', injectedAt: new Date().toISOString(), injectedGenerationId: 'reference-ui-generation',
  boundUserMessageId: 'reference-ui-user', serializedReferenceChars: 1_431, serializedReference: '=== POCKET USER REFERENCE — THIS TURN ===',
})
backendReceiver(injectedReferenceUiState)
referenceBanner = dockRoot.querySelector('[data-reference-id="reference-ui"]')
assert.equal(referenceBanner.dataset.state, 'injected')
assert.match(referenceBanner.textContent, /Reference attached to roleplay generation/)
assert.match(referenceBanner.querySelector('.lp-handoff-diagnostics').textContent, /Serialized reference: 1431 chars/)

const failedReferenceUiState = structuredClone(injectedReferenceUiState)
Object.assign(failedReferenceUiState.state.references.at(-1), { status: 'failed', error: 'Provider unavailable.' })
backendReceiver(failedReferenceUiState)
referenceBanner = dockRoot.querySelector('[data-reference-id="reference-ui"]')
assert.equal(referenceBanner.dataset.state, 'failed')
assert.match(referenceBanner.textContent, /Provider unavailable/)
const rearmReferenceRequestsBefore = frontendSends.filter((message) => message.type === 'lumiphone:rearm_reference').length
;[...referenceBanner.querySelectorAll('button')].find((node) => node.textContent === 'Attach again').click()
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:rearm_reference').length, rearmReferenceRequestsBefore + 1)
const lunaGroupMessage = [...dockRoot.querySelectorAll('.lp-bubble[data-sender="contact"]')].find((node) => node.dataset.messageId && node.textContent.includes('reacting to that first message'))
assert.equal(lunaGroupMessage.parentElement.style.getPropertyValue('--message-accent'), '#12abef', 'existing group bubbles must resolve the participant’s current saved accent')
const groupRuns = [...dockRoot.querySelectorAll('.lp-group-message')]
assert.equal(groupRuns.at(-1).dataset.continuation, 'true', 'consecutive messages from one speaker must collapse repeated identity chrome')
assert.ok(groupRuns.at(-1).querySelector('.lp-group-avatar-spacer'))
const speakerMenu = dockRoot.querySelector('.lp-speaker-menu')
speakerMenu.open = true
const lunaSpeakerOption = [...speakerMenu.querySelectorAll('.lp-speaker-option')].find((node) => node.textContent.includes(savedLuna.name))
lunaSpeakerOption.click()
assert.match(dockRoot.querySelector('.lp-speaker-menu summary').textContent, /Next reply: Luna/)
const groupGenerate = dockRoot.querySelector('.lp-compose button[aria-label*="Luna"]')
const groupRequestsBefore = frontendSends.filter((message) => message.type === 'lumiphone:generate_message').length
groupGenerate.click()
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:generate_message').length, groupRequestsBefore + 1)
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:generate_message').at(-1).speakerContactId, luna.id)
assert.match(dockRoot.querySelector('.lp-speaker-menu summary').textContent, /Auto speaker/, 'manual speaker selection applies to only the next generated reply')
backendReceiver({ type: 'lumiphone:message_progress', requestId: frontendSends.filter((message) => message.type === 'lumiphone:generate_message').at(-1).requestId, chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, phase: 'done' })
backendReceiver({ type: 'lumiphone:message_progress', requestId: 'group-checking-ui', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, phase: 'checking' })
assert.match(dockRoot.querySelector('.lp-group-typing').textContent, /Night Shift/)
assert.equal(dockRoot.querySelectorAll('.lp-group-typing .lp-typing-dots i').length, 3)
backendReceiver({ type: 'lumiphone:message_progress', requestId: 'group-checking-ui', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, phase: 'pending', speakerContactId: luna.id })
assert.match(dockRoot.querySelector('.lp-group-typing').textContent, /Luna is typing/)
backendReceiver({ type: 'lumiphone:message_progress', requestId: 'group-checking-ui', chatId: 'chat-a', characterId: 'char-a', conversationId: groupId, phase: 'done' })

const draftOne = { name: 'Draft One', role: 'Scout', identityBrief: 'First unsaved attempt.', accent: '#334455', messagingStyle: { talkativeness: 60, fragmentation: 40 }, sourceDescription: 'A useful scout' }
dockRoot.querySelector('.lumiphone-homebar button').click()
const contactsIconForDraft = [...dockRoot.querySelectorAll('.lp-app-icon')].find((node) => node.textContent.includes('Contacts'))
contactsIconForDraft.click()
const addContactForDraft = [...dockRoot.querySelectorAll('.lp-nav-action')].find((node) => node.textContent === 'Add')
addContactForDraft.click()
backendReceiver({ type: 'lumiphone:contact_draft', requestId: 'ui-draft-one', draft: draftOne })
assert.match(dockRoot.textContent, /Unsaved preview/)
assert.match(dockRoot.textContent, /Draft One/)
const contactsBeforeUiRetry = groupUiState.state.contacts.length
const retryDraftButton = [...dockRoot.querySelectorAll('.lp-npc-draft button')].find((node) => node.textContent === 'Retry')
retryDraftButton.click()
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:generate_contact').at(-1).description, draftOne.sourceDescription)
assert.equal(groupUiState.state.contacts.length, contactsBeforeUiRetry)
const draftTwo = { name: 'Draft Two', role: 'Courier', identityBrief: 'Second unsaved attempt.', accent: '#556677', messagingStyle: { talkativeness: 73, fragmentation: 22 }, sourceDescription: 'A useful scout' }
backendReceiver({ type: 'lumiphone:contact_draft', requestId: 'ui-draft-two', draft: draftTwo })
assert.ok([...dockRoot.querySelectorAll('.lp-npc-draft button')].some((node) => node.textContent === 'Undo reroll'), 'one previous draft must remain recoverable')
const editDraftButton = [...dockRoot.querySelectorAll('.lp-npc-draft button')].find((node) => node.textContent === 'Edit')
editDraftButton.click()
const routeEventsBeforeDraftEdits = frontendSends.filter((message) => message.type === 'lumiphone:view_state').length
const draftColor = dockRoot.querySelector('.lp-color-input')
draftColor.value = '#abcdef'
draftColor.dispatchEvent(new Event('input', { bubbles: true }))
const draftTalk = [...dockRoot.querySelectorAll('input[type="range"]')].find((node) => node.min === '0' && node.max === '100')
draftTalk.value = '91'
draftTalk.dispatchEvent(new Event('input', { bubbles: true }))
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:view_state').length, routeEventsBeforeDraftEdits, 'draft field changes must never grow route history')
const saveDraftButton = [...dockRoot.querySelectorAll('.lp-nav-action')].find((node) => node.textContent === 'Save')
saveDraftButton.click()
const draftSavePayload = frontendSends.filter((message) => message.type === 'lumiphone:save_contact').at(-1).contact
assert.equal(draftSavePayload.accent, '#abcdef')
assert.equal(draftSavePayload.messagingStyle.talkativeness, 91)
assert.equal(frontendSends.filter((message) => message.type === 'lumiphone:view_state').length, routeEventsBeforeDraftEdits, 'Save must wait for backend acknowledgement instead of navigating optimistically')
const savedDraftId = 'saved-draft-contact'
const savedDraftState = structuredClone(groupUiState)
savedDraftState.state.contacts.push({
  ...savedDraftState.state.contacts[0], ...draftSavePayload, id: savedDraftId,
  source: { kind: 'npc', origin: 'generated', description: draftSavePayload.identityBrief }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
})
backendReceiver(savedDraftState)
backendReceiver({ type: 'lumiphone:contact_saved', requestId: 'ui-save-draft', contactId: savedDraftId })
assert.match(dockRoot.textContent, /Draft Two/)
dockRoot.querySelector('.lp-nav-action').click()
assert.match(dockRoot.textContent, /Add Contact/, 'one Back after saving a new draft must return to the ordinary import screen')

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
assert.match(dockRoot.textContent, /Notes|Edit Note/, 'activity route did not open Pocket safely')
tagReceiver({
  messageId: 'message-a', chatId: 'chat-a', attrs: { action: 'notify', app: 'home', title: 'Ping' },
  content: 'Open the phone', fullMatch: '<lumi-phone>Open the phone</lumi-phone>', isStreaming: false,
})
assert.ok(frontendSends.some((message) => message.type === 'lumiphone:model_action'))
cleanup()

console.log('Pocket contracts passed.')
