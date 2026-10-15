import type { DevicePreferences, PocketVoice } from '../../types.js'
import { defaultPreferences } from '../../domain/preferences.js'
import { choirBridge, choirVoiceProfiles } from './choir-bridge.js'
import { ttsSettings } from './tts-settings.js'
import { button, el } from '../shared.js'
import { fieldBlock } from './ui.js'

export function contactVoiceSettings(initial: PocketVoice | undefined, name: string, onCleanup?: (cleanup: () => void) => void) {
  let voice: PocketVoice = structuredClone(initial || { source: 'default' })
  const root = el('section', 'lp-card'), source = el('select', 'lp-select'), speaker = el('select', 'lp-select')
  for (const [value, label] of [['default', 'Pocket default'], ['custom', 'Choose a voice'], ['choir', 'Use Choir voice']]) { const row = el('option', '', label); row.value = value; source.append(row) }
  source.setAttribute('aria-label', 'Contact voice source'); speaker.setAttribute('aria-label', 'Contact Choir speaker')
  const custom = el('div'), choir = el('div'), status = el('p', 'lp-copy'), copy = button('Copy voice from Choir', 'lp-button lp-button-quiet')
  let cleanups: Array<() => void> = []
  const stopCustom = () => { for (const cleanup of cleanups.splice(0)) cleanup() }
  const refreshSpeakers = () => {
    const profiles = choirVoiceProfiles(), selected = voice.choirSpeaker || name
    choir.hidden = voice.source !== 'choir' && profiles.length === 0
    speaker.replaceChildren()
    for (const profile of profiles) { const row = el('option', '', `${profile.speaker} · ${profile.voice}`); row.value = profile.speaker; speaker.append(row) }
    if (!profiles.some(row => row.speaker === selected)) { const saved = el('option', '', `${selected} · choose its voice in Choir`); saved.value = selected; speaker.append(saved) }
    speaker.value = selected; copy.disabled = !profiles.some(row => row.speaker === selected)
    status.textContent = choirBridge()?.playVoiceMessage ? 'Choir uses this speaker’s current voice and delivery settings.' : 'Enable Choir to use or copy its saved voices.'
  }
  const render = () => {
    source.value = voice.source; custom.hidden = voice.source !== 'custom'; stopCustom(); custom.replaceChildren()
    if (voice.source === 'custom') {
      let settings: DevicePreferences = { ...defaultPreferences(), ttsVoiceURI: voice.voiceURI || '', ttsConnectionId: voice.connectionId || '', ttsConnectionOptions: voice.connectionId ? { [voice.connectionId]: { voice: voice.voice, model: voice.model } } : {} }
      custom.append(ttsSettings(() => settings, mutate => { mutate(settings); const selected = settings.ttsConnectionOptions?.[settings.ttsConnectionId || '']; voice = { ...voice, source: 'custom', connectionId: settings.ttsConnectionId, voiceURI: settings.ttsVoiceURI, voice: selected?.voice, model: selected?.model } }, cleanup => cleanups.push(cleanup), 'Contact'))
    }
    refreshSpeakers()
  }
  source.addEventListener('change', () => { voice.source = source.value as PocketVoice['source']; render() })
  speaker.addEventListener('change', () => { voice.choirSpeaker = speaker.value; refreshSpeakers() })
  copy.addEventListener('click', () => {
    const profile = choirVoiceProfiles().find(row => row.speaker === speaker.value)
    if (!profile) return
    voice = profile.route.startsWith('native:') ? { source: 'custom', connectionId: profile.route.slice(7), voice: profile.voice, model: profile.model, choirSpeaker: profile.speaker } : { source: 'choir', choirSpeaker: profile.speaker }
    render(); status.textContent = voice.source === 'custom' ? `Copied ${profile.speaker}’s voice. Save the contact to keep it.` : 'This voice uses Choir’s provider. Save the contact to keep it linked.'
  })
  const available = () => refreshSpeakers()
  window.addEventListener('choir-available-v1', available); window.addEventListener('choir-unavailable-v1', available)
  onCleanup?.(() => { stopCustom(); window.removeEventListener('choir-available-v1', available); window.removeEventListener('choir-unavailable-v1', available) })
  choir.append(fieldBlock('Choir speaker', speaker))
  // Keep the speaker selector available for copying without changing the current voice source.
  root.append(el('div', 'lp-eyebrow', 'Voice'), fieldBlock('Voice source', source), custom, choir, copy, status)
  render()
  return { element: root, value: () => structuredClone(voice) }
}
