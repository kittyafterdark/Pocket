import {expect,test} from 'bun:test';
import {JSDOM} from 'jsdom';
import {normalizeAuthoringPolicy} from '../src/domain/authoring-policy.js';
import {renderLumistryConnection,connectionOverrideControls} from '../src/frontend/apps/lumistry-connection.js';
import type {DatingHost} from '../src/frontend/apps/lumistry.js';

test('connection screen retains edits across toggles, disables inherited fields and restores saved settings',()=>{
 const dom=new JSDOM('<!doctype html><body></body>');const previous={document:globalThis.document,Option:globalThis.Option};
 Object.assign(globalThis,{document:dom.window.document,Option:dom.window.Option});
 try{
  const saved:any[]=[],h={ui:{},connectionSettings:normalizeAuthoringPolicy(null),connections:[{id:'writer',name:'Writer',provider:'fixture',model:'base'}],saveConnectionSettings:(v:any)=>saved.push(v),render(){}} as unknown as DatingHost;
  let page=renderLumistryConnection(h);document.body.append(page);const toggle=page.querySelector<HTMLInputElement>('input[type=checkbox]')!,fields=page.querySelector('fieldset')!;
  expect(toggle.closest('label')?.textContent).toBe('Override connection settings for the app');expect(fields.disabled).toBe(true);
  toggle.click();expect(fields.disabled).toBe(false);
  const connection=fields.querySelector('select')!,model=fields.querySelector('input')!;connection.value='writer';connection.dispatchEvent(new dom.window.Event('change'));model.value='custom';model.dispatchEvent(new dom.window.Event('change'));
  toggle.click();expect(fields.disabled).toBe(true);expect(saved.at(-1)).toMatchObject({connectionId:'writer',model:'custom',overrideConnection:false});
  toggle.click();expect(saved.at(-1)).toMatchObject({connectionId:'writer',model:'custom',overrideConnection:true});
  page=renderLumistryConnection(h);expect((page.querySelector('fieldset input') as HTMLInputElement).value).toBe('custom');
  const behavior=connectionOverrideControls(h);behavior.querySelector('button')!.click();expect(h.ui.settingsPage).toBe('connection');expect(h.ui.tab).toBe('settings');
 }finally{Object.assign(globalThis,previous);dom.window.close();}
});

test('legacy explicit authoring connection remains enabled and a new install inherits Pocket',()=>{
 expect(normalizeAuthoringPolicy(null).overrideConnection).toBe(false);
 expect(normalizeAuthoringPolicy({connectionId:'legacy'}).overrideConnection).toBe(true);
 expect(normalizeAuthoringPolicy({connectionId:'legacy',overrideConnection:false}).overrideConnection).toBe(false);
});
