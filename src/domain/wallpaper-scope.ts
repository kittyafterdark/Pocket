import type {DevicePreferences,PersonaAppearanceOverride} from '../types.js'
import {defaultWallpaper,normalizeWallpaper} from './preferences.js'
export function personaWallpaperActive(profile:PersonaAppearanceOverride|null|undefined,kind:'home'|'chat'):boolean {
  return Boolean(profile?.[kind+'Wallpaper' as 'homeWallpaper'|'chatWallpaper'].source && (profile?.[kind+'WallpaperEnabled' as 'homeWallpaperEnabled'|'chatWallpaperEnabled'] ?? profile?.enabled))
}
export function assignPocketWallpaper(preferences:DevicePreferences,payload:Record<string,unknown>,forcedSource?:unknown) {
  const target=String(payload.target||''),personal=target==='persona-home'||target==='persona-chat',chat=target==='persona-chat'||target==='device-chat'||target==='chat'
  if(!['persona-home','persona-chat','device-home','device-chat','home','chat'].includes(target))throw new Error('Choose a wallpaper destination.')
  const personaId=typeof payload.personaId==='string'?payload.personaId.trim():''
  if(personal&&(!personaId||personaId.length>180||['__proto__','prototype','constructor'].includes(personaId)))throw new Error('Choose a Persona for this wallpaper.')
  let profile=personal&&Object.hasOwn(preferences.personaAppearance,personaId)?preferences.personaAppearance[personaId]:undefined
  if(personal&&!profile){
    if(Object.keys(preferences.personaAppearance).length>=32)throw new Error('This device has reached its Persona appearance limit.')
    profile={enabled:false,theme:preferences.theme,colors:structuredClone(preferences.colors),customCss:'',homeWallpaper:defaultWallpaper(),chatWallpaper:defaultWallpaper()}
    preferences.personaAppearance[personaId]=profile
  }
  const key=chat?'chatWallpaper':'homeWallpaper',current=personal?profile![key]:preferences[key],raw=payload.wallpaper&&typeof payload.wallpaper==='object'?payload.wallpaper as Record<string,unknown>:{}
  const wallpaper=normalizeWallpaper({...current,...raw,source:forcedSource===undefined?(Object.hasOwn(raw,'source')?raw.source:payload.source):forcedSource})
  if(personal){profile![key]=wallpaper;profile![chat?'chatWallpaperEnabled':'homeWallpaperEnabled']=Boolean(wallpaper.source)}
  else preferences[key]=wallpaper
}
