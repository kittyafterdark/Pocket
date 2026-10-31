import { normalizeStickerLibrary, type PocketStickerPack } from './sticker-packs.js'
import { snapshotActivityClock } from './activity-clock.js'
import type { PhoneState } from '../types.js'
import { normalizeWallet, type PocketWallet, walletText as text } from './pocket-wallet.js'

export const NATIVE_APP_IDS=['bank','birthdays','browser','maps','twitch','stickers'] as const
export type NativeApp=typeof NATIVE_APP_IDS[number]
export interface PocketBirthday { id:string; name:string; month:number; day:number; year?:number; contactId?:string; note:string }
export interface PocketSticker { name?:string; packId?:string; builtinId?:string; id:string; imageId:string; imageUrl:string; description:string; caption:string }
export interface PocketWebPage { id:string; title:string; address:string; summary:string; paragraphs:string[]; kind:'article'|'forum'|'listing'|'site' }
export interface PocketPlace { id:string; name:string; city:string; category:string; description:string; address:string; hours:string; price:string; x:number; y:number; saved:boolean }
export interface PocketWebTab { id:string; pages:string[]; index:number }
export interface PocketQuiz { id:string; title:string; summary:string; results:Array<{id:string;title:string;text:string}>; questions:Array<{text:string;choices:Array<{text:string;result:string}>}>; answers?:number[]; partner?:{name:string;answers:number[]} }
export interface PocketBrowser { pages:PocketWebPage[]; places:PocketPlace[]; tabs:PocketWebTab[]; activeTab:string; history:string[]; bookmarks:string[]; quizzes:PocketQuiz[] }
export interface PocketStream { id:string; streamer:string; title:string; category:string; scene:string; viewers:number; chat:Array<{id:string;author:string;text:string;donation?:number}>; imageId?:string; imageUrl?:string; own?:boolean; followed?:boolean; live:boolean; startedAt?:string; peak:number }
export interface NativeAppsState { revision:number; receipts:string[]; wallet:PocketWallet; birthdays:PocketBirthday[]; stickers:PocketSticker[]; stickerPacks:PocketStickerPack[]; installedStickerPacks:string[]; browser:PocketBrowser; streams:PocketStream[]; twitchNick:string }
const list=(v:unknown):any[]=>Array.isArray(v)?v:[]
const integer=(v:unknown,min:number,max:number,fallback=min)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Math.round(Number(v)))):fallback
const strings=(v:unknown,max=120)=>list(v).filter(x=>typeof x==='string').map(x=>text(x,max))
export function validBirthday(month:number,day:number,year=2000):boolean { const d=new Date(0);d.setUTCFullYear(year,month-1,day);return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day }
export function birthday(raw:any):PocketBirthday {
  const month=Number(raw?.month),day=Number(raw?.day),year=raw?.year===''||raw?.year==null?undefined:Number(raw.year)
  if(!text(raw?.name)||!Number.isInteger(month)||!Number.isInteger(day)||year!==undefined&&(!Number.isInteger(year)||year<1||year>9999)||!validBirthday(month,day,year))throw new Error('Enter a name and a valid birthday.')
  return {id:text(raw.id),name:text(raw.name),month,day,...(year?{year}:{}),contactId:text(raw.contactId)||undefined,note:text(raw.note,500)}
}
export function nextBirthday(value:PocketBirthday,today:string):string {
  const year=Number(today.slice(0,4));if(!Number.isFinite(year)||year<1)return ''
  for(let y=year;y<=year+8;y++){if(!validBirthday(value.month,value.day,y))continue;const date=`${String(y).padStart(4,'0')}-${String(value.month).padStart(2,'0')}-${String(value.day).padStart(2,'0')}`;if(date>=today.slice(0,10))return date}return ''
}
export function normalizeQuiz(raw:any,id:string):PocketQuiz {
  const results=list(raw?.results).slice(0,5).map((r,i)=>({id:text(r.id,40)||`result-${i}`,title:text(r.title),text:text(r.text,600)}))
  if(results.length<2||results.some(r=>!r.title)||new Set(results.map(r=>r.id)).size!==results.length)throw new Error('The quiz needs at least two distinct results.')
  const questions=list(raw?.questions).slice(0,8).map(q=>({text:text(q.text,300),choices:list(q.choices).slice(0,5).map(c=>({text:text(c.text,200),result:text(c.result,40)}))}))
  if(!text(raw?.title)||questions.length<3||questions.some(q=>!q.text||q.choices.length<2||q.choices.some(c=>!c.text||!results.some(r=>r.id===c.result))))throw new Error('The quiz returned incomplete questions. Try again.')
  const quiz:PocketQuiz={id,title:text(raw.title),summary:text(raw.summary,500),results,questions}
  if(Array.isArray(raw.answers)&&raw.answers.length===questions.length&&raw.answers.every((a:number,i:number)=>Number.isInteger(a)&&questions[i].choices[a]))quiz.answers=[...raw.answers]
  if(raw.partner&&text(raw.partner.name)&&Array.isArray(raw.partner.answers)&&raw.partner.answers.length===questions.length&&raw.partner.answers.every((a:number,i:number)=>Number.isInteger(a)&&questions[i].choices[a]))quiz.partner={name:text(raw.partner.name),answers:[...raw.partner.answers]}
  return quiz
}
export function quizResult(quiz:PocketQuiz,answers=quiz.answers):PocketQuiz['results'][number]|undefined {
  if(!answers||answers.length!==quiz.questions.length||answers.some((a,i)=>!quiz.questions[i].choices[a]))return
  const counts=new Map<string,number>();answers.forEach((a,i)=>{const key=quiz.questions[i].choices[a].result;counts.set(key,(counts.get(key)||0)+1)})
  return [...quiz.results].sort((a,b)=>(counts.get(b.id)||0)-(counts.get(a.id)||0))[0]
}
export function normalizeBrowser(raw:any):PocketBrowser {
  const pages:PocketWebPage[]=list(raw?.pages).slice(-100).filter(p=>p?.id&&p.title).map(p=>({id:text(p.id),title:text(p.title),address:text(p.address,180),summary:text(p.summary,500),paragraphs:strings(p.paragraphs,1800).slice(0,8),kind:['article','forum','listing'].includes(p.kind)?p.kind:'site'}))
  const ids=new Set(pages.map(p=>p.id)),tabs:PocketWebTab[]=list(raw?.tabs).slice(-12).filter(t=>t?.id).map(t=>{const path=strings(t.pages).filter(id=>ids.has(id)).slice(-30);return{id:text(t.id),pages:path,index:integer(t.index,-1,path.length-1,-1)}})
  return {pages,places:list(raw?.places).slice(-100).filter(p=>p?.id&&p.name).map(p=>({id:text(p.id),name:text(p.name),city:text(p.city),category:text(p.category,40)||'other',description:text(p.description,900),address:text(p.address,200),hours:text(p.hours),price:text(p.price),x:integer(p.x,8,92,50),y:integer(p.y,8,92,50),saved:p.saved===true})),tabs,activeTab:tabs.some(t=>t.id===raw?.activeTab)?raw.activeTab:tabs.at(-1)?.id||'',history:strings(raw?.history).filter(id=>ids.has(id)).slice(-50),bookmarks:strings(raw?.bookmarks).filter(id=>ids.has(id)).slice(-40),quizzes:list(raw?.quizzes).slice(-30).flatMap(q=>{try{return [normalizeQuiz(q,text(q.id))]}catch{return []}})}
}
export function normalizeNativeApps(raw:any):NativeAppsState {
  return {revision:integer(raw?.revision,0,Number.MAX_SAFE_INTEGER,0),receipts:strings(raw?.receipts,200).slice(-100),wallet:normalizeWallet(raw?.wallet),birthdays:list(raw?.birthdays).slice(0,100).flatMap(b=>{try{return [birthday(b)]}catch{return []}}),...normalizeStickerLibrary(raw),browser:normalizeBrowser(raw?.browser),streams:list(raw?.streams).slice(-12).filter(s=>s?.id&&s.title).map(s=>({id:text(s.id),streamer:text(s.streamer,80),title:text(s.title),category:text(s.category,40),scene:text(s.scene,1500),viewers:integer(s.viewers,0,100000000,0),peak:integer(s.peak,0,100000000,0),chat:list(s.chat).slice(-80).filter(m=>m?.id&&m.author&&m.text).map(m=>({id:text(m.id),author:text(m.author,80),text:text(m.text,600),...(Number(m.donation)>0?{donation:Number(m.donation)}:{})})),imageId:text(s.imageId,180)||undefined,imageUrl:text(s.imageUrl,2000)||undefined,own:s.own===true,followed:s.followed===true,live:s.live===true,startedAt:text(s.startedAt,40)||undefined})),twitchNick:text(raw?.twitchNick,40)}
}
export function nativeStoryDate(state:PhoneState):string {
  const clock=snapshotActivityClock(state);if(!clock.storyAt)return ''
  const offset=typeof clock.storyTimezoneOffsetMinutes==='number'&&Number.isFinite(clock.storyTimezoneOffsetMinutes)&&Math.abs(clock.storyTimezoneOffsetMinutes)<=840?clock.storyTimezoneOffsetMinutes:0
  return new Date(Date.parse(clock.storyAt)-offset*60000).toISOString().slice(0,10)
}
export function nativeFor(state:{nativeApps?:Record<string,NativeAppsState>;pocketPersonaActorId:string}):NativeAppsState {return normalizeNativeApps(state.nativeApps?.[state.pocketPersonaActorId])}
export function openBrowserPage(browser:PocketBrowser,id:string,newId:string):void {
  if(!browser.pages.some(p=>p.id===id))throw new Error('That saved page is no longer available.')
  let tab=browser.tabs.find(t=>t.id===browser.activeTab)
  if(!tab){tab={id:newId,pages:[],index:-1};browser.tabs.push(tab);browser.tabs=browser.tabs.slice(-12);browser.activeTab=tab.id}
  if(tab.pages[tab.index]!==id){tab.pages=[...tab.pages.slice(0,tab.index+1),id].slice(-30);tab.index=tab.pages.length-1}
  browser.history=[...browser.history.filter(p=>p!==id),id].slice(-50)
}
export function starterQuiz():PocketQuiz {
  return normalizeQuiz({title:'What kind of little getaway are you?',summary:'Three tiny choices. One very you afternoon.',results:[{id:'explore',title:'The curious wanderer',text:'A new street, an unexpected shop, a story to bring home.'},{id:'cozy',title:'The cosy hideaway',text:'A warm drink, familiar company and nowhere else to be.'}],questions:[{text:'The afternoon is yours. Where first?',choices:[{text:'Somewhere I have never been',result:'explore'},{text:'My favourite café',result:'cozy'}]},{text:'What goes in your bag?',choices:[{text:'A camera',result:'explore'},{text:'A book',result:'cozy'}]},{text:'A little rain. Your next move?',choices:[{text:'Find a new place to duck into',result:'explore'},{text:'Head home and put the kettle on',result:'cozy'}]}]},'starter-getaway')
}
