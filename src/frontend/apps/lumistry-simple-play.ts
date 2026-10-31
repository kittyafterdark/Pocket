import {attachSettingsSaveBar} from './lumistry-save-bar.js';
import {acknowledgeSetupSettings} from './lumistry-settings-state.js';
import {lovePreferenceControls} from '../components/lumistry-love.js';
import {lovePreferences} from '../../domain/lumistry-love.js';
import {el,button} from '../shared.js';
import {settingsSectionState} from '../../domain/lumistry-setup.js';
import {defaultExperiencePreferences} from '../../domain/lumistry-experience-preferences.js';
import {normalizeExperience,EXPERIENCE_PRESETS} from '../../domain/lumistry-experience.js';
import type {DatingHost} from './lumistry.js';
import type {DatingState} from '../../domain/lumistry.js';
function select(label:string,value:string,choices:readonly (readonly [string,string])[],change:(v:string)=>void){const l=el('label','lp-label',label),s=el('select','lp-select');s.setAttribute('aria-label',label);for(const [id,name] of choices){const o=el('option','',name);o.value=id;s.append(o);}s.value=value;s.addEventListener('change',()=>change(s.value));l.append(s);return l;}
function act(label:string,fn:()=>void){const b=button(label,'lp-button');b.addEventListener('click',fn);return b;}
/** Ordinary controls project existing canonical settings; no independent setup store. */
export function renderSimplePlay(h:DatingHost,d:DatingState):HTMLElement {
 const box=el('section','lp-card lp-stack lumistry-simple-play');
 h.ui.settingsBaselines||={};h.ui.settingsBaselines.experience||=JSON.stringify(settingsSectionState(d,'experience'));
 h.ui.generationDraft||=structuredClone(d.generationSettings);h.ui.contentDraft||=structuredClone(d.experiencePreferences||defaultExperiencePreferences());
 h.ui.loveDraft||=lovePreferences(d.relationships.preferences);
 const generation=h.ui.generationDraft,p=h.ui.contentDraft;
 generation.experience||=normalizeExperience();
 const changed=()=>{h.ui.contentEdited=true;};
 box.append(el('h2','lp-title','How I want to play'),el('p','lp-copy','Choose the feel of new writing. Your Persona’s interests and other people’s choices stay separate.'),select('Tone',generation.experience.tone,[['grounded','Grounded'],['balanced','Balanced'],['chaotic','Chaotic']],value=>{const tone=value as keyof typeof EXPERIENCE_PRESETS;generation.experience={...normalizeExperience(generation.experience),tone,...EXPERIENCE_PRESETS[tone]};}),select('Writing level',p.text,[['inherit','Keep my current setting'],['nonsexual','Nonsexual'],['suggestive','Flirting and suggestive'],['explicit','Explicit when appropriate']],v=>{p.text=v as typeof p.text;changed();}),select('Adult themes',String(p.frequency??''),[['','Keep my current setting'],['0','Only when I ask'],['20','Occasionally'],['50','Often, when appropriate']],v=>{if(v)p.frequency=Number(v) as 0|20|50;else delete p.frequency;changed();}));
 const boundary=el('label','lp-label','Anything to avoid?'),input=el('textarea','lp-textarea');input.value=p.boundaries;input.rows=3;input.placeholder='Optional boundaries, in your own words';input.addEventListener('input',()=>{p.boundaries=input.value;changed();});boundary.append(input);box.append(boundary);
 const photos=el('details');photos.dataset.lumistryDetail='simple-photo-settings';photos.append(el('summary','','Photo choices · optional'),el('p','lp-copy','Writing choices never enable explicit photos.'),select('Photo content',p.photos.level,[['inherit','Keep my current photo setting'],['ordinary','Ordinary photos'],['suggestive','Suggestive when appropriate'],['explicit','Explicit when appropriate']],v=>{p.photos.level=v as typeof p.photos.level;changed();}));box.append(photos);
 box.append(lovePreferenceControls(h.ui.loveDraft,()=>{}));
 attachSettingsSaveBar(h,box,d,'experience','Save play preferences',()=>{acknowledgeSetupSettings(h.ui,d,['experience'],true);h.render();});
 const more=el('details');more.dataset.lumistryDetail='simple-play-details';more.append(el('summary','','More control · optional'),el('p','lp-copy',`${p.themes==='selected'?p.groups.length+' permitted theme groups':'Compatible theme variety'} · ${p.avoid.length} avoided groups. Existing detailed choices stay saved.`),act('Theme groups and conversation details',()=>{h.ui.tab='settings';h.ui.settingsPage='experience';h.render();}),act('My personal interests',()=>{h.ui.selfPage='interests';h.render();}),act('Use saved play preferences',()=>{h.ui.loveDraft=undefined;h.ui.contentDraft=undefined;h.ui.contentEdited=undefined;h.ui.pipelineDraft=undefined;if(h.ui.generationDraft)h.ui.generationDraft.experience=structuredClone(d.generationSettings.experience);delete h.ui.settingsBaselines!.experience;h.render();}));box.append(more);
 if(h.ui.busy)for(const c of box.querySelectorAll<HTMLInputElement>('input,textarea,select,button'))c.disabled=true;
 return box;
}
