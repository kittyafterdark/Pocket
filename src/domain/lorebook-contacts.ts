import type { PocketLorebookContactDraft } from '../types.js'
import { stableContactAccent } from './contacts.js'
import { identityMatches } from './actor-identity.js'

const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''

/** Require citations to selected entries; repeated mentions must produce one reviewed person. */
export function parseLorebookContactDrafts(value: unknown, sourceIds: string[]): PocketLorebookContactDraft[] {
  if (!record(value) || !Array.isArray(value.contacts) || value.contacts.length > 12) throw new Error('NPC extraction returned an invalid contact list. Try fewer sources or specify names.')
  const allowed = new Set(sourceIds), drafts: PocketLorebookContactDraft[] = []
  for (const raw of value.contacts) {
    if (!record(raw)) throw new Error('NPC extraction returned an invalid profile.')
    const name = clean(raw.name, 120), identityBrief = clean(raw.identityBrief, 1_200)
    const evidenceEntryIds = Array.isArray(raw.evidenceEntryIds) ? [...new Set(raw.evidenceEntryIds.filter((id): id is string => typeof id === 'string'))] : []
    if (!name || !identityBrief || !evidenceEntryIds.length || evidenceEntryIds.some(id => !allowed.has(id))) throw new Error('An extracted profile has no valid evidence in the selected entries. Try a narrower selection.')
    const aliases = [...new Set((Array.isArray(raw.aliases) ? raw.aliases : []).map(alias => clean(alias, 120)).filter(Boolean))].slice(0, 24)
    if ([name, ...aliases].some(alias => identityMatches(alias, drafts, draft => [draft.name, ...draft.aliases]).length)) throw new Error('Extraction returned overlapping identities. Specify the people you want and retry.')
    const phone = record(raw.phoneProfile) ? raw.phoneProfile : {}
    drafts.push({
      name, aliases, role: clean(raw.role, 120) || 'Pocket NPC', identityBrief, evidenceEntryIds,
      phoneProfile: { personality: clean(phone.personality, 600), appearance: clean(phone.appearance, 360), textingStyle: clean(phone.textingStyle, 600) },
      accent: stableContactAccent(name), messagingStyle: { talkativeness: 50, fragmentation: 35 }, sourceDescription: '',
    })
  }
  return drafts
}
