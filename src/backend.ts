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
  PocketGenerationInfo,
  PocketGenerationRun,
  ProcessedPocketCommand,
  PhoneState,
  PhoneTracker,
  PocketContact,
  PocketContactSourceOption,
  PocketConversation,
  PocketRelay,
  PocketResolvedWallpapers,
  ChatPocketPersona,
  SceneActorSnapshot,
  RoleplayWeather,
  SwarmVisualProfile,
} from './types.js'
import { defaultPreferences, isFuturePreferences, normalizeImageSource, normalizePreferences, normalizeWallpaper, PREFERENCES_PATH } from './domain/preferences.js'
import { projectPhoneContext } from './domain/projection.js'
import { legacyActionRoute, normalizePocketRoute } from './domain/navigation.js'
import { applyTrackerOperation, materializeTracker, normalizeTracker, trackerKey } from './domain/trackers.js'
import { contactAccent, contactSourceKey, ensureDirectConversation, normalizeContactCollections, normalizePocketContact, stableContactAccent } from './domain/contacts.js'
import { clearNotifications, destinationIsVisible, dismissNotification, markNotificationRead } from './domain/notifications.js'
import { ambientEligibleContacts, contactCooldownReady, shouldTakeAmbientOpportunity } from './domain/messaging.js'
import { inspectPocketGeneration, runPocketGeneration } from './backend/generation.js'
import { parseGeneratedObject, parseWithTruncationRetry } from './backend/structured.js'
import { assemblePocketContext } from './backend/roleplay-context.js'
import { conversationTailSnapshot, normalizeReplyDecision, pendingRelayContext, relayForGeneration, relayIdFromMessages, relayLatestExchange } from './backend/continuity.js'
import { assertPocketImageResolved, resolvePocketImageSource } from './backend/image-sources.js'

declare const spindle: import('lumiverse-spindle-types').SpindleAPI

type AnyRecord = Record<string, unknown>

const STATE_VERSION = 7 as const
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
const ambientFlights = new Set<string>()
const replyDecisionFlights = new Set<string>()
const replyBurstTimers = new Map<string, ReturnType<typeof setTimeout>>()
const relayFlights = new Set<string>()
interface PocketViewState { chatId: string; characterId: string; open: boolean; route: PocketRoute; updatedAt: number }
const frontendViews = new Map<string, PocketViewState>()

