import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import type { PhoneState } from '../src/types.js'
import { applySocialMutation, normalizeSocialState, socialGeneratedPosts, socialGenerationRequest, SOCIAL_APPS, socialOwner } from '../src/domain/social.js'
import type { SocialMutation, SocialApp } from '../src/domain/social.js'
import { defaultLauncherLayout, setPocketAppInstalled } from '../src/domain/launcher.js'
import { normalizePocketRoute } from '../src/domain/navigation.js'
import { SocialWorld } from '../src/backend/social-world.js'
import { projectPhoneContext } from '../src/domain/projection.js'
import { renderSocial, type SocialSession } from '../src/frontend/apps/social.js'
import { showPocketSheet } from '../src/frontend/components/ui.js'

let serial = 0
const makeId = (prefix: string) => `${prefix}-${++serial}`
const now = '2026-10-29T16:30:00Z', context = { chatId: 'social-test', characterId: 'alice' }
function socialState(): PhoneState {
  let layout = defaultLauncherLayout()
  for (const app of SOCIAL_APPS) layout = setPocketAppInstalled(layout, app, true)
  return { ...context, characterName: 'Alice', roleplayNow: now, pocketPersonaActorId: 'persona', pocketPersona: { displayName: 'Dane' },
    contacts: [{ id: 'alice', name: 'Alice', role: 'Neighbour', identityBrief: 'A private secret' }], conversations: [{ includesPocketPersona: true, participantActorIds: ['alice'] }],
    launcherLayouts: { persona: layout, alice: layout }, processedCommands: [], social: normalizeSocialState(null),
  } as unknown as PhoneState
}
function mutate(state: PhoneState, input: SocialMutation, owner = 'persona') { state.social = applySocialMutation(state, owner, input, now, makeId); return state.social }
function serviceFixture() {
  let state = socialState(), saves = 0
  const sent: any[] = [], pending: Array<{ signal: AbortSignal; finish(value: Record<string, unknown>): void; request: any }> = []
  const world = new SocialWorld({
    loadState: async () => structuredClone(state), saveState: async next => { state = next; saves++ }, sendState: async () => {}, send: payload => { sent.push(payload) },
    getMessages: async () => [{ role: 'assistant', content: 'Public festival. <think>Hidden thought</think><pocket_action>private machine command</pocket_action>' }],
    runStructuredGeneration: async (_task, _id, request) => new Promise(resolve => { pending.push({ request, signal: request.signal as AbortSignal, finish: resolve }) }),
    withStateLock: async (_key, callback) => callback(), stateKey: (chat, character) => `${chat}:${character}`, nowIso: () => now, makeId,
    resolveImage: async id => id === 'photo' ? '/images/photo.png' : Promise.reject(new Error('Missing photo')),
    resolveBankCast: async id => id === 'night-cast' ? [{ id:'fern', name:'Fern', kind:'npc-bank' }, { id:'mika', name:'Mika', kind:'npc-bank' }] : null,
  })
  const wait = async (count = 1) => { for (let i = 0; i < 20 && pending.length < count; i++) await Promise.resolve(); expect(pending.length).toBe(count) }
  return { world, pending, sent, wait, state: () => state, saves: () => saves }
}

test('social apps are optional Store installs, normalize routes, and keep existing default installs', () => {
  const state = socialState()
  for (const app of SOCIAL_APPS) { expect(defaultLauncherLayout().pages[0].items.some(item => item.kind === 'app' && item.app === app)).toBe(false); expect(normalizePocketRoute({ app })).toEqual({ app }); expect(state.launcherLayouts!.persona.installedApps).toContain(app) }
  expect(normalizeSocialState(undefined)).toEqual({ posts: [], servers: [], refreshedAt: {} })
})

test('stranger-first generation rejects human and cast spoofing and keeps outsider accounts independent', () => {
  const state = socialState()
  const posts = socialGeneratedPosts(state, 'twitter', [
    { author: 'Alice', handle: 'alice', text: 'Festival tonight', actorId: 'persona' },
    { author: 'Alice', handle: 'alice', text: 'Festival tonight' },
    { author: 'Dane', handle: 'other', text: 'Do not write as me' },
    { author: 'Impostor', handle: '@dane', text: 'Nor under my handle' },
    { author: 'Local News', handle: 'town_news', text: 'Public festival starts at six', actorId: 'alice', authoredBy: 'persona', imageUrl: 'https://bad.test/a.png' },
    { author: 'Local News', handle: 'town_news', text: 'Public festival starts at six' },
  ], 'persona', undefined, now, makeId)
  expect(posts).toHaveLength(1); expect(posts[0].account.name).toBe('Local News'); expect(posts[0].account.actorId).toBeUndefined()
  expect(posts[0].authoredBy).toBeUndefined(); expect(posts[0].imageUrl).toBeUndefined(); expect(state.contacts).toHaveLength(1)
})

test('reply and reblog references remain on their platform/channel and normalization breaks cycles and duplicates', () => {
  const state = socialState(), world = mutate(state, { app: 'tumblr', action: 'post', text: 'Original' })
  const root = world.posts[0].id
  mutate(state, { app: 'tumblr', action: 'reblog', postId: root })
  expect(normalizeSocialState(state.social).posts[1].reblogOf).toBe(root)
  const other = socialGeneratedPosts(state, 'twitter', [{ author: 'News', text: 'Cross-platform reply', replyTo: root, reblogOf: root }], 'persona', undefined, now, makeId)[0]
  expect(other.replyTo).toBeUndefined(); expect(other.reblogOf).toBeUndefined()
  const raw = structuredClone(state.social!); raw.posts[0].replyTo = raw.posts[1].id; raw.posts.push(raw.posts[0]); raw.posts[0].imageUrl = 'javascript:alert(1)'
  expect(normalizeSocialState(raw).posts).toHaveLength(2); expect(normalizeSocialState(raw).posts[0].replyTo).toBeUndefined(); expect(normalizeSocialState(raw).posts[0].imageUrl).toBeUndefined()
})

test('likes are per actor, author-only deletion is enforced, and nested replies/reblogs survive reload', () => {
  const state = socialState(), root = mutate(state, { app: 'tumblr', action: 'post', text: 'hello' }).posts[0]
  mutate(state, { app: 'tumblr', action: 'like', postId: root.id }); mutate(state, { app: 'tumblr', action: 'like', postId: root.id }, 'alice')
  expect(state.social!.posts[0].likedBy).toEqual(['persona', 'alice'])
  mutate(state, { app: 'tumblr', action: 'like', postId: root.id }); expect(state.social!.posts[0].likedBy).toEqual(['alice'])
  expect(() => mutate(state, { app: 'tumblr', action: 'delete', postId: root.id }, 'alice')).toThrow('only delete')
  mutate(state, { app: 'tumblr', action: 'post', text: 'reply', replyTo: root.id })
  mutate(state, { app: 'tumblr', action: 'post', text: 'nested', replyTo: state.social!.posts[1].id })
  mutate(state, { app: 'tumblr', action: 'reblog', postId: root.id, text: 'comment', tags: ['#cute'] })
  const saved = normalizeSocialState(JSON.parse(JSON.stringify(state.social)))
  expect(saved.posts).toHaveLength(4); expect(saved.posts[2].replyTo).toBe(saved.posts[1].id); expect(saved.posts[3].tags).toEqual(['cute'])
})

test('Discord creates bounded named channels and blocks access from phones outside the server', () => {
  const state = socialState()
  mutate(state, { app: 'discord', action: 'server', name: 'Night owls', channels: ['general', 'art', 'general'], text: 'A late night club' })
  const server = state.social!.servers[0], channelId = server.channels[0].id
  expect(server.channels.map(channel => channel.name)).toEqual(['general', 'art'])
  mutate(state, { app: 'discord', action: 'post', channelId, text: 'hey!' })
  expect(() => mutate(state, { app: 'discord', action: 'like', postId: state.social!.posts[0].id }, 'alice')).toThrow('one of your servers')
  expect(() => mutate(state, { app: 'discord', action: 'post', channelId: 'missing', text: 'wrong channel' })).toThrow('one of your servers')
})

test('feed request contains public post history and explicit privacy/agency constraints, never private phone data', () => {
  const state = socialState(); mutate(state, { app: 'twitter', action: 'post', text: 'Public announcement' })
  const request = socialGenerationRequest(state, 'twitter', 'persona', undefined, 'Story excerpt')
  expect(request.messages[0].content).toContain('no private scenes, DMs, secrets')
  const data = JSON.parse(request.messages[1].content)
  expect(data.neverAuthor.name).toBe('Dane'); expect(data.recentPosts[0].text).toBe('Public announcement')
  expect(JSON.stringify(data)).not.toContain('A private secret'); expect(data.conversations).toBeUndefined()
})

