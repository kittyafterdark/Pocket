import type { PhoneState } from '../types.js'
import { trackerBand } from './trackers.js'

export const MODEL_CONTEXT_BUDGET = 5_600

function safeTime(value: string): number {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
}

function serializeWithinBudget(value: Record<string, unknown>, budget = MODEL_CONTEXT_BUDGET): string {
  let serialized = JSON.stringify(value)
  if (serialized.length <= budget) return serialized
  const compact = { ...value }
  const shrinkOrder = ['contacts', 'pinnedNotes', 'upcoming', 'trackers']
  for (const key of shrinkOrder) {
    const entries = Array.isArray(compact[key]) ? compact[key] as unknown[] : []
    while (entries.length && serialized.length > budget) {
      entries.pop()
      serialized = JSON.stringify(compact)
    }
  }
  if (serialized.length <= budget) return serialized
  const fallback = JSON.stringify({ roleplayNow: String(value.roleplayNow || '').slice(0, Math.max(0, budget - 24)), truncated: true })
  if (fallback.length <= budget) return fallback
  return '{}'
}

function projectedRoleplayTime(state: PhoneState): string {
  if (state.roleplayClockSource === 'narrative' && state.roleplayClockPrecision !== 'exact' && state.roleplayClockLabel) {
    return state.roleplayClockLabel
  }
  return state.roleplayNow
}
export function projectPhoneContext(state: PhoneState, budget = MODEL_CONTEXT_BUDGET): string {
  const contacts: Array<Record<string, unknown>> = state.contacts
    .filter((contact) => contact.presence.inScene || contact.contextPolicy.pinned || contact.relationship === 'close')
    .slice(0, 12)
    .map((contact) => ({
      id: contact.id.slice(0, 180),
      name: contact.name.slice(0, 120),
      role: contact.role.slice(0, 120),
      source: contact.source.kind,
      relationship: contact.relationship,
      inScene: contact.presence.inScene,
      pinned: contact.contextPolicy.pinned,
      identityBrief: (contact.identityBrief || contact.description || '').slice(0, 360),
      sceneNote: (contact.sceneNote || '').slice(0, 240),
    }))
  const discoveredActors = state.discoveredActors || []
  const knownContactIds = new Set(discoveredActors.map((actor) => actor.promotedContactId).filter(Boolean))
  for (const actor of discoveredActors.filter((entry) => entry.relationship === 'close' && !knownContactIds.has(entry.promotedContactId)).slice(0, Math.max(0, 12 - contacts.length))) {
    contacts.push({
      id: actor.id.slice(0, 180),
      name: actor.displayName.slice(0, 120),
      role: 'Discovered actor',
      source: 'discovered',
      relationship: 'close',
      inScene: false,
      pinned: false,
      identityBrief: '',
      sceneNote: '',
    })
  }
  const trackers = state.trackers
    .filter((tracker) => tracker.visibleToModel)
    .slice(0, 12)
    .map((tracker) => {
      const target = `${tracker.target.type}:${tracker.target.label || tracker.target.id || 'unassigned'}`
      const value = tracker.kind === 'state' ? tracker.state : `${Number(tracker.value.toFixed(2))}${tracker.unit.slice(0, 40)}`
      const band = tracker.kind === 'state' ? '' : trackerBand(tracker)?.label || ''
      return `${tracker.label.slice(0, 120)} [${target}] = ${value}${band ? ` (${band})` : ''}`
    })
  const upcoming = state.events
    .filter((event) => !event.completed)
    .sort((a, b) => safeTime(a.start) - safeTime(b.start))
    .slice(0, 8)
    .map((event) => `${event.whenText || event.start || 'Unscheduled'} — ${event.title.slice(0, 180)}`)
  return serializeWithinBudget({
    roleplayNow: projectedRoleplayTime(state),
    roleplayClock: {
      source: state.roleplayClockSource || 'legacy',
      precision: state.roleplayClockPrecision || 'unknown',
      label: state.roleplayClockLabel || '',
    },
    stateRevision: state.stateRevision || 0,
    weather: {
      location: state.weather.location.slice(0, 160), condition: state.weather.condition.slice(0, 120),
      temperature: state.weather.temperature, unit: state.weather.unit, details: state.weather.details.slice(0, 300),
    },
    trackers,
    upcoming,
    pinnedNotes: state.notes.filter((note) => note.pinned).slice(0, 5).map((note) => `${note.title.slice(0, 120)}: ${note.body.slice(0, 320)}`),
    contacts,
  }, budget)
}
