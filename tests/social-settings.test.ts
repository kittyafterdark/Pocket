import { expect, test } from 'bun:test'
import type { PhoneState } from '../src/types.js'
import { applySocialMutation, normalizeSocialState, socialBio, socialAppSettings, socialFollowing, socialGenerationRequest, socialGeneratedPosts, socialTumblrTheme, socialOwner, generatedSocialHandle, validSocialUsername } from '../src/domain/social.js'
import type { SocialMutation } from '../src/domain/social.js'
import { defaultLauncherLayout, setPocketAppInstalled } from '../src/domain/launcher.js'
import { SocialWorld } from '../src/backend/social-world.js'

const at = '2026-10-29T12:00:00Z'
let serial = 0
const makeId = (prefix: string) => `${prefix}-${++serial}`
function settingsState(): PhoneState {
  let layout = defaultLauncherLayout()
  for (const app of ['twitter', 'instagram', 'tumblr', 'discord'] as const) layout = setPocketAppInstalled(layout, app, true)
  const state = { chatId: 'settings', characterId: 'character', roleplayNow: at, pocketPersonaActorId: 'persona', pocketPersona: { displayName: 'Dane', role: 'Student', identityBrief: 'A private secret' },
    contacts: [{ id: 'alice', name: 'Alice', role: 'Neighbour', identityBrief: 'Another private secret' }], discoveredActors: [], conversations: [{ includesPocketPersona: true, participantActorIds: ['alice'] }], processedCommands: [], launcherLayouts: { persona: layout, alice: layout }, social: normalizeSocialState(null),
  } as unknown as PhoneState
  state.social!.posts = socialGeneratedPosts(state, 'twitter', [{ author: 'Alice', text: 'The festival is starting.' }, { author: 'Night News', handle: 'night_news', text: 'The market stays open late.' }], 'persona', undefined, at, makeId, [{ id: 'alice-bank', name: 'Alice', kind: 'npc-bank' }])
  return state
}
function change(state: PhoneState, input: SocialMutation, owner = 'persona') { state.social = applySocialMutation(state, owner, input, at, makeId); return state.social }

test('social profile defaults use public roles, explicit empty bios remain empty, and maps survive old mutations', () => {
  const state = settingsState()
  expect(socialBio(state, 'persona')).toBe('Student'); expect(socialBio(state, 'alice')).toBe('Neighbour')
  change(state, { app: 'twitter', action: 'profile', bio: '  Books, coffee, city lights.  ' })
  change(state, { app: 'tumblr', action: 'preferences', theme: 'goth-rave' })
  change(state, { app: 'twitter', action: 'follow', accountId: 'alice' })
  change(state, { app: 'twitter', action: 'post', text: 'A new post' })
  state.social = normalizeSocialState(JSON.parse(JSON.stringify(state.social)))
  expect(socialBio(state, 'persona')).toBe('Books, coffee, city lights.')
  expect(socialTumblrTheme(state.social, 'persona')).toBe('goth-rave')
  expect(socialFollowing(state.social, 'persona', 'twitter')).toEqual(['alice'])
  change(state, { app: 'instagram', action: 'profile', bio: '' }); expect(socialBio(state, 'persona')).toBe('')
  expect(socialBio(state, 'alice')).toBe('Neighbour')
})

test('follows are canonical, scoped by owner and app, toggle off, and never create contacts', () => {
  const state = settingsState(), outsider = state.social!.posts[1].account.id
  change(state, { app: 'twitter', action: 'follow', accountId: outsider })
  change(state, { app: 'instagram', action: 'follow', accountId: 'alice' })
  change(state, { app: 'twitter', action: 'follow', accountId: 'persona' }, 'alice')
  expect(socialFollowing(state.social!, 'persona', 'twitter')).toEqual([outsider])
  expect(socialFollowing(state.social!, 'persona', 'instagram')).toEqual(['alice'])
  expect(socialFollowing(state.social!, 'alice', 'twitter')).toEqual(['persona'])
  expect(state.contacts).toHaveLength(1)
  const following = socialFollowing(state.social!, 'persona', 'twitter'); following.push('not-persisted')
  expect(socialFollowing(state.social!, 'persona', 'twitter')).toEqual([outsider])
  state.social!.posts = []
  change(state, { app: 'twitter', action: 'follow', accountId: outsider })
  expect(socialFollowing(state.social!, 'persona', 'twitter')).toEqual([])
})

