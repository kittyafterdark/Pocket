import { icon, tool } from './native-chrome.js'
import { type NativeHost } from './native-ui.js'
import { renderBank } from './pocket-bank-app.js'
import { renderBirthdayCalendar } from './birthday-calendar-app.js'
import { renderPocketBrowser } from './pocket-browser-app.js'
import { renderPocketMap } from './pocket-map-app.js'
import { renderPocketTwitch } from './pocket-twitch-app.js'
import { renderStickerLibrary } from './sticker-library-app.js'
export { newNativeUI } from './native-ui.js'

export function renderNativeApp(h:NativeHost):HTMLDivElement {
  const previous=document.activeElement as HTMLElement|null,oldApp=previous?.closest('.lp-native-app')
  const controls='button,input,textarea,select,summary,[tabindex="0"]'
  const key=(node:HTMLElement)=>node.tagName+':'+(node.getAttribute('aria-label')||node.getAttribute('name')||node.dataset.date||node.textContent||'')
  const focusKey=oldApp?.classList.contains(`na-${h.app}`)&&previous?key(previous):''
  const oldMatches=focusKey?[...oldApp!.querySelectorAll<HTMLElement>(controls)].filter(node=>key(node)===focusKey):[]
  const focusIndex=previous?oldMatches.indexOf(previous):-1
  const {page,content}=h.page('', ''),nav=page.querySelector('.lp-nav')!,back=nav.querySelector<HTMLButtonElement>('button')!
  back.replaceChildren(icon('back'));back.setAttribute('aria-label','Back to Pocket');back.className='na-icon-button'
  nav.remove();content.className=`lp-content lp-native-app na-app na-${h.app}`;content.setAttribute('aria-busy',String(h.busy))
  page.classList.add('na-page',`na-page-${h.app}`)
  if(h.app==='bank')renderBank(h,content,back)
  else if(h.app==='birthdays')renderBirthdayCalendar(h,content,back)
  else if(h.app==='browser')renderPocketBrowser(h,content,back)
  else if(h.app==='maps')renderPocketMap(h,content,back)
  else if(h.app==='twitch')renderPocketTwitch(h,content,back)
  else renderStickerLibrary(h,content,back)
  if(h.error){const error=document.createElement('div');error.className='na-error';error.setAttribute('role','alert');error.append(document.createTextNode(h.error),tool('Dismiss error','close',()=>h.dismissError?.()));content.prepend(error)}
  if(h.busy){const progress=document.createElement('div');progress.className='na-progress';progress.setAttribute('role','status');progress.textContent=h.status||'Working…';const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.onclick=()=>h.action(h.app,'cancel');progress.append(cancel);content.append(progress)}
  if(focusKey)queueMicrotask(()=>{
    if(!content.isConnected||previous?.isConnected||document.activeElement!==document.body&&document.activeElement!==previous)return
    const target=[...content.querySelectorAll<HTMLElement>(controls)].filter(node=>key(node)===focusKey)[Math.max(0,focusIndex)]
    if(target&&!target.matches(':disabled')&&!target.closest('details:not([open]) .br-menu-items'))target.focus({preventScroll:true})
    else {const heading=content.querySelector<HTMLElement>('h1,h2')||content;heading.tabIndex=-1;heading.focus({preventScroll:true})}
  })
  return page
}
