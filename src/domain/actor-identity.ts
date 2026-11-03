/** Conservative name matching shared by contacts, discoveries, and portable NPCs. */
export function identityName(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}+/gu, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export function identityMatches<T>(candidate: string, entries: T[], names: (entry: T) => string[]): T[] {
  const key = identityName(candidate)
  if (!key) return []
  const exact = entries.filter(entry => names(entry).some(name => identityName(name) === key))
  if (exact.length) return exact
  const tokens = key.split(' '), signature = [...tokens].sort().join(' ')
  if (tokens.length > 1) return entries.filter(entry => names(entry).some(name => identityName(name).split(' ').sort().join(' ') === signature))
  return entries.filter(entry => names(entry).some(name => identityName(name).split(' ').includes(key)))
}

export function uniqueIdentityMatch<T>(candidate: string, entries: T[], names: (entry: T) => string[]): T | undefined {
  const matches = identityMatches(candidate, entries, names)
  if (matches.length > 1) throw new Error(`Actor name “${candidate}” is ambiguous; choose an existing profile by id.`)
  return matches[0]
}
