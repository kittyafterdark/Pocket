import { beforeAll, expect, test } from 'bun:test'
import { CoalescedWork, WorkPool } from '../src/backend/coalesced-work.js'
import { PREFERENCES_PATH } from '../src/domain/preferences.js'
import { freeformHost } from './fixtures/freeform-host.js'

const host = freeformHost()
beforeAll(async () => { (globalThis as any).spindle = host.api; await import('../src/backend.ts?state-sync') })
const context = { chatId: 'sync-burst', characterId: 'host-character' }
const refresh = (scope = context, userId?: string) => host.send({ type: 'lumiphone:get_state', ...scope }, userId)
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}
async function flush() { for (let i = 0; i < 100; i++) await Promise.resolve() }

test('world setup bounds the host read and shares a failed generation across requests', async () => {
  const scope = { chatId: 'world-budget', characterId: 'host-character' }
  const user = 'world-budget-user'
  const scan = (requestId: string) => host.send({ type: 'lumiphone:setup_world_seed', ...scope, requestId }, user)
  const originalRead = host.api.chat.getMessages
  const originalQuiet = host.api.generate.quiet
  const reads: any[] = [], calls: any[] = []
  const started = deferred(), release = deferred(), joined = deferred()
  const messages = Array.from({ length: 59 }, (_, i) => ({
    id: `host-${i}`, role: i % 2 ? 'assistant' : 'user', content: `Fixture turn ${i}.`,
  }))
  await refresh(scope, user)
  const phoneKey = [...host.store.keys()].find(key => key.startsWith(user + ':phones/') && host.store.get(key).chatId === scope.chatId)!
  const phone = host.store.get(phoneKey)
  phone.trackers = Array.from({ length: 12 }, (_, i) => ({
    id: `field-${i}`, key: `field_${i}`, label: `Field ${i}`, kind: 'state', freeText: true, state: 's'.repeat(2_000),
    modelPrompt: 'g'.repeat(2_000), allowModelWrite: true, updateMode: 'model', target: { type: 'custom', label: 'World' },
  }))
  await host.api.userStorage.setJson(PREFERENCES_PATH, {
    ...host.read(PREFERENCES_PATH, user),
    automaticGenerationRetry: true, reasoningEffort: 'high', generationConnectionMaxTokens: { 'fixture-model': 16_000 },
  }, { userId: user })
  host.api.chat.getMessages = async (chatId: string, options: any) => {
    reads.push({ chatId, ...options })
    return messages.slice(-options.tail)
  }
  let fail = true
  host.api.generate.quiet = async (request: any) => {
    calls.push(request)
    started.resolve()
    await release.promise
    return fail ? { content: '', finish_reason: 'length' } : { content: '{"world":{},"facts":[],"actors":[]}' }
  }
  host.connect(event => {
    if (event.requestId === 'world-joined' && event.phase === 'generating') joined.resolve()
  })
  const first = scan('world-first')
  try {
    await started.promise
    const second = scan('world-joined')
    await joined.promise
    await flush()
    release.resolve()
    await Promise.all([first, second])
    expect(reads).toEqual([{ chatId: scope.chatId, tail: 12, light: true, includeExtra: false, ownMetadataOnly: true }])
    expect(calls).toHaveLength(1)
    expect(calls[0].parameters.max_tokens).toBe(2_000)
    expect(calls[0].reasoning).toEqual({ source: 'off' })
    const prompt = calls[0].messages[1].content
    const trackers = prompt.split('MODEL-WRITABLE TRACKERS:\n')[1].split('\n\nRECENT NARRATIVE')[0]
    expect(trackers.length).toBeLessThanOrEqual(7_000)
    expect(JSON.parse(trackers).length).toBeGreaterThan(0)
    expect(prompt).toContain('Fixture turn 58.')
    expect(prompt).not.toContain('Fixture turn 54.')
    expect(host.sends.filter(event => ['world-first', 'world-joined'].includes(event.requestId) && event.phase === 'error')).toHaveLength(2)
    fail = false
    await scan('world-retry')
    expect(calls).toHaveLength(2)
    expect(host.sends.some(event => event.type === 'lumiphone:setup_world_done' && event.requestId === 'world-retry')).toBe(true)
  } finally {
    release.resolve()
    await first
    host.connect(() => {})
    host.api.chat.getMessages = originalRead
    host.api.generate.quiet = originalQuiet
  }
})

