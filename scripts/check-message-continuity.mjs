import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url)), output = resolve(root, 'tmp/message-continuity')
await mkdir(output, { recursive: true })
const baseline = process.env.POCKET_MESSAGE_BASELINE === '1', bundle = resolve(output, baseline ? 'baseline.js' : 'preview.js')
if (!baseline) {
  const build = spawnSync('bun', ['build', 'tests/fixtures/launcher-browser.ts', '--target=browser', '--format=iife', `--outfile=${bundle}`], { cwd: root, encoding: 'utf8' })
  if (build.status !== 0) throw build.error || new Error(build.stderr)
}
const require = createRequire(import.meta.url), paths = [process.env.POCKET_PLAYWRIGHT_ROOT, resolve(root, '../../LumiTest/Lumiverse/scripts/e2e-diagnostics'), process.env.NODE_PATH].filter(Boolean)
const { chromium } = require(require.resolve('playwright', { paths })), script = await readFile(bundle)
const server = createServer((request, response) => {
  if (request.url.startsWith('/preview.js')) { response.setHeader('Content-Type', 'text/javascript'); response.end(script) }
  else response.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/preview.js" defer></script>')
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const findings = [], report = []
let browser, activePage
const check = (condition, message, evidence) => { if (!condition) findings.push({ message, evidence }) }
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.POCKET_CHROMIUM_EXECUTABLE || undefined })
  for (const width of [390, 900]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: width === 390, hasTouch: width === 390, reducedMotion: 'reduce', timezoneId: 'UTC' })
    activePage = page; page.setDefaultTimeout(10000)
    const errors = []; page.on('pageerror', error => errors.push(error.stack))
    await page.goto(`http://127.0.0.1:${server.address().port}/?messageContinuity&messageSlow`)
    await page.waitForFunction(() => typeof window.seedMessageContinuityFixture === 'function')
    await page.evaluate(() => {
      // A scrollable host page exposes accidental ancestor scrolling without real chat data.
      const spacer = document.createElement('div'); spacer.style.height = '1000px'; spacer.setAttribute('aria-hidden', 'true'); document.body.append(spacer)
      window.messageAncestorScrolls = []
      const native = HTMLElement.prototype.scrollIntoView
      HTMLElement.prototype.scrollIntoView = function (options) {
        if (this.closest('.lp-thread')) window.messageAncestorScrolls.push({ messageId: this.dataset.messageId, className: this.className, options })
        return native.call(this, options)
      }
      window.messageSnapshot = () => {
        const thread = document.querySelector('[data-pocket-thread]'), view = document.querySelector('.lumiphone-app-view'), form = document.querySelector('.lp-compose'), button = form?.querySelector('button'), screen = document.querySelector('.lumiphone-screen')
        const box = form?.getBoundingClientRect(), control = button?.getBoundingClientRect()
        return { documentY: window.scrollY, viewScroll: view?.scrollTop || 0, screenScroll: screen?.scrollTop || 0, threadScroll: thread?.scrollTop || 0, threadMax: thread ? Math.max(0, thread.scrollHeight - thread.clientHeight) : 0, nearBottom: thread ? thread.scrollHeight - thread.clientHeight - thread.scrollTop < 72 : false, formY: box?.y, formHeight: box?.height, buttonY: control?.y, buttonHeight: control?.height, nav: (() => { const node = view?.querySelector('.lp-nav'); if (!node) return null; const box = node.getBoundingClientRect(), style = getComputedStyle(node); return { text:node.textContent, y:box.y, height:box.height, scroll:node.scrollTop, color:style.color, visibility:style.visibility, opacity:style.opacity, children:[...node.children].map(child => ({ text:child.textContent, y:child.getBoundingClientRect().y, height:child.getBoundingClientRect().height })) } })(), focus: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName }
      }
      window.startMessageSamples = () => { window.messageSamples = []; window.messageSampling = true; const sample = () => { if (!window.messageSampling) return; requestAnimationFrame(() => setTimeout(() => { if (!window.messageSampling) return; window.messageSamples.push(window.messageSnapshot()); sample() }, 0)) }; sample() }
      window.stopMessageSamples = () => { window.messageSampling = false; return window.messageSamples }
      window.seedMessageContinuityFixture('remote')
    })
    const press = name => width === 390 ? page.getByRole('button', { name, exact: true }).tap() : page.getByRole('button', { name, exact: true }).click()
    const paint = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await press('Open Pocket'); await press('Open app drawer'); await press('Messages')
    await page.locator('.lp-conversation-row').filter({ hasText: 'Dane' }).click()
    await page.locator('[data-pocket-thread="continuity-direct"]').waitFor(); await paint()
    assert.ok(await page.getByRole('separator', { name: /October 29/ }).count(), 'Recorded story days appear as explicit separators')
    await page.locator('[data-pocket-thread]').evaluate(node => { node.scrollTop = 0 })
    assert.ok(await page.getByText('Continued in roleplay', { exact: true }).isVisible(), 'A consumed handoff reads as a completed receipt')
    const receiptHeight = await page.locator('.lp-handoff-activity').first().evaluate(node => node.getBoundingClientRect().height); check(receiptHeight > 35, `${width}px completed handoff receipt remains readable in a long thread`, { receiptHeight })
    await page.locator('.lp-handoff-more > summary').focus(); await page.keyboard.press('Enter')
    assert.ok(await page.getByRole('button', { name: 'Timeline handoff', exact: true }).isVisible(), 'The completed action keeps its Timeline reference')
    await page.locator('.lp-handoff-more > summary').focus(); await page.keyboard.press('Enter')
    await page.locator('[data-pocket-thread]').evaluate(node => { node.scrollTop = node.scrollHeight })
    const input = page.getByRole('textbox', { name: 'Message', exact: true })
    await input.fill('Keep this unsent draft while generating.')
    await paint(); await page.waitForTimeout(90)

    const geometry = (before, samples, label) => {
      const valid = samples.filter(sample => Number.isFinite(sample.buttonY))
      const shift = Math.max(0, ...valid.map(sample => Math.abs(sample.buttonY - before.buttonY)))
      const formShift = Math.max(0, ...valid.map(sample => Math.abs(sample.formY - before.formY)))
      const outerShift = valid.some(sample => Math.abs(sample.documentY - before.documentY) > 1 || Math.abs(sample.viewScroll - before.viewScroll) > 1 || Math.abs(sample.screenScroll - before.screenScroll) > 1)
      check(shift < 2 && formShift < 2 && !outerShift, `${width}px ${label}: generation/Stop/reply preserves composer and outer scroll`, { before, shift, formShift, first:valid[0], last:valid.at(-1), documentYs:[...new Set(valid.map(sample => sample.documentY))], viewScrolls:[...new Set(valid.map(sample => sample.viewScroll))], screenScrolls:[...new Set(valid.map(sample => sample.screenScroll))] })
    }
    const runGeneration = async label => {
      await page.evaluate(() => { window.messageAncestorScrolls = []; window.startMessageSamples() })
      const before = await page.evaluate(() => window.messageSnapshot())
      const force = page.getByRole('button', { name: 'Generate one contact reply', exact: true })
      await force.focus(); await page.keyboard.press('Enter')
      await page.getByRole('button', { name: 'Stop generating reply', exact: true }).waitFor(); await paint()
      const pending = await page.evaluate(() => window.messageSnapshot())
      check(pending.focus === 'Stop generating reply' || pending.focus === 'Message', `${width}px ${label}: keyboard focus remains on a usable reply control`, pending)
      await page.locator('[data-pocket-thread] .lp-bubble').filter({ hasText: /Current-day reply \d+:/ }).last().waitFor()
      await page.getByRole('button', { name: 'Generate one contact reply', exact: true }).waitFor(); await paint(); await page.waitForTimeout(90)
      const samples = await page.evaluate(() => window.stopMessageSamples()), calls = await page.evaluate(() => window.messageAncestorScrolls)
      geometry(before, samples, label)
      const completedFocus = await page.evaluate(() => window.messageSnapshot()); check(completedFocus.focus === 'Generate one contact reply' || completedFocus.focus === 'Message', `${width}px ${label}: back-to-back reply/state completion retains keyboard focus`, completedFocus)
      check(before.nearBottom ? completedFocus.nearBottom : Math.abs(completedFocus.threadScroll - before.threadScroll) < 2, `${width}px ${label}: back-to-back reply/state completion preserves the thread reading anchor`, { before, after:completedFocus })
      check(calls.length === 0, `${width}px ${label}: rerenders use the thread scroller rather than native ancestor scrolling`, calls)
      assert.equal(await input.inputValue(), 'Keep this unsent draft while generating.', 'Reply generation preserves the unsent message draft')
      report.push({ width, label, before, after: await page.evaluate(() => window.messageSnapshot()), calls })
    }

    await runGeneration('plain open')
    const beforeCancelCount = await page.locator('[data-pocket-thread] .lp-bubble[data-message-id]').count()
    const cancelBefore = await page.evaluate(() => { window.messageAncestorScrolls = []; window.startMessageSamples(); return window.messageSnapshot() })
    await page.getByRole('button', { name: 'Generate one contact reply', exact: true }).focus(); await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Stop generating reply', exact: true }).waitFor(); await paint()
    await page.getByRole('button', { name: 'Stop generating reply', exact: true }).focus(); await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Generate one contact reply', exact: true }).waitFor(); await paint(); await page.waitForTimeout(1250)
    const cancelSamples = await page.evaluate(() => window.stopMessageSamples()), cancelAfter = await page.evaluate(() => window.messageSnapshot())
    geometry(cancelBefore, cancelSamples, 'Stop cancellation')
    check(cancelAfter.focus === 'Generate one contact reply' || cancelAfter.focus === 'Message', `${width}px Stop cancellation retains keyboard focus`, cancelAfter)
    assert.equal(await page.locator('[data-pocket-thread] .lp-bubble[data-message-id]').count(), beforeCancelCount, 'A cancelled force-generation cannot append a late reply')
    assert.equal(await input.inputValue(), 'Keep this unsent draft while generating.')

    await page.screenshot({ path: resolve(output, `remote-${width}.png`) })
    await page.locator('[data-pocket-thread]').evaluate(node => { node.scrollTop = 220 })
    await paint(); const reading = await page.evaluate(() => window.messageSnapshot())
    await page.evaluate(() => { window.messageAncestorScrolls = []; window.appendMessageContinuityFixture() }); await paint()
    const readingAfter = await page.evaluate(() => window.messageSnapshot())
    check(Math.abs(readingAfter.threadScroll - reading.threadScroll) < 2, `${width}px incoming reply preserves an older reading position`, { reading, readingAfter })
    await runGeneration('reading older history')

    await page.evaluate(() => window.notifyMessageContinuityFixture('continuity-old-12'))
    await paint(); assert.equal(await page.locator('.lp-floating-notification').count(), 0, 'The open conversation suppresses its own floating notification')
    await page.getByRole('button', { name: 'Home or dismiss phone', exact: true }).click()
    await page.evaluate(() => window.notifyMessageContinuityFixture('continuity-old-12'))
    await page.locator('.lp-floating-notification').click()
    await page.locator('[data-message-id="continuity-old-12"][data-selected="true"]').waitFor(); await paint()
    await page.locator('[data-pocket-thread]').evaluate(node => { node.scrollTop = node.scrollHeight })
    await input.fill('Keep this unsent draft while generating.'); await paint(); await page.waitForTimeout(90)
    await runGeneration('notification selected older message')
    await page.locator('[data-pocket-thread]').evaluate(node => { node.scrollTop = 350 }); await paint()
    const selectedReading = await page.evaluate(() => window.messageSnapshot())
    await page.evaluate(() => { window.messageAncestorScrolls = []; window.appendMessageContinuityFixture() }); await paint(); await page.waitForTimeout(90)
    const selectedAfter = await page.evaluate(() => window.messageSnapshot()), selectedCalls = await page.evaluate(() => window.messageAncestorScrolls)
    check(Math.abs(selectedAfter.threadScroll - selectedReading.threadScroll) < 2 && selectedCalls.length === 0, `${width}px selected-message routes remain one-shot while later messages arrive`, { selectedReading, selectedAfter, selectedCalls })

    await page.evaluate(() => window.seedMessageContinuityFixture('present')); await paint(); await page.locator('[data-pocket-thread]').evaluate(node => { node.scrollTop = node.scrollHeight })
    const present = page.locator('[data-current-presence="true"]'); assert.ok(await present.count(), 'Current presence is shown separately from old arrival wording')
    assert.ok(await present.innerText().then(text => text.includes('Dane')))
    assert.equal(await page.locator('.lp-compose').count(), 0, 'Current in-person state uses its existing local-channel behavior')
    await page.screenshot({ path: resolve(output, `present-${width}.png`) })

    await page.evaluate(() => window.seedMessageContinuityFixture('pending-local')); await paint()
    await page.locator('.lp-handoff-more > summary').focus(); await page.keyboard.press('Enter'); await page.getByRole('button', { name: 'Message anyway', exact: true }).focus(); await page.keyboard.press('Enter'); await paint()
    await page.locator('[data-pocket-thread]').evaluate(node => { node.scrollTop = node.scrollHeight })
    await input.fill('Keep this unsent draft while generating.'); await paint(); await page.waitForTimeout(90)
    const relayBefore = await page.evaluate(() => { window.messageAncestorScrolls = []; window.startMessageSamples(); return window.messageSnapshot() })
    await page.evaluate(() => window.addMessageContinuityRelay()); await paint(); await page.waitForTimeout(100)
    const relaySamples = await page.evaluate(() => window.stopMessageSamples()), relayCalls = await page.evaluate(() => window.messageAncestorScrolls)
    geometry(relayBefore, relaySamples, 'new completed handoff receipt')
    check(relayCalls.length === 0, `${width}px handoff receipts scroll only within their owning thread`, relayCalls)
    report.push({ width, label: 'new completed handoff receipt', before: relayBefore, after: await page.evaluate(() => window.messageSnapshot()), calls: relayCalls })
    await page.evaluate(() => window.seedEventMessageContinuityFixture()); await paint()
    const sceneSeparator = page.getByRole('separator', { name: /^After Coffee together\./ })
    assert.equal(await sceneSeparator.count(), 1, 'A completed scene creates a boundary even when the story clock is unchanged')
    assert.equal(await page.locator('[data-story-day]').count(), 0, 'Scene separation does not invent a new calendar day')
    assert.ok(await sceneSeparator.evaluate(node => node.previousElementSibling.dataset.messageId === 'pre-event-eta' && node.nextElementSibling.dataset.messageId === 'post-event-human'), 'The boundary separates old planning from the new human message')
    assert.equal(await page.locator('[data-message-id="post-event-human"]').getAttribute('data-burst-continuation'), 'false')
    await page.screenshot({ path: resolve(output, `post-event-${width}.png`) })
    await press('Home or dismiss phone'); await press('Open app drawer'); await press('Messages')
    await page.locator('.lp-conversation-row').filter({ hasText: 'Dane' }).click(); await paint()
    assert.equal(await sceneSeparator.count(), 1, 'Closing and reopening Messages retains exactly one event boundary')
    await page.evaluate(()=>window.seedMessagePlanFixture('pending')); await paint()
    assert.equal(await page.locator('.lp-event-strip .lp-plan-stripe[data-status=pending]').count(),1,'Vague offers and superseded versions do not stack invitation cards')
    assert.equal(await page.locator('.lp-bubbles .lp-plan-stripe').count(),0,'the plan lives above the scrolling history')
    for(const scale of [.7,1,1.3]) {
      await page.locator('.lumiphone-shell').evaluate((node,scale)=>node.style.setProperty('--pocket-ui-scale',String(scale)),scale)
      assert.ok(await page.locator('.lp-plan-stripe').evaluate(row=>{const actions=row.querySelector('.lp-plan-stripe-actions').getBoundingClientRect();return row.scrollWidth<=row.clientWidth+1 && actions.right<=row.getBoundingClientRect().right+1}),'stripe actions fit at all Pocket scales')
    }
    await page.locator('.lumiphone-shell').evaluate(node=>node.style.removeProperty('--pocket-ui-scale'))
    const stripeY=await page.locator('.lp-plan-stripe').evaluate(node=>node.getBoundingClientRect().y)
    await page.locator('[data-pocket-thread]').evaluate(node=>{node.scrollTop=0})
    assert.ok(Math.abs(await page.locator('.lp-plan-stripe').evaluate(node=>node.getBoundingClientRect().y)-stripeY)<1,'scrolling history cannot move the pending stripe')
    const edges=await page.locator('.lp-bubbles > .lp-bubble[data-sender="persona"]').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().right))
    assert.ok(Math.max(...edges)-Math.min(...edges)<1,'Short outgoing messages share the exact same right edge')
    await page.screenshot({path:resolve(output,`plans-pending-${width}.png`)})
    await page.evaluate(()=>window.seedMessagePlanFixture('scheduled')); await paint()
    assert.equal(await page.locator('.lp-event-strip .lp-plan-stripe').count(),1,'A scheduled plan is listed once')
    await page.evaluate(()=>window.seedMessagePlanFixture('revision')); await paint()
    assert.equal(await page.locator('.lp-event-update').count(),1)
    await page.getByRole('button',{name:'Review event update: Coffee at six',exact:true}).focus()
    await page.keyboard.press('Enter'); await paint()
    await page.locator('.lp-nav-title').filter({hasText:'Edit Event'}).waitFor()
    assert.equal(await page.getByLabel('Title',{exact:true}).inputValue(),'Coffee at six')
    await page.getByRole('button',{name:'‹ Back',exact:true}).click(); await paint()
    await page.waitForTimeout(250)
    await page.screenshot({path:resolve(output,`plans-revision-${width}.png`)})
    await page.getByRole('button',{name:'Keep current event: Coffee at six',exact:true}).click(); await paint()
    assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).evaluate(node=>document.activeElement===node),true,'Keeping the current plan restores the message composer')
    for(const phase of ['deleted','started']) {
      await page.evaluate(phase=>window.seedMessagePlanFixture(phase),phase); await paint()
      assert.equal(await page.locator('.lp-event-strip').count(),0,`${phase} events have no upcoming strip`)
      assert.equal(await page.locator('.lp-bubbles .lp-plan-stripe').count(),0)
    }
    await page.evaluate(()=>window.seedMessageCallFixture()); await paint()
    const callStripes=page.locator('.lp-call-history')
    assert.equal(await callStripes.count(),3)
    assert.equal(await page.locator('.lp-call-history.lp-bubble,.lp-call-history button,.lp-call-history .lp-bubble-time').count(),0,'Call milestones are plain stripes without bubble actions or delivery receipts')
    const stripeLayout=await callStripes.evaluateAll(nodes=>nodes.map(node=>{const style=getComputedStyle(node),parent=node.parentElement,box=node.getBoundingClientRect(),frame=parent.getBoundingClientRect(),parentStyle=getComputedStyle(parent);return {width:box.width,available:(parent.clientWidth-parseFloat(parentStyle.paddingLeft)-parseFloat(parentStyle.paddingRight))*(frame.width/parent.offsetWidth),background:style.backgroundColor,radius:style.borderRadius,role:node.getAttribute('role'),top:style.borderTopStyle,bottom:style.borderBottomStyle}}))
    for(const stripe of stripeLayout){assert.ok(Math.abs(stripe.width-stripe.available)<2,'Call stripe fills the history width');assert.equal(stripe.background,'rgba(0, 0, 0, 0)');assert.equal(stripe.radius,'0px');assert.equal(stripe.role,'separator');assert.equal(stripe.top,'solid');assert.equal(stripe.bottom,'solid')}
    await page.locator('[data-pocket-thread]').evaluate(node=>{node.scrollTop=node.scrollHeight});await paint()
    await page.screenshot({path:resolve(output,'call-stripes-'+width+'.png')})
    await page.getByRole('button',{name:'Home or dismiss phone',exact:true}).click()
    await page.getByRole('button',{name:'Home or dismiss phone',exact:true}).click()
    await page.evaluate(()=>window.previewEventQuickstartFixture())
    const frame=page.frameLocator('iframe[title="Pocket event quickstart"]')
    await frame.getByRole('article',{name:'Event quickstart: Coffee, just us',exact:true}).waitFor()
    const card=frame.getByRole('article',{name:'Event quickstart: Coffee, just us',exact:true})
    assert.ok(await card.evaluate(node=>node.scrollWidth<=node.clientWidth+1),'quickstart card fits mobile width')
    assert.ok(await card.getByText('32 texts carried forward',{exact:false}).isVisible())
    await page.locator('#fixture-quickstart').screenshot({path:resolve(output,`quickstart-card-${width}.png`)})
    await page.evaluate(()=>window.previewEventQuickstartFixture(true))
    const longCard=frame.getByRole('article',{name:'Event quickstart: '+'A'.repeat(180),exact:true});await longCard.waitFor()
    assert.ok(await longCard.evaluate(node=>node.scrollWidth<=node.clientWidth+1),'long titles wrap inside the ticket')
    assert.ok(await longCard.evaluate(node=>node.getBoundingClientRect().height<=650),'a long title fits within the host card height')
    await page.locator('#fixture-quickstart').screenshot({path:resolve(output,`quickstart-card-long-${width}.png`)})
    assert.deepEqual(errors, []); await page.close()
  }
  await writeFile(resolve(output, baseline ? 'baseline-report.json' : 'report.json'), JSON.stringify({ findings, report }, null, 2))
  assert.deepEqual(findings, [], `Messages browser continuity failures: ${JSON.stringify(findings, null, 2)}`)
  console.log('Messages continuity passed at 390px and 900px: recorded story days, completed receipts/current presence, force/Stop/reply geometry, drafts, keyboard focus, notification targets and older reading positions.')
} catch (error) {
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: resolve(output, baseline ? 'baseline-failure.png' : 'failure.png') })
  await writeFile(resolve(output, baseline ? 'baseline-report.json' : 'report.json'), JSON.stringify({ findings, report }, null, 2))
  throw error
} finally { await browser?.close(); await new Promise(done => server.close(done)) }
