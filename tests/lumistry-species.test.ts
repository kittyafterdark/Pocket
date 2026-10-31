import {test,expect} from 'bun:test';
import {SPECIES_ROWS} from '../src/domain/lumistry-species-data.js';
import {SPECIES_CATALOG,SPECIES_BY_ID,presetWorld,normalizeWorldGuide,assertWorldGuide,speciesCompatible} from '../src/domain/lumistry-world-catalog.js';
import {selectSpecies,speciesShortlist,SPECIES_POLICY} from '../src/domain/lumistry-species.js';
import {selectPopulationPlan,normalizeCandidatePlan,populationBrief} from '../src/domain/lumistry-population.js';
import {parseCustomSpecies,acceptCustomSpecies} from '../src/domain/lumistry-species-discovery.js';
import {normalizeDating,normalizeDatingProfile} from '../src/domain/lumistry.js';
import {worldSource,reviewWorldResult} from '../src/domain/lumistry-world-reading.js';
import {parseAuthoring,projectDossier,repairIdentityUnits} from '../src/domain/lumistry-v2.js';
import {v2AuthorPrompt,v2RepairPrompt} from '../src/backend/lumistry-v2-prompts.js';
import {compileDatingVisual,datingVisualIdentitySnapshot} from '../src/domain/lumistry-visual.js';
import {creationTaskContext} from '../src/backend/lumistry-creation-context.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {dossier} from './fixtures/lumistry-v2.js';
import {JSDOM} from 'jsdom';
import {worldGuideEditor} from '../src/frontend/apps/lumistry-world.js';
const scope={chatId:'test',characterId:'test',userId:'u',commit:false} as const;
const resolve=async(t:string)=>({text:t.replace(/\{\{pick::([^}]+)\}\}/g,(_,v)=>v.split('::')[0]),diagnostics:[]});
const identity={id:'creative_1',owner:'owner',createdAt:'2026-10-16',questions:1,photos:1,distanceKm:2};
function state(mode='creative_discovery_opt_in') {const p=presetWorld('medieval_fantasy')!;p.guide.discovery={mode:mode as any,creativePercent:100,constraints:'No new powers, institutions or compulsory human anatomy.'};return normalizeDating({worldContext:'Reviewed fantasy town with independently sentient botanical people.',populationWorld:p.world,worldGuide:p.guide,filters:{minAge:29,maxAge:29}});}
const proposal={name:'Astralborn',bodyPlan:'Coherent upright adult botanical body',limbs:'Two arms and two root-like legs',surface:'Dark blue bark with pale speckles',face:'Smooth wooden face with two pale eyes',currentForm:'Stable botanical form',compatibility:'An ordinary sentient resident; no new powers or institutions.',adultSentient:true,minAdultAge:18,requires:[]};
const rawDossier=()=>dossier('New Aster','Species or setting-specific physiology: Astralborn; botanical adult body.\nCustom species proposal: '+JSON.stringify(proposal)).replace('Skin / fur / scales / surface: olive skin with a few freckles','Skin / fur / scales / surface: Dark blue bark with pale speckles').replace('Height and build: 168 cm; compact shoulders','Height and build: 168 cm; Two arms and two root-like legs').replace('Facial features: angular jaw and prominent brows','Facial features: Smooth wooden face with two pale eyes');
test('290-source import preserves original names/descriptions and canonical sci-fi family, without preset activation',()=>{
 expect(SPECIES_ROWS).toHaveLength(290);expect(SPECIES_CATALOG).toHaveLength(290);expect(new Set(SPECIES_CATALOG.map(s=>s.id)).size).toBe(290);
 for(const source of SPECIES_ROWS){const s=SPECIES_BY_ID.get(source.id)!;expect(s.label).toBe(source.name);expect(s.appearance).toBe(source.description);expect(s.family).not.toBe('science fiction');expect(source.enabled_by_default).toBe(false);expect(s.group).toBeTruthy();}
 expect(SPECIES_ROWS.filter(s=>s.origin!=='new')).toHaveLength(61);expect(presetWorld('modern_multispecies')!.guide.species.length).toBeLessThan(10);
});
test('reviewed technology rules cover new bodies independently of era and template count',()=>{
 const modern=presetWorld('modern_multispecies')!.world,space=presetWorld('spacefaring')!.world,fantasy=presetWorld('medieval_fantasy')!.world;
 for(const id of ['modular_robot_person','soft_robot_person','nanite_person']){expect(speciesCompatible(SPECIES_BY_ID.get(id)!,modern)).toBe(false);expect(speciesCompatible(SPECIES_BY_ID.get(id)!,space)).toBe(true);}
 expect(speciesCompatible(SPECIES_BY_ID.get('virtual_avatar_person')!,modern)).toBe(true);expect(speciesCompatible(SPECIES_BY_ID.get('virtual_avatar_person')!,fantasy)).toBe(false);
 expect(speciesCompatible(SPECIES_BY_ID.get('energy_person')!,fantasy)).toBe(true);expect(speciesCompatible(SPECIES_BY_ID.get('elf')!,modern)).toBe(true);expect(speciesCompatible(SPECIES_BY_ID.get('clockwork_person')!,modern)).toBe(true);
});
test('family probability is independent of number of eligible rows, and native picks validate membership',async()=>{
 const human=SPECIES_BY_ID.get('human')!,cats=SPECIES_CATALOG.filter(s=>s.family==='anthropomorphic'),pool=[human,...cats];
 // human gets 30/(30+15), irrespective of 121 anthropomorphic templates.
 expect((await selectSpecies(pool,[],resolve,scope,()=>.6)).id).toBe('human');expect((await selectSpecies(pool,[],resolve,scope,()=>.8)).family).toBe('anthropomorphic');
 await expect(selectSpecies([human],[],async()=>({text:'elf',diagnostics:[]}),scope,()=>.4)).rejects.toThrow('ineligible');expect((await selectSpecies([human],Array(12).fill(human),resolve,scope,()=>.9)).id).toBe('human');
 expect(SPECIES_POLICY.cooldown.window).toBe(12);
});
test('bounded read-world shortlist finds unusual source species without sending all 290 entries',()=>{
 const shortlist=speciesShortlist('There are axolotlfolk and living ink people in this town.');expect(shortlist.length).toBeLessThanOrEqual(24);expect(shortlist.some(s=>s.id==='axolotlfolk')).toBe(true);expect(shortlist.some(s=>s.id==='living_ink_person')).toBe(true);expect(JSON.stringify(shortlist)).not.toContain('description');
});
test('strict review does not preselect a new population; settings and old saved records retain their shape',async()=>{
 const d=state('strict_reviewed');d.worldGuide!.species=[SPECIES_BY_ID.get('human')!];const sources={sources:[worldSource('lore','Lore','Adult sentient elves live here.',100)!],warnings:[]};
 const review=reviewWorldResult({proposals:[{kind:'species',key:'elf',certainty:'supported',evidence:[{sourceId:'lore',quote:'Adult sentient elves live here.'}]}]},sources,d);expect(review.proposals[0].selected).toBe(false);
 const p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);expect(p.creativeSpecies).toBeUndefined();expect(normalizeCandidatePlan(p)).toBeDefined();
 const legacy=structuredClone(p);delete legacy.speciesPolicyVersion;delete legacy.speciesCatalogVersion;delete legacy.worldGuide!.discovery;for(const s of legacy.worldGuide!.species){delete s.group;delete s.classification;}delete legacy.species!.group;delete legacy.species!.classification;expect(normalizeCandidatePlan(legacy)).toEqual(legacy);
 expect(()=>assertWorldGuide({...d.worldGuide,species:SPECIES_CATALOG.slice(0,81)})).toThrow();expect(normalizeWorldGuide({...d.worldGuide,discovery:{mode:'creative_discovery_opt_in',creativePercent:101,constraints:''}})).toBeUndefined();
});
test('creative reservation is saved before authoring and forbidden for strict species filters and manual briefs',async()=>{
 const d=state(),p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);expect(p.creativeSpecies?.status).toBe('reserved');expect(p.species).toBeUndefined();expect(p.appearance).toBeUndefined();expect(normalizeCandidatePlan(JSON.parse(JSON.stringify(p)))).toEqual(p);expect(populationBrief(p).creativeSpecies).toBeDefined();
 d.filters.fields.species={mode:'required',value:'elf'};expect((await selectPopulationPlan(d,resolve,scope,identity,()=>.4)).creativeSpecies).toBeUndefined();delete d.filters.fields.species;d.filters.excludedValues={species:['orc']};expect((await selectPopulationPlan(d,resolve,scope,identity,()=>.4)).creativeSpecies).toBeUndefined();delete d.filters.excludedValues;
 expect((await selectPopulationPlan(d,resolve,scope,{...identity,brief:'An adult carpenter.'},()=>.4)).creativeSpecies).toBeUndefined();
});
test('creative proposal parsing, missing checks, scoped repairs and approval share the same field contract',async()=>{
 const p=await selectPopulationPlan(state(),resolve,scope,identity,()=>.4),artifact=parseAuthoring(rawDossier(),'dossier','stop'),a:any={version:2,dossier:artifact,photos:[],gallery:[],provenance:{}};
 const first=projectDossier(a,p.selection.requiredFields,'slot',2,undefined,p);expect(first.row.speciesProposal).toEqual(proposal);expect(first.issues.some(i=>i.code==='species-review'&&i.repair==='blocked')).toBe(true);
 const prompt=v2AuthorPrompt('dossier',undefined,p);expect(prompt).toContain('Custom species proposal');expect(prompt).not.toContain('Return no JSON,');expect(prompt).not.toContain('290');
 const repair=v2RepairPrompt('dossier',['Custom species proposal'],p);expect(repair).toContain('minAdultAge');expect(repair).not.toContain('Return no JSON,');
 expect(parseCustomSpecies({...proposal,minAdultAge:30},p)).toBeUndefined();expect(parseCustomSpecies({...proposal,name:'elf'},p)).toBeUndefined();expect(parseCustomSpecies({...proposal,requires:['starships']},p)).toBeUndefined();expect(parseCustomSpecies({...proposal,adultSentient:false},p)).toBeUndefined();
 const missing=structuredClone(a);missing.dossier=parseAuthoring(rawDossier().split('\n').filter(line=>!line.startsWith('Custom species proposal:')).join('\n'),'dossier','stop');const checked=projectDossier(missing,{},'slot',2,undefined,p);expect(checked.issues.some(i=>i.code==='species-proposal'&&i.repair==='author')).toBe(true);
 const patch=parseAuthoring('Custom species proposal: '+JSON.stringify(proposal),'dossier','stop');expect(repairIdentityUnits(missing,patch,['Custom species proposal'],'dossier').artifact.fields['Custom species proposal']).toBe(JSON.stringify(proposal));
 const accepted=acceptCustomSpecies(p,proposal,'2026-10-16');expect(normalizeCandidatePlan(accepted)).toBeDefined();expect(accepted.worldGuide!.species.some(s=>s.id===accepted.species!.id)).toBe(false);expect(()=>acceptCustomSpecies(accepted,proposal,'again')).toThrow();
 const projected=projectDossier(a,accepted.selection.requiredFields,'slot',2,undefined,accepted);expect(projected.issues.some(i=>i.code==='species-review'||i.code==='species-proposal')).toBe(false);
 const profile=normalizeDatingProfile(projected.row)!;expect(profile.person!.anatomy!.limbs).toBe(proposal.limbs);expect(normalizeDatingProfile(JSON.parse(JSON.stringify(profile)))!.person!.anatomy).toEqual(profile.person!.anatomy);
 const photoContext=creationTaskContext({task:'photos',acceptedAnatomy:profile.person!.anatomy});expect(photoContext.acceptedAnatomy).toEqual(profile.person!.anatomy);const image=compileDatingVisual(profile,undefined,'In the market',['self']);expect(image).toContain(proposal.limbs);expect(image).toContain(proposal.surface);expect(image).toContain('Person A —');expect(image).not.toMatch(/Person A:|region/);
 expect(datingVisualIdentitySnapshot({...profile,person:{...profile.person!,anatomy:{...profile.person!.anatomy!,limbs:'changed'}}})).not.toBe(datingVisualIdentitySnapshot(profile));
});
test('discovery parks one creative response, reload does not repeat it, approval is scoped and publication resumes',async()=>{
 const h=lumistryHarness(24);Object.assign(h.state.lumistry!.owner,{worldContext:state().worldContext,populationWorld:state().populationWorld,worldGuide:state().worldGuide});
 h.generate=async req=>req.task==='dossier'?{authoredText:rawDossier(),finishReason:'stop'}:h.response(req);
 await h.run();expect(h.calls).toHaveLength(1);let job=h.state.lumistry!.owner.discoveryJob!,slot=job.slots[0];expect(slot.progress!.draft.speciesProposal).toEqual(proposal);expect(job.metrics[0].invalid).toBe(0);expect(job.metrics[0].checkpoint).toBe(true);expect(h.state.lumistry!.owner.profiles).toHaveLength(24);await h.run();expect(h.calls).toHaveLength(1);
 await expect(h.app.handle({action:'retry_slot',slotId:slot.id},{chatId:'c',characterId:'a'},'u')).rejects.toThrow('Accept or reject');
 const payload={action:'species_accept',slotId:slot.id,jobId:job.id,planRevision:slot.plan!.revision,proposalSnapshot:JSON.stringify(proposal)};
 await expect(h.app.handle({...payload,planRevision:999},{chatId:'c',characterId:'a'},'u')).rejects.toThrow('changed');await h.app.handle(payload,{chatId:'c',characterId:'a'},'u');expect(h.calls).toHaveLength(1);expect(h.state.lumistry!.owner.worldGuide!.species.some(s=>s.label===proposal.name)).toBe(false);
 await h.run();expect(h.state.lumistry!.owner.profiles).toHaveLength(25);expect(h.calls.filter(c=>c.req.task==='dossier')).toHaveLength(1);const npc=h.state.lumistry!.owner.profiles.at(-1)!;expect(npc.creationPlan!.creativeSpecies!.status).toBe('accepted');expect(npc.person!.anatomy!.limbs).toBe(proposal.limbs);expect(h.state.contacts).toHaveLength(0);await expect(h.app.handle(payload,{chatId:'c',characterId:'a'},'u')).rejects.toThrow('changed');
});
test('rejection makes no call; explicit Find more can plan a new identity while preserving the rejected candidate',async()=>{
 const h=lumistryHarness(24);Object.assign(h.state.lumistry!.owner,{worldContext:state().worldContext,populationWorld:state().populationWorld,worldGuide:state().worldGuide});h.generate=async()=>({authoredText:rawDossier(),finishReason:'stop'});await h.run();const job=h.state.lumistry!.owner.discoveryJob!,slot=job.slots[0];await h.app.handle({action:'species_reject',jobId:job.id,slotId:slot.id,planRevision:slot.plan!.revision,proposalSnapshot:JSON.stringify(proposal)},{chatId:'c',characterId:'a'},'u');expect(normalizeCandidatePlan(h.state.lumistry!.owner.discoveryJob!.slots[0].plan)).toBeDefined();const rejected=structuredClone(h.state.lumistry!.owner.discoveryJob!.slots[0].plan);expect(h.calls).toHaveLength(1);h.generate=async()=>({authoredText:rawDossier().replaceAll('New Aster','Another Aster'),finishReason:'stop'});await h.run();expect(h.calls).toHaveLength(2);expect(h.state.lumistry!.owner.discoveryJob!.slots[0].plan).toEqual(rejected);expect(h.state.lumistry!.owner.discoveryJob!.slots[1].plan!.id).not.toBe(rejected!.id);expect(h.state.lumistry!.owner.profiles).toHaveLength(24);
});
test('species editor searches and filters locally, saves draft selection and does not invoke generation',()=>{
 const dom=new JSDOM('<!doctype html><body></body>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try{const d=state(),h:any={state:{pocketPersonaActorId:'owner',lumistry:{owner:d}},ui:{},render:()=>{},action:()=>{throw new Error('Unexpected action');}},node=worldGuideEditor(h,d.populationWorld!);const search=node.querySelector('[aria-label="Search species templates"]') as HTMLInputElement;search.value='axolotl';search.dispatchEvent(new dom.window.Event('input'));expect(node.textContent).toContain('2 matching templates');const label=[...node.querySelectorAll('label')].find(n=>n.textContent==='Axolotlfolk')!;expect(label).toBeTruthy();const box=label.querySelector('input')!;box.checked=true;box.dispatchEvent(new dom.window.Event('change'));expect(h.ui.worldGuideDraft.species.some((s:any)=>s.id==='axolotlfolk')).toBe(true);expect(d.worldGuide!.species.some(s=>s.id==='axolotlfolk')).toBe(false);expect(search.value).toBe('axolotl');}finally{globalThis.document=previous;dom.window.close();}
});

test('strict empty palettes fail locally; custom aliases reuse existing IDs in world review',async()=>{
 const d=state('strict_reviewed');d.worldGuide!.species=[];let calls=0;await expect(selectPopulationPlan(d,async(t)=>{calls++;return resolve(t);},scope,identity,()=>.4)).rejects.toThrow('Strict species');expect(calls).toBe(0);await expect(selectPopulationPlan(d,resolve,scope,{...identity,brief:'An adult carpenter.'},()=>.4)).rejects.toThrow('Strict species');expect((await selectPopulationPlan(d,resolve,scope,{...identity,brief:'Species: Human\nAn adult carpenter.'},()=>.4)).selectionAudit.manualSpecies).toBe(true);
 const sources={sources:[worldSource('s','Lore','Adult elves live here.',100)!],warnings:[]};const review=reviewWorldResult({proposals:[{kind:'species',key:'custom_elf',label:'Elf',value:'Adult pointed-eared people.',certainty:'supported',evidence:[{sourceId:'s',quote:'Adult elves live here.'}]}]},sources,d);expect(review.proposals[0].key).toBe('elf');expect(review.proposals[0].selected).toBe(false);
});
test('centaur geometry reaches ordinary and anonymous photos without leaking identifying anatomy',async()=>{
 const d=state('strict_reviewed');d.worldGuide!.species=[SPECIES_BY_ID.get('centaur')!];const p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);const a:any={version:2,dossier:parseAuthoring(dossier('Aster','Species or setting-specific physiology: Centaur; adult.').replace('Height and build: 168 cm; compact shoulders','Height and build: 210 cm; equine frame'),'dossier','stop'),photos:[],gallery:[],provenance:{}};const row=projectDossier(a,p.selection.requiredFields,'s',2,undefined,p).row;expect(compileDatingVisual(row,undefined,'Walking',['self'])).toContain('four equine legs');row.anonymous=true;row.person.anatomy.face='PRIVATE FACE';const scene=compileDatingVisual(row,undefined,'Walking, face out of frame',['self']);expect(scene).toContain('four equine legs');expect(scene).not.toContain('PRIVATE FACE');
});

