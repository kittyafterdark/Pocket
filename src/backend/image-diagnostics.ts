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

const MAX_LOGS = 40
const logsByUser = new Map<string, PocketImageDiagnosticEntry[]>()

function keyFor(userId?: string): string { return userId || '__default__' }

function cleanString(value: string): string {
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(value)) {
    const head = value.slice(0, value.indexOf(',') + 1)
    return `${head}<${Math.max(0, value.length - head.length)} base64 chars>`
  }
  if (value.length > 24_000) return `${value.slice(0, 24_000)}… <${value.length - 24_000} chars truncated>`
  return value
}

export function sanitizeImageDiagnosticValue(value: unknown, depth = 0, key = ''): unknown {
  if (depth > 8) return '<max depth>'
  if (/(?:authorization|cookie|password|secret|api[_-]?key|access[_-]?token|refresh[_-]?token)/i.test(key)) return '<redacted>'
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'string') return cleanString(value)
  if (Array.isArray(value)) return value.slice(0, 160).map((entry) => sanitizeImageDiagnosticValue(entry, depth + 1))
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>).slice(0, 240)) {
      if (/^(?:data|imageData|imageDataUrl)$/i.test(childKey) && typeof childValue === 'string' && childValue.length > 2_000) {
        result[childKey] = `<image payload: ${childValue.length} chars>`
      } else result[childKey] = sanitizeImageDiagnosticValue(childValue, depth + 1, childKey)
    }
    return result
  }
  return String(value)
}

export function recordImageDiagnostic(userId: string | undefined, entry: Omit<PocketImageDiagnosticEntry, 'id' | 'createdAt'>): PocketImageDiagnosticEntry {
  const next: PocketImageDiagnosticEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
    payload: entry.payload === undefined ? undefined : sanitizeImageDiagnosticValue(entry.payload),
  }
  const key = keyFor(userId)
  const logs = logsByUser.get(key) || []
  logs.unshift(next)
  logsByUser.set(key, logs.slice(0, MAX_LOGS))
  return next
}

export function listImageDiagnostics(userId?: string): PocketImageDiagnosticEntry[] {
  return (logsByUser.get(keyFor(userId)) || []).map((entry) => ({ ...entry, payload: sanitizeImageDiagnosticValue(entry.payload) }))
}

export function clearImageDiagnostics(userId?: string): void { logsByUser.delete(keyFor(userId)) }
