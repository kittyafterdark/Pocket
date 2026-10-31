import {expect,test} from 'bun:test';
import {lumistryHarness as harness} from './fixtures/lumistry-harness.js';
import {dossier,publicText,photo} from './fixtures/lumistry-v2.js';
import {WRITING_FIELDS,AUTHORING_LIMITS,AuthoringContractError,repairInstructions} from '../src/domain/lumistry-authoring-contract.js';
import {assertDatingIngress} from '../src/domain/lumistry-ingress.js';
import {parseAuthoring,projectDossier,projectPhotos,projectPublic,publicRepair,mergeIndexArtifact,mergeAuthoredArtifact,normalizeAuthoring} from '../src/domain/lumistry-v2.js';
import {normalizeDatingProfile} from '../src/domain/lumistry.js';
import {normalizeDatingAttachment} from '../src/domain/lumistry-person.js';
import {normalizeDiscoveryJob} from '../src/domain/lumistry-pipeline.js';
import {compileDatingVisual} from '../src/domain/lumistry-visual.js';
import {defaultPreferences,normalizePreferences} from '../src/domain/preferences.js';
import {runCommunityNativeGeneration as runPocketGeneration} from '../src/backend/community-generation.js';
import {acknowledgeGenerationReceipt} from '../src/backend/pending-generation.js';
import {generationDeadline} from '../src/backend/generation-deadline.js';
import {replySnapshot} from '../src/backend/reply-snapshot.js';
import {auxiliary,classifyFailure,PocketFailure} from '../src/domain/reliability.js';
const artifact=(text:string,kind:any='dossier')=>parseAuthoring(text,kind,'stop');
const source=(text=dossier())=>({version:2 as const,dossier:artifact(text),photos:[],gallery:[],provenance:{}});
const identity=()=>projectDossier(source(),{},'slot_0',2).row;

test('all writing targets have private headroom and accepted scenes survive seeded save/load/compile boundaries',()=>{
 for(const policy of Object.values(WRITING_FIELDS))expect(policy.target).toBeLessThan(policy.accepted);
 let seed=7919;
 for(let i=0;i<32;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const scene='A literal camera scene. '+'x'.repeat(1201+seed%300-24);
  const projected=projectPhotos(artifact(photo(scene),'photos'),identity(),1);expect(projected.problems).toEqual([]);
  const raw={...identity(),id:'synthetic',photoPlan:projected.photos,photos:[{source:{kind:'gallery',imageId:'synthetic'},prompt:scene,caption:'caption'}]};
  const saved=normalizeDatingProfile(JSON.parse(JSON.stringify(normalizeDatingProfile(raw))))!;
  expect(saved.photoPlan[0].description).toBe(scene);expect(saved.photos[0].prompt).toBe(scene);
  expect(compileDatingVisual(saved,saved.photoPlan[0].visual,scene,saved.photoPlan[0].subjectIds)).toContain(scene);
  expect(normalizeDatingAttachment({description:scene,prompt:scene,subjectIds:['self']})!.description).toBe(scene);
 }
 const compiled='x'.repeat(12000);expect(normalizeDatingProfile({...identity(),id:'synthetic',photos:[{source:{kind:'gallery',imageId:'synthetic'},prompt:compiled}]})!.photos[0].prompt).toBe(compiled);
 expect(()=>assertDatingIngress({...identity(),bio:'word '.repeat(101)})).toThrow(AuthoringContractError);
 expect(()=>assertDatingIngress({...identity(),photoPlan:[{description:'x'.repeat(1501)}]})).toThrow(AuthoringContractError);
});

