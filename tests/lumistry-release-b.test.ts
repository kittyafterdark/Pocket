import {test,expect} from 'bun:test';
import {normalizeDating,normalizeDatingProfile,datingFit,publicDatingProfile} from '../src/domain/lumistry.js';
import {inspectFilterFit,filterSignature,filterPreview,validateFilterDraft,validateSettingFilter,excludedProfileKeys} from '../src/domain/lumistry-filters.js';
import {reviewedSettingKey,settingKeyFor,plannedLocation,datingLocationLabel,UNKNOWN_DISTANCE_KM} from '../src/domain/lumistry-location.js';
import {selectPopulationPlan,normalizeCandidatePlan,populationBrief} from '../src/domain/lumistry-population.js';
import {worldDefaults} from '../src/domain/lumistry-occupations.js';
import {normalizeDiscoveryJob,discoveryFingerprint} from '../src/domain/lumistry-pipeline.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
const person=(extra:any={})=>normalizeDatingProfile({id:'p',alias:'Person',age:29,distanceKm:4,fields:{smoking:'regularly',gender:'woman',occupation:'tradesperson'},...extra})!;
const reviewed=(extra:any={})=>normalizeDating({worldContext:'A modern human town in a fictional country.',worldReviewedAt:'2026-10-16T00:00:00Z',populationWorld:worldDefaults('modern'),...extra});
const resolver=async(t:string)=>({text:t.replace(/\{\{pick::([^}]+)\}\}/g,(_,v)=>v.split('::')[0]),diagnostics:[]});
const scope={chatId:'offline',characterId:'offline',userId:'offline',commit:false} as const;
const identity={id:'plan',owner:'owner',createdAt:'2026-10-16T00:00:00Z',questions:2,photos:3,distanceKm:4};
const plan=(d:any)=>selectPopulationPlan(d,resolver,scope,identity,()=>.8);
test('legacy filters migrate without negative semantics or changed default fingerprints',()=>{
 const d=normalizeDating({filters:{minAge:18,maxAge:99,maxKm:50,fields:{dealbreakers:{mode:'required',value:'smoking'},oldCustom:{mode:'any',value:'kept'}}}});
 expect(d.filters).not.toHaveProperty('distanceMode');expect(d.filters).not.toHaveProperty('excludedValues');expect(d.filters.fields.oldCustom.value).toBe('kept');
 expect(datingFit(person({fields:{dealbreakers:'smoking',smoking:'regularly'}}),d).eligible).toBe(true);
 const before=discoveryFingerprint(d);expect(discoveryFingerprint(normalizeDating(JSON.parse(JSON.stringify(d))))).toBe(before);
});
test('exclusions inspect only publicly disclosed exact category values',()=>{
 const d=normalizeDating({filters:{excludedValues:{smoking:['regularly']}}});
 expect(datingFit(person(),d).eligible).toBe(false);
 for(const p of [person({hiddenFields:['smoking']}),person({fields:{},privateFields:{smoking:'regularly'}}),person({fields:{smoking:'prefer not to say'}}),person({fields:{smoking:'never'}})])expect(datingFit(p,d).eligible).toBe(true);
 expect(excludedProfileKeys(person(),d.filters)).toEqual(['smoking']);expect(inspectFilterFit(person(),d.filters).blockers).toEqual([{kind:'excluded',key:'smoking'}]);
});
test('any disclosed excluded token blocks a multivalue category and height exclusions use canonical units/ranges',()=>{
 const f=normalizeDating({filters:{excludedValues:{interests:['gaming'],height:['170–180 cm']}}}).filters;
 expect(inspectFilterFit(person({fields:{interests:'books, gaming'}}),f).eligible).toBe(false);
 expect(inspectFilterFit(person({fields:{height:'5 ft 9 in'}}),f).eligible).toBe(false);
 expect(inspectFilterFit(person({fields:{height:'185 cm'}}),f).eligible).toBe(true);
});
test('meaning signatures include exclusions and setting identity but ignore their order and dormant radius',()=>{
 const d=reviewed(),key=reviewedSettingKey(d)!;const a={...d.filters,distanceMode:'setting' as const,settingKey:key,excludedValues:{smoking:['regularly','vaping'],drinking:['regularly']}};
 const b={...a,maxKm:900,excludedValues:{drinking:['REGULARLY'],smoking:['vaping','regularly','regularly']}};
 expect(filterSignature(a,true)).toBe(filterSignature(b,true));expect(filterSignature(a)).not.toBe(filterSignature(b));
 expect(filterSignature(a,true)).not.toBe(filterSignature({...a,settingKey:settingKeyFor('other','modern')},true));
});
test('malformed exclusions and fully excluded required OR alternatives fail locally',async()=>{
 for(const exclusions of [{smoking:'regularly'},{smoking:[5]},{smoking:['unknown']},{smoking:Array(21).fill('x')},{smoking:['x'.repeat(81)]}])expect(validateFilterDraft({...normalizeDating(null).filters,excludedValues:exclusions as any})).toBeDefined();
 const d=normalizeDating({filters:{fields:{occupation:{mode:'required',value:'technology, tradesperson'}},excludedValues:{occupation:['technology','tradesperson']}}});let macros=0;
 await expect(selectPopulationPlan(d,async t=>{macros++;return resolver(t)},scope,identity)).rejects.toThrow('also excluded');expect(macros).toBe(0);
});
test('required OR planning removes excluded alternatives before selecting occupations or character categories',async()=>{
 const d=reviewed({filters:{minAge:29,maxAge:29,fields:{occupation:{mode:'required',value:'technology, tradesperson'},gender:{mode:'required',value:'woman, man'}},excludedValues:{occupation:['technology'],gender:['man']}}});
 const p=await plan(d);expect(p.work.publicCategories).not.toContain('technology');expect(p.selection.requiredFields).toMatchObject({occupation:'tradesperson',gender:'woman'});expect(normalizeCandidatePlan(p)).toBeDefined();
});
test('anywhere uses a reviewed setting scope and an unknown distance, never a huge generated radius',async()=>{
 const d=reviewed();d.filters.distanceMode='setting';d.filters.settingKey=reviewedSettingKey(d);d.filters.maxKm=3;
 const placement=plannedLocation(d,()=>.99);expect(placement.distanceKm).toBe(UNKNOWN_DISTANCE_KM);expect(placement.location.mode).toBe('setting');
 const p=await plan(d);expect(p.location).toEqual(placement.location);expect(populationBrief(p).distanceKm).toBeUndefined();expect(populationBrief(p).placement).toContain('not established');
 const published=person({creationPlan:p,location:p.location,distanceKm:p.distanceKm});expect(datingFit(published,d).eligible).toBe(true);expect(datingLocationLabel(published)).toContain('distance unknown');
 expect(normalizeDatingProfile(JSON.parse(JSON.stringify(published)))!.distanceKm).toBe(UNKNOWN_DISTANCE_KM);
 const radius=normalizeDating({...d,filters:{...d.filters,distanceMode:'radius',settingKey:undefined,maxKm:100000}});expect(datingFit(published,radius).eligible).toBe(false);
 expect(JSON.stringify(publicDatingProfile(published))).not.toContain('setting_');
});
test('unknown, foreign and legacy setting memberships are distinguished without reclassifying prose',async()=>{
 const d=reviewed();d.filters.distanceMode='setting';d.filters.settingKey=reviewedSettingKey(d);
 expect(datingFit(person(),d).eligible).toBe(false);
 const old=reviewed();const p=await plan(old),legacy=structuredClone(p);delete legacy.location;
 expect(datingFit(person({creationPlan:legacy}),d).eligible).toBe(true);
 const foreign=person({location:{mode:'radius',settingKey:settingKeyFor('another world','modern')}});expect(datingFit(foreign,d).eligible).toBe(false);
 const radius=normalizeDating({...d,filters:{fields:{},maxKm:50}});expect(datingFit(foreign,radius).eligible).toBe(false);expect(datingFit(person(),radius).eligible).toBe(true);
});
test('review is required before setting-wide generation and saved scopes reject stale filter commits',async()=>{
 const d=normalizeDating({filters:{distanceMode:'setting',settingKey:settingKeyFor('x','modern')}});expect(validateSettingFilter(d.filters,d)).toBeDefined();await expect(plan(d)).rejects.toThrow('reviewed setting changed');
 const known=reviewed();known.filters.distanceMode='setting';known.filters.settingKey=reviewedSettingKey(known);known.settingKey=settingKeyFor('new native scope','native');expect(validateSettingFilter(known.filters,known)).toBeDefined();
});
test('world-summary refinements preserve durable identity and setting changes alter discovery fingerprints',async()=>{
 const d=reviewed(),key=reviewedSettingKey(d)!;const before=discoveryFingerprint(d);const changed=normalizeDating({...d,worldContext:'A more detailed summary of the same modern town.'});expect(reviewedSettingKey(changed)).toBe(key);
 const separate=normalizeDating({...d,settingKey:settingKeyFor('native-scope-2','native')});expect(discoveryFingerprint(separate)).not.toBe(before);expect(reviewedSettingKey(separate)).not.toBe(key);
 const p=await plan(d);expect(datingFit(person({creationPlan:p}),separate).eligible).toBe(false);
});
test('preview reports exclusion and setting blockers consistently and retains seen matches',()=>{
 const d=reviewed({profiles:[person({id:'excluded'}),person({id:'unknown'}),person({id:'liked'})],decisions:[{profileId:'liked',action:'like',status:'matched'}],filters:{excludedValues:{smoking:['regularly']}}});
 const preview=filterPreview(d,d.filters);expect(preview.unseen).toBe(2);expect(preview.reasons.find(r=>r.kind==='excluded')?.blocked).toBe(2);expect(d.decisions[0].status).toBe('matched');
});
test('discovery publishes a setting-wide plan once and reuses it on reload',async()=>{
 const h=lumistryHarness(24),d=h.state.lumistry!.owner;d.worldContext='A reviewed modern human town.';d.worldReviewedAt='2026-10-16';d.settingKey=reviewedSettingKey(d);d.filters.distanceMode='setting';d.filters.settingKey=reviewedSettingKey(d);
 for(const p of d.profiles)p.location={mode:'radius',settingKey:reviewedSettingKey(d)};h.state.lumistry!.owner=normalizeDating(d);
 await h.run();const saved=h.state.lumistry!.owner.profiles.at(-1)!;expect(saved.creationPlan!.location!.mode).toBe('setting');expect(datingFit(saved,h.state.lumistry!.owner).eligible).toBe(true);
 expect(h.calls.find(c=>c.req.task==='dossier')!.req).not.toHaveProperty('fictionalPlacementKm');const calls=h.calls.length;await h.run();expect(h.calls.length).toBe(calls);
});
test('a generated excluded public fact is retained and parked without rewriting identity to fit',async()=>{
 const h=lumistryHarness(24);h.state.lumistry!.owner.filters.excludedValues={smoking:['regularly']};h.state.lumistry!.owner=normalizeDating(h.state.lumistry!.owner);h.generate=async req=>{const result=h.response(req);if(req.task==='dossier')result.authoredText=result.authoredText.replace('Public categories: gender, occupation, height, interests, intentions','Public categories: gender, occupation, height, interests, intentions, smoking').replace('END CHARACTER DOSSIER.','Category smoking: regularly\nEND CHARACTER DOSSIER.');return result};
 await h.run();expect(h.calls).toHaveLength(1);const slot=h.state.lumistry!.owner.discoveryJob!.slots[0];expect(slot.status).toBe('failed');expect(slot.progress!.authored.dossier!.text).toContain('Category smoking: regularly');expect(h.state.lumistry!.owner.profiles).toHaveLength(24);
});
test('unknown distance survives repeated storage normalization and cannot become nearby at the maximum radius',()=>{
 let p=person({distanceKm:null});for(let i=0;i<5;i++)p=normalizeDatingProfile(JSON.parse(JSON.stringify(p)))!;expect(p.distanceKm).toBe(UNKNOWN_DISTANCE_KM);expect(datingFit(p,normalizeDating({filters:{maxKm:100000}})).eligible).toBe(false);
});
test('saved custom exclusion keys never read inherited object properties as profile facts',()=>{
 const d=normalizeDating({filters:{excludedValues:{constructor:['something'],toString:['something']}}});expect(datingFit(person(),d).eligible).toBe(true);
});
test('damaged location/filter metadata is rejected without throwing or rerolling a saved plan',async()=>{
 const d=reviewed();d.filters.distanceMode='setting';d.filters.settingKey=reviewedSettingKey(d);const p=await plan(d);
 expect(normalizeCandidatePlan({...p,location:{...p.location,mode:'radius'}})).toBeUndefined();expect(normalizeCandidatePlan({...p,filters:{...p.filters,fields:null}})).toBeUndefined();expect(normalizeCandidatePlan({...p,distanceKm:0})).toBeUndefined();
});
test('unvalidated creation metadata cannot supply setting membership to an older published profile',async()=>{
 const d=reviewed();d.filters.distanceMode='setting';d.filters.settingKey=reviewedSettingKey(d);const p=await plan(d);const candidate=person({creationPlan:{...p,schema:'broken'}});expect(candidate.creationPlan).toBeUndefined();expect(candidate.location).toBeUndefined();expect(datingFit(candidate,d).eligible).toBe(false);
});
import {nearbyEncounterPossible} from '../src/domain/lumistry-location.js';
test('setting-wide membership never establishes proximity for a roleplay encounter',()=>{
 const d=reviewed(),key=reviewedSettingKey(d)!;expect(nearbyEncounterPossible(person({location:{mode:'setting',settingKey:key},distanceKm:UNKNOWN_DISTANCE_KM}),d)).toBe(false);expect(nearbyEncounterPossible(person({location:{mode:'radius',settingKey:key},distanceKm:2}),d)).toBe(true);expect(nearbyEncounterPossible(person({location:{mode:'radius',settingKey:settingKeyFor('foreign','modern')},distanceKm:2}),d)).toBe(false);
});

