import { describe, expect, test } from 'bun:test'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { MODEL_CONTEXT_BUDGET, projectPhoneContext } from '../src/domain/projection.js'
import { calculatePhoneSurface } from '../src/frontend/surface.js'
import { applyTrackerOperation, materializeTracker, normalizeTracker, trackerBand } from '../src/domain/trackers.js'
import { normalizePocketRoute } from '../src/domain/navigation.js'
import { ensureDirectConversation, normalizeContactCollections } from '../src/domain/contacts.js'
import { activeNotifications, clearNotifications, destinationIsVisible, dismissNotification } from '../src/domain/notifications.js'
import { ambientEligibleContacts, contactCooldownReady } from '../src/domain/messaging.js'
import { PocketRouteHistory } from '../src/frontend/router.js'
import { parseGeneratedObject, parseWithTruncationRetry } from '../src/backend/structured.js'
import { assemblePocketContext, buildRoleplayContext } from '../src/backend/roleplay-context.js'
import type { PhoneState, PhoneTracker } from '../src/types.js'

describe('device preference schema', () => {
  test('migrates legacy settings without retaining arbitrary CSS', () => {
    const migrated = normalizePreferences({
      theme: 'rose', accent: '#ABCDEF', bezelColor: '#010203',
      wallpaper: 'url(javascript:alert(1))', chatWallpaper: 'var(--host-secret)',
      animation: 'slide', autoOpenOnModelAction: true,
    })
    expect(migrated.version).toBe(4)
    expect(migrated.colors.accent).toBe('#abcdef')
    expect(migrated.colors.bezel).toBe('#010203')
    expect(JSON.stringify(migrated)).not.toContain('javascript')
    expect(JSON.stringify(migrated)).not.toContain('--host-secret')
  })

  test('fails closed for unknown future schemas', () => {
    expect(normalizePreferences({ version: 999, handsetScale: 99 })).toEqual(defaultPreferences())
  })

  test('keeps handset geometry and UI density as separate semantic values', () => {
    const preferences = normalizePreferences({ version: 3, handsetScale: 1.2, uiScale: 0.7 })
    expect(preferences.handsetScale).toBe(1.2)
    expect(preferences.uiScale).toBe(0.7)
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
    expect(calculatePhoneSurface(.7, { width: 390, height: 844 })).toEqual(calculatePhoneSurface(1.3, { width: 390, height: 844 }))
  })
})

describe('structured generation', () => {
  test('accepts clean JSON, one fence, and one balanced top-level object', () => {
    expect(parseGeneratedObject('{"ok":true}')).toEqual({ ok: true })
    expect(parseGeneratedObject('```json\n{"ok":true}\n```')).toEqual({ ok: true })
    expect(parseGeneratedObject('Result: {"ok":true}')).toEqual({ ok: true })
  })

  test('retries only responses which appear truncated', async () => {
    let retries = 0
    expect(await parseWithTruncationRetry('{"ok":', async () => { retries += 1; return '{"ok":true}' })).toEqual({ ok: true })
    expect(retries).toBe(1)
    await expect(parseWithTruncationRetry('{ nope }', async () => { retries += 1; return '{"ok":true}' })).rejects.toThrow()
    expect(retries).toBe(1)
  })
})

