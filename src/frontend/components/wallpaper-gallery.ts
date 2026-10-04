import type { PocketWallpaper } from '../../types.js'
import { BUILTIN_WALLPAPERS, builtinWallpaperUrl } from '../../domain/wallpapers.js'
import { button, el } from '../shared.js'
import { showPocketSheet } from './ui.js'

export function showWallpaperGallery(anchor: HTMLElement, wallpaper: PocketWallpaper, targetLabel: string, apply: (wallpaper: PocketWallpaper) => void): void {
  const content = el('div', 'lp-wallpaper-library')
  const preview = el('div', 'lp-wallpaper-library-preview')
  preview.setAttribute('aria-label', 'Wallpaper preview')
  const clock = el('span', 'lp-wallpaper-library-clock', '9:41'); clock.setAttribute('aria-hidden', 'true')
  const caption = el('strong', 'lp-wallpaper-library-caption')
  preview.append(clock, caption)
  const filters = el('div', 'lp-tracker-filters')
  const grid = el('div', 'lp-wallpaper-library-grid')
  const use = button(`Use for ${targetLabel}`)
  let selected = BUILTIN_WALLPAPERS.find(item => wallpaper.source?.kind === 'builtin' && item.id === wallpaper.source.wallpaperId) || BUILTIN_WALLPAPERS[0]
  const select = (item: typeof selected) => {
    selected = item
    preview.style.backgroundImage = `linear-gradient(#0002,#0002),url(${JSON.stringify(builtinWallpaperUrl(item.id))})`
    caption.textContent = item.name
    for (const card of grid.querySelectorAll<HTMLElement>('[data-wallpaper-id]')) card.setAttribute('aria-pressed', String(card.dataset.wallpaperId === item.id))
  }
  for (const collection of ['All', 'Patterns', 'Gradients', 'Scenes']) {
    const filter = button(collection, 'lp-chip'); filter.setAttribute('aria-pressed', String(collection === 'All'))
    filter.addEventListener('click', () => {
      for (const chip of filters.querySelectorAll('button')) chip.setAttribute('aria-pressed', String(chip === filter))
      for (const card of grid.querySelectorAll<HTMLElement>('[data-collection]')) card.hidden = collection !== 'All' && card.dataset.collection !== collection
    })
    filters.append(filter)
  }
  for (const item of BUILTIN_WALLPAPERS) {
    const card = button('', 'lp-wallpaper-library-card'); card.dataset.wallpaperId = item.id; card.dataset.collection = item.collection
    card.setAttribute('aria-label', item.name)
    const art = el('span', 'lp-wallpaper-library-art'); art.style.backgroundImage = `url(${JSON.stringify(builtinWallpaperUrl(item.id))})`; art.setAttribute('aria-hidden', 'true')
    card.append(art, el('span', '', item.name)); card.addEventListener('click', () => select(item)); grid.append(card)
  }
  use.addEventListener('click', () => {
    content.closest('dialog')?.close()
    apply({ ...wallpaper, source: { kind: 'builtin', wallpaperId: selected.id }, fit: 'cover', focalX: .5, focalY: .5, scrim: selected.scrim })
  })
  content.append(preview, filters, grid, use)
  select(selected)
  showPocketSheet(anchor, 'Pocket Wallpapers', content)
}
