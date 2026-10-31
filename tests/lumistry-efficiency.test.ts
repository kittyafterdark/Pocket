import {test,expect} from 'bun:test';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {dossier,photo} from './fixtures/lumistry-v2.js';
import {creationSettings,CREATION_CONTRACT} from '../src/domain/lumistry-creation-settings.js';
import {AESTHETICS,selectAesthetic,styleGuidance,validAesthetic} from '../src/domain/lumistry-aesthetics.js';
import {worldDefaults} from '../src/domain/lumistry-occupations.js';
import {emptyCreationTelemetry,recordCreation,normalizeCreationTelemetry,creationSummary} from '../src/domain/lumistry-creation-telemetry.js';
import {normalizeDating} from '../src/domain/lumistry.js';
import {publicPersonContext,organizerPassages} from '../src/backend/lumistry-creation-context.js';
import {attachDiscoveryRun,discoveryRun} from '../src/backend/lumistry-run-receipts.js';
import {keepPending,readPending,forwardPendingReceipt} from '../src/backend/pending-generation.js';
const scope={chatId:'c',characterId:'a',userId:'u',commit:false} as const;
const resolve=async(t:string)=>({text:t.slice(8,-2).split('::')[0],diagnostics:[]});
function harness(count=4,workers:1|2=1){
 const h=lumistryHarness(count);h.state.lumistry.owner.generationSettings.creation={readyTarget:5,photoBatchCap:5,workers};
 let tail=Promise.resolve();const lock=h.h.withStateLock;
 h.h.withStateLock=async(key:string,fn:any)=>{const before=tail;let release!:()=>void;tail=new Promise<void>(r=>release=r);await before;try{return await lock(key,fn)}finally{release()}};
 return h;
}
test('default zero-deficit discovery leaves existing people and provider untouched',async()=>{
 expect(creationSettings({})).toEqual({readyTarget:5,photoBatchCap:5,workers:1});
 const h=harness(6),before=structuredClone(h.state.lumistry.owner.profiles);await h.run();expect(h.calls).toHaveLength(0);expect(h.state.lumistry.owner.profiles).toEqual(before);
});
test('raising and lowering targets preserves candidate plans, spending and extra slots',async()=>{
 const h=harness();h.generate=async()=>{throw new Error('offline stop')};await h.run();const old=structuredClone(h.state.lumistry.owner.discoveryJob!);
 h.state.lumistry.owner.generationSettings.creation!.readyTarget=10;await h.run();const raised=h.state.lumistry.owner.discoveryJob!;expect(raised.id).toBe(old.id);expect(raised.slots[0].plan).toEqual(old.slots[0].plan);expect(raised.slots).toHaveLength(6);expect(raised.spent!.calls).toBeGreaterThanOrEqual(old.spent!.calls);
 h.state.lumistry.owner.generationSettings.creation!.readyTarget=5;await h.run();expect(h.state.lumistry.owner.discoveryJob!.slots).toHaveLength(6);
});
test('five-photo references isolate duplicate and unknown siblings; recovery caps at three',async()=>{
 const random=Math.random;Math.random=()=>.99;
 try{const h=harness();let first=true;
 h.generate=async req=>{if(req.task==='photos'&&first){first=false;expect(req.batchCount).toBe(5);return {authoredText:['photo_5','photo_2','photo_2','photo_404','photo_1'].map(ref=>`Record reference: ${ref}\n`+photo('literal '+ref)).join('\n'),finishReason:'length'};}return h.response(req)};
 await h.run();const calls=h.calls.filter(c=>c.req.task==='photos');expect(calls[1].req.photoReferences).toEqual(['photo_2','photo_3','photo_4']);
 const p=h.state.lumistry.owner.profiles.at(-1)!;expect(h.state.lumistry.owner.profiles).toHaveLength(5);expect(p.photoPlan[0].description).toBe('literal photo_1');expect(p.photoPlan[4].description).toBe('literal photo_5');expect(normalizeDating(h.state.lumistry.owner).profiles.at(-1)!.photoPlan).toEqual(p.photoPlan);
 }finally{Math.random=random;}
});
test('two workers publish out of order without duplicate plans or lingering claims',async()=>{
 const h=harness(3,2);let first=true,release!:()=>void;const wait=new Promise<void>(r=>release=r);let identities=0;
 h.h.sendState=async()=>{if(h.state.lumistry.owner.profiles.length===4)release()};
 h.generate=async req=>{if(req.task==='dossier'){const n=++identities;if(first){first=false;await wait;}return {authoredText:dossier('New '+n),finishReason:'stop'}}return h.response(req)};
 await h.run();expect(h.state.lumistry.owner.profiles.slice(-2).map(p=>p.alias)).toEqual(['New 2','New 1']);const j=h.state.lumistry.owner.discoveryJob!;expect(new Set(j.slots.map(s=>s.plan?.id)).size).toBe(2);expect(j.activeClaims).toEqual({});expect(j.requestReservations).toEqual({});expect(j.acceptedIds).toHaveLength(2);expect(creationSummary(h.state.lumistry.owner.creationTelemetry!).published).toBe(2);
});
test('two workers atomically reserve a single shared call allowance',async()=>{
 const h=harness(3,2);h.h.authoringPolicy=async()=>({maxCalls:1,maxTokens:800000,sessionCalls:24,timeoutSeconds:180});let n=0;
 h.generate=async req=>req.task==='dossier'?{authoredText:dossier('New '+(++n)),finishReason:'stop'}:h.response(req);await h.run();expect(h.calls).toHaveLength(1);expect(h.state.lumistry.owner.discoveryJob!.spent!.calls).toBe(1);expect(h.state.lumistry.owner.discoveryJob!.requestReservations).toEqual({});
});
test('cancelled late answers are accounted without committing authoring',async()=>{
 const h=harness();h.generate=async req=>{await h.app.handle({action:'cancel'},{chatId:'c',characterId:'a'},'u');const r=h.response(req);attachDiscoveryRun(r,{requestId:'cancelled-receipt',usageStatus:'reported',promptTokens:100,completionTokens:25});return r;};
 await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(4);expect(h.state.lumistry.owner.discoveryAccounting.calls).toBe(1);expect(h.state.lumistry.owner.creationTelemetry!.receipts).toContain('cancelled-receipt');
});
test('archive failure preserves previous discovery and manual contracts and prevents dispatch',async()=>{
 const h=harness();await h.run();const current=h.state.lumistry.owner.discoveryJob!;expect(current.creationContract).toBe(CREATION_CONTRACT);
 const old={...current,id:'old',creationContract:'previous',status:'partial' as const};h.state.lumistry.owner.discoveryJob=old;h.state.lumistry.owner.draftJob={...old,id:'old-manual'};const calls=h.calls.length;
 h.h.writeAuthoringArchive=async()=>{throw new Error('archive unavailable')};await expect(h.run()).rejects.toThrow('archive unavailable');expect(h.calls).toHaveLength(calls);expect(h.state.lumistry.owner.discoveryJob!.id).toBe('old');expect(h.state.lumistry.owner.draftJob!.id).toBe('old-manual');
});
test('all 50 styles retain family counts, reviewed adaptations and trusted macro membership',async()=>{
 expect(AESTHETICS).toHaveLength(50);expect(new Set(AESTHETICS.map(r=>r.id)).size).toBe(50);expect(Object.fromEntries([...new Set(AESTHETICS.map(r=>r.family))].map(f=>[f,AESTHETICS.filter(r=>r.family===f).length]))).toEqual({everyday_practical:10,academic_retro:10,alternative:11,contemporary_expressive:11,natural_romantic:8});
 expect(styleGuidance(AESTHETICS.find(r=>r.id==='sty_y2k')!,worldDefaults('historical'))).toBeUndefined();
 for(const kind of ['modern','historical','fantasy','spacefaring','custom'] as const){const p=await selectAesthetic(worldDefaults(kind),[],resolve,scope,()=>.5);expect(validAesthetic(p,worldDefaults(kind))).toBe(true);expect(JSON.parse(JSON.stringify(p))).toEqual(p);}
 await expect(selectAesthetic(worldDefaults('modern'),[],async()=>({text:'unknown',diagnostics:[]}),scope,()=>.5)).rejects.toThrow('ineligible');
});
test('context projections preserve private truth and narrow organizer passages',()=>{
 const privateFields={realName:'secret',orientation:'bisexual',commitments:'partnered',guardedTopics:'hidden workplace',otherTruth:'never replace this'},p=publicPersonContext({privateFields,hiddenFields:['orientation','relationshipStatus'],creationPlan:{huge:'catalog'},authoring:{huge:'dossier'}});expect(p.privateTruth).toEqual(privateFields);expect(p.hiddenFields).toEqual(['orientation','relationshipStatus']);expect(p).not.toHaveProperty('creationPlan');expect(p).not.toHaveProperty('authoring');expect(organizerPassages({'Actual orientation and attraction':'bi','Hair':'black'},['Actual orientation'])).toEqual({'Actual orientation and attraction':'bi'});
});
test('cumulative receipt deduplication outlives detail trimming and replacement',()=>{
 let t=emptyCreationTelemetry();for(let i=0;i<301;i++)recordCreation(t,{jobId:'j',slotId:'slot_0',planId:'p',startedAt:'now'},{requestId:'r'+i,task:'photos',promptTokens:10,completionTokens:5,reasoningTokens:2,cachedTokens:i%2?3:undefined,savedUnits:2,repair:i%2===0,checkpoint:true});t=normalizeCreationTelemetry(JSON.parse(JSON.stringify(t)));expect(recordCreation(t,{jobId:'j',slotId:'slot_0',startedAt:'now'},{requestId:'r0',task:'photos',promptTokens:10,completionTokens:5})).toBe(false);expect(creationSummary(t).usage.calls).toBe(301);expect(creationSummary(t).photoRecords).toBe(602);expect(creationSummary(t).cachedReported).toBe(150);
});
test('pending receipt reuse retains original identity and cached input',()=>{
 const r={content:'accepted',usage:{prompt_tokens:10,completion_tokens:5,prompt_tokens_details:{cached_tokens:7}}};attachDiscoveryRun(r,{requestId:'original',usageStatus:'reported',promptTokens:10,completionTokens:5,cachedTokens:7});keepPending('efficiency-offline',r);const cached=readPending('efficiency-offline'),authored={authoredText:cached.content};forwardPendingReceipt(cached,authored);expect(discoveryRun(authored)?.requestId).toBe('original');expect(discoveryRun(cached)?.cachedTokens).toBe(7);
});
test('permission revocation aborts both candidate signals and accounts both dispatched calls',async()=>{
 const h=harness(3,2);let release!:()=>void;const second=new Promise<void>(r=>release=r);let count=0;
 h.generate=async req=>{const n=++count,signal=h.calls.at(-1).input.signal as AbortSignal;if(n===1)await second;else{h.permitted=false;release();await new Promise<void>(r=>{if(signal.aborted)r();else signal.addEventListener('abort',()=>r(),{once:true})});}const result={authoredText:dossier('Late '+n),finishReason:'stop'};attachDiscoveryRun(result,{requestId:'revoked-'+n,usageStatus:'reported',promptTokens:10,completionTokens:5});return result;};
 await expect(h.run()).rejects.toThrow();expect(h.calls).toHaveLength(2);expect(h.calls.every(c=>c.input.signal.aborted)).toBe(true);expect(h.state.lumistry.owner.profiles).toHaveLength(3);expect(h.state.lumistry.owner.discoveryAccounting.calls).toBe(2);expect(h.state.lumistry.owner.discoveryAccounting.input).toBe(20);
});
test('active invocation keeps its saved scheduling even when settings change',async()=>{
 const random=Math.random;Math.random=()=>.99;
 try{const h=harness();h.generate=async req=>{if(req.task==='dossier')h.state.lumistry.owner.generationSettings.creation={readyTarget:25,photoBatchCap:3,workers:2};return h.response(req)};await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(5);expect(h.state.lumistry.owner.discoveryJob!.scheduling).toEqual({readyTarget:5,photoBatchCap:5,workers:1});expect(h.calls.find(c=>c.req.task==='photos').req.batchCount).toBe(5);expect(h.calls).toHaveLength(3);}finally{Math.random=random;}
});
test('a stale checkpoint rejects paid prose, preserves newer edits and retains measured usage',async()=>{
 const h=harness();h.generate=async req=>{const result=h.response(req);if(req.task==='public'){h.state.lumistry.owner.discoveryJob!.slots[0].progress!.draft.phoneProfile.personality='Newer editor choice';attachDiscoveryRun(result,{requestId:'stale-public',usageStatus:'reported',promptTokens:100,completionTokens:25});}return result;};
 await expect(h.run()).rejects.toThrow('saved authoring changed');expect(h.state.lumistry.owner.profiles).toHaveLength(4);expect(h.state.lumistry.owner.discoveryAccounting.calls).toBe(2);expect(h.state.lumistry.owner.discoveryAccounting.input).toBe(100);expect(h.state.lumistry.owner.discoveryJob!.slots[0].progress!.draft.phoneProfile.personality).toBe('Newer editor choice');
});
test('an older cancelled invocation cannot pause or clear a newer invocation in the same job',async()=>{
 const h=harness();let release!:()=>void,started!:()=>void,first=true;const oldWait=new Promise<void>(r=>release=r),oldStarted=new Promise<void>(r=>started=r);
 h.h.sendState=async()=>{if(h.state.lumistry.owner.profiles.length===5)release()};
 h.generate=async req=>{if(req.task==='dossier'&&first){first=false;started();await oldWait;const result={authoredText:dossier('Old late result'),finishReason:'stop'};attachDiscoveryRun(result,{requestId:'old-late',usageStatus:'reported',promptTokens:100,completionTokens:25});return result;}return h.response(req)};
 const old=h.run();await oldStarted;h.app.cancelAll('u');await h.run();const invocation=h.state.lumistry.owner.discoveryJob!.invocation!.id;await old;expect(h.state.lumistry.owner.profiles).toHaveLength(5);expect(h.state.lumistry.owner.profiles.at(-1)!.alias).toBe('New Aster');expect(h.state.lumistry.owner.discoveryJob!.status).toBe('complete');expect(h.state.lumistry.owner.discoveryJob!.invocation!.id).toBe(invocation);expect(h.state.lumistry.owner.discoveryJob!.activeClaims).toEqual({});expect(h.state.lumistry.owner.discoveryAccounting.calls).toBe(4);
});
test('occasion guidance projects optionally and new style selection retains two physical directions',async()=>{
 const h=harness();h.generate=async req=>{const r=h.response(req);if(req.task==='dossier')r.authoredText=r.authoredText.replace('END CHARACTER DOSSIER.','Style across occasions: A neat coat for evenings, ordinary work clothes by day.\nEND CHARACTER DOSSIER.');return r};await h.run();const p=h.state.lumistry.owner.profiles.at(-1)!;expect(p.person!.presentation.styleAcrossOccasions).toBe('A neat coat for evenings, ordinary work clothes by day.');expect(h.calls.some(c=>c.req.task==='index')).toBe(false);
 const {catalogEntries}=await import('../src/domain/lumistry-catalog.js'),appearance=new Set(catalogEntries().filter(e=>e.group==='appearance').map(e=>e.id)),directions=p.creationPlan!.selection.tags.filter(t=>appearance.has(t));expect(directions).toHaveLength(2);expect(directions.some(t=>['usual-clothing-choice','practical-style','personally-kept-style','mix-of-polish'].includes(t))).toBe(false);
});
test('archive-and-clear verifies a private snapshot and resets only the comparison view',async()=>{
 const {measurementTelemetry}=await import('../src/domain/lumistry-measurements.js'),h=harness();await h.run();const d=h.state.lumistry.owner,before=structuredClone(d),calls=h.calls.length;
 await h.app.handle({action:'archive_measurements',requestId:'archive-period'},{chatId:'c',characterId:'a'},'u');const after=h.state.lumistry.owner;
 expect(after.measurementArchives).toHaveLength(1);expect(after.discoveryAccounting).toEqual(before.discoveryAccounting);expect(after.creationTelemetry).toEqual(before.creationTelemetry);expect(after.discoveryJob!.spent).toEqual(before.discoveryJob!.spent);expect(after.discoveryJob!.slots).toEqual(before.discoveryJob!.slots);expect(after.profiles).toEqual(before.profiles);expect(after.discoveryJob!.metrics).toEqual([]);expect(creationSummary(measurementTelemetry(after.creationTelemetry!,after.measurementBaseline)).usage.calls).toBe(0);expect(h.calls).toHaveLength(calls);
 const id=after.measurementArchives![0].id,archive:any=await h.h.readAuthoringArchive(id,'u');expect(archive.usage).toEqual(before.discoveryAccounting);expect(archive.jobs[0].metrics).toEqual(before.discoveryJob!.metrics);
 await h.app.handle({action:'archive_read',archiveId:id},{chatId:'c',characterId:'a'},'u');expect(h.sent.at(-1).archive.kind).toBe('measurements');expect(normalizeDating(after).measurementBaseline).toEqual(after.measurementBaseline);
});
test('failed archive verification and concurrent measurements cannot clear logs',async()=>{
 const h=harness();await h.run();const before=structuredClone(h.state.lumistry.owner);h.h.readAuthoringArchive=async()=>null;
 await expect(h.app.handle({action:'archive_measurements'},{chatId:'c',characterId:'a'},'u')).rejects.toThrow('verification failed');expect(h.state.lumistry.owner).toEqual(before);
 h.h.readAuthoringArchive=async()=>{h.state.lumistry.owner.discoveryAccounting.calls++;return {}};
 h.h.writeAuthoringArchive=async(_id:string,value:any)=>{h.h.readAuthoringArchive=async()=>{h.state.lumistry.owner.discoveryAccounting.calls++;return structuredClone(value)}};
 await expect(h.app.handle({action:'archive_measurements'},{chatId:'c',characterId:'a'},'u')).rejects.toThrow('changed during archival');expect(h.state.lumistry.owner.measurementBaseline).toBeUndefined();expect(h.state.lumistry.owner.discoveryJob!.metrics).toEqual(before.discoveryJob!.metrics);
});
test('measurement windows exclude old receipts and suppress full-profile averages for carried-in work',async()=>{
 const {measurementTelemetry}=await import('../src/domain/lumistry-measurements.js'),t=emptyCreationTelemetry(),identity={jobId:'j',slotId:'slot_0',planId:'p',startedAt:'before'};
 recordCreation(t,identity,{requestId:'old',task:'dossier',promptTokens:100,completionTokens:50});const baseline={startedAt:'now',accounting:creationSummary(t).usage,telemetry:structuredClone(t)};
 recordCreation(t,identity,{requestId:'new',task:'photos',promptTokens:10,completionTokens:5,checkpoint:true});t.candidates.p.status='published';const view=measurementTelemetry(t,baseline),summary=creationSummary(view);expect(view.receipts).toEqual(['new']);expect(summary.usage.calls).toBe(1);expect(summary.usage.input).toBe(10);expect(summary.published).toBe(1);expect(summary.tokensPerPublished).toBeUndefined();expect(summary.callsPerPublished).toBeUndefined();expect(recordCreation(t,identity,{requestId:'old',task:'dossier'})).toBe(false);
});
test('reviewed heading variants and unknown organizer output preserve explicit saved dossier facts',async()=>{
 const {parseAuthoring,projectDossier,canonicalAuthoringFields}=await import('../src/domain/lumistry-v2.js');
 const text=dossier('Alias fixture').replace('Spoken voice and register:','Spoken voice:').replace('Skin / fur / scales / surface:','Skin / fur / scales / scales:').replace('Sentence rhythm and conversational effort:','Sentence rhythm:');
 const a:any={version:2,dossier:parseAuthoring(text,'dossier','stop'),index:parseAuthoring('Spoken voice and register: NOT_ESTABLISHED\nSkin / fur / scales / surface: NOT_ESTABLISHED','index','stop'),photos:[],gallery:[],provenance:{}};
 delete a.dossier.fields['Spoken voice and register'];delete a.dossier.fields['Skin / fur / scales / surface'];
 const row=projectDossier(a,{},'slot_0',2);expect(row.problems).toEqual([]);expect(row.row.person.appearance.skin).toContain('olive');expect(row.row.person.writingVoice.register).toContain('Plain direct');expect(canonicalAuthoringFields(a.dossier).fields['Spoken voice and register']).toContain('Plain direct');
});
test('unreferenced photographs map only by unique exact saved purpose, never by their order',async()=>{
 const {referencedPhotos}=await import('../src/domain/lumistry-photo-references.js'),{parseAuthoring}=await import('../src/domain/lumistry-v2.js');
 const scene=(purpose:string,ref='')=>(ref?'Record reference: '+ref+'\n':'')+photo('Literal '+purpose).replace('Shows a workshop hobby.',purpose);
 const gallery=['First purpose','Second purpose','Third purpose'];
 const reordered=referencedPhotos(parseAuthoring(scene(gallery[2])+'\n'+scene(gallery[0]),'photos','stop'),gallery,[0,1,2]);expect(reordered.units[0]!.fields['Full literal description']).toBe('Literal First purpose');expect(reordered.units[1]).toBeUndefined();expect(reordered.units[2]!.fields['Full literal description']).toBe('Literal Third purpose');
 expect(referencedPhotos(parseAuthoring(scene('same')+'\n'+scene('same'),'photos','stop'),['same','same'],[0,1]).units.every(x=>!x)).toBe(true);
 expect(referencedPhotos(parseAuthoring(scene(gallery[0],'photo_999'),'photos','stop'),gallery,[0,1]).units.every(x=>!x)).toBe(true);
});
test('saved unreferenced scenes recover locally after exhausted metadata repairs without resetting budgets',async()=>{
 const {parseAuthoring}=await import('../src/domain/lumistry-v2.js'),h=harness();h.generate=async req=>req.task==='photos'?Promise.reject(new Error('offline fixture')):h.response(req);await h.run();
 const slot=h.state.lumistry.owner.discoveryJob!.slots[0],p=slot.progress!,purposes=p.authored.gallery;slot.status='failed';slot.unitAttempts||={};for(let i=0;i<slot.photoCount;i++)slot.unitAttempts[`photo_${i+1}`]=2;
 p.pendingArtifact=parseAuthoring(purposes.map((purpose,i)=>photo('Saved literal '+i).replace('Shows a workshop hobby.',purpose)).join('\n'),'photos','stop');const source=p.pendingArtifact.text,before=h.calls.length;h.generate=undefined;
 await h.run();expect(h.calls).toHaveLength(before);expect(h.state.lumistry.owner.profiles).toHaveLength(5);const accepted=h.state.lumistry.owner.profiles.at(-1)!;expect(accepted.photoPlan.map(p=>p.description)).toEqual(purposes.map((_,i)=>'Saved literal '+i));expect(accepted.authoring!.photos.map(a=>a.text).join('\n')).toBe(source);expect(h.state.lumistry.owner.discoveryJob!.slots[0].unitAttempts).toEqual(slot.unitAttempts);
});

