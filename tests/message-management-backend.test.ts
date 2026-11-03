import { beforeAll, expect, test } from 'bun:test'
import { freeformHost } from './fixtures/freeform-host.js'
import { PREFERENCES_PATH } from '../src/domain/preferences.js'
import { removePhoneConversations } from '../src/domain/conversation-deletion.js'

const host = freeformHost()
beforeAll(async () => { (globalThis as any).spindle = host.api; await import('../src/backend.ts?message-management') })
let serial = 0
async function send(type: string, payload: Record<string, unknown> = {}) {
  const offset = host.sends.length
  await host.send({ type: `lumiphone:${type}`, requestId: `management-${++serial}`, ...payload })
  const responses = host.sends.slice(offset)
  return { responses, error: responses.find(response => response.type === 'lumiphone:error'), state: responses.findLast(response => response.type === 'lumiphone:state')?.state }
}
const scope = (suffix: string) => ({ chatId: `management-${suffix}`, characterId: 'host-character' })

test('interrupted replies survive reload, retry in place, and never become fictional messages', async () => {
  const context = scope('failure'), initial = await send('get_state', context), conversationId = initial.state.conversations[0].id
  const original = host.api.generate.quiet, saved = host.read(PREFERENCES_PATH)
  await host.api.userStorage.setJson(PREFERENCES_PATH, { ...saved, generationConnectionMaxTokens: { 'fixture-model': 12000 } })
  host.api.generate.quiet = async () => ({ content: '{"message":"cut short"}', stop_reason: 'max_tokens' })
  try {
    const failed = await send('generate_message', { ...context, conversationId })
    expect(failed.error).toBeDefined()
    expect(failed.state.conversations[0].messages).toHaveLength(0)
    expect(failed.state.conversations[0].replyFailure.kind).toBe('length')
    expect((await send('get_state', context)).state.conversations[0].replyFailure.kind).toBe('length')
    host.api.generate.quiet = async () => ({ content: '{"message":"A complete reply."}', finish_reason: 'stop' })
    const retried = await send('generate_message', { ...context, conversationId })
    expect(retried.error).toBeUndefined(); expect(retried.state.conversations[0].replyFailure).toBeUndefined()
    expect(retried.state.conversations[0].messages).toHaveLength(1)
    const messageId = retried.state.conversations[0].messages[0].id
    host.api.generate.quiet = async () => ({ content: '', finish_reason: 'length', usage: { completion_tokens: 12000, reasoning_tokens: 12000 } })
    const failedRetry = await send('retry_message', { ...context, conversationId, messageId })
    expect(failedRetry.state.conversations[0].replyFailure.retryMessageId).toBe(messageId)
    expect(failedRetry.state.conversations[0].messages[0].text).toBe('A complete reply.')
  } finally { host.api.generate.quiet = original; await host.api.userStorage.setJson(PREFERENCES_PATH, saved) }
})

test('whole-chat deletion stays deleted after reload and preserves Contacts and other chats', async () => {
  const context = scope('deletion'), initial = await send('get_state', context), activeId = initial.state.conversations[0].id
  await send('save_contact', { ...context, contact: { name: 'Fern Vale' } })
  const state = (await send('get_state', context)).state, fernId = state.contacts.find((contact: any) => contact.name === 'Fern Vale').id
  const opened = await send('open_direct', { ...context, contactId: fernId }), fernThread = opened.responses.find(response => response.type === 'lumiphone:conversation_opened').conversationId
  const invalid = await send('delete_conversations', { ...context, conversationIds: [activeId, 'missing-thread'] })
  expect(invalid.error).toBeDefined(); expect((await send('get_state', context)).state.conversations).toHaveLength(2)
  const deleted = await send('delete_conversations', { ...context, conversationIds: [activeId] })
  expect(deleted.error).toBeUndefined(); expect(deleted.state.contacts).toHaveLength(2)
  const reloaded = (await send('get_state', context)).state
  expect(reloaded.conversations.map((thread: any) => thread.id)).toEqual([fernThread])
  const reopened = await send('open_direct', { ...context, contactId: reloaded.contacts.find((contact: any) => contact.source.kind === 'character').id })
  expect(reopened.error).toBeUndefined(); expect(reopened.responses.find(response => response.type === 'lumiphone:conversation_opened').conversationId).not.toBe(activeId)
})

test('deletion cleans thread-owned artifacts and keeps receipts and independent events', async () => {
  const context = scope('cleanup'), state = (await send('get_state', context)).state, id = state.conversations[0].id
  const message = { id: 'm', conversationId: id }
  state.actorMemories = [message]
  state.notifications = [{ route: { app: 'messages', conversationId: id } }, { route: { app: 'notes', noteId: 'keep' } }]
  state.activities = [{ id: 'activity', route: { app: 'messages', conversationId: id } }]
  state.processedCommands = [{ id: 'receipt', activityId: 'activity' }]
  state.references = [{ conversationId: id }]; state.relays = [{ conversationId: id }]; state.groupBatches = [{ conversationId: id }]
  state.events = [{ id: 'keep-event', phoneHistoryBoundary: { conversationId: id, messageIds: ['m'] } }]
  expect(removePhoneConversations(state, [id])).toBe(1)
  for (const key of ['conversations', 'actorMemories', 'activities', 'references', 'relays', 'groupBatches']) expect(state[key]).toHaveLength(0)
  expect(state.processedCommands).toEqual([{ id: 'receipt', activityId: undefined }])
  expect(state.notifications).toHaveLength(1); expect(state.events[0].id).toBe('keep-event'); expect(state.events[0].phoneHistoryBoundary).toBeUndefined()
})

test('deleting a chat aborts an in-flight reply and rejects its late result', async () => {
  const context = scope('late'), initial = await send('get_state', context), conversationId = initial.state.conversations[0].id, original = host.api.generate.quiet
  let ready!: () => void
  const started = new Promise<void>(resolve => { ready = resolve })
  host.api.generate.quiet = async (request: any) => { ready(); await new Promise((_, reject) => request.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true })); return { content: '{"message":"LATE"}' } }
  try {
    const pending = send('generate_message', { ...context, conversationId }); await started
    const removed = await send('delete_conversations', { ...context, conversationIds: [conversationId] }); await pending
    expect(removed.error).toBeUndefined()
    expect((await send('get_state', context)).state.conversations).toHaveLength(0)
  } finally { host.api.generate.quiet = original }
})
