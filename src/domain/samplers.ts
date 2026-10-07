import type { DevicePreferences } from '../types.js'

export const SAMPLER_FIELDS = [
  ['temperature', 'Temperature', 0, 2, 0.01],
  ['top_p', 'Top P', 0, 1, 0.01],
  ['top_k', 'Top K', 0, 500, 1],
  ['min_p', 'Min P', 0, 1, 0.01],
  ['frequency_penalty', 'Frequency penalty', 0, 2, 0.01],
  ['presence_penalty', 'Presence penalty', 0, 2, 0.01],
  ['repetition_penalty', 'Repetition penalty', 0, 2, 0.01],
] as const

export function normalizeSamplerOverrides(value: unknown): NonNullable<DevicePreferences['samplerOverrides']> {
  const result: NonNullable<DevicePreferences['samplerOverrides']> = {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result
  const raw = value as Record<string, unknown>
  for (const [key, , min, max, step] of SAMPLER_FIELDS) {
    const entry = raw[key]
    const lower = key === 'frequency_penalty' || key === 'presence_penalty' ? -2 : min
    const upper = key === 'repetition_penalty' ? 3 : max
    if (typeof entry === 'number' && Number.isFinite(entry) && entry >= lower && entry <= upper && (step !== 1 || Number.isInteger(entry))) result[key] = entry
  }
  return result
}
