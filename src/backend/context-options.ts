import type { DevicePreferences, PocketContact } from '../types.js'

export function fullProfile(contact: PocketContact, preferences: DevicePreferences): boolean {
  return contact.contextPolicy.profileMode === 'full' || (contact.contextPolicy.profileMode !== 'compact' && preferences.preferFullProfiles === true)
}

export function profileContext(contact: PocketContact, profile: { description: string; personality: string; behavior: string }, preferences: DevicePreferences, compact: string): string {
  if (!fullProfile(contact, preferences)) return compact
  return [profile.description, profile.personality, profile.behavior, compact].filter(Boolean).join('\n\n').slice(0, 24000)
}

/** Independent lexical scan for Freeform: no synthetic ID ever reaches host activation. */
export function freeformLore(entries: any[], scan: string): string {
  return inspectFreeformLore(entries, scan).text
}

export function inspectFreeformLore(entries: any[], scan: string): {text: string; entries: Array<{id:string; title:string; bookId:string; reason:string; chars:number}>} {
  const seen = new Set<string>()
  const diagnostics: Array<{id:string; title:string; bookId:string; reason:string; chars:number}> = []
  let remaining = 12000
  const selected = [...entries].sort((a,b) => (b.priority || 0) - (a.priority || 0) || (b.order_value || 0) - (a.order_value || 0)).flatMap(entry => {
    const row = {id:String(entry.id || ''), title:String(entry.comment || entry.uid || entry.id || 'Untitled entry').slice(0,160), bookId:String(entry.world_book_id || ''), reason:'', chars:0}
    diagnostics.push(row)
    if (entry.disabled || !entry.content || seen.has(entry.id)) { row.reason = entry.disabled ? 'Disabled' : !entry.content ? 'Empty' : 'Duplicate'; return [] }
    const matches = (key: string) => {
      if (!key.trim()) return false
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (entry.use_regex) return false // Host regex/vector activation requires a real chat.
      return new RegExp(entry.match_whole_words ? `\\b${escaped}\\b` : escaped, entry.case_sensitive ? '' : 'i').test(scan)
    }
    const primary = (entry.key || []).some(matches)
    const secondary = !entry.selective || !(entry.keysecondary || []).length || entry.keysecondary.some(matches)
    const active = entry.constant || (primary && secondary)
    row.reason = entry.constant ? 'Constant' : entry.use_regex ? 'Unsupported regex' : !primary ? 'No keyword match' : !secondary ? 'Secondary keys not matched' : 'Keyword match'
    if (!active) return []
    seen.add(entry.id)
    if (remaining <= 0) { row.reason = 'Context budget exhausted'; return [] }
    const content = String(entry.content).slice(0, remaining)
    row.chars = content.length; remaining = Math.max(0, remaining - content.length - 2)
    return [content]
  })
  return {text:selected.join('\n\n'), entries:diagnostics.slice(0,200)}
}