test('canonical records ignore correction history; referenced patches retain all other public records',()=>{
 const original=artifact(publicText(3,2).replace('the lamp 2 finally works','x'.repeat(361)),'public');
 original.text+='\nQuestion: historical wrong question\nAnswer: historical wrong answer';
 const patch=artifact('Record reference: question_2\nQuestion: what small thing 2?\nAnswer: corrected answer','public');
 const fixed=publicRepair(original,patch,false,{questions:3,photos:2},identity());
 const projected=projectPublic(fixed,identity(),3,2);expect(projected.problems).toEqual([]);
 expect(projected.row.person.prompts.map((x:any)=>x.answer)).toEqual(['the lamp 1 finally works','corrected answer','the lamp 3 finally works']);
 expect(projected.gallery).toHaveLength(2);expect(fixed.text).toContain('historical wrong question');
 expect(()=>publicRepair(fixed,artifact('Record reference: question_99\nQuestion: missing?\nAnswer: changed','public'),false,{questions:3,photos:2},identity())).toThrow('unknown');
 const a=source(dossier('Aster','Companion name: Beier\nCompanion kind: adult\nCompanion relationship: neighbor'));
 const indexed=mergeIndexArtifact(a,artifact('Companion appearance: elderly woman','index'),['Companion appearance']);
 expect(projectDossier({...a,index:indexed},{},'slot_0',2).row.person.entities[0].name).toBe('Beier');
 expect(normalizeAuthoring({...a,index:indexed})!.index!.records![0].id).toBe('companion_1');
});

test('short complete photo batches keep their valid records and ask only for unresolved positions',async()=>{
 const random=Math.random;Math.random=()=>.7;
 try{
  const h=harness();let first=true;
  h.generate=async req=>{
   if(req.task==='photos'&&first){first=false;return {authoredText:req.photoReferences.slice(0,2).map((ref:string)=>`Record reference: ${ref}\n`+photo('Scene '+ref)).join('\n'),finishReason:'stop'};}
   return h.response(req);
  };
  await h.run();const requests=h.calls.filter(x=>x.req.task==='photos').map(x=>x.req);
  expect(requests[0].batchCount).toBe(3);expect(requests[1].photoReferences).toEqual(['photo_3']);
  const p=h.state.lumistry.owner.profiles.at(-1)!;expect(h.state.lumistry.owner.profiles).toHaveLength(25);
  expect(p.photoPlan[0].description).toBe('Scene photo_1');expect(p.photoPlan[1].description).toBe('Scene photo_2');
  expect(h.state.lumistry.owner.discoveryJob!.metrics.some(m=>m.savedUnits===2&&m.invalid===1)).toBe(true);
 }finally{Math.random=random;}
});

test('explicit photo references allow reordered batches without redirecting scenes',async()=>{
 const random=Math.random;Math.random=()=>.7;
 try{const h=harness();h.generate=async req=>req.task==='photos'?{authoredText:[...req.photoReferences].reverse().map((ref:string)=>`Record reference: ${ref}\n`+photo('Scene '+ref)).join('\n'),finishReason:'stop'}:h.response(req);await h.run();const p=h.state.lumistry.owner.profiles.at(-1)!;expect(p.photoPlan.map(p=>p.description)).toEqual(p.photoPlan.map((_,i)=>'Scene photo_'+(i+1)));}finally{Math.random=random;}
});

test('a parked bad candidate does not stop another candidate and Find more cannot reset its allowance',async()=>{
 const h=harness(23);let people=0;
 h.generate=async req=>req.task==='dossier'?{authoredText:dossier(++people===1?'Unfinished One':'Finished Two'),finishReason:'stop'}:req.task==='public'&&req.acceptedPerson.alias==='Unfinished One'?{authoredText:publicText(req.counts.questions,req.counts.photos,'word '.repeat(101)),finishReason:'stop'}:h.response(req);
 await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(24);expect(h.state.lumistry.owner.profiles.at(-1)!.alias).toBe('Finished Two');
 const job=h.state.lumistry.owner.discoveryJob!,bad=job.slots.find(s=>s.status==='failed')!;
 expect(bad.unitAttempts!.public).toBe(2);expect(bad.progress!.authored.dossier!.text).toContain('Unfinished One');
 const calls=h.calls.length;await h.run();expect(h.calls).toHaveLength(calls);
 const spent=h.state.lumistry.owner.discoveryJob!.spent!.calls;
 h.generate=async req=>h.response(req);
 await h.app.handle({action:'retry_slot',slotId:bad.id,requestId:'explicit-retry'},{chatId:'c',characterId:'a'},'u');await h.run();
 expect(h.state.lumistry.owner.profiles).toHaveLength(25);expect(h.state.lumistry.owner.discoveryJob!.spent!.calls).toBeGreaterThan(spent);
});

