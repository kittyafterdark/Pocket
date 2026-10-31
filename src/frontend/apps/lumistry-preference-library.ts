import {el,button} from '../shared.js';
import {frontendPerformance,performanceNow} from '../../domain/performance.js';
import {ADULT_PREFERENCES,ADULT_PREFERENCE_BY_ID,ADULT_PREFERENCE_CATEGORIES,ADULT_PREFERENCE_STATES,preferenceEligible,type AdultPreferenceState} from '../../domain/lumistry-adult-preferences.js';
import {SPECIES_CATALOG,speciesRequirements} from '../../domain/lumistry-species.js';
import {assignPreferences,preferenceChanges,preferenceDraftDirty,type PreferenceDraft} from '../../domain/lumistry-preference-draft.js';
import type {PopulationWorld} from '../../domain/lumistry-world-core.js';
import type {WorldGuide} from '../../domain/lumistry-world-catalog.js';
export const LIBRARY_PAGE_SIZE=24;
interface Row {id:string;label:string;group:string;description:string;status:string;search:string;}
const names=new Map(ADULT_PREFERENCE_STATES.map(([id,label])=>[id,id==='private_not_shared'?'In-character secret · do not disclose':label]));
const stateName=(state:string)=>names.get(state as AdultPreferenceState)||'Not recorded';
function click(label:string,fn:()=>void):HTMLButtonElement {const b=button(label,'lp-button');b.addEventListener('click',fn);return b;}
function select(label:string,options:Array<[string,string]>,value:string,change:(v:string)=>void):HTMLLabelElement {
 const box=el('label','lp-label',label),input=el('select','lp-select');input.setAttribute('aria-label',label);
 for(const [v,name] of options){const o=el('option','',name);o.value=v;input.append(o);}input.value=value;input.addEventListener('change',()=>change(input.value));box.append(input);return box;
}
export function renderPreferenceLibrary(d:PreferenceDraft,world:PopulationWorld,guide:WorldGuide|undefined,save:()=>void,cancel:()=>void,busy=false,onViewChange:()=>void=()=>{}):HTMLElement {
 const started=performanceNow(),root=el('section','lp-stack lumistry-library'),terms=d.kind==='terms',heading=terms?'Adult Preferences':'Species Attraction';
 root.dataset.preferenceLibrary=d.kind;
 root.append(el('h2','lp-title',heading),el('p','lp-copy',terms?'Your private interests and boundaries. Interest is not consent and never assigns an interest to another person.':'Who your character is interested in. These records are separate from discovery requirements, your own species and the world population.'));
 const impact=el('div','lp-card lp-stack');impact.append(el('strong','','What will this change?'),el('p','lp-copy','Saving changes only this Persona’s preference library in this chat. It does not change filters, world facts, other people or existing history. Relevant records may enter model/provider context. In-character secret means do not disclose in-character; it does not mean never transmitted to the provider.'));root.append(impact);
 const known=new Set<string>(),rows:Row[]=[],enabled=new Set(guide?.species.map(s=>s.id)||[]);
 const add=(id:string,label:string,group:string,description:string,status:string)=>{known.add(id);rows.push({id,label,group,description,status,search:[id,label,group,description].join(' ').toLowerCase()});};
 if(terms)for(const t of ADULT_PREFERENCES)add(t.id,t.label,ADULT_PREFERENCE_CATEGORIES[t.category as keyof typeof ADULT_PREFERENCE_CATEGORIES]?.name||t.category,t.description,preferenceEligible(t,world)?'Compatible vocabulary':'Needs world capability');
 else {for(const s of SPECIES_CATALOG){const required=speciesRequirements(s.id);const compatible=!required.length||required.some(set=>set.every(c=>world.capabilities.includes(c)));add(s.id,s.label,s.group||s.family,s.appearance,enabled.has(s.id)?'In reviewed population':compatible?'Not in reviewed population; lore review needed':'Needs world capability');}
 for(const s of guide?.species||[])if(!known.has(s.id))add(s.id,s.label,'Custom / lore species',s.appearance,'In reviewed population');}
 for(const id of Object.keys(d.value[d.kind]))if(!known.has(id))add(id,ADULT_PREFERENCE_BY_ID.get(id)?.label||id,'Retained saved references','An existing custom or legacy preference. Its exact saved ID and state are preserved.','Saved reference');
 const summary=el('p','lp-copy'),status=el('p','lp-copy');status.tabIndex=-1;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const updateSummary=()=>{const map=d.value[d.kind];summary.textContent=`${rows.length} choices · ${Object.keys(map).length} recorded · ${preferenceChanges(d).length} unsaved changes · ${d.selected.length} selected`;};
 const controls=el('div','lp-stack'),search=el('input','lp-input');search.type='search';search.placeholder='Search names, descriptions and categories';search.setAttribute('aria-label','Search '+heading);search.value=d.search;
 controls.append(search,select('Category',[['','All categories'],...[...new Set(rows.map(r=>r.group))].map(g=>[g,g] as [string,string])],d.category,v=>{d.category=v;d.page=0;onViewChange();paint();}),select('Recorded state',[['','All choices'],['recorded','Recorded only'],['unrecorded','Not recorded'],...ADULT_PREFERENCE_STATES.map(x=>[...x] as [string,string])],d.state,v=>{d.state=v;d.page=0;paint();}),select('World status',[['','Any world status'],...[...new Set(rows.map(r=>r.status))].map(s=>[s,s] as [string,string])],d.world,v=>{d.world=v;d.page=0;paint();}));
 const matches=()=>rows.filter(r=>(!d.search||r.search.includes(d.search.toLowerCase().trim()))&&(!d.category||r.group===d.category)&&(!d.world||r.status===d.world)&&(!d.state||(d.state==='recorded'?!!d.value[d.kind][r.id]:d.state==='unrecorded'?!d.value[d.kind][r.id]:d.value[d.kind][r.id]===d.state)));
 const bulk=el('div','lp-card lp-stack'),selection=el('div','lumistry-library-actions');
 const selectCategory=click('Select category',()=>{d.selected=rows.filter(r=>r.group===d.category).map(r=>r.id);paint();});
 const selectMode=click('Select multiple',()=>{d.selecting=!d.selecting;paint();});
 selection.append(click('Select all '+rows.length,()=>{d.selected=rows.map(r=>r.id);paint();}),click('Select filtered',()=>{d.selected=matches().map(r=>r.id);paint();}),selectCategory,click('Clear selection',()=>{d.selected=[];paint();}));
 let assignment:AdultPreferenceState|''='opt_in';const assign=click('Apply to selected',()=>{assignPreferences(d,d.selected,assignment);paint();});
 bulk.append(el('strong','','Bulk editing'),el('p','lp-copy','Checkboxes select rows for an operation. They do not express interest.'),selection,select('Set selected to',[...ADULT_PREFERENCE_STATES.map(x=>[...x] as [string,string]),['','Remove recorded state']],assignment,v=>{assignment=v as AdultPreferenceState|'';}),assign);
 const undo=click('Undo last change',()=>{const prior=d.undo.pop();if(prior)d.value=prior;d.review=false;paint();});const tools=el('div','lumistry-library-actions');tools.append(selectMode,undo);
 const list=el('ul','lumistry-library-list'),info=el('div','lp-card lp-stack');info.hidden=true;
 const pages=el('div','lumistry-library-actions'),previous=click('Previous page',()=>{d.page--;paint();status.focus();}),next=click('Next page',()=>{d.page++;paint();status.focus();});pages.append(previous,next);
 const review=el('div','lp-card lp-stack'),footer=el('div','lumistry-library-actions');
 const reviewButton=click('Review changes',()=>{d.review=true;d.page=0;paint();}),saveButton=click('Save preferences',save),cancelButton=click('Cancel editing',cancel);
 footer.append(reviewButton,saveButton,cancelButton);
 root.append(summary,controls,tools,bulk,status,list,info,pages,review,footer);
 const paint=()=>{
  const start=performanceNow(),filtered=matches(),changes=preferenceChanges(d),count=d.review?changes.length:filtered.length;
  d.page=Math.max(0,Math.min(d.page,Math.max(0,Math.ceil(count/LIBRARY_PAGE_SIZE)-1)));updateSummary();
  status.textContent=`${d.review?'Reviewing '+changes.length+' changes':filtered.length+' matching choices'} · page ${d.page+1} of ${Math.max(1,Math.ceil(count/LIBRARY_PAGE_SIZE))}.`;
  assign.disabled=busy||!d.selected.length;undo.disabled=busy||!d.undo.length;reviewButton.disabled=busy||!preferenceDraftDirty(d);saveButton.hidden=!d.review;saveButton.disabled=busy||!preferenceDraftDirty(d);cancelButton.disabled=busy;
  controls.hidden=d.review;bulk.hidden=d.review||!d.selecting;tools.hidden=d.review;selectMode.textContent=d.selecting?'Finish selecting':'Select multiple';selectMode.setAttribute('aria-pressed',String(!!d.selecting));selectCategory.disabled=!d.category;list.hidden=d.review;review.hidden=!d.review;info.hidden=true;
  previous.disabled=d.page===0;next.disabled=(d.page+1)*LIBRARY_PAGE_SIZE>=count;
  list.replaceChildren();review.replaceChildren();
  if(d.review){review.append(el('h3','lp-title','Review before saving'),el('p','lp-copy','Only the changes below will be applied. Existing filters, images and world selections stay saved.'),click('Continue editing',()=>{d.review=false;d.page=0;paint();}));
   for(const c of changes.slice(d.page*LIBRARY_PAGE_SIZE,(d.page+1)*LIBRARY_PAGE_SIZE))review.append(el('p','lp-copy',`${rows.find(r=>r.id===c.id)?.label||c.id}: ${stateName(c.before)} → ${stateName(c.after)}`));
  }else for(const row of filtered.slice(d.page*LIBRARY_PAGE_SIZE,(d.page+1)*LIBRARY_PAGE_SIZE)){
   const item=el('li','lp-card lp-stack lumistry-library-row'),label=el('label','lp-row'),check=el('input');check.type='checkbox';check.hidden=!d.selecting;check.checked=d.selected.includes(row.id);check.setAttribute('aria-label','Select '+row.label);check.addEventListener('change',()=>{d.selected=d.selected.filter(id=>id!==row.id);if(check.checked)d.selected.push(row.id);updateSummary();assign.disabled=busy||!d.selected.length;});label.append(check,el('strong','',row.label));item.append(label,el('span','lp-muted',row.group+' · '+row.status));
   const stateControl=select(row.label+' preference',[['','Not recorded'],...ADULT_PREFERENCE_STATES.map(x=>[...x] as [string,string])],d.value[d.kind][row.id]||'',value=>{assignPreferences(d,[row.id],value as AdultPreferenceState|'');updateSummary();undo.disabled=false;reviewButton.disabled=!preferenceDraftDirty(d);if(d.state){paint();status.focus();}});
   const about=click('About '+row.label,()=>{info.replaceChildren(el('h3','lp-title',row.label),el('p','lp-copy',row.description),el('p','lp-copy',row.status),el('p','lp-copy','World availability does not establish anyone’s anatomy, interest or permission. Relevant individual traits require independent confirmation.'),click('Close details',()=>{info.hidden=true;about.focus({preventScroll:true});}));item.after(info);info.hidden=false;info.querySelector('button')?.focus();});item.append(stateControl,about);list.append(item);
  }
  if(!count&&!d.review)list.append(el('li','lp-copy','No choices match. Clear search or filters to browse the complete library.'));
  frontendPerformance.record('ui','library.patch',performanceNow()-start,list.childElementCount);
 };
 search.addEventListener('input',()=>{d.search=search.value;d.page=0;onViewChange();paint();});paint();
 if(busy)for(const control of root.querySelectorAll<HTMLInputElement>('input,select,button'))control.disabled=true;
 frontendPerformance.record('ui','library.open',performanceNow()-started);return root;
}
