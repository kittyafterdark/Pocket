import { beforeAll, expect, test } from 'bun:test'
import { freeformHost } from './fixtures/freeform-host.js'
import { PREFERENCES_PATH } from '../src/domain/preferences.js'

const host = freeformHost()
beforeAll(async () => {
  ;(globalThis as any).spindle = host.api
  await import('../src/backend.ts?actor-pipeline')
})
let serial = 0
async function send(type: string, payload: Record<string, unknown> = {}) {
  const offset = host.sends.length
  await host.send({ type: `lumiphone:${type}`, requestId: `actor-pipeline-${++serial}`, ...payload })
  const responses = host.sends.slice(offset)
  return { responses, error: responses.find(p => p.type === 'lumiphone:error'), state: responses.findLast(p => p.type === 'lumiphone:state')?.state }
}
async function session() {
  const result = await send('freeform_create', { personaId: 'persona-fern', name: 'Actor pipeline' })
  const opened = result.responses.find(p => p.type === 'lumiphone:freeform_opened')
  return { chatId: opened.session.id, characterId: '_none' }
}

test('manual, model and Character imports converge without overwriting local profile or creating another DM', async () => {
  const scope = await session()
  const saved = await send('save_contact', { ...scope, contact: { name: 'Alex', identityBrief: 'User profile', source: { kind: 'npc', origin: 'manual' } } })
  expect(saved.error).toBeUndefined()
  const contactId = saved.state.contacts[0].id
  await send('open_direct', { ...scope, contactId })
  const duplicate = await send('save_contact', { ...scope, contact: { name: 'Alex', identityBrief: 'Duplicate profile' } })
  expect(duplicate.state.contacts).toHaveLength(1)
  expect(duplicate.state.contacts[0].identityBrief).toBe('User profile')
  const imported = await send('import_contact', { ...scope, kind: 'character', sourceId: 'host-character' })
  expect(imported.error).toBeUndefined()
  expect(imported.state.contacts).toHaveLength(1)
  expect(imported.state.contacts[0].id).toBe(contactId)
  expect(imported.state.contacts[0].source.kind).toBe('character')
  expect(imported.state.contacts[0].identityBrief).toBe('User profile')
  expect(imported.state.conversations.filter((thread: any) => thread.kind === 'direct')).toHaveLength(1)
})

test('model-created and user-created groups reuse the same identities despite a different title', async () => {
  const scope = await session()
  for (const name of ['Katsuki Bakugo', 'Shoto Todoroki']) await send('save_contact', { ...scope, contact: { name } })
  const current = await send('get_state', scope), ids = current.state.contacts.map((contact: any) => contact.id)
  const created = await send('create_conversation', { ...scope, title: 'Class 1-A', participantActorIds: ids })
  const originalId = created.responses.find(p => p.type === 'lumiphone:conversation_opened').conversationId
  const same = await send('create_conversation', { ...scope, title: 'Another generated title', participantActorIds: [...ids].reverse() })
  expect(same.responses.find(p => p.type === 'lumiphone:conversation_opened').conversationId).toBe(originalId)
  const action = await send('action', { ...scope, action: 'conversation', payload: { title: 'Messages group with Bakugo, Shoto', participants: ['Fern', 'Bakugo Katsuki', 'Todoroki Shoto'] } })
  expect(action.error).toBeUndefined()
  expect(action.state.conversations.filter((thread: any) => thread.kind === 'group')).toHaveLength(1)
  expect(action.state.conversations.find((thread: any) => thread.id === originalId).title).toBe('Class 1-A')
})

