import { expect, test } from 'bun:test'
import type { PhoneState } from '../src/types.js'
import { applySocialMutation, normalizeSocialState, socialAppSettings, socialGeneratedPosts, socialGenerationRequest } from '../src/domain/social.js'
import type { SocialApp, SocialGuestCard, SocialMutation } from '../src/domain/social.js'
import { defaultLauncherLayout, setPocketAppInstalled } from '../src/domain/launcher.js'
import { SocialWorld } from '../src/backend/social-world.js'
import { SocialAutomation } from '../src/backend/social-automation.js'

const context = { chatId: 'social-auto', characterId: 'character' }, at = '2026-10-29T14:00:00Z'
let serial = 0
const makeId = (prefix: string) => `${prefix}-${++serial}`
function stateFixture(): PhoneState {
  let layout = defaultLauncherLayout()
  for (const app of ['twitter', 'instagram', 'tumblr', 'discord'] as const) layout = setPocketAppInstalled(layout, app, true)
  return { ...context, roleplayNow: at, pocketPersonaActorId: 'persona', pocketPersona: { displayName: 'Dane', role: 'Student' }, contacts: [{ id: 'alice', name: 'Alice', role: 'Neighbour' }], discoveredActors: [], conversations: [{ includesPocketPersona: true, participantActorIds: ['alice'] }], processedCommands: [], launcherLayouts: { persona: layout, alice: layout }, social: normalizeSocialState(null) } as unknown as PhoneState
}
function change(state: PhoneState, input: SocialMutation) { state.social = applySocialMutation(state, 'persona', input, at, makeId); return state.social }
function serviceFixture() {
  let state = stateFixture(), saves = 0
  const sent: any[] = [], requests: any[] = [], photos: any[] = []
  let generation: (request: any) => Promise<Record<string, unknown>> = async () => ({ posts: [{ key: 'root', author: 'Moss', text: 'A new day', photo: 'Moss growing between harbor stones' }] })
  let guests: SocialGuestCard[] = [], generatePhoto: ((input: any) => Promise<{ imageId: string; imageUrl: string }>) | undefined
  const host = {
    loadState: async () => structuredClone(state), saveState: async (next: PhoneState) => { state = next; saves++ }, sendState: async () => {}, send: (payload: unknown) => { sent.push(payload) },
    getMessages: async () => [{ role: 'assistant', content: 'A public festival is underway.' }], runStructuredGeneration: async (_task: 'social-feed', _id: string, request: Record<string, unknown>) => { requests.push(request); return generation(request) },
    withStateLock: async <T>(_key: string, callback: () => Promise<T>) => callback(), stateKey: () => 'social-auto', nowIso: () => at, makeId, resolveImage: async () => '/images/asset.png',
    listGuestCards: async () => guests,
    resolveBankFriend: async (id: string) => guests.find(guest => guest.id === id && guest.kind === 'npc-bank') || null,
    generatePhoto: async (input: any) => { photos.push(input); return generatePhoto ? generatePhoto(input) : { imageId: 'photo-' + photos.length, imageUrl: '/images/photo-' + photos.length + '.png' } },
  }
  const world = new SocialWorld(host)
  const wait = async (condition: () => boolean) => { for (let i = 0; i < 100 && !condition(); i++) await Promise.resolve(); expect(condition()).toBe(true) }
  return { world, host, sent, requests, photos, state: () => state, saves: () => saves, wait,
    generate(fn: typeof generation) { generation = fn }, guests(cards: SocialGuestCard[]) { guests = cards }, photo(fn: NonNullable<typeof generatePhoto>) { generatePhoto = fn } }
}

