import type { PhoneState } from '../types.js'

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
  return serialized.length <= budget ? serialized : serialized.slice(0, budget)
}

export function projectPhoneContext(state: PhoneState, budget = MODEL_CONTEXT_BUDGET): string {
  const contacts = state.contacts
    .map((contact) => ({
      name: contact.name.slice(0, 120),
      recent: contact.messages.slice(-3).map((message) => `${message.sender}: ${message.text.slice(0, 180)}`),
    }))
    .filter((contact) => contact.recent.length)
    .slice(0, 8)
  const trackers = state.trackers
    .filter((tracker) => tracker.visibleToModel)
    .slice(0, 12)
    .map((tracker) => `${tracker.label.slice(0, 120)}: ${Number(tracker.value.toFixed(2))}${tracker.unit.slice(0, 40)}`)
  const upcoming = state.events
    .filter((event) => !event.completed)
    .sort((a, b) => safeTime(a.start) - safeTime(b.start))
    .slice(0, 8)
    .map((event) => `${event.whenText || event.start || 'Unscheduled'} — ${event.title.slice(0, 180)}`)
  return serializeWithinBudget({
    roleplayNow: state.roleplayNow,
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
