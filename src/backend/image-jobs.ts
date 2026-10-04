import type { DevicePreferences, SwarmVisualProfile } from '../types.js'

export type ImagePurpose = 'scene' | 'contact' | 'character' | 'persona' | 'draft'

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
  if (preferences.manualVisualProfile.loras.length && parameters.loras === undefined) parameters.loras = preferences.manualVisualProfile.loras
  return { prompt: [profile.presets, ...identity, scene].filter(Boolean).join(', '), negativePrompt: profile.negative, parameters }
}

export async function runImageJob(api: Pick<import('lumiverse-spindle-types').SpindleAPI, 'imageGen'>, input: any, signal: AbortSignal, progress: (event: { phase: string; message?: string; imageDataUrl?: string; step?: number; totalSteps?: number }) => void): Promise<any> {
  let canStream = false
  try {
    const connections = await api.imageGen.listConnections(input.userId)
    const connection = input.connection_id ? connections.find(item => item.id === input.connection_id) : connections.find(item => item.is_default) || connections[0]
    if (!input.connection_id && connection) input.connection_id = connection.id
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
