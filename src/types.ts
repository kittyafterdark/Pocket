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

export interface PhoneTracker {
  id: string
  label: string
  value: number
  min: number
  max: number
  unit: string
  color: string
  ratePerHour: number
  lastUpdated: string
  visibleToModel: boolean
}

export interface PhoneNotification {
  id: string
  app: PhoneApp
  title: string
  body: string
  createdAt: string
  read: boolean
  action?: string
}

export interface PhoneState {
  version: 1
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
  processedCommands: Array<{ id: string; semanticKey: string; createdAt: string }>
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
