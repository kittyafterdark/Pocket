import type { DevicePreferences, PhoneMessage } from '../../types.js'
import { VoiceMessagePlayer } from './voice-message.js'

type SpeechSession = { ready: Promise<void>; result: Promise<{ text: string }>; stop(): Promise<unknown>; cancel(): void }
type SpeechApi = {
  listProviders?(): Array<{ id: string; name: string; available: boolean; onDevice?: boolean }>
  start(options?: { provider?: string; continuous?: boolean; onStatus?(status: { phase: string }): void }): SpeechSession
}
interface CallUiHost {
  root: HTMLElement
  player: VoiceMessagePlayer
  preferences(): DevicePreferences
  send(type: string, payload: Record<string, unknown>): string
  speech?: SpeechApi
  roleplay(): void
}
const STYLES = `
.lp-live-call{position:absolute;inset:0;z-index:70;display:flex;flex-direction:column;gap:12px;padding:22px 16px 28px;background:#050609;color:#faf9ff;border-radius:inherit;overflow:auto;box-sizing:border-box;font:14px/1.5 system-ui,sans-serif;overscroll-behavior:contain}
.lp-live-call *{box-sizing:border-box}.lp-live-call button,.lp-live-call textarea,.lp-live-call select{font:inherit;color:inherit;background:#23232e;border:1px solid #5e5c70;border-radius:12px;padding:10px;min-height:44px}.lp-live-call button{cursor:pointer}.lp-live-call button:disabled{opacity:.5;cursor:default}.lp-live-call button:focus-visible,.lp-live-call textarea:focus-visible,.lp-live-call select:focus-visible{outline:2px solid #c4adff;outline-offset:2px}
.lp-call-stage{position:relative;min-height:160px;flex:1;display:flex;align-items:flex-end;justify-content:center;border-radius:18px;background:radial-gradient(ellipse at top,#242236,#08090e 70%);overflow:hidden}.lp-call-stage[data-video=true]{min-height:220px}.lp-call-stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center top}.lp-call-caption{position:relative;z-index:1;width:100%;padding:18px;background:#08090eea;white-space:pre-wrap;overflow-wrap:anywhere;max-height:45vh;overflow:auto}.lp-call-stage[data-video=true] .lp-call-caption{margin:12px;width:calc(100% - 24px);border:1px solid #6a607a;border-radius:16px;background:#15121deb}.lp-call-title{font-size:22px;margin:0}.lp-call-status{font-size:12px;color:#c4bed3;min-height:20px}.lp-call-input{width:100%;resize:vertical;min-height:72px}.lp-call-choices,.lp-call-actions{display:flex;gap:8px;flex-wrap:wrap}.lp-call-choices button{flex:1 1 100%;text-align:left}.lp-live-call .lp-call-hangup{background:#a92d49;border-color:#d65a74}.lp-call-controls{display:grid;gap:10px}.lp-call-controls [hidden],.lp-live-call [hidden]{display:none!important}.lp-live-call .lp-voice-transcript{display:none}.lp-call-mode{display:flex;align-items:center;gap:10px}.lp-call-mode select{flex:1}.lp-call-history{font-size:12px;color:#d2c9e1;white-space:pre-wrap}.lp-call-error{color:#ffc6d3;white-space:pre-wrap}.lp-call-reply{color:#c1afd9;font-size:12px;white-space:pre-wrap}
`
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); node.className = className; node.textContent = text; return node
}
export class LiveCallUi {
  private root?: HTMLElement
  private scope?: { chatId: string; characterId: string; conversationId: string; deviceOwnerActorId: string }
  private callId = ''
  private requests = new Map<string, string>()
  private session?: SpeechSession
  private generation = 0
  private returnFocus?: HTMLElement
  private caption?: HTMLElement
  private image?: HTMLImageElement
  private stage?: HTMLElement
  private status?: HTMLElement
  private error?: HTMLElement
  private choices?: HTMLElement
  private playback?: HTMLElement
  private input?: HTMLTextAreaElement
  private retry?: HTMLButtonElement
  private record?: HTMLButtonElement
  private speechProvider?: HTMLSelectElement
  private controls?: HTMLElement
  private ready = false
  private busy = false
  private mode: 'voice' | 'video' = 'voice'
  private expressions: Record<string, string> = {}
  private current?: PhoneMessage
  private history: PhoneMessage[] = []
  private voiceOperation = 0
  constructor(private host: CallUiHost) {}
  get active(): boolean { return Boolean(this.root) }
  start(scope: NonNullable<LiveCallUi['scope']>, mode: 'voice' | 'video', callId = ''): void {
    if (this.root) { this.root.focus(); return }
    this.scope = scope; this.mode = mode; this.callId = callId; this.ready = false; this.current = undefined; this.history = []; this.expressions = {}
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
    this.root = element('section', 'lp-live-call'); this.root.tabIndex = -1; this.root.setAttribute('role', 'dialog'); this.root.setAttribute('aria-modal', 'true'); this.root.setAttribute('aria-label', mode === 'video' ? 'Pocket video call' : 'Pocket phone call')
    const style = element('style'); style.textContent = STYLES
    const title = element('h2', 'lp-call-title', mode === 'video' ? 'Video call' : 'Phone call'); title.dataset.callTitle = 'true'
    this.status = element('div', 'lp-call-status', 'Connecting…'); this.status.setAttribute('role', 'status')
    this.stage = element('div', 'lp-call-stage'); this.image = element('img'); this.image.hidden = true; this.image.alt = 'Character expression'
    this.image.addEventListener('error', () => { if (this.stage) this.stage.dataset.video = 'false'; if (this.image) this.image.hidden = true; if (this.status) this.status.textContent = 'Video interrupted · voice call continues' })
    this.caption = element('div', 'lp-call-caption', 'Waiting for the character to answer…'); this.caption.setAttribute('aria-live', 'polite'); this.stage.append(this.image, this.caption)
    this.error = element('div', 'lp-call-error'); this.error.setAttribute('role', 'alert')
    this.playback = element('div')
    this.controls = element('div', 'lp-call-controls')
    const modeLabel = element('label', 'lp-call-mode', 'Reply with')
    const selector = element('select'); selector.setAttribute('aria-label', 'Call reply method')
    for (const [value, text] of [['vn', 'Suggested replies'], ['type', 'Type a reply'], ['stt', 'Speech to text']]) { const option = element('option', '', text); option.value = value; selector.append(option) }
    this.choices = element('div', 'lp-call-choices')
    this.input = element('textarea', 'lp-call-input'); this.input.placeholder = 'Your spoken reply…'; this.input.setAttribute('aria-label', 'Your call reply'); this.input.maxLength = 4000
    this.record = element('button', '', 'Start microphone'); this.record.type = 'button'
    this.record.disabled = !this.host.speech
    if (!this.host.speech) this.record.title = 'Speech to text needs a host with the speech API and Pocket’s Media permission.'
    this.record.addEventListener('click', () => this.recordSpeech())
    const providerLabel = element('label', 'lp-call-mode', 'Speech provider')
    this.speechProvider = element('select'); this.speechProvider.setAttribute('aria-label', 'Call speech provider')
    const automatic = element('option', '', 'Voice & Speech setting'); automatic.value = ''; this.speechProvider.append(automatic)
    const providers = this.host.speech?.listProviders?.() || []
    for (const provider of providers) { const option = element('option', '', `${provider.name}${provider.onDevice ? ' · on device' : ''}`); option.value = provider.id; option.disabled = !provider.available; this.speechProvider.append(option) }
    if (providers.some(row => row.id === 'whistle' && row.available)) this.speechProvider.value = 'whistle'
    providerLabel.append(this.speechProvider)
    const send = element('button', '', 'Say this'); send.type = 'button'; send.addEventListener('click', () => this.reply(this.input!.value))
    this.input.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); send.click() } })
    const switchMode = () => { this.cancelSpeech(); this.choices!.hidden = selector.value !== 'vn'; this.input!.hidden = selector.value === 'vn'; send.hidden = selector.value === 'vn'; this.record!.hidden = selector.value !== 'stt'; providerLabel.hidden = selector.value !== 'stt' }
    selector.addEventListener('change', switchMode); modeLabel.append(selector); switchMode()
    this.controls.append(modeLabel, this.choices, providerLabel, this.record, this.input, send)
    const actions = element('div', 'lp-call-actions')
    this.retry = element('button', '', 'Retry reply'); this.retry.type = 'button'; this.retry.hidden = true; this.retry.addEventListener('click', () => this.request(this.ready ? 'lumiphone:call_reply' : 'lumiphone:call_start', {}))
    const hangup = element('button', 'lp-call-hangup', 'End call'); hangup.type = 'button'; hangup.addEventListener('click', () => this.close())
    const transcript = element('details'); transcript.append(element('summary', '', 'Call transcript')); const history = element('div', 'lp-call-history'); history.dataset.callHistory = 'true'; transcript.append(history)
    actions.append(this.retry, hangup)
    this.root.append(style, title, this.status, this.stage, this.playback, this.error, this.controls, actions, transcript)
    this.root.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(); return }
      if (event.key === 'Tab') {
        const controls = [...this.root!.querySelectorAll<HTMLElement>('button:not(:disabled),textarea,select,summary')].filter(node => !node.hidden && node.getClientRects().length)
        const first = controls[0], last = controls.at(-1)
        if (event.shiftKey && (document.activeElement === first || document.activeElement === this.root)) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    })
    this.host.root.append(this.root); this.root.focus()
    this.request(callId ? 'lumiphone:call_resume' : 'lumiphone:call_start', {})
  }
  private request(type: string, payload: Record<string, unknown>): void {
    if (!this.scope || !this.root || this.busy) return
    this.busy = true; this.error!.textContent = ''; this.retry!.hidden = true; this.setBusy(true)
    const id = this.host.send(type, { ...this.scope, callId: this.callId, mode: this.mode, ...payload }); this.requests.set(id, type)
  }
  private setBusy(value: boolean): void {
    this.busy = value
    for (const control of this.controls?.querySelectorAll<HTMLButtonElement | HTMLTextAreaElement>('button,textarea') || []) control.disabled = value || !this.ready || (control === this.record && !this.host.speech)
    if (this.status) this.status.textContent = value ? (this.ready ? 'Listening for a reply…' : 'Connecting…') : 'Connected · reply when you’re ready'
  }
  receive(payload: Record<string, any>): void {
    if (!this.root || !this.scope) return
    if (payload.type === 'lumiphone:error' && this.requests.has(payload.requestId)) { this.error!.textContent = payload.error; this.retry!.hidden = false; this.setBusy(false); return }
    if (payload.type === 'lumiphone:call_ready' && this.requests.has(payload.requestId) && payload.chatId === this.scope.chatId && payload.characterId === this.scope.characterId) {
      this.callId = payload.callId; this.ready = true; this.expressions = payload.video ? payload.expressions : {}; this.stage!.dataset.video = String(Boolean(payload.video))
      this.root.querySelector('[data-call-title]')!.textContent = payload.name
      this.image!.alt = `${payload.name}’s expression`
      this.history = payload.turns || []
      this.refreshHistory()
      const last = [...this.history].reverse().find(row => row.sender === 'contact')
      if (this.requests.get(payload.requestId) === 'lumiphone:call_resume') {
        this.setBusy(false)
        if (last) this.showTurn(last, false)
        else { this.caption!.textContent = 'Connected. Choose Retry reply to hear the character.'; this.retry!.hidden = false }
      }
      return
    }
    if (payload.callId !== this.callId) return
    if (payload.type === 'lumiphone:call_turn' && this.requests.has(payload.requestId)) {
      if (!this.history.some(row => row.id === payload.message.id)) this.history.push(payload.message)
      this.refreshHistory(); this.setBusy(false); this.showTurn(payload.message, true, payload.ended === true)
    }
    if (payload.type === 'lumiphone:call_ended') this.close(false)
  }
  private refreshHistory(): void { const history = this.root?.querySelector('[data-call-history]'); if (history) history.textContent = this.history.map(row => `${row.senderName}: ${row.text}`).join('\n\n') }
  private showTurn(message: PhoneMessage, autoplay: boolean, ended = false): void {
    this.current = message; this.caption!.textContent = message.text
    const image = this.expressions[message.callTurn?.expression || ''] || Object.values(this.expressions)[0]
    this.image!.hidden = !image; if (image) this.image!.src = image
    const preferences = this.host.preferences()
    // Calls are explicitly started by the player and always speak; the separate voice-message setting does not mute calls.
    const player = this.host.player.render({ ...message, id: `call:${message.id}` }, preferences.ttsVoiceURI, true, preferences.ttsConnectionId, preferences.ttsConnectionOptions?.[preferences.ttsConnectionId || ''], 'call')
    this.playback!.replaceChildren(player)
    this.choices!.replaceChildren()
    for (const choice of message.callTurn?.choices || []) { const button = element('button', '', choice); button.type = 'button'; button.addEventListener('click', () => this.reply(choice)); this.choices!.append(button) }
    if (!this.choices!.childElementCount) { const type = element('button', '', 'Write your reply'); type.addEventListener('click', () => { const selector = this.root!.querySelector('select')!; selector.value = 'type'; selector.dispatchEvent(new Event('change')); this.input!.focus() }); this.choices!.append(type) }
    if (ended) { this.controls!.hidden = true; this.status!.textContent = 'The character said goodbye'; player.addEventListener('pocket-voice-ended', () => this.close(), { once: true }) }
    if (autoplay) queueMicrotask(() => { if (this.root && this.current?.id === message.id) player.querySelector<HTMLButtonElement>('button')?.click() })
  }
  private reply(text: string): void {
    const spoken = text.trim(); if (!spoken || this.busy || !this.ready) return
    this.cancelSpeech(); this.host.player.stop(); this.input!.value = ''
    this.history.push({ id: `local:${Date.now()}`, text: spoken, sender: 'persona', senderName: 'You', senderAccent: '', createdAt: '', read: true, status: 'read' }); this.refreshHistory()
    this.request('lumiphone:call_reply', { text: spoken })
  }
  private recordSpeech(): void {
    if (this.session) { this.record!.disabled = true; void this.session.stop().catch(error => { if (this.error) this.error.textContent = error.message }); return }
    if (!this.host.speech || this.busy) return
    this.host.player.stop(); const token = ++this.voiceOperation
    try {
      const session = this.host.speech.start({ provider: this.speechProvider?.value || undefined, continuous: true, onStatus: status => { if (token === this.voiceOperation && this.status) this.status.textContent = `Microphone · ${status.phase}` } })
      this.session = session; this.record!.textContent = 'Stop microphone'
      void session.ready.catch(() => {})
      void session.result.then(result => { if (token === this.voiceOperation && this.input) this.input.value = result.text }).catch(error => { if (token === this.voiceOperation && this.error && error.name !== 'AbortError') this.error.textContent = error.message }).finally(() => {
        if (token !== this.voiceOperation) return
        this.session = undefined; if (this.record) { this.record.textContent = 'Start microphone'; this.record.disabled = false }; if (this.status) this.status.textContent = 'Review your transcript, then choose Say this'
      })
    } catch (error) { this.error!.textContent = error instanceof Error ? error.message : 'Could not start the microphone.' }
  }
  private cancelSpeech(): void { ++this.voiceOperation; this.session?.cancel(); this.session = undefined; if (this.record) { this.record.textContent = 'Start microphone'; this.record.disabled = !this.host.speech } }
  close(notify = true): void {
    if (!this.root) return
    if (notify && this.scope) this.host.send('lumiphone:call_end', { ...this.scope, callId: this.callId })
    this.cancelSpeech(); this.host.player.stop(); this.root.remove(); this.root = undefined; this.scope = undefined; this.requests.clear(); this.busy = false; ++this.generation
    this.returnFocus?.focus(); this.returnFocus = undefined
  }
}
