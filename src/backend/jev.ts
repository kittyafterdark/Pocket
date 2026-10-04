import type { OpenJevQuestion } from '../domain/jev.js'

type Http = (url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<unknown>
function body(response: unknown): string {
  const raw = response as { status?: number; body?: unknown }
  if (!raw || !Number.isFinite(raw.status) || raw.status! < 200 || raw.status! >= 300) throw new Error(`Open JEV request failed (HTTP ${raw?.status || 'unknown'}).`)
  if (typeof raw.body !== 'string') throw new Error('Open JEV returned an invalid HTTP body.')
  return raw.body
}
/** The Space's published Gradio v2 submit + SSE result protocol. No compare/verify runs. */
export async function runOpenJev(http: Http, endpoint: string, state: string, questions: OpenJevQuestion[]): Promise<unknown[]> {
  if (!questions.length || questions.length > 24) throw new Error('Open JEV accepts 1–24 questions per batch.')
  const submitted = JSON.parse(body(await http(`${endpoint}/gradio_api/call/v2/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, questions, compare: false, verify: false }) })))
  if (typeof submitted.event_id !== 'string' || !/^[a-zA-Z0-9_-]{1,160}$/.test(submitted.event_id)) throw new Error('Open JEV did not return a job ID.')
  const stream = body(await http(`${endpoint}/gradio_api/call/run/${submitted.event_id}`))
  let answer: unknown[] | undefined
  let complete = false
  for (const event of stream.replace(/\r\n/g, '\n').split('\n\n')) {
    const type = event.split('\n').find(line => line.startsWith('event:'))?.slice(6).trim()
    const data = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')
    if (!data || type === 'heartbeat') continue
    if (type === 'error') throw new Error('Open JEV could not finish the evaluation. Try again when the Space is available.')
    if (type !== 'generating' && type !== 'complete') continue
    const parsed = JSON.parse(data)
    const snapshot = Array.isArray(parsed) ? parsed[0] : parsed
    if (snapshot?.error) throw new Error('Open JEV rejected the evaluation. Check question lengths and Space availability.')
    if (snapshot?.scorer?.questions) answer = snapshot.scorer.questions
    if (type === 'complete') complete = true
  }
  if (!complete || !Array.isArray(answer) || answer.length !== questions.length) throw new Error('Open JEV returned incomplete results.')
  return answer
}

export function jevSourceKey(value: unknown): string {
  const serialized = JSON.stringify(value)
  let hash = 2166136261
  for (let index = 0; index < serialized.length; index++) hash = Math.imul(hash ^ serialized.charCodeAt(index), 16777619)
  return `open-jev-v1:${serialized.length}:${(hash >>> 0).toString(16)}`
}
