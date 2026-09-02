export type PhoneApp =
  | 'home'
  | 'messages'
  | 'gallery'
  | 'camera'
  | 'notes'
  | 'weather'
  | 'calendar'
  | 'trackers'
  | 'settings'

export type PhoneTheme = 'midnight' | 'porcelain' | 'rose' | 'forest' | 'custom'
export type OpenAnimation = 'spring' | 'slide' | 'fade' | 'none'

export type PocketRoute =
  | { app: 'home' }
  | { app: 'messages'; contactId?: string; messageId?: string }
  | { app: 'trackers'; trackerId?: string; view?: 'detail' | 'config' }
  | { app: 'calendar'; eventId?: string }
  | { app: 'notes'; noteId?: string }
  | { app: 'gallery'; imageId?: string }
  | { app: 'camera' }
  | { app: 'weather' }
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
export interface DevicePreferences {
  version: 1
  theme: PhoneTheme
  colors: PhonePalette
  handsetScale: number
  animation: OpenAnimation
  animationDurationMs: number
  reducedMotion: boolean
  autoOpenOnModelAction: boolean
  pushNotifications: boolean
  useSwarmProfile: boolean
  sceneEnhancer: boolean
  manualVisualProfile: ManualVisualProfile
}

export interface PhoneMessage {
  id: string
  sender: 'user' | 'character' | 'system'
  text: string
  createdAt: string
  read: boolean
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  imageId?: string
  imageUrl?: string
}

export interface PhoneContact {
  id: string
  name: string
  subtitle: string
  avatarUrl: string
  messages: PhoneMessage[]
  unread: number
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
  route?: PocketRoute
  /** Migrated on read; retained only for older backups. */
  action?: string
}

export interface PocketActivity {
  id: string
  kind: 'message' | 'tracker-change' | 'timeline' | 'note' | 'image' | 'weather' | 'system'
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
  version: 2
  chatId: string
  characterId: string
  characterName: string
  roleplayNow: string
  contacts: PhoneContact[]
  notes: PhoneNote[]
  events: CalendarEvent[]
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
  characterPositive: string
  personaPositive: string
  negative: string
  presets: string
  checkpoint: string
  aspect: string
  source: 'swarm_studio' | 'manual'
}

export interface PhoneCapabilities {
  generation: boolean
  interceptor: boolean
  tools: boolean
  chats: boolean
  characters: boolean
  personas: boolean
  images: boolean
  imageGen: boolean
  panels: boolean
  push: boolean
}

export interface GalleryResult {
  data: Array<{
    id: string
    url: string
    filename: string
    mimeType: string
    width: number | null
    height: number | null
    createdAt: number
  }>
  total: number
}
