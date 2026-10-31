import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir,readFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url)),output=resolve(root,'tmp/persona-portrait')
await mkdir(output,{recursive:true})
const build=spawnSync('bun',['build','tests/fixtures/freeform-browser.ts','--target=browser','--format=esm',`--outfile=${output}/preview.js`],{cwd:root,encoding:'utf8'});if(build.status!==0)throw new Error(build.stderr)
const require=createRequire(import.meta.url),paths=[process.env.POCKET_PLAYWRIGHT_ROOT,resolve(root,'../../LumiTest/Lumiverse/scripts/e2e-diagnostics'),process.env.NODE_PATH].filter(Boolean),{chromium}=require(require.resolve('playwright',{paths})),script=await readFile(resolve(output,'preview.js'))
const server=createServer((req,res)=>{if(req.url.startsWith('/preview.js')){res.setHeader('Content-Type','text/javascript');res.end(script)}else if(req.url.startsWith('/avatar/')){res.setHeader('Content-Type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#ffa050"/><text x="60" y="85" text-anchor="middle" font-size="70">K</text></svg>')}else res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/preview.js"></script>')})
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.POCKET_CHROMIUM_EXECUTABLE||undefined})
 for(const width of [390,900]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000)
  const press=name=>page.getByRole('button',{name,exact:typeof name==='string'})[width===390?'tap':'click']()
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}`)
   await page.evaluate(async()=>{const f=window.freeformFixture,host=f.host;host.permissions.add('images');Object.assign(host.personas[1],{name:'Katsuki Bakugo',image_id:'old-original',metadata:{avatar_crop_image_id:'katsuki-crop'}});host.api.images={get:async id=>({id,url:'/avatar/'+id+'.svg'})};await f.send({type:'lumiphone:get_state',requestId:'portrait-initial',chatId:'host-chat',characterId:'host-character'});const payload=host.sends.findLast(p=>p.type==='lumiphone:state'),state=payload.state;state.setup.initialized=true;state.setup.dismissed=true;await host.api.userStorage.setJson('phones/host-chat__host-character.json',state);await f.send({type:'lumiphone:get_state',requestId:'portrait-ready',chatId:'host-chat',characterId:'host-character'})})
   await press('Open Roleplay');await press(/^Open Katsuki Bakugo's phone/);await press('Open app drawer');await press('App Store');await press('Get Twitter');await press('Home or dismiss phone');await press('Open app drawer');await press('Twitter');await press('Twitter profile')
   const image=page.locator('.lp-social-profile-head .lp-social-avatar img');await image.waitFor();assert.equal(await image.getAttribute('src'),'/avatar/katsuki-crop.svg');await image.evaluate(img=>img.decode());await page.screenshot({path:resolve(output,`roleplay-persona-${width}.png`)})
   await page.evaluate(async()=>{const f=window.freeformFixture;f.host.personas[1].metadata.avatar_crop_image_id='katsuki-new-crop';await f.send({type:'lumiphone:get_state',requestId:'portrait-changed',chatId:'host-chat',characterId:'host-character'})});assert.equal(await image.getAttribute('src'),'/avatar/katsuki-new-crop.svg')
   await press('Home or dismiss phone');await press('Open app drawer');await press('Twitter');await press('Twitter profile');assert.equal(await image.getAttribute('src'),'/avatar/katsuki-new-crop.svg')
   await page.evaluate(async()=>{const f=window.freeformFixture,path='phones/host-chat__host-character.json',state=f.host.read(path);state.pocketPersona={...state.pocketPersona,source:'manual',linkedPersonaId:'',avatarUrl:'/avatar/old-original.svg'};await f.host.api.userStorage.setJson(path,state);await f.send({type:'lumiphone:get_state',requestId:'old-pocket',chatId:'host-chat',characterId:'host-character'})});assert.equal(await image.getAttribute('src'),'/avatar/old-original.svg')
   await press('Home or dismiss phone');await press('Home or dismiss phone');await page.getByRole('button',{name:'Refresh Persona portrait',exact:true}).focus();await page.keyboard.press('Enter');await page.getByText('Persona portrait refreshed.',{exact:true}).waitFor();const statusBox=await page.locator('.lumiphone-portrait-status').boundingBox(),buttonBoxes=await page.locator('.lumiphone-device-footer button').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().bottom));assert.ok(statusBox.y>=Math.max(...buttonBoxes),'Confirmation belongs below all footer buttons');await page.screenshot({path:resolve(output,'portrait-sidebar-'+width+'.png')});assert.equal(await page.locator('.lumiphone-device-row[data-persona="true"] img').getAttribute('src'),'/avatar/katsuki-new-crop.svg')
   await press(/^Open Katsuki Bakugo's phone/);await press('Open app drawer');await press('Twitter');await press('Twitter profile');assert.equal(await image.getAttribute('src'),'/avatar/katsuki-new-crop.svg')

   await page.evaluate(async()=>{const f=window.freeformFixture;f.host.personas.push({id:'katsuki-second',name:'Katsuki Bakugo',description:'Alternate portrait',title:'',image_id:'katsuki-alternate',metadata:{}});const path='phones/host-chat__host-character.json',state=f.host.read(path);state.pocketPersona.linkedPersonaId='persona-fern';await f.host.api.userStorage.setJson(path,state);await f.send({type:'lumiphone:get_state',requestId:'duplicates',chatId:'host-chat',characterId:'host-character'})})
   await press('Home or dismiss phone');await press('Home or dismiss phone');await press('Refresh Persona portrait')
   const choices=page.getByRole('region',{name:'Choose Persona portrait',exact:true});await choices.waitFor();assert.equal(await choices.locator('img').count(),2)
   await page.screenshot({path:resolve(output,'portrait-choices-'+width+'.png')});await press('Cancel portrait selection');assert.equal(await choices.count(),0)
   await press('Refresh Persona portrait');const alternate=page.getByRole('button',{name:'Use portrait from Katsuki Bakugo (katsuki-second)',exact:true});await alternate.focus();await page.keyboard.press('Enter')
   await page.getByText('Persona portrait refreshed.',{exact:true}).waitFor();assert.equal(await page.locator('.lumiphone-device-row[data-persona="true"] img').getAttribute('src'),'/avatar/katsuki-alternate.svg')
   await press(/^Open Katsuki Bakugo's phone/);await press('Open app drawer');await press('Twitter');await press('Twitter profile');assert.equal(await image.getAttribute('src'),'/avatar/katsuki-alternate.svg')
   assert.deepEqual(errors,[]);console.log(`Normal roleplay Persona ${width}: avatar crop precedes old original, updates on refresh, and survives app navigation`)
  }catch(error){await page.screenshot({path:resolve(output,`failure-${width}.png`)});console.error((await page.locator('body').innerText()).slice(-1500));throw error}finally{await page.close()}
 }
}finally{await browser?.close();await new Promise(done=>server.close(done))}
