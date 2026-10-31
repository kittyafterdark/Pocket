import { expect, test } from 'bun:test'
import { birthday, nativeFor, nativeStoryDate, nextBirthday, normalizeNativeApps, normalizeQuiz, openBrowserPage, quizResult, starterQuiz } from '../src/domain/native-apps.js'
import { convertWallet, loanPayment, normalizeWallet, payLoan, transact, walletAmount } from '../src/domain/pocket-wallet.js'
import { NativeAppsRuntime } from '../src/backend/native-apps.js'
import { defaultLauncherLayout, setPocketAppInstalled } from '../src/domain/launcher.js'
import type { PhoneState } from '../src/types.js'

test('wallet precision, external payers and conversion are deterministic and atomic',()=>{
  const wallet=normalizeWallet({currency:'JPY',balance:1000});transact(wallet,{amount:-25,label:'Tea',payer:'A friend'},'gift','2026-10-30');expect(wallet.balance).toBe(1000)
  transact(wallet,{amount:-125.4,label:'Lunch'},'lunch','2026-10-30');expect(wallet.balance).toBe(875)
  const original=structuredClone(wallet),converted=convertWallet(wallet,'USD',.01);expect(converted.balance).toBe(8.75);expect(wallet).toEqual(original)
  expect(()=>convertWallet(wallet,'USD',Number.POSITIVE_INFINITY)).toThrow();expect(wallet).toEqual(original)
  expect(walletAmount(1.2345,'KWD')).toBe(1.235);expect(()=>walletAmount(Infinity,'USD')).toThrow()
})

test('loan installments cannot debit twice in one story month or exceed remaining debt',()=>{
  const wallet=normalizeWallet({currency:'USD',balance:2000});const payment=loanPayment(1200,12,0)
  wallet.loans.push({id:'l',name:'A little project',principal:1200,remaining:1200,months:12,annualRate:0,payment,paidMonths:[]})
  payLoan(wallet,'l',0,'installment','p1','2026-10-30');expect(wallet.balance).toBe(1900);expect(wallet.loans[0].remaining).toBe(1100)
  const saved=structuredClone(wallet);expect(()=>payLoan(wallet,'l',0,'installment','p2','2026-10-31')).toThrow('already paid');expect(wallet).toEqual(saved)
  expect(()=>payLoan(wallet,'l',1101,'early','p3','2026-11-01')).toThrow();expect(wallet).toEqual(saved)
  payLoan(wallet,'l',0,'full','p4','2026-11-01','A friend');expect(wallet.balance).toBe(1900);expect(wallet.loans[0].remaining).toBe(0)
})

test('birthdays preserve unknown years and find a real next leap-day celebration',()=>{
  const leap=birthday({name:'Fern',month:2,day:29});expect(leap.year).toBeUndefined();expect(nextBirthday(leap,'2026-10-30')).toBe('2028-02-29')
  expect(()=>birthday({name:'Fern',month:2,day:30})).toThrow();expect(()=>birthday({name:'Fern',month:2,day:29,year:2023})).toThrow()
  expect(birthday({name:'Fern',month:1,day:1,year:80}).year).toBe(80)
})

test('browser tabs preserve independent back stacks and quizzes reject incomplete answers',()=>{
  const state=normalizeNativeApps(null),web=state.browser;web.pages.push({id:'a',title:'A',address:'a.pocket',summary:'',paragraphs:[],kind:'site'},{id:'b',title:'B',address:'b.pocket',summary:'',paragraphs:[],kind:'site'})
  openBrowserPage(web,'a','first');openBrowserPage(web,'b','unused');expect(web.tabs[0].pages).toEqual(['a','b']);web.tabs[0].index=0
  openBrowserPage(web,'a','unused');expect(web.tabs[0].index).toBe(0)
  const quiz=starterQuiz();expect(quizResult(quiz,[0,0,1])?.id).toBe('explore');expect(quizResult(quiz,[0])).toBeUndefined();expect(normalizeQuiz({...quiz,answers:[0,99,1]},quiz.id).answers).toBeUndefined()
  const original=structuredClone(quiz);normalizeQuiz(quiz,quiz.id);expect(quiz).toEqual(original)
})

