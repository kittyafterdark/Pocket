import {el,button} from '../shared.js';
import {lovePreferences} from '../../domain/lumistry-love.js';
import {normalizeExperience} from '../../domain/lumistry-experience.js';
import {settingsSectionState,type ApplyGroup} from '../../domain/lumistry-setup.js';
import type {DatingState} from '../../domain/lumistry.js';
import type {DatingHost} from './lumistry.js';
/** Compare projected drafts to canonical SAVED values, never to the draft at page mount. */
export function settingsPayload(h:DatingHost,d:DatingState,group:ApplyGroup,saved=false):Record<string,unknown>{
 const ui=saved?undefined:h.ui,g=ui?.generationDraft||d.generationSettings;
 if(group==='experience')return {love:ui?.loveDraft||lovePreferences(d.relationships.preferences),experience:normalizeExperience(g.experience),content:ui?.contentEdited||d.experiencePreferences?ui?.contentDraft||d.experiencePreferences:undefined,pipeline:ui?.pipelineDraft||d.pipeline};
 if(group==='world')return {populationWorld:ui?.populationWorldDraft||d.populationWorld,worldGuide:ui?.worldGuideDraft||d.worldGuide,worldContext:ui?.worldContextDraft??d.worldContext,worldFields:ui?.worldFieldsDraft??d.worldFields,appearanceDiversity:g.appearanceDiversity!==false,adultJobs:g.adultJobs!==false,allTropes:g.allTropes===true};
 if(group==='discovery')return {creation:g.creation};
 return {theme:ui?.appThemeDraft??d.theme,bank:ui?.bankDraft||{enabled:d.bankDating.enabled,chance:d.bankDating.chance}};
}
export function attachSettingsSaveBar(h:DatingHost,box:HTMLElement,d:DatingState,group:ApplyGroup,label:string,discard:()=>void):void {
 const saved=JSON.stringify(settingsPayload(h,d,group,true)),baseline=h.ui.settingsBaselines?.[group]||JSON.stringify(settingsSectionState(d,group));
 const conflict=baseline!==JSON.stringify(settingsSectionState(d,group));
 const bar=el('div','lumistry-save-bar'),status=el('span','lp-copy'),save=button(label,'lp-button lp-button-primary'),reset=button('Discard changes','lp-button');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');save.type=reset.type='button';
 save.addEventListener('click',()=>{if(!save.disabled)h.action('setup_direct',{group,baseline,value:settingsPayload(h,d,group)});});reset.addEventListener('click',()=>{if(!reset.disabled)discard();});
 const sync=()=>{const dirty=JSON.stringify(settingsPayload(h,d,group))!==saved;bar.hidden=!dirty&&!conflict;status.textContent=conflict?'Saved values changed elsewhere. Your draft is kept; discard to reload.':h.ui.busy?'Saving…':dirty?'Unsaved changes':'';save.disabled=!!h.ui.busy||!dirty||conflict;reset.disabled=!!h.ui.busy;};
 for(const control of box.querySelectorAll('input,textarea,select'))for(const type of ['input','change'])control.addEventListener(type,sync);box.addEventListener('input',sync);box.addEventListener('change',sync);box.addEventListener('click',sync);bar.append(status,save,reset);box.append(bar);sync();
}
