import {test,expect} from 'bun:test';
import {readScopedJson,strictScopedJson,writeScopedJson,migrateSecret} from '../src/backend/pocket-store.js';
import {committedConversationMessages} from '../src/domain/lumistry-evidence.js';
import {datingMessageHistory} from '../src/domain/lumistry.js';
import {committedDatingMessages} from '../src/domain/lumistry-events.js';
import {datingContinuityContext} from '../src/domain/lumistry-continuity.js';
import {finalizeDatingReplyContext} from '../src/backend/lumistry-reply-context.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {FrontendOperations,frontendEnvelope} from '../src/backend/frontend-operations.js';
import {assertInterceptorActive,interceptorPreview} from '../src/backend/host-capabilities.js';
import {reconcileRelationshipSources,relationshipSourceHash} from '../src/domain/lumistry-events.js';
import {collectWorldEvidence} from '../src/backend/lumistry-world-evidence.js';
import {exportLumistrySupportDiagnostics} from '../src/backend/lumistry-diagnostics-export.js';
function storage(){const files=new Map<string,string>(),writes:string[]=[];let failRead=false,failWrite=false;return {files,writes,set failRead(v:boolean){failRead=v},set failWrite(v:boolean){failWrite=v},stat:async(p:string)=>({exists:files.has(p),isFile:true}),read:async(p:string)=>{if(failRead)throw new Error('IO');return files.get(p)!},setJson:async(p:string,v:unknown)=>{if(failWrite)throw new Error('disk');writes.push(p);files.set(p,JSON.stringify(v))},delete:async(p:string)=>files.delete(p)};}
test('strict store distinguishes missing, invalid, failed and future reads without default writes',async()=>{
 const s=storage();expect(await strictScopedJson(s,'phone',{fallback:null})).toBeNull();
 s.files.set('phone','{broken');expect((await readScopedJson(s,'phone')).kind).toBe('corrupt');await expect(strictScopedJson(s,'phone',{fallback:null})).rejects.toThrow('original data');await expect(writeScopedJson(s,'phone',{})).rejects.toThrow();expect(s.writes).toHaveLength(0);
 s.files.set('phone','{"version":99}');expect((await readScopedJson(s,'phone',undefined,12)).kind).toBe('future');await expect(writeScopedJson(s,'phone',{version:12})).rejects.toThrow('newer');
 s.failRead=true;expect((await readScopedJson(s,'phone')).kind).toBe('unavailable');expect(s.writes).toHaveLength(0);
});
test('schema writes verify an exact original recovery copy before replacement',async()=>{
 const s=storage();const raw=' {"version":1,"profiles":["saved"]} ';s.files.set('phone',raw);await writeScopedJson(s,'phone',{version:2,profiles:['saved']});
 const backup=[...s.files.keys()].find(p=>p.startsWith('pocket/recovery/'))!;expect(JSON.parse(s.files.get(backup)!).raw).toBe(raw);expect(JSON.parse(s.files.get('phone')!).version).toBe(2);
 const broken=storage();broken.files.set('phone',raw);broken.failWrite=true;await expect(writeScopedJson(broken,'phone',{version:2})).rejects.toThrow();expect(broken.files.get('phone')).toBe(raw);
});
test('Enclave migration verifies before deleting and preserves an existing newer secret',async()=>{
 const s=storage();s.files.set('old',JSON.stringify({apiKey:'fixture-key'}));let secret:string|null=null;let fail=false;
 const enclave={get:async()=>secret,put:async(_k:string,v:string)=>{if(fail)throw new Error('secret unavailable');secret=v},delete:async()=>{secret=null}};
 fail=true;await expect(migrateSecret(s,enclave,'key','old','user')).rejects.toThrow();expect(s.files.has('old')).toBe(true);
 fail=false;expect(await migrateSecret(s,enclave,'key','old','user')).toBe('fixture-key');expect(s.files.has('old')).toBe(false);
 s.files.set('old',JSON.stringify({apiKey:'old-key'}));secret='newer-key';expect(await migrateSecret(s,enclave,'key','old','user')).toBe('newer-key');
});
test('one evidence boundary excludes failed, pending, provisional and unselected rows',()=>{
 const messages:any[]=[{id:'good',sender:'persona',text:'sent',status:'delivered'},...['failed','pending'].map(status=>({id:status,sender:'persona',text:status,status})),{id:'draft',sender:'contact',text:'draft',candidateCommitState:'provisional'},{id:'old',sender:'contact',text:'old',origin:{chatId:'c',hostMessageId:'h',swipeId:0}},{id:'new',sender:'contact',senderContactId:'npc',text:'new',origin:{chatId:'c',hostMessageId:'h',swipeId:1}}];
 const state:any={chatId:'c',hostSwipeSelections:[{hostMessageId:'h',swipeId:1}]},c:any={messages};
 expect(committedConversationMessages(c,state).map(m=>m.id)).toEqual(['good','new']);expect(committedDatingMessages(c,'owner','npc',state).map(m=>m.id)).toEqual(['good','new']);
 expect(committedConversationMessages(c).map(m=>m.id)).toEqual(['good']);
});
test('a trailing refusal survives reply and agreement inputs intact',()=>{
 const text='Earlier context. '.repeat(180)+' FINAL_REFUSAL: No, I do not agree to that plan.';const c:any={datingOwnerId:'owner',messages:[{id:'long',sender:'persona',senderActorId:'owner',text,status:'delivered'}]};
 expect(datingMessageHistory(c)[0].content).toBe(text);expect(committedDatingMessages(c,'owner','npc')[0].text).toBe(text);
 const huge={...c,messages:[{...c.messages[0],text:'newest '.repeat(2000)}]};expect(datingMessageHistory(huge)[0].content).toBe(huge.messages[0].text);
});
test('final context counts all guidance, removes duplicate continuity and preserves newest whole burst',()=>{
 const out=finalizeDatingReplyContext([{role:'system',content:'identity '.repeat(500)},{role:'user',content:'older '.repeat(1000)},{role:'assistant',content:'older reply '.repeat(400)},{role:'user',content:'current full refusal'},{role:'user',content:'and its qualification'},{role:'user',content:'[OUT OF WORLD CONTROL] respond'},{role:'system',content:'CURRENT PAIR CONTINUITY — duplicate'},{role:'system',content:'LUMISTRY RELATIONSHIP FEEDBACK '+ 'rules '.repeat(1000)}]);
 expect(out.metrics.promptChars).toBe(out.messages.reduce((n,m)=>n+m.content.length,0));expect(out.messages.some(m=>m.content.includes('duplicate'))).toBe(false);expect(out.messages.some(m=>m.content==='current full refusal')).toBe(true);expect(out.metrics.omittedMessages).toBeGreaterThan(0);
 const huge=finalizeDatingReplyContext([{role:'system',content:'protected '.repeat(1200)},{role:'user',content:'current'}]);expect(huge.metrics.overflowCharacters).toBeGreaterThan(0);expect(huge.messages[0].content.length).toBe(12000);
});
test('full protected profile capacity rejects before a single provider request',async()=>{
 const h=lumistryHarness(100),d=h.state.lumistry!.owner;d.generationSettings.creation={readyTarget:5,photoBatchCap:5,workers:2};d.decisions=d.profiles.map(p=>({profileId:p.id,action:'pass',status:'passed'}));d.profiles.forEach((p,i)=>p.contactId='protected_'+i);
 await expect(h.run()).rejects.toThrow('storage is full');expect(h.calls).toHaveLength(0);expect(h.state.lumistry!.owner.profiles).toHaveLength(100);
});
test('safe passed profiles are verified into archives before making publication space',async()=>{
 const h=lumistryHarness(100),d=h.state.lumistry!.owner;d.generationSettings.creation={readyTarget:5,photoBatchCap:5,workers:1};d.decisions=d.profiles.map(p=>({profileId:p.id,action:'pass',status:'passed'}));
 // Stop after the first dispatched call; archival must already be durable.
 h.generate=async()=>{h.permitted=false;throw new Error('stop fixture')};try{await h.run()}catch{}
 expect(h.state.lumistry!.owner.profiles).toHaveLength(95);expect(h.state.lumistry!.owner.authoringArchives?.filter(a=>a.kind==='profile')).toHaveLength(5);expect(h.calls).toHaveLength(1);
});
test('archive failure preserves every active profile and makes no provider call',async()=>{
 const h=lumistryHarness(100),d=h.state.lumistry!.owner;d.decisions=d.profiles.map(p=>({profileId:p.id,action:'pass',status:'passed'}));h.h.writeAuthoringArchive=async()=>{throw new Error('archive disk')};
 await expect(h.run()).rejects.toThrow('archive disk');expect(h.state.lumistry!.owner.profiles).toHaveLength(100);expect(h.calls).toHaveLength(0);
});
test('archived conversations free active capacity with inspectable original messages',async()=>{
 const h=lumistryHarness(1),d=h.state.lumistry!.owner;d.profiles[0].interest={version:2,status:'matched',seen:true};h.state.conversations=Array.from({length:80},(_,i)=>({id:'archived_'+i,archived:true,kind:'direct',messages:[],participantContactIds:[],participantActorIds:[],includesPocketPersona:true,availability:{state:'remote'},unread:0,createdAt:'',updatedAt:''})) as any;
 await h.app.handle({action:'force_match',profileId:d.profiles[0].id,requestId:'force'},{chatId:'c',characterId:'a'},'u');expect(h.state.conversations).toHaveLength(80);expect(h.state.lumistry!.owner.authoringArchives?.some(a=>a.kind==='conversation')).toBe(true);expect(h.calls).toHaveLength(0);
});
test('cross-channel continuity does not treat failed or provisional words as sent',()=>{
 const h=lumistryHarness(1),s=h.state,d=s.lumistry!.owner,p=d.profiles[0];p.contactId='npc';s.contacts=[{id:'npc',name:p.alias,presence:{},source:{kind:'npc'}}] as any;d.decisions=[{profileId:p.id,action:'like',status:'matched',conversationId:'dating',exchanged:true}];s.conversations=[{id:'dating',channel:'dating',kind:'direct',includesPocketPersona:true,participantContactIds:['npc'],messages:[{id:'failed',sender:'persona',text:'UNSENT_SECRET',status:'failed'},{id:'pending',sender:'persona',text:'PENDING_SECRET',status:'pending'}]}] as any;
 const text=datingContinuityContext(s,'npc','ordinary',false);expect(text).not.toContain('UNSENT_SECRET');expect(text).not.toContain('PENDING_SECRET');
});
test('closing one native document cancels only its work and cannot transfer a result',async()=>{
 const ops=new FrontendOperations();let first!:()=>void,second!:()=>void;let signalA!:AbortSignal,signalB!:AbortSignal;
 const a=ops.run('u','main','rA',async s=>{signalA=s;await new Promise<void>(r=>first=r)});
 const b=ops.run('u','widget','rB',async s=>{signalB=s;await new Promise<void>(r=>second=r)});
 await expect(ops.run('u','widget','rA',async()=>{})).rejects.toThrow('owned');
 ops.close('u','main');expect(signalA.aborted).toBe(true);expect(signalB.aborted).toBe(false);expect(ops.destination('u','rA')).toEqual({session:'main',closed:true});expect(ops.destination('other','rA')).toBeUndefined();
 first();second();await Promise.all([a,b]);expect(ops.destination('u','rB')?.session).toBe('widget');
});
test('operation envelopes validate scope and preview/abort guards stay local',()=>{
 expect(()=>frontendEnvelope({type:'lumiphone:dating',action:'discover',chatId:123})).toThrow('scope');expect(frontendEnvelope({type:'unrelated'})).toBeUndefined();
 expect(interceptorPreview({dryRun:true})).toBe(true);expect(interceptorPreview({isDryRun:true})).toBe(true);const c=new AbortController();c.abort();expect(()=>assertInterceptorActive({signal:c.signal})).toThrow();
});
test('source edits invalidate plan projections without inventing cancellation; exact restoration recovers',()=>{
 const h=lumistryHarness(1),s=h.state,d=s.lumistry!.owner,p=d.profiles[0];p.contactId='npc';
 s.conversations=[{id:'dating',messages:[{id:'m',sender:'persona',senderActorId:'owner',text:'Yes, tomorrow.',status:'delivered'}]}] as any;
 d.relationships.events=[{id:'e',profileId:p.id,conversationId:'dating',kind:'date',status:'confirmed',title:'Meet',whenText:'tomorrow',createdAt:'',updatedAt:'',timelineId:'timeline',evidence:[{messageId:'m',quote:'Yes, tomorrow.'}],sourceHashes:{m:relationshipSourceHash('Yes, tomorrow.')}}];
 s.events=[{id:'timeline',description:'Mutually agreed plan.',createdBy:'model'}] as any;
 s.conversations[0].messages[0].text='Yes, tomorrow. Actually, no, I cannot agree.';
 expect(reconcileRelationshipSources(s)).toBe(true);expect(d.relationships.events[0].needsReview).toBe(true);expect(d.relationships.events[0].status).toBe('confirmed');expect(s.events[0].description).toContain('needs review');
 s.conversations[0].messages[0].text='Yes, tomorrow.';reconcileRelationshipSources(s);expect(d.relationships.events[0].needsReview).toBe(false);expect(s.events[0].description).toBe('Mutually agreed plan.');
});
test('source selection reads non-heuristic attached lore explicitly and rejects foreign IDs locally',async()=>{
 const reads:string[]=[];const api={characters:{get:async()=>({world_book_ids:['book']})},world_books:{getActivated:async()=>[],entries:{list:async()=>({data:[{id:'detail',comment:'Apple',key:['apple']}],total:1}),get:async(id:string)=>{reads.push(id);return {content:'The apple people have green bark.',comment:'Apple',disabled:false}}}},chat:{getMessages:async()=>{throw new Error('should not read without permission')}}};
 const allowed=(p:string)=>p==='characters'||p==='world_books',state:any={characterId:'card',chatId:'chat'};
 const initial=await collectWorldEvidence(state,api,allowed,'u');expect(reads).toHaveLength(0);expect(initial.availableSources?.some(s=>s.id==='lore_detail')).toBe(true);expect(initial.warnings.join(' ')).toContain('message permission');
 const chosen=await collectWorldEvidence(state,api,allowed,'u',['lore_detail']);expect(chosen.sources[0].text).toContain('green bark');expect(reads).toEqual(['detail']);
 await expect(collectWorldEvidence(state,api,allowed,'u',['lore_foreign'])).rejects.toThrow('no longer belongs');
});
test('support export is a numeric whitelist, never a private-export copy',()=>{
 const h=lumistryHarness(1),s=h.state,d=s.lumistry!.owner;d.profiles[0].bio='PRIVATE_CANARY';d.profiles[0].privateFields.boundaries='SECRET_CANARY';
 const bundle=exportLumistrySupportDiagnostics(s,'2026-10-27',{events:[{kind:'error',diagnostic:{layer:'provider'},requestId:'IDENTITY_CANARY',message:'SECRET_CANARY'}]});const text=JSON.stringify(bundle);
 for(const canary of ['PRIVATE_CANARY','SECRET_CANARY','IDENTITY_CANARY','PRIVATE OWNER'])expect(text).not.toContain(canary);
 expect(bundle.schema).toBe('lumistry-support-1');expect(bundle.failures.provider).toBe(1);expect(bundle.counts.savedProfiles).toBe(1);
});
test('session scope invalidation cancels only owned work and rejects settled request replay',async()=>{
 const operations=new FrontendOperations();let one:AbortSignal|undefined,two:AbortSignal|undefined;
 await operations.run('u','main','a',async signal=>{one=signal;});await operations.run('u','floating','b',async signal=>{two=signal;});
 operations.invalidate('u','main');expect(one!.aborted).toBe(true);expect(two!.aborted).toBe(false);expect(operations.destination('u','a')?.closed).toBe(true);
 await expect(operations.run('u','floating','b',async()=>{})).rejects.toThrow('already owned');
});
test('typed action families reject malformed drafts and carry revision baselines without generation',async()=>{
 const {parseLumistryRequest}=await import('../src/protocol/lumistry.js');
 expect(parseLumistryRequest({action:'filters',filters:{fields:{}},baseline:'saved',expectedStorageRevision:12})).toMatchObject({family:'wishlist',baseline:'saved',expectedStorageRevision:12});
 for(const request of [{action:'filters',filters:[]},{action:'filters',filters:{} ,baseline:{}},{action:'discover',expectedStorageRevision:-1},{action:'execute_arbitrary_code'}])expect(()=>parseLumistryRequest(request)).toThrow();
});
