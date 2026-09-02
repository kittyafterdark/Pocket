import type {
  PhoneTracker,
  TrackerBand,
  TrackerClock,
  TrackerHistoryEntry,
  TrackerKind,
  TrackerOperation,
  TrackerPresentation,
  TrackerTarget,
  TrackerUpdateMode,
} from '../types.js'

type RecordValue = Record<string, unknown>
export const TRACKER_HISTORY_LIMIT = 40

const KINDS = new Set<TrackerKind>(['meter', 'counter', 'state', 'timer'])
const CLOCKS = new Set<TrackerClock>(['real', 'roleplay'])
const MODES = new Set<TrackerUpdateMode>(['manual', 'model', 'automatic'])
const PRESENTATIONS = new Set<TrackerPresentation>(['relationship', 'meter', 'vitals', 'segmented', 'counter', 'timer', 'state', 'compact'])
const TARGETS = new Set<TrackerTarget['type']>(['character', 'persona', 'relationship', 'scene', 'world', 'custom'])

function record(value: unknown): value is RecordValue { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
function clean(value: unknown, max = 160): string { return typeof value === 'string' ? value.trim().slice(0, max) : '' }
function finite(value: unknown, fallback: number): number { const number = Number(value); return Number.isFinite(number) ? number : fallback }
function iso(value: unknown, fallback: string): string { const text = clean(value, 80); return Number.isFinite(Date.parse(text)) ? text : fallback }
function trackerId(prefix = 'trk'): string { return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`}` }

export function trackerKey(value: unknown, fallback = 'tracker'): string {
  const key = clean(value, 120).toLocaleLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return key || fallback
}

export function normalizeTrackerTarget(value: unknown, fallback: TrackerTarget = { type: 'custom', id: '', label: 'Unassigned' }): TrackerTarget {
  if (!record(value)) return fallback
  const type = TARGETS.has(value.type as TrackerTarget['type']) ? value.type as TrackerTarget['type'] : fallback.type
  return { type, id: clean(value.id, 180), label: clean(value.label, 160) || fallback.label }
}

function normalizeBands(value: unknown, min: number, max: number, color: string): TrackerBand[] {
  const bands = (Array.isArray(value) ? value : []).flatMap((item) => {
    if (!record(item)) return []
    const bandMin = Math.max(min, Math.min(max, finite(item.min, min)))
    const bandMax = Math.max(bandMin, Math.min(max, finite(item.max, max)))
    const label = clean(item.label, 80)
    return label ? [{ min: bandMin, max: bandMax, label, color: clean(item.color, 40) || color }] : []
  }).slice(0, 12)
  if (bands.length || max <= min) return bands
  const span = max - min
  return [
    { min, max: min + span * .33, label: 'Low', color: '#ef6b73' },
    { min: min + span * .33, max: min + span * .67, label: 'Steady', color },
    { min: min + span * .67, max, label: 'High', color: '#62c994' },
  ]
}

function normalizeHistory(value: unknown): TrackerHistoryEntry[] {
  return (Array.isArray(value) ? value : []).flatMap((item) => {
    if (!record(item)) return []
    const operation = ['set', 'add', 'subtract', 'reset', 'set_state', 'automatic'].includes(String(item.operation))
      ? item.operation as TrackerHistoryEntry['operation'] : 'set'
    const source: TrackerHistoryEntry['source'] = item.source === 'model' || item.source === 'tag' || item.source === 'automatic' || item.source === 'migration' ? item.source : 'user'
    const createdAt = iso(item.createdAt, new Date().toISOString())
    return [{
      id: clean(item.id, 160) || trackerId('hist'),
      previous: typeof item.previous === 'string' ? clean(item.previous, 160) : finite(item.previous, 0),
      next: typeof item.next === 'string' ? clean(item.next, 160) : finite(item.next, 0),
      operation,
      amount: Number.isFinite(Number(item.amount)) ? Number(item.amount) : undefined,
      reason: clean(item.reason, 300),
      source,
      createdAt,
      roleplayAt: clean(item.roleplayAt, 80) || undefined,
    }]
  }).slice(-TRACKER_HISTORY_LIMIT)
}

export interface NormalizeTrackerContext { now?: string; roleplayNow?: string; characterId?: string; characterName?: string }

export function normalizeTracker(value: unknown, context: NormalizeTrackerContext = {}): PhoneTracker | null {
  if (!record(value)) return null
  const now = context.now || new Date().toISOString()
  const label = clean(value.label, 120)
  if (!label) return null
  const legacy = !KINDS.has(value.kind as TrackerKind)
  const kind = legacy ? 'meter' : value.kind as TrackerKind
  const min = finite(value.min, kind === 'counter' ? 0 : 0)
  const max = Math.max(min, finite(value.max, kind === 'counter' ? 999_999 : 100))
  const numeric = Math.max(min, Math.min(max, finite(value.value, min)))
  const initialValue = Math.max(min, Math.min(max, finite(value.initialValue, numeric)))
  const color = clean(value.color, 40) || '#8b7dff'
  const ratePerHour = Math.max(-100_000, Math.min(100_000, finite(value.ratePerHour, 0)))
  const target = legacy
    ? { type: 'custom' as const, id: '', label: 'Unassigned' }
    : normalizeTrackerTarget(value.target, context.characterId
      ? { type: 'character', id: context.characterId, label: context.characterName || 'Character' }
      : { type: 'custom', id: '', label: 'Unassigned' })
  const clock = legacy ? 'real' : CLOCKS.has(value.clock as TrackerClock) ? value.clock as TrackerClock : 'real'
  const updateMode = MODES.has(value.updateMode as TrackerUpdateMode)
    ? value.updateMode as TrackerUpdateMode : ratePerHour ? 'automatic' : 'manual'
  const presentation = PRESENTATIONS.has(value.presentation as TrackerPresentation)
    ? value.presentation as TrackerPresentation
    : kind === 'counter' ? 'counter' : kind === 'timer' ? 'timer' : kind === 'state' ? 'state' : 'meter'
  const base = {
    id: clean(value.id, 120) || trackerId(), key: trackerKey(value.key || label), label, kind,
    value: numeric, initialValue, min, max, unit: clean(value.unit, 40), color, target,
    updateMode, clock, allowModelWrite: legacy ? false : value.allowModelWrite === true,
    presentation, bands: normalizeBands(value.bands, min, max, color), history: normalizeHistory(value.history),
    ratePerHour, lastUpdated: iso(value.lastUpdated, now),
    lastRoleplayAt: iso(value.lastRoleplayAt, iso(context.roleplayNow, '')),
    pausedReason: clean(value.pausedReason, 240), visibleToModel: value.visibleToModel !== false,
    createdAt: iso(value.createdAt, now), updatedAt: iso(value.updatedAt, iso(value.lastUpdated, now)),
  }
  if (kind === 'state') {
    const states = (Array.isArray(value.states) ? value.states : []).map((entry) => clean(entry, 80)).filter(Boolean).slice(0, 24)
    const initialState = clean(value.initialState, 80) || states[0] || 'Unknown'
    const state = clean(value.state, 80) || initialState
    return { ...base, kind, state, initialState, states: states.includes(state) ? states : [...states, state].slice(0, 24) }
  }
  if (kind === 'counter') return { ...base, kind, step: Math.max(.0001, Math.abs(finite(value.step, 1))) }
  if (kind === 'timer') return { ...base, kind, direction: value.direction === 'up' ? 'up' : 'down' }
  return { ...base, kind }
}

export interface TrackerTemplate {
  group: 'Character' | 'Relationship' | 'Scene' | 'Resource' | 'World' | 'Timer' | 'State' | 'Blank'
  name: string
  values: Partial<PhoneTracker> & Pick<PhoneTracker, 'kind' | 'label'>
}

export const TRACKER_TEMPLATES: TrackerTemplate[] = [
  { group: 'Character', name: 'Health', values: { kind: 'meter', label: 'Health', key: 'health', value: 100, initialValue: 100, min: 0, max: 100, unit: '%', presentation: 'vitals' } },
  { group: 'Character', name: 'Hunger', values: { kind: 'meter', label: 'Hunger', key: 'hunger', value: 20, initialValue: 20, min: 0, max: 100, unit: '%', updateMode: 'automatic', ratePerHour: 3, clock: 'roleplay' } },
  { group: 'Relationship', name: 'Trust', values: { kind: 'meter', label: 'Trust', key: 'trust', value: 50, initialValue: 50, min: 0, max: 100, unit: '%', presentation: 'relationship', target: { type: 'relationship', id: '', label: 'Current relationship' } } },
  { group: 'Relationship', name: 'Relationship Status', values: { kind: 'state', label: 'Relationship Status', key: 'relationship_status', state: 'Acquaintances', initialState: 'Acquaintances', states: ['Strangers', 'Acquaintances', 'Friends', 'Close', 'Partners'], presentation: 'state', target: { type: 'relationship', id: '', label: 'Current relationship' } } },
  { group: 'Scene', name: 'Tension', values: { kind: 'meter', label: 'Scene Tension', key: 'scene_tension', value: 10, initialValue: 10, min: 0, max: 100, unit: '%', target: { type: 'scene', id: '', label: 'Current scene' } } },
  { group: 'Resource', name: 'Ammo', values: { kind: 'counter', label: 'Ammo', key: 'ammo', value: 12, initialValue: 12, min: 0, max: 999, unit: ' rounds', presentation: 'counter' } },
  { group: 'World', name: 'World Alert', values: { kind: 'state', label: 'World Alert', key: 'world_alert', state: 'Calm', initialState: 'Calm', states: ['Calm', 'Watchful', 'Alarmed', 'Crisis'], target: { type: 'world', id: '', label: 'Current world' } } },
  { group: 'Timer', name: 'Countdown', values: { kind: 'timer', label: 'Countdown', key: 'countdown', value: 60, initialValue: 60, min: 0, max: 60, unit: ' min', direction: 'down', updateMode: 'automatic', ratePerHour: -60, clock: 'roleplay', presentation: 'timer' } },
  { group: 'State', name: 'Condition', values: { kind: 'state', label: 'Condition', key: 'condition', state: 'Stable', initialState: 'Stable', states: ['Stable', 'Wounded', 'Critical', 'Recovering'], presentation: 'state' } },
  { group: 'Blank', name: 'Blank meter', values: { kind: 'meter', label: 'New tracker', key: 'new_tracker', value: 0, initialValue: 0, min: 0, max: 100, presentation: 'meter' } },
]

function addHistory(tracker: PhoneTracker, entry: Omit<TrackerHistoryEntry, 'id'>): PhoneTracker {
  return { ...tracker, history: [...tracker.history, { ...entry, id: trackerId('hist') }].slice(-TRACKER_HISTORY_LIMIT) } as PhoneTracker
}

export function trackerBand(tracker: PhoneTracker, value = tracker.value): TrackerBand | null {
  return tracker.bands.find((band, index) => value >= band.min && (value < band.max || index === tracker.bands.length - 1)) || null
}

export interface ApplyTrackerInput { operation: TrackerOperation; amount?: number; state?: string; reason?: string; source: TrackerHistoryEntry['source']; now?: string; roleplayNow?: string }

export function applyTrackerOperation(tracker: PhoneTracker, input: ApplyTrackerInput): PhoneTracker {
  const now = input.now || new Date().toISOString()
  if (tracker.kind === 'state') {
    if (input.operation !== 'set_state' && input.operation !== 'reset') throw new Error('State trackers accept set_state or reset.')
    const next = input.operation === 'reset' ? tracker.initialState : clean(input.state, 80)
    if (!next) throw new Error('set_state requires a state value.')
    if (tracker.states.length && !tracker.states.includes(next)) throw new Error(`State must be one of: ${tracker.states.join(', ')}`)
    if (next === tracker.state) return tracker
    return addHistory({ ...tracker, state: next, updatedAt: now } as PhoneTracker, {
      previous: tracker.state, next, operation: input.operation, reason: clean(input.reason, 300), source: input.source,
      createdAt: now, roleplayAt: clean(input.roleplayNow, 80) || undefined,
    })
  }
  const amount = finite(input.amount, 0)
  const rawNext = input.operation === 'reset' ? tracker.initialValue
    : input.operation === 'add' ? tracker.value + amount
      : input.operation === 'subtract' ? tracker.value - amount
        : input.operation === 'set' ? amount
          : (() => { throw new Error('Numeric trackers accept set, add, subtract, or reset.') })()
  const next = Math.max(tracker.min, Math.min(tracker.max, rawNext))
  if (next === tracker.value) return tracker
  return addHistory({ ...tracker, value: next, updatedAt: now, lastUpdated: now } as PhoneTracker, {
    previous: tracker.value, next, operation: input.operation, amount: input.operation === 'reset' ? undefined : amount,
    reason: clean(input.reason, 300), source: input.source, createdAt: now, roleplayAt: clean(input.roleplayNow, 80) || undefined,
  })
}

export interface MaterializeResult { tracker: PhoneTracker; changed: boolean }

export function materializeTracker(tracker: PhoneTracker, roleplayNow: string, wallNow = new Date().toISOString()): MaterializeResult {
  if (tracker.kind === 'state' || tracker.updateMode !== 'automatic' || !tracker.ratePerHour) return { tracker, changed: false }
  const current = tracker.clock === 'roleplay' ? Date.parse(roleplayNow) : Date.parse(wallNow)
  const previous = tracker.clock === 'roleplay' ? Date.parse(tracker.lastRoleplayAt) : Date.parse(tracker.lastUpdated)
  if (!Number.isFinite(current)) {
    const pausedReason = tracker.clock === 'roleplay' ? 'Roleplay time is approximate or unavailable.' : 'Real-time clock is unavailable.'
    return { tracker: { ...tracker, pausedReason }, changed: tracker.pausedReason !== pausedReason }
  }
  if (!Number.isFinite(previous)) {
    const anchor = new Date(current).toISOString()
    return {
      tracker: {
        ...tracker, pausedReason: '',
        lastUpdated: tracker.clock === 'real' ? anchor : tracker.lastUpdated,
        lastRoleplayAt: tracker.clock === 'roleplay' ? anchor : tracker.lastRoleplayAt,
      } as PhoneTracker,
      changed: true,
    }
  }
  if (current <= previous) return { tracker: tracker.pausedReason ? { ...tracker, pausedReason: '' } : tracker, changed: Boolean(tracker.pausedReason) }
  const nextValue = Math.max(tracker.min, Math.min(tracker.max, tracker.value + ((current - previous) / 3_600_000) * tracker.ratePerHour))
  const anchor = new Date(current).toISOString()
  let next = {
    ...tracker, value: nextValue, pausedReason: '', updatedAt: wallNow,
    lastUpdated: tracker.clock === 'real' ? anchor : tracker.lastUpdated,
    lastRoleplayAt: tracker.clock === 'roleplay' ? anchor : tracker.lastRoleplayAt,
  } as PhoneTracker
  if (nextValue !== tracker.value) next = addHistory(next, {
    previous: tracker.value, next: nextValue, operation: 'automatic', amount: nextValue - tracker.value,
    reason: tracker.clock === 'roleplay' ? 'Roleplay time advanced' : 'Real time advanced', source: 'automatic',
    createdAt: wallNow, roleplayAt: clean(roleplayNow, 80) || undefined,
  })
  return { tracker: next, changed: true }
}

export function createTrackerFromTemplate(template: TrackerTemplate, overrides: RecordValue = {}, context: NormalizeTrackerContext = {}): PhoneTracker {
  const raw = { ...template.values, ...overrides, id: clean(overrides.id, 120) || trackerId(), label: clean(overrides.label, 120) || template.values.label }
  const result = normalizeTracker(raw, context)
  if (!result) throw new Error('Tracker template is invalid.')
  return result
}
