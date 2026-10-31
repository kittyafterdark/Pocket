import type { PhoneState } from '../../types.js'
import type { SocialAccount, SocialPost, SocialMutation, PocketSocialState } from '../../domain/social.js'
import { contactAccent } from '../../domain/contacts.js'
import { gradientColors, QUICK_REACTIONS, EMOJI_CHOICES, type SocialGif } from '../../domain/social-extras.js'
import type { PocketSticker } from '../../domain/native-apps.js'
import type { StickerLibrary } from '../../domain/sticker-packs.js'
import { stickerCollection } from '../components/sticker-collection.js'
import { discordEmoteText } from '../components/discord-emotes.js'
import { button, el, requestId } from '../shared.js'
import { showPocketSheet } from '../components/ui.js'

type Avatar = (name:string,actorId?:string,url?:string)=>HTMLElement
export function discordNameColor(state:PhoneState,account:SocialAccount) {
  const actor=state.discoveredActors?.find(actor=>actor.id===account.actorId), contact=state.contacts.find(contact=>contact.id===(actor?.promotedContactId||account.actorId))
  const color=contact?contactAccent(contact):account.actorId===state.pocketPersonaActorId?(state.pocketPersona.accent||'#8b7dff'):account.accent
  return color && /^#[0-9a-f]{6}$/i.test(color)?color:'#c4c9ce'
}
function sheet(anchor:HTMLElement,title:string,body:HTMLElement) {
  body.classList.add('lp-discord-sheet')
  const handle=showPocketSheet(anchor,title,body), dialog=body.closest('dialog')
  if(dialog) {
    dialog.classList.add('lp-discord-dialog')
    const style=anchor.ownerDocument.defaultView!.getComputedStyle(anchor)
    for(const key of ['--social-bg','--social-surface','--social-text','--social-muted','--social-border','--social-accent','--discord-input']) (dialog as HTMLElement).style.setProperty(key,style.getPropertyValue(key))
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation()})
  }
  return handle
}
function emojiChoices(choose:(emoji:string)=>void) {
  const body=el('div'), label=el('label','lp-discord-search-label','Find an emoji'), search=el('input','lp-input'), grid=el('div','lp-discord-emoji-grid')
  search.type='search'; search.placeholder='Search emoji'; label.append(search); body.append(label,grid)
  const draw=()=>{grid.replaceChildren();for(const [emoji,name] of EMOJI_CHOICES.filter(([emoji,name])=>(emoji+' '+name).includes(search.value.toLowerCase()))) {const pick=button(emoji,'lp-discord-emoji');pick.setAttribute('aria-label',name);pick.onclick=()=>choose(emoji);grid.append(pick)}}
  search.oninput=draw;draw();return {body,focus:()=>search.focus()}
}
function emojiPicker(anchor:HTMLElement,choose:(emoji:string)=>void) {
  let handle:ReturnType<typeof sheet>
  const choices=emojiChoices(emoji=>{handle?.dismiss();choose(emoji)})
  handle=sheet(anchor,'Add a reaction',choices.body);choices.focus()
}
export function gifMedia(gif:SocialGif) {
  const figure=el('figure','lp-social-gif'), image=el('img');image.src=gif.url;image.alt=gif.description||'Tenor GIF';image.loading='lazy'
  image.onerror=()=>{image.replaceWith(el('p','', 'This GIF is unavailable.'))}
  figure.append(image,el('figcaption','','GIF · Tenor'));return figure
}
function gifSearchContent(searchGifs:(query:string)=>Promise<SocialGif[]>,choose:(gif:SocialGif)=>void) {
  const body=el('div','lp-gif-picker'),form=el('form'),label=el('label','lp-discord-search-label','Search Tenor GIFs'),input=el('input','lp-input'),submit=button('Search','lp-button'),status=el('p','lp-copy'),grid=el('div','lp-gif-results')
  input.type='search';input.required=true;input.maxLength=100;input.placeholder='A little reaction…';label.append(input);submit.type='submit';status.setAttribute('role','status');form.append(label,submit);body.append(form,status,grid)
  let revision=0
  form.onsubmit=async event=>{event.preventDefault();const current=++revision;submit.disabled=true;status.textContent='Searching Tenor…';grid.replaceChildren()
    try {const gifs=await searchGifs(input.value);if(!body.isConnected||current!==revision)return;status.textContent=gifs.length?'Choose a GIF to attach.':'No GIFs found. Try another search.'
      for(const gif of gifs) {const pick=button('','lp-gif-result');pick.setAttribute('aria-label',`Attach ${gif.description} GIF`);const image=el('img');image.src=gif.url;image.alt='';image.loading='lazy';pick.append(image);pick.onclick=()=>choose(gif);grid.append(pick)}
    } catch(error){if(body.isConnected&&current===revision)status.textContent=error instanceof Error?error.message:'GIF search failed.'}
    finally{if(body.isConnected&&current===revision)submit.disabled=false}
  };return {body,focus:()=>input.focus()}
}
export function gifPicker(anchor:HTMLElement,searchGifs:(query:string)=>Promise<SocialGif[]>,choose:(gif:SocialGif)=>void) {
  let handle:ReturnType<typeof sheet>
  const search=gifSearchContent(searchGifs,gif=>{handle?.dismiss();choose(gif)})
  handle=sheet(anchor,'GIFs from Tenor',search.body);search.focus()
}
export function discordExpressionPicker(anchor:HTMLElement,searchGifs:((query:string)=>Promise<SocialGif[]>)|undefined,chooseEmoji:(emoji:string)=>void,chooseGif:(gif:SocialGif)=>void,options:{library?:StickerLibrary;chooseEmote?(s:PocketSticker):void;manage?():void;pack?:string;query?:string;remember?(pack:string,query:string):void}={}) {
  const compose=anchor.closest('.lp-social-compose');if(!compose)return
  const existing=compose.querySelector<HTMLElement>('.lp-discord-expression-tray');if(existing){existing.remove();anchor.setAttribute('aria-expanded','false');anchor.removeAttribute('aria-controls');anchor.focus();return}
  const body=el('section','lp-discord-expression-picker lp-discord-expression-tray'),head=el('header','lp-discord-tray-heading'),tabs=el('div','lp-discord-expression-tabs'),id=requestId('discord_expressions')
  body.id=id;body.setAttribute('aria-label','Message expressions');anchor.setAttribute('aria-expanded','true');anchor.setAttribute('aria-controls',id);anchor.removeAttribute('aria-haspopup')
  const close=(focus=true)=>{body.remove();anchor.setAttribute('aria-expanded','false');anchor.removeAttribute('aria-controls');if(focus&&anchor.isConnected)anchor.focus({preventScroll:true})}
  tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Message expressions');const dismiss=button('×','lp-discord-tray-close');dismiss.setAttribute('aria-label','Close message expressions');dismiss.onclick=()=>close();head.append(tabs,dismiss)
  const emoji=emojiChoices(value=>{close(false);chooseEmoji(value)}),gifs=searchGifs?gifSearchContent(searchGifs,value=>{close(false);chooseGif(value)}):undefined
  const emotes=options.library?stickerCollection({library:options.library,pack:options.pack,query:options.query,remember:options.remember,verb:'Insert',choose:s=>{close(false);options.chooseEmote?.(s)}}):undefined
  if(emotes&&options.manage){const manage=button('Browse & manage packs','lp-discord-manage-packs');manage.onclick=()=>{close(false);options.manage?.()};emotes.root.append(manage)}
  const choices=[{name:'Emoji',content:emoji},{name:'Emotes',content:emotes?{body:emotes.root,focus:emotes.focus}:undefined},{name:'GIFs',content:gifs}]
  let active=0
  const controls=choices.map((choice,index)=>{const control=button(choice.name);control.id=id+'_tab_'+index;control.setAttribute('role','tab');control.setAttribute('aria-controls',id+'_panel_'+index);control.disabled=!choice.content;tabs.append(control);return control})
  const panels=choices.map((choice,index)=>{const panel=el('div');panel.id=id+'_panel_'+index;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',controls[index].id);if(choice.content)panel.append(choice.content.body);return panel})
  const select=(index:number,focusContent=false)=>{active=index;controls.forEach((control,i)=>{control.setAttribute('aria-selected',String(i===index));control.tabIndex=i===index?0:-1;panels[i].hidden=i!==index});if(focusContent)choices[index].content?.focus()}
  controls.forEach((control,index)=>{control.onclick=()=>select(index,true)})
  tabs.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();event.stopPropagation();let next=event.key==='Home'?0:event.key==='End'?choices.length-1:(active+(event.key==='ArrowLeft'?-1:1)+choices.length)%choices.length;for(let i=0;controls[next].disabled&&i<choices.length;i++)next=(next+(event.key==='ArrowLeft'?-1:1)+choices.length)%choices.length;if(controls[next].disabled)return;select(next);controls[next].focus()}
  body.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close()}}
  body.append(head,...panels);select(0);compose.prepend(body);emoji.focus()
}

