import type {
  CalendarEvent,
  GalleryResult,
  PhoneCapabilities,
  PhoneContact,
  DevicePreferences,
  PhoneMessage,
  PhoneNote,
  PhoneNotification,
  PhoneState,
  PhoneTracker,
  RoleplayWeather,
  SwarmVisualProfile,
} from './types.js'
import { defaultPreferences, isFuturePreferences, normalizePreferences, PREFERENCES_PATH } from './domain/preferences.js'
import { projectPhoneContext } from './domain/projection.js'

declare const spindle: import('lumiverse-spindle-types').SpindleAPI

type AnyRecord = Record<string, unknown>

const STATE_VERSION = 1 as const
const MAX_MESSAGES = 240
const MAX_NOTIFICATIONS = 80
const MAX_NOTES = 120
const MAX_EVENTS = 200
const MAX_TRACKERS = 40
const stateLocks = new Map<string, Promise<unknown>>()
interface CameraJob { controller: AbortController; cancelled: boolean; chatId: string; characterId: string; userId?: string }
const cameraJobs = new Map<string, CameraJob>()
const notificationThrottle = new Map<string, number>()

const PHONE_GUIDANCE = `LumiPhone is available as an in-world phone shared with the current character. Use the registered phone_action tool when it is available. If tools are unavailable and a phone action materially belongs in the scene, emit exactly one hidden tag:
<lumi-phone action="message|note|event|weather|tracker|camera|notify|open" app="messages|notes|calendar|weather|trackers|camera|home" title="short title">content or compact JSON</lumi-phone>
Do not explain the tag. Do not use it for ordinary narration. Phone messages, notes, calendar events, weather, and trackers persist separately for this chat and character.`

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown, max = 4_000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function nowIso(): string {
  return new Date().toISOString()
}