test('job spending limits survive repeated Find more and only explicit settings changes raise them',async()=>{
 const h=harness();let maxCalls=2;h.h.authoringPolicy=async()=>({maxCalls,maxTokens:800000,sessionCalls:24,timeoutSeconds:180});
 await h.run();expect(h.calls).toHaveLength(2);await h.run();expect(h.calls).toHaveLength(2);
 maxCalls=8;await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);
});

test('optional unknown companion metadata is retained without an organizer and cannot render as an established identity',async()=>{
 const h=harness();h.generate=async req=>req.task==='dossier'?{authoredText:dossier('New Aster','Companion name: Beier\nCompanion kind: adult\nCompanion appearance: Not established.\nCompanion relationship: neighbor'),finishReason:'stop'}:h.response(req);
 await h.run();const p=h.state.lumistry.owner.profiles.at(-1)!;expect(h.calls.some(x=>x.req.task==='index')).toBe(false);expect(p.person!.unresolvedSubjects![0].appearance).toBe('Not established.');
 expect(projectPhotos(artifact(photo('Beier in a chair.','Beier'),'photos'),p,1).problems.join(' ')).toContain('unrecognized');
});

function generationHost(){let prefs=defaultPreferences(),calls=0,writes=0;const requests:any[]=[],events:any[]=[];const host:any={loadPreferences:async()=>structuredClone(prefs),savePreferences:async(p:any)=>{writes++;prefs=normalizePreferences(p);return prefs;},send:(e:any)=>events.push(e),spindle:{permissions:{has:()=>true},connections:{list:async()=>[{id:'main',name:'Main',provider:'synthetic',model:'main-model',is_default:true},{id:'author',name:'Author',provider:'synthetic',model:'author-model'}]},generate:{quiet:async(req:any)=>{calls++;requests.push(req);return {content:'Bio: valid output',finish_reason:'stop',reasoning:'PRIVATE REASONING',usage:{prompt_tokens:12,completion_tokens:5,total_tokens:17,provider_raw:{private:'PRIVATE RAW'}}};}}}};return {host,requests,events,get prefs(){return prefs;},set prefs(p){prefs=p;},get calls(){return calls;},get writes(){return writes;}};}

test('explicit native authoring connection, reasoning and output settings are scoped to authoring',async()=>{
 const f=generationHost();f.prefs={...f.prefs,generationMode:'sidecar',sidecarConnectionId:'main',sidecarModelOverride:'chat-override',authoring:{...f.prefs.authoring!,connectionId:'author',overrideConnection:true,reasoning:'low',outputTokens:4096}};
 await runPocketGeneration(f.host,'lumistry-author','author-policy',{messages:[]});await runPocketGeneration(f.host,'message-reply','ordinary-policy',{messages:[]});
 expect(f.requests[0].connection_id).toBe('author');expect(f.requests[0].parameters.model).toBeUndefined();expect(f.requests[0].parameters.max_tokens).toBe(4096);expect(f.requests[0].reasoning).toEqual({source:'custom',apiReasoning:true,effort:'low'});
 expect(f.requests[1].parameters.model).toBe('chat-override');expect(f.requests[1].reasoning).toEqual({source:'off'});
 expect(f.prefs.generationHistory.some(r=>r.task==='lumistry-author')).toBe(true);expect(JSON.stringify(f.prefs)).not.toContain('PRIVATE');
});

