import { expect, test } from 'bun:test'
import { effectiveImageRequest, runImageJob } from '../src/backend/image-jobs.js'
import { defaultPreferences } from '../src/domain/preferences.js'
import type { SwarmVisualProfile } from '../src/types.js'
import { avatarCropRect } from '../src/frontend/components/avatar-crop.js'

test('accepted avatar matches cover framing on portrait and landscape images', () => {
  expect(avatarCropRect(800, 1200, { x: 50, y: 80 })).toEqual({ x: 0, y: 320, size: 800 })
  expect(avatarCropRect(1200, 800, { x: 25, y: 80 })).toEqual({ x: 100, y: 0, size: 800 })
  expect(avatarCropRect(800, 800, { x: 10, y: 90 })).toEqual({ x: 0, y: 0, size: 800 })
  expect(() => avatarCropRect(0, 800, { x: 50, y: 50 })).toThrow()
})

test('manual image assembly stays isolated from Studio diagnostic LoRA macros', () => {
  const prefs = defaultPreferences()
  prefs.manualVisualProfile.loras = [{ name: 'detail.safetensors', weight: .4 }]
  const effective = effectiveImageRequest('Portrait', 'contact', 'red hair', '1:1', { source: 'swarm_studio', loras: '<lora:studio-only:0.9>' } as SwarmVisualProfile, prefs)
  expect((effective.parameters.loras as any[]).map(layer => layer.lora_name)).toEqual(['detail.safetensors'])
})

test('native job inherits presets, excludes chat identity from contact portraits and cancels by job id', async () => {
  const controller = new AbortController()
  let request: any
  let cancelled: any
  const api: any = { imageGen: {
    generateNative: async (input: any) => { request = input; controller.abort(); return { generated: true, imageId: 'late' } },
    cancelNative: async (...args: any[]) => { cancelled = args; return true },
    generate: () => { throw new Error('Native must not fall back after starting') },
  } }
  const result = await runImageJob(api, { prompt: 'headshot', parameters: { width: 1024, loras: [{ lora_name: 'a', weight_model: .5, weight_clip: .5 }] }, userId: 'fixture-user' }, controller.signal, () => {}, { chatId: 'fixture-chat', requestId: 'fixture-job', purpose: 'contact' })
  expect(request.characterLora).toEqual({ source: 'none' })
  expect(request.bypassActiveLoraPreset).toBeUndefined()
  expect(request.extraLoras[0].lora_name).toBe('a')
  expect(request.parameters.loras).toBeUndefined()
  expect(cancelled).toEqual(['fixture-job', 'fixture-user'])
  expect(result).toBeNull()
})

test('direct Swarm override uses provider list parameters and streaming remains available', async () => {
  let request: any
  const api: any = { imageGen: {
    listConnections: async () => [{ id: 'swarm', provider: 'swarmui' }], getProviders: async () => [],
    generate: async (input: any) => { request = input; return { imageId: 'photo' } },
  } }
  await runImageJob(api, { parameters: { loras: [{ lora_name: 'styles/a', weight_model: .75, weight_clip: .75 }] } }, new AbortController().signal, () => {})
  expect(request.parameters).toMatchObject({ loras: 'styles/a', loraweights: '0.75', loratencweights: '0.75' })
})


test('direct Studio bridge Swarm parameters keep native string LoRA arrays intact', async () => {
  let request: any
  const api: any = { imageGen: {
    listConnections: async () => [{ id: 'swarm', provider: 'swarmui' }], getProviders: async () => [],
    generate: async (input: any) => { request = input; return { imageId: 'photo' } },
  } }
  await runImageJob(api, { connection_id: 'swarm', parameters: { loras: ['styles/a.safetensors'], loraWeights: [.75], loratencweights: [.75] } }, new AbortController().signal, () => {})
  expect(request.parameters).toMatchObject({ loras: ['styles/a.safetensors'], loraWeights: [.75], loratencweights: [.75] })
})
