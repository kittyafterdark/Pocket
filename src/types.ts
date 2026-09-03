export type PhoneApp =
  | 'home'
  | 'messages'
  | 'contacts'
  | 'gallery'
  | 'camera'
  | 'notes'
  | 'weather'
  | 'calendar'
  | 'trackers'
  | 'notifications'
  | 'settings'

export type PhoneTheme = 'midnight' | 'porcelain' | 'rose' | 'forest' | 'custom'
export type OpenAnimation = 'spring' | 'slide' | 'fade' | 'none'

export type PocketRoute =
  | { app: 'home' }
  | { app: 'messages'; conversationId?: string; contactId?: string; messageId?: string; view?: 'thread' | 'new-group' | 'group-detail' }
  | { app: 'contacts'; contactId?: string; view?: 'list' | 'detail' | 'config' | 'import' | 'new' | 'draft' }
  | { app: 'trackers'; trackerId?: string; view?: 'detail' | 'config' }
  | { app: 'calendar'; eventId?: string }
  | { app: 'notes'; noteId?: string }
  | { app: 'gallery'; imageId?: string }
  | { app: 'camera' }
  | { app: 'weather' }
  | { app: 'notifications' }
  | { app: 'settings'; section?: string }

export interface PhonePalette {
  accent: string
  bezel: string
  background: string
  surface: string
  text: string
  wallpaperPrimary: string
  wallpaperSecondary: string
  chatPrimary: string
  chatSecondary: string
}

export interface ManualVisualProfile {
  positive: string
  negative: string
  model: string
  connectionId: string
  loras: Array<{ name: string; weight: number }>
  parameters: Record<string, unknown>
}

/** Device-wide preferences. These never belong to a chat/character state file. */
export type PocketGenerationMode = 'roleplay' | 'sidecar'
export type AmbientMessageFrequency = 'off' | 'sparse' | 'normal'
export type RoleplayContextMode = 'off' | 'recent' | 'story' | 'smart'
export type ConversationPauseReason = 'ended' | 'busy' | 'away' | 'sleeping' | 'unknown'
export type ConversationLocalReason = 'in_scene' | 'arrived' | 'took_action' | 'continued_in_person'
export type ConversationAvailability =
  | { state: 'remote' }
  | { state: 'arriving' }
  | { state: 'paused'; reason: ConversationPauseReason }
  | { state: 'local'; reason: ConversationLocalReason; resumePauseReason?: ConversationPauseReason }
export type ReplyCadence = 'instant' | 'quick' | 'natural' | 'relaxed'

export type PocketImageSource =
  | { kind: 'gallery'; imageId: string }
  | { kind: 'asset'; assetId: string }
  | { kind: 'url'; url: string }

export interface PocketWallpaper {
  source: PocketImageSource | null
  fit: 'cover' | 'contain' | 'stretch'
  focalX: number
  focalY: number
  scrim: number
}

export interface PocketResolvedImage {
  url: string
  status: 'empty' | 'ready' | 'error'
  sourceKind: PocketImageSource['kind'] | 'none'
  sourceLabel: string
  error?: string
}

export interface PocketResolvedWallpapers {
  deviceHome: PocketResolvedImage
  deviceChat: PocketResolvedImage
  personaHome: PocketResolvedImage
  personaChat: PocketResolvedImage
}

export interface PersonaAppearanceOverride {
  enabled: boolean
  theme: PhoneTheme
  colors: PhonePalette
  customCss: string
  homeWallpaper: PocketWallpaper
  chatWallpaper: PocketWallpaper
}

export interface PocketGenerationRun {
  requestId: string
  task: 'npc-contact' | 'profile-refresh' | 'scene-sync' | 'persona-profile' | 'message-reply' | 'message-retry' | 'group-reply' | 'reply-decision' | 'ambient-decision' | 'scene-planner' | 'connection-test'
  mode: PocketGenerationMode
  connectionId: string
  connectionName: string
  provider: string
  model: string
  status: 'started' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  latencyMs?: number
  error?: string
}

export interface PocketConnectionSummary {
  id: string
  name: string
  provider: string
  model: string
  isDefault: boolean
  configured: boolean
}

export interface PocketGenerationInfo {
  mode: PocketGenerationMode
  effective: PocketConnectionSummary | null
  connections: PocketConnectionSummary[]
  history: PocketGenerationRun[]
  modelOverride: string
}

