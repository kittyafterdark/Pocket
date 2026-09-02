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
for (const permission of ['generation', 'interceptor', 'tools', 'chats', 'characters', 'images', 'image_gen', 'ui_panels']) {
  assert.ok(manifest.permissions.includes(permission), `missing ${permission} permission`)
}

for (const token of ['phone_action', 'lumi-phone', 'registerInterceptor', 'resolveSwarmProfile', 'generateStream', 'owner_chat_id', 'PocketActivity', 'materializeTracker']) {
  assert.ok(backendSource.includes(token), `backend contract missing ${token}`)
}
for (const token of ['createFloatWidget', 'requestDockPanel', 'setFullscreen', 'registerTagInterceptor', 'registerInputBarAction', 'spindle:desktop-widget-returned', 'handsetScale', 'activityReceipt']) {
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
  characters: { get: async (id) => ({ id, name: 'Alice', description: 'A curious traveler.', personality: 'Warm and observant.' }) },
  chats: {
    getActive: async () => ({ id: 'chat-a', character_id: 'char-a' }),
    get: async () => ({ id: 'chat-a', character_id: 'char-a' }),
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
  generate: { quiet: async () => ({ content: 'Meet me by the station.', finish_reason: 'stop' }) },
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
assert.equal(firstState.state.version, 2)
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
assert.equal(latestState.contacts[0].messages.at(-1).text, 'Hello from the phone.')

const intercepted = await interceptorHandler([{ role: 'user', content: 'Continue.' }], {
  chatId: 'chat-a', characterId: 'char-a', userId: 'user-a',
})
assert.equal(intercepted.messages.length, 2)
assert.match(intercepted.messages[1].content, /Current Pocket snapshot/)

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
readState.contacts = [
  { id: 'char-a', name: 'Alice', subtitle: '', avatarUrl: '', unread: 1, messages: [{ id: 'm-a', sender: 'character', text: 'A', createdAt: new Date().toISOString(), read: false, status: 'delivered' }] },
  { id: 'char-b', name: 'Bob', subtitle: '', avatarUrl: '', unread: 1, messages: [{ id: 'm-b', sender: 'character', text: 'B', createdAt: new Date().toISOString(), read: false, status: 'delivered' }] },
]
readState.notifications.push({ id: 'weather-unread', app: 'weather', title: 'Rain', body: '', createdAt: new Date().toISOString(), read: false, route: { app: 'weather' } })
storage.set('phones/chat-a__char-a.json', readState)
await frontendHandler({ type: 'lumiphone:mark_read', requestId: 'read-weather', chatId: 'chat-a', characterId: 'char-a', app: 'weather' }, 'user-a')
assert.deepEqual(storage.get('phones/chat-a__char-a.json').contacts.map((contact) => contact.unread), [1, 1])
await frontendHandler({ type: 'lumiphone:mark_read', requestId: 'read-messages-root', chatId: 'chat-a', characterId: 'char-a', app: 'messages' }, 'user-a')
assert.deepEqual(storage.get('phones/chat-a__char-a.json').contacts.map((contact) => contact.unread), [1, 1])
await frontendHandler({ type: 'lumiphone:mark_read', requestId: 'read-one', chatId: 'chat-a', characterId: 'char-a', app: 'messages', contactId: 'char-a' }, 'user-a')
assert.deepEqual(storage.get('phones/chat-a__char-a.json').contacts.map((contact) => contact.unread), [0, 1])

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

await frontendHandler({
  type: 'lumiphone:model_action', requestId: 'tag-action', chatId: 'chat-a', characterId: 'char-a', messageId: 'host-message-a',
  attrs: { action: 'note', title: 'Tag journal' }, content: 'Accepted from a hidden tag', fullMatch: '<lumi-phone action="note">Accepted from a hidden tag</lumi-phone>',
  idempotencyKey: 'tag:host-message-a:note',
}, 'user-a')
const tagActivity = storage.get('phones/chat-a__char-a.json').activities.find((activity) => activity.title === 'Journal updated' && activity.source?.messageId === 'host-message-a')
assert.ok(tagActivity, 'accepted tag did not create a source-scoped activity')

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
  setTitle: () => {}, setSize(size) { this.size = size }, destroy: () => {}, onVisibilityChange: () => () => {},
}
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
    requestDockPanel: () => dockHandle,
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
const handsetHost = dockRoot.querySelector('.lumiphone-handset-host')
assert.ok(Math.abs((parseFloat(handsetHost.style.width) / parseFloat(handsetHost.style.height)) - (9 / 16)) < 0.01, 'desktop phone bounds are not 9:16')
assert.equal(dockRoot.querySelectorAll('.lp-app-icon').length, 8)
const settingsIcon = [...dockRoot.querySelectorAll('.lp-app-icon')].find((node) => node.textContent.includes('Settings'))
settingsIcon.click()
const scaleInput = [...dockRoot.querySelectorAll('input[type="range"]')].find((node) => node.min === '0.8' && node.max === '1.25')
assert.ok(scaleInput, 'semantic phone scale control was not rendered')
const initialDockSize = dockHandle.size
scaleInput.value = '0.8'
scaleInput.dispatchEvent(new Event('input', { bubbles: true }))
assert.ok(Math.abs((parseFloat(handsetHost.style.width) / parseFloat(handsetHost.style.height)) - (9 / 16)) < 0.01, 'scale update broke 9:16 bounds')
assert.ok(dockHandle.size < initialDockSize, 'scale control did not derive a new semantic dock size')
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
