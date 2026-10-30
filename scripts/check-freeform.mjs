import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url)), output = resolve(root, 'tmp/freeform')
await mkdir(output, { recursive: true })
const build = spawnSync('bun', ['build', 'tests/fixtures/freeform-browser.ts', '--target=browser', '--format=esm', `--outfile=${output}/preview.js`], { cwd: root, encoding: 'utf8' })
if (build.status !== 0) throw build.error || new Error(build.stderr)
const require = createRequire(import.meta.url)
const paths = [process.env.POCKET_PLAYWRIGHT_ROOT, resolve(root, '../../LumiTest/Lumiverse/scripts/e2e-diagnostics'), process.env.NODE_PATH].filter(Boolean)
const { chromium } = require(require.resolve('playwright', { paths }))
const script = await readFile(resolve(output, 'preview.js'))
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
    const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error(error.stack) }); page.setDefaultTimeout(10000)
    const press = name => page.getByRole('button', { name, exact: true })[width === 390 ? 'tap' : 'click']()
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    await page.getByRole('button', { name: 'Open Freeform', exact: true }).waitFor()
    await page.screenshot({ path: resolve(output, `sidebar-${width}.png`) })
    await press('Open Roleplay')
    await page.getByRole('heading', { name: 'Pocket devices' }).waitFor()
    const footer = page.getByRole('button', { name: 'Manage access', exact: true })
    assert.ok((await footer.boundingBox()).height >= 44)
    await press('All spaces'); await press('Open Freeform')
    await page.getByRole('combobox', { name: 'Choose persona' }).selectOption('persona-fern')
    await page.getByRole('textbox', { name: 'Session name' }).fill('Midnight library')
    await page.screenshot({ path: resolve(output, `lock-${width}.png`) })
    await press('Create session')
    try { await page.getByRole('button', { name: 'Settings', exact: true }).waitFor() } catch (error) {
      await page.screenshot({ path: resolve(output, `failure-${width}.png`) })
      console.error(await page.evaluate(() => ({ text: document.body.innerText, sends: window.freeformFixture.host.sends.slice(-5) })))
      throw error
    }
    const first = await page.locator('.lumiphone-shell').getAttribute('data-pocket-chat-id')
    assert.ok(first.startsWith('_freeform_'))
    await press('Timeline')
    await page.getByText(/^Session clock ·/).click()
    assert.equal(await page.getByLabel('Session time', { exact: true }).count(), 1)
    assert.equal(await page.getByRole('button', { name: 'Review recent story', exact: true }).count(), 0)
    await press('Home or dismiss phone')
    await press('Open app drawer'); await press('App Store')
    assert.ok(await page.locator('.lp-store-soon').evaluate(node => node.nextElementSibling === document.querySelector('.lp-store-rail-everyday')?.closest('section')), 'Socials comes immediately before Everyday favorites')
    await page.locator('.lp-store-soon').scrollIntoViewIfNeeded()
    await page.screenshot({ path: resolve(output, `store-socials-${width}.png`) })
    await press('Home or dismiss phone')
    await page.evaluate(() => { window.freeformFixture.switchPersona('persona-mika'); window.freeformFixture.switchChat('another-chat') })
    assert.equal(await page.locator('.lumiphone-shell').getAttribute('data-pocket-chat-id'), first)
    await page.evaluate(async sessionId => {
      await window.freeformFixture.send({ type: 'lumiphone:import_contact', requestId: 'copy-contact', chatId: sessionId, characterId: '_none', kind: 'character', sourceId: 'host-character' })
      const state = window.freeformFixture.host.sends.findLast(p => p.type === 'lumiphone:state' && p.state.chatId === sessionId).state
      await window.freeformFixture.send({ type: 'lumiphone:action', requestId: 'copy-message', chatId: sessionId, characterId: '_none', action: 'message', payload: { conversationId: state.conversations[0].id, text: 'Before linking' } })
    }, first)
    await press('Home or dismiss phone')
    await press('Settings'); await press(/^Freeform session/)
    await page.locator('.lumiphone-shell').getByRole('textbox', { name: 'Session name' }).fill('Library after dark'); await press('Save session name')
    await press('Start a chat from this session')
    const dialog = page.getByRole('dialog', { name: 'Start a chat from Freeform' })
    await dialog.waitFor(); assert.equal(await page.getByRole('button', { name: 'Keep base Pocket', exact: true }).evaluate(node => node === document.activeElement), true)
    await page.screenshot({ path: resolve(output, `confirm-${width}.png`) })
    await press('Keep base Pocket')
    assert.equal(await page.evaluate(() => window.freeformFixture.host.sends.some(p => p.type === 'lumiphone:freeform_copied')), false)
    await press('Start a chat from this session'); await press('Override with this Freeform session')
    await page.waitForFunction(() => window.freeformFixture.host.sends.some(p => p.type === 'lumiphone:freeform_copied'))
    await page.waitForFunction(() => document.querySelector('.lumiphone-shell')?.getAttribute('data-pocket-chat-id') === 'another-chat')
    await press('Messages'); await page.getByRole('button', { name: /Alex.*Before linking/ }).click()
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill('After linking, chat only')
    await page.getByRole('textbox', { name: 'Message', exact: true }).press('Enter')
    await page.waitForFunction(() => window.freeformFixture.host.read('phones/another-chat__host-character.json').conversations.some(c => c.messages.some(m => m.text === 'After linking, chat only')))
    const originalMessages = await page.evaluate(sessionId => window.freeformFixture.host.read(`phones/${sessionId}___none.json`).conversations.flatMap(c => c.messages.map(m => m.text)), first)
    assert.deepEqual(originalMessages, ['Before linking'], 'Post-copy phone input must leave the original Freeform history unchanged')
    await press('Dismiss phone'); await press('All spaces'); await press('Open Freeform')
    await page.getByRole('combobox', { name: 'Choose persona' }).selectOption('persona-fern')
    await page.getByRole('combobox', { name: 'Log in to session' }).selectOption(first); await press('Log in to session')
    await press('Settings'); await press(/^Freeform session/)
    await press('Lock & switch session')
    await page.getByRole('combobox', { name: 'Log in to session' }).selectOption(first)
    await page.getByRole('textbox', { name: 'Session name' }).fill('Second world'); await press('Create session')
    await page.getByRole('button', { name: 'Settings', exact: true }).waitFor()
    const second = await page.locator('.lumiphone-shell').getAttribute('data-pocket-chat-id'); assert.notEqual(first, second)
    await press('Settings'); await press(/^Freeform session/); await press('Lock & switch session')
    const sessions = page.getByRole('combobox', { name: 'Log in to session' })
    await sessions.selectOption(first)
    await page.getByRole('button', { name: 'Log in to session', exact: true }).focus(); await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Settings', exact: true }).waitFor()
    assert.equal(await page.locator('.lumiphone-shell').getAttribute('data-pocket-chat-id'), first)
    // A host state arriving late cannot replace the active session.
    await page.evaluate(() => window.freeformFixture.send({ type: 'lumiphone:get_state', requestId: 'late-host', chatId: 'another-chat', characterId: 'host-character' }))
    assert.equal(await page.locator('.lumiphone-shell').getAttribute('data-pocket-chat-id'), first)
    if (width === 390) {
      const top = await page.getByRole('button', { name: 'Dismiss phone', exact: true }).boundingBox()
      assert.ok(top.y >= 47, `Close control respects safe top: ${top.y}`)
    }
    await page.evaluate(() => window.freeformFixture.remount())
    await press('Open Freeform'); await page.getByRole('combobox', { name: 'Choose persona' }).selectOption('persona-fern')
    assert.equal(await page.getByRole('combobox', { name: 'Log in to session' }).getByRole('option', { name: 'Library after dark', exact: true }).count(), 1)
    await page.getByRole('combobox', { name: 'Log in to session' }).selectOption(first); await press('Log in to session')
    await page.getByRole('button', { name: 'Settings', exact: true }).waitFor()
    await page.reload(); await press('Open Freeform'); await page.getByRole('combobox', { name: 'Choose persona' }).selectOption('persona-fern')
    assert.equal(await page.getByRole('combobox', { name: 'Log in to session' }).getByRole('option', { name: 'Library after dark', exact: true }).count(), 1)
    const layout = await page.locator('.pocket-portal').evaluate(node => ({ overflow: node.scrollWidth > node.clientWidth + 1, top: node.getBoundingClientRect().top }))
    assert.ok(!layout.overflow); assert.ok(layout.top >= 47)
    assert.deepEqual(errors, [])
    console.log(`Freeform ${width}: session navigation, automatic bound-chat switch, post-link message isolation, store order, safe top, keyboard login, remount and reload passed`)
    await page.close()
  }
} finally { await browser?.close(); await new Promise(done => server.close(done)) }