test('native deadlines and cancellation reject late provider answers',async()=>{
 let finish!:(v:string)=>void,signal!:AbortSignal;
 const late=generationDeadline(.01,undefined,async s=>{signal=s;return new Promise<string>(resolve=>{finish=resolve;});});
 await expect(late).rejects.toHaveProperty('diagnostic.code','timeout');expect(signal.aborted).toBe(true);finish('must not be delivered');
 const parent=new AbortController();const cancelled=generationDeadline(1,parent.signal,async()=>new Promise<string>(()=>{}));parent.abort();await expect(cancelled).rejects.toHaveProperty('name','AbortError');
});

test('valid output survives auxiliary history failures and pending authoring receipts avoid another provider call',async()=>{
 const f=generationHost();f.host.savePreferences=async()=>{throw new Error('simulated auxiliary storage failure');};
 const request={receiptKey:'synthetic-job/slot_0',messages:[{role:'user',content:'synthetic fixture'}]};
 const first=await runPocketGeneration(f.host,'lumistry-author','receipt-1',request,'u');expect(first.content).toBe('Bio: valid output');
 const retry=await runPocketGeneration(f.host,'lumistry-author','receipt-2',request,'u');expect(f.calls).toBe(1);expect(retry.content).toBe(first.content);expect(JSON.stringify(retry)).not.toContain('PRIVATE');
 acknowledgeGenerationReceipt(retry);await runPocketGeneration(f.host,'lumistry-author','receipt-3',request,'u');expect(f.calls).toBe(2);
 expect(f.events.some(e=>e.diagnostic?.code==='history-write-failed')).toBe(true);
});

test('UI refresh failure never rejects committed profiles and discard retains aggregate accounting',async()=>{
 const h=harness();const diagnostics:any[]=[];h.h.sendState=async()=>{throw new Error('simulated image metadata failure');};h.h.reportDiagnostic=(d:any)=>diagnostics.push(d);
 await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);expect(diagnostics.some(d=>d.saved&&d.code==='refresh-deferred')).toBe(true);
 const total=h.state.lumistry.owner.discoveryAccounting.calls;expect(total).toBe(h.calls.length);
 await h.app.handle({action:'discard_discovery',requestId:'discard'},{chatId:'c',characterId:'a'},'u');expect(h.state.lumistry.owner.discoveryAccounting.calls).toBe(total);
});

test('typed repair instructions and failure receipts never reuse human diagnostic prose as model instructions',async()=>{
 const instructions=repairInstructions([{code:'bio-length',message:'Internal 100 words / 1600 characters; SECRET REASONING',labels:['Bio']}]);expect(instructions).toEqual(['Bio: at most 65 words and 1100 characters.']);
 expect(classifyFailure(new AuthoringContractError([{code:'locked-field',message:'private text',labels:['Bio']}])).layer).toBe('protected-field');
 expect(classifyFailure(new PocketFailure({layer:'storage',code:'checkpoint',saved:false,retryable:true},'private storage path')).layer).toBe('storage');
 const reports:any[]=[];expect(await auxiliary(async()=>{throw Error('private raw response');},d=>reports.push(d))).toBe(false);expect(JSON.stringify(reports)).not.toContain('private');
});

