import {presetWorld} from '../src/domain/lumistry-world-catalog.js';
import {test,expect} from 'bun:test';
import {APPEARANCE_POLICY,COMPLEXIONS,APPEARANCE_FEATURES,appearanceBrief,selectAppearance,validAppearance,projectPlannedAppearance,eligibleHumanAppearance} from '../src/domain/lumistry-appearance.js';
import {worldDefaults} from '../src/domain/lumistry-occupations.js';
import {selectPopulationPlan,normalizeCandidatePlan,populationBrief,weightedPick} from '../src/domain/lumistry-population.js';
import {normalizeDating,normalizeDatingProfile} from '../src/domain/lumistry.js';
import {normalizeDiscoveryJob} from '../src/domain/lumistry-pipeline.js';
import {parseAuthoring,projectDossier} from '../src/domain/lumistry-v2.js';
import {compileDossierFields,dynamicDossierFields} from '../src/domain/lumistry-dynamic-fields.js';
import {planRepair} from '../src/domain/lumistry-repair.js';
import {dossier} from './fixtures/lumistry-v2.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
const scope={chatId:'c',characterId:'a',userId:'u',commit:false} as const;
const resolve=async(t:string)=>({text:t.replace(/\{\{pick::([^}]+)\}\}/g,(_,v)=>v.split('::')[0]),diagnostics:[]});
const identity={id:'appearance-test',owner:'owner',createdAt:'2026-10-16T00:00:00Z',questions:2,photos:3,distanceKm:1};
const data=(extra:any={})=>normalizeDating({filters:{minAge:29,maxAge:29,fields:{occupation:{mode:'required',value:'tradesperson'}}},...extra});
const planned=(extra:any={},brief?:string)=>selectPopulationPlan(data(extra),resolve,scope,{...identity,brief},()=>.8);
const projection=(p:any,text=dossier())=>projectDossier({version:2,dossier:parseAuthoring(text,'dossier','stop'),photos:[],gallery:[],provenance:{}},{},'slot_0',1,undefined,p);
test('appearance selection is versioned, optional and saved before authoring without another macro or provider',async()=>{
 const p=await planned();expect(p.appearance).toBeDefined();expect(validAppearance(p.appearance,p.world,p.selection.requiredFields)).toBe(true);
 expect(normalizeCandidatePlan(JSON.parse(JSON.stringify(p)))!.appearance).toEqual(p.appearance);
 expect(populationBrief(p).physicalAppearance).toEqual(appearanceBrief(p.appearance));
 expect(JSON.stringify(populationBrief(p))).not.toContain('toneId');
 expect((await planned({generationSettings:{appearanceDiversity:false}})).appearance).toBeUndefined();
 expect((await planned({},'Bald, brown skin; preserve this manual description.')).appearance).toBeUndefined();
});
test('unknown or nonhuman worlds never acquire human anatomy by assumption',async()=>{
 for(const kind of ['fantasy','cyberpunk','spacefaring','custom'] as const){const w=worldDefaults(kind);expect(eligibleHumanAppearance(w,{})).toBe(false);expect(eligibleHumanAppearance(w,{species:'human'})).toBe(true);expect(eligibleHumanAppearance(w,{species:'elf'})).toBe(false);expect((await planned({populationWorld:w})).appearance).toBeUndefined();}
 expect(eligibleHumanAppearance(worldDefaults('modern'),{},'Anthropomorphic animal people')).toBe(false);
 expect(eligibleHumanAppearance(worldDefaults('historical'),{})).toBe(true);
 expect(eligibleHumanAppearance(worldDefaults('modern'),{hair:'bald'})).toBe(false);
 expect((await planned({filters:{minAge:29,maxAge:29,fields:{species:{mode:'preferred',value:'elf'}}}})).appearance).toBeUndefined();
 await expect(planned({populationWorld:worldDefaults('fantasy'),filters:{minAge:29,maxAge:29,fields:{species:{mode:'required',value:'human'}}}})).rejects.toThrow('palette');
 const reviewed=presetWorld('medieval_fantasy')!;expect((await planned({populationWorld:reviewed.world,worldGuide:reviewed.guide,filters:{minAge:29,maxAge:29,fields:{species:{mode:'required',value:'human'}}}})).appearance).toBeDefined();
});
test('legacy plans stay legacy and corrupt appearance selections quarantine progress rather than reroll',async()=>{
 const p=await planned();const legacy=structuredClone(p);delete legacy.appearance;expect(normalizeCandidatePlan(legacy)!.appearance).toBeUndefined();
 const bad=structuredClone(p);bad.appearance!.toneId='made-up';expect(normalizeCandidatePlan(bad)).toBeUndefined();
 const h=lumistryHarness(24);h.generate=async()=>{throw Error('offline interruption')};await h.run();const job=structuredClone(h.state.lumistry!.owner.discoveryJob!);job.slots[0].plan=bad;
 const normalized=normalizeDiscoveryJob(job)!;expect(normalized.slots[0].plan).toBeUndefined();expect(normalized.slots[0].quarantinedProgress).toBeDefined();
});
test('selected facets become canonical without requiring prose to repeat exact anchor strings',async()=>{
 const p=await planned();const a=projection(p,dossier().replace('Skin / fur / scales / surface: olive skin with a few freckles','Skin / fur / scales / surface: a few freckles'));
 expect(a.issues.filter(i=>i.code==='locked-appearance')).toEqual([]);expect(a.row.person.appearance.skin).toContain(appearanceBrief(p.appearance)!.skin);expect(a.row.person.appearance.skin).toContain('a few freckles');
 expect(a.row.authoring).toBeUndefined();expect(a.row.privateFields.identityAnchors).toContain(appearanceBrief(p.appearance)!.skin);
 const old=structuredClone(p);delete old.appearance;expect(dynamicDossierFields(p).map(f=>f.label)).toEqual(dynamicDossierFields(old).map(f=>f.label));
 expect(compileDossierFields(p)).toContain('saved complexion');expect(compileDossierFields(p)).not.toContain('appearance-policy');
});
test('explicit opposite complexion repairs only its existing field and preserves raw evidence',async()=>{
 const p=await planned();p.appearance!.toneId='deep_neutral';const text=dossier().replace('olive skin with a few freckles','fair skin with a few freckles');const a=projection(p,text);
 const issues=a.issues.filter(i=>i.code==='locked-appearance');expect(issues).toHaveLength(1);expect(issues[0].labels).toEqual(['Skin / fur / scales / surface']);expect(planRepair('dossier',issues,[]).task).toBe('dossier');expect(a.row.person.appearance.skin).not.toContain('fair');
 expect(a.row.person.appearance.skin).toContain('Deep brown skin');
});
test('feature projection preserves compatible detail and distinguishes temporary styling',async()=>{
 const p=(await planned()).appearance!;p.featureId='hair_coily';
 const compatible=projectPlannedAppearance(p,{skin:'brown skin',hair:'dark brown, cropped close',tags:'Human'});expect(compatible.conflicts).toEqual([]);expect(compatible.values.hair).toContain('cropped close');
 expect(projectPlannedAppearance(p,{hair:'Naturally straight hair'}).conflicts).toEqual(['Hair']);
 expect(projectPlannedAppearance(p,{hair:'Straightened hair for the party'}).conflicts).toEqual([]);
 p.featureId='face_broad_nose';expect(projectPlannedAppearance(p,{face:'a slender nose'}).conflicts).toEqual(['Facial features']);
});
test('default discovery publishes using canonical anchors, keeps complete photos and uses the ordinary call count',async()=>{
 const h=lumistryHarness(24);await h.run();const d=h.state.lumistry!.owner,p=d.profiles.at(-1)!;expect(p.creationPlan!.appearance).toBeDefined();
 expect(p.person.appearance.skin).toContain(appearanceBrief(p.creationPlan!.appearance)!.skin);expect(p.photoPlan.filter(Boolean)).toHaveLength(p.creationPlan!.photoCount);
 expect(h.calls.filter(c=>c.req.task==='dossier')).toHaveLength(1);expect(h.calls.filter(c=>c.req.task==='index')).toHaveLength(0);
 expect(h.calls.length).toBe(2+Math.ceil(p.creationPlan!.photoCount/3));
 const photos=h.calls.filter(c=>c.req.task==='photos');expect(JSON.stringify(photos)).toContain(appearanceBrief(p.creationPlan!.appearance)!.skin);
 expect(normalizeDatingProfile(JSON.parse(JSON.stringify(p)))!.creationPlan!.appearance).toEqual(p.creationPlan!.appearance);
});
test('saved plans survive cancellation and preference toggling; existing identities are not resampled',async()=>{
 const h=lumistryHarness(24);h.generate=async()=>{throw Error('interrupted')};await h.run();let d=h.state.lumistry!.owner;const saved=structuredClone(d.discoveryJob!.slots[0].plan!);expect(saved.appearance).toBeDefined();
 d.generationSettings.appearanceDiversity=false;h.generate=undefined;await h.run();d=h.state.lumistry!.owner;expect(d.discoveryJob!.slots[0].plan).toEqual(saved);expect(d.profiles.at(-1)!.creationPlan!.appearance).toEqual(saved.appearance);
 expect(d.profiles[0].creationPlan).toBeUndefined();
});
test('selection adds only a compact saved anchor, no policy catalog or extra required output',async()=>{
 const p=await planned();const old=structuredClone(p);delete old.appearance;
 const difference=JSON.stringify(populationBrief(p)).length-JSON.stringify(populationBrief(old)).length+compileDossierFields(p).length-compileDossierFields(old).length;
 expect(difference).toBeGreaterThan(0);expect(difference).toBeLessThan(700);
});
test('10k seeded appearance plans cover every anchor with soft cooldowns and no hard exclusions',()=>{
 let seed=811;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};const history:any[]=[],tones=new Set(),features=new Set();let marks=0;
 for(let i=0;i<10000;i++){const p=selectAppearance(worldDefaults('modern'),{},'',history,random,weightedPick)!;if(!validAppearance(p,worldDefaults('modern'),{}))throw Error('Invalid appearance');tones.add(p.toneId);features.add(p.featureId);if(p.markId)marks++;history.push(p);if(history.length>12)history.shift();}
 expect(tones.size).toBe(COMPLEXIONS.length);expect(features.size).toBe(APPEARANCE_FEATURES.length);expect(marks).toBeGreaterThan(1700);expect(marks).toBeLessThan(2300);expect(APPEARANCE_POLICY.window).toBe(12);
});
test('two workers save distinct appearance plans before either provider completes',async()=>{
 const h=lumistryHarness(23);const lock=h.h.withStateLock;let queue=Promise.resolve();h.h.withStateLock=(key:string,fn:any)=>{const result=queue.then(()=>lock(key,fn));queue=result.catch(()=>undefined);return result};h.state.lumistry!.owner.generationSettings.creation!.workers=2;let release!:()=>void;const barrier=new Promise<void>(r=>release=r);let started=0;
 h.generate=async req=>{if(req.task==='dossier'){started++;const name=started===1?'Lena':'Mara';const plans=h.state.lumistry!.owner.discoveryJob!.slots.filter(s=>s.plan);expect(plans.length).toBeGreaterThanOrEqual(started);expect(plans.every(s=>!!s.plan!.appearance)).toBe(true);if(started===1)await barrier;else release();const response=h.response(req);response.authoredText=response.authoredText.replaceAll('New Aster',name);return response;}return h.response(req)};
 await h.run();const d=h.state.lumistry!.owner;expect(started).toBe(2);expect(d.profiles).toHaveLength(25);expect(d.profiles.slice(-2).every(p=>!!p.creationPlan!.appearance)).toBe(true);expect(new Set(d.profiles.slice(-2).map(p=>p.creationPlan!.id)).size).toBe(2);
});
test('negated alternatives and accepted identifying marks do not trigger false repairs or disappear',async()=>{
 const p=(await planned()).appearance!;p.featureId='face_broad_nose';p.markId='cheek_mole';p.toneId='deep_neutral';const projected=projectPlannedAppearance(p,{skin:'not pale skin',face:'not a slender nose',distinctive:'a small scar above the left eyebrow'});
 expect(projected.conflicts).toEqual([]);expect(projected.values.distinctive).toContain('small scar');expect(projected.values.distinctive).toContain('small mole');
});
