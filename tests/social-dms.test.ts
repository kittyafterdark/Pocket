import { expect, test } from 'bun:test'
import { SocialDms } from '../src/backend/social-dms.js'
import { normalizeSocialDirectThreads } from '../src/domain/social-dms.js'
import { normalizeSocialState } from '../src/domain/social.js'
import { defaultLauncherLayout, setPocketAppInstalled } from '../src/domain/launcher.js'
import { projectPhoneContext } from '../src/domain/projection.js'
import type { PhoneState } from '../src/types.js'
import { actorPhoneMemoryContext } from '../src/domain/actor-memory.js'

const context = { chatId: 'dm-test', characterId: 'alice' }, now = '2026-10-29T16:30:00Z'
function fixture() {
  let serial = 0, state = { ...context, characterName: 'Alice', pocketPersonaActorId: 'me', pocketPersona: { displayName: 'Dane' }, roleplayNow: now,
    contacts: [{ id: 'alice', name: 'Alice' }], conversations: [{ includesPocketPersona: true, participantActorIds: ['alice'] }], processedCommands: [],
    social: normalizeSocialState({ following: { me: { instagram: ['social:instagram:fern'] } }, preferences: { me: { tumblrTheme: 'true-blue', apps: { instagram: { friendEntryIds: ['bank-friend'] } } } }, posts: [{ id: 'post', app: 'instagram', account: { id: 'social:instagram:fern', name: 'Fern', handle: 'fern' }, text: 'A public caption', createdAt: now, likedBy: [], tags: [] }] }),
    launcherLayouts: { me: setPocketAppInstalled(defaultLauncherLayout(), 'instagram', true), alice: setPocketAppInstalled(defaultLauncherLayout(), 'instagram', true) },
    notes: [], trackers: [], events: [], weather: { location: '', condition: '', details: '' },
  } as unknown as PhoneState
  let lock = Promise.resolve()
  const messages: any[] = [], pending: Array<{ request: any; finish(value: Record<string, unknown>): void; fail(error: Error): void }> = []
  const service = new SocialDms({
    loadState: async () => structuredClone(state), saveState: async value => { state = value }, sendState: async () => {}, send: value => messages.push(value),
    runStructuredGeneration: async (_task, _id, request) => new Promise((resolve, reject) => { pending.push({ request, finish: resolve, fail: reject }) }),
    withStateLock: async (_key, callback) => { const task = lock.then(callback); lock = task.then(() => {}, () => {}); return task }, stateKey: () => 'dm-test', makeId: prefix => `${prefix}-${++serial}`,
    resolveFriend: async id => id === 'bank-friend' ? { id, name: 'Moss', kind: 'npc-bank', role: 'A friend from the bank' } : null,
  })
  const wait = async (count = 1) => { for (let index = 0; index < 100 && pending.length < count; index++) await Promise.resolve(); expect(pending).toHaveLength(count) }
  return { service, pending, messages, wait, state: () => state }
}

test('Instagram DMs save a private outgoing message and reply without public posts or Pocket conversations', async () => {
  const f = fixture(), sending = f.service.send(context, 'me', 'social:instagram:fern', 'A private hello', undefined, 'send')
  await f.wait(); expect(f.state().social!.dmThreads![0].messages[0].text).toBe('A private hello')
  const supplied = JSON.parse(f.pending[0].request.messages[1].content)
  expect(supplied.messages[0].speaker).toBe('human'); expect(JSON.stringify(supplied)).not.toContain('A public caption')
  f.pending[0].finish({ text: 'Hello back, just between us.' }); await sending
  expect(f.state().social!.dmThreads![0].messages.map(message => message.sender)).toEqual(['owner', 'account'])
  expect(f.state().social!.posts).toHaveLength(1); expect(f.state().conversations).toHaveLength(1)
  expect(f.messages.map(message => message.type)).toEqual(['lumiphone:social_dm_sent', 'lumiphone:social_dm_done'])
  f.state().contacts = []
  expect(projectPhoneContext(f.state())).not.toContain('A private hello')
})

test('failed DM generation preserves the sent message and reports the reply failure separately', async () => {
  const f = fixture(), sending = f.service.send(context, 'me', 'social:instagram:fern', 'Still delivered', undefined, 'send')
  await f.wait(); f.pending[0].fail(new Error('Provider offline')); await sending
  expect(f.state().social!.dmThreads![0].messages).toHaveLength(1)
  expect(f.messages.at(-1).type).toBe('lumiphone:social_dm_error'); expect(f.messages.at(-1).error).toBe('Provider offline')
})

test('DM threads cannot be read or written through a different phone owner', async () => {
  const f = fixture(), sending = f.service.send(context, 'me', 'social:instagram:fern', 'Mine', undefined, 'send')
  await f.wait(); f.pending[0].finish({ text: 'Reply' }); await sending
  const thread = f.state().social!.dmThreads![0]
  await expect(f.service.send(context, 'alice', thread.account.id, 'Wrong phone', thread.id, 'wrong')).rejects.toThrow('no longer available')
  expect(f.state().social!.dmThreads![0].messages).toHaveLength(2)
})