function id(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 14)
  return `${prefix}_${random || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`}`
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 160) || '_none'
}

function stateKey(chatId: string, characterId: string): string {
  return `${safeSegment(chatId || '_lobby')}__${safeSegment(characterId || '_none')}`
}

function statePath(chatId: string, characterId: string): string {
  return `phones/${stateKey(chatId, characterId)}.json`
}

function defaultWeather(): RoleplayWeather {
  return {
    location: 'The current scene',
    condition: 'Clear',
    temperature: 21,
    unit: 'C',
    high: 24,
    low: 16,
    details: 'A quiet, clear day in the roleplay timeline.',
    updatedAt: nowIso(),
  }
}

function defaultState(chatId: string, characterId: string, characterName = 'Character'): PhoneState {
  const createdAt = nowIso()
  return {
    version: STATE_VERSION,
    chatId,
    characterId,
    characterName: characterName || 'Character',
    roleplayNow: createdAt,
    contacts: [{
      id: characterId || 'character',
      name: characterName || 'Character',
      subtitle: 'Available',
      avatarUrl: '',
      messages: [],
      unread: 0,
    }],
    notes: [],
    events: [],
    weather: defaultWeather(),
    trackers: [],
    notifications: [],
    processedCommands: [],
    updatedAt: createdAt,
  }
}

function normalizeMessage(value: unknown): PhoneMessage | null {
  if (!isRecord(value)) return null
  const messageText = text(value.text, 12_000)
  if (!messageText) return null
  const sender = value.sender === 'user' || value.sender === 'system' ? value.sender : 'character'
  return {
    id: text(value.id, 120) || id('msg'),
    sender,
    text: messageText,
    createdAt: text(value.createdAt, 40) || nowIso(),
    read: bool(value.read, sender !== 'character'),
    status: value.status === 'pending' || value.status === 'failed' || value.status === 'sent' || value.status === 'delivered' || value.status === 'read'
      ? value.status : bool(value.read, sender !== 'character') ? 'read' : 'delivered',
    imageId: text(value.imageId, 160) || undefined,
    imageUrl: text(value.imageUrl, 2_000) || undefined,
  }
}

function normalizeContact(value: unknown, fallbackId: string, fallbackName: string): PhoneContact | null {
  if (!isRecord(value)) return null
  const messages = (Array.isArray(value.messages) ? value.messages : [])
    .map(normalizeMessage)
    .filter((entry): entry is PhoneMessage => Boolean(entry))
    .slice(-MAX_MESSAGES)
  const contactId = text(value.id, 160) || fallbackId
  const name = text(value.name, 120) || fallbackName
  if (!contactId || !name) return null
  return {
    id: contactId,
    name,
    subtitle: text(value.subtitle, 160) || 'Available',
    avatarUrl: text(value.avatarUrl, 2_000),
    messages,
    unread: Math.max(0, Math.min(999, Math.floor(numberValue(value.unread, messages.filter((item) => !item.read).length)))),
  }
}

function normalizeState(value: unknown, chatId: string, characterId: string, characterName: string): PhoneState {
  const fallback = defaultState(chatId, characterId, characterName)
  if (!isRecord(value)) return fallback
  if (Number(value.version) > STATE_VERSION) return fallback
  const contacts = (Array.isArray(value.contacts) ? value.contacts : [])
    .map((item) => normalizeContact(item, characterId || 'character', characterName || 'Character'))
    .filter((item): item is PhoneContact => Boolean(item))
    .slice(0, 30)
  const notes: PhoneNote[] = (Array.isArray(value.notes) ? value.notes : []).slice(0, MAX_NOTES).flatMap((item) => {
    if (!isRecord(item)) return []
    const body = text(item.body, 40_000)
    const title = text(item.title, 180) || body.slice(0, 36) || 'Untitled note'
    return [{
      id: text(item.id, 120) || id('note'), title, body,
      mood: text(item.mood, 80), pinned: bool(item.pinned),
      author: item.author === 'character' || item.author === 'model' || item.author === 'shared' ? item.author : 'user',
      createdAt: text(item.createdAt, 40) || nowIso(), updatedAt: text(item.updatedAt, 40) || nowIso(),
    }]
  })
  const events: CalendarEvent[] = (Array.isArray(value.events) ? value.events : []).slice(0, MAX_EVENTS).flatMap((item) => {
    if (!isRecord(item)) return []
    const title = text(item.title, 180)
    if (!title) return []
    const createdBy = item.createdBy === 'character' || item.createdBy === 'model' ? item.createdBy : 'user'
    return [{
      id: text(item.id, 120) || id('evt'), title,
      description: text(item.description, 8_000), start: text(item.start, 80) || nowIso(),
      end: text(item.end, 80) || text(item.start, 80) || nowIso(), color: text(item.color, 40) || '#8b7dff',
      whenKind: item.whenKind === 'approximate' || item.whenKind === 'relative' || item.whenKind === 'unscheduled' ? item.whenKind : 'exact',
      whenText: text(item.whenText, 240) || text(item.start, 80) || 'Unscheduled',
      lane: text(item.lane, 80) || 'Main timeline', completed: bool(item.completed), createdBy,
    }]
  })
  const trackers: PhoneTracker[] = (Array.isArray(value.trackers) ? value.trackers : []).slice(0, MAX_TRACKERS).flatMap((item) => {
    if (!isRecord(item)) return []
    const label = text(item.label, 120)
    if (!label) return []
    const min = numberValue(item.min, 0)
    const max = Math.max(min, numberValue(item.max, 100))
    return [{
      id: text(item.id, 120) || id('trk'), label,
      value: Math.max(min, Math.min(max, numberValue(item.value, min))), min, max,
      unit: text(item.unit, 40), color: text(item.color, 40) || '#8b7dff',
      ratePerHour: Math.max(-100_000, Math.min(100_000, numberValue(item.ratePerHour, 0))),
      lastUpdated: text(item.lastUpdated, 40) || nowIso(), visibleToModel: item.visibleToModel !== false,
    }]
  })
  const notifications: PhoneNotification[] = (Array.isArray(value.notifications) ? value.notifications : []).slice(0, MAX_NOTIFICATIONS).flatMap((item) => {
    if (!isRecord(item)) return []
    const title = text(item.title, 160)
    if (!title) return []
    return [{
      id: text(item.id, 120) || id('ntf'), app: text(item.app, 40) as PhoneNotification['app'] || 'home',
      title, body: text(item.body, 1_000), createdAt: text(item.createdAt, 40) || nowIso(),
      read: bool(item.read), action: text(item.action, 120) || undefined,
    }]
  })
  const processedCommands = (Array.isArray(value.processedCommands) ? value.processedCommands : []).slice(-160).flatMap((item) => {
    if (!isRecord(item)) return []
    const commandId = text(item.id, 240)
    if (!commandId) return []
    return [{ id: commandId, semanticKey: text(item.semanticKey, 500), createdAt: text(item.createdAt, 40) || nowIso() }]
  })
  const weatherValue = isRecord(value.weather) ? value.weather : {}
  const weather: RoleplayWeather = {
    location: text(weatherValue.location, 160) || fallback.weather.location,
    condition: text(weatherValue.condition, 120) || fallback.weather.condition,
    temperature: numberValue(weatherValue.temperature, fallback.weather.temperature),
    unit: weatherValue.unit === 'F' ? 'F' : 'C',
    high: numberValue(weatherValue.high, fallback.weather.high),
    low: numberValue(weatherValue.low, fallback.weather.low),
    details: text(weatherValue.details, 2_000) || fallback.weather.details,
    updatedAt: text(weatherValue.updatedAt, 40) || nowIso(),
  }
  return {
    version: STATE_VERSION,
    chatId,
    characterId,
    characterName: characterName || text(value.characterName, 120) || fallback.characterName,
    roleplayNow: text(value.roleplayNow, 80) || fallback.roleplayNow,
    contacts: contacts.length ? contacts : fallback.contacts,
    notes, events, weather, trackers, notifications, processedCommands,
    updatedAt: text(value.updatedAt, 40) || fallback.updatedAt,
  }
}

async function characterNameFor(characterId: string, userId?: string): Promise<string> {
  if (!characterId || !spindle.permissions.has('characters')) return 'Character'
  try {
    const character = await (spindle.characters.get as any)(characterId, userId)
    return text(character?.name, 120) || 'Character'
  } catch {
    return 'Character'
  }
}

async function loadState(chatId: string, characterId: string, userId?: string): Promise<PhoneState> {
  const characterName = await characterNameFor(characterId, userId)
  const raw = await spindle.userStorage.getJson<unknown>(statePath(chatId, characterId), {
    fallback: null,
    userId,
  })
  if (isRecord(raw) && Number(raw.version) > STATE_VERSION) throw new Error('This phone state was created by a newer LumiPhone version.')
  const state = normalizeState(raw, chatId, characterId, characterName)
  await loadPreferences(userId, isRecord(raw) ? raw.settings : undefined)
  if (isRecord(raw) && Number(raw.version || 0) <= STATE_VERSION && (raw.settings !== undefined || Number(raw.version || 0) < STATE_VERSION)) {
    await spindle.userStorage.setJson(statePath(chatId, characterId), state, { indent: 2, userId })
  }
  state.trackers = materializeTrackers(state.trackers)
  const contact = state.contacts.find((item) => item.id === characterId)
  if (contact && characterName !== 'Character') contact.name = characterName
  state.characterName = characterName
  return state
}

async function loadPreferences(userId?: string, legacy?: unknown): Promise<DevicePreferences> {
  const raw = await spindle.userStorage.getJson<unknown>(PREFERENCES_PATH, { fallback: null, userId })
  const preferences = normalizePreferences(raw ?? legacy)
  if (isFuturePreferences(raw)) {
    spindle.log.warn('LumiPhone left newer device preferences untouched and used safe defaults for this session.')
    return preferences
  }
  if (raw === null || Number((isRecord(raw) ? raw.version : 0)) !== preferences.version) {
    await spindle.userStorage.setJson(PREFERENCES_PATH, preferences, { indent: 2, userId })
  }
  return preferences
}

async function savePreferences(value: unknown, userId?: string): Promise<DevicePreferences> {
  const preferences = normalizePreferences(value)
  await spindle.userStorage.setJson(PREFERENCES_PATH, preferences, { indent: 2, userId })
  return preferences
}

async function saveState(state: PhoneState, userId?: string): Promise<void> {
  state.updatedAt = nowIso()
  await spindle.userStorage.setJson(statePath(state.chatId, state.characterId), state, { indent: 2, userId })
}

function materializeTrackers(trackers: PhoneTracker[]): PhoneTracker[] {
  const now = Date.now()
  return trackers.map((tracker) => {
    if (!tracker.ratePerHour) return tracker
    const last = Date.parse(tracker.lastUpdated)
    if (!Number.isFinite(last) || last >= now) return tracker
    const elapsedHours = (now - last) / 3_600_000
    return {
      ...tracker,
      value: Math.max(tracker.min, Math.min(tracker.max, tracker.value + elapsedHours * tracker.ratePerHour)),
      lastUpdated: new Date(now).toISOString(),
    }
  })
}

function withStateLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = stateLocks.get(key) || Promise.resolve()
  const current = previous.catch(() => undefined).then(task)
  stateLocks.set(key, current)
  void current.finally(() => {
    if (stateLocks.get(key) === current) stateLocks.delete(key)
  })
  return current
}

function capabilities(): PhoneCapabilities {
  return {
    generation: spindle.permissions.has('generation'), interceptor: spindle.permissions.has('interceptor'),
    tools: spindle.permissions.has('tools'), chats: spindle.permissions.has('chats'),
    characters: spindle.permissions.has('characters'), personas: spindle.permissions.has('personas'),
    images: spindle.permissions.has('images'), imageGen: spindle.permissions.has('image_gen'),
    panels: spindle.permissions.has('ui_panels'), push: spindle.permissions.has('push_notification'),
  }
}

function send(payload: unknown, userId?: string): void {
  spindle.sendToFrontend(payload, userId)
}

async function sendState(state: PhoneState, userId?: string, reason = 'refresh', open = false): Promise<void> {
  send({ type: 'lumiphone:state', state, preferences: await loadPreferences(userId), capabilities: capabilities(), reason, open }, userId)
}

function addNotification(state: PhoneState, notification: Omit<PhoneNotification, 'id' | 'createdAt' | 'read'>): PhoneNotification {
  const entry: PhoneNotification = { ...notification, id: id('ntf'), createdAt: nowIso(), read: false }
  state.notifications.unshift(entry)
  state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS)
  return entry
}

async function maybePush(state: PhoneState, preferences: DevicePreferences, notification: PhoneNotification, userId?: string): Promise<void> {
  if (!preferences.pushNotifications || !spindle.permissions.has('push_notification')) return
  const throttleKey = `${userId || '_default'}:${stateKey(state.chatId, state.characterId)}:${notification.app}`
  const lastSent = notificationThrottle.get(throttleKey) || 0
  if (Date.now() - lastSent < 15_000) return
  notificationThrottle.set(throttleKey, Date.now())
  try {
    const status = await spindle.push.getStatus(userId)
    if (!status.available) return
    await spindle.push.send({
      title: notification.title,
      body: notification.body || `Open ${notification.app} on LumiPhone`,
      tag: `lumiphone-${stateKey(state.chatId, state.characterId)}-${notification.app}`,
      url: `/chat/${state.chatId}`,
    }, userId)
  } catch (error) {
    spindle.log.warn(`LumiPhone push notification failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function resolveContext(input: AnyRecord, userId?: string): Promise<{ chatId: string; characterId: string }> {
  let chatId = text(input.chat_id ?? input.chatId, 180)
  let characterId = text(input.character_id ?? input.characterId, 180)
  if ((!chatId || !characterId) && spindle.permissions.has('chats')) {
    try {
      const active = await (spindle.chats.getActive as any)(userId)
      chatId ||= text(active?.id, 180)
      characterId ||= text(active?.character_id, 180)
    } catch { /* use explicit context */ }
  }
  return { chatId: chatId || '_lobby', characterId: characterId || '_none' }
}

