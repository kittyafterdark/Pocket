import { expect, test } from 'bun:test'
import { buildSocialKnownContext, rememberSocialDirectMessage, socialContactMemoryIds } from '../src/backend/social-context.js'
import { actorPhoneMemoryContext } from '../src/domain/actor-memory.js'
import { SocialWorld } from '../src/backend/social-world.js'
import { defaultLauncherLayout, setPocketAppInstalled } from '../src/domain/launcher.js'
import { normalizeSocialState } from '../src/domain/social.js'
import type { PhoneState, PocketActorMemoryEntry } from '../src/types.js'
import type { SocialAccount } from '../src/domain/social.js'

const now = '2026-10-29T18:00:00Z'
const memory = (messageId: string, knownByActorIds: string[], text: string): PocketActorMemoryEntry => ({
  id: `memory:${messageId}`, messageId, conversationId: 'old-dm', conversationTitle: 'Messages', conversationKind: 'direct',
  speakerActorId: 'me', speakerName: 'Noah', text, knownByActorIds, knownByNames: [], createdAt: now,
})
function fixture(): PhoneState {
  return {
    chatId: 'context', characterId: 'cast', pocketPersonaActorId: 'me', pocketPersona: { displayName: 'Noah' },
    contacts: [{ id: 'dane-contact', name: 'Dane', role: 'An old friend', identityBrief: 'We met at the quiet pier.', sceneNote: 'Returned the spare key.',
      source: { kind: 'character', characterId: 'dane-card' }, phoneProfile: { personality: 'Dry humor', textingStyle: 'Short lower-case messages', appearance: '' } },
    { id: 'fern-contact', name: 'Fern', role: 'Bookshop friend', identityBrief: 'A familiar friend from the market.', source: { kind: 'npc', bankId: 'fern-bank', discoveredActorId: 'fern-actor' } }],
    discoveredActors: [{ id: 'dane-actor', displayName: 'Dane', promotedContactId: 'dane-contact' }, { id: 'fern-actor', displayName: 'Fern', promotedContactId: 'fern-contact' }],
    conversations: [
      { id: 'ours', kind: 'direct', includesPocketPersona: true, participantActorIds: ['dane-actor'], messages: [{ sender: 'persona', senderName: 'Noah', text: 'Coffee at six?', createdAt: now }, { sender: 'contact', senderName: 'Dane', text: 'See you there.', createdAt: now }] },
      { id: 'different-owner', kind: 'direct', includesPocketPersona: false, participantActorIds: ['dane-actor', 'third'], messages: [{ sender: 'contact', senderName: 'Third', text: 'A different phone history.', createdAt: now }] },
    ], actorMemories: [memory('known', ['dane-contact'], 'The pier key is under the blue pot.'), memory('other', ['third'], 'A stranger cannot see this memory.')],
  } as unknown as PhoneState
}

test('linked characters reuse canonical identity, actor memory, and their current phone-owner history', () => {
  const state = fixture(), account = { id: 'card:dane-card', cardId: 'dane-card', name: 'Dane', handle: 'dane' }
  const result = buildSocialKnownContext(state, account, 'me', { continuity: 'Public market at sunset.' })!
  expect(result.actorIds).toContain('dane-contact'); expect(result.actorIds).toContain('dane-actor')
  expect(result.profile.identity).toContain('quiet pier'); expect(result.profile.textingStyle).toBe('Short lower-case messages')
  expect(result.phoneMemory).toContain('blue pot'); expect(result.phoneMemory).not.toContain('stranger cannot')
  expect(result.directHistory?.map(message => message.text)).toEqual(['Coffee at six?', 'See you there.'])
  expect(result.continuity).toBe('Public market at sunset.')
})

test('public familiarity omits private identity, phone memory, and private histories', () => {
  const result = buildSocialKnownContext(fixture(), { id: 'dane', actorId: 'dane-actor', name: 'Dane', handle: 'dane' }, 'me', { audience: 'public', continuity: 'The public market is open.' })!
  expect(result.profile.role).toBe('An old friend'); expect(result.profile.identity).toBe('')
  expect(result.phoneMemory).toBeUndefined(); expect(result.directHistory).toBeUndefined()
  expect(JSON.stringify(result)).not.toContain('blue pot'); expect(JSON.stringify(result)).not.toContain('Coffee at six')
})

test('a same-name outsider and an unbound actor ID cannot acquire known-character context', () => {
  const state = fixture()
  expect(buildSocialKnownContext(state, { id: 'social:instagram:dane', name: 'Dane', handle: 'dane' }, 'me')).toBeNull()
  expect(buildSocialKnownContext(state, { id: 'unbound', actorId: 'made-up', name: 'Dane', handle: 'dane' }, 'me')).toBeNull()
  state.actorMemories.push({ ...memory('homonym', ['dane-contact'], 'Only the original Dane knows this.'), knownByNames: ['Dane'] })
  const differentCard = buildSocialKnownContext(state, { id: 'card:different-dane', cardId: 'different-dane', name: 'Dane', handle: 'dane' }, 'me')!
  expect(differentCard.phoneMemory).not.toContain('original Dane')
})

