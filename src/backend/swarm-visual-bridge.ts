export type StudioVisualPurpose = 'scene' | 'character' | 'persona' | 'draft'

export interface StudioVisualBridgeRequest {
  chatId: string
  characterId: string
  scene: string
  purpose: StudioVisualPurpose | 'contact' | 'message'
  subject?: string
  /** Per-request Pocket override; does not mutate Studio's saved tag-automation preference. */
  includeCharacterPositive?: boolean
}

interface StudioVisualBridgeWireRequest {
  chatId: string
  characterId: string
  scene: string
  purpose: StudioVisualPurpose
  includeCharacterPositive?: boolean
}

export interface StudioVisualBridgeResult {
  version: 1
  chatId: string
  characterId: string
  prompt: string
  negativePrompt: string
  connectionId: string
  model: string
  parameters: Record<string, unknown>
}

type MacroResolver = (template: string, scope: { chatId: string; characterId: string; userId?: string; commit: false }) => Promise<{ text?: unknown }>

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function string(value: unknown, max = 12_000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

const unavailable = () => new Error('Swarm Studio visual bridge did not resolve. Grant Swarm Studio the Macro Interceptor permission, then reload Studio; otherwise disable Sync active profile.')

export function studioVisualBridgeWireRequest(request: StudioVisualBridgeRequest): StudioVisualBridgeWireRequest {
  const purpose: StudioVisualPurpose = request.purpose === 'message' ? 'scene' : request.purpose === 'contact' ? 'draft' : request.purpose
  const subject = request.purpose === 'contact' ? string(request.subject, 2_000) : ''
  const scene = subject ? `Single-subject contact portrait. ${subject}\n${request.scene}` : request.scene
  return {
    chatId: request.chatId, characterId: request.characterId, scene, purpose,
    ...(typeof request.includeCharacterPositive === 'boolean' ? { includeCharacterPositive: request.includeCharacterPositive } : {}),
  }
}

export function studioVisualBridgeMacro(request: StudioVisualBridgeRequest): string {
  return `{{swarm_visual_request::${encodeURIComponent(JSON.stringify(studioVisualBridgeWireRequest(request)))}}}`
}

export function parseStudioVisualBridgeResponse(raw: unknown, expected: Pick<StudioVisualBridgeRequest, 'chatId' | 'characterId'>): StudioVisualBridgeResult {
  const encoded = string(raw, 200_000)
  if (!encoded || encoded.includes('{{swarm_visual_request::')) throw unavailable()
  let decoded = ''
  try { decoded = decodeURIComponent(encoded) } catch { throw unavailable() }
  let parsed: Record<string, unknown>
  try { parsed = record(JSON.parse(decoded)) } catch { throw unavailable() }
  if (Number(parsed.version) !== 1) throw new Error(`Swarm Studio visual bridge version ${String(parsed.version || 'unknown')} is not supported. Update Pocket or Swarm Studio.`)
  const chatId = string(parsed.chatId, 180), characterId = string(parsed.characterId, 180)
  if (chatId !== expected.chatId || characterId !== expected.characterId) throw new Error('Swarm Studio visual bridge returned a different chat or character. Refresh the profile and try again.')
  const prompt = string(parsed.prompt), connectionId = string(parsed.connectionId, 300)
  if (!prompt || !connectionId) throw unavailable()
  return {
    version: 1, chatId, characterId, prompt,
    negativePrompt: string(parsed.negativePrompt),
    connectionId, model: string(parsed.model, 500),
    parameters: record(parsed.parameters),
  }
}

export async function resolveStudioVisualBridge(resolve: MacroResolver, request: StudioVisualBridgeRequest, userId?: string): Promise<StudioVisualBridgeResult> {
  const template = studioVisualBridgeMacro(request)
  const result = await resolve(template, { chatId: request.chatId, characterId: request.characterId, userId, commit: false })
  return parseStudioVisualBridgeResponse(result?.text, request)
}
