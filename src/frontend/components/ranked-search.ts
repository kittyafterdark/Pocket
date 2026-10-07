export interface SearchRow { node: HTMLElement; name: string; terms: string }

const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase()

/** Rank within each source group; clearing restores its original order. */
export function applyRankedSearch(rows: SearchRow[], value: string): number {
  const query = normalize(value), tokens = query.split(/\s+/).filter(Boolean)
  const ranked = rows.map((row, index) => {
    const name = normalize(row.name), terms = normalize(row.terms)
    const matches = tokens.every(token => terms.includes(token))
    const score = !query ? 0 : name === query ? 0 : name.startsWith(query) ? 1 : name.split(/\s+/).some(word => word.startsWith(query)) ? 2 : name.includes(query) ? 3 : tokens.every(token => name.includes(token)) ? 4 : 5
    row.node.dataset.pocketSearchResult = 'true'
    row.node.hidden = !matches
    return { row, index, score }
  }).sort((a, b) => a.score - b.score || a.index - b.index)
  for (const { row } of ranked) row.node.parentElement?.appendChild(row.node)
  return ranked.filter(({ row }) => !row.node.hidden).length
}
