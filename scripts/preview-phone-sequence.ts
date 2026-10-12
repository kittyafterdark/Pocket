import { refreshPhoneSequences } from '../src/frontend/components/phone-sequence.js'
import type { PocketActivity } from '../src/types.js'

const sent = new URLSearchParams(location.search).has('sent')
const activity: PocketActivity = {
  id: 'first', kind: 'message', title: 'Roderick', summary: "A compliment would've worked. Or returning the favor.",
  scope: { chatId: 'preview', characterId: 'preview' }, createdAt: '2026-10-11T12:00:00Z', source: { messageId: 'turn' },
  route: { app: 'messages', conversationId: 'conversation', messageId: 'first' },
  presentation: { kind: sent ? 'sent' : 'observed', senderName: 'Roderick', recipientNames: ['Laiyah'] },
}
const messages = [activity, { ...activity, id: 'second', summary: "Don't tell me you didn't look at it more than once.", route: { ...activity.route, app: 'messages' as const, messageId: 'second' } }]
const entries = messages.map(activity => {
  const host = document.createElement('div'); host.className = 'pocket-inline-anchor'; document.querySelector('main')!.append(host)
  return { host, activity, owner: sent ? 'roderick' : 'laiyah', options: { appearance: 'phone' as const, reducedMotion: location.search.includes('reduce') } }
})
refreshPhoneSequences(entries, (_, route) => { document.body.dataset.openedMessage = route.app === 'messages' ? route.messageId : '' })
