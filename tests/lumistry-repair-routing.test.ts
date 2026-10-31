import {test,expect} from 'bun:test';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {dossier,publicText} from './fixtures/lumistry-v2.js';
import {planRepair,aliasCollision,reservedAliases} from '../src/domain/lumistry-repair.js';
import {parseAuthoring,projectDossier,scopeRepairArtifact,repairPublicUnits,projectPublic,repairIdentityUnits} from '../src/domain/lumistry-v2.js';
import {normalizeDiscoveryProgress} from '../src/domain/lumistry-discovery-progress.js';
import {compactCreationContext,creationRepairContext,requestSectionBytes,publicPersonContext,publicItemContext} from '../src/backend/lumistry-creation-context.js';
import {emptyCreationTelemetry,recordCreation,normalizeCreationTelemetry} from '../src/domain/lumistry-creation-telemetry.js';
import {measurementTelemetry} from '../src/domain/lumistry-measurements.js';
import {emptyUsageTotals} from '../src/domain/reliability.js';
const a=(text:string,kind:any='dossier')=>parseAuthoring(text,kind,'stop');
const authored=(text=dossier())=>({version:2 as const,dossier:a(text),photos:[],gallery:[],provenance:{}});
const identity=()=>projectDossier(authored(),{},'fixture',1).row;
function twoWorkers(){const h=lumistryHarness(3);h.state.lumistry.owner.generationSettings.creation={readyTarget:5,photoBatchCap:5,workers:2};let tail=Promise.resolve();const lock=h.h.withStateLock;h.h.withStateLock=async(k:string,fn:any)=>{const prior=tail;let release!:()=>void;tail=new Promise<void>(r=>release=r);await prior;try{return await lock(k,fn)}finally{release()}};const generate=h.h.generate;h.h.generate=async(...args:any[])=>{await new Promise(r=>setTimeout(r,0));return generate(...args)};return h;}