test('settings are opt-in, scoped, preserve palettes and selected friends through normalization', () => {
  const state = stateFixture()
  expect(socialAppSettings(state.social!, 'persona', 'twitter')).toEqual({ refreshMode: 'manual', refreshIntervalMinutes: 5, autoRefresh: false, generateImages: false, randomCards: false, friendEntryIds: [] })
  change(state, { app: 'tumblr', action: 'preferences', theme: 'pride' })
  change(state, { app: 'twitter', action: 'settings', autoRefresh: true, generateImages: true, randomCards: true, friendEntryIds: ['friend', 'friend'] })
  state.social = normalizeSocialState(JSON.parse(JSON.stringify(state.social)))
  expect(state.social.preferences!.persona.tumblrTheme).toBe('pride')
  expect(socialAppSettings(state.social, 'persona', 'twitter')).toEqual({ refreshMode: 'turn', refreshIntervalMinutes: 5, autoRefresh: true, generateImages: true, randomCards: true, friendEntryIds: ['friend'] })
  expect(socialAppSettings(state.social, 'alice', 'twitter').autoRefresh).toBe(false)
  expect(() => change(state, { app: 'twitter', action: 'settings', autoRefresh: 'true' } as unknown as SocialMutation)).toThrow('valid social')
})

test('batch keys become canonical thread references and Instagram text reactions become comments', () => {
  const state = stateFixture()
  const posts = socialGeneratedPosts(state, 'twitter', [
    { key: 'root', author: 'Moss', text: 'Festival tonight' },
    { id: 'answer', author: 'Juniper', text: 'See you there', replyTo: 'root' },
    { key: 'nested', author: 'Moss', text: 'Save a seat', replyTo: 'answer' },
  ], 'persona', undefined, at, makeId)
  expect(posts[1].replyTo).toBe(posts[0].id); expect(posts[2].replyTo).toBe(posts[1].id)
  state.social!.posts = posts; expect(normalizeSocialState(state.social).posts[2].replyTo).toBe(posts[1].id)
  const instagram = socialGeneratedPosts(state, 'instagram', [{ key: 'photo', author: 'Moss', text: 'A moment', photo: 'Harbor lanterns' }, { author: 'Juniper', text: 'Beautiful!' }], 'persona', undefined, at, makeId)
  expect(instagram[1].replyTo).toBe(instagram[0].id)
  expect(socialGeneratedPosts(stateFixture(), 'instagram', [{ author: 'Moss', text: 'No photo parent' }], 'persona', undefined, at, makeId)).toEqual([])
})

test('all feeds are stranger-first and selected trusted friends/cards carry stable source identities only', () => {
  const state = stateFixture(), entries = [{ author: 'Alice', text: 'Cast must not leak into strangers' }, { author: 'Moss', text: 'An outsider' }]
  for (const app of ['twitter', 'tumblr', 'instagram'] as const) {
    const raw = app === 'instagram' ? entries.map(entry => ({ ...entry, photo: 'A public picture' })) : entries
    expect(socialGeneratedPosts(state, app, raw, 'persona', undefined, at, makeId).some(post => post.account.actorId === 'alice' || post.account.name === 'Alice')).toBe(false)
    expect(JSON.parse(socialGenerationRequest(state, app, 'persona', undefined, '').messages[1].content).knownActors).toEqual([])
  }
  const friends: SocialGuestCard[] = [{ id: 'bank-alice', name: 'Alice', kind: 'npc-bank', avatarUrl: '/images/alice.png' }, { id: 'character-moss', name: 'Moss', kind: 'character', avatarUrl: 'javascript:bad' }]
  const posts = socialGeneratedPosts(state, 'twitter', [{ cardId: 'bank-alice', author: 'Alice', text: 'Chosen friend' }, { cardId: 'character-moss', author: 'Moss', text: 'Chosen library card' }, { cardId: 'untrusted', author: 'Stranger', text: 'No invented source links' }], 'persona', undefined, at, makeId, friends)
  expect(posts).toHaveLength(2); expect(posts[0].account.bankId).toBe('bank-alice'); expect(posts[0].account.actorId).toBeUndefined(); expect(posts[0].account.avatarUrl).toBe('/images/alice.png')
  expect(posts[1].account.cardId).toBe('character-moss'); expect(posts[1].account.avatarUrl).toBeUndefined(); expect(state.contacts).toHaveLength(1)
})

