import { normalizeActorName } from '../domain/actors.js'
import { narrativeExcerpt, sanitizeNarrativeContent } from './narrative-content.js'

export interface NarrativeSource {
  id?: unknown
  revision?: unknown
  role?: unknown
  content?: unknown
}

/** Resolve only exact names or an unambiguous single name token, never a fuzzy identity. */
export function canonicalNarrativeName(candidate: string, knownNames: string[]): string {
  const key = (value: string) => normalizeActorName(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  const normalized = key(candidate)
  const names = [...new Set(knownNames.filter(Boolean))]
  const exact = names.filter(name => key(name) === normalized)
  if (exact.length === 1) return exact[0]
  if (!normalized || normalized.includes(' ')) return candidate
  const matches = names.filter(name => key(name).split(' ').includes(normalized))
  return matches.length === 1 ? matches[0] : candidate
}

/** Hash all visible prose: same-ID edits/swipes can change the ending without changing the opening. */
export function narrativeSourceFingerprint(messages: NarrativeSource[]): string {
  const serialized = JSON.stringify(messages.map((message, index) => [
    message.id || index, message.revision || '', message.role,
    sanitizeNarrativeContent(message.content, Number.MAX_SAFE_INTEGER),
  ]))
  let hash = 0x811c9dc5
  for (let index = 0; index < serialized.length; index++) {
    hash ^= serialized.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `retrieval2:${serialized.length}:${hash.toString(36)}`
}

/** Reserve most of the input for the latest turn; its resolution matters more than old setup. */
export function recentNarrativeWindow(messages: NarrativeSource[], count = 4, budget = 10_400): { messages: NarrativeSource[]; text: string } {
  const selected = messages.filter(message => (message.role === 'assistant' || message.role === 'user')
    && sanitizeNarrativeContent(message.content, 1)).slice(-count)
  const parts: string[] = [], included: NarrativeSource[] = []
  let remaining = budget
  for (let index = selected.length - 1; index >= 0; index--) {
    const message = selected[index]
    const label = `${message.role === 'assistant' ? 'ASSISTANT NARRATIVE' : 'USER NARRATIVE'} [${index + 1}${index === selected.length - 1 ? '; LATEST COMMITTED TURN' : ''}]: `
    const available = Math.min(index === selected.length - 1 ? 6_000 : 2_000, remaining - label.length)
    if (available < 80) break
    const part = label + narrativeExcerpt(message.content, available)
    parts.unshift(part); included.unshift(message); remaining -= part.length + 2
  }
  return { messages: included, text: parts.join('\n\n') }
}