test('refresh merges concurrent human posts and preserves unrelated state instead of overwriting its snapshot', async () => {
  const f = serviceFixture(), flight = f.world.refresh(context, 'persona', 'twitter', undefined, 'refresh', 'user')
  await f.wait()
  await f.world.mutate(context, 'persona', { app: 'twitter', action: 'post', text: 'While refreshing' }, 'post', 'user')
  f.pending[0].finish({ posts: [{ author: 'Mira', text: 'Fresh from the festival' }, { author: 'Cafe', text: 'Closing soon' }] }); await flight
  expect(f.state().social!.posts.map(post => post.text)).toEqual(['While refreshing', 'Fresh from the festival', 'Closing soon'])
  expect(f.state().contacts).toHaveLength(1); expect(f.state().social!.refreshedAt.twitter).toBe(now)
  expect(f.pending[0].request.messages[1].content).not.toContain('Hidden thought')
})

test('refresh rejects duplicate flights and stale installs; malformed output leaves feed untouched', async () => {
  const f = serviceFixture(), flight = f.world.refresh(context, 'persona', 'instagram', undefined, 'refresh', 'user')
  await f.wait()
  await expect(f.world.refresh(context, 'persona', 'instagram', undefined, 'duplicate', 'user')).rejects.toThrow('already refreshing')
  f.state().launcherLayouts!.persona = setPocketAppInstalled(f.state().launcherLayouts!.persona, 'instagram', false)
  f.pending[0].finish({ posts: [{ author: 'Cafe', text: 'Coffee', photo: 'A little cup' }] })
  await expect(flight).rejects.toThrow('Get this app'); expect(f.saves()).toBe(0)
  const g = serviceFixture(), empty = g.world.refresh(context, 'persona', 'tumblr', undefined, 'empty')
  await g.wait(); g.pending[0].finish({ posts: [{ author: 'Dane', text: 'No human impersonation' }] })
  await expect(empty).rejects.toThrow('No new usable posts'); expect(g.saves()).toBe(0)
})

test('Stop is scoped, releases the busy guard immediately, and ignores late provider completion', async () => {
  const f = serviceFixture(), flight = f.world.refresh(context, 'persona', 'twitter', undefined, 'refresh', 'user')
  await f.wait()
  f.world.cancel(context, 'persona', 'refresh', 'other'); f.world.cancel({ ...context, chatId: 'other' }, 'persona', 'refresh', 'user'); f.world.cancel(context, 'alice', 'refresh', 'user')
  expect(f.pending[0].signal.aborted).toBe(false)
  f.world.cancel(context, 'persona', 'refresh', 'user'); expect(f.pending[0].signal.aborted).toBe(true)
  expect(f.sent.at(-1).action).toBe('cancel')
  const retry = f.world.refresh(context, 'persona', 'twitter', undefined, 'retry', 'user'); await f.wait(2)
  f.pending[0].finish({ posts: [{ author: 'Old', text: 'Stale' }] }); await flight
  expect(f.saves()).toBe(0)
  f.pending[1].finish({ posts: [{ author: 'New', text: 'Fresh' }] }); await retry; expect(f.state().social!.posts.map(post => post.text)).toEqual(['Fresh'])
})

test('mutations deduplicate request retries, resolve real image assets, and preserve state on invalid photo IDs', async () => {
  const f = serviceFixture(), input: SocialMutation = { app: 'instagram', action: 'post', text: 'A real photo', imageId: 'photo', imageUrl: 'javascript:bad' }
  await f.world.mutate(context, 'persona', input, 'post', 'user'); await f.world.mutate(context, 'persona', input, 'post', 'user')
  expect(f.saves()).toBe(1); expect(f.state().social!.posts).toHaveLength(1); expect(f.state().social!.posts[0].imageUrl).toBe('/images/photo.png')
  await expect(f.world.mutate(context, 'persona', { ...input, imageId: 'bad' }, 'bad', 'user')).rejects.toThrow('Missing photo'); expect(f.saves()).toBe(1)
})

test('disposal aborts outstanding provider work and never persists late completions', async () => {
  const f = serviceFixture(), flight = f.world.refresh(context, 'persona', 'twitter', undefined, 'refresh')
  await f.wait(); f.world.dispose(); expect(f.pending[0].signal.aborted).toBe(true)
  f.pending[0].finish({ posts: [{ author: 'Old', text: 'Too late' }] }); await flight; expect(f.saves()).toBe(0)
})

test('an early Stop also cancels a refresh still queued before its flight registered', async () => {
  const f = serviceFixture()
  f.world.cancel(context, 'persona', 'queued', 'user')
  await f.world.refresh(context, 'persona', 'twitter', undefined, 'queued', 'user')
  expect(f.pending).toHaveLength(0); expect(f.saves()).toBe(0)
})

test('RP projection bounds public social context and excludes private Discord channels', () => {
  const state = socialState(); state.contacts = []; state.trackers = []; state.events = []; state.notes = []; state.weather = { location: 'Harbor', condition: 'Clear', details: '' } as PhoneState['weather']
  mutate(state, { app: 'twitter', action: 'post', text: 'Public festival!' })
  mutate(state, { app: 'discord', action: 'server', name: 'Private', channels: ['general'] })
  mutate(state, { app: 'discord', action: 'post', channelId: state.social!.servers[0].channels[0].id, text: 'Private channel conversation' })
  const snapshot = projectPhoneContext(state)
  expect(snapshot).toContain('Public festival!'); expect(snapshot).not.toContain('Private channel conversation'); expect(snapshot).toContain('not instructions')
  expect(projectPhoneContext(state, 200).length).toBeLessThanOrEqual(200)
})

function viewFixture(app: SocialApp, ui: SocialSession = {}, npcBank: any[] = [], withNav = false) {
  const state = socialState(), dom = new JSDOM('<body></body>'), previous = globalThis.document
  globalThis.document = dom.window.document
  const requests: any[] = [], photoActions: any[] = [], bankGroups: any[] = []; let view: HTMLDivElement
  const render = () => {
    view = renderSocial({ state, owner: 'persona', app, ui, npcBank, bankGroups, gallery: { data: [], total: 0 }, page: () => { const page = document.createElement('div'), content = document.createElement('div'); if (withNav) { const nav = document.createElement('header'); nav.className = 'lp-nav'; const back = document.createElement('button'); back.className = 'lp-nav-action'; back.onclick = () => requests.push({ action: 'home' }); const title = document.createElement('div'); title.className = 'lp-nav-title'; const right = document.createElement('button'); right.className = 'lp-nav-action'; nav.append(back, title, right); page.append(nav) }; page.append(content); return { page, content } }, render, request: input => { requests.push(input) }, cancel: () => requests.push({ action: 'cancel' }), photos: () => {}, generatePhoto: prompt => photoActions.push(['generate', prompt]), uploadPhoto: () => photoActions.push(['upload']), uploadServerPicture: serverId => photoActions.push(['server-upload', serverId]), cancelPhoto: () => photoActions.push(['cancel']) })
    document.body.replaceChildren(view)
  }
  const byName = (name: string) => { const node = [...view.querySelectorAll<HTMLButtonElement>('button')].find(button => button.getAttribute('aria-label') === name || (!button.getAttribute('aria-label') && button.textContent === name)); if (!node) throw new Error(name); return node }
  return { state, ui, dom, render, requests, photoActions, bankGroups, byName, view: () => view, close() { dom.window.close(); globalThis.document = previous } }
}

test('all four apps open without generation, expose labelled composers, and keep drafts on failed updates', () => {
  for (const app of SOCIAL_APPS) {
    const f = viewFixture(app, { composing: true, draft: 'Unsaved words', error: 'Retry this update' }); f.render()
    try { expect(f.requests).toEqual([]); expect(f.view().querySelector<HTMLTextAreaElement>('[data-social-focus="Social composer"]')?.value).toBe('Unsaved words'); expect(f.view().querySelector('[role=alert]')?.textContent).toBe('Retry this update'); expect([...f.view().querySelectorAll('textarea,input,select')].every(input => Boolean(input.closest('label')))).toBe(true) } finally { f.close() }
  }
})

