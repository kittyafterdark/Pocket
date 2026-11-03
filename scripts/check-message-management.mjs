import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url)), output = resolve(root, 'tmp/message-management')
await mkdir(output, { recursive: true })
const build = spawnSync('bun', ['build', 'tests/fixtures/launcher-browser.ts', '--target=browser', '--format=iife', `--outfile=${output}/preview.js`], { cwd: root, encoding: 'utf8' })
if (build.status !== 0) throw build.error || new Error(build.stderr)
const require = createRequire(import.meta.url), paths = [process.env.POCKET_PLAYWRIGHT_ROOT, resolve(root, '../../LumiTest/Lumiverse/scripts/e2e-diagnostics'), process.env.NODE_PATH].filter(Boolean)
const { chromium } = require(require.resolve('playwright', { paths })), script = await readFile(resolve(output, 'preview.js'))
const server = createServer((request, response) => {
  if (request.url.startsWith('/preview.js')) { response.setHeader('Content-Type', 'text/javascript'); response.end(script) }
  else if (request.url.startsWith('/photo.svg')) { response.setHeader('Content-Type', 'image/svg+xml'); response.end('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#b89ce3"/></svg>') }
  else response.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/preview.js" defer></script>')
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
let browser, activePage
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.POCKET_CHROMIUM_EXECUTABLE || undefined })
  for (const width of [390, 900]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: width === 390, hasTouch: width === 390 }); activePage = page
    const errors = []; page.on('pageerror', error => errors.push(error.message)); page.setDefaultTimeout(10000)
    await page.goto(`http://127.0.0.1:${server.address().port}/?messageManagement`)
    await page.getByRole('button', { name: 'Open Pocket', exact: true }).waitFor()
    await page.evaluate(() => { window.deliverSocialOperationFixture({ type: 'lumiphone:capabilities', capabilities: { panels: true, generation: true } }); window.seedMessageManagementFixture() })
    const press = async name => { const control = page.getByRole('button', { name, exact: true }); return width === 390 ? control.tap() : control.click() }
    const openApp = async name => { await press('Home or dismiss phone'); await press('Open app drawer'); await press(name) }
    await press('Open Pocket'); await press('Open app drawer'); await press('Messages')
    await page.locator('.lp-conversation-row').filter({ hasText: 'Alex' }).click()
    await page.getByText('Reply hit the output limit', { exact: true }).waitFor()
    await page.screenshot({ path: resolve(output, `reply-failure-${width}.png`) })
    await press('Retry reply')
    await page.locator('.lp-bubble').filter({ hasText: 'A complete reply after retry.' }).waitFor()
    assert.equal(await page.getByText('Reply hit the output limit', { exact: true }).count(), 0)
    await press('‹ Back')
    assert.equal(await page.getByRole('button', { name: 'Select chats', exact: true }).isVisible(), false, 'Normal inbox does not show a selection toolbar')
    const menu = page.getByLabel('Messages actions', { exact: true })
    await menu.focus(); await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'New chat', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    assert.ok(await menu.evaluate(node => document.activeElement === node), 'Escape restores header focus')
    await page.screenshot({ path: resolve(output, `inbox-${width}.png`) })
    await menu.click()
    await page.screenshot({ path: resolve(output, `inbox-menu-${width}.png`) })
    const menuBox = await page.locator('.lp-inbox-actions .lp-conversation-menu-sheet').boundingBox()
    assert.ok(menuBox && menuBox.x >= 0 && menuBox.x + menuBox.width <= width, 'Menu stays inside the viewport')
    await page.locator('.lp-nav-title').click()
    assert.equal(await page.getByRole('button', { name: 'New chat', exact: true }).isVisible(), false, 'Outside click closes the menu')
    await menu.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter')
    await page.getByRole('searchbox', { name: 'Search recipients', exact: true }).waitFor()
    await press('‹ Back')
    await page.getByLabel('Messages actions', { exact: true }).click(); await press('Select chats'); await press('Select all')
    assert.equal(await page.getByRole('checkbox', { checked: true }).count(), 3)
    await press('Cancel'); await page.getByLabel('Messages actions', { exact: true }).click(); await press('Select chats')
    await page.getByRole('checkbox', { name: 'Select Old class group', exact: true }).focus(); await page.keyboard.press('Space')
    await page.getByRole('checkbox', { name: 'Select Fern', exact: true }).check()
    await press('Delete selected (2)')
    const confirmation = page.getByRole('dialog', { name: 'Delete conversations?', exact: true })
    await confirmation.getByText('Old class group', { exact: true }).waitFor()
    await page.screenshot({ path: resolve(output, `delete-confirmation-${width}.png`) })
    await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click()
    assert.equal((await page.evaluate(() => window.messageManagementSnapshot())).state.conversations.length, 3)
    await press('Delete selected (2)')
    await page.getByRole('dialog', { name: 'Delete conversations?', exact: true }).getByRole('button', { name: 'Delete 2 conversations', exact: true }).click()
    await page.getByLabel('Messages actions', { exact: true }).waitFor()
    const snapshot = await page.evaluate(() => window.messageManagementSnapshot())
    assert.equal(snapshot.state.conversations.length, 1); assert.equal(snapshot.state.contacts.length, 2)
    assert.equal(await page.locator('.lp-conversation-row').count(), 1)
    await page.locator('.lp-conversation-row').click(); await page.getByLabel('Conversation menu', { exact: true }).click(); await press('Delete conversation')
    await page.getByRole('dialog', { name: 'Delete conversations?', exact: true }).getByRole('button', { name: 'Cancel', exact: true }).click()
    await openApp('Settings'); await page.getByRole('button', { name: /^Pocket Generation/ }).click()
    const limit = page.getByRole('spinbutton', { name: 'Output token limit', exact: true })
    await limit.fill('16000'); await limit.press('Tab')
    await page.waitForFunction(() => window.messageManagementSnapshot().preferences.generationConnectionMaxTokens?.['fixture-model'] === 16000)
    await page.screenshot({ path: resolve(output, `connection-limit-${width}.png`) })
    await openApp('Settings'); await page.getByRole('button', { name: /^Pocket Generation/ }).click()
    assert.equal(await page.getByRole('spinbutton', { name: 'Output token limit', exact: true }).inputValue(), '16000')
    await page.evaluate(() => window.remountContactsMediaFixture())
    await page.getByRole('button', { name: 'Open Pocket', exact: true }).waitFor(); await press('Open Pocket'); await press('Open app drawer'); await press('Messages')
    assert.equal(await page.locator('.lp-conversation-row').count(), 1, 'Deleted chats remain absent after controller remount')
    assert.equal(errors.length, 0, errors.join('\n'))
    console.log(`Reply failure/retry, selection, deletion confirmation, per-connection limit and remount passed at ${width}px`)
    await page.close()
  }
} catch (error) {
  if (activePage && !activePage.isClosed()) { await activePage.screenshot({ path: resolve(output, 'failure.png') }); console.error((await activePage.locator('body').innerText()).slice(0, 4000)) }
  throw error
} finally { await browser?.close(); await new Promise(done => server.close(done)) }
