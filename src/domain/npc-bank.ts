import type { PocketContact, PocketNpcBank, PocketNpcBankEntry } from '../types.js'

export const NPC_BANK_VERSION = 1 as const
export const NPC_BANK_PATH = 'device/npc-bank.json'
export const MAX_NPC_BANK_ENTRIES = 240

type AnyRecord = Record<string, unknown>
function record(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}
function percentage(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : fallback
}
function timestamp(value: unknown, fallback: string): string {
  const candidate = clean(value, 40)
  return Number.isFinite(Date.parse(candidate)) ? candidate : fallback
}
function accent(value: unknown, fallback = '#8b7dff'): string {
  const candidate = clean(value, 20)
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : fallback
}

export function normalizeNpcBankName(value: unknown): string {
  return clean(value, 120).replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function emptyNpcBank(now = new Date().toISOString()): PocketNpcBank {
  return { version: NPC_BANK_VERSION, entries: [], updatedAt: now }
}

export function isFutureNpcBank(value: unknown): boolean {
  return record(value) && Number(value.version) > NPC_BANK_VERSION
}

export function normalizeNpcBank(value: unknown, now = new Date().toISOString()): PocketNpcBank {
  if (!record(value) || isFutureNpcBank(value)) return emptyNpcBank(now)
  const seen = new Set<string>()
  const entries: PocketNpcBankEntry[] = (Array.isArray(value.entries) ? value.entries : []).slice(0, MAX_NPC_BANK_ENTRIES).flatMap((raw) => {
    if (!record(raw)) return []
    const name = clean(raw.name, 120).replace(/\s+/g, ' ')
    const normalizedName = normalizeNpcBankName(name)
    const entryId = clean(raw.id, 180)
    if (!name || !normalizedName || !entryId || seen.has(entryId)) return []
    seen.add(entryId)
    const aliases = [...new Set((Array.isArray(raw.aliases) ? raw.aliases : [])
      .map((item) => clean(item, 120).replace(/\s+/g, ' '))
      .filter((item) => item && normalizeNpcBankName(item) !== normalizedName))].slice(0, 24)
    return [{
      id: entryId,
      name,
      normalizedName,
      aliases,
      role: clean(raw.role, 120) || 'Pocket NPC',
      identityBrief: clean(raw.identityBrief ?? raw.description, 1_200),
      avatarUrl: clean(raw.avatarUrl, 2_000),
      accent: accent(raw.accent),
      messagingStyle: {
        talkativeness: percentage(record(raw.messagingStyle) ? raw.messagingStyle.talkativeness : undefined, 50),
        fragmentation: percentage(record(raw.messagingStyle) ? raw.messagingStyle.fragmentation : undefined, 35),
      },
      tags: [...new Set((Array.isArray(raw.tags) ? raw.tags : []).map((item) => clean(item, 80)).filter(Boolean))].slice(0, 24),
      createdAt: timestamp(raw.createdAt, now),
      updatedAt: timestamp(raw.updatedAt, now),
    }]
  })
  return { version: NPC_BANK_VERSION, entries, updatedAt: timestamp(value.updatedAt, now) }
}

export function findNpcBankMatch(bank: PocketNpcBank, name: string): PocketNpcBankEntry | null {
  const normalized = normalizeNpcBankName(name)
  if (!normalized) return null
  const matches = bank.entries.filter((entry) => entry.normalizedName === normalized
    || entry.aliases.some((alias) => normalizeNpcBankName(alias) === normalized))
  return matches.length === 1 ? matches[0] : null
}

export function upsertNpcBankFromContact(
  bank: PocketNpcBank,
  contact: PocketContact,
  now: string,
  makeId: (prefix: string) => string,
): PocketNpcBankEntry {
  if (contact.source.kind !== 'npc') throw new Error('Only Pocket NPC contacts can be saved to NPC Bank.')
  const sourceBankId = contact.source.bankId || ''
  const byId = sourceBankId ? bank.entries.find((entry) => entry.id === sourceBankId) : undefined
  const byName = findNpcBankMatch(bank, contact.name)
  const existing = byId || byName || undefined
  const name = contact.name.trim().replace(/\s+/g, ' ').slice(0, 120)
  if (!name) throw new Error('NPC Bank entries need a name.')
  const previousName = existing?.name || ''
  const aliases = [...new Set([
    ...(existing?.aliases || []),
    ...(previousName && normalizeNpcBankName(previousName) !== normalizeNpcBankName(name) ? [previousName] : []),
  ].map((item) => item.trim()).filter(Boolean))].slice(0, 24)
  const entry: PocketNpcBankEntry = {
    id: existing?.id || makeId('npcbank'),
    name,
    normalizedName: normalizeNpcBankName(name),
    aliases,
    role: contact.role || 'Pocket NPC',
    identityBrief: contact.identityBrief || contact.description || '',
    avatarUrl: contact.avatarOverrideUrl || contact.sourceAvatarUrl || contact.avatarUrl || '',
    accent: accent(contact.accent),
    messagingStyle: {
      talkativeness: percentage(contact.messagingStyle?.talkativeness, 50),
      fragmentation: percentage(contact.messagingStyle?.fragmentation, 35),
    },
    tags: existing?.tags || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  bank.entries = [entry, ...bank.entries.filter((item) => item.id !== entry.id)].slice(0, MAX_NPC_BANK_ENTRIES)
  bank.updatedAt = now
  return entry
}

export function contactFromNpcBank(entry: PocketNpcBankEntry, now: string, makeId: (prefix: string) => string): PocketContact {
  return {
    id: makeId('contact'),
    name: entry.name,
    role: entry.role || 'Pocket NPC',
    description: entry.identityBrief,
    identityBrief: entry.identityBrief,
    sceneNote: '',
    avatarUrl: entry.avatarUrl,
    sourceAvatarUrl: entry.avatarUrl,
    avatarOverrideUrl: '',
    accent: entry.accent,
    sourceAccent: '',
    colorMode: 'pocket',
    source: { kind: 'npc', origin: 'manual', description: entry.identityBrief, bankId: entry.id },
    relationship: 'background',
    presence: { inScene: false, lastSceneAt: '' },
    contextPolicy: { pinned: false },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' },
    messagingStyle: { ...entry.messagingStyle },
    createdAt: now,
    updatedAt: now,
  }
}

export function applyNpcBankProfile(contact: PocketContact, entry: PocketNpcBankEntry, now: string): PocketContact {
  if (contact.source.kind !== 'npc') return contact
  contact.name = entry.name
  contact.role = entry.role || contact.role
  contact.description = entry.identityBrief
  contact.identityBrief = entry.identityBrief
  contact.avatarUrl = entry.avatarUrl
  contact.sourceAvatarUrl = entry.avatarUrl
  contact.accent = entry.accent
  contact.messagingStyle = { ...entry.messagingStyle }
  contact.source = { ...contact.source, description: entry.identityBrief, bankId: entry.id }
  contact.updatedAt = now
  return contact
}

export function removeNpcBankEntry(bank: PocketNpcBank, bankId: string, now: string): boolean {
  const before = bank.entries.length
  bank.entries = bank.entries.filter((entry) => entry.id !== bankId)
  if (bank.entries.length === before) return false
  bank.updatedAt = now
  return true
}