describe('roleplay context bridge', () => {
  test('bounds recent RP and layers story state without full chat dumping', async () => {
    const now = '2026-01-01T00:00:00.000Z'
    const collections = normalizeContactCollections({ contacts: [{ id: 'zephyr', name: 'Zephyr', sceneNote: 'Walking toward the user.' }] }, { characterId: 'active', characterName: 'Active', now, makeId: (prefix) => `${prefix}-id` })
    const contact = collections.contacts.find((entry) => entry.id === 'zephyr')!
    const conversation = ensureDirectConversation(collections, contact.id, now, () => 'dm-zephyr')
    const state = { version: 5, chatId: 'chat', characterId: 'active', characterName: 'Active', roleplayNow: now, sceneSnapshot: null, pocketPersona: { source: 'manual', linkedPersonaId: '', displayName: 'You', pronouns: '', role: 'Persona', identityBrief: '', avatarUrl: '', accent: '#8b7dff', canAppear: false, updatedAt: now }, setup: { initialized: true, dismissed: false }, ...collections, notes: [], events: [], trackers: [], notifications: [], activities: [], processedCommands: [], updatedAt: now, weather: { location: 'Hall', condition: 'Dark', temperature: 20, unit: 'C', high: 20, low: 10, details: '', updatedAt: now } } as PhoneState
    const preferences = normalizePreferences({ version: 3, roleplayContextMode: 'smart', recentRoleplayMessages: 2 })
    const context = await buildRoleplayContext({ state, contact, conversation, preferences, getMessages: async () => [{ role: 'user', content: 'old' }, { role: 'assistant', content: 'recent one' }, { role: 'user', content: 'recent two' }] })
    expect(context).not.toContain('old')
    expect(context).toContain('RECENT ROLEPLAY')
    expect(context).toContain('STORY CONTEXT')
    expect(context.length).toBeLessThanOrEqual(10_500)
  })

  test('uses the latest committed host row without one-turn lag', async () => {
    const now = '2026-01-01T00:00:00.000Z'
    const collections = normalizeContactCollections({ contacts: [{ id: 'zephyr', name: 'Zephyr' }] }, { characterId: 'active', characterName: 'Active', now, makeId: (prefix) => `${prefix}-id` })
    const contact = collections.contacts.find((entry) => entry.id === 'zephyr')!
    const conversation = ensureDirectConversation(collections, contact.id, now, () => 'dm-zephyr')
    const state = { version: 5, chatId: 'chat', characterId: 'active', characterName: 'Active', roleplayNow: now, sceneSnapshot: null, pocketPersona: { source: 'manual', linkedPersonaId: '', displayName: 'You', pronouns: '', role: 'Persona', identityBrief: '', avatarUrl: '', accent: '#8b7dff', canAppear: false, updatedAt: now }, setup: { initialized: true, dismissed: false }, ...collections, notes: [], events: [], trackers: [], notifications: [], activities: [], processedCommands: [], updatedAt: now, weather: { location: 'Kitchen', condition: 'Clear', temperature: 20, unit: 'C', high: 20, low: 10, details: '', updatedAt: now } } as PhoneState
    const result = await assemblePocketContext({ state, contact, conversation, preferences: normalizePreferences({ roleplayContextMode: 'recent', recentRoleplayMessages: 2 }), getMessages: async () => [
      { id: 'BED-111', index_in_chat: 10, role: 'assistant', content: 'They remain beside the bed.' },
      { id: 'KITCHEN-222', index_in_chat: 11, role: 'assistant', content: 'They enter the kitchen and set down the keys.' },
    ] })
    expect(result.text).toContain('KITCHEN-222')
    expect(result.text).toContain('enter the kitchen')
    expect(result.diagnostics.authoritativeLatest.id).toBe('KITCHEN-222')
    expect(result.diagnostics.includedLatest.id).toBe('KITCHEN-222')
    expect(result.diagnostics.freshnessWarning).toBe('')
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
      version: 4, chatId: 'chat', characterId: 'character', characterName: 'Character', roleplayNow: now,
      contacts: Array.from({ length: 30 }, (_, contactIndex) => ({
        id: `c${contactIndex}`, name: `Contact ${contactIndex}`, role: 'NPC', description: 'x'.repeat(600), avatarUrl: '', accent: '#8b7dff',
        source: { kind: 'npc' as const, origin: 'manual' as const, description: 'x'.repeat(600) },
        presence: { inScene: true, lastSceneAt: now }, contextPolicy: { pinned: false }, generationPolicy: { relevant: true },
        messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' }, createdAt: now, updatedAt: now,
      })),
      conversations: Array.from({ length: 30 }, (_, contactIndex) => ({
        id: `d${contactIndex}`, kind: 'direct' as const, title: `Contact ${contactIndex}`, participantContactIds: [`c${contactIndex}`], unread: 0, createdAt: now, updatedAt: now,
        messages: Array.from({ length: 240 }, (_, messageIndex) => ({
          id: `m${contactIndex}-${messageIndex}`, sender: 'contact' as const, senderContactId: `c${contactIndex}`, senderName: `Contact ${contactIndex}`, senderAccent: '#8b7dff', text: 'private'.repeat(1_000), createdAt: now,
          read: true, status: 'read' as const,
        })),
      })),
      notes: Array.from({ length: 120 }, (_, index) => ({ id: `n${index}`, title: `Note ${index}`, body: 'y'.repeat(40_000), mood: '', pinned: true, author: 'character', createdAt: now, updatedAt: now })),
      events: [], weather: { location: 'Scene', condition: 'Clear', temperature: 20, unit: 'C', high: 22, low: 10, details: 'z'.repeat(2_000), updatedAt: now },
      trackers: [], notifications: [], activities: [], processedCommands: [], updatedAt: now,
    }
    const projection = projectPhoneContext(state)
    expect(projection.length).toBeLessThanOrEqual(MODEL_CONTEXT_BUDGET)
    expect(() => JSON.parse(projection)).not.toThrow()
    expect(projection).not.toContain('private')
  })

  test('uses a structural emergency fallback instead of slicing JSON', () => {
    const now = new Date().toISOString()
    const state: PhoneState = {
      version: 4, chatId: 'c', characterId: 'x', characterName: 'X', roleplayNow: 'R'.repeat(2_000),
      contacts: [], conversations: [], notes: [], events: [], trackers: [], notifications: [], activities: [], processedCommands: [], updatedAt: now,
      weather: { location: 'L'.repeat(2_000), condition: 'C'.repeat(2_000), temperature: 1, unit: 'C', high: 2, low: 0, details: 'D'.repeat(20_000), updatedAt: now },
    }
    const projection = projectPhoneContext(state, 64)
    expect(projection.length).toBeLessThanOrEqual(64)
    expect(() => JSON.parse(projection)).not.toThrow()
  })
})