test('DM replies that arrive after a newer outgoing message do not attach to the wrong message', async () => {
  const f = fixture(), sending = f.service.send(context, 'me', 'social:instagram:fern', 'First', undefined, 'send')
  await f.wait()
  f.state().social!.dmThreads![0].messages.push({ id: 'newer', sender: 'owner', text: 'Newer message', createdAt: now })
  f.pending[0].finish({ text: 'Stale answer' }); await sending
  expect(f.state().social!.dmThreads![0].messages.map(message => message.text)).toEqual(['First', 'Newer message'])
})

test('NPC Bank friends start private conversations without materializing Contacts; unavailable accounts fail', async () => {
  const f = fixture(), sending = f.service.send(context, 'me', 'bank:bank-friend', 'Hey Moss', undefined, 'send')
  await f.wait(); f.pending[0].finish({ text: 'Hi!' }); await sending
  expect(f.state().social!.dmThreads![0].account.bankId).toBe('bank-friend'); expect(f.state().contacts).toHaveLength(1)
  await expect(f.service.send(context, 'me', 'bank:missing', 'No account', undefined, 'missing')).rejects.toThrow('Choose an Instagram account')
  f.state().launcherLayouts!.me = setPocketAppInstalled(f.state().launcherLayouts!.me, 'instagram', false)
  await expect(f.service.send(context, 'me', 'bank:bank-friend', 'Removed app', undefined, 'removed')).rejects.toThrow('Get Instagram')
})

test('concurrent DM sends are rejected before saving so the pending reply still reaches its message', async () => {
  const f = fixture(), sending = f.service.send(context, 'me', 'social:instagram:fern', 'First', undefined, 'first')
  await f.wait()
  const thread = f.state().social!.dmThreads![0]
  await expect(f.service.send(context, 'me', thread.account.id, 'Second', thread.id, 'second')).rejects.toThrow('already getting a reply')
  expect(f.state().social!.dmThreads![0].messages.map(message => message.text)).toEqual(['First'])
  expect(f.messages.filter(message => message.type === 'lumiphone:social_dm_sent')).toHaveLength(1)
  f.pending[0].finish({ text: 'Reply to first' }); await sending
  expect(f.state().social!.dmThreads![0].messages.map(message => message.text)).toEqual(['First', 'Reply to first'])
  const next = f.service.send(context, 'me', thread.account.id, 'Second, now', thread.id, 'second')
  for (let index = 0; index < 30 && f.pending.length < 2; index++) await Promise.resolve()
  expect(f.pending).toHaveLength(2); f.pending[1].finish({ text: 'Reply to second' }); await next
  expect(f.state().social!.dmThreads![0].messages.at(-1)?.text).toBe('Reply to second')
})

test('linked Instagram DMs receive existing actor memory and become recallable in Pocket Messages', async () => {
  const f = fixture()
  f.state().social!.posts[0].account.actorId = 'alice'
  Object.assign(f.state().contacts[0], { identityBrief: 'A longtime friend from the market.', source: { kind: 'character', characterId: 'alice-card' }, phoneProfile: { personality: 'Warm', textingStyle: 'Lower case', appearance: '' } })
  f.state().actorMemories = [{ id: 'memory:old', messageId: 'old', conversationId: 'old-phone', conversationTitle: 'Messages', conversationKind: 'direct', speakerActorId: 'me', speakerName: 'Dane', text: 'We promised to meet by the old market.', knownByActorIds: ['me', 'alice'], knownByNames: ['Dane', 'Alice'], createdAt: now }]
  const sending = f.service.send(context, 'me', 'social:instagram:fern', 'Do you remember the market?', undefined, 'shared')
  await f.wait()
  const supplied = JSON.parse(f.pending[0].request.messages[1].content)
  expect(supplied.knownContext.profile.identity).toContain('longtime friend')
  expect(supplied.knownContext.phoneMemory).toContain('promised to meet')
  f.pending[0].finish({ text: 'Of course. I still have your book.' }); await sending
  const remembered = actorPhoneMemoryContext(f.state().actorMemories, { actorIds: ['alice'], actorNames: [], actorName: 'Alice' })
  expect(remembered).toContain('Do you remember the market?'); expect(remembered).toContain('still have your book')
  expect(f.state().conversations).toHaveLength(1)
  f.state().contacts = []
  expect(projectPhoneContext(f.state())).not.toContain('still have your book')
})

test('private thread normalization bounds histories, drops duplicate IDs and unsafe avatar sources', () => {
  const raw = { id: 'thread', owner: 'me', account: { id: 'stranger', name: 'Fern', handle: 'fern', avatarUrl: 'javascript:bad' }, messages: [{ id: 'message', sender: 'owner', text: 'hello', createdAt: now }, { id: 'message', sender: 'account', text: 'duplicate' }, { id: 'bad', sender: 'unknown', text: 'bad' }], updatedAt: now }
  const threads = normalizeSocialDirectThreads([raw, raw])
  expect(threads).toHaveLength(1); expect(threads[0].messages).toHaveLength(1); expect(threads[0].account.avatarUrl).toBeUndefined()
})

