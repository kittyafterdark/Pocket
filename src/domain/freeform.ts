import type { ChatPocketPersona } from '../types.js'

export const FREEFORM_INDEX_PATH = 'freeform/sessions.json'
export const isFreeformChat = (chatId: string | null | undefined): boolean => Boolean(chatId?.startsWith('_freeform_'))

export interface FreeformSession {
  id: string
  name: string
  personaId: string
  personaName: string
  appearanceBasePersonaId?: string
  independentStyling?: boolean
  createdAt: string
}
export interface FreeformPersona { id: string; name: string; avatarUrl: string }
export interface FreeformDirectory { sessions: FreeformSession[]; personas: FreeformPersona[] }

export function sessionName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim() : ''
  if (!name || name.length > 80) throw new Error('Name your session using 1–80 characters.')
  return name
}

export function freeformPersona(persona: ChatPocketPersona): ChatPocketPersona {
  // The lock screen chooses identity; changing the host's active Persona cannot change it.
  return { ...structuredClone(persona), source: 'manual' }
}
