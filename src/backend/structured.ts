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
  const raw = typeof content === 'string' ? content.trim().slice(0, 30_000) : ''
  if (!raw) throw new Error('Generation returned an empty response.')
  const fenced = fencedBody(raw)
  if (fenced !== null) return object(JSON.parse(fenced))
  try { return object(JSON.parse(raw)) }
  catch (directError) {
    const extracted = firstCompleteObject(raw)
    if (extracted) return object(JSON.parse(extracted))
    throw directError
  }
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
): Promise<JsonObject> {
  try { return parseGeneratedObject(content) }
  catch (error) {
    if (!looksTruncated(content)) throw error
    return parseGeneratedObject(await retry())
  }
}
