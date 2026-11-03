import { expect, test } from 'bun:test'
import { normalizeContactCollections, normalizePocketContact, ensureDirectConversation } from '../src/domain/contacts.js'
import { ensureDiscoveredActor, ensureDirectActorConversation, listPocketActors, matchingActorIds, matchingGroupConversation, promoteDiscoveredActor } from '../src/domain/actors.js'
import { contactPhoneEvidence } from '../src/domain/contact-evidence.js'
import { emptyNpcBank, findNpcBankMatch, upsertNpcBankFromContact } from '../src/domain/npc-bank.js'
import type { PhoneState, PocketConversation } from '../src/types.js'

const now = '2026-11-03T12:00:00Z'
let serial = 0
const makeId = (prefix: string) => `${prefix}-${++serial}`
const contact = (name: string) => normalizePocketContact({ name, source: { kind: 'npc', origin: 'manual' } }, { characterId: '_none', characterName: '', now, makeId })!
function fixture(): PhoneState {
  return { chatId: 'fixture', characterId: '_none', contacts: [], discoveredActors: [], conversations: [], pocketPersonaActorId: 'persona:me' } as unknown as PhoneState
}
function group(ids: string[], title = 'Class 1-A', includesPocketPersona = true): PocketConversation {
  return { id: makeId('group'), kind: 'group', participantActorIds: ids, participantContactIds: [], includesPocketPersona, title, messages: [], unread: 0, availability: { state: 'remote' }, createdAt: now, updatedAt: now }
}

test('promotion and direct opening reuse manual identities, including reversed names and accents', () => {
  const state = fixture(), bakugo = contact('Katsuki Bakugō')
  const actor = ensureDiscoveredActor(state, { name: 'Bakugo Katsuki', source: 'group-chat', now, makeId })
  const thread = ensureDirectActorConversation(state, actor.id, now, makeId)
  state.contacts.push(bakugo)
  expect(promoteDiscoveredActor(state, actor.id, now, makeId)).toBe(bakugo)
  expect(state.contacts).toHaveLength(1)
  expect(listPocketActors(state)).toHaveLength(1)
  expect(matchingActorIds(state, 'Bakugo')).toEqual([actor.id])
  expect(matchingActorIds(state, 'Katsuki', [bakugo.id])).toEqual([bakugo.id])
  expect(ensureDirectActorConversation(state, bakugo.id, now, makeId)).toBe(thread)
  expect(ensureDirectConversation(state, bakugo.id, now, makeId)).toBe(thread)
})

test('ambiguous short names fail before promotion without changing contacts or actor linkage', () => {
  const state = fixture(); state.contacts.push(contact('Alex Park'), contact('Alex Vale'))
  const actor = ensureDiscoveredActor(state, { name: 'Alex', source: 'messages', now, makeId })
  const snapshot = structuredClone(state)
  expect(() => promoteDiscoveredActor(state, actor.id, now, makeId)).toThrow('ambiguous')
  expect(state).toEqual(snapshot)
  expect(matchingActorIds(state, 'Alex')).toEqual([actor.id])
  expect(matchingActorIds(state, 'Alex', [state.contacts[0].id])).toEqual([state.contacts[0].id])
  expect(listPocketActors(state).find(entry => entry.actorId === actor.id)?.contact).toBeUndefined()
})

test('roster matching preserves titles and histories across alias IDs, order, and Persona membership', () => {
  const state = fixture(), fern = contact('Fern Vale'), mika = contact('Mika Moon'); state.contacts.push(fern, mika)
  const actor = ensureDiscoveredActor(state, { name: 'Fern Vale', source: 'messages', now, makeId })
  promoteDiscoveredActor(state, actor.id, now, makeId)
  const thread = group([actor.id, mika.id]); state.conversations.push(thread)
  expect(matchingGroupConversation(state, [mika.id, fern.id], true, 'Messages group with Fern, Mika')).toBe(thread)
  expect(thread.title).toBe('Class 1-A')
  expect(matchingGroupConversation(state, [mika.id, fern.id], false)).toBeUndefined()
  state.conversations.push(group([fern.id, mika.id], 'Study group'))
  expect(matchingGroupConversation(state, [fern.id, mika.id], true)).toBe(thread)
  expect(matchingGroupConversation(state, [fern.id, mika.id], true, 'Study group')).toBe(thread)
})