async function resolveSwarmProfile(chatId: string, characterId: string, settings?: DevicePreferences): Promise<SwarmVisualProfile> {
  const manual = settings?.manualVisualProfile || defaultPreferences().manualVisualProfile
  const fallback: SwarmVisualProfile = {
    available: false,
    characterPositive: manual.positive,
    personaPositive: '',
    negative: manual.negative,
    presets: '',
    checkpoint: manual.model,
    aspect: '',
    source: 'manual',
  }
  if (!settings?.useSwarmProfile) return fallback
  try {
    const marker = '\n__LUMIPHONE_PROFILE_FIELD__\n'
    const template = ['{{char_base}}', '{{persona_base}}', '{{swarm_negative}}', '{{swarm_preset}}', '{{swarm_checkpoint}}', '{{swarm_aspect}}'].join(marker)
    const result = await spindle.macros.resolve(template, { chatId, characterId, commit: false })
    const fields = result.text.split(marker).map((part) => part.trim().replace(/^\{\{[^}]+\}\}$/, ''))
    const [characterPositive = '', personaPositive = '', negative = '', presets = '', checkpoint = '', aspect = ''] = fields
    const available = Boolean(characterPositive || personaPositive || negative || presets || checkpoint || aspect)
    if (!available) return fallback
    return {
      available,
      characterPositive: [manual.positive, characterPositive].filter(Boolean).join(', '),
      personaPositive,
      negative: [manual.negative, negative].filter(Boolean).join(', '),
      presets,
      checkpoint: manual.model || checkpoint,
      aspect,
      source: 'swarm_studio',
    }
  } catch {
    return fallback
  }
}