test('adapting an existing contact in Anywhere does not invent distance or setting membership',async()=>{
 const h=lumistryHarness(1),d=h.state.lumistry!.owner;d.worldContext='A reviewed modern town.';d.worldReviewedAt='2026-10-16';d.filters.distanceMode='setting';d.filters.settingKey=reviewedSettingKey(d);h.state.lumistry!.owner=normalizeDating(d);
 const original=structuredClone(d.profiles[0]);h.state.contacts.push({id:'established',name:'Existing person',identityBrief:'Established identity',phoneProfile:structuredClone(original.phoneProfile),source:{kind:'npc',origin:'manual'}} as any);
 h.generate=async()=>({...structuredClone(original),distanceKm:0,location:{mode:'radius',settingKey:reviewedSettingKey(d)}});
 await h.app.handle({action:'generate',contactId:'established',requestId:'adapt'}, {chatId:'c',characterId:'a'},'u');
 const draft=h.sent.find((v:any)=>v.phase==='draft')?.draft;expect(draft).toBeDefined();expect(draft.distanceKm).toBe(UNKNOWN_DISTANCE_KM);expect(draft.location).toBeUndefined();expect(draft.creationPlan).toBeUndefined();expect(h.state.lumistry!.owner.profiles).toHaveLength(1);expect(h.calls).toHaveLength(1);
});
