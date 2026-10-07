export const CLOCK_DAY_PART_KEYS = ['dawn', 'early_morning', 'morning', 'late_morning', 'noon', 'afternoon', 'late_afternoon', 'evening', 'night', 'late_night', 'midnight'] as const

export function clockDayPart(value: unknown): string {
  if (typeof value !== 'string') return ''
  const key = value.trim().toLowerCase().replace(/[_-]/g, ' ')
  // Older model labels may start with a valid day part, then wander into prose.
  const match = [...CLOCK_DAY_PART_KEYS].sort((a, b) => b.length - a.length)
    .find(part => key === part.replaceAll('_', ' ') || key.startsWith(part.replaceAll('_', ' ') + ','))
  return match || ''
}

export function clockLabel(value: unknown, dayPart?: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  const key = clockDayPart(dayPart) || clockDayPart(raw)
  if (key) {
    const label = key.replaceAll('_', ' ')
    return raw.toLowerCase() === label ? raw : label[0].toUpperCase() + label.slice(1)
  }
  if (/^(?:[01]?\d|2[0-3]):[0-5]\d(?:\s*[AP]M)?$/i.test(raw) || /^[+-]?\d{1,4} minutes?$/.test(raw)) return raw
  return ''
}
