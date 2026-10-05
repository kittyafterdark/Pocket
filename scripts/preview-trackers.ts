import { JSDOM } from 'jsdom'
import { PHONE_STYLES } from '../src/styles.js'
import { trackerDisplay } from '../src/frontend/components/tracker-display.js'
import { trackerSamples, trackerSampleState } from '../tests/fixtures/tracker-samples.js'

const output = process.argv[2]
if (!output) throw new Error('Pass an output HTML path.')
const dom = new JSDOM()
globalThis.document = dom.window.document
const cards = trackerSamples.map(tracker => trackerDisplay(tracker, trackerSampleState).outerHTML).join('\n')
await Bun.write(output, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pocket tracker sampler</title>
<style>${PHONE_STYLES}
body { margin:0; background:#151318; padding:24px; color:#eeedf1; font-family:Inter,system-ui,sans-serif; }
h1 { margin:0 0 6px; font-size:20px; } body>p { color:#a8a4b2; margin:0 0 24px; font-size:12px; }
#tracker-sampler.lumiphone-shell { width:100%; max-width:100%; height:auto; min-height:0; position:static; overflow:visible; border:0; border-radius:0; box-shadow:none; background:transparent; aspect-ratio:auto; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); grid-template-rows:none; grid-auto-rows:auto; gap:16px; --lp-surface:#201e25; --lp-bg:#151318; --lp-text:#eeedf1; --lp-muted:#a8a4b2; --lp-border:#ffffff14; }
#tracker-sampler .lp-tracker-card { align-self:start; }
@media(max-width:800px) { #tracker-sampler.lumiphone-shell { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:500px) { body { padding:16px; } #tracker-sampler.lumiphone-shell { grid-template-columns:minmax(0,1fr); } }
</style><h1>Pocket · tracker sampler</h1><p>Controlled fixtures · all eight presentations</p><main class="lumiphone-shell" id="tracker-sampler">${cards}</main></html>`)
dom.window.close()
