import { localUuid } from '../domain/uuid.js'
export type PocketImageDiagnosticStatus = 'info' | 'ok' | 'error'

export interface PocketImageDiagnosticEntry {
  id: string
  createdAt: string
  requestId: string
  source: string
  stage: string
  status: PocketImageDiagnosticStatus
  message: string
  payload?: unknown
}

const MAX_USER_LOGS = 40
const MAX_TOTAL_LOGS = 160
const MAX_PAYLOAD_CHARS = 24_000
const MAX_PAYLOAD_NODES = 500
const logs = new Map<string, { user: string; entry: PocketImageDiagnosticEntry }>()

function keyFor(userId?: string): string { return userId || '__default__' }

function cleanString(value: string, limit: number): string {
  if (!limit) return ''
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(value.slice(0, 128))) {
    const payloadStart = value.indexOf(',') + 1
    return `${value.slice(0, Math.min(payloadStart, 100))}<${value.length - payloadStart} base64 chars>`.slice(0, limit)
  }
  if (value.length > limit) {
    const preview = `${value.slice(0, Math.max(0, limit - 32))}… <truncated>`.slice(0, limit)
    // A substring may keep the entire original provider response alive.
    return JSON.parse(JSON.stringify(preview))
  }
  return value
}

export function sanitizeImageDiagnosticValue(value: unknown): unknown {
  return sanitize(value, { chars: MAX_PAYLOAD_CHARS, nodes: MAX_PAYLOAD_NODES })
}

function sanitize(value: unknown, budget: { chars: number; nodes: number }, depth = 0, key = ''): unknown {
  budget.nodes--
  if (depth > 8) return '<max depth>'
  if (/(?:authorization|cookie|password|secret|api[_-]?key|access[_-]?token|refresh[_-]?token)/i.test(key)) return '<redacted>'
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const result = cleanString(value, budget.chars)
    budget.chars -= result.length
    return result
  }
  if (Array.isArray(value)) {
    const result: unknown[] = []
    for (let index = 0; index < Math.min(value.length, 160); index++) {
      if (budget.chars <= 0 || budget.nodes <= 0) { result.push('<payload truncated>'); break }
      result.push(sanitize(value[index], budget, depth + 1))
    }
    return result
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = Object.create(null)
    let count = 0
    for (const childKey in value) {
      if (!Object.hasOwn(value, childKey)) continue
      if (++count > 240 || budget.chars <= 0 || budget.nodes <= 0) { result['<payload truncated>'] = true; break }
      const label = cleanString(childKey, Math.min(200, budget.chars))
      const childValue = (value as Record<string, unknown>)[childKey]
      budget.chars -= label.length
      if (/^(?:data|imageData|imageDataUrl)$/i.test(childKey) && typeof childValue === 'string' && childValue.length > 2_000) {
        result[label] = `<image payload: ${childValue.length} chars>`
        budget.nodes--
      } else result[label] = sanitize(childValue, budget, depth + 1, childKey)
    }
    return result
  }
  return sanitize(String(value), budget, depth, key)
}

export function recordImageDiagnostic(userId: string | undefined, entry: Omit<PocketImageDiagnosticEntry, 'id' | 'createdAt'>): PocketImageDiagnosticEntry {
  const next: PocketImageDiagnosticEntry = {
    id: localUuid(),
    createdAt: new Date().toISOString(),
    ...entry,
    requestId: cleanString(entry.requestId, 200),
    source: cleanString(entry.source, 200),
    stage: cleanString(entry.stage, 200),
    message: cleanString(entry.message, 2_000),
    payload: entry.payload === undefined ? undefined : sanitizeImageDiagnosticValue(entry.payload),
  }
  const user = keyFor(userId)
  let oldestForUser: string | undefined
  let count = 0
  for (const [id, log] of logs) {
    if (log.user !== user) continue
    oldestForUser ??= id
    count++
  }
  if (oldestForUser && count >= MAX_USER_LOGS) logs.delete(oldestForUser)
  if (logs.size >= MAX_TOTAL_LOGS) {
    const oldest = logs.keys().next().value
    if (oldest) logs.delete(oldest)
  }
  logs.set(next.id, { user, entry: next })
  return next
}

export function listImageDiagnostics(userId?: string): PocketImageDiagnosticEntry[] {
  const user = keyFor(userId)
  return Array.from(logs.values()).filter(log => log.user === user).reverse().map(log => structuredClone(log.entry))
}

export function clearImageDiagnostics(userId?: string): void {
  const user = keyFor(userId)
  for (const [id, log] of logs) if (log.user === user) logs.delete(id)
}
