import { describe, expect, test } from 'bun:test'
import { runPocketGeneration } from '../src/backend/generation.js'
import { defaultPreferences } from '../src/domain/preferences.js'
import { applyVisualViewportSurface } from '../src/frontend/surface.js'
import { ReplyJobs } from '../src/backend/reply-jobs.js'

test('reply cancellation reaches nested jobs, isolates other conversations, and rejects late results', async () => {
  const jobs = new ReplyJobs()
  let finish!: () => void
  let ready!: () => void
  const started = new Promise<void>(resolve => { ready = resolve })
  const late = jobs.run('chat-a/conversation-a', signal => jobs.run('chat-a/conversation-a', async child => {
    ready()
    await new Promise<void>(resolve => { finish = resolve })
    child.throwIfAborted()
    return 'must not commit'
  }, signal))
  await started
  const other = jobs.run('chat-b/conversation-a', async signal => {
    jobs.cancel('chat-a/conversation-a')
    expect(signal.aborted).toBe(false)
    return 'unaffected'
  })
  finish()
  await expect(late).rejects.toHaveProperty('name', 'AbortError')
  expect(await other).toBe('unaffected')
  expect(await jobs.run('chat-a/conversation-a', async signal => signal.aborted)).toBe(false)
})

describe('generation lifecycle', () => {
  test('reports thinking and writing without exposing tokens; uses the current sidecar model', async () => {
    let preferences = { ...defaultPreferences(), generationMode: 'sidecar' as const, sidecarConnectionId: 'connection', sidecarModelOverride: 'fresh-model' }
    const events: any[] = []; let request: any
    const host = {
      loadPreferences: async () => structuredClone(preferences),
      savePreferences: async (next: any) => (preferences = next),
      send: (event: any) => events.push(event),
      spindle: { permissions: { has: () => true }, connections: { list: async () => [{ id: 'connection', model: 'old-model', has_api_key: true }] }, generate: {
        async *quietStream(input: any) {
          request = input
          yield { type: 'reasoning', token: 'private reasoning' }
          yield { type: 'token', token: '{' }
          yield { type: 'done', content: '{"displayName":"Test"}', finish_reason: 'stop' }
        },
      } },
    }
    const result = await runPocketGeneration(host, 'persona-profile', 'profile-test', { parameters: {} })
    expect(request.parameters.model).toBe('fresh-model')
    expect(request.connection_id).toBe('connection')
    expect(result.content).toContain('Test')
    expect(events.filter(event => event.type === 'lumiphone:operation_progress').map(event => event.phase)).toEqual(['thinking', 'writing'])
    expect(JSON.stringify(events)).not.toContain('private reasoning')
    expect(events.at(-1).run.status).toBe('completed')
  })

  test('a stream without a terminal response fails and unlocks retry through a failure status', async () => {
    let preferences = defaultPreferences(); const events: any[] = []
    const host = {
      loadPreferences: async () => structuredClone(preferences), savePreferences: async (next: any) => (preferences = next), send: (event: any) => events.push(event),
      spindle: { permissions: { has: () => true }, connections: { list: async () => [{ id: 'main', is_default: true, model: 'main-model' }] }, generate: {
        async *quietStream() { yield { type: 'token', token: 'partial' } },
      } },
    }
    await expect(runPocketGeneration(host, 'persona-profile', 'missing-done', {})).rejects.toThrow('without a completed response')
    expect(events.at(-1).run.status).toBe('failed')
  })
})

test('fullscreen converts viewport dimensions and keyboard offsets into host layout pixels', () => {
  const previous = globalThis.window
  const values = new Map<string, string>()
  const style: any = { getPropertyValue: (name: string) => values.get(name) || '', setProperty: (name: string, value: string) => { values.set(name, value); style[name] = value } }
  try {
    ;(globalThis as any).window = { innerWidth: 556, innerHeight: 930, visualViewport: { width: 556, height: 520, offsetLeft: 8, offsetTop: 90 } }
    for (const scale of [.7, .9, 1, 1.25]) {
      applyVisualViewportSurface({ style } as HTMLElement, pixels => pixels / scale)
      expect(parseFloat(style.width) * scale).toBeCloseTo(556, 5)
      expect(parseFloat(style.height) * scale).toBeCloseTo(520, 5)
      expect(style.transform).toBe(`translate3d(${8 / scale}px,${90 / scale}px,0)`)
      expect(parseFloat(values.get('--lp-visual-height')!) * scale).toBeCloseTo(520, 5)
    }
  } finally { (globalThis as any).window = previous }
})

test('arrival idle resets on activity, rejects stale asynchronous handoffs and isolates chats', async () => {
  const { ArrivalIdle } = await import('../src/backend/arrival-idle.js')
  let next = 0
  const callbacks = new Map<number, () => void>()
  const idle = new ArrivalIdle({ set: ((callback: () => void) => { callbacks.set(++next, callback); return next }) as typeof setTimeout, clear: ((timer: number) => { callbacks.delete(timer) }) as typeof clearTimeout })
  const events: string[] = []
  idle.schedule('user:chat:thread', async () => { events.push('old') })
  idle.schedule('user:chat:thread', async () => { events.push('new') })
  expect(callbacks.size).toBe(1)
  const pending = callbacks.get(next)!
  idle.cancel('user:chat:thread')
  pending(); await Promise.resolve(); await Promise.resolve()
  expect(events).toEqual([]) // A cancelled callback already queued by the event loop is rejected.
  let release!: () => void
  idle.schedule('user:chat:thread', async current => { await new Promise<void>(resolve => { release = resolve }); if (current()) events.push('stale') })
  callbacks.get(next)!()
  idle.cancel('user:chat:thread'); release(); await Promise.resolve(); await Promise.resolve()
  expect(events).not.toContain('stale')
  idle.schedule('user:chat:other', async () => { events.push('cancelled') })
  idle.schedule('other:chat:thread', async current => { if (current()) events.push('other') })
  idle.cancelPrefix('user:')
  callbacks.get(next)!(); await Promise.resolve(); await Promise.resolve()
  expect(events).toContain('other')
  expect(events).not.toContain('cancelled')
})


