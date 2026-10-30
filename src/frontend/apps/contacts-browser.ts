import type { ContactsViewHost } from './contacts.js'
import type { PocketContact, PocketContactSourceOption, PocketNpcBankEntry } from '../../types.js'
import { contactAccent, contactAvatar } from '../../domain/contacts.js'
import { button, el } from '../shared.js'
import { disclosure } from '../components/ui.js'

type Source = 'casts' | 'bank' | 'character' | 'council' | 'search'
export interface ContactBrowserSession {
  query?: string; filter?: 'all' | 'recent' | 'here' | 'groups'; groupId?: string; scroll?: number
  importQuery?: string; source?: Source; sourceQuery?: string; sourcePage?: number; sourceScroll?: number; importScroll?: number
  bankTab?: 'npcs' | 'casts'; bankQuery?: string; bankScroll?: number; bankDetail?: string; castDetail?: string
}
const session = (host: ContactsViewHost) => host.browser || (host.browser = {})
const normalized = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
const matches = (text: string, query: string) => normalized(query).trim().split(/\s+/).every(word => normalized(text).includes(word))
const byName = (a: {name:string}, b: {name:string}) => a.name.localeCompare(b.name, undefined, {sensitivity:'base'})
const linkedNpc = (host: ContactsViewHost, id: string) => host.state.contacts.find(contact => contact.source.kind === 'npc' && contact.source.bankId === id)
function face(name: string, url = '', accent = '#8b7dff') {
  const root = el('span', 'lp-directory-avatar', name.slice(0,1).toUpperCase())
  root.style.setProperty('--person-color', accent)
  if (url) { const image = el('img'); image.src = url; image.alt = ''; root.replaceChildren(image) }
  root.setAttribute('aria-hidden','true')
  return root
}
function identity(name: string, role: string) {
  const text = el('span','lp-directory-identity'); text.append(el('strong','',name))
  if (role) text.append(el('small','',role))
  return text
}
function searchBox(label: string, value: string) {
  const search = el('input','lp-input'); search.dataset.contactFocus=label; search.type='search'; search.placeholder=label; search.setAttribute('aria-label',label); search.value=value
  return search
}
function rememberScroll(content: HTMLElement, ui: ContactBrowserSession, key: 'scroll'|'sourceScroll'|'importScroll'|'bankScroll') {
  content.addEventListener('scroll', () => { if(content.isConnected)ui[key]=content.scrollTop }, {passive:true})
  content.addEventListener('click', () => { ui[key]=content.scrollTop }, {capture:true})
  const saved=ui[key] || 0
  requestAnimationFrame(() => { if(content.isConnected)content.scrollTop=saved })
}
function localBack(page: HTMLElement, label: string, action: () => void) {
  const old=page.querySelector('.lp-nav-action')
  const back=button('‹ Back','lp-nav-action'); back.setAttribute('aria-label',label); back.onclick=action; old?.replaceWith(back)
  page.addEventListener('keydown', event => { if(event.key==='Escape' && !(event.target as HTMLElement).closest('dialog')){event.preventDefault();event.stopPropagation();action()} })
}
function rerenderImport(host: ContactsViewHost) { host.select('', 'import', true) }
function rerenderBank(host: ContactsViewHost) { host.select('', 'bank', true) }