const PHONE_GUIDANCE = `Pocket is available as an in-world phone shared with the current character. Use the registered phone_action tool when it is available. If tools are unavailable and a phone action materially belongs in the scene, emit exactly one hidden tag:
<lumi-phone action="message|contact|scene|note|event|weather|tracker|camera|notify|open" app="messages|contacts|notes|calendar|weather|trackers|camera|home" title="short title">content or compact JSON</lumi-phone>
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

function defaultPocketPersona(createdAt = nowIso()): ChatPocketPersona {
  return { source: 'lumiverse', linkedPersonaId: '', displayName: 'You', pronouns: '', role: 'Persona', identityBrief: '', avatarUrl: '', accent: '#8b7dff', canAppear: false, updatedAt: createdAt }
}

function normalizePocketPersona(value: unknown, fallback = defaultPocketPersona()): ChatPocketPersona {
  const raw = isRecord(value) ? value : {}
  const source = raw.source === 'manual' || raw.source === 'generated' ? raw.source : 'lumiverse'
  return {
    source,
    linkedPersonaId: text(raw.linkedPersonaId, 180),
    displayName: text(raw.displayName, 120) || fallback.displayName,
    pronouns: text(raw.pronouns, 120),
    role: text(raw.role, 120) || fallback.role,
    identityBrief: text(raw.identityBrief, 1_200),
    avatarUrl: text(raw.avatarUrl, 2_000),
    accent: /^#[0-9a-f]{6}$/i.test(text(raw.accent, 20)) ? text(raw.accent, 20) : fallback.accent,
    canAppear: bool(raw.canAppear),
    updatedAt: text(raw.updatedAt, 40) || fallback.updatedAt,
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
    sceneSnapshot: null,
    pocketPersona: defaultPocketPersona(createdAt),
    setup: { initialized: false, dismissed: false },
    contacts: collections.contacts,
    conversations: collections.conversations,
    notes: [],
    events: [],
    relays: [],
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
      lane: text(item.lane, 80) || 'Main timeline', completed: item.kind === 'phone-handoff' ? true : bool(item.completed), createdBy,
      kind: item.kind === 'phone-handoff' ? 'phone-handoff' : 'event',
      actorContactIds: (Array.isArray(item.actorContactIds) ? item.actorContactIds : []).map((entry) => text(entry, 180)).filter(Boolean).slice(0, 8),
      source: isRecord(item.source) && item.source.app === 'messages' ? {
        app: 'messages' as const, conversationId: text(item.source.conversationId, 180), relayId: text(item.source.relayId, 180), messageId: text(item.source.messageId, 180) || undefined,
      } : undefined,
      channelTransition: isRecord(item.channelTransition) && item.channelTransition.to === 'local' ? {
        from: item.channelTransition.from === 'arriving' || item.channelTransition.from === 'paused' ? item.channelTransition.from : 'remote',
        to: 'local' as const,
        reason: item.channelTransition.reason === 'arrived' || item.channelTransition.reason === 'took_action' || item.channelTransition.reason === 'continued_in_person' ? item.channelTransition.reason : 'in_scene',
      } : undefined,
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
      dismissedAt: text(item.dismissedAt, 40) || undefined,
      source: item.source === 'automatic' || item.source === 'system' ? item.source : 'model',
      severity: item.severity === 'important' || item.severity === 'error' ? item.severity : 'info',
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
  const snapshotValue = isRecord(value.sceneSnapshot) ? value.sceneSnapshot : null
  const sceneSnapshot: SceneActorSnapshot | null = snapshotValue ? {
    actors: (Array.isArray(snapshotValue.actors) ? snapshotValue.actors : []).slice(0, 8).flatMap((entry) => {
      if (!isRecord(entry)) return []
      const contactId = text(entry.contactId, 180)
      if (!contactId) return []
      return [{ contactId, roleHint: text(entry.roleHint, 120), sceneBrief: text(entry.sceneBrief, 600) }]
    }),
    capturedAt: text(snapshotValue.capturedAt, 40) || nowIso(),
    sourceMessageId: text(snapshotValue.sourceMessageId, 180),
    sourceMessageIndex: Math.max(-1, Math.round(numberValue(snapshotValue.sourceMessageIndex, -1))),
    sourceRevision: Math.max(0, Math.round(numberValue(snapshotValue.sourceRevision, 0))),
    stale: bool(snapshotValue.stale, true),
  } : null
  const setupValue = isRecord(value.setup) ? value.setup : {}
  const relays: PocketRelay[] = (Array.isArray(value.relays) ? value.relays : []).slice(-24).flatMap((item) => {
    if (!isRecord(item)) return []
    const relayId = text(item.id, 180)
    const contactId = text(item.contactId, 180)
    const conversationId = text(item.conversationId, 180)
    const tail = isRecord(item.conversationTail) ? item.conversationTail : isRecord(item.conversationSnapshot) ? item.conversationSnapshot : {}
    const continuation = isRecord(item.continuation) ? item.continuation : {}
    if (!relayId || !contactId || !conversationId) return []
    const reason = item.reason === 'arrived' || item.reason === 'took_action' || item.reason === 'continued_in_person' ? item.reason : 'in_scene'
    const continuationState = continuation.state === 'launching' || continuation.state === 'accepted' || continuation.state === 'started' || continuation.state === 'completed' || continuation.state === 'blocked' || continuation.state === 'failed' || continuation.state === 'stopped'
      ? continuation.state
      : continuation.state === 'requested' ? 'accepted' : 'idle'
    return [{
      id: relayId, chatId, characterId, contactId, conversationId, reason, actorState: reason,
      burstId: text(item.burstId, 180) || undefined,
      conversationTail: {
        text: text(tail.text ?? tail.summary, 2_400),
        recentMessageIds: (Array.isArray(tail.recentMessageIds) ? tail.recentMessageIds : []).map((entry) => text(entry, 180)).filter(Boolean).slice(-8),
        updatedAt: text(tail.updatedAt, 40) || nowIso(),
      },
      latestExchange: text(item.latestExchange, 1_800), sourceMessageId: text(item.sourceMessageId, 180) || undefined,
      timelineEventId: text(item.timelineEventId, 180), createdAt: text(item.createdAt, 40) || nowIso(),
      status: item.status === 'consumed' || item.status === 'dismissed' ? item.status : 'pending',
      consumedAt: text(item.consumedAt, 40) || undefined, consumedMessageId: text(item.consumedMessageId, 180) || undefined,
      injectedAt: text(item.injectedAt, 40) || undefined,
      injectedGenerationId: text(item.injectedGenerationId, 180) || undefined,
      serializedRelayChars: Math.max(0, Math.round(numberValue(item.serializedRelayChars, 0))) || undefined,
      serializedRelay: text(item.serializedRelay, 3_600) || undefined,
      relayExchangeMessageCount: Math.max(0, Math.round(numberValue(item.relayExchangeMessageCount, 0))) || undefined,
      injectionError: text(item.injectionError, 500) || undefined,
      continuation: {
        state: continuationState,
        generationId: text(continuation.generationId, 180) || undefined,
        invokedAt: text(continuation.invokedAt ?? continuation.attemptedAt, 40) || undefined,
        permissionCheckedAt: text(continuation.permissionCheckedAt, 40) || undefined,
        permissions: isRecord(continuation.permissions) ? {
          chatMutation: continuation.permissions.chatMutation === true,
          generation: continuation.permissions.generation === true,
        } : undefined,
        method: continuation.method === 'spindle.chat.appendMessage(triggerGeneration)' ? continuation.method : undefined,
        hostCallReturnedAt: text(continuation.hostCallReturnedAt, 40) || undefined,
        hostAcceptedAt: text(continuation.hostAcceptedAt, 40) || undefined,
        generationStartedAt: text(continuation.generationStartedAt, 40) || undefined,
        generationCompletedAt: text(continuation.generationCompletedAt, 40) || undefined,
        sourceMessageId: text(continuation.sourceMessageId, 180) || undefined,
        error: text(continuation.error, 500) || undefined,
      },
    }]
  })
  const hadPocketData = Number(value.version || 0) > 0 && (collections.contacts.length > 1 || collections.conversations.some((entry) => entry.messages.length > 0) || notes.length > 0 || events.length > 0 || trackers.length > 0)
  return {
    version: STATE_VERSION,
    chatId,
    characterId,
    characterName: characterName || text(value.characterName, 120) || fallback.characterName,
    roleplayNow: text(value.roleplayNow, 80) || fallback.roleplayNow,
    sceneSnapshot,
    pocketPersona: normalizePocketPersona(value.pocketPersona, fallback.pocketPersona),
    setup: { initialized: bool(setupValue.initialized, hadPocketData), dismissed: bool(setupValue.dismissed) },
    contacts: collections.contacts,
    conversations: collections.conversations,
    notes, events, relays, weather, trackers, notifications, activities, processedCommands,
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

/** Interceptor DTOs in some Lumiverse builds omit characterId; chat ownership is authoritative for Pocket state scope. */
async function stateCharacterIdForChat(chatId: string, hintedCharacterId: unknown, userId?: string): Promise<string> {
  if (chatId && chatId !== '_lobby' && spindle.permissions.has('chats')) {
    try {
      const chat: any = await spindle.chats.get(chatId, userId)
      const characterId = text(chat?.character_id, 180)
      if (characterId) return characterId
    } catch { /* use the host hint when chat lookup is unavailable */ }
  }
  return text(hintedCharacterId, 180) || '_none'
}

async function resolveActivePocketPersona(userId?: string): Promise<ChatPocketPersona | null> {
  if (!spindle.permissions.has('personas')) return null
  try {
    const persona: any = await spindle.personas.getActive(userId)
    if (!persona) return null
    let avatarUrl = ''
    if (persona.image_id && spindle.permissions.has('images')) {
      const image: any = await spindle.images.get(String(persona.image_id), { specificity: 'sm', userId }).catch(() => null)
      avatarUrl = text(image?.url, 2_000)
    }
    const metadata = isRecord(persona.metadata) ? persona.metadata : {}
    return {
      source: 'lumiverse', linkedPersonaId: text(persona.id, 180), displayName: text(persona.name, 120) || 'You',
      pronouns: text(metadata.pronouns, 120), role: text(persona.title, 120) || text(metadata.role, 120) || 'Persona',
      identityBrief: text(persona.description, 1_200), avatarUrl, accent: /^#[0-9a-f]{6}$/i.test(text(metadata.color ?? metadata.accent, 20)) ? text(metadata.color ?? metadata.accent, 20) : '#8b7dff',
      canAppear: bool(metadata.canAppear), updatedAt: nowIso(),
    }
  } catch {
    return null
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
  if (state.pocketPersona.source === 'lumiverse') {
    const hostPersona = await resolveActivePocketPersona(userId)
    if (hostPersona) {
      const changed = JSON.stringify({ ...state.pocketPersona, updatedAt: '' }) !== JSON.stringify({ ...hostPersona, updatedAt: '' })
      state.pocketPersona = changed ? hostPersona : state.pocketPersona
      stateChanged ||= changed
    }
  }
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
    images: spindle.permissions.has('images'), corsProxy: spindle.permissions.has('cors_proxy'), imageGen: spindle.permissions.has('image_gen'),
    panels: spindle.permissions.has('ui_panels'), push: spindle.permissions.has('push_notification'),
    sceneSync: spindle.permissions.has('chat_mutation'),
  }
}

function send(payload: unknown, userId?: string): void {
  spindle.sendToFrontend(payload, userId)
}

async function resolveWallpaperUrls(preferences: DevicePreferences, personaId: string, userId?: string): Promise<PocketResolvedWallpapers> {
  const persona = personaId ? preferences.personaAppearance[personaId] : null
  const [deviceHome, deviceChat, personaHome, personaChat] = await Promise.all([
    resolvePocketImageSource(spindle, preferences.homeWallpaper.source, userId),
    resolvePocketImageSource(spindle, preferences.chatWallpaper.source, userId),
    resolvePocketImageSource(spindle, persona?.enabled ? persona.homeWallpaper.source : null, userId),
    resolvePocketImageSource(spindle, persona?.enabled ? persona.chatWallpaper.source : null, userId),
  ])
  return { deviceHome, deviceChat, personaHome, personaChat }
}

function assignWallpaper(preferences: DevicePreferences, payload: AnyRecord, forcedSource?: unknown): void {
  const target = text(payload.target, 40)
  const personaId = text(payload.personaId, 180)
  const current = target === 'persona-home' || target === 'persona-chat'
    ? preferences.personaAppearance[personaId]?.[target === 'persona-chat' ? 'chatWallpaper' : 'homeWallpaper']
    : preferences[target === 'device-chat' || target === 'chat' ? 'chatWallpaper' : 'homeWallpaper']
  if ((target === 'persona-home' || target === 'persona-chat') && (!personaId || !preferences.personaAppearance[personaId])) throw new Error('Enable a Persona appearance before assigning its wallpaper.')
  const raw = isRecord(payload.wallpaper) ? payload.wallpaper : {}
  const wallpaper = normalizeWallpaper({ ...current, ...raw, source: forcedSource === undefined ? raw.source ?? payload.source : forcedSource })
  if (target === 'persona-home' || target === 'persona-chat') {
    preferences.personaAppearance[personaId][target === 'persona-chat' ? 'chatWallpaper' : 'homeWallpaper'] = wallpaper
  } else preferences[target === 'device-chat' || target === 'chat' ? 'chatWallpaper' : 'homeWallpaper'] = wallpaper
}

function imageSourceKey(source: DevicePreferences['homeWallpaper']['source']): string {
  if (!source) return ''
  return source.kind === 'gallery' ? `gallery:${source.imageId}` : source.kind === 'asset' ? `asset:${source.assetId}` : `url:${source.url}`
}

async function validateChangedWallpaperSources(existing: DevicePreferences, next: DevicePreferences, userId?: string): Promise<void> {
  const pairs: Array<[DevicePreferences['homeWallpaper']['source'], DevicePreferences['homeWallpaper']['source']]> = [
    [existing.homeWallpaper.source, next.homeWallpaper.source],
    [existing.chatWallpaper.source, next.chatWallpaper.source],
  ]
  const personaIds = new Set([...Object.keys(existing.personaAppearance), ...Object.keys(next.personaAppearance)])
  for (const personaId of personaIds) {
    pairs.push(
      [existing.personaAppearance[personaId]?.homeWallpaper.source || null, next.personaAppearance[personaId]?.homeWallpaper.source || null],
      [existing.personaAppearance[personaId]?.chatWallpaper.source || null, next.personaAppearance[personaId]?.chatWallpaper.source || null],
    )
  }
  for (const [before, after] of pairs) {
    if (!after || imageSourceKey(before) === imageSourceKey(after)) continue
    assertPocketImageResolved(await resolvePocketImageSource(spindle, after, userId))
  }
}

async function sendState(state: PhoneState, userId?: string, reason = 'refresh', open = false): Promise<void> {
  const preferences = await loadPreferences(userId)
  let generation: PocketGenerationInfo = { mode: preferences.generationMode, effective: null, connections: [], history: preferences.generationHistory, modelOverride: preferences.sidecarModelOverride }
  try { generation = await inspectPocketGeneration({ spindle, loadPreferences, savePreferences, send }, preferences, userId) }
  catch (error) { spindle.log.warn(`Pocket could not inspect generation profiles: ${error instanceof Error ? error.message : String(error)}`) }
  const swarmProfile = await resolveSwarmProfile(state.chatId, state.characterId, preferences, userId)
  let activePersona: { id: string; name: string } | null = null
  if (spindle.permissions.has('personas')) {
    try {
      const persona = await spindle.personas.getActive(userId)
      if (persona) activePersona = { id: text(persona.id, 180), name: text(persona.name, 120) || 'Persona' }
    } catch { /* appearance falls back to device defaults */ }
  }
  const resolvedWallpapers = await resolveWallpaperUrls(preferences, activePersona?.id || '', userId)
  for (const [target, result] of Object.entries(resolvedWallpapers)) {
    if (result.status === 'error') spindle.log.warn(`Pocket image resolution failed (${target}/${result.sourceKind}): ${result.error || 'unknown error'}`)
  }
  send({ type: 'lumiphone:state', state, preferences, resolvedWallpapers, capabilities: capabilities(), generation, swarmProfile, activePersona, reason, open }, userId)
}

function viewKey(userId?: string): string { return userId || '_default' }

function currentView(userId?: string): PocketViewState | null {
  const view = frontendViews.get(viewKey(userId))
  return view && Date.now() - view.updatedAt < 120_000 ? view : null
}

function notificationDestinationVisible(state: PhoneState, route: PocketRoute, userId?: string): boolean {
  const view = currentView(userId)
  return Boolean(view && view.chatId === state.chatId && view.characterId === state.characterId && destinationIsVisible(view.open, view.route, route))
}

function addNotification(state: PhoneState, notification: Omit<PhoneNotification, 'id' | 'createdAt' | 'read'>, userId?: string): PhoneNotification | null {
  const route = notification.route || { app: notification.app }
  if (notificationDestinationVisible(state, route as PocketRoute, userId)) return null
  const entry: PhoneNotification = { ...notification, id: id('ntf'), createdAt: nowIso(), read: false }
  state.notifications.unshift(entry)
  state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS)
  return entry
}

function sendNotification(notification: PhoneNotification | null, userId?: string): void {
  if (notification) send({ type: 'lumiphone:notification', notification }, userId)
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
      const listed: any = await spindle.characters.list({ limit: 200, offset: 0, userId })
      for (const character of Array.isArray(listed?.data) ? listed.data : []) {
        const sourceId = text(character?.id, 180)
        const name = text(character?.name, 120)
        if (!sourceId || !name) continue
        options.push({
          kind: 'character', sourceId, name, role: 'Character',
          description: text(character?.description, 600),
          avatarUrl: text(character?.avatar_url ?? character?.avatarUrl, 2_000),
          accent: text(character?.color ?? character?.accent ?? character?.metadata?.color, 20),
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
        accent: text(member?.color ?? member?.accent, 20),
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

async function runStructuredGeneration(
  task: PocketGenerationRun['task'],
  requestId: string,
  request: AnyRecord,
  userId?: string,
): Promise<AnyRecord> {
  const first: any = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, task, requestId, request, userId)
  return parseWithTruncationRetry(first.content, async () => {
    const parameters = isRecord(request.parameters) ? request.parameters : {}
    const maxTokens = Math.min(1_600, Math.max(80, Math.round(numberValue(parameters.max_tokens, 400) * 1.6)))
    const retry: any = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, task, `${requestId}:truncation-retry`, {
      ...request,
      parameters: { ...parameters, max_tokens: maxTokens },
    }, userId)
    return retry.content
  })
}

function upsertContact(state: PhoneState, contact: PocketContact): PocketContact {
  const sourceKey = contactSourceKey(contact.source)
  const existing = state.contacts.find((entry) => entry.id === contact.id || (contact.source.kind !== 'npc' && contactSourceKey(entry.source) === sourceKey) || (
    contact.source.kind === 'npc' && entry.source.kind === 'npc' && contact.source.sceneKey && entry.source.sceneKey === contact.source.sceneKey
  ))
  if (existing) {
    const preserved = {
      createdAt: existing.createdAt, accent: existing.accent, contextPolicy: existing.contextPolicy,
      avatarOverrideUrl: existing.avatarOverrideUrl, colorMode: existing.colorMode, sourceAccent: contact.sourceAccent || existing.sourceAccent,
      generationPolicy: contact.generationPolicy || existing.generationPolicy,
      messagingPolicy: contact.messagingPolicy || existing.messagingPolicy,
    }
    Object.assign(existing, contact, preserved, { updatedAt: nowIso() })
    return existing
  }
  state.contacts.push(contact)
  state.contacts = state.contacts.slice(-80)
  return contact
}

function reconcileContactAvailability(state: PhoneState, contact: PocketContact): void {
  const conversation = state.conversations.find((entry) => entry.kind === 'direct' && entry.participantContactIds[0] === contact.id)
  if (!conversation) return
  if (contact.presence.inScene) {
    const prior = conversation.availability.state === 'paused' ? conversation.availability.reason : undefined
    const reason = conversation.availability.state === 'arriving' ? 'arrived' : 'in_scene'
    conversation.availability = prior ? { state: 'local', reason, resumePauseReason: prior } : { state: 'local', reason }
  } else if (conversation.availability.state === 'local') {
    conversation.availability = conversation.availability.resumePauseReason ? { state: 'paused', reason: conversation.availability.resumePauseReason } : { state: 'remote' }
    if (conversation.availability.state === 'remote') conversation.pause = undefined
  }
}

function commitConversationHandoff(
  state: PhoneState,
  conversation: PocketConversation,
  contact: PocketContact,
  decision: ReturnType<typeof normalizeReplyDecision>,
): PocketRelay {
  const createdAt = decision.createdAt
  const reason = decision.reason === 'arrived' || decision.reason === 'took_action' || decision.reason === 'continued_in_person' ? decision.reason : 'in_scene'
  const previous = conversation.availability.state === 'arriving' || conversation.availability.state === 'paused' ? conversation.availability.state : 'remote'
  const resumePauseReason = conversation.availability.state === 'paused' ? conversation.availability.reason : undefined
  conversation.availability = resumePauseReason ? { state: 'local', reason, resumePauseReason } : { state: 'local', reason }
  conversation.pause = undefined
  conversation.tailSnapshot = conversationTailSnapshot(conversation, createdAt)
  const existing = state.relays.find((entry) => entry.status === 'pending' && entry.conversationId === conversation.id && decision.burstId && entry.burstId === decision.burstId)
  if (existing) {
    decision.relayId = existing.id
    conversation.lastDecision = decision
    return existing
  }
  const relayId = id('relay')
  const eventId = id('evt')
  const latestMessageId = conversation.messages.at(-1)?.id
  const relay: PocketRelay = {
    id: relayId, chatId: state.chatId, characterId: state.characterId, contactId: contact.id, conversationId: conversation.id,
    burstId: decision.burstId, reason, actorState: reason, conversationTail: conversation.tailSnapshot, latestExchange: relayLatestExchange(conversation),
    sourceMessageId: latestMessageId, timelineEventId: eventId, createdAt, status: 'pending', continuation: { state: 'idle' },
  }
  decision.relayId = relayId
  conversation.lastDecision = decision
  state.relays.push(relay)
  state.relays = state.relays.slice(-24)
  state.events.push({
    id: eventId, title: `${contact.name} continued in person`, description: relay.latestExchange,
    start: state.roleplayNow || createdAt, end: state.roleplayNow || createdAt, whenKind: 'relative', whenText: 'Now',
    color: contactAccent(contact), lane: 'Phone handoffs', completed: true, createdBy: 'model', kind: 'phone-handoff',
    actorContactIds: [contact.id], source: { app: 'messages', conversationId: conversation.id, relayId, messageId: latestMessageId },
    channelTransition: { from: previous, to: 'local', reason },
  })
  state.events = state.events.slice(-MAX_EVENTS)
  addActivity(state, {
    kind: 'timeline', title: `${contact.name} is here now`, summary: 'Pocket handed the conversation back to the physical scene.',
    route: { app: 'calendar', eventId }, source: { contactId: contact.id, conversationId: conversation.id, eventId },
  })
  return relay
}

async function requestRelayContinuation(chatId: string, characterId: string, relayId: string, userId?: string): Promise<void> {
  const method = 'spindle.chat.appendMessage(triggerGeneration)' as const
  const permissions = {
    chatMutation: spindle.permissions.has('chat_mutation'),
    generation: spindle.permissions.has('generation'),
  }
  const invokedAt = nowIso()
  spindle.log.info(`Pocket relay continuation invoked: relay=${relayId} chat=${chatId} method=${method} chat_mutation=${permissions.chatMutation} generation=${permissions.generation}`)
  const flightKey = `${viewKey(userId)}:${chatId}`
  if (relayFlights.has(flightKey)) return
  relayFlights.add(flightKey)
  try {
    const launch = await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId)
      const relay = state.relays.find((entry) => entry.id === relayId && entry.status === 'pending')
      if (!relay || relay.continuation.state === 'launching' || relay.continuation.state === 'accepted' || relay.continuation.state === 'started') return { proceed: false, error: '' }
      const missing = [!permissions.chatMutation ? 'Chat mutation' : '', !permissions.generation ? 'Generation' : ''].filter(Boolean)
      if (missing.length) {
        const error = `${missing.join(' and ')} permission${missing.length > 1 ? 's are' : ' is'} required to continue in roleplay.`
        relay.continuation = {
          state: 'blocked', invokedAt, permissionCheckedAt: nowIso(), permissions, method, error,
        }
        await saveState(state, userId)
        await sendState(state, userId, 'relay_blocked')
        return { proceed: false, error }
      }
      const activeRelay = state.relays.find((entry) => entry.id !== relayId && entry.status === 'pending' && (
        entry.continuation.state === 'launching' || entry.continuation.state === 'accepted' || entry.continuation.state === 'started'
      ))
      if (activeRelay) return { proceed: false, error: `Pocket is already continuing relay ${activeRelay.id} in this roleplay.` }
      relay.continuation = {
        state: 'launching', invokedAt, permissionCheckedAt: nowIso(), permissions, method,
      }
      relay.injectedAt = undefined
      relay.injectedGenerationId = undefined
      relay.serializedRelayChars = undefined
      relay.serializedRelay = undefined
      relay.relayExchangeMessageCount = undefined
      relay.injectionError = undefined
      await saveState(state, userId)
      await sendState(state, userId, 'relay_launching')
      return { proceed: true, error: '' }
    })
    if (!launch.proceed) {
      if (launch.error) send({ type: 'lumiphone:error', error: launch.error }, userId)
      return
    }
    const appended = await spindle.chat.appendMessage(chatId, {
      role: 'user',
      content: 'Continue the current scene from the Pocket conversation handoff.',
      metadata: { source: 'pocket', pocketRelayId: relayId, pocketContinuation: true },
    }, { triggerGeneration: true })
    await spindle.chat.setMessageHidden(chatId, appended.id, true).catch(() => undefined)
    const generationId = text(appended.generationId, 180)
    if (!generationId) throw new Error(`Lumiverse returned from ${method} without a generation ID; the continuation was not accepted.`)
    const hostReturnedAt = nowIso()
    spindle.log.info(`Pocket relay host call accepted: relay=${relayId} generation=${generationId} message=${appended.id}`)
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId)
      const relay = state.relays.find((entry) => entry.id === relayId && entry.status === 'pending')
      if (!relay) return
      relay.continuation = {
        ...relay.continuation,
        state: relay.continuation.state === 'started' ? 'started' : 'accepted',
        generationId,
        sourceMessageId: appended.id,
        hostCallReturnedAt: hostReturnedAt,
        hostAcceptedAt: hostReturnedAt,
        error: undefined,
      }
      await saveState(state, userId)
      await sendState(state, userId, relay.continuation.state === 'started' ? 'relay_started' : 'relay_accepted')
    })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500)
    spindle.log.error(`Pocket relay continuation failed: relay=${relayId} method=${method} error=${message}`)
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId)
      const relay = state.relays.find((entry) => entry.id === relayId && entry.status === 'pending')
      if (!relay) return
      relay.continuation = {
        ...relay.continuation,
        state: 'failed',
        invokedAt: relay.continuation.invokedAt || invokedAt,
        permissionCheckedAt: relay.continuation.permissionCheckedAt || invokedAt,
        permissions: relay.continuation.permissions || permissions,
        method,
        hostCallReturnedAt: nowIso(),
        error: message,
      }
      await saveState(state, userId)
      await sendState(state, userId, 'relay_failed')
    })
    send({ type: 'lumiphone:error', error: message }, userId)
  } finally {
    relayFlights.delete(flightKey)
  }
}

function contactFromSource(option: PocketContactSourceOption): PocketContact {
  const createdAt = nowIso()
  const source = option.kind === 'character'
    ? { kind: 'character' as const, characterId: option.sourceId }
    : { kind: 'council' as const, memberId: option.sourceId, itemId: option.itemId || '' }
  return {
    id: id('contact'), name: option.name, role: option.role, description: option.description,
    identityBrief: option.description, sceneNote: '',
    avatarUrl: option.avatarUrl, sourceAvatarUrl: option.avatarUrl, avatarOverrideUrl: '',
    accent: stableContactAccent(`${option.kind}:${option.sourceId}`), sourceAccent: /^#[0-9a-f]{6}$/i.test(option.accent || '') ? option.accent! : '', colorMode: 'pocket', source,
    presence: { inScene: false, lastSceneAt: '' }, contextPolicy: { pinned: false }, generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' }, createdAt, updatedAt: createdAt,
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

async function resolveSwarmProfile(chatId: string, characterId: string, settings?: DevicePreferences, userId?: string): Promise<SwarmVisualProfile> {
  const manual = settings?.manualVisualProfile || defaultPreferences().manualVisualProfile
  const fallback: SwarmVisualProfile = {
    available: false,
    status: settings?.useSwarmProfile === false ? 'disabled' : 'not-detected',
    error: '',
    characterPositive: manual.positive,
    personaPositive: '',
    negative: manual.negative,
    presets: '',
    checkpoint: manual.model,
    aspect: '',
    source: 'manual',
    fields: {
      char_base: { detected: false, length: 0, preview: '' },
      persona_base: { detected: false, length: 0, preview: '' },
      swarm_negative: { detected: false, length: 0, preview: '' },
      swarm_preset: { detected: false, length: 0, preview: '' },
      swarm_checkpoint: { detected: false, length: 0, preview: '' },
      swarm_aspect: { detected: false, length: 0, preview: '' },
    },
  }
  if (!settings?.useSwarmProfile) return fallback
  try {
    const marker = '\n__LUMIPHONE_PROFILE_FIELD__\n'
    const template = ['{{char_base}}', '{{persona_base}}', '{{swarm_negative}}', '{{swarm_preset}}', '{{swarm_checkpoint}}', '{{swarm_aspect}}'].join(marker)
    const result = await spindle.macros.resolve(template, { chatId, characterId, userId, commit: false })
    const fields = result.text.split(marker).map((part) => part.trim().replace(/^\{\{[^}]+\}\}$/, ''))
    const [characterPositive = '', personaPositive = '', negative = '', presets = '', checkpoint = '', aspect = ''] = fields
    const macroNames = ['char_base', 'persona_base', 'swarm_negative', 'swarm_preset', 'swarm_checkpoint', 'swarm_aspect'] as const
    const diagnostics = Object.fromEntries(macroNames.map((name, index) => [name, {
      detected: Boolean(fields[index]), length: fields[index]?.length || 0, preview: (fields[index] || '').slice(0, 120),
    }])) as SwarmVisualProfile['fields']
    const available = Boolean(characterPositive || personaPositive || negative || presets || checkpoint || aspect)
    const resolutionWarnings = result.diagnostics.map((entry) => text(entry.message, 240)).filter(Boolean).slice(0, 3)
    if (!available) return resolutionWarnings.length
      ? { ...fallback, status: 'error', error: resolutionWarnings.join(' · '), fields: diagnostics }
      : { ...fallback, fields: diagnostics }
    return {
      available,
      status: 'connected',
      error: '',
      characterPositive: [manual.positive, characterPositive].filter(Boolean).join(', '),
      personaPositive,
      negative: [manual.negative, negative].filter(Boolean).join(', '),
      presets,
      checkpoint: manual.model || checkpoint,
      aspect,
      source: 'swarm_studio',
      fields: diagnostics,
    }
  } catch (error) {
    return { ...fallback, status: 'error', error: text(error instanceof Error ? error.message : String(error), 500) || 'Macro resolution failed.' }
  }
}

async function listGallery(input: AnyRecord, userId?: string): Promise<GalleryResult> {
  if (!spindle.permissions.has('images')) throw new Error('Enable the Images permission to use Gallery.')
  const context = await resolveContext(input, userId)
  const scope = text(input.scope, 30) || 'chat'
  const options: AnyRecord = { limit: 120, offset: 0, specificity: 'full', userId }
  if (scope === 'chat') options.chatId = context.chatId
  if (scope === 'character') options.characterId = context.characterId
  if (scope === 'phone') options.onlyOwned = true
  const result = await spindle.images.list(options as any)
  return {
    total: result.total,
    data: result.data.map((item) => ({
      id: item.id, url: item.url, fullUrl: item.url, thumbnailUrl: `${item.url}${String(item.url).includes('?') ? '&' : '?'}size=sm`, filename: item.original_filename, mimeType: item.mime_type,
      width: item.width, height: item.height, createdAt: item.created_at,
    })),
  }
}

async function enhanceScene(scene: string, state: PhoneState, preferences: DevicePreferences, profile: SwarmVisualProfile, requestId: string, userId?: string): Promise<string> {
  if (!preferences.sceneEnhancer || !spindle.permissions.has('generation')) return scene
  const response: any = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, 'scene-planner', `${requestId}:planner`, {
    type: 'quiet',
    messages: [
      { role: 'system', content: 'You are a concise image scene planner. Expand the user brief into one vivid diffusion-ready prompt. Preserve identity facts, subject count, action, camera, environment, lighting, and mood. Do not add names, explanations, headings, negative prompts, or markdown.' },
      { role: 'user', content: `Roleplay context: ${state.weather.location}; ${state.weather.condition}. Visual profile source: ${profile.source}.\nScene brief: ${scene}` },
    ],
    parameters: { temperature: 0.45, max_tokens: 450 },
    reasoning: { source: 'off' },
    userId,
  }, userId)
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
  const profile = await resolveSwarmProfile(context.chatId, context.characterId, preferences, userId)
  const controller = new AbortController()
  const job: CameraJob = { controller, cancelled: false, chatId: context.chatId, characterId: context.characterId, userId }
  cameraJobs.get(requestId)?.controller.abort()
  cameraJobs.set(requestId, job)
  send({ type: 'lumiphone:camera_progress', requestId, phase: 'planning', message: 'Planning the scene…', profile }, userId)
  let expanded = scene
  if (bool(input.enhance, preferences.sceneEnhancer)) {
    try {
      expanded = await enhanceScene(scene, state, preferences, profile, requestId, userId)
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
    app: 'camera', title: 'Photo ready', body: scene.slice(0, 180), route, source: 'system', severity: 'important',
  }, userId)
  const command = state.processedCommands.find((entry) => entry.id === text(input.__commandId, 240))
  const activity = addActivity(state, {
    kind: 'image', title: 'Photo ready', summary: scene.slice(0, 280), route,
    source: { messageId: text(input.__sourceMessageId, 180) || undefined, imageId: imageId || undefined },
  }, command)
  await saveState(state, userId)
  if (notification) await maybePush(state, preferences, notification, userId)
  await sendState(state, userId, 'camera', false)
  sendActivity(activity, userId)
  sendNotification(notification, userId)
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
    if (bool(input.autonomous) && (contact.presence.inScene || !contact.messagingPolicy.remoteEligible || (conversation.availability.state !== 'remote' && conversation.availability.state !== 'arriving'))) return
    send({
      type: 'lumiphone:message_progress', requestId, chatId: context.chatId, characterId: context.characterId,
      conversationId: conversation.id, contactId: contact.id, speakerContactId: contact.id, phase: 'pending',
    }, userId)
    const profile = await resolveContactProfile(contact, userId)
    const replaceMessageId = text(input.replaceMessageId, 180)
    const replaceIndex = replaceMessageId ? conversation.messages.findIndex((message) => message.id === replaceMessageId && message.sender === 'contact') : -1
    const contextConversation = replaceIndex >= 0 ? { ...conversation, messages: conversation.messages.slice(0, replaceIndex) } : conversation
    const compactIdentity = (contact.identityBrief || profile.description || [profile.role, profile.personality, profile.behavior].filter(Boolean).join('. ')).slice(0, 1_200)
    const assembled = await assemblePocketContext({
      state, contact, conversation: contextConversation, preferences,
      actorIdentity: compactIdentity,
      getMessages: spindle.permissions.has('chat_mutation') ? () => spindle.chat.getMessages(context.chatId) : undefined,
    })
    const instruction = text(input.instruction, 2_000) || 'Reply naturally to the latest message.'
    const generationTask = replaceIndex >= 0 ? 'message-retry' : 'message-reply'
    const generationInfo = await inspectPocketGeneration({ spindle, loadPreferences, savePreferences, send }, preferences, userId)
    const response: any = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, generationTask, requestId, {
      type: 'quiet',
      messages: [
        { role: 'system', content: `Write exactly one private phone text as ${profile.name}. Stay in character and do not speak for another participant. Return strict JSON only: {"message":"the phone text","after":{"state":"remote|arriving|local|paused","reason":""}}. after describes the channel immediately after this message. Use arriving while traveling toward the physical scene, local only when the message itself crosses into physical action or confirms arrival, paused for ended/busy/away/sleeping/unknown, otherwise remote. No narration, markdown, or custom UI copy. The compact identity and bounded context below are authoritative.` },
        { role: 'user', content: `${assembled.text || '(no context)'}\n\nDIRECTION\n${instruction}` },
      ],
      parameters: { temperature: 0.85, max_tokens: 500 },
      userId,
    }, userId)
    let generated: AnyRecord = {}
    try { generated = parseGeneratedObject(response.content) }
    catch { generated = { message: response.content, after: { state: 'remote' } } }
    const reply = text(generated.message, 8_000)
    if (!reply) throw new Error('The character did not return a phone message.')
    const route: PocketRoute = { app: 'messages', conversationId: conversation.id }
    const visible = notificationDestinationVisible(state, route, userId)
    const nextMessage: PhoneMessage = {
      id: id('msg'), sender: 'contact', senderContactId: contact.id, senderName: contact.name, senderAccent: contact.accent,
      text: reply, createdAt: nowIso(), read: visible, status: visible ? 'read' : 'delivered',
      generation: { requestId, retryOf: replaceIndex >= 0 ? replaceMessageId : undefined },
    }
    nextMessage.generation!.info = {
      speaker: profile.name,
      source: profile.source,
      sourceId: contact.source.kind === 'character' ? contact.source.characterId : contact.source.kind === 'council' ? contact.source.memberId || contact.source.itemId : contact.id,
      sourceResolution: contact.source.kind === 'character' || contact.source.kind === 'council' ? 'resolved' : contact.source.origin === 'manual' ? 'manual' : 'snapshot',
      activeCharacterId: state.characterId,
      activeCharacterUsed: contact.source.kind === 'character' && contact.source.characterId === state.characterId,
      identityChars: assembled.diagnostics.actorIdentityChars,
      sceneSnapshotStale: assembled.diagnostics.sceneSnapshot.stale,
      contextMode: preferences.roleplayContextMode,
      recentCount: assembled.diagnostics.recentRoleplay.count,
      recentChars: assembled.diagnostics.recentRoleplay.chars,
      storyCount: assembled.diagnostics.story.count,
      storyChars: assembled.diagnostics.story.chars,
      threadCount: assembled.diagnostics.phoneThread.count,
      threadChars: assembled.diagnostics.phoneThread.chars,
      generationMode: preferences.generationMode,
      connectionName: generationInfo.effective?.name || '',
      model: preferences.sidecarModelOverride || generationInfo.effective?.model || '',
    }
    nextMessage.senderAccent = contactAccent(contact)
    if (replaceIndex >= 0) conversation.messages.splice(replaceIndex, 1, nextMessage)
    else conversation.messages.push(nextMessage)
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES)
    if (!visible && replaceIndex < 0) conversation.unread += 1
    conversation.updatedAt = nowIso()
    const phoneMessageId = conversation.messages.at(-1)?.id
    route.messageId = phoneMessageId
    const notification = preferences.notifyMessages && replaceIndex < 0
      ? addNotification(state, { app: 'messages', title: contact.name, body: preferences.notificationPreviews ? reply.slice(0, 220) : 'New message', route, source: bool(input.ambient) ? 'automatic' : 'model', severity: 'important' }, userId)
      : null
    if (bool(input.initiated)) {
      contact.messagingPolicy.lastInitiatedMessageAt = nowIso()
      contact.messagingPolicy.lastInitiatedRoleplayAt = state.roleplayNow
    }
    let relayToContinue: PocketRelay | null = null
    if (replaceIndex < 0 && !bool(input.manualOverride)) {
      const after = isRecord(generated.after) ? generated.after : {}
      if (after.state === 'arriving') {
        conversation.pause = undefined
        conversation.availability = { state: 'arriving' }
      } else if (after.state === 'paused') {
        const allowed = new Set(['ended', 'busy', 'away', 'sleeping', 'unknown'])
        const reason = allowed.has(String(after.reason)) ? String(after.reason) as NonNullable<PocketConversation['pause']>['reason'] : 'unknown'
        conversation.pause = { reason, createdAt: nowIso(), source: 'model' }
        conversation.availability = { state: 'paused', reason }
      } else if (after.state === 'local') {
        const decision = normalizeReplyDecision({ rawAction: 'handoff', rawReason: after.reason, contact, conversation, explicitRemoteOverride: false, createdAt: nowIso() })
        relayToContinue = commitConversationHandoff(state, conversation, contact, decision)
        if (nextMessage.generation?.info) nextMessage.generation.info.replyDecision = {
          rawAction: decision.rawAction, normalizedAction: decision.normalizedAction, reason: decision.reason, normalizationReason: decision.normalizationReason,
        }
      } else {
        conversation.pause = undefined
        conversation.availability = { state: 'remote' }
      }
    }
    const activity = replaceIndex < 0 ? addActivity(state, { kind: 'message', title: contact.name, summary: reply.slice(0, 280), route, source: { contactId: contact.id, conversationId: conversation.id } }) : undefined
    await saveState(state, userId)
    if (notification) await maybePush(state, preferences, notification, userId)
    await sendState(state, userId, 'message', preferences.autoOpenOnModelAction)
    sendActivity(activity, userId)
    sendNotification(notification, userId)
    if (relayToContinue) setTimeout(() => void requestRelayContinuation(context.chatId, context.characterId, relayToContinue!.id, userId), 0)
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
  const requestId = text(input.requestId, 180) || id('npc')
  send({ type: 'lumiphone:operation_progress', task: 'npc-contact', requestId, phase: 'generating', message: 'Generating contact…' }, userId)
  const request: AnyRecord = {
    type: 'quiet',
    messages: [
      { role: 'system', content: 'Create one compact roleplay phone contact from the user description. Return strict JSON only with exactly these string fields: {"name":"","role":"","identityBrief":""}. No markdown. identityBrief contains only stable facts useful across scenes: role, general personality, enduring relationship, distinctive behavior. Do not invent unsupported backstory. Name and role max 120 characters; identityBrief max 900.' },
      { role: 'user', content: prompt },
    ],
    parameters: { temperature: 0.55, max_tokens: 350 }, userId,
  }
  const parsed = await runStructuredGeneration('npc-contact', requestId, request, userId)
  send({ type: 'lumiphone:operation_progress', task: 'npc-contact', requestId, phase: 'parsing', message: 'Parsing profile…' }, userId)
  const name = text(parsed.name, 120)
  if (!name) throw new Error('NPC generation did not return a valid name.')
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    send({ type: 'lumiphone:operation_progress', task: 'npc-contact', requestId, phase: 'saving', message: 'Saving contact…' }, userId)
    const state = await loadState(context.chatId, context.characterId, userId)
    const createdAt = nowIso()
    const identityBrief = text(parsed.identityBrief ?? parsed.description, 900)
    const contact = upsertContact(state, {
      id: id('contact'), name, role: text(parsed.role, 120) || 'Pocket NPC', description: identityBrief,
      identityBrief, sceneNote: '',
      avatarUrl: '', sourceAvatarUrl: '', avatarOverrideUrl: '', accent: stableContactAccent(name), sourceAccent: '', colorMode: 'pocket',
      source: { kind: 'npc', origin: 'generated', description: identityBrief },
      presence: { inScene: false, lastSceneAt: '' }, contextPolicy: { pinned: false }, generationPolicy: { relevant: true },
      messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' }, createdAt, updatedAt: createdAt,
    })
    const activity = addActivity(state, { kind: 'contact', title: `${contact.name} added`, summary: contact.role, route: { app: 'contacts', contactId: contact.id, view: 'detail' }, source: { contactId: contact.id } })
    await saveState(state, userId)
    await sendState(state, userId, 'contact')
    sendActivity(activity, userId)
    send({ type: 'lumiphone:operation_progress', task: 'npc-contact', requestId, phase: 'complete', message: 'Contact saved' }, userId)
    send({ type: 'lumiphone:contact_created', requestId, contactId: contact.id }, userId)
  })
}

async function refreshCompactContactProfile(input: AnyRecord, userId?: string): Promise<void> {
  if (!spindle.permissions.has('generation')) throw new Error('Enable Generation to refresh a compact contact profile.')
  const context = await resolveContext(input, userId)
  const requestId = text(input.requestId, 180) || id('profile')
  const state = await loadState(context.chatId, context.characterId, userId)
  const contact = state.contacts.find((entry) => entry.id === text(input.contactId, 180))
  if (!contact) throw new Error('That contact no longer exists.')
  const profile = await resolveContactProfile(contact, userId)
  send({ type: 'lumiphone:operation_progress', task: 'profile-refresh', requestId, phase: 'generating', message: 'Refreshing compact profile…' }, userId)
  const parsed = await runStructuredGeneration('profile-refresh', requestId, {
    type: 'quiet',
    messages: [
      { role: 'system', content: 'Condense the authoritative actor profile into stable phone-contact facts. Return strict JSON only: {"identityBrief":""}. Include stable role, personality, relationship, and distinctive behavior when supported. Exclude temporary scene state and do not invent facts. Maximum 900 characters.' },
      { role: 'user', content: `Name: ${profile.name}\nRole: ${profile.role}\nDescription: ${profile.description}\nPersonality: ${profile.personality}\nBehavior: ${profile.behavior}` },
    ],
    parameters: { temperature: 0.15, max_tokens: 320 }, userId,
  }, userId)
  const identityBrief = text(parsed.identityBrief, 900)
  if (!identityBrief) throw new Error('Profile refresh returned no stable identity brief.')
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    const latest = await loadState(context.chatId, context.characterId, userId)
    const target = latest.contacts.find((entry) => entry.id === contact.id)
    if (!target) throw new Error('That contact no longer exists.')
    target.name = profile.name
    target.role = profile.role || target.role
    target.identityBrief = identityBrief
    target.description = identityBrief
    target.updatedAt = nowIso()
    await saveState(latest, userId)
    await sendState(latest, userId, 'contact_profile')
    send({ type: 'lumiphone:operation_progress', task: 'profile-refresh', requestId, phase: 'complete', message: 'Compact profile refreshed' }, userId)
  })
}

function sceneKeyFor(name: string): string {
  return name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 120) || name.toLocaleLowerCase().slice(0, 120)
}

function actorName(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function uniqueAliasMatch(candidate: string, names: string[]): string | null {
  const normalized = actorName(candidate)
  if (!normalized) return null
  const exact = names.find((name) => actorName(name) === normalized)
  if (exact) return exact
  if (normalized.includes(' ')) return null
  const matches = names.filter((name) => actorName(name).split(' ').includes(normalized))
  return matches.length === 1 ? matches[0] : null
}

async function syncSceneContacts(input: AnyRecord, userId?: string): Promise<void> {
  if (!spindle.permissions.has('generation')) throw new Error('Enable Generation to identify scene contacts.')
  if (!spindle.permissions.has('chat_mutation')) throw new Error('Enable Chat Mutation so Pocket can read the recent scene when you request a sync.')
  const context = await resolveContext(input, userId)
  const requestId = text(input.requestId, 180) || id('scene')
  send({ type: 'lumiphone:operation_progress', task: 'scene-sync', requestId, phase: 'request', message: 'Reading current scene…' }, userId)
  const messages: any[] = await spindle.chat.getMessages(context.chatId)
  const authoritative = messages.at(-1)
  const transcript = messages.slice(-24).map((message) => `${message.role}: ${text(message.content, 1_200)}`).join('\n').slice(-16_000)
  const preflightState = await loadState(context.chatId, context.characterId, userId)
  const exclusions = [preflightState.characterName, preflightState.pocketPersona.displayName].filter(Boolean)
  send({ type: 'lumiphone:operation_progress', task: 'scene-sync', requestId, phase: 'generating', message: 'Finding scene contacts…' }, userId)
  const request: AnyRecord = {
    type: 'quiet',
    messages: [
      { role: 'system', content: `Identify named non-user actors physically present in the most recent roleplay scene. Return strict JSON only: {"contacts":[{"name":"","role":"","identityBrief":"","sceneNote":""}]}. Return at most 6. Exclude the primary Character and active Persona, including unambiguous short aliases. Explicit exclusions: ${exclusions.join(', ') || '(none)'}. Exclude merely mentioned, messaged, absent, historical, or hypothetical people. identityBrief is stable role/personality/relationship evidence only; sceneNote is why they are present, what they are doing, or their temporary state. Do not invent unsupported biography. Name/role max 120; identityBrief max 350; sceneNote max 220.` },
      { role: 'user', content: transcript || '(empty chat)' },
    ],
    parameters: { temperature: 0.2, max_tokens: 1_500 }, userId,
  }
  const parsed = await runStructuredGeneration('scene-sync', requestId, request, userId)
  send({ type: 'lumiphone:operation_progress', task: 'scene-sync', requestId, phase: 'parsing', message: 'Parsing scene roster…' }, userId)
  if (!Array.isArray(parsed.contacts)) throw new Error('Scene Sync returned no contacts array; no contact state was changed.')
  const aliasUniverse = [...new Set([...exclusions, ...preflightState.contacts.map((entry) => entry.name)])]
  const found = parsed.contacts.slice(0, 6).flatMap((entry) => {
    if (!isRecord(entry)) return []
    const name = text(entry.name, 120)
    if (!name) return []
    const excluded = uniqueAliasMatch(name, exclusions)
    if (excluded) return []
    return [{
      name, role: text(entry.role, 120) || 'Scene contact',
      identityBrief: text(entry.identityBrief ?? entry.description, 350),
      sceneNote: text(entry.sceneNote ?? entry.currentState, 220),
    }]
  })
  const relayIds: string[] = []
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    send({ type: 'lumiphone:operation_progress', task: 'scene-sync', requestId, phase: 'saving', message: 'Saving scene contacts…' }, userId)
    const state = await loadState(context.chatId, context.characterId, userId)
    const sceneAt = nowIso()
    for (const contact of state.contacts) contact.presence.inScene = false
    const contactIds: string[] = []
    for (const candidate of found) {
      const sceneKey = sceneKeyFor(candidate.name)
      const matchedName = uniqueAliasMatch(candidate.name, aliasUniverse)
      const existing = state.contacts.find((entry) => entry.source.kind === 'npc' && entry.source.origin === 'scene' && entry.source.sceneKey === sceneKey)
        || state.contacts.find((entry) => actorName(entry.name) === actorName(matchedName || candidate.name))
      if (existing && !(existing.source.kind === 'npc' && existing.source.origin === 'scene')) {
        existing.presence.inScene = true
        existing.presence.lastSceneAt = sceneAt
        existing.sceneNote = candidate.sceneNote
        existing.updatedAt = sceneAt
        contactIds.push(existing.id)
        continue
      }
      const createdAt = existing?.createdAt || sceneAt
      const contact = upsertContact(state, {
        id: existing?.id || id('contact'), name: candidate.name, role: candidate.role,
        description: existing?.identityBrief || candidate.identityBrief, identityBrief: existing?.identityBrief || candidate.identityBrief,
        sceneNote: candidate.sceneNote,
        avatarUrl: existing?.avatarUrl || '', sourceAvatarUrl: existing?.sourceAvatarUrl || '', avatarOverrideUrl: existing?.avatarOverrideUrl || '',
        accent: existing?.accent || stableContactAccent(sceneKey), sourceAccent: existing?.sourceAccent || '', colorMode: existing?.colorMode || 'pocket',
        source: { kind: 'npc', origin: 'scene', description: existing?.identityBrief || candidate.identityBrief, sceneKey },
        presence: { inScene: true, lastSceneAt: sceneAt }, contextPolicy: existing?.contextPolicy || { pinned: false },
        generationPolicy: existing?.generationPolicy || { relevant: true },
        messagingPolicy: existing?.messagingPolicy || { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' }, createdAt, updatedAt: sceneAt,
      })
      contactIds.push(contact.id)
    }
    state.sceneSnapshot = {
      actors: contactIds.map((contactId) => {
        const contact = state.contacts.find((entry) => entry.id === contactId)!
        return { contactId, roleHint: contact.role, sceneBrief: contact.sceneNote }
      }),
      capturedAt: sceneAt,
      sourceMessageId: text(authoritative?.id, 180),
      sourceMessageIndex: Number.isFinite(Number(authoritative?.index_in_chat)) ? Number(authoritative.index_in_chat) : messages.length - 1,
      sourceRevision: Math.max(0, Math.round(numberValue(authoritative?.revision, 0))),
      stale: false,
    }
    for (const conversation of state.conversations) {
      if (conversation.kind !== 'direct') continue
      const participant = state.contacts.find((entry) => entry.id === conversation.participantContactIds[0])
      if (participant?.presence.inScene && conversation.availability.state !== 'local') {
        const decision = normalizeReplyDecision({
          rawAction: 'handoff', rawReason: conversation.availability.state === 'arriving' ? 'arrived' : 'in_scene',
          contact: participant, conversation, explicitRemoteOverride: false, createdAt: sceneAt,
        })
        const relay = commitConversationHandoff(state, conversation, participant, decision)
        relayIds.push(relay.id)
      } else if (participant) {
        reconcileContactAvailability(state, participant)
      }
    }
    const activity = addActivity(state, {
      kind: 'contact', title: 'Scene contacts synced', summary: `${contactIds.length} actor${contactIds.length === 1 ? '' : 's'} present`,
      route: { app: 'contacts' }, source: {},
    })
    await saveState(state, userId)
    await sendState(state, userId, 'scene_contacts')
    sendActivity(activity, userId)
    send({ type: 'lumiphone:operation_progress', task: 'scene-sync', requestId, phase: 'complete', message: 'Scene contacts synced' }, userId)
    send({ type: 'lumiphone:scene_contacts_done', requestId, contactIds }, userId)
  })
  for (const relayId of [...new Set(relayIds)]) void requestRelayContinuation(context.chatId, context.characterId, relayId, userId)
}

function replyCadenceMs(preferences: DevicePreferences): number {
  return preferences.replyCadence === 'instant' ? 0 : preferences.replyCadence === 'quick' ? 1_200 : preferences.replyCadence === 'relaxed' ? 6_500 : 3_200
}

function burstTimerKey(chatId: string, characterId: string, conversationId: string, userId?: string): string {
  return `${viewKey(userId)}:${stateKey(chatId, characterId)}:${conversationId}`
}

async function scheduleReplyBurst(chatId: string, characterId: string, conversationId: string, userId?: string): Promise<void> {
  const timerKey = burstTimerKey(chatId, characterId, conversationId, userId)
  const previous = replyBurstTimers.get(timerKey)
  if (previous) clearTimeout(previous)
  const preferences = await loadPreferences(userId)
  if (!preferences.autoReplyAfterSend) return
  const state = await loadState(chatId, characterId, userId)
  const burst = state.conversations.find((entry) => entry.id === conversationId)?.outgoingBurst
  if (!burst?.open || burst.finalized || burst.held) return
  const timer = setTimeout(() => {
    replyBurstTimers.delete(timerKey)
    void maybeReplyAfterSend(chatId, characterId, conversationId, userId, burst.id)
  }, replyCadenceMs(preferences))
  replyBurstTimers.set(timerKey, timer)
}

async function maybeReplyAfterSend(chatId: string, characterId: string, conversationId: string, userId?: string, expectedBurstId = ''): Promise<void> {
  const flightKey = `${viewKey(userId)}:${stateKey(chatId, characterId)}:${conversationId}`
  if (replyDecisionFlights.has(flightKey)) return
  replyDecisionFlights.add(flightKey)
  let progressRequestId = ''
  try {
    const preferences = await loadPreferences(userId)
    if (!preferences.autoReplyAfterSend || !spindle.permissions.has('generation')) return
    const state = await loadState(chatId, characterId, userId)
    const conversation = state.conversations.find((entry) => entry.id === conversationId)
    if (!conversation || conversation.kind !== 'direct' || conversation.messages.at(-1)?.sender !== 'persona') return
    const burst = conversation.outgoingBurst
    if (expectedBurstId && (!burst || burst.id !== expectedBurstId || !burst.open || burst.finalized || burst.held)) return
    const contact = state.contacts.find((entry) => entry.id === conversation.participantContactIds[0])
    if (!contact || !contact.generationPolicy.relevant) return
    const burstMessages = burst?.messageIds.length
      ? conversation.messages.filter((message) => burst.messageIds.includes(message.id) && message.sender === 'persona')
      : [conversation.messages.at(-1)!]
    const requestId = id('reply_decision')
    progressRequestId = requestId
    send({
      type: 'lumiphone:message_progress', requestId, chatId, characterId,
      conversationId, contactId: contact.id, speakerContactId: contact.id, phase: 'checking',
    }, userId)
    const explicitRemoteOverride = Boolean(burst?.explicitRemoteOverride)
    const deterministicLocal = !explicitRemoteOverride && (contact.presence.inScene || conversation.availability.state === 'local')
    const rawDecision = deterministicLocal ? { action: 'handoff', reason: contact.presence.inScene ? conversation.availability.state === 'arriving' ? 'arrived' : 'in_scene' : conversation.availability.state === 'local' ? conversation.availability.reason : 'continued_in_person' } : !contact.messagingPolicy.remoteEligible
      ? { action: 'pause', reason: 'away' }
      : await runStructuredGeneration('reply-decision', requestId, {
        type: 'quiet',
        messages: [
          { role: 'system', content: 'Classify the next channel state of this fictional direct-message thread. The physical-scene facts are authoritative. Return strict JSON only: {"action":"reply"}, {"action":"none"}, {"action":"pause","reason":"ended|busy|away|sleeping|unknown"}, or {"action":"handoff","reason":"arriving|arrived|took_action|continued_in_person"}. none means the remote channel is still valid but no reply is warranted. Never use none when the actor is in the physical scene. arriving means they are traveling toward the scene but are not there yet. No prose or custom UI copy.' },
          { role: 'user', content: `Contact: ${contact.name} (${contact.role})\nChannel: ${conversation.availability.state}\nPresence: ${contact.presence.inScene ? 'physically in the active scene' : 'off-scene'}\nRemote eligible: ${contact.messagingPolicy.remoteEligible}\nScene snapshot: ${(state.sceneSnapshot?.actors || []).map((actor) => `${state.contacts.find((entry) => entry.id === actor.contactId)?.name || actor.contactId}: ${actor.sceneBrief}`).join(' | ') || 'none'}\nRecent DM:\n${conversation.messages.slice(-8).map((message) => `${message.senderName}: ${message.text.slice(0, 700)}`).join('\n')}\nSettled outgoing burst:\n${burstMessages.map((message) => message.text.slice(0, 1_200)).join('\n')}` },
        ],
        parameters: { temperature: 0.1, max_tokens: 100 }, userId,
      }, userId)
    const rawAction = rawDecision.action === 'reply' || rawDecision.reply === true ? 'reply' : rawDecision.action === 'pause' ? 'pause' : rawDecision.action === 'handoff' ? 'handoff' : 'none'
    const outcome = await withStateLock(stateKey(chatId, characterId), async (): Promise<{ action: ReturnType<typeof normalizeReplyDecision>['normalizedAction']; relayId?: string } | null> => {
      const latestState = await loadState(chatId, characterId, userId)
      const latestConversation = latestState.conversations.find((entry) => entry.id === conversationId)
      if (!latestConversation?.outgoingBurst || (expectedBurstId && latestConversation.outgoingBurst.id !== expectedBurstId)) return null
      const latestContact = latestState.contacts.find((entry) => entry.id === contact.id)
      if (!latestContact) return null
      latestConversation.outgoingBurst.open = false
      latestConversation.outgoingBurst.finalized = true
      latestConversation.outgoingBurst.updatedAt = nowIso()
      const decision = normalizeReplyDecision({
        rawAction, rawReason: rawDecision.reason, contact: latestContact, conversation: latestConversation,
        explicitRemoteOverride: latestConversation.outgoingBurst.explicitRemoteOverride, createdAt: nowIso(), burstId: latestConversation.outgoingBurst.id,
      })
      latestConversation.lastDecision = decision
      let relayId: string | undefined
      if (decision.normalizedAction === 'reply') {
        if (latestConversation.availability.state !== 'arriving') latestConversation.availability = { state: 'remote' }
        latestConversation.pause = undefined
      } else if (decision.normalizedAction === 'pause') {
        const reason = decision.reason as NonNullable<PocketConversation['pause']>['reason']
        latestConversation.pause = { reason, createdAt: decision.createdAt, source: 'model' }
        latestConversation.availability = { state: 'paused', reason }
      } else if (decision.normalizedAction === 'handoff' && decision.reason === 'arriving' && !latestContact.presence.inScene) {
        latestConversation.availability = { state: 'arriving' }
        latestConversation.pause = undefined
      } else if (decision.normalizedAction === 'handoff') {
        relayId = commitConversationHandoff(latestState, latestConversation, latestContact, decision).id
      }
      await saveState(latestState, userId)
      await sendState(latestState, userId, decision.normalizedAction === 'handoff' ? 'conversation_handoff' : decision.normalizedAction === 'pause' ? 'conversation_pause' : 'reply_decision')
      return { action: decision.normalizedAction, relayId }
    })
    send({ type: 'lumiphone:message_progress', requestId, chatId, characterId, conversationId, contactId: contact.id, phase: 'done' }, userId)
    progressRequestId = ''
    if (outcome?.relayId) {
      void requestRelayContinuation(chatId, characterId, outcome.relayId, userId)
      return
    }
    if (outcome?.action !== 'reply') return
    await generateMessage({ requestId: id('auto_reply'), chatId, characterId, conversationId, speakerContactId: contact.id, autonomous: true, instruction: 'Reply naturally only because the latest user text warrants a response.' }, userId)
  } catch (error) {
    spindle.log.warn(`Pocket reply decision skipped: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    if (progressRequestId) send({ type: 'lumiphone:message_progress', requestId: progressRequestId, chatId, characterId, conversationId, phase: 'done' }, userId)
    replyDecisionFlights.delete(flightKey)
  }
}

