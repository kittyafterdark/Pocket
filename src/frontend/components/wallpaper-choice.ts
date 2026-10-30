import {button,el} from '../shared.js'
export interface WallpaperDestination { target:'device-home'|'device-chat'|'persona-home'|'persona-chat';personaId?:string;personaName?:string }
let serial=0
export function wallpaperDestinationLabel(value:WallpaperDestination):string {
  return value.target.startsWith('persona-')?`${value.personaName||'Persona'}’s ${value.target.endsWith('chat')?'chat':'home'} wallpaper`:`default ${value.target.endsWith('chat')?'chat':'home'} wallpaper`
}
/** Selection is captured when the chooser opens, independent of later persona changes. */
export function wallpaperChoice(persona:{id:string;name:string}|null,apply:(button:HTMLButtonElement,value:WallpaperDestination)=>void) {
  const root=el('div','lp-wallpaper-choice'),id='pocket-wallpaper-'+(++serial)
  const place=el('fieldset'),scope=el('fieldset');place.append(el('legend','','Use for'));scope.append(el('legend','','Apply to'))
  const radios=(parent:HTMLElement,name:string,items:Array<[string,string]>,initial:string)=>{
    const controls:HTMLInputElement[]=[]
    for(const [value,title] of items){const label=el('label'),input=el('input');input.type='radio';input.name=id+name;input.value=value;input.checked=value===initial;label.append(input,el('span','',title));parent.append(label);controls.push(input)}
    return ()=>controls.find(control=>control.checked)!.value
  }
  const destination=radios(place,'place',[['home','Home screen'],['chat','Message chats']],'home')
  const selectedScope=radios(scope,'scope',[...(persona?[['persona',persona.name+' only'] as [string,string]]:[]),['device','All phones · default']],persona?'persona':'device')
  const save=button('Set wallpaper','lp-button lp-button-primary')
  save.onclick=()=>apply(save,{target:`${selectedScope()==='persona'?'persona':'device'}-${destination()}` as WallpaperDestination['target'],...(selectedScope()==='persona'?{personaId:persona!.id,personaName:persona!.name}:{})})
  root.append(place,scope,save);return root
}
