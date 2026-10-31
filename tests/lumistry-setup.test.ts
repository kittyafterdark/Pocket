import {test,expect} from 'bun:test';
import {normalizeDating,normalizeDatingProfile,datingReplyMessages} from '../src/domain/lumistry.js';
import {SETUP_QUESTIONS,SETUP_SECTIONS,makeSetupDraft,recommendSetup,applySetup,normalizeSetupDraft,normalizeSetupPresets,portableSetupAnswers,setupGroupState,settingsSectionState} from '../src/domain/lumistry-setup.js';
import {THEME_GROUPS,TERM_GROUP_BY_ID,defaultExperiencePreferences,normalizeExperiencePreferences,selectThemeInspiration,normalizeThemeInspiration,allowedTheme,experienceContentGuidance,imageContentGuidance,conversationThemeOpportunity} from '../src/domain/lumistry-experience-preferences.js';
import {ADULT_PREFERENCES,ADULT_PREFERENCE_BY_ID} from '../src/domain/lumistry-adult-preferences.js';
import {presetWorld,worldGenreValues,emptyWorldGuide} from '../src/domain/lumistry-world-catalog.js';
import {selectPopulationPlan,normalizeCandidatePlan} from '../src/domain/lumistry-population.js';
import {discoveryFingerprint} from '../src/domain/lumistry-pipeline.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
const state=()=>normalizeDating({self:{alias:'Owner',age:30},filters:{fields:{occupation:{mode:'preferred',value:'artist'},custom_world:{mode:'preferred',value:'retained'}}},profiles:[{alias:'Existing',age:40,person:{version:1,appearance:{skin:'Accepted skin'}}}]});
const draft=(d=state(),answers:any={})=>({...makeSetupDraft(d,false),answers});
const scope={chatId:'c',characterId:'a'};
const perform=(h:ReturnType<typeof lumistryHarness>,action:string,payload:any={})=>h.app.handle({action,requestId:action,...payload},scope,'u');
function presetStorage(h:ReturnType<typeof lumistryHarness>){let stored:any=null,writes=0;h.h.readSetupPresets=async()=>structuredClone(stored);h.h.writeSetupPresets=async(v:any)=>{writes++;stored=structuredClone(v);};const nativeLock=h.h.withStateLock;h.h.withStateLock=async(key:string,fn:any)=>key==='c/a'?nativeLock(key,fn):fn();return {get value(){return stored},set value(v:any){stored=v},get writes(){return writes}};}
test('24 stable core questions have six four-question sections and nine reviewed groups cover all 451 native IDs',()=>{
 expect(SETUP_QUESTIONS).toHaveLength(24);expect(new Set(SETUP_QUESTIONS.map(q=>q.id)).size).toBe(24);for(const [i] of SETUP_SECTIONS.entries())expect(SETUP_QUESTIONS.filter(q=>q.section===i)).toHaveLength(4);
 expect(THEME_GROUPS).toHaveLength(9);expect(TERM_GROUP_BY_ID.size).toBe(451);for(const t of ADULT_PREFERENCES)expect(THEME_GROUPS.some(g=>g.id===TERM_GROUP_BY_ID.get(t.id))).toBe(true);
});
test('Persona facts are not inferred operator tastes and skipping every answer retains active settings',()=>{
 const d=state(),before=structuredClone(d),s=makeSetupDraft(d);expect(s.answers.connections).toBeUndefined();expect(s.answers.textLevel).toBeUndefined();expect(s.answers.gender).toBe('everyone');
 expect(applySetup(d,draft(d),['discovery','world','experience','app'])).toEqual(d);expect(d).toEqual(before);
});
test('partial application preserves other groups, custom filters, published identity and private interests',()=>{
 const d=state();d.self!.adultPreferences={version:1,terms:{praise_and_compliments:'opt_out'},species:{elf:'unknown'}};const before=structuredClone(d);
 const s=draft(d,{ready:'10',theme:'modern',tone:'chaotic',gender:'woman',textLevel:'explicit',themes:['dynamics'],frequency:'50'}),n=applySetup(d,s,['app']);
 expect(n.generationSettings.creation!.readyTarget).toBe(10);expect(n.theme).toBe('modern');expect(n.filters).toEqual(before.filters);expect(n.generationSettings.experience).toEqual(before.generationSettings.experience);expect(n.experiencePreferences).toBeUndefined();expect(n.self).toEqual(before.self);expect(n.profiles).toEqual(before.profiles);
});
test('connection recommendations use existing inclusive presets and must-haves remain explicit',()=>{
 const d=state(),s=draft(d,{gender:'woman',age:{min:22,max:38},connections:['dating','friendship'],requirements:[]}),n=applySetup(d,s,['discovery']);expect(n.filters.fields.gender).toEqual({mode:'required',value:'woman'});expect(n.filters.fields.intentions.mode).toBe('preferred');expect(n.filters.fields.intentions.value).toContain('friends first');expect(n.filters.fields.intentions.value).toContain('friendship');expect(n.filters.fields.custom_world).toEqual(d.filters.fields.custom_world);expect(n.filters.minAge).toBe(22);
});
test('selected-group conflicts reject atomically but unselected changes never overwrite newer settings',()=>{
 const d=state(),s=draft(d,{tone:'chaotic',theme:'modern'});d.generationSettings.experience!.tone='grounded';const before=structuredClone(d);expect(()=>applySetup(d,s,['experience','app'])).toThrow('Settings changed');expect(d).toEqual(before);expect(applySetup(d,s,['app']).theme).toBe('modern');
});
test('text explicitness does not enable explicit photos and avoided groups never rewrite body facts',()=>{
 const d=state(),n=applySetup(d,draft(d,{textLevel:'explicit',avoid:['nonhuman'],frequency:'50'}),['experience']);expect(n.experiencePreferences!.photos.level).toBe('inherit');expect(n.profiles).toEqual(d.profiles);expect(imageContentGuidance(n.experiencePreferences)).toContain('writing choices do not enable more explicit');expect(experienceContentGuidance(n.experiencePreferences)).toContain('Neutral anatomy');
});
test('required themes conflict locally without weakening required alternatives',()=>{
 const d=state(),term=ADULT_PREFERENCES.find(t=>TERM_GROUP_BY_ID.get(t.id)==='dynamics'&&!t.requiredCapabilities.length)!;d.filters.fields.kinks={mode:'required',value:term.label};const s=draft(d,{avoid:['dynamics'],textLevel:'explicit'});expect(recommendSetup(d,s).conflicts.join(' ')).toContain('Required kink filters');expect(()=>applySetup(d,s,['experience'])).toThrow('Required kink filters');expect(d.filters.fields.kinks.value).toBe(term.label);
});
test('automatic vocabulary preserves custom IDs and availability never assigns personal preference',()=>{
 const d=state(),p=presetWorld('modern_multispecies')!;d.worldGuide={...p.guide,intimacyIds:['anatomy_horns']};d.populationWorld=p.world;const before=structuredClone(d.self),n=applySetup(d,draft(d,{vocabulary:'automatic'}),['world']);expect(worldGenreValues(n.worldGuide,n.populationWorld!).length).toBeGreaterThan(1);expect(n.worldGuide!.intimacyIds).toEqual(['anatomy_horns']);expect(n.self).toEqual(before);expect(d.worldGuide.vocabulary).toBeUndefined();
});
test('draft and content schemas reject malformed/future data rather than clipping boundaries',()=>{
 const d=state();expect(normalizeSetupDraft({...draft(d),answers:{age:{min:17,max:30}}})).toBeUndefined();expect(normalizeSetupDraft({...draft(d),answers:{boundaries:'x'.repeat(2001)}})).toBeUndefined();expect(normalizeExperiencePreferences({...defaultExperiencePreferences(),frequency:100})).toBeUndefined();expect(()=>normalizeSetupPresets({version:2,entries:[]})).toThrow('unsupported');
});
test('portable presets contain answers only and require fresh world review',()=>{
 const a=portableSetupAnswers({gender:'woman',tone:'grounded',preset:'spacefaring',creative:'yes',vocabulary:'automatic',speciesPack:'spacefaring',world:'manual'});expect(a).toEqual({gender:'woman',tone:'grounded'});expect(()=>normalizeSetupPresets({version:1,entries:[{id:'x',name:'x',revision:1,updatedAt:'now',requestId:'a',answers:{personaIdentity:'secret'}}]})).toThrow();
});
test('setup save, resume and atomic apply use no provider and retain spending/identities',async()=>{
 const h=lumistryHarness(1),before=structuredClone(h.state.lumistry!.owner);await perform(h,'setup_start');let s=h.state.lumistry!.owner.setupDraft!;expect(s.revision).toBe(1);s.answers.ready='10';s.step=4;await perform(h,'setup_save',{draft:s,expectedRevision:1});expect(h.state.lumistry!.owner.setupDraft!.step).toBe(4);expect(h.state.lumistry!.owner.generationSettings.creation!.readyTarget).toBe(before.generationSettings.creation!.readyTarget);
 s=h.state.lumistry!.owner.setupDraft!;await perform(h,'setup_apply',{draft:s,expectedRevision:s.revision,groups:['app']});expect(h.state.lumistry!.owner.generationSettings.creation!.readyTarget).toBe(10);expect(h.state.lumistry!.owner.discoveryAccounting).toEqual(before.discoveryAccounting);expect(h.state.lumistry!.owner.self).toEqual(before.self);expect(h.calls).toHaveLength(0);
 await perform(h,'setup_apply',{draft:s,expectedRevision:s.revision,groups:['app']});expect(h.calls).toHaveLength(0);
});
test('stale draft saves and stale selected groups preserve all active settings',async()=>{
 const h=lumistryHarness(1);await perform(h,'setup_start');const s=structuredClone(h.state.lumistry!.owner.setupDraft!);await perform(h,'setup_save',{draft:s,expectedRevision:s.revision});await expect(perform(h,'setup_save',{draft:s,expectedRevision:s.revision})).rejects.toThrow('changed elsewhere');
 const latest=h.state.lumistry!.owner.setupDraft!;latest.answers.ready='25';h.state.lumistry!.owner.theme='modern';const before=structuredClone(h.state.lumistry!.owner);await expect(perform(h,'setup_apply',{draft:latest,expectedRevision:latest.revision,groups:['app']})).rejects.toThrow('Settings changed');expect(h.state.lumistry!.owner).toEqual(before);expect(h.calls).toHaveLength(0);
});
test('presets save/readback/load/delete stay private and load changes only the questionnaire draft',async()=>{
 const h=lumistryHarness(1),storage=presetStorage(h),before=structuredClone(h.state.lumistry!.owner);await perform(h,'setup_preset_save',{name:'Quiet fantasy',answers:{tone:'grounded',preset:'medieval_fantasy',frequency:'0'}});const p=storage.value.entries[0];expect(p.answers).toEqual({tone:'grounded',frequency:'0'});await perform(h,'setup_preset_load',{presetId:p.id,revision:p.revision});expect(h.state.lumistry!.owner.generationSettings).toEqual(before.generationSettings);expect(h.state.lumistry!.owner.setupDraft!.answers).toEqual(p.answers);
 const loaded=h.state.lumistry!.owner.setupDraft!;await perform(h,'setup_apply',{draft:loaded,expectedRevision:loaded.revision,groups:['experience']});expect(h.state.lumistry!.owner.generationSettings.experience!.tone).toBe('grounded');await perform(h,'setup_preset_delete',{presetId:p.id,revision:p.revision});expect(storage.value.entries).toEqual([]);expect(h.calls).toHaveLength(0);
});
test('corrupt preset storage and changed scope cannot overwrite presets or active settings',async()=>{
 const h=lumistryHarness(1),storage=presetStorage(h);storage.value={version:9,entries:[]};await expect(perform(h,'setup_preset_save',{name:'x',answers:{tone:'grounded'}})).rejects.toThrow('unsupported');expect(storage.writes).toBe(0);storage.value=null;h.active=false;await expect(perform(h,'setup_preset_save',{name:'x',answers:{tone:'grounded'}})).rejects.toThrow('phone changed');expect(storage.writes).toBe(0);
});
test('direct saves are scoped and reject concurrent group changes while retaining other staged values',async()=>{
 const h=lumistryHarness(1),d=h.state.lumistry!.owner,baseline=JSON.stringify(settingsSectionState(d,'app'));await perform(h,'setup_direct',{group:'app',baseline,value:{theme:'modern',bank:{enabled:false,chance:0}}});expect(h.state.lumistry!.owner.theme).toBe('modern');expect(h.state.lumistry!.owner.pipeline).toEqual(d.pipeline);await expect(perform(h,'setup_direct',{group:'app',baseline,value:{theme:'sticker',bank:{enabled:true,chance:10}}})).rejects.toThrow('changed elsewhere');expect(h.state.lumistry!.owner.bankDating.enabled).toBe(false);expect(h.calls).toHaveLength(0);
});
test('candidate inspiration is saved, validated and changes to content preferences invalidate stale creation',async()=>{
 const d=state();d.filters.fields={};d.experiencePreferences={...defaultExperiencePreferences(),text:'explicit',frequency:50};const resolver=async(t:string)=>({text:t.replace(/\{\{pick::([^}]+)\}\}/g,(_,s)=>s.split('::')[0]),diagnostics:[]});const plan=await selectPopulationPlan(d,resolver,{chatId:'c',characterId:'a',userId:'u',commit:false},{id:'sample',owner:'owner',createdAt:'now',questions:1,photos:1,distanceKm:1},()=>.4);expect(normalizeCandidatePlan(JSON.parse(JSON.stringify(plan)))).toEqual(JSON.parse(JSON.stringify(plan)));expect(plan.experiencePreferences).toEqual(d.experiencePreferences);const before=discoveryFingerprint(d);d.experiencePreferences.frequency=0;expect(discoveryFingerprint(d)).not.toBe(before);
});
test('conversation opportunities are bounded to one per eight settled messages and never infer interest',()=>{
 const p={...defaultExperiencePreferences(),text:'explicit' as const,frequency:50 as const},world=presetWorld('modern_multispecies')!.world;for(let n=0;n<32;n++){const messages=Array.from({length:n},(_,i)=>({id:String(i),sender:'persona'}));const value=conversationThemeOpportunity(p,world,messages,'thread');if(n<2||n%8!==2)expect(value).toBeUndefined();}expect(selectThemeInspiration({...p,frequency:0},world,'x')).toBeUndefined();
});
test('120,000 seeded theme plans preserve all world/content constraints and include unselected outcomes',()=>{
 for(const id of ['modern_multispecies','medieval_fantasy','spacefaring','low_fantasy'])for(const frequency of [0,20,50] as const){const world=presetWorld(id)!.world,p={...defaultExperiencePreferences(),text:'explicit' as const,frequency,avoid:['dynamics' as const]};let count=0;for(let i=0;i<10000;i++){const selected=selectThemeInspiration(p,world,id+':'+i);if(selected){count++;expect(normalizeThemeInspiration(selected)).toEqual(selected);const term=ADULT_PREFERENCE_BY_ID.get(selected.id)!;expect(allowedTheme(term,p,world)).toBe(true);expect(term.traitConfirmation).toBe(false);expect(selected.group).not.toBe('dynamics');}}expect(count).toBeLessThan(6000);if(frequency===0)expect(count).toBe(0);else expect(count).toBeGreaterThan(1000);}
});

