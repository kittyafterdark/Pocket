import { el } from '../shared.js'

/** Static vector artwork only. Tracker text is always inserted with textContent. */
export function trackerVector(viewBox: string, markup: string, className = ''): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', viewBox); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false')
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2'); svg.classList.add('lp-design-vector')
  if (className) svg.classList.add(className)
  svg.innerHTML = markup
  return svg
}

export function trackerArt(kind: 'wave' | 'flame' | 'clipboard' | 'clock' | 'crate' | 'scales' | 'rift' | 'hourglass' | 'radar'): SVGSVGElement {
  const paths = {
    wave: '<path d="M0 30h38l8-12 9 31 8-44 9 50 7-25h20l9-9 9 9h63l8-12 9 31 8-44 9 50 7-25h40"/>',
    flame: '<path d="M25 4c3 14-14 15-11 28-6-3-6-8-5-12C-5 38 13 48 25 44c17-5 18-22 8-30 1 10-3 13-6 13 4-9-1-16-2-23Z" fill="currentColor" stroke="none"/>',
    clipboard: '<rect x="8" y="8" width="32" height="36" rx="4"/><rect x="16" y="3" width="16" height="10" rx="3"/><path d="m14 23 3 3 5-6m4 3h8M14 34h20"/>',
    clock: '<circle cx="24" cy="26" r="18"/><path d="M24 14v12l8 5M17 3h14M24 3v5"/>',
    crate: '<rect x="5" y="9" width="38" height="31" rx="3"/><path d="M5 18h38M16 9v31M32 9v31M19 29h10"/>',
    scales: '<path d="M24 5v37M14 42h20M7 15l17-5 17 5M7 15 1 30h12ZM41 15l-6 15h12Z"/><path d="M1 30q6 9 12 0M35 30q6 9 12 0"/>',
    rift: '<path d="m2 28 8-2 6-16 9 28 5-21 6 14 10-7M23 3l-5 15 10 10-5 17"/>',
    hourglass: '<path d="M10 8h28c0 12-10 14-14 16 4 2 14 6 14 16H10c0-10 10-14 14-16-4-2-14-4-14-16ZM6 6h36M6 42h36"/><path class="lp-sand-stream" d="M24 24v12" stroke-dasharray="2 3"/><path d="m13 37 11-6 11 6Z" fill="currentColor" stroke="none"/>',
    radar: '<circle cx="24" cy="24" r="21"/><circle cx="24" cy="24" r="13"/><circle cx="24" cy="24" r="5"/><path d="M24 3v42M3 24h42" opacity=".3"/><path class="lp-radar-hand" d="M24 24 39 9"/>',
  }[kind]
  return trackerVector(kind === 'wave' ? '0 0 280 60' : '0 0 48 48', paths)
}

export function designBars(count: number, filled: number, className: string): HTMLDivElement {
  const bars = el('div', className); bars.setAttribute('aria-hidden', 'true')
  for (let i = 0; i < count; i++) { const bar = el('span'); bar.dataset.filled = String(i < filled); bars.append(bar) }
  return bars
}

export function trackerLed(value: number): SVGSVGElement {
  const text = String(Number(value.toFixed(2)))
  const segments = ['4,2 20,2 23,5 20,8 4,8 1,5', '21,8 24,5 27,8 27,22 24,25 21,22', '21,28 24,25 27,28 27,42 24,45 21,42', '4,42 20,42 23,45 20,48 4,48 1,45', '0,28 3,25 6,28 6,42 3,45 0,42', '0,8 3,5 6,8 6,22 3,25 0,22', '5,22 19,22 22,25 19,28 5,28 2,25']
  const digits: Record<string, string> = { '0':'012345', '1':'12', '2':'01346', '3':'01236', '4':'1256', '5':'02356', '6':'023456', '7':'012', '8':'0123456', '9':'012356', '-':'6' }
  return trackerVector(`0 0 ${text.length * 34} 50`, [...text].map((character, i) => character === '.' ? `<circle cx="${i * 34 + 5}" cy="45" r="3" fill="currentColor" stroke="none"/>` : `<g transform="translate(${i * 34} 0)" stroke="none">${segments.map((points, index) => `<polygon points="${points}" fill="currentColor" opacity="${digits[character]?.includes(String(index)) ? 1 : .08}"/>`).join('')}</g>`).join(''), 'lp-led-digits')
}

/** Compact, distinct pictograms for the picker and card header. */
export function trackerIcon(t: { kind: string; label?: string; key?: string; presentation?: string; freeText?: boolean }): SVGSVGElement {
  const identity = `${t.presentation || ''} ${t.key || ''} ${t.label || ''}`.toLowerCase()
  let path: string
  if (/vitals|health/.test(identity)) path = '<path d="M24 40 8 25C-3 13 12 3 24 15 36 3 51 13 40 25ZM9 24h9l4-9 5 17 4-8h8"/>'
  else if (/hunger/.test(identity)) return trackerArt('flame')
  else if (/relationship_status|orbit/.test(identity)) path = '<circle cx="17" cy="13" r="6"/><circle cx="34" cy="16" r="5"/><path d="M5 40v-6a12 12 0 0 1 24 0v6ZM30 28a9 9 0 0 1 13 8v4h-9"/>'
  else if (/relationship|trust/.test(identity)) path = '<path d="m20 28 8-8m-10 3-5 5a8 8 0 0 0 11 11l6-6m0-8 5-5A8 8 0 0 0 24 9l-6 6"/>'
  else if (/tension/.test(identity)) path = '<path d="M24 5 45 41H3ZM24 16v13m0 5v2"/>'
  else if (/world/.test(identity)) path = '<circle cx="24" cy="24" r="20"/><ellipse cx="24" cy="24" rx="9" ry="20"/><path d="M4 24h40M8 13h32M8 35h32"/>'
  else if (/sanity|mental/.test(identity)) path = '<path d="M23 40c-7 7-18 1-16-7-7-4-5-15 1-17-2-9 9-15 15-8v32Zm2 0c7 7 18 1 16-7 7-4 5-15-1-17 2-9-9-15-15-8v32ZM13 16l5 5-5 6m22-11-5 5 5 6"/>'
  else if (/alignment/.test(identity)) return trackerArt('scales')
  else if (/ammo/.test(identity)) path = '<path d="M17 17 24 4l7 13v26H17ZM17 19h14M17 36h14"/>'
  else if (/condition/.test(identity)) return trackerArt('clipboard')
  else if (t.kind === 'timer') return trackerArt('clock')
  else if (t.freeText) path = '<path d="M10 4h20l9 9v31H10ZM30 4v10h9M16 22h17M16 29h17M16 36h11"/>'
  else if (t.kind === 'state') path = '<path d="M9 24h30"/><circle cx="8" cy="24" r="5"/><circle cx="24" cy="24" r="5"/><circle cx="40" cy="24" r="5"/>'
  else if (t.kind === 'counter') return trackerArt('crate')
  else path = '<path d="M6 37a20 20 0 0 1 36 0M24 30l11-13M9 35h30"/><circle cx="24" cy="31" r="3"/>'
  return trackerVector('0 0 48 48', path)
}
