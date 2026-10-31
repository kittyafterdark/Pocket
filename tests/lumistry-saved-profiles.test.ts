import {test,expect} from 'bun:test';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {normalizeSavedDatingProfiles,reusableDatingProfile} from '../src/domain/lumistry-saved-profiles.js';
import {UNKNOWN_DISTANCE_KM} from '../src/domain/lumistry-location.js';
function fixture(){
 const t=lumistryHarness(1),storage=new Map<string,unknown>();
 t.h.readSavedDatingProfiles=async(user:string)=>structuredClone(storage.get(user)||null);
 t.h.writeSavedDatingProfiles=async(value:unknown,user:string)=>storage.set(user,structuredClone(value));t.h.validateImage=async()=>{};
 let n=0;
 const act=(action:string,input:any={},user='u')=>t.app.handle({action,requestId:'saved_'+(++n),...input},{chatId:t.state.chatId,characterId:t.state.characterId},user);
 const source=()=>({...structuredClone(t.state.lumistry!.owner.profiles[0]),id:'self',alias:'My alias',privateFields:{orientation:'private orientation',boundaries:'private boundary'},fields:{occupation:'secret work'},hiddenFields:['occupation'],photos:[{source:{kind:'gallery',imageId:'image-one'},caption:'Mine',url:''}]});
 const last=()=>t.sent.at(-1);
 return {t,storage,act,source,last};
}
test('reusable self-presentation retains appearance, answers, disclosure and gallery without importing event/world metadata',()=>{
 const f=fixture(),raw={...f.source(),location:{mode:'radius',settingKey:'setting_0123456789abcdef'},encounterAvailable:true,interest:{status:'matched',version:2,seen:true},development:{private:'secret event'},authoring:{version:2},openingPhoto:{description:'Event photo'}};
 const p=reusableDatingProfile(raw,'new-owner');expect(p.id).toBe('self');expect(p.contactId).toBe('new-owner');expect(p.distanceKm).toBe(UNKNOWN_DISTANCE_KM);expect(p.location).toBeUndefined();expect(p.development).toBeUndefined();expect(p.creationPlan).toBeUndefined();expect(p.authoring).toBeUndefined();expect(p.interest).toBeUndefined();expect(p.encounterAvailable).toBe(false);expect(p.openingPhoto).toBeUndefined();expect(p.person).toEqual(raw.person);expect(p.hiddenFields).toEqual(['occupation']);expect(p.privateFields).toEqual(raw.privateFields);expect(p.photoPlan).toEqual(raw.photoPlan);expect(p.photos[0].source).toEqual({kind:'gallery',imageId:'image-one'});
});
test('save, reload and cross-chat load create an editable self draft with zero provider calls or automatic application',async()=>{
 const f=fixture(),before=structuredClone(f.t.state);await f.act('saved_profile_save',{name:'My everyday profile',profile:f.source()});const entry=f.last().entries[0];expect(entry.name).toBe('My everyday profile');expect(f.t.state).toEqual(before);expect(JSON.stringify(f.last().entries)).not.toContain('private boundary');
 f.t.state={...f.t.state,chatId:'another-chat',pocketPersonaActorId:'another-owner',lumistry:{}};
 await f.act('saved_profile_list');expect(f.last().entries).toHaveLength(1);
 await f.act('saved_profile_load',{profileId:entry.id,revision:entry.revision});const draft=f.last().draft;expect(f.last().phase).toBe('saved_self_draft');expect(draft.contactId).toBe('another-owner');expect(draft.alias).toBe('My alias');expect(draft.privateFields.boundaries).toBe('private boundary');expect(f.t.state.lumistry).toEqual({});
 await f.act('self',{profile:draft});expect(f.t.state.lumistry!['another-owner'].self!.alias).toBe('My alias');expect(f.t.calls).toHaveLength(0);expect(f.t.state.contacts).toHaveLength(0);expect(f.t.state.conversations).toHaveLength(0);expect(f.t.sent.filter(s=>s.type==='lumiphone:dating_result').every(s=>s.ownerActorId&&s.chatId)).toBe(true);
});
test('saved copies are user-scoped, duplicate receipts are idempotent and stale edits/deletion preserve the library',async()=>{
 const f=fixture();await f.act('saved_profile_save',{requestId:'receipt',name:'First',profile:f.source()});const entry=f.last().entries[0];await f.act('saved_profile_save',{requestId:'receipt',name:'First',profile:f.source()});expect(f.last().entries).toHaveLength(1);
 await f.act('saved_profile_list',{},'other-user');expect(f.last().entries).toHaveLength(0);
 await f.act('saved_profile_save',{profileId:entry.id,revision:entry.revision,name:'Updated',profile:{...f.source(),bio:'Changed'}});expect(f.last().entries[0].revision).toBe(2);
 for(const action of ['saved_profile_save','saved_profile_load','saved_profile_delete'])await expect(f.act(action,{profileId:entry.id,revision:1,name:'Stale',profile:f.source()})).rejects.toThrow('changed elsewhere');
 expect(normalizeSavedDatingProfiles(f.storage.get('u')).entries[0].name).toBe('Updated');
 const before=structuredClone(f.t.state);await f.act('saved_profile_delete',{profileId:entry.id,revision:2});expect(f.last().entries).toHaveLength(0);expect(f.t.state).toEqual(before);
});
test('invalid adult input, newer or damaged library and storage failures do not erase current profiles or saved copies',async()=>{
 const f=fixture();await f.act('saved_profile_save',{name:'Keep',profile:f.source()});const stored=structuredClone(f.storage.get('u')),state=structuredClone(f.t.state);
 await expect(f.act('saved_profile_save',{name:'Invalid',profile:{...f.source(),age:17}})).rejects.toThrow('adult age');expect(f.storage.get('u')).toEqual(stored);
 await expect(f.act('saved_profile_save',{name:'Too long',profile:{...f.source(),bio:'word '.repeat(101)}})).rejects.toThrow();expect(f.storage.get('u')).toEqual(stored);
 f.t.h.writeSavedDatingProfiles=async()=>{throw Error('disk unavailable')};await expect(f.act('saved_profile_save',{name:'Failed',profile:f.source()})).rejects.toThrow('disk unavailable');expect(f.t.state).toEqual(state);expect(f.storage.get('u')).toEqual(stored);
 for(const raw of [{version:2,entries:[]},{version:1,entries:[{id:'broken'}]}]){f.storage.set('u',raw);await expect(f.act('saved_profile_save',{name:'Do not erase',profile:f.source()})).rejects.toThrow();expect(f.storage.get('u')).toEqual(raw);}
});
test('missing gallery assets do not prevent loading retained photo descriptions or alter the saved original',async()=>{
 const f=fixture();await f.act('saved_profile_save',{name:'Photo copy',profile:f.source()});const entry=f.last().entries[0];f.t.h.validateImage=async()=>{throw Error('missing')};await f.act('saved_profile_load',{profileId:entry.id,revision:entry.revision});expect(f.last().draft.photos).toHaveLength(0);expect(f.last().draft.photoPlan).toEqual(f.source().photoPlan);expect(f.last().message).toContain('unavailable gallery');expect(normalizeSavedDatingProfiles(f.storage.get('u')).entries[0].profile.photos).toHaveLength(1);
});
test('owner/context changes during library reads reject private drafts and library mutations',async()=>{
 const f=fixture();await f.act('saved_profile_save',{name:'Kept',profile:f.source()});const entry=f.last().entries[0],before=structuredClone(f.storage.get('u')),sent=f.t.sent.length;
 f.t.h.readSavedDatingProfiles=async()=>{f.t.state.pocketPersonaActorId='changed';return structuredClone(before)};
 await expect(f.act('saved_profile_load',{profileId:entry.id,revision:entry.revision})).rejects.toThrow('phone changed');expect(f.t.sent).toHaveLength(sent);expect(f.storage.get('u')).toEqual(before);
});
