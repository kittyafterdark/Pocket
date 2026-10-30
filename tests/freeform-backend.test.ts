import { beforeAll, expect, test } from 'bun:test'
import { freeformHost } from './fixtures/freeform-host.js'
import { FREEFORM_INDEX_PATH } from '../src/domain/freeform.js'

const host = freeformHost()
beforeAll(async () => { await import('../src/backend.js') })
let serial = 0
async function send(type: string, payload: Record<string, unknown> = {}, userId?: string) {
  const requestId = `freeform-test-${++serial}`, offset = host.sends.length
  await host.send({ type: `lumiphone:${type}`, requestId, ...payload }, userId)
  const responses = host.sends.slice(offset)
  return { responses, error: responses.find(p => p.type === 'lumiphone:error'), state: responses.findLast(p => p.type === 'lumiphone:state')?.state,
    session: responses.find(p => p.type === 'lumiphone:freeform_opened')?.session }
}
const scope = (id: string) => ({ chatId: id, characterId: '_none' })

test('multiple named sessions for one Persona stay independent of host identity and history', async () => {
  const first = await send('freeform_create', { personaId: 'persona-fern', name: '  After hours  ' })
  expect(first.error).toBeUndefined(); expect(first.session.name).toBe('After hours')
  expect(first.state.pocketPersona.displayName).toBe('Fern'); expect(first.state.pocketPersona.source).toBe('manual')
  expect(first.state.characterId).toBe('_none'); expect(first.state.contacts).toHaveLength(0)
  const id = first.session.id
  const note = await send('action', { ...scope(id), action: 'note', payload: { title: 'Session journal', body: 'Only here.' } })
  expect(note.error).toBeUndefined(); expect(note.state.notes[0].title).toBe('Session journal')
  host.switchPersona('persona-mika'); await host.emit('PERSONA_CHANGED')
  host.switchChat('another-host-chat'); await host.emit('CHAT_SWITCHED', { chatId: 'another-host-chat' })
  const reopened = await send('freeform_open', { sessionId: id })
  expect(reopened.state.pocketPersona.displayName).toBe('Fern'); expect(reopened.state.notes[0].body).toBe('Only here.')
  const second = await send('freeform_create', { personaId: 'persona-fern', name: 'Another world' })
  expect(second.session.id).not.toBe(id); expect(second.state.notes).toHaveLength(0)
  const otherUser = await send('freeform_open', { sessionId: id }, 'another-user')
  expect(otherUser.error.error).toContain('no longer exists')
  const renamed = await send('freeform_rename', { ...scope(id), name: 'Night library' })
  expect(renamed.error).toBeUndefined()
  expect(host.read(FREEFORM_INDEX_PATH).sessions.find((s: any) => s.id === id).name).toBe('Night library')
  expect(host.reads.every(id => !id.startsWith('_freeform_'))).toBe(true)
})

test('shared contacts and generation work without reading or handing off to host RP', async () => {
  const { session } = await send('freeform_create', { personaId: 'persona-fern', name: 'Messages' })
  const imported = await send('import_contact', { ...scope(session.id), kind: 'character', sourceId: 'host-character' })
  expect(imported.error).toBeUndefined()
  const conversationId = imported.state.conversations[0].id
  host.reads.length = 0
  const generated = await send('generate_message', { ...scope(session.id), conversationId })
  expect(generated.error).toBeUndefined()
  const conversation = generated.state.conversations.find((c: any) => c.id === conversationId)
  expect(conversation.messages.at(-1).text).toBe('A reply from this session alone.')
  expect(conversation.availability.state).toBe('remote'); expect(generated.state.relays).toHaveLength(0)
  expect(host.reads).toEqual([])
  expect(JSON.stringify(host.generations.at(-1))).not.toContain('HOST HISTORY MUST NEVER ENTER FREEFORM')
  expect(JSON.stringify(host.generations.at(-1))).toContain('FREEFORM SESSION')
  for (const type of ['quickstart_event', 'continue_relay', 'arm_reference', 'timeline_review', 'gallery_add_to_chat']) {
    expect((await send(type, scope(session.id))).error.error).toContain('needs a roleplay chat')
  }
})