test('repair authority distinguishes extraction, authorship, public rewriting, photos and hard constraints',()=>{
 const missing={code:'disclosure',message:'choice missing',labels:['Anonymous profile']};
 expect(planRepair('dossier',[missing],missing.labels,{}).operation).toBe('author');
 expect(planRepair('dossier',[missing],missing.labels,{'Anonymous profile':'I do not hide my identity.'}).operation).toBe('extract');
 expect(planRepair('index',[aliasCollision('Taken',['Taken'])!],['Public alias'],{'Public alias':'Taken'}).task).toBe('dossier');
 expect(planRepair('index',[missing],missing.labels,{},false).operation).toBe('blocked');
 expect(planRepair('public',[],['Bio']).operation).toBe('rewrite');expect(planRepair('photos',[],['Public caption']).operation).toBe('photo');
 expect(planRepair('dossier',[{...missing,repair:'blocked'}],missing.labels).operation).toBe('blocked');
 expect(planRepair('public',[{...missing,repair:'resume'}],[]).operation).toBe('resume');
 expect(aliasCollision('  Ａster ',['aster'])?.repair).toBe('author');
});
test('duplicate alias gets one narrow authoring correction while all accepted identity facts persist',async()=>{
 const h=lumistryHarness(24);let first=true;
 h.generate=async req=>{const result=h.response(req);if(req.task==='dossier'){if(first){first=false;result.authoredText=result.authoredText.replace('Public alias: New Aster','Public alias: Saved 0');}else result.authoredText='Public alias: Different Aster\nHair: malicious red curls';}return result;};
 await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);
 const calls=h.calls.filter(c=>c.req.task==='dossier');expect(calls).toHaveLength(2);expect(h.calls.some(c=>c.req.task==='index')).toBe(false);
 expect(calls[1].req.requestedUnresolved).toEqual(['Public alias']);expect(calls[1].req.stage).toBe('identity');expect(calls[1].req).not.toHaveProperty('lockedCandidate');expect(calls[1].req).not.toHaveProperty('recentPatterns');
 const p=h.state.lumistry.owner.profiles.at(-1)!;expect(p.alias).toBe('Different Aster');expect(p.person.appearance.hair).toBe(p.authoring!.dossier!.fields.Hair);expect(p.person.appearance.hair).not.toContain('malicious');expect(p.authoring?.dossier?.content).toContain('Name and dating alias: New Aster');
 expect(h.state.lumistry.owner.discoveryJob!.metrics[0].code).toBe('alias-collision');expect(h.state.lumistry.owner.discoveryJob!.metrics.some(m=>m.discardedLabels?.includes('Hair'))).toBe(true);
 expect(calls[1].input.messages[1].content.length).toBeLessThan(calls[0].input.messages[1].content.length/2);
});
test('saved exhausted organizer work reroutes using remaining dossier allowance without resetting spending',async()=>{
 const h=lumistryHarness(24);let first=true;h.generate=async req=>{if(req.task==='dossier'&&first){first=false;return {authoredText:dossier('Saved 0'),finishReason:'stop'};}throw new Error('offline provider stop');};await h.run();
 const j=h.state.lumistry.owner.discoveryJob!,slot=j.slots[0],p=slot.progress!;slot.status='failed';slot.unitAttempts={dossier:1,index:2};slot.attempts=2;p.task='index';p.repairPlan=undefined;p.issues=[{code:'index-scope',message:'Rejected extra fields',labels:[]}];p.repairLabels=['Public alias'];p.pendingArtifact=a('Hair: red curls','index');const beforeCalls=h.calls.length,beforeSpend=j.spent!.calls,plan=structuredClone(slot.plan);
 h.generate=async req=>req.task==='dossier'?{authoredText:'Public alias: Recovered Aster',finishReason:'stop'}:h.response(req);await h.run();
 expect(h.state.lumistry.owner.profiles).toHaveLength(25);expect(h.calls.slice(beforeCalls).some(c=>c.req.task==='index')).toBe(false);expect(h.state.lumistry.owner.discoveryJob!.spent!.calls).toBeGreaterThan(beforeSpend);
 const saved=h.state.lumistry.owner.discoveryJob!.slots[0];expect(saved.plan).toEqual(plan);expect(saved.unitAttempts?.index).toBe(2);expect(saved.unitAttempts?.dossier).toBe(2);
});
test('rerouting never buys a request when the correct unit allowance is exhausted',async()=>{
 const h=lumistryHarness(24);let first=true;h.generate=async req=>{if(first){first=false;return {authoredText:dossier('Saved 0'),finishReason:'stop'};}throw new Error('offline stop');};await h.run();
 const slot=h.state.lumistry.owner.discoveryJob!.slots[0];slot.unitAttempts={dossier:2,index:2};slot.status='failed';slot.progress!.task='index';slot.progress!.repairPlan=undefined;
 const before=h.calls.length;await h.run();expect(h.calls).toHaveLength(before);expect(h.state.lumistry.owner.profiles).toHaveLength(24);expect(slot.unitAttempts).toEqual({dossier:2,index:2});
});
test('scoping discards unrelated edits and preserves the original target after an empty correction',()=>{
 const scoped=scopeRepairArtifact(a('Anonymous profile: no\nHair: red curls','index'),['Anonymous profile']);expect(scoped.artifact.fields).toEqual({'Anonymous profile':'no'});expect(scoped.discardedLabels).toEqual(['Hair']);
 try{scopeRepairArtifact(a('Hair: red curls','index'),['Anonymous profile']);throw new Error('must reject');}catch(error:any){expect(error.issues[0].labels).toEqual(['Anonymous profile']);}
 const progress=normalizeDiscoveryProgress({version:2,stage:'identity',task:'dossier',draft:{},authored:authored(),problems:[],repairPlan:planRepair('dossier',[aliasCollision('x',['x'])!],['Public alias']),repairReturn:'photos',rejectedArtifact:a('Hair: red curls','index')});
 expect(progress?.repairPlan?.operation).toBe('author');expect(progress?.repairReturn).toBe('photos');expect(progress?.rejectedArtifact?.fields.Hair).toBe('red curls');
});
test('valid referenced public patches survive invalid siblings and preserve accepted records',()=>{
 const owner=identity();const old=a(publicText(2,1).replace('the lamp 1 finally works','x'.repeat(361)).replace('the lamp 2 finally works','y'.repeat(361)),'public');
 const refs=old.records!.filter(r=>r.start==='Question').map(r=>r.id);
 const patch=a(`Record reference: ${refs[0]}\nQuestion: what small thing 1?\nAnswer: repaired one lamp\nRecord reference: unknown_record\nQuestion: invented\nAnswer: ignored`,'public');
 const result=repairPublicUnits(old,patch,['Question','Answer'],false,{questions:2,photos:1},owner);
 expect(result.artifact.content).toContain('repaired one lamp');expect(result.artifact.content).toContain('y'.repeat(361));expect(result.discardedLabels).toContain('unknown_record');expect(projectPublic(result.artifact,owner,2,1).problems).toHaveLength(1);
 const last=repairPublicUnits(result.artifact,a(`Record reference: ${refs[1]}\nQuestion: what small thing 2?\nAnswer: repaired another lamp`,'public'),['Question','Answer'],false,{questions:2,photos:1},owner);expect(projectPublic(last.artifact,owner,2,1).problems).toEqual([]);expect(last.artifact.content).toContain('repaired one lamp');
});
test('mixed identity corrections retain the valid scalar when a companion edit violates identity',()=>{
 const original=authored(dossier('Aster','Companion name: Pip\nCompanion kind: pet\nCompanion appearance: white dog\nCompanion relationship: her dog'));
 const patch=a('Public alias: New alias\nCompanion name: Pip\nCompanion kind: pet\nCompanion appearance: entirely different black cat\nCompanion relationship: her dog');
 const result=repairIdentityUnits(original,patch,['Public alias','Companion appearance'],'dossier');expect(result.artifact.fields['Public alias']).toBe('New alias');expect(projectDossier({...original,dossier:result.artifact},{},'fixture',1).row.person.entities[0].appearance).toBe('white dog');expect(result.discardedLabels).toContain('Companion');
});
test('two workers reserve aliases under the same native lock and correct only the losing candidate',async()=>{
 const h=twoWorkers();h.generate=async req=>req.task==='dossier'&&req.requestedUnresolved?.includes('Public alias')?{authoredText:'Public alias: Second Aster',finishReason:'stop'}:h.response(req);await h.run();
 const people=h.state.lumistry.owner.profiles;expect(people).toHaveLength(5);expect(new Set(people.map(p=>p.alias.toLowerCase())).size).toBe(5);expect(h.calls.filter(c=>c.req.requestedUnresolved?.includes('Public alias'))).toHaveLength(1);expect(h.calls.some(c=>c.req.task==='index')).toBe(false);
});
test('a publication-time alias collision preserves complete public/gallery checkpoints',async()=>{
 const h=lumistryHarness(24);let inserted=false;h.generate=async req=>{if(req.task==='dossier'&&req.requestedUnresolved?.includes('Public alias'))return {authoredText:'Public alias: Late corrected Aster',finishReason:'stop'};if(req.task==='photos'&&!inserted&&req.photoReferences.includes('photo_'+h.state.lumistry.owner.discoveryJob!.slots[0].photoCount)){inserted=true;const extra=structuredClone(h.state.lumistry.owner.profiles[0]);extra.id='external';extra.alias='New Aster';extra.age=80;h.state.lumistry.owner.profiles.push(extra);}return h.response(req);};await h.run();
 expect(h.state.lumistry.owner.profiles.some(p=>p.alias==='Late corrected Aster')).toBe(true);expect(h.calls.filter(c=>c.req.task==='public')).toHaveLength(1);const photoCalls=h.calls.filter(c=>c.req.task==='photos');expect(photoCalls.length).toBeLessThanOrEqual(2);expect(h.calls.at(-1)?.req.requestedUnresolved).toEqual(['Public alias']);
});
test('context compaction preserves private truth, disclosure, explicit empty lists, null, false and zero',()=>{
 expect(compactCreationContext({empty:'',absent:undefined,nested:{empty:''},hiddenFields:[],unknown:null,flag:false,count:0})).toEqual({hiddenFields:[],unknown:null,flag:false,count:0});
 const person=publicPersonContext({fields:{orientation:'bisexual'},hiddenFields:['orientation'],privateFields:{orientation:'bisexual',guardedTopics:'private employer',commitments:'partnered'}});expect(person.fields.orientation).toBe('bisexual');expect(person.hiddenFields).toEqual(['orientation']);expect(person.privateTruth.guardedTopics).toBe('private employer');expect(person.privateTruth.commitments).toBe('partnered');
 const context=creationRepairContext({task:'dossier',existingAliases:['Taken'],repair:{retainedFields:{'Public alias':'Taken'}},lockedCandidate:{huge:'unneeded'},recentPatterns:['unneeded']},{draft:{alias:'Taken',anonymous:false},authored:authored()},['Public alias'],'author');expect(context).not.toHaveProperty('lockedCandidate');expect(context).not.toHaveProperty('recentPatterns');expect(context.anonymous).toBe(false);
});
test('section measurements and repair operations survive deduplication, normalization and period subtraction',()=>{
 const t=emptyCreationTelemetry(),id={jobId:'j',slotId:'slot_0',startedAt:'now'};const metric={requestId:'r1',task:'dossier',invalid:0,repair:true,repairOperation:'author',promptSections:requestSectionBytes('abc',{repair:{field:'alias'}}),promptTokens:10,completionTokens:2};recordCreation(t,id,metric);const baseline={startedAt:'then',telemetry:structuredClone(t),accounting:emptyUsageTotals()};
 expect(recordCreation(t,id,metric)).toBe(false);recordCreation(t,id,{...metric,requestId:'r2'});const normalized=normalizeCreationTelemetry(JSON.parse(JSON.stringify(t)));const delta=measurementTelemetry(normalized,baseline).candidates['j:slot_0'].stages.dossier;expect(delta.promptSections?.instructions).toBe(3);expect(delta.repairOperations?.author).toBe(1);expect(delta.usage.calls).toBe(1);expect(delta.sectionReported).toBe(1);expect(delta.validResponses).toBe(1);expect(delta.validationReported).toBe(1);
});
test('explicit retry restores only the requested unit allowance and preserves other spending',async()=>{
 const h=lumistryHarness(24);h.generate=async()=>{throw new Error('offline stop')};await h.run();const j=h.state.lumistry.owner.discoveryJob!,s=j.slots[0];s.progress!.task='dossier';s.unitAttempts={dossier:2,index:2,photo_1:2};const spent=structuredClone(j.spent);
 await h.app.handle({action:'retry_slot',slotId:s.id,requestId:'retry'},{chatId:'c',characterId:'a'},'u');expect(h.state.lumistry.owner.discoveryJob!.slots[0].unitAttempts).toEqual({index:2,photo_1:2});expect(h.state.lumistry.owner.discoveryJob!.spent).toEqual(spent);
});

