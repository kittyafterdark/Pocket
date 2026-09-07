import type { PocketActorMemoryEntry } from '../types.js'

const MAX_ACTOR_MEMORIES = 160

function clean(value: unknown, max = 4_000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringList(value: unknown, max = 24): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((entry) => clean(entry, 180)).filter(Boolean))].slice(0, max)
}

function nameKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function normalizeActorMemories(value: unknown): PocketActorMemoryEntry[] {
  if (!Array.isArray(value)) return []
  const rows = value.slice(-MAX_ACTOR_MEMORIES).flatMap((item) => {
    if (!record(item)) return []
    const id = clean(item.id, 180)
    const messageId = clean(item.messageId, 180)
    const conversationId = clean(item.conversationId, 180)
    const text = clean(item.text, 700)
    const speakerActorId = clean(item.speakerActorId, 180)
    const speakerName = clean(item.speakerName, 120)
    if (!id || !messageId || !conversationId || !text || !speakerActorId || !speakerName) return []
    return [{
      id,
      conversationId,
      conversationTitle: clean(item.conversationTitle, 120) || 'Pocket conversation',
      conversationKind: item.conversationKind === 'group' ? 'group' as const : 'direct' as const,
      messageId,
      speakerActorId,
      speakerName,
      text,
      knownByActorIds: stringList(item.knownByActorIds),
      knownByNames: stringList(item.knownByNames),
      createdAt: clean(item.createdAt, 80),
    }]
  })
  const byMessage = new Map<string, PocketActorMemoryEntry>()
  for (const row of rows) byMessage.set(row.messageId, row)
  return [...byMessage.values()].slice(-MAX_ACTOR_MEMORIES)
}

export function upsertActorMemory(
  current: PocketActorMemoryEntry[],
  entry: PocketActorMemoryEntry,
): PocketActorMemoryEntry[] {
  const normalized = normalizeActorMemories([entry])[0]
  if (!normalized) return current.slice(-MAX_ACTOR_MEMORIES)
  const next = current.filter((item) => item.messageId !== normalized.messageId)
  next.push(normalized)
  return next.slice(-MAX_ACTOR_MEMORIES)
}

export function removeActorMemoryByMessageId(
  current: PocketActorMemoryEntry[],
  messageId: string,
): PocketActorMemoryEntry[] {
  const target = clean(messageId, 180)
  return target ? current.filter((item) => item.messageId !== target) : current
}

function actorCanRecall(
  entry: PocketActorMemoryEntry,
  actorIds: Set<string>,
  actorNames: Set<string>,
): boolean {
  if (entry.knownByActorIds.some((id) => actorIds.has(id))) return true
  return entry.knownByNames.some((name) => actorNames.has(nameKey(name)))
}

function memoryRows(
  memories: PocketActorMemoryEntry[],
  options: {
    actorIds: string[]
    actorNames: string[]
    excludeConversationId?: string
    maxRows?: number
  },
): PocketActorMemoryEntry[] {
  const actorIds = new Set(options.actorIds.map((entry) => clean(entry, 180)).filter(Boolean))
  const actorNames = new Set(options.actorNames.map(nameKey).filter(Boolean))
  const exclude = clean(options.excludeConversationId, 180)
  return memories
    .filter((entry) => (!exclude || entry.conversationId !== exclude) && actorCanRecall(entry, actorIds, actorNames))
    .slice(-(options.maxRows ?? 10))
}

function formatRows(rows: PocketActorMemoryEntry[], maxChars: number): string {
  const lines = rows.map((entry) => {
    const channel = entry.conversationKind === 'group' ? 'GC' : 'DM'
    return `- [${channel}: ${entry.conversationTitle}] ${entry.speakerName}: ${entry.text}`
  })
  return lines.join('\n').slice(0, maxChars)
}

export function actorPhoneMemoryContext(
  memories: PocketActorMemoryEntry[],
  options: {
    actorIds: string[]
    actorNames: string[]
    actorName: string
    excludeConversationId?: string
    maxChars?: number
  },
): string {
  const rows = memoryRows(memories, {
    actorIds: options.actorIds,
    actorNames: options.actorNames,
    excludeConversationId: options.excludeConversationId,
    maxRows: 10,
  })
  if (!rows.length) return ''
  const body = formatRows(rows, Math.max(400, (options.maxChars ?? 2_600) - 260))
  return `ACTOR PHONE MEMORY — PRIVATE TO ${clean(options.actorName, 120) || 'THIS SPEAKER'}
These are earlier Pocket messages this actor personally had access to in OTHER threads.
They are memory, not current-thread messages. Do not pretend they happened in this thread.
${body}`.slice(0, options.maxChars ?? 2_600)
}

export function groupActorPhoneMemoryContext(
  memories: PocketActorMemoryEntry[],
  actors: Array<{ actorIds: string[]; actorNames: string[]; name: string }>,
  excludeConversationId: string,
  maxChars = 5_200,
): string {
  const blocks = actors.flatMap((actor) => {
    const rows = memoryRows(memories, {
      actorIds: actor.actorIds,
      actorNames: actor.actorNames,
      excludeConversationId,
      maxRows: 7,
    })
    if (!rows.length) return []
    return [`${actor.name}
${formatRows(rows, 1_300)}`]
  })
  if (!blocks.length) return ''
  return `PRIVATE ACTOR PHONE MEMORY — KNOWLEDGE PARTITIONS
Each speaker may use ONLY the memory listed under their own name.
Do not transfer a private fact from one actor's block to another actor unless the CURRENT group thread or shared world continuity independently establishes it.

${blocks.join('\n\n')}`.slice(0, maxChars)
}
