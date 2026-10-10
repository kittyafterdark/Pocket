import type { DevicePreferences } from '../../types.js'
import { el } from '../shared.js'
import { fieldBlock } from './ui.js'
import { listTtsChoices, listTtsConnections, type TtsChoice, type TtsConnection } from './tts-connection.js'

export function ttsSettings(getSettings: () => DevicePreferences, commit: (mutate: (next: DevicePreferences) => void) => void, onCleanup?: (cleanup: () => void) => void): HTMLElement {
  const panel = el('div')
  const connection = el('select', 'lp-select'); connection.setAttribute('aria-label', 'Voice message TTS connection')
  const status = el('p', 'lp-copy', 'Loading Lumiverse TTS connections…')
  const provider = el('div'), browser = el('div')
  const models = el('select', 'lp-select'); models.setAttribute('aria-label', 'Voice message TTS model')
  const voices = el('select', 'lp-select'); voices.setAttribute('aria-label', 'Voice message provider voice')
  const browserVoices = el('select', 'lp-select'); browserVoices.setAttribute('aria-label', 'Voice message TTS voice')
  let connections: TtsConnection[] = [], disposed = false, request: AbortController | undefined
  const abort = new AbortController()
  onCleanup?.(() => { disposed = true; abort.abort(); request?.abort() })
  const option = (value: string, label: string) => { const item = el('option', '', label); item.value = value; return item }
  const populate = (select: HTMLSelectElement, choices: TtsChoice[], value: string, label: string) => {
    select.replaceChildren(option('', label))
    for (const choice of choices) select.append(option(choice.id, choice.label))
    if (value && !choices.some(choice => choice.id === value)) select.append(option(value, `Saved choice · ${value}`))
    select.value = value
  }
  const populateConnections = () => {
    const id = getSettings().ttsConnectionId || ''
    connection.replaceChildren(option('', 'Browser voices · installed on this device'))
    for (const item of connections) connection.append(option(item.id, item.name))
    if (id && !connections.some(item => item.id === id)) connection.append(option(id, 'Saved connection · currently unavailable'))
    connection.value = id
  }
  const populateProvider = () => {
    request?.abort()
    const id = getSettings().ttsConnectionId || ''
    provider.hidden = !id; browser.hidden = Boolean(id)
    if (!id) return
    const current = connections.find(item => item.id === id)
    const defaults = { models: `Connection default${current?.model ? ` · ${current.model}` : ''}`, voices: `Connection default${current?.voice ? ` · ${current.voice}` : ''}` }
    const saved = getSettings().ttsConnectionOptions?.[id]
    populate(models, [], saved?.model || '', defaults.models)
    populate(voices, [], saved?.voice || '', defaults.voices)
    models.disabled = voices.disabled = true
    status.textContent = 'Loading models and voices…'
    const pending = new AbortController(); request = pending
    const load = async (kind: 'models' | 'voices', select: HTMLSelectElement) => {
      try {
        const choices = await listTtsChoices(id, kind, pending.signal)
        if (disposed || request !== pending || getSettings().ttsConnectionId !== id) return false
        populate(select, choices, getSettings().ttsConnectionOptions?.[id]?.[kind === 'models' ? 'model' : 'voice'] || '', defaults[kind])
        select.disabled = false
        return true
      } catch {
        if (!disposed && request === pending) select.disabled = false
        return false
      }
    }
    void Promise.all([load('models', models), load('voices', voices)]).then(results => {
      if (disposed || request !== pending || getSettings().ttsConnectionId !== id) return
      status.textContent = results.every(Boolean) ? 'Your choices apply only to Pocket. On Play, the transcript is sent to this TTS provider.' : 'Some choices could not be loaded. Connection defaults and saved choices remain available; check the connection in Lumiverse.'
    })
  }
  populateConnections(); populateProvider()
  void listTtsConnections(abort.signal).then(items => {
    if (disposed) return
    connections = items; populateConnections(); populateProvider()
    if (!getSettings().ttsConnectionId) status.textContent = items.length ? 'Choose a TTS connection, then its model and voice. On Play, the transcript is sent to that provider.' : 'Add a TTS connection in Lumiverse Connections, or use installed browser voices.'
  }).catch(() => { if (!disposed) status.textContent = 'Lumiverse TTS connections are unavailable on this host. Browser voices are still available.' })
  connection.addEventListener('change', () => {
    commit(next => { next.ttsConnectionId = connection.value }); populateProvider()
    if (!connection.value) status.textContent = 'Browser voices use the languages installed on this device.'
  })
  for (const [select, key] of [[models, 'model'], [voices, 'voice']] as const) select.addEventListener('change', () => {
    const id = getSettings().ttsConnectionId
    if (id) commit(next => { next.ttsConnectionOptions = { ...next.ttsConnectionOptions, [id]: { ...next.ttsConnectionOptions?.[id], [key]: select.value } } })
  })
  const synthesis = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined
  const populateBrowser = () => {
    const available = synthesis?.getVoices() || []
    populate(browserVoices, available.map(item => ({ id: item.voiceURI, label: `${item.name} (${item.lang})` })), getSettings().ttsVoiceURI || '', 'Automatic · consistent voice per character')
  }
  populateBrowser()
  if (synthesis && onCleanup) { synthesis.addEventListener('voiceschanged', populateBrowser); onCleanup(() => synthesis.removeEventListener('voiceschanged', populateBrowser)) }
  browserVoices.addEventListener('change', () => commit(next => { next.ttsVoiceURI = browserVoices.value }))
  provider.append(fieldBlock('TTS model', models), fieldBlock('TTS voice', voices))
  browser.append(fieldBlock('Browser voice', browserVoices), el('p', 'lp-copy', 'Automatic selection follows the app language and keeps a stable voice per character. Languages depend on installed voices; use a TTS connection if the needed language is unavailable.'))
  panel.append(fieldBlock('Playback TTS', connection), provider, browser, status, el('p', 'lp-copy', 'No audio plays automatically. Stop or close Pocket to cancel playback.'))
  return panel
}
