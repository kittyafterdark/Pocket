import type { DevicePreferences, SwarmVisualProfile } from '../types.js'

export type ImagePurpose = 'scene' | 'contact' | 'character' | 'persona' | 'draft'

/** Studio publishes exact native directives; preserve paths, order and repeated layers. */
export function studioLoras(value: string): import('lumiverse-spindle-types').ImageGenLoraEntryDTO[] {
  return [...value.matchAll(/<lora:([^<>]+):(-?\d+(?:\.\d+)?)>/g)].flatMap(match => {
    const weight = Number(match[2])
    return Number.isFinite(weight) ? [{ lora_name: match[1].trim(), weight_model: weight, weight_clip: weight }] : []
  })
}

export function aspectDimensions(value: unknown): { width: number; height: number } | null {
  const match = String(value || '').trim().match(/^(\d+(?:\.\d+)?)\s*[:/x×]\s*(\d+(?:\.\d+)?)$/i)
  if (!match) return null
  const ratio = Number(match[1]) / Number(match[2])
  if (!Number.isFinite(ratio) || ratio < .25 || ratio > 4) return null
  return ratio <= 1 ? { width: Math.max(256, Math.round(1024 * ratio / 64) * 64), height: 1024 } : { width: 1024, height: Math.max(256, Math.round(1024 / ratio / 64) * 64) }
}

export function effectiveImageRequest(scene: string, purpose: ImagePurpose, subject: string, aspect: string, profile: SwarmVisualProfile, preferences: DevicePreferences, overrides: Record<string, unknown> = {}) {
  const identity = purpose === 'scene' ? [profile.characterPositive, profile.personaPositive] : purpose === 'character' ? [profile.characterPositive] : purpose === 'persona' ? [profile.personaPositive] : [`Single-subject contact portrait. ${subject}`]
  const dimensions = aspectDimensions(aspect || ((purpose === 'contact' || purpose === 'draft') ? '1:1' : profile.aspect))
  const parameters: Record<string, unknown> = { ...(dimensions || {}), ...preferences.manualVisualProfile.parameters, ...overrides }
  // An explicit aspect is a user choice and takes precedence over saved dimensions.
  if (aspect && dimensions) Object.assign(parameters, dimensions)
  const layers = [...studioLoras(profile.loras || ''), ...preferences.manualVisualProfile.loras.map(layer => ({ lora_name: layer.name, weight_model: layer.weight, weight_clip: layer.weight }))]
  if (layers.length && parameters.loras === undefined) parameters.loras = layers
  return { prompt: [profile.presets, ...identity, scene].filter(Boolean).join(', '), negativePrompt: profile.negative, parameters }
}

export async function runImageJob(api: Pick<import('lumiverse-spindle-types').SpindleAPI, 'imageGen'>, input: any, signal: AbortSignal, progress: (event: { phase: string; message?: string; imageDataUrl?: string; step?: number; totalSteps?: number }) => void, native?: { chatId: string; requestId: string; purpose: ImagePurpose }): Promise<any> {
  if (signal.aborted) return null
  if (native && typeof api.imageGen.generateNative === 'function') {
    const host = api.imageGen as typeof api.imageGen & { cancelNative?: (jobId: string, userId?: string) => Promise<boolean> }
    const cancel = () => { void host.cancelNative?.(native.requestId, input.userId).catch(() => {}) }
    signal.addEventListener('abort', cancel, { once: true })
    const loras = input.parameters?.loras
    const parameters = { ...input.parameters }
    if (Array.isArray(loras)) delete parameters.loras
    progress({ phase: 'generating', message: 'Developing with Lumiverse image settings…' })
    try {
      const result = await host.generateNative({ chat_id: native.chatId, clientJobId: native.requestId, prompt: input.prompt, negativePrompt: input.negativePrompt, promptMode: 'custom', skipParse: true, forceGeneration: true, parameters, extraLoras: Array.isArray(loras) ? loras : [], characterLora: native.purpose === 'scene' || native.purpose === 'character' ? { source: 'chat' } : { source: 'none' }, includeDataUrl: false, userId: input.userId })
      if (signal.aborted) return null
      if (!result.generated) throw new Error(result.reason || 'Lumiverse did not generate an image. Check native image settings.')
      return result
    } finally { signal.removeEventListener('abort', cancel) }
  }
  let canStream = false
  try {
    const connections = await api.imageGen.listConnections(input.userId)
    const connection = input.connection_id ? connections.find(item => item.id === input.connection_id) : connections.find(item => item.is_default) || connections[0]
    if (!input.connection_id && connection) input.connection_id = connection.id
    if (connection?.provider === 'swarmui' && Array.isArray(input.parameters?.loras)) {
      const layers = input.parameters.loras
      input.parameters = { ...input.parameters, loras: layers.map((layer: any) => layer.lora_name).join(','), loraweights: layers.map((layer: any) => layer.weight_model).join(','), loratencweights: layers.map((layer: any) => layer.weight_clip ?? layer.weight_model).join(',') }
    }
    const providers = await api.imageGen.getProviders(input.userId)
    canStream = Boolean(providers.find(item => item.id === connection?.provider)?.capabilities.websocketPreviewStreaming)
  } catch { /* Providers without discovery can still generate. */ }
  if (signal.aborted) return null
  if (!canStream) { progress({ phase: 'generating', message: 'Developing the image…' }); return api.imageGen.generate(input) }
  let result: any = null
  for await (const event of api.imageGen.generateStream({ ...input, signal })) {
    if (signal.aborted) return null
    if (event.type === 'status') progress({ phase: 'generating', message: 'Developing the image…', step: event.step, totalSteps: event.totalSteps })
    else if (event.type === 'preview') progress({ phase: 'preview', imageDataUrl: event.imageDataUrl, step: event.step, totalSteps: event.totalSteps })
    else if (event.type === 'done') result = event.result
  }
  return result
}