test('reply commit snapshots tolerate read receipts and unrelated apps while rejecting newer conversation or identity',()=>{
 const h=harness(),p=h.state.lumistry.owner.profiles[0];p.contactId='npc';h.state.lumistry.owner.decisions=[{profileId:p.id,action:'like',status:'matched',conversationId:'dating'}];
 const c:any={id:'dating',channel:'dating',datingOwnerId:'owner',participantActorIds:['npc'],participantContactIds:['npc'],kind:'direct',messages:[{id:'m',sender:'persona',text:'Hello',status:'sent'}],availability:{state:'remote'},updatedAt:'now'};h.state.conversations=[c];
 const before=replySnapshot(h.state,c);c.messages[0].read=true;c.messages[0].status='read';(h.state.notes||=[]).push({id:'note',title:'unrelated',body:'unrelated'} as any);expect(replySnapshot(h.state,c)).toBe(before);
 c.messages.push({id:'new',sender:'persona',text:'Actually, another question.',status:'sent'});expect(replySnapshot(h.state,c)).not.toBe(before);c.messages.pop();p.privateFields.commitments='Changed commitment';expect(replySnapshot(h.state,c)).not.toBe(before);
});

test('oversized retained progress is quarantined intact instead of silently becoming a fresh person',async()=>{
 const h=harness();h.generate=async()=>{throw Error('provider unavailable');};await h.run();
 const job=h.state.lumistry.owner.discoveryJob!,slot=job.slots[0];slot.progress!.draft.largeRetainedSource='x'.repeat(AUTHORING_LIMITS.progress);
 const normalized=normalizeDiscoveryJob(job)!;expect(normalized.slots[0].progress).toBeUndefined();expect((normalized.slots[0].quarantinedProgress as any).draft.largeRetainedSource).toHaveLength(AUTHORING_LIMITS.progress);
 h.state.lumistry.owner.discoveryJob=normalized;const calls=h.calls.length;await h.run();expect(h.calls).toHaveLength(calls);expect(h.state.lumistry.owner.discoveryJob!.slots[0].quarantinedProgress).toBeDefined();
});

test('an unrelated photo patch cannot clear a conflicting saved field by flattening its last value',()=>{
 const bad=artifact(photo().replace('Full literal description:','Full literal description: conflicting first scene\nFull literal description:'),'photos');
 const before=JSON.stringify(bad);const merged=mergeAuthoredArtifact(bad,artifact('Public caption: it lives','photos'),['Public caption']);
 expect(()=>projectPhotos(merged,identity(),1)).toThrow('Conflicting repeated Full literal description');
 expect(JSON.stringify(bad)).toBe(before);
});

test('authoring stream interruptions retain answer tokens, never reasoning, for checkpoint repair',async()=>{
  const f=generationHost();f.prefs.authoring!.transport='stream';f.host.spindle.generate.quietStream=async function*(){yield {type:'reasoning',token:'PRIVATE REASONING'};yield {type:'token',token:'Bio: kept partial answer'};throw Error('synthetic disconnect');};
 const result=await runPocketGeneration(f.host,'lumistry-author','partial-stream',{messages:[]});
 expect(result.content).toBe('Bio: kept partial answer');expect(result.finish_reason).toBe('length');expect(JSON.stringify(f.prefs)).not.toContain('PRIVATE');expect(f.prefs.generationHistory.at(-1)?.diagnostic?.code).toBe('partial-stream');
});

test('reasoning-only exhaustion never triggers a nested JSON correction',async()=>{
 const {runStructuredResponse,StructuredOutputError}=await import('../src/backend/structured.js');let calls=0;
 await expect(runStructuredResponse(async()=>{calls++;throw new StructuredOutputError('truncated','reasoning-only',{answerBytes:0,code:'reasoning-exhausted'});},100,true)).rejects.toThrow();expect(calls).toBe(1);
});

import {recoverProviderSlot,providerExecutionSignature} from '../src/domain/lumistry-provider-recovery.js';

