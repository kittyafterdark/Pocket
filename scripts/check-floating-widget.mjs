import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url)), output = resolve(root, 'tmp/floating-widget')
await mkdir(output, { recursive: true })
const build = spawnSync('bun', ['build', 'tests/fixtures/launcher-browser.ts', '--target=browser', '--format=iife', `--outfile=${output}/preview.js`], { cwd: root, encoding: 'utf8' })
if (build.status !== 0) throw build.error || new Error(build.stderr)
const require = createRequire(import.meta.url), paths = [process.env.POCKET_PLAYWRIGHT_ROOT, resolve(root, '../../LumiTest/Lumiverse/scripts/e2e-diagnostics'), process.env.NODE_PATH].filter(Boolean)
const { chromium } = require(require.resolve('playwright', { paths })), script = await readFile(resolve(output, 'preview.js'))
const server = createServer((request, response) => {
  if (request.url.startsWith('/preview.js')) { response.setHeader('Content-Type', 'text/javascript'); response.end(script) }
  else if (request.url.startsWith('/photo.svg')) { response.setHeader('Content-Type', 'image/svg+xml'); response.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#c8a4cc"/><circle cx="280" cy="140" r="65" fill="#ffe5a5"/><path d="M0 240 150 160 400 280V400H0Z" fill="#627ca4"/><path d="M0 300 200 260 400 330V400H0Z" fill="#314b73"/></svg>') }
  else { const scale = Number(new URL(request.url,'http://localhost').searchParams.get('scale')) || 1; response.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--lumiverse-ui-scale:${scale};zoom:${scale}}</style><script src="/preview.js" defer></script>`) }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
let browser, activePage
try {
  browser = await chromium.launch({headless:true,executablePath:process.env.POCKET_CHROMIUM_EXECUTABLE || undefined})
  for (const mode of ['native','fallback']) for (const width of [390,1280]) for (const scale of [.7,1,1.3]) {
    const page = await browser.newPage({viewport:{width,height:900}}); activePage=page; page.setDefaultTimeout(10000)
    const errors=[]; page.on('pageerror',error=>errors.push(error.stack))
    await page.goto(`http://127.0.0.1:${server.address().port}/?floatGeometry=${mode}&scale=${scale}`)
    const launcher=page.getByRole('button',{name:'Open Pocket',exact:true}); await launcher.waitFor()
    const drag = async (x,y) => {
      const before=await page.evaluate(()=>window.floatPlacementSnapshot().moves), box=await launcher.boundingBox()
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down(); await page.mouse.move(x,y,{steps:12}); await page.mouse.up()
      await page.waitForFunction(before=>window.floatPlacementSnapshot().moves>before,before)
      await page.waitForFunction(()=>localStorage.getItem('float-preferences'))
      await page.waitForTimeout(300)
    }
    const checkEdge = async side => {
      const box=await page.locator('#floating').boundingBox(), saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('float-preferences')).launcherPosition)
      const wanted=side==='left'?12*scale:width-70*scale
      assert.ok(Math.abs(box.x-wanted)<2,`${mode} ${width}px scale ${scale} ${side}: ${JSON.stringify({box,wanted,saved})}`)
      assert.ok(Math.abs(saved.x*scale-box.x)<2,'Saved and rendered coordinates agree')
    }
    await drag(1,400); await checkEdge('left')
    await drag(width-1,400); await checkEdge('right')
    await page.reload(); await launcher.waitFor(); await checkEdge('right')
    await page.evaluate(()=>{document.documentElement.style.setProperty('--lumiverse-ui-scale','1.3');document.documentElement.style.zoom='1.3'})
    await page.waitForTimeout(80)
    const resized=await page.locator('#floating').boundingBox()
    assert.ok(resized.x>=0&&resized.x+resized.width<=width+1,'Changing UI scale keeps the launcher inside the viewport')
    await page.screenshot({path:resolve(output,`${mode}-${width}-${scale}.png`)})
    assert.deepEqual(errors,[]); await page.close()
    console.log(`Floating widget edges/persistence passed: ${mode}, ${width}px, UI scale ${scale}`)
  }
} catch(error) {if(activePage&&!activePage.isClosed())await activePage.screenshot({path:resolve(output,'failure.png')});throw error}
finally {await browser?.close();await new Promise(done=>server.close(done))}
