import {expect,test} from 'bun:test';
import {JSDOM} from 'jsdom';
import {preparePersonaDatingPhoto} from '../src/domain/lumistry-user-photo.js';
import {normalizeDating,normalizeDatingProfile,datingMessageHistory,localDatingReplyDecision} from '../src/domain/lumistry.js';
import {normalizeContactCollections} from '../src/domain/contacts.js';
import {personaPhotoSheet} from '../src/frontend/components/lumistry-user-photo.js';
import type {PhoneState} from '../src/types.js';
const profile=(id:string)=>normalizeDatingProfile({id,alias:id,age:29,contactId:id,phoneProfile:{appearance:'short brown curls'},fields:{gender:'woman'},privateFields:{boundaries:'PRIVATE_BOUNDARY'}})!;
function fixture(){
 return {chatId:'chat',characterId:'char',pocketPersonaActorId:'owner',pocketPersona:{displayName:'You'},contacts:[],discoveredActors:[],
 conversations:[{id:'thread',channel:'dating',datingOwnerId:'owner',kind:'direct',includesPocketPersona:true,participantActorIds:['npc'],participantContactIds:[],title:'Match',messages:[],availability:{state:'remote'}}],
 lumistry:{owner:normalizeDating({self:profile('self'),profiles:[profile('npc')],decisions:[{profileId:'npc',action:'like',status:'matched',conversationId:'thread'}]})}} as unknown as PhoneState;
}
test('Persona-described photos remain description-first, never invent identity or call image services',async()=>{
 const state=fixture();let images=0;const before=JSON.stringify(state);
 const result=await preparePersonaDatingPhoto(state,'thread',{description:'Me holding a lamp.',includesSelf:true,aspect:'portrait',prompt:'UNTRUSTED_RENDER',anchor:'SECRET_ANCHOR',visual:{subjects:[{id:'npc'}]}},'user',async()=>{images++});
 expect(images).toBe(0);expect(result.imageId).toBeUndefined();expect(result.datingPhoto.subjectIds).toEqual(['self']);expect(result.datingPhoto.description).toBe('Me holding a lamp.');expect(result.datingPhoto.prompt).toBe('Me holding a lamp.');expect(result.datingPhoto.anchor).toBe('');expect(result.datingPhoto.visual).toBeUndefined();expect(JSON.stringify(state)).toBe(before);
 const c=state.conversations[0];c.messages.push({id:'photo',sender:'persona',text:'',status:'sent',createdAt:'2026-10-15T00:00:00Z',datingPhoto:result.datingPhoto} as any);
 const history=datingMessageHistory(c);expect(history[0].content).toContain('Me holding a lamp');expect(history[0].content).not.toContain('PRIVATE_BOUNDARY');expect(localDatingReplyDecision(state,c)).toBeUndefined();
});
test('Gallery photos validate owned media and survive real message normalization without render instructions',async()=>{
 const state=fixture(),seen:string[]=[];
 const result=await preparePersonaDatingPhoto(state,'thread',{description:'A yellow mug on the table.',imageId:'owned-image',includesSelf:false,aspect:'square'},'user',async id=>{seen.push(id)});
 expect(seen).toEqual(['owned-image']);expect(result.datingPhoto.rendered).toBe(true);expect(result.datingPhoto.prompt).toBe('');expect(result.datingPhoto.subjectIds).toEqual([]);
 state.conversations[0].messages.push({id:'photo',sender:'persona',senderActorId:'owner',text:'Here.',imageId:result.imageId,datingPhoto:result.datingPhoto,status:'sent',createdAt:'2026-10-15T00:00:00Z'} as any);
 const normalized=normalizeContactCollections(state,{now:'2026-10-15T00:00:00Z',makeId:()=> 'id',personaActorId:'owner',characterId:'char',characterName:'Character',pocketPersona:state.pocketPersona} as any);
 expect(normalized.conversations[0].messages[0].datingPhoto?.description).toBe('A yellow mug on the table.');expect(normalized.conversations[0].messages[0].imageId).toBe('owned-image');
 await expect(preparePersonaDatingPhoto(state,'thread',{description:'A mug.',imageId:'foreign-image'},'user',async()=>{throw Error('Not accessible')})).rejects.toThrow('Not accessible');
});
test('only explicit owner actions in active matched dating threads can send photos',async()=>{
 for(const change of [(s:PhoneState)=>{s.conversations[0].archived=true},(s:PhoneState)=>{s.conversations[0].channel='ordinary'},(s:PhoneState)=>{s.conversations[0].datingOwnerId='other'},(s:PhoneState)=>{s.conversations[0].includesPocketPersona=false},(s:PhoneState)=>{s.lumistry!.owner.decisions[0].status='unmatched'}]){
  const state=fixture();change(state);await expect(preparePersonaDatingPhoto(state,'thread',{description:'Photo.'},'user',async()=>{throw Error('must not read media')})).rejects.toThrow();
 }
 for(const source of ['model','tag'])await expect(preparePersonaDatingPhoto(fixture(),'thread',{description:'Photo.'},source,async()=>{})).rejects.toThrow();
});
test('photo bounds and explicit subject choices are validated without clipping',async()=>{
 const state=fixture();expect((await preparePersonaDatingPhoto(state,'thread',{description:'a'.repeat(1500)},'user',async()=>{})).datingPhoto.description).toHaveLength(1500);
 for(const value of [{description:''},{description:'a'.repeat(1501)},{description:'Photo',includesSelf:'yes'},{description:'Photo',aspect:'huge'},{description:'Photo',imageId:'x'.repeat(161)}])await expect(preparePersonaDatingPhoto(state,'thread',value,'user',async()=>{})).rejects.toThrow();
});
function domTest(run:(doc:Document)=>void){const dom=new JSDOM('<body></body>'),old=globalThis.document;globalThis.document=dom.window.document;try{run(document)}finally{globalThis.document=old;dom.window.close()}}
test('photo sheet sends once, preserves failed drafts and closes only on acknowledgement',()=>domTest(doc=>{
 let dismissed=0,finish:(error?:string)=>void=()=>{};const sends:any[]=[];
 const box=personaPhotoSheet({gallery:()=>{},dismiss:()=>dismissed++,send:(photo,comment,done)=>{sends.push({photo,comment});finish=done}});doc.body.append(box);
 const description=box.querySelector<HTMLTextAreaElement>('[aria-label="Photo description"]')!,comment=box.querySelector<HTMLTextAreaElement>('[aria-label="Photo message"]')!;
 const send=[...box.querySelectorAll('button')].find(b=>b.textContent==='Send photo')!;
 send.click();expect(sends).toHaveLength(0);description.value='Me at the workshop.';comment.value='Today.';send.click();send.click();expect(sends).toHaveLength(1);expect(dismissed).toBe(0);expect(description.disabled).toBe(true);
 finish('Connection interrupted.');expect(description.disabled).toBe(false);expect(description.value).toBe('Me at the workshop.');expect(comment.value).toBe('Today.');expect(box.textContent).toContain('Connection interrupted');send.click();expect(sends).toHaveLength(2);finish();expect(dismissed).toBe(1);
}));
test('Gallery transitions preserve description/comment and choosing your profile photo uses only its public scene',()=>domTest(doc=>{
 let draft:any,sent:any;const own=profile('self');own.photoPlan=[{description:'Me in a blue coat.',caption:'Cold day',prompt:'PRIVATE_RENDER',subjectIds:['self'],kind:'photo',subjectPosition:'',aspect:'portrait'}];own.photos=[{planIndex:0,source:{kind:'gallery',imageId:'owned'},url:'/owned',caption:'Cold day'}];
 const box=personaPhotoSheet({profile:own,gallery:value=>draft=value,dismiss:()=>{},send:photo=>sent=photo});doc.body.append(box);
 const buttons=()=>[...box.querySelectorAll('button')];buttons().find(b=>b.textContent==='My profile photo 1')!.click();
 expect(box.querySelector<HTMLTextAreaElement>('[aria-label="Photo description"]')!.value).toBe('Me in a blue coat.');expect(box.querySelector('img')!.getAttribute('src')).toBe('/owned');expect(box.textContent).not.toContain('PRIVATE_RENDER');
 box.querySelector<HTMLTextAreaElement>('[aria-label="Photo message"]')!.value='Caption draft';buttons().find(b=>b.textContent==='Choose from Gallery')!.click();expect(draft.comment).toBe('Caption draft');expect(draft.description).toBe('Me in a blue coat.');
 const resumed=personaPhotoSheet({selected:{...draft,imageId:'other',url:'/other'},gallery:()=>{},dismiss:()=>{},send:photo=>sent=photo});[...resumed.querySelectorAll('button')].find(b=>b.textContent==='Send photo')!.click();expect(sent.imageId).toBe('other');expect(sent.description).toBe(draft.description);
}));
