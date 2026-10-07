import { JSDOM } from 'jsdom'
import { renderActivityHost } from '../src/frontend/activity.js'
import { PHONE_STYLES } from '../src/styles.js'
import type { PocketActivity } from '../src/types.js'

const output = process.argv[2]
if (!output) throw new Error('Pass an output HTML path.')
const dom = new JSDOM('<main></main>'); globalThis.document = dom.window.document
const activity: PocketActivity = { id: 'clock', kind: 'message', title: 'Sam', summary: 'Leaving the office now.', createdAt: '2026-10-06T12:00:00Z', scope: { chatId: 'fixture', characterId: 'fixture' }, route: { app: 'messages' }, presentation: { kind: 'received', senderName: 'Sam', recipientNames: ['Alex'] } }
for (const [name, clock] of Object.entries({ exact: { storyAt: '2026-10-06T01:30:00Z', storyTimezoneOffsetMinutes: 180 }, approximate: { storyTimeLabel: 'Afternoon' }, unknown: {}, long: { storyTimeLabel: 'Afternoon' } })) {
  document.querySelector('main')!.replaceChildren()
  const host = document.createElement('div'); document.querySelector('main')!.append(host)
  renderActivityHost(host, { ...activity, summary: name === 'long' ? 'The station has changed platforms. Bring your coat, check the departure board, and meet us beside the ticket desk. '.repeat(12) : activity.summary, presentation: { ...activity.presentation!, ...clock } }, () => {}, { appearance: 'phone', includeReceipt: false, accent: '#d7a978' })
  for (const island of document.querySelectorAll('pocket-inline-ui')) {
    const template = document.createElement('template'); template.setAttribute('shadowrootmode', 'open'); template.innerHTML = island.shadowRoot!.innerHTML; island.append(template)
  }
  await Bun.write(output.replace('.html', `-${name}.html`), `<!doctype html><meta charset="utf-8"><style>${PHONE_STYLES}body{margin:0;padding:24px;background:#151318;color:#eee;font-family:system-ui}main{display:grid;grid-template-columns:1fr;gap:20px}</style>${document.querySelector('main')!.outerHTML}`)
}
dom.window.close()
