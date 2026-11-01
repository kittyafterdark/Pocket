import { expect, test } from 'bun:test'
import { hydratePocketImageProjection, projectGeneratedPocketImage } from '../src/backend/image-sources.js'

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
