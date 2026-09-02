import type { DevicePreferences, PhonePalette, PhoneTheme } from '../types.js'

export const PREFERENCES_VERSION = 1 as const
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
    handsetScale: 1,
    animation: 'spring',
    animationDurationMs: 280,
    reducedMotion: false,
    autoOpenOnModelAction: false,
    pushNotifications: false,
    useSwarmProfile: true,
    sceneEnhancer: true,
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
  return {
    version: PREFERENCES_VERSION,
    theme,
    colors: palette,
    handsetScale: numberIn(raw.handsetScale, fallback.handsetScale, 0.8, 1.25),
    animation: allowedAnimations.has(String(raw.animation)) ? raw.animation as DevicePreferences['animation'] : fallback.animation,
    animationDurationMs: Math.round(numberIn(raw.animationDurationMs, fallback.animationDurationMs, 0, 700)),
    reducedMotion: bool(raw.reducedMotion, fallback.reducedMotion),
    autoOpenOnModelAction: bool(raw.autoOpenOnModelAction, fallback.autoOpenOnModelAction),
    pushNotifications: bool(raw.pushNotifications, fallback.pushNotifications),
    useSwarmProfile: bool(raw.useSwarmProfile, fallback.useSwarmProfile),
    sceneEnhancer: bool(raw.sceneEnhancer, fallback.sceneEnhancer),
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
