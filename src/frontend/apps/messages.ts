import type { PhoneState, PocketConversation } from '../../types.js'
import { button, el, formatTime, inputValue } from '../shared.js'
import type { PageAction } from '../shared.js'

type Page = { page: HTMLDivElement; content: HTMLDivElement }

export interface MessagesViewHost {
  state: PhoneState
  selectedConversationId: string
  selectedMessageId: string
  selectedView: 'thread' | 'new-group' | 'group-detail'
  generationAvailable: boolean
  busyConversations: Map<string, string>
  page(title: string, subtitle?: string, action?: PageAction): Page
  empty(title: string, copy: string): HTMLDivElement
  iconButton(name: string, label: string): HTMLButtonElement
  selectConversation(conversationId: string, view?: 'thread' | 'new-group' | 'group-detail'): void
  openContact(contactId: string): void
  send(type: string, payload?: Record<string, unknown>): void
  generateReply(conversationId: string, speakerContactId?: string): void
}

function conversationTitle(state: PhoneState, conversation: PocketConversation): string {
  if (conversation.kind === 'group') return conversation.title || 'Group'
  return state.contacts.find((entry) => entry.id === conversation.participantContactIds[0])?.name || conversation.title || conversation.messages.at(-1)?.senderName || 'Conversation'
}

function groupEditor(host: MessagesViewHost, conversation: PocketConversation | null): HTMLDivElement {
  let saveGroup = () => {}
  const { page, content } = host.page(conversation ? 'Group Details' : 'New Group', 'Choose at least two contacts', { label: 'Save', callback: () => saveGroup() })
  const title = el('input', 'lp-input')
  title.placeholder = 'Group name'
  title.value = conversation?.title || ''
  const choices = el('div', 'lp-contact-checklist')
  const selected = new Set(conversation?.participantContactIds || [])
  for (const contact of host.state.contacts) {
    const row = el('label', 'lp-card lp-row-between')
    const copy = el('span')
    copy.append(el('strong', '', contact.name), el('span', 'lp-copy', contact.role))
    const checkbox = el('input')
    checkbox.type = 'checkbox'; checkbox.value = contact.id; checkbox.checked = selected.has(contact.id)
    row.append(copy, checkbox)
    choices.appendChild(row)
  }
  saveGroup = () => {
    const participantContactIds = [...choices.querySelectorAll<HTMLInputElement>('input:checked')].map((entry) => entry.value)
    host.send(conversation ? 'lumiphone:update_conversation' : 'lumiphone:create_conversation', {
      conversationId: conversation?.id, title: title.value.trim(), participantContactIds,
    })
  }
  content.append(title, choices)
  if (conversation) {
    const remove = button('Delete group', 'lp-button lp-button-danger')
    remove.addEventListener('click', () => host.send('lumiphone:delete', { kind: 'conversation', id: conversation.id }))
    content.appendChild(remove)
  }
  return page
}

