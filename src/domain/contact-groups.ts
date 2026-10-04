import type { PocketContactGroup } from '../types.js'

export function normalizeContactGroups(value: unknown, validIds: string[], now: string): PocketContactGroup[] {
  const ids = new Set(validIds), seen = new Set<string>()
  return (Array.isArray(value) ? value : []).slice(0, 80).flatMap(raw => {
    if (!raw || typeof raw !== 'object') return []
    const id = typeof raw.id === 'string' ? raw.id.trim().slice(0, 180) : ''
    const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 120) : ''
    if (!id || !name || seen.has(id)) return []
    seen.add(id)
    return [{ id, name, memberIds: [...new Set<string>((Array.isArray(raw.memberIds) ? raw.memberIds : []).filter((id: unknown): id is string => typeof id === 'string' && ids.has(id)))], bankGroupId: typeof raw.bankGroupId === 'string' ? raw.bankGroupId.slice(0, 180) : undefined, createdAt: Number.isFinite(Date.parse(raw.createdAt)) ? raw.createdAt : now, updatedAt: Number.isFinite(Date.parse(raw.updatedAt)) ? raw.updatedAt : now }]
  })
}

export function saveContactGroup(groups: PocketContactGroup[], input: { id?: string; name: string; memberIds: string[]; bankGroupId?: string }, validIds: string[], now: string, makeId: (prefix: string) => string): PocketContactGroup {
  const name = input.name.trim().slice(0, 120)
  if (!name) throw new Error('Give the group a name.')
  const memberIds = [...new Set(input.memberIds)]
  if (!memberIds.length) throw new Error('Choose at least one member.')
  if (memberIds.some(id => !validIds.includes(id))) throw new Error('A selected member no longer exists. Refresh the group.')
  const existing = input.id ? groups.find(group => group.id === input.id) : undefined
  if (input.id && !existing) throw new Error('That group no longer exists.')
  const group = { id: existing?.id || makeId('cast'), name, memberIds, bankGroupId: input.bankGroupId || existing?.bankGroupId, createdAt: existing?.createdAt || now, updatedAt: now }
  if (!existing && groups.length >= 80) throw new Error('The group limit has been reached.')
  if (existing) Object.assign(existing, group)
  else groups.push(group)
  return group
}
