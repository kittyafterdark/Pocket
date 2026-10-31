import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir,readFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url)),output=resolve(root,'tmp/persona-colors')
await mkdir(output,{recursive:true})
const build=spawnSync('bun',['build','tests/fixtures/freeform-browser.ts','--target=browser','--format=esm',`--outfile=${output}/preview.js`],{cwd:root,encoding:'utf8'});if(build.status!==0)throw new Error(build.stderr)
const require=createRequire(import.meta.url),paths=[process.env.POCKET_PLAYWRIGHT_ROOT,resolve(root,'../../LumiTest/Lumiverse/scripts/e2e-diagnostics'),process.env.NODE_PATH].filter(Boolean),{chromium}=require(require.resolve('playwright',{paths})),script=await readFile(resolve(output,'preview.js'))
const server=createServer((req,res)=>{if(req.url.startsWith('/preview.js')){res.setHeader('Content-Type','text/javascript');res.end(script)}else res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/preview.js"></script>')})
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.POCKET_CHROMIUM_EXECUTABLE||undefined})
 for(const width of [390,900]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000)
  const press=name=>page.getByRole('button',{name,exact:typeof name==='string'})[width===390?'tap':'click'](),settings=async()=>{await press('Open app drawer');await press('Settings');await press(/^Personalization /);await press(/^Persona & phone identity/)}
  const saved=()=>page.evaluate(()=>window.freeformFixture.host.read('device/preferences.json'))
  const waitColor=(scope,key,value)=>page.waitForFunction(({scope,key,value})=>window.freeformFixture.host.sends.findLast(p=>p.type==='lumiphone:state'&&p.reason==='preferences')?.preferences.personaAppearance[scope]?.colors[key]===value,{scope,key,value})
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}`);await press('Open Freeform');await page.getByRole('combobox',{name:'Choose persona',exact:true}).selectOption('persona-fern');await page.getByRole('textbox',{name:'Session name',exact:true}).fill('Color regression');await press('Create session')
   const sessionId=await page.locator('.lumiphone-shell').getAttribute('data-pocket-chat-id');await settings();await press('Enable for Fern')
   await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('rose');await waitColor('persona-fern','accent','#ffb27d')
   await page.getByLabel('Accent',{exact:true}).fill('#f28c28');await waitColor('persona-fern','accent','#f28c28')
   await page.locator('summary').filter({hasText:'Advanced theme colors'}).click();await page.getByLabel('UI background',{exact:true}).fill('#17191c');await waitColor('persona-fern','background','#17191c')
   assert.equal((await saved()).personaAppearance['persona-fern'].colors.accent,'#f28c28','Background must preserve the saved orange accent')
   assert.equal(await page.getByLabel('Accent',{exact:true}).inputValue(),'#f28c28');assert.equal(await page.getByRole('combobox',{name:'Theme',exact:true}).inputValue(),'custom')
   const expected={accent:'#f28c28',background:'#17191c'}
   for(const [label,key,color]of [['Bezel','bezel','#222426'],['UI surface','surface','#292c30'],['UI text','text','#eeeeee'],['Home top','wallpaperPrimary','#3c2920'],['Home bottom','wallpaperSecondary','#493020'],['Chat top','chatPrimary','#1e2124'],['Chat bottom','chatSecondary','#25292d']]){await page.getByLabel(label,{exact:true}).fill(color);await waitColor('persona-fern',key,color);expected[key]=color;for(const [k,v]of Object.entries(expected))assert.equal((await saved()).personaAppearance['persona-fern'].colors[k],v,`${label} preserves ${k}`)}
   await page.evaluate(()=>{const host=window.freeformFixture.host,deliver=host.api.sendToFrontend;window.colorSaveTest={held:[],hold:true,release(){const all=this.held.splice(0);this.hold=false;for(const [payload,user]of all.reverse())deliver(payload,user)}};host.api.sendToFrontend=(payload,user)=>{if(window.colorSaveTest.hold&&payload.type==='lumiphone:state'&&payload.reason==='preferences')window.colorSaveTest.held.push([structuredClone(payload),user]);else deliver(payload,user)}})
   await page.getByLabel('Accent',{exact:true}).fill('#ef9020');await page.waitForFunction(()=>window.colorSaveTest.held.length===1)
   await page.getByLabel('UI background',{exact:true}).fill('#182028');await page.waitForFunction(()=>window.colorSaveTest.held.length===2);await page.evaluate(()=>window.colorSaveTest.release())
   assert.equal(await page.getByLabel('Accent',{exact:true}).inputValue(),'#ef9020');assert.equal(await page.getByLabel('UI background',{exact:true}).inputValue(),'#182028')
   assert.equal(await page.locator('.lumiphone-shell').evaluate(n=>n.style.getPropertyValue('--lp-bg')),'#182028','Late save acknowledgment must not rewind the live palette')
   await page.getByLabel('UI surface',{exact:true}).fill('#30363c');await waitColor('persona-fern','surface','#30363c');assert.equal((await saved()).personaAppearance['persona-fern'].colors.background,'#182028')
   await press('Independent session styling');await page.waitForFunction(()=>document.querySelector('button[aria-label="Independent session styling"]')?.getAttribute('aria-pressed')==='true');await page.locator('summary').filter({hasText:'Advanced theme colors'}).click()
   await page.getByLabel('Accent',{exact:true}).fill('#d96328');await waitColor(sessionId,'accent','#d96328');await page.getByLabel('UI background',{exact:true}).fill('#121518');await waitColor(sessionId,'background','#121518')
   await page.evaluate(async sessionId=>{const f=window.freeformFixture,p=f.host.read('device/preferences.json');p.homeWallpaper.source={kind:'builtin',wallpaperId:'sunset'};p.chatWallpaper.source={kind:'builtin',wallpaperId:'midnight-grid'};await f.send({type:'lumiphone:save_preferences',requestId:'gradient-fixture',chatId:sessionId,characterId:'_none',preferences:p})},sessionId)
   await press('Home or dismiss phone');await settings()
   for(const [kind,variable]of [['home','--lp-wallpaper'],['chat','--lp-chat-wallpaper']]){
     const control=page.locator(`[data-image-target="persona-${kind}"]`),clear=control.getByRole('button',{name:`Clear Fern ${kind} background`,exact:true}),reset=control.getByRole('button',{name:`Use default wallpaper for Fern ${kind}`,exact:true})
     assert.ok((await page.locator('.lumiphone-shell').evaluate((n,v)=>n.style.getPropertyValue(v),variable)).includes('url('))
     await clear.focus();await page.keyboard.press('Enter');assert.ok(!(await page.locator('.lumiphone-shell').evaluate((n,v)=>n.style.getPropertyValue(v),variable)).includes('url('),'Clear uses the gradient immediately');await page.waitForFunction(({sessionId,kind})=>window.freeformFixture.host.read('device/preferences.json').personaAppearance[sessionId][kind+'WallpaperEnabled']===true,{sessionId,kind});assert.equal(await reset.isEnabled(),true)
     await reset.click();await page.waitForFunction(({sessionId,kind})=>window.freeformFixture.host.read('device/preferences.json').personaAppearance[sessionId][kind+'WallpaperEnabled']===false,{sessionId,kind});assert.ok((await page.locator('.lumiphone-shell').evaluate((n,v)=>n.style.getPropertyValue(v),variable)).includes('url('),'Use default restores the inherited image');await clear.click();await page.waitForFunction(({sessionId,kind})=>window.freeformFixture.host.read('device/preferences.json').personaAppearance[sessionId][kind+'WallpaperEnabled']===true,{sessionId,kind})
   }
   const preferences=await saved();assert.equal(preferences.personaAppearance[sessionId].colors.accent,'#d96328');assert.equal(preferences.personaAppearance['persona-fern'].colors.accent,'#ef9020');await page.screenshot({path:resolve(output,`persona-colors-${width}.png`)})
   await press('Home or dismiss phone');await settings();assert.equal(await page.getByLabel('Accent',{exact:true}).inputValue(),'#d96328')
   await page.evaluate(()=>window.freeformFixture.remount());await press('Open Freeform');await page.getByRole('combobox',{name:'Choose persona',exact:true}).selectOption('persona-fern');await page.getByRole('combobox',{name:'Log in to session',exact:true}).selectOption(sessionId);await press('Log in to session');await settings();assert.equal(await page.getByLabel('Accent',{exact:true}).inputValue(),'#d96328');await page.locator('summary').filter({hasText:'Advanced theme colors'}).click();assert.equal(await page.getByLabel('UI background',{exact:true}).inputValue(),'#121518');assert.ok(!(await page.locator('.lumiphone-shell').evaluate(n=>n.style.getPropertyValue('--lp-wallpaper'))).includes('url('));assert.ok(!(await page.locator('.lumiphone-shell').evaluate(n=>n.style.getPropertyValue('--lp-chat-wallpaper'))).includes('url('));assert.deepEqual(errors,[])
   console.log(`Persona colors ${width}: sequential swatches, preset/custom state, reversed save replies, shared/independent styling and reopen/remount passed`)
  }catch(error){await page.screenshot({path:resolve(output,`failure-${width}.png`)});throw error}finally{await page.close()}
 }
}finally{await browser?.close();await new Promise(done=>server.close(done))}
