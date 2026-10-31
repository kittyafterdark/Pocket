import type { MessageEmote } from '../../domain/sticker-packs.js'
import { builtinStickerUrl } from '../builtin-sticker-assets.js'
import { el } from '../shared.js'

/** Only trusted, persisted catalog/asset references become images. All other text stays text. */
export function discordEmoteText(text:string,emotes:MessageEmote[]=[]):HTMLElement {
  const paragraph=el('p','lp-discord-message-text'),known=new Map(emotes.map(e=>[e.token,e]))
  let hasText=false,hasEmote=false
  for(const piece of text.split(/(:[\w-]{1,230}:)/g)){
    const emote=known.get(piece),url=emote?.builtinId?builtinStickerUrl(emote.builtinId):emote?.imageUrl
    if(emote&&url){const image=el('img','lp-discord-emote');image.src=url;image.alt=emote.description;image.title=emote.description;image.loading='lazy';paragraph.append(image);hasEmote=true}
    else {paragraph.append(document.createTextNode(piece));if(piece.trim())hasText=true}
  }
  if(hasEmote&&!hasText)paragraph.classList.add('lp-discord-emotes-only')
  return paragraph
}
