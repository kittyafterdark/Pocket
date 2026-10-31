import {test,expect} from 'bun:test';
import {resolvePocketImageSource} from '../src/backend/image-sources.js';
import {PerformanceLedger,numericPerformanceSnapshot} from '../src/domain/performance.js';
import {datingDisplayState,normalizeDating} from '../src/domain/lumistry.js';
import type {PhoneState} from '../src/types.js';

// Host-wide image refresh caching from the ZIP's reference backend was not imported.
test('native image resolution isolates users and retries missing assets',async()=>{
 const calls:any[]=[];
 const api:any={permissions:{has:()=>true},images:{get:async(id:string,options:any)=>{calls.push([id,options.userId]);return id==='missing'?null:{mime_type:'image/png',url:'/image/'+options.userId+'/'+id};}}};
 const same={kind:'gallery' as const,imageId:'shared'};
 expect((await resolvePocketImageSource(api,same,'alice')).url).toBe('/image/alice/shared');
 expect((await resolvePocketImageSource(api,same,'bob')).url).toBe('/image/bob/shared');
 expect((await resolvePocketImageSource(api,{kind:'gallery',imageId:'missing'},'alice')).status).toBe('error');
 expect((await resolvePocketImageSource(api,{kind:'gallery',imageId:'missing'},'alice')).status).toBe('error');
 expect(calls).toEqual([['shared','alice'],['shared','bob'],['missing','alice'],['missing','alice']]);
});

test('numeric telemetry is bounded, isolated, immutable on export and rejects content-shaped fields',()=>{
 const ledger=new PerformanceLedger();ledger.record('u','refresh',12,200);ledger.record('u','refresh',8,100);const snapshot=ledger.snapshot('u');expect(snapshot.refresh).toEqual({count:2,totalMs:20,maxMs:12,lastMs:8,units:300});snapshot.refresh.count=0;expect(ledger.snapshot('u').refresh.count).toBe(2);expect(ledger.snapshot('other')).toEqual({});expect(numericPerformanceSnapshot({secret:'raw message',stage:{...snapshot.refresh,raw:'excluded'}})).toEqual({stage:snapshot.refresh});for(let i=0;i<40;i++)ledger.record('scope'+i,'render',1);expect(ledger.snapshot('u')).toEqual({});
});
test('dating display projects mutable aliases/messages without cloning catalogs or mutating canonical history',()=>{
 const state={chatId:'c',characterId:'a',pocketPersonaActorId:'owner',pocketPersona:{displayName:'Canonical'},contacts:[{id:'npc',name:'Real',presence:{},source:{kind:'npc'}}],conversations:[{id:'d',channel:'dating',datingOwnerId:'owner',messages:[{id:'m',sender:'contact',senderName:'Real'}]}],lumistry:{owner:normalizeDating({self:{alias:'Owner alias',age:30},profiles:[{id:'p',contactId:'npc',alias:'Dating alias',age:30}],decisions:[{profileId:'p',action:'like',status:'matched',conversationId:'d'}]})}} as unknown as PhoneState;
 const before=structuredClone(state),display=datingDisplayState(state,'d');expect(display.contacts[0].name).toBe('Dating alias');expect(display.conversations[0].messages[0].senderName).toBe('Dating alias');expect(display.lumistry).toBe(state.lumistry);expect(display.conversations[0]).not.toBe(state.conversations[0]);expect(display.conversations[0].messages[0]).not.toBe(state.conversations[0].messages[0]);expect(state).toEqual(before);expect(datingDisplayState(state).conversations).toHaveLength(0);
});
