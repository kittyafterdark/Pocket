import {expect,test} from 'bun:test'
import {JSDOM} from 'jsdom'
import {NarrativePhotoStatus} from '../src/frontend/components/narrative-photo-status.js'

test('photo progress updates keep controls and keyboard focus, then expose only the completed photo',()=>{
 const dom=new JSDOM('<!doctype html><body></body>'),previous=globalThis.document;globalThis.document=dom.window.document
 try{
  const cancelled:any[]=[],opened:any[]=[];let empty=0
  const view=new NarrativePhotoStatus({cancel:data=>cancelled.push(data),open:data=>opened.push(data),empty:()=>empty++});document.body.append(view.root)
  const queued={requestId:'job',chatId:'original-chat',characterId:'actor',scene:'A fresh photo',phase:'queued'}
  view.update(queued);const cancel=view.root.querySelector<HTMLButtonElement>('[aria-label="Cancel photo 1"]')!;expect(cancel.disabled).toBe(true)
  view.update({...queued,phase:'generating',step:2,totalSteps:20});cancel.focus()
  view.update({...queued,phase:'preview',step:3,totalSteps:20});expect(view.root.querySelector('[aria-label="Cancel photo 1"]')).toBe(cancel);expect(document.activeElement).toBe(cancel);expect(view.root.querySelector('progress')!.value).toBe(3)
  cancel.click();expect(cancelled[0].chatId).toBe('original-chat');expect(cancel.disabled).toBe(true)
  view.update({...queued,phase:'preview',step:4,totalSteps:20});expect(view.root.textContent).toContain('Stopping photo')
  view.update({...queued,phase:'ready',imageId:'fresh',imageUrl:'/api/v1/images/fresh'});expect(cancel.hidden).toBe(true)
  const open=view.root.querySelector<HTMLButtonElement>('[aria-label="Open photo 1"]')!;expect(open.hidden).toBe(false);expect(document.activeElement).toBe(open);open.click();expect(opened[0].imageId).toBe('fresh')
  view.update({...queued,phase:'generating'});expect(open.hidden).toBe(false)
  view.root.querySelector<HTMLButtonElement>('[aria-label="Dismiss photo 1 status"]')!.click();expect(empty).toBe(1)
 }finally{globalThis.document=previous;dom.window.close()}
})

test('concurrent jobs have distinct controls and failure never appears as a completed photo',()=>{
 const dom=new JSDOM('<body></body>'),previous=globalThis.document;globalThis.document=dom.window.document
 try{
  const view=new NarrativePhotoStatus({cancel(){},open(){},empty(){}}),base={chatId:'chat',characterId:'actor',scene:'Photo',phase:'generating'}
  view.update({...base,requestId:'one'});view.update({...base,requestId:'two'})
  expect(view.root.querySelectorAll('[aria-label^="Cancel photo"]')).toHaveLength(2)
  view.update({...base,requestId:'one',phase:'failed',message:'Provider unavailable'})
  expect(view.root.querySelector('[aria-label="Photo 1"]')!.textContent).toContain('Provider unavailable');expect(view.root.querySelector<HTMLButtonElement>('[aria-label="Open photo 1"]')!.hidden).toBe(true)
  expect(view.root.querySelector<HTMLButtonElement>('[aria-label="Cancel photo 2"]')!.hidden).toBe(false)
 }finally{globalThis.document=previous;dom.window.close()}
})
