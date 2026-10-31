import {photoArtifacts,type AuthoredArtifact} from './lumistry-v2.js';
import type {AuthoringIssue} from './lumistry-authoring-contract.js';
const purposeKey=(text:string)=>text.trim().replace(/\s+/g,' ');
/** Explicit refs win. Without one, only a unique exact saved purpose is evidence of identity. */
export function referencedPhotos(a:AuthoredArtifact,gallery:readonly string[],targets:readonly number[]) {
 const source=photoArtifacts(a),issues:AuthoringIssue[]=[],references=source.map(unit=>{
  const record=unit.records?.find(r=>r.start==='Photo purpose'),explicit=record?.fields['Record reference'];if(explicit)return explicit;
  const purpose=purposeKey(record?.fields['Photo purpose']||''),matches=gallery.flatMap((saved,i)=>purpose&&purposeKey(saved)===purpose?[i]:[]);
  return matches.length===1?`photo_${matches[0]+1}`:targets.length===1&&source.length===1?`photo_${targets[0]+1}`:undefined;
 });
 const counts=new Map<string,number>();for(const ref of references)if(ref)counts.set(ref,(counts.get(ref)||0)+1);
 for(const ref of references)if(!ref||!targets.some(i=>ref===`photo_${i+1}`)||counts.get(ref)!==1)issues.push({code:'record-reference',message:'An unknown, missing or repeated photo reference is unresolved; unrelated uniquely identified records are retained.',labels:['Photo purpose']});
 const units=targets.map(i=>counts.get(`photo_${i+1}`)===1?source.find((_,n)=>references[n]===`photo_${i+1}`):undefined);
 return {units,issues};
}
