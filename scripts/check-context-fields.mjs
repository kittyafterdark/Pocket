import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir,readFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url)),output=resolve(root,'tmp/context-fields')
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
      else if(system.includes("Pocket's twitch app"))result=system.includes('live streams')?{streams:[{streamer:'River',title:'A tiny garden',category:'Just chatting',scene:'River waters the flowers.',viewers:50},...['Games','Art','Software & Dev','Cooking','Music'].map((category,i)=>({streamer:['PawsAndPixels','MochiMew','ClawdiaCode','PurrfectlyPastry','MidnightMeowMusic'][i],title:['Ranked grind with friends','Late night watercolors','Building a tiny app','Baking little treats','Midnight study session'][i],category,scene:'A cozy evening stream',viewers:120+i*211}))]}:{scene:'River waves at the camera.',streamerReply:'Welcome, Fern!',viewers:51,chat:[{author:'leafy','text':'Such lovely flowers'}]}
      else if(system.includes("Pocket's browser app"))result={pages:[{title:'The Harbour Bookshop',summary:'A quiet shop beside the water.',paragraphs:['Warm lamps and old paper.','Every shelf has a little surprise.'],kind:'article'},{title:'A rainy afternoon thread',summary:'Locals compare cosy spots.',paragraphs:['The little shop is everyone’s favourite.'],kind:'forum'}]}
      else result={message:'A warm reply.',after:{state:'remote'}}
      return {content:JSON.stringify(result),finish_reason:'stop'}
    }
   })
   await press('Open Freeform');await page.getByRole('combobox',{name:'Choose persona',exact:true}).selectOption('persona-fern')
   await page.getByRole('textbox',{name:'Session name',exact:true}).fill('Native apps');await press('Create session')
   const sessionId=await page.locator('.lumiphone-shell').getAttribute('data-pocket-chat-id')

   await press('Settings');await press(/^Personalization /);await press(/^Device appearance /)
   const offset=page.getByRole('slider',{name:/^Desktop phone offset/});await offset.fill('64');await offset.dispatchEvent('input')
   await page.waitForFunction(()=>window.freeformFixture.host.sends.some(p=>p.type==='lumiphone:state'&&p.preferences?.desktopPhoneOffset===64))
   const padding=await page.locator('.lumiphone-handset-host').evaluate(node=>getComputedStyle(node).paddingInlineStart)
   assert.equal(padding,width===390?'0px':'64px');await page.screenshot({path:resolve(output,'offset-'+width+'.png')})
   await open('Settings');await press(/^Context /);const count=page.getByRole('slider',{name:/^Freeform roleplay context/});await count.fill('6');await count.dispatchEvent('input')
   await page.waitForFunction(()=>window.freeformFixture.host.sends.some(p=>p.type==='lumiphone:state'&&p.preferences?.freeformRoleplayMessages===6))
   await open('Trackers');await press('Add');await press(/Blank meter/)
   await page.getByRole('combobox',{name:'Track',exact:true}).selectOption('field')
   await page.getByRole('textbox',{name:'Name',exact:true}).fill('Outfit')
   await page.getByRole('combobox',{name:/^Updates/}).selectOption('model')
   await page.getByRole('textbox',{name:/^Instruction/}).fill('Describe the current clothes.')
   await page.getByRole('textbox',{name:/^Field text/}).fill('A blue coat and a scarf.')
   assert.equal(await page.getByRole('textbox',{name:/^Allowed states/}).isVisible(),false)
   await page.screenshot({path:resolve(output,'field-editor-'+width+'.png')});await press('Save')
   await page.getByRole('button',{name:'Save text',exact:true}).waitFor()
   await page.getByRole('textbox',{name:/^Field text/}).fill('A warm coat. '.repeat(20));await press('Save text')
   await page.waitForFunction(()=>window.freeformFixture.host.sends.some(p=>p.type==='lumiphone:state'&&p.state.trackers.some(t=>t.label==='Outfit'&&t.state.length>200)))
   await press('Tracker settings');assert.equal(await page.getByRole('combobox',{name:'Track',exact:true}).inputValue(),'field')
   assert.equal(await page.getByRole('textbox',{name:/^Instruction/}).inputValue(),'Describe the current clothes.')
   assert.equal(errors.length,0);console.log('Context, text field persistence and offset passed at '+width)
  }catch(error){await page.screenshot({path:resolve(output,'failure-'+width+'.png')});console.error((await page.locator('body').innerText()).slice(-3500));throw error}
  finally{await page.close()}
 }
}finally{await browser?.close();await new Promise(done=>server.close(done))}
