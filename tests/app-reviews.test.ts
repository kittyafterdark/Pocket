import { expect, test } from 'bun:test'
import { AppReviews } from '../src/backend/app-reviews.js'
import type { PhoneState } from '../src/types.js'

function fixture() {
  let state = { events: [], roleplayNow: '2026-09-04T12:00:00Z', roleplayTimezoneOffsetMinutes: 0, weather: { location: 'Town', condition: 'Clear', high: 22, low: 12, unit: 'C', details: 'Clear skies' } } as unknown as PhoneState
  let release!: (value: Record<string, unknown>) => void
  let started!: () => void
  const ready = new Promise<void>(resolve => { started = resolve })
  let signal!: AbortSignal
  let saves = 0
  const updates: Array<{ phase?: string }> = []
  const reviews = new AppReviews({
    loadState: async () => structuredClone(state),
    saveState: async next => { state = next; saves++ },
    sendState: async () => {},
    send: payload => updates.push(payload as { phase?: string }),
    getMessages: async () => [],
    runStructuredGeneration: async (_task, _id, request) => {
      signal = request.signal as AbortSignal
      started()
      return new Promise(resolve => { release = resolve })
    },
    withStateLock: async (_key, callback) => callback(),
    stateKey: (chat, character) => chat + ':' + character,
    nowIso: () => '2026-09-04T12:00:00Z',
  })
  const finish = () => release({ days: Array.from({ length: 7 }, () => ({ condition: 'Clear', high: 22, low: 12, details: 'Clear skies' })) })
  return { reviews, ready, finish, updates, state: () => state, saves: () => saves, signal: () => signal }
}

const context = { chatId: 'chat', characterId: 'character' }

test('review cancellation is scoped to the requesting user and device context', async () => {
  const f = fixture()
  const pending = f.reviews.run(context, 'weather-week', 'request', 'owner')
  await f.ready
  f.reviews.cancel(context, 'request', 'other-user')
  f.reviews.cancel({ ...context, chatId: 'other-chat' }, 'request', 'owner')
  expect(f.signal().aborted).toBe(false)
  f.reviews.cancel(context, 'request', 'owner')
  expect(f.signal().aborted).toBe(true)
  f.finish()
  await pending
  expect(f.saves()).toBe(0)
  expect(f.updates.some(update => update.phase === 'complete')).toBe(false)
  // A cancelled flight must release the busy guard, even if its provider finishes late.
  const retry = f.reviews.run(context, 'weather-week', 'retry', 'owner')
  await Promise.resolve(); await Promise.resolve()
  f.finish(); await retry
  expect(f.saves()).toBe(1)
})

test('review rejects concurrent duplicates and never overwrites weather edited during generation', async () => {
  const f = fixture()
  const pending = f.reviews.run(context, 'weather-week', 'request', 'owner')
  await f.ready
  await expect(f.reviews.run(context, 'weather-week', 'duplicate', 'owner')).rejects.toThrow('already running')
  f.state().weather.condition = 'Snow'
  f.finish()
  await expect(pending).rejects.toThrow('scene weather changed')
  expect(f.saves()).toBe(0)
  expect(f.updates.at(-1)?.phase).toBe('error')
})


test('timeline review keeps older open beats and late resolution in long prose', async () => {
  const evidence = 'The press conference was over and everyone had gone home.'
  const event = { id: 'old-open', title: 'Press Conference', description: 'Agency conference', completed: false }
  let state = { events: [event, ...Array.from({ length: 20 }, (_, i) => ({ ...event, id: 'resolved-' + i, completed: true }))], roleplayNow: '', weather: {} } as unknown as PhoneState
  const statuses: string[] = []
  const reviews = new AppReviews({
    loadState: async () => structuredClone(state), saveState: async next => { state = next }, sendState: async () => {},
    send: payload => statuses.push((payload as { message: string }).message),
    getMessages: async () => [{ role: 'assistant', content: 'At the conference. ' + 'Long scene. '.repeat(500) + evidence }],
    runStructuredGeneration: async (_task, _id, request) => {
      const messages = request.messages as Array<{ content: string }>
      const supplied = JSON.parse(messages[1].content)
      expect(supplied.events.map((entry: { id: string }) => entry.id)).toEqual(['old-open'])
      expect(supplied.recentProse).toContain(evidence)
      return { events: [{ id: 'old-open', completed: true, description: 'The agency conference finished.', evidence }] }
    },
    withStateLock: async (_key, callback) => callback(), stateKey: () => 'fixture', nowIso: () => '',
  })
  await reviews.run(context, 'timeline-review', 'review', 'owner')
  expect(state.events[0].completed).toBe(true)
  expect(state.events[0].description).toBe('The agency conference finished.')
  expect(statuses.at(-1)).toContain('updates applied')
})
