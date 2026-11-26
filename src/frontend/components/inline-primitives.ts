import { avatarColor, outgoingSurface } from './ui.js'
import { pocketIcon, type PocketIconName } from './pocket-icons.js'
import { buildVoicePill } from './voice-pill.js'

const TRACK_HEIGHTS = [30, 55, 85, 65, 95, 48, 76, 90, 52, 70, 42, 60] as const

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

export function portrait(name: string, className: string, url?: string, color?: string): HTMLSpanElement {
  const avatar = el('span', className, name.trim().slice(0, 1).toUpperCase() || '?')
  avatar.setAttribute('aria-hidden', 'true')
  avatar.style.setProperty('--av-color', color || avatarColor(name))
  if (url) {
    const image = document.createElement('img')
    image.src = url
    image.alt = ''
    avatar.replaceChildren(image)
  }
  return avatar
}

export function appTile(app: 'phone' | 'messages', iconName: PocketIconName = app === 'phone' ? 'phone' : 'message'): HTMLSpanElement {
  const tile = el('span', 'pk-app-tile')
  tile.dataset.app = app
  tile.append(pocketIcon(iconName))
  return tile
}

export function equalizerBars(): HTMLSpanElement {
  const eq = el('span', 'pk-eq')
  eq.setAttribute('aria-hidden', 'true')
  for (let i = 0; i < 5; i++) eq.append(document.createElement('i'))
  return eq
}

export function waveformTrack(quiet = false): HTMLSpanElement {
  const track = el('span', 'pk-standby-track')
  track.setAttribute('aria-hidden', 'true')
  for (const height of TRACK_HEIGHTS) {
    const bar = document.createElement('i')
    bar.style.height = `${quiet ? 28 : height}%`
    track.append(bar)
  }
  return track
}

export function applyFrameTokens(
  frame: HTMLElement,
  options: {
    theme?: string
    accent?: string
    background?: string
    backgroundSize?: string
    backgroundPosition?: string
    textColor?: string
    surfaceColor?: string
  },
): void {
  frame.dataset.theme = options.theme || 'midnight'
  if (options.accent) {
    frame.style.setProperty('--pocket-inline-accent', options.accent)
    frame.style.setProperty('--pk-accent', options.accent)
    frame.style.setProperty('--pk-outgoing', outgoingSurface(options.accent))
  }
  if (options.background) frame.style.setProperty('--pocket-inline-bg', options.background)
  if (options.backgroundSize) frame.style.backgroundSize = options.backgroundSize
  if (options.backgroundPosition) frame.style.backgroundPosition = options.backgroundPosition
  if (options.textColor) frame.style.setProperty('--pocket-inline-text', options.textColor)
  if (options.surfaceColor) frame.style.setProperty('--pocket-inline-surface', options.surfaceColor)
}

export function formatCallDuration(durationSeconds?: number): string {
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds)) return ''
  const total = Math.max(0, Math.round(durationSeconds))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function renderInlineVoiceNode(
  message: { text: string; senderName: string; senderActorId?: string },
  renderInlineVoice?: (message: { text: string; senderName: string; senderActorId?: string }) => HTMLElement,
): HTMLElement {
  if (renderInlineVoice) return renderInlineVoice(message)
  const pill = buildVoicePill({
    text: message.text,
    senderName: message.senderName,
    variant: 'inline',
    expanded: true,
  })
  // Static fixture / controller-free render: playback is unavailable until mounted inside Pocket.
  pill.playButton.disabled = true
  return pill.root
}
