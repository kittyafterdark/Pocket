import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import type { RoleplayWeather } from '../src/types.js'
import { weatherConditionKind, weatherGlyph, weatherOutlook } from '../src/frontend/components/weather-outlook.js'

const now = '2026-10-06T16:00:00.000Z'
const weather: RoleplayWeather = {
  location: 'Musutafu', condition: 'Partly cloudy', temperature: 21, unit: 'C', high: 24, low: 16,
  details: 'Cool air, bright breaks in the cloud cover, and a light breeze.', updatedAt: now,
  outlook: {
    startDate: '2026-10-06', location: 'Musutafu', unit: 'C', generatedAt: now,
    days: [
      { date: '2026-10-06', condition: 'Partly cloudy', high: 24, low: 16, details: 'Bright breaks between clouds.' },
      { date: '2026-10-07', condition: 'Rain showers', high: 20, low: 14, details: 'Showers drift through after noon.' },
      { date: '2026-10-08', condition: 'Thunderstorms', high: 19, low: 13, details: 'Storms build late in the day.' },
      { date: '2026-10-09', condition: 'Snow flurries', high: 4, low: -2, details: 'Light flurries taper after sunset.' },
      { date: '2026-10-10', condition: 'Fog', high: 12, low: 7, details: 'Low visibility through the morning.' },
      { date: '2026-10-11', condition: 'Windy', high: 17, low: 9, details: 'Strong gusts in exposed streets.' },
      { date: '2026-10-12', condition: 'Clear', high: 22, low: 11, details: 'Clear and dry.' },
    ],
  },
}

test('weather condition flavors cover semantic display states', () => {
  expect(weatherConditionKind('Clear skies')).toBe('clear')
  expect(weatherConditionKind('Partly cloudy')).toBe('partly')
  expect(weatherConditionKind('Heavy rain')).toBe('rain')
  expect(weatherConditionKind('Thunderstorms')).toBe('storm')
  expect(weatherConditionKind('Snow flurries')).toBe('snow')
  expect(weatherConditionKind('Dense fog')).toBe('fog')
  expect(weatherConditionKind('Windy')).toBe('wind')
})

test('weather glyphs and outlook expose semantic hooks without interactive fake controls', () => {
  const previous = globalThis.document
  const dom = new JSDOM()
  try {
    globalThis.document = dom.window.document
    const glyph = weatherGlyph('Thunderstorms')
    expect(glyph.dataset.weatherKind).toBe('storm')
    expect(glyph.getAttribute('aria-hidden')).toBe('true')
    expect(glyph.querySelector('svg')).not.toBeNull()

    const panel = weatherOutlook(weather, now)
    expect(panel.querySelectorAll('.lp-weather-day').length).toBe(7)
    expect(panel.querySelector('.lp-weather-day[data-today="true"]')).not.toBeNull()
    expect(panel.querySelector('.lp-weather-day[data-condition="storm"]')).not.toBeNull()
    expect(panel.querySelector('.lp-weather-day[data-condition="snow"]')).not.toBeNull()
    expect(panel.querySelectorAll('button').length).toBe(0)
    expect(panel.querySelector('.lp-weather-day-range')?.getAttribute('aria-label')).toContain('Low')
  } finally { globalThis.document = previous; dom.window.close() }
})
