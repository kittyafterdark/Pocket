/** Native userStorage boundary. Only a verified missing file may use a default. */
export interface ScopedJsonStorage {
  stat(path:string,userId?:string):Promise<{exists:boolean;isFile:boolean}>;
  read(path:string,userId?:string):Promise<string>;
  setJson(path:string,value:unknown,options?:{userId?:string;indent?:number}):Promise<void>;
}
export type JsonRead = {kind:'missing'} | {kind:'valid';value:unknown;raw:string} | {kind:'corrupt'|'unavailable'|'future';path:string};
export class PocketStorageError extends Error {
  constructor(readonly kind:'corrupt'|'unavailable'|'future',readonly path:string) {
    super(kind==='future'?'This saved record belongs to a newer Pocket version. Update Pocket before editing it.':`Saved data could not be ${kind==='corrupt'?'decoded':'read'}. Your original data was kept; no replacement was written.`);
    this.name='PocketStorageError';
  }
}
export async function readScopedJson(store:ScopedJsonStorage,path:string,userId?:string,maxVersion?:number):Promise<JsonRead> {
  try {
    const stat=await store.stat(path,userId);
    if(!stat.exists)return {kind:'missing'};
    if(!stat.isFile)return {kind:'unavailable',path};
    const raw=await store.read(path,userId);
    let value:unknown;
    try { value=JSON.parse(raw); } catch { return {kind:'corrupt',path}; }
    if(value===null||typeof value!=='object')return {kind:'corrupt',path};
    if(maxVersion!==undefined&&Number((value as {version?:unknown}).version)>maxVersion)return {kind:'future',path};
    return {kind:'valid',value,raw};
  } catch { return {kind:'unavailable',path}; }
}
export async function strictScopedJson<T=unknown>(store:ScopedJsonStorage,path:string,options:{fallback?:T;userId?:string;maxVersion?:number}={}):Promise<T> {
  const result=await readScopedJson(store,path,options.userId,options.maxVersion);
  if(result.kind==='valid')return result.value as T;
  if(result.kind==='missing'&&'fallback' in options)return options.fallback as T;
  throw new PocketStorageError(result.kind==='missing'?'unavailable':result.kind,path);
}
const fingerprint=(s:string)=>{let a=2166136261,b=2246822507;for(const c of s){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b^c.charCodeAt(0),3266489909);}return (a>>>0).toString(16)+(b>>>0).toString(16);};
/** Snapshot schema transitions before writing. Ordinary checkpoints are not copied repeatedly. */
export async function writeScopedJson(store:ScopedJsonStorage,path:string,value:unknown,options:{userId?:string;indent?:number}={}):Promise<void> {
  const old=await readScopedJson(store,path,options.userId);
  if(!['valid','missing'].includes(old.kind))throw new PocketStorageError((old as {kind:'corrupt'|'unavailable'}).kind,path);
  if(old.kind==='valid') {
    const previous=(old.value as {version?:unknown}).version,next=(value as {version?:unknown})?.version;
    if(typeof previous==='number'&&typeof next==='number'&&previous>next)throw new PocketStorageError('future',path);
    if(previous!==next) {
      const backup=`pocket/recovery/${encodeURIComponent(path)}.${fingerprint(old.raw)}.json`;
      const existing=await readScopedJson(store,backup,options.userId);
      if(existing.kind==='missing')await store.setJson(backup,{version:1,path,raw:old.raw},{userId:options.userId});
      else if(existing.kind!=='valid')throw new PocketStorageError(existing.kind,backup);
      const verified=await strictScopedJson<{raw:string}>(store,backup,{userId:options.userId});
      if(verified.raw!==old.raw)throw new PocketStorageError('corrupt',backup);
    }
  }
  await store.setJson(path,value,options);
}
export interface SecretStore {get(key:string,userId?:string):Promise<string|null>;put(key:string,value:string,userId?:string):Promise<void>;delete(key:string,userId?:string):Promise<unknown>;}
export async function migrateSecret(storage:ScopedJsonStorage&{delete(path:string,userId?:string):Promise<unknown>},secrets:SecretStore,key:string,path:string,user?:string):Promise<string> {
  const configured=await secrets.get(key,user),old=await strictScopedJson<{apiKey?:string}|null>(storage,path,{fallback:null,userId:user});
  if(configured){if(old)await storage.delete(path,user);return configured;}
  const value=typeof old?.apiKey==='string'?old.apiKey.trim():'';
  if(!value)return '';
  await secrets.put(key,value,user);
  if(await secrets.get(key,user)!==value)throw new Error('The credential migration could not be verified. The previous credential was kept.');
  await storage.delete(path,user);return value;
}
