import {test,expect} from 'bun:test'
import {BUILTIN_STICKER_PACKS,builtinStickerToken} from '../src/domain/builtin-sticker-packs.js'
import {normalizeStickerLibrary,libraryStickers,stickerPackAction,messageEmotes,normalizeMessageEmotes,stickerToken} from '../src/domain/sticker-packs.js'
import {nativeFor} from '../src/domain/native-apps.js'
import {builtinStickerUrl} from '../src/frontend/builtin-sticker-assets.js'
import {applySocialMutation,normalizeSocialState} from '../src/domain/social.js'
import type {PhoneState} from '../src/types.js'
import {NativeAppsRuntime} from '../src/backend/native-apps.js'
import {defaultLauncherLayout,setPocketAppInstalled} from '../src/domain/launcher.js'

test('all four supplied packs have unique stable references and preserve PNG/GIF bytes',()=>{
  const images=BUILTIN_STICKER_PACKS.flatMap(p=>p.items)
  expect(images.length).toBe(199);expect(new Set(images.map(s=>s.id)).size).toBe(199)
  expect(images.filter(s=>s.animated).length).toBe(52)
  for(const s of images){const data=builtinStickerUrl(s.id),bytes=Buffer.from(data.split(',')[1],'base64');expect(bytes.subarray(0,s.animated?3:4).toString('hex')).toBe(s.animated?'474946':'89504e47');expect(data.startsWith(s.animated?'data:image/gif;':'data:image/png;')).toBe(true)}
  expect(builtinStickerUrl('https://external.test/emoji')).toBe('')
})
test('legacy stickers remain in My stickers; custom groups validate, move and delete without losing images',()=>{
  const data=normalizeStickerLibrary({stickers:[{id:'old',imageId:'asset',description:'A wave'}]})
  expect(data.stickers[0].packId).toBeUndefined()
  stickerPackAction(data,'pack_save',{name:'Little moods'},()=> 'moods')
  stickerPackAction(data,'move',{ids:['old'],packId:'moods'},()=> '')
  expect(normalizeStickerLibrary(JSON.parse(JSON.stringify(data))).stickers[0].packId).toBe('moods')
  expect(()=>stickerPackAction(data,'move',{ids:['outsider'],packId:'moods'},()=> '')).toThrow()
  expect(()=>stickerPackAction(data,'move',{ids:['old'],packId:'gatos-cartoon'},()=> '')).toThrow()
  stickerPackAction(data,'pack_save',{id:'moods',name:'Moods'},()=> '')
  expect(data.stickerPacks[0].name).toBe('Moods')
  stickerPackAction(data,'pack_delete',{id:'moods'},()=> '')
  expect(data.stickers).toHaveLength(1);expect(data.stickers[0].packId).toBeUndefined()
  expect(normalizeStickerLibrary({stickerPacks:[{id:'all',name:'No'},{id:'gatos-cartoon',name:'No'}],installedStickerPacks:['unknown','nyas','nyas']}).installedStickerPacks).toEqual(['nyas'])
})
test('premade installs are idempotent; references and emote snapshots survive removing their pack',()=>{
  const data=normalizeStickerLibrary(null)
  stickerPackAction(data,'pack_install',{id:'nyas'},()=> '')
  stickerPackAction(data,'pack_install',{id:'nyas'},()=> '')
  expect(data.installedStickerPacks).toEqual(['nyas']);expect(libraryStickers(data)).toHaveLength(50)
  const sticker=libraryStickers(data)[0],token=stickerToken(sticker),refs=messageEmotes(data,'hello '+token)
  expect(refs).toEqual([{token,description:sticker.description,builtinId:sticker.id}])
  stickerPackAction(data,'pack_remove',{id:'nyas'},()=> '')
  expect(libraryStickers(data)).toHaveLength(0);expect(normalizeMessageEmotes(refs)).toEqual(refs)
  expect(messageEmotes(data,token)).toEqual([])
  expect(normalizeMessageEmotes([{token:':evil:',imageId:'1',imageUrl:'javascript:alert(1)'}])).toEqual([])
  expect(()=>stickerPackAction(data,'pack_install',{id:'unknown'},()=> '')).toThrow()
})
test('Discord stores inline emotes as trusted library references, isolated by phone; historical emotes survive reload',()=>{
  const state={pocketPersonaActorId:'me',pocketPersona:{displayName:'Me'},contacts:[],conversations:[],nativeApps:{me:{...nativeFor({pocketPersonaActorId:'me'}),installedStickerPacks:['gatos-cartoon']}},social:normalizeSocialState(null)} as unknown as PhoneState
  let i=0;const id=()=>String(++i),now='2026-10-31T10:00:00Z'
  state.social=applySocialMutation(state,'me',{action:'server',app:'discord',name:'The gang',channels:['general']},now,id)
  const channelId=state.social.servers[0].channels[0].id,sticker=BUILTIN_STICKER_PACKS.find(p=>p.id==='gatos-cartoon')!.items[0],text='hi '+builtinStickerToken(sticker.id)
  state.social=applySocialMutation(state,'me',{action:'post',app:'discord',channelId,text},now,id)
  const post=state.social.posts[0];expect(post.emotes?.[0].builtinId).toBe(sticker.id)
  state.nativeApps={};expect(normalizeSocialState(state.social).posts[0].emotes).toEqual(post.emotes)
  state.social=applySocialMutation(state,'me',{action:'post',app:'discord',channelId,text},now,id)
  expect(state.social.posts[1].emotes).toEqual([])
})
test('native sends premade stickers without Gallery permission and preserves installation/user boundaries',async()=>{
  const context={chatId:'session',characterId:'_none'},sent:any[]=[],users:string[]=[]
  const state={...context,pocketPersonaActorId:'me',nativeApps:{},launcherLayouts:{me:setPocketAppInstalled(defaultLauncherLayout(),'stickers',true)}} as unknown as PhoneState
  const runtime=new NativeAppsRuntime({loadState:async(_c,_a,u)=>{users.push(u||'');return state},saveState:async()=>{},sendState:async()=>{},send:()=>{},withStateLock:async(_k,fn)=>fn(),stateKey:()=> 'scope',id:()=> 'new',now:()=>'',permitted:()=>false,imageSource:async()=>{throw new Error('Should not query Gallery')},sendMessage:async(...args:any[])=>{sent.push(args)}} as any)
  const run=(action:string,data:any,requestId=action)=>runtime.handle({app:'stickers',action,data,requestId},context,'alice')
  await run('pack_install',{id:'nyas'});expect(nativeFor(state).installedStickerPacks).toEqual(['nyas'])
  const sticker=BUILTIN_STICKER_PACKS.find(p=>p.id==='nyas')!.items[0]
  await run('send',{id:sticker.id,conversationId:'dm'});expect(sent[0][4].builtinId).toBe(sticker.id);expect(sent[0][3]).toBe('alice');expect(users.every(u=>u==='alice')).toBe(true)
  await run('pack_remove',{id:'nyas'});await expect(run('send',{id:sticker.id,conversationId:'dm'},'again')).rejects.toThrow('no longer available')
  await expect(runtime.handle({app:'stickers',action:'pack_install',data:{id:'nyas'},requestId:'bad',deviceOwnerActorId:'other'},context,'alice')).rejects.toThrow('own phone')
})
