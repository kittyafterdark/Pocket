import { el } from '../shared.js'
import { icon, textButton } from '../apps/native-chrome.js'

/** Surface-local menu. No modal backdrop, global styling, or detached phone coordinates. */
export function attachmentMenu(anchor:HTMLButtonElement,items:Array<{label:string;icon:string;run():void}>,dismissed=()=>{}):()=>void {
  const host=anchor.closest<HTMLElement>('.lp-compose-stack')||anchor.parentElement!,menu=el('div','lp-attach-menu'),id='attach-'+globalThis.crypto.randomUUID()
  menu.id=id;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Attach to conversation');anchor.setAttribute('aria-expanded','true');anchor.setAttribute('aria-controls',id);anchor.setAttribute('aria-haspopup','menu')
  let closed=false
  const close=(focus=false)=>{if(closed)return;closed=true;menu.remove();anchor.setAttribute('aria-expanded','false');anchor.removeAttribute('aria-controls');document.removeEventListener('pointerdown',outside,true);dismissed();if(focus&&anchor.isConnected)anchor.focus({preventScroll:true})}
  const outside=(event:Event)=>{if(!menu.contains(event.target as Node)&&!anchor.contains(event.target as Node))close()}
  for(const item of items){const b=textButton('',()=>{close();item.run()},'lp-attach-menu-item');b.setAttribute('role','menuitem');b.append(icon(item.icon),el('span','',item.label));menu.append(b)}
  menu.onkeydown=event=>{const buttons=[...menu.querySelectorAll<HTMLButtonElement>('button')],index=buttons.indexOf(document.activeElement as HTMLButtonElement);if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true)}else if(event.key==='Tab')close(true);else if(['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length]?.focus()}}
  host.append(menu);document.addEventListener('pointerdown',outside,true);menu.querySelector<HTMLButtonElement>('button')?.focus();return ()=>close()
}
