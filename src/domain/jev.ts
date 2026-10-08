import type { PhoneTracker, TrackerJevConfig, TrackerJevResult, PocketJevSettings } from '../types.js'
import { applyTrackerOperation } from './trackers.js'

export const TYPESAFE_JEV_ENDPOINT = 'https://api.typesafe.ai/v1/systemone'
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
export function normalizeJevSettings(value: unknown): PocketJevSettings {
  const raw = object(value) ? value : {}
  const knownProvider = raw.provider === 'llm' || raw.provider === 'typesafe'
  const model = clean(raw.model, 100)
  // Legacy Space settings require a fresh opt-in to the new providers.
  return { enabled: knownProvider && raw.enabled === true, provider: raw.provider === 'typesafe' ? 'typesafe' : 'llm', model: /^jev-[a-zA-Z0-9._-]+$/.test(model) ? model : 'jev-latest', autoAfterTurn: knownProvider && raw.autoAfterTurn === true }
}
export function normalizeJevConfig(value: unknown): TrackerJevConfig {
  const raw = object(value) ? value : {}
  const levels = (Array.isArray(raw.levels) ? raw.levels : []).flatMap(entry => object(entry) && typeof entry.value === 'number' && Number.isFinite(entry.value) && clean(entry.label, 160) ? [{ value: entry.value, label: clean(entry.label, 160) }] : []).slice(0, 10)
  return { question: clean(raw.question, 240), levels, minConfidence: typeof raw.minConfidence === 'number' && Number.isFinite(raw.minConfidence) ? Math.min(1, Math.max(0, raw.minConfidence)) : .65 }
}
export function validateJevTracker(tracker: Record<string, unknown>): void {
  const raw = object(tracker.jev) ? tracker.jev : {}
  const config = normalizeJevConfig(raw)
  if (!config.question || String(raw.question).trim().length > 240) throw new Error('Give the judge a short question (up to 240 characters).')
  if (tracker.kind === 'timer' || tracker.kind === 'counter') throw new Error('The judge estimates values and states. Quantities and timers use exact updates.')
  if (typeof raw.minConfidence !== 'number' || raw.minConfidence < 0 || raw.minConfidence > 1 || !Number.isFinite(raw.minConfidence)) throw new Error('Judge confidence must be between 0 and 1.')
  if (tracker.kind === 'state') {
    if (!Array.isArray(tracker.states) || tracker.states.length < 2 || tracker.states.length > 16) throw new Error('The judge needs between 2 and 16 allowed states.')
  } else {
    if (!Array.isArray(raw.levels) || raw.levels.length < 2 || raw.levels.length > 10 || config.levels.length !== raw.levels.length) throw new Error('The judge needs 2–10 described numeric levels.')
    if (config.levels.some((level, index) => level.value < Number(tracker.min) || level.value > Number(tracker.max) || index > 0 && level.value <= config.levels[index - 1].value)) throw new Error('Judge levels must increase and fit the tracker range.')
    if (new Set(config.levels.map(level => level.label)).size !== config.levels.length) throw new Error('Give each judge level a different description.')
  }
}
export function normalizeJevResult(value: unknown): TrackerJevResult | undefined {
  if (!object(value) || !['applied', 'unchanged', 'uncertain', 'invalid'].includes(String(value.status))) return undefined
  return { sourceKey: clean(value.sourceKey, 200), status: value.status as TrackerJevResult['status'], evaluatedAt: clean(value.evaluatedAt, 80), message: clean(value.message, 300), confidence: typeof value.confidence === 'number' && Number.isFinite(value.confidence) ? value.confidence : undefined }
}
export interface JevQuestion { type: 'choice' | 'score'; question: string; options: string[] }
export function jevQuestion(tracker: PhoneTracker): JevQuestion {
  validateJevTracker(tracker as unknown as Record<string, unknown>)
  return { type: tracker.kind === 'state' ? 'choice' : 'score', question: tracker.jev!.question, options: tracker.kind === 'state' ? tracker.states : tracker.jev!.levels.map(level => level.label) }
}
/** Judge scores use zero-based levels. Interpolate saved numeric anchors. */
export function applyJevAnswer(tracker: PhoneTracker, answer: unknown, sourceKey: string, now: string, roleplayNow?: string, provider: PocketJevSettings['provider'] = 'typesafe'): PhoneTracker {
  if (tracker.updateMode !== 'jev') return tracker
  const config = tracker.jev!
  const result = (status: TrackerJevResult['status'], message: string, confidence?: number, next = tracker): PhoneTracker => ({ ...next, jevResult: { sourceKey, status, message, confidence, evaluatedAt: now } })
  if (!object(answer) || answer.type !== (tracker.kind === 'state' ? 'choice' : 'score') || !Array.isArray(answer.probs)) return result('invalid', 'The judge returned an invalid answer.')
  const options = tracker.kind === 'state' ? tracker.states : config.levels.map(level => level.label)
  const probs = answer.probs
  if (!Array.isArray(answer.options) || JSON.stringify(answer.options) !== JSON.stringify(options) || probs.length !== options.length || probs.some(p => typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) || Math.abs(probs.reduce((sum: number, p) => sum + p, 0) - 1) > .002) return result('invalid', 'Judge probabilities or rubric did not match.')
  const confidence = answer.confidence
  if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) return result('invalid', 'The judge returned invalid confidence.')
  if (confidence < config.minConfidence) return result('uncertain', 'Confidence was below the threshold; kept the current value.', confidence)
  let next: PhoneTracker
  const reason = `${provider === 'typesafe' ? 'TypeSafe Jev' : 'LLM judge'} · ${Math.round(confidence * 100)}% confidence · ${config.question}`
  if (tracker.kind === 'state') {
    const index = probs.indexOf(Math.max(...probs as number[]))
    if (answer.chosen !== options[index] || answer.chosen_index !== index) return result('invalid', 'Judge choice did not match its probabilities.', confidence)
    next = applyTrackerOperation(tracker, { operation: 'set_state', state: options[index], reason, source: 'jev', now, roleplayNow })
  } else {
    const expected = probs.reduce((sum: number, p, index) => sum + p * index, 0)
    if (typeof answer.expected !== 'number' || !Number.isFinite(answer.expected) || Math.abs(answer.expected - expected) > .015) return result('invalid', 'Judge score did not match its probabilities.', confidence)
    const position = Math.min(config.levels.length - 1, Math.max(0, expected))
    const low = Math.floor(position), high = Math.ceil(position)
    const amount = config.levels[low].value + (config.levels[high].value - config.levels[low].value) * (position - low)
    next = applyTrackerOperation(tracker, { operation: 'set', amount: Number(amount.toFixed(2)), reason, source: 'jev', now, roleplayNow })
  }
  return result(next === tracker ? 'unchanged' : 'applied', next === tracker ? 'The judge agreed with the current value.' : 'Updated from the story.', confidence, next)
}
