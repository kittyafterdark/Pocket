import type { PhoneState, PocketCallMarker } from '../types.js'

export function assertPersonaAuthorship(state: PhoneState, source: 'model' | 'tag' | 'user', personaSender: boolean): void {
  if (source !== 'user' && personaSender && state.setup.authorship !== 'impersonation') {
    throw new Error('Roleplay mode: only the user can send as the Pocket Persona. Enable Impersonation in this chat to let the model write your side.')
  }
}

export function normalizeCallMarker(value: unknown): PocketCallMarker | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  if ((!['connected', 'ended', 'missed'].includes(String(raw.status)) && !(raw.status === 'ringing' && raw.interactive === true)) || typeof raw.callId !== 'string' || !raw.callId.trim()) return undefined
  const duration = raw.durationSeconds
  const follow = raw.followUp && typeof raw.followUp === 'object' ? raw.followUp as Record<string, unknown> : null
  const followUp = raw.interactive === true && follow && (follow.when === 'now' || follow.when === 'later') && typeof follow.text === 'string' && follow.text.trim()
    ? { when: follow.when, text: follow.text.trim().slice(0, 1_000), status: follow.status === 'sent' || follow.status === 'cancelled' ? follow.status : 'pending', availabilityKey: typeof follow.availabilityKey === 'string' ? follow.availabilityKey.slice(0, 4_000) : '' } as NonNullable<PocketCallMarker['followUp']> : undefined
  return { callId: raw.callId.trim().slice(0, 180), status: raw.status as PocketCallMarker['status'], speakerphone: raw.speakerphone === true,
    mode: raw.mode === 'video' ? 'video' : raw.mode === 'voice' ? 'voice' : undefined, interactive: raw.interactive === true || undefined, followUp,
    outcome: raw.status === 'missed' && (raw.outcome === 'declined' || raw.outcome === 'ignored') || raw.status === 'ended' && raw.outcome === 'cancelled' ? raw.outcome as PocketCallMarker['outcome'] : undefined,
    durationSeconds: raw.status === 'ended' && typeof duration === 'number' && Number.isFinite(duration) && duration >= 0 && duration <= 86_400 ? Math.round(duration) : undefined }
}

export function callSummary(call: PocketCallMarker): string {
  const label = call.outcome === 'declined' ? 'Call declined' : call.outcome === 'ignored' ? 'No answer' : call.outcome === 'cancelled' ? 'Call cancelled' : call.status === 'ringing' ? 'Calling…' : call.status === 'connected' ? 'Call connected' : call.status === 'ended' ? 'Call ended' : 'Missed call'
  return `${label}${call.speakerphone ? ' · Speakerphone' : ''}${call.durationSeconds === undefined ? '' : ` · ${Math.floor(call.durationSeconds / 60)}:${String(call.durationSeconds % 60).padStart(2, '0')}`}`
}