test('a burst of refreshes shares work and performs a trailing read of the newest state', async () => {
  await refresh()
  const path = [...host.store.keys()].find(key => key.startsWith('fixture:phones/') && host.store.get(key).chatId === context.chatId)!.slice('fixture:'.length)
  const originalRead = host.api.userStorage.getJson, originalConnections = host.api.connections.list
  const started = deferred(), release = deferred()
  let reads = 0, held = false
  host.api.userStorage.getJson = async (name: string, options: any) => { if (name === path) reads++; return originalRead(name, options) }
  host.api.connections.list = async () => {
    if (!held) { held = true; started.resolve(); await release.promise }
    return originalConnections()
  }
  const offset = host.sends.length
  const first = refresh()
  try {
    await started.promise
    const burst = Array.from({ length: 99 }, () => refresh())
    await flush()
    expect(reads).toBe(1)
    const latest = host.read(path)
    latest.notes = [{ id: 'latest', title: 'Newest saved state', body: 'Arrived during the slow refresh.' }]
    await host.api.userStorage.setJson(path, latest)
    release.resolve()
    await Promise.all([first, ...burst])
    expect(reads).toBe(2)
    const states = host.sends.slice(offset).filter(event => event.type === 'lumiphone:state')
    expect(states).toHaveLength(2)
    expect(states.at(-1).state.notes[0].title).toBe('Newest saved state')
  } finally {
    release.resolve(); await first
    host.api.userStorage.getJson = originalRead; host.api.connections.list = originalConnections
  }
})

test('disabled ambient scheduling does not enumerate saved phones on refresh', async () => {
  const original = host.api.userStorage.list
  let scans = 0
  host.api.userStorage.list = async (...args: any[]) => { scans++; return original(...args) }
  try { await refresh(); expect(scans).toBe(0) }
  finally { host.api.userStorage.list = original }
})

test('concurrent message writes are all persisted while refresh requests are coalesced', async () => {
  await refresh()
  const state = host.sends.findLast(event => event.type === 'lumiphone:state' && event.state.chatId === context.chatId).state
  const conversationId = state.conversations[0].id, offset = host.sends.length
  await Promise.all(Array.from({ length: 12 }, (_, i) => Promise.all([
    host.send({ type: 'lumiphone:action', ...context, requestId: `burst-message-${i}`, action: 'message', payload: { conversationId, sender: 'persona', text: `Rapid message ${i}` } }),
    refresh(),
  ])))
  await refresh()
  expect(host.sends.slice(offset).filter(event => event.type === 'lumiphone:error')).toHaveLength(0)
  const latest = host.sends.findLast(event => event.type === 'lumiphone:state' && event.state.chatId === context.chatId).state
  const messages = latest.conversations.find((conversation: any) => conversation.id === conversationId).messages
  for (let i = 0; i < 12; i++) expect(messages.filter((message: any) => message.text === `Rapid message ${i}`)).toHaveLength(1)
})

test('overlapping scheduler observations share a scan and honor a disable during it', async () => {
  const preferences = host.read(PREFERENCES_PATH), original = host.api.userStorage.list
  const started = deferred(), release = deferred()
  let scans = 0
  await host.api.userStorage.setJson(PREFERENCES_PATH, { ...preferences, ambientMessaging: 'normal', ambientScheduleEnabled: true })
  host.api.userStorage.list = async (...args: any[]) => { scans++; started.resolve(); await release.promise; return original(...args) }
  const first = refresh()
  try {
    await started.promise
    const burst = Array.from({ length: 12 }, (_, i) => refresh({ ...context, chatId: `scheduler-burst-${i}` }))
    await flush()
    expect(scans).toBe(1)
    await host.api.userStorage.setJson(PREFERENCES_PATH, preferences)
    release.resolve()
    await Promise.all([first, ...burst])
    expect(scans).toBe(1)
  } finally {
    release.resolve(); await first
    host.api.userStorage.list = original
    await host.api.userStorage.setJson(PREFERENCES_PATH, preferences)
  }
})

test('coalesced work isolates scopes and releases failed flights for retry', async () => {
  const work = new CoalescedWork<number>(), started = deferred(), release = deferred()
  const first = work.run('user-a/chat-a', async () => { started.resolve(); await release.promise; return 1 })
  await started.promise
  const queued = work.run('user-a/chat-a', async () => 2)
  const latest = work.run('user-a/chat-a', async () => 3)
  expect(await work.run('user-b/chat-a', async () => 4)).toBe(4)
  expect(await work.run('user-a/chat-b', async () => 5)).toBe(5)
  release.resolve()
  expect(await Promise.all([first, queued, latest])).toEqual([3, 3, 3])
  await expect(work.run('retry', async () => { throw new Error('transport unavailable') })).rejects.toThrow('transport unavailable')
  expect(await work.run('retry', async () => 6)).toBe(6)
})

test('a rejected image lookup releases its slot for queued work', async () => {
  const pool = new WorkPool(1), started = deferred(), release = deferred()
  const failed = pool.run(async () => { started.resolve(); await release.promise; throw new Error('missing image') }).catch(error => error)
  await started.promise
  const next = pool.run(async () => 'ready')
  release.resolve()
  expect((await failed).message).toBe('missing image')
  expect(await next).toBe('ready')
})
