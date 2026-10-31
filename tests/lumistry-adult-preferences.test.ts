import {test,expect} from 'bun:test';
import {JSDOM} from 'jsdom';
import {ADULT_PREFERENCE_SOURCE} from '../src/domain/lumistry-adult-preferences-data.js';
import {ADULT_PREFERENCES,ADULT_PREFERENCE_BY_ID,assertAdultPreferenceCatalog,normalizeAdultPreferences,assertAdultPreferences,relevantAdultPreferences,preferenceEligible,requestedPreferenceContext,ADULT_PREFERENCE_STATES} from '../src/domain/lumistry-adult-preferences.js';
import {SPECIES_CATALOG,presetWorld,emptyWorldGuide,assertWorldGuide,normalizeWorldGuide,GENRE_COMPATIBILITY,worldGenreValues,worldVisualGuide} from '../src/domain/lumistry-world-catalog.js';
import {normalizeDating,normalizeDatingProfile,publicDatingProfile} from '../src/domain/lumistry.js';
import {reusableDatingProfile,normalizeSavedDatingProfiles} from '../src/domain/lumistry-saved-profiles.js';
import {assertDatingIngress} from '../src/domain/lumistry-ingress.js';
import {textingPublicProfile,textingRelevantFacts,textingOwnBrief} from '../src/domain/lumistry-messaging.js';
import {publicPersonContext,creationTaskContext} from '../src/backend/lumistry-creation-context.js';
import {dossierCategoryOptions} from '../src/backend/lumistry-discovery.js';
import {worldPreferenceVocabulary,adultPreferencesEditor} from '../src/frontend/apps/lumistry-adult-preferences.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {selectPopulationPlan,normalizeCandidatePlan} from '../src/domain/lumistry-population.js';
const profile=()=>normalizeDatingProfile({alias:'Test',age:30,person:{version:1},adultPreferences:{version:1,terms:{praise_and_compliments:'opt_in',v3_sound_only_sensory_play:'private_not_shared'},species:{elf:'opt_for_now'}}})!;
const resolve=async(t:string)=>({text:t.replace(/\{\{pick::([^}]+)\}\}/g,(_,v)=>v.split('::')[0]),diagnostics:[]});
test('451 source records, categories, 290 attraction references and illustrative links are valid and never defaults',()=>{
 assertAdultPreferenceCatalog();expect(ADULT_PREFERENCES).toHaveLength(451);expect(GENRE_COMPATIBILITY).toHaveLength(451);expect(new Set(ADULT_PREFERENCES.map(t=>t.label)).size).toBe(451);expect(ADULT_PREFERENCE_SOURCE.species_attraction_choices).toHaveLength(290);
 const species=new Set(SPECIES_CATALOG.map(s=>s.id));for(const row of ADULT_PREFERENCE_SOURCE.terms){const t=ADULT_PREFERENCE_BY_ID.get(row.id)!;expect(t.description).toBe(row.description);expect(t.label).toBe(row.label);expect(row.private_by_default&&row.explicit_mutual_opt_in&&row.not_species_default).toBe(true);expect(ADULT_PREFERENCE_SOURCE.categories[row.category]).toBeTruthy();for(const id of row.illustrative_species_ids)expect(species.has(id)).toBe(true);}
 for(const row of ADULT_PREFERENCE_SOURCE.species_attraction_choices){expect(species.has(row.species_id)).toBe(true);expect(row.selected_by_default).toBe(false);expect(row.is_a_kink_by_itself).toBe(false);}
 for(const row of Object.values(ADULT_PREFERENCE_SOURCE.species_illustration_index))for(const id of row.possible_related_tag_ids)expect(ADULT_PREFERENCE_BY_ID.has(id)).toBe(true);
});
test('legacy native IDs and source aliases retain selections and strict plan snapshot equality',async()=>{
 const p=presetWorld('modern_multispecies')!;p.guide.intimacyIds=['anatomy_horns','scifi_haptics'];expect(assertWorldGuide(p.guide).intimacyIds).toEqual(p.guide.intimacyIds);expect(ADULT_PREFERENCE_BY_ID.get('legacy_horn_appreciation')!.id).toBe('anatomy_horns');expect(assertWorldGuide({...p.guide,intimacyIds:['legacy_horn_appreciation']}).intimacyIds).toEqual(['anatomy_horns']);
 const d=normalizeDating({worldContext:'Reviewed contemporary world.',worldGuide:p.guide,populationWorld:p.world,filters:{minAge:29,maxAge:29}}),plan=await selectPopulationPlan(d,resolve,{chatId:'c',characterId:'a',userId:'u',commit:false},{id:'p',owner:'o',createdAt:'2026-10-16',questions:1,photos:1,distanceKm:2},()=>.4);expect(normalizeCandidatePlan(JSON.parse(JSON.stringify(plan)))).toEqual(plan);
});
test('every capability requirement applies, universe/species examples never grant abilities or assign interests',()=>{
 const modern=presetWorld('modern_multispecies')!,fantasy=presetWorld('medieval_fantasy')!;const term=ADULT_PREFERENCES.find(t=>t.requiredCapabilities.includes('fantasy_magic'))!;expect(preferenceEligible(term,modern.world)).toBe(false);expect(preferenceEligible(term,fantasy.world)).toBe(true);
 const guide=emptyWorldGuide();guide.intimacyIds=[term.id];expect(worldGenreValues(guide,modern.world)).toEqual([]);expect(worldGenreValues(guide,fantasy.world)).toEqual([term.label]);expect(worldVisualGuide(guide)).not.toContain(term.label);expect(normalizeDatingProfile({alias:'Old',age:30})!.adultPreferences).toBeUndefined();
 for(const t of ADULT_PREFERENCES)for(const cap of t.requiredCapabilities)expect(preferenceEligible(t,{...modern.world,capabilities:t.requiredCapabilities.filter(c=>c!==cap)})).toBe(false);
});
test('all five private states survive reload, saved persona copies and do not appear in public or photo contexts',()=>{
 const p=profile();p.adultPreferences!.terms=Object.fromEntries(ADULT_PREFERENCE_STATES.map(([s],i)=>[ADULT_PREFERENCES[i].id,s]));expect(normalizeDatingProfile(JSON.parse(JSON.stringify(p)))!.adultPreferences).toEqual(p.adultPreferences);expect(reusableDatingProfile(p).adultPreferences).toEqual(p.adultPreferences);
 const saved=normalizeSavedDatingProfiles({version:1,entries:[{id:'s',name:'Saved',revision:1,profile:p}]});expect(saved.entries[0].profile.adultPreferences).toEqual(p.adultPreferences);
 for(const context of [publicDatingProfile(p),textingPublicProfile(p),publicPersonContext(p),creationTaskContext({task:'photos',acceptedAppearance:p.person!.appearance})])expect(JSON.stringify(context)).not.toContain('adultPreferences');expect(JSON.stringify(textingOwnBrief(p))).not.toContain('adultPreferences');
 expect(normalizeAdultPreferences({version:1,terms:{future_saved_interest:'unknown'},species:{custom_lore_species:'private_not_shared'}})).toBeDefined();
});
test('invalid private input rejects before storage rather than clipping or changing other profile facts',()=>{
 for(const raw of [{version:1,terms:1,species:{}},{version:1,terms:{praise_and_compliments:'always_consent'},species:{}},{version:2,terms:{},species:{}},{version:1,terms:{constructor:'opt_in'},species:{}}]){expect(normalizeAdultPreferences(raw)).toBeUndefined();expect(()=>assertAdultPreferences(raw)).toThrow();expect(()=>assertDatingIngress({...profile(),adultPreferences:raw},'edit')).toThrow();}
});
test('compact own retrieval contains only pertinent recorded facts and preserves withholding/trait rules',()=>{
 const p=profile(),result=relevantAdultPreferences(p.adultPreferences,'praise and sound');expect(result!.terms).toHaveLength(2);expect(result!.terms.some(t=>t.state==='private_not_shared')).toBe(true);expect(result!.rule).toContain('Do not disclose');expect(result!.rule).toContain('Do not invent anatomy');expect(relevantAdultPreferences(p.adultPreferences,'unrelated airport')).toBeUndefined();expect(JSON.stringify(result).length).toBeLessThan(3000);expect(relevantAdultPreferences(p.adultPreferences,'what are your kinks?')!.terms.length).toBeLessThanOrEqual(6);
 expect(relevantAdultPreferences(p.adultPreferences,'elf species')!.species).toEqual([{label:'Elf',state:'opt_for_now'}]);expect(JSON.stringify(textingRelevantFacts(p,normalizeDatingProfile({alias:'Other',age:30})!,'praise'))).toContain('Praise and compliments');
 const other=profile();delete p.adultPreferences;expect(JSON.stringify(textingRelevantFacts(p,other,'praise'))).not.toContain('Praise and compliments');
});
test('explicit required kink projection includes one selected definition and never the 451-term library',()=>{
 const chosen=ADULT_PREFERENCES[0],all=ADULT_PREFERENCES.map(t=>t.label);expect(dossierCategoryOptions({kinks:all,gender:['woman']},{kinks:chosen.label}).kinks).toEqual([chosen.label]);expect(dossierCategoryOptions({kinks:all},{})).not.toHaveProperty('kinks');expect(dossierCategoryOptions({kinks:[]},{kinks:chosen.label}).kinks).toEqual([chosen.label]);expect(requestedPreferenceContext(chosen.label)!.terms).toHaveLength(1);expect(requestedPreferenceContext(undefined)).toBeUndefined();expect(JSON.stringify(requestedPreferenceContext(chosen.label))).not.toContain(ADULT_PREFERENCES.at(-1)!.label);
});
test('world vocabulary UI and private profile editor operate on separate drafts with no generation',()=>{
 const dom=new JSDOM('<body></body>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try{const world=presetWorld('modern_multispecies')!.world,enabled:string[]=[],v=worldPreferenceVocabulary(world,[],ids=>enabled.splice(0,enabled.length,...ids));const search=v.querySelector('[aria-label="Search preference terms"]') as HTMLInputElement;search.value='Praise and compliments';search.dispatchEvent(new dom.window.Event('input'));const row=[...v.querySelectorAll('label')].find(n=>n.textContent==='Praise and compliments')!;const box=row.querySelector('input')!;box.checked=true;box.dispatchEvent(new dom.window.Event('change'));expect(enabled).toContain('praise_and_compliments');
 const p=normalizeDatingProfile({alias:'Self',age:30})!,editor=adultPreferencesEditor(p,world);expect(p.adultPreferences).toBeUndefined();expect(editor.querySelector('[aria-label="Search private interests"]')).toBeNull();(editor as HTMLDetailsElement).open=true;editor.dispatchEvent(new dom.window.Event('toggle'));const q=editor.querySelector('[aria-label="Search private interests"]') as HTMLInputElement;q.value='Praise and compliments';q.dispatchEvent(new dom.window.Event('input'));const state=editor.querySelector('[aria-label="Praise and compliments private preference"]') as HTMLSelectElement;state.value='opt_out';state.dispatchEvent(new dom.window.Event('change'));expect(p.adultPreferences!.terms.praise_and_compliments).toBe('opt_out');expect(p.fields.kinks).toBeUndefined();expect(enabled).toEqual(['praise_and_compliments']);expect(q.value).toBe('Praise and compliments');
 }finally{globalThis.document=previous;dom.window.close();}
});
test('saving private preferences makes no LLM call and malformed saves preserve the current profile',async()=>{
 const h=lumistryHarness(1),p={...h.state.lumistry!.owner.self!,adultPreferences:profile().adultPreferences};await h.app.handle({action:'self',profile:p},{chatId:'c',characterId:'a'},'u');expect(h.calls).toHaveLength(0);expect(h.state.lumistry!.owner.self!.adultPreferences).toEqual(p.adultPreferences);const before=structuredClone(h.state.lumistry!.owner.self);await expect(h.app.handle({action:'self',profile:{...p,adultPreferences:{version:1,terms:{bad:'invalid'},species:{}}}},{chatId:'c',characterId:'a'},'u')).rejects.toThrow();expect(h.state.lumistry!.owner.self).toEqual(before);
});

