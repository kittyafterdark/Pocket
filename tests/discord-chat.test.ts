import {test,expect} from 'bun:test'
import type {PhoneState} from '../src/types.js'
import {normalizeSocialState,applySocialMutation,socialGenerationRequest} from '../src/domain/social.js'
import {defaultLauncherLayout,setPocketAppInstalled} from '../src/domain/launcher.js'
import {normalizeReactions,socialGif,validEmoji} from '../src/domain/social-extras.js'
import {TenorGifs} from '../src/backend/tenor-gifs.js'
import {SocialWorld} from '../src/backend/social-world.js'
import {discordNameColor} from '../src/frontend/apps/discord-chat.js'
let sequence=0
const id=(prefix:string)=>prefix+'-'+(++sequence),now='2026-10-29T18:00:00Z',context={chatId:'discord',characterId:'alice'}
function fixture(){
 const state={...context,pocketPersonaActorId:'persona',pocketPersona:{displayName:'You',accent:'#aabbcc'},roleplayNow:now,contacts:[{id:'alice',name:'Alice',accent:'#ff3388',sourceAccent:'#11aa99',colorMode:'source'}],conversations:[{includesPocketPersona:true,participantActorIds:['alice']}],processedCommands:[],launcherLayouts:{persona:setPocketAppInstalled(defaultLauncherLayout(),'discord',true)},social:normalizeSocialState(null)} as unknown as PhoneState
 state.social=applySocialMutation(state,'persona',{action:'server',app:'discord',name:'Night crew',channels:['general','art']},now,id)
 state.social.servers[0].participants=[{id:'fern',name:'Fern',handle:'fern.afterhours',accent:'#66cc99',bio:'A wry artist'},{id:'mika',name:'Mika',handle:'mika.moon',bio:'Quiet but playful'}]
 state.social=normalizeSocialState(state.social)
 return state
}
test('Discord reactions and pins remain actor and server scoped and survive reload',()=>{
 const state=fixture(),channelId=state.social!.servers[0].channels[0].id
 state.social=applySocialMutation(state,'persona',{action:'post',app:'discord',channelId,text:'Hello'},now,id)
 const postId=state.social.posts[0].id
 state.social=applySocialMutation(state,'persona',{action:'react',app:'discord',postId,emoji:'💜'},now,id)
 state.social=applySocialMutation(state,'persona',{action:'pin',app:'discord',postId},now,id)
 expect(normalizeSocialState(JSON.parse(JSON.stringify(state.social))).posts[0]).toMatchObject({pinned:true,reactions:[{emoji:'💜',actorIds:['persona']}]})
 expect(()=>applySocialMutation(state,'alice',{action:'react',app:'discord',postId,emoji:'😭'},now,id)).toThrow()
 expect(()=>applySocialMutation(state,'persona',{action:'react',app:'twitter',postId,emoji:'😭'},now,id)).toThrow()
 state.social=applySocialMutation(state,'persona',{action:'react',app:'discord',postId,emoji:'💜'},now,id)
 expect(state.social.posts[0].reactions).toEqual([])
 expect(normalizeReactions([{emoji:'💜',actorIds:['fern']},{emoji:'💜',actorIds:['fern','mika']},{emoji:'bad',actorIds:['x']}])).toEqual([{emoji:'💜',actorIds:['fern','mika']}])
 for(const bad of ['a💜','<💜>','💜 text','@💜'])expect(validEmoji(bad)).toBe(false)
 for(const emoji of ['❤️','🫶🏽','🏳️‍🌈','1️⃣'])expect(validEmoji(emoji)).toBe(true)
})
test('Discord theme and profile gradients persist without erasing bios, usernames or app schedules',()=>{
 const state=fixture()
 for(const input of [{action:'profile',app:'discord',bio:'Art at midnight',username:'moon.person'},{action:'profile',app:'discord',gradient:['#123456','#abcdef']},{action:'preferences',app:'discord',discordTheme:'gradient',gradient:['#111122','#443366']},{action:'settings',app:'discord',refreshMode:'manual'}] as const)
   state.social=applySocialMutation(state,'persona',input as any,now,id)
 const loaded=normalizeSocialState(JSON.parse(JSON.stringify(state.social)))
 expect(loaded.profiles?.persona).toMatchObject({bio:'Art at midnight',usernames:{discord:'moon.person'},discordGradient:['#123456','#abcdef']})
 expect(loaded.preferences?.persona).toMatchObject({discordTheme:'gradient',discordGradient:['#111122','#443366'],apps:{discord:{refreshMode:'manual'}}})
 expect(()=>applySocialMutation(state,'persona',{action:'profile',app:'discord',gradient:['red','url(x)']},now,id)).toThrow()
 expect(discordNameColor(state,{id:'alice',actorId:'alice',name:'Alice',handle:'alice'})).toBe('#11aa99')
 expect(discordNameColor(state,{id:'persona',actorId:'persona',name:'You',handle:'you'})).toBe('#aabbcc')
 expect(discordNameColor(state,state.social!.servers[0].participants![0])).toBe('#66cc99')
})
test('Tenor boundary accepts only direct GIF media and deduplicates escaped search results',async()=>{
 for(const url of ['https://evil.test/a.gif','https://media.tenor.com.evil.test/a.gif','javascript:alert(1)','https://user:pass@media.tenor.com/a.gif','https://media.tenor.com/a.mp4'])
   expect(socialGif({url})).toBeUndefined()
 const urls:string[]=[]
 const tenor=new TenorGifs(async url=>{urls.push(url);return {status:200,body:'<img src="https://media.tenor.com/id/wave.gif"><img src="https://media.tenor.com/id/wave.gif"> https:\\/\\/media.tenor.com\\/other\\/dance.gif'}})
 const gifs=await tenor.search('happy wave')
 expect(urls).toEqual(['https://tenor.com/search/happy-wave-gifs']);expect(gifs).toHaveLength(2)
 expect(gifs[0]).toEqual({url:'https://media.tenor.com/id/wave.gif',description:'happy wave'})
 await expect(new TenorGifs(async()=>({status:503})).search('hello')).rejects.toThrow('Tenor is unavailable')
 const state=fixture(),channelId=state.social!.servers[0].channels[0].id
 state.social=applySocialMutation(state,'persona',{action:'post',app:'discord',channelId,gif:gifs[0]},now,id)
 expect(normalizeSocialState(state.social).posts[0].gif).toEqual(gifs[0])
 const history=JSON.parse(socialGenerationRequest(state,'discord','persona',channelId,'').messages[1].content)
 expect(history.recentPosts[0].gif).toBe('happy wave')
})
test('Sending a Discord message gets at most two replies from its own server, member reactions and resolved GIFs',async()=>{
 let state=fixture(),request:any;const events:any[]=[]
 const world=new SocialWorld({loadState:async()=>structuredClone(state),saveState:async next=>{state=next},sendState:async()=>{},send:payload=>events.push(payload),getMessages:async()=>[],withStateLock:async(_key,task)=>task(),stateKey:()=>context.chatId,nowIso:()=>now,makeId:id,resolveImage:async()=>'',resolveGif:async query=>({url:'https://media.tenor.com/id/wave.gif',description:query}),
 runStructuredGeneration:async(_task,_id,input)=>{request=input;const data=JSON.parse((input.messages as any[])[1].content);return {posts:[{author:'Fern',handle:'fern.afterhours',text:'You made it!',replyTo:data.messageId,gifQuery:'hello wave'},{author:'You',handle:'you',text:'Never speak for me'},{author:'Mika',handle:'mika.moon',text:'Too many'}],reactions:[{accountId:data.members[0].id,postId:data.messageId,emoji:'💜'},{accountId:'outsider',postId:data.messageId,emoji:'💀'}]}}
 })
 const channelId=state.social!.servers[0].channels[0].id
 await world.mutate(context,'persona',{action:'post',app:'discord',channelId,text:'Hey everyone'},'sent')
 expect(state.social!.posts).toHaveLength(2);expect(state.social!.posts[1]).toMatchObject({account:{id:state.social!.servers[0].participants![0].id},replyTo:state.social!.posts[0].id,gif:{description:'hello wave'}})
 expect(state.social!.posts[0].reactions).toEqual([{emoji:'💜',actorIds:[state.social!.servers[0].participants![0].id]}])
 const data=JSON.parse(request.messages[1].content);expect(data.discordConversation).toBe(true);expect(data.members.map((p:any)=>p.name)).toEqual(['Fern','Mika'])
 expect(events.some(event=>event.type==='lumiphone:social_started'&&event.mode==='reply')).toBe(true)
 const count=state.social!.posts.length;await world.mutate(context,'persona',{action:'post',app:'discord',channelId,text:'Hey everyone'},'sent');expect(state.social!.posts).toHaveLength(count)
})
test('A cancelled direct Discord response cannot append late messages or reactions',async()=>{
 let state=fixture(),finish!:(value:any)=>void;const events:any[]=[]
 const world=new SocialWorld({loadState:async()=>structuredClone(state),saveState:async next=>{state=next},sendState:async()=>{},send:payload=>events.push(payload),getMessages:async()=>[],withStateLock:async(_key,task)=>task(),stateKey:()=>context.chatId,nowIso:()=>now,makeId:id,resolveImage:async()=>'',runStructuredGeneration:async()=>new Promise(resolve=>{finish=resolve})})
 const pending=world.mutate(context,'persona',{action:'post',app:'discord',channelId:state.social!.servers[0].channels[0].id,text:'Hello'},'stopme')
 for(let i=0;i<30&&!finish;i++)await Promise.resolve()
 expect(typeof finish).toBe('function');world.cancel(context,'persona','stopme:reply')
 finish({posts:[{author:'Fern',handle:'fern.afterhours',text:'Too late'}]});await pending
 expect(state.social!.posts).toHaveLength(1);expect(events.some(event=>event.action==='cancel')).toBe(true)
})