test('copy needs explicit override, backs up base Pocket, and keeps source separate', async () => {
  const { session } = await send('freeform_create', { personaId: 'persona-fern', name: 'Copy me' })
  const source = await send('action', { ...scope(session.id), action: 'note', payload: { title: 'Freeform note', body: 'Source stays intact' } })
  host.switchChat('copy-target')
  const base = await send('action', { chatId: 'copy-target', characterId: 'host-character', action: 'note', payload: { title: 'Base note', body: 'Keep this in the backup' } })
  expect(base.error).toBeUndefined()
  const rejected = await send('freeform_copy_to_chat', { ...scope(session.id), targetChatId: 'copy-target', override: false })
  expect(rejected.error.error).toContain('base Pocket was kept')
  expect(host.read('phones/copy-target__host-character.json').notes[0].title).toBe('Base note')
  const copied = await send('freeform_copy_to_chat', { ...scope(session.id), targetChatId: 'copy-target', override: true })
  expect(copied.error).toBeUndefined()
  const receipt = copied.responses.find(p => p.type === 'lumiphone:freeform_copied')
  expect(host.read(receipt.backupPath).state.notes[0].title).toBe('Base note')
  expect(host.read('phones/copy-target__host-character.json').notes).toEqual(source.state.notes)
  await send('action', { chatId: 'copy-target', characterId: 'host-character', action: 'note', payload: { title: 'Roleplay only' } })
  const original = await send('freeform_open', { sessionId: session.id })
  expect(original.state.notes).toHaveLength(1); expect(original.state.notes[0].title).toBe('Freeform note')
  const target = host.read('phones/copy-target__host-character.json')
  expect(target.activities.every((a: any) => a.scope.chatId === 'copy-target')).toBe(true)
  expect((await send('freeform_copy_to_chat', { ...scope(session.id), targetChatId: 'stale-target', override: true })).error.error).toContain('active chat changed')
})

test('invalid session names and unsupported directories fail before writes', async () => {
  const before = host.writes.length
  expect((await send('freeform_create', { personaId: 'persona-fern', name: ' ' })).error.error).toContain('Name your session')
  expect((await send('freeform_create', { personaId: 'missing', name: 'New' })).error.error).toContain('unavailable')
  expect(host.writes.length).toBe(before)
  await host.api.userStorage.setJson(FREEFORM_INDEX_PATH, { version: 99, sessions: [] }, { userId: 'future-user' })
  expect((await send('freeform_create', { personaId: 'persona-fern', name: 'New' }, 'future-user')).error.error).toContain('unsupported')
  expect(host.read(FREEFORM_INDEX_PATH, 'future-user').version).toBe(99)
})

test('a failed base backup prevents replacement and leaves both histories intact', async () => {
  const { session } = await send('freeform_create', { personaId: 'persona-fern', name: 'Backup safety' })
  host.switchChat('backup-target')
  const base = await send('action', { chatId: 'backup-target', characterId: 'host-character', action: 'note', payload: { title: 'Keep me' } })
  const write = host.api.userStorage.setJson
  host.api.userStorage.setJson = async (path: string, ...args: any[]) => {
    if (path.startsWith('freeform/backups/')) throw new Error('Fixture backup failed')
    return write(path, ...args)
  }
  try {
    const result = await send('freeform_copy_to_chat', { ...scope(session.id), targetChatId: 'backup-target', override: true })
    expect(result.error.error).toContain('backup failed')
    expect(host.read('phones/backup-target__host-character.json').notes).toEqual(base.state.notes)
    expect((await send('freeform_open', { sessionId: session.id })).state.notes).toHaveLength(0)
  } finally { host.api.userStorage.setJson = write }
})

test('resetting a session keeps its chosen identity and resetting roleplay preserves Freeform stores', async () => {
  const { session } = await send('freeform_create', { personaId: 'persona-fern', name: 'Keep identity' })
  const reset = await send('reset_current', scope(session.id))
  expect(reset.error).toBeUndefined(); expect(reset.state.pocketPersona.displayName).toBe('Fern'); expect(reset.state.setup.initialized).toBe(true)
  await send('reset_all_roleplay', { chatId: 'copy-target', characterId: 'host-character' })
  expect((await send('freeform_open', { sessionId: session.id })).state.pocketPersona.displayName).toBe('Fern')
})