test('Twitter quote and Tumblr reblog use canonical targets; nested threads stay visible and text renders safely', () => {
  const f = viewFixture('tumblr')
  try {
    mutate(f.state, { app: 'tumblr', action: 'post', text: '<script>alert(1)</script>' })
    const root = f.state.social!.posts[0]
    mutate(f.state, { app: 'tumblr', action: 'post', text: 'reply', replyTo: root.id }, 'alice')
    mutate(f.state, { app: 'tumblr', action: 'post', text: 'nested', replyTo: f.state.social!.posts[1].id })
    f.render(); expect(f.view().querySelector('script')).toBeNull()
    f.byName(`Read replies to Dane’s post ${root.id}`).click(); expect(f.view().querySelectorAll('.lp-social-post')).toHaveLength(1); expect(f.view().querySelectorAll('.lp-social-comment')).toHaveLength(2)
    f.byName(`Reblog Dane’s post ${root.id}`).click(); expect(f.ui.reblogOf).toBe(root.id)
    const form = f.view().querySelector<HTMLFormElement>('form[aria-label="Tumblr composer"]')!; form.dispatchEvent(new f.dom.window.Event('submit', { cancelable: true })); expect(f.requests.at(-1)).toMatchObject({ action: 'reblog', postId: root.id })
    expect([...f.view().querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].every(button => ['true', 'false'].includes(button.getAttribute('aria-pressed')!))).toBe(true)
  } finally { f.close() }
})

test('pending refresh exposes Stop, disables duplicate actions, and does not discard the composer', () => {
  const f = viewFixture('twitter', { composing: true, refreshing: true, pending: 'request', draft: 'Keep me' }); f.render()
  try { f.byName('Refresh Twitter').click(); expect(f.requests).toHaveLength(0); f.byName('Stop refreshing Twitter').click(); expect(f.requests).toEqual([{ action: 'cancel' }]); expect(f.view().querySelector('textarea')?.value).toBe('Keep me') } finally { f.close() }
})

test('new-post action opens an isolated screen without generating', () => {
  const f = viewFixture('instagram'); f.render()
  try {
    f.byName('Compose Instagram post').click()
    expect(f.ui.composing).toBe(true)
    f.render(); expect(f.view().dataset.socialView).toBe('compose'); expect(f.view().querySelector('.lp-social-feed')).toBeNull()
  } finally { f.close() }
})


test('social interactive surfaces keep native field labels and meaningful control names', () => {
  for (const app of SOCIAL_APPS) {
    const f = viewFixture(app)
    try {
      mutate(f.state, { app: app === 'discord' ? 'twitter' : app, action: 'post', text: 'A public post to interact with' }, 'alice')
      f.render()
      const controls = [...f.view().querySelectorAll<HTMLButtonElement>('button')]
      expect(controls.length).toBeGreaterThan(0)
      for (const control of controls) {
        expect((control.getAttribute('aria-label') || control.textContent || '').trim()).not.toBe('')
        expect(control.querySelector('button,input,select,textarea,a[href]')).toBeNull()
      }
      for (const field of f.view().querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select')) {
        expect(Boolean(field.labels?.length || field.getAttribute('aria-label') || field.getAttribute('aria-labelledby'))).toBe(true)
      }
      const ids = [...f.view().querySelectorAll('[id]')].map(node => node.id)
      expect(new Set(ids).size).toBe(ids.length)
    } finally { f.close() }
  }
})

test('Twitter following feed remains distinct from the owner profile and preserves drafts', () => {
  const f = viewFixture('twitter', { draft: 'An unfinished thought' })
  try {
    mutate(f.state, { app: 'twitter', action: 'post', text: 'From Alice' }, 'alice')
    mutate(f.state, { app: 'twitter', action: 'post', text: 'From Dane' })
    f.render()
    f.byName('Following').click()
    expect(f.view().querySelectorAll('.lp-social-post:not([data-social-preview])')).toHaveLength(0)
    f.byName('Twitter profile').click()
    expect(f.view().querySelectorAll('.lp-social-post:not([data-social-preview])')).toHaveLength(1)
    expect(f.view().querySelector('.lp-social-post')?.textContent).toContain('From Dane')
    f.byName('Twitter home').click(); f.byName('For you').click()
    f.byName('Follow Alice').click()
    expect(f.requests.at(-1)).toMatchObject({ app: 'twitter', action: 'follow', accountId: 'alice' })
    mutate(f.state, f.requests.at(-1)); f.render(); f.byName('Following').click()
    expect(f.view().querySelectorAll('.lp-social-post:not([data-social-preview])')).toHaveLength(1)
    expect(f.view().querySelector('.lp-social-post')?.textContent).toContain('From Alice')
    expect(f.ui.draft).toBe('An unfinished thought')
  } finally { f.close() }
})


test('platform navigation switches the feed and opens the real composer', () => {
  for (const app of ['twitter', 'instagram', 'tumblr'] as const) {
    const name = app === 'twitter' ? 'Twitter' : app === 'instagram' ? 'Instagram' : 'Tumblr'
    const f = viewFixture(app, { draft: 'Keep this draft' })
    try {
      mutate(f.state, { app, action: 'post', text: 'From Alice' }, 'alice')
      mutate(f.state, { app, action: 'post', text: 'From Dane' })
      f.render()
      const navigation = f.view().querySelector(`nav[aria-label="${name} navigation"]`)
      expect(navigation).not.toBeNull()
      f.byName(`${name} profile`).click()
      expect(f.ui.ownOnly).toBe(true); expect(f.view().querySelectorAll('.lp-social-post')).toHaveLength(1)
      f.byName(`${name} home`).click()
      expect(f.ui.ownOnly).toBe(false); expect(f.view().querySelectorAll('.lp-social-post')).toHaveLength(2)
      f.byName(`Compose ${name} post`).click()
      expect(f.view().dataset.socialView).toBe('compose')
      expect(f.view().querySelector<HTMLTextAreaElement>('[data-social-focus="Social composer"]')!.value).toBe('Keep this draft')
      expect(f.requests).toHaveLength(0)
    } finally { f.close() }
  }
})


test('known account avatars reuse contact overrides and Persona photos with decorative fallbacks', () => {
  const f = viewFixture('twitter')
  try {
    Object.assign(f.state.contacts[0], { avatarOverrideUrl: '/portraits/alice-custom.png', sourceAvatarUrl: '/portraits/alice-source.png' })
    f.state.pocketPersona.avatarUrl = '/portraits/dane.png'
    mutate(f.state, { app: 'twitter', action: 'post', text: 'Alice post' }, 'alice')
    mutate(f.state, { app: 'twitter', action: 'post', text: 'Dane post' })
    f.render()
    const cards = [...f.view().querySelectorAll<HTMLElement>('.lp-social-post')]
    const aliceAvatar = cards.find(card => card.textContent?.includes('Alice post'))!.querySelector<HTMLElement>('.lp-social-avatar')!
    const aliceImage = aliceAvatar.querySelector<HTMLImageElement>('img')!
    expect(aliceImage.getAttribute('src')).toBe('/portraits/alice-custom.png')
    expect(aliceImage.alt).toBe(''); expect(aliceAvatar.getAttribute('aria-hidden')).toBe('true')
    aliceImage.dispatchEvent(new f.dom.window.Event('error'))
    expect(aliceAvatar.querySelector('img')).toBeNull(); expect(aliceAvatar.querySelector('svg')).not.toBeNull()
    f.byName('Twitter profile').click()
    expect(f.view().querySelector<HTMLImageElement>('.lp-social-profile .lp-social-avatar img')!.getAttribute('src')).toBe('/portraits/dane.png')
  } finally { f.close() }
})

test('social timestamps use stored RP instants and timezone rather than current wall-clock time', () => {
  const discord = viewFixture('discord')
  try {
    discord.state.roleplayTimezoneOffsetMinutes = -180
    discord.state.roleplayClockSource = 'manual'
    mutate(discord.state, { app: 'discord', action: 'server', name: 'Night owls', channels: ['general'] })
    mutate(discord.state, { app: 'discord', action: 'post', text: 'An earlier channel message', channelId: discord.state.social!.servers[0].channels[0].id })
    discord.state.social!.posts[0].createdAt = '2026-10-29T10:05:00Z'
    discord.render()
    expect(discord.view().querySelector('time')!.textContent).toBe('13:05')
    expect(discord.view().querySelector('time')!.dateTime).toBe('2026-10-29T10:05:00Z')
    discord.state.roleplayNow = '2026-11-01T01:00:00Z'; discord.render()
    expect(discord.view().querySelector('time')!.textContent).toBe('13:05')
  } finally { discord.close() }
  const twitter = viewFixture('twitter')
  try {
    twitter.state.roleplayClockSource = 'manual'
    mutate(twitter.state, { app: 'twitter', action: 'post', text: 'A few story minutes ago' })
    twitter.state.social!.posts[0].createdAt = '2026-10-29T16:17:00Z'
    twitter.render(); expect(twitter.view().querySelector('time')!.textContent).toBe('13m')
    twitter.state.roleplayNow = '2026-10-29T17:00:00Z'; twitter.render()
    expect(twitter.view().querySelector('time')!.textContent).toBe('43m')
  } finally { twitter.close() }
})


