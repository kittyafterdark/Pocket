import type { PhoneState } from '../types.js'
import { applyTrackerOperation } from './trackers.js'
import { currencyDigits, walletAmount } from './pocket-wallet.js'
import { nativeFor } from './native-apps.js'

export function linkWalletTracker(state:PhoneState,trackerId:string,source:'bank'|'tracker',now:string):void {
  const owner=state.pocketPersonaActorId,data=nativeFor(state),tracker=state.trackers.find(t=>t.id===trackerId)
  if(!tracker||tracker.kind!=='counter'&&tracker.kind!=='meter')throw new Error('Choose an existing numeric counter or meter to connect.')
  if(Object.entries(state.nativeApps||{}).some(([id,value])=>id!==owner&&value.wallet.trackerId===trackerId))throw new Error('That counter is connected to another phone.')
  const balance=walletAmount(source==='tracker'?tracker.value:data.wallet.balance,data.wallet.currency)
  const next=applyTrackerOperation({...tracker,min:Math.min(tracker.min,balance),max:Math.max(tracker.max,balance),unit:data.wallet.currency},{operation:'set',amount:balance,source:'user',reason:'Connected to Pocket Bank',now,roleplayNow:state.roleplayNow})
  state.trackers=state.trackers.map(t=>t.id===trackerId?next:t)
  data.wallet={...data.wallet,balance,trackerId,syncedBalance:balance};state.nativeApps={...state.nativeApps,[owner]:data}
}

/** A saved baseline distinguishes bank operations from story/manual counter edits. */
export function syncWalletTrackers(state:PhoneState,now:string):void {
  for(const data of Object.values(state.nativeApps||{})){
    const wallet=data.wallet;if(!wallet.trackerId)continue
    let tracker=state.trackers.find(t=>t.id===wallet.trackerId)
    if(!tracker||tracker.kind!=='counter'&&tracker.kind!=='meter'){delete wallet.trackerId;delete wallet.syncedBalance;continue}
    const baseline=wallet.syncedBalance??wallet.balance,bankChanged=wallet.syncedBalance===undefined||wallet.balance!==baseline,trackerChanged=tracker.value!==baseline
    if(!bankChanged&&trackerChanged){wallet.balance=walletAmount(tracker.value,wallet.currency);data.revision++}
    const balance=wallet.balance
    if(tracker.kind==='counter')tracker={...tracker,step:10**-currencyDigits(wallet.currency)}
    const next=applyTrackerOperation({...tracker,min:Math.min(tracker.min,balance),max:Math.max(tracker.max,balance),unit:wallet.currency},{operation:'set',amount:balance,source:'user',reason:'Pocket Bank sync',now,roleplayNow:state.roleplayNow})
    state.trackers=state.trackers.map(t=>t.id===tracker.id?next:t);wallet.syncedBalance=balance
  }
}