test('app dates follow the story timezone and never promote an unknown date from wall time',()=>{
  const state={roleplayNow:'2026-11-01T01:00:00.000Z',roleplayClockPrecision:'exact',roleplayTimezoneOffsetMinutes:180} as PhoneState
  expect(nativeStoryDate(state)).toBe('2026-10-31')
  expect(nativeStoryDate({...state,roleplayClockPrecision:'unknown',roleplayClockSource:'legacy'})).toBe('')
})

function fixture(){
  let layout=defaultLauncherLayout();for(const app of ['bank','birthdays','browser','maps','twitch','stickers'] as const)layout=setPocketAppInstalled(layout,app,true)
  const state={chatId:'_freeform_fixture',characterId:'_none',pocketPersonaActorId:'owner',pocketPersona:{displayName:'Fern'},roleplayNow:'2026-10-30T10:00:00',roleplayClockPrecision:'exact',weather:{location:'Harbour'},contacts:[],conversations:[],launcherLayouts:{owner:layout},nativeApps:{}} as unknown as PhoneState
  const store=new Map<string,PhoneState>(),sends:any[]=[],images:any[]=[],messages:any[]=[],events:any[]=[],requests:any[]=[];let writes=0,response:any={pages:[{title:'A little café',summary:'A quiet corner.',paragraphs:['Warm windows.']}]},wait:Promise<void>|undefined
  const key=(context:any,user?:string)=>JSON.stringify([user||'',context.chatId,context.characterId]);store.set(key(state),structuredClone(state))
  const host:any={id:(prefix:string)=>`${prefix}-${requests.length}-${sends.length}-${writes}-${images.length}`,now:()=> '2026-10-30T12:00:00Z',stateKey:(a:string,b:string)=>a+'|'+b,withStateLock:async(_:string,f:()=>any)=>f(),permitted:()=>true,
    loadState:async(chatId:string,characterId:string,user?:string)=>structuredClone(store.get(key({chatId,characterId},user))||{...state,chatId,characterId}),
    saveState:async(next:PhoneState,user?:string)=>{writes++;store.set(key(next,user),structuredClone(next))},sendState:async()=>{},send:(payload:any,user?:string)=>sends.push({...payload,user}),
    generate:async(task:string,id:string,input:any,user?:string)=>{requests.push({task,id,input,user});if(wait)await wait;return {content:JSON.stringify(response)}},
    image:async(input:any)=>{images.push(input);return {ok:true,imageId:'new-image',imageUrl:'/images/new-image'}},cancelImage(){},uploadImage:async()=>({id:'upload',url:'/images/upload'}),imageSource:async(id:string)=>({url:'/images/'+id}),
    sendMessage:async(...input:any[])=>messages.push(input),addEvent:async(...input:any[])=>events.push(input),
  }
  const runtime=new NativeAppsRuntime(host),context={chatId:state.chatId,characterId:state.characterId};let sequence=0
  return {runtime,host,state,context,store,sends,requests,images,messages,events,get writes(){return writes},set response(value:any){response=value},set wait(value:Promise<void>|undefined){wait=value},data:(user?:string)=>nativeFor(store.get(key(state,user))||state),run:(app:string,action:string,data:any={},user?:string,id='request-'+(++sequence))=>runtime.handle({app,action,data,requestId:id},context,user)}
}

test('native backend isolates sessions/users, gates installation and deduplicates wallet actions',async()=>{
  const h=fixture();await h.run('bank','balance',{amount:100},'alice');await h.run('bank','transaction',{amount:-20,label:'Lunch'},'alice','same-request');await h.run('bank','transaction',{amount:-20,label:'Lunch'},'alice','same-request')
  expect(h.data('alice').wallet.balance).toBe(80);expect(h.data('bob').wallet.balance).toBe(0)
  const state=await h.host.loadState(h.context.chatId,h.context.characterId,'alice');state.launcherLayouts.owner=setPocketAppInstalled(state.launcherLayouts.owner,'bank',false);await h.host.saveState(state,'alice')
  await expect(h.run('bank','balance',{amount:0},'alice')).rejects.toThrow('App Store');expect(h.data('alice').wallet.balance).toBe(80)
})