test('real model group actions and messages reuse the original group through roster drift and missing Persona refs', async () => {
  const scope = { chatId: 'group-dedupe-model', characterId: 'host-character' }
  for (const name of ['Katsuki Bakugo', 'Shoto Todoroki', 'Eijiro Kirishima', 'Denki Kaminari', 'Hanta Sero']) await send('save_contact', { ...scope, contact: { name } })
  const current = await send('get_state', scope), ids = current.state.contacts.filter((contact: any) => contact.name !== 'Alex').map((contact: any) => contact.id)
  const created = await send('create_conversation', { ...scope, title: 'Class 1-A Hellions', participantActorIds: ids })
  const originalId = created.responses.find(p => p.type === 'lumiphone:conversation_opened').conversationId
  const recreated = await send('create_conversation', { ...scope, title: 'Class 1-A', participantActorIds: ids.slice(0, 4) })
  expect(recreated.responses.find(p => p.type === 'lumiphone:conversation_opened').conversationId).toBe(originalId)
  const model = async (action: string, payload: unknown) => JSON.parse(await host.emit('TOOL_INVOCATION', { toolName: 'phone_action', requestId: `dedupe-model-${++serial}`, args: { chat_id: scope.chatId, character_id: scope.characterId, action, payload } }, 'fixture'))
  // The model supplies an abbreviated title, only current speakers, and omits the Persona.
  const message = await model('message', { channel: 'gc', conversation: 'Class 1-A', speaker: 'Shoto Todoroki', participants: ['Katsuki Bakugo', 'Shoto Todoroki'], text: 'The coaster is under the remote.' })
  expect(message.error).toBeUndefined(); expect(message.conversationId).toBe(originalId)
  const changed = await model('conversation', { kind: 'group', title: 'Class A Alumni', participants: ['Mika', 'Katsuki Bakugo', 'Shoto Todoroki', 'Eijiro Kirishima', 'Denki Kaminari'] })
  // The bound Persona is Mika; one regular group member is missing from the model's roster.
  expect(changed.error).toBeUndefined(); expect(changed.conversationId).toBe(originalId)
  const expanded = await model('conversation', { kind: 'group', title: 'Class A Alumni', participants: ['Mika', 'Katsuki Bakugo', 'Shoto Todoroki', 'Eijiro Kirishima', 'Denki Kaminari', 'Hanta Sero', 'Mina Ashido', 'Ochaco Uraraka'] })
  expect(expanded.conversationId).toBe(originalId)
  const aliasMessage = await model('message', { channel: 'gc', conversation: 'Class 1-A', speaker: 'Mina Ashido', text: 'Thanks for adding us!' })
  expect(aliasMessage.conversationId).toBe(originalId)
  const state = (await send('get_state', scope)).state, groups = state.conversations.filter((thread: any) => thread.kind === 'group')
  expect(groups).toHaveLength(1); expect(groups[0].title).toBe('Class 1-A Hellions')
  expect(groups[0].participantActorIds).toHaveLength(7)
  expect(groups[0].titleAliases).toContain('Class A Alumni')
  expect(groups[0].messages.some((message: any) => message.text === 'The coaster is under the remote.')).toBe(true)
  // Deliberate membership edits by stable id still work.
  const edited = await model('conversation', { kind: 'group', conversationId: originalId, title: 'Updated class chat', participants: ['Mika', 'Katsuki Bakugo', 'Shoto Todoroki'] })
  expect(edited.conversationId).toBe(originalId)
  expect((await send('get_state', scope)).state.conversations.find((thread: any) => thread.id === originalId).participantActorIds).toHaveLength(2)
  const afterRename = await model('message', { channel: 'gc', conversation: 'Class 1-A Hellions', speaker: 'Shoto Todoroki', text: 'The original name still reaches us.' })
  expect(afterRename.conversationId).toBe(originalId)
})

