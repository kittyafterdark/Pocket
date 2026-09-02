import type { DevicePreferences, PhonePalette, PhoneTheme } from '../types.js'

export const PREFERENCES_VERSION = 3 as const
export const PREFERENCES_PATH = 'device/preferences.json'

const HEX = /^#[0-9a-f]{6}$/i

const THEME_COLORS: Record<Exclude<PhoneTheme, 'custom'>, PhonePalette> = {
  midnight: {
    accent: '#8b7dff', bezel: '#17151d', background: '#0d0c12', surface: '#17131f', text: '#f8f6ff',
    wallpaperPrimary: '#171327', wallpaperSecondary: '#123a4a', chatPrimary: '#2c2448', chatSecondary: '#13111c',
  },
  porcelain: {
    accent: '#6657d9', bezel: '#d6d0cb', background: '#f2f0ed', surface: '#f7f3ef', text: '#201d25',
    wallpaperPrimary: '#eeeae6', wallpaperSecondary: '#cfd9e8', chatPrimary: '#e4def8', chatSecondary: '#faf8f6',
  },
  rose: {
    accent: '#ff78a8', bezel: '#321722', background: '#1b1018', surface: '#28131c', text: '#fff4f7',
    wallpaperPrimary: '#4a1830', wallpaperSecondary: '#7a294e', chatPrimary: '#4b1d31', chatSecondary: '#1d1117',
  },
  forest: {
    accent: '#63d8a4', bezel: '#10251d', background: '#0d1713', surface: '#11231c', text: '#f1fff8',
    wallpaperPrimary: '#14372a', wallpaperSecondary: '#1d5a41', chatPrimary: '#17412f', chatSecondary: '#0f1c17',
  },
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '', max = 12_000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) || fallback : fallback
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function numberIn(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback
}

export function safeColor(value: unknown, fallback: string): string {
  const candidate = text(value, fallback, 16)
  return HEX.test(candidate) ? candidate.toLowerCase() : fallback
}

export function themePalette(theme: PhoneTheme): PhonePalette {
  return structuredClone(THEME_COLORS[theme === 'custom' ? 'midnight' : theme])
}

export function defaultPreferences(): DevicePreferences {
  return {
    version: PREFERENCES_VERSION,
    theme: 'midnight',
    colors: themePalette('midnight'),
    wallpaperImageUrl: '',
    chatWallpaperImageUrl: '',
    handsetScale: 1,
    uiScale: 1,
    animation: 'spring',
    animationDurationMs: 280,
    reducedMotion: false,
    autoOpenOnModelAction: false,
    pushNotifications: false,
    useSwarmProfile: true,
    sceneEnhancer: true,
    generationMode: 'roleplay',
    sidecarConnectionId: '',
    autoReplyAfterSend: false,
    ambientMessaging: 'off',
    roleplayContextMode: 'smart',
    recentRoleplayMessages: 8,
    notificationSounds: false,
    notificationPreviews: true,
    notifyMessages: true,
    notifyContacts: true,
    notifyTrackers: true,
    customCss: '',
    personaAppearance: {},
    generationHistory: [],
    manualVisualProfile: { positive: '', negative: '', model: '', connectionId: '', loras: [], parameters: {} },
  }
}

/**
 * Migrates both the current device schema and the v0 settings object that was
 * embedded in PhoneState. Unknown future versions fail closed to defaults.
 */
