import type { RoleplayWeather } from '../../types.js'
import { el } from '../shared.js'
import { weatherConditionKind, weatherGlyph } from './weather-outlook.js'

export function launcherWeatherWidget(weather: RoleplayWeather, variant: 'card' | 'stripe' = 'card'): HTMLElement {
  const card = el('div', 'lp-launcher-weather-card')
  card.dataset.variant = variant
  card.dataset.condition = weatherConditionKind(weather.condition)
  card.append(el('h3', '', 'Weather'))
  if (weather.location) card.append(el('p', 'lp-launcher-weather-location', weather.location))
  const reading = el('div', 'lp-launcher-weather-reading')
  reading.append(el('strong', 'lp-launcher-weather-temp', `${weather.temperature}°${weather.unit}`), weatherGlyph(weather.condition))
  card.append(reading, el('p', '', weather.condition))
  const range = [Number.isFinite(weather.high) ? `High ${weather.high}°` : '', Number.isFinite(weather.low) ? `Low ${weather.low}°` : ''].filter(Boolean)
  if (range.length) card.append(el('p', 'lp-launcher-weather-range', range.join(' · ')))
  return card
}
