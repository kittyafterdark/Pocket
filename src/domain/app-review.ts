import type { CalendarEvent, RoleplayWeather } from '../types.js'

export interface WeatherDay { date: string; condition: string; high: number; low: number; details: string }
export interface WeatherOutlook { startDate: string; location: string; unit: 'C' | 'F'; generatedAt: string; days: WeatherDay[] }
export function storyDate(now: string, offset = 0): string {
  const stamp = Date.parse(now)
  return Number.isFinite(stamp) ? new Date(stamp - offset * 60_000).toISOString().slice(0, 10) : ''
}
export function normalizeWeatherOutlook(value: unknown): WeatherOutlook | undefined {
  const raw = value as WeatherOutlook | null
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw.startDate || '') || !Number.isFinite(Date.parse(raw.startDate))) return
  const clean = (text: unknown, max: number) => typeof text === 'string' ? text.trim().slice(0, max) : ''
  const days = (Array.isArray(raw.days) ? raw.days : []).slice(0, 7).flatMap((day, i) => {
    if (!day || !Number.isFinite(day.high) || !Number.isFinite(day.low) || !clean(day.condition, 80) || day.low > day.high) return []
    return [{ date: new Date(Date.parse(raw.startDate) + i * 86_400_000).toISOString().slice(0, 10), condition: clean(day.condition, 80), high: Math.max(-150, Math.min(200, day.high)), low: Math.max(-150, Math.min(200, day.low)), details: clean(day.details, 240) }]
  })
  if (days.length !== 7) return
  return { startDate: raw.startDate, location: clean(raw.location, 160), unit: raw.unit === 'F' ? 'F' : 'C', generatedAt: clean(raw.generatedAt, 80), days }
}
export function usableWeatherOutlook(weather: RoleplayWeather, now: string, offset = 0): WeatherOutlook | undefined {
  const outlook = normalizeWeatherOutlook(weather.outlook)
  return outlook?.startDate === storyDate(now, offset) && outlook.location === weather.location && outlook.unit === weather.unit ? outlook : undefined
}
/** A review may summarize existing beats; it cannot invent events or reopen resolved ones. */
export function applyTimelineReview(events: CalendarEvent[], snapshot: CalendarEvent[], rows: unknown, narrative: string): number {
  let changed = 0
  const seen = new Set<string>()
  for (const raw of Array.isArray(rows) ? rows.slice(0, 16) : []) {
    if (!raw || typeof raw.id !== 'string' || seen.has(raw.id)) continue
    seen.add(raw.id)
    const before = snapshot.find(event => event.id === raw.id), event = events.find(event => event.id === raw.id)
    const evidence = typeof raw.evidence === 'string' ? raw.evidence.trim() : ''
    if (!before || !event || evidence.length < 12 || !narrative.includes(evidence) || event.title !== before.title || event.description !== before.description || event.completed !== before.completed) continue
    const description = typeof raw.description === 'string' ? raw.description.trim().slice(0, 1200) : ''
    if (description && description !== event.description) { event.description = description; changed++ }
    if (raw.completed === true && !event.completed) { event.completed = true; changed++ }
  }
  return changed
}
