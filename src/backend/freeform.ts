import type { ChatPocketPersona, PhoneState } from '../types.js'
import { FREEFORM_INDEX_PATH, freeformPersona, isFreeformChat, sessionName } from '../domain/freeform.js'
import type { FreeformSession } from '../domain/freeform.js'

interface FreeformHost {
  read(path: string, userId?: string): Promise<unknown>
  write(path: string, value: unknown, userId?: string): Promise<void>
  remove(path:string,userId?:string):Promise<void>
  path(chatId: string, characterId: string): string
  key(chatId: string, characterId: string): string
  fresh(chatId: string, characterId: string): PhoneState
  load(chatId: string, characterId: string, userId?: string): Promise<PhoneState>
  lock<T>(key: string, task: () => Promise<T>): Promise<T>
  makeId(): string
  now(): string
}

/** Uses the same phone store and apps, with an independent session identity. */
export class FreeformSessions {
  constructor(private host: FreeformHost) {}

  async list(userId?: string): Promise<FreeformSession[]> {
    const raw = await this.host.read(FREEFORM_INDEX_PATH, userId) as { version?: number; sessions?: FreeformSession[] } | null
    if (raw === null) return []
    if (raw?.version !== 1 || !Array.isArray(raw.sessions) || raw.sessions.some(s => !s || !/^_freeform_[\w-]{1,140}$/.test(s.id) || typeof s.name !== 'string' || typeof s.personaId !== 'string' || typeof s.personaName !== 'string')) {
      throw new Error('The Freeform session directory is unsupported. It has been left untouched.')
    }
    return structuredClone(raw.sessions)
  }

  private indexLock(userId?: string): string { return `freeform:index:${userId || '_default'}` }
  private phoneLock(chatId: string, characterId: string): string { return this.host.key(chatId, characterId) }

  async get(sessionId: string, userId?: string): Promise<FreeformSession> {
    const session = (await this.list(userId)).find(s => s.id === sessionId)
    if (!session) throw new Error('That Freeform session no longer exists. Refresh the lock screen.')
    return session
  }

  async create(name: unknown, persona: ChatPocketPersona, userId?: string): Promise<FreeformSession> {
    const checkedName = sessionName(name)
    if (!persona.linkedPersonaId || !persona.displayName) throw new Error('Choose a Persona for this session.')
    return this.host.lock(this.indexLock(userId), async () => {
      const sessions = await this.list(userId)
      const session: FreeformSession = { id: `_freeform_${this.host.makeId()}`, name: checkedName, personaId: persona.linkedPersonaId!, personaName: persona.displayName, appearanceBasePersonaId: persona.linkedPersonaId, independentStyling: false, createdAt: this.host.now() }
      if (!/^_freeform_[\w-]{1,140}$/.test(session.id) || await this.host.read(this.host.path(session.id, '_none'), userId) !== null) throw new Error('Could not allocate a new Freeform session. Try again.')
      const state = this.host.fresh(session.id, '_none')
      state.pocketPersona = freeformPersona(persona)
      state.setup = { initialized: true, dismissed: true, personaConfigured: true, worldStatus: 'skipped', authorship: 'roleplay' }
      state.characterName = 'Freeform'
      await this.host.write(this.host.path(session.id, '_none'), state, userId)
      await this.host.write(FREEFORM_INDEX_PATH, { version: 1, sessions: [...sessions, session] }, userId)
      return session
    })
  }

  async setAppearance(sessionId: string, basePersonaId: string, independent: boolean, userId?: string): Promise<void> {
    await this.host.lock(this.indexLock(userId), async () => {
      const sessions = await this.list(userId), session = sessions.find(s => s.id === sessionId)
      if (!session) throw new Error('That Freeform session is unavailable.')
      session.appearanceBasePersonaId = basePersonaId; session.independentStyling = independent
      await this.host.write(FREEFORM_INDEX_PATH, {version:1, sessions}, userId)
    })
  }

  async delete(sessionId:string,userId?:string):Promise<{cleanupError?:string}> {
    return this.host.lock(this.phoneLock(sessionId,'_none'),()=>this.host.lock(this.indexLock(userId),async()=>{
      const sessions=await this.list(userId)
      if(!sessions.some(s=>s.id===sessionId))throw new Error('That Freeform session no longer exists.')
      // Removing the index entry also revokes further writes from late generation callbacks.
      await this.host.write(FREEFORM_INDEX_PATH,{version:1,sessions:sessions.filter(s=>s.id!==sessionId)},userId)
      try {await this.host.remove(this.host.path(sessionId,'_none'),userId)}
      catch {return {cleanupError:'Session removed from the chooser, but its stored phone file could not be deleted.'}}
      return {}
    }))
  }

  async rename(sessionId: string, name: unknown, userId?: string): Promise<void> {
    const checkedName = sessionName(name)
    await this.host.lock(this.indexLock(userId), async () => {
      const sessions = await this.list(userId), session = sessions.find(s => s.id === sessionId)
      if (!session) throw new Error('That Freeform session no longer exists.')
      session.name = checkedName
      await this.host.write(FREEFORM_INDEX_PATH, { version: 1, sessions }, userId)
    })
  }

  async copyToChat(sessionId: string, target: { chatId: string; characterId: string }, override: boolean, userId?: string): Promise<{ backupPath?: string }> {
    await this.get(sessionId, userId)
    if (!target.chatId || target.chatId === '_lobby' || isFreeformChat(target.chatId) || !target.characterId || target.characterId === '_none') throw new Error('Open a roleplay chat in Lumiverse first.')
    return this.host.lock(this.phoneLock(sessionId, '_none'), () => this.host.lock(this.phoneLock(target.chatId, target.characterId), async () => {
      const existing = await this.host.read(this.host.path(target.chatId, target.characterId), userId)
      if (!override) throw new Error('Your base Pocket was kept. Confirm Override to copy this session.')
      const source = await this.host.load(sessionId, '_none', userId)
      const copy = structuredClone(source)
      copy.chatId = target.chatId; copy.characterId = target.characterId
      for (const activity of copy.activities) activity.scope = { ...activity.scope, ...target }
      // Freeform has no host swipe/relay ownership to carry into a new RP.
      copy.hostSwipeSelections = []; copy.hostClockBaselines = []; copy.candidateClocks = []
      copy.lastReconciliation = undefined; copy.sceneSnapshot = null; copy.references = []; copy.relays = []
      copy.updatedAt = this.host.now()
      let backupPath: string | undefined
      if (existing !== null) {
        backupPath = `freeform/backups/${this.host.makeId()}.json`
        await this.host.write(backupPath, { chatId: target.chatId, characterId: target.characterId, state: existing, createdAt: this.host.now() }, userId)
      }
      await this.host.write(this.host.path(target.chatId, target.characterId), copy, userId)
      return { backupPath }
    }))
  }
}
