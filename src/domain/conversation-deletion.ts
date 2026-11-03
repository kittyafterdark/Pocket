import type { PhoneState } from '../types.js'
import { conversationVisibleOnDevice, pocketPersonaActorId } from './device.js'

export function validateConversationDeletion(state: PhoneState, ids: string[]): Set<string> {
  if (!Array.isArray(ids) || !ids.length || ids.length > 80 || ids.some(id => typeof id !== 'string')) throw new Error('Select between 1 and 80 conversations.')
  const selected = new Set(ids), owner = pocketPersonaActorId(state)
  for (const id of selected) {
    const thread = state.conversations.find(thread => thread.id === id)
    if (!thread || thread.channel === 'dating' || !conversationVisibleOnDevice(state, thread, owner)) throw new Error('A selected conversation is no longer available on this phone. Nothing was deleted.')
  }
  return selected
}

/** Remove phone-owned thread data while preserving Contacts, NPC Bank and independent app items. */
export function removePhoneConversations(state: PhoneState, ids: string[]): number {
  const selected = validateConversationDeletion(state, ids)
  const directContacts = state.conversations.filter(thread => selected.has(thread.id) && thread.kind === 'direct').flatMap(thread => thread.participantContactIds)
  state.suppressedDirectContactIds = [...new Set([...(state.suppressedDirectContactIds || []), ...directContacts])].slice(-160)
  const routeMatches = (route: unknown) => Boolean(route && typeof route === 'object' && 'conversationId' in route && selected.has(String(route.conversationId)))
  const removedActivities = new Set(state.activities.filter(activity => routeMatches(activity.route) || selected.has(activity.source?.conversationId || '')).map(activity => activity.id))
  state.conversations = state.conversations.filter(thread => !selected.has(thread.id))
  state.actorMemories = state.actorMemories.filter(memory => !selected.has(memory.conversationId))
  state.notifications = state.notifications.filter(notification => !routeMatches(notification.route))
  state.activities = state.activities.filter(activity => !removedActivities.has(activity.id))
  // Keep idempotency receipts so an old RP tool call cannot recreate a deleted chat.
  state.processedCommands = state.processedCommands.map(command => command.activityId && removedActivities.has(command.activityId) ? { ...command, activityId: undefined } : command)
  state.references = state.references.filter(reference => !selected.has(reference.conversationId))
  state.relays = state.relays.filter(relay => !selected.has(relay.conversationId))
  state.groupBatches = state.groupBatches.filter(batch => !selected.has(batch.conversationId))
  for (const event of state.events) if (event.phoneHistoryBoundary && selected.has(event.phoneHistoryBoundary.conversationId)) event.phoneHistoryBoundary = undefined
  return selected.size
}
