export function lorebookSearchText(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}+/gu, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ')
}

export function lorebookEntryTitle(title: string): { name: string; category: string } {
  const parts = title.normalize('NFKC').split(/\s*[|›>]\s*/).map(part => part.trim()).filter(Boolean)
  return { name: parts.at(-1) || title, category: parts.slice(0, -1).join(' · ') }
}

/** Prefer a person's name or keyword over category text and incidental substrings. */
export function rankLorebookSearch<T>(items: T[], query: string, fields: (item: T) => { title: string; keys?: string[]; preview?: string }): T[] {
  const normalized = lorebookSearchText(query)
  if (!normalized) return items
  const terms = normalized.split(' ')
  const wordsMatch = (text: string, prefix: boolean) => {
    const words = text.split(' ')
    return terms.every(term => words.some(word => prefix ? word.startsWith(term) : word === term))
  }
  const score = (item: T): number => {
    const raw = fields(item), title = lorebookSearchText(raw.title), name = lorebookSearchText(lorebookEntryTitle(raw.title).name)
    const keys = (raw.keys || []).map(lorebookSearchText), preview = lorebookSearchText(raw.preview || '')
    if (name === normalized) return 0
    if (keys.includes(normalized)) return 1
    if (wordsMatch(name, false)) return 2
    if (name.startsWith(normalized)) return 3
    if (wordsMatch(name, true)) return 4
    if (wordsMatch(title, false)) return 5
    if (keys.some(key => wordsMatch(key, true))) return 6
    if (wordsMatch(title, true)) return 7
    if (terms.every(term => title.includes(term))) return 20
    if (terms.every(term => [...keys, title].some(text => text.includes(term)))) return 25
    if (wordsMatch(preview, false)) return 30
    if (terms.every(term => `${title} ${keys.join(' ')} ${preview}`.includes(term))) return 40
    return Infinity
  }
  return items.map((item, index) => ({ item, index, score: score(item) })).filter(entry => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || a.index - b.index).map(entry => entry.item)
}