describe('contacts and conversations', () => {
  test('migrates one legacy contact thread exactly once', () => {
    let sequence = 0
    const makeId = (prefix: string) => `${prefix}-${++sequence}`
    const legacy = {
      version: 2,
      contacts: [{ id: 'alice', name: 'Alice', subtitle: 'Friend', avatarUrl: '', unread: 1, messages: [{ id: 'hello', sender: 'character', text: 'Hi', createdAt: '2026-01-01T00:00:00.000Z', read: false, status: 'delivered' }] }],
    }
    const migrated = normalizeContactCollections(legacy, { characterId: 'alice', characterName: 'Alice', now: '2026-01-01T00:00:00.000Z', makeId })
    expect(migrated.contacts).toHaveLength(1)
    expect(migrated.conversations).toHaveLength(1)
    expect(migrated.conversations[0].messages[0]).toMatchObject({ sender: 'contact', senderContactId: 'alice', senderName: 'Alice' })
    const again = normalizeContactCollections({ version: 3, contacts: migrated.contacts, conversations: migrated.conversations }, { characterId: 'alice', characterName: 'Alice', now: '2026-01-01T00:00:00.000Z', makeId })
    expect(again.conversations).toHaveLength(1)
    expect(again.conversations[0].messages).toHaveLength(1)
  })

  test('reuses the existing direct conversation instead of duplicating it', () => {
    const state = normalizeContactCollections({}, { characterId: 'alice', characterName: 'Alice', now: '2026-01-01T00:00:00.000Z', makeId: (prefix) => `${prefix}-one` })
    const first = ensureDirectConversation(state, 'alice', '2026-01-01T00:00:00.000Z', () => 'unexpected')
    const second = ensureDirectConversation(state, 'alice', '2026-01-01T00:00:00.000Z', () => 'unexpected')
    expect(first.id).toBe(second.id)
    expect(state.conversations).toHaveLength(1)
  })

  test('retains a deleted source thread through sender snapshots', () => {
    const now = '2026-01-01T00:00:00.000Z'
    const normalized = normalizeContactCollections({
      version: 3,
      contacts: [],
      conversations: [{
        id: 'ghost-thread', kind: 'direct', title: 'Mira', participantContactIds: ['deleted-mira'], unread: 0, createdAt: now, updatedAt: now,
        messages: [{ id: 'ghost-message', sender: 'contact', senderContactId: 'deleted-mira', senderName: 'Mira', senderAccent: '#ef6f9a', text: 'Remember me.', createdAt: now, read: true, status: 'read' }],
      }],
    }, { characterId: 'alice', characterName: 'Alice', now, makeId: (prefix) => `${prefix}-active` })
    const thread = normalized.conversations.find((entry) => entry.id === 'ghost-thread')
    expect(thread?.messages[0]).toMatchObject({ senderName: 'Mira', senderAccent: '#ef6f9a', text: 'Remember me.' })
  })
})

