import { describe, expect, test } from 'bun:test'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { MODEL_CONTEXT_BUDGET, projectPhoneContext } from '../src/domain/projection.js'
import { calculatePhoneSurface } from '../src/frontend/surface.js'
import { applyTrackerOperation, materializeTracker, normalizeTracker, trackerBand } from '../src/domain/trackers.js'
import { normalizePocketRoute } from '../src/domain/navigation.js'
import type { PhoneState, PhoneTracker } from '../src/types.js'

describe('device preference schema', () => {
  test('migrates legacy settings without retaining arbitrary CSS', () => {
    const migrated = normalizePreferences({
      theme: 'rose', accent: '#ABCDEF', bezelColor: '#010203',
      wallpaper: 'url(javascript:alert(1))', chatWallpaper: 'var(--host-secret)',
      animation: 'slide', autoOpenOnModelAction: true,
    })
    expect(migrated.version).toBe(1)
    expect(migrated.colors.accent).toBe('#abcdef')
    expect(migrated.colors.bezel).toBe('#010203')
    expect(JSON.stringify(migrated)).not.toContain('javascript')
    expect(JSON.stringify(migrated)).not.toContain('--host-secret')
  })

  test('fails closed for unknown future schemas', () => {
    expect(normalizePreferences({ version: 999, handsetScale: 99 })).toEqual(defaultPreferences())
  })
})

describe('phone surface', () => {
  test('derives a fresh 9:16 desktop rectangle from semantic scale', () => {
    const normal = calculatePhoneSurface(1, { width: 1440, height: 900 })
    const large = calculatePhoneSurface(1.2, { width: 1440, height: 900 })
    expect(normal.fullscreen).toBe(false)
    expect(normal.width / normal.height).toBeCloseTo(9 / 16, 2)
    expect(large.width).toBeGreaterThan(normal.width)
    expect(large.width / large.height).toBeCloseTo(9 / 16, 2)
  })

  test('recalculates against viewport constraints and uses fullscreen on mobile', () => {
    const short = calculatePhoneSurface(1.25, { width: 1000, height: 600 })
    const mobile = calculatePhoneSurface(1, { width: 390, height: 844 })
    expect(short.height).toBeLessThanOrEqual(576)
    expect(short.width / short.height).toBeCloseTo(9 / 16, 2)
    expect(mobile.fullscreen).toBe(true)
  })
})

describe('Pocket routes', () => {
  test('normalizes typed deep links and rejects unknown apps', () => {
    expect(normalizePocketRoute({ app: 'trackers', trackerId: 'trust', view: 'config' })).toEqual({ app: 'trackers', trackerId: 'trust', view: 'config' })
    expect(normalizePocketRoute({ app: 'messages', contactId: 'alice', messageId: 'message-1' })).toEqual({ app: 'messages', contactId: 'alice', messageId: 'message-1' })
    expect(normalizePocketRoute({ app: 'malware', trackerId: 'x' })).toEqual({ app: 'home' })
  })
})

describe('model context projection', () => {
  test('enforces a hard serialized budget for huge phone databases', () => {
    const now = new Date().toISOString()
    const state: PhoneState = {
      version: 2, chatId: 'chat', characterId: 'character', characterName: 'Character', roleplayNow: now,
      contacts: Array.from({ length: 30 }, (_, contactIndex) => ({
        id: `c${contactIndex}`, name: `Contact ${contactIndex}`, subtitle: '', avatarUrl: '', unread: 0,
        messages: Array.from({ length: 240 }, (_, messageIndex) => ({
          id: `m${contactIndex}-${messageIndex}`, sender: 'character', text: 'x'.repeat(12_000), createdAt: now,
          read: true, status: 'read',
        })),
      })),
      notes: Array.from({ length: 120 }, (_, index) => ({ id: `n${index}`, title: `Note ${index}`, body: 'y'.repeat(40_000), mood: '', pinned: true, author: 'character', createdAt: now, updatedAt: now })),
      events: [], weather: { location: 'Scene', condition: 'Clear', temperature: 20, unit: 'C', high: 22, low: 10, details: 'z'.repeat(2_000), updatedAt: now },
      trackers: [], notifications: [], activities: [], processedCommands: [], updatedAt: now,
    }
    const projection = projectPhoneContext(state)
    expect(projection.length).toBeLessThanOrEqual(MODEL_CONTEXT_BUDGET)
    expect(() => JSON.parse(projection)).not.toThrow()
  })

  test('uses a structural emergency fallback instead of slicing JSON', () => {
    const now = new Date().toISOString()
    const state: PhoneState = {
      version: 2, chatId: 'c', characterId: 'x', characterName: 'X', roleplayNow: 'R'.repeat(2_000),
      contacts: [], notes: [], events: [], trackers: [], notifications: [], activities: [], processedCommands: [], updatedAt: now,
      weather: { location: 'L'.repeat(2_000), condition: 'C'.repeat(2_000), temperature: 1, unit: 'C', high: 2, low: 0, details: 'D'.repeat(20_000), updatedAt: now },
    }
    const projection = projectPhoneContext(state, 64)
    expect(projection.length).toBeLessThanOrEqual(64)
    expect(() => JSON.parse(projection)).not.toThrow()
  })
})

