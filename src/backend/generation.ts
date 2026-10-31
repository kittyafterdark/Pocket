import { pocketReasoning } from '../domain/reasoning.js'
import type { DevicePreferences, PocketConnectionSummary, PocketGenerationInfo, PocketGenerationRun } from '../types.js'

import { normalizeSamplerOverrides } from '../domain/samplers.js'

type GenerationTask = PocketGenerationRun['task']
type GenerateInput = Record<string, unknown>

export interface PocketGenerationHost {
  spindle: any
  loadPreferences(userId?: string): Promise<DevicePreferences>
  savePreferences(preferences: DevicePreferences, userId?: string): Promise<DevicePreferences>
  send(payload: unknown, userId?: string): void
}

const historyLocks = new Map<string, Promise<DevicePreferences>>()

function compactError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  return raw.replace(/\b(?:sk-|key-|Bearer\s+)[A-Za-z0-9._-]{8,}\b/gi, '[redacted]').replace(/\s+/g, ' ').trim().slice(0, 500) || 'Generation failed'
}

function summary(connection: any): PocketConnectionSummary {
  return {
    id: String(connection?.id || ''), name: String(connection?.name || connection?.provider || 'Connection'),
    provider: String(connection?.provider || ''), model: String(connection?.model || ''),
    isDefault: Boolean(connection?.is_default), configured: Boolean(connection?.has_api_key),
  }
}

export async function inspectPocketGeneration(host: PocketGenerationHost, preferences: DevicePreferences, userId?: string): Promise<PocketGenerationInfo> {
  if (!host.spindle.permissions.has('generation')) return { mode: preferences.generationMode, effective: null, connections: [], history: preferences.generationHistory, modelOverride: preferences.sidecarModelOverride }
  const connections = (await host.spindle.connections.list(userId)).map(summary)
  const effective = preferences.generationMode === 'sidecar'
    ? connections.find((entry: PocketConnectionSummary) => entry.id === preferences.sidecarConnectionId) || null
    : connections.find((entry: PocketConnectionSummary) => entry.isDefault) || connections[0] || null
  return { mode: preferences.generationMode, effective, connections, history: preferences.generationHistory, modelOverride: preferences.sidecarModelOverride }
}

async function writeRun(host: PocketGenerationHost, run: PocketGenerationRun, userId?: string): Promise<DevicePreferences> {
  const key = userId || '_default'
  const previous = historyLocks.get(key) || Promise.resolve(null as unknown as DevicePreferences)
  const current = previous.catch(() => null as unknown as DevicePreferences).then(async () => {
    const latest = await host.loadPreferences(userId)
    const history = latest.generationHistory.filter((entry) => entry.requestId !== run.requestId)
    history.push(run)
    latest.generationHistory = history.slice(-24)
    return host.savePreferences(latest, userId)
  })
  historyLocks.set(key, current)
  try { return await current } finally { if (historyLocks.get(key) === current) historyLocks.delete(key) }
}

