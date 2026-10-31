import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir,readFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url)),output=resolve(root,'tmp/community-apps')
await mkdir(output,{recursive:true})
const build=spawnSync('bun',['build','tests/fixtures/freeform-browser.ts','--target=browser','--format=esm',`--outfile=${output}/preview.js`],{cwd:root,encoding:'utf8'})
if(build.status!==0)throw new Error(build.stderr)
const require=createRequire(import.meta.url),paths=[process.env.POCKET_PLAYWRIGHT_ROOT,resolve(root,'../../LumiTest/Lumiverse/scripts/e2e-diagnostics'),process.env.NODE_PATH].filter(Boolean)
const {chromium}=require(require.resolve('playwright',{paths})),script=await readFile(resolve(output,'preview.js'))
const server=createServer((request,response)=>{if(request.url.startsWith('/preview.js')){response.setHeader('Content-Type','text/javascript');response.end(script)}else response.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/preview.js"></script>')})
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.POCKET_CHROMIUM_EXECUTABLE||undefined})
 for(const width of [390,900]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'}),errors=[]
  page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(12000)
  const press=name=>page.getByRole('button',{name,exact:true})[width===390?'tap':'click']()
  try{
   await page.route('https://pocket-fixture.invalid/cover.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#254c68"/><circle cx="285" cy="120" r="65" fill="#f1be93"/><path d="M0 280Q100 160 220 290T400 250V400H0" fill="#86b0aa"/><path d="M0 340Q100 260 240 330T400 300V400H0" fill="#19394b"/><text x="30" y="60" font-family="Georgia" font-size="25" fill="#fff0d4">SYNTHETIC SUNRISE</text><text x="30" y="370" font-family="monospace" font-size="14" fill="#fff0d4">FIXTURE BAND / POCKET SESSIONS</text></svg>'}))
   await page.goto(`http://127.0.0.1:${server.address().port}`)
   await press('Open Freeform');await page.getByRole('combobox',{name:'Choose persona',exact:true}).selectOption('persona-fern')
   await page.getByRole('textbox',{name:'Session name',exact:true}).fill('Community apps');await press('Create session')
   await page.getByRole('button',{name:'Settings',exact:true}).waitFor()
   const sessionId=await page.locator('.lumiphone-shell').getAttribute('data-pocket-chat-id')
   await press('Open app drawer');await press('App Store')
   for(const name of ['Lumistry','Spotify Share','Screenshots']){await press(`Get ${name}`);await page.getByRole('button',{name:`Open ${name}`,exact:true}).waitFor()}
   await page.screenshot({path:resolve(output,`store-${width}.png`)})
   await press('Open Lumistry')
   await page.locator('.lumistry').waitFor();await page.screenshot({path:resolve(output,`lumistry-start-${width}.png`)})
   await page.evaluate(async sessionId=>{
    const fixture=window.freeformFixture,scope={chatId:sessionId,characterId:'_none'}
    await fixture.send({type:'lumiphone:dating',requestId:'fixture-self',...scope,action:'self',profile:{alias:'Moon',age:25,fields:{interests:'books'}}})
    await fixture.send({type:'lumiphone:import_contact',requestId:'fixture-contact',...scope,kind:'character',sourceId:'host-character'})
    await fixture.send({type:'lumiphone:action',requestId:'fixture-note',...scope,action:'note',payload:{title:'Shared note',text:'A saved synthetic excerpt to share.'}})
   },sessionId)
   await press('Home or dismiss phone');await press('Open app drawer');await press('Lumistry')
   await page.locator('.lumistry').waitFor();await page.screenshot({path:resolve(output,`lumistry-profile-${width}.png`)})
   assert.equal(await page.locator('.lumistry').evaluate(node=>node.scrollWidth>node.clientWidth+2),false,'Lumistry must fit the phone width')
   await press('Home or dismiss phone');await press('Open app drawer');await press('Spotify Share')
   await page.evaluate(()=>{
    const values={spotify_now_playing:'Synthetic Sunrise by Fixture Band',spotify_track_name:'Synthetic Sunrise',spotify_artists:'Fixture Band',spotify_album_name:'Fixture Album',spotify_album_art:'https://pocket-fixture.invalid/cover.svg',spotify_is_playing:'true',spotify_has_lyrics:'true',spotify_lyrics:Array.from({length:48},(_,i)=>`君を好きだけじゃものたりない 会いに行ったら泣いてしまう ${i+1}`).join('\n')}
    window.freeformFixture.host.api.macros.resolve=async template=>({text:template.replace(/\{\{(spotify_\w+)\}\}/g,(_,key)=>values[key]||''),diagnostics:[]})
   })
   await press('Refresh current song')
   await page.locator('.lp-song-details h2').filter({hasText:'Synthetic Sunrise'}).waitFor()
   await page.waitForFunction(()=>document.querySelector('.lp-song-art > img')?.naturalWidth>0)
   await page.screenshot({path:resolve(output,`spotify-player-${width}.png`)})
   const target=page.getByRole('combobox',{name:'Send to',exact:true});await target.selectOption({label:'Alex'});await press('Share this song')
   await page.getByRole('dialog',{name:'Share a song',exact:true}).waitFor();await page.getByRole('dialog').getByText('Synthetic Sunrise',{exact:true}).waitFor()
   await page.getByRole('combobox',{name:'Include',exact:true}).selectOption('excerpt')
   const lines=page.locator('.lp-spotify-line-scroll'),firstLine=lines.getByRole('checkbox').first()
   await firstLine.focus();await page.keyboard.press('Space');assert.equal(await firstLine.isChecked(),true)
   assert.equal(await lines.locator('label').first().evaluate(node=>getComputedStyle(node).display),'grid')
   assert.ok(await lines.evaluate(node=>node.scrollHeight>node.clientHeight),'Long lyrics scroll within their picker')
   assert.equal(await page.getByRole('dialog').evaluate(node=>node.scrollWidth>node.clientWidth+2),false)
   await page.screenshot({path:resolve(output,`spotify-lyrics-${width}.png`)})
   await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Share a song',exact:true}).waitFor({state:'hidden'})
   await page.getByRole('button',{name:'Share this song',exact:true}).focus();await page.keyboard.press('Enter')
   await page.getByRole('dialog',{name:'Share a song',exact:true}).waitFor()
   const modalTop=await page.getByRole('dialog',{name:'Share a song',exact:true}).boundingBox();assert.ok(modalTop.y>=47,'Preview respects the host safe top')
   await page.screenshot({path:resolve(output,`spotify-preview-${width}.png`)})
   await press('Share song')
   await page.locator('[data-pocket-thread] .lp-spotify-card').waitFor()
   await press('Home or dismiss phone');await press('Open app drawer');await press('Screenshots')
   await page.getByRole('combobox',{name:'Source app or conversation',exact:true}).selectOption('notes')
   await page.getByRole('combobox',{name:'Send to',exact:true}).selectOption({label:'Alex'})
   await page.getByRole('checkbox',{name:/Shared note/}).check()
   await page.screenshot({path:resolve(output,`sharing-preview-${width}.png`)})
   await page.getByRole('button',{name:'Send selected excerpt',exact:true}).focus();await page.keyboard.press('Enter');await page.locator('[data-pocket-thread] .lp-shared-capture').waitFor()
   await page.screenshot({path:resolve(output,`shared-chat-${width}.png`)})
   const saved=await page.evaluate(sessionId=>window.freeformFixture.host.read(`phones/${sessionId}___none.json`),sessionId)
   assert.ok(saved.conversations.some(c=>c.messages.some(m=>m.spotifyShare?.title==='Synthetic Sunrise')))
   assert.ok(saved.conversations.some(c=>c.messages.some(m=>m.sharedCapture?.title==='Notes')))
   assert.deepEqual(errors,[])
   console.log(`Community apps ${width}: Store installation, Lumistry setup, Spotify preview/send and cross-app excerpts passed`)
  }catch(error){await page.screenshot({path:resolve(output,`failure-${width}.png`)});console.error(await page.locator('body').innerText());console.error(errors);throw error}
  finally{await page.close()}
 }
}finally{await browser?.close();await new Promise(done=>server.close(done))}
