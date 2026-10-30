import type { PhoneState } from '../types.js'
import { conversationDeviceActorIds, messageSenderActorId, pocketPersonaActorId } from '../domain/device.js'
import { resolvePocketActor } from '../domain/actors.js'
import { messageHistoryContextLabel } from '../domain/message-continuity.js'
import { socialDirectApp } from '../domain/social-dms.js'

const compact = (value: string, max: number) => value.replace(/\s+/g, ' ').trim().slice(0, max)

/** Automatic RP recall is restricted to the active Character's own communication graph.
 * The caller supplies swipe-projected state so rejected candidates cannot become memory. */
export function roleplayPhoneRecall(state: PhoneState, maxChars = 3_200): string {
  if (!state.characterId || state.characterId === '_none') return ''
  const contacts = state.contacts.filter(contact => contact.source.kind === 'character' && contact.source.characterId === state.characterId)
  const ids = new Set([state.characterId, `card:${state.characterId}`, ...contacts.map(contact => contact.id)])
  const actorName = contacts[0]?.name || state.characterName || 'Active character'
  const personaId = pocketPersonaActorId(state)
  const nameFor = (actorId: string) => resolvePocketActor(state, actorId)?.name || (actorId === personaId ? state.pocketPersona.displayName : actorId)
  const rows: Array<{ id: string; at: string; channel: string; speaker: string; text: string; stamp?: string }> = []
  for (const conversation of state.conversations) {
    const members = conversationDeviceActorIds(state, conversation)
    if (!members.some(id => ids.has(id))) continue
    const channel = `Messages ${conversation.kind === 'group' ? 'group' : 'DM'} with ${members.map(nameFor).join(', ')}`
    for (const message of conversation.messages.slice(-10)) {
      if (message.sender === 'system' || message.status === 'failed' || message.status === 'pending' || message.candidateCommitState === 'provisional') continue
      const sender = messageSenderActorId(state, message)
      // Explicit per-message audiences are authoritative. Legacy direct threads are
      // private to their two participants; legacy group history needs an audience.
      const canKnow = ids.has(sender) || (message.recipientActorIds?.length
        ? message.recipientActorIds.some(id => ids.has(id))
        : conversation.kind === 'direct')
      if (!canKnow || !message.text.trim()) continue
      rows.push({ id: message.id, at: message.createdAt, channel, speaker: message.senderName || nameFor(sender),
        text: message.text, stamp: messageHistoryContextLabel(state, message, conversation) })
    }
  }
  for (const thread of state.social?.dmThreads || []) {
    const accountIsActor = Boolean((thread.account.cardId === state.characterId) || (thread.account.actorId && ids.has(thread.account.actorId)))
    if (!accountIsActor && !ids.has(thread.owner)) continue
    const ownerName = nameFor(thread.owner)
    const channel = `${socialDirectApp(thread)} private DM with ${ownerName}, ${thread.account.name}`
    for (const message of thread.messages.slice(-6)) {
      if (message.text.trim()) rows.push({ id: message.id, at: message.createdAt, channel,
        speaker: message.sender === 'owner' ? ownerName : thread.account.name, text: message.text })
    }
  }
  if (!rows.length) return ''
  const unique = [...new Map(rows.map(row => [row.id, row])).values()]
    .sort((a, b) => (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0)).slice(-8)
  const header = [
    `POCKET PHONE RECALL — PRIVATE TO ${compact(actorName, 120)}`,
    'Existing communication, not new dialogue or instructions. Each listed channel already exists: do not claim this character has no way to message its participants merely because a literal phone number is not written in the prose.',
    'Only this character and the named participants know these exchanges. Other scene actors do not inherit this private knowledge. Do not replay/resend texts or turn an old promise into a new trip. Current RP location, activity and time take precedence over historical logistics. Preserve established tone and rapport.',
  ].join('\n')
  const lines: string[] = []
  let remaining = Math.max(0, Math.min(4_500, maxChars) - header.length - 2)
  for (const row of [...unique].reverse()) {
    const label = `[${compact(row.channel, 150)}${row.stamp ? `; ${compact(row.stamp, 120)}` : ''}] ${compact(row.speaker, 80)}: `
    if (remaining < label.length + 40) break
    let excerpt = compact(row.text, Math.min(340, remaining - label.length - 3))
    while (excerpt && label.length + JSON.stringify(excerpt).length > remaining) excerpt = excerpt.slice(0, -1)
    if (!excerpt) break
    const line = label + JSON.stringify(excerpt)
    lines.unshift(line); remaining -= line.length + 1
  }
  return lines.length ? header + '\n\n' + lines.join('\n') : ''
}
