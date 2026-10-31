import type { PocketResolvedImage, PocketWallpaper } from '../../types.js'
import { button, el } from '../shared.js'
import { disclosure } from './ui.js'
import { showWallpaperGallery } from './wallpaper-gallery.js'

export type PocketImageTarget = 'device-home' | 'device-chat' | 'persona-home' | 'persona-chat' | 'contact-avatar' | 'conversation-chat'

export interface PocketImageControlHost {
  choose(target: PocketImageTarget, mode: 'gallery' | 'upload' | 'url'): void
  change(wallpaper: PocketWallpaper): void
  inherit?():void
  inherited?:boolean
  defaultResolved?:PocketResolvedImage
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
  resolved: PocketResolvedImage,
  host: PocketImageControlHost,
): HTMLElement {
  let current=structuredClone(wallpaper),inherited=host.inherited===true
  const personal=target.startsWith('persona-')
  const change=(next:PocketWallpaper)=>{current=structuredClone(next);inherited=false;host.change(current);sync()}
  const card = el('section', 'lp-wallpaper-control')
  card.dataset.imageTarget = target
  card.setAttribute('aria-label', `${label} wallpaper`)
  const heading = el('div', 'lp-row-between')
  const copy = el('span'); copy.append(el('strong', '', label), el('span', 'lp-copy', resolved.status === 'error' ? `${resolved.sourceLabel} · unavailable` : resolved.sourceLabel))
  const clear = button('Clear background', 'lp-button lp-button-quiet')
  clear.setAttribute('aria-label',`Clear ${label} background`)
  clear.addEventListener('click',()=>change({...current,source:null}))
  const useDefault=personal?button('Use default','lp-button lp-button-quiet'):null
  if(useDefault){useDefault.setAttribute('aria-label',`Use default wallpaper for ${label}`);useDefault.onclick=()=>{current={...current,source:null};inherited=true;if(host.inherit)host.inherit();else host.change(current);sync()}}
  heading.append(copy);if(!personal)heading.append(clear)
  const preview = el('div', 'lp-wallpaper-preview')
  function sync(){
    const image=personal&&inherited?host.defaultResolved:current.source?resolved:undefined,url=image?.url
    clear.disabled=personal?!current.source&&!inherited:!current.source
    if(useDefault)useDefault.disabled=inherited
    preview.dataset.empty=String(!url);preview.dataset.resolutionStatus=image?.status||'empty'
    preview.style.backgroundImage=url?`linear-gradient(rgba(5,4,8,${current.scrim}),rgba(5,4,8,${current.scrim})),url(${JSON.stringify(url)})`:''
    preview.style.backgroundSize=current.fit==='stretch'?'100% 100%':current.fit
    preview.style.backgroundPosition=`${current.focalX*100}% ${current.focalY*100}%`
    preview.textContent=url?'':image?.error||'Top/bottom gradient'
    copy.querySelector('.lp-copy')!.textContent=image?.sourceLabel||(personal&&inherited?'Device default':'Top/bottom gradient')
  }
  sync()
  const modes=el('div','lp-wallpaper-modes');if(useDefault)modes.append(useDefault,clear)
  const actions = el('div', 'lp-wallpaper-actions')
  const presets = button('Pocket Wallpapers', 'lp-button lp-button-quiet lp-wallpaper-presets-button')
  presets.addEventListener('click', () => showWallpaperGallery(presets, current, target.endsWith('chat') ? 'Chat' : 'Home', change))
  actions.append(presets)
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
  fit.addEventListener('change', () => change({ ...current, fit: fit.value as PocketWallpaper['fit'] }))
  const focal = el('div', 'lp-wallpaper-focal')
  focal.append(
    range('Horizontal focus', wallpaper.focalX, (value) => change({ ...current, focalX: value })),
    range('Vertical focus', wallpaper.focalY, (value) => change({ ...current, focalY: value })),
    range('Scrim', wallpaper.scrim, (value) => change({ ...current, scrim: value })),
  )
  card.append(heading, preview);if(useDefault)card.append(modes);card.append(actions, disclosure('Adjust wallpaper', fit, focal))
  return card
}