test('new DMs require an app-scoped follow or selected friend while saved conversations remain usable', async () => {
  const f = fixture(); f.state().social!.following = {}; f.state().social!.preferences = {}
  const before = JSON.stringify(f.state())
  await expect(f.service.send(context, 'me', 'social:instagram:fern', 'No follow', undefined, 'blocked')).rejects.toThrow('Follow')
  await expect(f.service.send(context, 'me', 'bank:bank-friend', 'Not selected', undefined, 'blocked-bank')).rejects.toThrow('Follow')
  expect(JSON.stringify(f.state())).toBe(before); expect(f.pending).toHaveLength(0)
  f.state().social!.following = { me: { tumblr: ['social:instagram:fern'] } }
  await expect(f.service.send(context, 'me', 'social:instagram:fern', 'Wrong app follow', undefined, 'blocked-other')).rejects.toThrow('Follow')
  f.state().social!.following = { me: { instagram: ['social:instagram:fern'] } }
  const first = f.service.send(context, 'me', 'social:instagram:fern', 'Hello after following', undefined, 'allowed')
  await f.wait(); f.pending[0].finish({ text: 'Hello back' }); await first
  f.state().social!.following = {}
  const thread = f.state().social!.dmThreads![0], next = f.service.send(context, 'me', thread.account.id, 'Keep our saved history', thread.id, 'existing')
  await f.wait(2); f.pending[1].finish({ text: 'Still here' }); await next
  expect(f.state().social!.dmThreads![0].messages).toHaveLength(4)
})

test('Tumblr and Instagram DMs keep separate histories and flight scopes for the same friend', async () => {
  const f = fixture()
  f.state().launcherLayouts!.me = setPocketAppInstalled(f.state().launcherLayouts!.me, 'tumblr', true)
  f.state().social!.preferences!.me.apps!.tumblr = { ...f.state().social!.preferences!.me.apps!.instagram!, friendEntryIds: ['bank-friend'] }
  const instagram = f.service.send(context, 'me', 'bank:bank-friend', 'Only on Instagram', undefined, 'ig')
  const tumblr = f.service.send(context, 'me', 'bank:bank-friend', 'Only on Tumblr', undefined, 'tb', undefined, 'tumblr')
  await f.wait(2)
  const igRequest = f.pending.find(job => job.request.messages[0].content.includes('private fictional Instagram'))!
  const tbRequest = f.pending.find(job => job.request.messages[0].content.includes('private fictional Tumblr'))!
  expect(JSON.parse(igRequest.request.messages[1].content).messages.map((message: any) => message.text)).toEqual(['Only on Instagram'])
  expect(JSON.parse(tbRequest.request.messages[1].content).messages.map((message: any) => message.text)).toEqual(['Only on Tumblr'])
  igRequest.finish({ text: 'Instagram answer' }); tbRequest.finish({ text: 'Tumblr answer' }); await Promise.all([instagram, tumblr])
  const threads = normalizeSocialDirectThreads(f.state().social!.dmThreads)
  expect(threads).toHaveLength(2)
  expect(threads.find(thread => thread.app === 'tumblr')!.messages.map(message => message.text)).toEqual(['Only on Tumblr', 'Tumblr answer'])
  const igThread = threads.find(thread => thread.app === 'instagram')!
  await expect(f.service.send(context, 'me', 'bank:bank-friend', 'Wrong thread', igThread.id, 'wrong-app', undefined, 'tumblr')).rejects.toThrow('no longer available')
  expect(f.state().actorMemories!.filter(memory => memory.text === 'Only on Tumblr')[0].conversationTitle).toContain('Tumblr')
  expect(f.state().actorMemories!.filter(memory => memory.text === 'Only on Instagram')[0].conversationTitle).toContain('Instagram')
  const legacy = normalizeSocialDirectThreads([{ ...igThread, app: undefined }])[0]
  expect(legacy.app).toBe('instagram')
})

test('a busy Tumblr inbox cannot evict the saved Instagram conversation bank', () => {
  const thread = (app:'instagram'|'tumblr',index:number) => ({ id:`${app}-${index}`,app,owner:'me',account:{id:`friend-${index}`,name:`Friend ${index}`,handle:`friend_${index}`},messages:[{id:`m-${app}-${index}`,sender:'owner',text:'A saved private note',createdAt:now}],updatedAt:now })
  const original = [...Array.from({length:40},(_,index)=>thread('instagram',index)),...Array.from({length:40},(_,index)=>thread('tumblr',index))]
  const reloaded = normalizeSocialDirectThreads([...original,thread('tumblr',40)])
  expect(reloaded.filter(row=>row.app==='instagram').map(row=>row.id)).toEqual(original.filter(row=>row.app==='instagram').map(row=>row.id))
  expect(reloaded.filter(row=>row.app==='tumblr')).toHaveLength(40); expect(reloaded.at(-1)!.id).toBe('tumblr-40')
})
