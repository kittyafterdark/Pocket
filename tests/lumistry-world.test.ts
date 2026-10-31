import {test,expect} from 'bun:test';
import {SPECIES_CATALOG,SPECIES_BY_ID,WORLD_PRESETS,presetWorld,normalizeWorldGuide,assertWorldGuide,worldVisualGuide,eligibleGenreOptions,worldGenreValues,knownSpeciesIn,speciesCompatible} from '../src/domain/lumistry-world-catalog.js';
import {WORLD_READING_LIMITS,normalizeWorldReview,worldSource,reviewWorldResult,applyWorldReview,worldBaseline,validateWorldCategories} from '../src/domain/lumistry-world-reading.js';
import {collectWorldEvidence} from '../src/backend/lumistry-world-evidence.js';
import {normalizeDating,normalizeDatingProfile} from '../src/domain/lumistry.js';
import {selectPopulationPlan,normalizeCandidatePlan,populationBrief} from '../src/domain/lumistry-population.js';
import {parseAuthoring,projectDossier} from '../src/domain/lumistry-v2.js';
import {compileDossierFields} from '../src/domain/lumistry-dynamic-fields.js';
import {compileDatingVisual,datingVisualIdentitySnapshot} from '../src/domain/lumistry-visual.js';
import {creationTaskContext} from '../src/backend/lumistry-creation-context.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {dossier} from './fixtures/lumistry-v2.js';
const resolve=async(t:string)=>({text:t.replace(/\{\{pick::([^}]+)\}\}/g,(_,v)=>v.split('::')[0]),diagnostics:[]});
const scope={chatId:'test',characterId:'test',userId:'u',commit:false} as const;
const identity={id:'world_plan',owner:'owner',createdAt:'2026-10-16',questions:1,photos:1,distanceKm:2};
function setting(id='medieval_fantasy',species='elf'){
 const preset=presetWorld(id)!;preset.guide.species=[structuredClone(SPECIES_BY_ID.get(species)!)];return normalizeDating({worldContext:preset.world.kind+' reviewed setting',worldReviewedAt:'2026-10-16',populationWorld:preset.world,worldGuide:preset.guide,filters:{minAge:29,maxAge:29}});
}
const bundle={sources:[worldSource('lore_elves','Species lore','Adult elves inhabit contemporary cities. Electricity is ordinary; magic is absent.',1000)!],warnings:[]};
const proposal=(extra:any={})=>({kind:'species',key:'elf',certainty:'supported',evidence:[{sourceId:'lore_elves',quote:'Adult elves inhabit contemporary cities.'}],...extra});
test('species and setting catalogs retain independent editable definitions and opt-in genre vocabulary',()=>{
 expect(SPECIES_CATALOG).toHaveLength(290);expect(new Set(SPECIES_CATALOG.map(s=>s.id)).size).toBe(290);expect(WORLD_PRESETS).toHaveLength(6);
 for(const preset of WORLD_PRESETS){const p=presetWorld(preset.id)!;expect(assertWorldGuide(p.guide)).toEqual(normalizeWorldGuide(p.guide));expect(p.guide.species.every(s=>speciesCompatible(s,p.world))).toBe(true);}
 const modern=presetWorld('modern_multispecies')!;expect(modern.world.kind).toBe('modern');expect(modern.world.capabilities).not.toContain('fantasy_magic');expect(modern.guide.species.some(s=>s.id==='elf')).toBe(true);expect(worldGenreValues(modern.guide,modern.world)).toEqual([]);
 modern.guide.intimacyIds=['fantasy_restraints','scifi_haptics','anatomy_horns'];expect(worldGenreValues(modern.guide,modern.world)).toContain('consensual haptic sensory play');expect(worldGenreValues(modern.guide,modern.world)).not.toContain('negotiated magical restraints');expect(eligibleGenreOptions(modern.world).some(o=>o.id==='anatomy_horns')).toBe(true);
});
test('world suggestions require exact source support and never silently override reviewed capabilities',()=>{
 const d=setting('modern_multispecies','human');d.populationWorld!.capabilities.push('fantasy_magic');d.populationWorld!.reviewed=true;
 const r=reviewWorldResult({proposals:[proposal(),proposal({kind:'capability',key:'fantasy_magic',value:'absent',evidence:[{sourceId:'lore_elves',quote:'magic is absent'}]}),proposal({kind:'context',value:'An unsupported kingdom.',evidence:[{sourceId:'wrong',quote:'kingdom'}]})]},bundle,d);
 expect(r.proposals[0].selected).toBe(true);expect(r.proposals[1].selected).toBe(false);expect(r.proposals[2].supported).toBe(false);expect(r.proposals[2].selected).toBe(false);
 const merged=applyWorldReview(d,r);expect(merged.populationWorld!.capabilities).toContain('fantasy_magic');expect(merged.worldGuide!.species.map(s=>s.id)).toEqual(['human','elf']);expect(merged.worldContext).not.toContain('kingdom');
 r.proposals[1].selected=true;expect(applyWorldReview(d,r).populationWorld!.capabilities).not.toContain('fantasy_magic');expect(()=>applyWorldReview({...d,worldContext:'Changed'},r)).toThrow('changed');
});
test('category omissions preserve accepted fields; invalid and duplicate keys fail visibly',()=>{
 const d=setting();d.worldFields=[{key:'guild',label:'Guild',options:['smiths']}];const r=reviewWorldResult({proposals:[proposal()]},bundle,d);expect(applyWorldReview(d,r).worldFields).toEqual(d.worldFields);
 expect(()=>validateWorldCategories([{key:'guild',label:'Guild',options:['one']},{key:'guild',label:'Duplicate',options:['two']}])).toThrow();expect(()=>validateWorldCategories([{key:'guild',label:'Guild',options:[]}])).toThrow();
 const guide=setting().worldGuide!;expect(()=>assertWorldGuide({...guide,attire:'a'.repeat(801)})).toThrow();expect(()=>assertWorldGuide({...guide,species:[...guide.species,...guide.species]})).toThrow();
});
test('native reading includes scoped activated and relevant attached lore, reports truncation and never reads unrelated books',async()=>{
 const calls:any[]=[],state:any={characterId:'card',chatId:'chat'};
 const api={characters:{get:async(...args:any[])=>{calls.push(['card',...args]);return {description:'d'.repeat(31000),scenario:'An elf city.',world_book_ids:['attached']};}},world_books:{getActivated:async(...args:any[])=>{calls.push(['active',...args]);return [{id:'elf-lore'}];},entries:{get:async(...args:any[])=>{calls.push(['entry',...args]);return {content:'Adult elves live here.',comment:'Species',disabled:false};},list:async(...args:any[])=>{calls.push(['book',...args]);return {data:[{id:'elf-lore',key:['species'],comment:'Species'},{id:'unrelated',key:['apple'],comment:'A personal secret'}],total:2};}}},chat:{getMessages:async()=>[{id:'m',role:'assistant',content:'m'.repeat(600)}]}};
 const result=await collectWorldEvidence(state,api,()=>true,'operator');expect(result.sources.some(s=>s.id==='lore_elf-lore')).toBe(true);expect(result.sources.find(s=>s.id==='card_description')!.truncated).toBe(true);expect(result.sources.find(s=>s.id==='message_m')!.text.length).toBe(500);expect(calls.filter(c=>c[0]==='entry')).toHaveLength(1);expect(JSON.stringify(calls)).not.toContain('unrelated');expect(calls.find(c=>c[0]==='book')[2].userId).toBe('operator');
 const denied=await collectWorldEvidence(state,api,p=>p!=='world_books','operator');expect(denied.sources.some(s=>s.id.startsWith('lore_'))).toBe(false);expect(denied.warnings.some(w=>w.includes('World-book'))).toBe(true);
});
test('unchanged world evidence reuses cached suggestions without another model call and stale acceptance is rejected',async()=>{
 const h=lumistryHarness(1);h.h.worldEvidence=async()=>structuredClone(bundle);h.generate=async()=>({proposals:[proposal()]});
 const act=(action:string,input:any={})=>h.app.handle({action,requestId:action,...input},{chatId:'c',characterId:'a'},'u');
 await act('world');const review=h.sent.find(s=>s.phase==='world').review;expect(h.calls).toHaveLength(1);await act('world');expect(h.calls).toHaveLength(1);
 const d=h.state.lumistry!.owner,next=applyWorldReview(d,review);await act('world_accept',{...next,baseline:review.baseline});expect(h.state.lumistry!.owner.worldGuide!.species[0].id).toBe('elf');await act('world');expect(h.calls).toHaveLength(1);
 await expect(act('world_accept',{...next,baseline:review.baseline})).rejects.toThrow('changed');await act('world',{forceRefresh:true});expect(h.calls).toHaveLength(2);expect(h.state.lumistry!.owner.profiles).toHaveLength(1);
});
test('accepting a summary preserves manual capability choices and initial setting metadata without generation',async()=>{
 const h=lumistryHarness(1),d=h.state.lumistry!.owner;d.populationWorld=presetWorld('spacefaring')!.world;h.state.lumistry!.owner=normalizeDating(d);const before=structuredClone(h.state.lumistry!.owner.populationWorld);
 await h.app.handle({action:'world_accept',worldContext:'An orbital habitat.',worldFields:[]},{chatId:'c',characterId:'a'},'u');expect(h.state.lumistry!.owner.populationWorld).toEqual(before);expect(h.calls).toHaveLength(0);
});
test('medieval elf plan synchronizes prose labels, projection, reload, photo inputs and final nonregional scene',async()=>{
 const d=setting(),p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);expect(p.species!.id).toBe('elf');expect(p.appearance).toBeUndefined();expect(normalizeCandidatePlan(JSON.parse(JSON.stringify(p)))!.species).toEqual(p.species);expect(populationBrief(p).worldPresentation).toContain('Medieval');expect(compileDossierFields(p)).toContain('saved adult sentient species: Elf');
 const authored=parseAuthoring(dossier('Aster','Species or setting-specific physiology: Elf; adult pointed ears.').replace('Category occupation: tradesperson','Category occupation: '+p.work.publicCategories[0]),'dossier','stop');const a:any={version:2,dossier:authored,photos:[],gallery:[],provenance:{}};
 const projected=projectDossier(a,p.selection.requiredFields,'slot',2,undefined,p);expect(projected.row.person.appearance.tags).toContain('Elf');expect(projected.row.visualSetting).toContain('Medieval');
 const row=normalizeDatingProfile(projected.row)!;const scene=compileDatingVisual(row,undefined,'An adult in a market lane.',['self']);expect(scene).toContain('Elf');expect(scene).toContain('Medieval');expect(scene).toContain('Person A —');expect(scene).not.toMatch(/Person A:|REGION|regional/);
 const photoInput=creationTaskContext({task:'photos',worldPresentation:row.visualSetting,acceptedAppearance:row.person!.appearance});expect(photoInput.worldPresentation).toBe(row.visualSetting);
 expect(datingVisualIdentitySnapshot({...row,visualSetting:'Changed'})).not.toBe(datingVisualIdentitySnapshot(row));
});
test('modern nonhuman populations preserve contemporary presentation and do not acquire magic',async()=>{
 const d=setting('modern_multispecies','elf');d.worldGuide!.languages='English and Elvish are used in this city.';const p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);expect(p.world.kind).toBe('modern');expect(p.species!.id).toBe('elf');expect(p.world.capabilities).not.toContain('fantasy_magic');expect(worldVisualGuide(p.worldGuide)).toContain('Contemporary');expect(populationBrief(p).settingLanguages).toContain('Elvish');expect(populationBrief(p).knownLanguages).toBeUndefined();expect(p.appearance).toBeUndefined();expect(normalizeCandidatePlan(p)).toBeDefined();
});
test('nonhuman species conflicts receive targeted handling without overriding an authored human',async()=>{
 const p=await selectPopulationPlan(setting(),resolve,scope,identity,()=>.4);const a:any={version:2,dossier:parseAuthoring(dossier('Aster','Species or setting-specific physiology: Human; adult.'),'dossier','stop'),photos:[],gallery:[],provenance:{}};const result=projectDossier(a,p.selection.requiredFields,'slot',2,undefined,p);expect(result.issues.some(i=>i.code==='locked-species')).toBe(true);expect(result.row.person.appearance.tags).toContain('Human');expect(knownSpeciesIn('Elf; has human-like expressions')!.id).toBe('elf');expect(knownSpeciesIn('human-looking elf')).toBeUndefined();
});
test('required species OR choices exclude unsupported alternatives before macros, and manual briefs keep authorship',async()=>{
 const d=setting();d.filters.fields.species={mode:'required',value:'human, elf'};const p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);expect(p.species!.id).toBe('elf');expect(p.selection.requiredFields.species).toBe('Elf');
 d.filters.fields.species.value='android';let calls=0;await expect(selectPopulationPlan(d,async t=>{calls++;return resolve(t)},scope,identity,()=>.4)).rejects.toThrow('species');expect(calls).toBe(0);
 delete d.filters.fields.species;const manual=await selectPopulationPlan(d,resolve,scope,{...identity,brief:'An adult human blacksmith.'},()=>.4);expect(manual.species).toBeUndefined();expect(manual.worldGuide).toBeDefined();
});
test('human selection in a fantasy palette has valid durable human anchors; synthetic selection needs reviewed infrastructure',async()=>{
 const d=setting('medieval_fantasy','human'),p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);expect(p.appearance).toBeDefined();expect(normalizeCandidatePlan(p)).toBeDefined();
 const invalid=setting('medieval_fantasy','android');await expect(selectPopulationPlan(invalid,resolve,scope,identity,()=>.4)).rejects.toThrow('species');
 const valid=await selectPopulationPlan(setting('spacefaring','android'),resolve,scope,identity,()=>.4);expect(valid.species!.id).toBe('android');expect(valid.appearance).toBeUndefined();expect(normalizeCandidatePlan(valid)).toBeDefined();
});