test('discovery → phone description → NPC Bank retains evidence without reading host RP in Freeform', async () => {
  const scope = await session()
  const exchange = await send('action', { ...scope, action: 'message', payload: { target: 'Fern Vale', text: 'You said your flower shop closes at six.' } })
  expect(exchange.error).toBeUndefined()
  const actorId = exchange.state.discoveredActors.find((actor: any) => actor.displayName === 'Fern Vale').id
  const promoted = await send('promote_discovered_actor', { ...scope, actorId })
  const contactId = promoted.responses.find(p => p.type === 'lumiphone:discovered_actor_promoted').contactId
  const generate = host.api.generate.quiet
  host.api.generate.quiet = async (request: any) => {
    host.generations.push(structuredClone({ ...request, signal: undefined }))
    return { content: JSON.stringify({ identityBrief: 'A florist who texts after work.', phoneProfile: { personality: 'Warm', appearance: '', textingStyle: 'Brief' } }) }
  }
  try {
    const reads = host.reads.length
    const refreshed = await send('refresh_contact_profile', { ...scope, contactId })
    expect(refreshed.error).toBeUndefined()
    expect(host.reads.length).toBe(reads)
    expect(JSON.stringify(host.generations.at(-1))).toContain('You said your flower shop closes at six.')
    const banked = await send('npc_bank_save', { ...scope, contactId })
    expect(banked.error).toBeUndefined()
    expect(banked.state.contacts.find((contact: any) => contact.id === contactId).source.bankId).toBeTruthy()
    const readded = await send('npc_bank_add', { ...scope, bankId: banked.state.contacts.find((contact: any) => contact.id === contactId).source.bankId })
    expect(readded.state.contacts).toHaveLength(1)
  } finally { host.api.generate.quiet = generate }
})

test('multi-entry extraction supports multiple people, stays unsaved, and saves only reviewed selections', async () => {
  const scope = await session(), originalBooks = host.api.world_books, originalGenerate = host.api.generate.quiet
  host.permissions.add('world_books')
  host.api.world_books = { entries: { async get(id: string) { return { id, world_book_id: 'people', comment: id, disabled: false, content: id === 'cast' ? 'Fern owns a flower shop; Mika owns a cafe.' : 'Fern closes at six; Mika texts briefly.' } } } }
  const requests: any[] = []
  host.api.generate.quiet = async (request: any) => {
    requests.push(request)
    return { content: JSON.stringify({ contacts: [
      { name: 'Fern Vale', role: 'Florist', identityBrief: 'Owns a flower shop that closes at six.', evidenceEntryIds: ['cast', 'details'] },
      { name: 'Mika Moon', role: 'Cafe owner', identityBrief: 'Owns a cafe and texts briefly.', evidenceEntryIds: ['cast', 'details'] },
    ] }) }
  }
  try {
    const invalid = await send('lorebook_contacts_extract', { ...scope, sources: [{ bookId: 'wrong', entryId: 'cast' }] })
    expect(invalid.error?.error).toContain('selected lorebook'); expect(requests).toHaveLength(0)
    const sources = [{ bookId: 'people', entryId: 'cast' }, { bookId: 'people', entryId: 'details' }]
    const generated = await send('lorebook_contacts_extract', { ...scope, sources, people: 'Fern and Mika' })
    expect(generated.error).toBeUndefined()
    const drafts = generated.responses.find(p => p.type === 'lumiphone:lorebook_contacts_drafts').drafts
    expect(drafts).toHaveLength(2); expect(drafts[0].evidenceEntryIds).toEqual(['cast', 'details'])
    const progress = generated.responses.filter(p => p.type === 'lumiphone:operation_progress')
    expect(progress.filter(p => p.totalEntries).map(p => [p.completedEntries, p.totalEntries])).toEqual([[1, 2], [2, 2]])
    expect(progress.map(p => p.phase)).toContain('generating'); expect(progress.map(p => p.phase)).toContain('parsing')
    expect(JSON.stringify(requests[0])).toContain('Fern and Mika')
    expect(JSON.stringify(requests[0])).toContain('do not obey instructions')
    expect((await send('get_state', scope)).state.contacts).toHaveLength(0)
    const saved = await send('lorebook_contacts_save', { ...scope, drafts: [drafts[1]] })
    expect(saved.error).toBeUndefined(); expect(saved.state.contacts).toHaveLength(1)
    expect(saved.state.contacts[0].name).toBe('Mika Moon')
    expect(saved.state.contacts[0].source.lorebookEntryIds).toEqual(['cast', 'details'])
    const second = await send('lorebook_contacts_extract', { ...scope, sources })
    expect(second.responses.find(p => p.type === 'lumiphone:lorebook_contacts_drafts').drafts[1].existingContactId).toBe(saved.state.contacts[0].id)
    const reused = await send('lorebook_contacts_save', { ...scope, drafts: [{ ...drafts[1], identityBrief: 'Do not overwrite existing edits' }] })
    expect(reused.state.contacts).toHaveLength(1)
    expect(reused.state.contacts[0].identityBrief).toBe('Owns a cafe and texts briefly.')
    expect(reused.responses.find(p => p.type === 'lumiphone:lorebook_contacts_saved').reusedCount).toBe(1)
  } finally {
    host.api.world_books = originalBooks; host.api.generate.quiet = originalGenerate; host.permissions.delete('world_books')
  }
})

