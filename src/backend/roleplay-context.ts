import type { DevicePreferences, PhoneState, PocketContact, PocketConversation } from '../types.js'

type HostMessage = { role?: unknown; content?: unknown }

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function storyContext(state: PhoneState, contact: PocketContact): string {
  const name = contact.name.toLocaleLowerCase()
  const events = state.events.filter((event) => !event.completed && `${event.title} ${event.description}`.toLocaleLowerCase().includes(name)).slice(0, 4)
  const trackers = state.trackers.filter((tracker) => tracker.visibleToModel && (`${tracker.target.id} ${tracker.target.label}`.includes(contact.id) || `${tracker.target.label}`.toLocaleLowerCase().includes(name))).slice(0, 5)
  const notes = state.notes.filter((note) => note.pinned).slice(0, 3)
  const present = state.contacts.filter((entry) => entry.presence.inScene).slice(0, 6)
  return [
    `Roleplay time: ${state.roleplayNow}`,
    `Scene: ${state.weather.location}; ${state.weather.condition}.`,
    present.length ? `Present actors: ${present.map((entry) => `${entry.name}${entry.sceneNote ? ` — ${entry.sceneNote}` : ''}`).join('; ')}` : '',
    events.length ? `Relevant timeline: ${events.map((entry) => `${entry.whenText}: ${entry.title}`).join('; ')}` : '',
    trackers.length ? `Relevant trackers: ${trackers.map((entry) => `${entry.label}=${entry.kind === 'state' ? entry.state : entry.value}`).join('; ')}` : '',
    notes.length ? `Pinned notes: ${notes.map((entry) => `${entry.title}: ${entry.body.slice(0, 240)}`).join('; ')}` : '',
  ].filter(Boolean).join('\n').slice(0, 4_800)
}

export async function buildRoleplayContext(options: {
  state: PhoneState
  contact: PocketContact
  conversation: PocketConversation
  preferences: DevicePreferences
  getMessages?: () => Promise<HostMessage[]>
}): Promise<string> {
  const { state, contact, conversation, preferences } = options
  const mode = preferences.roleplayContextMode
  if (mode === 'off') return ''
  const parts: string[] = []
  const wantsRecent = mode === 'recent' || (mode === 'smart' && (
    conversation.messages.length > 0 || contact.presence.inScene || Boolean(contact.sceneNote)
  ))
  if (wantsRecent && preferences.recentRoleplayMessages > 0 && options.getMessages) {
    const messages = await options.getMessages().catch(() => [])
    const recent = messages.slice(-preferences.recentRoleplayMessages).map((message) => {
      const role = message.role === 'user' ? 'User' : message.role === 'assistant' ? 'Character' : 'System'
      return `${role}: ${clean(message.content, 900)}`
    }).filter((line) => !line.endsWith(': ')).join('\n').slice(-6_000)
    if (recent) parts.push(`RECENT ROLEPLAY\n${recent}`)
  }
  if (mode === 'story' || mode === 'smart') {
    const story = storyContext(state, contact)
    if (story) parts.push(`STORY CONTEXT\n${story}`)
  }
  return parts.join('\n\n').slice(0, 8_000)
}