test('approved creative capability requirements survive separate world adoption and remain eligible only with support',async()=>{
 const d=state(),p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4),accepted=acceptCustomSpecies(p,{...proposal,requires:['fantasy_magic']},'2026-10-16');expect(normalizeCandidatePlan(accepted)).toBeDefined();const guide=assertWorldGuide({...d.worldGuide,species:[accepted.species!]});expect(guide.species[0].requiredCapabilities).toEqual(['fantasy_magic']);expect(speciesCompatible(guide.species[0],presetWorld('modern_multispecies')!.world)).toBe(false);expect(speciesCompatible(guide.species[0],d.populationWorld!)).toBe(true);
 expect(()=>assertWorldGuide({...guide,species:[{...guide.species[0],requiredCapabilities:['fake_capability']}]})).toThrow();
});

test('candidate-local custom disclosure projects without globally enabling the species; defaults remain private',async()=>{
 const p=await selectPopulationPlan(state(),resolve,scope,identity,()=>.4),accepted=acceptCustomSpecies(p,proposal,'2026-10-16');const a:any={version:2,dossier:parseAuthoring(rawDossier(),'dossier','stop'),photos:[],gallery:[],provenance:{}};const hidden=projectDossier(a,{},'s',2,undefined,accepted);expect(hidden.row.fields.species).toBe(proposal.name);expect(hidden.row.hiddenFields).toContain('species');
 a.dossier=parseAuthoring(rawDossier().replace('Public categories: gender, occupation, height, interests, intentions','Public categories: gender, occupation, height, interests, intentions, species')+'\nCategory species: '+proposal.name,'dossier','stop');const shown=projectDossier(a,{},'s',2,undefined,accepted);expect(shown.row.hiddenFields).not.toContain('species');expect(shown.issues.some(i=>i.code==='category-conflict'||i.code==='disclosure')).toBe(false);expect(accepted.worldGuide!.species.some(s=>s.label===proposal.name)).toBe(false);
});