export interface SceneActorSnapshotEntry {
  contactId: string
  roleHint: string
  sceneBrief: string
}

export interface SceneActorSnapshot {
  actors: SceneActorSnapshotEntry[]
  capturedAt: string
  sourceMessageId: string
  sourceMessageIndex: number
  sourceRevision: number
  stale: boolean
}

export interface ChatPocketPersona {
  source: 'lumiverse' | 'manual' | 'generated'
  linkedPersonaId: string
  displayName: string
  pronouns: string
  role: string
  identityBrief: string
  avatarUrl: string
  accent: string
  canAppear: boolean
  updatedAt: string
}

export interface PocketContextComponentStat {
  count: number
  chars: number
  budget: number
}

export interface PocketContextDiagnostics {
  mode: RoleplayContextMode
  actorIdentityChars: number
  sceneSnapshot: { stale: boolean; capturedAt: string; sourceMessageId: string; sourceMessageIndex: number; chars: number }
  phoneThread: PocketContextComponentStat
  recentRoleplay: PocketContextComponentStat & { latestMessageId: string }
  story: PocketContextComponentStat
  totalChars: number
  estimatedTokens: number
  authoritativeLatest: { id: string; index: number; excerpt: string }
  includedLatest: { id: string; index: number; excerpt: string }
  freshnessWarning: string
  assembled: string
}

export interface PocketOperationProgress {
  task: 'npc-contact' | 'profile-refresh' | 'scene-sync'
  requestId: string
  phase: 'request' | 'generating' | 'parsing' | 'saving' | 'complete' | 'error'
  message: string
}

export interface DevicePreferences {
  version: 5
  theme: PhoneTheme
  colors: PhonePalette
  homeWallpaper: PocketWallpaper
  chatWallpaper: PocketWallpaper
  /** Desktop-only physical size of the 9:16 handset. */
  handsetScale: number
  /** Device-wide density of Pocket controls and content. Never scales the host surface. */
  uiScale: number
  animation: OpenAnimation
  animationDurationMs: number
  reducedMotion: boolean
  autoOpenOnModelAction: boolean
  pushNotifications: boolean
  useSwarmProfile: boolean
  sceneEnhancer: boolean
  generationMode: PocketGenerationMode
  sidecarConnectionId: string
  sidecarModelOverride: string
  autoReplyAfterSend: boolean
  replyCadence: ReplyCadence
  ambientMessaging: AmbientMessageFrequency
  roleplayContextMode: RoleplayContextMode
  recentRoleplayMessages: number
  notificationSounds: boolean
  notificationPreviews: boolean
  notifyMessages: boolean
  notifyContacts: boolean
  notifyTrackers: boolean
  customCss: string
  personaAppearance: Record<string, PersonaAppearanceOverride>
  generationHistory: PocketGenerationRun[]
  manualVisualProfile: ManualVisualProfile
}

export interface PhoneMessage {
  id: string
  sender: 'persona' | 'contact' | 'system'
  /** Generic Pocket actor identity. Contact ids remain valid actor ids. */
  senderActorId?: string
  senderActorKind?: 'contact' | 'discovered'
  /** Legacy/contact-specific identity retained for compatibility. */
  senderContactId?: string
  /** Stable display fallback when the underlying profile is renamed or removed. */
  senderName: string
  senderAccent: string
  text: string
  createdAt: string
  read: boolean
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  imageId?: string
  imageUrl?: string
  generation?: {
    requestId: string
    retryOf?: string
    info?: {
      speaker: string
      source: string
      sourceId: string
      sourceResolution: 'resolved' | 'snapshot' | 'manual'
      activeCharacterId: string
      activeCharacterUsed: boolean
      identityChars: number
      sceneSnapshotStale: boolean
      contextMode: RoleplayContextMode
      recentCount: number
      recentChars: number
      storyCount: number
      storyChars: number
      threadCount: number
      threadChars: number
      generationMode: PocketGenerationMode
      connectionName: string
      model: string
      groupBatch?: {
        id: string
        position: number
        size: number
        eligibleCount: number
      }
      replyDecision?: {
        rawAction: ReplyDecisionAction
        normalizedAction: ReplyDecisionAction
        reason: string
        normalizationReason: string
      }
    }
  }
}

