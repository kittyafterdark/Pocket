export interface ChoirVoiceProfile { speaker: string; aliases?: string[]; voice: string; route: string; model?: string; excluded?: boolean }
export interface ChoirBridge {
  version: number
  isAvailable(): boolean
  getVoiceProfiles?(): ChoirVoiceProfile[]
  playVoiceMessage?(input: { text: string; speaker: string; signal: AbortSignal; onStatus?(status: { kind: string }): void }): Promise<{ played: number }>
}
export function choirBridge(): ChoirBridge | undefined {
  const bridge = (globalThis as typeof globalThis & { __CHOIR_API__?: ChoirBridge }).__CHOIR_API__
  return bridge?.version === 1 && bridge.isAvailable() ? bridge : undefined
}
export function choirVoiceProfiles(): ChoirVoiceProfile[] {
  try { return choirBridge()?.getVoiceProfiles?.().filter(row => row.speaker && row.voice && !row.excluded) || [] } catch { return [] }
}
