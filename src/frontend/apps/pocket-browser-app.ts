import { el } from '../shared.js'
import { webData, webAction, quiz, form, input, conversations, type NativeHost } from './native-ui.js'
import { empty, go, header, icon, scroll, subBack, textButton, tool } from './native-chrome.js'

export function renderPocketBrowser(h:NativeHost,root:HTMLElement,back:HTMLElement):void {
  const web=webData(h),panel=h.ui.panels.browser||'browse',tab=web.tabs.find(t=>t.id===web.activeTab),page=web.pages.find(p=>p.id===tab?.pages[tab.index]),navigate=(id:string)=>{h.ui.drafts['web-query']='';h.ui.panels.browser='browse';webAction(h,'open',{id})}
  root.dataset.private=String(h.ui.private)
  const search=(value:string)=>{value=value.trim();if(!value)return;h.ui.drafts['web-query']=value;const existing=web.pages.find(p=>p.address===value||p.title===value);if(existing){navigate(existing.id);return}h.action('browser','search',{query:value,private:h.ui.private},()=>go(h,'results'))}
  const switchPrivacy=()=>{h.ui.private=!h.ui.private;h.ui.privateBrowser=undefined;h.ui.drafts['web-query']='';h.ui.selected.quiz='';h.action('browser','private_clear',{},()=>go(h,'browse'))}
  const addressBar=el('form','br-address-bar'),address=el('input');address.type='search';address.setAttribute('aria-label','Search or enter address');address.placeholder='Search or enter address';address.value=h.ui.drafts['web-query']||page?.address||'';address.oninput=()=>{h.ui.drafts['web-query']=address.value};addressBar.append(icon(h.ui.private?'user':'lock'),address,tool('Go to address','forward',()=>search(address.value)));addressBar.onsubmit=e=>{e.preventDefault();search(address.value)}
  const chrome=el('header','br-chrome');chrome.append(addressBar);root.append(chrome)
  const toolbar=el('nav','br-toolbar');toolbar.setAttribute('aria-label','Browser controls')
  const previous=tool('Back in browser','back',()=>{if(panel!=='browse'){go(h,'browse');return}webAction(h,'back')}),next=tool('Forward in browser','forward',()=>webAction(h,'forward'));previous.disabled=panel==='browse'&&(!tab||tab.index<0);next.disabled=!tab||tab.index>=tab.pages.length-1
  const menu=el('details','br-menu'),summary=el('summary');summary.setAttribute('aria-label','Browser menu');summary.append(icon('more'));const items=el('div','br-menu-items');back.append(document.createTextNode('Back to Pocket'));items.append(textButton('New tab',()=>{h.ui.panels.browser='browse';webAction(h,'tab_new')}),textButton('Bookmarks',()=>go(h,'saved')),textButton('History',()=>go(h,'history')),textButton('Quizzes',()=>go(h,'quizzes')),textButton(h.ui.private?'Close private session':'Open private session',switchPrivacy),back);menu.append(summary,items)
  const tabs=tool(`Browser tabs, ${web.tabs.length}`,'tabs',()=>go(h,'tabs'));tabs.append(el('span','br-tab-count',String(web.tabs.length)))
  toolbar.append(previous,next,tool('Share page','share',()=>go(h,'share')),tool('Bookmarks','bookmark',()=>go(h,'saved')),tabs,menu)
  if(!page)toolbar.querySelector<HTMLButtonElement>('[aria-label="Share page"]')!.disabled=true
  const body=scroll();body.classList.add('br-document');root.append(body,toolbar)
  root.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='l'){event.preventDefault();address.focus();address.select()}})
  if(panel==='tabs'){
    const top=el('div','br-view-title');top.append(el('h2','',h.ui.private?'Private tabs':'Your tabs'),tool('New tab','add',()=>{h.ui.panels.browser='browse';webAction(h,'tab_new')}));body.append(top);const grid=el('div','br-tab-overview')
    for(const t of web.tabs){const p=web.pages.find(p=>p.id===t.pages[t.index]),tile=el('section'),head=el('div');head.append(el('strong','',p?.title||'New tab'),tool(`Close tab ${p?.title||'New tab'}`,'close',()=>webAction(h,'tab_close',{id:t.id})));const preview=textButton('',()=>{h.ui.panels.browser='browse';webAction(h,'tab_select',{id:t.id})},'br-tab-preview');preview.append(el('span','',p?.address||'pocket'),el('h3','',p?.title||'A fresh page'),el('p','',p?.summary||'What will you find next?'));if(t.id===web.activeTab)tile.dataset.selected='true';tile.append(head,preview);grid.append(tile)}if(!grid.childElementCount)grid.append(empty('A fresh window','Open a tab to begin.','tabs'));body.append(grid,textButton('+ New tab',()=>{h.ui.panels.browser='browse';webAction(h,'tab_new')},'na-button na-primary'));return
  }
  if(panel==='share'){
    body.classList.add('na-editor');body.append(header('Share this page',subBack(h,'browse')));if(page)body.append(el('h2','',page.title),el('p','',page.summary),conversations(h,'web-recipient'),textButton('Share in conversation',()=>webAction(h,'share',{id:page.id,conversationId:h.ui.drafts['web-recipient']}),'na-button na-primary'));return
  }
  if(panel==='quizzes'){
    body.classList.add('na-editor');body.append(header('Quizzes',subBack(h,'browse')));const current=web.quizzes.find(q=>q.id===h.ui.selected.quiz)
    if(current){body.append(textButton('All quizzes',()=>{h.ui.selected.quiz='';h.render()},'na-text-button'));quiz(h,body,current);return}
    const picks=el('div','br-quiz-catalog');picks.append(textButton('The little getaway quiz',()=>webAction(h,'quiz_starter'),'br-quiz-cover'));for(const q of web.quizzes)picks.append(textButton(q.title,()=>{h.ui.selected.quiz=q.id;h.render()},'br-quiz-cover'));body.append(picks,form(h,'Make a quiz',[input(h,'quiz-topic','What should it be about?')],'Make a quiz',d=>webAction(h,'quiz_create',{topic:d['quiz-topic']})));return
  }
  if(panel==='saved'||panel==='history'){
    body.append(header(panel==='saved'?'Bookmarks':'History',subBack(h,'browse')));const ids=panel==='saved'?web.bookmarks:[...web.history].reverse()
    if(panel==='history')body.append(textButton('Clear history',()=>webAction(h,'history_clear'),'na-text-button'))
    const list=el('div','br-saved-sites');for(const id of ids){const p=web.pages.find(p=>p.id===id);if(!p)continue;const link=textButton('',()=>navigate(p.id),'br-saved-site');link.append(icon('bookmark'),el('strong','',p.title),el('small','',p.address));list.append(link)}if(!ids.length)list.append(empty(panel==='saved'?'Your favourite corners':'No history yet','Pages you keep will be right here.'));body.append(list);return
  }
  if(panel==='results'){
    body.append(el('div','br-search-wordmark','pocket'),el('p','br-result-count',`Results for “${h.ui.drafts['web-query']||''}”`));for(const p of [...web.pages].slice(-4)){const result=el('article','br-search-result');result.append(el('span','',p.address),textButton(p.title,()=>navigate(p.id),'br-result-link'),el('p','',p.summary));body.append(result)}return
  }
  if(!page){
    const start=el('div','br-start');start.append(el('h1','br-wordmark','pocket'),el('span','',h.ui.private?'Private browsing':'Find something worth getting lost in.'))
    const quick=el('div','br-shortcuts');for(const [title,name,run]of [['Bookmarks','bookmark',()=>go(h,'saved')],['Quizzes','edit',()=>go(h,'quizzes')],['Maps','map',()=>h.openApp?.('maps')],['History','refresh',()=>go(h,'history')]] as Array<[string,string,()=>void]>){const b=tool(title,name,run,'br-shortcut');b.append(el('span','',title));quick.append(b)}start.append(quick)
    if(web.bookmarks.length){const favourites=el('div','br-favourites');favourites.append(el('h2','','Favourites'));for(const id of web.bookmarks.slice(0,6)){const p=web.pages.find(p=>p.id===id);if(p)favourites.append(textButton(p.title,()=>navigate(id),'br-favourite'))}start.append(favourites)}body.append(start);return
  }
  const article=el('article','br-webpage'),site=el('header','br-site-header');site.append(el('strong','',page.address.split('.')[0].replaceAll('-',' ')),el('span','',page.kind==='forum'?'Community':'Journal'));article.append(site,el('span','br-site-category',page.kind.toUpperCase()),el('h1','',page.title),el('p','br-deck',page.summary));for(const paragraph of page.paragraphs)article.append(el('p','',paragraph));const bookmark=tool(web.bookmarks.includes(page.id)?'Remove bookmark':'Save bookmark','bookmark',()=>webAction(h,'bookmark',{id:page.id}));bookmark.setAttribute('aria-pressed',String(web.bookmarks.includes(page.id)));article.append(bookmark);body.append(article)
}
