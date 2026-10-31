import {showPocketSheet} from './components/ui.js';
import {preferenceDraftDirty} from '../domain/lumistry-preference-draft.js';
import {leaveFilters} from './apps/lumistry-filters.js';
import type { DatingHost, DatingUI } from './apps/lumistry.js';
import { datingFor } from '../domain/lumistry.js';
import { snapshotActivityClock } from '../domain/activity-clock.js';
import { profileEditSignature } from '../domain/lumistry-profile-edit.js';
import { el, button } from './shared.js';

export interface VisualMemory {scope:string;unread:Record<string,number>;}
export function profileEditorDirty(ui:DatingUI):boolean {
    return !!ui.editorSource && (ui.editorSource===ui.editor||ui.editorSource===ui.draft) && ui.editorInitial !== profileEditSignature(ui.editorSource);
}
export function clearProfileEditor(ui:DatingUI):void {
    ui.editor=undefined;ui.draft=undefined;ui.editorSource=undefined;ui.editorInitial=undefined;ui.editorLeave=undefined;
    ui.selfBaseline=undefined;ui.selfEditing=false;ui.selfPage=undefined;ui.editingNpc=false;
}
/** Personal sidebar and regular tab navigation share the same draft protections. */
export function requestDatingNavigation(ui:DatingUI,go:()=>void):boolean {
    if(profileEditorDirty(ui)){ui.editorLeave=()=>{clearProfileEditor(ui);go();};return false;}
    if(ui.preferenceDraft&&preferenceDraftDirty(ui.preferenceDraft)){ui.preferenceLeave=()=>{ui.preferenceDraft=undefined;go();};return false;}
    return leaveFilters(ui,go);
}
export function reducedMotion(root:HTMLElement):boolean {
    return root.closest('[data-reduced-motion="true"]')!==null || root.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
}
export function seasonFromStory(state:DatingHost['state']):string|undefined {
    const clock=snapshotActivityClock(state);
    if(!clock.storyAt)return;
    const match=/^\d{4}-(\d\d)-/.exec(clock.storyAt);if(!match)return;
    const month=Number(match[1]);
    // Decorative calendar motifs, never assertions about local weather/hemisphere.
    return month===12?'stars':month===10?'leaves':undefined;
}
export function waitingSkeleton():HTMLElement {
    const box=el('div','lumistry-loading-shapes');box.setAttribute('aria-hidden','true');
    box.append(el('span','lumistry-loading-portrait'),el('span','lumistry-loading-line'),el('span','lumistry-loading-line short'));
    return box;
}
/** No host calls: a horizontal gesture delegates to the same visible buttons. */
export function attachDiscoveryGesture(page:HTMLElement,card:HTMLElement,choose:(kind:'pass'|'like')=>void):void {
    let start:{x:number;y:number;id:number}|undefined,dx=0,locked=false,committed=false,timer:ReturnType<typeof setTimeout>|undefined;
    card.tabIndex=0;card.setAttribute('aria-label','Dating profile. Left arrow to Pass, right arrow to Like. Buttons are also available.');
    const interactive=(target:EventTarget|null)=>target instanceof card.ownerDocument.defaultView!.Element&&!!target.closest('button,a,input,textarea,select,summary,p,h1,h2,h3,strong,[contenteditable="true"],.lumistry-photo-description-card');
    const reset=()=>{start=undefined;dx=0;locked=false;card.style.removeProperty('--card-drag');card.style.removeProperty('--card-tilt');card.dataset.dragging='false';};
    card.addEventListener('pointerdown',(e:PointerEvent)=>{if(committed||e.isPrimary===false||e.button!==0||interactive(e.target)||card.ownerDocument.getSelection()?.toString())return;start={x:e.clientX,y:e.clientY,id:e.pointerId};dx=0;});
    card.addEventListener('pointermove',(e:PointerEvent)=>{if(!start||e.pointerId!==start.id)return;if(card.ownerDocument.getSelection()?.toString()){reset();return;}dx=e.clientX-start.x;const dy=e.clientY-start.y;if(!locked&&Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){reset();return;}if(Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.4){locked=true;card.setPointerCapture?.(e.pointerId);card.dataset.dragging='true';if(!reducedMotion(page)){card.style.setProperty('--card-drag',`${Math.max(-180,Math.min(180,dx))}px`);card.style.setProperty('--card-tilt',`${Math.max(-7,Math.min(7,dx/25))}deg`);}}});
    const finish=(e:PointerEvent)=>{if(!start||e.pointerId!==start.id)return;const amount=dx,accepted=locked&&Math.abs(amount)>=84;reset();if(!accepted||committed)return;committed=true;card.dataset.exit=amount>0?'like':'pass';const fire=()=>{if(page.isConnected)choose(amount>0?'like':'pass');};if(reducedMotion(page))fire();else timer=setTimeout(fire,190);};
    for(const b of page.querySelectorAll('.lumistry-swipe button'))b.addEventListener('click',()=>{if(timer)clearTimeout(timer);committed=true;});
    card.addEventListener('pointerup',finish);card.addEventListener('pointercancel',reset);card.addEventListener('lostpointercapture',reset);
    card.addEventListener('keydown',(e:KeyboardEvent)=>{if(e.target!==card||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||committed||card.ownerDocument.getSelection()?.toString())return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();committed=true;choose(e.key==='ArrowLeft'?'pass':'like');}});
}
/** Presentation only. State memories are scoped and never persisted to the phone. */
export function polishLumistry(page:HTMLDivElement,h:DatingHost):HTMLDivElement {
    const d=datingFor(h.state,h.owner),scope=JSON.stringify([h.state.chatId,h.state.characterId,h.owner]);
    if(h.ui.visualMemory?.scope!==scope)h.ui.visualMemory={scope,unread:{}};
    const memory=h.ui.visualMemory!;
    const season=seasonFromStory(h.state);if(season)page.dataset.calendarMotif=season;
    page.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!page.querySelector('[role="alertdialog"]')){e.preventDefault();h.back();}});
    for(const row of page.querySelectorAll<HTMLElement>('[data-dating-conversation]')){
        const id=row.dataset.datingConversation!,count=Number(row.dataset.unreadCount||0),old=memory.unread[id];
        const badge=row.querySelector<HTMLElement>('.lp-unread');if(badge&&old!==undefined&&count>old)badge.dataset.arrived='true';
        memory.unread[id]=count;
    }
    for(const alert of page.querySelectorAll<HTMLElement>('[role=alert]')){alert.classList.add('lumistry-semantic-error');}
    const current=d.profiles.filter(p=>!d.decisions.some(x=>x.profileId===p.id));
    const stamp=d.tools?.published[page.dataset.lumistryCandidate||''];
    // "New" means the most recently published unseen saved person, not online/signup recency.
    if(stamp&&current.every(p=>!d.tools?.published[p.id]||d.tools.published[p.id]<=stamp)){
        const ribbon=el('span','lumistry-new-ribbon','New to your pool');page.querySelector('.lumistry-hero')?.append(ribbon);
    }
    const background=el('div','lumistry-ambient');background.setAttribute('aria-hidden','true');for(let i=0;i<4;i++)background.append(el('i'));page.prepend(background);
    const notice=page.querySelector('.lumistry-match-notice[data-new="true"]');if(notice){const burst=el('span','lumistry-match-burst');burst.setAttribute('aria-hidden','true');for(let i=0;i<5;i++)burst.append(el('i'));notice.prepend(burst);}
    for(const empty of page.querySelectorAll<HTMLElement>('.lumistry-empty'))if(!empty.querySelector('.lumistry-empty-scene')){const art=el('span','lumistry-empty-scene');art.setAttribute('aria-hidden','true');art.textContent='◌ ⚗ ◌';empty.prepend(art);}
    // Dirty editors use the same bounded, keyboard-owned phone sheet as destructive actions.
    const leave=page.querySelector<HTMLElement>('[role="alertdialog"]')||page.querySelector<HTMLElement>('[data-draft-warning]');
    if(leave)queueMicrotask(()=>{if(!page.isConnected||leave.closest('dialog'))return;
        const anchor=page.querySelector<HTMLElement>('button')||page;
        const modal=showPocketSheet(anchor,leave.getAttribute('aria-label')||'Unsaved changes',leave,{closeLabel:'Keep editing',onDismiss:()=>{h.ui.editorLeave=undefined;h.ui.preferenceLeave=undefined;h.ui.filterLeave=undefined;}});
        for(const button of leave.querySelectorAll('button'))button.addEventListener('click',()=>modal?.dismiss());
    });
    page.addEventListener('click',event=>{
        const target=event.target as HTMLElement,b=target.closest<HTMLButtonElement>('button');if(!b||b.disabled||b.dataset.confirmOnce==='true')return;
        const label=b.textContent?.trim()||'';
        if(!b.dataset.confirmAction)return;
        event.preventDefault();event.stopImmediatePropagation();page.querySelector('.lumistry-confirm-sheet')?.remove();
        const sheet=el('section','lp-card lp-stack lumistry-confirm-sheet');sheet.setAttribute('aria-label',`Confirm ${label}`);
        sheet.append(el('strong','',label+'?'),el('p','',b.dataset.confirmAction==='unmatch'?'This match moves to Past connections and the chat is archived. Any reply being written stops.':'Review this action before continuing. Existing chats and published profiles follow the action’s normal preservation rules.'));
        const confirm=button('Confirm '+label,'lp-button lp-button-danger'),cancel=button('Keep it','lp-button');
        confirm.addEventListener('click',()=>{if(!b.isConnected)return;modal?.dismiss();b.dataset.confirmOnce='true';b.click();delete b.dataset.confirmOnce;});
        const modal=showPocketSheet(b,`Confirm ${label}`,sheet,{closeLabel:'Keep it'});sheet.append(confirm);const dialog=sheet.closest('dialog');dialog?.setAttribute('role','alertdialog');

    },true);
    return page;
}
