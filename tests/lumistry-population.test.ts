import {test,expect} from 'bun:test';
import {OCCUPATIONS,OCCUPATION_CROSSWALK,OCCUPATION_BY_ID,eligibleOccupation,worldDefaults,WORLD_CAPABILITIES,normalizePopulationWorld} from '../src/domain/lumistry-occupations.js';
import {selectPopulationPlan,normalizeCandidatePlan,POPULATION_SCHEMA,POPULATION_POLICY,populationBrief,compatiblePopulationPresentation,manualWork} from '../src/domain/lumistry-population.js';
import {normalizeDating,normalizeDatingProfile,publicDatingProfile} from '../src/domain/lumistry.js';
import {normalizeDiscoveryJob,discoveryFingerprint} from '../src/domain/lumistry-pipeline.js';
import {compileDossierFields,DYNAMIC_DOSSIER_FIELDS} from '../src/domain/lumistry-dynamic-fields.js';
import {parseAuthoring,projectDossier} from '../src/domain/lumistry-v2.js';
import {v2AuthorPrompt} from '../src/backend/lumistry-v2-prompts.js';
import {archivePreviousAuthoring} from '../src/backend/lumistry-archives.js';
import {developmentTrigger,pendingDevelopmentModules,parseDevelopmentModules} from '../src/domain/lumistry-development-contract.js';
import {textingOwnBrief} from '../src/domain/lumistry-messaging.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {dossier} from './fixtures/lumistry-v2.js';
import {DATING_TROPES} from '../src/domain/lumistry-tropes.js';
const scope={chatId:'c',characterId:'a',userId:'u',commit:false} as const;
const resolver=async(t:string)=>({text:t.replace(/\{\{pick::([^}]+)\}\}/g,(_,v)=>v.split('::')[0]),diagnostics:[]});
const identity={id:'plan_1',createdAt:'2026-10-13T00:00:00Z',owner:'owner',questions:2,photos:3,distanceKm:2};
const plan=()=>selectPopulationPlan(normalizeDating({filters:{minAge:29,maxAge:29,fields:{occupation:{mode:'required',value:'tradesperson'}}}}),resolver,scope,identity,()=>.8);
test('negated modern technology cannot grant modern capabilities to a pre-industrial fantasy world',async()=>{
 const context='Adult medieval fantasy. Era: pre-industrial fantasy; no modern technology.';
 expect(normalizePopulationWorld(undefined,context)).toEqual(worldDefaults('fantasy'));
 expect(normalizePopulationWorld(worldDefaults('modern'),context)).toEqual(worldDefaults('fantasy'));
 expect(normalizePopulationWorld(undefined,'Historical town without modern technology.').kind).toBe('historical');
 expect(normalizePopulationWorld(undefined,'Science fiction with modern technology.').kind).toBe('spacefaring');
 expect(normalizePopulationWorld(undefined,'No modern technology.').capabilities).toEqual([]);
 const reviewed={...worldDefaults('modern'),reviewed:true as const};expect(normalizePopulationWorld(reviewed,context)).toEqual(reviewed);
 const custom={...worldDefaults('modern'),capabilities:['electricity']};expect(normalizePopulationWorld(custom,context).capabilities).toEqual(['electricity']);
 const d=normalizeDating({worldContext:context,populationWorld:worldDefaults('modern'),filters:{minAge:29,maxAge:29}});
 const p=await selectPopulationPlan(d,resolver,scope,identity,()=>.8);expect(p.world.kind).toBe('fantasy');expect(p.world.capabilities).not.toContain('electricity');expect(normalizeCandidatePlan(JSON.parse(JSON.stringify(p)))).toBeDefined();
});
test('corrected legacy world settings archive stale plans before replacement and retain their spending',async()=>{
 const h=lumistryHarness(24);h.generate=async()=>{throw Error('synthetic interrupted provider')};await h.run();
 const d=h.state.lumistry!.owner,old=d.discoveryJob!;
 d.worldContext='Adult medieval fantasy, pre-industrial; no modern technology.';d.populationWorld=worldDefaults('modern');const legacyFingerprint=JSON.parse(discoveryFingerprint(d));legacyFingerprint[2]=worldDefaults('modern');old.fingerprint=JSON.stringify(legacyFingerprint);
 const previousId=old.id,previousSpent=structuredClone(old.spent);h.generate=undefined;await h.run();
 expect(h.state.lumistry!.owner.discoveryJob!.id).not.toBe(previousId);
 const archive=h.state.lumistry!.owner.authoringArchives!.find(a=>a.jobId===previousId)!;expect(archive).toBeDefined();
 const evidence:any=await h.h.readAuthoringArchive(archive.id);expect(evidence.job.spent).toEqual(previousSpent);expect(evidence.job.slots[0].plan.world.kind).toBe('modern');
 expect(h.state.lumistry!.owner.profiles.at(-1)!.creationPlan!.world.kind).toBe('fantasy');
});
test('occupation provenance is complete, unique and keeps distinctions and situation-only entries',()=>{
 expect(OCCUPATIONS).toHaveLength(477);expect(new Set(OCCUPATIONS.map(r=>r.id)).size).toBe(477);expect(OCCUPATIONS.filter(r=>!r.pack)).toHaveLength(453);expect(OCCUPATIONS.filter(r=>r.addition)).toHaveLength(65);
 expect(OCCUPATION_CROSSWALK.map(r=>r.source)).toEqual(Array.from({length:393},(_,i)=>i+1));
 for(const row of OCCUPATION_CROSSWALK)if(row.roleId)expect(OCCUPATION_BY_ID.has(row.roleId)).toBe(true);
 expect(OCCUPATION_CROSSWALK.filter(r=>!r.roleId).map(r=>r.source)).toEqual([390,393]);
 expect(OCCUPATION_CROSSWALK[324].roleId).toBe(OCCUPATION_CROSSWALK[325].roleId);
 expect(OCCUPATION_BY_ID.get('job_dental_assistant')!.id).not.toBe(OCCUPATION_BY_ID.get('job_dental_hygienist')!.id);
 for(const r of OCCUPATIONS){expect(r.categories.length).toBeGreaterThan(0);expect(r.relationships.length).toBeGreaterThan(0);expect(r.requiredCapabilities.every(c=>WORLD_CAPABILITIES.includes(c))).toBe(true);}
 expect(Object.values(POPULATION_POLICY.domains).reduce((a,b)=>a+b,0)).toBe(100);
});
test('world infrastructure and explicit adult-work switch outrank source era hints and rarity',()=>{
 const historical=worldDefaults('historical'),modern=worldDefaults('modern'),fantasy=worldDefaults('fantasy');
 for(const id of ['job_electrician','job_livestreamer','job_supermarket_cashier','job_starship_life_support_technician'])expect(eligibleOccupation(OCCUPATION_BY_ID.get(id)!,historical,true,35)).toBe(false);
 expect(eligibleOccupation(OCCUPATION_BY_ID.get('job_rune_engraver')!,fantasy,true,35)).toBe(false);fantasy.capabilities.push('fantasy_magic');expect(eligibleOccupation(OCCUPATION_BY_ID.get('job_rune_engraver')!,fantasy,true,35)).toBe(true);
 expect(eligibleOccupation(OCCUPATION_BY_ID.get('job_escort')!,modern,false,35)).toBe(false);
 expect(eligibleOccupation(OCCUPATION_BY_ID.get('job_surgeon')!,modern,true,18)).toBe(false);
});
test('required OR work alternatives are solved before choosing, and impossible pools cost no provider call',async()=>{
 const d=normalizeDating({populationWorld:worldDefaults('historical'),filters:{minAge:29,maxAge:29,fields:{occupation:{mode:'required',value:'technology, tradesperson'}}}});
 const p=await selectPopulationPlan(d,resolver,scope,identity,()=>.8);expect(p.selection.requiredFields.occupation).toBe('tradesperson');expect(p.world.capabilities).not.toContain('electricity');
 d.filters.fields.occupation.value='technology';await expect(selectPopulationPlan(d,resolver,scope,identity)).rejects.toThrow('No compatible');
 d.filters.minAge=120;d.filters.maxAge=150;await expect(selectPopulationPlan(d,resolver,scope,identity)).rejects.toThrow('lifespan');
});
test('resolved plans round trip unchanged; invalid IDs and altered hard facts quarantine active work',async()=>{
 const p=await plan();expect(normalizeCandidatePlan(JSON.parse(JSON.stringify(p)))).toEqual(p);
 const job:any={version:2,planSchema:POPULATION_SCHEMA,id:'job',fingerprint:'f',slots:[{id:'slot_0',plan:p,selection:p.selection,photoCount:3,questionCount:2}]};
 expect(normalizeDiscoveryJob(job)!.slots[0].plan).toEqual(p);
 job.slots[0].plan={...p,work:{...p.work,roleId:'job_not_real'}};
 const normalized=normalizeDiscoveryJob(job)!;expect(normalized.slots[0].status).toBe('failed');expect(normalized.slots[0].quarantinedProgress?.plan).toEqual(job.slots[0].plan);expect(normalized.slots[0].plan).toBeUndefined();
 expect(normalizeCandidatePlan({...p,photoCount:8})).toBeUndefined();
});
test('explicit manual work and age take precedence without evaluating rough prose as macros',async()=>{
 expect(manualWork('A botanist who restores old radios.')).toBe('Botanist');
 const d=normalizeDating({filters:{minAge:18,maxAge:60}});const p=await selectPopulationPlan(d,resolver,scope,{...identity,brief:'Age: 35\nOccupation: Lighthouse lens restorer'},()=>.8);
 expect(p.age).toBe(35);expect(p.work.title).toBe('Lighthouse lens restorer');expect(p.work.roleId).toBeNull();expect(p.work.source).toBe('manual_brief');
 const retired=await selectPopulationPlan(d,resolver,scope,{...identity,brief:'Age: 35\nOccupation: Retired teacher'},()=>.8);expect(retired.work.situation).toBe('retired');expect(retired.work.roleId).toBeNull();expect(retired.work.publicCategories).toEqual(['retired']);
 const broad=await selectPopulationPlan(d,resolver,scope,{...identity,brief:'Age: 35\nJob: Sex worker'},()=>.8);expect(broad.work.roleId).toBe('job_sex_worker');
 const independent=await selectPopulationPlan(d,resolver,scope,{...identity,brief:'A self-employed photographer.'},()=>.8);expect(independent.work.relationship).toBe('independent_business_owner');
 const agency=await selectPopulationPlan(d,resolver,scope,{...identity,brief:'A short-term agency worker.'},()=>.8);expect(agency.work.situation).toBe('agency_temporary');expect(agency.work.term).toBe('temporary');expect(agency.work.roleId).toBeNull();
 const creator=await selectPopulationPlan(d,resolver,scope,{...identity,brief:'A small creator with another day job.'},()=>.8);expect(creator.work.situation).toBe('portfolio_work');expect(creator.work.publicCategories).toEqual(['freelancer']);expect(creator.work.roleId).toBeNull();
 const bilingual=await selectPopulationPlan(d,resolver,scope,{...identity,brief:'Age: 35\nLanguages: Turkish and German'},()=>.8);expect(bilingual.languageNote).toBe('Turkish and German');expect(v2AuthorPrompt('dossier',undefined,bilingual)).toContain('\nKnown languages:');
 expect(v2AuthorPrompt('dossier',undefined,independent)).not.toContain('\nKnown languages:');
 expect(v2AuthorPrompt('dossier',undefined,independent)).not.toContain('\nSpecies or setting-specific physiology:');
 expect(v2AuthorPrompt('dossier',undefined,{...independent,world:{...independent.world,kind:'fantasy'}})).toContain('\nSpecies or setting-specific physiology:');
 await expect(selectPopulationPlan(d,resolver,scope,{...identity,brief:'Age: 17\nJob: Carpenter'},()=>.8)).rejects.toThrow('age');
});
test('compact authoring projects without omitted old fields, a duplicated age answer or extra indexing',async()=>{
 const p=await plan(),allowed=new Set(DYNAMIC_DOSSIER_FIELDS.map(f=>f.label));
 const compact=dossier().split('\n').filter(line=>{const label=line.split(':')[0];return allowed.has(label)||['Public alias','Anonymous profile','Public categories'].includes(label)||label.startsWith('Category ')}).join('\n');
 const authored:any={version:2,dossier:parseAuthoring(compact,'dossier','stop'),photos:[],gallery:[],provenance:{}};
 const projected=projectDossier(authored,p.selection.requiredFields,'slot_0',2,undefined,p);
 expect(projected.problems).toEqual([]);expect(projected.repairLabels).toEqual([]);expect(projected.row.age).toBe(p.age);expect(projected.row.creationPlan).toEqual(p);
 const prompt=v2AuthorPrompt('dossier',undefined,p);expect(prompt).toContain('450–750');expect(prompt).toContain('Example of specificity');expect(prompt).not.toContain('Constructive strengths:');expect(prompt).not.toContain('Contradictions:');expect(prompt).not.toContain('1,600');expect(prompt).not.toContain('100 words');
 expect(compileDossierFields(p)).toBe(compileDossierFields(JSON.parse(JSON.stringify(p))));
 expect(JSON.stringify(populationBrief(p))).not.toContain('job_');
 expect(publicDatingProfile(normalizeDatingProfile({...projected.row,id:'test'})!)).not.toHaveProperty('creationPlan');expect(JSON.stringify(textingOwnBrief(projected.row))).not.toContain('selectionAudit');
});
test('archive copy-and-verify is idempotent; failures and concurrent edits cannot erase live drafts',async()=>{
 const h=lumistryHarness(),old:any={version:2,id:'previous',fingerprint:'old',slots:[{id:'slot_0',photoCount:1,questionCount:1}],metrics:[],authoringRevision:'older'};
 h.state.lumistry.owner.discoveryJob=old;
 const initial=JSON.stringify(h.state.lumistry.owner.discoveryJob),write=h.h.writeAuthoringArchive;
 h.h.writeAuthoringArchive=async()=>{throw new Error('storage failed')};
 await expect(archivePreviousAuthoring(h.h,'c','a','owner','u')).rejects.toThrow('storage failed');expect(JSON.stringify(h.state.lumistry.owner.discoveryJob)).toBe(initial);
 h.h.writeAuthoringArchive=write;await archivePreviousAuthoring(h.h,'c','a','owner','u');expect(h.state.lumistry.owner.discoveryJob).toBeUndefined();expect(h.state.lumistry.owner.authoringArchives).toHaveLength(1);
 await archivePreviousAuthoring(h.h,'c','a','owner','u');expect(h.state.lumistry.owner.authoringArchives).toHaveLength(1);
 const record=h.state.lumistry.owner.authoringArchives![0];expect((await h.h.readAuthoringArchive(record.id)).job.id).toBe('previous');
 const other=lumistryHarness(),otherWrite=other.h.writeAuthoringArchive;let edits=0;other.state.lumistry.owner.discoveryJob=structuredClone(old);
 other.h.writeAuthoringArchive=async(id:string,value:unknown)=>{other.state.lumistry.owner.discoveryJob!.updatedAt='changed'+(++edits);await otherWrite(id,value)};
 await archivePreviousAuthoring(other.h,'c','a','owner','u').catch(()=>{});expect(other.state.lumistry.owner.discoveryJob?.updatedAt).toBe('changed3');
});
test('complete compact discovery retains its plan across photo repair and excludes catalog metadata from prompts',async()=>{
 const h=lumistryHarness();let first=true;
 h.generate=async req=>{const response=h.response(req);if(req.task==='dossier'){const keep=new Set(DYNAMIC_DOSSIER_FIELDS.map(f=>f.label));response.authoredText=response.authoredText.split('\n').filter((line:string)=>{const l=line.split(':')[0];return keep.has(l)||['Public alias','Anonymous profile','Public categories'].includes(l)||l.startsWith('Category ')}).join('\n');}
 if(req.task==='photos'&&first){first=false;response.authoredText=response.authoredText.replace('Visible subjects: owner','Visible subjects: invalid-ref');}return response;};
 await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);const p=h.state.lumistry.owner.profiles.at(-1)!;expect(p.creationPlan?.schema).toBe(POPULATION_SCHEMA);expect(h.calls.filter(x=>x.req.task==='dossier')).toHaveLength(1);expect(h.calls.filter(x=>x.req.task==='index')).toHaveLength(0);
 const planCopy=structuredClone(p.creationPlan);await h.run();expect(h.state.lumistry.owner.profiles.at(-1)!.creationPlan).toEqual(planCopy);
 for(const call of h.calls){expect(call.input.messages[1].content).not.toContain('selectionAudit');if(call.req.task==='dossier')expect(call.req.fictionalPlacementKm).toBe(p.creationPlan!.distanceKm);}
});
test('generic presence timestamps do not trigger encounters; contact and encounter modules are independent',()=>{
 const h=lumistryHarness(),s=h.state,p=s.lumistry.owner.profiles[0];p.contactId='npc';p.development={version:1,origin:'profile_first',revision:0,attempts:{match:0,portrayal:0}};s.contacts=[{id:'npc',presence:{inScene:false,lastSceneAt:'yesterday'}} as any];s.lumistry.owner.decisions=[{profileId:p.id,status:'matched',action:'like',conversationId:'dating',likedAt:'now',checkedAt:'now',exchanged:true}];
 expect(developmentTrigger(s,p,'portrayal')!.kind).toBe('CONTACT_ONLY');
 const contact=developmentTrigger(s,p,'portrayal')!,fields=pendingDevelopmentModules(p,contact),accepted=parseDevelopmentModules('Who knows what: Knows only the public job category.\nCross-channel behavior: Same voice, a little less formal.',fields);expect(accepted).toHaveLength(2);
 p.development.units=Object.fromEntries(accepted.map(r=>[`${contact.kind}:${r.module.key}`,{text:r.text,trigger:contact.kind,evidence:contact.evidence,createdAt:'now',revision:1}]));expect(pendingDevelopmentModules(p,contact)).toHaveLength(0);
 s.contacts[0].presence.inScene=true;s.sceneSnapshot={actors:[{contactId:'npc',roleHint:'',sceneBrief:'At the table'}],capturedAt:'now',sourceMessageId:'committed-scene',sourceMessageIndex:4,sourceRevision:1,stale:false};
 const encounter=developmentTrigger(s,p,'portrayal')!;expect(encounter.kind).toBe('ENCOUNTER_CONFIRMED');expect(pendingDevelopmentModules(p,encounter).some(m=>m.key==='presence')).toBe(true);
});
test('presentation conflicts are resolved before authorship instead of inventing a compatible job',async()=>{
 const p=await plan(),original=structuredClone(p.work);p.life.leisure='no dedicated hobby';
 const presentation=compatiblePopulationPresentation({flavor:'mixed',tropes:DATING_TROPES.filter(t=>['ceo','augmentation','niche-hobby'].includes(t.id))},p);
 expect(presentation.tropes).toEqual([]);expect(p.work).toEqual(original);expect(p.selectionAudit.rejectedSoftChoices).toHaveLength(3);
});
function matchedHarness(){
 const h=lumistryHarness(),s=h.state,p=s.lumistry.owner.profiles[0];p.contactId='npc';p.development={version:1,origin:'profile_first',revision:0,attempts:{match:0,portrayal:0}};
 s.contacts=[{id:'npc',presence:{inScene:false,lastSceneAt:'yesterday'}} as any];s.relays=[];
 s.conversations=[{id:'dating',kind:'direct',channel:'dating',includesPocketPersona:true,participantActorIds:['owner','npc'],participantContactIds:['npc'],messages:[]} as any];
 s.lumistry.owner.decisions=[{profileId:p.id,status:'matched',action:'like',conversationId:'dating',likedAt:'now',checkedAt:'now',exchanged:true}];
 return {h,p};
}
test('native development worker accepts contact modules then adds encounter modules without rewriting identity',async()=>{
 const {h,p}=matchedHarness();const original={age:p.age,fields:structuredClone(p.fields),privateFields:structuredClone(p.privateFields)};
 h.generate=async req=>({authoredText:req.requestedModules.map((label:string)=>`${label}: Compatible private detail for ${req.trigger}.`).join('\n'),finishReason:'stop'});
 await h.app.maintain({chatId:'c',characterId:'a'},'u','dating');
 expect(h.calls.map(c=>c.req.trigger)).toEqual(['MUTUAL_MATCH','CONTACT_ONLY']);
 const native=h.state.lumistry.owner.profiles[0];expect(Object.keys(native.development!.units!)).toHaveLength(5);
 h.state.contacts[0].presence.inScene=true;h.state.sceneSnapshot={actors:[{contactId:'npc',roleHint:'',sceneBrief:'At the table'}],capturedAt:'now',sourceMessageId:'scene',sourceMessageIndex:4,sourceRevision:1,stale:false};
 await h.app.maintain({chatId:'c',characterId:'a'},'u','dating');expect(h.calls.at(-1).req.trigger).toBe('ENCOUNTER_CONFIRMED');
 const finished=h.state.lumistry.owner.profiles[0];expect(Object.keys(finished.development!.units!)).toHaveLength(8);expect({age:finished.age,fields:finished.fields,privateFields:finished.privateFields}).toEqual(original);
 const calls=h.calls.length;await h.app.maintain({chatId:'c',characterId:'a'},'u','dating');expect(h.calls).toHaveLength(calls);
});
test('partial development checkpoints survive sibling omission and stale scene results cannot commit',async()=>{
 const {h}=matchedHarness();let first=true;
 h.generate=async req=>{const labels=first?(first=false,req.requestedModules.slice(0,1)):req.requestedModules;return {authoredText:labels.map((label:string)=>`${label}: An individual compatible detail.`).join('\n'),finishReason:'stop'};};
 await h.app.maintain({chatId:'c',characterId:'a'},'u');const saved=h.state.lumistry.owner.profiles[0].development!.units!['MUTUAL_MATCH:daily'];expect(saved).toBeDefined();
 await h.app.maintain({chatId:'c',characterId:'a'},'u');expect(h.calls.at(-1).req.requestedModules).not.toContain('Unseen daily life');expect(h.state.lumistry.owner.profiles[0].development!.units!['MUTUAL_MATCH:daily']).toEqual(saved);
 h.state.contacts[0].presence.inScene=true;h.state.sceneSnapshot={actors:[{contactId:'npc',roleHint:'',sceneBrief:'At the table'}],capturedAt:'now',sourceMessageId:'scene',sourceMessageIndex:4,sourceRevision:1,stale:false};
 h.generate=async req=>{h.state.sceneSnapshot!.sourceRevision++;return {authoredText:req.requestedModules.map((label:string)=>`${label}: A now-stale situation.`).join('\n'),finishReason:'stop'};};
 await h.app.maintain({chatId:'c',characterId:'a'},'u');expect(Object.keys(h.state.lumistry.owner.profiles[0].development!.units!).some(k=>k.startsWith('ENCOUNTER_CONFIRMED:'))).toBe(false);
});