test('Discord identities and People banks belong to individual servers, never global Contacts', () => {
  const state = stateFixture(); change(state, { app: 'discord', action: 'server', name: 'Art club', channels: ['general'] }); change(state, { app: 'discord', action: 'server', name: 'Night owls', channels: ['general'] })
  const [left, right] = state.social!.servers
  const a = socialGeneratedPosts(state, 'discord', [{ author: 'Moss', text: 'Art tonight' }], 'persona', left.channels[0].id, at, makeId)
  const b = socialGeneratedPosts(state, 'discord', [{ author: 'Moss', text: 'Coffee tonight' }], 'persona', right.channels[0].id, at, makeId)
  expect(a[0].account.id).not.toBe(b[0].account.id)
  state.social!.posts.push(...a); state.social = normalizeSocialState(state.social)
  expect(state.social.servers[0].participants![0].name).toBe('Moss')
  expect(socialGeneratedPosts(state, 'discord', [{ author: 'Juniper', text: 'Not in this bank' }], 'persona', left.channels[0].id, at, makeId)).toEqual([])
  change(state, { app: 'discord', action: 'participant', serverId: left.id, name: 'Juniper', bio: 'A local painter' })
  expect(socialGeneratedPosts(state, 'discord', [{ author: 'Juniper', text: 'Now a member' }], 'persona', left.channels[0].id, at, makeId)).toHaveLength(1)
  expect(state.contacts).toHaveLength(1)
  expect(() => change(state, { app: 'discord', action: 'participant', serverId: left.id, accountId: b[0].account.id, name: 'Borrowed' })).toThrow('this server')
})

test('service builds at most two real feed photos, while provider failures retain captions and descriptions', async () => {
  const f = serviceFixture(); change(f.state(), { app: 'instagram', action: 'settings', generateImages: true })
  f.generate(async () => ({ posts: Array.from({ length: 3 }, (_, i) => ({ author: 'Moss-' + i, text: 'Caption ' + i, photo: 'Public landscape ' + i })) }))
  f.photo(async input => { if (input.description.endsWith('1')) throw new Error('Provider failed'); return { imageId: 'real-image', imageUrl: '/images/real-image.png' } })
  await f.world.refresh(context, 'persona', 'instagram', undefined, 'images')
  expect(f.photos).toHaveLength(2); expect(f.state().social!.posts).toHaveLength(3)
  expect(f.state().social!.posts[0].imageId).toBe('real-image'); expect(f.state().social!.posts[1].photo).toBe('Public landscape 1'); expect(f.state().social!.posts[1].imageId).toBeUndefined()
})

test('automatic refresh deduplicates persisted turn receipts and stops commit when disabled mid-flight', async () => {
  const f = serviceFixture(); change(f.state(), { app: 'twitter', action: 'settings', autoRefresh: true })
  await f.world.refresh(context, 'persona', 'twitter', undefined, 'auto-turn-1', undefined, { automatic: true, turnId: 'turn-1' })
  await new SocialWorld(f.host).refresh(context, 'persona', 'twitter', undefined, 'auto-turn-1', undefined, { automatic: true, turnId: 'turn-1' })
  expect(f.requests).toHaveLength(1)
  let finish!: (value: Record<string, unknown>) => void
  f.generate(() => new Promise(resolve => { finish = resolve }))
  const pending = f.world.refresh(context, 'persona', 'twitter', undefined, 'auto-turn-2', undefined, { automatic: true, turnId: 'turn-2' })
  await f.wait(() => Boolean(finish)); change(f.state(), { app: 'twitter', action: 'settings', autoRefresh: false })
  finish({ posts: [{ author: 'Juniper', text: 'Must not land' }] }); await pending
  expect(f.state().social!.posts.map(post => post.text)).toEqual(['A new day'])
  expect(f.sent.at(-1).action).toBe('cancel')
})

