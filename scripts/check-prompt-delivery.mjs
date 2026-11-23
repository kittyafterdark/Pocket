import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url)), output = resolve(root, 'tmp/prompt-delivery')
await mkdir(output, { recursive: true })
const build = spawnSync('bun', ['build', 'tests/fixtures/freeform-browser.ts', '--target=browser', '--format=esm', `--outfile=${output}/preview.js`], { cwd: root, encoding: 'utf8' })
if (build.status !== 0) throw new Error(build.stderr)
const require = createRequire(import.meta.url), paths = [process.env.POCKET_PLAYWRIGHT_ROOT, resolve(root, '../../LumiTest/Lumiverse/scripts/e2e-diagnostics'), process.env.NODE_PATH].filter(Boolean)
const { chromium } = require(require.resolve('playwright', { paths })), script = await readFile(resolve(output, 'preview.js'))
const server = createServer((request, response) => {
  if (request.url.startsWith('/preview.js')) { response.setHeader('Content-Type', 'text/javascript'); response.end(script) }
  else response.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/preview.js"></script>')
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
let browser
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.POCKET_CHROMIUM_EXECUTABLE || undefined })
  for (const width of [390, 900]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: width === 390, hasTouch: width === 390, reducedMotion: 'reduce' })
    const errors = []; page.on('pageerror', error => errors.push(error.message)); page.setDefaultTimeout(12000)
    const press = name => page.getByRole('button', { name, exact: true })[width === 390 ? 'tap' : 'click']()
    const openContext = async () => {
      await press('Home or dismiss phone'); await press('Open app drawer'); await press('Settings'); await press(/^Context /)
    }
    const save = async label => {
      const offset = await page.evaluate(() => window.freeformFixture.host.sends.length)
      await press(label)
      await page.waitForFunction(offset => window.freeformFixture.host.sends.slice(offset).some(p => p.type === 'lumiphone:action_done'), offset)
    }
    const screenshot = name => page.screenshot({ path: resolve(output, `${name}-${width}.png`) })
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`)
      await press('Open Pocket'); await press('Open app drawer'); await press('Settings'); await press(/^Context /)
      await screenshot('categories')
      await press(/^Sources & scenario /)
      await page.getByRole('button', { name: 'Prefer full character profiles', exact: true }).waitFor()
      await page.getByRole('textbox', { name: /Custom scenario/ }).fill('An evening at the bookshop.')
      await press('Save scenario'); await press('‹ Back')
      await press(/^Roleplay delivery /)
      const role = () => page.getByRole('combobox', { name: 'Message role', exact: true })
      const position = () => page.getByRole('combobox', { name: /^Injection position/ })
      const delivery = () => page.getByRole('combobox', { name: /^Send Pocket memory using/ })
      await role().selectOption('assistant'); await position().selectOption('in_history')
      await page.getByRole('spinbutton', { name: /^Injection depth/ }).fill('2')
      await page.getByRole('spinbutton', { name: /^Injection depth/ }).press('Tab')
      await screenshot('delivery')
      // Refresh/back navigation retains a draft; save persists through a new frontend mount.
      await page.evaluate(() => window.freeformFixture.send({ type: 'lumiphone:get_state', requestId: 'prompt-refresh', chatId: 'host-chat', characterId: 'host-character' }))
      assert.equal(await role().inputValue(), 'assistant')
      await press('‹ Back'); await press(/^Roleplay delivery /)
      assert.equal(await page.getByRole('spinbutton', { name: /^Injection depth/ }).inputValue(), '2')
      await save('Save delivery settings')
      let saved = await page.evaluate(() => window.freeformFixture.host.read('phones/host-chat__host-character.json'))
      assert.deepEqual(saved.promptSettings, { delivery: 'injection', placement: { role: 'assistant', position: 'in_history', depth: 2 } })
      await delivery().selectOption('macros')
      assert.equal(await role().count(), 0)
      await page.getByText('{{pocket_memory}}', { exact: true }).waitFor()
      await save('Save delivery settings')
      await press('Configure tracker delivery')
      await page.getByRole('textbox', { name: /^Live state context prompt/ }).waitFor()
      await page.getByRole('combobox', { name: /^Send tracker context using/ }).selectOption('injection')
      await role().selectOption('user'); await position().selectOption('pre_history')
      await save('Save tracker settings')
      saved = await page.evaluate(() => window.freeformFixture.host.read('phones/host-chat__host-character.json'))
      assert.equal(saved.trackerSettings.placement.role, 'user')
      await press('‹ Back'); await press('‹ Back'); await press(/^Tracker macros /)
      await page.getByText('{{pocket_trackers}}', { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Copy {{pocket_trackers}}', exact: true }).focus()
      assert.equal(await page.getByRole('button', { name: 'Copy {{pocket_trackers}}', exact: true }).evaluate(n => n === document.activeElement), true)
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
      await press('Copy {{pocket_trackers}}')
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '{{pocket_trackers}}')
      await screenshot('macros')
      await press('‹ Back'); await press(/^Prompt review /)
      await page.getByRole('region', { name: 'Pocket memory prompt', exact: true }).waitFor()
      assert.match(await page.getByRole('region', { name: 'Pocket memory prompt', exact: true }).innerText(), /Current Pocket snapshot:/)
      await screenshot('review')
      assert.equal(await page.locator('.lp-page').evaluate(n => n.scrollWidth > n.clientWidth + 2), false)
      // A failed refresh offers a retry; prior data is not presented as a fresh result.
      await page.evaluate(() => {
        const original = window.freeformFixture.host.api.userStorage.getJson
        window.freeformFixture.host.api.userStorage.getJson = async function(path, ...args) {
          if (path === 'phones/host-chat__host-character.json') throw new Error('Fixture review failed')
          return original.call(this, path, ...args)
        }
        window.restorePromptStorage = () => { window.freeformFixture.host.api.userStorage.getJson = original }
      })
      await press('Refresh prompt review')
      await page.getByRole('alert').filter({ hasText: 'Fixture review failed' }).waitFor()
      await page.evaluate(() => window.restorePromptStorage())
      await press('Refresh prompt review'); await page.getByRole('region', { name: 'Pocket memory prompt', exact: true }).waitFor()
      await page.evaluate(() => window.freeformFixture.remount())
      await press('Open Pocket'); await press('Open app drawer'); await press('Settings'); await press(/^Context /); await press(/^Roleplay delivery /)
      assert.equal(await delivery().inputValue(), 'macros')
      await delivery().selectOption('injection')
      assert.equal(await role().inputValue(), 'assistant')
      assert.equal(await page.getByRole('spinbutton', { name: /^Injection depth/ }).inputValue(), '2')
      await save('Save delivery settings')
      assert.deepEqual(errors, [])
      console.log(`Prompt delivery ${width}: categories, sources, roles, depth, drafts, persistence, macro mode, tracker shortcut, review/retry, remount, and overflow passed`)
    } catch (error) { await screenshot('failure'); console.error((await page.locator('body').innerText()).slice(-2500)); throw error }
    finally { await page.close() }
  }
} finally { await browser?.close(); await new Promise(done => server.close(done)) }