import {creationTaskContext,creationRepairContext} from '../src/backend/lumistry-creation-context.js';
import {v2AuthorPrompt,v2RepairPrompt} from '../src/backend/lumistry-v2-prompts.js';
import {PUBLIC_SELF_PRESENTATION} from '../src/domain/lumistry-craft.js';
import {personaProfilePrompt,npcProfilePrompt} from '../src/backend/lumistry-prompts.js';

test('public writing and repairs receive accepted facts without filter-selection pressure',()=>{
 const profile:any={alias:'Juniper',age:32,fields:{height:'143 cm',bodyType:'petite',orientation:'straight',sexualRole:'submissive',libido:'high'},hiddenFields:['sexualRole','libido'],privateFields:{commitments:'exclusive partner',boundaries:'no public intimate details'},person:{life:{career:'GP at a clinic',routine:'takes a familiar afternoon walk'},writingVoice:{mechanics:'lowercase'}},phoneProfile:{personality:'reserved'}};
 const acceptedPerson=publicPersonContext(profile);
 const input:any={task:'public',stage:'public',requiredValues:profile.fields,requiredPublicCategories:['height','bodyType'],description:'user filter brief',lockedCandidate:{filters:'planning only'},characterization:{requiredFields:profile.fields},variety:{relationshipFocus:'friends first',questionFocuses:['ordinary day']},counts:{questions:1,photos:1},questionReferences:['question_1'],galleryReferences:['gallery_1'],acceptedPerson,recentPublicWriting:['old profile'],repair:{recordReferences:[{id:'question_1',fields:{Question:'Your Sunday?'}}]}};
 for(const projected of [creationTaskContext(input),creationRepairContext(input,{},['Answer'],'repair')]) {
  for(const key of ['requiredValues','requiredPublicCategories','description','lockedCandidate','characterization'])expect(projected).not.toHaveProperty(key);
  expect(projected.variety).toEqual({questionFocuses:['ordinary day']});expect(projected.acceptedPerson.fields).toEqual(profile.fields);
  expect(projected.acceptedPerson.hiddenFields).toEqual(['sexualRole','libido']);expect(projected.acceptedPerson.privateTruth.commitments).toBe('exclusive partner');
  expect(projected.acceptedPerson.person.life.career).toBe('GP at a clinic');expect(projected.questionReferences).toEqual(['question_1']);expect(projected.repair.recordReferences[0].id).toBe('question_1');
 }
 expect(input.requiredValues).toEqual(profile.fields); // projection never rewrites the saved plan
 for(const prompt of [v2AuthorPrompt('public'),v2RepairPrompt('public',['Bio']),personaProfilePrompt,npcProfilePrompt])expect(prompt).toContain(PUBLIC_SELF_PRESENTATION);
 expect(v2AuthorPrompt('public')).not.toContain('Preserve explicitly requested filters');
});


