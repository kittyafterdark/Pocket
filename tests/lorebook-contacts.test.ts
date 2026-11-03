import { expect, test } from 'bun:test'
import { LorebookContacts } from '../src/backend/lorebook-contacts.js'
import { parseLorebookContactDrafts } from '../src/domain/lorebook-contacts.js'
import { rankLorebookSearch } from '../src/domain/lorebook-search.js'

function fixture() {
  const calls: any[] = [], entries = Array.from({ length: 105 }, (_, i) => ({ id: `entry-${i}`, uid: `${i}`, world_book_id: 'book', comment: `Person ${i}`, key: [], content: 'An explicitly described fictional person.', disabled: i === 2 }))
  let allowed = true
  const service = new LorebookContacts({ permissions: { has: () => allowed }, world_books: {
    async list(options: any) { calls.push(['books', options]); return { data: [{ id: 'book', name: 'People' }], total: 1 } },
    async get(id: string, userId: string) { calls.push(['book', id, userId]); return id === 'book' ? { id } : null },
    entries: {
      async list(id: string, options: any) { calls.push(['entries', id, options]); return { data: entries.slice(options.offset, options.offset + options.limit), total: entries.length } },
      async get(id: string, userId: string) { calls.push(['entry', id, userId]); return entries.find(entry => entry.id === id) || null },
    },
  } } as any)
  return { service, calls, entries, deny: () => { allowed = false } }
}

test('lorebook browsing paginates and scopes every public API request to the user', async () => {
  const { service, calls } = fixture()
  expect(await service.books('fixture-user')).toEqual([{ id: 'book', name: 'People', attachedTo: [] }])
  const entries = await service.entries('book', 'fixture-user')
  expect(entries).toHaveLength(105)
  expect(entries[2].disabled).toBe(true)
  expect(calls.filter(call => call[0] === 'entries').map(call => call[2])).toEqual([
    { offset: 0, limit: 100, userId: 'fixture-user' }, { offset: 100, limit: 100, userId: 'fixture-user' },
  ])
})

test('selected sources combine entries without treating entry boundaries as character boundaries', async () => {
  const { service, entries, calls } = fixture()
  entries[0].content = 'Fern owns a flower shop. Mika runs a cafe.'
  entries[1].content = 'Fern closes the shop at six. Mika texts in short sentences.'
  const sources = await service.sources([{ bookId: 'book', entryId: 'entry-0' }, { bookId: 'book', entryId: 'entry-1' }], 'fixture-user')
  expect(sources.map(source => source.content)).toEqual([entries[0].content, entries[1].content])
  expect(calls.filter(call => call[0] === 'entry').map(call => call[2])).toEqual(['fixture-user', 'fixture-user'])
  const drafts = parseLorebookContactDrafts({ contacts: [
    { name: 'Fern Vale', identityBrief: 'Florist who closes at six.', evidenceEntryIds: ['entry-0', 'entry-1'] },
    { name: 'Mika Moon', identityBrief: 'Cafe owner with brief texts.', evidenceEntryIds: ['entry-0', 'entry-1'] },
  ] }, sources.map(source => source.id))
  expect(drafts).toHaveLength(2)
  expect(drafts[0].evidenceEntryIds).toHaveLength(2)
})

test('source validation rejects stale, disabled, duplicate, empty and oversized selections before generation', async () => {
  const { service, entries } = fixture()
  const selected = (entryId: string, bookId = 'book') => [{ bookId, entryId }]
  await expect(service.sources(selected('entry-1', 'other-book'))).rejects.toThrow('selected lorebook')
  await expect(service.sources(selected('entry-2'))).rejects.toThrow('enabled')
  await expect(service.sources(selected('missing'))).rejects.toThrow('selected lorebook')
  await expect(service.sources([...selected('entry-1'), ...selected('entry-1')])).rejects.toThrow('more than once')
  await expect(service.sources([])).rejects.toThrow('1 and 24')
  entries[1].content = 'x'.repeat(32_001)
  await expect(service.sources(selected('entry-1'))).rejects.toThrow('32,000')
  entries[1].content = ''
  await expect(service.sources(selected('entry-1'))).rejects.toThrow('no content')
})

