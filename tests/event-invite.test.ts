import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { eventInvite } from '../src/frontend/components/event-invite.js'
import type { PhoneMessage } from '../src/types.js'

test('invite actions keep their originating message and scheduled event identities', () => {
  const old = globalThis.document, dom = new JSDOM()
  try {
    globalThis.document = dom.window.document
    const calls: string[][] = []
    const host = { scheduleEventSuggestion: (...args: string[]) => calls.push(['schedule', ...args]), declineEventSuggestion: (...args: string[]) => calls.push(['decline', ...args]), openTimeline: (...args: string[]) => calls.push(['open', ...args]) }
    const message = { id: 'message', eventSuggestion: { id: 'invite', title: 'Movie night', description: 'Takeout and a film.', whenText: 'Tonight', participantNames: ['Alex', 'Sam'], status: 'pending' } } as PhoneMessage
    const card = eventInvite(message, 'thread', host)
    expect(card.textContent).toContain('Tonight')
    expect(card.textContent).toContain('Alex · Sam')
    const buttons = card.querySelectorAll('button'); buttons[0].click(); buttons[1].click()
    expect(calls).toEqual([['schedule', 'thread', 'message'], ['decline', 'thread', 'message']])
    message.eventSuggestion!.status = 'scheduled'; message.eventSuggestion!.scheduledEventId = 'event'
    eventInvite(message, 'thread', host).querySelector('button')!.click()
    expect(calls.at(-1)).toEqual(['open', 'event'])
    message.eventSuggestion!.status = 'declined'
    expect(eventInvite(message, 'thread', host).querySelectorAll('button').length).toBe(0)
  } finally { globalThis.document = old; dom.window.close() }
})
