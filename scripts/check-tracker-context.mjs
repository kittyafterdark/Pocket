import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url)), output = resolve(root, 'tmp/tracker-context')
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
    const settings = async () => { await press('Tracker actions'); await page.getByRole('menuitem', { name: 'Settings', exact: true }).click() }
    const saveSettings = async () => {
      const offset = await page.evaluate(() => window.freeformFixture.host.sends.length)
      await press('Save tracker settings')
      await page.waitForFunction(offset => window.freeformFixture.host.sends.slice(offset).some(p => p.type === 'lumiphone:action_done'), offset)
    }
    const prompt = () => page.getByRole('textbox', { name: 'Live state context prompt', exact: false })
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`)
      await press('Open Pocket'); await press('Open app drawer'); await press('Trackers')
      await page.evaluate(async () => {
        const send = payload => window.freeformFixture.send({ type: 'lumiphone:action', requestId: payload.key, chatId: 'host-chat', characterId: 'host-character', action: 'tracker', payload })
        await send({ id: 'fixture-trust', key: 'trust', label: 'Trust', kind: 'meter', value: 42, min: 0, max: 100, updateMode: 'model', allowModelWrite: true, modelPrompt: 'Reward promises kept.', target: { type: 'custom', label: 'Alex → Mika' } })
        await send({ id: 'fixture-secret', key: 'secret', label: 'Hidden score', kind: 'meter', value: 9, min: 0, max: 100, visibleToModel: false })
      })
      await page.evaluate(() => window.freeformFixture.send({ type: 'lumiphone:get_state', requestId: 'tracker-initial', chatId: 'host-chat', characterId: 'host-character' }))
      await page.waitForTimeout(200)
      const anchor = page.getByRole('button', { name: 'Tracker actions', exact: true })
      await anchor.focus(); await page.keyboard.press('Enter')
      assert.equal(await page.getByRole('menuitem', { name: 'Add new tracker' }).evaluate(n => n === document.activeElement), true)
      await page.keyboard.press('End')
      assert.equal(await page.getByRole('menuitem', { name: 'Settings', exact: true }).evaluate(n => n === document.activeElement), true)
      await page.keyboard.press('Escape'); assert.equal(await page.getByRole('menu').count(), 0)
      assert.equal(await anchor.evaluate(n => n === document.activeElement), true)
      await press('Tracker actions'); await page.getByRole('menuitem', { name: 'Add new tracker' }).click()
      await page.getByRole('button', { name: /Custom.*Value, quantity/ }).click()
      await page.getByText('A value', { exact: true }).waitFor(); await press('‹ Back'); await press('‹ Back')
      await settings()
      assert.match(await page.getByLabel('Live tracker context preview', { exact: true }).innerText(), /"value":42/)
      assert.doesNotMatch(await page.getByLabel('Live tracker context preview', { exact: true }).innerText(), /Hidden score/)
      await prompt().fill('Only change trust for established story events.')
      await page.getByRole('combobox', { name: /Send tracker context using/ }).selectOption('macros')
      await page.getByText('{{pocket_trackers}}', { exact: true }).waitFor()
      await page.getByText('{{pocket_tracker::trust}}', { exact: true }).waitFor()
      assert.equal(await page.getByText('{{pocket_tracker::secret}}', { exact: true }).count(), 0)
      await page.screenshot({ path: resolve(output, `settings-${width}.png`) })
      await saveSettings()
      const saved = await page.evaluate(() => window.freeformFixture.host.read('phones/host-chat__host-character.json'))
      assert.deepEqual(saved.trackerSettings, { delivery: 'macros', prompt: 'Only change trust for established story events.' })
      // Live backend refresh retains an unsaved settings draft.
      await prompt().fill('Unsaved draft survives refresh.')
      await page.evaluate(() => window.freeformFixture.send({ type: 'lumiphone:get_state', requestId: 'tracker-refresh', chatId: 'host-chat', characterId: 'host-character' }))
      assert.equal(await prompt().inputValue(), 'Unsaved draft survives refresh.')
      await press('‹ Back'); await settings(); assert.equal(await prompt().inputValue(), 'Unsaved draft survives refresh.')
      await page.evaluate(() => window.freeformFixture.remount())
      await press('Open Pocket'); await press('Open app drawer'); await press('Trackers'); await settings()
      assert.equal(await prompt().inputValue(), 'Only change trust for established story events.')
      assert.equal(await page.getByRole('combobox', { name: /Send tracker context using/ }).inputValue(), 'macros')
      await press('Restore default prompt')
      await page.getByRole('combobox', { name: /Send tracker context using/ }).selectOption('injection')
      assert.equal(await page.getByText('{{pocket_trackers}}', { exact: true }).isVisible(), false)
      await saveSettings()
      await press('‹ Back'); await press('Tracker actions')
      const menu = await page.getByRole('menu').boundingBox()
      if (width === 390) assert.ok(menu.y >= 47, 'Menu respects shell safe-top ownership')
      await page.screenshot({ path: resolve(output, `menu-${width}.png`) })
      await page.keyboard.press('Escape')
      await press('Tracker actions'); await page.getByRole('menuitem', { name: 'Settings', exact: true }).click()
      // Tab order reaches the native select and text field; the preview scrolls independently.
      await page.waitForFunction(() => [...document.querySelectorAll('select')].some(n => !n.disabled && n.closest('.lp-page')))
      await page.getByRole('combobox', { name: /Send tracker context using/ }).press('Tab')
      assert.equal(await prompt().evaluate(n => n === document.activeElement), true)
      await page.evaluate(() => window.freeformFixture.send({ type: 'lumiphone:action', requestId: 'preview-value', chatId: 'host-chat', characterId: 'host-character', action: 'tracker', payload: { trackerId: 'fixture-trust', operation: 'set', amount: 57 } }))
      assert.match(await page.getByLabel('Live tracker context preview', { exact: true }).innerText(), /"value":57/)
      assert.equal(await page.locator('.lp-page').evaluate(n => n.scrollWidth > n.clientWidth + 2), false)
      await press('‹ Back'); await press('Tracker actions')
      await page.evaluate(() => window.freeformFixture.remount())
      assert.equal(await page.getByRole('menu').count(), 0, 'Unmount cleans up an open menu')
      assert.deepEqual(errors, [])
      console.log(`Tracker context ${width}: menu, keyboard, add flow, save, draft refresh, back/reopen, remount, and safe top passed`)
    } catch (error) { await page.screenshot({ path: resolve(output, `failure-${width}.png`) }); throw error }
    finally { await page.close() }
  }
} finally { await browser?.close(); await new Promise(done => server.close(done)) }
