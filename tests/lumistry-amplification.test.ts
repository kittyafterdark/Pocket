import {test,expect} from 'bun:test';
import {JSDOM} from 'jsdom';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {readTransactionState,PromotionQueue,discoveryProjectionCore} from '../src/backend/lumistry-runtime-boundaries.js';
import {applyDatingSlice} from '../src/domain/lumistry-sync.js';
import {patchDatingProgress,patchCameraProgress,patchMessageProgress,ProgressScheduler} from '../src/frontend/progress-patches.js';
import type {PhoneState} from '../src/types.js';

test('durable reservations and claims do not project UI, publication sync leaves the lock and provider count stays three',async()=>{
 const h=lumistryHarness(4);h.state.lumistry!.owner.generationSettings.creation={readyTarget:5,workers:1,photoBatchCap:5};let locked=false,writes=0,transactionReads=0;const views:any[]=[];const lock=h.h.withStateLock,save=h.h.saveState;
 h.h.withStateLock=async(k:string,fn:any)=>{locked=true;try{return await lock(k,fn);}finally{locked=false;}};
 h.h.saveState=async(s:PhoneState,u:string)=>{writes++;return save(s,u)};
 h.h.loadStateForTransaction=async()=>{transactionReads++;return structuredClone(h.state)};
 h.h.sendDiscoveryState=async(s:PhoneState)=>{expect(locked).toBe(false);views.push(structuredClone(s.lumistry!.owner));};
 h.generate=async req=>{const job=h.state.lumistry!.owner.discoveryJob!;expect(Object.keys(job.requestReservations!)).toHaveLength(1);expect(Object.keys(job.activeClaims!)).toHaveLength(1);expect(views).toHaveLength(1);return h.response(req);};
 await h.run();expect(h.calls).toHaveLength(3);expect(writes).toBeGreaterThan(views.length);expect(views).toHaveLength(3);expect(transactionReads).toBeGreaterThan(3);expect(views[1].profiles).toHaveLength(5);expect(views[2].discoveryJob.status).toBe('complete');expect(h.state.lumistry!.owner.discoveryJob!.activeClaims).toEqual({});expect(h.state.lumistry!.owner.discoveryJob!.requestReservations).toEqual({});
});
test('transactional reads skip reconciliation for current data and retain missing/legacy/future safeguards',async()=>{
 let normalized=0,reconciled=0;const current={version:12,characterName:'Saved name',actorMemoryVersion:1};const norm=(raw:any,name:string)=>{normalized++;expect(name).toBe('Saved name');return raw as PhoneState;};const reconcile=async()=>{reconciled++;return current as unknown as PhoneState;};
 expect(await readTransactionState(current,12,norm,reconcile)).toBe(current);expect(normalized).toBe(1);expect(reconciled).toBe(0);
 for(const raw of [null,{...current,version:11},{...current,settings:{}},{...current,actorMemoryVersion:0}])await readTransactionState(raw,12,norm,reconcile);expect(reconciled).toBe(4);await expect(readTransactionState({...current,version:13},12,norm,reconcile)).rejects.toThrow('newer');expect(reconciled).toBe(4);
});
function promotionState(){return {chatId:'c',characterId:'a',pocketPersonaActorId:'owner',contacts:[{id:'npc',name:'Real identity',source:{kind:'npc'},presence:{inScene:false}}],lumistry:{owner:{profiles:[{id:'dating_npc_1',contactId:'npc'}],decisions:[{profileId:'dating_npc_1',exchanged:false}]}}} as unknown as PhoneState;}
test('promotion queue requires qualification, keeps ordinary saves empty, and retries collision recovery only after invalidation',()=>{
 const queue=new PromotionQueue(),s=promotionState();queue.recovery(s,'initial');expect(queue.candidates(s)).toHaveLength(0);queue.mark(s,'npc');expect(queue.candidates(s)).toHaveLength(0);
 s.lumistry!.owner.decisions[0].exchanged=true;queue.mark(s,'npc');expect(queue.candidates(s)).toHaveLength(1);queue.complete(s,'bank-1');const reloaded=structuredClone(s);queue.recovery(reloaded,'bank-1');expect(queue.candidates(reloaded)).toHaveLength(0);queue.recovery(reloaded,'bank-2');expect(queue.candidates(reloaded)).toHaveLength(1);
 reloaded.contacts[0].source={kind:'npc',bankId:'accepted'} as any;expect(queue.candidates(reloaded)).toHaveLength(0);
});
test('dating slices preserve every other domain, reject stale/duplicate/wrong scope and recover revision gaps',()=>{
 const s={...promotionState(),storageRevision:10,updatedAt:'old',conversations:[{id:'ordinary'}],notes:[{body:'keep'}]} as unknown as PhoneState,dating={...s.lumistry!.owner,theme:'modern'},p={version:1,chatId:'c',characterId:'a',ownerActorId:'owner',baseRevision:10,storageRevision:14,updatedAt:'new',dating};const core=discoveryProjectionCore(s),result=applyDatingSlice(s,p,'c','a');expect(result.kind).toBe('apply');if(result.kind!=='apply')throw Error('apply failed');expect(result.state.conversations).toBe(s.conversations);expect(result.state.notes).toBe(s.notes);expect(discoveryProjectionCore(result.state)).toBe(core);expect(result.state.lumistry!.owner).toBe(dating);expect(s.storageRevision).toBe(10);
 expect(applyDatingSlice(result.state,p,'c','a').kind).toBe('ignore');expect(applyDatingSlice(s,{...p,baseRevision:9},'c','a').kind).toBe('recover');expect(applyDatingSlice(s,{...p,ownerActorId:'other'},'c','a').kind).toBe('ignore');expect(applyDatingSlice(s,p,'elsewhere','a').kind).toBe('ignore');expect(applyDatingSlice(s,{...p,version:2},'c','a').kind).toBe('recover');expect(discoveryProjectionCore({...s,notes:[]})).not.toBe(core);
});
test('bursty progress is coalesced and patches preserve controls, bubbles, focus and cleanup',()=>{
 const dom=new JSDOM('<body><div id="root"><p data-lumistry-profile-status></p><span data-lumistry-inline-status></span><div data-pocket-thread="t" data-conversation-kind="direct"><div data-message-id="m">Keep message</div><div data-pocket-progress></div><div data-pocket-availability></div></div><button data-pocket-reply-control data-idle-html="Reply" data-idle-class="lp-button" data-idle-label="Generate reply"></button><div class="lp-camera"><div class="lp-photo-viewfinder"><div class="lp-camera-subject"></div><textarea>Keep draft</textarea></div><p class="lp-camera-progress"></p><button class="lp-shutter"></button><span class="lp-camera-shutter-label"></span></div></div></body>');
 const root=dom.window.document.querySelector('#root')!,input=root.querySelector('textarea')!,bubble=root.querySelector('[data-message-id]')!;input.focus();let next!:FrameRequestCallback,requests=0,cancelled=0,patches=0;
 const scheduler=new ProgressScheduler(()=>{patches++;patchDatingProgress(root,'Stage 20','Working');patchMessageProgress(root,'t',{phase:'pending',name:'Aster'});patchCameraProgress(root,'Step 20','data:image/png;base64,test',true);},fn=>{requests++;next=fn;return requests},()=>cancelled++);
 for(let i=0;i<20;i++)scheduler.schedule();expect(requests).toBe(1);next(0);expect(patches).toBe(1);expect(root.querySelector('[data-lumistry-profile-status]')!.textContent).toBe('Stage 20');expect(root.querySelector('[data-message-id]')).toBe(bubble);expect(root.querySelector('textarea')).toBe(input);expect(dom.window.document.activeElement).toBe(input);expect(root.querySelector('.lp-bubble-pending')).not.toBeNull();expect(root.querySelector('.lp-shutter')!.getAttribute('data-busy')).toBe('true');
 patchMessageProgress(root,'t',undefined);expect(root.querySelector('.lp-bubble-pending')).toBeNull();expect(root.querySelector('[data-pocket-reply-control]')!.textContent).toBe('Reply');expect((root.querySelector('[data-pocket-availability]') as HTMLElement).hidden).toBe(false);scheduler.schedule();scheduler.destroy();expect(cancelled).toBe(1);next(0);expect(patches).toBe(1);dom.window.close();
});

test('reply context optimization preserves byte-identical messages for all saved pre-change fixtures',async()=>{
 const {datingReplyMessages}=await import('../src/domain/lumistry.js');const {replyPerformanceFixture}=await import('./fixtures/lumistry-reply-performance.js');const fixtures=await import('./fixtures/lumistry-reply-performance-before.json');for(const entry of fixtures.default){const state=replyPerformanceFixture(entry.count,entry.exchanged);expect(JSON.stringify(datingReplyMessages(state,state.conversations[0],'Reply naturally.'))).toBe(JSON.stringify(entry.expected));}
});