test('starter posts and preview discussions never enter saved state or generate actor content', () => {
  for (const app of ['twitter', 'instagram', 'tumblr'] as const) {
    const f = viewFixture(app), before = JSON.stringify(f.state)
    try {
      f.render()
      expect(f.view().querySelectorAll('[data-social-preview="true"]')).toHaveLength(3)
      const portraits = [...f.view().querySelectorAll('[data-social-preview] .lp-social-avatar')].map(avatar => avatar.innerHTML)
      expect(portraits[0]).not.toBe(portraits[1]); f.render()
      expect(f.view().querySelector('[data-social-preview] .lp-social-avatar')!.innerHTML).toBe(portraits[0])
      expect(f.view().querySelectorAll('[data-social-preview] [aria-label^="Like "]')).toHaveLength(0)
      const discussion = f.view().querySelector<HTMLButtonElement>('[data-social-preview] button[aria-label^="Open discussion for "]')!
      discussion.click()
      expect(f.view().querySelectorAll('[data-social-preview="true"]')).toHaveLength(2)
      expect(f.view().textContent).toContain('A small moment, perfectly captured.')
      if (app === 'tumblr') { f.byName('Reblogs').click(); expect(f.view().textContent).toContain('sample commentary'); f.byName('Comments').click() }
      expect(f.requests).toHaveLength(0); expect(JSON.stringify(f.state)).toBe(before)
      f.byName('Back to social feed').click(); f.byName('Hide sample posts').click()
      expect(f.view().querySelectorAll('[data-social-preview]')).toHaveLength(0)
      expect(f.state.social!.posts).toHaveLength(0); expect(f.requests).toHaveLength(0)
    } finally { f.close() }
  }
})

test('bio editor saves the canonical phone owner profile without replacing a post draft', () => {
  const f = viewFixture('twitter', { draft: 'Unfinished public post' })
  try {
    f.render(); f.byName('Twitter profile').click(); f.byName('Edit bio').click()
    const field = [...f.view().querySelectorAll<HTMLTextAreaElement>('textarea')].find(field => field.closest('label')?.querySelector('span')?.textContent === 'Bio')!
    field.value = 'Always looking for the next little story.'; field.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }))
    f.byName('Save bio').click()
    expect(f.requests.at(-1)).toMatchObject({ app: 'twitter', action: 'profile', bio: field.value })
    mutate(f.state, f.requests.at(-1)); f.ui.profileEdit = false; f.render()
    expect(f.view().querySelector('.lp-social-bio')?.textContent).toBe(field.value)
    expect(f.ui.draft).toBe('Unfinished public post')
  } finally { f.close() }
})

test('composer photo controls call their media boundary and keep a draft and previous attachment while busy', () => {
  const f = viewFixture('instagram', { draft: 'A caption in progress', photoPrompt: 'Sunlight in the harbor', composing: true, mediaOpen: true, imageId: 'previous-photo' })
  try {
    f.render(); f.byName('Generate photo').click(); f.byName('Upload photo').click()
    expect(f.photoActions).toEqual([['generate', 'Sunlight in the harbor'], ['upload']])
    f.ui.imageBusy = true; f.ui.imageProgress = 'Making your photo…'; f.render()
    expect(f.byName('Generate photo').disabled).toBe(true); expect(f.byName('Upload photo').disabled).toBe(true)
    expect(f.byName('Share').disabled).toBe(true)
    f.byName('Cancel photo operation').click(); expect(f.photoActions.at(-1)).toEqual(['cancel'])
    expect(f.ui.draft).toBe('A caption in progress'); expect(f.ui.imageId).toBe('previous-photo')
  } finally { f.close() }
})


test('Twitter Quote embeds the original as a new root while Reply stays in the original discussion', () => {
  const f = viewFixture('twitter')
  try {
    const original = mutate(f.state, { app: 'twitter', action: 'post', text: 'An original worth quoting' }, 'alice').posts[0]
    f.render(); f.byName(`Quote Alice’s post ${original.id}`).click()
    expect(f.view().dataset.socialComposeMode).toBe('quote')
    expect(f.view().querySelector(`blockquote[aria-label="Quote Tweet @${original.account.handle}"]`)?.textContent).toContain(original.text)
    const comment = f.view().querySelector<HTMLTextAreaElement>('[placeholder="Add a comment"]')!
    comment.value = 'A separate opinion'; comment.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }))
    f.view().querySelector<HTMLFormElement>('form[aria-label="Twitter composer"]')!.dispatchEvent(new f.dom.window.Event('submit', { cancelable: true }))
    expect(f.requests.at(-1)).toMatchObject({ action: 'reblog', postId: original.id, text: 'A separate opinion' })
    expect(f.requests.at(-1).replyTo).toBeUndefined()
    mutate(f.state, f.requests.at(-1)); const quote = f.state.social!.posts.at(-1)!
    f.ui.reblogOf = undefined; f.ui.composing = false; f.render()
    f.byName(`Open discussion for Dane’s post ${quote.id}`).click()
    expect([...f.view().querySelectorAll<HTMLElement>('.lp-social-post')].map(post => post.dataset.socialPost)).toEqual([quote.id])
    f.byName('Back to social feed').click(); f.byName(`Reply to Alice’s post ${original.id}`).click()
    const replyForm = f.view().querySelector('form[aria-label="Twitter composer"]')!; const originalPost = f.view().querySelector<HTMLElement>(`[data-social-post="${original.id}"]`)!; expect(originalPost.textContent).toContain(original.text); expect(Boolean(originalPost.compareDocumentPosition(replyForm) & 4)).toBe(true); expect(replyForm.querySelector('blockquote')).toBeNull()
    const reply = f.view().querySelector<HTMLTextAreaElement>('[placeholder="Post your reply"]')!
    reply.value = 'A reply in the existing discussion'; reply.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }))
    f.view().querySelector<HTMLFormElement>('form[aria-label="Twitter composer"]')!.dispatchEvent(new f.dom.window.Event('submit', { cancelable: true }))
    expect(f.requests.at(-1)).toMatchObject({ action: 'post', replyTo: original.id, text: 'A reply in the existing discussion' })
    expect(f.requests.at(-1).postId).toBeUndefined(); expect(f.ui.threadId).toBe(original.id)
  } finally { f.close() }
})


test('Discord People forms target only the selected server and never turn members into Contacts', () => {
  const f = viewFixture('discord')
  try {
    mutate(f.state, { app: 'discord', action: 'server', name: 'Night owls', channels: ['general'] })
    mutate(f.state, { app: 'discord', action: 'server', name: 'Dawn patrol', channels: ['general'] })
    const [night, dawn] = f.state.social!.servers
    f.ui.serverId = night.id; f.ui.peopleOpen = true; f.render()
    f.byName('Add people in Night owls').click()
    const form = f.view().querySelector<HTMLFormElement>('form[aria-label="Add person to Night owls"]')!
    const input = form.querySelector<HTMLInputElement>('input')!; input.value = 'Nocturne'; input.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }))
    form.dispatchEvent(new f.dom.window.Event('submit', { cancelable: true }))
    expect(f.requests.at(-1)).toMatchObject({ action: 'participant', app: 'discord', serverId: night.id, name: 'Nocturne' })
    mutate(f.state, f.requests.at(-1)); f.render(); f.byName('Members in Night owls').click()
    expect(f.view().querySelector('.lp-discord-people-list')!.textContent).toContain('Nocturne')
    f.ui.serverId = dawn.id; f.render()
    expect(f.view().querySelector('.lp-discord-people-list')!.textContent).not.toContain('Nocturne')
    expect(f.state.social!.servers.find(server => server.id === night.id)!.participants).toHaveLength(1)
    expect(f.state.contacts).toHaveLength(1); expect(f.state.contacts[0].name).toBe('Alice')
  } finally { f.close() }
})


