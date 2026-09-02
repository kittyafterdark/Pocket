import type { DevicePreferences, PocketConnectionSummary, PocketGenerationInfo, PocketGenerationRun } from '../types.js'

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
): Promise<any> {
  const preferences = await host.loadPreferences(userId)
  const info = await inspectPocketGeneration(host, preferences, userId)
  if (!info.effective) throw new Error(preferences.generationMode === 'sidecar' ? 'The selected Pocket sidecar connection is unavailable.' : 'No active roleplay generation connection is configured.')
  const startedAt = new Date().toISOString()
  const run: PocketGenerationRun = {
    requestId, task, mode: preferences.generationMode,
    connectionId: info.effective.id, connectionName: info.effective.name,
    provider: info.effective.provider, model: preferences.sidecarModelOverride || info.effective.model,
    status: 'started', startedAt,
  }
  await writeRun(host, run, userId)
  host.send({ type: 'lumiphone:generation_status', run }, userId)
  const started = Date.now()
  try {
    const request = { ...input } as GenerateInput & { connection_id?: string; parameters?: Record<string, unknown> }
    if (preferences.generationMode === 'sidecar') {
      request.connection_id = info.effective.id
      if (preferences.sidecarModelOverride) request.parameters = { ...(request.parameters || {}), model: preferences.sidecarModelOverride }
    }
    const result = await host.spindle.generate.quiet(request)
    const completed: PocketGenerationRun = { ...run, status: 'completed', completedAt: new Date().toISOString(), latencyMs: Date.now() - started }
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
