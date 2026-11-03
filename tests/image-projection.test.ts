import { expect, test } from 'bun:test'
import { hydratePocketImageProjection, projectGeneratedPocketImage, resolvePocketImageSource } from '../src/backend/image-sources.js'

test('display projection rehydrates messages, Lumistry photos and missing social image URLs once per Gallery ID', async () => {
  const state: any = {
    conversations: [{ messages: [{ imageId: 'shared', imageUrl: undefined }, { imageId: 'message-only' }] }],
    lumistry: { owner: { self: { photos: [{ source: { kind: 'gallery', imageId: 'shared' }, url: '' }] }, profiles: [{ photos: [{ source: { kind: 'gallery', imageId: 'dating-only' }, url: '' }] }] } },
    social: {
      posts: [{ imageId: 'shared' }, { imageId: 'kept', imageUrl: '/already-renderable' }],
      servers: [{ imageId: 'server-only', imageUrl: '' }],
    },
  }
  const calls: string[] = []
  await hydratePocketImageProjection(state, async imageId => { calls.push(imageId); return `/gallery/${imageId}` })

  expect(state.conversations[0].messages[0].imageUrl).toBe('/gallery/shared')
  expect(state.conversations[0].messages[1].imageUrl).toBe('/gallery/message-only')
  expect(state.lumistry.owner.self.photos[0].url).toBe('/gallery/shared')
  expect(state.lumistry.owner.profiles[0].photos[0].url).toBe('/gallery/dating-only')
  expect(state.social.posts[0].imageUrl).toBe('/gallery/shared')
  expect(state.social.posts[1].imageUrl).toBe('/already-renderable')
  expect(state.social.servers[0].imageUrl).toBe('/gallery/server-only')
  expect(calls.filter(id => id === 'shared')).toHaveLength(1)
})

test('native image completion accepts mediaUrl and can recover a missing URL from the durable Gallery ID', async () => {
  const modern = await projectGeneratedPocketImage({ imageId: 'native-1', mediaUrl: '/media/native-1' }, async () => undefined)
  expect(modern).toEqual({ imageId: 'native-1', imageUrl: '/media/native-1' })

  let recovered = ''
  const legacy = await projectGeneratedPocketImage({ imageId: 'native-2', imageUrl: '' }, async imageId => { recovered = imageId; return '/gallery/native-2' })
  expect(recovered).toBe('native-2')
  expect(legacy).toEqual({ imageId: 'native-2', imageUrl: '/gallery/native-2' })
})

test('projection tolerates stale or missing Gallery records without losing durable IDs', async () => {
  const state: any = { conversations: [{ messages: [{ imageId: 'missing', imageUrl: '/stale' }] }], lumistry: { owner: { self: { photos: [{ source: { kind: 'gallery', imageId: 'missing' }, url: '/stale' }] }, profiles: [] } } }
  await hydratePocketImageProjection(state, async () => undefined)
  expect(state.conversations[0].messages[0].imageId).toBe('missing')
  expect(state.conversations[0].messages[0].imageUrl).toBeUndefined()
  expect(state.lumistry.owner.self.photos[0].source.imageId).toBe('missing')
  expect(state.lumistry.owner.self.photos[0].url).toBe('')
})


test('large image projections use a bounded set of workers and finish after a missing image', async () => {
  const state: any = { conversations: [{ messages: Array.from({ length: 512 }, (_, i) => ({ imageId: 'image-' + i })) }] }
  let release!: () => void, ready!: () => void, active = 0, maximum = 0, calls = 0
  const gate = new Promise<void>(resolve => { release = resolve }), started = new Promise<void>(resolve => { ready = resolve })
  const hydration = hydratePocketImageProjection(state, async id => {
    calls++; active++; maximum = Math.max(maximum, active); ready()
    try { await gate; if (id === 'image-5') throw new Error('missing image'); return '/gallery/' + id }
    finally { active-- }
  })
  try {
    await started
    for (let i = 0; i < 20; i++) await Promise.resolve()
    expect(maximum).toBe(4)
  } finally { release(); await hydration }
  expect(calls).toBe(512)
  expect(maximum).toBe(4)
  expect(state.conversations[0].messages[5].imageUrl).toBeUndefined()
  expect(state.conversations[0].messages[511].imageUrl).toBe('/gallery/image-511')
})

test('simultaneous image consumers share the lookup budget', async () => {
  let release!: () => void, ready!: () => void, active = 0, maximum = 0
  const gate = new Promise<void>(resolve => { release = resolve }), started = new Promise<void>(resolve => { ready = resolve })
  const api: any = {
    permissions: { has: () => true },
    images: { async get(id: string) { active++; maximum = Math.max(maximum, active); ready(); await gate; active--; return { mime_type: 'image/png', url: '/gallery/' + id } } },
  }
  const lookups = Promise.all(Array.from({ length: 40 }, (_, i) => resolvePocketImageSource(api, { kind: 'gallery', imageId: 'shared-' + i })))
  try {
    await started
    for (let i = 0; i < 20; i++) await Promise.resolve()
    expect(maximum).toBe(4)
  } finally { release() }
  const results = await lookups
  expect(results.every(image => image.status === 'ready')).toBe(true)
  expect(maximum).toBe(4)
})
