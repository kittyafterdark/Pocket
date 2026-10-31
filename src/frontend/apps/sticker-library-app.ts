import { el } from '../shared.js'
import { nativeFor, type PocketSticker } from '../../domain/native-apps.js'
import { BUILTIN_STICKER_PACKS } from '../../domain/builtin-sticker-packs.js'
import { inStickerPack, libraryPacks, libraryStickers, stickerLabel, type StickerLibrary } from '../../domain/sticker-packs.js'
import { builtinStickerUrl } from '../builtin-sticker-assets.js'
import { stickerCollection, stickerImageUrl } from '../components/sticker-collection.js'
import { form, input, select, textarea, type NativeHost } from './native-ui.js'
import { empty, go, header, icon, scroll, subBack, textButton, tool } from './native-chrome.js'

export function renderStickerLibrary(h:NativeHost,root:HTMLElement,back:HTMLElement):void {
  const data=nativeFor(h.state),stickers=libraryStickers(data),panel=h.ui.panels.stickers||'library'
  const packOptions:[string,string][]=[['mine','My stickers'],...data.stickerPacks.map(p=>[p.id,p.name] as [string,string])]
  const drafts=h.ui.drafts
  if(drafts['created-pack-name']){const created=data.stickerPacks.filter(p=>p.name===drafts['created-pack-name']).at(-1);if(created&&drafts['created-pack-field'])drafts[drafts['created-pack-field']]=created.id;delete drafts['created-pack-name'];delete drafts['created-pack-field']}
  const packPicker=(key:string)=>{const row=el('div','st-pack-destination'),add=textButton('New pack',()=>{drafts['pack-return']=panel;drafts['pack-target-field']=key;drafts['pack-id']='';drafts['pack-name']='';go(h,'pack-edit')},'na-button');add.setAttribute('aria-label','Create a sticker pack');add.disabled=h.busy;row.append(select(h,key,'Save to pack',packOptions),add);return row}
  if(panel==='review'&&h.ui.stickerPreview){
    const p=h.ui.stickerPreview,body=scroll(),image=el('img','st-edit-image');image.src=p.imageUrl;image.alt=p.description
    if(!packOptions.some(([id])=>id===drafts['review-sticker-pack']))drafts['review-sticker-pack']='mine'
    root.classList.add('na-editor');root.append(header('Review generated sticker',subBack(h,'create')))
    const name=input(h,'review-sticker-name','Sticker name');name.querySelector('input')!.required=true;name.querySelector('input')!.maxLength=70
    const details=form(h,'Make it yours',[name,textarea(h,'review-sticker-description','Sticker description'),input(h,'review-sticker-caption','Short caption (optional)'),packPicker('review-sticker-pack')],'Accept sticker',values=>h.action('stickers','accept',{previewId:p.id,name:values['review-sticker-name'],description:values['review-sticker-description'],caption:values['review-sticker-caption'],packId:values['review-sticker-pack']},()=>{drafts['sticker-pack']=drafts['review-sticker-pack'];drafts['sticker-search']='';go(h,'library')}))
    body.append(image,details)
    const reviewForm=details.querySelector('form')!,accept=reviewForm.querySelector<HTMLButtonElement>('button[type=submit]')!,formId='sticker-review-'+globalThis.crypto.randomUUID();reviewForm.id=formId;reviewForm.setAttribute('aria-label','Sticker review details');accept.setAttribute('form',formId)
    const footer=el('div','st-review-footer');footer.setAttribute('role','group');footer.setAttribute('aria-label','Sticker review actions')
    const actions=el('div','st-review-actions'),retry=textButton('Retry generation',()=>{drafts['sticker-name']=drafts['review-sticker-name'];drafts['sticker-description']=drafts['review-sticker-description'];drafts['sticker-caption']=drafts['review-sticker-caption'];drafts['sticker-destination']=drafts['review-sticker-pack'];h.action('stickers','generate',{name:drafts['sticker-name'],description:drafts['sticker-description'],caption:drafts['sticker-caption'],packId:drafts['sticker-destination']})}),discard=textButton('Discard sticker',()=>h.action('stickers','discard',{previewId:p.id},()=>go(h,'create')),'na-button na-danger');retry.disabled=discard.disabled=h.busy;actions.append(retry,discard);footer.append(accept,actions);root.append(body,footer);return
  }
  const edit=(sticker:PocketSticker)=>{
    const d=h.ui.drafts;d['edit-sticker-id']=sticker.id;d['edit-sticker-name']=stickerLabel(sticker);d['edit-sticker-description']=sticker.description;d['edit-sticker-caption']=sticker.caption;d['edit-sticker-pack']=sticker.packId||'mine';d['edit-sticker-image-url']=stickerImageUrl(sticker);d['edit-sticker-image-id']=sticker.imageId;go(h,'edit')
  }
  if(panel==='edit'){
    const d=h.ui.drafts,existing=d['edit-sticker-id'],body=scroll(),image=el('img','st-edit-image');image.src=d['edit-sticker-image-url']||'';image.alt=d['edit-sticker-description']||'Sticker preview'
    root.classList.add('na-editor');root.append(header(existing?'Edit sticker':'Review sticker',subBack(h,existing?'preview':'create')))
    if(!packOptions.some(([id])=>id===d['edit-sticker-pack']))d['edit-sticker-pack']='mine'
    const name=input(h,'edit-sticker-name','Sticker name');name.querySelector('input')!.required=true;name.querySelector('input')!.maxLength=70
    body.append(image,form(h,'Sticker details',[name,textarea(h,'edit-sticker-description','Sticker description'),input(h,'edit-sticker-caption','Short caption (optional)'),packPicker('edit-sticker-pack')],'Save sticker',values=>h.action('stickers',existing?'edit':'save',{id:existing,imageId:d['edit-sticker-image-id'],name:values['edit-sticker-name'],description:values['edit-sticker-description']||values['edit-sticker-name'],caption:values['edit-sticker-caption'],packId:values['edit-sticker-pack']},()=>{h.ui.drafts['sticker-search']='';h.ui.drafts['sticker-pack']=values['edit-sticker-pack'];go(h,'library')})));root.append(body);return
  }
  if(panel==='pack-edit'){
    root.classList.add('na-editor');root.append(header(h.ui.drafts['pack-id']?'Rename pack':'New pack',subBack(h,'packs')),scroll(form(h,'Make it yours',[input(h,'pack-name','Pack name')],'Save pack',d=>h.action('stickers','pack_save',{id:h.ui.drafts['pack-id'],name:d['pack-name']},()=>{const target=h.ui.drafts['pack-return'];if(target&&!h.ui.drafts['pack-id']){h.ui.drafts['created-pack-name']=h.ui.drafts['pack-name'];h.ui.drafts['created-pack-field']=h.ui.drafts['pack-target-field'];h.ui.drafts['pack-return']='';go(h,target)}else go(h,'packs')}))));return
  }
  if(panel==='packs'){
    root.append(header('Sticker packs',subBack(h,'library'),tool('Create sticker pack','add',()=>{h.ui.drafts['pack-return']='';h.ui.drafts['pack-id']='';h.ui.drafts['pack-name']='';go(h,'pack-edit')})))
    const body=scroll(),custom=el('div','st-custom-packs');body.append(el('h2','st-pack-section','Your collections'))
    for(const pack of data.stickerPacks){const tile=el('section','st-custom-pack'),cover=data.stickers.find(s=>s.packId===pack.id);if(cover){const image=el('img');image.src=cover.imageUrl;image.alt='';tile.append(image)}else tile.append(icon('stickers'));const copy=el('div');copy.append(el('strong','',pack.name),el('small','',`${data.stickers.filter(s=>s.packId===pack.id).length} stickers`));tile.append(copy,tool(`Rename pack ${pack.name}`,'edit',()=>{h.ui.drafts['pack-id']=pack.id;h.ui.drafts['pack-name']=pack.name;go(h,'pack-edit')}),tool(`Remove collection ${pack.name}; keep its stickers`,'trash',()=>h.action('stickers','pack_delete',{id:pack.id})));custom.append(tile)}
    if(!custom.childElementCount)custom.append(textButton('+ Create a collection',()=>{h.ui.drafts['pack-return']='';h.ui.drafts['pack-id']='';h.ui.drafts['pack-name']='';go(h,'pack-edit')},'na-button'))
    body.append(custom,el('p','st-pack-help','Removing a collection moves its stickers to My stickers.'),el('h2','st-pack-section','Ready to collect'))
    const catalog=el('div','st-pack-catalog');for(const pack of BUILTIN_STICKER_PACKS){const installed=data.installedStickerPacks.includes(pack.id),tile=el('section','st-catalog-pack'),art=el('div','st-pack-art');for(const s of pack.items.slice(0,4)){const image=el('img');image.src=builtinStickerUrl(s.id);image.alt='';image.loading='lazy';art.append(image)}const add=textButton(installed?'Remove':'Add pack',()=>h.action('stickers',installed?'pack_remove':'pack_install',{id:pack.id}),'na-button'+(installed?'':' na-primary'));add.setAttribute('aria-label',`${installed?'Remove':'Add'} pack ${pack.name}`);add.disabled=h.busy;tile.append(art,el('h3','',pack.name),el('small','',`${pack.items.length} stickers${pack.items.some(s=>s.animated)?' · animated':''}`),add);catalog.append(tile)}body.append(catalog);root.append(body);return
  }
  if(panel==='create'){
    if(h.busy){const progress=h.ui.stickerProgress,frame=el('figure','st-generation-preview');if(progress?.url){const image=el('img');image.src=progress.url;image.alt='Sticker generation preview';frame.append(image)}else frame.append(icon('image'));frame.append(el('figcaption','',h.status||'Generating sticker…'));if(progress?.totalSteps&&progress.totalSteps>0){const meter=el('progress');meter.max=progress.totalSteps;meter.value=progress.step||0;meter.setAttribute('aria-label','Sticker generation progress');frame.append(meter)}root.classList.add('st-generating');root.replaceChildren(frame);return}
    root.classList.add('na-editor');root.append(header('Add stickers',subBack(h,'library')));const body=scroll(),sources=el('div','st-add-sources'),pack=()=>h.ui.drafts['sticker-destination']||'mine'
    if(!packOptions.some(([id])=>id===h.ui.drafts['sticker-destination']))h.ui.drafts['sticker-destination']=packOptions.some(([id])=>id===h.ui.drafts['sticker-pack'])?h.ui.drafts['sticker-pack']:'mine'
    body.append(packPicker('sticker-destination'))
    for(const [title,copy,name,run,disabled]of [['Gallery','Use a saved image','image',()=>h.gallery(h.ui.drafts['sticker-description']||'',h.ui.drafts['sticker-caption']||'',pack(),h.ui.drafts['sticker-name']||''),!h.images],['Upload','PNG, WebP, GIF or JPEG','receive',()=>h.upload(h.ui.drafts['sticker-description']||'',h.ui.drafts['sticker-caption']||'',pack(),h.ui.drafts['sticker-name']||''),!h.images]] as Array<[string,string,string,()=>void,boolean]>){const b=tool(title,name,run,'st-source-tile');b.append(el('strong','',title),el('small','',copy));b.disabled=disabled||h.busy;sources.append(b)}
    body.append(sources,el('h2','st-create-heading','Make a new sticker'),input(h,'sticker-name','Sticker name (optional)'),textarea(h,'sticker-description','Sticker description'),input(h,'sticker-caption','Short caption (optional)'))
    const generate=textButton('Generate a chibi sticker',()=>h.action('stickers','generate',{name:h.ui.drafts['sticker-name'],description:h.ui.drafts['sticker-description'],caption:h.ui.drafts['sticker-caption'],packId:pack()}),'na-button na-primary');generate.disabled=!h.imageGeneration||h.busy;body.append(generate)
    if(h.ui.stickerPreview)body.append(textButton('Review generated sticker',()=>go(h,'review')))
    root.append(body);return
  }
  const managing=h.ui.drafts['sticker-manage']==='yes',selected=new Set((h.ui.drafts['sticker-selected']||'').split('|').filter(Boolean)),top=header('Stickers',back,tool(managing?'Finish editing stickers':'Edit stickers',managing?'close':'edit',()=>{h.ui.drafts['sticker-manage']=managing?'no':'yes';h.ui.drafts['sticker-selected']='';h.render()}),tool('Manage sticker packs','tabs',()=>go(h,'packs')),tool('Add stickers','add',()=>go(h,'create')));root.append(top)
  const search=el('div','st-search'),query=el('input');query.type='search';query.placeholder='Find a sticker';query.setAttribute('aria-label','Find a sticker');query.value=h.ui.drafts['sticker-search']||'';search.append(icon('search'),query);root.append(search)
  const packs=libraryPacks(data),rail=el('div','st-pack-rail');rail.setAttribute('role','group');rail.setAttribute('aria-label','Sticker packs');const active=packs.some(p=>p.id===h.ui.drafts['sticker-pack'])?h.ui.drafts['sticker-pack']:'all';for(const pack of packs){const b=textButton(pack.name,()=>{h.ui.drafts['sticker-pack']=pack.id;h.render()},'st-pack-chip');b.setAttribute('aria-pressed',String(active===pack.id));rail.append(b)}root.append(rail);queueMicrotask(()=>{const selected=rail.querySelector<HTMLButtonElement>('[aria-pressed=true]');if(rail.isConnected&&selected)rail.scrollLeft=Math.max(0,selected.offsetLeft-rail.offsetLeft-(rail.clientWidth-selected.clientWidth)/2)})
  const body=scroll(),grid=el('div','st-library-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label','Sticker library')
  const show=()=>{grid.replaceChildren();const filtered=stickers.filter(s=>inStickerPack(s,active)&&`${s.name||''} ${s.description} ${s.caption}`.toLowerCase().includes(query.value.toLowerCase()));for(const sticker of [...filtered].reverse()){
    const b=textButton('',()=>{
      if(managing){if(selected.has(sticker.id))selected.delete(sticker.id);else selected.add(sticker.id);h.ui.drafts['sticker-selected']=[...selected].join('|');h.render();return}
      h.ui.selected.stickers=sticker.id;go(h,'preview')
    },'st-library-sticker');const image=el('img');image.src=stickerImageUrl(sticker);image.alt='';image.loading='lazy';b.setAttribute('aria-label',`${managing?'Select':'Preview'} sticker ${stickerLabel(sticker)}${sticker.packId?' ('+packs.find(p=>p.id===sticker.packId)?.name+')':''}`);b.title=stickerLabel(sticker);b.disabled=managing&&Boolean(sticker.builtinId);if(managing){b.setAttribute('aria-pressed',String(selected.has(sticker.id)));if(selected.has(sticker.id))b.append(el('span','st-selection-check','✓'))}b.append(image);grid.append(b)
  }if(!filtered.length)grid.append(empty(stickers.length?'No matching stickers':'Your sticker drawer','Add your own stickers or browse ready-made packs.','stickers'))};query.oninput=()=>{h.ui.drafts['sticker-search']=query.value;show()};show();body.append(grid)
  if(panel==='preview'){
    const sticker=stickers.find(s=>s.id===h.ui.selected.stickers);if(sticker){const preview=el('section','st-preview');preview.setAttribute('aria-label','Sticker preview');const image=el('img');image.src=stickerImageUrl(sticker);image.alt=sticker.description;preview.append(tool('Close sticker preview','close',()=>go(h,'library')),image,el('p','',stickerLabel(sticker)),el('small','','Use this sticker from a conversation’s attachment menu.'));if(!sticker.builtinId)preview.append(textButton('Edit sticker',()=>edit(sticker),'na-button na-primary'));body.prepend(preview)}
  }
  root.append(body)
  const footer=el('footer','st-library-footer');footer.append(el('span','',managing?`${selected.size} selected`:`${stickers.length} sticker${stickers.length===1?'':'s'}`))
  if(managing){const actions=el('div','st-selection-actions'),destination=select(h,'sticker-move','Move to pack',packOptions),move=textButton('Move selected',()=>h.action('stickers','move',{ids:[...selected],packId:h.ui.drafts['sticker-move']||'mine'},()=>{h.ui.drafts['sticker-selected']='';h.render()}),'na-button');move.disabled=!selected.size||h.busy;const remove=textButton('Delete selected',()=>h.action('stickers','delete_many',{ids:[...selected]},()=>{h.ui.drafts['sticker-selected']='';h.render()}),'na-button na-danger');remove.disabled=!selected.size||h.busy;actions.append(destination,move,remove);footer.append(actions)}else footer.append(textButton('Browse packs',()=>go(h,'packs'),'na-text-button'));root.append(footer)
}

export function stickerTray(options:{library:StickerLibrary;pack?:string;query?:string;remember?(pack:string,query:string):void;busy:boolean;send(id:string):void;close():void;manage():void}):HTMLElement {
  const tray=el('section','st-chat-tray');tray.setAttribute('aria-label','Stickers');const head=el('header');head.append(el('strong','','Stickers'),tool('Manage sticker library','add',options.manage),tool('Close stickers','close',options.close));tray.append(head)
  const collection=stickerCollection({...options,verb:'Send',choose:s=>options.send(s.id)});tray.append(collection.root)
  tray.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();options.close()}};return tray
}
