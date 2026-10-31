import type { StickerGenerationPreview } from '../../domain/sticker-packs.js'
import { hiddenDatingContact } from '../../domain/lumistry.js'
import type { PhoneState } from '../../types.js'
import { nativeFor, quizResult, type NativeApp, type PocketBrowser, type PocketBirthday, type PocketQuiz } from '../../domain/native-apps.js'
import { conversationVisibleOnDevice } from '../../domain/device.js'
import { button, el } from '../shared.js'
import { fieldBlock } from '../components/ui.js'

export interface NativeAppUI { stickerPreview?:StickerGenerationPreview; stickerProgress?:{url?:string;step?:number;totalSteps?:number}; panels:Record<string,string>; selected:Record<string,string>; drafts:Record<string,string>; private:boolean; privateBrowser?:PocketBrowser; suggestions?:Array<PocketBirthday&{evidence:string}>; quizAnswers:Record<string,number[]> }
export const newNativeUI=():NativeAppUI=>({panels:{},selected:{},drafts:{},private:false,quizAnswers:{}})
export interface NativeHost {
  app:NativeApp; state:PhoneState; ui:NativeAppUI; busy:boolean; status:string; error:string; imageGeneration:boolean; images:boolean
  page(title:string,subtitle:string):{page:HTMLDivElement;content:HTMLDivElement}
  render():void
  action(app:NativeApp,action:string,data?:Record<string,any>,done?:()=>void):void
  gallery(description:string,caption:string,packId?:string,name?:string):void
  upload(description:string,caption:string,packId?:string,name?:string):void
  openConversation(id:string):void
  openApp?(app:NativeApp):void
  dismissError?():void
}
export const act=(label:string,run:()=>void,primary=false)=>{const b=button(label,`lp-button${primary?' lp-button-primary':''}`);b.onclick=run;return b}
export const card=(title:string,copy='')=>{const root=el('section','lp-native-card');root.append(el('h3','',title));if(copy)root.append(el('p','lp-copy',copy));return root}
export function input(h:NativeHost,key:string,label:string,type='text',initial=''):HTMLLabelElement {
  const control=el('input','lp-input');control.type=type;if(type==='number')control.step='any';control.name=key;control.value=h.ui.drafts[key]??initial;control.oninput=()=>{h.ui.drafts[key]=control.value};return fieldBlock(label,control)
}
export function textarea(h:NativeHost,key:string,label:string):HTMLLabelElement {const control=el('textarea','lp-textarea');control.rows=3;control.name=key;control.value=h.ui.drafts[key]||'';control.oninput=()=>{h.ui.drafts[key]=control.value};return fieldBlock(label,control)}
export function select(h:NativeHost,key:string,label:string,options:Array<[string,string]>,initial=''):HTMLLabelElement {
  const control=el('select','lp-select');control.name=key;for(const [value,label]of options)control.append(new Option(label,value));control.value=h.ui.drafts[key]??(initial||options[0]?.[0]||'');control.onchange=()=>{h.ui.drafts[key]=control.value};return fieldBlock(label,control)
}
export function form(h:NativeHost,title:string,fields:HTMLElement[],submitLabel:string,send:(data:Record<string,string>)=>void):HTMLElement {
  const root=card(title),form=el('form','lp-native-form'),submit=button(submitLabel,'lp-button lp-button-primary');submit.type='submit';submit.disabled=h.busy
  form.append(...fields,submit);form.onsubmit=event=>{event.preventDefault();if(h.busy)return;send(Object.fromEntries(new FormData(form).entries()) as Record<string,string>)};root.append(form);return root
}
export function conversations(h:NativeHost,key='recipient'):HTMLLabelElement {
  return select(h,key,'Send to',[['','Choose a conversation'],...h.state.conversations.filter(c=>!c.archived&&conversationVisibleOnDevice(h.state,c,h.state.pocketPersonaActorId)).map(c=>[c.id,c.title] as [string,string])])
}
const refresh=(h:NativeHost,action:string,data:Record<string,any>={})=>h.action(h.app,action,data)
export function webData(h:NativeHost):PocketBrowser {return h.ui.private&&h.app==='browser'?h.ui.privateBrowser||{pages:[],places:[],tabs:[],activeTab:'',history:[],bookmarks:[],quizzes:[]}:nativeFor(h.state).browser}
export function webAction(h:NativeHost,action:string,data:Record<string,any>={}):void {refresh(h,action,{...data,private:h.app==='browser'&&h.ui.private})}
export function shareWeb(h:NativeHost,root:HTMLElement,id:string):void {const recipient=conversations(h,'web-recipient');root.append(recipient,act('Share in conversation',()=>webAction(h,'share',{id,conversationId:h.ui.drafts['web-recipient']})))}
export function quiz(h:NativeHost,root:HTMLElement,value:PocketQuiz):void {
  const result=quizResult(value),intro=card(value.title,value.summary);root.append(intro)
  const form=el('form','lp-native-form'),answers=h.ui.quizAnswers[value.id]||(h.ui.quizAnswers[value.id]=value.answers?[...value.answers]:[])
  value.questions.forEach((q,i)=>{const group=el('fieldset','lp-quiz-question');group.append(el('legend','',`${i+1}. ${q.text}`));q.choices.forEach((choice,j)=>{const row=el('label','lp-native-choice'),control=el('input');control.type='radio';control.name=`quiz-${value.id}-${i}`;control.value=String(j);control.checked=answers[i]===j;control.onchange=()=>{answers[i]=j};row.append(control,el('span','',choice.text));group.append(row)});form.append(group)})
  const finish=button('See my result','lp-button lp-button-primary');finish.type='submit';finish.disabled=h.busy;form.append(finish);form.onsubmit=e=>{e.preventDefault();webAction(h,'quiz_answer',{id:value.id,answers:[...answers]})};root.append(form)
  if(result){const resultCard=card(result.title,result.text);resultCard.classList.add('lp-quiz-result');shareWeb(h,resultCard,value.id);root.append(resultCard)}
  const contacts=select(h,'quiz-contact','Try it with a contact',[['','Choose a contact'],...h.state.contacts.filter(c=>!hiddenDatingContact(h.state,c.id)).map(c=>[c.id,c.name] as [string,string])]);root.append(contacts,act('Ask them to take the quiz',()=>webAction(h,'quiz_partner',{id:value.id,contactId:h.ui.drafts['quiz-contact']})))
  if(value.partner){const partnerResult=quizResult(value,value.partner.answers);root.append(card(`${value.partner.name} · ${partnerResult?.title||'Result'}`,partnerResult?.text||''))}
}
