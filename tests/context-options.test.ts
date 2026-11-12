import { expect, test } from 'bun:test'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { fullProfile, profileContext, freeformLore } from '../src/backend/context-options.js'
import { retrievePhoneLore } from '../src/backend/phone-lore.js'
import { readPocketChatMessage } from '../src/backend/chat-history.js'
import { normalizePocketContact } from '../src/domain/contacts.js'
import { applyNpcBankProfile, contactFromNpcBank, emptyNpcBank, normalizeNpcBank, upsertNpcBankFromContact } from '../src/domain/npc-bank.js'

test('profile preference migrates safely and contact overrides win', () => {
  const preferences = normalizePreferences({ preferFullProfiles: true, enableLorebooks: true })
  expect(defaultPreferences().enableLorebooks).toBe(false)
  const contact: any = { contextPolicy: { profileMode: 'default' } }
  expect(fullProfile(contact, preferences)).toBe(true)
  contact.contextPolicy.profileMode = 'compact'
  expect(profileContext(contact, {description:'Full definition', personality:'Voice', behavior:'Scenario'}, preferences, 'Brief')).toBe('Brief')
  contact.contextPolicy.profileMode = 'full'
  expect(profileContext(contact, {description:'Full definition', personality:'Voice', behavior:'Scenario'}, defaultPreferences(), 'Brief')).toContain('Full definition')
})

test('Freeform lore respects disabled, constant, literal keys, secondary keys and deduplication', () => {
  const entries = [
    {id:'always', constant:true, content:'World facts'},
    {id:'disabled', constant:true, disabled:true, content:'Hidden'},
    {id:'key', key:['library'], content:'Library facts'},
    {id:'secondary', key:['library'], selective:true, keysecondary:['night'], content:'Night facts'},
    {id:'word', key:['cat'], match_whole_words:true, content:'Cat facts'},
    {id:'regex', key:['.*'], use_regex:true, content:'Regex facts'},
    {id:'key', constant:true, content:'Duplicate'},
  ]
  const result = freeformLore(entries, 'The LIBRARY is open at night. A catalogue awaits.')
  expect(result).toContain('World facts'); expect(result).toContain('Library facts'); expect(result).toContain('Night facts')
  for (const absent of ['Hidden', 'Cat facts', 'Regex facts', 'Duplicate']) expect(result).not.toContain(absent)
  expect(freeformLore(entries, 'Daytime library')).not.toContain('Night facts')
})

test('Pocket retrieves attached and NPC-source lore even when the main RP activation cache is empty', async () => {
  const now = '2026-11-03T12:00:00Z', makeId = (prefix: string) => prefix + '-fixture'
  const npc = normalizePocketContact({ id: 'an', name: 'An Kohinata', source: { kind: 'npc', lorebookEntryIds: ['an-profile'] } }, { now, makeId, characterId: '_none', characterName: '' })!
  const character = normalizePocketContact({ id: 'masamune', name: 'Masamune Takano', source: { kind: 'character', characterId: 'participant-card' } }, { now, makeId, characterId: '_none', characterName: '' })!
  const unrelated = normalizePocketContact({ id: 'other', name: 'Other', source: { kind: 'npc', lorebookEntryIds: ['unrelated-private-source'] } }, { now, makeId, characterId: '_none', characterName: '' })!
  const conversation: any = { participantActorIds: ['discovered-an', 'masamune'], participantContactIds: ['an', 'masamune'], messages: [{ sender: 'persona', text: 'Coffee tonight?', status: 'sent' }] }
  const state: any = { chatId: 'real-chat', characterId: 'active-card', contacts: [npc, character, unrelated], discoveredActors: [{ id: 'discovered-an', displayName: 'An Kohinata', promotedContactId: 'an' }], pocketPersona: { displayName: 'You' } }
  const entries = [
    { id: 'an-profile', world_book_id: 'npc-book', content: 'An has known Ritsu since childhood.' },
    { id: 'chat-topic', world_book_id: 'chat-book', key: ['coffee'], content: 'The cafe closes at midnight.' },
    { id: 'card-topic', world_book_id: 'card-book', key: ['Masamune'], content: 'Masamune works at the publishing house.' },
    { id: 'participant-topic', world_book_id: 'participant-book', key: ['Takano'], content: 'Takano is an editor.' },
  ]
  const reads: unknown[] = []
  const api: any = {
    permissions: { has: () => true },
    chats: { async get(id: string, userId: string) { reads.push(['chat', id, userId]); return { metadata: { chat_world_book_ids: ['chat-book'] } } } },
    characters: { async get(id: string) { return { world_book_ids: [id === 'active-card' ? 'card-book' : 'participant-book'] } } },
    world_books: {
      async getActivated(id: string) { reads.push(['activated', id]); return [] }, async getGlobal() { return [] },
      entries: {
        async get(id: string, userId: string) { reads.push(['entry', id, userId]); return entries.find(entry => entry.id === id) || null },
        async list(bookId: string) { const data = entries.filter(entry => entry.world_book_id === bookId); return { data, total: data.length } },
      },
    },
  }
  const result = await retrievePhoneLore(api, state, conversation, 'user-a')
  for (const entry of entries) expect(result.text).toContain(entry.content)
  expect(result.bookIds).toHaveLength(4)
  expect(result.entries.find(entry => entry.id === 'an-profile')?.reason).toBe('NPC source reference')
  expect(reads).toContainEqual(['chat', 'real-chat', 'user-a'])
  expect(reads).not.toContainEqual(['entry', 'unrelated-private-source', 'user-a'])
  state.chatId = '_freeform_fixture'; state.characterId = '_none'; reads.length = 0
  expect((await retrievePhoneLore(api, state, conversation, 'user-a')).text).toContain(entries[0].content)
  expect(reads.some((read: any) => read[0] === 'chat' || read[0] === 'activated')).toBe(false)
})

