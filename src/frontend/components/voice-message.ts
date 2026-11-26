import type { PhoneMessage } from '../../types.js'
import { synthesizeVoiceMessage } from './tts-connection.js'
import { buildVoicePill, type VoicePillVariant } from './voice-pill.js'

/** One player per mounted Pocket surface. Playback always starts with a user gesture. */
export class VoiceMessagePlayer {
  private active?: {
    button: HTMLButtonElement
    setPlaying: (playing: boolean) => void
    status?: HTMLElement
    utterance?: SpeechSynthesisUtterance
    abort?: AbortController
    audio?: HTMLAudioElement
    url?: string
    timer?: ReturnType<typeof setTimeout>
  }

  stop(): void {
    if (!this.active) return
    const { setPlaying, status, utterance, abort, audio, url, timer } = this.active
    this.active = undefined
    if (utterance) { utterance.onend = utterance.onerror = null; window.speechSynthesis.cancel() }
    abort?.abort()
    clearTimeout(timer)
    if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load() }
    if (url) URL.revokeObjectURL(url)
    if (status) status.textContent = ''
    setPlaying(false)
  }

  render(
    message: Pick<PhoneMessage, 'text' | 'senderName' | 'senderActorId'>,
    voiceURI = '',
    enabled = true,
    connectionId = '',
    connectionOptions?: { voice?: string; model?: string },
    pillOptions?: { variant?: VoicePillVariant; defaultTranscriptOpen?: boolean },
  ): HTMLElement {
    const pill = buildVoicePill({
      text: message.text,
      senderName: message.senderName,
      variant: pillOptions?.variant || 'dm',
      expanded: pillOptions?.defaultTranscriptOpen,
    })
    const { root: container, playButton: button, statusEl: status, setPlaying, setTranscriptOpen } = pill

    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
    button.disabled = !enabled || (!supported && !connectionId)
    if (button.disabled) {
      status.textContent = enabled ? 'Speech playback unavailable in this browser.' : 'Voice playback is disabled in Settings.'
      setTranscriptOpen(true)
    }

    button.addEventListener('click', (event) => {
      event.stopPropagation()
      const same = this.active?.button === button
      this.stop()
      if (same) return

      if (connectionId) {
        const active: NonNullable<VoiceMessagePlayer['active']> = { button, setPlaying, status, abort: new AbortController() }
        this.active = active
        setPlaying(true)
        status.textContent = 'Preparing voice message…'
        active.timer = setTimeout(() => {
          if (this.active !== active) return
          this.stop()
          status.textContent = 'TTS generation timed out. Try again.'
          setTranscriptOpen(true)
        }, 90_000)

        void synthesizeVoiceMessage(connectionId, message.text, active.abort!.signal, connectionOptions).then(async (blob) => {
          if (this.active !== active) return
          clearTimeout(active.timer)
          active.url = URL.createObjectURL(blob)
          active.audio = new window.Audio(active.url)
          active.audio.onended = () => { if (this.active === active) this.stop() }
          active.audio.onerror = () => {
            if (this.active !== active) return
            this.stop()
            status.textContent = 'Could not play the generated audio. The transcript is available below.'
            setTranscriptOpen(true)
          }
          await active.audio.play()
          if (this.active === active) status.textContent = ''
        }).catch((error) => {
          if (this.active !== active) return
          this.stop()
          status.textContent = error instanceof Error ? error.message : 'TTS playback failed. The transcript is available below.'
          setTranscriptOpen(true)
        })
        return
      }

      const utterance = new window.SpeechSynthesisUtterance(message.text)
      const voices = window.speechSynthesis.getVoices()
      let hash = 0
      for (const char of message.senderActorId || message.senderName) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
      const defaults = voices.filter((voice) => voice.lang.split('-')[0] === (document.documentElement.lang || navigator.language || 'en').split('-')[0])
      const pool = defaults.length ? defaults : voices
      const voice = voices.find((candidate) => candidate.voiceURI === voiceURI) || pool[hash % (pool.length || 1)]
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang }

      this.active = { button, setPlaying, utterance }
      status.textContent = ''
      setPlaying(true)

      const finish = () => {
        if (this.active?.utterance === utterance) {
          this.active = undefined
          setPlaying(false)
        }
      }
      utterance.onend = finish
      utterance.onerror = () => {
        finish()
        status.textContent = 'Could not play this voice message. The transcript is available below.'
        setTranscriptOpen(true)
      }
      try {
        window.speechSynthesis.speak(utterance)
      } catch {
        finish()
        status.textContent = 'Speech playback failed. Try again.'
        setTranscriptOpen(true)
      }
    })

    return container
  }
}