export function renderMessagesView(host: MessagesViewHost): HTMLDivElement {
  const selectedConversation = host.state.conversations.find((item) => item.id === host.selectedConversationId) || null
  if (host.selectedView === 'new-group') return groupEditor(host, null)
  if (selectedConversation?.kind === 'group' && host.selectedView === 'group-detail') return groupEditor(host, selectedConversation)

  if (!selectedConversation) {
    const conversations = [...host.state.conversations].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    const { page, content } = host.page('Messages', `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`, {
      label: 'New Group', callback: () => host.selectConversation('', 'new-group'), enabled: host.state.contacts.length >= 2,
    })
    for (const conversation of conversations) {
      const card = el('div', 'lp-card')
      card.dataset.clickable = 'true'; card.tabIndex = 0; card.setAttribute('role', 'button')
      const row = el('div', 'lp-row')
      const titleText = conversationTitle(host.state, conversation)
      const avatar = el('div', 'lp-avatar', conversation.kind === 'group' ? String(conversation.participantContactIds.length) : titleText.slice(0, 1).toUpperCase())
      const directContact = conversation.kind === 'direct' ? host.state.contacts.find((entry) => entry.id === conversation.participantContactIds[0]) : null
      if (directContact?.avatarUrl) {
        const image = el('img'); image.src = directContact.avatarUrl; image.alt = ''; avatar.replaceChildren(image)
      }
      const latest = conversation.messages.at(-1)
      const copy = el('div', 'lp-grow')
      const nameRow = el('div', 'lp-row-between')
      nameRow.append(el('h3', 'lp-title', titleText), el('span', 'lp-copy', latest ? formatTime(latest.createdAt) : ''))
      copy.append(nameRow, el('p', 'lp-copy', latest ? `${conversation.kind === 'group' && latest.sender === 'contact' ? `${latest.senderName}: ` : ''}${latest.text}` : 'Start a conversation'))
      row.append(avatar, copy)
      if (conversation.unread) row.appendChild(el('span', 'lp-unread', String(conversation.unread)))
      card.appendChild(row)
      const open = () => host.selectConversation(conversation.id)
      card.addEventListener('click', open)
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open() } })
      content.appendChild(card)
    }
    if (!conversations.length) content.appendChild(host.empty('No conversations yet', 'Open Contacts to message a character, Council member, or Pocket NPC.'))
    return page
  }

  const conversation = selectedConversation
  const titleText = conversationTitle(host.state, conversation)
  const page = el('div', 'lp-thread')
  const nav = el('header', 'lp-nav')
  const back = button('‹ Back', 'lp-nav-action')
  back.addEventListener('click', () => host.selectConversation(''))
  const title = el('div', 'lp-nav-title', titleText)
  title.appendChild(el('span', 'lp-nav-subtitle', conversation.kind === 'group' ? `${conversation.participantContactIds.length} contacts` : 'Direct message'))
  const info = button('Info', 'lp-nav-action')
  info.addEventListener('click', () => {
    if (conversation.kind === 'group') host.selectConversation(conversation.id, 'group-detail')
    else host.openContact(conversation.participantContactIds[0])
  })
  nav.append(back, title, info)

  const busySpeakerId = host.busyConversations.get(conversation.id) || ''
  const replyBusy = Boolean(busySpeakerId)
  const bubbles = el('div', 'lp-bubbles')
  for (const message of conversation.messages) {
    const bubble = el('div', 'lp-bubble')
    bubble.dataset.messageId = message.id
    bubble.dataset.selected = String(message.id === host.selectedMessageId)
    bubble.dataset.sender = message.sender
    if (conversation.kind === 'group' && message.sender === 'contact') bubble.appendChild(el('strong', 'lp-bubble-sender', message.senderName))
    bubble.append(document.createTextNode(message.text), el('span', 'lp-bubble-time', `${formatTime(message.createdAt)} · ${message.status}`))
    bubbles.appendChild(bubble)
  }
  if (replyBusy) {
    const pending = el('div', 'lp-bubble lp-bubble-pending')
    pending.dataset.sender = 'contact'; pending.setAttribute('role', 'status'); pending.setAttribute('aria-label', 'Contact is typing')
    const dots = el('span', 'lp-typing-dots')
    dots.append(el('i'), el('i'), el('i'))
    pending.appendChild(dots)
    bubbles.appendChild(pending)
  }
  if (!conversation.messages.length) bubbles.appendChild(host.empty('Say hello', 'This thread is private to this Pocket roleplay state.'))

  const compose = el('form', 'lp-compose')
  const sparkle = host.iconButton('sparkle', 'Generate one contact reply')
  sparkle.disabled = !host.generationAvailable || replyBusy
  const speaker = el('select', 'lp-speaker-select')
  if (conversation.kind === 'group') {
    const auto = el('option', '', 'Auto speaker'); auto.value = 'auto'; speaker.appendChild(auto)
    for (const contactId of conversation.participantContactIds) {
      const contact = host.state.contacts.find((entry) => entry.id === contactId)
      if (!contact) continue
      const option = el('option', '', contact.name); option.value = contact.id; speaker.appendChild(option)
    }
    speaker.setAttribute('aria-label', 'Reply speaker')
  } else speaker.hidden = true
  sparkle.addEventListener('click', () => host.generateReply(conversation.id, conversation.kind === 'group' ? speaker.value : conversation.participantContactIds[0]))
  const textarea = el('textarea', 'lp-textarea'); textarea.rows = 1; textarea.placeholder = 'Message…'
  const submit = host.iconButton('send', 'Send message')
  submit.type = 'submit'
  textarea.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
    event.preventDefault()
    compose.requestSubmit()
  })
  compose.append(sparkle, speaker, textarea, submit)
  compose.addEventListener('submit', (event) => {
    event.preventDefault()
    const message = inputValue(textarea)
    if (!message) return
    host.send('lumiphone:action', { action: 'message', payload: { conversationId: conversation.id, text: message, sender: 'persona' } })
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

