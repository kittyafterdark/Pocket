import type { PhoneMessage } from '../../types.js'
import { synthesizeVoiceMessage } from './tts-connection.js'
import { choirBridge } from './choir-bridge.js'

function setPlaybackButton(button: HTMLButtonElement, playing: boolean): void {
  const label = (playing ? button.dataset.voiceStopLabel : button.dataset.voicePlayLabel) || '▶ Play voice message'
  if (button.dataset.voiceIcon === 'true') {
    button.innerHTML = playing
      ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg>'
  } else button.textContent = label
  const accessibleLabel = `${label.replace(/^[▶■]\s*/, '')} from ${button.dataset.voiceSender}`
  button.setAttribute('aria-label', accessibleLabel); button.title = accessibleLabel
  button.setAttribute('aria-pressed', String(playing))
}

/** One player per mounted Pocket surface. Playback always starts with a user gesture. */
export class VoiceMessagePlayer {
  private static current?: VoiceMessagePlayer
  private views = new Map<string, { signature: string; element: HTMLElement }>()
  private active?: { button: HTMLButtonElement; status?: HTMLElement; utterance?: SpeechSynthesisUtterance; abort?: AbortController; audio?: HTMLAudioElement; url?: string; timer?: ReturnType<typeof setTimeout> }

  stopIfDetached(): void { if (this.active && !this.active.button.isConnected) this.stop() }