test('automation only runs on normal committed turns, bounds work, and supersedes older background turns', async () => {
  const state = stateFixture(), calls: any[] = []
  for (const app of ['twitter', 'instagram', 'tumblr', 'discord'] as const) change(state, { app, action: 'settings', autoRefresh: true })
  change(state, { app: 'discord', action: 'server', name: 'Club', channels: ['general'] })
  const automation = new SocialAutomation({ loadState: async () => structuredClone(state), refresh: async (...args) => { calls.push(args) } })
  for (const kind of ['quiet', 'swipe', 'regenerate']) await automation.run(context, 'turn-1', undefined, kind)
  expect(calls).toHaveLength(0)
  await automation.run(context, 'turn-1'); await automation.run(context, 'turn-1'); expect(calls).toHaveLength(4)
  expect(calls.every(call => call[6].automatic && call[6].turnId === 'turn-1')).toBe(true)
  let release!: () => void; const pendingCalls: any[] = []
  const slow = new SocialAutomation({ loadState: async () => structuredClone(state), refresh: async (...args) => { pendingCalls.push(args); if (pendingCalls.length === 1) await new Promise<void>(resolve => { release = resolve; args[6]?.signal?.addEventListener('abort', () => resolve(), { once: true }) }) } })
  const first = slow.run(context, 'old'); for (let i = 0; i < 20 && !release; i++) await Promise.resolve()
  await slow.run(context, 'new'); await first
  expect(pendingCalls[0][6].signal.aborted).toBe(true); slow.dispose()
})

test('human comments get targeted replies in the same thread without becoming root posts', async () => {
  const f = serviceFixture()
  await f.world.refresh(context, 'persona', 'twitter', undefined, 'seed')
  const root = f.state().social!.posts[0]
  f.generate(async () => ({ replies: [{ text: 'See you at the festival!' }] }))
  await f.world.mutate(context, 'persona', { app: 'twitter', action: 'post', text: 'Can I come?', replyTo: root.id }, 'human-comment')
  const posts = f.state().social!.posts, comment = posts.find(post => post.authoredBy === 'persona')!, response = posts.at(-1)!
  expect(comment.replyTo).toBe(root.id); expect(response.replyTo).toBe(comment.id); expect(response.account.id).toBe(root.account.id)
  expect(posts.filter(post => !post.replyTo)).toHaveLength(1)
  expect(f.sent.some(event => event.type === 'lumiphone:social_started' && event.mode === 'reply')).toBe(true)
  await f.world.reply(context, 'persona', 'twitter', comment.id, 'retry'); expect(f.state().social!.posts).toHaveLength(3)
})

test('server participant generation makes no posts and merges into its own bank', async () => {
  const f = serviceFixture(); change(f.state(), { app: 'discord', action: 'server', name: 'Local art', channels: ['general'] })
  const server = f.state().social!.servers[0]
  f.generate(async () => ({ participants: [{ name: 'Alice', bio: 'Cast rejected' }, { name: 'Dane', bio: 'Human rejected' }, { name: 'Moss', bio: 'Local artist' }, { name: 'Moss', bio: 'Duplicate' }] }))
  await f.world.generateParticipants(context, 'persona', server.id, 'people')
  expect(f.state().social!.servers[0].participants!.map(person => person.name)).toEqual(['Moss'])
  expect(f.state().social!.posts).toHaveLength(0); expect(f.state().contacts).toHaveLength(1)
})

test('turning feed images off while a provider works keeps the caption without attaching the late image', async () => {
  const f = serviceFixture(); change(f.state(), { app: 'instagram', action: 'settings', generateImages: true })
  let finish!: (value: { imageId: string; imageUrl: string }) => void
  f.photo(() => new Promise(resolve => { finish = resolve }))
  const pending = f.world.refresh(context, 'persona', 'instagram', undefined, 'image-pending')
  await f.wait(() => Boolean(finish)); change(f.state(), { app: 'instagram', action: 'settings', generateImages: false })
  finish({ imageId: 'too-late', imageUrl: '/images/too-late.png' }); await pending
  expect(f.state().social!.posts[0].text).toBe('A new day'); expect(f.state().social!.posts[0].photo).toBe('Moss growing between harbor stones'); expect(f.state().social!.posts[0].imageId).toBeUndefined()
})

