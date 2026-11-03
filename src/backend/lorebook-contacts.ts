import type { SpindleAPI } from 'lumiverse-spindle-types'

export class LorebookContacts {
  constructor(private api: Pick<SpindleAPI, 'permissions' | 'world_books'> & Partial<Pick<SpindleAPI, 'chats' | 'characters'>>) {}

  private requireAccess(): void {
    if (!this.api.permissions.has('world_books')) throw new Error('Enable World Books access in Pocket permissions to import lorebook contacts.')
  }

  private async pages<T>(load: (offset: number) => Promise<{ data: T[]; total: number }>): Promise<T[]> {
    const result: T[] = []
    for (let offset = 0; offset < 5_000;) {
      const page = await load(offset)
      result.push(...page.data); offset += page.data.length
      if (!page.data.length || offset >= page.total) return result
    }
    throw new Error('This library is too large to browse here. Move the entries you want into a smaller lorebook.')
  }

  async books(userId?: string, context?: { chatId: string; characterId: string }) {
    this.requireAccess()
    const attached = new Map<string, Set<'chat' | 'character'>>()
    const mark = (ids: unknown, scope: 'chat' | 'character') => {
      if (!Array.isArray(ids)) return
      for (const id of ids) if (typeof id === 'string' && id) {
        const scopes = attached.get(id) || new Set<'chat' | 'character'>(); scopes.add(scope); attached.set(id, scopes)
      }
    }
    if (context?.chatId && !context.chatId.startsWith('_freeform_') && this.api.permissions.has('chats') && this.api.chats) {
      try { mark((await this.api.chats.get(context.chatId, userId))?.metadata?.chat_world_book_ids, 'chat') } catch { /* Library remains available if the chat was removed or access changed. */ }
    }
    if (context?.characterId && context.characterId !== '_none' && this.api.permissions.has('characters') && this.api.characters) {
      try { mark((await this.api.characters.get(context.characterId, userId))?.world_book_ids, 'character') } catch { /* Character attachments are optional. */ }
    }
    return (await this.pages(offset => this.api.world_books.list({ limit: 100, offset, userId })))
      .map(book => ({ id: book.id, name: book.name, attachedTo: [...(attached.get(book.id) || [])] }))
      .sort((a, b) => Number(Boolean(b.attachedTo.length)) - Number(Boolean(a.attachedTo.length)) || a.name.localeCompare(b.name))
  }

  async entries(bookId: string, userId?: string) {
    this.requireAccess()
    if (!bookId || !await this.api.world_books.get(bookId, userId)) throw new Error('That lorebook is no longer available.')
    return (await this.pages(offset => this.api.world_books.entries.list(bookId, { limit: 100, offset, userId })))
      .map(entry => ({ id: entry.id, title: entry.comment || entry.key.join(', ') || entry.uid, disabled: entry.disabled, keys: entry.key.slice(0, 24), preview: entry.content.slice(0, 800) }))
  }

  async sources(selection: Array<{ bookId: string; entryId: string }>, userId?: string, progress?: (completed: number, total: number) => void) {
    this.requireAccess()
    if (!Array.isArray(selection) || !selection.length || selection.length > 24) throw new Error('Choose between 1 and 24 source entries.')
    const seen = new Set<string>(), sources: Array<{ id: string; bookId: string; title: string; content: string }> = []
    let chars = 0
    for (const source of selection) {
      if (!source || typeof source.bookId !== 'string' || typeof source.entryId !== 'string') throw new Error('Choose valid lorebook source entries.')
      if (seen.has(source.entryId)) throw new Error('The same source entry was selected more than once.')
      seen.add(source.entryId)
      const entry = await this.api.world_books.entries.get(source.entryId, userId)
      if (!entry || entry.world_book_id !== source.bookId) throw new Error('An entry no longer belongs to its selected lorebook. Refresh the source list.')
      if (entry.disabled) throw new Error('Choose enabled lorebook entries.')
      if (!entry.content.trim()) throw new Error('A selected source entry has no content.')
      chars += entry.content.length
      if (chars > 32_000) throw new Error('The selection exceeds 32,000 characters. Choose less source text for this pass.')
      sources.push({ id: entry.id, bookId: source.bookId, title: entry.comment.slice(0, 200), content: entry.content })
      progress?.(sources.length, selection.length)
    }
    return sources
  }
}
