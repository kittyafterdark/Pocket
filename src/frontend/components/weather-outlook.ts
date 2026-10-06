import type { RoleplayWeather } from '../../types.js'
import { usableWeatherOutlook } from '../../domain/app-review.js'
import { el } from '../shared.js'

export type WeatherConditionKind = 'clear' | 'partly' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog' | 'wind'

export function weatherConditionKind(condition: string): WeatherConditionKind {
  if (/storm|thunder|lightning/i.test(condition)) return 'storm'
  if (/snow|sleet|blizzard|flurr/i.test(condition)) return 'snow'
  if (/rain|shower|drizzle/i.test(condition)) return 'rain'
  if (/fog|mist|haze|smoke/i.test(condition)) return 'fog'
  if (/wind|breez|gust/i.test(condition)) return 'wind'
  if (/partly|mostly\s+sunny|sun.*cloud|cloud.*sun/i.test(condition)) return 'partly'
  if (/cloud|overcast/i.test(condition)) return 'cloud'
  return 'clear'
}

function glyphMarkup(kind: WeatherConditionKind): string {
  if (kind === 'storm') return '<path class="lp-weather-soft" d="M14 35c-4.8 0-8.6-3.5-8.6-8 0-4.1 3.3-7.5 7.5-7.9C14.5 12.8 20 8 26.8 8c7.5 0 13.7 5.7 14.5 13 5.8.5 10.3 5.2 10.3 10.9 0 6.1-5 11.1-11.1 11.1H14Z"/><path d="M14 35c-4.8 0-8.6-3.5-8.6-8 0-4.1 3.3-7.5 7.5-7.9C14.5 12.8 20 8 26.8 8c7.5 0 13.7 5.7 14.5 13 5.8.5 10.3 5.2 10.3 10.9 0 6.1-5 11.1-11.1 11.1H14Z"/><path class="lp-weather-bolt" d="m30 39-7 12h7l-3 8 13-16h-8l3-4Z"/><path d="M13 49l-2 6m31-6-2 6"/>'
  if (kind === 'snow') return '<path class="lp-weather-soft" d="M15 34c-4.8 0-8.7-3.5-8.7-8 0-4.2 3.3-7.6 7.6-8C15.4 11.9 21 7.4 27.6 7.4c7.3 0 13.3 5.4 14.3 12.4 5.3.8 9.4 5.2 9.4 10.6 0 5.9-4.8 10.7-10.7 10.7H15Z"/><path d="M15 34c-4.8 0-8.7-3.5-8.7-8 0-4.2 3.3-7.6 7.6-8C15.4 11.9 21 7.4 27.6 7.4c7.3 0 13.3 5.4 14.3 12.4 5.3.8 9.4 5.2 9.4 10.6 0 5.9-4.8 10.7-10.7 10.7H15Z"/><path d="M18 47v10m-4-8 8 6m0-6-8 6m24-8v10m-4-8 8 6m0-6-8 6"/>'
  if (kind === 'rain') return '<path class="lp-weather-soft" d="M14 36c-4.8 0-8.6-3.5-8.6-8 0-4.2 3.3-7.6 7.6-8C14.5 13.7 20 9 26.8 9c7.5 0 13.7 5.7 14.5 13 5.8.5 10.3 5.2 10.3 10.9 0 6.1-5 11.1-11.1 11.1H14Z"/><path d="M14 36c-4.8 0-8.6-3.5-8.6-8 0-4.2 3.3-7.6 7.6-8C14.5 13.7 20 9 26.8 9c7.5 0 13.7 5.7 14.5 13 5.8.5 10.3 5.2 10.3 10.9 0 6.1-5 11.1-11.1 11.1H14Z"/><path d="m15 49-2 7m14-7-2 7m15-7-2 7"/>'
  if (kind === 'fog') return '<path class="lp-weather-soft" d="M16 31c-4.4 0-8-3.2-8-7.3 0-3.8 3-6.9 7-7.3C16.4 10.9 21.3 7 27.2 7c6.8 0 12.5 5 13.5 11.6 5 .7 8.8 4.8 8.8 9.9 0 .9-.1 1.7-.3 2.5H16Z"/><path d="M16 31c-4.4 0-8-3.2-8-7.3 0-3.8 3-6.9 7-7.3C16.4 10.9 21.3 7 27.2 7c6.8 0 12.5 5 13.5 11.6 5 .7 8.8 4.8 8.8 9.9 0 .9-.1 1.7-.3 2.5H16ZM10 39h42M15 47h34M21 55h24"/>'
  if (kind === 'wind') return '<path class="lp-weather-soft" d="M13 17h25c5.4 0 8.6-7.1 4.3-10.5"/><path d="M8 18h30c5.4 0 8.6-7.1 4.3-10.5M5 30h42c6.5 0 9.8 8.3 4.5 12.3M11 42h25c4.8 0 7.4 6 3.6 9"/>'
  if (kind === 'partly') return '<circle class="lp-weather-soft" cx="23" cy="21" r="12"/><circle cx="23" cy="21" r="9"/><path d="M23 5v4m0 24v4M7 21h4m24 0h4M12 10l3 3m16 16 3 3M12 32l3-3M31 13l3-3"/><path class="lp-weather-cloud-fill" d="M25 47c-4.7 0-8.5-3.4-8.5-7.7 0-4 3.1-7.3 7.3-7.7 1.5-5.7 6.5-9.9 12.6-9.9 6.8 0 12.4 5 13.2 11.4 5 .5 8.9 4.6 8.9 9.5 0 5.3-4.4 9.7-9.7 9.7H25Z"/><path d="M25 47c-4.7 0-8.5-3.4-8.5-7.7 0-4 3.1-7.3 7.3-7.7 1.5-5.7 6.5-9.9 12.6-9.9 6.8 0 12.4 5 13.2 11.4 5 .5 8.9 4.6 8.9 9.5 0 5.3-4.4 9.7-9.7 9.7H25Z"/>'
  if (kind === 'cloud') return '<path class="lp-weather-soft" d="M14 39c-5.1 0-9.2-3.7-9.2-8.4 0-4.3 3.4-7.8 7.9-8.3C14.3 15.8 20.1 11 27.1 11c7.8 0 14.2 5.8 15.1 13.2 6 .6 10.7 5.4 10.7 11.3 0 6.3-5.2 11.5-11.5 11.5H14Z"/><path d="M14 39c-5.1 0-9.2-3.7-9.2-8.4 0-4.3 3.4-7.8 7.9-8.3C14.3 15.8 20.1 11 27.1 11c7.8 0 14.2 5.8 15.1 13.2 6 .6 10.7 5.4 10.7 11.3 0 6.3-5.2 11.5-11.5 11.5H14Z"/>'
  return '<circle class="lp-weather-soft" cx="32" cy="32" r="14"/><circle cx="32" cy="32" r="11"/><path d="M32 5v8m0 38v8M5 32h8m38 0h8M13 13l6 6m26 26 6 6M13 51l6-6m26-26 6-6"/>'
}