/** Recent means actual phone messages, rather than presence or a freshly created empty thread. */
export function recentContactTimes(host: Pick<ContactsViewHost,'state'>): Map<string,number> {
  const result=new Map<string,number>()
  for(const conversation of host.state.conversations) {
    const times=conversation.messages.filter(message=>message.sender!=='system').map(message=>Date.parse(message.createdAt)).filter(Number.isFinite)
    if(!times.length)continue
    const at=Math.max(...times)
    for(const id of conversation.participantContactIds)result.set(id,Math.max(result.get(id)||0,at))
  }
  return result
}
export function renderContactDirectory(host: ContactsViewHost): HTMLDivElement {
  const ui=session(host), {page,content}=host.page('Contacts',`${host.state.contacts.length} people`,{label:'Add',callback:()=>host.select('','import')})
  page.classList.add('lp-directory')
  const top=el('div','lp-directory-sticky'), search=searchBox('Search contacts',ui.query||''), filters=el('div','lp-directory-pills')
  filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter contacts')
  const group=el('select','lp-select');group.setAttribute('aria-label','Contact group')
  group.append(new Option('All groups',''))
  for(const item of host.state.contactGroups||[])group.append(new Option(item.name,item.id))
  group.value=ui.groupId||''; group.hidden=ui.filter!=='groups'
  const list=el('div','lp-directory-list'), index=el('nav','lp-directory-index'); index.setAttribute('aria-label','Contacts alphabet')
  const body=el('div','lp-directory-body');body.append(list,index)
  const recent=recentContactTimes(host)
  const render=()=>{
    list.replaceChildren();index.replaceChildren();group.hidden=ui.filter!=='groups'
    const selected=(host.state.contactGroups||[]).find(item=>item.id===ui.groupId)
    const contacts=host.state.contacts.filter(entry=>matches(entry.name+' '+entry.role,search.value)
      && (ui.filter!=='here'||entry.presence.inScene) && (ui.filter!=='recent'||recent.has(entry.id))
      && (ui.filter!=='groups'||!selected||selected.memberIds.includes(entry.id)))
      .sort(ui.filter==='recent'?(a,b)=>(recent.get(b.id)||0)-(recent.get(a.id)||0)||byName(a,b):byName)
    let lastLetter=''
    const letters=new Map<string,HTMLElement>()
    for(const entry of contacts){
      const letter=normalized(entry.name).charAt(0).toUpperCase().replace(/[^A-Z]/,'#')||'#'
      if(ui.filter!=='recent' && letter!==lastLetter){const heading=el('h2','lp-directory-letter',letter);list.append(heading);letters.set(letter,heading);lastLetter=letter}
      const row=button('','lp-directory-row');row.append(face(entry.name,contactAvatar(entry),contactAccent(entry)),identity(entry.name,entry.role))
      if(entry.presence.inScene)row.append(el('span','lp-directory-here','Here'))
      row.onclick=()=>host.select(entry.id,'detail'); list.append(row)
    }
    if(contacts.length>18 && ui.filter!=='recent')for(const [letter,node] of letters){
      const jump=button(letter,'lp-directory-jump');jump.setAttribute('aria-label',`Jump to ${letter} contacts`)
      jump.onclick=()=>node.scrollIntoView({block:'start'});index.append(jump)
    }
    if(!contacts.length)list.append(host.empty('No matching contacts',ui.filter==='recent'?'Your recent conversations will appear here.':'Try another search or add someone new.'))
    index.hidden=!index.childElementCount
  }
  for(const [key,label] of [['all','All'],['recent','Recent'],['here','Here'],['groups','Groups']] as const){
    const chip=button(label,'lp-directory-pill');chip.setAttribute('aria-pressed',String((ui.filter||'all')===key))
    chip.onclick=()=>{ui.filter=key;ui.scroll=0;content.scrollTop=0;for(const control of filters.querySelectorAll('button'))control.setAttribute('aria-pressed',String(control===chip));render()};filters.append(chip)
  }
  search.oninput=()=>{ui.query=search.value;ui.scroll=0;render()};group.onchange=()=>{ui.groupId=group.value;render()}
  const library=el('div','lp-directory-library')
  const bank=button('NPC Bank','lp-directory-link');bank.onclick=()=>host.selectGroup('','bank')
  const groups=button('Manage groups','lp-directory-link');groups.onclick=()=>host.selectGroup('','groups');library.append(bank,groups)
  top.append(search,filters,group,library);content.append(top)
  if(host.npcDraft){const draft=host.npcDraft,resume=button('','lp-directory-resume');resume.setAttribute('aria-label',`Continue ${draft.name} profile`);resume.append(face(draft.name,draft.avatarUrl),identity(draft.name,'Unsaved profile · continue'));resume.onclick=()=>host.select('','quick-gen');content.append(resume)}
  const sync=button('Sync current scene','lp-button lp-button-quiet')
  const operation=[...host.operations.values()].find(entry=>entry.task==='scene-sync'&&!['complete','error'].includes(entry.phase))
  sync.disabled=!host.capabilities?.generation||!host.capabilities?.sceneSync||Boolean(operation)
  sync.onclick=()=>host.send('lumiphone:sync_scene_contacts')
  const snapshot=host.state.sceneSnapshot
  const scene=disclosure('Scene presence',el('p','lp-copy',operation?.message||(!snapshot?'Sync to update who is here.':`${snapshot.stale?'Snapshot needs a refresh':'Snapshot up to date'} · ${snapshot.actors.length} people`)),sync)
  scene.classList.add('lp-directory-scene');content.append(scene,body);render();rememberScroll(content,ui,'scroll')
  return page
}
function sourceRow(host: ContactsViewHost, entry: PocketContactSourceOption|PocketNpcBankEntry) {
  const bank='aliases' in entry, linked=bank?linkedNpc(host,entry.id):host.state.contacts.find(contact=>contact.id===entry.importedContactId)
  const row=el('div','lp-directory-row')
  row.append(face(entry.name,entry.avatarUrl,entry.accent),identity(entry.name,entry.role))
  const add=button(linked?'Added':'Add','lp-directory-add');add.disabled=Boolean(linked);add.setAttribute('aria-label',`${linked?'Already added':'Add'} ${entry.name}`)
  add.onclick=()=>{add.disabled=true;add.textContent='Adding…';host.send(bank?'lumiphone:npc_bank_add':'lumiphone:import_contact',bank?{bankId:entry.id}:{kind:entry.kind,sourceId:entry.sourceId,itemId:entry.itemId})}
  row.append(add);return row
}
export function renderContactImport(host: ContactsViewHost): HTMLDivElement {
  const ui=session(host), labels:Record<Source,string>={casts:'Portable casts',bank:'NPC Bank',character:'Characters',council:'Council',search:'Search all sources'}
  const source=ui.source, {page,content}=host.page(source?labels[source]:'Add Contact',source?'Choose someone for this chat':'Someone new, or a familiar face')
  page.classList.add('lp-directory','lp-contact-import-browser')
  if(source){
    localBack(page,'Back to contact sources',()=>{const previous=ui.source;ui.source=undefined;rerenderImport(host);requestAnimationFrame(()=>document.querySelector<HTMLElement>(`[data-contact-source="${previous}"]`)?.focus({preventScroll:true}))})
    const top=el('div','lp-directory-sticky'), search=searchBox(source==='search'?'Search all sources':`Search ${labels[source].toLowerCase()}`,source==='search'?ui.importQuery||'':ui.sourceQuery||'')
    const list=el('div','lp-directory-list'), letters=el('div','lp-directory-alphabet'), count=el('p','lp-directory-count'), pages=el('div','lp-directory-pagination')
    const render=()=>{
      list.replaceChildren();pages.replaceChildren();letters.replaceChildren()
      const query=search.value
      const entries:Array<{name:string;role:string;terms:string;render:()=>HTMLElement}>=[]
      if(source==='bank'||source==='search')for(const entry of host.npcBank)entries.push({name:entry.name,role:entry.role,terms:[...entry.tags,...entry.aliases].join(' '),render:()=>sourceRow(host,entry)})
      if(['character','council','search'].includes(source))for(const entry of host.sources.filter(item=>source==='search'||item.kind===source))entries.push({name:entry.name,role:entry.role,terms:entry.kind,render:()=>sourceRow(host,entry)})
      if(source==='casts'||source==='search')for(const cast of host.bankGroups){
        const people=host.npcBank.filter(entry=>cast.memberIds.includes(entry.id))
        entries.push({name:cast.name,role:`${people.length} people · portable cast`,terms:people.map(item=>item.name).join(' '),render:()=>{
          const row=el('div','lp-directory-row'), stack=el('span','lp-directory-stack');for(const item of people.slice(0,3))stack.append(face(item.name,item.avatarUrl,item.accent))
          const add=button('Choose…','lp-directory-add');add.setAttribute('aria-label',`Choose members from ${cast.name}`);add.onclick=()=>host.selectGroup(cast.id,'cast-import')
          row.append(stack,identity(cast.name,`${people.length} people`),add);return row
        }})
      }
      const found=entries.filter(entry=>matches(entry.name+' '+entry.role+' '+entry.terms,query)).sort(byName)
      const max=Math.max(0,Math.ceil(found.length/36)-1); ui.sourcePage=Math.min(ui.sourcePage||0,max)
      count.textContent=`${found.length} ${found.length===1?'result':'results'}`
      for(const entry of found.slice(ui.sourcePage*36,(ui.sourcePage+1)*36))list.append(entry.render())
      if(!found.length)list.append(host.empty('No matches','Try a name, role, tag, or cast member.'))
      if(found.length>36){
        for(const letter of [...new Set(found.map(item=>normalized(item.name)[0]?.toUpperCase()||'#'))]){
          const jump=button(letter,'lp-directory-jump');jump.setAttribute('aria-label',`Browse ${letter} names`);jump.onclick=()=>{ui.sourcePage=Math.floor(found.findIndex(item=>(normalized(item.name)[0]?.toUpperCase()||'#')===letter)/36);render();content.scrollTop=0};letters.append(jump)
        }
        const previous=button('Previous','lp-directory-link'),next=button('Next','lp-directory-link')
        previous.disabled=ui.sourcePage===0;next.disabled=ui.sourcePage===max
        previous.onclick=()=>{ui.sourcePage!--;render();content.scrollTop=0};next.onclick=()=>{ui.sourcePage!++;render();content.scrollTop=0}
        pages.append(previous,el('span','',`${ui.sourcePage+1} / ${max+1}`),next)
      }
    }
    search.oninput=()=>{if(source==='search')ui.importQuery=search.value;else ui.sourceQuery=search.value;ui.sourcePage=0;ui.sourceScroll=0;render()}
    top.append(search,count,letters);content.append(top,list,pages);render();rememberScroll(content,ui,'sourceScroll');return page
  }
  const creator=el('section','lp-directory-creator');creator.append(el('h2','','Pocket NPC'),el('p','lp-copy','Make someone for this story.'))
  const description=el('textarea','lp-textarea');description.rows=2;description.maxLength=2000;description.value=host.generationBrief;description.placeholder='A sleepy florist with a sharp wit…';description.setAttribute('aria-label','NPC description');description.oninput=()=>host.updateGenerationBrief(description.value)
  const operation=[...host.operations.values()].find(entry=>entry.task==='npc-contact'&&!['complete','error'].includes(entry.phase))
  const generate=button(operation?'Generating…':'Generate NPC','lp-button lp-button-primary');generate.disabled=!host.capabilities?.generation||Boolean(operation)
  generate.onclick=()=>{if(!description.value.trim()){description.focus();return}host.select('','quick-gen');host.send('lumiphone:generate_contact',{description:description.value.trim()})}
  const manual=button('Create manually','lp-directory-link');manual.onclick=()=>host.select('','new')
  const actions=el('div','lp-directory-creator-actions');actions.append(generate,manual);creator.append(description,actions)
  if(host.npcDraft){const resume=button(`Continue ${host.npcDraft.name}’s profile`,'lp-directory-link');resume.onclick=()=>host.select('','quick-gen');creator.append(resume)}
  const search=searchBox('Search all saved people',ui.importQuery||'')
  const searchForm=el('form','lp-directory-global-search'),submit=button('Search','lp-directory-add');submit.type='submit';searchForm.append(search,submit)
  searchForm.onsubmit=event=>{event.preventDefault();ui.importQuery=search.value;ui.source='search';ui.sourcePage=0;rerenderImport(host)}
  search.oninput=()=>{ui.importQuery=search.value}
  const sources=el('nav','lp-directory-sources');sources.setAttribute('aria-label','Contact sources')
  for(const [key,label,total,help] of [
    ['casts','Portable casts',host.bankGroups.length,'Bring a group together'],
    ['bank','NPC Bank',host.npcBank.length,'Your reusable people'],
    ['character','Characters',host.sources.filter(item=>item.kind==='character').length,'Your character library'],
    ['council','Council',host.sources.filter(item=>item.kind==='council').length,'Active council members'],
  ] as const){
    const row=button('','lp-directory-source');row.dataset.contactSource=key;const text=identity(label,help);text.querySelector('strong')!.id='lp-contact-source-'+key;text.querySelector('small')!.id='lp-contact-source-help-'+key;row.setAttribute('aria-labelledby','lp-contact-source-'+key);row.setAttribute('aria-describedby','lp-contact-source-help-'+key);row.append(text,el('span','lp-directory-source-count',String(total)),el('span','lp-directory-chevron','›'))
    row.onclick=()=>{ui.source=key;ui.sourceQuery='';ui.sourcePage=0;ui.sourceScroll=0;rerenderImport(host);requestAnimationFrame(()=>document.querySelector<HTMLInputElement>('.lp-contact-import-browser input[type="search"]')?.focus({preventScroll:true}))};sources.append(row)
  }
  content.append(creator,searchForm,sources);rememberScroll(content,ui,'importScroll');return page
}
export function renderNpcBank(host: ContactsViewHost): HTMLDivElement {
  const ui=session(host),entry=host.npcBank.find(item=>item.id===ui.bankDetail),cast=host.bankGroups.find(item=>item.id===ui.castDetail)
  const {page,content}=host.page(entry?.name||cast?.name||'NPC Bank',entry?'Reusable profile':cast?'Portable cast':`${host.npcBank.length} people · ${host.bankGroups.length} casts`,
    entry?{label:'Edit',callback:()=>host.select(entry.id,'bank-entry')}:cast?{label:'Edit',callback:()=>host.selectGroup(cast.id,'cast-config')}:ui.bankTab==='casts'?{label:'New cast',callback:()=>host.selectGroup('','cast-config')}:undefined)
  page.classList.add('lp-directory','lp-npc-library')
  if(entry||cast){
    page.querySelector<HTMLElement>('.lp-nav-title')?.setAttribute('tabindex','-1')
    localBack(page,'Back to NPC Bank',()=>{const id=ui.bankDetail||ui.castDetail;ui.bankDetail=undefined;ui.castDetail=undefined;rerenderBank(host);requestAnimationFrame(()=>[...document.querySelectorAll<HTMLElement>('[data-bank-entry]')].find(node=>node.dataset.bankEntry===id)?.focus({preventScroll:true}))})
    if(entry){
      const hero=el('div','lp-bank-hero');hero.append(face(entry.name,entry.avatarUrl,entry.accent),el('h2','',entry.name),el('p','lp-copy',entry.role));content.append(hero,el('p','lp-bank-bio',entry.identityBrief))
      if(entry.tags.length)content.append(el('p','lp-bank-tags',entry.tags.map(tag=>'#'+tag).join(' ')))
      for(const [label,text] of [['Personality',entry.phoneProfile?.personality],['Appearance',entry.phoneProfile?.appearance],['Texting style',entry.phoneProfile?.textingStyle]] as const)if(text){const block=el('section','lp-bank-info');block.append(el('h3','',label),el('p','lp-copy',text));content.append(block)}
      const linked=linkedNpc(host,entry.id),add=button(linked?'Open contact':'Add to chat','lp-button lp-button-primary')
      add.onclick=()=>linked?host.select(linked.id,'detail'):host.send('lumiphone:npc_bank_add',{bankId:entry.id})
      const remove=button('Remove saved profile','lp-directory-link lp-bank-remove');remove.onclick=()=>{if(window.confirm(`Remove ${entry.name} from NPC Bank? Existing chat contacts stay.`)){ui.bankDetail=undefined;host.send('lumiphone:npc_bank_delete',{bankId:entry.id})}}
      content.append(add,remove)
    }else if(cast){
      const people=host.npcBank.filter(item=>cast.memberIds.includes(item.id)),add=button('Add cast','lp-button lp-button-primary')
      add.disabled=!people.length;add.onclick=()=>host.selectGroup(cast.id,'cast-import');content.append(add)
      for(const person of people){const row=button('','lp-directory-row');row.append(face(person.name,person.avatarUrl,person.accent),identity(person.name,person.role));row.onclick=()=>{ui.castDetail=undefined;ui.bankDetail=person.id;rerenderBank(host)};content.append(row)}
      const remove=button('Remove cast','lp-directory-link lp-bank-remove');remove.onclick=()=>{if(window.confirm(`Remove the ${cast.name} cast? Saved profiles stay.`)){ui.castDetail=undefined;host.saveCollection('lumiphone:npc_cast_delete',{groupId:cast.id})}};content.append(remove)
    }
    return page
  }
  const top=el('div','lp-directory-sticky'),search=searchBox('Search NPC Bank',ui.bankQuery||''),tabs=el('div','lp-directory-pills'),list=el('div','lp-directory-list')
  tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','NPC Bank collections')
  const render=()=>{
    list.replaceChildren()
    if(ui.bankTab==='casts'){
      for(const item of [...host.bankGroups].sort(byName)){
        const people=host.npcBank.filter(entry=>item.memberIds.includes(entry.id));if(!matches(item.name+' '+people.map(entry=>entry.name).join(' '),search.value))continue
        const row=button('','lp-directory-row'),stack=el('span','lp-directory-stack');for(const person of people.slice(0,3))stack.append(face(person.name,person.avatarUrl,person.accent))
        row.dataset.bankEntry=item.id;row.append(stack,identity(item.name,`${people.length} people`),el('span','lp-directory-chevron','›'));row.onclick=()=>{ui.castDetail=item.id;rerenderBank(host);requestAnimationFrame(()=>document.querySelector<HTMLElement>('.lp-npc-library .lp-nav-title')?.focus({preventScroll:true}))};list.append(row)
      }
    }else for(const person of [...host.npcBank].sort(byName)){
      if(!matches([person.name,person.role,...person.tags,...person.aliases].join(' '),search.value))continue
      const row=button('','lp-directory-row'),text=identity(person.name,person.role);if(person.tags.length)text.append(el('span','lp-bank-tags',person.tags.slice(0,3).map(tag=>'#'+tag).join(' ')))
      row.append(face(person.name,person.avatarUrl,person.accent),text);if(linkedNpc(host,person.id))row.append(el('span','lp-directory-here','Added'))
      row.dataset.bankEntry=person.id;row.onclick=()=>{ui.bankDetail=person.id;rerenderBank(host);requestAnimationFrame(()=>document.querySelector<HTMLElement>('.lp-npc-library .lp-nav-title')?.focus({preventScroll:true}))};list.append(row)
    }
    if(!list.childElementCount)list.append(host.empty(search.value?'No matches':ui.bankTab==='casts'?'No casts yet':'Your people, saved',search.value?'Try a name, role, tag, or cast member.':'Save NPC profiles from Contacts to reuse them here.'))
  }
  const panelId='lp-bank-collection';list.id=panelId;list.setAttribute('role','tabpanel')
  for(const [key,label] of [['npcs','NPCs'],['casts','Casts']] as const){
    const tab=button(label,'lp-directory-pill');tab.id='lp-bank-tab-'+key;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panelId);tab.setAttribute('aria-selected',String((ui.bankTab||'npcs')===key));tab.tabIndex=(ui.bankTab||'npcs')===key?0:-1
    tab.onclick=()=>{ui.bankTab=key;ui.bankScroll=0;rerenderBank(host);requestAnimationFrame(()=>document.getElementById('lp-bank-tab-'+key)?.focus({preventScroll:true}))}
    tab.onkeydown=event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=key==='npcs'?'casts':'npcs';ui.bankTab=event.key==='Home'?'npcs':event.key==='End'?'casts':next;rerenderBank(host);requestAnimationFrame(()=>document.getElementById('lp-bank-tab-'+ui.bankTab)?.focus())}}
    tabs.append(tab)
  }
  list.setAttribute('aria-labelledby','lp-bank-tab-'+(ui.bankTab||'npcs'))
  search.oninput=()=>{ui.bankQuery=search.value;ui.bankScroll=0;render()};top.append(tabs,search);content.append(top,list);render();rememberScroll(content,ui,'bankScroll');return page
}
