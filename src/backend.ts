import type {
  CalendarEvent,
  GalleryResult,
  PhoneCapabilities,
  DevicePreferences,
  PhoneMessage,
  PhoneNote,
  PhoneNotification,
  PocketActivity,
  PocketRoute,
  ProcessedPocketCommand,
  PhoneState,
  PhoneTracker,
  PocketContact,
  PocketContactSourceOption,
  PocketConversation,
  RoleplayWeather,
  SwarmVisualProfile,
} from './types.js'
import { defaultPreferences, isFuturePreferences, normalizePreferences, PREFERENCES_PATH } from './domain/preferences.js'
import { projectPhoneContext } from './domain/projection.js'
import { legacyActionRoute, normalizePocketRoute } from './domain/navigation.js'
import { applyTrackerOperation, materializeTracker, normalizeTracker, trackerKey } from './domain/trackers.js'
import { contactSourceKey, ensureDirectConversation, normalizeContactCollections, normalizePocketContact, stableContactAccent } from './domain/contacts.js'

declare const spindle: import('lumiverse-spindle-types').SpindleAPI

type AnyRecord = Record<string, unknown>

const STATE_VERSION = 3 as const
const MAX_MESSAGES = 240
const MAX_NOTIFICATIONS = 80
const MAX_NOTES = 120
const MAX_EVENTS = 200
const MAX_TRACKERS = 40
const MAX_ACTIVITIES = 120
const stateLocks = new Map<string, Promise<unknown>>()
interface CameraJob { controller: AbortController; cancelled: boolean; chatId: string; characterId: string; userId?: string }
const cameraJobs = new Map<string, CameraJob>()
const notificationThrottle = new Map<string, number>()

const PHONE_GUIDANCE = `Pocket is available as an in-world phone shared with the current character. Use the registered phone_action tool when it is available. If tools are unavailable and a phone action materially belongs in the scene, emit exactly one hidden tag:
<lumi-phone action="message|contact|note|event|weather|tracker|camera|notify|open" app="messages|contacts|notes|calendar|weather|trackers|camera|home" title="short title">content or compact JSON</lumi-phone>
Do not explain the tag. Do not use it for ordinary narration. Pocket messages, notes, calendar events, weather, and trackers persist separately for this chat and character.`

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
  const collections = normalizeContactCollections({}, { characterId, characterName, now: createdAt, makeId: id })
  return {
    version: STATE_VERSION,
    chatId,
    characterId,
    characterName: characterName || 'Character',
    roleplayNow: createdAt,
    contacts: collections.contacts,
    conversations: collections.conversations,
    notes: [],
    events: [],
    weather: defaultWeather(),
    trackers: [],
    notifications: [],
    activities: [],
    processedCommands: [],
    updatedAt: createdAt,
  }
}

