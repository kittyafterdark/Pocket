import type { PhoneTracker, TrackerJevConfig, TrackerJevResult, PocketJevSettings } from '../types.js'
import { applyTrackerOperation } from './trackers.js'

export const OPEN_JEV_ENDPOINT = 'https://pngwn-open-jev.hf.space'
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
export function normalizeJevSettings(value: unknown): PocketJevSettings {
  const raw = object(value) ? value : {}
  let endpoint = clean(raw.endpoint, 500) || OPEN_JEV_ENDPOINT
  try { const url = new URL(endpoint); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error(); endpoint = url.href.replace(/\/$/, '') } catch { endpoint = OPEN_JEV_ENDPOINT }
  return { enabled: raw.enabled === true, endpoint, autoAfterTurn: raw.autoAfterTurn === true }
}
export function normalizeJevConfig(value: unknown): TrackerJevConfig {
  const raw = object(value) ? value : {}
  const levels = (Array.isArray(raw.levels) ? raw.levels : []).flatMap(entry => object(entry) && typeof entry.value === 'number' && Number.isFinite(entry.value) && clean(entry.label, 160) ? [{ value: entry.value, label: clean(entry.label, 160) }] : []).slice(0, 10)
  return { question: clean(raw.question, 240), levels, minConfidence: typeof raw.minConfidence === 'number' && Number.isFinite(raw.minConfidence) ? Math.min(1, Math.max(0, raw.minConfidence)) : .65 }
}
export function validateJevTracker(tracker: Record<string, unknown>): void {
  const raw = object(tracker.jev) ? tracker.jev : {}
  const config = normalizeJevConfig(raw)
  if (!config.question || String(raw.question).trim().length > 240) throw new Error('Give JEV a short question (up to 240 characters).')
  if (tracker.kind === 'timer' || tracker.kind === 'counter') throw new Error('JEV estimates values and states. Quantities and timers use exact updates.')
  if (typeof raw.minConfidence !== 'number' || raw.minConfidence < 0 || raw.minConfidence > 1 || !Number.isFinite(raw.minConfidence)) throw new Error('JEV confidence must be between 0 and 1.')
  if (tracker.kind === 'state') {
    if (!Array.isArray(tracker.states) || tracker.states.length < 2 || tracker.states.length > 16) throw new Error('JEV needs between 2 and 16 allowed states.')
  } else {
    if (!Array.isArray(raw.levels) || raw.levels.length < 2 || raw.levels.length > 10 || config.levels.length !== raw.levels.length) throw new Error('JEV needs 2–10 described numeric levels.')
    if (config.levels.some((level, index) => level.value < Number(tracker.min) || level.value > Number(tracker.max) || index > 0 && level.value <= config.levels[index - 1].value)) throw new Error('JEV levels must increase and fit the tracker range.')
    if (new Set(config.levels.map(level => level.label)).size !== config.levels.length) throw new Error('Give each JEV level a different description.')
  }
}
export function normalizeJevResult(value: unknown): TrackerJevResult | undefined {
  if (!object(value) || !['applied', 'unchanged', 'uncertain', 'invalid'].includes(String(value.status))) return undefined
  return { sourceKey: clean(value.sourceKey, 200), status: value.status as TrackerJevResult['status'], evaluatedAt: clean(value.evaluatedAt, 80), message: clean(value.message, 300), confidence: typeof value.confidence === 'number' && Number.isFinite(value.confidence) ? value.confidence : undefined }
}
export interface OpenJevQuestion { type: 'choice' | 'score'; question: string; options: string[] }
export function jevQuestion(tracker: PhoneTracker): OpenJevQuestion {
  validateJevTracker(tracker as unknown as Record<string, unknown>)
  return { type: tracker.kind === 'state' ? 'choice' : 'score', question: tracker.jev!.question, options: tracker.kind === 'state' ? tracker.states : tracker.jev!.levels.map(level => level.label) }
}
/** Open JEV returns one-based expected scores. Interpolate actual rubric anchors. */
export function applyJevAnswer(tracker: PhoneTracker, answer: unknown, sourceKey: string, now: string, roleplayNow?: string): PhoneTracker {
  if (tracker.updateMode !== 'jev') return tracker
  const config = tracker.jev!
  const result = (status: TrackerJevResult['status'], message: string, confidence?: number, next = tracker): PhoneTracker => ({ ...next, jevResult: { sourceKey, status, message, confidence, evaluatedAt: now } })
  if (!object(answer) || answer.type !== (tracker.kind === 'state' ? 'choice' : 'score') || !Array.isArray(answer.probs)) return result('invalid', 'JEV returned an invalid answer.')
  const options = tracker.kind === 'state' ? tracker.states : config.levels.map(level => level.label)
  const probs = answer.probs
  if (!Array.isArray(answer.options) || JSON.stringify(answer.options) !== JSON.stringify(options) || probs.length !== options.length || probs.some(p => typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) || Math.abs(probs.reduce((sum: number, p) => sum + p, 0) - 1) > .002) return result('invalid', 'JEV probabilities or rubric did not match.')
  const confidence = Math.max(...probs as number[])
  if (confidence < config.minConfidence) return result('uncertain', 'Confidence was below the threshold; kept the current value.', confidence)
  let next: PhoneTracker
  const reason = `Open JEV · ${Math.round(confidence * 100)}% confidence · ${config.question}`
  if (tracker.kind === 'state') {
    const index = probs.indexOf(confidence)
    if (answer.chosen !== options[index] || answer.chosen_index !== index) return result('invalid', 'JEV choice did not match its probabilities.', confidence)
    next = applyTrackerOperation(tracker, { operation: 'set_state', state: options[index], reason, source: 'jev', now, roleplayNow })
  } else {
    const expected = probs.reduce((sum: number, p, index) => sum + p * (index + 1), 0)
    if (typeof answer.expected !== 'number' || Math.abs(answer.expected - expected) > .015) return result('invalid', 'JEV score did not match its probabilities.', confidence)
    const position = Math.min(config.levels.length - 1, Math.max(0, expected - 1))
    const low = Math.floor(position), high = Math.ceil(position)
    const amount = config.levels[low].value + (config.levels[high].value - config.levels[low].value) * (position - low)
    next = applyTrackerOperation(tracker, { operation: 'set', amount: Number(amount.toFixed(2)), reason, source: 'jev', now, roleplayNow })
  }
  return result(next === tracker ? 'unchanged' : 'applied', next === tracker ? 'JEV agreed with the current value.' : 'Updated from the story.', confidence, next)
}