test('failed or stopped reply-back never removes the human comment or appends a late root', async () => {
  const f = serviceFixture(); await f.world.refresh(context, 'persona', 'tumblr', undefined, 'seed')
  const root = f.state().social!.posts[0]
  let finish!: (value: Record<string, unknown>) => void
  f.generate(() => new Promise(resolve => { finish = resolve }))
  const pending = f.world.mutate(context, 'persona', { app: 'tumblr', action: 'post', text: 'An actual human comment', replyTo: root.id }, 'comment')
  await f.wait(() => Boolean(finish)); expect(f.state().social!.posts.at(-1)!.authoredBy).toBe('persona')
  f.world.cancel(context, 'persona', 'comment:reply')
  finish({ replies: [{ text: 'Too late' }] }); await pending
  expect(f.state().social!.posts).toHaveLength(2); expect(f.state().social!.posts.filter(post => !post.replyTo)).toHaveLength(1)
  f.generate(async () => { throw new Error('Provider unavailable') })
  await f.world.mutate(context, 'persona', { app: 'tumblr', action: 'post', text: 'Another human comment', replyTo: root.id }, 'failed-comment')
  expect(f.state().social!.posts).toHaveLength(3); expect(f.sent.at(-1).type).toBe('lumiphone:social_reply_error')
})

test('selected NPC Bank participants use trusted profiles and stay within the selected server', async () => {
  const f = serviceFixture(); change(f.state(), { app: 'discord', action: 'server', name: 'Friends', channels: ['general'] })
  const server = f.state().social!.servers[0]
  f.guests([{ id: 'friend-1', name: 'Moss', kind: 'npc-bank', personality: 'A thoughtful painter', avatarUrl: '/images/moss.png' }])
  await f.world.mutate(context, 'persona', { app: 'discord', action: 'participant', serverId: server.id, bankEntryId: 'friend-1', name: 'Forged name' }, 'friend')
  const member = f.state().social!.servers[0].participants![0]
  expect(member.name).toBe('Moss'); expect(member.bankId).toBe('friend-1'); expect(member.bio).toBe('A thoughtful painter'); expect(member.avatarUrl).toBe('/images/moss.png')
  await expect(f.world.mutate(context, 'alice', { app: 'discord', action: 'participant', serverId: server.id, name: 'No borrowed server' }, 'invalid-member')).rejects.toThrow('your Discord servers')
  expect(f.state().contacts).toHaveLength(1)
})


function timerFixture() {
  const state = stateFixture(), calls: any[] = [], timers = new Map<number, { due: number; callback: () => void }>()
  let now = 1000, serial = 0, refresh: (...args: any[]) => Promise<void> = async (...args) => { calls.push(args) }
  const automation = new SocialAutomation({ loadState: async () => structuredClone(state), refresh: async (...args) => refresh(...args), nowMs: () => now,
    schedule: (callback, delay) => { const id = ++serial; timers.set(id, { due: now + delay, callback }); return id }, cancelSchedule: id => { timers.delete(id as number) } })
  const flush = async () => { for (let index = 0; index < 100; index++) await Promise.resolve() }
  const advance = async (milliseconds: number) => { now += milliseconds; for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback() }; await flush() }
  return { state, calls, timers, automation, advance, flush, now: () => now, refresh(fn: typeof refresh) { refresh = fn } }
}

