import {frontendPerformance} from '../domain/performance.js';
/** Transient regions only: authoritative data/navigation continue through the full renderer. */
export function patchDatingProgress(root:ParentNode,profile:string,status:string){
 const p=root.querySelector<HTMLElement>('[data-lumistry-profile-status]');if(p)p.textContent=profile;
 const s=root.querySelector<HTMLElement>('[data-lumistry-inline-status]');if(s)s.textContent=status;
 frontendPerformance.record('ui','progress.dating',0,1);
}
export function patchMessageProgress(root:ParentNode,id:string,busy:{phase:'checking'|'pending';name:string}|undefined){
 const thread=root.querySelector<HTMLElement>('[data-pocket-thread]');if(!thread||thread.dataset.pocketThread!==id)return;
 const region=thread.querySelector<HTMLElement>('[data-pocket-progress]');if(!region)return;
 const group=thread.dataset.conversationKind==='group';region.replaceChildren();
 if(busy){const node=region.ownerDocument.createElement('div');node.className=group?'lp-group-typing':busy.phase==='checking'?'lp-conversation-status':'lp-bubble lp-bubble-pending';node.setAttribute('role','status');node.setAttribute('aria-live','polite');if(!group)node.dataset.sender='contact';if(busy.phase!=='checking')node.setAttribute('aria-label',group?`${busy.name} is typing`:'Contact is typing');
  if(group||busy.phase==='checking'){const label=region.ownerDocument.createElement('span');label.textContent=busy.phase==='checking'?group?(thread.dataset.progressTitle||busy.name):'Checking for reply…':`${busy.name} is typing…`;node.append(label);}
  if(group||busy.phase!=='checking'){const dots=region.ownerDocument.createElement('span');dots.className='lp-typing-dots';for(let i=0;i<3;i++)dots.append(region.ownerDocument.createElement('i'));node.append(dots);}region.append(node);
 }
 const button=root.querySelector<HTMLButtonElement>('[data-pocket-reply-control]');
 if(button){button.innerHTML=busy?'■':button.dataset.idleHtml||'';button.className=button.dataset.idleClass||button.className;button.classList.toggle('lp-reply-stop',!!busy);button.disabled=!busy&&button.dataset.idleDisabled==='true';button.setAttribute('aria-label',busy?'Stop generating reply':button.dataset.idleLabel||'Generate reply');button.title=busy?'Stop generating reply':button.dataset.idleTitle||'';}
 for(const banner of thread.querySelectorAll<HTMLElement>('[data-pocket-availability]'))banner.hidden=!!busy;
 frontendPerformance.record('ui','progress.messages',0,1);
}
export function patchCameraProgress(root:ParentNode,message:string,preview:string,busy:boolean){
 const status=root.querySelector<HTMLElement>('.lp-camera-progress');if(!status)return;status.textContent=message;
 const page=root.querySelector<HTMLElement>('.lp-camera');if(page&&busy)page.dataset.captureState='generating';
 const finder=root.querySelector<HTMLElement>('.lp-photo-viewfinder');
 if(finder&&preview){let image=finder.querySelector<HTMLImageElement>(':scope > img');if(!image){image=finder.ownerDocument.createElement('img');image.alt='Camera preview';finder.prepend(image);finder.querySelector('.lp-camera-subject')?.remove();}if(image.getAttribute('src')!==preview)image.src=preview;}
 const shutter=root.querySelector<HTMLButtonElement>('.lp-shutter');if(shutter){shutter.dataset.busy=String(busy);if(busy)shutter.disabled=false;}
 const label=root.querySelector<HTMLElement>('.lp-camera-shutter-label');if(label&&busy)label.textContent='Tap to stop';
 frontendPerformance.record('ui','progress.camera',0,1);
}
export class ProgressScheduler {
 private frame=0;private disposed=false;
 constructor(private flush:()=>void,private request:(fn:FrameRequestCallback)=>number=requestAnimationFrame,private cancel:(id:number)=>void=cancelAnimationFrame){}
 schedule(){if(this.disposed||this.frame)return;this.frame=-1;const id=this.request(()=>{this.frame=0;if(!this.disposed)this.flush();});if(this.frame===-1)this.frame=id;}
 destroy(){this.disposed=true;if(this.frame)this.cancel(this.frame);this.frame=0;}
}
