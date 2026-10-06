import type { PocketActivity } from '../../types.js'
import type { ActivityRenderOptions } from '../activity.js'
import { isolatedActivity } from './activity-shadow.js'

export interface ActivityConnectorEntry {
  host: Element
  activity: PocketActivity
  options: ActivityRenderOptions
  owner: string
}

/** Fallbacks connect turns; only explicit prose anchors use the selected device presentation. */
export function refreshActivityConnectors(entries: ActivityConnectorEntry[], open: (activity: PocketActivity) => void): void {
  const byHost = new Map(entries.map(entry => [entry.host, entry]))
  const visited = new Set<Element>()
  for (const entry of entries) {
    if (visited.has(entry.host)) continue
    const group: ActivityConnectorEntry[] = [entry]
    const key = connectorKey(entry)
    // Walk actual sibling order, not transport arrival order. Prose, another conversation,
    // another device, or a non-message activity ends an exchange.
    if (key) {
      let previous = adjacent(entry.host, 'previousSibling')
      while (previous && byHost.has(previous) && connectorKey(byHost.get(previous)!) === key) {
        group.unshift(byHost.get(previous)!); previous = adjacent(previous, 'previousSibling')
      }
      let next = adjacent(entry.host, 'nextSibling')
      while (next && byHost.has(next) && connectorKey(byHost.get(next)!) === key) {
        group.push(byHost.get(next)!); next = adjacent(next, 'nextSibling')
      }
    }
    const leader = group[0]
    for (const item of group) { visited.add(item.host); item.host.setAttribute('data-pocket-connector', 'true') }
    const cache = JSON.stringify(group.map(item => [item.activity, item.options, item.owner]))
    leader.host.removeAttribute('hidden')
    if (leader.host.getAttribute('data-pocket-connector-render') !== cache) {
      leader.host.replaceChildren(isolatedActivity(connector(group, open)))
      leader.host.setAttribute('data-pocket-connector-render', cache)
    }
    for (const item of group.slice(1)) {
      item.host.replaceChildren(); item.host.setAttribute('hidden', '')
      item.host.removeAttribute('data-pocket-connector-render')
    }
  }
}

function adjacent(host: Element, direction: 'previousSibling' | 'nextSibling'): Element | null {
  let node = host[direction]
  while (node && (node.nodeType === 8 || (node.nodeType === 3 && !node.textContent?.trim()))) node = node[direction]
  return node?.nodeType === 1 ? node as Element : null
}

function connectorKey(entry: ActivityConnectorEntry): string {
  const { activity } = entry
  if (!entry.owner || activity.kind !== 'message' || activity.route.app !== 'messages') return ''
  const conversation = activity.route.conversationId || activity.source?.conversationId
  return conversation ? JSON.stringify([activity.scope.chatId, activity.scope.characterId, activity.source?.messageId, conversation, entry.owner]) : ''
}

function connector(group: ActivityConnectorEntry[], open: (activity: PocketActivity) => void): HTMLElement {
  const first = group[0]
  const frame = document.createElement('div')
  frame.className = 'pocket-inline-frame'; frame.dataset.pocketUi = 'true'; frame.dataset.appearance = 'connector'
  for (const [token, value] of [['accent', first.options.accent], ['text', first.options.textColor], ['surface', first.options.surfaceColor]]) {
    if (value) frame.style.setProperty(`--pocket-inline-${token}`, value)
  }
  const section = document.createElement('section'); section.className = 'pocket-connector'
  const heading = document.createElement('button'); heading.type = 'button'; heading.className = 'pocket-connector-heading'
  heading.textContent = first.activity.presentation?.conversationTitle || first.activity.title || 'Messages'
  heading.setAttribute('aria-label', `Open ${heading.textContent} in Pocket`)
  heading.addEventListener('click', () => open(group.at(-1)!.activity))
  section.append(heading)
  for (const { activity } of group) {
    const batch = activity.presentation?.batchMessages
    const messages = batch?.length ? batch : [{ senderName: activity.presentation?.senderName || activity.title, senderActorId: activity.presentation?.senderActorId, direction: activity.presentation?.kind === 'sent' ? 'sent' : 'received', text: activity.summary || '', messageId: '' }]
    for (const message of messages) {
      const row = document.createElement('button'); row.type = 'button'; row.className = 'pocket-connector-row'
      row.dataset.direction = message.direction; row.dataset.pocketConnectorActivity = activity.id
      const sender = document.createElement('span'); sender.className = 'pocket-connector-sender'
      sender.textContent = activity.kind === 'call' ? 'Call' : message.senderName
      const body = document.createElement('span'); body.className = 'pocket-connector-copy'; body.textContent = message.text
      row.append(sender, body)
      row.setAttribute('aria-label', `Open ${message.senderName}'s ${activity.kind === 'call' ? 'call' : 'message'} in Pocket`)
      row.addEventListener('click', () => open(message.messageId && activity.route.app === 'messages' ? { ...activity, route: { ...activity.route, messageId: message.messageId } } : activity))
      section.append(row)
    }
  }
  frame.append(section)
  return frame
}