export async function runPocketGeneration(
  host: PocketGenerationHost,
  task: GenerationTask,
  requestId: string,
  input: GenerateInput,
  userId?: string,
  options:{connectionId?:string;transport?:'response'|'stream';preservePartial?:boolean;automaticRetry?:boolean;progressRequestId?:string;validate?:(response:any)=>void}={},
): Promise<any> {
  const preferences = await host.loadPreferences(userId)
  const info = await inspectPocketGeneration(host, preferences, userId)
  if(options.connectionId){const selected=info.connections.find(c=>c.id===options.connectionId);if(!selected)throw new Error('The selected authoring connection is unavailable.');info.effective=selected}
  if (!info.effective) throw new Error(preferences.generationMode === 'sidecar' ? 'The selected Pocket sidecar connection is unavailable.' : 'No active roleplay generation connection is configured.')
  const startedAt = new Date().toISOString()
  const run: PocketGenerationRun = {
    requestId, task, mode: preferences.generationMode,
    connectionId: info.effective.id, connectionName: info.effective.name,
    usageStatus:'unavailable',
    provider: info.effective.provider, model: !options.connectionId && preferences.generationMode === 'sidecar' ? preferences.sidecarModelOverride || info.effective.model : info.effective.model,
    status: 'started', startedAt,
  }
  await writeRun(host, run, userId)
  host.send({ type: 'lumiphone:generation_status', run }, userId)
  const started = Date.now()
  try {
    if (input.signal instanceof AbortSignal) input.signal.throwIfAborted()
    const request = { ...input, userId, reasoning: input.reasoning ?? pocketReasoning(preferences.reasoningEffort) } as GenerateInput & { connection_id?: string; parameters?: Record<string, unknown> }
    const samplers = normalizeSamplerOverrides(preferences.samplerOverrides)
    if (Object.keys(samplers).length) request.parameters = { ...(request.parameters || {}), ...samplers }
    if(options.connectionId)request.connection_id=options.connectionId
    if (preferences.generationMode === 'sidecar' && !options.connectionId) {
      request.connection_id = info.effective.id
      if (preferences.sidecarModelOverride) request.parameters = { ...(request.parameters || {}), model: preferences.sidecarModelOverride }
    }
    let result: any
    const profileTask = ['persona-profile', 'npc-contact', 'profile-refresh', 'scene-sync'].includes(task)
    const generate = async () => {
      if (input.signal instanceof AbortSignal) input.signal.throwIfAborted()
      result = undefined
      if ((profileTask || options.transport==='stream') && typeof host.spindle.generate.quietStream === 'function') {
        let phase = '',answer=''
        try{for await (const chunk of host.spindle.generate.quietStream(request)) {
          if (input.signal instanceof AbortSignal) input.signal.throwIfAborted()
          if(chunk.type==='token'&&typeof chunk.token==='string')answer+=chunk.token
          const next = chunk.type === 'reasoning' ? 'thinking' : chunk.type === 'token' ? 'writing' : ''
          if (next && next !== phase) {
            phase = next
            // Report activity, never private reasoning content.
            host.send({ type: 'lumiphone:operation_progress', task, requestId, phase: next, message: next === 'thinking' ? 'Thinking…' : 'Writing profile…' }, userId)
          }
          if (chunk.type === 'done') result = chunk
        }
        }catch(error){if(!options.preservePartial || !answer || request.signal instanceof AbortSignal && request.signal.aborted)throw error;result={content:answer,finish_reason:'length'};run.diagnostic={layer:'provider',code:'partial-stream',saved:true,retryable:true}}
        if (!result && options.preservePartial && answer)result={content:answer,finish_reason:'length'}
        if (!result) throw new Error('The provider stream ended without a completed response. Retry enrichment.')
      } else result = await host.spindle.generate.quiet(request)
    }
    await generate()
    if (input.signal instanceof AbortSignal) input.signal.throwIfAborted()
    const empty = () => typeof result?.content !== 'string' || !result.content.trim()
    const usage=result?.usage||{},reasoningOnly=Number(usage.reasoning_tokens??usage.completion_tokens_details?.reasoning_tokens)>0 && Number(usage.reasoning_tokens??usage.completion_tokens_details?.reasoning_tokens)>=Number(usage.completion_tokens)
    if (preferences.automaticGenerationRetry && options.automaticRetry!==false && !reasoningOnly && empty() && result?.finish_reason === 'length') {
      const limit = Number(request.parameters?.max_tokens) || 0
      const expanded = Math.min(16384, Math.max(8192, limit * 2))
      if (expanded > limit) {
        host.send({ type: 'lumiphone:operation_progress', task, requestId, phase: 'thinking', message: 'The model reached its output limit before answering. Retrying once with more room…' }, userId)
        request.parameters = { ...(request.parameters || {}), max_tokens: expanded }
        await generate()
      }
    }
    if(empty() && reasoningOnly)throw new Error(`The model used all ${Number(usage.completion_tokens).toLocaleString('en-US')} output tokens for reasoning and returned no answer text. Lower reasoning or increase the output limit, then retry.`)
    if (empty()) throw new Error(result?.finish_reason === 'length'
      ? preferences.automaticGenerationRetry ? 'The model exhausted its output limit without returning an answer. Try a lower reasoning setting or another model.' : 'The model reached its output limit before answering. Automatic retry is off; retry manually.'
      : 'The model returned no answer text. Check the provider or try another model.')
    if (input.signal instanceof AbortSignal) input.signal.throwIfAborted()
    options.validate?.(result)
    const completed: PocketGenerationRun = { ...run, status: 'completed',usageStatus:result?.usage?.total_tokens!==undefined?'reported':'unavailable', completedAt: new Date().toISOString(), latencyMs: Date.now() - started }
    await writeRun(host, completed, userId)
    host.send({ type: 'lumiphone:generation_status', run: completed }, userId)
    return result
  } catch (error) {
    const failed: PocketGenerationRun = { ...run, status: 'failed', completedAt: new Date().toISOString(), latencyMs: Date.now() - started, error: compactError(error) }
    await writeRun(host, failed, userId)
    host.send({ type: 'lumiphone:generation_status', run: failed }, userId)
    throw error
  }
}