export function discordGradientEditor(anchor:HTMLElement,colors:[string,string],save:(colors:[string,string])=>void,title='Profile gradient') {
  const body=el('form','lp-discord-gradient-editor'),preview=el('div','lp-discord-gradient-preview'),values:[string,string]=[...colors]
  const update=()=>{preview.style.background=`linear-gradient(135deg,${values[0]},${values[1]})`};update();body.append(preview)
  for(const index of [0,1] as const) {const label=el('label','',index===0?'First color':'Second color'),input=el('input');input.type='color';input.value=values[index];input.oninput=()=>{values[index]=input.value;update()};label.append(input);body.append(label)}
  const submit=button('Save gradient','lp-button');submit.type='submit';body.append(submit);const handle=sheet(anchor,title,body)
  body.onsubmit=event=>{event.preventDefault();handle?.dismiss();save(values)}
}
export function discordOwnProfile(profile:HTMLElement,state:PhoneState,owner:string,account:SocialAccount,world:PocketSocialState,request:(input:SocialMutation)=>void) {
  const colors=gradientColors(world.profiles?.[owner]?.discordGradient)||['#5865f2','#b48bf1'],body=el('div','lp-discord-profile-body'),banner=el('div','lp-discord-profile-banner')
  profile.style.setProperty('--profile-start',colors[0]);profile.style.setProperty('--profile-end',colors[1])
  body.append(...profile.childNodes);profile.replaceChildren(banner,body)
  const count=body.querySelector('.lp-social-profile-count');if(count)count.textContent='Your Discord profile'
  const name=body.querySelector<HTMLElement>('.lp-social-profile-identity strong');if(name)name.style.color=discordNameColor(state,account)
  const bio=body.querySelector('.lp-social-bio');if(bio) {const about=el('section','lp-discord-about');about.append(el('h3','','ABOUT ME'),bio);body.insertBefore(about,body.querySelector('.lp-social-edit-profile'))}
  const gradient=button('Customize gradient','lp-social-button lp-social-edit-profile');gradient.dataset.socialFocus='Discord profile gradient';gradient.setAttribute('aria-haspopup','dialog');gradient.onclick=()=>discordGradientEditor(gradient,colors,colors=>request({action:'profile',app:'discord',gradient:colors}));body.append(gradient)
}
export function discordMemberProfile(anchor:HTMLElement,person:SocialAccount,state:PhoneState,world:PocketSocialState,avatar:Avatar) {
  const body=el('div','lp-discord-member-profile'),colors=gradientColors(world.profiles?.[person.actorId||person.id]?.discordGradient)||[discordNameColor(state,person),'#27283d'],banner=el('div','lp-discord-profile-banner'),identity=el('div','lp-discord-profile-body'),name=el('h2','',person.name)
  body.style.setProperty('--profile-start',colors[0]);body.style.setProperty('--profile-end',colors[1]);name.style.color=discordNameColor(state,person)
  identity.append(avatar(person.name,person.actorId,person.avatarUrl),name,el('p','lp-copy',person.handle),el('h3','','ABOUT ME'),el('p','lp-discord-member-bio',person.bio||'A person in your little corner of Discord.'))
  const shared=world.servers.filter(server=>server.participants?.some(member=>member.id===person.id))
  if(shared.length)identity.append(el('h3','','SHARED SERVERS'),el('p','lp-copy',shared.map(server=>server.name).join(' · ')))
  body.append(banner,identity);sheet(anchor,`${person.name}’s profile`,body)
}
interface MessageHost {
  state:PhoneState;world:PocketSocialState;owner:string;posts:SocialPost[];avatar:Avatar;timestamp(post:SocialPost):string
  request(input:SocialMutation):void;reply(post:SocialPost):void;pending?:boolean
}
export function discordMessage(host:MessageHost,post:SocialPost) {
  const {state,owner,world,avatar}=host,member=world.servers.flatMap(server=>server.participants||[]).find(person=>person.id===post.account.id)||post.account
  const row=el('article','lp-social-post lp-discord-message');row.dataset.socialPost=post.id;row.tabIndex=-1
  const avatarButton=button('','lp-discord-message-avatar');avatarButton.setAttribute('aria-label',`View ${member.name}’s profile`);avatarButton.setAttribute('aria-haspopup','dialog');avatarButton.append(avatar(member.name,member.actorId,member.avatarUrl));avatarButton.onclick=()=>discordMemberProfile(avatarButton,member,state,world,avatar)
  const main=el('div','lp-discord-message-main'),head=el('header','lp-discord-message-head'),name=button(member.handle,'lp-discord-message-name'),time=el('time','',host.timestamp(post)),menu=button('⋯','lp-discord-message-menu')
  name.setAttribute('aria-haspopup','dialog');name.style.color=discordNameColor(state,member);name.setAttribute('aria-label',`View profile of ${member.name}`);name.onclick=()=>discordMemberProfile(name,member,state,world,avatar);time.dateTime=post.createdAt;time.title=post.createdAt
  menu.setAttribute('aria-haspopup','dialog');menu.setAttribute('aria-label',`Message actions for ${member.name} · ${post.id}`);menu.dataset.socialFocus=`Discord message ${post.id}`
  const react=(emoji:string)=>host.request({action:'react',app:'discord',postId:post.id,emoji,channelId:post.channelId})
  menu.onclick=()=>{
    const body=el('div','lp-discord-message-actions'),quick=el('div','lp-discord-quick-reactions');let handle:ReturnType<typeof sheet>
    for(const emoji of QUICK_REACTIONS){const pick=button(emoji,'lp-discord-emoji');pick.setAttribute('aria-label',`React with ${emoji}`);pick.disabled=Boolean(host.pending);pick.onclick=()=>{handle?.dismiss();react(emoji)};quick.append(pick)}
    const more=button('+','lp-discord-emoji');more.setAttribute('aria-label','Choose another emoji');more.disabled=Boolean(host.pending);more.onclick=()=>{handle?.dismiss();emojiPicker(menu,react)};quick.append(more);body.append(quick)
    const reply=button('↩  Reply','lp-discord-context-action');reply.onclick=()=>{handle?.dismiss();host.reply(post)}
    const pin=button(post.pinned?'Unpin message':'Pin message','lp-discord-context-action');pin.disabled=Boolean(host.pending);pin.onclick=()=>{handle?.dismiss();host.request({action:'pin',app:'discord',postId:post.id,channelId:post.channelId})}
    body.append(reply,pin);handle=sheet(menu,'Message actions',body)
  }
  if(post.replyTo){const original=host.posts.find(other=>other.id===post.replyTo);if(original){const hook=button('','lp-discord-reply-hook');hook.setAttribute('aria-label',`Jump to message by ${original.account.name}`);hook.append(avatar(original.account.name,original.account.actorId,original.account.avatarUrl),el('strong','',original.account.handle),el('span','',original.text||original.gif?.description||'GIF'));hook.onclick=()=>{const target=[...row.parentElement!.querySelectorAll<HTMLElement>('[data-social-post]')].find(node=>node.dataset.socialPost===original.id);target?.scrollIntoView({block:'center',behavior:'smooth'});target?.focus({preventScroll:true})};main.append(hook)}}
  head.append(name,time,menu);main.append(head)
  if(post.text)main.append(discordEmoteText(post.text,post.emotes))
  if(post.gif)main.append(gifMedia(post.gif))
  const reactions=el('div','lp-discord-reactions')
  for(const reaction of post.reactions||[]) {const choice=button(`${reaction.emoji} ${reaction.actorIds.length}`,'lp-discord-reaction');choice.setAttribute('aria-label',`${reaction.emoji} reaction, ${reaction.actorIds.length} people`);choice.setAttribute('aria-pressed',String(reaction.actorIds.includes(owner)));choice.title=reaction.actorIds.map(id=>id===owner?'You':world.servers.flatMap(server=>server.participants||[]).find(member=>member.id===id)?.name||host.posts.find(post=>post.account.id===id)?.account.name||'Member').join(', ');choice.disabled=Boolean(host.pending);choice.onclick=()=>react(reaction.emoji);reactions.append(choice)}
  if(reactions.childElementCount){const add=button('+','lp-discord-reaction');add.setAttribute('aria-label',`Add reaction to ${member.name}’s message`);add.disabled=Boolean(host.pending);add.onclick=()=>emojiPicker(add,react);reactions.append(add);main.append(reactions)}
  if(post.pinned)main.append(el('span','lp-discord-pinned-label','Pinned'))
  row.append(avatarButton,main);return row
}
export function discordPins(anchor:HTMLElement,posts:SocialPost[],jump:(id:string)=>void) {
  const body=el('div','lp-discord-pins');let handle:ReturnType<typeof sheet>
  for(const post of posts.filter(post=>post.pinned)){const open=button('','lp-discord-pin-card');open.append(el('strong','',post.account.handle),el('p','',post.text||post.gif?.description||'GIF'));open.onclick=()=>{handle?.dismiss();jump(post.id)};body.append(open)}
  if(!body.childElementCount)body.append(el('p','lp-copy','Keep something worth coming back to. Pin a message from its ⋯ menu.'))
  handle=sheet(anchor,'Pinned messages',body)
}
