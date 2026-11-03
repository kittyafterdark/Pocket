import type { PhoneState, PocketContact } from '../types.js'
import { conversationActorIds, resolvePocketActor } from './actors.js'

/** Include both sides of relevant phone threads, including pre-promotion messages. */
export function contactPhoneEvidence(state: PhoneState, contact: PocketContact): string {
  const belongs = (actorId: string) => resolvePocketActor(state, actorId)?.contact?.id === contact.id
  return state.conversations.filter(thread => thread.channel !== 'dating' && (
    thread.participantContactIds.includes(contact.id) || conversationActorIds(thread).some(belongs)
  )).sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)).slice(-6).map(thread => {
    const lines = thread.messages.filter(message => message.sender !== 'system' && message.candidateCommitState !== 'provisional')
      .slice(-20).map(message => `${message.senderName}: ${message.text.slice(0, 500)}`)
    return lines.length ? `PHONE THREAD: ${thread.title}\n${lines.join('\n')}` : ''
  }).filter(Boolean).join('\n\n').slice(-12_000)
}
