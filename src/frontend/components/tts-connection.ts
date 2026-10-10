/** Uses the signed-in Lumiverse session; provider credentials stay in the host. */
export interface TtsConnection { id: string; name: string; model?: string; voice?: string }
export interface TtsChoice { id: string; label: string }

export async function listTtsConnections(signal: AbortSignal): Promise<TtsConnection[]> {
  const response = await fetch('/api/v1/tts-connections?limit=100', { credentials: 'same-origin', signal })
  if (!response.ok) throw new Error('Could not load Lumiverse TTS connections.')
  const payload = await response.json()
  return (Array.isArray(payload.data) ? payload.data : []).flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return []
    const value = item as Record<string, unknown>
    return typeof value.id === 'string' && typeof value.name === 'string' ? [{ id: value.id, name: value.name,
      model: typeof value.model === 'string' ? value.model : undefined, voice: typeof value.voice === 'string' ? value.voice : undefined }] : []
  })
}

export async function listTtsChoices(connectionId: string, kind: 'models' | 'voices', signal: AbortSignal): Promise<TtsChoice[]> {
  const response = await fetch(`/api/v1/tts-connections/${encodeURIComponent(connectionId)}/${kind}`, { credentials: 'same-origin', signal })
  if (!response.ok) throw new Error('Could not load TTS choices.')
  const payload = await response.json()
  if (payload.error) throw new Error('Could not load TTS choices.')
  return (Array.isArray(payload[kind]) ? payload[kind] : []).flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return []
    const value = item as Record<string, unknown>
    if (typeof value.id !== 'string' || !value.id) return []
    const name = typeof value.label === 'string' ? value.label : typeof value.name === 'string' ? value.name : value.id
    return [{ id: value.id, label: `${name}${typeof value.language === 'string' && value.language ? ` (${value.language})` : ''}` }]
  })
}

export async function synthesizeVoiceMessage(connectionId: string, text: string, signal: AbortSignal, options?: { voice?: string; model?: string }): Promise<Blob> {
  const response = await fetch('/api/v1/tts/synthesize', {
    method: 'POST', credentials: 'same-origin', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connectionId, text, voice: options?.voice || undefined, model: options?.model || undefined }),
  })
  if (!response.ok) throw new Error('The selected TTS connection could not generate audio. Check it in Lumiverse Connections.')
  const blob = await response.blob()
  if (!blob.size || !/^audio\//i.test(blob.type)) throw new Error('The TTS connection did not return playable audio.')
  return blob
}
