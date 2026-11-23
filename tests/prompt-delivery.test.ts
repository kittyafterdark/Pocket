import { beforeAll, expect, test } from 'bun:test'
import type { LlmMessageDTO } from 'lumiverse-spindle-types'
import { injectPromptBlocks, normalizePromptDelivery, normalizePromptPlacement, promptInsertionIndex } from '../src/domain/prompt-delivery.js'
import { freeformHost } from './fixtures/freeform-host.js'

const messages: LlmMessageDTO[] = [
  { role: 'system', content: 'Preset before' },
  { role: 'user', content: 'Old turn', __isChatHistory: true, sourceMessageId: 'old' },
  { role: 'assistant', content: 'Preset depth block' },
  { role: 'assistant', content: 'New turn', __isChatHistory: true, sourceMessageId: 'new' },
  { role: 'system', content: 'Preset after' },
]

test('delivery defaults retain Pocket’s original system-at-end behavior and sanitize invalid values', () => {
  expect(normalizePromptDelivery(null)).toEqual({ delivery: 'injection', placement: { role: 'system', position: 'prompt_end', depth: 0 } })
  expect(normalizePromptPlacement({ role: 'tool', position: 'bad', depth: -3 })).toEqual({ role: 'system', position: 'prompt_end', depth: 0 })
  expect(normalizePromptPlacement({ depth: 2.8 }).depth).toBe(2)
  expect(normalizePromptPlacement({ depth: Infinity }).depth).toBe(0)
  expect(normalizePromptPlacement({ depth: 99999 }).depth).toBe(10000)
})

test('history boundaries match Lumiverse tagged-turn depth and ignore preset/injected messages', () => {
  for (const [position, depth, index] of [['prompt_end', 0, 5], ['pre_history', 0, 1], ['post_history', 0, 4], ['in_history', 0, 4], ['in_history', 1, 3], ['in_history', 2, 1], ['in_history', 900, 1]] as const) {
    expect(promptInsertionIndex(messages, { role: 'system', position, depth })).toBe(index)
  }
  expect(promptInsertionIndex([], normalizePromptPlacement(null))).toBe(0)
  const untagged: LlmMessageDTO[] = [{ role: 'system', content: 'Preset' }, { role: 'user', content: 'Untagged' }]
  expect(promptInsertionIndex(untagged, { role: 'system', position: 'in_history', depth: 3 })).toBe(2)
})

test('all message roles work, equal-boundary ordering is stable, and breakdown indexes track shifted messages', () => {
  const original = JSON.stringify(messages)
  const result = injectPromptBlocks(messages, [
    { name: 'Memory', content: 'MEMORY', delivery: 'injection', placement: { role: 'user', position: 'in_history', depth: 1 } },
    { name: 'Trackers', content: 'TRACKERS', delivery: 'injection', placement: { role: 'assistant', position: 'pre_history', depth: 0 } },
    { name: 'Same boundary', content: 'SECOND', delivery: 'injection', placement: { role: 'system', position: 'pre_history', depth: 0 } },
    { name: 'Macro', content: 'DO NOT INJECT', delivery: 'macros', placement: normalizePromptPlacement(null) },
  ])
  expect(result.messages.map(message => message.content)).toEqual(['Preset before', 'TRACKERS', 'SECOND', 'Old turn', 'Preset depth block', 'MEMORY', 'New turn', 'Preset after'])
  expect(result.breakdown).toEqual([{ messageIndex: 5, name: 'Memory' }, { messageIndex: 1, name: 'Trackers' }, { messageIndex: 2, name: 'Same boundary' }])
  expect(result.messages[1].role).toBe('assistant'); expect(result.messages[5].role).toBe('user')
  expect(JSON.stringify(messages)).toBe(original)
})

const host = freeformHost()
beforeAll(async () => { (globalThis as any).spindle = host.api; await import('../src/backend.ts?prompt-delivery') })
const scope = { chatId: 'prompt-delivery-chat', characterId: 'host-character' }
let serial = 0
async function send(type: string, data: Record<string, unknown> = {}, target = scope) {
  const start = host.sends.length
  await host.send({ type: `lumiphone:${type}`, requestId: `prompt-test-${++serial}`, ...target, ...data })
  const responses = host.sends.slice(start)
  expect(responses.find(response => response.type === 'lumiphone:error')).toBeUndefined()
  return responses
}

