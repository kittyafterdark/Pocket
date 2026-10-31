import { BUILTIN_STICKER_PACKS, builtinSticker, builtinStickerToken } from './builtin-sticker-packs.js'
import type { PocketSticker } from './native-apps.js'

export interface StickerGenerationPreview {id:string;imageId:string;imageUrl:string;name:string;description:string;caption:string;packId?:string}
export interface PocketStickerPack {id:string;name:string}
export interface StickerLibrary {stickers:PocketSticker[];stickerPacks:PocketStickerPack[];installedStickerPacks:string[]}
const clean=(v:unknown,max=180)=>typeof v==='string'?v.trim().slice(0,max):''
export function normalizeStickerLibrary(raw:any):StickerLibrary {
  const seen=new Set<string>(),stickerPacks:PocketStickerPack[]=[]
  for(const p of (Array.isArray(raw?.stickerPacks)?raw.stickerPacks:[]).slice(0,40)){
    const id=clean(p?.id),name=clean(p?.name,50)
    if(!id||!name||seen.has(id)||BUILTIN_STICKER_PACKS.some(b=>b.id===id)||['all','mine'].includes(id))continue
    seen.add(id);stickerPacks.push({id,name})
  }
  const ids=new Set<string>(),stickers:PocketSticker[]=[]
  for(const s of (Array.isArray(raw?.stickers)?raw.stickers:[]).slice(0,500)){
    const id=clean(s?.id),imageId=clean(s?.imageId)
    if(!id||!imageId||ids.has(id)||id.startsWith('builtin:'))continue
    ids.add(id);stickers.push({id,...(clean(s.name,70)?{name:clean(s.name,70)}:{}),imageId,imageUrl:clean(s.imageUrl,2000),description:clean(s.description,1000),caption:clean(s.caption,70),...(seen.has(s.packId)?{packId:s.packId}:{})})
  }
  const installedStickerPacks=BUILTIN_STICKER_PACKS.filter(p=>Array.isArray(raw?.installedStickerPacks)&&raw.installedStickerPacks.includes(p.id)).map(p=>p.id)
  return {stickers,stickerPacks,installedStickerPacks}
}
export function libraryStickers(data:StickerLibrary):PocketSticker[] {
  return [...data.stickers,...BUILTIN_STICKER_PACKS.filter(p=>data.installedStickerPacks.includes(p.id)).flatMap(p=>p.items.map(s=>({id:s.id,builtinId:s.id,packId:p.id,imageId:'',imageUrl:'',description:s.name,caption:''})))]
}
export const stickerLabel=(s:PocketSticker)=>s.name||s.caption||s.description
export function editSticker(data:StickerLibrary,input:any):void {
  const sticker=data.stickers.find(s=>s.id===input.id);if(!sticker)throw new Error('Choose one of your custom stickers to edit.')
  const name=clean(input.name,70);if(!name)throw new Error('Give your sticker a name.')
  const packId=validateStickerPack(data,input.packId)
  Object.assign(sticker,{name,description:clean(input.description,1000)||name,caption:clean(input.caption,70)})
  if(packId)sticker.packId=packId;else delete sticker.packId
}
export function libraryPacks(data:StickerLibrary):PocketStickerPack[] {
  return [{id:'all',name:'All'},{id:'mine',name:'My stickers'},...data.stickerPacks,...BUILTIN_STICKER_PACKS.filter(p=>data.installedStickerPacks.includes(p.id)).map(({id,name})=>({id,name}))]
}
export function inStickerPack(sticker:PocketSticker,pack:string):boolean {return pack==='all'||pack==='mine'&&!sticker.packId||sticker.packId===pack}
export function stickerPackAction(data:StickerLibrary,action:string,input:any,id:()=>string):void {
  if(action==='pack_install'||action==='pack_remove'){
    if(!BUILTIN_STICKER_PACKS.some(p=>p.id===input.id))throw new Error('Choose an available sticker pack.')
    data.installedStickerPacks=data.installedStickerPacks.filter(p=>p!==input.id)
    if(action==='pack_install')data.installedStickerPacks.push(input.id)
  }else if(action==='pack_save'){
    const name=clean(input.name,50);if(!name)throw new Error('Give the pack a name.')
    if(input.id){const pack=data.stickerPacks.find(p=>p.id===input.id);if(!pack)throw new Error('Choose one of your sticker packs.');pack.name=name}
    else {if(data.stickerPacks.length>=40)throw new Error('Your library has reached its pack limit.');data.stickerPacks.push({id:id(),name})}
  }else if(action==='pack_delete'){
    if(!data.stickerPacks.some(p=>p.id===input.id))throw new Error('Choose one of your sticker packs.')
    data.stickerPacks=data.stickerPacks.filter(p=>p.id!==input.id)
    for(const sticker of data.stickers)if(sticker.packId===input.id)delete sticker.packId
  }else if(action==='move'){
    const ids=Array.isArray(input.ids)?input.ids:[]
    if(!ids.length||new Set(ids).size!==ids.length||ids.length>500||ids.some((id:unknown)=>!data.stickers.some(s=>s.id===id)))throw new Error('Choose stickers from your own library.')
    const packId=validateStickerPack(data,input.packId)
    for(const sticker of data.stickers)if(ids.includes(sticker.id)){if(packId)sticker.packId=packId;else delete sticker.packId}
  }else throw new Error('Unknown sticker pack action.')
}
export function validateStickerPack(data:StickerLibrary,id:unknown):string|undefined {
  if(!id||id==='mine')return
  if(!data.stickerPacks.some(p=>p.id===id))throw new Error('Choose one of your custom sticker packs.')
  return String(id)
}
export interface MessageEmote {token:string;description:string;builtinId?:string;imageId?:string;imageUrl?:string}
export const stickerToken=(s:PocketSticker)=>s.builtinId?builtinStickerToken(s.builtinId):':pocket-'+s.id.replace(/[^a-zA-Z0-9_-]/g,'-')+':'
export function messageEmotes(data:StickerLibrary,text:string):MessageEmote[] {
  return libraryStickers(data).filter(s=>text.includes(stickerToken(s))).slice(0,40).map(s=>({token:stickerToken(s),description:s.description,...(s.builtinId?{builtinId:s.builtinId}:{imageId:s.imageId,imageUrl:s.imageUrl})}))
}
export function normalizeMessageEmotes(raw:unknown):MessageEmote[] {
  if(!Array.isArray(raw))return []
  const seen=new Set<string>()
  return raw.slice(0,40).flatMap(e=>{
    if(!e||typeof e.token!=='string'||!/^:[\w-]{1,230}:$/.test(e.token)||seen.has(e.token))return []
    const builtin=builtinSticker(e.builtinId),imageId=clean(e.imageId),url=clean(e.imageUrl,2000)
    if(!builtin&&(!imageId||!/^(https?:\/\/|\/[^/])/.test(url)))return []
    seen.add(e.token);return [{token:e.token,description:builtin?.name||clean(e.description,1000),...(builtin?{builtinId:builtin.id}:{imageId,imageUrl:url})}]
  })
}
