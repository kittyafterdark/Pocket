import { describe, expect, test } from 'bun:test'
import { defaultPreferences, normalizePreferences, normalizeWallpaper } from '../src/domain/preferences.js'
import { MODEL_CONTEXT_BUDGET, projectPhoneContext } from '../src/domain/projection.js'
import { calculatePhoneSurface } from '../src/frontend/surface.js'
import { applyTrackerOperation, materializeTracker, normalizeTracker, trackerBand } from '../src/domain/trackers.js'
import { normalizePocketRoute } from '../src/domain/navigation.js'
import { ensureDirectConversation, normalizeContactCollections } from '../src/domain/contacts.js'
import { ensureDirectActorConversation, ensureDiscoveredActor, ensureExternalDirectConversation, promoteDiscoveredActor, resolvePocketActor } from '../src/domain/actors.js'
import { activeNotifications, clearNotifications, destinationIsVisible, dismissNotification } from '../src/domain/notifications.js'
import { ambientEligibleContacts, contactCooldownReady } from '../src/domain/messaging.js'
import { actorPhoneMemoryContext, groupActorPhoneMemoryContext, normalizeActorMemories, upsertActorMemory } from '../src/domain/actor-memory.js'
import { generatedEventSuggestion, normalizeEventSuggestion } from '../src/domain/scheduler.js'
import { contactFromNpcBank, findNpcBankMatch, normalizeNpcBank, upsertNpcBankFromContact } from '../src/domain/npc-bank.js'
import { PocketRouteHistory } from '../src/frontend/router.js'
import { parseGeneratedObject, parseWithTruncationRetry } from '../src/backend/structured.js'
import { assemblePocketContext, buildRoleplayContext } from '../src/backend/roleplay-context.js'
import { sanitizeNarrativeContent } from '../src/backend/narrative-content.js'
import { conversationUnreadForDevice, conversationVisibleOnDevice, messageDirection } from '../src/domain/device.js'
import { conversationTailSnapshot, normalizeReplyDecision, pendingRelayContext, persistentHandoffContext, relayIdFromMessages } from '../src/backend/continuity.js'
import { createPocketReference, serializePocketReference } from '../src/backend/references.js'
import { resolvePocketImageSource } from '../src/backend/image-sources.js'
import type { PhoneState, PhoneTracker } from '../src/types.js'

