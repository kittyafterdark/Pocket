import type { PhoneMessage } from '../../types.js'
import { synthesizeVoiceMessage } from './tts-connection.js'

/** One player per mounted Pocket surface. Playback always starts with a user gesture. */
export class VoiceMessagePlayer {
  private active?: { button: HTMLButtonElement; status?: HTMLElement; utterance?: SpeechSynthesisUtterance; abort?: AbortController; audio?: HTMLAudioElement; url?: string; timer?: ReturnType<typeof setTimeout> }

  stop(): void {
    if (!this.active) return
    const { button, status, utterance, abort, audio, url, timer } = this.active
    this.active = undefined
    if (utterance) { utterance.onend = utterance.onerror = null; window.speechSynthesis.cancel() }
    abort?.abort(); clearTimeout(timer)
    if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load() }
    if (url) URL.revokeObjectURL(url)
    if (status) status.textContent = ''
    button.textContent = '▶ Play voice message'; button.setAttribute('aria-pressed', 'false')
  }

  render(message: Pick<PhoneMessage, 'text' | 'senderName' | 'senderActorId'>, voiceURI = '', enabled = true, connectionId = '', connectionOptions?: { voice?: string; model?: string }): HTMLElement {
    const container = document.createElement('div'); container.className = 'lp-voice-message'
    const button = document.createElement('button'); button.type = 'button'; button.className = 'lp-voice-play'
    button.textContent = '▶ Play voice message'; button.setAttribute('aria-label', `Play voice message from ${message.senderName}`); button.setAttribute('aria-pressed', 'false')
    const status = document.createElement('span'); status.className = 'lp-voice-status'; status.setAttribute('role', 'status')
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
    button.disabled = !enabled || (!supported && !connectionId)
    if (button.disabled) status.textContent = enabled ? 'Speech playback unavailable in this browser.' : 'Voice playback is disabled in Settings.'
    button.addEventListener('click', () => {
      const same = this.active?.button === button
      this.stop()
      if (same) return
      if (connectionId) {
        const active = { button, status, abort: new AbortController() } as NonNullable<VoiceMessagePlayer['active']>
        this.active = active; button.textContent = '■ Stop voice message'; button.setAttribute('aria-pressed', 'true'); status.textContent = 'Preparing voice message…'
        active.timer = setTimeout(() => { if (this.active === active) { this.stop(); status.textContent = 'TTS generation timed out. Try again.' } }, 90_000)
        void synthesizeVoiceMessage(connectionId, message.text, active.abort!.signal, connectionOptions).then(async blob => {
          if (this.active !== active) return
          clearTimeout(active.timer)
          active.url = URL.createObjectURL(blob); active.audio = new window.Audio(active.url)
          active.audio.onended = () => { if (this.active === active) this.stop() }
          active.audio.onerror = () => { if (this.active === active) { this.stop(); status.textContent = 'Could not play the generated audio. The transcript is available below.' } }
          await active.audio.play()
          if (this.active === active) status.textContent = ''
        }).catch(error => {
          if (this.active !== active) return
          this.stop(); status.textContent = error instanceof Error ? error.message : 'TTS playback failed. The transcript is available below.'
        })
        return
      }
      const utterance = new window.SpeechSynthesisUtterance(message.text)
      const voices = window.speechSynthesis.getVoices()
      let hash = 0; for (const char of message.senderActorId || message.senderName) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
      const defaults = voices.filter(voice => voice.lang.split('-')[0] === (document.documentElement.lang || navigator.language || 'en').split('-')[0])
      const pool = defaults.length ? defaults : voices
      const voice = voices.find(voice => voice.voiceURI === voiceURI) || pool[hash % (pool.length || 1)]
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang }
      this.active = { button, utterance }; status.textContent = ''; button.textContent = '■ Stop voice message'; button.setAttribute('aria-pressed', 'true')
      const finish = () => { if (this.active?.utterance === utterance) { this.active = undefined; button.textContent = '▶ Play voice message'; button.setAttribute('aria-pressed', 'false') } }
      utterance.onend = finish
      utterance.onerror = () => { finish(); status.textContent = 'Could not play this voice message. The transcript is available below.' }
      try { window.speechSynthesis.speak(utterance) } catch { finish(); status.textContent = 'Speech playback failed. Try again.' }
    })
    const transcript = document.createElement('details'); transcript.className = 'lp-voice-transcript'
    const title = document.createElement('summary'); title.textContent = 'Voice message transcript'
    const text = document.createElement('p'); text.textContent = message.text
    transcript.append(title, text); container.append(button, status, transcript); return container
  }
}
