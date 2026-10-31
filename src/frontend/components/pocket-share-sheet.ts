import type { PhoneState } from '../../types.js'
import { pocketShareSources, createPocketCapture, type PocketCaptureRequest } from '../../domain/pocket-sharing.js'
import { renderLumistryCapture } from './lumistry-capture.js'
import { button,el } from '../shared.js'
import { fieldBlock } from './ui.js'
import { conversationVisibleOnDevice } from '../../domain/device.js'

export function pocketShareSheet(state:PhoneState,send:(conversationId:string,request:PocketCaptureRequest)=>void,selectedTarget='',draft={sourceId:'',target:'',ids:[] as string[],caption:''}):HTMLDivElement {
  const root=el('div','lp-pocket-share'),sources=pocketShareSources(state),source=el('select','lp-select'),target=el('select','lp-select')
  const hero=el('div','lp-clippings-hero'),intro=el('div'),art=el('div','lp-clippings-art')
  intro.append(el('span','lp-share-eyebrow','POCKET CLIPPINGS'),el('h2','','Too good to keep to yourself.'),el('p','','Collect a few little moments. Send them as one card.'))
  art.setAttribute('aria-hidden','true');art.append(el('span','lp-clipping-back','♡'),el('span','lp-clipping-front','hey,\nlook at this ↗'))
  hero.append(intro,art);root.append(hero)
  for(const s of sources)source.append(new Option(s.title,s.id))
  target.append(new Option('Choose a conversation',''))
  for(const c of state.conversations)if(!c.archived&&conversationVisibleOnDevice(state,c,state.pocketPersonaActorId))target.append(new Option(`${c.channel==='dating'?'Lumistry · ':''}${c.title}`,c.id))
  target.value=selectedTarget||draft.target
  if(sources.some(s=>s.id===draft.sourceId))source.value=draft.sourceId
  const choices=el('fieldset','lp-pocket-share-choices'),legend=el('legend','','Choose up to six items'),list=el('div','lp-clipping-list'),preview=el('div','lp-pocket-share-preview'),caption=el('textarea','lp-textarea'),status=el('p','lp-copy'),submit=button('Send selected excerpt','lp-button lp-button-primary')
  const count=el('span','lp-selection-count'),clear=button('Clear','lp-share-clear'),toolbar=el('div','lp-clipping-toolbar')
  toolbar.append(count,clear);choices.append(legend,toolbar,list)
  caption.rows=2;caption.maxLength=500;caption.value=draft.caption;caption.placeholder='A little note to go with it…';status.setAttribute('role','status');let selected=new Set<string>(draft.ids)
  const update=()=>{
    draft.sourceId=source.value;draft.target=target.value;draft.ids=[...selected];draft.caption=caption.value
    count.textContent=`${selected.size} / 6 selected`;clear.disabled=!selected.size
    for(const check of list.querySelectorAll<HTMLInputElement>('input'))check.disabled=!check.checked&&selected.size>=6
    preview.replaceChildren(el('span','lp-share-eyebrow','THE CARD THEY’LL SEE'));submit.disabled=true;status.textContent=''
    if(!selected.size){const empty=el('div','lp-clipping-empty');empty.append(el('span','','✂'),el('strong','','Your little collection starts here'),el('p','','Pick a few messages, notes or moments above.'));preview.append(empty);return}
    try{preview.append(renderLumistryCapture(createPocketCapture(state,{sourceId:source.value,ids:[...selected],caption:caption.value})));submit.disabled=!target.value}catch(error){status.textContent=error instanceof Error?error.message:'Could not preview the selection.'}
  }
  const populate=()=>{
    list.replaceChildren()
    for(const item of sources.find(s=>s.id===source.value)?.items.slice(-100)||[]){
      const label=el('label','lp-clipping-choice'),check=el('input'),copy=el('span','lp-clipping-copy'),avatar=el('span','lp-clipping-avatar',Array.from(item.speaker||'?')[0])
      avatar.setAttribute('aria-hidden','true');check.type='checkbox';check.checked=selected.has(item.id)
      copy.append(el('strong','',item.speaker),el('span','',item.text||item.photoDescription));label.append(check,avatar,copy)
      check.onchange=()=>{if(check.checked)selected.add(item.id);else selected.delete(item.id);update()};list.append(label)
    }
    if(!list.childElementCount)list.append(el('p','lp-copy','Nothing to clip here yet. Try another source.'))
    update()
  }
  clear.onclick=()=>{selected.clear();populate()}
  source.onchange=()=>{selected=new Set();populate()};target.onchange=update;caption.oninput=update
  submit.onclick=()=>{if(!target.value||submit.disabled)return;submit.disabled=true;send(target.value,{sourceId:source.value,ids:[...selected],caption:caption.value})}
  const pickers=el('div','lp-clipping-pickers');pickers.append(fieldBlock('Source app or conversation',source),fieldBlock('Send to',target))
  const footer=el('div','lp-share-send');footer.append(status,submit,el('p','lp-share-disclaimer','A readable excerpt card, rather than a screen image.'))
  root.append(pickers,choices,fieldBlock('Caption',caption),preview,footer)
  populate();if(!sources.length){status.textContent='Create a note, message, post, or event before sharing.';source.disabled=true}
  return root
}