test('GIF-only generated replies resolve through Tenor and failed lookups never save blank messages',async()=>{
 for(const available of [true,false]){
  let state=fixture()
  const world=new SocialWorld({loadState:async()=>structuredClone(state),saveState:async next=>{state=next},sendState:async()=>{},send:()=>{},getMessages:async()=>[],withStateLock:async(_key,task)=>task(),stateKey:()=>context.chatId,nowIso:()=>now,makeId:id,resolveImage:async()=>'',...(available?{resolveGif:async()=>({url:'https://media.tenor.com/id/wave.gif',description:'wave'})}:{}),runStructuredGeneration:async()=>({posts:[{author:'Fern',handle:'fern.afterhours',text:'',gifQuery:'wave'}]})})
  const pending=world.refresh(context,'persona','discord',state.social!.servers[0].channels[0].id,'gif-only-'+available)
  if(available){await pending;expect(state.social!.posts).toHaveLength(1);expect(normalizeSocialState(state.social).posts[0].gif?.description).toBe('wave')}
  else{await expect(pending).rejects.toThrow('No new usable posts');expect(state.social!.posts).toHaveLength(0)}
 }
 await expect(new TenorGifs(async()=>new Promise(()=>{}),1).search('wave')).rejects.toThrow('Tenor took too long')
})
