import { JSDOM } from 'jsdom'
import { PHONE_STYLES } from '../src/styles.js'
import { refreshActivityConnectors } from '../src/frontend/components/activity-connectors.js'
import type { PocketActivity } from '../src/types.js'

const output = process.argv[2]
if (!output) throw new Error('Pass an output HTML path.')
const dom = new JSDOM('<main></main>')
globalThis.document = dom.window.document
const sent: PocketActivity = {
  id: 'sent', kind: 'message', title: 'Sam', summary: 'Are you coming?',
  scope: { chatId: 'fixture', characterId: 'fixture' }, createdAt: '2026-09-04T12:00:00Z',
  source: { messageId: 'turn' }, route: { app: 'messages', conversationId: 'conversation', messageId: 'sent-message' },
  presentation: { kind: 'sent', senderName: 'Alex', conversationTitle: 'Sam' },
}
const reply: PocketActivity = { ...sent, id: 'reply', summary: 'On my way. Keep the coffee warm!', route: { app: 'messages', conversationId: 'conversation', messageId: 'reply-message' }, presentation: { kind: 'received', senderName: 'Sam', conversationTitle: 'Sam' } }
const entries = [sent, reply].map(activity => {
  const host = document.createElement('span'); host.className = 'pocket-receipt-host'; host.setAttribute('data-pocket-host', 'true'); document.querySelector('main')!.append(host)
  return { host, activity, owner: 'persona', options: { appearance: 'phone' as const, accent: '#d7a978', textColor: '#eeedf1', surfaceColor: '#201e25' } }
})
refreshActivityConnectors(entries, () => {})
for (const island of document.querySelectorAll('pocket-inline-ui')) {
  const template = document.createElement('template'); template.setAttribute('shadowrootmode', 'open'); template.innerHTML = island.shadowRoot!.innerHTML; island.append(template)
}
await Bun.write(output, `<!doctype html><meta charset="utf-8"><style>${PHONE_STYLES}body{margin:0;padding:24px;background:#151318;color:#eee;font-family:system-ui}main{max-width:560px;margin:auto}</style>${document.querySelector('main')!.outerHTML}`)
dom.window.close()
