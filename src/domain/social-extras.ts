export interface SocialGif { url: string; description: string }
export const QUICK_REACTIONS = ['😭','🔥','❤️','✅','💀','😂'] as const
export const EMOJI_CHOICES: Array<[string,string]> = [
  ['😭','cry sob'],['🔥','fire'],['❤️','heart love'],['✅','check yes'],['💀','skull dead'],['😂','laugh joy'],
  ['👍','thumbs up'],['👎','thumbs down'],['🥰','love smile'],['😍','heart eyes'],['🥺','pleading'],['😎','cool'],
  ['🤔','thinking'],['🙃','upside down'],['😅','sweat smile'],['😳','flushed'],['😏','smirk'],['😴','sleep'],
  ['😱','scream'],['😡','angry'],['🤯','mind blown'],['🤡','clown'],['👀','eyes'],['🫶','heart hands'],
  ['✨','sparkles'],['🎉','party'],['💯','hundred'],['🖤','black heart'],['💜','purple heart'],['💙','blue heart'],
  ['💛','yellow heart'],['🌈','rainbow'],['🤝','handshake'],['🙏','thanks pray'],['🫡','salute'],['🤍','white heart'],
  ['🤭','giggle'],['🤷','shrug'],['😔','sad'],['🐈','cat'],['🌸','flower'],['☕','coffee'],['🍿','popcorn'],
  ['💅','nails'],['🫠','melting'],['💔','broken heart'],['🫂','hug'],['💃','dance'],['🚩','red flag'],
]
export function validEmoji(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 24 && /\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]\uFE0F?\u20E3/u.test(value)
    && /^[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0F\u200D\u20E30-9#*]+$/u.test(value)
}
export function normalizeReactions(value: unknown): Array<{emoji:string; actorIds:string[]}> {
  if (!Array.isArray(value)) return []
  const merged = new Map<string,Set<string>>()
  for (const item of value.slice(0,24)) {
    if (!item || !validEmoji(item.emoji) || !Array.isArray(item.actorIds)) continue
    const ids=merged.get(item.emoji)||new Set<string>()
    for(const id of item.actorIds.slice(0,40)) if(typeof id==='string' && id.trim() && id.length<=180) ids.add(id)
    merged.set(item.emoji,ids)
  }
  return [...merged].filter(([,ids])=>ids.size).map(([emoji,ids])=>({emoji,actorIds:[...ids].slice(0,40)}))
}
export function socialGif(value: unknown): SocialGif | undefined {
  if (!value || typeof value!=='object') return
  const raw=value as Record<string,unknown>
  if(typeof raw.url!=='string' || raw.url.length>1400) return
  try { const url=new URL(raw.url); if(url.protocol!=='https:' || url.hostname!=='media.tenor.com' || !url.pathname.endsWith('.gif') || url.username || url.password) return
    return {url:url.href,description:typeof raw.description==='string'?raw.description.slice(0,180):'Tenor GIF'}
  } catch {return}
}
export type DiscordTheme = 'gray'|'amoled'|'gradient'
export const gradientColors=(value:unknown):[string,string]|undefined => Array.isArray(value)&&value.length===2&&value.every(color=>typeof color==='string'&&/^#[0-9a-f]{6}$/i.test(color))?[value[0],value[1]]:undefined