test('reviewed species adulthood thresholds prune impossible age choices before any macro/provider work',async()=>{
 const d=setting();d.worldGuide!.species[0].minAdultAge=100;let calls=0;await expect(selectPopulationPlan(d,async t=>{calls++;return resolve(t)},scope,identity,()=>.4)).rejects.toThrow('species');expect(calls).toBe(0);
 d.filters.minAge=100;d.filters.maxAge=120;d.populationWorld!.maxAdultAge=300;const p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);expect(p.age).toBeGreaterThanOrEqual(100);expect(normalizeCandidatePlan(p)).toBeDefined();
});
test('custom species remain card-specific and initial extraction does not import modern capability defaults',()=>{
 const d=normalizeDating(null),sources={sources:[worldSource('card','Card','Kyren are adult sentient blue-scaled people. Their stone towns have no electricity.',1000)!],warnings:[]};
 const r=reviewWorldResult({proposals:[{kind:'species',key:'custom_kyren',label:'Kyren',value:'Adult sentient blue-scaled humanoid people.',certainty:'supported',evidence:[{sourceId:'card',quote:'Kyren are adult sentient blue-scaled people.'}]}]},sources,d),next=applyWorldReview(d,r);expect(next.worldGuide!.species[0].label).toBe('Kyren');expect(next.worldGuide!.species[0].appearance).toContain('blue-scaled');expect(next.populationWorld!.capabilities).not.toContain('electricity');expect(next.populationWorld!.kind).toBe('custom');
});
test('supported species removal is explicit and missing selected anatomy metadata quarantines a plan',async()=>{
 const d=setting(),r=reviewWorldResult({proposals:[proposal({value:'absent'})]},bundle,d);expect(r.proposals[0].selected).toBe(false);r.proposals[0].selected=true;expect(applyWorldReview(d,r).worldGuide!.species).toHaveLength(0);
 const p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);delete p.species;expect(normalizeCandidatePlan(p)).toBeUndefined();
});