export type ReplyDecisionAction = 'reply' | 'none' | 'pause' | 'handoff'

export interface PocketReplyDecision {
  rawAction: ReplyDecisionAction
  normalizedAction: ReplyDecisionAction
  reason: string
  normalizationReason: string
  contactInScene: boolean
  remoteEligible: boolean
  explicitRemoteOverride: boolean
  createdAt: string
  burstId?: string
  relayId?: string
}

export interface PocketConversationTailSnapshot {
  text: string
  recentMessageIds: string[]
  updatedAt: string
}

export type PocketContactSource =
  | { kind: 'character'; characterId: string }
  | { kind: 'council'; memberId: string; itemId: string }
  | { kind: 'npc'; origin: 'manual' | 'generated' | 'scene' | 'discovered'; description: string; sceneKey?: string; discoveredActorId?: string }

export type PocketRelationship = 'background' | 'close'

/**
 * A named actor Pocket has needed to persist, but the user has not chosen to
 * materialize as a full Contact. Profile completeness never gates speech.
 */
export interface DiscoveredActor {
  id: string
  chatId: string
  displayName: string
  normalizedName: string
  firstSeenAt: string
  lastSeenAt: string
  source: 'roleplay' | 'messages' | 'group-chat' | 'model-tool'
  relationship: PocketRelationship
  promotedContactId?: string
}

export interface PocketMessagingStyle {
  /** Participation likelihood, not a guarantee that this contact speaks. */
  talkativeness: number
  /** Likelihood of short consecutive bubbles instead of one compact text. */
  fragmentation: number
}

export interface PocketContactDraft {
  name: string
  role: string
  identityBrief: string
  accent: string
  messagingStyle: PocketMessagingStyle
  sourceDescription: string
}

export interface PocketContact {
  id: string
  name: string
  role: string
  description: string
  /** Stable compact identity used in generation. Linked actors refresh from their authoritative source. */
  identityBrief: string
  /** Ephemeral scene-only note, maintained by Scene Sync. */
  sceneNote: string
  avatarUrl: string
  sourceAvatarUrl: string
  avatarOverrideUrl: string
  accent: string
  sourceAccent: string
  colorMode: 'pocket' | 'source'
  source: PocketContactSource
  /** Close actors are disclosed prominently; background actors stay cheap. */
  relationship: PocketRelationship
  presence: { inScene: boolean; lastSceneAt: string }
  contextPolicy: { pinned: boolean }
  generationPolicy: { relevant: boolean }
  messagingPolicy: {
    remoteEligible: boolean
    allowAmbientInScene: boolean
    lastInitiatedMessageAt: string
    lastInitiatedRoleplayAt: string
  }
  messagingStyle: PocketMessagingStyle
  createdAt: string
  updatedAt: string
}

export interface PendingGroupBatchMessage {
  id: string
  speakerId: string
  text: string
  state: 'queued' | 'delivered' | 'cancelled'
  deliveredMessageId?: string
  deliveredAt?: string
}

export interface PendingGroupBatch {
  id: string
  requestId: string
  conversationId: string
  sourceBurstId?: string
  eligibleActorIds: string[]
  /** Legacy alias retained while old state is migrated. */
  eligibleContactIds: string[]
  messages: PendingGroupBatchMessage[]
  status: 'queued' | 'delivering' | 'completed' | 'cancelled' | 'failed'
  createdAt: string
  updatedAt: string
  error?: string
}

export interface PocketConversation {
  id: string
  kind: 'direct' | 'group'
  title: string
  /** Authoritative membership. Contact ids and discovered actor ids share this namespace. */
  participantActorIds: string[]
  /** Contact-only compatibility projection; never use it to infer all members. */
  participantContactIds: string[]
  messages: PhoneMessage[]
  unread: number
  pause?: { reason: ConversationPauseReason; createdAt: string; source: 'model' | 'scene' }
  availability: ConversationAvailability
  tailSnapshot?: PocketConversationTailSnapshot
  lastDecision?: PocketReplyDecision
  outgoingBurst?: {
    id: string
    messageIds: string[]
    open: boolean
    held: boolean
    finalized: boolean
    explicitRemoteOverride: boolean
    updatedAt: string
  }
  createdAt: string
  updatedAt: string
}

export interface PocketContactSourceOption {
  kind: 'character' | 'council'
  sourceId: string
  itemId?: string
  name: string
  role: string
  description: string
  avatarUrl: string
  accent?: string
  importedContactId?: string
}

