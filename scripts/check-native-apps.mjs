import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir,readFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url)),output=resolve(root,'tmp/native-apps')
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
  const open=async name=>{await press('Home or dismiss phone');await press('Open app drawer');await press(name)}
  const ready=()=>page.waitForFunction(()=>document.querySelector('.lp-native-app')?.getAttribute('aria-busy')==='false')
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}`)
   await page.evaluate(()=>{
    const host=window.freeformFixture.host,url='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><circle cx="120" cy="115" r="85" fill="#d1b6e6"/><path d="M80 140V90h70v50q-35 25-70 0" fill="#fff0cc"/><text x="120" y="180" font-size="24" text-anchor="middle" fill="#352848">oh hi</text></svg>'),photo={id:'native-sticker',url,mime_type:'image/png',original_filename:'Sleepy sticker',created_at:Math.floor(Date.now()/1000)}
    host.permissions.add('images');host.permissions.add('image_gen')
    host.api.images={get:async id=>{if(!id.startsWith('density-'))return photo;const n=Number(id.slice(8)),symbol=['♡','✦','☕','!','☺'][n%5],color=['#e7b4c7','#c8dba9','#a3c4d5','#c0b0de','#ebd09f'][n%5];return {...photo,id,url:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect x="15" y="15" width="130" height="130" rx="45" fill="${color}"/><text x="80" y="109" text-anchor="middle" font-family="Georgia" font-size="85" fill="#443950">${symbol}</text></svg>`)}} ,uploadFromDataUrl:async()=>({id:photo.id,url}),list:async()=>({data:[photo],total:1})}
    host.api.imageGen={listConnections:async()=>[],generateNative:async()=>({generated:true,imageId:photo.id,imageUrl:url})}
    host.api.generate.quiet=async request=>{
      const system=request.messages?.[0]?.content||'';let result
      if(system.includes("Pocket's maps app"))result={places:[{name:'Sunlit Gallery',city:'Harbour',category:'museum',description:'A tiny gallery full of light.',address:'8 Lantern Lane',hours:'10–6',price:'Free',x:35,y:44}]}
      else if(system.includes("Pocket's twitch app"))result=system.includes('live streams')?{streams:[{streamer:'River',title:'A tiny garden',category:'Just chatting',scene:'River waters the flowers.',viewers:50}]}:{scene:'River waves at the camera.',streamerReply:'Welcome, Fern!',viewers:51,chat:[{author:'leafy','text':'Such lovely flowers'}]}
      else if(system.includes("Pocket's browser app"))result={pages:[{title:'The Harbour Bookshop',summary:'A quiet shop beside the water.',paragraphs:['Warm lamps and old paper.','Every shelf has a little surprise.'],kind:'article'},{title:'A rainy afternoon thread',summary:'Locals compare cosy spots.',paragraphs:['The little shop is everyone’s favourite.'],kind:'forum'}]}
      else result={message:'A warm reply.',after:{state:'remote'}}
      return {content:JSON.stringify(result),finish_reason:'stop'}
    }
   })
   await press('Open Freeform');await page.getByRole('combobox',{name:'Choose persona',exact:true}).selectOption('persona-fern')
   await page.getByRole('textbox',{name:'Session name',exact:true}).fill('Native apps');await press('Create session')
   const sessionId=await page.locator('.lumiphone-shell').getAttribute('data-pocket-chat-id')
   await press('App Store')
   for(const name of ['Pocket Bank','Birthdays','Browser','Maps','Twitch','Stickers'])await press(`Get ${name}`)
   await page.evaluate(async sessionId=>{const f=window.freeformFixture,scope={chatId:sessionId,characterId:'_none'};await f.send({type:'lumiphone:save_roleplay_time',requestId:'native-clock',...scope,roleplayNow:'2026-10-30T12:00:00.000Z',timezoneOffsetMinutes:0});await f.send({type:'lumiphone:import_contact',requestId:'native-contact',...scope,kind:'character',sourceId:'host-character'});await f.send({type:'lumiphone:action',requestId:'native-money',...scope,action:'tracker',payload:{id:'native-money',key:'money',label:'Money',kind:'counter',value:1000,initialValue:0,min:0,max:10000,unit:'USD',updateMode:'manual',presentation:'counter',step:.01}})},sessionId)
   await open('Pocket Bank');await press('Wallet settings');await page.getByRole('spinbutton',{name:'Balance',exact:true}).fill('1000');await page.getByRole('button',{name:'Save balance',exact:true}).focus();await page.keyboard.press('Enter');await ready()
   await page.getByRole('combobox',{name:'Money tracker',exact:true}).selectOption('native-money');await press('Use bank balance');await ready()
   await press('Home');await press('Pay');await page.getByRole('spinbutton',{name:'Amount',exact:true}).fill('12.5');await page.getByRole('textbox',{name:'Description',exact:true}).fill('A little tea');await press('Save payment');await ready()
   await page.getByText('A little tea',{exact:true}).waitFor();assert.equal(await page.locator('.lp-wallet-balance').innerText(),'$987.50')
   await page.screenshot({path:resolve(output,`wallet-${width}.png`)})
   await open('Birthdays');await press('Add birthday');await page.getByRole('textbox',{name:'Name',exact:true}).fill('Alex');await page.getByLabel('Birthday',{exact:true}).fill('2000-11-02');await press('Save birthday');await ready();await press('Add Alex birthday to Timeline');await ready()
   const birthdayDay=page.getByRole('button',{name:'November 2, 2026, 1 birthday',exact:true});await birthdayDay.focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('button',{name:'November 3, 2026',exact:true}).evaluate(node=>node===document.activeElement),true);await page.keyboard.press('ArrowLeft');await press('Next month');await press('Previous month');await press('November 2, 2026, 1 birthday')
   await page.screenshot({path:resolve(output,`birthdays-${width}.png`)})
   await open('Browser');await page.getByRole('searchbox',{name:'Search or enter address',exact:true}).fill('A quiet bookshop');await page.getByRole('searchbox',{name:'Search or enter address',exact:true}).press('Enter');await ready();await press('The Harbour Bookshop')
   await ready();await press('Save bookmark');await ready();await page.screenshot({path:resolve(output,`browser-${width}.png`)})
   await page.locator('summary[aria-label="Browser menu"]').click();await press('Open private session');await ready();await page.getByRole('searchbox',{name:'Search or enter address',exact:true}).fill('Private quiet places');await page.getByRole('searchbox',{name:'Search or enter address',exact:true}).press('Enter');await ready()
   await page.locator('summary[aria-label="Browser menu"]').click();await press('Close private session');await ready();await page.locator('summary[aria-label="Browser menu"]').click();await press('Quizzes');await press('The little getaway quiz');await ready();await press('What kind of little getaway are you?')
   for(const name of ['Somewhere I have never been','A camera','Find a new place to duck into'])await page.getByRole('radio',{name,exact:true}).check()
   await press('See my result');await ready();await page.getByRole('heading',{name:'The curious wanderer',exact:true}).waitFor()
   await page.screenshot({path:resolve(output,`quiz-${width}.png`)})
   await open('Maps');await page.getByRole('searchbox',{name:'Place or neighbourhood',exact:true}).fill('Art near the harbour');await press('Explore places');await ready();await press('Show Sunlit Gallery');await press('Save');await ready()
   const beforePan=await page.locator('.mp-world').getAttribute('style');await press('Zoom in');assert.notEqual(await page.locator('.mp-world').getAttribute('style'),beforePan)
   const map=page.getByRole('region',{name:/Neighbourhood map/});await map.focus();const panned=await page.locator('.mp-world').getAttribute('style');await page.keyboard.press('ArrowRight');assert.notEqual(await page.locator('.mp-world').getAttribute('style'),panned);await press('Route');assert.equal(await page.getByRole('button',{name:'Route',exact:true}).getAttribute('aria-pressed'),'true');await press('Route')
   await press('Plan');await page.getByRole('textbox',{name:'When would you like to go?',exact:true}).fill('Tomorrow afternoon');await press('Add a plan to Timeline');await ready();await page.screenshot({path:resolve(output,`maps-${width}.png`)})
   await open('Twitch');await press('Discover live streams');await ready();await press('Watch A tiny garden by River');await page.getByRole('textbox',{name:'Chat message',exact:true}).fill('Hello River');await press('Send chat message');await ready()
   await page.getByText('Welcome, Fern!',{exact:false}).waitFor();await press('Send a donation');await page.getByRole('spinbutton',{name:'Donation amount',exact:true}).fill('5');await press('Send donation');await ready();await page.screenshot({path:resolve(output,`twitch-${width}.png`)})
   await open('Stickers');await press('Add stickers');await page.getByRole('textbox',{name:'Sticker description',exact:true}).fill('A sleepy coffee chibi');await page.getByRole('textbox',{name:'Short caption (optional)',exact:true}).fill('oh hi');await press('Generate a chibi sticker');await ready();await press('Accept sticker');await ready()
   await page.evaluate(async sessionId=>{for(let i=0;i<24;i++)await window.freeformFixture.send({type:'lumiphone:native',requestId:'density-'+i,chatId:sessionId,characterId:'_none',app:'stickers',action:'save',data:{imageId:'density-'+i,description:'Reaction '+i,caption:'Reaction '+i}})},sessionId)
   assert.equal(await page.locator('.st-library-sticker').count(),25)
   assert.equal(await page.locator('.st-library-grid').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length),5)
   await page.getByRole('searchbox',{name:'Find a sticker',exact:true}).fill('oh hi');assert.equal(await page.locator('.st-library-sticker').count(),1);await page.getByRole('searchbox',{name:'Find a sticker',exact:true}).fill('');await press('Edit stickers');await press('Select sticker oh hi');assert.equal(await page.getByRole('button',{name:'Select sticker oh hi',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.getByRole('button',{name:'Delete selected',exact:true}).isEnabled(),true);assert.equal(await page.getByRole('button',{name:'Select sticker oh hi',exact:true}).evaluate(node=>node===document.activeElement),true);await press('Finish editing stickers')
   await page.screenshot({path:resolve(output,`stickers-${width}.png`)})
   await open('Messages');await page.getByRole('button',{name:/Alex/}).first().click();await press('Attach to message');await page.keyboard.press('End');assert.equal(await page.getByRole('menuitem',{name:'Schedule event',exact:true}).evaluate(node=>node===document.activeElement),true);await page.keyboard.press('Escape');assert.equal(await page.getByRole('menu').count(),0);assert.equal(await page.getByRole('button',{name:'Attach to message',exact:true}).evaluate(node=>node===document.activeElement),true);await press('Attach to message');await page.getByRole('menuitem',{name:'Stickers',exact:true}).click()
   await page.getByRole('region',{name:'Stickers',exact:true}).waitFor();assert.equal(await page.getByRole('dialog').count(),0)
   await page.keyboard.press('Escape');assert.equal(await page.getByRole('region',{name:'Stickers',exact:true}).count(),0);assert.equal(await page.locator('[data-pocket-composer]').evaluate(node=>node===document.activeElement),true);await press('Attach to message');await page.getByRole('menuitem',{name:'Stickers',exact:true}).click()
   const tray=await page.locator('.st-chat-tray').boundingBox(),thread=await page.locator('[data-pocket-thread]').boundingBox();assert.ok(tray.y>=thread.y+thread.height-2,'Sticker tray consumes space rather than obscuring chat')
   await page.screenshot({path:resolve(output,`sticker-tray-${width}.png`)})
   await press('Send sticker oh hi');await page.locator('.lp-sticker-message').waitFor();await page.screenshot({path:resolve(output,`sticker-chat-${width}.png`)})
   const saved=await page.evaluate(sessionId=>window.freeformFixture.host.read(`phones/${sessionId}___none.json`),sessionId),data=Object.values(saved.nativeApps)[0]
   assert.equal(data.wallet.balance,982.5);assert.equal(saved.trackers.find(t=>t.id==='native-money').value,982.5);assert.equal(data.wallet.trackerId,'native-money');assert.equal(data.browser.pages.length,2);assert.ok(data.browser.bookmarks.length);assert.ok(data.browser.quizzes[0].answers);assert.ok(data.browser.places[0].saved);assert.equal(data.birthdays[0].name,'Alex');assert.equal(data.stickers.length,25);assert.ok(saved.events.some(e=>e.title==='Alex’s birthday'));assert.ok(saved.events.some(e=>e.title==='Visit Sunlit Gallery'));assert.ok(saved.conversations.some(c=>c.messages.some(m=>m.sticker?.caption==='oh hi')))
   await page.evaluate(()=>window.freeformFixture.remount());await press('Open Freeform');await page.getByRole('combobox',{name:'Choose persona',exact:true}).selectOption('persona-fern');await page.getByRole('combobox',{name:'Log in to session',exact:true}).selectOption(sessionId);await press('Log in to session');await press('Open app drawer');await press('Pocket Bank');await page.getByText('$982.50',{exact:true}).waitFor()
   assert.equal(await page.locator('.lp-native-app').evaluate(node=>node.scrollWidth>node.clientWidth+2),false)
   const safe=await page.getByRole('button',{name:'Home or dismiss phone',exact:true}).boundingBox();if(width===390)assert.ok(safe.y>=47)
   assert.deepEqual(errors,[]);console.log(`Native apps ${width}: Store, wallet, birthdays/Timeline, browser/private pages/quizzes, Maps, Twitch donations, generated stickers and remount passed`)
  }catch(error){await page.screenshot({path:resolve(output,`failure-${width}.png`)});console.error((await page.locator('body').innerText()).slice(-5000));console.error(errors);throw error}
  finally{await page.close()}
 }
}finally{await browser?.close();await new Promise(done=>server.close(done))}
