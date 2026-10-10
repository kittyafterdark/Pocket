/** Voice messages store a transcript, never generated URLs or provider credentials. */
export function voiceMessage(value: unknown): boolean {
  return value === 'voice'
}
