import type { PhoneState } from '../../types.js'
import { button, el, formatTime, inputValue } from '../shared.js'

type Page = { page: HTMLDivElement; content: HTMLDivElement }

export interface MessagesViewHost {
  state: PhoneState
  selectedContactId: string
  selectedMessageId: string
  generationAvailable: boolean
  busyContacts: Set<string>
  page(title: string, subtitle?: string): Page
  empty(title: string, copy: string): HTMLDivElement
  iconButton(name: string, label: string): HTMLButtonElement
  selectContact(contactId: string): void
  send(type: string, payload?: Record<string, unknown>): void
  generateReply(contactId: string): void
}

export function renderMessagesView(host: MessagesViewHost): HTMLDivElement {
  const contact = host.state.contacts.find((item) => item.id === host.selectedContactId)
  if (!contact) {
    const { page, content } = host.page('Messages', `${host.state.contacts.length} conversation${host.state.contacts.length === 1 ? '' : 's'}`)
    for (const item of host.state.contacts) {
      const card = el('div', 'lp-card')
      card.dataset.clickable = 'true'
      card.tabIndex = 0
      card.setAttribute('role', 'button')
      const row = el('div', 'lp-row')
      const avatar = el('div', 'lp-avatar', item.name.slice(0, 1).toUpperCase())
      if (item.avatarUrl) {
        const image = el('img'); image.src = item.avatarUrl; image.alt = ''
        avatar.replaceChildren(image)
      }
      const latest = item.messages.at(-1)
      const copy = el('div', 'lp-grow')
      const nameRow = el('div', 'lp-row-between')
      nameRow.append(el('h3', 'lp-title', item.name), el('span', 'lp-copy', latest ? formatTime(latest.createdAt) : ''))
      copy.append(nameRow, el('p', 'lp-copy', latest?.text || item.subtitle || 'Start a conversation'))
      row.append(avatar, copy)
      if (item.unread) row.appendChild(el('span', 'lp-unread', String(item.unread)))
      card.appendChild(row)
      const open = () => host.selectContact(item.id)
      card.addEventListener('click', open)
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open() } })
      content.appendChild(card)
    }
    if (!host.state.contacts.length) content.appendChild(host.empty('No conversations yet', 'A model phone action or your first message will create one.'))
    return page
  }

  const page = el('div', 'lp-thread')
  const nav = el('header', 'lp-nav')
  const back = button('‹ Back', 'lp-nav-action')
  back.addEventListener('click', () => host.selectContact(''))
  const title = el('div', 'lp-nav-title', contact.name)
  title.appendChild(el('span', 'lp-nav-subtitle', contact.subtitle || 'Messages'))
  const replyBusy = host.busyContacts.has(contact.id)
  const generate = button(replyBusy ? 'Writing…' : 'Reply ✦', 'lp-nav-action')
  generate.disabled = !host.generationAvailable || replyBusy
  generate.addEventListener('click', () => host.generateReply(contact.id))
  nav.append(back, title, generate)
  const bubbles = el('div', 'lp-bubbles')
  for (const message of contact.messages) {
    const bubble = el('div', 'lp-bubble', message.text)
    bubble.dataset.messageId = message.id
    bubble.dataset.selected = String(message.id === host.selectedMessageId)
    bubble.dataset.sender = message.sender
    bubble.appendChild(el('span', 'lp-bubble-time', `${formatTime(message.createdAt)} · ${message.status}`))
    bubbles.appendChild(bubble)
  }
  if (replyBusy) {
    const pending = el('div', 'lp-bubble lp-bubble-pending', 'Writing…')
    pending.dataset.sender = 'character'
    bubbles.appendChild(pending)
  }
  if (!contact.messages.length) bubbles.appendChild(host.empty('Say hello', `This conversation belongs to ${host.state.characterName} in this chat.`))
  const compose = el('form', 'lp-compose')
  const sparkle = host.iconButton('sparkle', 'Generate character reply')
  sparkle.disabled = !host.generationAvailable || replyBusy
  sparkle.addEventListener('click', () => host.generateReply(contact.id))
  const textarea = el('textarea', 'lp-textarea'); textarea.rows = 1; textarea.placeholder = 'Message…'
  const submit = host.iconButton('send', 'Send message')
  compose.append(sparkle, textarea, submit)
  compose.addEventListener('submit', (event) => {
    event.preventDefault()
    const message = inputValue(textarea)
    if (!message) return
    host.send('lumiphone:action', { action: 'message', payload: { contactId: contact.id, contactName: contact.name, text: message, sender: 'user' } })
    textarea.value = ''
  })
  page.append(nav, bubbles, compose)
  requestAnimationFrame(() => {
    const selected = host.selectedMessageId ? bubbles.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(host.selectedMessageId)}"]`) : null
    if (selected) selected.scrollIntoView({ block: 'center' })
    else bubbles.scrollTop = bubbles.scrollHeight
  })
  return page
}
