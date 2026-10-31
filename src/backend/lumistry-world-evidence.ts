import type {PhoneState} from '../types.js';
import {worldSource,WORLD_READING_LIMITS,type WorldCoverage,type WorldSourceChoice} from '../domain/lumistry-world-reading.js';
/** Native evidence only. Choosing sources never canonizes them or calls a model. */
export async function collectWorldEvidence(state:PhoneState,api:any,permitted:(p:string)=>boolean,user?:string,selectedIds?:string[]):Promise<WorldCoverage>{
 if(selectedIds!==undefined&&(!Array.isArray(selectedIds)||selectedIds.length>64||selectedIds.some(id=>typeof id!=='string'||id.length>220)))throw new Error('Choose up to 64 world sources.');
 const selected=selectedIds===undefined?undefined:new Set(selectedIds),sources:WorldCoverage['sources']=[],warnings:string[]=[],availableSources:WorldSourceChoice[]=[];
 const add=(id:string,label:string,value:unknown,max:number,automatic=true)=>{
  const source=worldSource(id,label,value,max);if(!source)return false;
  const include=selected?selected.has(id):automatic;
  availableSources.push({id,label,originalCharacters:source.originalCharacters,selected:include,reason:include?source.truncated?'Source excerpt is bounded; add necessary missing detail below.':undefined:'Not included in this read.'});
  if(include)sources.push(source);return include;
 };
 let character:any;
 if(permitted('characters'))try{character=await api.characters.get(state.characterId,user);if(!character)warnings.push('Character card unavailable.');}catch{warnings.push('Character card could not be read.');}
 else warnings.push('Character permission is disabled; the card was not read.');
 for(const [key,max] of [['scenario',WORLD_READING_LIMITS.scenario],['description',WORLD_READING_LIMITS.description],['personality',WORLD_READING_LIMITS.personality]] as const)add('card_'+key,'Character '+key,character?.[key],max);
 if(permitted('world_books')&&api.world_books?.getActivated&&api.world_books?.entries?.get){
  let remaining=24000;const seen=new Set<string>();
  const entry=async(v:any,automatic:boolean)=>{
   const id=typeof v==='string'?v:v?.id;if(!id||seen.has(id)||!permitted('world_books'))return;seen.add(id);
   try{
    if(typeof v==='object'&&typeof v.content!=='string'&&!(selected?selected.has('lore_'+id):automatic)){availableSources.push({id:'lore_'+id,label:v.comment||'World-book entry',selected:false,reason:'Not automatically selected. Choose it to read its content.'});return;}
    const value=typeof v?.content==='string'?v:await api.world_books.entries.get(id,user);if(!value||value.disabled)return;
    const key='lore_'+id,wanted=selected?selected.has(key):automatic;
    if(wanted&&remaining<=0){availableSources.push({id:key,label:value.comment||'World-book entry',originalCharacters:value.content?.length||0,selected:false,reason:'The 24,000-character lore budget was reached. Deselect other sources to include this one.'});return;}
    const included=add(key,value.comment||'World-book entry',value.content,Math.min(2000,Math.max(1,remaining)),automatic);
    if(included)remaining-=Math.min(2000,remaining,value.content?.trim().length||0);
   }catch{warnings.push('A world-book entry could not be read.');}
  };
  try{const active=await api.world_books.getActivated(state.chatId,user);for(const v of active.slice(0,24))await entry(v,true);if(active.length>24)warnings.push('Only the first 24 activated lore entries were considered automatically. Attached entries remain selectable below.');}catch{warnings.push('Activated lore could not be read.');}
  const books=(character?.world_book_ids||[]).slice(0,16);if((character?.world_book_ids||[]).length>16)warnings.push('The source picker covers the first 16 attached books. Supply additional relevant lore explicitly.');
  for(const book of books){
   if(!permitted('world_books')){warnings.push('World-book permission changed during reading.');break;}
   try{
    for(let offset=0;offset<400;offset+=100){
     const page=await api.world_books.entries.list(book,{limit:100,offset,userId:user});
     for(const v of page.data||[])if(!v.disabled)await entry(v,!!v.constant||/world|species|race|ancestry|setting|technology|magic|geography|culture|lore|location|region|city|town|country/i.test([v.comment,...(v.key||[])].join(' ')));
     if((page.total??page.data?.length??0)<=offset+100)break;
     if(offset===300)warnings.push('An attached book has more than 400 entries; the remaining entries were not indexed. Supply missing evidence below.');
    }
   }catch{warnings.push('An attached world book could not be read.');}
  }
  if(remaining<=0)warnings.push('The lore reading budget was reached; the picker shows sources that were not included.');
 }else warnings.push('World-book permission/API unavailable. Lore was not read.');
 if(permitted('chat_mutation')&&typeof api.chat?.getMessages==='function')try{
  const messages=await api.chat.getMessages(state.chatId);for(const [i,m] of messages.slice(-24).entries())add('message_'+(m.id||i),'Recent '+m.role+' message',m.content,500);if(messages.length>24)warnings.push('Only the last 24 chat messages were indexed.');
 }catch{warnings.push('Recent chat could not be read.');}
 else warnings.push('Chat message permission/API is disabled; recent messages were not read.');
 if(selected&&[...selected].some(id=>!availableSources.some(s=>s.id===id)))throw new Error('A selected world source is unavailable or no longer belongs to this setting. Choose sources again.');
 const permittedSource=(id:string)=>id.startsWith('lore_')?permitted('world_books'):id.startsWith('card_')?permitted('characters'):permitted('chat_mutation');
 if(sources.some(s=>s.truncated))warnings.push('Some source sections were truncated; original and included sizes are shown.');
 return {sources:sources.filter(s=>permittedSource(s.id)),availableSources:availableSources.filter(s=>permittedSource(s.id)),warnings:[...new Set(warnings)]};
}