test('saved memory and tracker placements reach the real interceptor with correct role and breakdown attribution', async () => {
  await send('get_state')
  await send('action', { action: 'tracker', payload: { id: 'trust', key: 'trust', label: 'Trust', kind: 'meter', value: 42, min: 0, max: 100 } })
  await send('save_prompt_settings', { settings: { delivery: 'injection', placement: { role: 'user', position: 'in_history', depth: 1 } } })
  await send('save_tracker_settings', { settings: { delivery: 'injection', prompt: 'Tracker guidance.', placement: { role: 'assistant', position: 'pre_history', depth: 0 } } })
  const result = await host.interceptors[0](messages, scope)
  expect(result.messages[1].role).toBe('assistant'); expect(result.messages[1].content).toContain('POCKET TRACKERS — LIVE STATE')
  expect(result.messages[4].role).toBe('user'); expect(result.messages[4].content).toContain('Current Pocket snapshot:')
  for (const block of result.breakdown) expect(result.messages[block.messageIndex].content).toContain(block.name === 'Pocket memory' ? 'Current Pocket snapshot:' : 'Tracker guidance.')
  const reloaded = (await send('get_state')).find(response => response.type === 'lumiphone:state').state
  expect(reloaded.promptSettings.placement.depth).toBe(1)
  expect(reloaded.trackerSettings.placement.role).toBe('assistant')
})

test('prompt review uses the actual memory/tracker builders without writes, generation, or receipt consumption', async () => {
  await send('action', { action: 'tracker', payload: { id: 'private', key: 'private', label: 'PRIVATE TRACKER', kind: 'meter', visibleToModel: false } })
  const writes = host.writes.length, generations = host.generations.length, storage = JSON.stringify([...host.store])
  const review = (await send('review_prompt')).find(response => response.type === 'lumiphone:prompt_review').review
  expect(host.writes.length).toBe(writes); expect(host.generations.length).toBe(generations); expect(JSON.stringify([...host.store])).toBe(storage)
  expect(review.enabled).toBe(true)
  expect(JSON.stringify(review)).not.toContain('PRIVATE TRACKER')
  const result = await host.interceptors[0](messages, scope)
  for (const block of review.blocks.filter((block: any) => block.delivery === 'injection')) expect(result.messages.some((message: any) => message.content === block.content)).toBe(true)
  const path = `phones/${scope.chatId}__${scope.characterId}.json`
  const saved = host.read(path), pending = structuredClone(saved)
  pending.references = [{ id: 'review-reference', ...scope, conversationId: 'review-thread', conversationTitle: 'Bookshop', conversationKind: 'direct', scope: 'conversation', visibility: 'context', participants: [], snapshot: 'A quiet evening', messages: [{ messageId: 'review-message', sender: 'contact', senderName: 'Alex', text: 'Bring the book.', createdAt: '2026-11-01T12:00:00Z' }], createdAt: '2026-11-01T12:00:00Z', status: 'armed' }]
  pending.relays = [{ id: 'review-relay', ...scope, contactId: 'host-character', conversationId: 'review-thread', kind: 'arrival', reason: 'arriving', actorState: 'arriving', conversationTail: { text: 'I am on my way.', recentMessageIds: ['review-message'], updatedAt: '2026-11-01T12:00:00Z' }, latestExchange: 'I am on my way.', createdAt: '2026-11-01T12:00:00Z', status: 'pending', continuation: { state: 'accepted' } }]
  host.store.set(`fixture:${path}`, pending)
  const before = JSON.stringify(host.read(path)), beforeWrites = host.writes.length
  const attached = (await send('review_prompt')).find(response => response.type === 'lumiphone:prompt_review').review
  expect(attached.blocks.some((block: any) => block.content.includes('Bring the book.'))).toBe(true)
  expect(attached.blocks.some((block: any) => block.content.includes('I am on my way.'))).toBe(true)
  expect(JSON.stringify(host.read(path))).toBe(before)
  expect(host.writes.length).toBe(beforeWrites)
  host.store.set(`fixture:${path}`, saved)
})

test('memory macro delivery is exclusive, live, read-only, chat-scoped, and independent from trackers', async () => {
  const resolve = host.macros.get('pocket_memory').handler
  expect(await resolve({ chatId: scope.chatId, commit: false })).toBe('')
  await send('save_prompt_settings', { settings: { delivery: 'macros' } })
  const writes = host.writes.length
  expect(await resolve({ chatId: scope.chatId, commit: false })).toContain('Current Pocket snapshot:')
  expect(host.writes.length).toBe(writes)
  expect(await resolve({})).toBe('')
  expect(await resolve({ chatId: scope.chatId, userId: 'other-user' })).toBe('')
  const other = { ...scope, chatId: 'other-prompt-chat' }
  await send('get_state', {}, other)
  expect(await resolve({ chatId: other.chatId })).toBe('')
  const result = await host.interceptors[0](messages, scope)
  expect(result.messages.some((message: any) => String(message.content).includes('Current Pocket snapshot:'))).toBe(false)
  expect(result.messages.some((message: any) => String(message.content).includes('POCKET TRACKERS — LIVE STATE'))).toBe(true)
  await send('save_preferences', { preferences: { suppressRoleplayTools: true } })
  expect(await resolve({ chatId: scope.chatId })).toBe('')
  expect((await send('review_prompt')).find(response => response.type === 'lumiphone:prompt_review').review.enabled).toBe(false)
  await send('save_preferences', { preferences: { suppressRoleplayTools: false } })
})