async function listGallery(input: AnyRecord, userId?: string): Promise<GalleryResult> {
  if (!spindle.permissions.has('images')) throw new Error('Enable the Images permission to use Gallery.')
  const context = await resolveContext(input, userId)
  const scope = text(input.scope, 30) || 'chat'
  const options: AnyRecord = { limit: 120, offset: 0, specificity: 'sm', userId }
  if (scope === 'chat') options.chatId = context.chatId
  if (scope === 'character') options.characterId = context.characterId
  if (scope === 'phone') options.onlyOwned = true
  const result = await spindle.images.list(options as any)
  return {
    total: result.total,
    data: result.data.map((item) => ({
      id: item.id, url: item.url, filename: item.original_filename, mimeType: item.mime_type,
      width: item.width, height: item.height, createdAt: item.created_at,
    })),
  }
}

async function enhanceScene(scene: string, state: PhoneState, preferences: DevicePreferences, profile: SwarmVisualProfile, userId?: string): Promise<string> {
  if (!preferences.sceneEnhancer || !spindle.permissions.has('generation')) return scene
  const response: any = await spindle.generate.quiet({
    type: 'quiet',
    messages: [
      { role: 'system', content: 'You are a concise image scene planner. Expand the user brief into one vivid diffusion-ready prompt. Preserve identity facts, subject count, action, camera, environment, lighting, and mood. Do not add names, explanations, headings, negative prompts, or markdown.' },
      { role: 'user', content: `Roleplay context: ${state.weather.location}; ${state.weather.condition}. Visual profile source: ${profile.source}.\nScene brief: ${scene}` },
    ],
    parameters: { temperature: 0.45, max_tokens: 450 },
    reasoning: { source: 'off' },
    userId,
  })
  return text(response.content, 12_000) || scene
}

