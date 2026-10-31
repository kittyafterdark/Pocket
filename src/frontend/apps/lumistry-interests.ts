import {el,button} from '../shared.js';
import {ADULT_PREFERENCES,ADULT_PREFERENCE_BY_ID,ADULT_PREFERENCE_CATEGORIES,ADULT_PREFERENCE_STATES,preferenceEligible,type AdultPreferenceState} from '../../domain/lumistry-adult-preferences.js';
import {SPECIES_CATALOG,speciesRequirements} from '../../domain/lumistry-species.js';
import {allPreferenceChanges,preferenceDraftDirty,setPreference,type PreferenceDraft,type PreferenceKind} from '../../domain/lumistry-preference-draft.js';
import type {PopulationWorld} from '../../domain/lumistry-world-core.js';
import type {WorldGuide} from '../../domain/lumistry-world-catalog.js';
interface Entry {id:string;label:string;group:string;note:string;search:string;}
const STEP=12;
const STATE_NAME=(id:string,name:string)=>id==='private_not_shared'?'Private in character':name;
/** One screen for the private adult-interest and species-attraction libraries. Simple search-first surface over the same draft; advanced bulk tools remain optional. */
export function renderMyInterests(d:PreferenceDraft,world:PopulationWorld,guide:WorldGuide|undefined,save:()=>void,discard:()=>void,busy=false,advanced?:(kind:PreferenceKind)=>void):HTMLElement {
 const root=el('section','lp-stack lumistry-wl lumistry-interests');root.dataset.preferenceLibrary='interests';
 root.append(el('h2','lp-title','My interests'),el('p','lp-copy','Your Persona’s private tastes and boundaries, not requirements for every match. Leave anything unspecified. These selections do not become public card text or Discover filters. Interest is not consent.'));
 const privacy=el('details','lumistry-wl-item');privacy.append(el('summary','','What does saving change?'),el('p','lp-copy','Saving changes only this Persona’s private interests in this chat, not filters, world facts, other people or history. Relevant items may enter model/provider context. “Private in character” means do not disclose it in character; it is still sent to the provider.'));root.append(privacy);
 const bar=el('div','lumistry-save-bar'),status=el('span','lp-copy'),saveButton=button('Save','lp-button lp-button-primary'),discardButton=button('Discard changes','lp-button');
 status.setAttribute('role','status');saveButton.type='button';discardButton.type='button';saveButton.addEventListener('click',()=>save());discardButton.addEventListener('click',()=>discard());const undo=button('Undo last change','lp-button');undo.type='button';undo.addEventListener('click',()=>{const previous=d.undo.pop();if(previous){d.value=previous;refreshers.forEach(fn=>fn());onChange();}});const refreshers:Array<()=>void>=[];bar.append(status,saveButton,discardButton,undo);
 const onChange=()=>{const n=allPreferenceChanges(d).length,dirty=preferenceDraftDirty(d);bar.hidden=!dirty;status.textContent=dirty?`${n} unsaved change${n===1?'':'s'}`:'';saveButton.disabled=busy||!dirty;discardButton.disabled=busy;undo.disabled=busy||!d.undo.length;};
 const chip=(label:string,run:()=>void)=>{const b=button(label,'lp-button lumistry-wl-chip');b.type='button';b.setAttribute('aria-pressed','false');b.addEventListener('click',run);return b;};
 const entriesFor=(kind:PreferenceKind):Entry[]=>{
  const known=new Set<string>(),rows:Entry[]=[],enabled=new Set(guide?.species.map(s=>s.id)||[]);
  const add=(id:string,label:string,group:string,note:string,description='')=>{known.add(id);rows.push({id,label,group,note,search:[id,label,group,description].join(' ').toLowerCase()});};
  if(kind==='terms')for(const t of ADULT_PREFERENCES)add(t.id,t.label,ADULT_PREFERENCE_CATEGORIES[t.category as keyof typeof ADULT_PREFERENCE_CATEGORIES]?.name||t.category,preferenceEligible(t,world)?'':'needs a world capability',t.description);
  else{for(const s of SPECIES_CATALOG){const required=speciesRequirements(s.id),compatible=!required.length||required.some(set=>set.every(c=>world.capabilities.includes(c)));add(s.id,s.label,s.group||s.family,enabled.has(s.id)?'':compatible?'not in your reviewed population':'needs a world capability',s.appearance);}
   for(const s of guide?.species||[])if(!known.has(s.id))add(s.id,s.label,'Custom / lore species','',s.appearance);
   rows.sort((a,b)=>Number(!enabled.has(a.id))-Number(!enabled.has(b.id)));}
  for(const id of Object.keys(d.value[kind]))if(!known.has(id))add(id,ADULT_PREFERENCE_BY_ID.get(id)?.label||id,'Saved reference','saved reference, kept as it is');
  return rows;
 };
 const section=(kind:PreferenceKind,title:string,hint:string)=>{
  const rows=entriesFor(kind),byId=new Map(rows.map(r=>[r.id,r])),box=el('section','lumistry-wl-section');box.dataset.interestKind=kind;
  const picks=el('div','lumistry-wl-picked'),search=el('input','lp-input'),results=el('div','lumistry-wl-chips'),browseBox=el('div','lp-stack');
  search.type='search';search.placeholder=kind==='terms'?'Search adult interests':'Search species';search.setAttribute('aria-label','Search '+title);
  d.views||={};const view=d.views[kind]||={search:'',shown:0,category:''};search.value=view.search;let shown=view.shown,category=view.category;const taken=()=>new Set(Object.keys(d.value[kind]));
  const pick=(id:string)=>{setPreference(d,kind,id,'opt_in');paint();onChange();};
  const drawPicks=()=>{picks.replaceChildren();const q=search.value.trim().toLowerCase(),ids=Object.keys(d.value[kind]).filter(id=>!q||(byId.get(id)?.search||id).includes(q)).sort((a,b)=>(byId.get(a)?.label||a).localeCompare(byId.get(b)?.label||b));
   if(!ids.length)picks.append(el('p','lp-copy','Nothing added yet.'));
   for(const id of ids.slice(0,view.picked||STEP)){const e=byId.get(id),label=e?.label||id,row=el('div','lumistry-wl-picked-row');row.append(el('strong','',label));if(e?.note)row.append(el('small','lp-muted',e.note));
    const select=el('select','lp-select');select.setAttribute('aria-label',label+' state');for(const [v,name] of ADULT_PREFERENCE_STATES){const o=el('option','',STATE_NAME(v,name));o.value=v;select.append(o);}select.value=d.value[kind][id];select.addEventListener('change',()=>{setPreference(d,kind,id,select.value as AdultPreferenceState);onChange();});
    const remove=button('Remove','lp-button');remove.type='button';remove.setAttribute('aria-label','Remove '+label);remove.addEventListener('click',()=>{setPreference(d,kind,id,'');paint();onChange();});row.append(select,remove);picks.append(row);}if(ids.length>(view.picked||STEP))picks.append(chip('Show 12 more saved choices',()=>{view.picked=(view.picked||STEP)+STEP;drawPicks();}));};
  const drawResults=()=>{results.replaceChildren();const q=search.value.trim().toLowerCase();if(!q)return;const t=taken(),starts=(r:Entry)=>r.label.toLowerCase().startsWith(q)?0:1,found=rows.filter(r=>!t.has(r.id)&&r.search.includes(q)).sort((a,b)=>starts(a)-starts(b)).slice(0,STEP);
   for(const r of found)results.append(chip('+ '+r.label,()=>{pick(r.id);search.focus();}));if(!found.length)results.append(el('span','lp-copy','No matches.'));if(rows.filter(r=>!t.has(r.id)&&r.search.includes(q)).length>STEP)results.append(el('p','lp-copy','Showing the first 12 results. Refine your search or browse the full library for more.'));};
  const drawBrowse=()=>{browseBox.replaceChildren();
   if(!shown){const open=button('Browse suggestions','lp-button');open.type='button';open.addEventListener('click',()=>{shown=view.shown=STEP;drawBrowse();});browseBox.append(open);return;}
   if(kind==='terms'){const select=el('select','lp-select'),label=el('label','lp-label','Category');select.setAttribute('aria-label','Category');for(const [v,name] of [['','All categories'],...[...new Set(rows.map(r=>r.group))].map(g=>[g,g])]){const o=el('option','',name);o.value=v;select.append(o);}select.value=category;select.addEventListener('change',()=>{category=select.value;shown=view.shown=STEP;drawBrowse();});label.append(select);browseBox.append(label);}
   const t=taken(),pool=rows.filter(r=>!t.has(r.id)&&(!category||r.group===category)),list=el('div','lumistry-wl-chips');for(const r of pool.slice(0,shown))list.append(chip('+ '+r.label,()=>pick(r.id)));browseBox.append(list);
   if(pool.length>shown){const more=button('Show 12 more','lp-button');more.type='button';more.addEventListener('click',()=>{shown+=STEP;view.shown=shown;drawBrowse();});browseBox.append(more);}};
  const paint=()=>{drawPicks();drawResults();drawBrowse();};
  refreshers.push(paint);search.addEventListener('input',()=>{view.search=search.value;view.picked=STEP;drawPicks();drawResults();});paint();box.append(el('h3','',title),el('p','lp-copy',hint),picks,search,results,browseBox);if(advanced){const tools=el('details');tools.append(el('summary','','More tools'),chip('Open full library & bulk tools',()=>advanced(kind)));box.append(tools);}return box;
 };
 root.append(section('terms','Adult interests','Add only what matters. Each entry can be an interest, a boundary or a private fact; you do not need to complete this list.'),section('species','Species','Which species your character is drawn to. This is separate from who Discover shows you.'),bar);
 onChange();
 if(busy)for(const control of root.querySelectorAll<HTMLInputElement>('input,select,button'))control.disabled=true;
 return root;
}
