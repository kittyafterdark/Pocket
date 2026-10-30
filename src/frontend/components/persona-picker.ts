import type {FreeformPersona} from '../../domain/freeform.js'
import {el} from '../shared.js'

export function personaPicker(personas:FreeformPersona[], selected:string, query:string, choose:(id:string)=>void, search:(query:string)=>void, all=false):{root:HTMLElement;select:HTMLSelectElement} {
  const root=el('div','pocket-lock-field'),find=el('input'),select=el('select')
  find.type='search';find.value=query;find.placeholder='Find a persona';find.dataset.freeformField=all?'manager-persona-search':'lock-persona-search'
  select.dataset.freeformField=all?'manager-persona':'persona'
  const update=()=>{
    select.replaceChildren(new Option(all?'All personas':'Choose a persona',''))
    const matching=personas.filter(p=>p.name.toLocaleLowerCase().includes(find.value.trim().toLocaleLowerCase()))
    const current=personas.find(p=>p.id===selected)
    if(current && !matching.some(p=>p.id===selected))select.append(new Option(current.name+' · selected',current.id))
    for(const persona of matching)select.append(new Option(persona.name,persona.id))
    select.value=selected
  }
  find.oninput=()=>{search(find.value);update()}
  select.onchange=()=>{selected=select.value;choose(selected)}
  const searchLabel=el('label','pocket-lock-field',all?'Search session personas':'Search personas'),selectLabel=el('label','pocket-lock-field',all?'Filter sessions by persona':'Choose persona')
  searchLabel.append(find);selectLabel.append(select);root.append(searchLabel,selectLabel);update();return {root,select}
}