test('discovery production public request strips filter provenance while keeping canonical categories',async()=>{
 const h=harness();await h.run();const calls=h.calls.filter(c=>c.req.task==='public');expect(calls.length).toBeGreaterThan(0);
 for(const {req} of calls){expect(req).not.toHaveProperty('requiredValues');expect(req).not.toHaveProperty('requiredPublicCategories');expect(req).not.toHaveProperty('characterization');expect(req.acceptedPerson.fields).toBeDefined();expect(req.questionReferences.length).toBeGreaterThan(0);}
 expect(h.state.lumistry.owner.profiles).toHaveLength(5);
});

import {exportLumistryDiagnostics} from '../src/backend/lumistry-diagnostics-export.js';

test('one diagnostics bundle includes all scoped jobs, repair evidence and archives without unrelated phone data',async()=>{
 const h=harness();h.generate=async()=>{throw Error('offline provider stop')};await h.run();const d=h.state.lumistry.owner;
 d.draftJob=structuredClone(d.discoveryJob);d.draftJob!.id='manual-job';
 d.measurementArchives=[{id:'measurement-good',createdAt:'now',calls:2,input:10,output:5},{id:'unreadable',createdAt:'now',calls:0,input:0,output:0}];
 d.authoringArchives=[{id:'authoring-good',jobId:'old',createdAt:'now',kind:'draftJob'},{id:'wrong-owner',jobId:'other',createdAt:'now',kind:'discoveryJob'}];
 const archives:any={'measurement-good':{owner:'owner',chatId:'c',characterId:'a',kind:'measurements',usage:{calls:2}},'authoring-good':{owner:'owner',chatId:'c',characterId:'a',kind:'draftJob',job:{id:'old'}},'wrong-owner':{owner:'other',chatId:'c',characterId:'a',job:{secret:'OTHER OWNER'}}};
 const before=JSON.stringify(h.state);
 const prefs:any={authoring:{reasoning:'low'},apiKey:'CREDENTIAL SECRET',generationHistory:[{task:'lumistry-self_generate',requestedMaxTokens:400,reasoningTokens:400,status:'failed',reasoning:'HIDDEN REASONING',content:'RAW SOURCE'},{task:'message-reply',content:'UNRELATED CHAT'}]};
 const bundle=await exportLumistryDiagnostics(h.state,prefs,async id=>{if(id==='unreadable')throw Error('PRIVATE STORAGE PATH');return archives[id]},'now');
 expect(bundle.schema).toBe('lumistry-diagnostics-1');expect(bundle.jobs).toHaveLength(2);expect(bundle.repairEvidence).toHaveLength(2);expect(bundle.publishedProfiles).toHaveLength(4);
 expect(bundle.configuration.recentRuns).toHaveLength(1);expect(bundle.configuration.recentRuns[0].requestedMaxTokens).toBe(400);
 expect(bundle.archives.filter(a=>a.status==='included')).toHaveLength(2);expect(bundle.archives.filter(a=>a.status==='unavailable')).toHaveLength(2);
 for(const secret of ['CREDENTIAL SECRET','HIDDEN REASONING','RAW SOURCE','UNRELATED CHAT','OTHER OWNER','PRIVATE STORAGE PATH'])expect(JSON.stringify(bundle)).not.toContain(secret);
 expect(JSON.stringify(h.state)).toBe(before);
});

