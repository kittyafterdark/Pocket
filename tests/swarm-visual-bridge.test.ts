import { expect, test } from 'bun:test'
import { parseStudioVisualBridgeResponse, resolveStudioVisualBridge, studioVisualBridgeMacro, studioVisualBridgeWireRequest } from '../src/backend/swarm-visual-bridge.js'

test('Studio visual bridge sends fresh scoped scene and accepts the authoritative generation request', async () => {
  let seenTemplate = '', seenScope: any
  const result = await resolveStudioVisualBridge(async (template, scope) => {
    seenTemplate = template; seenScope = scope
    const encoded = /^\{\{swarm_visual_request::([^{}]+)\}\}$/.exec(template)?.[1]
    const request = JSON.parse(decodeURIComponent(encoded || ''))
    expect(request).toEqual({ chatId: 'chat-a', characterId: 'char-a', scene: 'fresh scene', purpose: 'scene' })
    return { text: encodeURIComponent(JSON.stringify({ version: 1, chatId: 'chat-a', characterId: 'char-a', prompt: 'studio prompt', negativePrompt: 'studio negative', connectionId: 'swarm-connection', model: 'studio-checkpoint', parameters: { loras: ['studio.safetensors'], loraWeights: [.6], steps: 28 } })) }
  }, { chatId: 'chat-a', characterId: 'char-a', scene: 'fresh scene', purpose: 'message' }, 'user-a')
  expect(seenTemplate).toBe(studioVisualBridgeMacro({ chatId: 'chat-a', characterId: 'char-a', scene: 'fresh scene', purpose: 'message' }))
  expect(seenScope).toEqual({ chatId: 'chat-a', characterId: 'char-a', userId: 'user-a', commit: false })
  expect(result).toMatchObject({ connectionId: 'swarm-connection', model: 'studio-checkpoint', parameters: { loras: ['studio.safetensors'], loraWeights: [.6], steps: 28 } })
})

test('Studio visual bridge fails closed on unresolved, mismatched, or future responses', () => {
  const expected = { chatId: 'chat-a', characterId: 'char-a' }
  expect(() => parseStudioVisualBridgeResponse('{{swarm_visual_request::still-here}}', expected)).toThrow(/Macro Interceptor/i)
  expect(() => parseStudioVisualBridgeResponse(encodeURIComponent(JSON.stringify({ version: 2, chatId: 'chat-a', characterId: 'char-a', prompt: 'x', connectionId: 'c' })), expected)).toThrow(/not supported/i)
  expect(() => parseStudioVisualBridgeResponse(encodeURIComponent(JSON.stringify({ version: 1, chatId: 'other', characterId: 'char-a', prompt: 'x', connectionId: 'c' })), expected)).toThrow(/different chat or character/i)
})


test('Pocket-only image purposes translate to Studio semantics without leaking the active RP character into contacts', () => {
  expect(studioVisualBridgeWireRequest({ chatId: 'chat-a', characterId: 'char-a', scene: 'controller selfie', purpose: 'message', includeCharacterPositive: true })).toEqual({ chatId: 'chat-a', characterId: 'char-a', scene: 'controller selfie', purpose: 'scene', includeCharacterPositive: true })
  expect(studioVisualBridgeWireRequest({ chatId: 'chat-a', characterId: 'char-a', scene: 'at the cafe', purpose: 'contact', subject: 'short red hair, green eyes' })).toEqual({ chatId: 'chat-a', characterId: 'char-a', scene: 'Single-subject contact portrait. short red hair, green eyes\nat the cafe', purpose: 'draft' })
})