test('following rejects self, invented and cross-platform outsider accounts, and unavailable phones', () => {
  const state = settingsState(), outsider = state.social!.posts[1].account.id
  for (const input of [
    { app: 'twitter', action: 'follow', accountId: 'persona' },
    { app: 'twitter', action: 'follow', accountId: 'invented-account' },
    { app: 'instagram', action: 'follow', accountId: outsider },
  ] as SocialMutation[]) expect(() => change(state, input)).toThrow()
  expect(() => change(state, { app: 'twitter', action: 'profile', bio: 'No forged phone profile' }, 'missing-owner')).toThrow('phone')
  expect(state.social!.following).toBeUndefined()
})

test('preferences accept only Tumblr palettes, preserve owner separation and reject invalid themes', () => {
  const state = settingsState()
  expect(socialTumblrTheme(state.social!, 'persona')).toBe('true-blue')
  change(state, { app: 'tumblr', action: 'preferences', theme: 'pride' })
  change(state, { app: 'tumblr', action: 'preferences', theme: 'dark-mode' }, 'alice')
  expect(socialTumblrTheme(state.social!, 'persona')).toBe('pride'); expect(socialTumblrTheme(state.social!, 'alice')).toBe('dark-mode')
  expect(() => change(state, { app: 'twitter', action: 'preferences', theme: 'pride' })).toThrow('Tumblr palette')
  expect(() => change(state, { app: 'tumblr', action: 'preferences', theme: 'javascript:bad' } as unknown as SocialMutation)).toThrow('Tumblr palette')
  expect(socialTumblrTheme(normalizeSocialState({ preferences: { persona: { tumblrTheme: 'bad' } } }), 'persona')).toBe('true-blue')
})

test('normalization bounds settings, ignores unsafe map keys, and preserves the legacy empty state shape', () => {
  expect(normalizeSocialState(null)).toEqual({ posts: [], servers: [], refreshedAt: {} })
  const raw = JSON.parse('{"profiles":{"__proto__":{"bio":"bad"},"persona":{"bio":"'+ 'x'.repeat(400) +'"}},"following":{"persona":{"twitter":["persona","alice","alice"],"unknown":["alice"]}},"preferences":{"constructor":{"tumblrTheme":"pride"},"persona":{"tumblrTheme":"true-blue"}}}')
  const world = normalizeSocialState(raw)
  expect(world.profiles!.persona.bio.length).toBe(280)
  expect(Object.hasOwn(world.profiles!, '__proto__')).toBe(false); expect(Object.hasOwn(world.preferences!, 'constructor')).toBe(false)
  expect(socialFollowing(world, 'persona', 'twitter')).toEqual(['alice'])
  expect(Object.hasOwn(world.following!.persona, 'unknown')).toBe(false)
})

test('model author context includes public bios while follows, private identities and app palettes stay out', () => {
  const state = settingsState()
  change(state, { app: 'twitter', action: 'profile', bio: 'Public bio here' })
  change(state, { app: 'twitter', action: 'follow', accountId: 'alice' })
  change(state, { app: 'tumblr', action: 'preferences', theme: 'goth-rave' })
  const userMessage = socialGenerationRequest(state, 'twitter', 'persona', undefined, 'Public festival').messages[1].content
  const context = JSON.parse(userMessage)
  expect(context.phoneOwner.bio).toBe('Public bio here')
  expect(userMessage).not.toContain('private secret'); expect(userMessage).not.toContain('goth-rave'); expect(context.following).toBeUndefined(); expect(context.preferences).toBeUndefined()
})

test('settings mutations use the service install boundary and survive app removal/reinstall', async () => {
  let state = settingsState()
  const world = new SocialWorld({ loadState: async () => structuredClone(state), saveState: async next => { state = next }, sendState: async () => {}, send() {}, getMessages: async () => [], runStructuredGeneration: async () => { throw new Error('Settings must not invoke a model') }, withStateLock: async (_key, task) => task(), stateKey: () => 'settings', nowIso: () => at, makeId, resolveImage: async () => '' })
  const context = { chatId: 'settings', characterId: 'character' }
  await world.mutate(context, 'persona', { app: 'tumblr', action: 'preferences', theme: 'pride' }, 'palette')
  state.launcherLayouts!.persona = setPocketAppInstalled(state.launcherLayouts!.persona, 'tumblr', false)
  await expect(world.mutate(context, 'persona', { app: 'tumblr', action: 'profile', bio: 'Hidden app write' }, 'hidden')).rejects.toThrow('Get this app')
  state.launcherLayouts!.persona = setPocketAppInstalled(state.launcherLayouts!.persona, 'tumblr', true)
  expect(socialTumblrTheme(state.social!, 'persona')).toBe('pride')
  await world.mutate(context, 'persona', { app: 'tumblr', action: 'profile', bio: 'Saved after reinstall' }, 'bio')
  expect(socialBio(state, 'persona')).toBe('Saved after reinstall')
})