describe('device preference schema', () => {
  test('migrates legacy settings without retaining arbitrary CSS', () => {
    const migrated = normalizePreferences({
      theme: 'rose', accent: '#ABCDEF', bezelColor: '#010203',
      wallpaper: 'url(javascript:alert(1))', chatWallpaper: 'var(--host-secret)',
      animation: 'slide', autoOpenOnModelAction: true,
    })
    expect(migrated.version).toBe(5)
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

  test('migrates wallpaper URLs into stable typed references without storing blobs', () => {
    const migrated = normalizePreferences({ version: 4, wallpaperImageUrl: 'https://example.test/home.png' })
    expect(migrated.homeWallpaper.source).toEqual({ kind: 'url', url: 'https://example.test/home.png' })
    expect(normalizeWallpaper({ source: { kind: 'asset', assetId: 'asset-1' }, focalX: 2, focalY: -.2, scrim: .4 })).toEqual({
      source: { kind: 'asset', assetId: 'asset-1' }, fit: 'cover', focalX: 1, focalY: 0, scrim: .4,
    })
    expect(JSON.stringify(migrated)).not.toContain('data:image')
  })
})

describe('conversation channel continuity', () => {
  test('normalizes impossible none to handoff before generation', () => {
    const now = '2026-01-01T00:00:00.000Z'
    const collections = normalizeContactCollections({ contacts: [{ id: 'z', name: 'Zephyr', presence: { inScene: true } }] }, { characterId: 'active', characterName: 'Active', now, makeId: (prefix) => `${prefix}-id` })
    const contact = collections.contacts.find((entry) => entry.id === 'z')!
    const conversation = ensureDirectConversation(collections, contact.id, now, (prefix) => `${prefix}-z`)
    const decision = normalizeReplyDecision({ rawAction: 'none', contact, conversation, explicitRemoteOverride: false, createdAt: now })
    expect(decision.normalizedAction).toBe('handoff')
    expect(decision.reason).toBe('in_scene')
    expect(decision.normalizationReason).toContain('actor_is_local')
  })

  test('keeps explicit local texting available and emits bounded pending relay context', () => {
    const now = '2026-01-01T00:00:00.000Z'
    const collections = normalizeContactCollections({ contacts: [{ id: 'z', name: 'Zephyr', presence: { inScene: true } }] }, { characterId: 'active', characterName: 'Active', now, makeId: (prefix) => `${prefix}-id` })
    const contact = collections.contacts.find((entry) => entry.id === 'z')!
    const conversation = ensureDirectConversation(collections, contact.id, now, (prefix) => `${prefix}-z`)
    expect(normalizeReplyDecision({ rawAction: 'none', contact, conversation, explicitRemoteOverride: true, createdAt: now }).normalizedAction).toBe('none')
    conversation.messages.push({ id: 'm1', sender: 'persona', senderName: 'You', senderAccent: '', text: 'Come in.', createdAt: now, read: true, status: 'sent' })
    const snapshot = conversationTailSnapshot(conversation, now)
    const state = { pocketPersona: { displayName: 'You' }, contacts: collections.contacts, relays: [{ id: 'r1', chatId: 'c', characterId: 'active', contactId: 'z', conversationId: conversation.id, burstId: 'burst-1', reason: 'in_scene', actorState: 'in_scene', conversationTail: snapshot, latestExchange: snapshot.text, timelineEventId: 'e1', createdAt: now, status: 'pending', continuation: { state: 'idle' } }] } as unknown as PhoneState
    expect(pendingRelayContext(state)).toBe('', 'ordinary generations must not receive unrelated pending relays')
    const relayContext = pendingRelayContext(state, { relayId: 'r1' })
    expect(relayContext).toContain('POCKET CONTINUITY RELAY — NEWER STATE')
    expect(relayContext).toContain('You: Come in.')
    expect(relayContext.length).toBeLessThanOrEqual(3_600)
    expect(relayIdFromMessages([{ sourceMessageMetadata: { pocketContinuation: true, pocketRelayId: 'r1' } }])).toBe('r1')
    state.relays[0].status = 'consumed'
    expect(pendingRelayContext(state, { relayId: 'r1' })).toBe('')
  })

  test('keeps a completed handoff as shared RP history after the one-shot relay is consumed', () => {
    const now = '2026-01-01T00:00:00.000Z'
    const collections = normalizeContactCollections({ contacts: [{ id: 'shoto', name: 'Shoto Todoroki' }] }, { characterId: 'active', characterName: 'Shoto Todoroki', now, makeId: (prefix) => `${prefix}-id` })
    const conversation = ensureDirectConversation(collections, 'shoto', now, (prefix) => `${prefix}-shoto`)
    conversation.messages.push(
      { id: 'm1', sender: 'persona', senderName: 'Katsuki Bakugo', senderAccent: '', text: "I'm fucking dead.", createdAt: now, read: true, status: 'sent' },
      { id: 'm2', sender: 'persona', senderName: 'Katsuki Bakugo', senderAccent: '', text: "I'm close, ten minutes.", createdAt: now, read: true, status: 'sent' },
      { id: 'm3', sender: 'contact', senderContactId: 'shoto', senderName: 'Shoto Todoroki', senderAccent: '', text: "Understood. I'll have the food ready.", createdAt: now, read: true, status: 'read' },
    )
    const snapshot = conversationTailSnapshot(conversation, now)
    const state = {
      pocketPersona: { displayName: 'Katsuki Bakugo' },
      contacts: collections.contacts,
      relays: [{
        id: 'relay-shoto', chatId: 'chat', characterId: 'active', contactId: 'shoto', conversationId: conversation.id,
        reason: 'continued_in_person', actorState: 'continued_in_person', conversationTail: snapshot, latestExchange: snapshot.text,
        timelineEventId: 'event-shoto', createdAt: now, status: 'consumed', consumedAt: now, consumedMessageId: 'rp-1',
        continuation: { state: 'completed', generationId: 'gen-1', generationCompletedAt: now },
      }],
    } as unknown as PhoneState

    expect(pendingRelayContext(state, { relayId: 'relay-shoto' })).toBe('')
    const persisted = persistentHandoffContext(state)
    expect(persisted).toContain('POCKET HANDOFF MEMORY — ESTABLISHED SHARED HISTORY')
    expect(persisted).toContain("Katsuki Bakugo: I'm fucking dead.")
    expect(persisted).toContain("Shoto Todoroki: Understood. I'll have the food ready.")
    expect(persisted).toContain('Both participants may remember and act on what was directly said here')
    expect(persisted).toContain('current roleplay transcript is newer authority for present location')
    expect(persisted).toContain('Do not replay, resend, or re-enact these phone messages')
    expect(persisted.length).toBeLessThanOrEqual(2_600)
  })

  test('serializes one-shot phone context without implying scene presence', () => {
    const now = '2026-01-01T00:00:00.000Z'
    const collections = normalizeContactCollections({ contacts: [{ id: 'mizi', name: 'Mizi', role: 'Friend', identityBrief: 'Loud and opinionated.' }] }, { characterId: 'active', characterName: 'Ivan', now, makeId: (prefix) => `${prefix}-id` })
    const conversation = {
      id: 'gc-disaster', kind: 'group' as const, title: 'Disaster GC', participantActorIds: ['mizi'], participantContactIds: ['mizi'], unread: 0,
      availability: { state: 'remote' as const }, createdAt: now, updatedAt: now,
      messages: Array.from({ length: 10 }, (_, index) => ({
        id: `message-${index}`, sender: 'contact' as const, senderContactId: 'mizi', senderName: 'Mizi', senderAccent: '#ff00aa',
        text: `Message ${index} ${'chaos '.repeat(90)}`, createdAt: now, read: true, status: 'read' as const,
      })),
    }
    const state = {
      version: 10, chatId: 'chat', characterId: 'active', characterName: 'Ivan', roleplayNow: now,
      pocketPersona: { displayName: 'You' }, contacts: collections.contacts, discoveredActors: [], conversations: [conversation], references: [],
    } as unknown as PhoneState
    const reference = createPocketReference({ state, conversation, scope: 'conversation', createdAt: now, makeId: () => 'reference-1' })
    expect(reference.messages).toHaveLength(8)
    const serialized = serializePocketReference(reference, 1_500)
    expect(serialized.length).toBeLessThanOrEqual(1_500)
    expect(serialized).toContain('POCKET USER REFERENCE — THIS TURN')
    expect(serialized).toContain('does not hand off the conversation')
    expect(serialized).toContain('Do not assume a scene actor')
    expect(serialized).toContain('=== END POCKET USER REFERENCE ===')
  })
})

describe('message event suggestions', () => {
  test('keeps name-only participants valid and preserves scheduling state', () => {
    const suggestion = normalizeEventSuggestion({
      id: 's1',
      kind: 'event',
      status: 'scheduled',
      title: 'Dinner after work',
      whenKind: 'relative',
      whenText: 'In an hour',
      participants: ['Mina Ashido', 'Yaoyorozu Momo', 'Mina Ashido'],
      scheduledEventId: 'evt1',
    }, (prefix) => `${prefix}-generated`)

    expect(suggestion?.participantNames).toEqual(['Mina Ashido', 'Yaoyorozu Momo'])
    expect(suggestion?.status).toBe('scheduled')
    expect(suggestion?.scheduledEventId).toBe('evt1')
  })

  test('generated suggestions always start pending', () => {
    const suggestion = generatedEventSuggestion({
      id: 'model-id',
      kind: 'event',
      status: 'scheduled',
      title: 'Gym tomorrow',
      whenKind: 'approximate',
      whenText: 'Tomorrow morning',
      participants: ['Denki Kaminari', 'Katsuki Bakugo'],
    }, (prefix) => `${prefix}-generated`)

    expect(suggestion?.status).toBe('pending')
    expect(suggestion?.scheduledEventId).toBeUndefined()
  })
})

describe('actor phone memory', () => {
  test('keeps DM knowledge with the actors who actually saw it', () => {
    let memories = normalizeActorMemories([])
    memories = upsertActorMemory(memories, {
      id: 'memory-1',
      conversationId: 'dm-mina',
      conversationTitle: 'Mina Ashido',
      conversationKind: 'direct',
      messageId: 'message-1',
      speakerActorId: 'mina',
      speakerName: 'Mina Ashido',
      text: "We're eating out; I'll add you to the list.",
      knownByActorIds: ['mina', 'persona:kats'],
      knownByNames: ['Mina Ashido', 'Katsuki Bakugo'],
      createdAt: '2026-09-04T05:42:00.000Z',
    })

    expect(actorPhoneMemoryContext(memories, {
      actorIds: ['mina'], actorNames: ['Mina Ashido'], actorName: 'Mina Ashido', excludeConversationId: 'gc-bakusquad',
    })).toContain("I'll add you to the list")

    expect(actorPhoneMemoryContext(memories, {
      actorIds: ['denki'], actorNames: ['Denki Kaminari'], actorName: 'Denki Kaminari', excludeConversationId: 'gc-bakusquad',
    })).toBe('')
  })

  test('excludes the current thread and partitions group memory by speaker', () => {
    const memories = normalizeActorMemories([
      {
        id: 'm1', conversationId: 'dm-mina', conversationTitle: 'Mina Ashido', conversationKind: 'direct',
        messageId: 'msg1', speakerActorId: 'mina', speakerName: 'Mina Ashido', text: 'Dinner after work.',
        knownByActorIds: ['mina', 'persona:kats'], knownByNames: ['Mina Ashido', 'Katsuki Bakugo'], createdAt: '2026-09-04T05:42:00.000Z',
      },
      {
        id: 'm2', conversationId: 'dm-denki', conversationTitle: 'Denki Kaminari', conversationKind: 'direct',
        messageId: 'msg2', speakerActorId: 'denki', speakerName: 'Denki Kaminari', text: 'Gym tomorrow?',
        knownByActorIds: ['denki', 'persona:kats'], knownByNames: ['Denki Kaminari', 'Katsuki Bakugo'], createdAt: '2026-09-04T05:43:00.000Z',
      },
      {
        id: 'm3', conversationId: 'gc-bakusquad', conversationTitle: 'Bakusquad', conversationKind: 'group',
        messageId: 'msg3', speakerActorId: 'mina', speakerName: 'Mina Ashido', text: 'Current GC line.',
        knownByActorIds: ['mina', 'denki', 'persona:kats'], knownByNames: ['Mina Ashido', 'Denki Kaminari', 'Katsuki Bakugo'], createdAt: '2026-09-04T05:44:00.000Z',
      },
    ])

    const grouped = groupActorPhoneMemoryContext(memories, [
      { actorIds: ['mina'], actorNames: ['Mina Ashido'], name: 'Mina Ashido' },
      { actorIds: ['denki'], actorNames: ['Denki Kaminari'], name: 'Denki Kaminari' },
    ], 'gc-bakusquad')

    expect(grouped).toContain('PRIVATE ACTOR PHONE MEMORY — KNOWLEDGE PARTITIONS')
    expect(grouped).toContain('Mina Ashido')
    expect(grouped).toContain('Dinner after work.')
    expect(grouped).toContain('Denki Kaminari')
    expect(grouped).toContain('Gym tomorrow?')
    expect(grouped).not.toContain('Current GC line.')
    expect(grouped).toContain('Each speaker may use ONLY the memory listed under their own name.')
  })

  test('deduplicates retried message ids during normalization', () => {
    const memories = normalizeActorMemories([
      {
        id: 'old', conversationId: 'dm', conversationTitle: 'DM', conversationKind: 'direct',
        messageId: 'same', speakerActorId: 'mina', speakerName: 'Mina', text: 'Old',
        knownByActorIds: ['mina'], knownByNames: ['Mina'], createdAt: '2026-09-04T05:40:00.000Z',
      },
      {
        id: 'new', conversationId: 'dm', conversationTitle: 'DM', conversationKind: 'direct',
        messageId: 'same', speakerActorId: 'mina', speakerName: 'Mina', text: 'New',
        knownByActorIds: ['mina'], knownByNames: ['Mina'], createdAt: '2026-09-04T05:41:00.000Z',
      },
    ])
    expect(memories).toHaveLength(1)
    expect(memories[0].text).toBe('New')
  })
})
describe('Pocket image source resolution', () => {
  test('uses one resolver for gallery, uploaded assets, and cached URL images', async () => {
    const cache = new Map<string, unknown>()
    const images = new Map([
      ['gallery-1', { id: 'gallery-1', mime_type: 'image/png', url: '/api/v1/images/gallery-1' }],
      ['asset-1', { id: 'asset-1', mime_type: 'image/webp', url: '/api/v1/images/asset-1' }],
    ])
    const api = {
      permissions: { has: (permission: string) => permission === 'images' || permission === 'cors_proxy' },
      userStorage: {
        getJson: async (path: string, options: { fallback: unknown }) => structuredClone(cache.get(path) ?? options.fallback),
        setJson: async (path: string, value: unknown) => { cache.set(path, structuredClone(value)) },
      },
      images: {
        get: async (id: string) => images.get(id) || null,
        uploadFromDataUrl: async () => {
          images.set('remote-cache-1', { id: 'remote-cache-1', mime_type: 'image/png', url: '/api/v1/images/remote-cache-1' })
          return images.get('remote-cache-1')!
        },
      },
      cors: async () => ({ status: 200, statusText: 'OK', headers: { 'content-type': 'image/png' }, body: 'iVBORw0KGgo=', encoding: 'base64' }),
    } as any
    expect((await resolvePocketImageSource(api, { kind: 'gallery', imageId: 'gallery-1' })).url).toBe('/api/v1/images/gallery-1')
    expect((await resolvePocketImageSource(api, { kind: 'asset', assetId: 'asset-1' })).url).toBe('/api/v1/images/asset-1')
    const remote = await resolvePocketImageSource(api, { kind: 'url', url: 'https://example.test/wall.png' })
    expect(remote).toMatchObject({ status: 'ready', sourceKind: 'url', url: '/api/v1/images/remote-cache-1' })
    expect(JSON.stringify(cache.get('device/pocket-image-url-cache.json'))).toContain('remote-cache-1')
  })

  test('surfaces a source-specific resolution error', async () => {
    const api = { permissions: { has: () => true }, images: { get: async () => null }, userStorage: {}, cors: async () => null } as any
    expect(await resolvePocketImageSource(api, { kind: 'asset', assetId: 'missing' })).toMatchObject({ status: 'error', sourceKind: 'asset' })
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

describe('narrative reconciliation hygiene', () => {
  test('drops structured and wrapped reasoning/tool scaffolding without classifying ordinary prose', () => {
    expect(sanitizeNarrativeContent([
      { type: 'reasoning', text: 'I should call the tool.' },
      { type: 'text', text: 'Visible narrative.' },
      { type: 'tool_result', content: 'hidden result' },
    ])).toBe('Visible narrative.')
    expect(sanitizeNarrativeContent('Before.\n<think>secret chain</think>\nAfter.')).toBe('Before.\n\nAfter.')
    expect(sanitizeNarrativeContent('<lumi-phone action="message">{"text":"hidden"}</lumi-phone>Visible.')).toBe('Visible.')
    expect(sanitizeNarrativeContent('I should call Marcus before sunrise.')).toBe('I should call Marcus before sunrise.')
  })

  test('projects approximate narrative time instead of a stale exact Pocket timestamp', () => {
    const state = {
      roleplayNow: '2026-09-04T21:39:03.137Z',
      roleplayClockSource: 'narrative',
      roleplayClockPrecision: 'approximate',
      roleplayClockLabel: 'around 3–4 AM',
      stateRevision: 7,
      contacts: [],
      discoveredActors: [],
      trackers: [],
      events: [],
      notes: [],
      weather: { location: 'Diner', condition: 'Clear', temperature: 20, unit: 'C', high: 20, low: 10, details: 'Clear conditions.', updatedAt: '2026-09-05T04:00:00.000Z' },
    } as unknown as PhoneState
    const projected = JSON.parse(projectPhoneContext(state))
    expect(projected.roleplayNow).toBe('around 3–4 AM')
    expect(projected.roleplayClock).toEqual({ source: 'narrative', precision: 'approximate', label: 'around 3–4 AM' })
    expect(projected.stateRevision).toBe(7)
  })

  test('sanitizes recent host RP before it enters phone-generation context', async () => {
    const now = '2026-01-01T00:00:00.000Z'
    const collections = normalizeContactCollections({ contacts: [{ id: 'zephyr', name: 'Zephyr' }] }, { characterId: 'active', characterName: 'Active', now, makeId: (prefix) => `${prefix}-id` })
    const contact = collections.contacts.find((entry) => entry.id === 'zephyr')!
    const conversation = ensureDirectConversation(collections, contact.id, now, () => 'dm-zephyr')
    const state = {
      version: 10, chatId: 'chat', characterId: 'active', characterName: 'Active', roleplayNow: now, sceneSnapshot: null,
      pocketPersona: { source: 'manual', linkedPersonaId: '', displayName: 'You', pronouns: '', role: 'Persona', identityBrief: '', avatarUrl: '', accent: '#8b7dff', canAppear: false, updatedAt: now },
      setup: { initialized: true, dismissed: false }, contacts: collections.contacts, discoveredActors: [], conversations: collections.conversations,
      actorMemoryVersion: 1, actorMemories: [], notes: [], events: [], relays: [], references: [], groupBatches: [], trackers: [], notifications: [], activities: [], processedCommands: [],
      updatedAt: now, weather: { location: 'Hall', condition: 'Clear', temperature: 20, unit: 'C', high: 20, low: 10, details: '', updatedAt: now },
    } as PhoneState
    const result = await assemblePocketContext({
      state, contact, conversation,
      preferences: normalizePreferences({ roleplayContextMode: 'recent', recentRoleplayMessages: 2 }),
      getMessages: async () => [
        { id: 'reasoning-row', role: 'assistant', content: [{ type: 'reasoning', text: 'Call Pocket again.' }, { type: 'text', text: 'Kai slips out through the back door.' }] },
      ],
    })
    expect(result.text).toContain('Kai slips out through the back door.')
    expect(result.text).not.toContain('Call Pocket again.')
    expect(result.diagnostics.authoritativeLatest.excerpt).toContain('Kai slips out')
  })
})

describe('phone channel ownership', () => {
  test('keeps DM recipient ownership authoritative across unrelated actor mentions', async () => {
    const now = '2026-01-01T00:00:00.000Z'
    const collections = normalizeContactCollections({ contacts: [
      { id: 'mina', name: 'Mina Ashido' },
      { id: 'shoto', name: 'Shoto Todoroki' },
    ] }, { characterId: 'active', characterName: 'Active', now, makeId: (prefix) => `${prefix}-id` })
    const mina = collections.contacts.find((entry) => entry.id === 'mina')!
    const conversation = ensureDirectConversation(collections, mina.id, now, () => 'dm-mina')
    conversation.messages.push({
      id: 'm1', sender: 'contact', senderActorId: 'mina', senderContactId: 'mina', senderName: 'Mina Ashido', senderAccent: '',
      text: 'You got this, Shoto!', createdAt: now, read: true, status: 'read',
    })
    const state = {
      version: 10, chatId: 'chat', characterId: 'active', characterName: 'Active', roleplayNow: now, sceneSnapshot: null,
      pocketPersona: { source: 'manual', linkedPersonaId: '', displayName: 'Bakugo', pronouns: '', role: 'Persona', identityBrief: '', avatarUrl: '', accent: '#8b7dff', canAppear: false, updatedAt: now },
      setup: { initialized: true, dismissed: false }, contacts: collections.contacts, discoveredActors: [], conversations: collections.conversations,
      notes: [], events: [], relays: [], references: [], groupBatches: [], trackers: [], notifications: [], activities: [], processedCommands: [],
      updatedAt: now, weather: { location: 'Agency', condition: 'Clear', temperature: 20, unit: 'C', high: 20, low: 10, details: '', updatedAt: now },
    } as PhoneState
    const context = await buildRoleplayContext({ state, contact: mina, conversation, preferences: normalizePreferences({ roleplayContextMode: 'off' }) })
    expect(context).toContain('FINAL CHANNEL LOCK')
    expect(context).toContain('PERSONA / PHONE OWNER / RECIPIENT: Bakugo')
    expect(context).toContain('CONTACT / GENERATED SPEAKER: Mina Ashido')
    expect(context).toContain('TARGET LOCK: Mina Ashido is writing this phone message TO Bakugo')
    expect(context).toContain('Other actors may be discussed as third parties.')
  })

  test('keeps removed group members as labeled history without treating them as current', async () => {
    const now = '2026-01-01T00:00:00.000Z'
    const collections = normalizeContactCollections({ contacts: [
      { id: 'mina', name: 'Mina Ashido' },
      { id: 'shoto', name: 'Shoto Todoroki' },
      { id: 'kirishima', name: 'Eijiro Kirishima' },
    ] }, { characterId: 'active', characterName: 'Active', now, makeId: (prefix) => `${prefix}-id` })
    const mina = collections.contacts.find((entry) => entry.id === 'mina')!
    const conversation = {
      id: 'gc', kind: 'group' as const, title: 'GC',
      participantActorIds: ['mina', 'kirishima'], participantContactIds: ['mina', 'kirishima'],
      messages: [
        { id: 'old', sender: 'contact' as const, senderActorId: 'shoto', senderContactId: 'shoto', senderName: 'Shoto Todoroki', senderAccent: '', text: 'Old line.', createdAt: now, read: true, status: 'read' as const },
        { id: 'new', sender: 'contact' as const, senderActorId: 'mina', senderContactId: 'mina', senderName: 'Mina Ashido', senderAccent: '', text: 'Current line.', createdAt: now, read: true, status: 'read' as const },
      ],
      unread: 0, availability: { state: 'remote' as const }, createdAt: now, updatedAt: now,
    }
    const state = {
      version: 10, chatId: 'chat', characterId: 'active', characterName: 'Active', roleplayNow: now, sceneSnapshot: null,
      pocketPersona: { source: 'manual', linkedPersonaId: '', displayName: 'Bakugo', pronouns: '', role: 'Persona', identityBrief: '', avatarUrl: '', accent: '#8b7dff', canAppear: false, updatedAt: now },
      setup: { initialized: true, dismissed: false }, contacts: collections.contacts, discoveredActors: [], conversations: [conversation],
      notes: [], events: [], relays: [], references: [], groupBatches: [], trackers: [], notifications: [], activities: [], processedCommands: [],
      updatedAt: now, weather: { location: 'Agency', condition: 'Clear', temperature: 20, unit: 'C', high: 20, low: 10, details: '', updatedAt: now },
    } as PhoneState
    const context = await buildRoleplayContext({ state, contact: mina, conversation, preferences: normalizePreferences({ roleplayContextMode: 'off' }) })
    expect(context).toContain('CURRENT GROUP ACTORS: Mina Ashido, Eijiro Kirishima')
    expect(context).toContain('CURRENT CHANNEL MEMBERS: Bakugo, Mina Ashido, Eijiro Kirishima')
    expect(context).toContain('Shoto Todoroki [former participant; historical only]: Old line.')
    expect(context).toContain('Mina Ashido: Current line.')
    expect(context).toContain('A former/absent actor may be discussed as a third party')
  })
})

describe('Pocket routes', () => {
  test('normalizes typed deep links and rejects unknown apps', () => {
    expect(normalizePocketRoute({ app: 'trackers', trackerId: 'trust', view: 'config' })).toEqual({ app: 'trackers', trackerId: 'trust', view: 'config' })
    expect(normalizePocketRoute({ app: 'messages', contactId: 'alice', messageId: 'message-1' })).toEqual({ app: 'messages', contactId: 'alice', messageId: 'message-1' })
    expect(normalizePocketRoute({ app: 'contacts', view: 'draft' })).toEqual({ app: 'contacts', contactId: undefined, view: 'draft' })
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
  test('keeps discovered actors lightweight until promotion and preserves actor identity', () => {
    const now = '2026-01-01T00:00:00.000Z'
    let sequence = 0
    const makeId = (prefix: string) => `${prefix}-${++sequence}`
    const collections = normalizeContactCollections({}, { characterId: 'active', characterName: 'Active', now, makeId })
    const state = {
      chatId: 'chat-a', contacts: collections.contacts, conversations: collections.conversations, discoveredActors: [],
    } as unknown as PhoneState
    const maya = ensureDiscoveredActor(state, { name: 'Maya', source: 'model-tool', now, makeId })
    const sameMaya = ensureDiscoveredActor(state, { name: '  MAYA  ', source: 'group-chat', relationship: 'close', now, makeId })
    expect(sameMaya.id).toBe(maya.id)
    expect(sameMaya.relationship).toBe('close')
    expect(state.contacts.some((contact) => contact.name === 'Maya')).toBe(false)
    const conversation = ensureDirectActorConversation(state, maya.id, now, makeId)
    expect(conversation.participantActorIds).toEqual([maya.id])
    expect(conversation.participantContactIds).toEqual([])
    conversation.messages.push({
      id: 'maya-message', sender: 'contact', senderActorId: maya.id, senderActorKind: 'discovered', senderName: 'Maya', senderAccent: '#000000', text: 'Hi.', createdAt: now, read: true, status: 'read',
    })
    const contact = promoteDiscoveredActor(state, maya.id, now, makeId)
    expect(resolvePocketActor(state, maya.id)?.contact?.id).toBe(contact.id)
    expect(conversation.messages[0].senderActorId).toBe(maya.id)
    expect(conversation.messages[0].senderContactId).toBeUndefined()
    expect(conversation.participantContactIds).toEqual([contact.id])
  })

  test('migrates one legacy contact thread exactly once', () => {
    let sequence = 0
    const makeId = (prefix: string) => `${prefix}-${++sequence}`
    const legacy = {
      version: 2,
      contacts: [{ id: 'alice', name: 'Alice', subtitle: 'Friend', avatarUrl: '', unread: 1, messages: [{ id: 'hello', sender: 'character', text: 'Hi', createdAt: '2026-01-01T00:00:00.000Z', read: false, status: 'delivered' }] }],
    }
    const migrated = normalizeContactCollections(legacy, { characterId: 'alice', characterName: 'Alice', now: '2026-01-01T00:00:00.000Z', makeId })
    expect(migrated.contacts).toHaveLength(1)
    expect(migrated.contacts[0].messagingStyle).toEqual({ talkativeness: 50, fragmentation: 35 })
    expect(migrated.conversations).toHaveLength(1)
    expect(migrated.conversations[0].messages[0]).toMatchObject({ sender: 'contact', senderContactId: 'alice', senderName: 'Alice' })
    const again = normalizeContactCollections({ version: 3, contacts: migrated.contacts, conversations: migrated.conversations }, { characterId: 'alice', characterName: 'Alice', now: '2026-01-01T00:00:00.000Z', makeId })
    expect(again.conversations).toHaveLength(1)
    expect(again.conversations[0].messages).toHaveLength(1)
  })

  test('normalizes independent participation and fragmentation preferences', () => {
    const now = '2026-01-01T00:00:00.000Z'
    const contacts = normalizeContactCollections({ contacts: [{
      id: 'stylist', name: 'Stylist', messagingStyle: { talkativeness: 140, fragmentation: -20 },
    }] }, { characterId: 'active', characterName: 'Active', now, makeId: (prefix) => `${prefix}-id` }).contacts
    expect(contacts.find((entry) => entry.id === 'stylist')?.messagingStyle).toEqual({ talkativeness: 100, fragmentation: 0 })
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

describe('route settlement', () => {
  test('collapses a successful contact edit onto the existing detail route', () => {
    const router = new PocketRouteHistory()
    router.navigate({ app: 'contacts' })
    router.navigate({ app: 'contacts', contactId: 'mina', view: 'detail' })
    router.navigate({ app: 'contacts', contactId: 'mina', view: 'config' })
    expect(router.settle({ app: 'contacts', contactId: 'mina', view: 'detail' })).toEqual({ app: 'contacts', contactId: 'mina', view: 'detail' })
    expect(router.back()).toEqual({ app: 'contacts', contactId: undefined, view: undefined })
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


describe('NPC bank', () => {
  const now = '2026-01-01T00:00:00.000Z'
  const later = '2026-02-01T00:00:00.000Z'
  const rawEntry = {
    id: 'npcbank-maya',
    name: 'Maya Sato',
    normalizedName: 'maya sato',
    aliases: ['Maya'],
    role: 'Operations coordinator',
    identityBrief: 'Dry, efficient, observant, and protective of her team.',
    avatarUrl: '',
    accent: '#8b7dff',
    messagingStyle: { talkativeness: 58, fragmentation: 28 },
    tags: [],
    createdAt: now,
    updatedAt: now,
  }

  test('matches a canonical NPC by exact alias without fuzzy identity bleed', () => {
    const bank = normalizeNpcBank({ version: 1, entries: [rawEntry], updatedAt: now }, now)
    expect(findNpcBankMatch(bank, 'Maya')?.id).toBe('npcbank-maya')
    expect(findNpcBankMatch(bank, 'maya sato')?.id).toBe('npcbank-maya')
    expect(findNpcBankMatch(bank, 'May')).toBeNull()
  })

  test('instantiates a bank profile with fresh per-roleplay state', () => {
    const bank = normalizeNpcBank({ version: 1, entries: [rawEntry], updatedAt: now }, now)
    const contact = contactFromNpcBank(bank.entries[0], later, () => 'contact-local')
    expect(contact).toMatchObject({
      id: 'contact-local',
      name: 'Maya Sato',
      sceneNote: '',
      relationship: 'background',
      presence: { inScene: false, lastSceneAt: '' },
      messagingStyle: { talkativeness: 58, fragmentation: 28 },
    })
    expect(contact.source.kind).toBe('npc')
    if (contact.source.kind === 'npc') expect(contact.source.bankId).toBe('npcbank-maya')
  })

  test('saving canonical identity never serializes scene state and preserves renamed aliases', () => {
    const bank = normalizeNpcBank(null, now)
    const seed = normalizeNpcBank({ version: 1, entries: [rawEntry], updatedAt: now }, now).entries[0]
    const contact = contactFromNpcBank(seed, now, () => 'contact-local')
    contact.sceneNote = 'Currently carrying a stack of patrol reports.'
    contact.presence = { inScene: true, lastSceneAt: later }
    const first = upsertNpcBankFromContact(bank, contact, now, () => 'npcbank-new')
    expect((first as any).sceneNote).toBeUndefined()
    if (contact.source.kind === 'npc') contact.source.bankId = first.id
    contact.name = 'Maya Ishikawa'
    const renamed = upsertNpcBankFromContact(bank, contact, later, () => 'unexpected')
    expect(renamed.id).toBe(first.id)
    expect(renamed.aliases).toContain('Maya Sato')
  })

  test('bank linkage survives ordinary contact normalization', () => {
    const bank = normalizeNpcBank({ version: 1, entries: [rawEntry], updatedAt: now }, now)
    const contact = contactFromNpcBank(bank.entries[0], now, () => 'contact-bank')
    const normalized = normalizeContactCollections({ contacts: [contact], conversations: [] }, {
      characterId: 'alice', characterName: 'Alice', now, makeId: (prefix) => `${prefix}-fallback`,
    })
    const restored = normalized.contacts.find((entry) => entry.id === 'contact-bank')
    expect(restored?.source.kind).toBe('npc')
    if (restored?.source.kind === 'npc') expect(restored.source.bankId).toBe('npcbank-maya')
  })
})


describe('Pocket device projections', () => {
  test('projects external direct messages only onto participating actor devices', () => {
    const now = '2026-09-05T12:00:00.000Z'
    const state = {
      chatId: 'chat-a', characterId: 'char-a', pocketPersonaActorId: 'persona:kai',
      pocketPersona: { displayName: 'Kai', role: 'Persona', identityBrief: '', accent: '#8b7dff', avatarUrl: '', linkedPersonaId: '' },
      contacts: [],
      discoveredActors: [
        { id: 'actor-marcus', chatId: 'chat-a', displayName: 'Marcus', normalizedName: 'marcus', firstSeenAt: now, lastSeenAt: now, source: 'model-tool', relationship: 'background' },
        { id: 'actor-tyler', chatId: 'chat-a', displayName: 'Tyler', normalizedName: 'tyler', firstSeenAt: now, lastSeenAt: now, source: 'model-tool', relationship: 'close' },
      ],
      conversations: [],
    } as unknown as PhoneState
    const conversation = ensureExternalDirectConversation(state, 'actor-marcus', 'actor-tyler', now, (prefix) => `${prefix}-external`)
    conversation.messages.push({
      id: 'm-external', sender: 'contact', senderActorId: 'actor-marcus', senderName: 'Marcus', senderAccent: '',
      recipientActorIds: ['actor-tyler'], readByActorIds: ['actor-marcus'], text: 'Track him. Send the pin.', createdAt: now, read: false, status: 'delivered',
    })

    expect(conversation.includesPocketPersona).toBe(false)
    expect(conversationVisibleOnDevice(state, conversation, 'persona:kai')).toBe(false)
    expect(conversationVisibleOnDevice(state, conversation, 'actor-marcus')).toBe(true)
    expect(conversationVisibleOnDevice(state, conversation, 'actor-tyler')).toBe(true)
    expect(messageDirection(state, conversation, conversation.messages[0], 'persona:kai')).toBe('external')
    expect(messageDirection(state, conversation, conversation.messages[0], 'actor-marcus')).toBe('outbound')
    expect(messageDirection(state, conversation, conversation.messages[0], 'actor-tyler')).toBe('inbound')
    expect(conversationUnreadForDevice(state, conversation, 'actor-marcus')).toBe(0)
    expect(conversationUnreadForDevice(state, conversation, 'actor-tyler')).toBe(1)
    conversation.messages[0].readByActorIds!.push('actor-tyler')
    expect(conversationUnreadForDevice(state, conversation, 'actor-tyler')).toBe(0)
  })

  test('a suppressed linked character contact stays deleted until explicitly re-imported', () => {
    const now = '2026-09-05T12:00:00.000Z'
    const normalized = normalizeContactCollections({
      suppressedContactSourceKeys: ['character:active'],
      contacts: [{ id: 'active', name: 'Narrative Engine', source: { kind: 'character', characterId: 'active' } }],
      conversations: [{ id: 'dm-active', kind: 'direct', title: 'Narrative Engine', includesPocketPersona: true, participantActorIds: ['active'], participantContactIds: ['active'], messages: [], unread: 0, createdAt: now, updatedAt: now }],
    }, { characterId: 'active', characterName: 'Narrative Engine', now, makeId: (prefix) => `${prefix}-id`, personaActorId: 'persona:kai' })

    expect(normalized.contacts.some((entry) => entry.source.kind === 'character' && entry.source.characterId === 'active')).toBe(false)
    expect(normalized.contacts.some((entry) => entry.id === 'active')).toBe(false)
  })

  test('does not materialize a placeholder _none character contact', () => {
    const normalized = normalizeContactCollections({}, {
      characterId: '_none', characterName: 'Character', now: '2026-09-05T12:00:00.000Z', makeId: (prefix) => `${prefix}-id`, personaActorId: 'persona:kai',
    })
    expect(normalized.contacts).toHaveLength(0)
    expect(normalized.conversations).toHaveLength(0)
  })
})
