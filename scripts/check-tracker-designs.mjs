import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url)), output = resolve(root, 'tmp/tracker-designs')
await mkdir(output, { recursive: true })
const build = spawnSync('bun', ['build', 'tests/fixtures/tracker-design-browser.ts', '--target=browser', '--format=esm', `--outfile=${output}/preview.js`], { cwd: root, encoding: 'utf8' })
if (build.status !== 0) throw Error(build.stderr)
const require = createRequire(import.meta.url), paths = [process.env.POCKET_PLAYWRIGHT_ROOT, resolve(root, '../../LumiTest/Lumiverse/scripts/e2e-diagnostics'), process.env.NODE_PATH].filter(Boolean)
const { chromium } = require(require.resolve('playwright', { paths })), script = await readFile(resolve(output, 'preview.js'))
const server = createServer((request, response) => {
  if (request.url.startsWith('/preview.js')) { response.setHeader('Content-Type', 'text/javascript'); response.end(script) }
  else response.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/preview.js"></script>')
})
await new Promise(done => server.listen(0, '127.0.0.1', done)); let browser
const groups = [
  ['arc', ['arc', 'barcode', 'capsule', 'caliper']], ['odometer', ['odometer', 'led', 'crates', 'tally']],
  ['waypoint', ['waypoint', 'gates', 'rotary', 'ribbons']], ['terminal', ['terminal', 'vellum', 'hud', 'report']],
  ['timer', ['timer', 'watch', 'radar', 'hourglass']],
]
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.POCKET_CHROMIUM_EXECUTABLE || undefined })
  for (const width of [390, 900]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: width === 390, hasTouch: width === 390, reducedMotion: 'reduce' })
    const errors = []; page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(12000)
    const press = name => page.getByRole('button', { name, exact: true })[width === 390 ? 'tap' : 'click']()
    const card = id => page.locator(`[data-tracker-id="${id}"]`)
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`)
      await press('Open Pocket'); await page.evaluate(() => window.trackerDesignFixture.seed())
      await press('Open app drawer'); await press('Trackers')
      await press('Tracker actions'); await page.getByRole('menuitem', { name: 'Add new tracker', exact: true }).click()
      assert.equal(await page.locator('.lp-template-card strong').first().innerText(), 'Custom')
      await page.screenshot({ path: resolve(output, `picker-${width}.png`) })
      await page.getByRole('button', { name: /Custom.*Value, quantity/ }).click()
      assert.deepEqual(await page.locator('.lp-template-card strong').allTextContents(), ['A value', 'A quantity', 'A state', 'A field', 'A timer'])
      await page.screenshot({ path: resolve(output, `custom-picker-${width}.png`) })
      await page.getByRole('button', { name: /A field/ }).focus(); await page.keyboard.press('Enter')
      const fieldDisplay = page.getByRole('combobox', { name: 'Display', exact: true })
      await fieldDisplay.selectOption('state'); assert.equal(await page.locator('.lp-tracker-preview .lp-tracker-card').getAttribute('data-design'), 'plain')
      assert.equal(await page.locator('.lp-tracker-preview .lp-field-screen-terminal').count(), 0)
      await fieldDisplay.selectOption('terminal'); assert.equal(await page.locator('.lp-tracker-preview .lp-field-screen-terminal').count(), 1)
      await press('‹ Back'); await press('‹ Back'); await press('‹ Back')
      for (const id of ['delete-one', 'delete-two']) await page.evaluate(id => window.freeformFixture.send({ type: 'lumiphone:action', requestId: `seed-${id}`, chatId: 'host-chat', characterId: 'host-character', action: 'tracker', payload: { id, key: id, label: id, kind: 'meter', value: 1, min: 0, max: 100 } }), id)
      for (const id of ['delete-one', 'delete-two']) {
        await card(id).click(); await press('Tracker settings'); await press('Delete tracker')
        await page.getByRole('button', { name: 'Tracker actions', exact: true }).waitFor()
        await page.waitForFunction(id => !window.freeformFixture.host.read('phones/host-chat__host-character.json').trackers.some(t => t.id === id), id)
      }
      for (const [first, choices] of groups) {
        await card(`custom-${first}`).click(); await press('Tracker settings')
        const display = page.getByRole('combobox', { name: 'Display', exact: true })
        for (const choice of choices) {
          await display.selectOption(choice)
          assert.equal(await page.locator('.lp-tracker-preview .lp-tracker-card').getAttribute('data-design'), choice)
          assert.equal(await page.locator('.lp-tracker-preview').evaluate(n => n.scrollWidth > n.clientWidth + 2), false)
          if (choice === 'report') await page.screenshot({ path: resolve(output, `editor-field-${width}.png`) })
        }
        await press('Save'); await page.getByRole('button', { name: 'Tracker settings', exact: true }).waitFor()
        await press('‹ Back')
      }
      const condition = page.locator('.lp-tracker-card').filter({ has: page.getByRole('heading', { name: 'Physical Condition', exact: true }) })
      await condition.click(); await press('Tracker settings')
      await page.getByRole('textbox', { name: 'Blood pressure', exact: true }).fill('122 / 80 mmHg')
      await page.getByRole('textbox', { name: 'Musculoskeletal / motor', exact: true }).fill('Shoulder healing')
      await page.getByRole('combobox', { name: /^Updates/ }).selectOption('model')
      await press('Save'); await page.getByRole('button', { name: 'Tracker settings', exact: true }).waitFor()
      await page.getByText('Shoulder healing', { exact: true }).waitFor()
      await page.screenshot({ path: resolve(output, `clinical-${width}.png`) })
      await press('‹ Back')
      const faction = page.locator('.lp-tracker-card').filter({ has: page.getByRole('heading', { name: 'Faction Alignment', exact: true }) })
      await faction.click(); await press('Tracker settings')
      await page.getByRole('textbox', { name: 'Low-end faction', exact: true }).fill('Harbour guild')
      await page.getByRole('textbox', { name: 'High-end faction', exact: true }).fill('Solar council')
      await press('Save'); await page.getByRole('button', { name: 'Tracker settings', exact: true }).waitFor()
      await page.getByText('Harbour guild', { exact: true }).waitFor(); await press('‹ Back')
      await page.evaluate(() => window.freeformFixture.remount())
      await press('Open Pocket'); await press('Open app drawer'); await press('Trackers')
      for (const [first, choices] of groups) assert.equal(await card(`custom-${first}`).getAttribute('data-design'), choices.at(-1))
      const stored = await page.evaluate(() => window.freeformFixture.host.read('phones/host-chat__host-character.json'))
      const physical = stored.trackers.find(t => t.presentation === 'condition')
      assert.equal(physical.clinical.motor, 'Shoulder healing'); assert.equal(physical.clinical.bloodPressure, '122 / 80 mmHg')
      const rawResult = await page.evaluate(async key => await window.freeformFixture.host.emit('TOOL_INVOCATION', { toolName: 'phone_action', requestId: 'clinical-story', args: { chat_id: 'host-chat', character_id: 'host-character', action: 'tracker', payload: { key, operation: 'set_state', clinical: { airway: 'Clear' }, reason: 'Established in the story' } } }, 'fixture'), physical.key)
      assert.ok(rawResult.startsWith('{'), rawResult)
      const result = JSON.parse(rawResult)
      assert.equal(result.error, undefined)
      const updated = await page.evaluate(() => window.freeformFixture.host.read('phones/host-chat__host-character.json'))
      assert.equal(updated.trackers.find(t => t.key === physical.key).clinical.airway, 'Clear')
      await page.evaluate(() => window.freeformFixture.send({ type: 'lumiphone:save_preferences', requestId: 'tracker-scale', chatId: 'host-chat', characterId: 'host-character', preferences: { uiScale: 1.3 } }))
      assert.deepEqual(await page.locator('.lp-tracker-card[data-design]').evaluateAll(nodes => nodes.filter(n => n.scrollWidth > n.clientWidth + 2).map(n => n.dataset.design)), [])
      if (width === 390) assert.ok((await page.getByRole('button', { name: 'Tracker actions', exact: true }).boundingBox()).y >= 47)
      await page.evaluate(() => window.trackerDesignFixture.gallery())
      assert.equal(await page.locator('.tracker-design-gallery .lp-tracker-card').count(), 31)
      assert.deepEqual(await page.locator('.tracker-design-gallery .lp-tracker-card').evaluateAll(nodes => nodes.filter(n => n.scrollWidth > n.clientWidth + 2).map(n => n.dataset.design)), [])
      await page.screenshot({ path: resolve(output, `gallery-${width}.png`), fullPage: true })
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      assert.equal(await page.locator('.tracker-design-gallery .lp-design-hourglass .lp-hourglass-particle').evaluate(n => getComputedStyle(n).animationName), 'lp-particle-trickle')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      assert.equal(await page.locator('.tracker-design-gallery .lp-design-hourglass .lp-hourglass-particle').evaluate(n => getComputedStyle(n).animationName), 'none')
      const ids = await page.locator('.tracker-design-gallery [id]').evaluateAll(nodes => nodes.map(n => n.id))
      assert.equal(new Set(ids).size, ids.length)
      await page.evaluate(() => window.trackerDesignFixture.boundaryGallery())
      assert.deepEqual(await page.locator('.tracker-design-gallery .lp-tracker-card').evaluateAll(nodes => nodes.filter(n => n.scrollWidth > n.clientWidth + 2).map(n => n.dataset.design)), [])
      assert.equal(await page.locator('.tracker-design-gallery .lp-design-hourglass .lp-hourglass-particle').evaluate(n => getComputedStyle(n).animationName), 'none')
      await page.screenshot({ path: resolve(output, `boundaries-${width}.png`), fullPage: true })
      assert.deepEqual(errors, [])
      console.log(`Tracker designs ${width}: all 20 editor selections, saved layouts, clinical story updates, faction labels, remount, scale and safe top passed`)
    } catch (error) { await page.screenshot({ path: resolve(output, `failure-${width}.png`) }); throw error }
    finally { await page.close() }
  }
} finally { await browser?.close(); await new Promise(done => server.close(done)) }