test('manual, turn, and timed modes have separate triggers; timed updates wait for their interval', async () => {
  const f = timerFixture()
  await f.automation.observe(context); expect(f.timers.size).toBe(0); expect(f.calls).toHaveLength(0)
  change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'turn' })
  change(f.state, { app: 'instagram', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 2 })
  await f.automation.observe(context)
  expect(f.timers.size).toBe(1); expect([...f.timers.values()][0].due).toBe(f.now() + 120_000)
  await f.automation.run(context, 'normal-turn'); expect(f.calls.map(call => call[2])).toEqual(['twitter']); expect(f.calls[0][6].trigger).toBe('turn')
  await f.advance(119_999); expect(f.calls).toHaveLength(1)
  await f.advance(1); expect(f.calls.map(call => call[2])).toEqual(['twitter', 'instagram']); expect(f.calls[1][6]).toMatchObject({ trigger: 'timer', automatic: true })
  await f.automation.tick(); expect(f.calls).toHaveLength(2)
  expect([...f.timers.values()][0].due).toBe(f.now() + 120_000)
  f.automation.dispose(); expect(f.timers.size).toBe(0)
})

test('changing an interval restarts its countdown; disabling or uninstalling cancels timed work', async () => {
  const f = timerFixture(); change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 1 })
  await f.automation.observe(context); const staleCallback = [...f.timers.values()][0].callback
  await f.advance(30_000); change(f.state, { app: 'twitter', action: 'settings', refreshIntervalMinutes: 2 }); await f.automation.observe(context)
  expect([...f.timers.values()][0].due).toBe(f.now() + 120_000)
  staleCallback(); await f.flush(); expect(f.calls).toHaveLength(0); expect(f.timers.size).toBe(1)
  await f.advance(119_999); expect(f.calls).toHaveLength(0)
  await f.advance(1); expect(f.calls).toHaveLength(1)
  change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'manual' }); await f.automation.observe(context)
  expect(f.timers.size).toBe(0); await f.advance(300_000); expect(f.calls).toHaveLength(1)
  change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 1 }); await f.automation.observe(context)
  f.state.launcherLayouts!.persona = setPocketAppInstalled(f.state.launcherLayouts!.persona, 'twitter', false)
  await f.advance(60_000); expect(f.calls).toHaveLength(1); expect(f.timers.size).toBe(0)
  f.automation.dispose()
})

test('timed refreshes never overlap, and mode changes abort the in-flight refresh', async () => {
  const f = timerFixture(); change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 1 })
  let release!: () => void, signal!: AbortSignal
  f.refresh(async (...args) => { f.calls.push(args); signal = args[6].signal; await new Promise<void>(resolve => { release = resolve; signal.addEventListener('abort', () => resolve(), { once: true }) }) })
  await f.automation.observe(context); await f.advance(60_000); expect(f.calls).toHaveLength(1)
  await f.automation.tick(); await f.advance(300_000); expect(f.calls).toHaveLength(1)
  change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'manual' }); await f.automation.observe(context); await f.flush()
  expect(signal.aborted).toBe(true); expect(f.timers.size).toBe(0); release(); f.automation.dispose()
})

test('changing the viewed chat aborts its timer and ignores stale callbacks; disposal prevents later work', async () => {
  const f = timerFixture(); change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 1 })
  let firstSignal!: AbortSignal
  f.refresh(async (...args) => { f.calls.push(args); firstSignal = args[6].signal; await new Promise<void>(resolve => firstSignal.addEventListener('abort', () => resolve(), { once: true })) })
  await f.automation.observe(context); const staleCallback = [...f.timers.values()][0].callback
  await f.advance(60_000); expect(f.calls).toHaveLength(1)
  await f.automation.observe({ chatId: 'another-chat', characterId: 'another-character' }); await f.flush(); expect(firstSignal.aborted).toBe(true)
  staleCallback(); await f.flush(); expect(f.calls).toHaveLength(1); expect(f.timers.size).toBe(1)
  f.automation.dispose(); expect(f.timers.size).toBe(0)
  await f.advance(600_000); await f.automation.observe(context); await f.automation.run(context, 'after-dispose'); await f.automation.tick(); expect(f.calls).toHaveLength(1)
})


