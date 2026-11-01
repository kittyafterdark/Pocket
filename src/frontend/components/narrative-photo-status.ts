import {button,el} from '../shared.js'

export interface PhotoProgress {
  requestId:string;chatId:string;characterId:string;scene:string;phase:string
  message?:string;step?:number;totalSteps?:number;imageId?:string;imageUrl?:string
}
const finished=(phase:string)=>['ready','failed','cancelled'].includes(phase)

/** Updates existing rows so streamed progress never replaces focused controls. */
export class NarrativePhotoStatus {
  readonly root=el('section','pocket-photo-status')
  private list=el('div','pocket-photo-status-list')
  private serial=0
  private rows=new Map<string,{data:PhotoProgress;root:HTMLElement;status:HTMLElement;meter:HTMLProgressElement;steps:HTMLElement;cancel:HTMLButtonElement;open:HTMLButtonElement;dismiss:HTMLButtonElement;stopping:boolean}>()
  constructor(private actions:{cancel(data:PhotoProgress):void;open(data:PhotoProgress):void;empty():void}){
    this.root.setAttribute('aria-label','Pocket photo generation')
    this.root.append(el('h2','','Pocket camera'),this.list)
  }
  update(data:PhotoProgress):void {
    let row=this.rows.get(data.requestId)
    if(row&&finished(row.data.phase))return
    if(!row){
      const number=++this.serial,root=el('div','pocket-photo-status-row'),status=el('p','pocket-photo-status-message'),meter=el('progress'),steps=el('small','pocket-photo-status-steps'),controls=el('div','pocket-photo-status-actions')
      const cancel=button('Cancel',''),open=button('Open photo',''),dismiss=button('Dismiss','')
      root.setAttribute('role','group');root.setAttribute('aria-label',`Photo ${number}`);status.setAttribute('role','status');meter.setAttribute('aria-label',`Photo ${number} generation progress`)
      cancel.setAttribute('aria-label',`Cancel photo ${number}`);open.setAttribute('aria-label',`Open photo ${number}`);dismiss.setAttribute('aria-label',`Dismiss photo ${number} status`)
      row={data,root,status,meter,steps,cancel,open,dismiss,stopping:false};this.rows.set(data.requestId,row)
      cancel.onclick=()=>{const current=this.rows.get(data.requestId);if(!current)return;current.stopping=true;current.cancel.disabled=true;current.status.textContent='Stopping photo…';this.actions.cancel(current.data)}
      open.onclick=()=>{const current=this.rows.get(data.requestId);if(current)this.actions.open(current.data)}
      dismiss.onclick=()=>{const current=this.rows.get(data.requestId);if(!current||!finished(current.data.phase))return;current.root.remove();this.rows.delete(data.requestId);if(!this.rows.size)this.actions.empty()}
      controls.append(cancel,open,dismiss);root.append(el('strong','',`Photo ${number}`),el('p','pocket-photo-status-scene',data.scene),status,meter,steps,controls);this.list.append(root)
    }
    const cancelFocused=document.activeElement===row.cancel
    row.data=data
    const done=finished(data.phase)
    if(data.phase==='cancelling')row.stopping=true
    row.root.dataset.state=done?data.phase:'active'
    const message=row.stopping&&!done?'Stopping photo…':data.phase==='ready'?'Photo ready · saved to Gallery':data.phase==='failed'?data.message||'Photo generation failed':data.phase==='cancelled'?'Photo generation cancelled':data.message||'Generating photo…'
    if(row.status.textContent!==message)row.status.textContent=message
    row.meter.hidden=done;row.steps.hidden=done
    if(data.totalSteps&&data.totalSteps>0){row.meter.max=data.totalSteps;row.meter.value=Math.max(0,data.step||0);row.steps.textContent=`${data.step||0} / ${data.totalSteps} steps`}else{row.meter.removeAttribute('value');row.steps.textContent=''}
    row.cancel.hidden=done;row.cancel.disabled=row.stopping||data.phase==='queued';row.dismiss.hidden=!done
    row.open.hidden=data.phase!=='ready'||!data.imageUrl
    if(done&&cancelFocused)(row.open.hidden?row.dismiss:row.open).focus({preventScroll:true})
  }
}