test('an intentional empty review keeps accepted world facts and capabilities without an error or replacement',()=>{
 const d=setting(),r=reviewWorldResult({proposals:[]},bundle,d);expect(r.proposals).toEqual([]);expect(r.warnings.join(' ')).toContain('No new');expect(applyWorldReview(d,r).populationWorld).toEqual(d.populationWorld);expect(applyWorldReview(d,r).worldGuide).toEqual(d.worldGuide);
});

test('generic manual descriptions still use the reviewed species pool while explicit identity remains authoritative',async()=>{
 const p=await selectPopulationPlan(setting(),resolve,scope,{...identity,brief:'An adult carpenter who enjoys quiet evenings.'},()=>.4);expect(p.species!.id).toBe('elf');expect(normalizeCandidatePlan(p)).toBeDefined();
 const explicit=await selectPopulationPlan(setting(),resolve,scope,{...identity,brief:'Species: Human\nAn adult carpenter.'},()=>.4);expect(explicit.species).toBeUndefined();expect(normalizeCandidatePlan(explicit)).toBeDefined();
});
test('a phone change while collecting sources prevents dispatching a stale world request',async()=>{
 const h=lumistryHarness(1);h.h.worldEvidence=async()=>{h.state.pocketPersonaActorId='changed';return structuredClone(bundle);};await expect(h.app.handle({action:'world',requestId:'stale'},{chatId:'c',characterId:'a'},'u')).rejects.toThrow('before reading completed');expect(h.calls).toHaveLength(0);
});

