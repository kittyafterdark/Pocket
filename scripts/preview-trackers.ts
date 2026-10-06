import { JSDOM } from 'jsdom'
import { PHONE_STYLES } from '../src/styles.js'
import { trackerDisplay } from '../src/frontend/components/tracker-display.js'
import { trackerSamples, trackerSampleState } from '../tests/fixtures/tracker-samples.js'

const output = process.argv[2]
if (!output) throw new Error('Pass an output HTML path.')
const dom = new JSDOM()
globalThis.document = dom.window.document
const cards = trackerSamples.map(tracker => trackerDisplay(tracker, trackerSampleState).outerHTML).join('\n')
await Bun.write(output, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pocket tracker widget sampler</title>
<style>${PHONE_STYLES}
* { box-sizing:border-box; }
body { margin:0; min-height:100vh; padding:36px 16px; background:radial-gradient(circle at 50% -20%,#fff,#e7e9ed 48%,#cfd3d9); color:#111; font-family:Inter,-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif; }
.preview-head { width:min(430px,100%); margin:0 auto 18px; padding:0 8px; }
.preview-head h1 { margin:0 0 5px; font-size:22px; letter-spacing:-.04em; }
.preview-head p { margin:0; color:#666; font-size:12px; line-height:1.5; }
.preview-phone { width:min(430px,100%); margin:auto; overflow:hidden; border:7px solid #151517; border-radius:48px; background:#050506; box-shadow:0 30px 90px #0004,inset 0 0 0 1px #fff1; }
.preview-status { height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 22px; background:#050506; color:#fff; font-size:11px; font-weight:700; }
.preview-island { width:92px; height:25px; border-radius:999px; background:#000; box-shadow:inset 0 0 0 1px #ffffff0d; }
.preview-appbar { display:flex; align-items:end; justify-content:space-between; padding:8px 18px 13px; border-bottom:1px solid #ffffff10; color:#fff; }
.preview-appbar b { font-size:16px; } .preview-appbar span { color:#8d8d96; font-size:10px; }
#tracker-sampler.lumiphone-shell { position:static; width:100%; max-width:none; height:auto; min-height:0; aspect-ratio:auto; overflow:visible; display:grid; grid-template-columns:minmax(0,1fr); grid-template-rows:none; grid-auto-rows:auto; gap:10px; padding:13px 11px 22px; border:0; border-radius:0; background:#050506; box-shadow:none; --lp-surface:#111114; --lp-bg:#050506; --lp-text:#f5f5f7; --lp-muted:#8d8d96; --lp-border:#ffffff14; }
#tracker-sampler .lp-tracker-card { align-self:start; }
@media(max-width:450px) { body { padding:0; background:#050506; } .preview-head { display:none; } .preview-phone { width:100%; border:0; border-radius:0; box-shadow:none; } }
</style><header class="preview-head"><h1>Pocket trackers · widget pass</h1><p>Health-app information design × Dynamic-Island density. Rings are reserved for meaningful progress, not decorative HUD furniture.</p></header><section class="preview-phone"><div class="preview-status"><span>10:48</span><div class="preview-island"></div><span>5G&nbsp; ▰</span></div><div class="preview-appbar"><span>‹ Back</span><b>Trackers</b><span>Add</span></div><main class="lumiphone-shell" id="tracker-sampler">${cards}</main></section></html>`)
dom.window.close()
