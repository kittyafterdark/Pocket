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
const updateCase = process.argv.find(argument => argument.startsWith('--update-case='))?.split('=')[1]
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
const files = (await readdir(fixtures)).filter(name => name.endsWith('.html')).sort()
assert.equal(files.length, 17, 'A visual fixture failed to export; do not compare stale captures.')
if (updateCase) assert.ok(files.includes(updateCase + '.html'), 'Unknown baseline case')
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
      const name = file.replace('.html', `-${width}.png`)
      const actual = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' })
      if (update || file === updateCase + '.html') await writeFile(join(baseline, name), actual)
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
