export type PocketIconName =
  | 'signal'
  | 'wifi'
  | 'battery'
  | 'back'
  | 'video'
  | 'plus'
  | 'send'
  | 'lock'
  | 'message'
  | 'chatOutline'
  | 'phone'
  | 'phoneEnd'
  | 'missed'
  | 'mute'
  | 'speaker'
  | 'play'
  | 'pause'
  | 'transcript'

const SVG_NS = 'http://www.w3.org/2000/svg'

const STROKE_PATHS: Partial<Record<PocketIconName, string[]>> = {
  back: ['m15 18-6-6 6-6'],
  video: [
    'M15 10l4.6-2.6A1 1 0 0 1 21 8.3v7.4a1 1 0 0 1-1.4.9L15 14',
    'M3 6.5h12v11H3z',
  ],
  plus: ['M12 5v14', 'M5 12h14'],
  send: ['M12 19V5', 'm6 11 6-6 6 6'],
  chatOutline: [
    'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z',
  ],
  phone: [
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z',
  ],
  missed: ['M17 7 7 17', 'M17 17H7V7'],
  mute: [
    'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z',
    'M19 10v2a7 7 0 0 1-14 0v-2',
    'm3 3 18 18',
  ],
  speaker: [
    'M11 5 6 9H3v6h3l5 4V5Z',
    'M15.5 8.5a5 5 0 0 1 0 7',
    'M18.5 6a8.5 8.5 0 0 1 0 12',
  ],
  transcript: ['M4 6h16', 'M4 12h16', 'M4 18h10'],
}

const FILL_PATHS: Partial<Record<PocketIconName, string>> = {
  message: 'M12 3C6.5 3 2 6.8 2 11.5c0 2.5 1.2 4.7 3.2 6.3L4 21.5l4.2-1.8c1.2.4 2.5.6 3.8.6 5.5 0 10-3.8 10-8.8S17.5 3 12 3Z',
  phoneEnd: 'M22.7 15.2c-.8-.8-2-1.5-3.4-2-1.1-.4-2.3-.6-3.4-.6-.6 0-1.1.4-1.3.9l-.6 1.5c-1.3-.3-2.7-.3-4 0l-.6-1.5c-.2-.5-.7-.9-1.3-.9-1.1 0-2.3.2-3.4.6-1.4.5-2.6 1.2-3.4 2-.5.5-.6 1.3-.2 1.9l1.2 1.8c.4.6 1.2.8 1.9.5l2.5-1.1c.6-.3.9-.9.9-1.5v-.7c1.4-.2 2.8-.2 4.2 0v.7c0 .6.3 1.2.9 1.5l2.5 1.1c.7.3 1.5.1 1.9-.5l1.2-1.8c.4-.6.3-1.4-.2-1.9Z',
  play: 'M7 5.2v13.6a1 1 0 0 0 1.5.85l10.6-6.8a1 1 0 0 0 0-1.7L8.5 4.35A1 1 0 0 0 7 5.2Z',
}

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v))
  return node
}

/** Shared inline SVG icons for Pocket handsets, scene cards, call screens, and voice pills. */
export function pocketIcon(name: PocketIconName, className = ''): SVGSVGElement {
  const isBattery = name === 'battery'
  const svg = svgEl('svg', {
    viewBox: isBattery ? '0 0 28 14' : '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.9',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    ...(className ? { class: className } : {}),
  })

  if (name === 'signal') {
    for (const [x, y, w, h] of [[3, 15, 3, 5], [8, 12, 3, 8], [13, 8, 3, 12], [18, 5, 3, 15]]) {
      svg.append(svgEl('rect', { x, y, width: w, height: h, rx: 1, fill: 'currentColor', stroke: 'none' }))
    }
    return svg
  }

  if (name === 'wifi') {
    for (const d of ['M3 9.5a14.5 14.5 0 0 1 18 0', 'M6.8 13.2a9 9 0 0 1 10.4 0', 'M10.4 16.8a3.4 3.4 0 0 1 3.2 0']) {
      svg.append(svgEl('path', { d }))
    }
    svg.append(svgEl('circle', { cx: 12, cy: 20, r: 1, fill: 'currentColor', stroke: 'none' }))
    return svg
  }

  if (name === 'battery') {
    svg.append(
      svgEl('rect', { x: 1, y: 2, width: 22, height: 10, rx: 2.5, stroke: 'currentColor', 'stroke-width': 1.5, opacity: '.75' }),
      svgEl('rect', { x: 3, y: 4, width: 15, height: 6, rx: 1.2, fill: 'currentColor', stroke: 'none' }),
      svgEl('path', { d: 'M25 5v4', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: '.75' }),
    )
    return svg
  }

  if (name === 'lock') {
    svg.append(
      svgEl('rect', { x: 5, y: 11, width: 14, height: 10, rx: 2 }),
      svgEl('path', { d: 'M8 11V7a4 4 0 0 1 8 0v4' }),
    )
    return svg
  }

  if (name === 'pause') {
    svg.append(
      svgEl('rect', { x: 6, y: 5, width: 4, height: 14, rx: 1, fill: 'currentColor', stroke: 'none' }),
      svgEl('rect', { x: 14, y: 5, width: 4, height: 14, rx: 1, fill: 'currentColor', stroke: 'none' }),
    )
    return svg
  }

  if (name === 'video') {
    svg.append(
      svgEl('path', { d: STROKE_PATHS.video![0] }),
      svgEl('rect', { x: 3, y: 6.5, width: 12, height: 11, rx: 2 }),
    )
    return svg
  }

  const fill = FILL_PATHS[name]
  if (fill) {
    svg.append(svgEl('path', { d: fill, fill: 'currentColor', stroke: 'none' }))
    return svg
  }

  for (const d of STROKE_PATHS[name] || []) {
    svg.append(svgEl('path', { d }))
  }
  return svg
}
