type ChatReadOptions = {
  tail?: number
  limit?: number
  offset?: number
  light: boolean
  includeExtra: false
  ownMetadataOnly?: true
}

type ChatReader = { getMessages(chatId: string, options: ChatReadOptions): Promise<any[]> }

/** Current Spindle hosts apply the window before copying messages to Pocket. */
export async function readPocketChatTail(chat: ChatReader, chatId: string, tail: number): Promise<any[]> {
  if (tail <= 0) return []
  const rows = await chat.getMessages(chatId, { tail, light: true, includeExtra: false, ownMetadataOnly: true })
  // Legacy hosts accept the argument but can return the whole chat.
  return rows.length > tail ? rows.slice(-tail) : rows
}

/** Legacy timeline recovery can inspect the whole history a page at a time. */
export async function* readPocketChatPages(chat: ChatReader, chatId: string): AsyncGenerator<any[]> {
  const limit = 32
  let previousLastId: string | undefined
  for (let offset = 0; ; offset += limit) {
    const page = await chat.getMessages(chatId, { limit, offset, light: true, includeExtra: false })
    const lastId = page.at(-1)?.id
    if (!page.length || (offset > 0 && lastId === previousLastId)) return
    yield page
    if (page.length !== limit) return
    previousLastId = lastId
  }
}

/** Find an older swipe by ID without retaining other pages or their inactive swipes. */
export async function readPocketChatMessage(chat: ChatReader, chatId: string, messageId: string): Promise<any | undefined> {
  const tail = await chat.getMessages(chatId, { tail: 8, light: true, includeExtra: false, ownMetadataOnly: true })
  const recent = tail.find(row => row.id === messageId)
  if (tail.length > 8) return recent // The legacy host already returned all full rows.

  const at = async (offset: number) => {
    const exact = await chat.getMessages(chatId, { limit: 1, offset, light: false, includeExtra: false, ownMetadataOnly: true })
    return exact.find(row => row.id === messageId)
  }
  // The index usually equals the offset. Verify the ID before using it on edited histories.
  if (Number.isSafeInteger(recent?.index_in_chat) && recent.index_in_chat >= 0) {
    const exact = await at(recent.index_in_chat)
    if (exact) return exact
  }

  const limit = 16
  let previousLastId: string | undefined
  for (let offset = 0; ; offset += limit) {
    const page = await chat.getMessages(chatId, { limit, offset, light: true, includeExtra: false, ownMetadataOnly: true })
    const index = page.findIndex(row => row.id === messageId)
    // A host that ignored pagination already returned full rows.
    if (page.length > limit) return page[index]
    if (index >= 0) return at(offset + index)
    const lastId = page.at(-1)?.id
    if (page.length < limit || lastId === previousLastId || lastId === tail.at(-1)?.id) return undefined
    previousLastId = lastId
  }
}