test('oversized world proposals are reported rather than silently clipped and long custom species IDs stay stable',()=>{
 const d=setting(),r=reviewWorldResult({proposals:[proposal({kind:'presentation',key:'attire',value:'x'.repeat(1300)}),proposal({key:'custom_abcdefghijklmnopqrstuvwxy_12345678',label:'Custom',value:'Adult sentient custom person.'})]},bundle,d);expect(r.proposals).toHaveLength(1);expect(r.proposals[0].key).toBe('custom_abcdefghijklmnopqrstuvwxy_12345678');expect(r.warnings.join(' ')).toContain('oversized');
});

test('a cyborg can retain explicitly authored human anatomy with visible augmentation without a false species repair',async()=>{
 const p=await selectPopulationPlan(setting('spacefaring','cyborg'),resolve,scope,identity,()=>.4),a:any={version:2,dossier:parseAuthoring(dossier('Aster','Species or setting-specific physiology: Human; a visible bionic arm.'),'dossier','stop'),photos:[],gallery:[],provenance:{}};const result=projectDossier(a,p.selection.requiredFields,'slot',2,undefined,p);expect(result.issues.some(i=>i.code==='locked-species')).toBe(false);expect(result.row.person.appearance.tags).toContain('bionic arm');expect(result.row.person.appearance.tags).toContain('Cyborg');
});