test('queued story-sheet close preserves a newer focus move and restores the opener when needed', () => {
  const dom = new JSDOM('<body><div><button id="story">Story</button><button id="discussion">Discussion</button></div></body>'), previous = globalThis.document
  globalThis.document = dom.window.document
  const opener = document.querySelector<HTMLButtonElement>('#story')!, next = document.querySelector<HTMLButtonElement>('#discussion')!
  let nativeRestore = true, completeClose = () => {}
  const prototype = dom.window.HTMLDialogElement.prototype
  prototype.showModal = function () { this.open = true; this.querySelector<HTMLButtonElement>('button')?.focus() }
  prototype.close = function () { this.open = false; if (nativeRestore) opener.focus(); completeClose = () => this.dispatchEvent(new dom.window.Event('close')) }
  try {
    showPocketSheet(opener, 'Preview story', document.createElement('div'))
    document.querySelector<HTMLButtonElement>('.lp-sheet-close')!.click()
    expect(document.activeElement).toBe(opener)
    next.focus(); completeClose()
    expect(document.activeElement).toBe(next); expect(document.querySelector('dialog')).toBeNull()
    nativeRestore = false
    showPocketSheet(opener, 'Preview story', document.createElement('div'))
    document.querySelector<HTMLButtonElement>('.lp-sheet-close')!.click(); completeClose()
    expect(document.activeElement).toBe(opener); expect(document.querySelector('dialog')).toBeNull()
  } finally { dom.window.close(); globalThis.document = previous }
})


test('deferred server autofocus preserves a newer channel-field focus and routes typing to that field', () => {
  const f = viewFixture('discord', { serverOpen: true, focusServerCreate: true, serverName: 'Dawn patrol' }), frames: FrameRequestCallback[] = []
  f.dom.window.requestAnimationFrame = callback => { frames.push(callback); return frames.length }
  try {
    f.render()
    const channels = f.view().querySelector<HTMLInputElement>('[data-social-focus="serverChannels"]')!
    channels.focus(); for (const callback of frames) callback(0)
    expect(document.activeElement).toBe(channels)
    const active = document.activeElement as HTMLInputElement
    active.value = 'general'; active.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }))
    expect(f.ui.serverName).toBe('Dawn patrol'); expect(f.ui.serverChannels).toBe('general')
  } finally { f.close() }
})


test('platform Home and Profile navigation leave settings and Twitter quote mode', () => {
  for (const app of ['twitter', 'instagram', 'tumblr'] as const) {
    const name = app === 'twitter' ? 'Twitter' : app === 'instagram' ? 'Instagram' : 'Tumblr'
    const f = viewFixture(app, { settingsOpen: true })
    try {
      const original = mutate(f.state, { app, action: 'post', text: 'A source post' }, 'alice').posts[0]
      f.render(); f.byName(`${name} home`).click()
      expect(f.ui.settingsOpen).toBe(false)
      f.ui.settingsOpen = true; f.render(); f.byName(`${name} profile`).click()
      expect(f.ui.settingsOpen).toBe(false); expect(f.ui.ownOnly).toBe(true)
      if (app === 'twitter') {
        f.ui.ownOnly = false; f.ui.reblogOf = original.id; f.ui.composing = true; f.render()
        f.byName('Twitter profile').click()
        expect(f.ui.reblogOf).toBeUndefined(); expect(f.view().dataset.socialComposeMode).toBeUndefined()
      }
    } finally { f.close() }
  }
})

test('NPC Bank settings disclosure stays open through saving and the bio editor respects pending state', () => {
  const f = viewFixture('twitter', { settingsOpen: true }, [{ id: 'bank-fern', name: 'Fern Finch', role: 'Botanist' }])
  try {
    f.render()
    f.byName('Choose friends and portable casts').click(); const picker = f.view().querySelector<HTMLDetailsElement>('[data-friend-group=bank]')!
    const checkbox = picker.querySelector<HTMLInputElement>('input[type="checkbox"]')!
    checkbox.checked = true; checkbox.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }))
    expect(f.requests.at(-1)).toMatchObject({ action: 'settings', friendEntryIds: ['bank-fern'] })
    f.ui.pending = 'settings-save'; f.render()
    expect(f.view().querySelector<HTMLDetailsElement>('[data-friend-group=bank]')!.open).toBe(true)
    mutate(f.state, f.requests.at(-1)); f.ui.pending = undefined; f.render()
    expect(f.view().querySelector<HTMLDetailsElement>('[data-friend-group=bank]')!.open).toBe(true)
    f.byName('Twitter profile').click(); f.byName('Edit bio').click(); f.ui.pending = 'bio-save'; f.render()
    const bio = [...f.view().querySelectorAll<HTMLTextAreaElement>('textarea')].find(field => field.closest('label')?.querySelector('span')?.textContent === 'Bio')!
    expect(bio.disabled).toBe(true)
  } finally { f.close() }
})

test('Instagram private message drafts survive inbox navigation and stay scoped to each account', () => {
  const f = viewFixture('instagram')
  try {
    const alice = mutate(f.state, { app: 'instagram', action: 'post', text: 'Alice photo', photo: 'A greenhouse' }, 'alice').posts[0].account
    f.state.social!.posts.push(...socialGeneratedPosts(f.state, 'instagram', [{ author: 'Mira', text: 'Mira photo', photo: 'An evening garden' }], 'persona', undefined, now, makeId))
    for (const post of f.state.social!.posts) mutate(f.state, { app: 'instagram', action: 'follow', accountId: post.account.id })
    f.ui.dmOpen = true; f.ui.dmAccountId = alice.id; f.render()
    const type = (value: string) => { const field = f.view().querySelector<HTMLTextAreaElement>('[data-social-focus="Instagram DM composer"]')!; field.value = value; field.dispatchEvent(new f.dom.window.Event('input', { bubbles: true })) }
    type('An unfinished note to Alice'); f.byName('Back to Instagram inbox').click(); f.byName('Message Mira').click()
    expect(f.view().querySelector<HTMLTextAreaElement>('[data-social-focus="Instagram DM composer"]')!.value).toBe('')
    type('A separate note to Mira'); f.byName('Back to Instagram inbox').click(); f.byName('Message Alice').click()
    expect(f.view().querySelector<HTMLTextAreaElement>('[data-social-focus="Instagram DM composer"]')!.value).toBe('An unfinished note to Alice')
    expect(f.requests).toHaveLength(0); expect(f.state.social!.dmThreads || []).toHaveLength(0)
  } finally { f.close() }
})


test('Discord server menu sits above channels, exposes picture controls, and returns cleanly from People', () => {
  const f=viewFixture('discord',{channelsOpen:true})
  try {
    mutate(f.state,{action:'server',app:'discord',name:'Night owls',channels:['general','art']});f.render()
    const panel=f.view().querySelector('.lp-discord-channel-panel')!
    expect(panel.firstElementChild?.classList.contains('lp-discord-server-menu')).toBe(true)
    expect(panel.querySelector('select')).toBeNull()
    let toggle=f.byName('Night owls server menu')
    expect(toggle.textContent).toContain('Night owls');expect(toggle.getAttribute('aria-expanded')).toBe('false')
    toggle.click();toggle=f.byName('Night owls server menu')
    const body=document.getElementById(toggle.getAttribute('aria-controls')!)!
    expect(body.hidden).toBe(false);expect(toggle.getAttribute('aria-expanded')).toBe('true')
    f.byName('Upload server picture for Night owls').click()
    expect(f.photoActions.at(-1)).toEqual(['server-upload',f.state.social!.servers[0].id])
    toggle.dispatchEvent(new f.dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))
    expect(f.ui.channelsOpen).toBe(true);expect(f.byName('Night owls server menu').getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(f.byName('Night owls server menu'))
    f.byName('Night owls server menu').click();f.byName('People in Night owls').click()
    expect(f.ui.peopleOpen).toBe(true)
    expect(f.view().querySelector('.lp-discord-channel-heading strong')?.textContent).toBe('Night owls')
    expect(f.view().querySelector<HTMLElement>('.lp-discord-pins-open')?.hidden).toBe(true)
    f.byName('Back to server channels').click()
    expect(f.ui.peopleOpen).toBe(false);expect(f.ui.channelsOpen).toBe(true)
  } finally {f.close()}
})

test('Discord channel navigation retains focus synchronously for fast Enter and Escape sequences', () => {
  const f = viewFixture('discord')
  f.dom.window.requestAnimationFrame = () => 1
  try {
    mutate(f.state, { app: 'discord', action: 'server', name: 'Night owls', channels: ['general'] })
    f.render(); const show = f.byName('Show channels'); show.focus(); show.click()
    expect(document.activeElement).toBe(f.byName('Hide channels'))
    document.activeElement!.dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    expect(f.ui.channelsOpen).toBe(false)
    expect(document.activeElement).toBe(f.byName('Show channels'))
    expect(f.byName('Show channels').getAttribute('aria-expanded')).toBe('false')
  } finally { f.close() }
})