test('model group lookup tolerates one missing member and a partial speaker list without conflating small private groups', () => {
  const state = fixture(), people = ['Katsuki Bakugo', 'Shoto Todoroki', 'Eijiro Kirishima', 'Denki Kaminari', 'Hanta Sero'].map(contact)
  state.contacts.push(...people)
  const ids = people.map(person => person.id), oldest = group(ids, 'Class 1-A Hellions')
  oldest.createdAt = '2026-11-01T12:00:00Z'
  const duplicate = group(ids.slice(0, 4), 'Class 1-A'); duplicate.createdAt = '2026-11-02T12:00:00Z'
  state.conversations.push(duplicate, oldest)
  expect(matchingGroupConversation(state, ids.slice(0, 4), true, 'Class 1-A', { allowPartial: true })).toBe(oldest)
  expect(matchingGroupConversation(state, [ids[0]], false, 'Class 1-A', { allowPartial: true, personaUnspecified: true })).toBe(oldest)
  expect(matchingGroupConversation(state, [ids[0]], false, 'Other group', { allowPartial: true, personaUnspecified: true })).toBeUndefined()
  expect(matchingGroupConversation(state, ids.slice(0, 2), true, 'Private coffee', { allowPartial: true })).toBeUndefined()
  expect(matchingGroupConversation(state, ids.slice(0, 2), true, 'Messages group with Katsuki, Shoto', { allowPartial: true })).toBe(oldest)
  expect(matchingGroupConversation(state, ids.slice(0, 4), false, 'Private conversation', { allowPartial: true })).toBeUndefined()
  // Manual creation keeps distinct subsets; only model lookup enables partial matching.
  expect(matchingGroupConversation(state, ids.slice(0, 3), true, 'Study trio')).toBeUndefined()
  expect(matchingGroupConversation(state, ids.slice(0, 3), true, 'Private coffee trio', { allowPartial: true })).toBeUndefined()
})

test('active host Character reuses an existing NPC without losing identity, state, or thread', () => {
  const npc = contact('Katsuki Bakugo'); npc.identityBrief = 'User-written identity'; npc.presence.inScene = true
  const state = fixture(); state.contacts.push(npc)
  const thread = ensureDirectConversation(state, npc.id, now, makeId)
  const normalized = normalizeContactCollections(state as any, { characterId: 'host-bakugo', characterName: 'Bakugo Katsuki', now, makeId })
  expect(normalized.contacts).toHaveLength(1)
  expect(normalized.contacts[0].id).toBe(npc.id)
  expect(normalized.contacts[0].source).toEqual({ kind: 'character', characterId: 'host-bakugo' })
  expect(normalized.contacts[0].identityBrief).toBe('User-written identity')
  expect(normalized.contacts[0].presence.inScene).toBe(true)
  expect(normalized.conversations).toHaveLength(1)
  expect(normalized.conversations[0].id).toBe(thread.id)
})

test('NPC Bank aliases survive normalization and prevent a renamed duplicate', () => {
  const bank = emptyNpcBank(now), npc = contact('Katsuki Bakugo'); npc.aliases = ['Dynamight']
  const entry = upsertNpcBankFromContact(bank, npc, now, makeId)
  expect(findNpcBankMatch(bank, 'Dynamight')).toBe(entry)
  expect(findNpcBankMatch(bank, 'Bakugō Katsuki')).toBe(entry)
  const second = contact('Dynamight')
  expect(upsertNpcBankFromContact(bank, second, now, makeId).id).toBe(entry.id)
  expect(bank.entries).toHaveLength(1)
})

test('profile evidence includes both sides before promotion and excludes unrelated/provisional messages', () => {
  const state = fixture(), actor = ensureDiscoveredActor(state, { name: 'Fern Vale', source: 'messages', now, makeId })
  const thread = ensureDirectActorConversation(state, actor.id, now, makeId)
  const npc = promoteDiscoveredActor(state, actor.id, now, makeId)
  thread.messages = [
    { sender: 'persona', senderName: 'You', text: 'How is the flower shop?', createdAt: now },
    { sender: 'contact', senderName: 'Fern', senderActorId: actor.id, text: 'We close at six!', createdAt: now },
    { sender: 'contact', senderName: 'Fern', text: 'UNCOMMITTED', candidateCommitState: 'provisional', createdAt: now },
  ] as any
  const other = group([], 'Other people'); other.messages = [{ sender: 'contact', senderName: 'Other', text: 'PRIVATE OTHER THREAD', createdAt: now }] as any; state.conversations.push(other)
  const evidence = contactPhoneEvidence(state, npc)
  expect(evidence).toContain('How is the flower shop?')
  expect(evidence).toContain('We close at six!')
  expect(evidence).not.toContain('UNCOMMITTED')
  expect(evidence).not.toContain('PRIVATE OTHER THREAD')
})