test('extraction cannot cite unselected entries or silently combine overlapping identities', () => {
  const person = { name: 'Fern Vale', aliases: ['Fern'], identityBrief: 'Florist', evidenceEntryIds: ['entry-0'] }
  expect(() => parseLorebookContactDrafts({ contacts: [{ ...person, evidenceEntryIds: ['private-other-entry'] }] }, ['entry-0'])).toThrow('valid evidence')
  expect(() => parseLorebookContactDrafts({ contacts: [person, { ...person, name: 'Fern' }] }, ['entry-0'])).toThrow('overlapping identities')
  expect(parseLorebookContactDrafts({ contacts: [] }, ['entry-0'])).toEqual([])
})

test('permissions fail before reading the library', async () => {
  const { service, calls, deny } = fixture(); deny()
  await expect(service.books()).rejects.toThrow('World Books')
  await expect(service.entries('book')).rejects.toThrow('World Books')
  await expect(service.sources([{ bookId: 'book', entryId: 'entry-0' }])).rejects.toThrow('World Books')
  expect(calls).toEqual([])
})

test('short character names outrank incidental substrings, categories, and preview text', () => {
  const entries = [
    { title: 'character | antagonist | Kayama' },
    { title: 'location | Shuudansha / Earth' },
    { title: 'Anne', preview: 'A different person.' },
    { title: 'Daily life', preview: 'An Kohinata visits the cafe.' },
    { title: 'character | supporting | An Kohinata' },
  ]
  expect(rankLorebookSearch(entries, 'an', entry => entry).map(entry => entry.title)).toEqual([
    'character | supporting | An Kohinata', 'Anne', 'character | antagonist | Kayama', 'location | Shuudansha / Earth', 'Daily life',
  ])
  expect(rankLorebookSearch(entries, 'AN KOH', entry => entry)[0].title).toBe('character | supporting | An Kohinata')
})

test('entry search includes keywords, accents and preview text without disturbing unfiltered ordering', () => {
  const entries = [{ title: 'Cafe', preview: 'Bakugo likes coffee.' }, { title: 'character | main | Katsuki', keys: ['Dynamight', 'Bakugō'] }]
  expect(rankLorebookSearch(entries, 'bakugo', entry => entry)[0]).toBe(entries[1])
  expect(rankLorebookSearch(entries, 'coffee', entry => entry)).toEqual([entries[0]])
  expect(rankLorebookSearch(entries, '', entry => entry)).toBe(entries)
})

test('contextual library labels chat and Character attachments through scoped public APIs', async () => {
  const calls: unknown[] = []
  const api = {
    permissions: { has: (_permission: string) => true },
    world_books: { async list(options: unknown) { calls.push(options); return { data: [{ id: 'unrelated', name: 'A library book' }, { id: 'shared', name: 'Shared world' }, { id: 'card', name: 'Character history' }], total: 3 } } },
    chats: { async get(id: string, userId: string) { calls.push(['chat', id, userId]); return { metadata: { chat_world_book_ids: ['shared', 'stale-book'] } } } },
    characters: { async get(id: string, userId: string) { calls.push(['character', id, userId]); return { world_book_ids: ['card', 'shared'] } } },
  }
  const service = new LorebookContacts(api as any), context = { chatId: 'chat-a', characterId: 'card-a' }
  expect(await service.books('user-a', context)).toEqual([
    { id: 'card', name: 'Character history', attachedTo: ['character'] }, { id: 'shared', name: 'Shared world', attachedTo: ['chat', 'character'] }, { id: 'unrelated', name: 'A library book', attachedTo: [] },
  ])
  expect(calls).toContainEqual(['chat', 'chat-a', 'user-a']); expect(calls).toContainEqual(['character', 'card-a', 'user-a'])
  calls.length = 0
  api.permissions.has = permission => permission === 'world_books'
  expect((await service.books('user-a', context)).every(book => !book.attachedTo.length)).toBe(true)
  expect(calls).toHaveLength(1)
  calls.length = 0; api.permissions.has = () => true
  await service.books('user-a', { chatId: '_freeform_fixture', characterId: '_none' })
  expect(calls).toHaveLength(1)
})

test('source progress reports actual completed entry counts', async () => {
  const { service } = fixture(), progress: number[][] = []
  await service.sources([{ bookId: 'book', entryId: 'entry-0' }, { bookId: 'book', entryId: 'entry-1' }], 'user-a', (completed, total) => progress.push([completed, total]))
  expect(progress).toEqual([[1, 2], [2, 2]])
})