function normalizeState(value: unknown, chatId: string, characterId: string, characterName: string): PhoneState {
  const fallback = defaultState(chatId, characterId, characterName)
  if (!isRecord(value)) return fallback
  if (Number(value.version) > STATE_VERSION) return fallback
  const collections = normalizeContactCollections(value, { characterId, characterName, now: nowIso(), makeId: id })
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
  const trackers: PhoneTracker[] = (Array.isArray(value.trackers) ? value.trackers : [])
    .slice(0, MAX_TRACKERS)
    .map((item) => normalizeTracker(item, { roleplayNow: text(value.roleplayNow, 80), characterId, characterName }))
    .filter((item): item is PhoneTracker => Boolean(item))
  const notifications: PhoneNotification[] = (Array.isArray(value.notifications) ? value.notifications : []).slice(0, MAX_NOTIFICATIONS).flatMap((item) => {
    if (!isRecord(item)) return []
    const title = text(item.title, 160)
    if (!title) return []
    const app = text(item.app, 40) as PhoneNotification['app'] || 'home'
    return [{
      id: text(item.id, 120) || id('ntf'), app,
      title, body: text(item.body, 1_000), createdAt: text(item.createdAt, 40) || nowIso(),
      read: bool(item.read), route: normalizePocketRoute(item.route, legacyActionRoute(app, text(item.action, 120))),
      action: text(item.action, 120) || undefined,
    }]
  })
  const activities: PocketActivity[] = (Array.isArray(value.activities) ? value.activities : []).slice(-MAX_ACTIVITIES).flatMap((item) => {
    if (!isRecord(item)) return []
    const title = text(item.title, 160)
    if (!title) return []
    const source = isRecord(item.source) ? item.source : {}
    return [{
      id: text(item.id, 160) || id('act'),
      kind: item.kind === 'message' || item.kind === 'contact' || item.kind === 'tracker-change' || item.kind === 'timeline' || item.kind === 'note' || item.kind === 'image' || item.kind === 'weather' ? item.kind : 'system',
      title, summary: text(item.summary, 500) || undefined, route: normalizePocketRoute(item.route),
      createdAt: text(item.createdAt, 40) || nowIso(), scope: { chatId, characterId },
      source: {
        commandId: text(source.commandId, 240) || undefined, messageId: text(source.messageId, 180) || undefined,
        trackerId: text(source.trackerId, 180) || undefined, contactId: text(source.contactId, 180) || undefined,
        conversationId: text(source.conversationId, 180) || undefined,
        eventId: text(source.eventId, 180) || undefined, noteId: text(source.noteId, 180) || undefined,
        imageId: text(source.imageId, 180) || undefined,
      },
    }]
  })
  const processedCommands = (Array.isArray(value.processedCommands) ? value.processedCommands : []).slice(-160).flatMap((item) => {
    if (!isRecord(item)) return []
    const commandId = text(item.id, 240)
    if (!commandId) return []
    return [{ id: commandId, semanticKey: text(item.semanticKey, 500), createdAt: text(item.createdAt, 40) || nowIso(), activityId: text(item.activityId, 180) || undefined }]
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
    contacts: collections.contacts,
    conversations: collections.conversations,
    notes, events, weather, trackers, notifications, activities, processedCommands,
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
  if (isRecord(raw) && Number(raw.version) > STATE_VERSION) throw new Error('This phone state was created by a newer Pocket version.')
  const state = normalizeState(raw, chatId, characterId, characterName)
  await loadPreferences(userId, isRecord(raw) ? raw.settings : undefined)
  let stateChanged = Boolean(isRecord(raw) && Number(raw.version || 0) <= STATE_VERSION && (raw.settings !== undefined || Number(raw.version || 0) < STATE_VERSION))
  state.trackers = state.trackers.map((tracker) => {
    const result = materializeTracker(tracker, state.roleplayNow)
    stateChanged ||= result.changed
    return result.tracker
  })
  const contact = state.contacts.find((item) => item.source.kind === 'character' && item.source.characterId === characterId)
  if (contact && characterName !== 'Character') contact.name = characterName
  state.characterName = characterName
  if (stateChanged) await spindle.userStorage.setJson(statePath(chatId, characterId), state, { indent: 2, userId })
  return state
}

async function loadPreferences(userId?: string, legacy?: unknown): Promise<DevicePreferences> {
  const raw = await spindle.userStorage.getJson<unknown>(PREFERENCES_PATH, { fallback: null, userId })
  const preferences = normalizePreferences(raw ?? legacy)
  if (isFuturePreferences(raw)) {
    spindle.log.warn('Pocket left newer device preferences untouched and used safe defaults for this session.')
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

function withStateLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = stateLocks.get(key) || Promise.resolve()
  const current = previous.catch(() => undefined).then(task)
  stateLocks.set(key, current)
  const release = () => {
    if (stateLocks.get(key) === current) stateLocks.delete(key)
  }
  void current.then(release, release)
  return current
}

function capabilities(): PhoneCapabilities {
  return {
    generation: spindle.permissions.has('generation'), interceptor: spindle.permissions.has('interceptor'),
    tools: spindle.permissions.has('tools'), chats: spindle.permissions.has('chats'),
    characters: spindle.permissions.has('characters'), personas: spindle.permissions.has('personas'),
    images: spindle.permissions.has('images'), imageGen: spindle.permissions.has('image_gen'),
    panels: spindle.permissions.has('ui_panels'), push: spindle.permissions.has('push_notification'),
    sceneSync: spindle.permissions.has('chat_mutation'),
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

function addActivity(
  state: PhoneState,
  activity: Omit<PocketActivity, 'id' | 'createdAt' | 'scope'>,
  command?: ProcessedPocketCommand,
): PocketActivity {
  const entry: PocketActivity = {
    ...activity,
    id: id('act'),
    createdAt: nowIso(),
    scope: { chatId: state.chatId, characterId: state.characterId },
    source: { ...activity.source, commandId: command?.id || activity.source?.commandId },
  }
  state.activities.push(entry)
  state.activities = state.activities.slice(-MAX_ACTIVITIES)
  if (command) command.activityId = entry.id
  return entry
}

function sendActivity(activity: PocketActivity | undefined, userId?: string): void {
  if (activity) send({ type: 'lumiphone:activity', activity }, userId)
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
      body: notification.body || `Open ${notification.app} in Pocket`,
      tag: `lumiphone-${stateKey(state.chatId, state.characterId)}-${notification.app}`,
      url: `/chat/${state.chatId}`,
    }, userId)
  } catch (error) {
    spindle.log.warn(`Pocket push notification failed: ${error instanceof Error ? error.message : String(error)}`)
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

function sourceMatches(contact: PocketContact, kind: string, sourceId: string, itemId = ''): boolean {
  if (kind === 'character') return contact.source.kind === 'character' && contact.source.characterId === sourceId
  if (kind === 'council') return contact.source.kind === 'council' && (contact.source.memberId === sourceId || Boolean(itemId && contact.source.itemId === itemId) || contact.source.itemId === sourceId)
  return false
}

async function listContactSources(state: PhoneState, userId?: string): Promise<PocketContactSourceOption[]> {
  const options: PocketContactSourceOption[] = []
  if (spindle.permissions.has('characters')) {
    try {
      const listed: any = await (spindle.characters.list as any)({ limit: 200, offset: 0 }, userId)
      for (const character of Array.isArray(listed?.data) ? listed.data : []) {
        const sourceId = text(character?.id, 180)
        const name = text(character?.name, 120)
        if (!sourceId || !name) continue
        options.push({
          kind: 'character', sourceId, name, role: 'Character',
          description: text(character?.description, 600),
          avatarUrl: text(character?.avatar_url ?? character?.avatarUrl, 2_000),
          importedContactId: state.contacts.find((entry) => sourceMatches(entry, 'character', sourceId))?.id,
        })
      }
    } catch { /* source stays unavailable */ }
  }
  try {
    const members: any[] = await (spindle.council.getMembers as any)({ userId })
    for (const member of Array.isArray(members) ? members : []) {
      const sourceId = text(member?.memberId, 180)
      const itemId = text(member?.itemId, 180)
      const name = text(member?.name, 120)
      if (!sourceId || !name) continue
      options.push({
        kind: 'council', sourceId, itemId, name,
        role: text(member?.role, 120) || 'Council member',
        description: text(member?.definition, 600), avatarUrl: text(member?.avatarUrl, 2_000),
        importedContactId: state.contacts.find((entry) => sourceMatches(entry, 'council', sourceId, itemId))?.id,
      })
    }
  } catch { /* council is optional */ }
  return options
}

async function resolveContactProfile(contact: PocketContact, userId?: string): Promise<{ name: string; role: string; description: string; personality: string; behavior: string; source: string }> {
  if (contact.source.kind === 'character') {
    if (!spindle.permissions.has('characters')) throw new Error(`Character access is required to reply as ${contact.name}.`)
    const character: any = await (spindle.characters.get as any)(contact.source.characterId, userId).catch(() => null)
    if (!character) throw new Error(`The linked character for ${contact.name} is unavailable. Re-link or remove this contact.`)
    return {
      name: text(character.name, 120) || contact.name, role: contact.role,
      description: text(character.description, 8_000), personality: text(character.personality, 4_000),
      behavior: text(character.scenario ?? character.mes_example, 3_000), source: `character:${contact.source.characterId}`,
    }
  }
  if (contact.source.kind === 'council') {
    const councilSource = contact.source
    const members: any[] = await (spindle.council.getMembers as any)({ userId }).catch(() => [])
    const member = members.find((entry) => text(entry?.memberId, 180) === councilSource.memberId || text(entry?.itemId, 180) === councilSource.itemId)
    if (member) return {
      name: text(member.name, 120) || contact.name, role: text(member.role, 120) || contact.role,
      description: text(member.definition, 8_000), personality: text(member.personality, 4_000),
      behavior: text(member.behavior, 3_000), source: `council:${councilSource.memberId || councilSource.itemId}`,
    }
    const items: any[] = await (spindle.council.getAvailableLumiaItems as any)({ userId }).catch(() => [])
    const item = items.find((entry) => text(entry?.id, 180) === councilSource.itemId)
    if (!item) throw new Error(`The linked Council profile for ${contact.name} is unavailable. Re-link or remove this contact.`)
    return {
      name: text(item.name, 120) || contact.name, role: contact.role,
      description: text(item.definition, 8_000), personality: text(item.personality, 4_000),
      behavior: text(item.behavior, 3_000), source: `council-item:${councilSource.itemId}`,
    }
  }
  return {
    name: contact.name, role: contact.role, description: text(contact.source.description || contact.description, 600),
    personality: '', behavior: '', source: `npc:${contact.source.origin}`,
  }
}

function parseStrictJson(content: unknown): AnyRecord {
  const raw = text(content, 30_000).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const parsed = JSON.parse(raw)
  if (!isRecord(parsed)) throw new Error('Generation returned an invalid JSON object.')
  return parsed
}

function upsertContact(state: PhoneState, contact: PocketContact): PocketContact {
  const sourceKey = contactSourceKey(contact.source)
  const existing = state.contacts.find((entry) => entry.id === contact.id || (contact.source.kind !== 'npc' && contactSourceKey(entry.source) === sourceKey) || (
    contact.source.kind === 'npc' && entry.source.kind === 'npc' && contact.source.sceneKey && entry.source.sceneKey === contact.source.sceneKey
  ))
  if (existing) {
    const preserved = { createdAt: existing.createdAt, accent: existing.accent, contextPolicy: existing.contextPolicy }
    Object.assign(existing, contact, preserved, { updatedAt: nowIso() })
    return existing
  }
  state.contacts.push(contact)
  state.contacts = state.contacts.slice(-80)
  return contact
}

function contactFromSource(option: PocketContactSourceOption): PocketContact {
  const createdAt = nowIso()
  const source = option.kind === 'character'
    ? { kind: 'character' as const, characterId: option.sourceId }
    : { kind: 'council' as const, memberId: option.sourceId, itemId: option.itemId || '' }
  return {
    id: id('contact'), name: option.name, role: option.role, description: option.description,
    avatarUrl: option.avatarUrl, accent: stableContactAccent(`${option.kind}:${option.sourceId}`), source,
    presence: { inScene: false, lastSceneAt: '' }, contextPolicy: { pinned: false }, createdAt, updatedAt: createdAt,
  }
}

function resolveConversation(state: PhoneState, input: AnyRecord): PocketConversation {
  const conversationId = text(input.conversationId ?? input.conversation_id, 180)
  if (conversationId) {
    const conversation = state.conversations.find((entry) => entry.id === conversationId)
    if (!conversation) throw new Error('That Pocket conversation no longer exists.')
    return conversation
  }
  const contactId = text(input.contactId ?? input.contact_id, 180)
  const contact = state.contacts.find((entry) => entry.id === contactId) || (!contactId ? state.contacts.find((entry) => entry.source.kind === 'character' && entry.source.characterId === state.characterId) : undefined)
  if (!contact) throw new Error('Choose a valid contact before opening a conversation.')
  return ensureDirectConversation(state, contact.id, nowIso(), id)
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
      spindle.log.warn(`Pocket scene planner fell back to the original brief: ${error instanceof Error ? error.message : String(error)}`)
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
  const route: PocketRoute = imageId ? { app: 'gallery', imageId } : { app: 'gallery' }
  const notification = addNotification(state, {
    app: 'camera', title: 'Photo ready', body: scene.slice(0, 180), route,
  })
  const command = state.processedCommands.find((entry) => entry.id === text(input.__commandId, 240))
  const activity = addActivity(state, {
    kind: 'image', title: 'Photo ready', summary: scene.slice(0, 280), route,
    source: { messageId: text(input.__sourceMessageId, 180) || undefined, imageId: imageId || undefined },
  }, command)
  await saveState(state, userId)
  await maybePush(state, preferences, notification, userId)
  await sendState(state, userId, 'camera', false)
  sendActivity(activity, userId)
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
    const conversation = resolveConversation(state, input)
    const participants = conversation.participantContactIds
      .map((contactId) => state.contacts.find((entry) => entry.id === contactId))
      .filter((entry): entry is PocketContact => Boolean(entry))
    if (!participants.length) throw new Error('This conversation has no available contact participants.')
    let contact: PocketContact
    const requestedSpeaker = text(input.speakerContactId ?? input.speaker_contact_id, 180)
    if (requestedSpeaker && requestedSpeaker !== 'auto') {
      const explicit = participants.find((entry) => entry.id === requestedSpeaker)
      if (!explicit) throw new Error('The selected speaker is not a participant in this conversation.')
      contact = explicit
    } else if (conversation.kind === 'direct') {
      contact = participants[0]
    } else {
      const lastSpeakerId = [...conversation.messages].reverse().find((entry) => entry.sender === 'contact')?.senderContactId
      const currentIndex = participants.findIndex((entry) => entry.id === lastSpeakerId)
      contact = participants[(currentIndex + 1 + participants.length) % participants.length]
    }
    send({
      type: 'lumiphone:message_progress', requestId, chatId: context.chatId, characterId: context.characterId,
      conversationId: conversation.id, contactId: contact.id, speakerContactId: contact.id, phase: 'pending',
    }, userId)
    const profile = await resolveContactProfile(contact, userId)
    const roster = participants.map((entry) => `${entry.name} (${entry.role || entry.source.kind})`).join('; ').slice(0, 2_000)
    const history = conversation.messages.slice(-30).map((message) => `${message.sender === 'persona' ? 'User' : message.senderName || 'Pocket'}: ${message.text.slice(0, 1_200)}`).join('\n').slice(-12_000)
    const instruction = text(input.instruction, 2_000) || 'Reply naturally to the latest message.'
    const response: any = await spindle.generate.quiet({
      type: 'quiet',
      messages: [
        { role: 'system', content: `Write exactly one private phone text as ${profile.name}. Stay in character and do not speak for another participant. Return only the message text, without a name label, quotes, narration, JSON, or XML.\nSource: ${profile.source}\nRole: ${profile.role.slice(0, 120)}\nDescription: ${profile.description.slice(0, 8_000)}\nPersonality: ${profile.personality.slice(0, 4_000)}\nBehavior: ${profile.behavior.slice(0, 3_000)}\nConversation roster: ${roster}` },
        { role: 'user', content: `Recent thread:\n${history || '(no messages yet)'}\n\nDirection: ${instruction}` },
      ],
      parameters: { temperature: 0.85, max_tokens: 500 },
      userId,
    })
    const reply = text(response.content, 8_000)
    if (!reply) throw new Error('The character did not return a phone message.')
    conversation.messages.push({
      id: id('msg'), sender: 'contact', senderContactId: contact.id, senderName: contact.name, senderAccent: contact.accent,
      text: reply, createdAt: nowIso(), read: false, status: 'delivered',
    })
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES)
    conversation.unread += 1
    conversation.updatedAt = nowIso()
    const phoneMessageId = conversation.messages.at(-1)?.id
    const route: PocketRoute = { app: 'messages', conversationId: conversation.id, messageId: phoneMessageId }
    const notification = addNotification(state, { app: 'messages', title: contact.name, body: reply.slice(0, 220), route })
    const activity = addActivity(state, { kind: 'message', title: contact.name, summary: reply.slice(0, 280), route, source: { contactId: contact.id, conversationId: conversation.id } })
    await saveState(state, userId)
    await maybePush(state, preferences, notification, userId)
    await sendState(state, userId, 'message', preferences.autoOpenOnModelAction)
    sendActivity(activity, userId)
    send({
      type: 'lumiphone:message_progress', requestId, chatId: context.chatId, characterId: context.characterId,
      conversationId: conversation.id, contactId: contact.id, speakerContactId: contact.id, phase: 'done',
    }, userId)
  })
}

async function generateNpcContact(input: AnyRecord, userId?: string): Promise<void> {
  if (!spindle.permissions.has('generation')) throw new Error('Enable Generation to create an NPC contact from a description.')
  const context = await resolveContext(input, userId)
  const prompt = text(input.description, 2_000)
  if (!prompt) throw new Error('Describe the NPC you want to add.')
  const response: any = await spindle.generate.quiet({
    type: 'quiet',
    messages: [
      { role: 'system', content: 'Create one compact roleplay phone contact from the user description. Return strict JSON only with exactly these string fields: {"name":"","role":"","description":""}. No markdown. Name and role must each be at most 120 characters; description at most 600 characters.' },
      { role: 'user', content: prompt },
    ],
    parameters: { temperature: 0.55, max_tokens: 350 }, userId,
  })
  const parsed = parseStrictJson(response.content)
  const name = text(parsed.name, 120)
  if (!name) throw new Error('NPC generation did not return a valid name.')
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    const state = await loadState(context.chatId, context.characterId, userId)
    const createdAt = nowIso()
    const contact = upsertContact(state, {
      id: id('contact'), name, role: text(parsed.role, 120) || 'Pocket NPC', description: text(parsed.description, 600),
      avatarUrl: '', accent: stableContactAccent(name),
      source: { kind: 'npc', origin: 'generated', description: text(parsed.description, 600) },
      presence: { inScene: false, lastSceneAt: '' }, contextPolicy: { pinned: false }, createdAt, updatedAt: createdAt,
    })
    const activity = addActivity(state, { kind: 'contact', title: `${contact.name} added`, summary: contact.role, route: { app: 'contacts', contactId: contact.id, view: 'detail' }, source: { contactId: contact.id } })
    await saveState(state, userId)
    await sendState(state, userId, 'contact')
    sendActivity(activity, userId)
    send({ type: 'lumiphone:contact_created', requestId: text(input.requestId, 180), contactId: contact.id }, userId)
  })
}