function generationFixture(responses: Array<Record<string, unknown>>) {
  let preferences = { ...defaultPreferences(), generationMode: 'sidecar' as const, sidecarConnectionId: 'sidecar', sidecarModelOverride: 'selected-model' }
  const requests: any[] = [], events: any[] = []
  const host = {
    loadPreferences: async () => structuredClone(preferences), savePreferences: async (next: any) => (preferences = next), send: (event: any) => events.push(event),
    spindle: { permissions: { has: () => true }, connections: { list: async () => [{ id: 'sidecar', model: 'profile-model' }] }, generate: {
      quiet: async (request: any) => { requests.push(structuredClone(request)); return responses[Math.min(requests.length - 1, responses.length - 1)] },
    } },
  }
  return { host, requests, events }
}

test('reasoning-budget exhaustion retries once on the selected connection without exposing reasoning', async () => {
  const f = generationFixture([{ content: '', finish_reason: 'length', reasoning: 'private thought' }, { content: '{"events":[]}', finish_reason: 'stop' }])
  const result = await runPocketGeneration(f.host, 'timeline-review', 'budget', { parameters: { max_tokens: 1100 } })
  expect(result.content).toBe('{"events":[]}')
  expect(f.requests.length).toBe(2)
  expect(f.requests[0].reasoning).toEqual({ source: 'off' })
  expect(f.requests[1].parameters.max_tokens).toBe(8192)
  expect(f.requests[1].parameters.model).toBe('selected-model')
  expect(f.requests[1].connection_id).toBe('sidecar')
  expect(JSON.stringify(f.events)).not.toContain('private thought')
  expect(f.events.at(-1).run.status).toBe('completed')
})

test('empty provider output is a failed run and does not retry unless output was exhausted', async () => {
  for (const reason of ['stop', 'length']) {
    const f = generationFixture([{ content: '', finish_reason: reason }])
    await expect(runPocketGeneration(f.host, 'reply', 'empty-' + reason, { parameters: { max_tokens: 720 }, reasoning: { source: 'custom', effort: 'low' } })).rejects.toThrow(reason === 'length' ? 'output limit' : 'no answer text')
    expect(f.requests.length).toBe(reason === 'length' ? 2 : 1)
    expect(f.requests[0].reasoning).toEqual({ source: 'custom', effort: 'low' })
    expect(f.events.at(-1).run.status).toBe('failed')
  }
})


test('manual retry preference prevents budget retry and survives normalization', async () => {
  const { normalizePreferences } = await import('../src/domain/preferences.js')
  expect(normalizePreferences({}).automaticGenerationRetry).toBe(true)
  expect(normalizePreferences({ automaticGenerationRetry: false }).automaticGenerationRetry).toBe(false)
  const f = generationFixture([{ content: '', finish_reason: 'length' }])
  const load = f.host.loadPreferences
  f.host.loadPreferences = async () => ({ ...await load(), automaticGenerationRetry: false })
  await expect(runPocketGeneration(f.host, 'timeline-review', 'manual', { parameters: { max_tokens: 1100 } })).rejects.toThrow('retry manually')
  expect(f.requests.length).toBe(1)
  expect(f.events.at(-1).run.status).toBe('failed')
})

test('manual retry also disables malformed/truncated JSON retries', async () => {
  const { parseWithTruncationRetry } = await import('../src/backend/structured.js')
  let attempts = 0
  await expect(parseWithTruncationRetry('{"events":', async () => { attempts++; return '{"events":[]}' }, false)).rejects.toThrow()
  expect(attempts).toBe(0)
})


test('repeated standalone viewport notifications leave handset styles untouched, but keyboard and zoom changes apply', () => {
  const previous = globalThis.window
  const values = new Map<string, string>(); const writes: string[] = []
  const style: any = { getPropertyValue: (name: string) => values.get(name) || '', setProperty: (name: string, value: string) => { values.set(name, name === 'transform' ? value.replaceAll(',', ', ') : value); writes.push(name) } }
  const viewport = { width: 393, height: 852, offsetLeft: 0, offsetTop: 0 }
  try {
    ;(globalThis as any).window = { innerWidth: 393, innerHeight: 852, visualViewport: viewport }
    const host = { style } as HTMLElement
    applyVisualViewportSurface(host)
    writes.length = 0
    for (let i = 0; i < 20; i++) applyVisualViewportSurface(host)
    expect(writes).toEqual([])
    viewport.height = 490; viewport.offsetTop = 60
    applyVisualViewportSurface(host)
    expect(writes).toEqual(['height', 'transform', '--lp-visual-height'])
    expect(values.get('height')).toBe('490px')
    writes.length = 0
    applyVisualViewportSurface(host, pixels => pixels / 1.25)
    expect(values.get('width')).toBe('314.4px')
    expect(values.get('height')).toBe('392px')
    expect(writes.length).toBeGreaterThan(0)
    writes.length = 0
    applyVisualViewportSurface(host, pixels => pixels / 1.25)
    expect(writes).toEqual([])
  } finally { (globalThis as any).window = previous }
})
