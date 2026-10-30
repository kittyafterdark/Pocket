import { button, el } from '../shared.js'
import type { FreeformDirectory, FreeformSession } from '../../domain/freeform.js'

export interface FreeformLockDraft { personaId: string; sessionId: string; name: string }

/** A session chooser, not authentication. It never switches the host Persona. */
export function renderFreeformLock(directory: FreeformDirectory | null, draft: FreeformLockDraft, busy: boolean, error: string, actions: {
  login(session: FreeformSession): void
  create(personaId: string, name: string): void
  refresh(): void
}): HTMLElement {
  const root = el('section', 'pocket-freeform-lock')
  root.setAttribute('aria-label', 'Freeform lock screen')
  const mark = el('span', 'pocket-lock-mark'); mark.setAttribute('aria-hidden', 'true')
  mark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>'
  const heading = el('h2', '', 'Make yourself at home.'); heading.tabIndex = -1
  root.append(mark, el('p', 'pocket-portal-eyebrow', 'FREEFORM'), heading, el('p', 'pocket-portal-intro', 'Your persona. Your own little world. No roleplay chat needed.'))
  if (!directory) {
    root.append(el('p', '', error || 'Loading personas and sessions…'))
    if (error) { const retry = button('Try again', 'pocket-portal-action'); retry.onclick = actions.refresh; root.append(retry) }
    return root
  }
  const persona = el('select'); persona.setAttribute('aria-label', 'Choose persona')
  persona.dataset.freeformField = 'persona'
  persona.append(new Option('Choose a persona', ''))
  for (const entry of directory.personas) persona.append(new Option(entry.name, entry.id))
  const sessions = el('select'); sessions.setAttribute('aria-label', 'Log in to session')
  sessions.dataset.freeformField = 'session'
  const name = el('input'); name.type = 'text'; name.maxLength = 80; name.placeholder = 'A name for this little world'; name.value = draft.name
  name.dataset.freeformField = 'name'
  const label = (text: string, input: HTMLElement) => { const field = el('label', 'pocket-lock-field', text); field.append(input); return field }
  const login = button('Log in to session', 'pocket-portal-action pocket-portal-primary')
  login.dataset.freeformField = 'login'
  const create = button('Create session', 'pocket-portal-action')
  create.dataset.freeformField = 'create'
  const avatar = el('div', 'pocket-lock-avatar'); avatar.setAttribute('aria-hidden', 'true')
  const update = () => {
    const selected = directory.personas.find(entry => entry.id === draft.personaId)
    avatar.replaceChildren(document.createTextNode(selected?.name.slice(0, 1).toUpperCase() || 'P'))
    if (selected?.avatarUrl) { const image = el('img'); image.src = selected.avatarUrl; image.alt = ''; image.onerror = () => image.remove(); avatar.append(image) }
    sessions.replaceChildren(new Option('Choose a session', ''))
    for (const session of directory.sessions.filter(entry => entry.personaId === draft.personaId)) sessions.append(new Option(session.name, session.id))
    sessions.value = draft.sessionId
    if (!sessions.value) draft.sessionId = ''
    persona.value = draft.personaId
    persona.disabled = sessions.disabled = name.disabled = busy
    login.disabled = busy || !draft.sessionId
    create.disabled = busy || !selected || !draft.name.trim()
  }
  persona.onchange = () => { draft.personaId = persona.value; draft.sessionId = ''; update() }
  sessions.onchange = () => { draft.sessionId = sessions.value; login.disabled = busy || !sessions.value }
  name.oninput = () => { draft.name = name.value; create.disabled = busy || !draft.personaId || !draft.name.trim() }
  login.onclick = () => { const session = directory.sessions.find(entry => entry.id === draft.sessionId); if (session) actions.login(session) }
  create.onclick = () => actions.create(draft.personaId, draft.name)
  root.append(avatar, label('Persona', persona), label('Log in to session', sessions), login, el('p', 'pocket-lock-divider', 'OR START SOMETHING NEW'), label('Session name', name), create)
  const status = el('p', 'pocket-lock-status', busy ? 'Opening your Pocket…' : error)
  status.setAttribute('role', error ? 'alert' : 'status'); root.append(status)
  if (!directory.personas.length) root.append(el('p', 'pocket-portal-intro', 'Add a Persona in Lumiverse and enable Personas access, then refresh.'))
  const refresh = button('Refresh personas & sessions', 'pocket-portal-text-action'); refresh.disabled = busy; refresh.onclick = actions.refresh; root.append(refresh)
  refresh.dataset.freeformField = 'refresh'
  update()
  return root
}