test('app header Home and internal Back have separate actions and manual refresh stays on the main feed', () => {
  const f = viewFixture('twitter', {}, [], true)
  try {
    f.render(); f.byName('Return to Pocket home').click(); expect(f.requests.at(-1)).toEqual({ action: 'home' })
    f.byName('Refresh Twitter').click(); expect(f.requests.at(-1)).toEqual({ action: 'refresh', app: 'twitter', channelId: undefined })
    f.byName('Twitter settings').click(); expect(f.ui.settingsOpen).toBe(true)
    f.byName('Close Twitter settings').click(); expect(f.ui.settingsOpen).toBe(false)
    expect(f.requests.filter(request => request.action === 'home')).toHaveLength(1)
    mutate(f.state, { app: 'twitter', action: 'post', text: 'An original post' }, 'alice'); const original = f.state.social!.posts[0]
    f.render(); f.byName(`Open discussion for Alice’s post ${original.id}`).click()
    f.byName('Back to Twitter feed').click(); expect(f.ui.threadId).toBeUndefined()
    expect(f.requests.filter(request => request.action === 'home')).toHaveLength(1)
  } finally { f.close() }
})

test('refresh schedule controls are per-app labelled selects and Tumblr palette lives in settings', () => {
  const f = viewFixture('tumblr', { settingsOpen: true })
  try {
    f.render(); expect(f.view().querySelector('.lp-tumblr-palette-options')!.closest('.lp-social-settings')).not.toBeNull()
    const mode = f.view().querySelector<HTMLSelectElement>('select[data-social-focus="Feed refresh"]')!
    expect([...mode.options].map(option => option.textContent)).toEqual(['Manual', 'After each turn', 'Automatic'])
    mode.value = 'timer'; mode.dispatchEvent(new f.dom.window.Event('change')); expect(f.requests.at(-1)).toMatchObject({ action: 'settings', refreshMode: 'timer' })
    mutate(f.state, f.requests.at(-1)); f.render()
    const interval = f.view().querySelector<HTMLInputElement>('input[data-social-focus="Refresh interval (minutes)"]')!
    expect(interval.value).toBe('5'); interval.value = '12'; interval.dispatchEvent(new f.dom.window.Event('change'))
    expect(f.requests.at(-1)).toMatchObject({ refreshIntervalMinutes: 12 })
    const nextMode = f.view().querySelector<HTMLSelectElement>('select[data-social-focus="Feed refresh"]')!; nextMode.value = 'manual'; nextMode.dispatchEvent(new f.dom.window.Event('change')); mutate(f.state, f.requests.at(-1)); f.render()
    expect(f.view().querySelector('input[data-social-focus="Refresh interval (minutes)"]')).toBeNull()
  } finally { f.close() }
})

test('discussion renders the original first, compact per-app responses, and the reply composer below it', () => {
  for (const app of ['twitter', 'instagram', 'tumblr'] as const) {
    const f = viewFixture(app)
    try {
      mutate(f.state, { app, action: 'post', text: 'Original from Alice' }, 'alice'); const original = f.state.social!.posts[0]
      mutate(f.state, { app, action: 'post', text: 'A response', replyTo: original.id }); f.ui.threadId = original.id; f.ui.replyTo = original.id; f.ui.composing = true; f.render()
      const root = f.view().querySelector<HTMLElement>(`[data-social-post="${original.id}"]`)!, response = f.view().querySelector('.lp-social-comment')!, form = f.view().querySelector('.lp-social-reply-compose')!
      expect(root).not.toBeNull(); expect(response.classList.contains(`lp-${app}-comment`)).toBe(true); expect(Boolean(root.compareDocumentPosition(form) & 4)).toBe(true)
      expect(response.querySelector('.lp-social-follow')).toBeNull(); expect(response.querySelector('.lp-social-photo-description')).toBeNull(); expect(form.classList.contains(`lp-${app}-reply-compose`)).toBe(true)
      expect(f.view().querySelectorAll('.lp-social-post')).toHaveLength(1)
    } finally { f.close() }
  }
})

test('Instagram thread has recipient chrome, a scrolling message log, timestamps and its own pinned composer', () => {
  const f = viewFixture('instagram', { dmOpen: true, dmAccountId: 'alice' }, [], true)
  try {
    f.state.social = normalizeSocialState({ dmThreads: [{ id: 'private-thread', owner: 'persona', account: { id: 'alice', actorId: 'alice', name: 'Alice', handle: 'alice' }, updatedAt: now, messages: [{ id: 'one', sender: 'owner', text: 'Hello', createdAt: now }, { id: 'two', sender: 'account', text: 'Hey back', createdAt: now }] }] })
    f.render(); expect(f.view().dataset.instagramView).toBe('thread'); expect(f.view().querySelector('.lp-instagram-recipient')?.textContent).toContain('Alice')
    expect(f.view().querySelectorAll('.lp-instagram-dm-row')).toHaveLength(2); expect(f.view().querySelectorAll('.lp-instagram-dm-time')).toHaveLength(2)
    expect(f.view().querySelector('.lp-instagram-dm-compose')?.closest('.lp-instagram-dms')).not.toBeNull()
    expect(f.view().querySelector<HTMLElement>('nav[aria-label="Instagram navigation"]')?.hidden).toBe(true)
    f.byName('Back to Instagram inbox').click(); expect(f.view().dataset.instagramView).toBe('inbox'); expect(f.ui.dmOpen).toBe(true)
    f.byName('Back to Instagram feed').click(); expect(f.ui.dmOpen).toBe(false); expect(f.requests.filter(request => request.action === 'home')).toHaveLength(0)
  } finally { f.close() }
})

test('Discord rail exits Create server and keeps the unfinished server form draft', () => {
  const f = viewFixture('discord', {}, [], true)
  try {
    mutate(f.state, { app: 'discord', action: 'server', name: 'Night owls', channels: ['general'] }); f.render(); f.byName('Create a Discord server').click()
    const name = f.view().querySelector<HTMLInputElement>('[data-social-focus="serverName"]')!; name.value = 'Unfinished club'; name.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }))
    f.byName('Open server Night owls').click(); expect(f.ui.serverOpen).toBe(false); expect(f.view().dataset.discordView).toBe('chat'); expect(f.ui.serverName).toBe('Unfinished club')
    f.byName('Create a Discord server').click(); f.byName('Back to Discord channels').click(); expect(f.ui.serverOpen).toBe(false); expect(f.requests.filter(request => request.action === 'home')).toHaveLength(0)
  } finally { f.close() }
})


test('Instagram inbox hides idle public feed status while retaining an active feed Stop control', () => {
  const f = viewFixture('instagram', { dmOpen: true, status: 'New reply.' })
  try {
    f.render(); expect(f.view().querySelector<HTMLElement>('.lp-social-operation')!.hidden).toBe(true)
    f.ui.refreshing = true; f.ui.pending = 'feed-refresh'; f.render()
    expect(f.view().querySelector<HTMLElement>('.lp-social-operation')!.hidden).toBe(false)
    expect(f.byName('Stop refreshing Instagram').hidden).toBe(false)
    f.ui.refreshing = false; f.ui.pending = undefined; f.render(); f.byName('Back to Instagram feed').click()
    expect(f.view().querySelector<HTMLElement>('.lp-social-operation')!.hidden).toBe(false)
  } finally { f.close() }
})


test('friend management includes local characters on its own screen', () => {
  const f = viewFixture('twitter', { settingsOpen: true })
  try {
    f.render(); f.byName('Choose friends and portable casts').click()
    expect(f.view().querySelector('[aria-label="Friends and portable casts"]')).not.toBeNull()
    const checkbox = f.view().querySelector<HTMLInputElement>('input[aria-label="Include Alice from Characters"]')!
    expect(checkbox).not.toBeNull(); checkbox.checked = true; checkbox.dispatchEvent(new f.dom.window.Event('change'))
    expect(f.requests.at(-1).friendEntryIds).toContain('actor:alice')
  } finally { f.close() }
})


test('friend groups prioritize casts and characters and preserve disclosure choices during saves', () => {
  const bank = Array.from({ length: 20 }, (_, n) => ({ id: `bank-${n}`, name: `Stranger ${n}` }))
  const f = viewFixture('tumblr', { settingsOpen: true, friendsScreen: true }, bank)
  try {
    f.bankGroups.push({ id: 'cast', name: 'Night crew', memberIds: ['bank-0', 'bank-1'] }); f.render()
    expect([...f.view().querySelectorAll('.lp-social-friends-group')].map(group => group.getAttribute('data-friend-group'))).toEqual(['casts', 'characters', 'bank'])
    const group = f.view().querySelector<HTMLDetailsElement>('[data-friend-group=bank]')!
    expect(group.open).toBe(false); group.querySelector('summary')!.click(); expect(group.open).toBe(true)
    const include = group.querySelector<HTMLInputElement>('input')!; include.checked = true; include.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }))
    f.ui.pending = 'save'; f.render(); expect(f.view().querySelector<HTMLDetailsElement>('[data-friend-group=bank]')!.open).toBe(true)
    f.ui.pending = undefined; f.render(); f.byName('Add portable cast Night crew').click()
    expect(f.requests.at(-1).friendEntryIds).toEqual(['bank-0', 'bank-1'])
  } finally { f.close() }
})

