import type { SocialAccount } from './social.js'

export type SocialDmApp = 'instagram' | 'tumblr'
export const socialDirectApp = (thread: { app?: SocialDmApp }): SocialDmApp => thread.app || 'instagram'
export interface SocialDirectMessage { id: string; sender: 'owner' | 'account'; text: string; createdAt: string }
export interface SocialDirectThread { id: string; owner: string; app?: SocialDmApp; account: SocialAccount; messages: SocialDirectMessage[]; updatedAt: string }
const dmText = (value: unknown, max = 180) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const dmRecord = (value: unknown): value is Record<string, any> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
/** Private, bounded and platform-local. Never promoted to public posts or Pocket Messages. */
export function normalizeSocialDirectThreads(raw: unknown): SocialDirectThread[] {
  const ids = new Set<string>()
  const threads = (Array.isArray(raw) ? raw : []).slice(-160).flatMap(item => {
    if (!dmRecord(item) || !dmRecord(item.account) || (item.app !== undefined && item.app !== 'instagram' && item.app !== 'tumblr')) return []
    const id = dmText(item.id), owner = dmText(item.owner), accountId = dmText(item.account.id), name = dmText(item.account.name, 100)
    if (!id || !owner || !accountId || !name || accountId === owner || ids.has(id)) return []
    ids.add(id)
    const messageIds = new Set<string>(), messages: SocialDirectMessage[] = (Array.isArray(item.messages) ? item.messages : []).slice(-100).flatMap((message: unknown) => {
      if (!dmRecord(message)) return []
      const id = dmText(message.id), text = dmText(message.text, 4000)
      if (!id || !text || messageIds.has(id) || !['owner', 'account'].includes(message.sender)) return []
      messageIds.add(id); return [{ id, text, sender: message.sender, createdAt: dmText(message.createdAt, 80) }]
    })
    const avatar = dmText(item.account.avatarUrl, 2000)
    return [{ id, owner, app: item.app === 'tumblr' ? 'tumblr' as const : 'instagram' as const, account: { id: accountId, name, handle: dmText(item.account.handle, 48), actorId: dmText(item.account.actorId) || undefined,
      cardId: dmText(item.account.cardId) || undefined, bankId: dmText(item.account.bankId) || undefined, avatarUrl: /^(https?:\/\/|\/[^/])/.test(avatar) ? avatar : undefined,
      bio: dmText(item.account.bio, 280) || undefined }, messages, updatedAt: dmText(item.updatedAt, 80) }]
  })
  const counts = { instagram: 0, tumblr: 0 }
  return threads.reverse().filter(thread => ++counts[socialDirectApp(thread)] <= 40).reverse()
}