test('NPC Bank source links survive promotion and Instagram DMs share memory with the same actor only', () => {
  const state = fixture(), account: SocialAccount = { id: 'bank:fern-bank', bankId: 'fern-bank', name: 'Fern', handle: 'fern' }
  const known = buildSocialKnownContext(state, account, 'me')!
  expect(known.actorIds).toContain('fern-contact'); expect(known.actorIds).toContain('fern-actor')
  const thread = { id: 'ig-thread', owner: 'me', account, messages: [], updatedAt: now }
  rememberSocialDirectMessage(state, thread, { id: 'ig-message', sender: 'owner', text: 'Please save the market book for me.', createdAt: now })
  const recalled = actorPhoneMemoryContext(state.actorMemories, { actorIds: ['fern-actor'], actorNames: [], actorName: 'Fern' })
  expect(recalled).toContain('save the market book'); expect(recalled).toContain('Instagram')
  const outsider = actorPhoneMemoryContext(state.actorMemories, { actorIds: ['third', 'card:other-fern'], actorNames: ['Fern'], actorName: 'Fern' })
  expect(outsider).not.toContain('save the market book')
  expect(state.actorMemories.at(-1)?.knownByActorIds).toContain('me')
  expect(state.actorMemories.at(-1)?.knownByActorIds).not.toContain('third')
  expect(state.conversations).toHaveLength(2)
})

test('unlinked internet DMs stay local to their Instagram thread rather than entering shared actor memory', () => {
  const state = fixture(), before = state.actorMemories.length
  rememberSocialDirectMessage(state, { id: 'stranger-thread', owner: 'me', account: { id: 'social:instagram:dane', name: 'Dane', handle: 'dane' }, messages: [], updatedAt: now }, { id: 'outsider-dm', sender: 'account', text: 'No known-character impersonation.', createdAt: now })
  expect(state.actorMemories).toHaveLength(before)
})

test('a Bank friend without a Contact retains source-bound DM memory when later added to Messages', () => {
  const state = fixture(), account: SocialAccount = { id: 'bank:new-friend', bankId: 'new-friend', name: 'Moss', handle: 'moss' }
  rememberSocialDirectMessage(state, { id: 'new-friend-thread', owner: 'me', account, messages: [], updatedAt: now }, { id: 'new-friend-message', sender: 'account', text: 'I saved the market book.', createdAt: now })
  const newContact = { id: 'new-contact', name: 'Moss', source: { kind: 'npc', bankId: 'new-friend' } } as any
  const recalled = actorPhoneMemoryContext(state.actorMemories, { actorIds: socialContactMemoryIds(newContact), actorNames: [], actorName: 'Moss' })
  expect(recalled).toContain('saved the market book')
  expect(state.actorMemories.at(-1)?.knownByNames).not.toContain('Moss')
})

test('feed and comment generation receive public familiarity without leaking known actors private messages into a mixed feed', async () => {
  const state = fixture(), audiences: string[] = [], inputs: any[] = []; let serial = 0
  state.roleplayNow = now; state.processedCommands = []
  state.launcherLayouts = { me: setPocketAppInstalled(defaultLauncherLayout(), 'twitter', true) }
  state.social = normalizeSocialState({ preferences: { me: { tumblrTheme: 'true-blue', apps: { twitter: { randomCards: true } } } } })
  const world = new SocialWorld({
    loadState: async () => structuredClone(state), saveState: async next => { Object.assign(state, next) }, sendState: async () => {}, send: () => {},
    getMessages: async () => [], stateKey: () => 'known-context', withStateLock: async (_key, task) => task(), nowIso: () => now,
    makeId: prefix => `${prefix}-${++serial}`, resolveImage: async () => '',
    listGuestCards: async () => [{ id: 'dane-card', kind: 'character', name: 'Dane', actorId: 'dane-actor' }],
    resolveKnownContext: async (current, account, owner, audience) => { audiences.push(audience); return buildSocialKnownContext(current, account, owner, { audience, continuity: 'We both attended the public market.' }) },
    runStructuredGeneration: async (_task, _requestId, request) => {
      const messages = request.messages as Array<{ content: string }>, input = JSON.parse(messages[1].content); inputs.push(input)
      return input.speaker ? { replies: [{ text: 'Same place as always.' }] } : { posts: [{ key: 'known', cardId: 'dane-card', author: 'Dane', text: 'Good to see an old friend at the market.' }] }
    },
  })
  const context = { chatId: state.chatId, characterId: state.characterId }
  await world.refresh(context, 'me', 'twitter', undefined, 'feed')
  const known = inputs[0].knownActors[0]
  expect(known.profile.role).toBe('An old friend'); expect(known.continuity).toContain('public market')
  expect(known.phoneMemory).toBeUndefined(); expect(JSON.stringify(inputs[0])).not.toContain('blue pot')
  const root = state.social!.posts[0]
  await world.mutate(context, 'me', { action: 'post', app: 'twitter', text: 'Meet there again?', replyTo: root.id }, 'comment')
  expect(inputs[1].knownContext.name).toBe('Dane'); expect(inputs[1].knownContext.phoneMemory).toBeUndefined()
  expect(JSON.stringify(inputs[1])).not.toContain('blue pot'); expect(audiences).toEqual(['public', 'public'])
  expect(state.social!.posts.at(-1)?.replyTo).toBe(state.social!.posts[1].id)
})
