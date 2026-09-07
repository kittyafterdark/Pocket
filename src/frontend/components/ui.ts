import { el } from '../shared.js'

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export interface IdentityBlockOptions {
  name: string
  meta?: string
  description?: string
  className?: string
  prominent?: boolean
  centered?: boolean
}

export function identityBlock(options: IdentityBlockOptions): HTMLDivElement {
  const root = el('div', classes(
    'lp-identity',
    options.prominent && 'lp-identity-prominent',
    options.centered && 'lp-identity-centered',
    options.className,
  ))
  const line = el('div', 'lp-identity-line')
  line.appendChild(el('strong', 'lp-identity-name', options.name))
  if (options.meta) line.appendChild(el('span', 'lp-identity-meta', options.meta))
  root.appendChild(line)
  if (options.description) root.appendChild(el('p', 'lp-identity-description', options.description))
  return root
}

export type StatusTone = 'neutral' | 'accent' | 'success' | 'danger'

export function statusBadge(label: string, tone: StatusTone = 'neutral'): HTMLSpanElement {
  const node = el('span', 'lp-status-badge', label)
  node.dataset.tone = tone
  return node
}

export function actionGroup(className = ''): HTMLDivElement {
  return el('div', classes('lp-actions', className))
}

export interface SectionBlock {
  section: HTMLElement
  body: HTMLDivElement
}

export function sectionBlock(label: string, help = '', className = ''): SectionBlock {
  const section = el('section', classes('lp-section', className))
  const head = el('header', 'lp-section-head')
  head.appendChild(el('div', 'lp-section-label', label))
  if (help) head.appendChild(el('p', 'lp-section-help', help))
  const body = el('div', 'lp-section-body')
  section.append(head, body)
  return { section, body }
}

export function fieldBlock(
  label: string,
  control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  help = '',
): HTMLLabelElement {
  const field = el('label', 'lp-field')
  field.appendChild(el('span', 'lp-field-label', label))
  field.appendChild(control)
  if (help) field.appendChild(el('span', 'lp-field-help', help))
  return field
}

export function controlRow(
  label: string,
  control: HTMLElement,
  help = '',
): HTMLLabelElement {
  const row = el('label', 'lp-card lp-control-row')
  const copy = el('span', 'lp-control-copy')
  copy.appendChild(el('span', 'lp-control-label', label))
  if (help) copy.appendChild(el('span', 'lp-control-help', help))
  row.append(copy, control)
  return row
}
