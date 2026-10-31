import {normalizeDatingProfile,type DatingProfile} from './lumistry.js';
/** Transient resolved image URLs are not a canonical edit revision. */
export function profileEditSignature(p:DatingProfile|null|undefined):string {return JSON.stringify(p?normalizeDatingProfile(p):null);}
