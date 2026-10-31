import {expect,test} from 'bun:test';
import {filterSignature,filterPreview,inspectFilterFit,validateFilterDraft,INTENTION_PRESETS} from '../src/domain/lumistry-filters.js';
import {normalizeDating,normalizeDatingProfile,datingFit} from '../src/domain/lumistry.js';
import {newDatingUI} from '../src/frontend/apps/lumistry.js';
import {acknowledgeFilterSave,filterScopeKey,leaveFilters} from '../src/frontend/apps/lumistry-filters.js';
const p=(extra:any={})=>normalizeDatingProfile({id:'p',alias:'Nora',age:30,distanceKm:10,fields:{gender:'woman',intentions:'casual dating'},...extra})!;
const sample=()=>normalizeDating({filters:{minAge:22,maxAge:38,maxKm:50,fields:{gender:{mode:'required',value:'woman'},intentions:{mode:'preferred',value:INTENTION_PRESETS['Broad dating'].join(', ')}}}}).filters;
test('simple canonical presets use existing vocabulary, preserving soft intentions and strict gender',()=>{
 const f=sample(),d=normalizeDating({filters:f});expect(datingFit(p(),d).eligible).toBe(true);expect(datingFit(p({fields:{gender:'woman'}}),d)).toEqual({eligible:true,score:1});
 expect(datingFit(p({fields:{gender:'man'}}),d).eligible).toBe(false);expect(datingFit(p({hiddenFields:['gender']}),d).eligible).toBe(false);
 expect(f.fields.intentions.value).toBe('long-term relationship, life partner, short-term dating, casual dating, friends first');expect(INTENTION_PRESETS['Sugar relationship']).toEqual(['sugar relationship']);
});
test('filter eligibility and explanations agree for inclusive ranges, distance and hidden strict fields',()=>{
 const d=normalizeDating({filters:sample()});
 for(const candidate of [p({age:22,distanceKm:50}),p({age:38}),p({age:39}),p({distanceKm:51}),p({hiddenFields:['gender']})])expect(datingFit(candidate,d).eligible).toBe(inspectFilterFit(candidate,d.filters).eligible);
 expect(datingFit(p({age:22,distanceKm:50}),d).eligible).toBe(true);expect(datingFit(p({age:38}),d).eligible).toBe(true);
 expect(inspectFilterFit(p({fields:{}}),d.filters).blockers).toEqual([{kind:'undisclosed',key:'gender'}]);
});
test('adult validation and extended ages retain numerical thresholds including zero distance',()=>{
 for(const [minAge,maxAge,maxKm] of [[17,38,50],[30,22,50],[18,99999,50],[18,99,-1],[18,99,NaN]])expect(validateFilterDraft({...sample(),minAge,maxAge,maxKm})).toBeDefined();
 expect(validateFilterDraft({...sample(),minAge:100,maxAge:2000,maxKm:0})).toBeUndefined();expect(normalizeDatingProfile({alias:'Child',age:17})).toBeNull();
});
test('preview counts only unseen saved profiles and does not overstate recoveries when blockers overlap',()=>{
 const d=normalizeDating({filters:sample(),profiles:[p({id:'both',age:40,distanceKm:70}),p({id:'distance',distanceKm:70}),p({id:'seen'}),p({id:'unknown',hiddenFields:['gender']})],decisions:[{profileId:'seen',action:'like',status:'pending'}]});
 const before=JSON.stringify(d),result=filterPreview(d,d.filters);expect(result.unseen).toBe(3);expect(result.eligible).toBe(0);
 expect(result.reasons.find(r=>r.kind==='distance')).toEqual({kind:'distance',blocked:2,recoverable:1});expect(result.reasons.find(r=>r.kind==='age')?.recoverable).toBe(0);expect(JSON.stringify(d)).toBe(before);
});
test('meaning signatures ignore inactive entries, field order and OR order without mutating stored legacy data',()=>{
 const first=sample(),next=structuredClone(first);next.fields={legacy:{mode:'any',value:'kept'},intentions:{...first.fields.intentions,value:[...INTENTION_PRESETS['Broad dating']].reverse().join(', ')},gender:structuredClone(first.fields.gender)};
 expect(filterSignature(first,true)).toBe(filterSignature(next,true));expect(filterSignature(first)).not.toBe(filterSignature(next));expect(next.fields.legacy.value).toBe('kept');
 next.fields.gender.mode='preferred';expect(filterSignature(first,true)).not.toBe(filterSignature(next,true));
});
test('save acknowledgements require completion, matching state and the correct chat/owner scope',()=>{
 const ui=newDatingUI(),scope=filterScopeKey('c','a','owner'),baseline=normalizeDating(null).filters,draft=sample();ui.tab='filters';ui.filterScope=scope;ui.filterSessions={[scope]:{baseline,draft,pending:structuredClone(draft)}};ui.filterDraft=draft;
 expect(acknowledgeFilterSave(ui,draft,scope)).toBe(false);expect(acknowledgeFilterSave(ui,draft,filterScopeKey('c','a','other'),true)).toBe(false);
 expect(acknowledgeFilterSave(ui,baseline,scope,true)).toBe(false);expect(ui.filterDraft).toBe(draft);
 expect(acknowledgeFilterSave(ui,draft,scope)).toBe(true);expect(ui.filterDraft).toBeUndefined();expect(ui.tab).toBe('discover');expect(ui).not.toHaveProperty('discoveryRequested');
});
test('dirty filter navigation requires an explicit disposition and keeps the draft untouched',()=>{
 const ui=newDatingUI(),scope=filterScopeKey('c','a','owner'),baseline=normalizeDating(null).filters;ui.tab='filters';ui.filterScope=scope;ui.filterSessions={[scope]:{baseline,draft:sample()}};let navigated=false;
 expect(leaveFilters(ui,()=>navigated=true)).toBe(false);expect(navigated).toBe(false);expect(ui.filterSessions[scope].draft.minAge).toBe(22);expect(ui.filterLeave).toBeDefined();
});
test('future exclusions are not inferred from the legacy dealbreakers category',()=>{
 const d=normalizeDating({filters:{fields:{dealbreakers:{mode:'required',value:'smoking'}}}});
 expect(datingFit(p({fields:{dealbreakers:'smoking',smoking:'regularly'}}),d).eligible).toBe(true);
 expect(datingFit(p({fields:{smoking:'never'}}),d).eligible).toBe(false);
});
