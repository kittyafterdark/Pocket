import { expect, test } from 'bun:test'
import type { PhoneState } from '../src/types.js'
import { normalizeNativeApps } from '../src/domain/native-apps.js'
import { normalizeTracker, applyTrackerOperation } from '../src/domain/trackers.js'
import { linkWalletTracker, syncWalletTrackers } from '../src/domain/wallet-tracker-sync.js'
import { transact, convertWallet } from '../src/domain/pocket-wallet.js'

const now='2026-10-30T12:00:00.000Z'
function fixture(kind:'counter'|'meter'='counter'):PhoneState {return {pocketPersonaActorId:'owner',roleplayNow:now,trackers:[normalizeTracker({id:'money',key:'money',label:'Money',kind,value:125.5,initialValue:0,min:0,max:1000,unit:'USD',updateMode:'manual'})!],nativeApps:{owner:normalizeNativeApps({wallet:{balance:50,currency:'USD'}})}} as PhoneState}

test('connecting requires an explicit choice of initial balance and preserves the tracker',()=>{
  const a=fixture(),originalId=a.trackers[0].id;linkWalletTracker(a,'money','tracker',now)
  expect(a.nativeApps!.owner.wallet.balance).toBe(125.5);expect(a.trackers[0].id).toBe(originalId);expect(a.trackers).toHaveLength(1)
  const b=fixture();linkWalletTracker(b,'money','bank',now);expect(b.trackers[0].value).toBe(50);expect(b.nativeApps!.owner.wallet.balance).toBe(50)
})

test('bank operations and tracker edits sync both ways, without duplicate transactions or history loops',()=>{
  const state=fixture();linkWalletTracker(state,'money','tracker',now);const data=state.nativeApps!.owner
  transact(data.wallet,{amount:-25,label:'Lunch'},'tx',now);syncWalletTrackers(state,now);expect(state.trackers[0].value).toBe(100.5)
  const history=state.trackers[0].history.length;syncWalletTrackers(state,now);expect(state.trackers[0].history).toHaveLength(history)
  state.trackers[0]=applyTrackerOperation(state.trackers[0],{operation:'add',amount:20,source:'model',reason:'Earned a tip',now});syncWalletTrackers(state,now)
  expect(data.wallet.balance).toBe(120.5);expect(data.wallet.transactions).toHaveLength(1);expect(data.revision).toBe(1)
})

test('currency conversion keeps the numeric tracker in the same units and expands its range',()=>{
  const state=fixture('meter');linkWalletTracker(state,'money','bank',now);state.nativeApps!.owner.wallet=convertWallet(state.nativeApps!.owner.wallet,'JPY',100)
  syncWalletTrackers(state,now);expect(state.trackers[0].value).toBe(5000);expect(state.trackers[0].max).toBeGreaterThanOrEqual(5000);expect(state.trackers[0].unit).toBe('JPY')
})

test('deleting or disconnecting a tracker leaves bank money intact and linked trackers cannot cross phones',()=>{
  const state=fixture();linkWalletTracker(state,'money','bank',now);state.nativeApps!.other=normalizeNativeApps({wallet:{balance:900,trackerId:'money',syncedBalance:900}})
  expect(()=>linkWalletTracker(state,'money','bank',now)).toThrow('another phone');delete state.nativeApps!.other
  state.trackers=[];syncWalletTrackers(state,now);expect(state.nativeApps!.owner.wallet.balance).toBe(50);expect(state.nativeApps!.owner.wallet.trackerId).toBeUndefined()
})

test('an explicit bank operation wins a simultaneous unsaved counter change',()=>{
  const state=fixture();linkWalletTracker(state,'money','bank',now);state.trackers[0].value=80;state.nativeApps!.owner.wallet.balance=40
  syncWalletTrackers(state,now);expect(state.trackers[0].value).toBe(40);expect(state.nativeApps!.owner.wallet.balance).toBe(40)
})