test('anatomy normalization whitelists geometry fields and anonymous limb counts exclude identifying prose',async()=>{
 const p=await selectPopulationPlan(state(),resolve,scope,identity,()=>.4),accepted=acceptCustomSpecies(p,proposal,'2026-10-16'),a:any={version:2,dossier:parseAuthoring(rawDossier(),'dossier','stop'),photos:[],gallery:[],provenance:{}};const raw=projectDossier(a,{},'s',2,undefined,accepted).row;raw.person.anatomy.privateName='SECRET IDENTITY';const normalized=normalizeDatingProfile(raw)!;expect((normalized.person!.anatomy as any).privateName).toBeUndefined();normalized.anonymous=true;normalized.person!.anatomy!.limbs='Six mechanical legs; tattoo SECRET MARK';const scene=compileDatingVisual(normalized,undefined,'Face out of frame',['self']);expect(scene).toContain('Six mechanical legs');expect(scene).not.toContain('SECRET');
});

test('explicit approval completes a closed final proposal in truncated transport without paying for the same dossier again',async()=>{
 const h=lumistryHarness(24);Object.assign(h.state.lumistry!.owner,{worldContext:state().worldContext,populationWorld:state().populationWorld,worldGuide:state().worldGuide});h.generate=async req=>req.task==='dossier'?{authoredText:rawDossier(),finishReason:'length'}:h.response(req);await h.run();expect(h.calls).toHaveLength(1);const job=h.state.lumistry!.owner.discoveryJob!,slot=job.slots[0],source=slot.progress!.authored.dossier!.text;await h.app.handle({action:'species_accept',jobId:job.id,slotId:slot.id,planRevision:slot.plan!.revision,proposalSnapshot:JSON.stringify(proposal)},{chatId:'c',characterId:'a'},'u');expect(h.state.lumistry!.owner.discoveryJob!.slots[0].progress!.authored.dossier!.text).toBe(source);await h.run();expect(h.state.lumistry!.owner.profiles).toHaveLength(25);expect(h.calls.filter(c=>c.req.task==='dossier')).toHaveLength(1);
});

test('required species OR alternatives use family weights; explicit manual identity is never rerolled',async()=>{
 const d=state('strict_reviewed');d.worldGuide!.species=[SPECIES_BY_ID.get('human')!,...SPECIES_CATALOG.filter(s=>s.family==='fantasy').slice(0,8)];d.filters.fields.species={mode:'required',value:d.worldGuide!.species.map(s=>s.label).join(', ')};const p=await selectPopulationPlan(d,resolve,scope,identity,()=>.6);expect(p.species!.family).toBe('fantasy');expect(p.selection.requiredFields.species).toBe(p.species!.label);
 const manual=await selectPopulationPlan(d,resolve,scope,{...identity,brief:'Species: Human\nAn adult carpenter.'},()=>.6);expect(manual.species!.id).toBe('human');d.filters.fields.species.value='Elf';await expect(selectPopulationPlan(d,resolve,scope,{...identity,brief:'Species: Human\nAn adult carpenter.'},()=>.6)).rejects.toThrow('supplied species');
});
