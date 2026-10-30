import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url)), output = resolve(root, 'tmp/npc-lifecycle')
await mkdir(output, { recursive: true })
const build = spawnSync('bun', ['build', 'tests/fixtures/launcher-browser.ts', '--target=browser', '--format=iife', `--outfile=${output}/preview.js`], { cwd: root, encoding: 'utf8' })
if (build.status !== 0) throw build.error || new Error(build.stderr)
const require = createRequire(import.meta.url), paths = [process.env.POCKET_PLAYWRIGHT_ROOT, resolve(root, '../../LumiTest/Lumiverse/scripts/e2e-diagnostics'), process.env.NODE_PATH].filter(Boolean)
const { chromium } = require(require.resolve('playwright', { paths })), script = await readFile(resolve(output, 'preview.js'))
const server = createServer((request, response) => {
  if (request.url.startsWith('/preview.js')) { response.setHeader('Content-Type', 'text/javascript'); response.end(script) }
  else if (request.url.startsWith('/photo.svg')) { response.setHeader('Content-Type', 'image/svg+xml'); response.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#c8a4cc"/><circle cx="280" cy="140" r="65" fill="#ffe5a5"/><path d="M0 240 150 160 400 280V400H0Z" fill="#627ca4"/><path d="M0 300 200 260 400 330V400H0Z" fill="#314b73"/></svg>') }
  else response.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/preview.js" defer></script>')
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
let browser, activePage
try {
  browser = await chromium.launch({ headless:true, executablePath:process.env.POCKET_CHROMIUM_EXECUTABLE || undefined })
  for (const width of [390,900]) {
    const page = await browser.newPage({ viewport:{width,height:844}, isMobile:width===390, hasTouch:width===390 })
    page.setDefaultTimeout(10000)
    page.on('pageerror', error => console.error(error.stack))
    activePage = page
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    await page.getByRole('button',{name:'Open Pocket',exact:true}).waitFor()
    await page.evaluate(() => window.deliverSocialOperationFixture({type:'lumiphone:capabilities',capabilities:{panels:true,generation:true,images:true,imageGen:true}}))
    const press = async name => { const control = page.getByRole('button',{name,exact:true}); return width === 390 ? control.tap() : control.click() }
    await press('Open Pocket'); await press('Open app drawer'); await press('Contacts'); await press('Add')
    await page.locator('textarea').first().fill('A warm florist')
    await press('Generate NPC')
    assert.ok(await page.evaluate(() => window.lastNpcRequest?.description==='A warm florist'),'Generate immediately starts the text request')
    await press('Home or dismiss phone')
    await page.waitForTimeout(180)
    await press('Open app drawer'); await press('Contacts')
    await press('Continue Fern Vale profile')
    const ready=page.getByRole('button',{name:'Save Fern Vale',exact:true})
    await ready.waitFor(); assert.equal(await ready.isDisabled(),false)
    assert.equal(await page.getByText('Writing profile',{exact:true}).count(),0,'Late progress cannot re-open the finished profile operation')
    assert.ok(await page.getByRole('img',{name:'Fern Vale portrait',exact:true}).isVisible(),'Already generated image survives leaving Contacts')
    await page.screenshot({path:resolve(output,`ready-${width}.png`)})
    await page.close()
    console.log(`NPC completed-profile return passed at ${width}px`)
  }
} catch(error) { console.error((await activePage?.locator('body').innerText())?.slice(0,4500)); throw error } finally { await browser?.close(); await new Promise(done=>server.close(done)) }