export interface PhoneNote {
  id: string
  title: string
  body: string
  mood: string
  pinned: boolean
  author: 'user' | 'character' | 'model' | 'shared'
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  start: string
  end: string
  whenKind: 'exact' | 'approximate' | 'relative' | 'unscheduled'
  whenText: string
  color: string
  lane: string
  completed: boolean
  createdBy: 'user' | 'character' | 'model'
  kind?: 'event' | 'phone-handoff'
  actorContactIds?: string[]
  source?: { app: 'messages'; conversationId: string; relayId: string; messageId?: string }
  channelTransition?: { from: 'remote' | 'arriving' | 'paused'; to: 'local'; reason: ConversationLocalReason }
}

export interface PocketRelay {
  id: string
  chatId: string
  characterId: string
  contactId: string
  conversationId: string
  /** Outgoing decision burst which created this relay. Absent only on migrated/scene-created relays. */
  burstId?: string
  reason: ConversationLocalReason
  actorState: 'in_scene' | 'arrived' | 'took_action' | 'continued_in_person'
  conversationTail: PocketConversationTailSnapshot
  latestExchange: string
  sourceMessageId?: string
  timelineEventId: string
  createdAt: string
  status: 'pending' | 'consumed' | 'dismissed'
  consumedAt?: string
  consumedMessageId?: string
  injectedAt?: string
  injectedGenerationId?: string
  serializedRelayChars?: number
  serializedRelay?: string
  relayExchangeMessageCount?: number
  injectionError?: string
  continuation: {
    state: 'idle' | 'launching' | 'accepted' | 'started' | 'completed' | 'blocked' | 'failed' | 'stopped'
    generationId?: string
    invokedAt?: string
    permissionCheckedAt?: string
    permissions?: { chatMutation: boolean; generation: boolean }
    method?: 'spindle.chat.appendMessage(triggerGeneration)'
    hostCallReturnedAt?: string
    hostAcceptedAt?: string
    generationStartedAt?: string
    generationCompletedAt?: string
    sourceMessageId?: string
    error?: string
  }
}

export type PocketReferenceScope = 'conversation' | 'recent_messages' | 'selected_messages'

export interface PocketReferenceParticipant {
  actorId: string
  contactId?: string
  name: string
  role: string
  identityBrief: string
}

export interface PocketReferenceMessage {
  messageId: string
  sender: 'persona' | 'contact'
  senderContactId?: string
  senderActorId?: string
  senderName: string
  text: string
  createdAt: string
}

/**
 * A user-armed, one-shot Pocket context attachment for the next normal RP turn.
 * Unlike PocketRelay this never changes channel ownership or scene presence.
 */
export interface PocketContextReference {
  id: string
  chatId: string
  characterId: string
  sourceApp: 'messages'
  conversationId: string
  conversationTitle: string
  conversationKind: 'direct' | 'group'
  scope: PocketReferenceScope
  visibility: 'context'
  participants: PocketReferenceParticipant[]
  snapshot: string
  messages: PocketReferenceMessage[]
  createdAt: string
  status: 'armed' | 'injected' | 'consumed' | 'cancelled' | 'failed'
  injectedAt?: string
  injectedGenerationId?: string
  boundUserMessageId?: string
  serializedReferenceChars?: number
  serializedReference?: string
  consumedAt?: string
  consumedMessageId?: string
  error?: string
}

export interface RoleplayWeather {
  location: string
  condition: string
  temperature: number
  unit: 'C' | 'F'
  high: number
  low: number
  details: string
  updatedAt: string
}

export type TrackerKind = 'meter' | 'counter' | 'state' | 'timer'
export type TrackerClock = 'real' | 'roleplay'
export type TrackerUpdateMode = 'manual' | 'model' | 'automatic'
export type TrackerOperation = 'set' | 'add' | 'subtract' | 'reset' | 'set_state'
export type TrackerPresentation = 'relationship' | 'meter' | 'vitals' | 'segmented' | 'counter' | 'timer' | 'state' | 'compact'

export interface TrackerTarget {
  type: 'character' | 'persona' | 'relationship' | 'scene' | 'world' | 'custom'
  id: string
  label: string
}

export interface TrackerBand {
  min: number
  max: number
  label: string
  color: string
}

