import {personaPicker} from './persona-picker.js'
import {button,el} from '../shared.js'
import type {FreeformDirectory} from '../../domain/freeform.js'

export function renderSessionManager(directory:FreeformDirectory|null, drafts:Map<string,string>, busy:boolean, error:string, actions:{rename(id:string,name:string):void; remove(id:string):void; refresh():void}, filter:{personaId:string;query:string}={personaId:'',query:''}):HTMLElement {
  const root=el('section','pocket-session-manager')
  const title=el('h2','','Manage sessions');title.tabIndex=-1
  root.append(title,el('p','pocket-portal-intro','Rename your worlds or remove sessions you no longer need. Copied roleplay chats stay separate.'))
  const refresh=button('Refresh sessions','pocket-portal-action');refresh.disabled=busy;refresh.onclick=actions.refresh;root.append(refresh)
  const list=el('div','pocket-session-manager');root.append(list)
  const picker=personaPicker(directory?.personas || [],filter.personaId,filter.query,id=>{filter.personaId=id;render()},query=>{filter.query=query},true);root.insertBefore(picker.root,list)
  const render=()=>{
  list.replaceChildren()
  if(!directory)list.append(el('p','','Loading sessions…'))
  else if(!directory.sessions.length)list.append(el('p','','No Freeform sessions yet.'))
  const visible=(directory?.sessions || []).filter(s=>!filter.personaId || s.personaId===filter.personaId)
  if(directory?.sessions.length && !visible.length)list.append(el('p','','No sessions for this Persona.'))
  for(const session of visible) {
    const card=el('section','pocket-session-card'),heading=el('h3','',session.name)
    const label=el('label','pocket-lock-field',`Name for ${session.name}`),name=el('input')
    name.value=drafts.get(session.id) ?? session.name;name.maxLength=80;name.disabled=busy
    name.dataset.sessionName=session.id;name.oninput=()=>drafts.set(session.id,name.value)
    label.append(name)
    const save=button('Save name','pocket-portal-action');save.setAttribute('aria-label',`Save name for ${session.name}`);save.disabled=busy
    save.onclick=()=>actions.rename(session.id,name.value)
    const remove=button('Delete session','pocket-portal-action');remove.setAttribute('aria-label',`Delete session ${session.name}`);remove.disabled=busy;remove.onclick=()=>actions.remove(session.id)
    const controls=el('div','pocket-session-actions');controls.append(save,remove)
    card.append(heading,el('p','pocket-portal-intro',session.personaName),label,controls);list.append(card)
  }
  };render()
  const status=el('p','pocket-lock-status',error);status.setAttribute('role',error?'alert':'status');root.append(status)
  return root
}

export const SESSION_MANAGER_STYLES=`
.pocket-session-manager{display:grid;gap:16px;padding-top:20px}.pocket-session-card{display:grid;gap:12px;padding:18px;border:1px solid var(--pocket-border);border-radius:14px;background:var(--pocket-surface);min-width:0}.pocket-session-card h3{margin:0;font-size:16px;overflow-wrap:anywhere}.pocket-session-card .pocket-portal-intro{margin:0}.pocket-session-actions{display:flex;flex-wrap:wrap;gap:8px}.pocket-session-actions button{flex:1 1 120px}
`
