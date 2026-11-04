import { button, el } from '../shared.js'

export function trackerMenu(anchor: HTMLButtonElement, select: (id: string) => void, dismissed: () => void): () => void {
  const menu = el('div', 'lp-tracker-menu')
  menu.id = `tracker-menu-${globalThis.crypto.randomUUID()}`
  menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Tracker actions')
  anchor.setAttribute('aria-expanded', 'true'); anchor.setAttribute('aria-controls', menu.id)
  let closed = false
  const close = (restoreFocus = false) => {
    if (closed) return
    closed = true; menu.remove(); anchor.setAttribute('aria-expanded', 'false'); anchor.removeAttribute('aria-controls')
    document.removeEventListener('pointerdown', outside, true); dismissed()
    if (restoreFocus && anchor.isConnected) anchor.focus({ preventScroll: true })
  }
  const outside = (event: Event) => { if (!menu.contains(event.target as Node) && !anchor.contains(event.target as Node)) close() }
  for (const [label, id] of [['Add new tracker', '__templates'], ['Settings', '__settings']]) {
    const item = button(label, 'lp-tracker-menu-item'); item.setAttribute('role', 'menuitem'); item.tabIndex = -1
    item.addEventListener('click', () => { close(); select(id) }); menu.append(item)
  }
  menu.addEventListener('keydown', event => {
    const items = [...menu.querySelectorAll('button')], index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true) }
    else if (event.key === 'Tab') close(true)
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length]?.focus()
    }
  })
  anchor.parentElement!.append(menu); document.addEventListener('pointerdown', outside, true); menu.querySelector('button')?.focus()
  return () => close()
}