test('single export action reads backend preferences and private archives without generating or mutating',async()=>{
 const h=harness();h.h.diagnosticPreferences=async(user:string)=>{expect(user).toBe('u');return {authoring:{reasoning:'low'}}};
 let recipient:string|undefined;const send=h.h.send;h.h.send=(payload:any,user:string)=>{recipient=user;send(payload)};
 const before=JSON.stringify(h.state);await h.app.handle({action:'export_diagnostics',requestId:'one-file'},{chatId:'c',characterId:'a'},'u');
 const result=h.sent.find((e:any)=>e.phase==='diagnostics_export');expect(result.bundle.schema).toBe('lumistry-diagnostics-1');expect(result.bundle.configuration.authoring.reasoning).toBe('low');expect(recipient).toBe('u');expect(h.calls).toHaveLength(0);expect(JSON.stringify(h.state)).toBe(before);
});

import {PocketDiagnosticJournal,diagnosticEvent,DIAGNOSTIC_LIMIT} from '../src/backend/pocket-diagnostics.js';

test('Lumistry journal retains dating messaging and future error types independently of the UI history, without raw content',async()=>{
 let saved:any=null;const users:string[]=[];
 const journal=new PocketDiagnosticJournal(async user=>{users.push(user!);return structuredClone(saved)},async(value,user)=>{users.push(user!);saved=structuredClone(value)});
 for(let i=0;i<DIAGNOSTIC_LIMIT+3;i++)journal.append({type:'lumiphone:error',appScope:'lumistry',operation:'future-feature',requestId:'r'+i,error:'PRIVATE CHAT sk-SECRET123456789',content:'HIDDEN REASONING'},'trusted');
 journal.append({type:'lumiphone:generation_status',run:{appScope:'lumistry',requestId:'reply',task:'message-reply',status:'started',content:'RAW MESSAGE'}},'trusted');
 journal.append({type:'lumiphone:generation_status',run:{appScope:'lumistry',requestId:'reply',task:'message-reply',status:'failed',diagnostic:{layer:'parse',code:'json-shape',retryable:true,saved:false},reasoning:'HIDDEN REASONING',promptTokens:125,completionTokens:5}},'trusted');
 const snapshot:any=await journal.snapshot('trusted');expect(snapshot.events.length).toBeLessThanOrEqual(DIAGNOSTIC_LIMIT);expect(snapshot.events.length).toBeGreaterThanOrEqual(DIAGNOSTIC_LIMIT-2);expect(snapshot.pendingDropped).toBeGreaterThan(0);expect(snapshot.events.at(-1).run.task).toBe('message-reply');expect(snapshot.events.at(-1).run.status).toBe('failed');expect(snapshot.events.at(-1).run.diagnostic.code).toBe('json-shape');
 for(const value of ['PRIVATE CHAT','SECRET123456789','RAW MESSAGE','HIDDEN REASONING'])expect(JSON.stringify(snapshot)).not.toContain(value);
 expect(new Set(users)).toEqual(new Set(['trusted']));
 const reloaded=new PocketDiagnosticJournal(async()=>structuredClone(saved),async()=>{});expect((await reloaded.snapshot('trusted') as any).events).toEqual(snapshot.events);
 expect(diagnosticEvent({type:'lumiphone:error',error:'ordinary Pocket failure'},'now')).toBeUndefined();
 expect(diagnosticEvent({type:'lumiphone:generation_status',run:{task:'message-reply',requestId:'ordinary'}},'now')).toBeUndefined();
 expect(diagnosticEvent({type:'lumiphone:future_status',appScope:'lumistry',status:'error',message:'Provider timed out'},'now')?.code).toBe('timeout');
});

