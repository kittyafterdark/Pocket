import { expect, test } from 'bun:test'
import { effectiveImageRequest, runImageJob, studioLoras } from '../src/backend/image-jobs.js'
import { defaultPreferences } from '../src/domain/preferences.js'
import type { SwarmVisualProfile } from '../src/types.js'
import { avatarCropRect } from '../src/frontend/components/avatar-crop.js'

test('accepted avatar matches cover framing on portrait and landscape images', () => {
  expect(avatarCropRect(800, 1200, { x: 50, y: 80 })).toEqual({ x: 0, y: 320, size: 800 })
  expect(avatarCropRect(1200, 800, { x: 25, y: 80 })).toEqual({ x: 100, y: 0, size: 800 })
  expect(avatarCropRect(800, 800, { x: 10, y: 90 })).toEqual({ x: 0, y: 0, size: 800 })
  expect(() => avatarCropRect(0, 800, { x: 50, y: 50 })).toThrow()
})

test('Studio paths, repeated layers and strengths survive native stack assembly', () => {
  const directives = '<lora:styles/ink.safetensors:0.75>, <lora:styles/ink.safetensors:0.2>'
  expect(studioLoras(directives).map(layer => layer.weight_model)).toEqual([.75, .2])
  const prefs = defaultPreferences()
  prefs.manualVisualProfile.loras = [{ name: 'detail.safetensors', weight: .4 }]
  const effective = effectiveImageRequest('Portrait', 'contact', 'red hair', '1:1', { loras: directives } as SwarmVisualProfile, prefs)
  expect((effective.parameters.loras as any[]).map(layer => layer.lora_name)).toEqual(['styles/ink.safetensors', 'styles/ink.safetensors', 'detail.safetensors'])
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
  const result = await runImageJob(api, { prompt: 'headshot', parameters: { width: 1024, loras: studioLoras('<lora:a:0.5>') }, userId: 'fixture-user' }, controller.signal, () => {}, { chatId: 'fixture-chat', requestId: 'fixture-job', purpose: 'contact' })
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
  await runImageJob(api, { parameters: { loras: studioLoras('<lora:styles/a:0.75>') } }, new AbortController().signal, () => {})
  expect(request.parameters).toMatchObject({ loras: 'styles/a', loraweights: '0.75', loratencweights: '0.75' })
})
