import { defaultPreferences, PREFERENCES_PATH } from '../../src/domain/preferences.js'

/** Controlled public Spindle boundary shared by backend and browser diagnostics. */
export function freeformHost(initial: Array<[string, unknown]> = [], persist?: (entries: Array<[string, unknown]>) => void) {
  const store = new Map<string, any>(initial)
  const sends: any[] = [], reads: string[] = [], generations: any[] = [], writes: string[] = []
  const events = new Map<string, (...args: any[]) => unknown>()
  let frontend: (payload: any, userId?: string) => Promise<void> = async () => {}
  let receive: (payload: any) => void = () => {}
  const permissions = new Set(['personas', 'chats', 'characters', 'chat_mutation', 'generation', 'ui_panels'])
  const personas = [
    { id: 'persona-fern', name: 'Fern', title: 'Night owl', description: 'A quiet book lover.', image_id: null, metadata: {} },
    { id: 'persona-mika', name: 'Mika', title: 'Traveler', description: 'Collects postcards.', image_id: null, metadata: {} },
  ]
  let activePersona = personas[1]
  let activeChat = { id: 'host-chat', character_id: 'host-character' }
  const key = (path: string, userId?: string) => `${userId || 'fixture'}:${path}`
  const preferences = defaultPreferences(); preferences.autoReplyAfterSend = false; preferences.reducedMotion = true
  if (!store.has(key(PREFERENCES_PATH))) store.set(key(PREFERENCES_PATH), preferences)
  const character = { id: 'host-character', name: 'Alex', description: 'A warm friend who likes books.', avatar_url: '', metadata: {}, color: '#b5a5f5' }
  const api: any = {
    permissions: { has: (name: string) => permissions.has(name), onChanged() {} },
    userStorage: {
      async getJson(path: string, options: any = {}) { return structuredClone(store.get(key(path, options.userId)) ?? options.fallback ?? null) },
      async setJson(path: string, value: unknown, options: any = {}) { writes.push(path); store.set(key(path, options.userId), structuredClone(value)); persist?.([...store]) },
      async list(prefix: string, userId?: string) { return [...store.keys()].filter(p => p.startsWith(key(prefix, userId))).map(p => p.slice(key('', userId).length)) },
      async delete(path: string, userId?: string) { store.delete(key(path, userId)); persist?.([...store]) },
    },
    personas: { async list() { return { data: personas, total: personas.length } }, async get(id: string) { return personas.find(p => p.id === id) || null }, async getActive() { return activePersona } },
    chats: { async getActive() { return activeChat }, async get(chatId: string) { if (chatId.startsWith('_freeform_')) throw new Error('Synthetic scope reached host chat API'); return { ...activeChat, id: chatId } } },
    characters: { async list() { return { data: [character], total: 1 } }, async get(id: string) { return id === character.id ? character : null } },
    council: { async getMembers() { return [] } },
    chat: {
      async getMessages(chatId: string) { reads.push(chatId); if (chatId.startsWith('_freeform_')) throw new Error('Freeform read host history'); return [{ id: 'private-host-message', role: 'assistant', content: 'HOST HISTORY MUST NEVER ENTER FREEFORM' }] },
      async appendMessage() { throw new Error('Freeform attempted a host write') },
    },
    connections: { async list() { return [{ id: 'fixture-model', name: 'Fixture model', provider: 'fixture', model: 'fixture', is_default: true, has_api_key: true }] } },
    generate: { async quiet(request: any) { generations.push(structuredClone({ ...request, signal: undefined })); return { content: JSON.stringify({ message: 'A reply from this session alone.', after: { state: 'local', reason: 'arrived' } }) } } },
    macros: { async resolve() { return { text: '', diagnostics: [] } } },
    frontendCapabilities: { declare() {} },
    onFrontendMessage(handler: typeof frontend) { frontend = handler },
    sendToFrontend(payload: any, userId?: string) { sends.push({ ...structuredClone(payload), fixtureUserId: userId }); receive(payload) },
    on(name: string, callback: (...args: any[]) => unknown) { events.set(name, callback) },
    log: { info() {}, warn() {}, error() {} },
  }
  ;(globalThis as any).spindle = api
  return {
    store, sends, reads, generations, writes, permissions, personas, api,
    connect(handler: typeof receive) { receive = handler },
    async send(payload: any, userId?: string) { await frontend(payload, userId) },
    async emit(name: string, payload: any = {}) { await events.get(name)?.(payload) },
    activeChat: () => ({ chatId: activeChat.id, characterId: activeChat.character_id }),
    switchChat(id: string) { activeChat = { ...activeChat, id } },
    switchPersona(id: string) { activePersona = personas.find(p => p.id === id)! },
    read(path: string, userId?: string) { return structuredClone(store.get(key(path, userId))) },
  }
}
