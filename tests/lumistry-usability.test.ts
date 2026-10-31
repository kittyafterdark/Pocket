import {test,expect} from 'bun:test';
import {JSDOM} from 'jsdom';
import {renderMyInterests} from '../src/frontend/apps/lumistry-interests.js';
import {attachSettingsSaveBar} from '../src/frontend/apps/lumistry-save-bar.js';
import {newDatingUI,renderLumistry} from '../src/frontend/apps/lumistry.js';
import {makePreferenceDraft,setPreference,preferenceSignature} from '../src/domain/lumistry-preference-draft.js';
import {settingsSectionState} from '../src/domain/lumistry-setup.js';
import {ADULT_PREFERENCES} from '../src/domain/lumistry-adult-preferences.js';
import {SPECIES_CATALOG} from '../src/domain/lumistry-species.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
async function dom(run:(document:Document)=>void|Promise<void>){const d=new JSDOM('<body/>'),previous={document:globalThis.document,HTMLInputElement:globalThis.HTMLInputElement};Object.assign(globalThis,{document:d.window.document,HTMLInputElement:d.window.HTMLInputElement});try{await run(d.window.document);}finally{Object.assign(globalThis,previous);d.window.close();}}
const click=(root:Element,label:string)=>{const b=[...root.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===label);expect(b).toBeDefined();b!.click();};
const change=(node:Element,type='input')=>node.dispatchEvent(new node.ownerDocument.defaultView!.Event(type,{bubbles:true}));
function fixture(){const h=lumistryHarness(0),actions:any[]=[],ui=newDatingUI();const host={state:h.state,owner:'owner',ui,generation:true,images:false,backgroundEnabled:false,automaticReplies:false,action:(...args:any[])=>actions.push(args),render:()=>{},back:()=>{},openConversation:()=>{},gallery:()=>{}};return {h,host,actions,d:h.state.lumistry!.owner};}
test('private interests use a small search-first screen and keep both maps in one local undoable draft',()=>dom(()=>{
 const {d}=fixture(),draft=makePreferenceDraft('scope','terms'),advanced:string[]=[],root=renderMyInterests(draft,d.populationWorld!,d.worldGuide,()=>{},()=>{},false,kind=>advanced.push(kind));
 expect(root.querySelectorAll('.lumistry-wl-picked-row')).toHaveLength(0);expect(root.querySelectorAll('.lumistry-library-row')).toHaveLength(0);expect(root.querySelector<HTMLElement>('.lumistry-save-bar')!.hidden).toBe(true);
 for(const [kind,row] of [['terms',ADULT_PREFERENCES[0]],['species',SPECIES_CATALOG[0]]] as const){const sec=root.querySelector(`[data-interest-kind=${kind}]`)!;const search=sec.querySelector<HTMLInputElement>('input[type=search]')!;search.value=row.label;change(search);click(sec,'+ '+row.label);expect(draft.value[kind][row.id]).toBe('opt_in');}
 expect(root.querySelector<HTMLElement>('.lumistry-save-bar')!.hidden).toBe(false);click(root,'Undo last change');expect(Object.keys(draft.value.terms)).toHaveLength(1);expect(Object.keys(draft.value.species)).toHaveLength(0);click(root,'Open full library & bulk tools');expect(advanced).toEqual(['terms']);
}));
test('combined interests save atomically without changing filters, public identity or buying calls; stale maps are protected',async()=>{
 const {h,d}=fixture(),draft=makePreferenceDraft('scope','terms',d.self!.adultPreferences),filters=JSON.stringify(d.filters),bio=d.self!.bio;
 setPreference(draft,'terms',ADULT_PREFERENCES[0].id,'opt_out');setPreference(draft,'species',SPECIES_CATALOG[0].id,'opt_in');
 await h.app.handle({action:'self_preferences',kind:'both',baseline:draft.baseline,preferences:draft.value},{chatId:'c',characterId:'a'},'u');
 expect(h.state.lumistry!.owner.self!.adultPreferences).toEqual(draft.value);expect(JSON.stringify(h.state.lumistry!.owner.filters)).toBe(filters);expect(h.state.lumistry!.owner.self!.bio).toBe(bio);expect(h.calls).toEqual([]);
 const before=structuredClone(h.state);await expect(h.app.handle({action:'self_preferences',kind:'both',baseline:draft.baseline,preferences:draft.value},{chatId:'c',characterId:'a'},'u')).rejects.toThrow('changed');expect(h.state).toEqual(before);
});
test('a reopened dirty settings draft remains visibly unsaved; opening unchanged settings does not create a Save action',()=>dom(()=>{
 const {d,host,actions}=fixture();host.ui.generationDraft=structuredClone(d.generationSettings);host.ui.settingsBaselines={app:JSON.stringify(settingsSectionState(d,'app'))};host.ui.appThemeDraft=d.theme==='modern'?'sticker':'modern';
 const page=document.createElement('div');attachSettingsSaveBar(host as any,page,d,'app','Save app',()=>{});expect(page.querySelector<HTMLElement>('.lumistry-save-bar')!.hidden).toBe(false);click(page,'Save app');expect(actions[0][1].value.theme).toBe(host.ui.appThemeDraft);
 host.ui.appThemeDraft=d.theme;const pristine=document.createElement('div');attachSettingsSaveBar(host as any,pristine,d,'app','Save app',()=>{});expect(pristine.querySelector<HTMLElement>('.lumistry-save-bar')!.hidden).toBe(true);expect(pristine.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true);
}));
test('external settings changes preserve the draft but disable stale Save',()=>dom(()=>{
 const {d,host,actions}=fixture();host.ui.settingsBaselines={app:JSON.stringify(settingsSectionState(d,'app'))};host.ui.appThemeDraft='modern';d.theme='distillery';const page=document.createElement('div');attachSettingsSaveBar(host as any,page,d,'app','Save app',()=>{});expect(page.textContent).toContain('changed elsewhere');expect(page.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true);click(page,'Save app');expect(actions).toEqual([]);expect(host.ui.appThemeDraft).toBe('modern');
}));
test('My interests and advanced libraries retain the same multi-map draft through navigation',()=>dom(()=>{
 const {host,actions}=fixture();host.ui.tab='self';host.ui.selfPage='interests';let root=renderLumistry(host as any);const draft=host.ui.preferenceDraft!;setPreference(draft,'species',SPECIES_CATALOG[0].id,'opt_in');setPreference(draft,'terms',ADULT_PREFERENCES[0].id,'opt_out');
 click(root,'Open full library & bulk tools');root=renderLumistry(host as any);expect(host.ui.preferenceDraft).toBe(draft);expect(root.querySelector('.lumistry-library-row')).not.toBeNull();click(root,'Back to My interests');root=renderLumistry(host as any);expect(host.ui.preferenceDraft).toBe(draft);expect(root.querySelectorAll('.lumistry-wl-picked-row')).toHaveLength(2);expect(actions).toEqual([]);
}));
test('large saved-interest maps stay bounded and any saved entry remains directly searchable',()=>dom(()=>{
 const {d}=fixture(),draft=makePreferenceDraft('scope','terms',{version:1,terms:Object.fromEntries(ADULT_PREFERENCES.map(p=>[p.id,'opt_in'])),species:Object.fromEntries(SPECIES_CATALOG.map(p=>[p.id,'opt_in']))});
 const root=renderMyInterests(draft,d.populationWorld!,d.worldGuide,()=>{},()=>{});expect(root.querySelectorAll('.lumistry-wl-picked-row')).toHaveLength(24);
 const section=root.querySelector('[data-interest-kind=terms]')!,search=section.querySelector<HTMLInputElement>('input[type=search]')!;search.value=ADULT_PREFERENCES.at(-1)!.label;change(search);expect(section.textContent).toContain(ADULT_PREFERENCES.at(-1)!.label);expect(section.querySelectorAll('.lumistry-wl-picked-row').length).toBeLessThanOrEqual(12);expect(Object.keys(draft.value.terms)).toHaveLength(451);
}));
