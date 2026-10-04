import type { PhoneState, PocketCallMarker } from '../types.js'

export function assertPersonaAuthorship(state: PhoneState, source: 'model' | 'tag' | 'user', personaSender: boolean): void {
  if (source !== 'user' && personaSender && state.setup.authorship !== 'impersonation') {
    throw new Error('Roleplay mode: only the user can send as the Pocket Persona. Enable Impersonation in this chat to let the model write your side.')
  }
}

export function normalizeCallMarker(value: unknown): PocketCallMarker | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  if (!['connected', 'ended', 'missed'].includes(String(raw.status)) || typeof raw.callId !== 'string' || !raw.callId.trim()) return undefined
  const duration = raw.durationSeconds
  return { callId: raw.callId.trim().slice(0, 180), status: raw.status as PocketCallMarker['status'], speakerphone: raw.speakerphone === true,
    durationSeconds: raw.status === 'ended' && typeof duration === 'number' && Number.isFinite(duration) && duration >= 0 && duration <= 86_400 ? Math.round(duration) : undefined }
}

export function callSummary(call: PocketCallMarker): string {
  return `${call.status === 'connected' ? 'Call connected' : call.status === 'ended' ? 'Call ended' : 'Missed call'}${call.speakerphone ? ' · Speakerphone' : ''}${call.durationSeconds === undefined ? '' : ` · ${Math.floor(call.durationSeconds / 60)}:${String(call.durationSeconds % 60).padStart(2, '0')}`}`
}