test('NPC Bank preserves lorebook source references through save, reload and reuse', () => {
  const now = '2026-11-03T12:00:00Z', makeId = (prefix: string) => prefix + '-fixture'
  const contact = normalizePocketContact({ name: 'An', source: { kind: 'npc', lorebookEntryIds: ['profile', 'childhood', 'profile'] } }, { now, makeId, characterId: '_none', characterName: '' })!
  const bank = emptyNpcBank(now); upsertNpcBankFromContact(bank, contact, now, makeId)
  const reloaded = normalizeNpcBank(JSON.parse(JSON.stringify(bank)), now)
  const copy = contactFromNpcBank(reloaded.entries[0], now, makeId)
  expect(copy.source.kind === 'npc' && copy.source.lorebookEntryIds).toEqual(['profile', 'childhood'])
  applyNpcBankProfile(copy, { ...reloaded.entries[0], lorebookEntryIds: [] }, now)
  expect(copy.source.kind === 'npc' && copy.source.lorebookEntryIds).toEqual(['profile', 'childhood'])
})

test('lore scanning limits pages and leaves room for a second linked book', async () => {
  const requests: Array<{ book: string; limit: number; offset: number }> = []
  const api: any = {
    permissions: { has: () => false },
    world_books: {
      async getGlobal() { return ['large', 'small'] },
      entries: {
        async list(book: string, { limit, offset }: { limit: number; offset: number }) {
          requests.push({ book, limit, offset })
          if (book === 'small') return { data: [{ id: 'one', constant: true, content: 'Local lore.' }], total: 1 }
          return {
            total: 10_000,
            data: Array.from({ length: limit }, (_, index) => ({ id: `row-${offset + index}`, content: 'Unmatched lore.', key: ['unmatched'] })),
          }
        },
      },
    },
  }
  const result = await retrievePhoneLore(api, { chatId: '_freeform_lore', contacts: [], pocketPersona: {} } as any,
    { participantContactIds: [], messages: [] } as any)
  expect(result.text).toBe('Local lore.')
  expect(requests.filter(request => request.book === 'large').reduce((total, request) => total + request.limit, 0)).toBe(200)
  expect(requests.every(request => request.limit <= 25)).toBe(true)
})

test('older candidate lookup fetches full swipes only for the matched message', async () => {
  const messages = Array.from({ length: 59 }, (_, index) => ({
    id: `message-${index}`, index_in_chat: index, content: 'active', swipes: ['active', 'alternate'],
  }))
  const fullReads: number[] = []
  const chat = { async getMessages(_: string, options: { tail?: number; limit?: number; offset?: number; light: boolean }) {
    if (!options.light) fullReads.push(options.limit!)
    const rows = options.tail ? messages.slice(-options.tail) : messages.slice(options.offset, options.offset! + options.limit!)
    return options.light ? rows.map(row => ({ ...row, swipes: [row.content, null] })) : rows
  } }
  expect((await readPocketChatMessage(chat, 'chat', 'message-17')).swipes).toEqual(['active', 'alternate'])
  expect(fullReads).toEqual([1])
})