test('refresh modes migrate legacy opt-ins and persist per app with bounded intervals', () => {
  const state = settingsState()
  const legacy = normalizeSocialState({ preferences: { persona: { apps: { twitter: { autoRefresh: true }, tumblr: { autoRefresh: false }, instagram: { refreshMode: 'timer', refreshIntervalMinutes: 999 } } } } })
  expect(socialAppSettings(legacy, 'persona', 'twitter')).toMatchObject({ refreshMode: 'turn', refreshIntervalMinutes: 5, autoRefresh: true })
  expect(socialAppSettings(legacy, 'persona', 'tumblr').refreshMode).toBe('manual')
  expect(socialAppSettings(legacy, 'persona', 'instagram')).toMatchObject({ refreshMode: 'timer', refreshIntervalMinutes: 120 })
  change(state, { app: 'twitter', action: 'settings', refreshMode: 'timer', refreshIntervalMinutes: 3 })
  change(state, { app: 'tumblr', action: 'settings', refreshMode: 'turn' })
  change(state, { app: 'instagram', action: 'settings', refreshMode: 'manual' })
  state.social = normalizeSocialState(JSON.parse(JSON.stringify(state.social)))
  expect(socialAppSettings(state.social, 'persona', 'twitter')).toMatchObject({ refreshMode: 'timer', refreshIntervalMinutes: 3 })
  expect(socialAppSettings(state.social, 'persona', 'tumblr').refreshMode).toBe('turn')
  expect(socialAppSettings(state.social, 'persona', 'instagram').refreshMode).toBe('manual')
  expect(socialAppSettings(state.social, 'alice', 'twitter').refreshMode).toBe('manual')
  change(state, { app: 'twitter', action: 'settings', autoRefresh: false })
  expect(socialAppSettings(state.social!, 'persona', 'twitter')).toMatchObject({ refreshMode: 'manual', refreshIntervalMinutes: 3 })
})

test('refresh settings reject invalid modes and intervals before changing saved preferences', () => {
  const state = settingsState(), before = JSON.stringify(state.social)
  for (const refreshIntervalMinutes of [0, -1, 121, 1.5, Infinity, NaN, '5']) expect(() => change(state, { app: 'twitter', action: 'settings', refreshIntervalMinutes } as unknown as SocialMutation)).toThrow('refresh interval')
  expect(() => change(state, { app: 'twitter', action: 'settings', refreshMode: 'always' } as unknown as SocialMutation)).toThrow('refresh mode')
  expect(JSON.stringify(state.social)).toBe(before)
})

test('Persona usernames persist per app and rename public identity without rekeying history or follows', () => {
  const state = settingsState()
  change(state, { app: 'twitter', action: 'profile', bio: 'Books and coffee.' })
  change(state, { app: 'twitter', action: 'post', text: 'Before the rename' })
  const original = structuredClone(state.social!.posts.at(-1)!)
  change(state, { app: 'twitter', action: 'follow', accountId: 'persona' }, 'alice')
  change(state, { app: 'twitter', action: 'profile', username: ' @Night_Owl ' })
  change(state, { app: 'tumblr', action: 'profile', username: 'moon-notes' })
  state.social = normalizeSocialState(JSON.parse(JSON.stringify(state.social)))
  expect(socialOwner(state, 'persona', 'twitter')).toMatchObject({ id: 'persona', actorId: 'persona', name: 'Dane', handle: 'night_owl' })
  expect(socialOwner(state, 'persona', 'tumblr').handle).toBe('moon-notes')
  expect(socialOwner(state, 'persona', 'instagram').handle).toBe('dane')
  expect(socialBio(state, 'persona')).toBe('Books and coffee.')
  expect(state.social.posts.at(-1)).toMatchObject({ id: original.id, authoredBy: 'persona', text: original.text, account: { id: original.account.id, handle: 'night_owl' } })
  expect(socialFollowing(state.social, 'alice', 'twitter')).toEqual(['persona'])
  change(state, { app: 'twitter', action: 'post', text: 'After the rename' })
  expect(state.social.posts.at(-1)!.account.handle).toBe('night_owl')
  change(state, { app: 'instagram', action: 'profile', bio: 'Changed bio, same handles.' })
  expect(socialOwner(state, 'persona', 'twitter').handle).toBe('night_owl')
  expect(socialOwner(state, 'persona', 'tumblr').handle).toBe('moon-notes')
  const payload = JSON.parse(socialGenerationRequest(state, 'twitter', 'persona', undefined, '').messages[1].content)
  expect(payload.phoneOwner.handle).toBe('night_owl'); expect(payload.neverAuthor.handle).toBe('night_owl')
})

