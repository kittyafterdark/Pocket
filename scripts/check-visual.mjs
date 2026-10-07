import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { createServer } from 'node:http'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
// Reuse the diagnostics installation or the desktop's bundled runtime; no new dependency.
const paths = [process.env.POCKET_PLAYWRIGHT_ROOT, resolve(root, '../../LumiTest/Lumiverse/scripts/e2e-diagnostics'), process.env.NODE_PATH].filter(Boolean)
let playwright
try { playwright = require(require.resolve('playwright', { paths })) }
catch { throw new Error('Set POCKET_PLAYWRIGHT_ROOT to an existing Playwright installation (for example Lumiverse scripts/e2e-diagnostics).') }
const update = process.argv.includes('--update')
const add = process.argv.includes('--add')
const updateCases = process.argv.filter(argument => argument.startsWith('--update-case=')).map(argument => argument.split('=')[1])
const output = join(root, 'tmp/visual')
const baseline = join(root, 'tests/visual/baselines')
await mkdir(output, { recursive: true })
await mkdir(baseline, { recursive: true })
// A fresh directory prevents stale exports from masking a missing renderer/mount.
const fixtures = await mkdtemp(join(output, 'fixtures-'))
const contracts = spawnSync(process.execPath, ['tests/contracts.mjs'], { cwd: root, env: { ...process.env, POCKET_VISUAL_DIR: fixtures }, encoding: 'utf8' })
if (contracts.status !== 0) throw contracts.error || new Error(contracts.stderr + contracts.stdout)
const sampler = spawnSync('bun', ['scripts/preview-trackers.ts', join(fixtures, 'trackers.html')], { cwd: root, encoding: 'utf8' })
if (sampler.status !== 0) throw sampler.error || new Error(sampler.stderr + sampler.stdout)
const connectors = spawnSync('bun', ['scripts/preview-connectors.ts', join(fixtures, 'connectors.html')], { cwd: root, encoding: 'utf8' })
if (connectors.status !== 0) throw connectors.error || new Error(connectors.stderr + connectors.stdout)
const clocks = spawnSync('bun', ['scripts/preview-activity-clock.ts', join(fixtures, 'phone-clock-states.html')], { cwd: root, encoding: 'utf8' })
if (clocks.status !== 0) throw clocks.error || new Error(clocks.stderr + clocks.stdout)
const weather = spawnSync('bun', ['scripts/preview-weather.ts', join(fixtures, 'weather-widgets.html')], { cwd: root, encoding: 'utf8' })
if (weather.status !== 0) throw weather.error || new Error(weather.stderr + weather.stdout)
const files = (await readdir(fixtures)).filter(name => name.endsWith('.html')).sort()
assert.equal(files.length, 33, 'A visual fixture failed to export; do not compare stale captures.')
for (const name of updateCases) assert.ok(files.includes(name + '.html'), 'Unknown baseline case')
const server = createServer(async (request, response) => {
  const name = request.url.slice(1)
  if (!files.includes(name)) { response.writeHead(404).end(); return }
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.end(await readFile(join(fixtures, name)))
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await playwright.chromium.launch({ headless: true })
  const version = browser.version()
  const metadata = join(baseline, 'environment.json')
  const environment = { browser: version, platform: process.platform }
  if (update) await writeFile(metadata, JSON.stringify(environment, null, 2) + '\n')
  else assert.deepEqual(JSON.parse(await readFile(metadata, 'utf8')), environment, 'Baseline browser/platform changed; inspect before explicitly refreshing baselines.')
  let count = 0
  for (const width of [390, 900]) {
    const page = await browser.newPage({ viewport: { width, height: 930 }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'UTC' })
    await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort())
    for (const file of files) {
      await page.goto(`http://127.0.0.1:${server.address().port}/${file}`)
      await page.evaluate(() => document.fonts.ready)
      if (file === 'weather-app.html') assert.ok(await page.locator('.lumiphone-screen').evaluate(node => node.getBoundingClientRect().width > 200), 'Weather screen must keep its visible handset width')
      if (file === 'contacts.html') {
        for (const scale of [.7, 1, 1.3]) {
          await page.locator('.lumiphone-shell').evaluate((node, scale) => node.style.setProperty('--pocket-ui-scale', String(scale)), scale)
          const bounds = await page.locator('.lp-contact-row .lp-avatar').evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return [b.width, b.height] }))
          assert.ok(bounds.length && bounds.every(([w, h]) => Math.abs(w - h) < .1), 'Contact avatars must remain circular at every UI scale')
        }
        await page.locator('.lumiphone-shell').evaluate(node => node.style.removeProperty('--pocket-ui-scale'))
        await page.reload()
        await page.evaluate(() => document.fonts.ready)
      }
      if (file === 'npc-draft-portrait.html') {
        await page.locator('.lp-npc-camera .lp-content').evaluate(node => { node.scrollTop = node.scrollHeight })
        assert.equal(await page.locator('.lp-npc-portrait-actions button').count(), 3)
        assert.ok(await page.locator('.lp-npc-portrait-actions').evaluate(node => { const row = node.getBoundingClientRect(); const screen = node.closest('.lumiphone-screen').getBoundingClientRect(); return row.width <= screen.width && row.top >= screen.top && row.bottom <= screen.bottom }), 'NPC portrait row must fit and remain reachable in the handset')
      }
      if (file === 'chat-invite.html') await page.locator('.lp-event-invite').scrollIntoViewIfNeeded()
      if (file.startsWith('sheet-')) {
        // Recreate the native top-layer mount after JSDOM's layout-free export.
        await page.locator('dialog.lp-sheet').evaluate(dialog => {
          const bounds = dialog.closest('.lumiphone-shell').getBoundingClientRect()
          dialog.removeAttribute('open')
          Object.assign(dialog.style, { position:'fixed', margin:'0', left:bounds.left + 12 + 'px', top:'auto', bottom:Math.max(12, window.innerHeight - bounds.bottom + 24) + 'px', width:Math.max(0, bounds.width - 24) + 'px', maxHeight:Math.max(120, bounds.height - 70) + 'px' })
          dialog.showModal()
        })
        const panel = page.locator('.lp-sheet-panel')
        const initial = await panel.evaluate(node => parseFloat(getComputedStyle(node).paddingTop))
        await page.locator('.lumiphone-shell').evaluate(node => node.style.setProperty('--pocket-ui-scale', '1.3'))
        assert.ok(Math.abs((await panel.evaluate(node => parseFloat(getComputedStyle(node).paddingTop))) / initial - 1.3) < .01, 'Sheet spacing must follow interface scale')
        assert.ok(await page.locator('.lp-sheet-close').isVisible(), 'Scaled sheet must retain its close action')
        await page.locator('.lp-sheet-close').scrollIntoViewIfNeeded()
        assert.ok(await page.locator('.lp-sheet-close').evaluate(node => node.getBoundingClientRect().bottom <= node.closest('dialog').getBoundingClientRect().bottom), 'Long camera options must scroll to Done')
        await page.locator('dialog.lp-sheet').evaluate(node => { node.scrollTop = 0 })
      }
      const name = file.replace('.html', `-${width}.png`)
      const actual = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' })
      if (update || updateCases.includes(file.replace('.html', ''))) await writeFile(join(baseline, name), actual)
      else {
        const expected = await readFile(join(baseline, name)).catch(error => {
          if (add && error.code === 'ENOENT') return null
          throw error
        })
        if (expected === null) { await writeFile(join(baseline, name), actual); count++; continue }
        if (!actual.equals(expected)) {
          await writeFile(join(output, name), actual)
          throw new Error(`Visual regression: ${name}. Compare tests/visual/baselines with tmp/visual; do not blindly refresh.`)
        }
      }
      if (file.startsWith('phone-') || file.startsWith('scene-')) {
        assert.ok(await page.locator('pocket-inline-ui').count(), 'Fixture must contain a real ShadowRoot renderer')
        await page.addStyleTag({ content: 'button,span,strong,pocket-inline-ui *{font-size:80px!important;background:red!important;transform:rotate(15deg)!important}button::before,span::after{content:"HOSTILE"!important}' })
        const hostile = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' })
        if (!actual.equals(hostile)) { await writeFile(join(output, 'hostile-' + name), hostile); await writeFile(join(output, name), actual) }
        assert.ok(actual.equals(hostile), `Host theme leaked into ${file}`)
        // Prove this fixture detects a real internal regression as well as rejecting host CSS.
        await page.evaluate(() => document.querySelector('pocket-inline-ui').shadowRoot.querySelector('.pocket-inline-frame').style.background = 'red')
        assert.ok(!actual.equals(await page.screenshot({ fullPage: true })), 'Visual comparison must detect an internal style mutation')
      }
      count++
    }
    await page.close()
  }
  console.log(`${count} visual baselines ${update ? 'recorded' : 'passed'}; hostile theme isolation and deliberate regression detection passed.`)
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)) }