test('private pages never write to persistent Pocket state and clear aborts late results',async()=>{
  const h=fixture();await h.run('browser','search',{query:'quiet cafés',private:true},'alice');expect(h.writes).toBe(0);expect(h.sends.at(-1).privateBrowser.pages[0].title).toBe('A little café');expect(h.data('alice').browser.pages).toHaveLength(0)
  let finish!:()=>void;h.wait=new Promise(resolve=>finish=resolve);const pending=h.run('browser','search',{query:'private late page',private:true},'alice')
  while(h.requests.length<2)await new Promise(resolve=>setTimeout(resolve,0))
  await h.run('browser','private_clear',{},'alice');finish();await expect(pending).rejects.toHaveProperty('name','AbortError');expect(h.sends.at(-1).privateBrowser.pages).toHaveLength(0);expect(h.writes).toBe(0)
})

test('maps, birthdays and stickers use native Timeline/images/message boundaries',async()=>{
  const h=fixture();h.response={places:[{name:'Sunlit Gallery',description:'Local art.',x:900,y:-5}]};await h.run('maps','search',{query:'an exhibition'});const place=h.data().browser.places[0];expect(place.x).toBe(92);expect(place.y).toBe(8)
  await h.run('maps','place_timeline',{id:place.id,when:'tomorrow afternoon'});expect(h.events[0][1].title).toBe('Visit Sunlit Gallery')
  await h.run('birthdays','save',{name:'Fern',month:11,day:2});const b=h.data().birthdays[0];await h.run('birthdays','timeline',{id:b.id});expect(h.events[1][1].date).toBe('2026-11-02')
  await h.run('stickers','generate',{description:'Sleepy coffee chibi',caption:'oh hi'});expect(h.data().stickers).toHaveLength(0);const preview=h.sends.at(-1).stickerPreview;await h.run('stickers','accept',{previewId:preview.id});const sticker=h.data().stickers[0];expect(h.images[0].prompt).toContain('chibi');await h.run('stickers','send',{id:sticker.id,conversationId:'dm'});expect(h.messages[0][4].imageId).toBe('new-image');expect(h.messages[0][4].caption).toBe('oh hi');expect(h.messages[0][2]).toContain('Sleepy coffee chibi');expect(h.messages[0][2]).toContain('Caption: oh hi')
})

test('stream donation settles once after successful generation; failed replies cannot charge',async()=>{
  const h=fixture();await h.run('bank','balance',{amount:100});h.response={streams:[{streamer:'River',title:'A tiny garden',scene:'Watering flowers',viewers:50}]};await h.run('twitch','discover');const stream=h.data().streams[0]
  h.response={scene:'River waves',streamerReply:'Thank you!',chat:[],viewers:51};await h.run('twitch','donate',{id:stream.id,amount:10,text:'Lovely flowers'},undefined,'donate-once');await h.run('twitch','donate',{id:stream.id,amount:10},undefined,'donate-once');expect(h.data().wallet.balance).toBe(90);expect(h.data().streams[0].chat.some(m=>m.donation===10)).toBe(true)
  h.host.generate=async()=>{throw new Error('provider offline')};await expect(h.run('twitch','donate',{id:stream.id,amount:10})).rejects.toThrow('offline');expect(h.data().wallet.balance).toBe(90)
})