async function considerAmbientMessage(chatId: string, characterId: string, opportunity: 'turn' | 'roleplay-time', userId?: string): Promise<void> {
  const flightKey = `${viewKey(userId)}:${stateKey(chatId, characterId)}`
  if (ambientFlights.has(flightKey)) return
  ambientFlights.add(flightKey)
  try {
    const preferences = await loadPreferences(userId)
    if (!spindle.permissions.has('generation') || !shouldTakeAmbientOpportunity(preferences.ambientMessaging)) return
    const state = await loadState(chatId, characterId, userId)
    if (preferences.ambientMessaging === 'off') return
    const candidates = ambientEligibleContacts(state.contacts)
      .filter((contact) => contact.generationPolicy.relevant && contactCooldownReady(contact, preferences.ambientMessaging as 'sparse' | 'normal', state.roleplayNow))
      .slice(0, 16)
    if (!candidates.length) return
    const requestId = id('ambient_decision')
    const decision = await runStructuredGeneration('ambient-decision', requestId, {
      type: 'quiet',
      messages: [
        { role: 'system', content: 'Choose at most one conservative fictional off-scene phone-message opportunity. Most opportunities should be none. Return strict JSON only: {"action":"none"} or {"action":"message","contactId":"exact id","direction":"short reason or topic"}. Never select an actor marked in-scene. Do not write the actual message.' },
        { role: 'user', content: `Opportunity: ${opportunity}. Roleplay time: ${state.roleplayNow}. Candidates:\n${candidates.map((contact) => `${contact.id} | ${contact.name} | ${contact.role} | ${contact.description.slice(0, 240)}`).join('\n')}` },
      ],
      parameters: { temperature: 0.35, max_tokens: 120 }, userId,
    }, userId)
    if (decision.action !== 'message') return
    const contact = candidates.find((entry) => entry.id === text(decision.contactId, 180))
    if (!contact) return
    const conversation = ensureDirectConversation(state, contact.id, nowIso(), id)
    await saveState(state, userId)
    await generateMessage({
      requestId: id('ambient_message'), chatId, characterId, conversationId: conversation.id, speakerContactId: contact.id,
      instruction: text(decision.direction, 500) || 'Send a brief natural message appropriate to your off-scene life.', ambient: true, initiated: true, autonomous: true,
    }, userId)
  } catch (error) {
    spindle.log.warn(`Pocket ambient opportunity skipped: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    ambientFlights.delete(flightKey)
  }
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
    const relayIds: string[] = []
    let notification: PhoneNotification | null = null
    let activity: PocketActivity | undefined
    let result: AnyRecord = { ok: true, action }
    if (action === 'open') {
      await saveState(state, userId)
      await sendState(state, userId, 'open', true)
      return result
    }
    if (action === 'scene') {
      const actors = (Array.isArray(payload.actors) ? payload.actors : Array.isArray(payload.contacts) ? payload.contacts : []).slice(0, 8)
      const sceneAt = nowIso()
      for (const contact of state.contacts) contact.presence.inScene = false
      const snapshotActors: SceneActorSnapshot['actors'] = []
      for (const raw of actors) {
        if (!isRecord(raw)) continue
        const name = text(raw.name, 120)
        if (!name || uniqueAliasMatch(name, [state.characterName, state.pocketPersona.displayName].filter(Boolean))) continue
        let actor = state.contacts.find((entry) => entry.id === text(raw.contactId, 180) || actorName(entry.name) === actorName(name))
        if (!actor) {
          const identityBrief = text(raw.identityBrief ?? raw.description, 350)
          actor = upsertContact(state, {
            id: id('contact'), name, role: text(raw.role, 120) || 'Scene contact', description: identityBrief, identityBrief,
            sceneNote: '', avatarUrl: '', sourceAvatarUrl: '', avatarOverrideUrl: '', accent: stableContactAccent(name), sourceAccent: '', colorMode: 'pocket',
            source: { kind: 'npc', origin: 'scene', description: identityBrief, sceneKey: sceneKeyFor(name) },
            presence: { inScene: true, lastSceneAt: sceneAt }, contextPolicy: { pinned: false }, generationPolicy: { relevant: true },
            messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' }, createdAt: sceneAt, updatedAt: sceneAt,
          })
        }
        actor.presence = { inScene: true, lastSceneAt: sceneAt }
        actor.sceneNote = text(raw.sceneBrief ?? raw.sceneNote, 600)
        snapshotActors.push({ contactId: actor.id, roleHint: text(raw.roleHint ?? raw.role, 120) || actor.role, sceneBrief: actor.sceneNote })
      }
      for (const contact of state.contacts) {
        const conversation = state.conversations.find((entry) => entry.kind === 'direct' && entry.participantContactIds[0] === contact.id)
        if (contact.presence.inScene && conversation && conversation.availability.state !== 'local') {
          const decision = normalizeReplyDecision({
            rawAction: 'handoff', rawReason: conversation.availability.state === 'arriving' ? 'arrived' : 'in_scene',
            contact, conversation, explicitRemoteOverride: false, createdAt: sceneAt,
          })
          relayIds.push(commitConversationHandoff(state, conversation, contact, decision).id)
        } else reconcileContactAvailability(state, contact)
      }
      state.sceneSnapshot = { actors: snapshotActors, capturedAt: sceneAt, sourceMessageId: text(input.messageId, 180), sourceMessageIndex: Math.round(numberValue(payload.sourceMessageIndex, -1)), sourceRevision: Math.max(0, Math.round(numberValue(payload.sourceRevision, 0))), stale: false }
      result.contactIds = snapshotActors.map((entry) => entry.contactId)
      activity = addActivity(state, { kind: 'contact', title: 'Scene snapshot updated', summary: `${snapshotActors.length} actor${snapshotActors.length === 1 ? '' : 's'} present`, route: { app: 'contacts' }, source: { messageId: text(input.messageId, 180) || undefined } }, command)
    } else if (action === 'message') {
      const requestedContactId = text(payload.contact_id ?? payload.contactId, 180)
      let contact = state.contacts.find((item) => item.id === requestedContactId)
      if (!contact && requestedContactId) {
        const createdAt = nowIso()
        const identityBrief = text(payload.contact_description ?? payload.contactDescription, 1_200)
        contact = {
          id: requestedContactId, name: text(payload.contact_name ?? payload.contactName, 120) || 'Pocket NPC',
          role: text(payload.contact_role ?? payload.contactRole, 120) || 'Pocket NPC',
          description: identityBrief, identityBrief, sceneNote: '', avatarUrl: '', sourceAvatarUrl: '', avatarOverrideUrl: '',
          accent: stableContactAccent(requestedContactId), sourceAccent: '', colorMode: 'pocket', source: { kind: 'npc', origin: 'manual', description: identityBrief },
          presence: { inScene: false, lastSceneAt: '' }, contextPolicy: { pinned: false }, generationPolicy: { relevant: true },
          messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' }, createdAt, updatedAt: createdAt,
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
        senderAccent: senderContact ? contactAccent(senderContact) : '', text: messageText, createdAt: nowIso(), read: sender !== 'contact',
        status: sender === 'persona' ? 'sent' : sender === 'system' ? 'read' : 'delivered',
      }
      conversation.messages.push(message)
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES)
      conversation.updatedAt = message.createdAt
      if (sender === 'persona' && source === 'user') {
        const previousBurst = conversation.outgoingBurst
        const explicitRemoteOverride = bool(payload.explicitRemoteOverride ?? payload.explicit_remote_override)
        conversation.outgoingBurst = previousBurst?.open && !previousBurst.finalized
          ? { ...previousBurst, messageIds: [...previousBurst.messageIds, message.id].slice(-12), explicitRemoteOverride: previousBurst.explicitRemoteOverride || explicitRemoteOverride, updatedAt: message.createdAt }
          : { id: id('burst'), messageIds: [message.id], open: true, held: false, finalized: false, explicitRemoteOverride, updatedAt: message.createdAt }
      }
      if (sender === 'contact') {
        conversation.pause = undefined
        if (senderContact?.presence.inScene) reconcileContactAvailability(state, senderContact)
        else conversation.availability = { state: 'remote' }
      }
      const visible = sender === 'contact' && notificationDestinationVisible(state, { app: 'messages', conversationId: conversation.id }, userId)
      if (sender === 'contact' && !visible) conversation.unread += 1
      if (visible) { message.read = true; message.status = 'read' }
      const route: PocketRoute = { app: 'messages', conversationId: conversation.id, messageId: message.id }
      notification = sender === 'contact' && preferences.notifyMessages ? addNotification(state, { app: 'messages', title: senderContact!.name, body: preferences.notificationPreviews ? messageText.slice(0, 220) : 'New message', route, source: source === 'user' ? 'system' : 'model', severity: 'important' }, userId) : null
      result = { ...result, contactId: senderContact?.id || contact?.id, conversationId: conversation.id, messageId: message.id }
      if (source !== 'user') activity = addActivity(state, { kind: 'message', title: senderContact?.name || conversation.title, summary: messageText.slice(0, 280), route, source: { messageId: text(input.messageId, 180) || undefined, contactId: senderContact?.id || contact?.id, conversationId: conversation.id } }, command)
    } else if (action === 'contact') {
      const contactId = text(payload.contactId ?? payload.contact_id ?? payload.id, 180)
      const existing = state.contacts.find((entry) => entry.id === contactId)
      const name = text(payload.name ?? payload.title, 120) || existing?.name
      if (!name) throw new Error('A contact action needs a name.')
      const createdAt = existing?.createdAt || nowIso()
      const requestedAccent = text(payload.accent, 20)
      const identityBrief = text(payload.identityBrief ?? payload.description ?? payload.text ?? payload.content, 1_200) || existing?.identityBrief || existing?.description || ''
      const contact = upsertContact(state, {
        id: existing?.id || id('contact'), name,
        role: text(payload.role, 120) || existing?.role || 'Pocket NPC',
        description: identityBrief, identityBrief, sceneNote: text(payload.sceneNote, 600) || existing?.sceneNote || '',
        avatarUrl: existing?.avatarUrl || '', sourceAvatarUrl: existing?.sourceAvatarUrl || '', avatarOverrideUrl: existing?.avatarOverrideUrl || '',
        accent: /^#[0-9a-f]{6}$/i.test(requestedAccent) ? requestedAccent : existing?.accent || stableContactAccent(name),
        sourceAccent: existing?.sourceAccent || '', colorMode: payload.colorMode === 'source' ? 'source' : existing?.colorMode || 'pocket',
        source: existing?.source || { kind: 'npc', origin: 'manual', description: identityBrief },
        presence: {
          inScene: bool(payload.inScene ?? payload.in_scene, existing?.presence.inScene),
          lastSceneAt: bool(payload.inScene ?? payload.in_scene, existing?.presence.inScene) ? nowIso() : existing?.presence.lastSceneAt || '',
        },
        contextPolicy: { pinned: bool(payload.pinned, existing?.contextPolicy.pinned) },
        generationPolicy: { relevant: bool(payload.generationRelevant ?? payload.generation_relevant, existing?.generationPolicy.relevant ?? true) },
        messagingPolicy: {
          remoteEligible: bool(payload.remoteEligible ?? payload.remote_eligible, existing?.messagingPolicy.remoteEligible ?? true),
          allowAmbientInScene: bool(payload.allowAmbientInScene ?? payload.allow_ambient_in_scene, existing?.messagingPolicy.allowAmbientInScene),
          lastInitiatedMessageAt: existing?.messagingPolicy.lastInitiatedMessageAt || '',
          lastInitiatedRoleplayAt: existing?.messagingPolicy.lastInitiatedRoleplayAt || '',
        }, createdAt, updatedAt: nowIso(),
      })
      reconcileContactAvailability(state, contact)
      const route: PocketRoute = { app: 'contacts', contactId: contact.id, view: 'detail' }
      notification = source !== 'user' && preferences.notifyContacts ? addNotification(state, { app: 'contacts', title: contact.name, body: contact.role, route, source: 'model', severity: 'info' }, userId) : null
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
      if (source !== 'user') notification = addNotification(state, { app: 'notes', title: 'Journal updated', body: title, route, source: 'model', severity: 'info' }, userId)
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
      notification = source !== 'user' ? addNotification(state, { app: 'calendar', title: 'Timeline updated', body: title, route, source: 'model', severity: 'important' }, userId) : null
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
      notification = source !== 'user' ? addNotification(state, { app: 'weather', title: state.weather.location, body: `${state.weather.condition}, ${state.weather.temperature}°${state.weather.unit}`, route, source: 'model', severity: 'info' }, userId) : null
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
      notification = source !== 'user' && preferences.notifyTrackers ? addNotification(state, { app: 'trackers', title: next.label, body: trackerSummary, route, source: 'model', severity: 'info' }, userId) : null
      result.trackerId = next.id
      activity = addActivity(state, { kind: 'tracker-change', title: next.label, summary: trackerSummary, route, source: { messageId: text(input.messageId, 180) || undefined, trackerId: next.id } }, command)
    } else if (action === 'notify') {
      const requestedApp = text(payload.app ?? input.app, 40)
      const allowedApps = new Set(['home', 'messages', 'contacts', 'gallery', 'camera', 'notes', 'weather', 'calendar', 'trackers', 'settings'])
      const notifyTitle = text(payload.title ?? input.title, 160) || 'Pocket'
      const notifyBody = text(payload.body ?? payload.text ?? payload.content, 1_000)
      const notifyRoute = normalizePocketRoute(payload.route, { app: (allowedApps.has(requestedApp) ? requestedApp : 'home') as PhoneNotification['app'] } as PocketRoute)
      notification = source === 'user' ? null : addNotification(state, {
        app: (allowedApps.has(requestedApp) ? requestedApp : 'home') as PhoneNotification['app'],
        title: notifyTitle, body: notifyBody, route: notifyRoute,
        source: 'model', severity: payload.severity === 'important' || payload.severity === 'error' ? payload.severity : 'info',
      }, userId)
      if (source !== 'user') activity = addActivity(state, { kind: 'system', title: notifyTitle, summary: notifyBody, route: notifyRoute, source: { messageId: text(input.messageId, 180) || undefined } }, command)
    } else {
      throw new Error(`Unsupported phone action: ${action || '(empty)'}`)
    }
    await saveState(state, userId)
    if (notification) await maybePush(state, preferences, notification, userId)
    await sendState(state, userId, action, source !== 'user' && preferences.autoOpenOnModelAction)
    sendActivity(activity, userId)
    sendNotification(notification, userId)
    if (action === 'message' && source === 'user' && preferences.autoReplyAfterSend && typeof result.conversationId === 'string') {
      void scheduleReplyBurst(context.chatId, context.characterId, result.conversationId, userId)
    }
    for (const relayId of [...new Set(relayIds)]) setTimeout(() => void requestRelayContinuation(context.chatId, context.characterId, relayId, userId), 0)
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
        await sendState(state, userId, 'load')
        break
      }
      case 'lumiphone:view_state': {
        frontendViews.set(viewKey(userId), {
          chatId: context.chatId, characterId: context.characterId, open: bool(payload.open),
          route: normalizePocketRoute(payload.route), updatedAt: Date.now(),
        })
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
          reconcileContactAvailability(state, contact)
          await saveState(state, userId)
          await sendState(state, userId, 'contact')
          send({ type: 'lumiphone:contact_saved', requestId, contactId: contact.id }, userId)
        })
        break
      }
      case 'lumiphone:generate_contact':
        await generateNpcContact(payload, userId)
        break
      case 'lumiphone:refresh_contact_profile':
        await refreshCompactContactProfile(payload, userId)
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
            participantContactIds, messages: [], unread: 0, availability: { state: 'remote' }, createdAt, updatedAt: createdAt,
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
        const next = normalizePreferences({ ...existing, ...(isRecord(payload.preferences) ? payload.preferences : isRecord(payload.settings) ? payload.settings : {}) })
        await validateChangedWallpaperSources(existing, next, userId)
        await savePreferences(next, userId)
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, 'preferences')
        break
      }
      case 'lumiphone:save_pocket_persona': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const next = normalizePocketPersona(payload.persona, state.pocketPersona)
          next.source = payload.followLumiverse === true ? 'lumiverse' : next.source === 'lumiverse' ? 'manual' : next.source
          if (next.source === 'lumiverse') {
            const hostPersona = await resolveActivePocketPersona(userId)
            if (hostPersona) Object.assign(next, hostPersona)
          }
          next.updatedAt = nowIso()
          state.pocketPersona = next
          state.setup.initialized = true
          await saveState(state, userId)
          await sendState(state, userId, 'pocket_persona')
          send({ type: 'lumiphone:pocket_persona_saved', requestId }, userId)
        })
        break
      }
      case 'lumiphone:dismiss_setup': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          state.setup.dismissed = true
          await saveState(state, userId)
          await sendState(state, userId, 'setup')
        })
        break
      }
      case 'lumiphone:generate_pocket_persona': {
        if (!spindle.permissions.has('generation')) throw new Error('Enable Generation to describe the Pocket Persona from roleplay.')
        const state = await loadState(context.chatId, context.characterId, userId)
        const messages = spindle.permissions.has('chat_mutation') ? await spindle.chat.getMessages(context.chatId) : []
        const response = await runStructuredGeneration('persona-profile', requestId || id('persona'), {
          type: 'quiet',
          messages: [
            { role: 'system', content: 'Describe only the user/persona represented in this roleplay. Return strict JSON: {"displayName":"","pronouns":"","role":"","identityBrief":""}. Use evidence from the transcript, keep identityBrief under 900 characters, and do not include the primary character as the persona.' },
            { role: 'user', content: messages.slice(-18).map((message: any) => `${message.role}: ${text(message.content, 700)}`).join('\n').slice(-9_000) || `Known persona: ${state.pocketPersona.displayName}` },
          ],
          parameters: { temperature: 0.2, max_tokens: 360 }, userId,
        }, userId)
        const preview = normalizePocketPersona({ ...state.pocketPersona, ...response, source: 'generated', linkedPersonaId: '', updatedAt: nowIso() }, state.pocketPersona)
        send({ type: 'lumiphone:pocket_persona_preview', requestId, persona: preview }, userId)
        break
      }
      case 'lumiphone:preview_context': {
        const state = await loadState(context.chatId, context.characterId, userId)
        const conversation = state.conversations.find((entry) => entry.id === text(payload.conversationId, 180))
        if (!conversation) throw new Error('Choose a conversation to preview.')
        const contact = state.contacts.find((entry) => entry.id === conversation.participantContactIds[0])
        if (!contact) throw new Error('That conversation has no available contact.')
        const profile = await resolveContactProfile(contact, userId)
        const assembled = await assemblePocketContext({
          state, contact, conversation, preferences: await loadPreferences(userId),
          actorIdentity: contact.identityBrief || profile.description,
          getMessages: spindle.permissions.has('chat_mutation') ? () => spindle.chat.getMessages(context.chatId) : undefined,
        })
        send({ type: 'lumiphone:context_preview', requestId, conversationId: conversation.id, diagnostics: assembled.diagnostics }, userId)
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
          void considerAmbientMessage(context.chatId, context.characterId, 'roleplay-time', userId)
        })
        break
      }
      case 'lumiphone:action': {
        const result = await applyAction(payload, userId, 'user')
        send({ type: 'lumiphone:action_done', requestId, result }, userId)
        break
      }
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
      case 'lumiphone:composer_state': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const conversation = state.conversations.find((entry) => entry.id === text(payload.conversationId, 180))
          if (!conversation?.outgoingBurst?.open || conversation.outgoingBurst.finalized) return
          conversation.outgoingBurst.held = bool(payload.held)
          conversation.outgoingBurst.updatedAt = nowIso()
          await saveState(state, userId)
        })
        if (!bool(payload.held)) void scheduleReplyBurst(context.chatId, context.characterId, text(payload.conversationId, 180), userId)
        break
      }
      case 'lumiphone:generate_message':
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const conversation = state.conversations.find((entry) => entry.id === text(payload.conversationId, 180))
          if (conversation?.outgoingBurst) {
            conversation.outgoingBurst.open = false
            conversation.outgoingBurst.finalized = true
            conversation.outgoingBurst.updatedAt = nowIso()
            await saveState(state, userId)
          }
        })
        await generateMessage({ ...payload, manualOverride: true }, userId)
        break
      case 'lumiphone:retry_message': {
        const state = await loadState(context.chatId, context.characterId, userId)
        const conversation = state.conversations.find((entry) => entry.id === text(payload.conversationId, 180))
        const message = conversation?.messages.find((entry) => entry.id === text(payload.messageId, 180))
        if (!conversation || !message || message.sender !== 'contact') throw new Error('That generated message can no longer be retried.')
        await generateMessage({
          ...payload,
          replaceMessageId: message.id,
          speakerContactId: message.senderContactId,
          instruction: 'Generate a different natural reply for this same point in the phone conversation.',
        }, userId)
        break
      }
      case 'lumiphone:continue_relay': {
        const state = await loadState(context.chatId, context.characterId, userId)
        const conversationId = text(payload.conversationId, 180)
        const relay = [...state.relays].reverse().find((entry) => entry.status === 'pending' && (!conversationId || entry.conversationId === conversationId))
        if (!relay) throw new Error('There is no pending Pocket handoff for this conversation.')
        void requestRelayContinuation(context.chatId, context.characterId, relay.id, userId)
        break
      }
      case 'lumiphone:test_generation': {
        const testRequestId = requestId || id('connection_test')
        const existing = await loadPreferences(userId)
        await savePreferences({
          ...existing,
          generationMode: payload.generationMode === 'sidecar' ? 'sidecar' : 'roleplay',
          sidecarConnectionId: text(payload.sidecarConnectionId, 180),
          sidecarModelOverride: text(payload.sidecarModelOverride, 500),
        }, userId)
        const started = Date.now()
        const response: any = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, 'connection-test', testRequestId, {
          type: 'quiet', messages: [{ role: 'user', content: 'Reply with exactly POCKET_OK' }],
          parameters: { temperature: 0, max_tokens: 16 }, userId,
        }, userId)
        send({ type: 'lumiphone:generation_test_result', requestId: testRequestId, ok: text(response.content, 100).includes('POCKET_OK'), latencyMs: Date.now() - started }, userId)
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, 'generation_test')
        break
      }
      case 'lumiphone:gallery_list':
        send({ type: 'lumiphone:gallery', requestId, scope: payload.scope, ...(await listGallery(payload, userId)) }, userId)
        break
      case 'lumiphone:gallery_add_to_chat': {
        if (!spindle.permissions.has('chat_mutation')) throw new Error('Enable Chat Mutation to add a Gallery image to the roleplay chat.')
        const imageId = text(payload.imageId, 180)
        const asset: any = imageId && spindle.permissions.has('images') ? await spindle.images.get(imageId, { specificity: 'full', userId }) : null
        const imageUrl = text(asset?.url ?? payload.imageUrl, 2_000)
        if (!imageUrl) throw new Error('That Gallery image is unavailable.')
        const label = (text(asset?.original_filename ?? payload.filename, 180) || 'Pocket photo').replace(/[\[\]]/g, '')
        const messages: any[] = await spindle.chat.getMessages(context.chatId)
        const target = [...messages].reverse().find((message) => message.role === 'assistant' && text(message.content, 40_000))
        if (!target?.id) throw new Error('There is no existing narrative response to attach this image to yet.')
        const marker = `![${label}](${imageUrl})`
        const content = `${text(target.content, 40_000)}\n\n${marker}`
        await spindle.chat.updateMessage(context.chatId, String(target.id), { content })
        send({ type: 'lumiphone:gallery_action_done', requestId, action: 'add-to-chat', messageId: target.id, message: 'Added to the latest narrative response.' }, userId)
        break
      }
      case 'lumiphone:gallery_set_wallpaper': {
        const imageId = text(payload.imageId, 180)
        if (!imageId || !spindle.permissions.has('images')) throw new Error('That Gallery image is unavailable.')
        const source = { kind: 'gallery' as const, imageId }
        assertPocketImageResolved(await resolvePocketImageSource(spindle, source, userId))
        const preferences = await loadPreferences(userId)
        assignWallpaper(preferences, { ...payload, target: payload.personaId ? payload.target === 'chat' ? 'persona-chat' : 'persona-home' : payload.target === 'chat' ? 'device-chat' : 'device-home' }, source)
        await savePreferences(preferences, userId)
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, 'preferences')
        send({ type: 'lumiphone:gallery_action_done', requestId, action: 'set-wallpaper', message: payload.target === 'chat' ? 'Chat wallpaper updated.' : 'Home wallpaper updated.' }, userId)
        break
      }
      case 'lumiphone:set_wallpaper': {
        const preferences = await loadPreferences(userId)
        const source = payload.source === null ? null : normalizeImageSource(payload.source)
        if (payload.source !== null && !source) throw new Error('Choose a valid Gallery image, uploaded asset, or HTTPS image URL.')
        if (source) assertPocketImageResolved(await resolvePocketImageSource(spindle, source, userId))
        assignWallpaper(preferences, payload, source)
        await savePreferences(preferences, userId)
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, 'preferences')
        break
      }
      case 'lumiphone:upload_wallpaper_asset': {
        if (!spindle.permissions.has('images')) throw new Error('Enable Images to upload a Pocket background.')
        const dataUrl = text(payload.dataUrl, 12_000_000)
        if (!/^data:image\/[a-z0-9.+-]+;base64,/i.test(dataUrl)) throw new Error('Choose a valid image file.')
        const image = await spindle.images.uploadFromDataUrl(dataUrl, {
          originalFilename: text(payload.filename, 240) || 'pocket-background',
          owner_character_id: context.characterId === '_none' ? undefined : context.characterId,
          owner_chat_id: context.chatId === '_lobby' ? undefined : context.chatId,
          userId,
        })
        const source = { kind: 'asset' as const, assetId: image.id }
        assertPocketImageResolved(await resolvePocketImageSource(spindle, source, userId))
        const preferences = await loadPreferences(userId)
        assignWallpaper(preferences, payload, source)
        await savePreferences(preferences, userId)
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, 'preferences')
        send({ type: 'lumiphone:wallpaper_uploaded', requestId, imageId: image.id }, userId)
        break
      }
      case 'lumiphone:set_contact_photo': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          const contact = state.contacts.find((entry) => entry.id === text(payload.contactId, 180))
          if (!contact) throw new Error('That contact no longer exists.')
          contact.avatarOverrideUrl = payload.useSource === true ? '' : text(payload.imageUrl, 2_000)
          contact.updatedAt = nowIso()
          await saveState(state, userId)
          await sendState(state, userId, 'contact_photo')
          send({ type: 'lumiphone:gallery_action_done', requestId, action: 'set-contact-photo', message: `${contact.name} photo updated.` }, userId)
        })
        break
      }
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
          const notificationId = text(payload.notificationId, 180)
          if (notificationId) markNotificationRead(state.notifications, notificationId)
          const conversationId = text(payload.conversationId, 180)
          const legacyContactId = text(payload.contactId, 180)
          const conversation = state.conversations.find((entry) => entry.id === conversationId) || state.conversations.find((entry) => entry.kind === 'direct' && entry.participantContactIds[0] === legacyContactId)
          if (conversation) {
            conversation.unread = 0
            conversation.messages.forEach((message) => { message.read = true; message.status = 'read' })
            state.notifications.forEach((entry) => {
              if (entry.route?.app === 'messages' && entry.route.conversationId === conversation.id) entry.read = true
            })
          } else if (app && app !== 'messages') {
            state.notifications.forEach((entry) => { if (entry.app === app) entry.read = true })
          }
          await saveState(state, userId)
          await sendState(state, userId, 'read')
        })
        break
      }
      case 'lumiphone:notification_dismiss':
      case 'lumiphone:notification_mark_read':
      case 'lumiphone:notifications_clear': {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId)
          if (payload.type === 'lumiphone:notification_dismiss') dismissNotification(state.notifications, text(payload.notificationId, 180), nowIso())
          else if (payload.type === 'lumiphone:notification_mark_read') markNotificationRead(state.notifications, text(payload.notificationId, 180))
          else clearNotifications(state.notifications, payload.mode === 'read' ? 'read' : 'all', nowIso())
          await saveState(state, userId)
          await sendState(state, userId, 'notifications')
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
        send({ type: 'lumiphone:swarm_profile', requestId, profile: await resolveSwarmProfile(context.chatId, context.characterId, await loadPreferences(userId), userId) }, userId)
        break
      }
      case 'lumiphone:export_data': {
        const state = await loadState(context.chatId, context.characterId, userId)
        send({ type: 'lumiphone:export_data', requestId, data: { product: 'Pocket', exportVersion: 5, state: { ...state, processedCommands: [] }, preferences: await loadPreferences(userId) } }, userId)
        break
      }
      case 'lumiphone:import_data': {
        if (!isRecord(payload.data)) throw new Error('Import must be a Pocket JSON object.')
        const rawState = isRecord(payload.data.state) ? payload.data.state : payload.data
        if (Number(rawState.version) > STATE_VERSION) throw new Error('This backup uses a newer Pocket state schema.')
        const characterName = await characterNameFor(context.characterId, userId)
        const state = normalizeState(rawState, context.chatId, context.characterId, characterName)
        let importedPreferences: DevicePreferences | null = null
        if (payload.data.preferences !== undefined) {
          const existing = await loadPreferences(userId)
          importedPreferences = normalizePreferences(payload.data.preferences)
          await validateChangedWallpaperSources(existing, importedPreferences, userId)
        }
        await saveState(state, userId)
        if (importedPreferences) await savePreferences(importedPreferences, userId)
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
        action: { type: 'string', enum: ['message', 'contact', 'scene', 'note', 'event', 'weather', 'tracker', 'camera', 'notify', 'open'] },
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
      const characterId = await stateCharacterIdForChat(chatId, context.characterId, context.userId)
      const generationId = text(context.generationId, 180)
      let state = await loadState(chatId, characterId, context.userId)
      const metadataRelayId = relayIdFromMessages(messages as unknown as Array<Record<string, unknown>>)
      const generationRelay = generationId ? state.relays.find((entry) => entry.status === 'pending' && entry.continuation.generationId === generationId) : undefined
      const active = state.relays.filter((entry) => entry.status === 'pending' && (
        entry.continuation.state === 'launching' || entry.continuation.state === 'accepted' || entry.continuation.state === 'started'
      ))
      const targetRelayId = metadataRelayId || generationRelay?.id || (active.length === 1 ? active[0].id : '')
      const relayBlock = pendingRelayContext(state, { relayId: targetRelayId, maxChars: 3_600 })
      const generic = { role: 'system' as const, content: `${PHONE_GUIDANCE}\nCurrent Pocket snapshot:\n${projectPhoneContext(state)}` }
      if (!relayBlock || !targetRelayId) {
        return { messages: [...messages, generic], breakdown: [{ messageIndex: messages.length, name: 'Pocket memory' }] }
      }
      const injectedAt = nowIso()
      try {
        state = await withStateLock(stateKey(chatId, characterId), async () => {
          const current = await loadState(chatId, characterId, context.userId)
          const target = current.relays.find((entry) => entry.id === targetRelayId && entry.status === 'pending')
          if (!target) throw new Error(`Pending relay ${targetRelayId} disappeared before injection.`)
          const matchedGenerationId = generationId || target.continuation.generationId
          target.injectedAt = injectedAt
          target.injectedGenerationId = matchedGenerationId || undefined
          target.serializedRelayChars = relayBlock.length
          target.serializedRelay = relayBlock
          target.relayExchangeMessageCount = target.conversationTail.recentMessageIds.length
          target.injectionError = undefined
          await saveState(current, context.userId)
          return current
        })
      } catch (error) {
        spindle.log.error(`Pocket relay injection receipt failed: relay=${targetRelayId} error=${error instanceof Error ? error.message : String(error)}`)
      }
      spindle.log.info(`Pocket relay injected: relay=${targetRelayId} generation=${generationId || state.relays.find((entry) => entry.id === targetRelayId)?.continuation.generationId || 'awaiting-association'} chars=${relayBlock.length}`)
      const relayMessage = { role: 'system' as const, content: relayBlock }
      return {
        messages: [...messages, generic, relayMessage],
        breakdown: [
          { messageIndex: messages.length, name: 'Pocket memory' },
          { messageIndex: messages.length + 1, name: 'Pocket continuity relay — newer state' },
        ],
      }
    } catch (error) {
      spindle.log.error(`Pocket interceptor failed: ${error instanceof Error ? error.message : String(error)}`)
      return messages
    }
  }, 70)
}

spindle.frontendCapabilities.declare('message_tag_interceptor')
spindle.onFrontendMessage(handleFrontend)
spindle.on('TOOL_INVOCATION', async (payload, eventUserId?: string) => {
  if (payload.toolName !== 'phone_action') return ''
  try {
    const userId = eventUserId || text((payload as any).userId, 180) || undefined
    const args = isRecord(payload.args) ? payload.args : {}
    const merged = {
      ...args, ...(isRecord(args.payload) ? args.payload : {}), payload: args.payload,
      idempotencyKey: text(payload.requestId, 240), messageId: text((payload as any).messageId, 180),
    }
    const result = await applyAction(merged, userId, 'model')
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

spindle.on('PERSONA_CHANGED', async (_payload: any, userId?: string) => {
  try {
    if (!spindle.permissions.has('chats')) return
    const chat: any = await spindle.chats.getActive(userId)
    const chatId = text(chat?.id, 180)
    if (!chatId) return
    const characterId = text(chat?.character_id, 180) || '_none'
    await sendState(await loadState(chatId, characterId, userId), userId, 'persona_changed')
  } catch { /* frontend will refresh on its next host event */ }
})

spindle.on('GENERATION_STARTED', async (payload: any, userId?: string) => {
  const chatId = text(payload?.chatId, 180)
  const generationId = text(payload?.generationId, 180)
  if (!chatId || !generationId || !spindle.permissions.has('chats')) return
  try {
    const chat: any = await spindle.chats.get(chatId, userId)
    const characterId = text(chat?.character_id, 180) || '_none'
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId)
      let relay = relayForGeneration(state, generationId)
      if (!relay) {
        const launching = state.relays.filter((entry) => entry.status === 'pending' && entry.continuation.state === 'launching' && !entry.continuation.generationId)
        if (launching.length === 1) relay = launching[0]
      }
      if (!relay) return
      relay.continuation.state = 'started'
      relay.continuation.generationId = generationId
      relay.continuation.generationStartedAt = nowIso()
      relay.continuation.error = undefined
      if (relay.injectedAt && !relay.injectedGenerationId) relay.injectedGenerationId = generationId
      await saveState(state, userId)
      await sendState(state, userId, 'relay_started')
      spindle.log.info(`Pocket observed GENERATION_STARTED: relay=${relay.id} generation=${generationId}`)
    })
  } catch (error) {
    spindle.log.warn(`Pocket could not associate GENERATION_STARTED: ${error instanceof Error ? error.message : String(error)}`)
  }
})

spindle.on('GENERATION_ENDED', async (payload: any, userId?: string) => {
  const chatId = text(payload?.chatId, 180)
  const messageId = text(payload?.messageId, 180)
  const generationId = text(payload?.generationId, 180)
  if (!chatId || !spindle.permissions.has('chats')) return
  try {
    const chat: any = await spindle.chats.get(chatId, userId)
    const characterId = text(chat?.character_id, 180) || '_none'
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId)
      let changed = false
      const relay = generationId ? relayForGeneration(state, generationId) : undefined
      if (relay) {
        relay.continuation.generationCompletedAt = nowIso()
        const injectionMatched = Boolean(relay.injectedAt && relay.injectedGenerationId === generationId)
        if (payload?.error || !messageId) {
          relay.continuation = { ...relay.continuation, state: 'failed', error: text(payload?.error, 500) || 'The roleplay continuation did not produce a message.' }
        } else if (!injectionMatched) {
          relay.injectionError = 'The generation completed without a confirmed matching Pocket relay injection.'
          relay.continuation = { ...relay.continuation, state: 'failed', error: relay.injectionError }
        } else {
          relay.status = 'consumed'
          relay.consumedAt = nowIso()
          relay.consumedMessageId = messageId
          relay.continuation = { ...relay.continuation, state: 'completed', error: undefined }
        }
        changed = true
        spindle.log.info(`Pocket observed GENERATION_ENDED: relay=${relay.id} generation=${generationId || 'unknown'} status=${relay.status} message=${messageId || 'none'}`)
      }
      if (messageId && state.sceneSnapshot && state.sceneSnapshot.sourceMessageId !== messageId) {
        state.sceneSnapshot.stale = true
        changed = true
      }
      if (!changed) return
      await saveState(state, userId)
      await sendState(state, userId, relay ? relay.status === 'consumed' ? 'relay_consumed' : 'relay_failed' : 'scene_stale')
    })
  } catch (error) {
    spindle.log.warn(`Pocket could not mark the scene snapshot stale: ${error instanceof Error ? error.message : String(error)}`)
  }
})

spindle.on('GENERATION_STOPPED', async (payload: any, userId?: string) => {
  const chatId = text(payload?.chatId, 180)
  const generationId = text(payload?.generationId, 180)
  if (!chatId || !generationId || !spindle.permissions.has('chats')) return
  try {
    const chat: any = await spindle.chats.get(chatId, userId)
    const characterId = text(chat?.character_id, 180) || '_none'
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId)
      const relay = relayForGeneration(state, generationId)
      if (!relay) return
      relay.continuation = { ...relay.continuation, state: 'stopped', error: 'Generation was stopped. The relay remains pending.' }
      await saveState(state, userId)
      await sendState(state, userId, 'relay_stopped')
    })
  } catch { /* best-effort status update */ }
})

spindle.on('CHARACTER_MESSAGE_RENDERED', async (payload: any, userId?: string) => {
  const chatId = text(payload?.chatId, 180)
  if (!chatId) return
  try {
    const chat = spindle.permissions.has('chats') ? await (spindle.chats.get as any)(chatId, userId) : null
    const characterId = text(chat?.character_id, 180) || '_none'
    void considerAmbientMessage(chatId, characterId, 'turn', userId)
  } catch { /* ambient opportunities are optional */ }
})

spindle.log.info('Pocket backend loaded.')