function sceneKeyFor(name: string): string {
  return name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 120) || name.toLocaleLowerCase().slice(0, 120)
}

async function syncSceneContacts(input: AnyRecord, userId?: string): Promise<void> {
  if (!spindle.permissions.has('generation')) throw new Error('Enable Generation to identify scene contacts.')
  if (!spindle.permissions.has('chat_mutation')) throw new Error('Enable Chat Mutation so Pocket can read the recent scene when you request a sync.')
  const context = await resolveContext(input, userId)
  const messages: any[] = await spindle.chat.getMessages(context.chatId)
  const transcript = messages.slice(-24).map((message) => `${message.role}: ${text(message.content, 1_200)}`).join('\n').slice(-16_000)
  const response: any = await spindle.generate.quiet({
    type: 'quiet',
    messages: [
      { role: 'system', content: 'Identify named non-user actors who are physically or actively present in the most recent roleplay scene. Return strict JSON only: {"contacts":[{"name":"","role":"","description":""}]}. Return at most 8 contacts. Do not include merely mentioned, messaged, absent, historical, or hypothetical people. Name and role max 120 characters; description max 600.' },
      { role: 'user', content: transcript || '(empty chat)' },
    ],
    parameters: { temperature: 0.2, max_tokens: 900 }, userId,
  })
  const parsed = parseStrictJson(response.content)
  const found = (Array.isArray(parsed.contacts) ? parsed.contacts : []).slice(0, 8).flatMap((entry) => {
    if (!isRecord(entry)) return []
    const name = text(entry.name, 120)
    if (!name) return []
    return [{ name, role: text(entry.role, 120) || 'Scene contact', description: text(entry.description, 600) }]
  })
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    const state = await loadState(context.chatId, context.characterId, userId)
    const sceneAt = nowIso()
    for (const contact of state.contacts) {
      if (contact.source.kind === 'npc' && contact.source.origin === 'scene') contact.presence.inScene = false
    }
    const contactIds: string[] = []
    for (const candidate of found) {
      const sceneKey = sceneKeyFor(candidate.name)
      const existing = state.contacts.find((entry) => entry.source.kind === 'npc' && entry.source.origin === 'scene' && entry.source.sceneKey === sceneKey)
        || state.contacts.find((entry) => entry.name.toLocaleLowerCase() === candidate.name.toLocaleLowerCase())
      if (existing && !(existing.source.kind === 'npc' && existing.source.origin === 'scene')) {
        existing.presence.inScene = true
        existing.presence.lastSceneAt = sceneAt
        existing.updatedAt = sceneAt
        contactIds.push(existing.id)
        continue
      }
      const createdAt = existing?.createdAt || sceneAt
      const contact = upsertContact(state, {
        id: existing?.id || id('contact'), name: candidate.name, role: candidate.role, description: candidate.description,
        avatarUrl: existing?.avatarUrl || '', accent: existing?.accent || stableContactAccent(sceneKey),
        source: { kind: 'npc', origin: 'scene', description: candidate.description, sceneKey },
        presence: { inScene: true, lastSceneAt: sceneAt }, contextPolicy: existing?.contextPolicy || { pinned: false }, createdAt, updatedAt: sceneAt,
      })
      contactIds.push(contact.id)
    }
    const active = state.contacts.find((entry) => entry.source.kind === 'character' && entry.source.characterId === state.characterId)
    if (active) { active.presence.inScene = true; active.presence.lastSceneAt = sceneAt }
    const activity = addActivity(state, {
      kind: 'contact', title: 'Scene contacts synced', summary: `${contactIds.length} actor${contactIds.length === 1 ? '' : 's'} present`,
      route: { app: 'contacts' }, source: {},
    })
    await saveState(state, userId)
    await sendState(state, userId, 'scene_contacts')
    sendActivity(activity, userId)
    send({ type: 'lumiphone:scene_contacts_done', requestId: text(input.requestId, 180), contactIds }, userId)
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

function reserveCommand(state: PhoneState, input: AnyRecord, action: string, payload: AnyRecord, source: 'model' | 'user' | 'tag'): { accepted: boolean; command: ProcessedPocketCommand } {
  const commandId = text(input.idempotencyKey ?? input.commandId ?? input.command_id ?? input.requestId, 240)
  const semanticKey = actionSemanticKey(action, input, payload)
  const cutoff = Date.now() - 20_000
  const duplicate = commandId
    ? state.processedCommands.find((entry) => entry.id === commandId)
    : source !== 'user' ? state.processedCommands.find((entry) => entry.semanticKey === semanticKey && Date.parse(entry.createdAt) >= cutoff) : undefined
  if (duplicate) return { accepted: false, command: duplicate }
  const command: ProcessedPocketCommand = { id: commandId || id('cmd'), semanticKey, createdAt: nowIso() }
  state.processedCommands.push(command)
  state.processedCommands = state.processedCommands.slice(-160)
  return { accepted: true, command }
}

async function applyAction(input: AnyRecord, userId?: string, source: 'model' | 'user' | 'tag' = 'model'): Promise<AnyRecord> {
  const context = await resolveContext(input, userId)
  const action = text(input.action, 40).toLowerCase()
  const key = stateKey(context.chatId, context.characterId)
  const payload = isRecord(input.payload) ? input.payload : input
  if (action === 'camera') {
    const reserved = await withStateLock(key, async () => {
      const state = await loadState(context.chatId, context.characterId, userId)
      const reservation = reserveCommand(state, input, action, payload, source)
      if (!reservation.accepted) {
        sendActivity(state.activities.find((entry) => entry.id === reservation.command.activityId), userId)
        return null
      }
      await saveState(state, userId)
      return reservation.command
    })
    return reserved ? cameraGenerate({ ...input, __commandId: reserved.id, __sourceMessageId: input.messageId }, userId) : { ok: true, action, deduplicated: true }
  }
  return withStateLock(key, async () => {
    const state = await loadState(context.chatId, context.characterId, userId)
    const preferences = await loadPreferences(userId)
    const reservation = reserveCommand(state, input, action, payload, source)
    if (!reservation.accepted) {
      const duplicateActivity = state.activities.find((entry) => entry.id === reservation.command.activityId)
      sendActivity(duplicateActivity, userId)
      return { ok: true, action, deduplicated: true, activityId: duplicateActivity?.id }
    }
    const command = reservation.command
    let notification: PhoneNotification | null = null
    let activity: PocketActivity | undefined
    let result: AnyRecord = { ok: true, action }
    if (action === 'open') {
      await saveState(state, userId)
      await sendState(state, userId, 'open', true)
      return result
    }
    if (action === 'message') {
      const requestedContactId = text(payload.contact_id ?? payload.contactId, 180)
      let contact = state.contacts.find((item) => item.id === requestedContactId)
      if (!contact && requestedContactId) {
        const createdAt = nowIso()
        contact = {
          id: requestedContactId, name: text(payload.contact_name ?? payload.contactName, 120) || 'Pocket NPC',
          role: text(payload.contact_role ?? payload.contactRole, 120) || 'Pocket NPC',
          description: text(payload.contact_description ?? payload.contactDescription, 600), avatarUrl: '',
          accent: stableContactAccent(requestedContactId), source: { kind: 'npc', origin: 'manual', description: text(payload.contact_description ?? payload.contactDescription, 600) },
          presence: { inScene: false, lastSceneAt: '' }, contextPolicy: { pinned: false }, createdAt, updatedAt: createdAt,
        }
        state.contacts.push(contact)
      }
      const conversation = text(payload.conversationId ?? payload.conversation_id, 180)
        ? resolveConversation(state, payload)
        : ensureDirectConversation(state, contact?.id || state.contacts[0].id, nowIso(), id)
      const messageText = text(payload.text ?? payload.content, 12_000)
      if (!messageText) throw new Error('A phone message needs text.')
      const sender = source === 'user' || payload.sender === 'user' || payload.sender === 'persona' ? 'persona' : payload.sender === 'system' ? 'system' : 'contact'
      const senderContactId = sender === 'contact'
        ? text(payload.senderContactId ?? payload.sender_contact_id, 180) || contact?.id || conversation.participantContactIds[0]
        : undefined
      const senderContact = senderContactId ? state.contacts.find((entry) => entry.id === senderContactId) : undefined
      if (sender === 'contact' && (!senderContact || !conversation.participantContactIds.includes(senderContact.id))) throw new Error('The message sender must be a participant in this conversation.')
      const message: PhoneMessage = {
        id: id('msg'), sender, senderContactId, senderName: sender === 'persona' ? 'You' : sender === 'system' ? 'Pocket' : senderContact!.name,
        senderAccent: senderContact?.accent || '', text: messageText, createdAt: nowIso(), read: sender !== 'contact',
        status: sender === 'persona' ? 'sent' : sender === 'system' ? 'read' : 'delivered',
      }
      conversation.messages.push(message)
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES)
      conversation.updatedAt = message.createdAt
      if (sender === 'contact') conversation.unread += 1
      const route: PocketRoute = { app: 'messages', conversationId: conversation.id, messageId: message.id }
      notification = sender === 'contact' ? addNotification(state, { app: 'messages', title: senderContact!.name, body: messageText.slice(0, 220), route }) : null
      result = { ...result, contactId: senderContact?.id || contact?.id, conversationId: conversation.id, messageId: message.id }
      activity = addActivity(state, { kind: 'message', title: senderContact?.name || conversation.title, summary: messageText.slice(0, 280), route, source: { messageId: text(input.messageId, 180) || message.id, contactId: senderContact?.id || contact?.id, conversationId: conversation.id } }, command)
    } else if (action === 'contact') {
      const contactId = text(payload.contactId ?? payload.contact_id ?? payload.id, 180)
      const existing = state.contacts.find((entry) => entry.id === contactId)
      const name = text(payload.name ?? payload.title, 120) || existing?.name
      if (!name) throw new Error('A contact action needs a name.')
      const createdAt = existing?.createdAt || nowIso()
      const requestedAccent = text(payload.accent, 20)
      const contact = upsertContact(state, {
        id: existing?.id || id('contact'), name,
        role: text(payload.role, 120) || existing?.role || 'Pocket NPC',
        description: text(payload.description ?? payload.text ?? payload.content, 600) || existing?.description || '',
        avatarUrl: existing?.avatarUrl || '', accent: /^#[0-9a-f]{6}$/i.test(requestedAccent) ? requestedAccent : existing?.accent || stableContactAccent(name),
        source: existing?.source || { kind: 'npc', origin: 'manual', description: text(payload.description ?? payload.text ?? payload.content, 600) },
        presence: {
          inScene: bool(payload.inScene ?? payload.in_scene, existing?.presence.inScene),
          lastSceneAt: bool(payload.inScene ?? payload.in_scene, existing?.presence.inScene) ? nowIso() : existing?.presence.lastSceneAt || '',
        },
        contextPolicy: { pinned: bool(payload.pinned, existing?.contextPolicy.pinned) }, createdAt, updatedAt: nowIso(),
      })
      const route: PocketRoute = { app: 'contacts', contactId: contact.id, view: 'detail' }
      notification = source !== 'user' ? addNotification(state, { app: 'contacts', title: contact.name, body: contact.role, route }) : null
      result.contactId = contact.id
      activity = addActivity(state, { kind: 'contact', title: contact.name, summary: contact.role, route, source: { messageId: text(input.messageId, 180) || undefined, contactId: contact.id } }, command)
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
      const route: PocketRoute = { app: 'notes', noteId: String(result.noteId) }
      if (source !== 'user') notification = addNotification(state, { app: 'notes', title: 'Journal updated', body: title, route })
      activity = addActivity(state, { kind: 'note', title: 'Journal updated', summary: title, route, source: { messageId: text(input.messageId, 180) || undefined, noteId: String(result.noteId) } }, command)
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
      const route: PocketRoute = { app: 'calendar', eventId: event.id }
      notification = source !== 'user' ? addNotification(state, { app: 'calendar', title: 'Timeline updated', body: title, route }) : null
      result.eventId = event.id
      activity = addActivity(state, { kind: 'timeline', title: 'Timeline updated', summary: title, route, source: { messageId: text(input.messageId, 180) || undefined, eventId: event.id } }, command)
    } else if (action === 'weather') {
      state.weather = {
        location: text(payload.location, 160) || state.weather.location,
        condition: text(payload.condition, 120) || state.weather.condition,
        temperature: numberValue(payload.temperature, state.weather.temperature),
        unit: payload.unit === 'F' ? 'F' : 'C',
        high: numberValue(payload.high, state.weather.high), low: numberValue(payload.low, state.weather.low),
        details: text(payload.details ?? payload.text, 2_000) || state.weather.details, updatedAt: nowIso(),
      }
      const route: PocketRoute = { app: 'weather' }
      notification = source !== 'user' ? addNotification(state, { app: 'weather', title: state.weather.location, body: `${state.weather.condition}, ${state.weather.temperature}°${state.weather.unit}`, route }) : null
      activity = addActivity(state, { kind: 'weather', title: state.weather.location, summary: `${state.weather.condition}, ${state.weather.temperature}°${state.weather.unit}`, route, source: { messageId: text(input.messageId, 180) || undefined } }, command)
    } else if (action === 'tracker') {
      const trackerId = text(payload.trackerId ?? payload.tracker_id ?? payload.id, 120)
      const requestedKey = trackerKey(payload.key, '')
      let existing = trackerId ? state.trackers.find((item) => item.id === trackerId) : undefined
      if (!existing && requestedKey) existing = state.trackers.find((item) => item.key === requestedKey)
      if (!existing && !trackerId && !requestedKey && text(payload.label, 120)) {
        const matches = state.trackers.filter((item) => item.label.toLocaleLowerCase() === text(payload.label, 120).toLocaleLowerCase())
        if (matches.length > 1) throw new Error('Tracker label is ambiguous; use trackerId or key.')
        existing = matches[0]
      }
      if (existing && source !== 'user' && (!existing.allowModelWrite || existing.updateMode !== 'model')) {
        throw new Error(`Tracker ${existing.label} does not allow model updates.`)
      }
      const operation = text(payload.operation ?? payload.op, 30) as import('./types.js').TrackerOperation
      let next: PhoneTracker
      if (existing && operation) {
        next = applyTrackerOperation(existing, {
          operation, amount: numberValue(payload.amount ?? payload.value, 0), state: text(payload.state ?? payload.value, 80),
          reason: text(payload.reason, 300), source, roleplayNow: state.roleplayNow,
        })
      } else {
        const candidate = normalizeTracker({
          ...(existing || {}), ...payload,
          id: existing?.id || trackerId || id('trk'), key: text(payload.key, 120) || existing?.key || text(payload.label, 120),
          label: text(payload.label, 120) || existing?.label || 'Tracker',
          color: text(payload.color, 40) || existing?.color || preferences.colors.accent,
          ratePerHour: payload.ratePerHour ?? payload.rate_per_hour ?? existing?.ratePerHour,
          updatedAt: nowIso(), lastUpdated: existing?.lastUpdated || nowIso(),
        }, { roleplayNow: state.roleplayNow, characterId: state.characterId, characterName: state.characterName })
        if (!candidate) throw new Error('Tracker configuration is invalid.')
        next = candidate
      }
      if (existing) state.trackers[state.trackers.indexOf(existing)] = next
      else state.trackers.push(next)
      state.trackers = state.trackers.slice(-MAX_TRACKERS)
      const route: PocketRoute = { app: 'trackers', trackerId: next.id, view: 'detail' }
      const trackerSummary = next.kind === 'state' ? next.state : `${Number(next.value.toFixed(2))}${next.unit}`
      notification = source !== 'user' ? addNotification(state, { app: 'trackers', title: next.label, body: trackerSummary, route }) : null
      result.trackerId = next.id
      activity = addActivity(state, { kind: 'tracker-change', title: next.label, summary: trackerSummary, route, source: { messageId: text(input.messageId, 180) || undefined, trackerId: next.id } }, command)
    } else if (action === 'notify') {
      const requestedApp = text(payload.app ?? input.app, 40)
      const allowedApps = new Set(['home', 'messages', 'contacts', 'gallery', 'camera', 'notes', 'weather', 'calendar', 'trackers', 'settings'])
      notification = addNotification(state, {
        app: (allowedApps.has(requestedApp) ? requestedApp : 'home') as PhoneNotification['app'],
        title: text(payload.title ?? input.title, 160) || 'Pocket', body: text(payload.body ?? payload.text ?? payload.content, 1_000),
        route: normalizePocketRoute(payload.route, { app: (allowedApps.has(requestedApp) ? requestedApp : 'home') as PhoneNotification['app'] } as PocketRoute),
      })
      activity = addActivity(state, { kind: 'system', title: notification.title, summary: notification.body, route: notification.route || { app: 'home' }, source: { messageId: text(input.messageId, 180) || undefined } }, command)
    } else {
      throw new Error(`Unsupported phone action: ${action || '(empty)'}`)
    }
    await saveState(state, userId)
    if (notification) await maybePush(state, preferences, notification, userId)
    await sendState(state, userId, action, source !== 'user' && preferences.autoOpenOnModelAction)
    sendActivity(activity, userId)
    return { ...result, activityId: activity?.id }
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
      case 'lumiphone:list_contact_sources': {
        const state = await loadState(context.chatId, context.characterId, userId)
        send({ type: 'lumiphone:contact_sources', requestId, sources: await listContactSources(state, userId) }, userId)
        break
      }
      case 'lumiphone:import_contact': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const kind = text(payload.kind, 30)
          const sourceId = text(payload.sourceId, 180)
          const itemId = text(payload.itemId, 180)
          const option = (await listContactSources(state, userId)).find((entry) => entry.kind === kind && entry.sourceId === sourceId && (!itemId || entry.itemId === itemId))
          if (!option) throw new Error('That Character or Council source is no longer available.')
          const contact = upsertContact(state, contactFromSource(option))
          const conversation = ensureDirectConversation(state, contact.id, nowIso(), id)
          const activity = addActivity(state, { kind: 'contact', title: `${contact.name} imported`, summary: contact.role, route: { app: 'contacts', contactId: contact.id, view: 'detail' }, source: { contactId: contact.id, conversationId: conversation.id } })
          await saveState(state, userId)
          await sendState(state, userId, 'contact')
          sendActivity(activity, userId)
          send({ type: 'lumiphone:contact_created', requestId, contactId: contact.id, conversationId: conversation.id }, userId)
        })
        break
      }
      case 'lumiphone:save_contact': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const raw = isRecord(payload.contact) ? payload.contact : payload
          const existing = state.contacts.find((entry) => entry.id === text(raw.id, 180))
          const candidate = normalizePocketContact({
            ...(existing || {}), ...raw,
            id: existing?.id || text(raw.id, 180) || id('contact'),
            source: existing?.source || { kind: 'npc', origin: 'manual', description: text(raw.description, 600) },
            createdAt: existing?.createdAt || nowIso(), updatedAt: nowIso(),
          }, { characterId: state.characterId, characterName: state.characterName, now: nowIso(), makeId: id })
          if (!candidate) throw new Error('A contact needs a name.')
          const contact = upsertContact(state, candidate)
          await saveState(state, userId)
          await sendState(state, userId, 'contact')
          send({ type: 'lumiphone:contact_saved', requestId, contactId: contact.id }, userId)
        })
        break
      }
      case 'lumiphone:generate_contact':
        await generateNpcContact(payload, userId)
        break
      case 'lumiphone:sync_scene_contacts':
        await syncSceneContacts(payload, userId)
        break
      case 'lumiphone:open_direct': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const contactId = text(payload.contactId, 180)
          if (!state.contacts.some((entry) => entry.id === contactId)) throw new Error('That contact no longer exists.')
          const conversation = ensureDirectConversation(state, contactId, nowIso(), id)
          await saveState(state, userId)
          send({ type: 'lumiphone:conversation_opened', requestId, conversationId: conversation.id }, userId)
          await sendState(state, userId, 'conversation')
        })
        break
      }
      case 'lumiphone:create_conversation': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const participantContactIds = [...new Set((Array.isArray(payload.participantContactIds) ? payload.participantContactIds : []).map((entry) => text(entry, 180)).filter((entry) => state.contacts.some((contact) => contact.id === entry)))].slice(0, 16)
          if (participantContactIds.length < 2) throw new Error('A group conversation needs at least two contacts.')
          const createdAt = nowIso()
          const conversation: PocketConversation = {
            id: id('conversation'), kind: 'group', title: text(payload.title, 120) || participantContactIds.map((entry) => state.contacts.find((contact) => contact.id === entry)?.name).filter(Boolean).join(', ').slice(0, 120) || 'Group',
            participantContactIds, messages: [], unread: 0, createdAt, updatedAt: createdAt,
          }
          state.conversations.push(conversation)
          await saveState(state, userId)
          await sendState(state, userId, 'conversation')
          send({ type: 'lumiphone:conversation_opened', requestId, conversationId: conversation.id }, userId)
        })
        break
      }
      case 'lumiphone:update_conversation': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const conversation = state.conversations.find((entry) => entry.id === text(payload.conversationId, 180))
          if (!conversation || conversation.kind !== 'group') throw new Error('That group conversation no longer exists.')
          const participantContactIds = [...new Set((Array.isArray(payload.participantContactIds) ? payload.participantContactIds : conversation.participantContactIds).map((entry) => text(entry, 180)).filter((entry) => state.contacts.some((contact) => contact.id === entry)))].slice(0, 16)
          if (participantContactIds.length < 2) throw new Error('A group conversation needs at least two contacts.')
          conversation.participantContactIds = participantContactIds
          conversation.title = text(payload.title, 120) || conversation.title
          conversation.updatedAt = nowIso()
          await saveState(state, userId)
          await sendState(state, userId, 'conversation')
        })
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
          const nextRoleplayNow = text(payload.roleplayNow, 80) || state.roleplayNow
          state.trackers = state.trackers.map((tracker) => materializeTracker(tracker, nextRoleplayNow).tracker)
          state.roleplayNow = nextRoleplayNow
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
          messageId: text(payload.messageId, 180),
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
          const conversationId = text(payload.conversationId, 180)
          const legacyContactId = text(payload.contactId, 180)
          const conversation = state.conversations.find((entry) => entry.id === conversationId) || state.conversations.find((entry) => entry.kind === 'direct' && entry.participantContactIds[0] === legacyContactId)
          if (conversation) {
            conversation.unread = 0
            conversation.messages.forEach((message) => { message.read = true; message.status = 'read' })
          }
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
          if (kind === 'contact') {
            state.contacts = state.contacts.filter((entry) => entry.id !== targetId)
          }
          if (kind === 'conversation') state.conversations = state.conversations.filter((entry) => entry.id !== targetId)
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
        send({ type: 'lumiphone:export_data', requestId, data: { product: 'Pocket', exportVersion: 3, state: { ...state, processedCommands: [] }, preferences: await loadPreferences(userId) } }, userId)
        break
      }
      case 'lumiphone:import_data': {
        if (!isRecord(payload.data)) throw new Error('Import must be a Pocket JSON object.')
        const rawState = isRecord(payload.data.state) ? payload.data.state : payload.data
        if (Number(rawState.version) > STATE_VERSION) throw new Error('This backup uses a newer Pocket state schema.')
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
    spindle.log.error(`Pocket request failed: ${message}`)
    send({ type: 'lumiphone:error', requestId, error: message }, userId)
  }
}