export interface TrackerHistoryEntry {
  id: string
  previous: number | string
  next: number | string
  operation: TrackerOperation | 'automatic'
  amount?: number
  reason: string
  source: 'user' | 'model' | 'tag' | 'automatic' | 'migration'
  createdAt: string
  roleplayAt?: string
}

interface TrackerBase {
  id: string
  key: string
  label: string
  kind: TrackerKind
  value: number
  initialValue: number
  min: number
  max: number
  unit: string
  color: string
  target: TrackerTarget
  updateMode: TrackerUpdateMode
  clock: TrackerClock
  allowModelWrite: boolean
  presentation: TrackerPresentation
  bands: TrackerBand[]
  history: TrackerHistoryEntry[]
  ratePerHour: number
  lastUpdated: string
  lastRoleplayAt: string
  pausedReason: string
  visibleToModel: boolean
  createdAt: string
  updatedAt: string
}

export interface MeterTracker extends TrackerBase { kind: 'meter' }
export interface CounterTracker extends TrackerBase { kind: 'counter'; step: number }
export interface TimerTracker extends TrackerBase { kind: 'timer'; direction: 'up' | 'down' }
export interface StateTracker extends TrackerBase { kind: 'state'; state: string; initialState: string; states: string[] }

export type PhoneTracker = MeterTracker | CounterTracker | TimerTracker | StateTracker

export interface PhoneNotification {
  id: string
  app: PhoneApp
  title: string
  body: string
  createdAt: string
  read: boolean
  dismissedAt?: string
  source?: 'model' | 'automatic' | 'system'
  severity?: 'info' | 'important' | 'error'
  route?: PocketRoute
  /** Migrated on read; retained only for older backups. */
  action?: string
}

export interface PocketActivity {
  id: string
  kind: 'message' | 'contact' | 'tracker-change' | 'timeline' | 'note' | 'image' | 'weather' | 'system'
  title: string
  summary?: string
  route: PocketRoute
  createdAt: string
  scope: { chatId: string; characterId: string }
  source?: {
    commandId?: string
    messageId?: string
    trackerId?: string
    contactId?: string
    conversationId?: string
    eventId?: string
    noteId?: string
    imageId?: string
  }
}

export interface ProcessedPocketCommand {
  id: string
  semanticKey: string
  createdAt: string
  activityId?: string
}

export interface PhoneState {
  version: 10
  chatId: string
  characterId: string
  characterName: string
  roleplayNow: string
  sceneSnapshot: SceneActorSnapshot | null
  pocketPersona: ChatPocketPersona
  setup: { initialized: boolean; dismissed: boolean }
  contacts: PocketContact[]
  discoveredActors: DiscoveredActor[]
  conversations: PocketConversation[]
  notes: PhoneNote[]
  events: CalendarEvent[]
  relays: PocketRelay[]
  references: PocketContextReference[]
  groupBatches: PendingGroupBatch[]
  weather: RoleplayWeather
  trackers: PhoneTracker[]
  notifications: PhoneNotification[]
  activities: PocketActivity[]
  processedCommands: ProcessedPocketCommand[]
  updatedAt: string
}

/** Kept as a source-compatible alias for integration helpers. */
export type PhoneSettings = DevicePreferences

export interface SwarmVisualProfile {
  available: boolean
  status: 'connected' | 'not-detected' | 'disabled' | 'error'
  error: string
  characterPositive: string
  personaPositive: string
  negative: string
  presets: string
  checkpoint: string
  aspect: string
  source: 'swarm_studio' | 'manual'
  fields: Record<'char_base' | 'persona_base' | 'swarm_negative' | 'swarm_preset' | 'swarm_checkpoint' | 'swarm_aspect', {
    detected: boolean
    length: number
    preview: string
  }>
}

export interface PhoneCapabilities {
  generation: boolean
  interceptor: boolean
  tools: boolean
  chats: boolean
  characters: boolean
  personas: boolean
  images: boolean
  corsProxy: boolean
  imageGen: boolean
  panels: boolean
  push: boolean
  sceneSync: boolean
}

export interface GalleryResult {
  data: Array<{
    id: string
    thumbnailUrl: string
    fullUrl: string
    url: string
    filename: string
    mimeType: string
    width: number | null
    height: number | null
    createdAt: number
  }>
  total: number
}