test('prefilled current answers preserve custom sliders and independently configured continuity flags',()=>{
 const d=state();d.generationSettings.experience!.tropeRate=37;d.generationSettings.experience!.socialLift=61;d.pipeline.events=false;d.pipeline.rpBridge=true;const applied=applySetup(d,makeSetupDraft(d),['discovery','world','experience','app']);expect(applied).toEqual(d);
});
test('unrelated app recommendations remain usable when an existing world configuration needs repair',()=>{
 const d=state();d.filters.minAge=150;d.filters.maxAge=170;const before=structuredClone(d.filters);const n=applySetup(d,draft(d,{theme:'modern'}),['app']);expect(n.theme).toBe('modern');expect(n.filters).toEqual(before);expect(recommendSetup(d,draft(d)).conflicts.join(' ')).toContain('reviewed adult ages');
});
test('required kink OR alternatives are pruned against content groups before native selection',async()=>{
 const d=state();d.filters.fields={};const power=ADULT_PREFERENCES.find(t=>TERM_GROUP_BY_ID.get(t.id)==='dynamics'&&!t.requiredCapabilities.length)!,ordinary=ADULT_PREFERENCES.find(t=>TERM_GROUP_BY_ID.get(t.id)==='everyday'&&!t.requiredCapabilities.length)!;
 d.experiencePreferences={...defaultExperiencePreferences(),text:'explicit',avoid:['dynamics']};d.filters.fields.kinks={mode:'required',value:power.label+', '+ordinary.label};const resolver=async(t:string)=>({text:t.replace(/\{\{pick::([^}]+)\}\}/g,(_,s)=>s.split('::')[0]),diagnostics:[]});
 const plan=await selectPopulationPlan(d,resolver,{chatId:'c',characterId:'a',userId:'u',commit:false},{id:'or',owner:'owner',createdAt:'now',questions:1,photos:1,distanceKm:1},()=>.4);expect(plan.selection.requiredFields.kinks).toBe(ordinary.label);expect(d.filters.fields.kinks.value).toContain(power.label);
});

test('photo-only changes inherit existing writing behaviour and skipped text choices never impose a new level',()=>{
 const d=state(),n=applySetup(d,draft(d,{photoLevel:'ordinary',photoBoundaries:'No identifying workplace signs.'}),['experience']);expect(n.experiencePreferences!.text).toBe('inherit');expect(n.experiencePreferences!.frequency).toBeUndefined();expect(n.experiencePreferences!.photos.level).toBe('ordinary');expect(experienceContentGuidance(n.experiencePreferences)).not.toContain('Do not proactively introduce');
});

test('performance conflict checks cover creation settings rather than unrelated filter changes',async()=>{
 const h=lumistryHarness(1),d=h.state.lumistry!.owner,baseline=JSON.stringify(settingsSectionState(d,'discovery'));h.state.lumistry!.owner.generationSettings.creation!.workers=2;await expect(perform(h,'setup_direct',{group:'discovery',baseline,value:{creation:{readyTarget:5,workers:1,photoBatchCap:5}}})).rejects.toThrow('changed elsewhere');expect(h.state.lumistry!.owner.generationSettings.creation!.workers).toBe(2);expect(h.calls).toHaveLength(0);
});
