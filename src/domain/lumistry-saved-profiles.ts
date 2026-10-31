import {normalizeDatingProfile,type DatingProfile} from './lumistry.js';
import {assertDatingIngress} from './lumistry-ingress.js';
import {UNKNOWN_DISTANCE_KM} from './lumistry-location.js';
export const DATING_PROFILES_PATH='pocket/lumistry-persona-profiles.json';
export interface SavedDatingProfile {id:string;name:string;personaId:string;personaName:string;updatedAt:string;revision:number;requestId:string;profile:DatingProfile}
export interface SavedDatingProfiles {version:1;entries:SavedDatingProfile[]}
export type SavedDatingProfileSummary=Pick<SavedDatingProfile,'id'|'name'|'personaId'|'personaName'|'updatedAt'|'revision'>;
const text=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
/** Only an explicitly saved self-presentation travels between chats. No world/event/relationship state. */
export function reusableDatingProfile(raw:unknown,owner=''):DatingProfile {
 assertDatingIngress(raw,'edit');
 const p=normalizeDatingProfile(raw);
 if(!p)throw new Error('Enter an alias and an adult age before saving this profile.');
 const result=normalizeDatingProfile({id:'self',contactId:owner,alias:p.alias,age:p.age,anonymous:p.anonymous,bio:p.bio,pronouns:p.pronouns,fields:p.fields,hiddenFields:p.hiddenFields,privateFields:p.privateFields,adultPreferences:p.adultPreferences,phoneProfile:p.phoneProfile,person:p.person,photoPlan:p.photoPlan,photos:p.photos,distanceKm:UNKNOWN_DISTANCE_KM})!;
 delete result.interest;
 return structuredClone(result);
}
export function normalizeSavedDatingProfiles(raw:unknown):SavedDatingProfiles {
 if(raw==null)return {version:1,entries:[]};
 const v=raw as any;
 if(v.version!==1||!Array.isArray(v.entries))throw new Error('The saved dating-profile library is unsupported or damaged. Existing copies were kept.');
 const entries:SavedDatingProfile[]=[];
 for(const item of v.entries){
  const id=text(item?.id,180),name=text(item?.name,120);
  if(!id||!name||entries.some(e=>e.id===id)||!Number.isInteger(item.revision)||item.revision<1)throw new Error('A saved dating profile is damaged. Existing copies were kept.');
  entries.push({id,name,personaId:text(item.personaId,180),personaName:text(item.personaName,120),updatedAt:text(item.updatedAt,80),revision:item.revision,requestId:text(item.requestId,180),profile:reusableDatingProfile(item.profile)});
 }
 return {version:1,entries};
}
export function savedDatingSummaries(bank:SavedDatingProfiles):SavedDatingProfileSummary[]{return bank.entries.map(({id,name,personaId,personaName,updatedAt,revision})=>({id,name,personaId,personaName,updatedAt,revision}));}
export function requireSavedDatingProfile(bank:SavedDatingProfiles,id:unknown,revision:unknown):SavedDatingProfile {
 const entry=bank.entries.find(e=>e.id===id);
 if(!entry)throw new Error('That saved dating profile is unavailable. Refresh the saved copies.');
 if(entry.revision!==revision)throw new Error('That saved copy changed elsewhere. Refresh before updating, loading or deleting it.');
 return entry;
}