test('Read World sends the larger output budget through the native request without changing summary retention',async()=>{
 const h=lumistryHarness(1);h.h.worldEvidence=async()=>structuredClone(bundle);h.generate=async()=>({proposals:[]});await h.app.handle({action:'world',requestId:'world-output-budget'},{chatId:'c',characterId:'a'},'u');expect(h.calls).toHaveLength(1);expect(h.calls[0].input.parameters.max_tokens).toBe(12000);expect(WORLD_READING_LIMITS.context).toBe(12000);expect(h.state.lumistry!.owner.worldContext).toBe('');
});

test('larger reviewed responses retain their baseline and proposals through storage normalization',()=>{
 const d=setting();d.worldContext='w'.repeat(12000);d.worldGuide!.species=Array.from({length:80},(_,i)=>({id:'custom_species_'+i,label:'Species '+i,family:'custom',appearance:'a'.repeat(800)}));d.worldFields=Array.from({length:6},(_,i)=>({key:'world_'+i,label:'Setting '+i,options:Array.from({length:80},(_,j)=>String(j)+'v'.repeat(36))}));
 const r=reviewWorldResult({proposals:[proposal({kind:'context',value:'c'.repeat(12000)})]},bundle,d);expect(JSON.stringify(r).length).toBeGreaterThan(100000);expect(normalizeWorldReview(JSON.parse(JSON.stringify(r)))).toEqual(r);expect(normalizeDating({...d,worldReviewCache:r}).worldReviewCache).toEqual(r);expect(normalizeWorldReview({...r,baseline:'x'.repeat(WORLD_READING_LIMITS.reviewCharacters)})).toBeUndefined();
});