test('provider pauses reopen only after execution settings change, preserving plans, accepted units and other budgets',()=>{
 const policy={transport:'stream',reasoning:'inherit',timeoutSeconds:180};
 const slot:any={status:'failed',attempts:2,photoCount:2,plan:{id:'saved-person'},failureSignature:providerExecutionSignature(policy),unitAttempts:{dossier:2,public:1,photo_1:1},progress:{task:'dossier',draft:{alias:'saved',photoPlan:[]}}};
 const before=structuredClone(slot);expect(recoverProviderSlot(slot,policy)).toBe(false);expect(slot).toEqual(before);
 expect(recoverProviderSlot(slot,{...policy,maxCalls:999})).toBe(false);
 expect(recoverProviderSlot(slot,{...policy,reasoning:'low'})).toBe(true);expect(slot.status).toBe('pending');expect(slot.unitAttempts).toEqual({public:1,photo_1:1});expect(slot.plan).toEqual(before.plan);expect(slot.progress).toEqual(before.progress);
 const photos:any={...before,progress:{task:'photos',draft:{photoPlan:[{description:'accepted exactly'}]}},unitAttempts:{dossier:1,photo_1:1,photo_2:2}};
 expect(recoverProviderSlot(photos,{...policy,reasoning:'low'})).toBe(true);expect(photos.unitAttempts).toEqual({dossier:1,photo_1:1});expect(photos.progress.draft.photoPlan[0].description).toBe('accepted exactly');
 for(const status of ['saved','pending'])expect(recoverProviderSlot({...before,status},{reasoning:'low'})).toBe(false);
 expect(recoverProviderSlot({...before,quarantinedProgress:{}},{reasoning:'low'})).toBe(false);
 expect(recoverProviderSlot({...before,failureSignature:'validation:disclosure'},{reasoning:'low'})).toBe(false);
});

test('discovery retains the controlled timeout explanation and stamps provider settings without automatic retry',async()=>{
 const h=harness();h.generate=async()=>{throw new PocketFailure({layer:'provider',code:'timeout',saved:false,retryable:true},'The provider did not finish within 180 seconds (stream; 0 answer bytes and 115 reasoning events received). Saved work is kept.');};
 await h.run();expect(h.calls).toHaveLength(1);
 const job=h.state.lumistry.owner.discoveryJob!;expect(job.lastError).toContain('115 reasoning events');expect(job.slots[0].failureSignature).toStartWith('provider-stalled:');expect(job.spent!.reported).toBe(0);expect(job.spent!.calls).toBe(1);
});


test('Lumistry override routes authoring and dating chats, then restores Pocket without losing the saved model',async()=>{
 const f=generationHost();f.prefs={...f.prefs,generationMode:'sidecar',sidecarConnectionId:'main',sidecarModelOverride:'pocket-model',authoring:{...f.prefs.authoring!,overrideConnection:true,connectionId:'author',model:'app-model'}};
 await runPocketGeneration(f.host,'lumistry-author','app-author',{messages:[]});
 await runPocketGeneration(f.host,'message-reply','app-chat',{messages:[],diagnosticScope:'lumistry'});
 await runPocketGeneration(f.host,'message-reply','normal-chat',{messages:[]});
 expect(f.requests.slice(0,2).map(r=>[r.connection_id,r.parameters.model])).toEqual([['author','app-model'],['author','app-model']]);
 expect(f.requests[2].connection_id).toBe('main');expect(f.requests[2].parameters.model).toBe('pocket-model');
 f.prefs.authoring!.overrideConnection=false;
 await runPocketGeneration(f.host,'lumistry-world','inherited',{messages:[]});
 expect(f.requests[3].connection_id).toBe('main');expect(f.requests[3].parameters.model).toBe('pocket-model');expect(f.prefs.authoring!.model).toBe('app-model');
});

test('enabled unavailable or empty app connections fail before calling a provider',async()=>{
 for(const connectionId of ['missing','']){
  const f=generationHost();f.prefs.authoring={...f.prefs.authoring!,overrideConnection:true,connectionId};
  await expect(runPocketGeneration(f.host,'lumistry-author','missing-'+connectionId,{messages:[]})).rejects.toThrow(connectionId?'unavailable':'Choose a Lumistry connection');expect(f.calls).toBe(0);
 }
});
