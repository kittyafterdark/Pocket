import type { SocialApp, SocialPost } from '../../domain/social.js'

const previewHash = (value: string) => [...value].reduce((hash, letter) => (hash * 31 + letter.charCodeAt(0)) >>> 0, 7)

/** Deterministic local illustration. Never requests a photo or claims to depict a real actor. */
export function socialPortrait(name: string): string {
  const hash = previewHash(name), hue = hash % 360, turn = (hash >>> 4) % 180
  return `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" focusable="false"><rect width="96" height="96" fill="hsl(${hue} 38% 25%)"/><g transform="rotate(${turn} 48 48)"><circle cx="28" cy="27" r="29" fill="hsl(${(hue + 40) % 360} 61% 71%)"/><path d="M22 96 57 10l50 86Z" fill="hsl(${(hue + 150) % 360} 54% 57%)"/><circle cx="75" cy="72" r="28" fill="hsl(${(hue + 280) % 360} 58% 81%)"/><path d="M-8 54h112" stroke="hsl(${hue} 25% 20%)" stroke-width="12"/></g></svg>`
}

const svgUrl = (content: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`
export function socialPreviewImage(kind: 'window' | 'coffee' | 'garden'): string {
  const scene = kind === 'window'
    ? '<rect width="600" height="600" fill="#1d304a"/><rect x="85" y="65" width="430" height="460" rx="170" fill="#b9d6e7"/><circle cx="380" cy="210" r="69" fill="#fff0ba"/><path d="M85 355 230 270l190 120 95-60v195H85" fill="#6c889d"/><path d="M300 65v460M85 350h430" stroke="#374963" stroke-width="22"/><path d="M55 525h490v25H55" fill="#e0b191"/><path d="M410 525v-50h55v50M405 475h65" fill="#c98178"/><path d="M437 480c-55-25-45-70-32-74 39 3 41 45 32 74m0-15c38-49 62-32 58-12-5 24-34 33-58 33" fill="#638d6f"/>'
    : kind === 'coffee'
      ? '<rect width="600" height="600" fill="#dfc9aa"/><path d="M0 190h600M200 0v600" stroke="#d1b38e" stroke-width="3"/><ellipse cx="315" cy="360" rx="160" ry="80" fill="#c7a582"/><ellipse cx="300" cy="330" rx="135" ry="92" fill="#f1e9db"/><path d="M190 230v90c0 105 220 105 220 0v-90" fill="#e9e0cf"/><path d="M405 245c98-35 116 92 5 91" fill="none" stroke="#e9e0cf" stroke-width="30"/><ellipse cx="300" cy="230" rx="111" ry="66" fill="#f8f1e5"/><ellipse cx="300" cy="231" rx="94" ry="51" fill="#9a6341"/><path d="M248 227c25-40 80-35 102 0-23 32-65 32-102 0" fill="#f6e0b8"/><path d="M160 435h170l-40 75H130Z" fill="#a77855"/><path d="M105 95h145v90H105" fill="#6b866b"/>'
      : '<rect width="600" height="600" fill="#dce8dc"/><circle cx="470" cy="130" r="80" fill="#f9e7b0"/><path d="M0 410c120-130 230-140 600-50v240H0Z" fill="#93b49a"/><path d="M50 600c40-170 160-200 270-250s100-120 120-180" fill="none" stroke="#d5c7a8" stroke-width="70"/><g fill="#4d7d62"><ellipse cx="140" cy="240" rx="58" ry="110"/><ellipse cx="80" cy="340" rx="50" ry="75"/><ellipse cx="510" cy="440" rx="80" ry="120"/></g><g fill="#c8889c"><circle cx="100" cy="360" r="14"/><circle cx="150" cy="290" r="12"/><circle cx="510" cy="400" r="15"/><circle cx="540" cy="470" r="13"/></g>'
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">${scene}</svg>`)
}

export interface SocialPreviewStory { name: string; handle: string; caption: string; image: string }
export const SOCIAL_PREVIEW_STORIES: SocialPreviewStory[] = [
  { name: 'Fern', handle: 'fern.frames', caption: 'A quiet corner, before the day gets loud.', image: socialPreviewImage('window') },
  { name: 'Mika', handle: 'mika.mornings', caption: 'One small ritual. Very good coffee.', image: socialPreviewImage('coffee') },
  { name: 'June', handle: 'junebug', caption: 'Taking the long way home.', image: socialPreviewImage('garden') },
]

/** Local design examples, deliberately outside domain state, storage and generation context. */
export function socialPreviewPosts(app: SocialApp): SocialPost[] {
  if (app === 'discord') return []
  const rows = app === 'twitter'
    ? [{ name: 'Mika', handle: 'mika_mornings', text: 'opening a window counts as going outside. i have decided.', tags: [] }, { name: 'The little bookshop', handle: 'littlebookshop', text: 'A small reminder: you are allowed to buy a book just because the cover makes you happy.', tags: [] }, { name: 'Fern', handle: 'fernframes', text: 'Today’s weather report: excellent light, questionable plans.', imageUrl: socialPreviewImage('window'), photo: 'An illustrated arched window, sunlit hills and a small plant.', tags: [] }]
    : app === 'instagram'
      ? [{ name: 'Fern', handle: 'fern.frames', text: 'soft light, slow morning. a little space to breathe.', imageUrl: socialPreviewImage('window'), photo: 'An illustrated sunlit window looking over hills.', tags: ['quietcorners', 'morninglight'] }, { name: 'Mika', handle: 'mika.mornings', text: 'the first sip is a personality trait', imageUrl: socialPreviewImage('coffee'), photo: 'An illustrated latte on a warm café table.', tags: ['coffeeandcompany'] }, { name: 'June', handle: 'junebug', text: 'somewhere along the long way home 🌿', imageUrl: socialPreviewImage('garden'), photo: 'An illustrated garden path winding through flowers.', tags: ['littlewalks'] }]
      : [{ name: 'June', handle: 'junebug', title: 'A small collection of good things', text: 'windows left open\nbooks with notes in the margins\nsomeone remembering how you take your tea\n\nthat’s it. that’s the post.', tags: ['little things', 'a very small list'] }, { name: 'Mika', handle: 'moonlit-mika', text: 'we should bring back taking a notebook everywhere and writing down one incredibly dramatic sentence at a time', tags: ['writer problems', 'actually i never stopped'] }, { name: 'Fern', handle: 'fern-and-fiction', text: 'a window seat is a state of mind', imageUrl: socialPreviewImage('window'), photo: 'An illustrated window seat in warm afternoon light.', tags: ['soft places', 'art'] }]
  return rows.map((row, index) => ({ ...row, id: `preview:${app}:${index}`, app, account: { id: `preview:${row.handle}`, name: row.name, handle: row.handle }, text: row.text, createdAt: '', likedBy: [] }))
}