test('each social profile edits its own username with labelled pending-safe controls and preserved drafts', () => {
  for (const app of SOCIAL_APPS) {
    const f = viewFixture(app, { draft: 'Unfinished post' }, [], true)
    try {
      f.render(); f.byName(`${app === 'twitter' ? 'Twitter' : app === 'instagram' ? 'Instagram' : app === 'tumblr' ? 'Tumblr' : 'Discord'} profile`).click()
      const control = f.byName('Change username'); expect(control.getAttribute('aria-expanded')).toBe('false')
      control.click()
      const form = f.view().querySelector<HTMLFormElement>('.lp-social-username-form')!, field = form.querySelector<HTMLInputElement>('input')!
      expect(form.id).toBe(f.byName('Change username').getAttribute('aria-controls'))
      expect(field.closest('label')?.textContent).toBe('Username')
      expect(f.view().querySelector(`#${field.getAttribute('aria-describedby')}`)?.textContent).toContain('Your username')
      field.value = 'bad username!'; field.dispatchEvent(new f.dom.window.Event('input', { bubbles: true })); expect(f.byName('Save username').disabled).toBe(true)
      const handle = app === 'tumblr' ? 'moon-notes' : app === 'discord' ? 'moon.notes' : 'moon_notes'
      field.value = handle; field.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }))
      f.ui.pending = 'saving'; f.render(); expect(f.byName('Save username').disabled).toBe(true); expect(f.view().querySelector<HTMLInputElement>('[data-social-focus="Username"]')!.value).toBe(handle)
      f.ui.pending = undefined; f.ui.error = 'Try again'; f.render(); f.byName('Save username').click()
      expect(f.requests.at(-1)).toMatchObject({ action: 'profile', app, username: handle })
      mutate(f.state, f.requests.at(-1)); f.ui.usernameEdit = false; f.render()
      expect(f.view().querySelector('.lp-social-profile-handle')?.textContent).toBe(`@${handle}`)
      expect(f.ui.draft).toBe('Unfinished post')
      expect(socialOwner(f.state, 'persona', app).handle).toBe(handle)
      if (app === 'discord') {
        expect(f.view().querySelector<HTMLElement>('.lp-discord-messages')!.hidden).toBe(true)
        f.byName('Back to Discord channels').click(); expect(f.ui.ownOnly).toBe(false)
        expect(f.view().querySelector<HTMLElement>('.lp-discord-messages')!.hidden).toBe(false)
      }
    } finally { f.close() }
  }
})

test('generated Discord member handles are honored and stay attached to their server across reload', async () => {
  const f = serviceFixture()
  await f.world.mutate(context, 'persona', { action: 'server', app: 'discord', name: 'Night owls', channels: ['general'] }, 'server')
  const server = f.state().social!.servers[0]
  await f.world.mutate(context, 'persona', { action: 'profile', app: 'discord', username: 'human.alias' }, 'username')
  const flight = f.world.generateParticipants(context, 'persona', server.id, 'people')
  await f.wait()
  expect(f.pending[0].request.messages[0].content).toContain('creative internet username')
  f.pending[0].finish({ participants: [{ name: 'June', handle: 'moon.dust', bio: 'Night owl' }, { name: 'No handle' }, { name: 'Dane', handle: 'fake.owner' }] })
  await flight
  const people = normalizeSocialState(f.state().social).servers[0].participants!
  expect(people).toHaveLength(2); expect(people[0].handle).toBe('moon.dust'); expect(people[1].handle).not.toBe('no_handle')
  const posts = socialGeneratedPosts(f.state(), 'discord', [{ author: 'June', handle: 'oops.renamed', text: 'Still awake' }], 'persona', server.channels[0].id, now, makeId)
  expect(posts[0].account.id).toBe(people[0].id); expect(posts[0].account.handle).toBe('moon.dust')
})

test('DM inbox suggestions contain followed accounts and selected friends, with no feed-wide stranger list', () => {
  const f = viewFixture('instagram', {}, [{ id:'friend',name:'Selected Friend' },{ id:'other',name:'Unselected Friend' }])
  try {
    f.state.social!.posts.push(...socialGeneratedPosts(f.state,'instagram',[{author:'Mira',text:'A photo',photo:'The beach'},{author:'Fern',text:'A second photo',photo:'A garden'}],'persona',undefined,now,makeId))
    f.ui.dmOpen=true; f.render()
    expect(f.view().querySelectorAll('.lp-instagram-inbox-account')).toHaveLength(0)
    const mira=f.state.social!.posts.find(post=>post.account.name==='Mira')!
    mutate(f.state,{action:'follow',app:'instagram',accountId:mira.account.id})
    mutate(f.state,{action:'settings',app:'instagram',friendEntryIds:['friend','actor:alice']}); f.render()
    expect([...f.view().querySelectorAll('.lp-instagram-inbox-account')].map(node=>node.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Mira'),expect.stringContaining('Selected Friend'),expect.stringContaining('Alice')]))
    expect(f.view().textContent).not.toContain('Unselected Friend'); expect(f.view().querySelectorAll('.lp-instagram-inbox-account')).toHaveLength(3)
    expect([...f.view().querySelectorAll('button')].some(node=>node.getAttribute('aria-label')==='Message Fern')).toBe(false)
  } finally { f.close() }
})

test('Tumblr navigation has a floating composer and a working Explore and Activity/Messages hub', () => {
  const f = viewFixture('tumblr',{},[],true)
  try {
    const own = mutate(f.state,{action:'post',app:'tumblr',text:'A personal harbor note',tags:['harbor']}).posts[0]
    f.state.social!.posts.push(...socialGeneratedPosts(f.state,'tumblr',[{author:'Mira',handle:'mira-notes',text:'A harbor reply',replyTo:own.id,tags:['harbor']},{author:'Fern',handle:'fern-room',text:'Another night in the garden',tags:['garden']}],'persona',undefined,now,makeId))
    f.render()
    expect(f.view().querySelector('nav[aria-label="Tumblr navigation"]')!.querySelectorAll('button')).toHaveLength(4)
    expect(f.view().querySelector('.lp-tumblr-floating-compose')).not.toBeNull(); expect(f.view().querySelector('.lp-social-new-post')).toBeNull()
    f.byName('Search Tumblr posts').click()
    const search=f.view().querySelector<HTMLInputElement>('input[type="search"]')!; expect(search.labels![0].textContent).toContain('Search Tumblr posts')
    search.value='garden'; search.dispatchEvent(new f.dom.window.Event('input',{bubbles:true}))
    expect(f.view().querySelectorAll('.lp-social-post')).toHaveLength(1); expect(f.view().querySelector('.lp-social-post')!.textContent).toContain('garden')
    expect(f.ui.tumblrSearch).toBe('garden'); expect(document.activeElement===search || document.activeElement===document.body).toBe(true)
    search.value=''; search.dispatchEvent(new f.dom.window.Event('input',{bubbles:true}))
    const tile=f.view().querySelector<HTMLButtonElement>('.lp-tumblr-explore-tile')!, tileFocus=tile.dataset.socialFocus
    tile.focus(); tile.click()
    expect(document.activeElement?.getAttribute('data-social-focus')).toBe('App navigation')
    document.activeElement!.dispatchEvent(new f.dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))
    expect(document.activeElement?.getAttribute('data-social-focus')).toBe(tileFocus)
    f.byName('Tumblr activity and messages').click()
    const tabs=f.view().querySelectorAll<HTMLButtonElement>('[role=tab]')
    expect(tabs).toHaveLength(2); expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(f.view().querySelector('.lp-tumblr-activity-row')!.textContent).toContain('Replied to your post')
    tabs[0].dispatchEvent(new f.dom.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}))
    expect(f.ui.tumblrHubTab).toBe('messages'); expect(document.activeElement?.textContent).toBe('Messages')
    const selected=f.view().querySelector('[role=tab][aria-selected=true]')!, panel=f.view().querySelector(`#${selected.getAttribute('aria-controls')}`)!
    expect(panel.getAttribute('role')).toBe('tabpanel'); expect(panel.getAttribute('aria-labelledby')).toBe(selected.id)
    expect(f.view().querySelectorAll('.lp-tumblr-inbox-account')).toHaveLength(0)
    const fern=f.state.social!.posts.find(post=>post.account.name==='Fern')!
    mutate(f.state,{action:'follow',app:'tumblr',accountId:fern.account.id}); f.render(); f.byName('Message Fern').click()
    expect(f.view().querySelector('form[aria-label="Tumblr message composer"]')).not.toBeNull()
    expect(f.view().querySelector('.lp-instagram-dms')).toBeNull()
    f.byName('Back to Tumblr messages').click(); expect(f.view().querySelector('[role=tab][aria-selected=true]')!.textContent).toBe('Messages')
    f.byName('Tumblr home').click(); f.byName('Compose Tumblr post').click(); expect(f.view().dataset.socialView).toBe('compose')
    expect(f.requests).toHaveLength(0)
  } finally { f.close() }
})

