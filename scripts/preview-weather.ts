import { JSDOM } from 'jsdom'
import type { RoleplayWeather } from '../src/types.js'
import { PHONE_STYLES } from '../src/styles.js'
import { weatherConditionKind, weatherGlyph, weatherOutlook } from '../src/frontend/components/weather-outlook.js'
import { el } from '../src/frontend/shared.js'

const output = process.argv[2]
if (!output) throw new Error('Pass an output HTML path.')
const dom = new JSDOM()
globalThis.document = dom.window.document
const now = '2026-10-06T16:00:00.000Z'
const weather: RoleplayWeather = {
  location: 'Musutafu', condition: 'Partly cloudy', temperature: 21, unit: 'C', high: 24, low: 16,
  details: 'Cool air, bright breaks in the cloud cover, and a light breeze moving through the city.', updatedAt: now,
  outlook: { startDate: '2026-10-06', location: 'Musutafu', unit: 'C', generatedAt: now, days: [
    { date:'2026-10-06', condition:'Partly cloudy', high:24, low:16, details:'Bright breaks between clouds.' },
    { date:'2026-10-07', condition:'Rain showers', high:20, low:14, details:'Showers drift through after noon.' },
    { date:'2026-10-08', condition:'Thunderstorms', high:19, low:13, details:'Storms build late in the day.' },
    { date:'2026-10-09', condition:'Cloudy', high:18, low:12, details:'A cool, overcast day.' },
    { date:'2026-10-10', condition:'Fog', high:17, low:11, details:'Low visibility through the morning.' },
    { date:'2026-10-11', condition:'Windy', high:20, low:12, details:'Strong gusts in exposed streets.' },
    { date:'2026-10-12', condition:'Clear', high:22, low:11, details:'Clear and dry.' },
  ] },
}
const hero = el('div', 'lp-weather-hero')
hero.dataset.condition = weatherConditionKind(weather.condition)
const top = el('div', 'lp-weather-hero-top')
top.append(el('div', 'lp-weather-condition', weather.condition), el('div', 'lp-copy', weather.location))
const bottom = el('div', 'lp-weather-hero-bottom')
bottom.append(el('span','lp-weather-stat',`↑ ${weather.high}°`), el('span','lp-weather-stat',`↓ ${weather.low}°`), el('span','lp-weather-updated','Updated 1:00 PM'))
hero.append(top, weatherGlyph(weather.condition), el('div','lp-weather-temp',`${weather.temperature}°${weather.unit}`), bottom)
const body = `${hero.outerHTML}<p class="lp-weather-note">${weather.details}</p>${weatherOutlook(weather, now).outerHTML}`
await Bun.write(output, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pocket weather widget preview</title><style>${PHONE_STYLES}
*{box-sizing:border-box} body{margin:0;min-height:100vh;padding:36px 16px;background:#dadddf;font-family:Inter,-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif}.preview-phone{width:min(430px,100%);margin:auto;overflow:hidden;border:7px solid #151517;border-radius:48px;background:#050506;box-shadow:0 30px 90px #0004}.preview-status{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;background:#050506;color:#fff;font-size:11px;font-weight:700}.preview-island{width:92px;height:25px;border-radius:999px;background:#000;box-shadow:inset 0 0 0 1px #ffffff0d}.preview-appbar{display:flex;align-items:end;justify-content:space-between;padding:8px 18px 13px;border-bottom:1px solid #ffffff10;color:#fff}.preview-appbar b{font-size:16px}.preview-appbar span{color:#8d8d96;font-size:10px}#weather-preview.lumiphone-shell{position:static;width:100%;max-width:none;height:auto;min-height:0;aspect-ratio:auto;overflow:visible;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:none;gap:12px;padding:13px 11px 24px;border:0;border-radius:0;background:#050506;box-shadow:none;--lp-surface:#111114;--lp-bg:#050506;--lp-text:#f5f5f7;--lp-muted:#8d8d96;--lp-border:#ffffff14;--lp-accent:#8ab4ff}@media(max-width:450px){body{padding:0;background:#050506}.preview-phone{width:100%;border:0;border-radius:0;box-shadow:none}}</style><section class="preview-phone"><div class="preview-status"><span>1:07</span><div class="preview-island"></div><span>5G&nbsp; ▰</span></div><div class="preview-appbar"><span>‹ Back</span><b>Weather</b><span>Edit</span></div><main class="lumiphone-shell" id="weather-preview">${body}</main></section></html>`)
dom.window.close()
