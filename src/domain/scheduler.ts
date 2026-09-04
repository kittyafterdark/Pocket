import type { PhoneEventSuggestion } from '../types.js'

type AnyRecord = Record<string, unknown>

function record(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}
function names(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const result: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    const name = clean(item, 120).replace(/\s+/g, ' ')
    const key = name.toLocaleLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    result.push(name)
    if (result.length >= 16) break
  }
  return result
}
export function normalizeSuggestionWhenKind(value: unknown): PhoneEventSuggestion['whenKind'] {
  return value === 'exact' || value === 'approximate' || value === 'relative' || value === 'unscheduled'
    ? value
    : 'unscheduled'
}
export function normalizeEventSuggestion(
  value: unknown,
  makeId: (prefix: string) => string,
): PhoneEventSuggestion | undefined {
  if (!record(value) || (value.kind !== undefined && value.kind !== 'event')) return undefined
  const title = clean(value.title, 180)
  if (!title) return undefined
  const status = value.status === 'declined' || value.status === 'scheduled' ? value.status : 'pending'
  const start = clean(value.start, 80)
  const end = clean(value.end, 80)
  return {
    id: clean(value.id, 180) || makeId('suggestion'),
    kind: 'event',
    status,
    title,
    description: clean(value.description, 1_200),
    whenKind: normalizeSuggestionWhenKind(value.whenKind),
    whenText: clean(value.whenText, 240),
    start: Number.isFinite(Date.parse(start)) ? start : undefined,
    end: Number.isFinite(Date.parse(end)) ? end : undefined,
    participantNames: names(value.participantNames ?? value.participants),
    scheduledEventId: clean(value.scheduledEventId, 180) || undefined,
  }
}
export function generatedEventSuggestion(
  value: unknown,
  makeId: (prefix: string) => string,
): PhoneEventSuggestion | undefined {
  const suggestion = normalizeEventSuggestion(value, makeId)
  if (!suggestion) return undefined
  suggestion.status = 'pending'
  suggestion.scheduledEventId = undefined
  return suggestion
}
