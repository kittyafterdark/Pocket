import type { DevicePreferences, PhoneMessage, PocketContact, PocketVoice } from '../types.js'

export function normalizePocketVoice(raw: unknown): PocketVoice | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const value = raw as Record<string, unknown>
  const clean = (key: string, max = 180) => typeof value[key] === 'string' ? value[key].trim().slice(0, max) : ''
  return { source: value.source === 'custom' || value.source === 'choir' ? value.source : 'default', choirSpeaker: clean('choirSpeaker', 120),
    voiceURI: clean('voiceURI', 500), connectionId: clean('connectionId'), voice: clean('voice'), model: clean('model') }
}

export function resolveVoicePlayback(preferences: DevicePreferences, message: Pick<PhoneMessage, 'sender' | 'senderName'>, contact?: PocketContact, kind: 'message' | 'call' = 'message') {
  const personal = contact?.voicePlayback
  const custom = personal?.source === 'custom'
  const connectionId = custom ? personal.connectionId || '' : preferences.ttsConnectionId || ''
  return { enabled: kind === 'call' || (message.sender === 'persona' ? preferences.readOwnVoiceMessages !== false : preferences.voiceMessages !== false),
    voiceURI: custom ? personal.voiceURI || '' : preferences.ttsVoiceURI || '', connectionId,
    options: custom ? { voice: personal.voice, model: personal.model } : preferences.ttsConnectionOptions?.[connectionId],
    choir: { useChoir: personal?.source === 'choir' || (!custom && preferences.voicePlaybackProvider === 'choir'), speaker: personal?.choirSpeaker || message.senderName } }
}
