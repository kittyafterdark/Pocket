const inlineAnchor = '[data-pocket-inline-anchor]'
const receiptHost = '.pocket-receipt-host'
const activitySurface = `${inlineAnchor},${receiptHost}`

export function containsSelector(node: Node | null, selector: string): boolean {
  if (node?.nodeType !== 1) return false
  const element = node as Element
  return element.matches(selector) || Boolean(element.querySelector(selector))
}

export function affectsInlineActivity(record: MutationRecord): boolean {
  const target = record.target.nodeType === 1 ? record.target as HTMLElement : record.target.parentElement
  const surface = target?.closest<HTMLElement>(activitySurface)
  if (record.type === 'attributes') return true // The observer only receives anchor identity changes.
  if (surface) {
    // Pocket's own rendering should not schedule a second pass. A host rerender
    // can still clear the contents of a mounted, visible anchor in place.
    return surface === target && surface.matches(inlineAnchor) &&
      surface.dataset.pocketMounted === 'true' && !surface.hidden && !surface.childElementCount
  }
  if (target?.matches(`p:has(> ${inlineAnchor})`)) return true
  // A sibling can split or join a sequence even when it contains only prose.
  let previous = record.previousSibling
  let next = record.nextSibling
  const ignorable = (node: Node) => node.nodeType === 8 || (node.nodeType === 3 && !node.textContent?.trim())
  while (previous && ignorable(previous)) previous = previous.previousSibling
  while (next && ignorable(next)) next = next.nextSibling
  const sequenceSibling = `${activitySurface},p:has(> ${inlineAnchor})`
  const matchesSibling = (node: Node | null) => node?.nodeType === 1 && (node as Element).matches(sequenceSibling)
  if (matchesSibling(previous) || matchesSibling(next)) return true
  return Array.from(record.addedNodes).some(node => containsSelector(node, activitySurface)) ||
    Array.from(record.removedNodes).some(node => containsSelector(node, activitySurface))
}
