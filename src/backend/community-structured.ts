import type { DiscoveryDiagnostic } from '../domain/lumistry-diagnostics.js';
type JsonObject = Record<string, unknown>

function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Generation returned an invalid JSON object.')
  return value as JsonObject
}

function fencedBody(value: string): string | null {
  const match = value.match(/^```(?:json)?[\t ]*\r?\n([\s\S]*?)\r?\n```$/i)
  return match ? match[1].trim() : null
}

function firstCompleteObject(value: string): string | null {
  const start = value.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let quoted = false
  let escaped = false
  for (let index = start; index < value.length; index += 1) {
    const char = value[index]
    if (quoted) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') quoted = false
      continue
    }
    if (char === '"') quoted = true
    else if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return value.slice(start, index + 1)
    }
  }
  return null
}

/** Accept clean JSON, a single JSON fence, or one safely balanced top-level object. */
export function parseGeneratedObject(content: unknown): JsonObject {
  const raw = typeof content === 'string' ? content.trim() : ''
  if (!raw) throw new Error('Generation returned an empty response.')
  if (raw.length > 256_000) throw new Error('Generation exceeded the structured response size limit.')
  const fenced = fencedBody(raw)
  if (fenced !== null) return object(JSON.parse(fenced))
  let parsed: unknown
  try { parsed = JSON.parse(raw) }
  catch (directError) {
    const extracted = firstCompleteObject(raw)
    if (extracted) return object(JSON.parse(extracted))
    throw directError
  }
  return object(parsed)
}

/** A retry is reserved for a response which appears cut off, never merely malformed. */
export function looksTruncated(content: unknown): boolean {
  const raw = typeof content === 'string' ? content.trim() : ''
  if (!raw) return true
  if (raw.startsWith('```') && !raw.endsWith('```')) return true
  let braces = 0
  let quoted = false
  let escaped = false
  for (const char of raw) {
    if (quoted) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') quoted = false
      continue
    }
    if (char === '"') quoted = true
    else if (char === '{') braces += 1
    else if (char === '}') braces -= 1
  }
  return quoted || braces > 0
}

export async function parseWithTruncationRetry(
  content: unknown,
  retry: () => Promise<unknown>,
  automaticRetry = true,
): Promise<JsonObject> {
  try { return parseGeneratedObject(content) }
  catch (error) {
    if (!automaticRetry || !looksTruncated(content)) throw error
    return parseGeneratedObject(await retry())
  }
}

export class StructuredOutputError extends Error {
  constructor(public readonly kind: 'empty' | 'truncated' | 'invalid', message: string, public readonly details?: { answerBytes?: number; finishReason?: string; maxTokens?: number; jsonIssue?: string; diagnostic?:DiscoveryDiagnostic; code?:string }) { super(message); this.name = 'StructuredOutputError' }
}
export function expandedStructuredBudget(current: number): number {
  const initial = Number.isFinite(current) && current > 0 ? Math.ceil(current) : 400
  return Math.max(initial, Math.min(16384, Math.max(512, Math.ceil(initial * 1.6))))
}
/** One retry owner for every JSON task; empty-output retries cannot nest inside parser retries. */
export async function runStructuredResponse(
  generate: (budget: number, retry: boolean) => Promise<{ content?: unknown; finish_reason?: string }>,
  initialBudget: number,
  automaticRetry: boolean,
  onRetry?: () => void,
  policy: { retryEmpty?: boolean } = {},
): Promise<JsonObject> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: { content?: unknown; finish_reason?: string } | undefined
    try {
      response = await generate(attempt ? expandedStructuredBudget(initialBudget) : initialBudget, attempt > 0)
      try { return parseGeneratedObject(response.content) }
      catch {
        throw new StructuredOutputError(response.finish_reason === 'length' || looksTruncated(response.content) ? 'truncated' : 'invalid', response.finish_reason === 'length' || looksTruncated(response.content)
          ? 'The model response ended before completing its JSON. Retry with more output room or a lower reasoning setting.'
          : 'The model returned invalid JSON. No generated result was applied; retry the request.',
          { answerBytes: typeof response.content === 'string' ? new TextEncoder().encode(response.content).length : 0, finishReason: response.finish_reason })
      }
    } catch (error) {
      if(!automaticRetry||attempt||error instanceof StructuredOutputError&&['reasoning-exhausted','refused'].includes(error.details?.code||'')||!(error instanceof StructuredOutputError) || error.kind !== 'truncated' || policy.retryEmpty === false && error.details?.answerBytes === 0) throw error
      onRetry?.()
    }
  }
  throw new Error('Structured generation stopped.')
}

/** Required envelopes only. Domain consumers still enforce evidence, actors, consent and field limits. */
export function validateStructuredTask(task: string, value: JsonObject): JsonObject {
  const record = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)
  const arrays: Record<string, string> = { 'group-reply': 'messages', 'scene-sync': 'contacts', 'weather-week': 'days', 'timeline-review': 'events', 'lumistry-events': 'events', 'lumistry-discover': 'profiles' }
  let valid = !arrays[task] || Array.isArray(value[arrays[task]])
  if (task === 'reply-decision') valid = ['reply', 'none', 'pause', 'handoff', 'arrival_handoff'].includes(String(value.action)) || typeof value.reply === 'boolean'
  if (task === 'ambient-decision') valid = value.action === 'none' || value.action === 'message'
  if (task === 'tracker-judge') valid = record(value.answers)
  if (task === 'continuity-seed') valid = record(value.world) && Array.isArray(value.facts) && Array.isArray(value.actors)
  if (task === 'post-turn-audit') valid = record(value.clock) && Array.isArray(value.phoneMessages)
  if (task === 'lumistry-world') valid = Array.isArray(value.proposals) || typeof value.worldContext === 'string' && Array.isArray(value.worldFields)
  if (task === 'message-reply' || task === 'message-retry') valid = typeof value.message === 'string' || record(value.photo)
  if (!valid) throw new StructuredOutputError('invalid', `The model returned an incomplete ${task} response. No generated result was applied; retry the request.`)
  return value
}
