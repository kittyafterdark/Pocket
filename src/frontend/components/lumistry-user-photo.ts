import type {DatingProfile} from '../../domain/lumistry.js';
import {button,el} from '../shared.js';
import {fieldBlock} from './ui.js';
export interface PersonaPhotoChoice {imageId?:string;url?:string;description?:string;aspect?:string;comment?:string;includesSelf?:boolean;}
/** A native modal's content. Sending waits for acknowledgement so errors retain the draft. */
export function personaPhotoSheet(options:{profile?:DatingProfile;selected?:PersonaPhotoChoice;galleryAvailable?:boolean;gallery(draft:PersonaPhotoChoice):void;send(photo:Record<string,unknown>,comment:string,complete:(error?:string)=>void):void;dismiss():void}) {
 const box=el('div','lp-stack');
 box.append(el('p','lp-copy','Send a described photo, or choose an image. Your match reads the visible description you write.'));
 const description=el('textarea','lp-textarea');description.rows=4;description.maxLength=1500;description.placeholder='What does the photo show?';description.setAttribute('aria-label','Photo description');
 const comment=el('textarea','lp-textarea');comment.rows=2;comment.maxLength=12000;comment.placeholder='Optional message';comment.setAttribute('aria-label','Photo message');
 const includesSelf=el('input');includesSelf.type='checkbox';includesSelf.checked=true;const selfLabel=el('label','lp-row');selfLabel.append(includesSelf,el('span','','This photo shows me'));
 const aspect=el('select','lp-select');aspect.setAttribute('aria-label','Photo aspect');for(const value of ['portrait','landscape','square']){const o=el('option','',value);o.value=value;aspect.append(o);}
 const preview=el('div','lp-stack'),status=el('p','lp-copy');status.setAttribute('role','status');
 let imageId:string|undefined,imageUrl:string|undefined,pending=false;
 const use=(choice:PersonaPhotoChoice)=>{imageId=choice.imageId;imageUrl=choice.url;description.value=choice.description||'';aspect.value=choice.aspect||'portrait';if(choice.comment!==undefined)comment.value=choice.comment;if(choice.includesSelf!==undefined)includesSelf.checked=choice.includesSelf;preview.replaceChildren();if(choice.url){const image=el('img');image.src=choice.url;image.alt='Selected photo';image.style.cssText='max-width:100%;max-height:240px;object-fit:contain;border-radius:12px';preview.append(image);}};
 if(options.selected)use(options.selected);
 const choices=el('div','lp-stack');const gallery=button('Choose from Gallery','lp-button');gallery.disabled=options.galleryAvailable===false;gallery.addEventListener('click',()=>{if(!pending)options.gallery({description:description.value,aspect:aspect.value,comment:comment.value,includesSelf:includesSelf.checked,imageId,url:imageUrl})});choices.append(gallery);
 options.profile?.photoPlan.forEach((plan,index)=>{if(!plan.description)return;const b=button(`My profile photo ${index+1}`,'lp-button lp-button-quiet');b.addEventListener('click',()=>{if(pending)return;const photo=options.profile?.photos.find(p=>p.planIndex===index);use({description:plan.description,imageId:photo?.source.kind==='gallery'?photo.source.imageId:undefined,url:photo?.url,aspect:plan.aspect});includesSelf.checked=plan.subjectIds.includes('self');});choices.append(b);});
 const clear=button('Description only','lp-button lp-button-quiet');clear.addEventListener('click',()=>{if(!pending){imageId=undefined;imageUrl=undefined;preview.replaceChildren();}});choices.append(clear);
 const send=button('Send photo','lp-button lp-button-primary');send.type='button';send.addEventListener('click',()=>{
  if(pending)return;const text=description.value.trim();if(!text){status.textContent='Describe what is visible in the photo.';description.focus();return;}
  pending=true;send.disabled=true;description.disabled=comment.disabled=includesSelf.disabled=aspect.disabled=true;status.textContent='Sending…';
  const finish=(error?:string)=>{if(error){pending=false;send.disabled=false;description.disabled=comment.disabled=includesSelf.disabled=aspect.disabled=false;status.textContent=error;}else options.dismiss();};
  try{options.send({description:text,includesSelf:includesSelf.checked,aspect:aspect.value,...(imageId?{imageId}:{})},comment.value.trim(),finish);}catch(error){finish(error instanceof Error?error.message:'Unable to send photo.');}
 });
 box.append(choices,preview,fieldBlock('Visible photo description',description),selfLabel,fieldBlock('Framing',aspect),fieldBlock('Message (optional)',comment),status,send);return box;
}