test('manual drafts use the same alias repair and stay outside published profiles and contacts',async()=>{
 const h=lumistryHarness(24);let first=true;h.generate=async req=>{if(req.task==='dossier'){if(first){first=false;return {authoredText:dossier('Saved 0'),finishReason:'stop'};}return {authoredText:'Public alias: Manual Aster',finishReason:'stop'};}return h.response(req);};
 await h.app.handle({action:'generate',description:'A fictional adult for review.',requestId:'manual'},{chatId:'c',characterId:'a'},'u');expect(h.state.lumistry.owner.draftJob?.reviewDraft?.alias).toBe('Manual Aster');expect(h.state.lumistry.owner.profiles).toHaveLength(24);expect(h.state.contacts).toEqual([]);expect(h.state.conversations).toEqual([]);expect(h.calls.some(c=>c.req.task==='index')).toBe(false);
});
test('conflicting source fields require authoring rather than choosing the last conflicting value',async()=>{
 const h=lumistryHarness(24);let first=true;h.generate=async req=>{if(req.task==='dossier'){if(first){first=false;return {authoredText:dossier('Aster conflict','Hair: contradictory red hair'),finishReason:'stop'};}return {authoredText:'Hair: dark brown short waves',finishReason:'stop'};}return h.response(req);};await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);expect(h.calls.some(c=>c.req.task==='index')).toBe(false);expect(h.state.lumistry.owner.profiles.at(-1)!.person.appearance.hair).toContain('dark brown short waves');expect(h.state.lumistry.owner.profiles.at(-1)!.person.appearance.hair).not.toContain('contradictory red hair');
});
test('request byte sections sum to the serialized request without exposing values',()=>{
 const system='instruction',input={word:'café',flag:false,hiddenFields:[]};const parts=requestSectionBytes(system,input);expect(Object.values(parts).reduce((a,b)=>a+b,0)).toBe(new TextEncoder().encode(system+JSON.stringify(input)).length);expect(JSON.stringify(parts)).not.toContain('café');
});