test('diagnostic storage failure preserves pending errors and is visible without rejecting an operation',async()=>{
 const journal=new PocketDiagnosticJournal(async()=>{throw Error('private storage failure')},async()=>{throw Error('must not overwrite after failed read')});
 journal.append({type:'lumiphone:error',appScope:'lumistry',requestId:'pending',error:'failed'},'u');const snapshot:any=await journal.snapshot('u');expect(snapshot.available).toBe(false);expect(snapshot.pending).toHaveLength(1);expect(snapshot.writeFailures).toBe(1);
});

test('combined export includes scoped dating delivery state and messaging diagnostics without chat text',async()=>{
 const h=harness(),state=h.state as any;
 state.conversations=[{id:'dating',channel:'dating',datingOwnerId:'owner',messages:[{id:'m',sender:'user',createdAt:'now',status:'failed',text:'PRIVATE DATING CONTENT'}],availability:{state:'remote'},outgoingBurst:{id:'b',messageIds:['m'],held:true,open:true,finalized:false}}, {id:'ordinary',channel:'phone',messages:[{text:'UNRELATED RAW CHAT'}]}];
 const bundle=await exportLumistryDiagnostics(state,{generationHistory:[{appScope:'lumistry',task:'reply-decision',requestId:'decision',status:'failed',diagnostic:{layer:'provider',code:'timeout',retryable:true,saved:false}}]},undefined,'now',{events:[{code:'frontend-exception'}]});
 expect(bundle.messaging).toHaveLength(1);expect(bundle.messaging[0].messages[0].status).toBe('failed');expect(bundle.messaging[0].outgoingBurst?.held).toBe(true);expect(bundle.configuration.recentRuns[0].task).toBe('reply-decision');expect(bundle.diagnosticJournal).toEqual({events:[{code:'frontend-exception'}]});
 expect(JSON.stringify(bundle)).not.toContain('PRIVATE DATING CONTENT');expect(JSON.stringify(bundle)).not.toContain('UNRELATED RAW CHAT');
});