describe('typed trackers', () => {
  const rpStart = '2026-01-01T00:00:00.000Z'

  test('migrates a legacy numeric tracker without changing its value or rate', () => {
    const migrated = normalizeTracker({ id: 'old', label: 'Affinity', value: 42, min: 0, max: 100, unit: '%', ratePerHour: 2, lastUpdated: rpStart }, { roleplayNow: rpStart })!
    expect(migrated.kind).toBe('meter')
    expect(migrated.value).toBe(42)
    expect(migrated.ratePerHour).toBe(2)
    expect(migrated.clock).toBe('real')
    expect(migrated.target).toEqual({ type: 'custom', id: '', label: 'Unassigned' })
    expect(migrated.allowModelWrite).toBe(false)
  })

  test('real and roleplay clocks advance only from their own time source', () => {
    const base = normalizeTracker({
      label: 'Hunger', kind: 'meter', value: 10, initialValue: 10, min: 0, max: 100,
      updateMode: 'automatic', ratePerHour: 4, lastUpdated: rpStart, lastRoleplayAt: rpStart,
    }, { roleplayNow: rpStart })!
    const real = { ...base, clock: 'real' as const }
    const roleplay = { ...base, clock: 'roleplay' as const }
    expect(materializeTracker(real, rpStart, '2026-01-01T02:00:00.000Z').tracker.value).toBe(18)
    expect(materializeTracker(roleplay, rpStart, '2026-01-01T02:00:00.000Z').tracker.value).toBe(10)
    expect(materializeTracker(roleplay, '2026-01-01T03:00:00.000Z', '2026-01-01T00:00:01.000Z').tracker.value).toBe(22)
  })

  test('pauses an automatic roleplay tracker when roleplay time is not parseable', () => {
    const tracker = normalizeTracker({ label: 'Journey', kind: 'timer', value: 60, min: 0, max: 60, updateMode: 'automatic', ratePerHour: -60, clock: 'roleplay', lastRoleplayAt: rpStart }, { roleplayNow: rpStart })!
    const result = materializeTracker(tracker, 'later that evening')
    expect(result.tracker.value).toBe(60)
    expect(result.tracker.pausedReason).toContain('approximate')
    const resumed = materializeTracker({ ...result.tracker, lastRoleplayAt: '' }, '2026-01-02T00:00:00.000Z')
    expect(resumed.tracker.value).toBe(60)
    expect(resumed.tracker.lastRoleplayAt).toBe('2026-01-02T00:00:00.000Z')
  })

  test('applies operations, clamps values, labels semantic bands, and bounds history', () => {
    let tracker = normalizeTracker({ label: 'Health', kind: 'meter', value: 50, initialValue: 50, min: 0, max: 100, bands: [{ min: 0, max: 30, label: 'Critical', color: '#ff0000' }] }, { roleplayNow: rpStart })!
    tracker = applyTrackerOperation(tracker, { operation: 'add', amount: 900, reason: 'heal', source: 'user', roleplayNow: rpStart })
    expect(tracker.value).toBe(100)
    for (let index = 0; index < 55; index += 1) tracker = applyTrackerOperation(tracker, { operation: 'set', amount: index % 100, source: 'user' })
    expect(tracker.history.length).toBeLessThanOrEqual(40)
    tracker = applyTrackerOperation(tracker, { operation: 'set', amount: 10, source: 'user' })
    expect(trackerBand(tracker)?.label).toBe('Critical')
  })

  test('supports explicit state transitions and reset', () => {
    let tracker = normalizeTracker({ label: 'Condition', kind: 'state', state: 'Stable', initialState: 'Stable', states: ['Stable', 'Critical'] }, { roleplayNow: rpStart }) as PhoneTracker
    tracker = applyTrackerOperation(tracker, { operation: 'set_state', state: 'Critical', source: 'user' })
    expect(tracker.kind === 'state' && tracker.state).toBe('Critical')
    tracker = applyTrackerOperation(tracker, { operation: 'reset', source: 'user' })
    expect(tracker.kind === 'state' && tracker.state).toBe('Stable')
  })
})
