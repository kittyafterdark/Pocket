import {test,expect} from 'bun:test'
import {JSDOM} from 'jsdom'
import {defaultPreferences,normalizePreferences} from '../src/domain/preferences.js'
import {assignPocketWallpaper,personaWallpaperActive} from '../src/domain/wallpaper-scope.js'
import {wallpaperChoice} from '../src/frontend/components/wallpaper-choice.js'
import {renderContactsView,type ContactsViewHost} from '../src/frontend/apps/contacts.js'
import {PocketRouteHistory} from '../src/frontend/router.js'
import {recentContactTimes} from '../src/frontend/apps/contacts-browser.js'
import {normalizeContactCollections} from '../src/domain/contacts.js'

function fixture() {
  const dom=new JSDOM('<body/>',{pretendToBeVisual:true}),previous=new Map<string,PropertyDescriptor|undefined>()
  for(const [key,value] of Object.entries({document:dom.window.document,window:dom.window,Option:dom.window.Option,requestAnimationFrame:()=>0})){previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true})}
  const sends:any[]=[],ui={},host:ContactsViewHost={
    browser:ui,state:{contacts:[],conversations:[],contactGroups:[]} as any,selectedContactId:'',selectedView:'import',selectedGroupId:'',bankGroups:[],collectionDraft:undefined,collectionSaving:false,
    updateCollectionDraft(){},saveCollection:(type,payload)=>sends.push({type,...payload}),selectGroup:(id,view)=>{host.selectedGroupId=id;host.selectedView=view;render()},
    startGroup(){},generationBrief:'A florist',updateGenerationBrief:brief=>{host.generationBrief=brief},npcDraft:null,previousNpcDraft:null,
    sources:Array.from({length:720},(_,n)=>({kind:'character' as const,sourceId:'char-'+n,name:`Person ${String(n).padStart(3,'0')}`,role:n===719?'Astronomer':'Friend',avatarUrl:'',description:''})),
    npcBank:[],capabilities:{generation:true,images:true,imageGen:true} as any,operations:new Map(),
    page:(title,subtitle,action)=>{const page=document.createElement('div'),content=document.createElement('div'),nav=document.createElement('header'),back=document.createElement('button');nav.className='lp-nav';back.className='lp-nav-action';back.textContent='Back';nav.append(back);if(action){const button=document.createElement('button');button.textContent=action.label;button.onclick=action.callback;nav.append(button)}page.append(nav,content);return{page,content}},
    empty:(title,copy)=>{const node=document.createElement('p');node.textContent=title+' '+copy;return node},
    select:(id,view='detail')=>{host.selectedContactId=id;host.selectedView=view;render()},restorePreviousNpcDraft(){},openDirect(){},choosePhoto(){},uploadPhoto(){},generatePhoto(){},generateDraftPhoto(){},useSourcePhoto(){},requestSources(){},send:(type,payload)=>sends.push({type,...payload}),showError:message=>{throw new Error(message)},
  }
  const render=()=>document.body.replaceChildren(renderContactsView(host))
  const press=(name:string)=>{const button=[...document.querySelectorAll<HTMLButtonElement>('button')].find(control=>control.getAttribute('aria-label')===name||control.textContent===name);expect(button).toBeDefined();button!.click()}
  return{host,sends,render,press,close(){dom.window.close();for(const[key,descriptor]of previous)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete (globalThis as any)[key]}}
}
test('wallpaper-only Persona overrides persist, inherit on clear, and leave other phones intact',()=>{
  const prefs=defaultPreferences(),global=structuredClone(prefs.homeWallpaper)
  assignPocketWallpaper(prefs,{target:'persona-home',personaId:'till',source:{kind:'gallery',imageId:'portrait'}})
  expect(prefs.personaAppearance.till.enabled).toBe(false)
  expect(personaWallpaperActive(prefs.personaAppearance.till,'home')).toBe(true)
  expect(personaWallpaperActive(prefs.personaAppearance.till,'chat')).toBe(false)
  expect(prefs.homeWallpaper).toEqual(global)
  assignPocketWallpaper(prefs,{target:'persona-home',personaId:'other',source:{kind:'url',url:'https://example.test/a.png'}})
  const normalized=normalizePreferences(prefs)
  expect(personaWallpaperActive(normalized.personaAppearance.till,'home')).toBe(true)
  assignPocketWallpaper(normalized,{target:'persona-home',personaId:'till',source:null})
  expect(personaWallpaperActive(normalized.personaAppearance.till,'home')).toBe(false)
  expect(personaWallpaperActive(normalized.personaAppearance.other,'home')).toBe(true)
  expect(normalized.homeWallpaper).toEqual(global)
  const snapshot=structuredClone(normalized)
  expect(()=>assignPocketWallpaper(normalized,{target:'persona-home',source:null})).toThrow('Choose a Persona')
  expect(()=>assignPocketWallpaper(normalized,{target:'persona-home',personaId:'__proto__',source:null})).toThrow()
  expect(normalized).toEqual(snapshot)
})
test('wallpaper chooser defaults to this Persona, makes global explicit, and names every radio',()=>{
  const f=fixture()
  try{const applied:any[]=[];document.body.replaceChildren(wallpaperChoice({id:'till',name:'Till'},(_button,value)=>applied.push(value)))
    f.press('Set wallpaper');expect(applied[0]).toEqual({target:'persona-home',personaId:'till',personaName:'Till'})
    const global=document.querySelector<HTMLInputElement>('input[value="device"]')!;global.click()
    document.querySelector<HTMLInputElement>('input[value="chat"]')!.click();f.press('Set wallpaper')
    expect(applied[1]).toEqual({target:'device-chat'})
    for(const input of document.querySelectorAll('input'))expect(input.closest('label')?.textContent).toBeTruthy()
  }finally{f.close()}
})
test('Add Contact prioritizes creation and browses a large library without mounting all rows',()=>{
  const f=fixture()
  try{f.render();expect([...document.querySelectorAll('[data-contact-source]')].map(node=>(node as HTMLElement).dataset.contactSource)).toEqual(['casts','bank','character','council'])
    expect(document.querySelector('h2')?.textContent).toBe('Pocket NPC')
    document.querySelector<HTMLButtonElement>('[data-contact-source="character"]')!.click()
    expect(document.querySelectorAll('.lp-directory-row')).toHaveLength(36)
    const search=document.querySelector<HTMLInputElement>('input[type="search"]')!;search.value='Astronomer';search.dispatchEvent(new window.Event('input'))
    expect(document.querySelectorAll('.lp-directory-row')).toHaveLength(1);expect(document.body.textContent).toContain('Person 719')
    f.press('Add Person 719');expect(f.sends.at(-1)).toMatchObject({type:'lumiphone:import_contact',sourceId:'char-719'})
    f.render();expect(document.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('Astronomer')
    f.press('Back to contact sources');expect(document.body.textContent).toContain('Pocket NPC')
    f.press('Generate NPC');expect(f.sends.at(-1)).toMatchObject({type:'lumiphone:generate_contact',description:'A florist'})
  }finally{f.close()}
})
test('NPC Bank opens a compact profile, reuses linked contacts, and retains its filter on Back',()=>{
  const f=fixture()
  try{
    f.host.npcBank=[{id:'npc-a',name:'Fern',role:'Florist',identityBrief:'Long biography goes in the detail view.',aliases:[],tags:['flowers'],avatarUrl:'',accent:'#abcdef'} as any]
    f.host.state.contacts=normalizeContactCollections({contacts:[{id:'fern-local',name:'Fern',source:{kind:'npc',origin:'manual',bankId:'npc-a'}}]} as any,{characterId:'_none',characterName:'',now:'2026-10-29',makeId:()=>''}).contacts
    f.host.selectedView='bank';f.render()
    expect(document.body.textContent).not.toContain('Long biography')
    const search=document.querySelector<HTMLInputElement>('input[type="search"]')!;search.value='flowers';search.dispatchEvent(new window.Event('input'))
    document.querySelector<HTMLButtonElement>('.lp-directory-row')!.click()
    expect(document.body.textContent).toContain('Long biography');f.press('Open contact');expect(f.host.selectedContactId).toBe('fern-local');expect(f.sends).toHaveLength(0)
    f.host.selectedView='bank';f.render();f.press('Back to NPC Bank')
    expect(document.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('flowers')
  }finally{f.close()}
})
test('recent contacts use actual message dates, not scene presence or empty threads',()=>{
  const f=fixture()
  try{
    f.host.state.conversations=[{participantContactIds:['b'],messages:[{sender:'contact',createdAt:'2026-10-29'}]},{participantContactIds:['a'],messages:[]},{participantContactIds:['c'],messages:[{sender:'system',createdAt:'2026-10-30'}]}] as any
    expect([...recentContactTimes(f.host)]).toEqual([['b',Date.parse('2026-10-29')]])
  }finally{f.close()}
})
test('saving a generated profile removes completed review steps from Back history',()=>{
  const router=new PocketRouteHistory()
  router.navigate({app:'contacts'});router.navigate({app:'contacts',view:'import'});router.navigate({app:'contacts',view:'quick-gen'});router.navigate({app:'contacts',view:'draft'})
  router.settle({app:'contacts',contactId:'fern',view:'detail'},route=>route.app==='contacts'&&['draft','quick-gen'].includes(route.view||''))
  expect(router.back()).toEqual({app:'contacts',view:'import'})
  expect(router.back()).toEqual({app:'contacts'})
})
test('finished NPC preview keeps its portrait and offers Save instead of Skip',()=>{
  const f=fixture()
  try{f.host.selectedView='quick-gen';f.host.npcDraft={name:'Fern',role:'Florist',identityBrief:'A florist',avatarUrl:'https://example.test/fern.png',accent:'#abcdef',messagingStyle:{talkativeness:50,fragmentation:20},sourceDescription:'A florist'};f.render()
    expect(document.querySelector('img')?.alt).toBe('Fern portrait')
    expect(document.body.textContent).not.toContain('Skip images')
    f.press('Save Fern');expect(f.sends.at(-1)).toMatchObject({type:'lumiphone:save_contact',contact:{avatarOverrideUrl:'https://example.test/fern.png'}})
    expect([...document.querySelectorAll<HTMLButtonElement>('button')].find(button=>button.textContent==='Saving contact…')?.disabled).toBe(true)
  }finally{f.close()}
})
