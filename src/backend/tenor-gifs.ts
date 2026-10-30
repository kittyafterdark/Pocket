import { socialGif, type SocialGif } from '../domain/social-extras.js'

export class TenorGifs {
  constructor(private request:(url:string)=>Promise<unknown>,private timeoutMs=12000) {}
  async search(query:string):Promise<SocialGif[]> {
    const text=query.replace(/\s+/g,' ').trim().slice(0,100)
    if(!text) return []
    let timer:ReturnType<typeof setTimeout>|undefined
    const response=await Promise.race([this.request('https://tenor.com/search/'+encodeURIComponent(text.replace(/\s/g,'-'))+'-gifs'),new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(new Error('Tenor took too long. Try again.')),this.timeoutMs)})]).finally(()=>clearTimeout(timer))
    if(!response || typeof response!=='object' || !('status' in response) || !Number.isFinite(Number(response.status)) || Number(response.status)<200 || Number(response.status)>=300) throw new Error('Tenor is unavailable. Try again.')
    const payload=response as {body?:string;encoding?:string}
    let html=typeof payload.body==='string'?payload.body:''
    if(payload.encoding==='base64') html=new TextDecoder().decode(Uint8Array.from(atob(html),letter=>letter.charCodeAt(0)))
    html=html.slice(0,2_000_000).replace(/\\u002f/gi,'/').replace(/\\\//g,'/').replace(/&amp;/g,'&')
    const urls=[...new Set(html.match(/https:\/\/media\.tenor\.com\/[^"'<>\s\\]+?\.gif(?:\?[^"'<>\s\\]*)?/g)||[])].slice(0,18)
    return urls.map(url=>socialGif({url,description:text})).filter((gif):gif is SocialGif=>Boolean(gif))
  }
}