test('late public generation rejects conflicting edits and uninstalled apps without overwriting data',async()=>{
  const h=fixture();let finish!:()=>void;h.wait=new Promise(resolve=>finish=resolve);const pending=h.run('browser','search',{query:'café'})
  while(!h.requests.length)await new Promise(resolve=>setTimeout(resolve,0));await h.run('bank','balance',{amount:42});finish();await expect(pending).rejects.toThrow('changed');expect(h.data().wallet.balance).toBe(42);expect(h.data().browser.pages).toHaveLength(0)
  h.wait=undefined;await h.run('browser','search',{query:'café'});expect(h.data().browser.pages).toHaveLength(1)
})

test('permission revocation aborts a late generation and does not persist provider output',async()=>{
  const h=fixture();let finish!:()=>void;h.wait=new Promise(resolve=>finish=resolve);const pending=h.run('browser','search',{query:'a café'})
  while(!h.requests.length)await new Promise(resolve=>setTimeout(resolve,0))
  h.host.permitted=()=>false;h.runtime.revoke('generation');finish()
  await expect(pending).rejects.toHaveProperty('name','AbortError');expect(h.data().browser.pages).toHaveLength(0);expect(h.writes).toBe(0)
})

test('sticker generation previews require acceptance; retry/discard/cancel cannot silently add images',async()=>{
  const h=fixture()
  await h.run('stickers','generate',{name:'First',description:'A small cat'},'alice','preview-1')
  expect(h.data('alice').stickers).toHaveLength(0)
  await h.run('stickers','discard',{previewId:'preview-1'},'alice')
  await expect(h.run('stickers','accept',{previewId:'preview-1'},'alice')).rejects.toThrow('preview')
  await h.run('stickers','generate',{name:'Second',description:'A happier cat',caption:'hi'},'alice','preview-2')
  await expect(h.run('stickers','accept',{previewId:'preview-2'},'bob')).rejects.toThrow('preview')
  await h.run('stickers','generate',{name:'Third',description:'A sleepy cat',caption:'hi'},'alice','preview-3')
  await expect(h.run('stickers','accept',{previewId:'preview-2'},'alice')).rejects.toThrow('preview')
  await h.run('stickers','accept',{previewId:'preview-3',name:'Sleepy loaf'},'alice','accept-3')
  await h.run('stickers','accept',{previewId:'preview-3'},'alice','accept-3')
  expect(h.data('alice').stickers).toHaveLength(1);expect(h.data('alice').stickers[0]).toMatchObject({name:'Sleepy loaf',caption:'hi',imageId:'new-image'})
  const sticker=h.data('alice').stickers[0],tokenId=sticker.id
  await h.run('stickers','edit',{id:tokenId,name:'Sleepier loaf',description:'Tucked-in cat',caption:'',imageId:'untrusted-replacement'},'alice')
  expect(h.data('alice').stickers[0]).toMatchObject({id:tokenId,name:'Sleepier loaf',imageId:'new-image',description:'Tucked-in cat',caption:''})
  await expect(h.run('stickers','edit',{id:tokenId,name:''},'alice')).rejects.toThrow('name')
  await expect(h.run('stickers','edit',{id:'builtin:nyas:nyahello',name:'Change'},'alice')).rejects.toThrow('custom')
  await h.run('stickers','generate',{description:'One more cat'},'alice','preview-4');h.runtime.cancel(h.context,'alice','stickers')
  await expect(h.run('stickers','accept',{previewId:'preview-4'},'alice')).rejects.toThrow('preview')
})


test('sticker retries keep the same chibi prompt and bypass camera scene rewriting',async()=>{
 const h=fixture(),brief={name:'Angry',description:'An angry chibi with a closed fist, face closeup',caption:'hey'};
 await h.run('stickers','generate',brief,'alice','first');
 await h.run('stickers','generate',brief,'alice','retry');
 const {requestId:first,...original}=h.images[0],{requestId:second,...retried}=h.images[1];
 expect(first).not.toBe(second);expect(retried).toEqual(original);
 expect(original.enhance).toBe(false);
 expect(original.prompt).toBe('A single cute expressive chibi chat sticker. Isolated clean silhouette, simple background. '+brief.description+'. Short caption: hey');
});
