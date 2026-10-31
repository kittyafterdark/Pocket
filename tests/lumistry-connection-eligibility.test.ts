import {test,expect} from 'bun:test';
import {normalizeDating,normalizeDatingProfile,datingFit,publicDatingProfile} from '../src/domain/lumistry.js';
import {attractionAllows,ownSugarRole,connectionBlockers,interestContext,currentPriorLike,planConnectionFacts,validateReviewedRequirements} from '../src/domain/lumistry-compatibility.js';
import {filterSignature,validateFilterDraft,requiredAlternatives} from '../src/domain/lumistry-filters.js';
import {selectPopulationPlan,populationBrief,normalizeCandidatePlan} from '../src/domain/lumistry-population.js';
import {discoveryFingerprint} from '../src/domain/lumistry-pipeline.js';
import {presetWorld} from '../src/domain/lumistry-world-catalog.js';
import {OCCUPATIONS} from '../src/domain/lumistry-occupations.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {parseAuthoring,projectDossier} from '../src/domain/lumistry-v2.js';
import {dossier} from './fixtures/lumistry-v2.js';
const profile=(fields:any={},extra:any={})=>normalizeDatingProfile({id:'p',alias:'A person',age:30,distanceKm:2,fields, ...extra})!;
const data=(fields:any={},extra:any={})=>normalizeDating({self:profile({gender:'woman',orientation:'lesbian'}),filters:{minAge:30,maxAge:30,fields},...extra});
const resolver=async(t:string)=>({text:t.replace(/\{\{pick::([^}]+)\}\}/g,(_,v)=>v.split('::')[0]),diagnostics:[]});
const scope={chatId:'c',characterId:'a',userId:'u',commit:false} as const;
const identity={id:'connection',owner:'owner',createdAt:'offline',questions:1,photos:1,distanceKm:2};
const plan=(d:ReturnType<typeof data>,brief?:string)=>selectPopulationPlan(d,resolver,scope,{...identity,brief},()=>.3);
test('romantic discovery checks both people; friendship, ace and nonbinary attraction are not guessed',()=>{
 const d=data({gender:{mode:'required',value:'woman'},orientation:{mode:'required',value:'straight, bisexual, lesbian'}});
 expect(datingFit(profile({gender:'woman',orientation:'straight'}),d).eligible).toBe(false);
 for(const orientation of ['bisexual','lesbian'])expect(datingFit(profile({gender:'woman',orientation}),d).eligible).toBe(true);
 expect(attractionAllows(profile({gender:'woman',orientation:'asexual'}),d.self!)).toBeUndefined();
 expect(attractionAllows(profile({gender:'nonbinary',orientation:'straight'}),d.self!)).toBeUndefined();
 expect(attractionAllows(profile({gender:'woman',orientation:'straight'},{privateFields:{romanticAttractedGenders:'woman'}}),d.self!)).toBe(true);
 expect(attractionAllows(profile({gender:'woman',orientation:'straight'},{privateFields:{orientation:'Straight; has not dated recently.'}}),d.self!)).toBe(false);
 d.filters.fields.intentions={mode:'required',value:'friendship'};expect(datingFit(profile({gender:'woman',orientation:'straight',intentions:'friendship'}),d).eligible).toBe(true);
});
test('directional sugar arrangements do not derive provider roles from gender or work',async()=>{
 const d=data({intentions:{mode:'required',value:'sugar relationship'}},{self:profile({gender:'woman',orientation:'bisexual',sugarRole:'sugar baby'})});
 expect(connectionBlockers(profile({intentions:'sugar relationship',sugarRole:'receive support'}),d)).toContain('sugar-role');
 expect(connectionBlockers(profile({intentions:'sugar relationship',sugarRole:'provide support'}),d)).toEqual([]);
 expect(connectionBlockers(profile({intentions:'sugar relationship',occupation:'business owner'}),d)).toEqual([]);
 expect(ownSugarRole(profile({}, {privateFields:{preferences:'I am not a sugar baby.'}}))).toBeUndefined();
 expect(ownSugarRole(profile({}, {privateFields:{preferences:'I want to receive financial support.'}}))).toBe('receive support');
 const p=await plan(d);expect(p.connectionFacts!.sugarRole).toBe('provide support');expect(normalizeCandidatePlan(JSON.parse(JSON.stringify(p)))).toEqual(p);
});
test('clear exclusive commitments exclude new romance while polyamory and friendship remain possible',()=>{
 const d=data(),p=profile({relationshipStatus:'married',monogamy:'monogamous'});expect(connectionBlockers(p,d)).toContain('availability');p.fields.monogamy='polyamorous';expect(connectionBlockers(p,d)).toEqual([]);p.fields.monogamy='monogamous';d.filters.fields.intentions={mode:'required',value:'friendship'};expect(connectionBlockers(p,d)).toEqual([]);
});
test('current parenthood, future plans and partner roles are independent explicit requirements',()=>{
 const d=data({}, {filters:{minAge:18,maxAge:99,connection:{version:1,parenthood:'no children',childrenPlans:'want children',partnerRoles:['dominant']}}});
 const p=profile({children:'no children, want children',sexualRole:'dominant'});expect(datingFit(p,d).eligible).toBe(true);p.fields.children='no children, do not want children';expect(connectionBlockers(p,d)).toContain('children-plans');p.fields.children='no children, want children';p.hiddenFields=['sexualRole'];expect(connectionBlockers(p,d)).toContain('partner-role');
 d.filters.connection=undefined;d.self!.fields.children='want children';d.self!.fields.sexualRole='submissive';expect(connectionBlockers(p,d)).toEqual([]);
});
test('private dependency edits invalidate plans and prior likes without exposing private text',()=>{
 const d=data(),p=profile({gender:'woman',orientation:'lesbian'},{interest:{version:2,status:'matched',seen:true}});p.interest.context=interestContext(d);expect(currentPriorLike(p,d)).toBe(true);const before=discoveryFingerprint(d);d.self!.privateFields.preferences='PRIVATE SENTINEL new boundaries';expect(discoveryFingerprint(d)).not.toBe(before);expect(discoveryFingerprint(d)).not.toContain('PRIVATE SENTINEL');expect(currentPriorLike(p,d)).toBe(false);expect(JSON.stringify(publicDatingProfile(p))).not.toContain('context');p.interest.context=undefined;expect(currentPriorLike(p,d)).toBe(false);
});
test('reviewed vocabulary and enabled species palettes fail locally, preserving legacy saved values',async()=>{
 for(const fields of [{unconfiguredTrait:{mode:'required',value:'anything'}},{orientation:{mode:'required',value:'invented'}},{species:{mode:'required',value:'Elf'}}]){const d=data(fields),before=JSON.stringify(d);expect(validateReviewedRequirements(d)).toBeDefined();await expect(plan(d)).rejects.toThrow();expect(JSON.stringify(d)).toBe(before);}
});
test('work exclusions reject all mapped role categories, including manual briefs',async()=>{
 const d=data({occupation:{mode:'required',value:'hospitality'}});d.filters.excludedValues={occupation:['chef']};const chef=OCCUPATIONS.find(r=>r.categories.includes('chef')&&r.categories.includes('hospitality'))!;await expect(plan(d,'Job: '+chef.title)).rejects.toThrow('excluded');for(let i=0;i<25;i++){const p=await plan(d);expect(p.work.publicCategories).not.toContain('chef');if(p.work.secondaryRoleId)expect(OCCUPATIONS.find(r=>r.id===p.work.secondaryRoleId)!.categories).not.toContain('chef');}
});
test('species alias constraints intersect; separately reviewed cultural ancestry remains separate',async()=>{
 const w=presetWorld('modern_multispecies')!,d=data({}, {populationWorld:w.world,worldGuide:w.guide});d.filters.excludedValues={ancestry:['Human']};expect((await plan(d)).species?.label).not.toBe('Human');
 d.filters.fields.species={mode:'required',value:'Human'};await expect(plan(d)).rejects.toThrow();
 d.filters.excludedValues=undefined;d.worldFields=[{key:'ancestry',label:'Ancestry',options:['Coastal','Highland']}];d.filters.fields.ancestry={mode:'required',value:'Coastal'};const p=await plan(d);expect(p.species!.label).toBe('Human');expect(p.selection.requiredFields.ancestry).toBe('Coastal');
 d.worldFields=[];d.filters.fields.ancestry.value='Elf';await expect(plan(d)).rejects.toThrow();
});
test('gender and metric decimal aliases agree at eligibility and selection',async()=>{
 const d=data({gender:{mode:'required',value:'woman'},height:{mode:'required',value:'175 cm'}});expect(datingFit(profile({gender:'female',orientation:'lesbian',height:'1,75 m'}),d).eligible).toBe(true);d.filters.fields.gender.value='female';const p=await plan(d);expect(p.selection.requiredFields.gender).toBe('woman');
});
test('preferred generation guidance stays soft and is present in the saved authoring brief',async()=>{
 const d=data({interests:{mode:'preferred',value:'hiking'},occupation:{mode:'preferred',value:'healthcare'}}),p=await plan(d);expect(JSON.stringify(populationBrief(p))).toContain('hiking');expect(p.selection.requiredFields.interests).toBeUndefined();
});
test('connection validation ignores key insertion order but rejects unreviewed shape',()=>{
 const d=data();d.filters.connection={childrenPlans:'want children',sugarRole:'receive support',version:1};expect(validateFilterDraft(d.filters)).toBeUndefined();const first=filterSignature(d.filters,true);d.filters.connection={version:1,sugarRole:'receive support',childrenPlans:'want children'};expect(filterSignature(d.filters,true)).toBe(first);(d.filters.connection as any).unexpected='oops';expect(validateFilterDraft(d.filters)).toBeDefined();
});
test('saving a complete draft can clear roles and exclusions without generation or lost custom fields',async()=>{
 const f=lumistryHarness(1),d=f.state.lumistry!.owner;d.filters.connection={version:1,sugarRole:'receive support'};d.filters.excludedValues={smoking:['regularly']};d.filters.fields.savedCustom={mode:'any',value:'kept'};const filters=structuredClone(d.filters),baseline=filterSignature(d.filters);delete filters.connection;delete filters.excludedValues;await f.app.handle({action:'filters',filters,baseline,requestId:'clear'},{chatId:'c',characterId:'a'},'u');expect(f.state.lumistry!.owner.filters.connection).toBeUndefined();expect(f.state.lumistry!.owner.filters.excludedValues).toBeUndefined();expect(f.state.lumistry!.owner.filters.fields.savedCustom.value).toBe('kept');expect(f.calls).toEqual([]);
});
test('stale likes defer to native activity, valid reciprocal likes match locally with no calls',async()=>{
 for(const fresh of [false,true]){const f=lumistryHarness(1),d=f.state.lumistry!.owner,p=d.profiles[0];p.interest={version:2,seen:true,status:'matched',...(fresh?{context:interestContext(d)}:{})};await f.app.handle({action:'like',profileId:p.id,requestId:'like'},{chatId:'c',characterId:'a'},'u');expect(f.state.lumistry!.owner.decisions[0].status).toBe(fresh?'matched':'pending');expect(f.calls).toEqual([]);}
});
test('joint OR sampling has zero hard violations across 10,000 draws per representative connection',()=>{
 let seed=12345;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const self of [{gender:'woman',orientation:'lesbian'},{gender:'man',orientation:'straight'},{gender:'nonbinary',orientation:'bisexual'},{gender:'woman',orientation:'asexual'}]){
  const d=data({gender:{mode:'required',value:'woman, man, nonbinary'},orientation:{mode:'required',value:'straight, bisexual, lesbian, asexual'},intentions:{mode:'required',value:'sugar relationship'},relationshipStatus:{mode:'required',value:'single, married'},monogamy:{mode:'required',value:'monogamous, polyamorous'}},{self:profile({...self,sugarRole:'receive support'})});let failures=0;const outcomes=new Set<string>();let sugarFailures=0;
  for(let i=0;i<10000;i++){const facts=planConnectionFacts(d,k=>requiredAlternatives(d.filters,k),random);if(connectionBlockers({fields:facts,privateFields:{},hiddenFields:[]} as any,d).length)failures++;outcomes.add(facts.orientation);if(facts.sugarRole!=='provide support')sugarFailures++;}expect(failures).toBe(0);expect(sugarFailures).toBe(0);expect(outcomes.size).toBeGreaterThan(1);
 }
},60000);