  stop(): void {
    if (!this.active) return
    const { button, status, utterance, abort, audio, url, timer } = this.active
    this.active = undefined
    if (utterance) { utterance.onend = utterance.onerror = null; window.speechSynthesis.cancel() }
    abort?.abort(); clearTimeout(timer)
    if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load() }
    if (url) URL.revokeObjectURL(url)
    if (status) status.textContent = ''
    setPlaybackButton(button, false)
  }

  render(message: Pick<PhoneMessage, 'text' | 'senderName' | 'senderActorId'> & { id?: string }, voiceURI = '', enabled = true, connectionId = '', connectionOptions?: { voice?: string; model?: string }, kind: 'message' | 'call' = 'message', choir?: { useChoir: boolean; speaker: string }): HTMLElement {
    const playLabel = kind === 'call' ? '▶ Replay spoken turn' : '▶ Play voice message'
    const stopLabel = kind === 'call' ? '■ Stop speech' : '■ Stop voice message'
    const signature = JSON.stringify([message.text, message.senderName, message.senderActorId, voiceURI, enabled, connectionId, connectionOptions, kind, choir])
    if (message.id && this.views.get(message.id)?.signature === signature) return this.views.get(message.id)!.element
    const container = document.createElement('div'); container.className = 'lp-voice-message'
    // Inline cards can open their conversation on click; playback and transcript controls own their clicks.
    container.addEventListener('click', event => event.stopPropagation())
    const button = document.createElement('button'); button.type = 'button'; button.className = 'lp-voice-play'
    button.dataset.voicePlayLabel = playLabel
    button.dataset.voiceStopLabel = stopLabel; button.dataset.voiceSender = message.senderName
    button.dataset.voiceIcon = String(kind === 'call'); setPlaybackButton(button, false)
    const status = document.createElement('span'); status.className = 'lp-voice-status'; status.setAttribute('role', 'status')
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
    button.disabled = !enabled || (!supported && !connectionId && !choir?.useChoir)
    button.hidden = !enabled
    if (button.disabled) status.textContent = enabled ? 'Speech playback unavailable in this browser.' : 'Voice playback is disabled in Settings.'
    button.addEventListener('click', () => {
      if (VoiceMessagePlayer.current && VoiceMessagePlayer.current !== this) VoiceMessagePlayer.current.stop()
      VoiceMessagePlayer.current = this
      const same = this.active?.button === button
      this.stop()
      if (same) return
      if (choir?.useChoir) {
        const bridge = choirBridge()
        if (!bridge?.playVoiceMessage) { status.textContent = 'Choir is unavailable. Enable it or choose Pocket playback in Settings.'; return }
        const active = { button, status, abort: new AbortController() } as NonNullable<VoiceMessagePlayer['active']>
        this.active = active; setPlaybackButton(button, true); status.textContent = 'Preparing speech with Choir…'
        active.timer = setTimeout(() => { if (this.active === active) { this.stop(); status.textContent = 'Choir playback timed out. Try again.' } }, 90_000)
        void bridge.playVoiceMessage({ text: message.text, speaker: choir.speaker, signal: active.abort!.signal, onStatus: update => {
          if (this.active === active) status.textContent = update.kind === 'loading' ? 'Preparing speech with Choir…' : ''
        } }).then(result => {
          if (this.active !== active) return
          this.stop()
          if (!result.played) { status.textContent = 'No Choir voice is enabled for this speaker.'; return }
          container.dispatchEvent(new (container.ownerDocument.defaultView!.Event)('pocket-voice-ended'))
        }).catch(error => {
          if (this.active !== active) return
          this.stop(); status.textContent = error instanceof Error ? error.message : 'Choir playback failed.'
          container.dispatchEvent(new (container.ownerDocument.defaultView!.Event)('pocket-voice-error'))
        })
        return
      }
      if (connectionId) {
        const active = { button, status, abort: new AbortController() } as NonNullable<VoiceMessagePlayer['active']>
        this.active = active; setPlaybackButton(button, true); status.textContent = kind === 'call' ? 'Preparing speech…' : 'Preparing voice message…'
        active.timer = setTimeout(() => { if (this.active === active) { this.stop(); status.textContent = 'TTS generation timed out. Try again.' } }, 90_000)
        void synthesizeVoiceMessage(connectionId, message.text, active.abort!.signal, connectionOptions).then(async blob => {
          if (this.active !== active) return
          clearTimeout(active.timer)
          active.url = URL.createObjectURL(blob); active.audio = new window.Audio(active.url)
          active.audio.onended = () => { if (this.active === active) { this.stop(); container.dispatchEvent(new (container.ownerDocument.defaultView!.Event)('pocket-voice-ended')) } }
          active.audio.onerror = () => { if (this.active === active) { this.stop(); status.textContent = 'Could not play the generated audio. The transcript is available below.'; container.dispatchEvent(new (container.ownerDocument.defaultView!.Event)('pocket-voice-error')) } }
          await active.audio.play()
          if (this.active === active) status.textContent = ''
        }).catch(error => {
          if (this.active !== active) return
          this.stop(); status.textContent = error instanceof Error ? error.message : 'TTS playback failed. The transcript is available below.'; container.dispatchEvent(new (container.ownerDocument.defaultView!.Event)('pocket-voice-error'))
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
      this.active = { button, utterance }; status.textContent = ''; setPlaybackButton(button, true)
      const finish = () => { if (this.active?.utterance === utterance) { this.active = undefined; setPlaybackButton(button, false) } }
      utterance.onend = () => { finish(); container.dispatchEvent(new (container.ownerDocument.defaultView!.Event)('pocket-voice-ended')) }
      utterance.onerror = () => { finish(); status.textContent = 'Could not play this voice message. The transcript is available below.'; container.dispatchEvent(new (container.ownerDocument.defaultView!.Event)('pocket-voice-error')) }
      try { window.speechSynthesis.speak(utterance) } catch { finish(); status.textContent = 'Speech playback failed. Try again.' }
    })
    const transcript = document.createElement('details'); transcript.className = 'lp-voice-transcript'
    const title = document.createElement('summary'); title.textContent = 'Voice message transcript'
    const text = document.createElement('p'); text.textContent = message.text
    transcript.append(title, text); container.append(button, status, transcript)
    if (message.id) {
      this.views.set(message.id, { signature, element: container })
      if (this.views.size > 300) this.views.delete(this.views.keys().next().value!)
    }
    return container
  }
}
