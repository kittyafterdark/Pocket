/** Providers expose the output-limit reason under different field names. */
export function outputLimitReached(response: any): boolean {
  return [response?.finish_reason, response?.stop_reason, response?.choices?.[0]?.finish_reason]
    .some(reason => typeof reason === 'string' && ['length', 'max_tokens', 'max_output_tokens', 'token_limit'].includes(reason.toLowerCase()))
}

export class GenerationOutputLimitError extends Error {
  readonly code = 'output_limit'
}

export function normalizeConnectionTokenLimits(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([id, limit]) => id && id.length <= 180 && typeof limit === 'number' && Number.isFinite(limit) && limit >= 128 && limit <= 262_144)
    .slice(0, 100).map(([id, limit]) => [id, Math.floor(limit as number)]))
}
