import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { refreshPhoneSequences, type PhoneSequenceEntry } from '../src/frontend/components/phone-sequence.js'
import type { PocketActivity } from '../src/types.js'

function fixture() {
  const previous = globalThis.document
  const dom = new JSDOM('<main></main>'); globalThis.document = dom.window.document
  const parent = document.querySelector('main')!
  const activity: PocketActivity = { id: 'one', kind: 'message', title: 'Roderick', summary: 'A compliment would have worked.',
    scope: { chatId: 'chat', characterId: 'character' }, createdAt: '2026-10-11T12:00:00Z', source: { messageId: 'turn' },
    route: { app: 'messages', conversationId: 'conversation', messageId: 'one' },
    presentation: { kind: 'observed', senderName: 'Roderick', recipientNames: ['Laiyah'] } }
  const make = (id: string, changes: Partial<PocketActivity> = {}, paragraph = false): PhoneSequenceEntry => {
    const host = document.createElement('span'); host.className = 'pocket-inline-anchor'
    if (paragraph) { const p = document.createElement('p'); p.append(host); parent.append(p) } else parent.append(host)
    return { host, activity: { ...activity, id, route: { ...activity.route, app: 'messages', messageId: id }, ...changes }, owner: 'laiyah', options: { appearance: 'phone' } }
  }
  const root = (entry: PhoneSequenceEntry) => entry.host.querySelector('pocket-inline-ui')!.shadowRoot!
  return { parent, activity, make, root, close: () => { dom.window.close(); globalThis.document = previous } }
}

test('adjacent observed messages share one animated phone in DOM order with exact navigation', () => {
  const f = fixture()
  try {
    const one = f.make('one'), two = f.make('two', { summary: 'You looked at it twice.' })
    const opened: string[] = []
    refreshPhoneSequences([two, one], (_, route) => opened.push(route.app === 'messages' ? route.messageId! : ''))
    expect(two.host.hidden).toBe(true)
    const root = f.root(one)
    expect(root.querySelectorAll('.pocket-phone-device').length).toBe(1)
    const messages = root.querySelectorAll<HTMLButtonElement>('.pocket-phone-notification')
    expect(messages.length).toBe(2)
    expect(messages[0].textContent).toContain('compliment')
    expect(messages[1].textContent).toContain('twice')
    messages[0].click(); messages[1].click(); expect(opened).toEqual(['one', 'two'])
    expect(messages[1].style.getPropertyValue('--pocket-step-delay')).toBe('0.9s')
    const phone = root.querySelector<HTMLElement>('.pocket-phone-device')!
    const controls = root.querySelectorAll<HTMLButtonElement>('.pocket-phone-playback button')
    controls[1].click(); expect(phone.dataset.playback).toBe('complete')
    controls[0].click(); expect(phone.dataset.playback).toBe('playing')
    refreshPhoneSequences([one, two], () => {})
    expect(f.root(one).querySelector('.pocket-phone-device')).toBe(phone)
    one.host.replaceChildren()
    refreshPhoneSequences([one, two], () => {})
    expect(f.root(one).querySelectorAll('.pocket-phone-notification').length).toBe(2)
    one.host.remove()
    refreshPhoneSequences([two], () => {})
    expect(two.host.hidden).toBe(false)
    expect(f.root(two).querySelectorAll('.pocket-phone-notification').length).toBe(1)
  } finally { f.close() }
})

test('standalone markdown paragraphs merge, while prose splits phones and restores followers', () => {
  const f = fixture()
  try {
    const one = f.make('one', {}, true), two = f.make('two', {}, true)
    refreshPhoneSequences([one, two], () => {}); expect(two.host.hidden).toBe(true)
    const prose = document.createElement('p'); prose.textContent = 'She put the phone away.'
    two.host.parentElement!.before(prose)
    refreshPhoneSequences([one, two], () => {})
    expect(two.host.hidden).toBe(false)
    expect(f.root(one).querySelectorAll('.pocket-phone-notification').length).toBe(1)
  } finally { f.close() }
})

test('different devices, conversations, turns, and appearances never merge', () => {
  for (const change of ['owner', 'conversation', 'turn', 'appearance', 'scope', 'call']) {
    const f = fixture()
    try {
      const one = f.make('one'), two = f.make('two')
      if (change === 'owner') two.owner = 'roderick'
      if (change === 'conversation') two.activity.route = { app: 'messages', conversationId: 'other' }
      if (change === 'turn') two.activity.source = { messageId: 'other-turn' }
      if (change === 'appearance') two.options.appearance = 'cards'
      if (change === 'scope') two.activity.scope = { ...two.activity.scope, chatId: 'other' }
      if (change === 'call') two.activity = { ...two.activity, kind: 'call' }
      refreshPhoneSequences([one, two], () => {})
      expect(two.host.hidden).toBe(false)
      expect(f.root(one).querySelectorAll('.pocket-phone-notification').length).toBe(1)
    } finally { f.close() }
  }
})

test('batch messages animate in order and content changes refresh a cached phone', () => {
  const f = fixture()
  try {
    const entry = f.make('batch', { presentation: { kind: 'batch', conversationTitle: 'Friends', batchMessages: [
      { senderName: 'A', text: 'Hello', direction: 'received', messageId: 'a' },
      { senderName: 'B', text: 'Hey', direction: 'received', messageId: 'b' },
    ] } })
    refreshPhoneSequences([entry], () => {})
    expect(f.root(entry).querySelectorAll('.pocket-phone-step').length).toBe(2)
    entry.activity.presentation!.batchMessages![1].text = '<img src=x onerror=alert(1)>'
    refreshPhoneSequences([entry], () => {})
    expect(f.root(entry).querySelector('.pocket-phone-thread')!.textContent).toContain('<img src=x')
    expect(f.root(entry).querySelector('.pocket-phone-thread img')).toBeNull()
  } finally { f.close() }
})
