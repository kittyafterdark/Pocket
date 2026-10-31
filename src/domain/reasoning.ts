import type { DevicePreferences } from '../types.js'

export const POCKET_REASONING_OPTIONS = [
  ['off', 'Off · recommended for texting'],
  ['inherit', 'Connection default'],
  ['minimal', 'Minimal'],
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
  ['xhigh', 'Extra high'],
  ['max', 'Maximum'],
] as const

export function normalizeReasoningEffort(value: unknown): NonNullable<DevicePreferences['reasoningEffort']> {
  return POCKET_REASONING_OPTIONS.some(([key]) => key === value) ? value as NonNullable<DevicePreferences['reasoningEffort']> : 'off'
}

export function pocketReasoning(value: unknown) {
  const effort = normalizeReasoningEffort(value)
  return effort === 'off' || effort === 'inherit'
    ? { source: effort }
    : { source: 'custom' as const, apiReasoning: true, effort }
}