test('the service distinguishes timer from turn requests and rejects late work after a mode switch', async () => {
  const f = serviceFixture(); change(f.state(), { app: 'twitter', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 1 })
  await f.world.refresh(context, 'persona', 'twitter', undefined, 'wrong-trigger', undefined, { automatic: true, turnId: 'normal-turn', trigger: 'turn' })
  expect(f.requests).toHaveLength(0)
  await f.world.refresh(context, 'persona', 'twitter', undefined, 'timer-first', undefined, { automatic: true, turnId: 'timer:1', trigger: 'timer' })
  expect(f.requests).toHaveLength(1); expect(f.state().social!.posts).toHaveLength(1)
  let finish!: (value: Record<string, unknown>) => void
  f.generate(() => new Promise(resolve => { finish = resolve }))
  const pending = f.world.refresh(context, 'persona', 'twitter', undefined, 'timer-second', undefined, { automatic: true, turnId: 'timer:2', trigger: 'timer' })
  await f.wait(() => Boolean(finish)); change(f.state(), { app: 'twitter', action: 'settings', refreshMode: 'turn' })
  finish({ posts: [{ author: 'Juniper', text: 'Late timer response' }] }); await pending
  expect(f.state().social!.posts.map(post => post.text)).toEqual(['A new day']); expect(f.sent.at(-1).action).toBe('cancel')
})

test('active timer context and cancellation are separated for each requesting user', async () => {
  const f = timerFixture(); change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 1 })
  await f.automation.observe(context, 'user-a'); await f.automation.observe({ chatId: 'user-b-chat', characterId: 'character' }, 'user-b')
  expect(f.timers.size).toBe(2)
  f.automation.forget('user-a'); expect(f.timers.size).toBe(1)
  await f.advance(60_000); expect(f.calls).toHaveLength(1); expect(f.calls[0][0].chatId).toBe('user-b-chat'); expect(f.calls[0][5]).toBe('user-b')
  f.automation.dispose()
})


test('slow timed refreshes wait a full interval after success or failure instead of immediately rerunning', async () => {
  for (const outcome of ['success', 'failure'] as const) {
    const f = timerFixture(); change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 1 })
    let finish!: () => void
    f.refresh(async (...args) => {
      f.calls.push(args)
      if (f.calls.length === 1) await new Promise<void>((resolve, reject) => { finish = () => outcome === 'failure' ? reject(new Error('Slow provider failed')) : resolve() })
    })
    await f.automation.observe(context); await f.advance(60_000); expect(f.calls).toHaveLength(1)
    await f.advance(120_000); expect(f.calls).toHaveLength(1)
    finish(); await f.flush()
    expect([...f.timers.values()][0].due).toBe(f.now() + 60_000)
    await f.automation.tick(); expect(f.calls).toHaveLength(1)
    await f.advance(59_999); expect(f.calls).toHaveLength(1)
    await f.advance(1); expect(f.calls).toHaveLength(2)
    f.automation.dispose()
  }
})

test('a cancelled old refresh cannot overwrite a changed interval countdown on late completion', async () => {
  const f = timerFixture(); change(f.state, { app: 'twitter', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 1 })
  let finish!: () => void
  f.refresh(async (...args) => { f.calls.push(args); if (f.calls.length === 1) await new Promise<void>(resolve => { finish = resolve }) })
  await f.automation.observe(context); await f.advance(60_000)
  change(f.state, { app: 'twitter', action: 'settings', refreshIntervalMinutes: 2 }); const changedAt = f.now()
  await f.automation.observe(context); expect(f.calls[0][6].signal.aborted).toBe(true)
  await f.advance(30_000); finish(); await f.flush()
  expect([...f.timers.values()][0].due).toBe(changedAt + 120_000)
  await f.advance(89_999); expect(f.calls).toHaveLength(1)
  await f.advance(1); expect(f.calls).toHaveLength(2)
  f.automation.dispose()
})
