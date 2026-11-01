import { describe, expect, test } from 'bun:test'
import { filterSocialMentions, insertSocialMention, socialMentionCandidates, socialMentionToken } from '../src/domain/social-mentions.js'
import { normalizeSocialState } from '../src/domain/social.js'
import type { PhoneState, PocketNpcBankEntry } from '../src/types.js'

const state = {
  pocketPersonaActorId: 'persona', pocketPersona: { displayName: 'Me', role: '', avatarUrl: '' }, contacts: [{ id: 'mika', name: 'Mika', role: '', avatarUrl: '', sourceAvatarUrl: '', avatarOverrideUrl: '', accent: '#fff', sourceAccent: '#fff', colorMode: 'pocket', description: '', identityBrief: '', sceneNote: '', messagingStyle: {} }], discoveredActors: [],
  social: normalizeSocialState({ posts: [{ id: 'p1', app: 'instagram', account: { id: 'mika', actorId: 'mika', name: 'Mika', handle: 'mika_live' }, text: 'hi', tags: [], createdAt: '2026-01-01T00:00:00Z', likedBy: [] }], following: { persona: { instagram: ['mika'] } }, preferences: { persona: { tumblrTheme: 'true-blue', apps: { instagram: { friendEntryIds: ['bank-fern'] } } } } })
} as unknown as PhoneState
const bank = [{ id: 'bank-fern', name: 'Fern', avatarUrl: '/fern.png', role: 'friend' }, { id: 'bank-june', name: 'June', avatarUrl: '/june.png', role: 'friend' }] as PocketNpcBankEntry[]

describe('social mentions', () => {
  test('finds the active @ token at the caret without eating earlier text', () => {
    expect(socialMentionToken('hello @mi', 9)).toEqual({ start: 6, end: 9, query: 'mi' })
    expect(socialMentionToken('mail@example.com', 16)).toBeUndefined()
    expect(socialMentionToken('hello @mi later', 9)).toEqual({ start: 6, end: 9, query: 'mi' })
  })
  test('inserts only the active mention token', () => {
    const token = socialMentionToken('hello @mi', 9)!
    expect(insertSocialMention('hello @mi', token, 'mika_live', 100)).toEqual({ value: 'hello @mika_live ', caret: 17 })
  })
  test('prioritizes followed accounts, dedupes selected bank friends, and keeps remaining bank entries mentionable', () => {
    const people = socialMentionCandidates(state, 'persona', 'instagram', bank)
    expect(people.map(person => [person.name, person.handle, person.mentionSource])).toEqual([
      ['Mika', 'mika_live', 'following'], ['Fern', expect.any(String), 'friend'], ['June', expect.any(String), 'npc-bank']
    ])
    expect(filterSocialMentions(people, 'mi')[0]?.handle).toBe('mika_live')
  })
})
