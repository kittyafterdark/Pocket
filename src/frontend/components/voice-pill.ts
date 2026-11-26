import { pocketIcon } from './pocket-icons.js'

const WAVE_HEIGHTS = [45, 75, 55, 95, 65, 85, 40, 78, 92, 52, 68, 88, 50, 62] as const

export type VoicePillVariant = 'dm' | 'inline'

export interface VoicePillRefs {
  root: HTMLDivElement
  playButton: HTMLButtonElement
  statusEl: HTMLSpanElement
  transcriptToggle: HTMLButtonElement
  transcriptEl: HTMLDivElement
  senderName: string
  setPlaying: (playing: boolean) => void
  setTranscriptOpen: (open: boolean) => void
}

export function estimateVoiceDuration(text: string): string {
  const seconds = Math.max(2, Math.min(59, Math.round(text.trim().length / 10)))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Shared Audio Pill UI (waveform, playback control, inline transcript toggle) without raw <details>. */
export function buildVoicePill(options: {
  text: string
  senderName: string
  variant: VoicePillVariant
  expanded?: boolean
}): VoicePillRefs {
  const { text, senderName, variant } = options
  const prefix = variant === 'dm' ? 'lp-voice' : 'pk-voice'

  const root = document.createElement('div')
  root.className = variant === 'dm' ? 'lp-voice-message' : 'pk-voice-pill'

  const bar = document.createElement('div')
  bar.className = `${prefix}-bar`

  const playButton = document.createElement('button')
  playButton.type = 'button'
  playButton.className = `${prefix}-play`
  playButton.setAttribute('aria-pressed', 'false')
  playButton.setAttribute('aria-label', `Play voice message from ${senderName}`)
  playButton.append(pocketIcon('play'))

  const wave = document.createElement('span')
  wave.className = `${prefix}-wave`
  wave.setAttribute('aria-hidden', 'true')
  for (const height of WAVE_HEIGHTS) {
    const stick = document.createElement('i')
    stick.style.height = `${height}%`
    wave.append(stick)
  }

  const duration = document.createElement('span')
  duration.className = `${prefix}-dur`
  duration.textContent = estimateVoiceDuration(text)

  bar.append(playButton, wave, duration)

  const statusEl = document.createElement('span')
  statusEl.className = `${prefix}-status`
  statusEl.setAttribute('role', 'status')

  const transcriptToggle = document.createElement('button')
  transcriptToggle.type = 'button'
  transcriptToggle.className = `${prefix}-transcript-toggle`
  const toggleLabel = document.createElement('span')
  transcriptToggle.append(pocketIcon('transcript'), toggleLabel)

  const transcriptEl = document.createElement('div')
  transcriptEl.className = `${prefix}-transcript`
  const transcriptText = document.createElement('p')
  transcriptText.textContent = text
  transcriptEl.append(transcriptText)

  const setTranscriptOpen = (open: boolean) => {
    transcriptToggle.setAttribute('aria-expanded', String(open))
    toggleLabel.textContent = open ? 'Hide transcript' : 'Transcript'
    transcriptEl.hidden = !open
  }

  const setPlaying = (playing: boolean) => {
    root.classList.toggle('is-playing', playing)
    playButton.setAttribute('aria-pressed', String(playing))
    playButton.setAttribute('aria-label', `${playing ? 'Stop' : 'Play'} voice message from ${senderName}`)
    playButton.replaceChildren(pocketIcon(playing ? 'pause' : 'play'))
  }

  setTranscriptOpen(Boolean(options.expanded))
  transcriptToggle.addEventListener('click', (event) => {
    event.stopPropagation()
    setTranscriptOpen(transcriptToggle.getAttribute('aria-expanded') !== 'true')
  })

  root.append(bar, statusEl, transcriptToggle, transcriptEl)
  return {
    root,
    playButton,
    statusEl,
    transcriptToggle,
    transcriptEl,
    senderName,
    setPlaying,
    setTranscriptOpen,
  }
}
