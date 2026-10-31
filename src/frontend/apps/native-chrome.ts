import { el, button } from '../shared.js'
import type { NativeHost } from './native-ui.js'

const paths:Record<string,string>={
  add:'M12 5v14M5 12h14',back:'m15 5-7 7 7 7',forward:'m9 5 7 7-7 7',close:'m6 6 12 12M6 18 18 6',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  home:'m3 10 9-7 9 7v11h-6v-7H9v7H3z',wallet:'M3 6h16v14H3zM3 6l13-3v3m-1 7h6v4h-6z',chart:'M4 21V11h4v10m3 0V5h4v16m3 0V2h4v19',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0-6v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  send:'m3 3 19 9-19 9 4-9zm4 9h15',receive:'M12 3v14m-5-5 5 5 5-5M4 20h16',more:'M5 12h.01M12 12h.01M19 12h.01',bookmark:'M6 3h12v19l-6-4-6 4z',share:'M12 16V2m-5 5 5-5 5 5M4 11v10h16V11',
  tabs:'M8 3h13v13H8zM3 8v13h13',refresh:'M20 7v6h-6M4 17v-6h6M5 7a8 8 0 0 1 13-2l2 2M4 17l2 2a8 8 0 0 0 13-2',lock:'M5 10h14v11H5zm3 0V6a4 4 0 0 1 8 0v4',calendar:'M4 5h16v16H4zM8 2v6m8-6v6M4 11h16',
  map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16',pin:'M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13m0-17a4 4 0 1 0 0 8 4 4 0 0 0 0-8',locate:'M12 2v3m0 14v3M2 12h3m14 0h3M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  heart:'M12 21 3 12C-3 4 7-2 12 6 17-2 27 4 21 12z',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 22v-3a8 8 0 0 1 16 0v3',camera:'M3 6h4l2-3h6l2 3h4v15H3zm13 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0',play:'m8 4 12 8-12 8z',gift:'M3 8h18v5H3zm2 5v9h14v-9M12 8v14M12 8C2 9 3-2 9 2l3 6c10 1 9-10 3-6z',
  image:'M3 3h18v18H3zm0 14 6-6 5 5 3-6 4 6M9 7h.01',coffee:'M4 7h13v9a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zm13 1h2a4 4 0 0 1 0 8h-2M7 2v2m4-2v2m4-2v2',leaf:'M3 21C3 5 14 3 22 2c0 12-3 20-15 16M3 21 16 8',art:'M3 3h18v18H3zm4 4h10v6H7zm5 6v8',music:'M9 17V5l12-3v14M9 6l12-3M9 17a4 3 0 1 1-4-3h4m12 2a4 3 0 1 1-4-3h4',stickers:'M13 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7zm0 0v-5a3 3 0 0 1 3-3h5M8 8h.01M15 8h.01M8 12q4 4 8 0',edit:'m4 16 12-12 4 4L8 20l-5 1z',trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7'
}
export function icon(name:string):HTMLSpanElement {const span=el('span','na-icon');span.setAttribute('aria-hidden','true');span.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]||paths.more}"/></svg>`;return span}
export function tool(label:string,name:string,run:()=>void,className='na-icon-button'):HTMLButtonElement {const b=button('',className);b.setAttribute('aria-label',label);b.title=label;b.append(icon(name));b.onclick=run;return b}
export function textButton(label:string,run:()=>void,className='na-button'):HTMLButtonElement{const b=button(label,className);b.onclick=run;return b}
export function go(h:NativeHost,panel='',selected?:string){h.ui.panels[h.app]=panel;if(selected!==undefined)h.ui.selected[h.app]=selected;h.render()}
export function header(title:string,back:HTMLElement,...actions:HTMLElement[]):HTMLElement{const root=el('header','na-header');root.append(back,el('h1','',title),...actions);return root}
export function subBack(h:NativeHost,panel='',label='Back'):HTMLButtonElement {return tool(label,'back',()=>go(h,panel))}
export function scroll(...nodes:Node[]):HTMLElement{const root=el('div','na-scroll');root.append(...nodes);return root}
export function bottomNav(h:NativeHost,items:Array<[string,string,string]>,current:string):HTMLElement {const root=el('nav','na-bottom-nav');root.setAttribute('aria-label',`${h.app} navigation`);for(const [id,label,name]of items){const b=tool(label,name,()=>go(h,id),'na-nav-item');b.append(el('span','',label));if(id===current)b.setAttribute('aria-current','page');root.append(b)}return root}
export function empty(title:string,copy:string,name='bookmark'):HTMLElement{const root=el('div','na-empty');root.append(icon(name),el('h3','',title),el('p','',copy));return root}
export function avatar(name:string,className='na-avatar'):HTMLElement {return el('span',className,Array.from(name||'?')[0])}