async function cameraGenerate(input: AnyRecord, userId?: string): Promise<AnyRecord> {
  if (!spindle.permissions.has('image_gen')) throw new Error('Enable the Image Generation permission to use Camera.')
  const context = await resolveContext(input, userId)
  const state = await loadState(context.chatId, context.characterId, userId)
  const preferences = await loadPreferences(userId)
  const requestId = text(input.requestId, 180) || id('cam')
  const scene = text(input.scene ?? input.prompt ?? input.text ?? input.content, 12_000)
  if (!scene) throw new Error('Describe the scene you want the camera to capture.')
  const profile = await resolveSwarmProfile(context.chatId, context.characterId, preferences)
  const controller = new AbortController()
  const job: CameraJob = { controller, cancelled: false, chatId: context.chatId, characterId: context.characterId, userId }
  cameraJobs.get(requestId)?.controller.abort()
  cameraJobs.set(requestId, job)
  send({ type: 'lumiphone:camera_progress', requestId, phase: 'planning', message: 'Planning the scene…', profile }, userId)
  let expanded = scene
  if (bool(input.enhance, preferences.sceneEnhancer)) {
    try {
      expanded = await enhanceScene(scene, state, preferences, profile, userId)
    } catch (error) {
      spindle.log.warn(`LumiPhone scene planner fell back to the original brief: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  if (job.cancelled) return { ok: false, cancelled: true }
  const presets = profile.presets ? `${profile.presets}, ` : ''
  const prompt = [presets + profile.characterPositive, profile.personaPositive, expanded].filter(Boolean).join(', ')
  const manual = preferences.manualVisualProfile
  const parameters: AnyRecord = { ...manual.parameters, ...(isRecord(input.parameters) ? input.parameters : {}) }
  if (manual.loras.length && parameters.loras === undefined) parameters.loras = manual.loras
  const connectionId = text(input.connectionId, 200) || manual.connectionId
  const model = text(input.model, 500) || profile.checkpoint
  let result: any = null
  try {
    let canStream = false
    let resolvedConnection = connectionId
    try {
      const connections = await spindle.imageGen.listConnections(userId)
      const connection = resolvedConnection
        ? connections.find((item) => item.id === resolvedConnection)
        : connections.find((item) => item.is_default) || connections[0]
      resolvedConnection ||= connection?.id || ''
      const providers = await spindle.imageGen.getProviders(userId)
      const provider = providers.find((item) => item.id === connection?.provider)
      canStream = Boolean(provider?.capabilities.websocketPreviewStreaming)
    } catch { /* regular generation remains available */ }
    const generationInput: any = {
      prompt,
      negativePrompt: profile.negative,
      parameters,
      owner_character_id: context.characterId === '_none' ? undefined : context.characterId,
      owner_chat_id: context.chatId === '_lobby' ? undefined : context.chatId,
      userId,
      includeDataUrl: false,
    }
    if (resolvedConnection) generationInput.connection_id = resolvedConnection
    if (model) generationInput.model = model
    if (canStream) {
      generationInput.signal = controller.signal
      for await (const event of spindle.imageGen.generateStream(generationInput)) {
        if (job.cancelled) break
        if (event.type === 'status') {
          send({ type: 'lumiphone:camera_progress', requestId, phase: 'generating', step: event.step, totalSteps: event.totalSteps, message: event.nodeId ? `Working on ${event.nodeId}…` : 'Developing the image…' }, userId)
        } else if (event.type === 'preview') {
          send({ type: 'lumiphone:camera_progress', requestId, phase: 'preview', imageDataUrl: event.imageDataUrl, step: event.step, totalSteps: event.totalSteps }, userId)
        } else if (event.type === 'done') result = event.result
      }
    } else {
      send({ type: 'lumiphone:camera_progress', requestId, phase: 'generating', message: 'Developing the image…' }, userId)
      result = await spindle.imageGen.generate(generationInput)
    }
  } finally {
    if (cameraJobs.get(requestId) === job) cameraJobs.delete(requestId)
  }
  if (job.cancelled) return { ok: false, cancelled: true }
  if (!result) throw new Error('The camera did not return an image.')
  const imageUrl = text(result.imageUrl, 2_000)
  const imageId = text(result.imageId, 200)
  const notification = addNotification(state, {
    app: 'camera', title: 'Photo ready', body: scene.slice(0, 180), action: imageId || undefined,
  })
  await saveState(state, userId)
  await maybePush(state, preferences, notification, userId)
  await sendState(state, userId, 'camera', false)
  send({ type: 'lumiphone:camera_done', requestId, imageId, imageUrl, prompt: expanded, profile }, userId)
  return { ok: true, imageId, imageUrl, prompt: expanded, profileSource: profile.source }
}

async function generateMessage(input: AnyRecord, userId?: string): Promise<void> {
  if (!spindle.permissions.has('generation')) throw new Error('Enable the Generation permission to create an in-phone reply.')
  const context = await resolveContext(input, userId)
  const requestId = text(input.requestId, 180) || id('reply')
  const key = stateKey(context.chatId, context.characterId)
  await withStateLock(key, async () => {
    const state = await loadState(context.chatId, context.characterId, userId)
    const preferences = await loadPreferences(userId)
    const contactId = text(input.contactId, 180) || context.characterId
    const contact = state.contacts.find((item) => item.id === contactId) || state.contacts[0]
    send({ type: 'lumiphone:message_progress', requestId, chatId: context.chatId, characterId: context.characterId, contactId: contact.id, phase: 'pending' }, userId)
    const character = spindle.permissions.has('characters') && context.characterId !== '_none'
      ? await (spindle.characters.get as any)(context.characterId, userId).catch(() => null)
      : null
    const history = contact.messages.slice(-24).map((message) => `${message.sender === 'user' ? 'User' : contact.name}: ${message.text}`).join('\n')
    const instruction = text(input.instruction, 2_000) || 'Reply naturally to the latest message.'
    const response: any = await spindle.generate.quiet({
      type: 'quiet',
      messages: [
        { role: 'system', content: `Write one private phone text as ${contact.name}. Stay in character. Return only the message text, without a name label, quotes, narration, or XML.\nCharacter description: ${text(character?.description, 8_000)}\nPersonality: ${text(character?.personality, 4_000)}` },
        { role: 'user', content: `Conversation:\n${history || '(no messages yet)'}\n\nDirection: ${instruction}` },
      ],
      parameters: { temperature: 0.85, max_tokens: 500 },
      userId,
    })
    const reply = text(response.content, 8_000)
    if (!reply) throw new Error('The character did not return a phone message.')
    contact.messages.push({ id: id('msg'), sender: 'character', text: reply, createdAt: nowIso(), read: false, status: 'delivered' })
    contact.messages = contact.messages.slice(-MAX_MESSAGES)
    contact.unread += 1
    const notification = addNotification(state, { app: 'messages', title: contact.name, body: reply.slice(0, 220), action: contact.id })
    await saveState(state, userId)
    await maybePush(state, preferences, notification, userId)
    await sendState(state, userId, 'message', preferences.autoOpenOnModelAction)
    send({ type: 'lumiphone:message_progress', requestId, chatId: context.chatId, characterId: context.characterId, contactId: contact.id, phase: 'done' }, userId)
  })
}

function parseTagContent(content: string): AnyRecord {
  const trimmed = content.trim()
  if (!trimmed.startsWith('{')) return { text: trimmed }
  try {
    const parsed = JSON.parse(trimmed)
    return isRecord(parsed) ? parsed : { text: trimmed }
  } catch {
    return { text: trimmed }
  }
}

function actionSemanticKey(action: string, input: AnyRecord, payload: AnyRecord): string {
  const merged: AnyRecord = { ...input, ...payload }
  for (const key of ['type', 'requestId', 'request_id', 'commandId', 'command_id', 'idempotencyKey', 'chatId', 'chat_id', 'characterId', 'character_id', 'payload']) delete merged[key]
  const normalized = Object.keys(merged).sort().reduce<AnyRecord>((result, key) => {
    const value = merged[key]
    result[key] = typeof value === 'string' ? value.trim() : value
    return result
  }, {})
  return `${action}:${JSON.stringify(normalized).slice(0, 4_000)}`
}

function reserveCommand(state: PhoneState, input: AnyRecord, action: string, payload: AnyRecord, source: 'model' | 'user' | 'tag'): boolean {
  const commandId = text(input.idempotencyKey ?? input.commandId ?? input.command_id ?? input.requestId, 240)
  const semanticKey = actionSemanticKey(action, input, payload)
  const cutoff = Date.now() - 20_000
  if (commandId && state.processedCommands.some((entry) => entry.id === commandId)) return false
  if (source !== 'user' && state.processedCommands.some((entry) => entry.semanticKey === semanticKey && Date.parse(entry.createdAt) >= cutoff)) return false
  state.processedCommands.push({ id: commandId || id('cmd'), semanticKey, createdAt: nowIso() })
  state.processedCommands = state.processedCommands.slice(-160)
  return true
}

async function applyAction(input: AnyRecord, userId?: string, source: 'model' | 'user' | 'tag' = 'model'): Promise<AnyRecord> {
  const context = await resolveContext(input, userId)
  const action = text(input.action, 40).toLowerCase()
  const key = stateKey(context.chatId, context.characterId)
  const payload = isRecord(input.payload) ? input.payload : input
  if (action === 'camera') {
    const reserved = await withStateLock(key, async () => {
      const state = await loadState(context.chatId, context.characterId, userId)
      if (!reserveCommand(state, input, action, payload, source)) return false
      await saveState(state, userId)
      return true
    })
    return reserved ? cameraGenerate(input, userId) : { ok: true, action, deduplicated: true }
  }
  return withStateLock(key, async () => {
    const state = await loadState(context.chatId, context.characterId, userId)
    const preferences = await loadPreferences(userId)
    if (!reserveCommand(state, input, action, payload, source)) return { ok: true, action, deduplicated: true }
    let notification: PhoneNotification | null = null
    let result: AnyRecord = { ok: true, action }
    if (action === 'open') {
      await saveState(state, userId)
      await sendState(state, userId, 'open', true)
      return result
    }
    if (action === 'message') {
      const contactId = text(payload.contact_id ?? payload.contactId, 180) || context.characterId
      let contact = state.contacts.find((item) => item.id === contactId)
      if (!contact) {
        contact = { id: contactId || id('contact'), name: text(payload.contact_name ?? payload.contactName, 120) || state.characterName, subtitle: 'Available', avatarUrl: '', messages: [], unread: 0 }
        state.contacts.push(contact)
      }
      const messageText = text(payload.text ?? payload.content, 12_000)
      if (!messageText) throw new Error('A phone message needs text.')
      const sender = source === 'user' || payload.sender === 'user' ? 'user' : 'character'
      contact.messages.push({ id: id('msg'), sender, text: messageText, createdAt: nowIso(), read: sender === 'user', status: sender === 'user' ? 'sent' : 'delivered' })
      contact.messages = contact.messages.slice(-MAX_MESSAGES)
      if (sender === 'character') contact.unread += 1
      notification = sender === 'character' ? addNotification(state, { app: 'messages', title: contact.name, body: messageText.slice(0, 220), action: contact.id }) : null
      result = { ...result, contactId: contact.id, messageId: contact.messages.at(-1)?.id }
    } else if (action === 'note') {
      const noteId = text(payload.id, 120)
      const existing = state.notes.find((item) => item.id === noteId)
      const body = text(payload.body ?? payload.text ?? payload.content, 40_000)
      const title = text(payload.title, 180) || body.slice(0, 42) || 'Journal entry'
      if (existing) {
        Object.assign(existing, { title, body, mood: text(payload.mood, 80), pinned: bool(payload.pinned, existing.pinned), updatedAt: nowIso() })
        result.noteId = existing.id
      } else {
        const note: PhoneNote = { id: id('note'), title, body, mood: text(payload.mood, 80), pinned: bool(payload.pinned), author: source === 'user' ? 'user' : source === 'tag' ? 'character' : 'model', createdAt: nowIso(), updatedAt: nowIso() }
        state.notes.unshift(note)
        state.notes = state.notes.slice(0, MAX_NOTES)
        result.noteId = note.id
      }
      if (source !== 'user') notification = addNotification(state, { app: 'notes', title: 'Journal updated', body: title, action: String(result.noteId) })
    } else if (action === 'event') {
      const eventId = text(payload.id, 120)
      const existing = state.events.find((item) => item.id === eventId)
      const title = text(payload.title, 180) || 'Untitled event'
      const start = text(payload.start, 80) || state.roleplayNow
      const event: CalendarEvent = {
        id: existing?.id || id('evt'), title, description: text(payload.description ?? payload.text, 8_000),
        start, end: text(payload.end, 80) || start, color: text(payload.color, 40) || preferences.colors.accent,
        whenKind: payload.whenKind === 'approximate' || payload.whenKind === 'relative' || payload.whenKind === 'unscheduled' ? payload.whenKind : 'exact',
        whenText: text(payload.whenText, 240) || start,
        lane: text(payload.lane, 80) || 'Main timeline', completed: bool(payload.completed, existing?.completed),
        createdBy: source === 'user' ? 'user' : source === 'tag' ? 'character' : 'model',
      }
      if (existing) Object.assign(existing, event)
      else state.events.push(event)
      state.events = state.events.slice(-MAX_EVENTS)
      notification = source !== 'user' ? addNotification(state, { app: 'calendar', title: 'Timeline updated', body: title, action: event.id }) : null
      result.eventId = event.id
    } else if (action === 'weather') {
      state.weather = {
        location: text(payload.location, 160) || state.weather.location,
        condition: text(payload.condition, 120) || state.weather.condition,
        temperature: numberValue(payload.temperature, state.weather.temperature),
        unit: payload.unit === 'F' ? 'F' : 'C',
        high: numberValue(payload.high, state.weather.high), low: numberValue(payload.low, state.weather.low),
        details: text(payload.details ?? payload.text, 2_000) || state.weather.details, updatedAt: nowIso(),
      }
      notification = source !== 'user' ? addNotification(state, { app: 'weather', title: state.weather.location, body: `${state.weather.condition}, ${state.weather.temperature}°${state.weather.unit}` }) : null
    } else if (action === 'tracker') {
      const trackerId = text(payload.id, 120)
      const existing = state.trackers.find((item) => item.id === trackerId || item.label.toLowerCase() === text(payload.label, 120).toLowerCase())
      const min = numberValue(payload.min, existing?.min ?? 0)
      const max = Math.max(min, numberValue(payload.max, existing?.max ?? 100))
      const next: PhoneTracker = {
        id: existing?.id || id('trk'), label: text(payload.label, 120) || existing?.label || 'Tracker',
        value: Math.max(min, Math.min(max, numberValue(payload.value, existing?.value ?? min))), min, max,
        unit: text(payload.unit, 40) || existing?.unit || '', color: text(payload.color, 40) || existing?.color || preferences.colors.accent,
        ratePerHour: numberValue(payload.ratePerHour ?? payload.rate_per_hour, existing?.ratePerHour ?? 0),
        lastUpdated: nowIso(), visibleToModel: payload.visibleToModel === undefined ? existing?.visibleToModel !== false : bool(payload.visibleToModel),
      }
      if (existing) Object.assign(existing, next)
      else state.trackers.push(next)
      state.trackers = state.trackers.slice(-MAX_TRACKERS)
      notification = source !== 'user' ? addNotification(state, { app: 'trackers', title: next.label, body: `${Number(next.value.toFixed(2))}${next.unit}` }) : null
      result.trackerId = next.id
    } else if (action === 'notify') {
      const requestedApp = text(payload.app ?? input.app, 40)
      const allowedApps = new Set(['home', 'messages', 'gallery', 'camera', 'notes', 'weather', 'calendar', 'trackers', 'settings'])
      notification = addNotification(state, {
        app: (allowedApps.has(requestedApp) ? requestedApp : 'home') as PhoneNotification['app'],
        title: text(payload.title ?? input.title, 160) || 'LumiPhone', body: text(payload.body ?? payload.text ?? payload.content, 1_000),
      })
    } else {
      throw new Error(`Unsupported phone action: ${action || '(empty)'}`)
    }
    await saveState(state, userId)
    if (notification) await maybePush(state, preferences, notification, userId)
    await sendState(state, userId, action, source !== 'user' && preferences.autoOpenOnModelAction)
    return result
  })
}

async function handleFrontend(payload: unknown, userId?: string): Promise<void> {
  if (!isRecord(payload) || !text(payload.type, 120).startsWith('lumiphone:')) return
  const requestId = text(payload.requestId, 180)
  try {
    const context = await resolveContext(payload, userId)
    switch (payload.type) {
      case 'lumiphone:get_state': {
        const state = await loadState(context.chatId, context.characterId, userId)
        const preferences = await loadPreferences(userId)
        const swarmProfile = await resolveSwarmProfile(context.chatId, context.characterId, preferences)
        send({ type: 'lumiphone:state', requestId, state, preferences, capabilities: capabilities(), swarmProfile, reason: 'load' }, userId)
        break
      }
      case 'lumiphone:save_preferences':
      case 'lumiphone:save_settings': {
        const existing = await loadPreferences(userId)
        await savePreferences({ ...existing, ...(isRecord(payload.preferences) ? payload.preferences : isRecord(payload.settings) ? payload.settings : {}) }, userId)
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, 'preferences')
        break
      }
      case 'lumiphone:save_roleplay_time': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          state.roleplayNow = text(payload.roleplayNow, 80) || state.roleplayNow
          await saveState(state, userId)
          await sendState(state, userId, 'calendar')
        })
        break
      }
      case 'lumiphone:action':
        await applyAction(payload, userId, 'user')
        break
      case 'lumiphone:model_action': {
        const attrs = isRecord(payload.attrs) ? payload.attrs : {}
        const tagPayload = {
          ...parseTagContent(text(payload.content, 40_000)), ...attrs,
          action: text(attrs.action, 40), chat_id: context.chatId, character_id: context.characterId,
          idempotencyKey: text(payload.idempotencyKey, 240) || `tag:${text(payload.messageId, 180)}:${text(payload.fullMatch, 1_000)}`,
        }
        await applyAction(tagPayload, userId, 'tag')
        break
      }
      case 'lumiphone:generate_message':
        await generateMessage(payload, userId)
        break
      case 'lumiphone:gallery_list':
        send({ type: 'lumiphone:gallery', requestId, scope: payload.scope, ...(await listGallery(payload, userId)) }, userId)
        break
      case 'lumiphone:camera_generate':
        await cameraGenerate(payload, userId)
        break
      case 'lumiphone:camera_cancel': {
        const job = cameraJobs.get(requestId)
        if (job) job.cancelled = true
        job?.controller.abort()
        cameraJobs.delete(requestId)
        send({ type: 'lumiphone:camera_cancelled', requestId }, userId)
        break
      }
      case 'lumiphone:mark_read': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const app = text(payload.app, 40)
          state.notifications.forEach((entry) => { if (!app || entry.app === app) entry.read = true })
          const contactId = text(payload.contactId, 180)
          const contacts = contactId ? state.contacts.filter((entry) => entry.id === contactId) : state.contacts
          contacts.forEach((contact) => { contact.unread = 0; contact.messages.forEach((message) => { message.read = true; message.status = 'read' }) })
          await saveState(state, userId)
          await sendState(state, userId, 'read')
        })
        break
      }
      case 'lumiphone:delete': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const kind = text(payload.kind, 30)
          const targetId = text(payload.id, 120)
          if (kind === 'note') state.notes = state.notes.filter((entry) => entry.id !== targetId)
          if (kind === 'event') state.events = state.events.filter((entry) => entry.id !== targetId)
          if (kind === 'tracker') state.trackers = state.trackers.filter((entry) => entry.id !== targetId)
          await saveState(state, userId)
          await sendState(state, userId, 'delete')
        })
        break
      }
      case 'lumiphone:get_swarm_profile': {
        send({ type: 'lumiphone:swarm_profile', requestId, profile: await resolveSwarmProfile(context.chatId, context.characterId, await loadPreferences(userId)) }, userId)
        break
      }
      case 'lumiphone:export_data': {
        const state = await loadState(context.chatId, context.characterId, userId)
        send({ type: 'lumiphone:export_data', requestId, data: { exportVersion: 1, state: { ...state, processedCommands: [] }, preferences: await loadPreferences(userId) } }, userId)
        break
      }
      case 'lumiphone:import_data': {
        if (!isRecord(payload.data)) throw new Error('Import must be a LumiPhone JSON object.')
        const rawState = isRecord(payload.data.state) ? payload.data.state : payload.data
        if (Number(rawState.version) > STATE_VERSION) throw new Error('This backup uses a newer LumiPhone state schema.')
        const characterName = await characterNameFor(context.characterId, userId)
        const state = normalizeState(rawState, context.chatId, context.characterId, characterName)
        await saveState(state, userId)
        if (payload.data.preferences !== undefined) await savePreferences(payload.data.preferences, userId)
        await sendState(state, userId, 'import')
        break
      }
      case 'lumiphone:reset_current': {
        const state = defaultState(context.chatId, context.characterId, await characterNameFor(context.characterId, userId))
        await saveState(state, userId)
        await sendState(state, userId, 'reset_current')
        break
      }
      case 'lumiphone:reset_all_roleplay': {
        const files = await spindle.userStorage.list('phones/', userId)
        await Promise.all(files.filter((path) => path.startsWith('phones/')).map((path) => spindle.userStorage.delete(path, userId)))
        const state = defaultState(context.chatId, context.characterId, await characterNameFor(context.characterId, userId))
        await saveState(state, userId)
        await sendState(state, userId, 'reset_all_roleplay')
        break
      }
      case 'lumiphone:reset_preferences': {
        await savePreferences(defaultPreferences(), userId)
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, 'reset_preferences')
        break
      }
      default:
        break
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    spindle.log.error(`LumiPhone request failed: ${message}`)
    send({ type: 'lumiphone:error', requestId, error: message }, userId)
  }
}

function registerTool(): void {
  if (!spindle.permissions.has('tools')) return
  spindle.registerTool({
    name: 'phone_action',
    display_name: 'LumiPhone Action',
    description: 'Use the character-aware roleplay phone: send a text, write a journal note, schedule a calendar/timeline event, change fictional weather, create or update a tracker, take an AI camera photo, show a phone notification, or open the phone. State persists per chat and character.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['message', 'note', 'event', 'weather', 'tracker', 'camera', 'notify', 'open'] },
        chat_id: { type: 'string', description: 'Current chat id when known.' },
        character_id: { type: 'string', description: 'Current character id when known.' },
        payload: {
          type: 'object',
          description: 'Action data. message: text/contact_name; note: title/body/mood/pinned; event: title/description/start/end/lane; weather: location/condition/temperature/unit; tracker: label/value/min/max/unit/ratePerHour; camera: prompt/enhance; notify: app/title/body.',
          additionalProperties: true,
        },
      },
      required: ['action', 'payload'],
    },
    council_eligible: false,
  } as any)
}

let interceptorDisposer: (() => void) | null = null

function ensureInterceptor(): void {
  if (interceptorDisposer || !spindle.permissions.has('interceptor')) return
  interceptorDisposer = spindle.registerInterceptor(async (messages, context) => {
    try {
      const chatId = context.chatId || '_lobby'
      const characterId = context.characterId || '_none'
      const state = await loadState(chatId, characterId, context.userId)
      const injected = { role: 'system' as const, content: `${PHONE_GUIDANCE}\nCurrent LumiPhone snapshot:\n${projectPhoneContext(state)}` }
      return { messages: [...messages, injected], breakdown: [{ messageIndex: messages.length, name: 'LumiPhone memory' }] }
    } catch {
      return messages
    }
  }, 70)
}

spindle.frontendCapabilities.declare('message_tag_interceptor')
spindle.onFrontendMessage(handleFrontend)
spindle.on('TOOL_INVOCATION', async (payload) => {
  if (payload.toolName !== 'phone_action') return ''
  try {
    const args = isRecord(payload.args) ? payload.args : {}
    const merged = { ...args, ...(isRecord(args.payload) ? args.payload : {}), payload: args.payload, idempotencyKey: text(payload.requestId, 240) }
    const result = await applyAction(merged, undefined, 'model')
    return JSON.stringify(result)
  } catch (error) {
    return `LumiPhone action failed: ${error instanceof Error ? error.message : String(error)}`
  }
})

ensureInterceptor()
registerTool()
spindle.permissions.onChanged(({ permission, granted }) => {
  if (permission === 'tools') {
    if (granted) registerTool()
    else spindle.unregisterTool('phone_action')
  }
  if (permission === 'interceptor') {
    if (granted) ensureInterceptor()
    else {
      interceptorDisposer?.()
      interceptorDisposer = null
    }
  }
  send({ type: 'lumiphone:capabilities', capabilities: capabilities() })
})

spindle.on('CHAT_SWITCHED', async (payload: any, userId?: string) => {
  const chatId = text(payload?.chatId, 180)
  if (!chatId) return
  try {
    const chat = spindle.permissions.has('chats') ? await (spindle.chats.get as any)(chatId, userId) : null
    const characterId = text(chat?.character_id, 180) || '_none'
    await sendState(await loadState(chatId, characterId, userId), userId, 'chat_switched')
  } catch { /* frontend will request a fresh state */ }
})

spindle.log.info('LumiPhone backend loaded.')
