import type { SpindleAPI } from 'lumiverse-spindle-types'
import type { PhoneState, PocketConversation } from '../types.js'
import { conversationActorIds, resolvePocketActor } from '../domain/actors.js'
import { inspectFreeformLore } from './context-options.js'

type LoreApi = Pick<SpindleAPI, 'permissions' | 'world_books'> & Partial<Pick<SpindleAPI, 'chats' | 'characters' | 'personas'>>

/** Phone retrieval is independent of whether the latest RP turn activated any lore. */
export async function retrievePhoneLore(api: LoreApi, state: PhoneState, conversation: PocketConversation, userId?: string) {
  const freeform = state.chatId.startsWith('_freeform_'), bookIds = new Set<string>(), entries = new Map<string, any>(), reasons = new Map<string, string>()
  const markBooks = (ids: unknown) => { if (Array.isArray(ids)) for (const id of ids) if (typeof id === 'string' && id) bookIds.add(id) }
  const actors = conversationActorIds(conversation).map(id => resolvePocketActor(state, id)).filter(actor => Boolean(actor))
  const contacts = [...new Map([...actors.flatMap(actor => actor?.contact ? [actor.contact] : []), ...state.contacts.filter(contact => conversation.participantContactIds.includes(contact.id))].map(contact => [contact.id, contact])).values()]
  const sourceIds = new Set(contacts.flatMap(contact => contact.source.kind === 'npc' ? contact.source.lorebookEntryIds || [] : []))
  const characters = new Set(contacts.flatMap(contact => contact.source.kind === 'character' ? [contact.source.characterId] : []))
  if (!freeform && state.characterId && state.characterId !== '_none') characters.add(state.characterId)

  if (!freeform) {
    const activated = await api.world_books.getActivated(state.chatId, userId)
    for (const activation of activated) {
      const entry = await api.world_books.entries.get(activation.id, userId)
      if (!entry) continue
      entries.set(entry.id, entry); bookIds.add(entry.world_book_id || activation.bookId || '')
      reasons.set(entry.id, `Host activated${activation.source ? ': ' + activation.source : ''}`)
    }
    if (api.permissions.has('chats') && api.chats) markBooks((await api.chats.get(state.chatId, userId))?.metadata?.chat_world_book_ids)
  }
  markBooks(await api.world_books.getGlobal(userId))
  if (state.pocketPersona.linkedPersonaId && api.permissions.has('personas') && api.personas) {
    const persona = await api.personas.get(state.pocketPersona.linkedPersonaId, userId)
    if (persona?.attached_world_book_id) bookIds.add(persona.attached_world_book_id)
  }
  if (api.permissions.has('characters') && api.characters) for (const id of characters) markBooks((await api.characters.get(id, userId))?.world_book_ids)
  for (const id of sourceIds) {
    const entry = await api.world_books.entries.get(id, userId)
    if (!entry) continue
    entries.set(entry.id, entry); bookIds.add(entry.world_book_id)
    if (!reasons.has(entry.id)) reasons.set(entry.id, 'NPC source reference')
  }
  bookIds.delete('')
  for (const bookId of bookIds) {
    let offset = 0
    while (true) {
      const page = await api.world_books.entries.list(bookId, { limit: 100, offset, userId })
      for (const entry of page.data) if (!entries.has(entry.id)) entries.set(entry.id, entry)
      offset += page.data.length
      if (!page.data.length || offset >= page.total) break
    }
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
