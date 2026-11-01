import type { PhoneState, PocketNpcBankEntry } from '../types.js'
import { generatedSocialHandle, normalizeSocialState, socialAppSettings, socialFollowing, socialOwner, type SocialAccount, type SocialApp, type SocialPost } from './social.js'

export type SocialMentionSource = 'following' | 'friend' | 'npc-bank'
export interface SocialMentionCandidate extends SocialAccount { mentionSource: SocialMentionSource }
export interface SocialMentionToken { start: number; end: number; query: string }

export function socialMentionToken(text: string, caret = text.length): SocialMentionToken | undefined {
  const end = Math.max(0, Math.min(text.length, Math.trunc(caret)))
  const before = text.slice(0, end)
  const match = before.match(/(?:^|\s)@([\p{L}\p{N}_.-]*)$/u)
  if (!match) return undefined
  const handle = match[1] || ''
  const at = end - handle.length - 1
  return { start: at, end, query: handle.toLocaleLowerCase() }
}

export function insertSocialMention(text: string, token: SocialMentionToken, handle: string, maxLength = Number.MAX_SAFE_INTEGER): { value: string; caret: number } | undefined {
  const mention = `@${handle.replace(/^@/, '')} `
  const value = text.slice(0, token.start) + mention + text.slice(token.end)
  if (value.length > maxLength) return undefined
  return { value, caret: token.start + mention.length }
}

export function socialMentionCandidates(state: PhoneState, owner: string, app: SocialApp, npcBank: readonly PocketNpcBankEntry[] = [], posts?: readonly SocialPost[]): SocialMentionCandidate[] {
  const world = normalizeSocialState(state.social)
  const platformPosts = (posts || world.posts).filter(post => post.app === app)
  const settings = socialAppSettings(world, owner, app)
  const result: SocialMentionCandidate[] = []
  const seen = new Set<string>()
  const identityKey = (person: SocialAccount) => person.actorId ? `actor:${person.actorId}` : person.bankId ? `bank:${person.bankId}` : `account:${person.id}`
  const add = (person: SocialAccount | undefined, source: SocialMentionSource) => {
    if (!person || person.id === owner || person.actorId === owner || person.actorId === state.pocketPersonaActorId) return
    const key = identityKey(person)
    if (seen.has(key)) return
    seen.add(key); result.push({ ...person, mentionSource: source })
  }
  const publishedById = (id: string) => platformPosts.find(post => post.account.id === id || post.account.actorId === id)?.account
  const publishedBank = (id: string) => platformPosts.find(post => post.account.bankId === id || post.account.id === `bank:${id}`)?.account
  const directById = (id: string) => world.dmThreads?.find(thread => (thread.app || 'instagram') === app && (thread.account.id === id || thread.account.actorId === id))?.account
  const actorAccount = (id: string) => {
    try { return socialOwner(state, id, app) } catch { return undefined }
  }

  for (const id of socialFollowing(world, owner, app)) add(publishedById(id) || directById(id) || actorAccount(id), 'following')
  for (const id of settings.friendEntryIds) {
    if (id.startsWith('actor:')) add(publishedById(id.slice(6)) || actorAccount(id.slice(6)), 'friend')
    else {
      const entry = npcBank.find(item => item.id === id)
      if (entry) add(publishedBank(entry.id) || { id: `bank:${entry.id}`, bankId: entry.id, name: entry.name, handle: generatedSocialHandle(app, entry.name, undefined, entry.id), avatarUrl: entry.avatarUrl }, 'friend')
    }
  }
  for (const entry of npcBank) add(publishedBank(entry.id) || { id: `bank:${entry.id}`, bankId: entry.id, name: entry.name, handle: generatedSocialHandle(app, entry.name, undefined, entry.id), avatarUrl: entry.avatarUrl }, 'npc-bank')
  return result
}

export function filterSocialMentions(candidates: readonly SocialMentionCandidate[], query: string, limit = 8): SocialMentionCandidate[] {
  const needle = query.trim().replace(/^@/, '').toLocaleLowerCase()
  const score = (person: SocialMentionCandidate) => {
    const handle = person.handle.toLocaleLowerCase(), name = person.name.toLocaleLowerCase()
    if (!needle) return 0
    if (handle === needle) return 0
    if (handle.startsWith(needle)) return 1
    if (name.startsWith(needle)) return 2
    if (handle.includes(needle)) return 3
    if (name.includes(needle)) return 4
    return 99
  }
  return candidates.filter(person => score(person) < 99).sort((a, b) => score(a) - score(b)).slice(0, Math.max(1, limit))
}