test('all 451 vocabulary choices remain a valid compact plan and never become a mandatory private questionnaire',async()=>{
 const preset=presetWorld('spacefaring')!;preset.guide.species=[SPECIES_CATALOG[0]];preset.guide.intimacyIds=ADULT_PREFERENCES.map(t=>t.id);const d=normalizeDating({worldContext:'Reviewed setting.',worldGuide:preset.guide,populationWorld:preset.world,filters:{minAge:29,maxAge:29}});const plan=await selectPopulationPlan(d,resolve,{chatId:'c',characterId:'a',userId:'u',commit:false},{id:'full-vocabulary',owner:'o',createdAt:'2026-10-16',questions:1,photos:1,distanceKm:2},()=>.4);expect(normalizeCandidatePlan(plan)).toEqual(plan);expect(dossierCategoryOptions({kinks:worldGenreValues(d.worldGuide,d.populationWorld!)},{})).not.toHaveProperty('kinks');expect(d.profiles).toHaveLength(0);expect(d.self).toBeNull();
});

test('explicit unknown remains unknown for a direct topic question without filling generic interest lists',()=>{
 const p={version:1 as const,terms:{praise_and_compliments:'unknown' as const},species:{elf:'unknown' as const}};expect(relevantAdultPreferences(p,'praise')!.terms[0].state).toBe('unknown');expect(relevantAdultPreferences(p,'elf')!.species[0].state).toBe('unknown');expect(relevantAdultPreferences(p,'what are your kinks?')).toBeUndefined();expect(relevantAdultPreferences(p,'which species?')).toBeUndefined();
});

