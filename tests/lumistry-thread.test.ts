import {expect,test} from 'bun:test';
import {JSDOM} from 'jsdom';
import {renderMessagesView, type MessagesViewHost} from '../src/frontend/apps/messages.js';
import {normalizeDating} from '../src/domain/lumistry.js';
import type {PhoneState} from '../src/types.js';

function fixture(channel='dating',theme='sticker',readOnly=false) {
 const conversation={id:'thread',channel,datingOwnerId:'owner',kind:'direct',title:'Public Alias',includesPocketPersona:true,
  participantActorIds:['npc'],participantContactIds:[],availability:{state:'remote'},messages:[
   {id:'a',sender:'contact',senderActorId:'npc',senderName:'Public Alias',text:'Hello!',status:'sent',createdAt:'2026-10-10T12:00:00Z',datingPhoto:{description:'A public photo description',subjectIds:['self']}},
   {id:'b',sender:'persona',senderActorId:'owner',senderName:'You',text:'Hi!',status:'sent',createdAt:'2026-10-10T12:01:00Z'},
  ]};
 const state={chatId:'c',characterId:'ch',pocketPersonaActorId:'owner',pocketPersona:{displayName:'You'},contacts:[],discoveredActors:[],conversations:[conversation],references:[],relays:[],lumistry:{owner:normalizeDating({theme})}} as unknown as PhoneState;
 const sends:any[]=[],replies:string[]=[],shares:string[]=[];
 const no=()=>{};
 const host={state,selectedConversationId:'thread',deviceOwnerActorId:'owner',readOnlyDevice:readOnly,selectedView:'thread',selectedMessageId:'',
  busyConversations:new Map(),generationAvailable:true,selectedGroupSpeakerId:'',draft:'',manualOverride:false,
  empty:()=>document.createElement('div'),iconButton:(_n:string,label:string)=>{const b=document.createElement('button');b.className='lp-button lp-button-icon';b.setAttribute('aria-label',label);return b;},
  updateDraft:no,composerState:no,send:(...args:any[])=>sends.push(args),generateReply:(id:string)=>replies.push(id),cancelReply:no,back:no,
  attach:(id:string)=>shares.push(id),openActor:no,openTimeline:no,showReferenceSheet:no,showConversationGenerationInfo:no,showOutgoingPrompt:no,
 } as unknown as MessagesViewHost;
 return {host,sends,replies,shares,render:()=>renderMessagesView(host)};
}
function withDOM(fn:()=>void){
 const dom=new JSDOM('<!doctype html><body></body>');const doc=globalThis.document,raf=globalThis.requestAnimationFrame;
 globalThis.document=dom.window.document;globalThis.requestAnimationFrame=()=>0;
 try{fn();}finally{globalThis.document=doc;globalThis.requestAnimationFrame=raf;dom.window.close();}
}
// Native Pocket 0.4 owns the composer and message lifecycle. The ZIP's old
// four-column composer and DOM-cache contracts are intentionally not overlaid.
for(const theme of ['sticker','distillery','modern'])test(`${theme} uses the native composer and attachment menu`,()=>withDOM(()=>{
 const f=fixture('dating',theme),page=f.render();
 expect(page.classList.contains('lumistry-thread')).toBe(true);expect(page.dataset.lumistryTheme).toBe(theme);
 expect(page.querySelector('.lumistry-chat-photo')?.textContent).toContain('A public photo description');
 const input=page.querySelector('textarea')!;expect(input.getAttribute('aria-label')).toBe('Message');input.value='A new message';page.querySelector('form')!.dispatchEvent(new document.defaultView!.Event('submit',{cancelable:true}));
 expect(f.sends).toEqual([['lumiphone:action',{action:'message',payload:{conversationId:'thread',text:'A new message',sender:'persona',explicitRemoteOverride:false}}]]);
 (page.querySelector('[aria-label="Generate one contact reply"]') as HTMLButtonElement).click();expect(f.replies).toEqual(['thread']);
 (page.querySelector('[aria-label="Attach to message"]') as HTMLButtonElement).click();expect(f.shares).toEqual(['thread']);
 expect(page.querySelectorAll('.lp-compose-input')).toHaveLength(1);
}));
test('ordinary chats stay unthemed and inspected dating chats have no composer',()=>withDOM(()=>{
 const normal=fixture('ordinary','modern').render();expect(normal.dataset.lumistryTheme).toBeUndefined();expect(normal.querySelector('textarea')).not.toBeNull();
 const inspected=fixture('dating','modern',true).render();expect(inspected.dataset.lumistryTheme).toBe('modern');expect(inspected.querySelector('form')).toBeNull();
}));
test('described dating photos use the native image action and preserve their visible description',()=>withDOM(()=>{
 const f=fixture(),calls:any[]=[];f.host.datingPhotoAvailable=true;f.host.datingPhotoAction=(...args)=>calls.push(args);
 const page=f.render(),make=[...page.querySelectorAll('button')].find(b=>b.textContent==='Generate image')!;expect(make).toBeDefined();make.click();expect(calls).toEqual([['thread','a']]);expect(page.querySelector('.lumistry-chat-photo')?.textContent).toContain('A public photo description');
 f.host.readOnlyDevice=true;expect([...f.render().querySelectorAll('button')].some(b=>b.textContent==='Generate image')).toBe(false);
}));
test('Lumistry history renders through native Pocket without changing saved message objects',()=>withDOM(()=>{
 const f=fixture(),c=f.host.state.conversations[0],snapshot=JSON.stringify(c.messages);f.render();f.render();expect(JSON.stringify(c.messages)).toBe(snapshot);expect(f.sends).toHaveLength(0);expect(f.replies).toHaveLength(0);
}));
test('ordinary and dating channels stay separate when they have the same counterpart',()=>withDOM(()=>{
 const f=fixture();f.host.state.conversations.push({...f.host.state.conversations[0],id:'ordinary',channel:'phone'} as any);f.host.dating=false;f.host.selectedConversationId='ordinary';expect(f.render().dataset.lumistryTheme).toBeUndefined();f.host.dating=true;f.host.selectedConversationId='thread';expect(f.render().dataset.lumistryTheme).toBe('sticker');
}));