test('explicit retry on a stale organizer alias failure resets the author unit, never the organizer or photos',async()=>{
 const h=lumistryHarness(24);let first=true;h.generate=async()=>{if(first){first=false;return {authoredText:dossier('Saved 0'),finishReason:'stop'};}throw new Error('offline stop')};await h.run();const j=h.state.lumistry.owner.discoveryJob!,s=j.slots[0];s.progress!.task='index';s.progress!.repairPlan=undefined;s.progress!.repairLabels=['Public alias'];s.unitAttempts={dossier:2,index:2,photo_1:2};
 await h.app.handle({action:'retry_slot',slotId:s.id,requestId:'retry'},{chatId:'c',characterId:'a'},'u');expect(h.state.lumistry.owner.discoveryJob!.slots[0].unitAttempts).toEqual({index:2,photo_1:2});expect(h.state.lumistry.owner.discoveryJob!.slots[0].progress!.repairPlan?.task).toBe('dossier');
});

test('single-item rewrite context excludes unrelated cards and images; optional Bank policy is not repeated',async()=>{
 const p=identity();p.person.prompts=[{question:'target?',answer:'target answer'},{question:'unrelated question',answer:'unrelated answer'}];p.photoPlan=[{description:'Unrelated gallery payload',caption:'old'}];
 const context=publicItemContext(p,'answer',0);expect(context.question).toBe('target?');expect(context.existing).toBe('target answer');expect(JSON.stringify(context)).not.toContain('unrelated answer');expect(JSON.stringify(context)).not.toContain('Unrelated gallery payload');
 const {bankProfileAssessmentPrompt}=await import('../src/backend/lumistry-prompts.js');const {ENGLISH_ROLEPLAY}=await import('../src/domain/lumistry-craft.js');expect(bankProfileAssessmentPrompt.split(ENGLISH_ROLEPLAY)).toHaveLength(2);
});
