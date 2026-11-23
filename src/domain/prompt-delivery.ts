import type { LlmMessageDTO } from 'lumiverse-spindle-types'

export interface PromptPlacement {
  role: 'system' | 'assistant' | 'user'
  position: 'prompt_end' | 'pre_history' | 'post_history' | 'in_history'
  depth: number
}

export interface PromptDeliverySettings {
  delivery: 'injection' | 'macros'
  placement: PromptPlacement
}

export interface PocketPromptBlock {
  name: string
  content: string
  delivery: 'injection' | 'macros' | 'conditional'
  placement: PromptPlacement
  macro?: string
}

export interface PocketPromptReview {
  createdAt: string
  enabled: boolean
  blocks: PocketPromptBlock[]
}

export function normalizePromptPlacement(value: unknown): PromptPlacement {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const depth = Number(raw.depth)
  return {
    role: raw.role === 'assistant' || raw.role === 'user' ? raw.role : 'system',
    position: raw.position === 'pre_history' || raw.position === 'post_history' || raw.position === 'in_history' ? raw.position : 'prompt_end',
    depth: Number.isFinite(depth) ? Math.max(0, Math.min(10000, Math.floor(depth))) : 0,
  }
}

export function normalizePromptDelivery(value: unknown): PromptDeliverySettings {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return { delivery: raw.delivery === 'macros' ? 'macros' : 'injection', placement: normalizePromptPlacement(raw.placement) }
}

export function placementLabel(value: PromptPlacement): string {
  const position = { prompt_end: 'after prompt', pre_history: 'before chat history', post_history: 'after chat history', in_history: `at depth ${value.depth}` }[value.position]
  return `${value.role} · ${position}`
}

/** Use host-tagged history only; preset and extension messages never count as turns. */
export function promptInsertionIndex(messages: LlmMessageDTO[], placement: PromptPlacement): number {
  if (placement.position === 'prompt_end') return messages.length
  const history = messages.flatMap((message, index) => message.__isChatHistory === true ? [index] : [])
  if (!history.length) return placement.position === 'pre_history' ? 0 : messages.length
  if (placement.position === 'pre_history') return history[0]
  if (placement.position === 'post_history' || placement.depth === 0) return history[history.length - 1] + 1
  return history[Math.max(0, history.length - placement.depth)]
}

/** Resolve boundaries together so blocks at the same boundary retain their order. */
export function injectPromptBlocks(messages: LlmMessageDTO[], blocks: PocketPromptBlock[]) {
  const placements = blocks.filter(block => block.delivery === 'injection').map((block, order) => ({
    block, order, index: promptInsertionIndex(messages, block.placement),
    message: { role: block.placement.role, content: block.content } as LlmMessageDTO,
  }))
  const result = [...messages]
  for (const entry of [...placements].sort((a, b) => b.index - a.index || b.order - a.order)) result.splice(entry.index, 0, entry.message)
  return { messages: result, breakdown: placements.map(entry => ({ messageIndex: result.indexOf(entry.message), name: entry.block.name })) }
}
