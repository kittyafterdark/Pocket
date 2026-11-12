import type { SpindleAPI } from 'lumiverse-spindle-types'
import type { PhoneState, PocketConversation } from '../types.js'
import { conversationActorIds, resolvePocketActor } from '../domain/actors.js'
import { inspectFreeformLore } from './context-options.js'

const MAX_LINKED_BOOKS = 24
const MAX_EXPLICIT_ENTRIES = 48
const MAX_SCANNED_ENTRIES = 400
const MAX_ENTRIES_PER_BOOK = 200
const LORE_PAGE_SIZE = 25

/** Keep only the fields the local selector uses after each host page is released. */
function compactLoreEntry(entry: any) {
  const keys = (value: unknown) => Array.isArray(value)
    ? value.slice(0, 32).filter((key): key is string => typeof key === 'string' && key.length <= 180)
    : []
  return {
    id: entry.id, world_book_id: entry.world_book_id,
    comment: typeof entry.comment === 'string' ? entry.comment.slice(0, 160) : '',
    content: typeof entry.content === 'string' ? entry.content.slice(0, 12_000) : '',
    key: keys(entry.key), keysecondary: keys(entry.keysecondary),
    priority: entry.priority, order_value: entry.order_value, disabled: entry.disabled,
    constant: entry.constant, use_regex: entry.use_regex, match_whole_words: entry.match_whole_words,
    case_sensitive: entry.case_sensitive, selective: entry.selective,
  }
}

type LoreApi = Pick<SpindleAPI, 'permissions' | 'world_books'> & Partial<Pick<SpindleAPI, 'chats' | 'characters' | 'personas'>>

/** Phone retrieval is independent of whether the latest RP turn activated any lore. */
export async function retrievePhoneLore(api: LoreApi, state: PhoneState, conversation: PocketConversation, userId?: string) {
  const freeform = state.chatId.startsWith('_freeform_'), bookIds = new Set<string>(), entries = new Map<string, any>(), reasons = new Map<string, string>()
  const markBooks = (ids: unknown) => { if (Array.isArray(ids)) for (const id of ids) if (typeof id === 'string' && id && bookIds.size < MAX_LINKED_BOOKS) bookIds.add(id) }
  const actors = conversationActorIds(conversation).map(id => resolvePocketActor(state, id)).filter(actor => Boolean(actor))
  const contacts = [...new Map([...actors.flatMap(actor => actor?.contact ? [actor.contact] : []), ...state.contacts.filter(contact => conversation.participantContactIds.includes(contact.id))].map(contact => [contact.id, contact])).values()]
  const sourceIds = new Set(contacts.flatMap(contact => contact.source.kind === 'npc' ? contact.source.lorebookEntryIds || [] : []).slice(0, MAX_EXPLICIT_ENTRIES))
  const characters = new Set(contacts.flatMap(contact => contact.source.kind === 'character' ? [contact.source.characterId] : []))
  if (!freeform && state.characterId && state.characterId !== '_none') characters.add(state.characterId)

  if (!freeform) {
    const activated = await api.world_books.getActivated(state.chatId, userId)
    for (const activation of activated.slice(0, MAX_EXPLICIT_ENTRIES)) {
      const entry = await api.world_books.entries.get(activation.id, userId)
      if (!entry) continue
      entries.set(entry.id, compactLoreEntry(entry)); markBooks([entry.world_book_id || activation.bookId])
      reasons.set(entry.id, `Host activated${activation.source ? ': ' + activation.source : ''}`)
    }
    if (api.permissions.has('chats') && api.chats) markBooks((await api.chats.get(state.chatId, userId))?.metadata?.chat_world_book_ids)
  }
  markBooks(await api.world_books.getGlobal(userId))
  if (state.pocketPersona.linkedPersonaId && api.permissions.has('personas') && api.personas) {
    const persona = await api.personas.get(state.pocketPersona.linkedPersonaId, userId)
    if (persona?.attached_world_book_id) markBooks([persona.attached_world_book_id])
  }
  if (api.permissions.has('characters') && api.characters) for (const id of characters) markBooks((await api.characters.get(id, userId))?.world_book_ids)
  for (const id of sourceIds) {
    const entry = await api.world_books.entries.get(id, userId)
    if (!entry) continue
    entries.set(entry.id, compactLoreEntry(entry)); markBooks([entry.world_book_id])
    if (!reasons.has(entry.id)) reasons.set(entry.id, 'NPC source reference')
  }
  bookIds.delete('')
  let scanned = 0
  for (const bookId of bookIds) {
    for (let offset = 0; offset < MAX_ENTRIES_PER_BOOK && scanned < MAX_SCANNED_ENTRIES;) {
      const limit = Math.min(LORE_PAGE_SIZE, MAX_ENTRIES_PER_BOOK - offset, MAX_SCANNED_ENTRIES - scanned)
      const page = await api.world_books.entries.list(bookId, { limit, offset, userId })
      const rows = page.data.slice(0, limit)
      for (const entry of rows) if (!entries.has(entry.id)) entries.set(entry.id, compactLoreEntry(entry))
      scanned += rows.length
      offset += rows.length
      if (!rows.length || offset >= page.total) break
    }
    if (scanned >= MAX_SCANNED_ENTRIES) break
  }
  const names = [state.pocketPersona.displayName, ...actors.flatMap(actor => actor ? [actor.name, ...(actor.contact?.aliases || [])] : [])].filter(Boolean)
  const scan = [names.join('\n'), state.contextScenario, ...conversation.messages.filter(message => message.sender !== 'system' && message.candidateCommitState !== 'provisional' && message.status !== 'pending' && message.status !== 'failed').slice(-20).map(message => message.text)].filter(Boolean).join('\n')
  // Direct NPC evidence and the current phone exchange get the budget before stale RP activations.
  const prioritized = [...entries.values()].map((entry, index) => sourceIds.has(entry.id) ? { ...entry, constant: true, priority: Number.MAX_SAFE_INTEGER - index } : entry)
  const result = inspectFreeformLore(prioritized, scan), used = new Set(result.entries.filter(row => row.chars).map(row => row.id))
  let text = result.text, remaining = Math.max(0, 12_000 - text.length)
  for (const [entryId, reason] of reasons) {
    if (!reason.startsWith('Host activated') || used.has(entryId)) continue
    const entry = entries.get(entryId)
    if (!entry || entry.disabled || !entry.content) continue
    const separator = text ? '\n\n' : '', content = String(entry.content).slice(0, Math.max(0, remaining - separator.length))
    let row = result.entries.find(row => row.id === entryId)
    if (!row) { row = { id: entryId, title: entry.comment || entryId, bookId: entry.world_book_id || '', reason, chars: 0 }; result.entries.push(row) }
    row.reason = content ? reason : 'Context budget exhausted'; row.chars = content.length
    if (content) { text += separator + content; remaining = 12_000 - text.length }
  }
  for (const row of result.entries) if (row.chars && reasons.has(row.id)) row.reason = reasons.get(row.id)!
  return { text, entries: result.entries, bookIds: [...bookIds] }
}