test('Discord settings select a server People bank instead of app-wide friends', () => {
  const f=viewFixture('discord',{},[{id:'npc',name:'Moss'}],true)
  try {
    mutate(f.state,{action:'server',app:'discord',name:'Night owls',channels:['general']})
    mutate(f.state,{action:'server',app:'discord',name:'Dawn club',channels:['general']})
    f.ui.settingsOpen=true; f.render()
    expect([...f.view().querySelectorAll('button')].some(node=>node.textContent==='Friends & casts')).toBe(false)
    f.byName('Manage people in Dawn club').click(); expect(f.ui.peopleOpen).toBe(true)
    f.byName('Add people in Dawn club').click(); f.byName('Add Alice from Characters to Dawn club').click()
    const request=f.requests.at(-1); expect(request).toMatchObject({app:'discord',action:'participant',serverId:f.state.social!.servers[1].id,accountId:'alice'})
    mutate(f.state,request); expect(f.state.social!.servers[0].participants || []).toHaveLength(0); expect(f.state.social!.servers[1].participants).toHaveLength(1)
    expect(f.state.social!.preferences?.persona?.apps?.discord?.friendEntryIds || []).toHaveLength(0)
  } finally { f.close() }
})


test('Discord cast imports add missing members atomically to one server and preserve existing people', async () => {
  const f = serviceFixture()
  await f.world.mutate(context,'persona',{action:'server',app:'discord',name:'Night',channels:['general']},'cast-server')
  await f.world.mutate(context,'persona',{action:'server',app:'discord',name:'Dawn',channels:['general']},'cast-other')
  const server=f.state().social!.servers[0], other=f.state().social!.servers[1]
  await f.world.mutate(context,'persona',{action:'participant',app:'discord',serverId:server.id,castId:'night-cast'},'cast-add')
  expect(f.state().social!.servers[0].participants?.map(person=>person.bankId)).toEqual(['fern','mika'])
  await f.world.mutate(context,'persona',{action:'participant',app:'discord',serverId:server.id,castId:'night-cast'},'cast-repeat')
  expect(f.state().social!.servers[0].participants).toHaveLength(2)
  expect(f.state().social!.servers.find(entry=>entry.id===other.id)?.participants || []).toHaveLength(0)
  expect(f.state().contacts).toHaveLength(1)
  for(let i=0;i<37;i++) await f.world.mutate(context,'persona',{action:'participant',app:'discord',serverId:other.id,name:'Existing '+i},'existing-'+i)
  await f.world.mutate(context,'persona',{action:'participant',app:'discord',serverId:other.id,name:'Existing 37'},'existing-37')
  await f.world.mutate(context,'persona',{action:'participant',app:'discord',serverId:other.id,name:'Existing 38'},'existing-38')
  const before=JSON.stringify(f.state().social)
  await expect(f.world.mutate(context,'persona',{action:'participant',app:'discord',serverId:other.id,castId:'night-cast'},'cast-over-capacity')).rejects.toThrow('40')
  expect(JSON.stringify(f.state().social)).toBe(before)
  await expect(f.world.mutate(context,'persona',{action:'participant',app:'discord',serverId:server.id,castId:'missing'},'cast-missing')).rejects.toThrow('portable cast')
})

test('Discord server pictures resolve trusted assets, survive normalization, and cannot update another server', async () => {
  const f=serviceFixture()
  await f.world.mutate(context,'persona',{action:'server',app:'discord',name:'Night',channels:['general'],imageId:'photo',imageUrl:'https://untrusted.invalid'},'picture-create')
  const server=f.state().social!.servers[0]
  expect(server.imageUrl).toBe('/images/photo.png')
  expect(normalizeSocialState(f.state().social).servers[0].imageId).toBe('photo')
  await f.world.mutate(context,'persona',{action:'server',app:'discord',serverId:server.id,imageId:'photo'},'picture-update')
  expect(f.state().social!.servers).toHaveLength(1); expect(f.state().social!.servers[0].name).toBe('Night')
  const before=JSON.stringify(f.state().social)
  await expect(f.world.mutate(context,'persona',{action:'server',app:'discord',serverId:server.id,imageId:'missing'},'picture-bad')).rejects.toThrow('Missing photo')
  expect(JSON.stringify(f.state().social)).toBe(before)
  expect(()=>applySocialMutation(f.state(),'alice',{action:'server',app:'discord',serverId:server.id,imageId:'photo',imageUrl:'/images/photo.png'},now,makeId)).toThrow('your Discord servers')
})

test('Discord People separates members from styled pickers and imports whole casts in one request', () => {
  const bank=[{id:'fern',name:'Fern',role:'Reader'},{id:'mika',name:'Mika',role:'Night owl'}]
  const f=viewFixture('discord',{},bank,true)
  try {
    f.bankGroups.push({id:'cast',name:'Night cast',memberIds:['fern','mika']})
    const server=mutate(f.state,{action:'server',app:'discord',name:'Night',channels:['general']}).servers[0]
    mutate(f.state,{action:'participant',app:'discord',serverId:server.id,name:'Nocturne',bio:'A long bio that starts collapsed.'})
    f.ui.peopleOpen=true;f.ui.serverId=server.id;f.render()
    expect(f.view().querySelector('.lp-discord-person-form')).toBeNull()
    const member=f.view().querySelector<HTMLDetailsElement>('.lp-discord-member-card')!
    expect(member.open).toBe(false); member.querySelector('summary')!.click(); expect(member.open).toBe(true)
    f.byName('Upload server picture for Night').click(); expect(f.photoActions.at(-1)).toEqual(['server-upload',server.id])
    f.byName('Add people in Night').click()
    expect(f.view().querySelector('.lp-discord-people-list')).toBeNull()
    f.byName('Add Night cast cast to Night').click()
    expect(f.requests.at(-1)).toMatchObject({app:'discord',action:'participant',serverId:server.id,castId:'cast'})
    expect(f.requests).toHaveLength(1)
    const groups=[...f.view().querySelectorAll<HTMLDetailsElement>('.lp-discord-picker-group')]
    expect(groups.map(group=>group.querySelector('summary strong')!.textContent)).toEqual(['Portable casts','Characters','NPC Bank','Create a person'])
    groups[1].querySelector('summary')!.click(); f.render()
    expect(f.view().querySelectorAll<HTMLDetailsElement>('.lp-discord-picker-group')[1].open).toBe(true)
    expect([...f.view().querySelectorAll('input,textarea')].every(input=>Boolean(input.closest('label')))).toBe(true)
    f.ui.pending='saving';f.render();expect(f.byName('Add Night cast cast to Night').disabled).toBe(true)
  } finally {f.close()}
})

test('Discord generation rejects app-wide guests outside its selected server bank', () => {
  const state=socialState()
  const night=mutate(state,{action:'server',app:'discord',name:'Night',channels:['general']}).servers[0]
  const dawn=mutate(state,{action:'server',app:'discord',name:'Dawn',channels:['general']}).servers[1]
  mutate(state,{action:'participant',app:'discord',serverId:night.id,name:'Moth'})
  mutate(state,{action:'participant',app:'discord',serverId:dawn.id,accountId:'alice'})
  const guests=[{id:'global',name:'Global Friend',kind:'npc-bank' as const}]
  const posts=socialGeneratedPosts(state,'discord',[{author:'Moth',text:'At night'},{author:'Global Friend',cardId:'global',text:'Not a member'},{author:'Alice',text:'Wrong server'}],'persona',night.channels[0].id,now,makeId,guests)
  expect(posts.map(post=>post.account.name)).toEqual(['Moth'])
  const prompt=JSON.parse(socialGenerationRequest(state,'discord','persona',night.channels[0].id,'',guests).messages[1].content)
  expect(prompt.libraryGuestCards).toEqual([]); expect(prompt.channel.server.participants.map((person:any)=>person.name)).toEqual(['Moth'])
})