export function weatherGlyph(condition: string): HTMLElement {
  const kind = weatherConditionKind(condition)
  const node = el('span', 'lp-weather-glyph')
  node.dataset.weatherKind = kind
  node.setAttribute('aria-hidden', 'true')
  node.innerHTML = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${glyphMarkup(kind)}</svg>`
  return node
}

export function weatherOutlook(weather: RoleplayWeather, now: string, offset = 0): HTMLElement {
  const panel = el('section', 'lp-weather-week')
  panel.setAttribute('aria-label', 'Seven-day story forecast')
  const head = el('header', 'lp-weather-week-head')
  const heading = el('div', 'lp-weather-week-heading')
  heading.append(el('span', 'lp-eyebrow', 'Story forecast'), el('h3', 'lp-title', 'The week ahead'))
  head.append(heading, el('span', 'lp-weather-week-badge', `7 days · °${weather.unit}`))
  panel.append(head)
  const outlook = usableWeatherOutlook(weather, now, offset)
  if (!outlook) {
    const empty = el('div', 'lp-weather-empty')
    empty.append(weatherGlyph(weather.condition), el('span', '', weather.outlook ? 'The story date, location or unit changed. Refresh the outlook for this scene.' : 'Build a seven-day outlook from this scene’s weather.'))
    panel.append(empty)
    return panel
  }
  const min = Math.min(...outlook.days.map(day => day.low)), max = Math.max(...outlook.days.map(day => day.high)), span = Math.max(1, max - min)
  for (const [i, day] of outlook.days.entries()) {
    const row = el('div', 'lp-weather-day')
    row.dataset.condition = weatherConditionKind(day.condition)
    if (i === 0) row.dataset.today = 'true'
    const date = new Date(day.date + 'T12:00:00Z')
    const dayName = el('strong', 'lp-weather-day-name', i === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }))
    const body = el('div', 'lp-weather-day-copy')
    body.append(el('strong', 'lp-weather-day-condition', day.condition), el('small', 'lp-copy', day.details))
    const range = el('div', 'lp-weather-day-range'), rail = el('span', 'lp-weather-range-rail'), fill = el('span')
    range.setAttribute('aria-label', `Low ${day.low} degrees, high ${day.high} degrees`)
    fill.style.left = `${(day.low - min) / span * 100}%`
    fill.style.width = `${Math.max(3, (day.high - day.low) / span * 100)}%`
    rail.append(fill)
    range.append(el('span', 'lp-weather-low', `${day.low}°`), rail, el('strong', 'lp-weather-high', `${day.high}°`))
    row.append(dayName, weatherGlyph(day.condition), body, range)
    panel.append(row)
  }
  return panel
}