export function normalizePreferences(value: unknown): DevicePreferences {
  const fallback = defaultPreferences()
  const raw = record(value)
  const version = Number(raw.version ?? 0)
  if (Number.isFinite(version) && version > PREFERENCES_VERSION) return fallback
  const allowedThemes = new Set<PhoneTheme>(['midnight', 'porcelain', 'rose', 'forest', 'custom'])
  const theme = allowedThemes.has(raw.theme as PhoneTheme) ? raw.theme as PhoneTheme : fallback.theme
  const preset = themePalette(theme)
  const colors = record(raw.colors)

  // v0 migration: translate raw CSS settings into safe structured colors. We
  // intentionally do not execute or preserve arbitrary CSS.
  const legacyAccent = safeColor(raw.accent, preset.accent)
  const legacyBezel = safeColor(raw.bezelColor, preset.bezel)
  const palette: PhonePalette = {
    accent: safeColor(colors.accent, legacyAccent),
    bezel: safeColor(colors.bezel, legacyBezel),
    background: safeColor(colors.background, preset.background),
    surface: safeColor(colors.surface, preset.surface),
    text: safeColor(colors.text, preset.text),
    wallpaperPrimary: safeColor(colors.wallpaperPrimary, preset.wallpaperPrimary),
    wallpaperSecondary: safeColor(colors.wallpaperSecondary, preset.wallpaperSecondary),
    chatPrimary: safeColor(colors.chatPrimary, preset.chatPrimary),
    chatSecondary: safeColor(colors.chatSecondary, preset.chatSecondary),
  }
  const manual = record(raw.manualVisualProfile)
  const allowedAnimations = new Set(['spring', 'slide', 'fade', 'none'])
  const history = (Array.isArray(raw.generationHistory) ? raw.generationHistory : []).slice(-24).flatMap((entry) => {
    const item = record(entry)
    const requestId = text(item.requestId, '', 180)
    const task = text(item.task, '', 40) as DevicePreferences['generationHistory'][number]['task']
    const tasks = new Set(['npc-contact', 'profile-refresh', 'scene-sync', 'message-reply', 'message-retry', 'reply-decision', 'ambient-decision', 'scene-planner', 'connection-test'])
    if (!requestId || !tasks.has(task)) return []
    const status: DevicePreferences['generationHistory'][number]['status'] = item.status === 'completed' || item.status === 'failed' ? item.status : 'started'
    return [{
      requestId, task,
      mode: item.mode === 'sidecar' ? 'sidecar' as const : 'roleplay' as const,
      connectionId: text(item.connectionId, '', 180), connectionName: text(item.connectionName, '', 180),
      provider: text(item.provider, '', 120), model: text(item.model, '', 500), status,
      startedAt: text(item.startedAt, new Date(0).toISOString(), 40),
      completedAt: text(item.completedAt, '', 40) || undefined,
      latencyMs: Number.isFinite(Number(item.latencyMs)) ? Math.max(0, Math.round(Number(item.latencyMs))) : undefined,
      error: text(item.error, '', 500) || undefined,
    }]
  })
  const rawPersonaAppearance = record(raw.personaAppearance)
  const personaAppearance: DevicePreferences['personaAppearance'] = {}
  for (const [personaId, value] of Object.entries(rawPersonaAppearance).slice(0, 32)) {
    if (!personaId || personaId.length > 180) continue
    const item = record(value)
    const overrideTheme = allowedThemes.has(item.theme as PhoneTheme) ? item.theme as PhoneTheme : theme
    const overrideColors = record(item.colors)
    const overridePreset = themePalette(overrideTheme)
    personaAppearance[personaId] = {
      enabled: bool(item.enabled, false),
      theme: overrideTheme,
      colors: {
        accent: safeColor(overrideColors.accent, overridePreset.accent),
        bezel: safeColor(overrideColors.bezel, overridePreset.bezel),
        background: safeColor(overrideColors.background, overridePreset.background),
        surface: safeColor(overrideColors.surface, overridePreset.surface),
        text: safeColor(overrideColors.text, overridePreset.text),
        wallpaperPrimary: safeColor(overrideColors.wallpaperPrimary, overridePreset.wallpaperPrimary),
        wallpaperSecondary: safeColor(overrideColors.wallpaperSecondary, overridePreset.wallpaperSecondary),
        chatPrimary: safeColor(overrideColors.chatPrimary, overridePreset.chatPrimary),
        chatSecondary: safeColor(overrideColors.chatSecondary, overridePreset.chatSecondary),
      },
      customCss: text(item.customCss, '', 30_000),
    }
  }
  const contextMode = raw.roleplayContextMode === 'off' || raw.roleplayContextMode === 'recent' || raw.roleplayContextMode === 'story'
    ? raw.roleplayContextMode : 'smart'
  return {
    version: PREFERENCES_VERSION,
    theme,
    colors: palette,
    wallpaperImageUrl: text(raw.wallpaperImageUrl, '', 2_000),
    chatWallpaperImageUrl: text(raw.chatWallpaperImageUrl, '', 2_000),
    handsetScale: numberIn(raw.handsetScale, fallback.handsetScale, 0.8, 1.25),
    uiScale: numberIn(raw.uiScale, fallback.uiScale, 0.7, 1.3),
    animation: allowedAnimations.has(String(raw.animation)) ? raw.animation as DevicePreferences['animation'] : fallback.animation,
    animationDurationMs: Math.round(numberIn(raw.animationDurationMs, fallback.animationDurationMs, 0, 700)),
    reducedMotion: bool(raw.reducedMotion, fallback.reducedMotion),
    autoOpenOnModelAction: bool(raw.autoOpenOnModelAction, fallback.autoOpenOnModelAction),
    pushNotifications: bool(raw.pushNotifications, fallback.pushNotifications),
    useSwarmProfile: bool(raw.useSwarmProfile, fallback.useSwarmProfile),
    sceneEnhancer: bool(raw.sceneEnhancer, fallback.sceneEnhancer),
    generationMode: raw.generationMode === 'sidecar' ? 'sidecar' : 'roleplay',
    sidecarConnectionId: text(raw.sidecarConnectionId, '', 180),
    autoReplyAfterSend: bool(raw.autoReplyAfterSend, fallback.autoReplyAfterSend),
    ambientMessaging: raw.ambientMessaging === 'sparse' || raw.ambientMessaging === 'normal' ? raw.ambientMessaging : 'off',
    roleplayContextMode: contextMode,
    recentRoleplayMessages: Math.round(numberIn(raw.recentRoleplayMessages, fallback.recentRoleplayMessages, 0, 20)),
    notificationSounds: bool(raw.notificationSounds, fallback.notificationSounds),
    notificationPreviews: bool(raw.notificationPreviews, fallback.notificationPreviews),
    notifyMessages: bool(raw.notifyMessages, fallback.notifyMessages),
    notifyContacts: bool(raw.notifyContacts, fallback.notifyContacts),
    notifyTrackers: bool(raw.notifyTrackers, fallback.notifyTrackers),
    customCss: text(raw.customCss, '', 30_000),
    personaAppearance,
    generationHistory: history,
    manualVisualProfile: {
      positive: text(manual.positive, '', 12_000),
      negative: text(manual.negative, '', 12_000),
      model: text(manual.model, '', 500),
      connectionId: text(manual.connectionId, '', 200),
      loras: (Array.isArray(manual.loras) ? manual.loras : []).slice(0, 24).flatMap((entry) => {
        const item = record(entry)
        const name = text(item.name, '', 500)
        if (!name) return []
        return [{ name, weight: numberIn(item.weight, 1, -4, 4) }]
      }),
      parameters: record(manual.parameters),
    },
  }
}

export function isFuturePreferences(value: unknown): boolean {
  const raw = record(value)
  return Number.isFinite(Number(raw.version)) && Number(raw.version) > PREFERENCES_VERSION
}

export function wallpaperCss(primary: string, secondary: string): string {
  return `linear-gradient(145deg, ${safeColor(primary, '#171327')} 0%, ${safeColor(secondary, '#123a4a')} 100%)`
}