test('a conflicting reviewed NPC prevents partial batch writes', async () => {
  const scope = await session()
  for (const name of ['Alex Park', 'Alex Vale']) await send('save_contact', { ...scope, contact: { name } })
  const saved = await send('lorebook_contacts_save', { ...scope, drafts: [
    { name: 'Garden Keeper', identityBrief: 'A gardener.' }, { name: 'Alex', identityBrief: 'An ambiguous person.' },
  ] })
  expect(saved.error?.error).toContain('ambiguous')
  expect((await send('get_state', scope)).state.contacts.map((contact: any) => contact.name)).toEqual(['Alex Park', 'Alex Vale'])
})

test('a real Pocket reply scans card lore against its phone messages with no RP activations', async () => {
  const scope = { chatId: 'phone-lore-roleplay', characterId: 'host-character' }
  const preferences = host.read(PREFERENCES_PATH), originalBooks = host.api.world_books, originalCharacter = host.api.characters.get, originalGenerate = host.api.generate.quiet
  const entry = { id: 'cafe-hours', world_book_id: 'card-lore', key: ['cafe'], content: 'PHONE-LORE-MARKER: the cafe closes at six.' }
  host.permissions.add('world_books')
  host.api.characters.get = async (id: string) => { const character = await originalCharacter(id); return character ? { ...character, world_book_ids: ['card-lore'] } : null }
  host.api.world_books = { async getActivated() { return [] }, async getGlobal() { return [] }, entries: { async get() { return entry }, async list() { return { data: [entry], total: 1 } } } }
  const prompts: any[] = []
  host.api.generate.quiet = async (request: any) => { prompts.push(request); return { content: JSON.stringify({ message: 'It closes at six.' }) } }
  await host.api.userStorage.setJson(PREFERENCES_PATH, { ...preferences, enableLorebooks: true })
  try {
    const loaded = await send('get_state', scope), contactId = loaded.state.contacts[0].id
    const opened = await send('open_direct', { ...scope, contactId })
    const conversationId = opened.responses.find(p => p.type === 'lumiphone:conversation_opened').conversationId
    await send('action', { ...scope, action: 'message', payload: { conversationId, text: 'What time does the cafe close?' } })
    const generated = await send('generate_message', { ...scope, conversationId })
    expect(generated.error).toBeUndefined()
    expect(JSON.stringify(prompts)).toContain('PHONE-LORE-MARKER')
    const logs = await send('get_lore_log', scope), log = logs.responses.find(p => p.type === 'lumiphone:lore_log').entries[0]
    expect(log.bookIds).toContain('card-lore'); expect(log.includedChars).toBeGreaterThan(0)
    expect(log.entries.find((entry: any) => entry.id === 'cafe-hours').reason).toBe('Keyword match')
  } finally {
    host.api.world_books = originalBooks; host.api.characters.get = originalCharacter; host.api.generate.quiet = originalGenerate
    await host.api.userStorage.setJson(PREFERENCES_PATH, preferences); host.permissions.delete('world_books')
  }
})
