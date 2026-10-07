import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { activityClock, snapshotActivityClock } from '../src/domain/activity-clock.js'
import { clockDayPart, clockLabel } from '../src/domain/clock-label.js'
import { buildPhoneScreen } from '../src/frontend/phone-screen.js'
import type { PhoneState, PocketActivity } from '../src/types.js'

const activity: PocketActivity = { id: 'activity', kind: 'message', title: 'Sam', summary: 'On my way.', scope: { chatId: 'chat', characterId: 'character' }, createdAt: '2026-10-06T12:00:00Z', route: { app: 'messages' }, source: { messageId: 'turn' }, presentation: { kind: 'received', senderName: 'Sam' } }

test('clock labels accept fixed day parts and reject scenery without inventing time', () => {
  expect(clockDayPart('late_morning')).toBe('late_morning')
  expect(clockLabel('', 'early_morning')).toBe('Early morning')
  expect(clockLabel('evening, city lights on outside the windows')).toBe('Evening')
  expect(clockLabel('the city lights are on')).toBe('')
  expect(clockLabel('25:90')).toBe('')
  expect(clockLabel('6:30 AM')).toBe('6:30 AM')
  expect(clockLabel('+15 minutes')).toBe('+15 minutes')
  expect(activityClock({ ...activity, presentation: { storyTimeLabel: 'evening, city lights on outside the windows' } }).time).toBe('Evening')
})

test('activity clocks preserve approximate labels instead of inventing numeric times', () => {
  const state = { roleplayNow: '2026-10-06T12:00:00Z', roleplayClockSource: 'narrative', roleplayClockPrecision: 'approximate', roleplayClockLabel: 'Afternoon', roleplayTimezoneOffsetMinutes: 180 } as PhoneState
  const snapshot = snapshotActivityClock(state)
  expect(snapshot.storyAt).toBeUndefined()
  expect(activityClock({ ...activity, presentation: { ...activity.presentation!, ...snapshot } })).toEqual({ time: 'Afternoon', date: '', precision: 'approximate' })
})

test('exact clock and date use the saved story timezone across midnight', () => {
  const clock = activityClock({ ...activity, presentation: { ...activity.presentation!, storyAt: '2026-10-06T01:30:00Z', storyTimezoneOffsetMinutes: 180 } })
  expect(clock).toEqual({ time: '22:30', date: 'Monday, October 5', precision: 'exact' })
})

test('legacy clocks recover only their selected historical turn, never the current clock or another swipe', () => {
  const state = { roleplayNow: '2030-01-01T12:00:00Z', roleplayTimezoneOffsetMinutes: 0, hostSwipeSelections: [{ hostMessageId: 'turn', swipeId: 0 }, { hostMessageId: 'turn', swipeId: 1 }], candidateClocks: [
    { hostMessageId: 'turn', swipeId: 1, roleplayNow: '2026-10-06T12:00:00Z', source: 'narrative', precision: 'approximate', label: 'Late morning' },
    { hostMessageId: 'turn', swipeId: 2, roleplayNow: '2026-10-07T12:00:00Z', source: 'manual', precision: 'exact', label: '' },
  ] } as PhoneState
  expect(activityClock(activity, state).time).toBe('Late morning')
  expect(activityClock({ ...activity, source: { messageId: 'unrelated' } }, state).precision).toBe('unknown')
  state.hostSwipeSelections = []
  expect(activityClock(activity, state).precision).toBe('unknown')
})

test('untimed and invalid clocks render intentional lock states without dashes or invalid dates', () => {
  const previous = globalThis.document; const dom = new JSDOM(); globalThis.document = dom.window.document
  try {
    for (const storyAt of [undefined, 'invalid', '2026-10-06Tbad']) {
      const phone = buildPhoneScreen({ ...activity, presentation: { ...activity.presentation!, storyAt } }, () => {}, {})!
      expect(phone.querySelector('.pocket-phone-clock')!.textContent).toBe('New message')
      expect(phone.textContent).not.toContain('—:—')
      expect(phone.textContent).not.toContain('Invalid Date')
    }
    const approximate = buildPhoneScreen({ ...activity, presentation: { ...activity.presentation!, storyTimeLabel: 'Afternoon' } }, () => {}, {})!
    expect(approximate.querySelector('.pocket-phone-clock')!.getAttribute('data-precision')).toBe('approximate')
  } finally { dom.window.close(); globalThis.document = previous }
})
