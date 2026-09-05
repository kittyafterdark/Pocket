type AnyRecord = Record<string, unknown>

const DROP_PART_TYPE = /(?:reason(?:ing)?|think(?:ing)?|analysis|tool[_-]?(?:use|call|result)|function[_-]?(?:call|result))/i
const WRAPPED_BLOCK = /<(think|thinking|reasoning|analysis|tool_call|tool_result|function_call|function_result)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
const OPEN_ENDED_BLOCK = /<(think|thinking|reasoning|analysis|tool_call|tool_result|function_call|function_result)\b[^>]*>[\s\S]*$/gi
const FENCED_BLOCK = /```(?:think|thinking|reasoning|analysis|tool_call|tool_result|function_call|function_result)\b[\s\S]*?```/gi
const POCKET_ACTION_BLOCK = /<lumi-phone\b[^>]*>[\s\S]*?<\/lumi-phone\s*>/gi
const POCKET_ACTION_SINGLE = /<lumi-phone\b[^>]*\/\s*>/gi

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function visibleStructuredText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(visibleStructuredText).filter(Boolean).join('\n')
  if (!isRecord(value)) return ''

  const type = typeof value.type === 'string' ? value.type : ''
  if (type && DROP_PART_TYPE.test(type)) return ''

  if (typeof value.text === 'string') return value.text
  if (typeof value.content === 'string' || Array.isArray(value.content) || isRecord(value.content)) {
    return visibleStructuredText(value.content)
  }
  if (typeof value.value === 'string' && (!type || /text|output/i.test(type))) return value.value
  return ''
}

function stripMachineWrappers(value: string): string {
  let text = value
  for (let pass = 0; pass < 3; pass += 1) {
    const next = text
      .replace(FENCED_BLOCK, '')
      .replace(WRAPPED_BLOCK, '')
      .replace(POCKET_ACTION_BLOCK, '')
      .replace(POCKET_ACTION_SINGLE, '')
    if (next === text) break
    text = next
  }
  return text
    .replace(OPEN_ENDED_BLOCK, '')
    .replace(/\n[ \t]+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Project only user-visible narrative text from host message content.
 *
 * Structured reasoning/tool parts are dropped by type. String-only provider
 * fallbacks get a deliberately conservative wrapper scrub. Ordinary English
 * prose is never heuristically classified as reasoning.
 */
export function sanitizeNarrativeContent(value: unknown, max = 4_000): string {
  return stripMachineWrappers(visibleStructuredText(value)).slice(0, Math.max(0, max))
}
