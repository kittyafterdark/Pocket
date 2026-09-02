import type { PhoneNotification, PocketRoute } from '../types.js'
import { normalizePocketRoute } from './navigation.js'

export function activeNotifications(notifications: PhoneNotification[]): PhoneNotification[] {
  return notifications.filter((entry) => !entry.dismissedAt)
}

export function routesShareDestination(leftInput: PocketRoute, rightInput: PocketRoute): boolean {
  const left = normalizePocketRoute(leftInput)
  const right = normalizePocketRoute(rightInput)
  if (left.app !== right.app) return false
  if (left.app === 'messages' && right.app === 'messages') {
    return Boolean(left.conversationId && right.conversationId && left.conversationId === right.conversationId)
  }
  if (left.app === 'trackers' && right.app === 'trackers') {
    return Boolean(left.trackerId && right.trackerId && left.trackerId === right.trackerId)
  }
  return left.app !== 'home' && left.app !== 'notifications'
}

export function destinationIsVisible(open: boolean, current: PocketRoute | null | undefined, target: PocketRoute): boolean {
  return Boolean(open && current && routesShareDestination(current, target))
}

export function markNotificationRead(notifications: PhoneNotification[], notificationId: string): void {
  const entry = notifications.find((item) => item.id === notificationId)
  if (entry) entry.read = true
}

export function dismissNotification(notifications: PhoneNotification[], notificationId: string, at: string): void {
  const entry = notifications.find((item) => item.id === notificationId)
  if (entry) entry.dismissedAt = at
}

export function clearNotifications(notifications: PhoneNotification[], mode: 'read' | 'all', at: string): void {
  for (const entry of notifications) {
    if (!entry.dismissedAt && (mode === 'all' || entry.read)) entry.dismissedAt = at
  }
}
