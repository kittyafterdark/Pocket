import type { RoleplayWeather } from '../../types.js'
import { usableWeatherOutlook } from '../../domain/app-review.js'
import { el } from '../shared.js'

export function weatherGlyph(condition: string): HTMLElement {
  const node = el('span', 'lp-weather-glyph'); node.setAttribute('aria-hidden', 'true')
  const paths = /snow|sleet/i.test(condition) ? '<path d="M12 3v18M4 7l16 10M4 17 20 7M9 5l3 3 3-3M9 19l3-3 3 3"/>'
    : /rain|storm|shower/i.test(condition) ? '<path d="M6 15a4 4 0 1 1 1-8 5 5 0 0 1 10 1 3.5 3.5 0 0 1 0 7H6ZM8 18l-1 3m6-3-1 3m6-3-1 3"/>'
      : /cloud|overcast|fog/i.test(condition) ? '<path d="M6 18a4 4 0 1 1 1-8 5 5 0 0 1 10 1 3.5 3.5 0 0 1 0 7H6Z"/>'
        : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>'
  node.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  return node
}
export function weatherOutlook(weather: RoleplayWeather, now: string, offset = 0): HTMLElement {
  const panel = el('section', 'lp-weather-week')
  panel.setAttribute('aria-label', 'Seven-day story forecast')
  const outlook = usableWeatherOutlook(weather, now, offset)
  panel.append(el('h3', 'lp-title', 'The week ahead · °' + weather.unit), el('p', 'lp-copy', 'A fictional outlook for planning scenes. Today’s established weather stays unchanged.'))
  if (!outlook) { panel.append(el('p', 'lp-weather-empty', weather.outlook ? 'The story date, location or unit changed. Refresh the outlook for this scene.' : 'Build a seven-day outlook from this scene’s weather.')); return panel }
  const min = Math.min(...outlook.days.map(day => day.low)), max = Math.max(...outlook.days.map(day => day.high)), span = Math.max(1, max - min)
  for (const [i, day] of outlook.days.entries()) {
    const row = el('div', 'lp-weather-day')
    const date = new Date(day.date + 'T12:00:00Z')
    row.append(el('strong', '', i === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })), weatherGlyph(day.condition))
    const body = el('div', 'lp-weather-day-copy'); body.append(el('span', '', day.condition), el('small', 'lp-copy', day.details)); row.append(body)
    const range = el('div', 'lp-weather-day-range'), rail = el('span', 'lp-weather-range-rail'), fill = el('span')
    fill.style.left = `${(day.low - min) / span * 100}%`; fill.style.width = `${Math.max(3, (day.high - day.low) / span * 100)}%`; rail.append(fill)
    range.append(el('span', '', `${day.low}°`), rail, el('strong', '', `${day.high}°`)); row.append(range); panel.append(row)
  }
  return panel
}