describe('notification provenance and history routing', () => {
  test('suppresses only an exact visible message or tracker destination', () => {
    expect(destinationIsVisible(true, { app: 'messages', conversationId: 'a' }, { app: 'messages', conversationId: 'a' })).toBe(true)
    expect(destinationIsVisible(true, { app: 'messages', conversationId: 'a' }, { app: 'messages', conversationId: 'b' })).toBe(false)
    expect(destinationIsVisible(false, { app: 'trackers', trackerId: 'trust' }, { app: 'trackers', trackerId: 'trust' })).toBe(false)
  })

  test('dismiss and clear never mutate the routed domain object', () => {
    const notifications = [
      { id: 'n1', app: 'messages' as const, title: 'Alice', body: 'Hi', createdAt: '2026-01-01T00:00:00.000Z', read: false, route: { app: 'messages' as const, conversationId: 'dm' } },
      { id: 'n2', app: 'trackers' as const, title: 'Trust', body: '50', createdAt: '2026-01-01T00:00:00.000Z', read: true, route: { app: 'trackers' as const, trackerId: 'trust' } },
    ]
    const messages = [{ id: 'message', text: 'Hi' }]
    dismissNotification(notifications, 'n1', '2026-01-02T00:00:00.000Z')
    clearNotifications(notifications, 'read', '2026-01-02T00:00:00.000Z')
    expect(activeNotifications(notifications)).toHaveLength(0)
    expect(messages).toEqual([{ id: 'message', text: 'Hi' }])
  })

  test('tracks tracker config to detail to root to home', () => {
    const router = new PocketRouteHistory()
    router.navigate({ app: 'trackers' })
    router.navigate({ app: 'trackers', trackerId: 'trust', view: 'detail' })
    router.navigate({ app: 'trackers', trackerId: 'trust', view: 'config' })
    expect(router.back()).toEqual({ app: 'trackers', trackerId: 'trust', view: 'detail' })
    expect(router.back()).toEqual({ app: 'trackers' })
    expect(router.back()).toEqual({ app: 'home' })
  })
})

describe('ambient message eligibility', () => {
  test('excludes in-scene contacts while retaining off-scene eligible actors', () => {
    const now = '2026-01-02T00:00:00.000Z'
    const contacts = normalizeContactCollections({ version: 3, contacts: [
      { id: 'here', name: 'Here', presence: { inScene: true }, messagingPolicy: { remoteEligible: true } },
      { id: 'away', name: 'Away', presence: { inScene: false }, messagingPolicy: { remoteEligible: true } },
    ] }, { characterId: 'active', characterName: 'Active', now, makeId: (prefix) => `${prefix}-id` }).contacts
    expect(ambientEligibleContacts(contacts).map((entry) => entry.id)).toContain('away')
    expect(ambientEligibleContacts(contacts).map((entry) => entry.id)).not.toContain('here')
  })

  test('uses bounded wall/roleplay cooldowns when chronology is valid', () => {
    const contact = normalizeContactCollections({ version: 3, contacts: [{
      id: 'away', name: 'Away', presence: { inScene: false },
      messagingPolicy: { remoteEligible: true, lastInitiatedMessageAt: '2026-01-01T23:50:00.000Z', lastInitiatedRoleplayAt: '2026-01-01T23:00:00.000Z' },
    }] }, { characterId: 'active', characterName: 'Active', now: '2026-01-02T00:00:00.000Z', makeId: (prefix) => `${prefix}-id` }).contacts.find((entry) => entry.id === 'away')!
    expect(contactCooldownReady(contact, 'normal', '2026-01-02T00:00:00.000Z', Date.parse('2026-01-02T00:00:00.000Z'))).toBe(false)
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
