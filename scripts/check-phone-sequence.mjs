import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = join(root, 'tmp/phone-sequence')
await mkdir(output, { recursive: true })
const bundlePath = join(output, 'preview.js')
const build = spawnSync('bun', ['build', 'scripts/preview-phone-sequence.ts', '--target=browser', '--outfile=' + bundlePath], { cwd: root, encoding: 'utf8' })
if (build.status !== 0) throw build.error || new Error(build.stderr + build.stdout)
const bundle = await readFile(bundlePath, 'utf8')
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pocket animated phone insert</title><style>body{margin:0;padding:12px;background:#091b2d;color:#eee;font:14px/1.5 system-ui}main{max-width:560px;margin:0 auto}.pocket-inline-anchor{display:block;margin:12px 0}.pocket-inline-anchor[hidden]{display:none}</style><main></main><script type="module">${bundle.replaceAll('</script', '<\\/script')}</script></html>`
await writeFile(join(output, 'preview.html'), html)
const server = createServer((_, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html) })
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const require = createRequire(import.meta.url)
const { chromium } = require(require.resolve('playwright', { paths: [process.env.POCKET_PLAYWRIGHT_ROOT].filter(Boolean) }))
let browser
try {
  browser = await chromium.launch({ headless: true })
  for (const width of [390, 900]) {
    const page = await browser.newPage({ viewport: { width, height: 930 }, reducedMotion: 'no-preference' })
    await page.goto(`http://127.0.0.1:${server.address().port}/`)
    assert.equal(await page.locator('.pocket-phone-device').count(), 1)
    const notifications = page.locator('.pocket-phone-notification')
    assert.equal(await notifications.count(), 2)
    // Seek the actual browser animations, rather than relying on screenshot timing.
    await notifications.evaluateAll(nodes => nodes.forEach(node => { for (const animation of node.getAnimations()) { animation.pause(); animation.currentTime = 400 } }))
    assert.equal(await notifications.nth(0).evaluate(node => getComputedStyle(node).opacity), '1')
    assert.equal(await notifications.nth(1).evaluate(node => getComputedStyle(node).visibility), 'hidden')
    await page.getByRole('button', { name: 'Show all phone messages' }).click()
    assert.equal(await notifications.nth(1).evaluate(node => getComputedStyle(node).opacity), '1')
    await notifications.nth(1).click()
    assert.equal(await page.locator('body').getAttribute('data-opened-message'), 'second')
    await page.screenshot({ path: join(output, `phone-sequence-${width}.png`) })
    assert.ok(await page.locator('.pocket-phone-device').evaluate(node => { const b = node.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth }), 'Phone must fit in the chat viewport')
    assert.ok(await page.getByRole('button', { name: 'Replay phone messages' }).evaluate(node => { const b = node.getBoundingClientRect(); const p = node.closest('.pocket-phone-device').getBoundingClientRect(); return b.top >= p.top && b.bottom <= p.bottom }), 'Replay must fit inside the phone')
    await page.getByRole('button', { name: 'Replay phone messages' }).click()
    assert.equal(await notifications.nth(1).evaluate(node => getComputedStyle(node).visibility), 'hidden')
    await page.waitForFunction(() => { const root = document.querySelector('pocket-inline-ui').shadowRoot; return getComputedStyle(root.querySelectorAll('.pocket-phone-notification')[1]).opacity === '1' })
    // A hostile host theme must not alter the rendered insert.
    const before = await page.screenshot({ animations: 'disabled' })
    await page.addStyleTag({ content: 'button,span,strong,pocket-inline-ui *{font-size:80px!important;background:red!important;transform:rotate(15deg)!important}' })
    assert.ok(before.equals(await page.screenshot({ animations: 'disabled' })), 'Host CSS must remain outside the shadow root')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Replay phone messages' }).click()
    assert.equal(await notifications.nth(1).evaluate(node => getComputedStyle(node).visibility), 'visible')
    assert.equal(await notifications.nth(1).evaluate(node => node.getAnimations().length), 0)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`http://127.0.0.1:${server.address().port}/?reduce`)
    assert.equal(await page.locator('.pocket-phone-step').nth(1).evaluate(node => node.getAnimations().length), 0)
    await page.goto(`http://127.0.0.1:${server.address().port}/?sent`)
    assert.equal(await page.locator('.pocket-phone-device').count(), 1)
    assert.equal(await page.locator('.pocket-phone-message').count(), 2)
    assert.equal(await page.locator('.pocket-phone-delivery').count(), 1)
    assert.ok(await page.locator('.pocket-phone-thread').evaluate(thread => thread.lastElementChild.classList.contains('pocket-phone-delivery')), 'Delivered must follow every outgoing bubble')
    await page.getByRole('button', { name: 'Show all phone messages' }).click()
    const bubbles = page.locator('.pocket-phone-message')
    assert.equal(await bubbles.nth(1).evaluate(node => getComputedStyle(node).opacity), '1')
    assert.ok(await page.locator('.pocket-phone-delivery').evaluate(label => label.getBoundingClientRect().top >= label.previousElementSibling.getBoundingClientRect().bottom), 'Delivery label must appear below the last bubble')
    await page.screenshot({ path: join(output, `phone-sequence-sent-${width}.png`) })
    await page.close()
  }
  console.log('Animated phone inserts passed at mobile and desktop widths: incoming/outgoing sequence, delivery placement, replay, navigation, host isolation, and both reduced-motion settings.')
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)) }
