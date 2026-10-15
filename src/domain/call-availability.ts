import type { PocketContact, PocketConversation } from '../types.js'

/** Here/Away describe scene presence; a paused thread can also expose Busy. */
export function callAvailability(contact: PocketContact, conversation?: PocketConversation): 'Here' | 'Busy' | 'Away' {
  const reason = conversation?.availability.state === 'paused' ? conversation.availability.reason
    : conversation?.availability.state === 'local' ? conversation.availability.resumePauseReason : conversation?.pause?.reason
  if (reason === 'busy') return 'Busy'
  if (reason === 'away' || reason === 'sleeping') return 'Away'
  return contact.presence.inScene ? 'Here' : 'Away'
}

export function callAvailabilityContext(contact: PocketContact, conversation: PocketConversation): string {
  return [
    `Contact status: ${callAvailability(contact, conversation)}.`,
    `Physical location: ${contact.presence.inScene ? 'in the same scene as the caller' : 'away from the caller’s scene'}. Here/Away describe location, not guaranteed phone availability.`,
    `Phone conversation availability: ${JSON.stringify(conversation.availability)}.`,
    conversation.pause ? `Conversation pause: ${conversation.pause.reason}.` : '',
    `Remote communication eligible: ${contact.messagingPolicy.remoteEligible}.`,
    contact.sceneNote ? `Current activity / scene note: ${contact.sceneNote}` : '',
  ].filter(Boolean).join('\n')
}