test('required preference OR alternatives prune incompatible world effects before authoring without weakening the filter',async()=>{
 const preset=presetWorld('modern_multispecies')!,magic=ADULT_PREFERENCES.find(t=>t.requiredCapabilities.includes('fantasy_magic'))!,plain=ADULT_PREFERENCES.find(t=>t.id==='praise_and_compliments')!;const d=normalizeDating({worldContext:'Reviewed contemporary world without magic.',populationWorld:preset.world,worldGuide:preset.guide,filters:{minAge:29,maxAge:29,fields:{kinks:{mode:'required',value:magic.label}}}});let calls=0;const resolver=async(t:string)=>{calls++;return resolve(t);},scope={chatId:'c',characterId:'a',userId:'u',commit:false} as const,identity={id:'required',owner:'o',createdAt:'2026-10-16',questions:1,photos:1,distanceKm:2};await expect(selectPopulationPlan(d,resolver,scope,identity,()=>.4)).rejects.toThrow('world capabilities');expect(calls).toBe(0);d.filters.fields.kinks.value=magic.label+', '+plain.label;const p=await selectPopulationPlan(d,resolve,scope,identity,()=>.4);expect(p.selection.requiredFields.kinks).toBe(plain.label);expect(d.filters.fields.kinks.value).toContain(magic.label);expect(normalizeCandidatePlan(p)).toBeDefined();
});
