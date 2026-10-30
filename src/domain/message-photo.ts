export interface MessagePhoto {
  prompt: string
  jobId: string
  status: 'pending' | 'ready' | 'failed' | 'cancelled'
  error?: string
}

export function validChatPhotoUpload(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^data:image\/(?:png|jpeg|webp|gif);base64,([a-z0-9+/]*={0,2})$/i.exec(value)
  if (!match || !match[1] || match[1].length % 4) return false
  const padding = match[1].endsWith('==') ? 2 : match[1].endsWith('=') ? 1 : 0
  return match[1].length * 3 / 4 - padding <= 8 * 1024 * 1024
}

export function normalizeMessagePhoto(value: unknown): MessagePhoto | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const prompt = typeof raw.prompt === 'string' ? raw.prompt.trim().slice(0, 4000) : ''
  const jobId = typeof raw.jobId === 'string' ? raw.jobId.trim().slice(0, 180) : ''
  if (!prompt || !jobId) return undefined
  return { prompt, jobId, status: raw.status === 'ready' || raw.status === 'failed' || raw.status === 'cancelled' ? raw.status : 'pending', error: typeof raw.error === 'string' ? raw.error.slice(0, 300) : undefined }
}

export function characterPhotoInstruction(enabled: boolean): string {
  return enabled
    ? 'You may optionally add "imagePrompt":"a concrete description of the photo being sent" to a message when this character would naturally send a picture. Keep the message as its text caption. Describe the subject, appearance, setting, and framing so the photo stands alone. Do not send image URLs. Photos are optional, not required on each reply.'
    : 'Picture generation is disabled. Do not request or claim to send a photo.'
}
