import type { PocketSticker } from '../../domain/native-apps.js'
import { inStickerPack, libraryPacks, libraryStickers, stickerLabel, type StickerLibrary } from '../../domain/sticker-packs.js'
import { builtinStickerUrl } from '../builtin-sticker-assets.js'
import { button, el } from '../shared.js'

export const stickerImageUrl=(s:PocketSticker)=>s.builtinId?builtinStickerUrl(s.builtinId):s.imageUrl
export function stickerCollection(options:{library:StickerLibrary;pack?:string;query?:string;busy?:boolean;verb:string;choose(s:PocketSticker):void;remember?(pack:string,query:string):void}) {
  const root=el('div','st-collection'),search=el('input','st-collection-search'),rail=el('div','st-pack-rail'),grid=el('div','st-collection-grid'),items=libraryStickers(options.library),packs=libraryPacks(options.library)
  let active=packs.some(p=>p.id===options.pack)?options.pack!:'all'
  search.type='search';search.placeholder=options.verb==='Insert'?'Find an emote':'Find a sticker';search.setAttribute('aria-label',options.verb==='Insert'?'Find an emote':'Find a sticker');search.value=options.query||''
  rail.setAttribute('role','group');rail.setAttribute('aria-label','Sticker packs');grid.setAttribute('role','group');grid.setAttribute('aria-label',options.verb==='Insert'?'Emotes':'Stickers')
  const draw=()=>{
    options.remember?.(active,search.value);grid.replaceChildren()
    for(const b of rail.querySelectorAll<HTMLButtonElement>('button'))b.setAttribute('aria-pressed',String(b.dataset.pack===active))
    const filtered=items.filter(s=>inStickerPack(s,active)&&`${s.name||''} ${s.description} ${s.caption}`.toLowerCase().includes(search.value.toLowerCase()))
    for(const sticker of filtered){const b=button('','st-chat-sticker');b.setAttribute('aria-label',`${options.verb} ${options.verb==='Insert'?'emote':'sticker'} ${stickerLabel(sticker)}${sticker.packId?' ('+packs.find(p=>p.id===sticker.packId)?.name+')':''}`);b.title=stickerLabel(sticker);b.disabled=Boolean(options.busy);const image=el('img');image.src=stickerImageUrl(sticker);image.alt='';image.loading='lazy';b.append(image);b.onclick=()=>options.choose(sticker);grid.append(b)}
    if(!filtered.length)grid.append(el('p','st-collection-empty',search.value?'No matches in this pack.':'This pack is waiting for stickers.'))
  }
  for(const pack of packs){const b=button(pack.name,'st-pack-chip');b.dataset.pack=pack.id;b.onclick=()=>{active=pack.id;draw()};rail.append(b)}
  search.oninput=draw;root.append(search,rail,grid);draw();queueMicrotask(()=>{const selected=rail.querySelector<HTMLButtonElement>('[aria-pressed=true]');if(rail.isConnected&&selected)rail.scrollLeft=Math.max(0,selected.offsetLeft-rail.offsetLeft-(rail.clientWidth-selected.clientWidth)/2)});return {root,focus:()=>search.focus({preventScroll:true})}
}