test('required partner facts project and disclose together without adding a compulsory dossier field',async()=>{
 const d=data({}, {self:null,filters:{minAge:29,maxAge:29,connection:{version:1,parenthood:'no children',childrenPlans:'want children',partnerRoles:['dominant']}}});const p=await plan(d);
 expect(p.selection.requiredFields.children).toBe('no children, want children');expect(p.selection.requiredFields.sexualRole).toBe('dominant');
 const a:any={version:2,dossier:parseAuthoring(dossier(),'dossier','stop'),photos:[],gallery:[],provenance:{}};const projected=projectDossier(a,p.selection.requiredFields,'slot',2,undefined,p);expect(projected.row.fields.children).toBe('no children, want children');expect(projected.row.hiddenFields).not.toContain('children');expect(projected.row.hiddenFields).not.toContain('sexualRole');expect(projected.issues.filter(i=>i.code==='connection-fact')).toEqual([]);
});
test('next invocation refreshes policy for new slots while retaining accepted candidate plans',async()=>{
 const h=lumistryHarness(4),d=h.state.lumistry!.owner;d.generationSettings.creation={readyTarget:5,photoBatchCap:5,workers:1};h.generate=async()=>{throw new Error('offline stop')};await h.run();const old=structuredClone(h.state.lumistry!.owner.discoveryJob!);const live=h.state.lumistry!.owner;live.generationSettings.adultJobs=false;live.generationSettings.allTropes=true;live.generationSettings.experience={...live.generationSettings.experience!,tone:'grounded'};live.generationSettings.creation!.readyTarget=10;await h.run();const next=h.state.lumistry!.owner.discoveryJob!;expect(next.id).toBe(old.id);expect(next.adultJobs).toBe(false);expect(next.allTropes).toBe(true);expect(next.experience.tone).toBe('grounded');expect(next.slots[0].plan).toEqual(old.slots[0].plan);expect(next.slots).toHaveLength(6);
});
