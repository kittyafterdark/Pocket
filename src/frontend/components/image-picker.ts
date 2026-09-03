import type { PocketWallpaper } from '../../types.js'
import { button, el } from '../shared.js'

export type PocketImageTarget = 'device-home' | 'device-chat' | 'persona-home' | 'persona-chat' | 'contact-avatar'

export interface PocketImageControlHost {
  choose(target: PocketImageTarget, mode: 'gallery' | 'upload' | 'url'): void
  change(wallpaper: PocketWallpaper): void
}

function sourceLabel(wallpaper: PocketWallpaper): string {
  if (!wallpaper.source) return 'Theme gradient'
  if (wallpaper.source.kind === 'gallery') return 'Lumiverse Gallery'
  if (wallpaper.source.kind === 'asset') return 'Uploaded asset'
  return 'Image URL'
}

function range(label: string, value: number, update: (value: number) => void): HTMLLabelElement {
  const node = el('label', 'lp-wallpaper-range')
  node.append(el('span', 'lp-copy', label))
  const input = el('input')
  input.type = 'range'; input.min = '0'; input.max = '1'; input.step = '.01'; input.value = String(value)
  input.addEventListener('input', () => update(Number(input.value)))
  node.appendChild(input)
  return node
}

/** Shared stable-reference image control. Contact/group avatars can reuse this target contract later. */
export function wallpaperImageControl(
  label: string,
  target: PocketImageTarget,
  wallpaper: PocketWallpaper,
  resolvedUrl: string,
  host: PocketImageControlHost,
): HTMLElement {
  const card = el('section', 'lp-wallpaper-control')
  card.dataset.imageTarget = target
  const heading = el('div', 'lp-row-between')
  const copy = el('span'); copy.append(el('strong', '', label), el('span', 'lp-copy', sourceLabel(wallpaper)))
  const clear = button('Clear', 'lp-button lp-button-quiet')
  clear.disabled = !wallpaper.source
  clear.addEventListener('click', () => host.change({ ...wallpaper, source: null }))
  heading.append(copy, clear)
  const preview = el('div', 'lp-wallpaper-preview')
  preview.dataset.empty = String(!resolvedUrl)
  preview.style.backgroundImage = resolvedUrl ? `linear-gradient(rgba(5,4,8,${wallpaper.scrim}),rgba(5,4,8,${wallpaper.scrim})),url(${JSON.stringify(resolvedUrl)})` : ''
  preview.style.backgroundSize = wallpaper.fit === 'stretch' ? '100% 100%' : wallpaper.fit
  preview.style.backgroundPosition = `${wallpaper.focalX * 100}% ${wallpaper.focalY * 100}%`
  preview.textContent = resolvedUrl ? '' : 'Theme background'
  const actions = el('div', 'lp-wallpaper-actions')
  for (const [mode, text] of [['gallery', 'Gallery'], ['upload', 'Upload'], ['url', 'Image URL']] as const) {
    const choose = button(text, 'lp-button lp-button-quiet')
    choose.addEventListener('click', () => host.choose(target, mode))
    actions.appendChild(choose)
  }
  const fit = el('select', 'lp-select')
  for (const value of ['cover', 'contain', 'stretch'] as const) {
    const option = el('option', '', value[0].toUpperCase() + value.slice(1)); option.value = value; option.selected = wallpaper.fit === value; fit.appendChild(option)
  }
  fit.setAttribute('aria-label', `${label} fit`)
  fit.addEventListener('change', () => host.change({ ...wallpaper, fit: fit.value as PocketWallpaper['fit'] }))
  const focal = el('div', 'lp-wallpaper-focal')
  focal.append(
    range('Horizontal focus', wallpaper.focalX, (value) => host.change({ ...wallpaper, focalX: value })),
    range('Vertical focus', wallpaper.focalY, (value) => host.change({ ...wallpaper, focalY: value })),
    range('Scrim', wallpaper.scrim, (value) => host.change({ ...wallpaper, scrim: value })),
  )
  card.append(heading, preview, actions, fit, focal)
  return card
}
