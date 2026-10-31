import {stripLoveMetadata} from './lumistry-love.js';
/** One generated reply can contain several native texts; no extra generation per bubble. */
export function datingReplyTexts(value:Record<string,any>):string[] {
 let parts:string[];
 if(value.messages!==undefined){
  if(!Array.isArray(value.messages)||value.messages.some((v:unknown)=>typeof v!=='string'))throw new Error('Reply messages must be an array of text strings.');
  parts=value.messages.map((v:string)=>v.trim()).filter(Boolean);
 }else if(value.message===undefined||value.message===null)parts=[];
 else {if(typeof value.message!=='string')throw new Error('Reply message must be text.');parts=value.message.trim()?[value.message.trim()]:[];}
 parts=parts.map(stripLoveMetadata).map(p=>p.trim()).filter(Boolean);
 if(parts.join('\n\n').length>8000)throw new Error('The complete reply exceeds the message text limit.');
 // A voice transcript is one recording. Single line breaks remain inside a text.
 if(value.format==='voice')return parts.length?[parts.join('\n\n')]:[];
 if(value.messages===undefined)parts=parts.flatMap(p=>p.split(/\r?\n[\t ]*\r?\n(?:[\t ]*\r?\n)*/).map(s=>s.trim()).filter(Boolean));
 // Bound bubble count without throwing away text or introducing another repair call.
 return parts.length>8?[...parts.slice(0,7),parts.slice(7).join('\n\n')]:parts;
}
