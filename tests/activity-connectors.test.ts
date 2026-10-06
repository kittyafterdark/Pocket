import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { refreshActivityConnectors, type ActivityConnectorEntry } from '../src/frontend/components/activity-connectors.js'
import type { PocketActivity } from '../src/types.js'

function fixture() {
  const previous = globalThis.document
  const dom = new JSDOM('<main></main>')
  globalThis.document = dom.window.document
  const parent = document.querySelector('main')!
  const sent: PocketActivity = { id: 'sent', kind: 'message', title: 'Sam', summary: 'Are you coming?', scope: { chatId: 'chat', characterId: 'character' }, createdAt: '2026-09-04T12:00:00Z', source: { messageId: 'turn' }, route: { app: 'messages', conversationId: 'conversation', messageId: 'sent-message' }, presentation: { kind: 'sent', senderName: 'Alex', conversationTitle: 'Sam' } }
  const received: PocketActivity = { ...sent, id: 'received', summary: 'On my way.', route: { ...sent.route, app: 'messages', messageId: 'reply-message' }, presentation: { kind: 'received', senderName: 'Sam', conversationTitle: 'Sam' } }
  const make = (activity: PocketActivity, owner = 'persona'): ActivityConnectorEntry => {
    const host = document.createElement('span'); parent.append(host)
    return { host, activity, owner, options: { appearance: 'phone' } }
  }
  const rows = (entry: ActivityConnectorEntry) => entry.host.querySelector('pocket-inline-ui')?.shadowRoot?.querySelectorAll<HTMLButtonElement>('.pocket-connector-row') || []
  return { parent, sent, received, make, rows, close: () => { dom.window.close(); globalThis.document = previous } }
}

test('between-turn Full Phone entries become one exchange with exact-message navigation', () => {
  const f = fixture()
  try {
    const sent = f.make(f.sent), reply = f.make(f.received)
    const opened: PocketActivity[] = []
    refreshActivityConnectors([reply, sent], activity => opened.push(activity))
    expect(f.rows(sent).length).toBe(2)
    expect(reply.host.hasAttribute('hidden')).toBe(true)
    expect(sent.host.querySelector('pocket-inline-ui')!.shadowRoot!.querySelector('.pocket-phone-device')).toBeNull()
    expect(f.rows(sent)[0].dataset.direction).toBe('sent')
    expect(f.rows(sent)[1].dataset.direction).toBe('received')
    f.rows(sent)[0].click(); f.rows(sent)[1].click()
    expect(opened.map(activity => activity.route.app === 'messages' && activity.route.messageId)).toEqual(['sent-message', 'reply-message'])
    // Promoting the first message to a prose anchor must leave the reply visible.
    sent.host.remove()
    refreshActivityConnectors([reply], activity => opened.push(activity))
    expect(reply.host.hasAttribute('hidden')).toBe(false)
    expect(f.rows(reply)[0].textContent).toContain('On my way.')
  } finally { f.close() }
})

test('connectors never merge across prose, another conversation, or another phone', () => {
  const f = fixture()
  try {
    const first = f.make(f.sent)
    f.parent.append(document.createTextNode('Then the scene changed.'))
    const afterProse = f.make(f.received)
    const otherPhone = f.make({ ...f.received, id: 'other-phone' }, 'other-owner')
    const otherConversation = f.make({ ...f.received, id: 'other-conversation', route: { app: 'messages', conversationId: 'another' } }, 'other-owner')
    refreshActivityConnectors([first, afterProse, otherPhone, otherConversation], () => {})
    for (const entry of [first, afterProse, otherPhone, otherConversation]) {
      expect(entry.host.hasAttribute('hidden')).toBe(false)
      expect(f.rows(entry).length).toBe(1)
    }
  } finally { f.close() }
})