test('username validation rejects invalid and occupied names without changing saved state', () => {
  const state = settingsState(), before = JSON.stringify(state)
  for (const [app, username] of [['twitter', 'way_too_long_for_twitter'], ['twitter', 'bad name'], ['twitter', ''], ['tumblr', '-bad-blog'], ['discord', 'a'], ['discord', 'two..dots'], ['instagram', 'not/a/name']] as const) {
    expect(() => change(state, { app, action: 'profile', username })).toThrow('valid')
  }
  expect(() => change(state, { app: 'twitter', action: 'profile', username: 'night_news' })).toThrow('already in use')
  expect(JSON.stringify(state)).toBe(before)
  change(state, { app: 'twitter', action: 'profile', username: 'reserved_name' }, 'alice')
  expect(() => change(state, { app: 'twitter', action: 'profile', username: 'reserved_name' })).toThrow('already in use')
  change(state, { app: 'tumblr', action: 'profile', username: 'night-news' })
  expect(socialOwner(state, 'persona', 'tumblr').handle).toBe('night-news')
})

test('Discord username edits preserve server member IDs and never add human authors to the NPC bank', () => {
  const state = settingsState()
  const server = change(state, { app: 'discord', action: 'server', name: 'Midnight', channels: ['general'] }).servers[0]
  const channelId = server.channels[0].id
  change(state, { app: 'discord', action: 'participant', serverId: server.id, accountId: 'alice' })
  change(state, { app: 'discord', action: 'post', channelId, text: 'Human message' })
  const oldId = state.social!.servers[0].participants![0].id, postId = state.social!.posts.at(-1)!.id
  change(state, { app: 'discord', action: 'profile', username: 'moon.dust' }, 'alice')
  change(state, { app: 'discord', action: 'profile', username: 'human.alias' })
  state.social = normalizeSocialState(JSON.parse(JSON.stringify(state.social)))
  expect(state.social.servers[0].participants).toHaveLength(1)
  expect(state.social.servers[0].participants![0]).toMatchObject({ id: oldId, actorId: 'alice', handle: 'moon.dust' })
  expect(state.social.posts.find(post => post.id === postId)!.account).toMatchObject({ id: 'persona', handle: 'human.alias' })
  expect(socialOwner(state, 'alice', 'discord').handle).toBe('moon.dust')
})

test('generated usernames are app-shaped and returning strangers and friends keep established aliases', () => {
  for (const app of ['twitter', 'discord', 'tumblr'] as const) {
    const fallback = generatedSocialHandle(app, 'Unprovided Alias')
    expect(validSocialUsername(app, fallback)).toBe(true)
    expect(fallback).not.toBe('unprovided_alias')
    expect(generatedSocialHandle(app, 'Unprovided Alias')).toBe(fallback)
  }
  for (const app of ['twitter', 'tumblr'] as const) {
    const state = settingsState(), handle = app === 'twitter' ? 'moth_radio' : 'moth-radio'
    const guest = { id: 'alice-bank', name: 'Alice', kind: 'npc-bank' as const, actorId: 'alice' }
    const batch = [{ author: 'Mira', handle, text: 'First voice' }, { author: 'Alice', cardId: guest.id, handle: app === 'twitter' ? 'soft_static' : 'soft-static', text: 'Familiar voice' }]
    const first = socialGeneratedPosts(state, app, batch, 'persona', undefined, at, makeId, [guest])
    state.social!.posts.push(...first)
    const next = socialGeneratedPosts(state, app, batch.map(post => ({ ...post, handle: 'changed', text: 'New words' })), 'persona', undefined, at, makeId, [guest])
    expect(next.map(post => ({ id: post.account.id, handle: post.account.handle }))).toEqual(first.map(post => ({ id: post.account.id, handle: post.account.handle })))
    const request = JSON.parse(socialGenerationRequest(state, app, 'persona', undefined, '', [guest]).messages[1].content)
    expect(request.libraryGuestCards[0].handle).toBe(first[1].account.handle)
    change(state, { app, action: 'profile', username: app === 'twitter' ? 'my_alias' : 'my-alias' })
    expect(socialGeneratedPosts(state, app, [{ author: 'A fake', handle: socialOwner(state, 'persona', app).handle, text: 'Spoof' }], 'persona', undefined, at, makeId)).toEqual([])
  }
})
