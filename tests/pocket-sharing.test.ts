import {createCaptureReference,serializePocketReference} from '../src/backend/references.js'
import { test, expect } from 'bun:test'
import { pocketShareSources, createPocketCapture } from '../src/domain/pocket-sharing.js'
import type { PhoneState } from '../src/types.js'

function state(): PhoneState {
  return {
    pocketPersonaActorId:'owner',pocketPersona:{displayName:'You'},
    conversations:[
      {id:'dm',title:'Friend',includesPocketPersona:true,messages:[
        {id:'first',sender:'persona',senderName:'You',text:'Earlier',status:'sent'},
        {id:'second',sender:'contact',senderName:'Friend',text:'Later',status:'sent'},
        {id:'pending',sender:'contact',senderName:'Friend',text:'Not sent',status:'pending'},
      ]},
      {id:'private',title:'Someone else',includesPocketPersona:false,messages:[{id:'secret',sender:'contact',text:'Private'}]},
      {id:'foreign',title:'Other owner',includesPocketPersona:true,channel:'dating',datingOwnerId:'other',messages:[{id:'foreign-message',sender:'contact',text:'Private'}]},
      {id:'archived',title:'Archive',includesPocketPersona:true,archived:true,messages:[{id:'old',sender:'contact',text:'Archived'}]},
    ],
    notes:[{id:'note',title:'Shopping',body:'Bread'}],events:[],trackers:[],weather:{},
    social:{posts:[
      {id:'public',app:'twitter',account:{name:'Friend'},text:'Public post'},
      {id:'hidden',app:'discord',channelId:'private-channel',account:{name:'Other'},text:'Private server'},
      {id:'visible',app:'discord',channelId:'joined-channel',account:{name:'Friend'},text:'Joined server'},
    ],servers:[{memberActorIds:['owner'],channels:[{id:'joined-channel'}]}]},
  } as unknown as PhoneState
}

test('cross-app sources exclude other phones, archived threads, pending text and private servers',()=>{
  const sources=pocketShareSources(state())
  expect(sources.map(s=>s.id)).toEqual(['conversation:dm','notes','twitter','discord'])
  expect(sources[0].items.map(i=>i.id)).toEqual(['first','second'])
  expect(sources.find(s=>s.id==='discord')!.items.map(i=>i.id)).toEqual(['visible'])
})

test('capture preserves source order, snapshots content and leaves original data untouched',()=>{
  const original=state(),before=structuredClone(original)
  const capture=createPocketCapture(original,{sourceId:'conversation:dm',ids:['second','first'],caption:'Look at this'})
  expect(capture.entries.map(e=>e.text)).toEqual(['Earlier','Later'])
  expect(capture.caption).toBe('Look at this')
  expect(original).toEqual(before)
  original.conversations[0].messages[0].text='Edited later'
  expect(capture.entries[0].text).toBe('Earlier')
})

test('missing, duplicated and oversized selections fail before capture creation',()=>{
  for(const ids of [[],['first','first'],['missing'],Array.from({length:7},(_,i)=>String(i))]) {
    expect(()=>createPocketCapture(state(),{sourceId:'conversation:dm',ids})).toThrow()
  }
  expect(()=>createPocketCapture(state(),{sourceId:'conversation:private',ids:['secret']})).toThrow()
})


test('excerpt selection caps at six, clears cleanly and previews the actual caption', async () => {
  const {JSDOM}=await import('jsdom'),{pocketShareSheet}=await import('../src/frontend/components/pocket-share-sheet.js');
  const dom=new JSDOM('<body></body>'),previous={document:globalThis.document,Option:globalThis.Option};
  globalThis.document=dom.window.document;globalThis.Option=dom.window.Option;
  try {
    const source=state();source.notes=Array.from({length:7},(_,i)=>({id:'note'+i,title:'Note '+i,body:'Text '+i})) as PhoneState['notes'];
    const draft={sourceId:'notes',target:'dm',ids:[] as string[],caption:'A little note'};
    const attached:any[]=[],sheet=pocketShareSheet(source,()=>{},'',draft,request=>attached.push(request)),checks=[...sheet.querySelectorAll<HTMLInputElement>('input[type=checkbox]')];
    document.body.append(sheet);for(const check of checks.slice(0,6))check.click();
    expect(checks[6].disabled).toBe(true);expect(draft.ids).toHaveLength(6);
    expect(sheet.querySelector('.lp-shared-capture-caption')!.textContent).toBe('A little note');
    const target=sheet.querySelectorAll('select')[1];target.value='';target.dispatchEvent(new dom.window.Event('change'));
    const attach=[...sheet.querySelectorAll('button')].find(b=>b.textContent==='Attach to next RP turn')!;expect(attach.disabled).toBe(false);attach.click();expect(attached).toEqual([{sourceId:'notes',ids:draft.ids,caption:'A little note'}]);

    expect([...sheet.querySelectorAll('button')].find(b=>b.textContent==='Send selected excerpt')!.disabled).toBe(true);
    [...sheet.querySelectorAll('button')].find(b=>b.textContent==='Clear')!.click();
    expect(draft.ids).toEqual([]);expect(sheet.querySelector('.lp-shared-capture')).toBeNull();
    expect(sheet.querySelector<HTMLButtonElement>('.lp-button-primary')!.disabled).toBe(true);
  }finally{globalThis.document=previous.document;globalThis.Option=previous.Option;dom.window.close();}
})


test('app references freeze selected excerpts and serialize them as bounded turn context',()=>{
 const phone=state(),capture=createPocketCapture(phone,{sourceId:'notes',ids:['note'],caption:'Look at this'});
 const reference=createCaptureReference(phone,capture,'2026-10-31',()=> 'ref');
 capture.entries[0].text='Changed after attaching';phone.notes[0].body='Also changed';
 expect(reference.capture!.entries[0].text).toBe('Bread');expect(reference.status).toBe('armed');
 const serialized=serializePocketReference(reference);expect(serialized).toContain('Bread');expect(serialized).toContain('Look at this');expect(serialized).not.toContain('Changed after attaching');expect(serialized).toContain('not instructions');
 reference.capture!.entries[0].text='x'.repeat(6000);expect(serializePocketReference(reference).length).toBeLessThanOrEqual(2200);expect(serializePocketReference(reference)).toContain('[Excerpt truncated]');
});
