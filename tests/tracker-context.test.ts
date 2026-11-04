import { beforeAll, expect, test } from 'bun:test'
import { freeformHost } from './fixtures/freeform-host.js'
import { normalizeTracker } from '../src/domain/trackers.js'
import { DEFAULT_TRACKER_PROMPT, normalizeTrackerContextSettings, trackerContext, trackerMacroValue } from '../src/domain/tracker-context.js'
import { trackerSampleState } from './fixtures/tracker-samples.js'

const host = freeformHost()
beforeAll(async () => { (globalThis as any).spindle = host.api; await import('../src/backend.ts?tracker-context') })
let serial = 0
const scope = { chatId: 'tracker-context-chat', characterId: 'host-character' }
async function send(type: string, data: Record<string, unknown> = {}, context = scope) {
  const offset = host.sends.length
  await host.send({ type: `lumiphone:${type}`, requestId: `tracker-context-${++serial}`, ...context, ...data })
  const responses = host.sends.slice(offset)
  expect(responses.find(p => p.type === 'lumiphone:error')).toBeUndefined()
  return responses.findLast(p => p.type === 'lumiphone:state')?.state
}
const tracker = (data: Record<string, unknown>) => normalizeTracker({ id: 'trust', key: 'trust', label: 'Trust', kind: 'meter', min: 0, max: 100, value: 42, updateMode: 'model', allowModelWrite: true, target: { type: 'custom', label: 'Alex → Fern' }, ...data })!

test('settings migrate safely, preserve an intentional blank prompt, and bound text', () => {
  expect(normalizeTrackerContextSettings(null)).toEqual({ delivery: 'injection', prompt: DEFAULT_TRACKER_PROMPT })
  expect(normalizeTrackerContextSettings({ delivery: 'bad', prompt: '' })).toEqual({ delivery: 'injection', prompt: '' })
  expect(normalizeTrackerContextSettings({ prompt: 'x'.repeat(5000) }).prompt.length).toBe(4000)
})

test('context carries targets, ranges, permissions and all visible trackers without leaking hidden guidance', () => {
  const state = { ...trackerSampleState, trackers: [tracker({ modelPrompt: 'Add trust for keeping a promise.' }), tracker({ key: 'secret', visibleToModel: false, modelPrompt: 'SECRET GUIDANCE' }), tracker({ key: 'manual', updateMode: 'manual', modelPrompt: 'PRIVATE RULE' }), ...Array.from({ length: 14 }, (_, i) => tracker({ key: `extra_${i}` }))] }
  const context = trackerContext(state)
  for (const value of ['Alex → Fern', '"min":0', '"max":100', '"modelWritable":true', '"modelWritable":false', 'Add trust for keeping a promise.', 'extra_13']) expect(context).toContain(value)
  for (const value of ['SECRET GUIDANCE', 'PRIVATE RULE', '"key":"secret"']) expect(context).not.toContain(value)
  expect(trackerMacroValue(state, 'secret')).toBe(''); expect(trackerMacroValue(state, 'missing')).toBe('')
  const crowded = { ...state, trackers: Array.from({ length: 100 }, (_, i) => tracker({ key: `crowded_${i}`, kind: 'state', freeText: true, state: 'v'.repeat(2000) })) }
  const bounded = trackerContext(crowded)
  expect(bounded).toContain('omittedVisibleTrackers'); expect(bounded.length).toBeLessThan(30000)
  expect(() => JSON.parse(bounded.split('\n\n').at(-1)!)).not.toThrow()
})

test('live automatic values, pause and approximate story clocks are projected without mutation', () => {
  const now = '2026-11-03T12:00:00Z'
  const state = { ...trackerSampleState, roleplayNow: now, trackers: [tracker({ key: 'clock', updateMode: 'automatic', clock: 'real', ratePerHour: -2, value: 10, lastUpdated: '2026-11-03T11:00:00Z', unit: 'min' })] }
  const before = JSON.stringify(state)
  expect(trackerMacroValue(state, 'clock', now)).toBe('8 min'); expect(JSON.stringify(state)).toBe(before)
  state.trackers[0].clockPaused = true; expect(trackerMacroValue(state, 'clock', now)).toBe('10 min')
  state.trackers[0] = { ...state.trackers[0], clock: 'roleplay', clockPaused: false, lastRoleplayAt: '2026-11-03T11:00:00Z' }
  expect(trackerMacroValue({ ...state, roleplayClockSource: 'narrative', roleplayClockPrecision: 'approximate' }, 'clock', now)).toBe('10 min')
})

test('settings persist per RP; automatic and preset macro delivery are exclusive and live', async () => {
  await send('action', { action: 'tracker', payload: tracker({}) })
  await send('action', { action: 'tracker', payload: tracker({ id: 'secret', key: 'secret', label: 'Hidden score', visibleToModel: false }) })
  const intercept = () => host.interceptors[0]([{ role: 'user', content: 'Continue.' }], scope)
  const injected = await intercept()
  expect(injected.messages.filter((m: any) => m.content.includes('POCKET TRACKERS — LIVE STATE'))).toHaveLength(1)
  expect(injected.messages[1].content).not.toContain('"trackers"')
  expect(injected.messages.map((m: any) => m.content).join('\n')).not.toContain('Hidden score')
  const full = host.macros.get('pocket_trackers').handler, single = host.macros.get('pocket_tracker').handler
  expect(await full({ chatId: scope.chatId, commit: false })).toBe('')
  const saved = await send('save_tracker_settings', { settings: { delivery: 'macros', prompt: 'Keep trust grounded in the story.' } })
  expect(saved.trackerSettings).toEqual({ delivery: 'macros', prompt: 'Keep trust grounded in the story.' })
  expect((await send('get_state')).trackerSettings).toEqual(saved.trackerSettings)
  expect((await intercept()).messages.map((m: any) => m.content).join('\n')).not.toContain('POCKET TRACKERS — LIVE STATE')
  const writes = host.writes.length
  expect(await full({ chatId: scope.chatId, commit: false })).toContain('Keep trust grounded in the story.')
  expect(await single({ chatId: scope.chatId, args: ['trust'], commit: false })).toBe('42')
  expect(await single({ chatId: scope.chatId, args: ['secret'] })).toBe('')
  expect(await single({ args: ['trust'] })).toBe('')
  expect(host.writes.length).toBe(writes)
  await send('action', { action: 'tracker', payload: { trackerId: 'trust', operation: 'set', amount: 61 } })
  expect(await single({ chatId: scope.chatId, args: ['trust'] })).toBe('61')
  const other = { chatId: 'tracker-other-chat', characterId: 'host-character' }
  expect((await send('get_state', {}, other)).trackerSettings.delivery).toBe('injection')
  expect(await full({ chatId: other.chatId })).toBe('')
  await send('save_preferences', { preferences: { suppressRoleplayTools: true } })
  expect(await full({ chatId: scope.chatId })).toBe('')
  await send('save_preferences', { preferences: { suppressRoleplayTools: false } })
})
