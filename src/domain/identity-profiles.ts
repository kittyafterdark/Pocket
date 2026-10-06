import type { ChatPocketPersona, PocketContact, PocketPhoneProfile } from '../types.js'

export const IDENTITY_PROFILES_PATH = 'identity-profiles.json'
export interface IdentityProfile {
  id: string
  kind: 'persona' | 'character'
  sourceId: string
  name: string
  pronouns: string
  role: string
  identityBrief: string
  phoneProfile: PocketPhoneProfile
  updatedAt: string
}
export interface IdentityProfiles { version: 1; entries: IdentityProfile[] }
const compact = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
export function normalizeIdentityProfiles(value: unknown): IdentityProfiles {
  const raw = value as Partial<IdentityProfiles> | null
  if (raw?.version && raw.version > 1) throw new Error('Update Pocket before editing these newer saved profiles.')
  const entries: IdentityProfile[] = []
  for (const item of Array.isArray(raw?.entries) ? raw.entries : []) {
    if (!item || !['persona', 'character'].includes(item.kind)) continue
    const id = compact(item.id, 180), name = compact(item.name, 120)
    if (!id || !name || entries.some(entry => entry.id === id)) continue
    entries.push({ id, kind: item.kind, sourceId: compact(item.sourceId, 180), name,
      pronouns: compact(item.pronouns, 120), role: compact(item.role, 120), identityBrief: compact(item.identityBrief, 1200),
      phoneProfile: { personality: compact(item.phoneProfile?.personality, 600), appearance: compact(item.phoneProfile?.appearance, 360), textingStyle: compact(item.phoneProfile?.textingStyle, 600) },
      updatedAt: compact(item.updatedAt, 80) })
  }
  return { version: 1, entries: entries.slice(-100) }
}
export function saveIdentityProfile(bank: IdentityProfiles, value: ChatPocketPersona | PocketContact, kind: IdentityProfile['kind'], sourceId: string, now: string, makeId: () => string): IdentityProfile {
  const name = 'displayName' in value ? value.displayName : value.name
  const prior = bank.entries.find(entry => entry.kind === kind && (sourceId ? entry.sourceId === sourceId : !entry.sourceId && entry.name === name))
  const entry = normalizeIdentityProfiles({ version: 1, entries: [{ id: prior?.id || makeId(), kind, sourceId, name,
    pronouns: 'pronouns' in value ? value.pronouns : '', role: value.role, identityBrief: value.identityBrief,
    phoneProfile: value.phoneProfile, updatedAt: now }] }).entries[0]
  if (!entry) throw new Error('Give this profile a name before saving it.')
  bank.entries = [...bank.entries.filter(item => item.id !== entry.id), entry].slice(-100)
  return entry
}
/** Only stable identity crosses chats: never messages, memories, presence or relationship state. */
export function applyIdentityProfile<T extends ChatPocketPersona | PocketContact>(target: T, profile: IdentityProfile): T {
  return { ...target, role: profile.role, identityBrief: profile.identityBrief, phoneProfile: { ...profile.phoneProfile },
    ...('displayName' in target ? { displayName: profile.name, pronouns: profile.pronouns } : { name: profile.name, description: profile.identityBrief }) }
}