function registerTool(): void {
  if (!spindle.permissions.has('tools')) return
  spindle.registerTool({
    name: 'phone_action',
    display_name: 'Pocket Action',
    description: 'Use Pocket, the character-aware roleplay phone: send a text, create or update a compact contact, write a journal note, schedule a timeline event, change fictional weather, update a typed tracker, take an AI camera photo, show a notification, or open the phone. State persists per chat and character.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['message', 'contact', 'note', 'event', 'weather', 'tracker', 'camera', 'notify', 'open'] },
        chat_id: { type: 'string', description: 'Current chat id when known.' },
        character_id: { type: 'string', description: 'Current character id when known.' },
        payload: {
          type: 'object',
          description: 'Action data. tracker operations target trackerId or stable key (label is legacy fallback) and use operation set/add/subtract/reset/set_state plus amount/state/reason. Tracker configuration supports kind, target, updateMode, clock real|roleplay, visibility and allowModelWrite. Other actions use message text/contact_name; note title/body; event title/start/end; weather fields; camera prompt; notify route/title/body.',
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
      const injected = { role: 'system' as const, content: `${PHONE_GUIDANCE}\nCurrent Pocket snapshot:\n${projectPhoneContext(state)}` }
      return { messages: [...messages, injected], breakdown: [{ messageIndex: messages.length, name: 'Pocket memory' }] }
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
    const merged = {
      ...args, ...(isRecord(args.payload) ? args.payload : {}), payload: args.payload,
      idempotencyKey: text(payload.requestId, 240), messageId: text((payload as any).messageId, 180),
    }
    const result = await applyAction(merged, undefined, 'model')
    return JSON.stringify(result)
  } catch (error) {
    return `Pocket action failed: ${error instanceof Error ? error.message : String(error)}`
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

spindle.log.info('Pocket backend loaded.')
