import {normalizeAuthoringPolicy} from '../../domain/authoring-policy.js';
import {button,el} from '../shared.js';
import type {DatingHost} from './lumistry.js';

function persist(h:DatingHost,patch:Partial<ReturnType<typeof normalizeAuthoringPolicy>>):void {
 const settings={...normalizeAuthoringPolicy(h.connectionSettings),...patch};
 h.connectionSettings=settings;h.saveConnectionSettings?.(settings);
}

export function connectionOverrideControls(h:DatingHost):HTMLElement {
 const box=el('section','lp-card lp-stack'),label=el('label','lp-row'),input=el('input');
 const settings=normalizeAuthoringPolicy(h.connectionSettings);
 input.type='checkbox';input.checked=settings.overrideConnection;input.disabled=!h.saveConnectionSettings;
 input.addEventListener('change',()=>{persist(h,{overrideConnection:input.checked});});
 label.append(input,el('span','','Override connection settings for the app'));
 const open=button('Connection settings','lp-button');open.addEventListener('click',()=>{h.ui.settingsPage='connection';h.ui.tab='settings';h.render();});
 box.append(label,el('p','lp-copy','Applies to Lumistry text generation and chats. Off follows Pocket’s connection and model; your app override stays saved. Image generation uses Pocket’s image settings. Changes save immediately.'),open);
 return box;
}

export function renderLumistryConnection(h:DatingHost):HTMLElement {
 const box=el('section','lp-stack');box.append(el('h1','lp-title','Connection'));
 const controls=connectionOverrideControls(h);controls.querySelector('button')?.remove();box.append(controls);
 let settings=normalizeAuthoringPolicy(h.connectionSettings);
 const save=(patch:Partial<typeof settings>)=>{persist(h,patch);settings=normalizeAuthoringPolicy(h.connectionSettings);};
 const fields=el('fieldset','lp-card lp-stack');fields.append(el('legend','','App connection'));
 fields.disabled=!settings.overrideConnection||!h.saveConnectionSettings;
 const connection=el('select','lp-select');connection.append(new Option('Choose a connection',''));
 for(const entry of h.connections||[])connection.append(new Option(`${entry.name} · ${entry.model||entry.provider}`,entry.id));
 if(settings.connectionId&&!(h.connections||[]).some(c=>c.id===settings.connectionId))connection.append(new Option('Saved connection (unavailable)',settings.connectionId));
 connection.value=settings.connectionId;
 const connectionLabel=el('label','lp-label','Connection profile');connectionLabel.append(connection);
 const model=el('input','lp-input');model.value=settings.model;model.placeholder='Use connection model';
 const modelLabel=el('label','lp-label','Model override');modelLabel.append(model);
 connection.addEventListener('change',()=>{model.value='';save({connectionId:connection.value,model:''});});
 model.addEventListener('change',()=>save({model:model.value.trim()}));
 fields.append(connectionLabel,modelLabel,el('p','lp-copy','Leave the model blank to use the selected connection’s model. An unavailable connection reports an error instead of switching providers.'));
 const toggle=controls.querySelector('input')!;
 toggle.addEventListener('change',()=>{settings.overrideConnection=toggle.checked;fields.disabled=!toggle.checked||!h.saveConnectionSettings;});
 box.append(fields);
 const authoring=el('section','lp-card lp-stack');authoring.append(el('h2','lp-title','Profile authoring'),el('p','lp-copy','These controls apply to profile writing and image inspection, independently of the connection toggle. Chats keep Pocket’s reasoning and output settings.'));
 for(const [key,title,options] of [
  ['reasoning','Reasoning effort',[['inherit','Follow connection'],['off','Off'],['low','Low']]],
  ['transport','Response mode',[['response','Complete response'],['stream','Stream response']]],
 ] as const){
  const label=el('label','lp-label',title),select=el('select','lp-select');for(const [value,name] of options)select.append(new Option(name,value));select.value=settings[key];select.disabled=!h.saveConnectionSettings;
  select.addEventListener('change',()=>save({[key]:select.value}));label.append(select);authoring.append(label);
 }
 for(const [key,title,min,max] of [['outputTokens','Output token limit (0 follows connection)',0,32768],['timeoutSeconds','Request timeout (seconds)',15,900]] as const){
  const label=el('label','lp-label',title),input=el('input','lp-input');input.type='number';input.min=String(min);input.max=String(max);input.step='1';input.value=String(settings[key]);input.disabled=!h.saveConnectionSettings;
  input.addEventListener('change',()=>{if(input.value!==''&&input.checkValidity())save({[key]:Number(input.value)});});label.append(input);authoring.append(label);
 }
 box.append(authoring);return box;
}
