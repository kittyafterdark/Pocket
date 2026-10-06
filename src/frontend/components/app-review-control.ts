import type { PocketOperationProgress } from '../../types.js'
import { button, el } from '../shared.js'

interface ReviewControlHost {
  chatId: string
  characterId: string
  canGenerate: boolean
  operations: Map<string, PocketOperationProgress>
  scopes: Map<string, string>
  send(type: string, payload: Record<string, unknown>): string
  progress(operation: PocketOperationProgress): void
  render(): void
}

/** UI projection of controller-owned operations; no duplicate operation state. */
export function renderAppReviewControl(host: ReviewControlHost, task: 'weather-week' | 'timeline-review', label: string, type: string): HTMLElement {
  const panel = el('section', 'lp-app-review')
  const scope = JSON.stringify([host.chatId, host.characterId])
  const operation = [...host.operations.values()].reverse().find(entry => entry.task === task && host.scopes.get(entry.requestId) === scope)
  const busy = operation && !['complete', 'error'].includes(operation.phase)
  const action = button(busy ? 'Working…' : label, 'lp-button lp-button-quiet')
  action.disabled = Boolean(busy) || !host.canGenerate
  action.dataset.operationIdle = label
  if (busy) action.dataset.operationAction = operation.requestId
  action.addEventListener('click', () => {
    for (const [key, entry] of host.operations) if (entry.task === task) host.operations.delete(key)
    const operationRequestId = host.send(type, {})
    host.scopes.set(operationRequestId, scope)
    if (host.scopes.size > 100) host.scopes.delete(host.scopes.keys().next().value!)
    host.progress({ task, requestId: operationRequestId, phase: 'request', message: 'Starting…' })
    host.render()
  })
  panel.append(action)
  if (busy) {
    const stop = button('Stop', 'lp-button lp-button-quiet'); stop.dataset.operationStop = operation.requestId
    stop.addEventListener('click', () => { host.send('lumiphone:cancel_app_review', { operationRequestId: operation.requestId }); host.progress({ ...operation, phase: 'error', message: 'Stopped. Your saved data is unchanged.' }) })
    panel.append(stop)
  }
  if (operation) {
    const status = el('div', 'lp-operation-progress')
    const message = el('span', '', operation.message); message.dataset.operationMessage = 'true'; status.append(message)
    status.dataset.operationRequest = operation.requestId; status.dataset.phase = operation.phase; status.setAttribute('role', 'status')
    panel.append(status)
  }
  return panel
}
