import type { PhoneNotification, PocketRoute } from '../../types.js'
import { activeNotifications } from '../../domain/notifications.js'
import { button, el, formatTime } from '../shared.js'
import type { PageAction } from '../shared.js'

type Page = { page: HTMLDivElement; content: HTMLDivElement }

export interface NotificationsViewHost {
  notifications: PhoneNotification[]
  page(title: string, subtitle?: string, action?: PageAction): Page
  navigate(route: PocketRoute): void
  send(type: string, payload?: Record<string, unknown>): void
}

function sameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
}

function notificationRow(host: NotificationsViewHost, notification: PhoneNotification): HTMLDivElement {
  const row = el('div', 'lp-card lp-notification-row')
  row.dataset.read = String(notification.read)
  row.dataset.severity = notification.severity || 'info'
  const open = button('', 'lp-notification-open')
  const copy = el('span', 'lp-grow')
  copy.append(el('strong', '', notification.title), el('span', 'lp-copy', notification.body), el('time', 'lp-copy', formatTime(notification.createdAt)))
  open.appendChild(copy)
  open.setAttribute('aria-label', `Open ${notification.title}`)
  open.addEventListener('click', () => {
    host.send('lumiphone:notification_mark_read', { notificationId: notification.id })
    host.navigate(notification.route || { app: notification.app })
  })
  const dismiss = button('×', 'lp-notification-dismiss')
  dismiss.setAttribute('aria-label', `Dismiss ${notification.title}`)
  dismiss.addEventListener('click', () => host.send('lumiphone:notification_dismiss', { notificationId: notification.id }))
  row.append(open, dismiss)
  return row
}

export function renderNotificationsView(host: NotificationsViewHost): HTMLDivElement {
  const notifications = activeNotifications(host.notifications).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const unread = notifications.filter((entry) => !entry.read).length
  const { page, content } = host.page('Notification Center', unread ? `${unread} unread` : 'All caught up', { label: notifications.length ? 'Clear' : '', enabled: Boolean(notifications.length), callback: () => host.send('lumiphone:notifications_clear', { mode: 'all' }) })
  if (notifications.some((entry) => entry.read)) {
    const clearRead = button('Clear read notifications', 'lp-button lp-button-quiet')
    clearRead.addEventListener('click', () => host.send('lumiphone:notifications_clear', { mode: 'read' }))
    content.appendChild(clearRead)
  }
  const today: PhoneNotification[] = []
  const earlier: PhoneNotification[] = []
  const now = new Date()
  for (const entry of notifications) (sameDay(new Date(entry.createdAt), now) ? today : earlier).push(entry)
  for (const [label, entries] of [['Today', today], ['Earlier', earlier]] as const) {
    if (!entries.length) continue
    const group = el('section', 'lp-notification-group')
    group.appendChild(el('div', 'lp-eyebrow', label))
    for (const entry of entries) group.appendChild(notificationRow(host, entry))
    content.appendChild(group)
  }
  if (!notifications.length) content.appendChild(el('p', 'lp-notification-empty', 'No notifications. Messages, trackers, notes, and timeline data remain in their apps.'))
  return page
}
