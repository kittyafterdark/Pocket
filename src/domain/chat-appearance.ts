import type {PocketWallpaper} from '../types.js'
import {normalizeWallpaper} from './preferences.js'
export interface ChatAppearance {wallpaper?:PocketWallpaper; radius?:number; padding?:number}
export function normalizeChatAppearance(value:unknown):ChatAppearance|undefined {
  if(!value || typeof value!=='object')return undefined
  const v=value as Record<string,unknown>, result:ChatAppearance={}
  for(const [key,min,max] of [['radius',0,32],['padding',4,20]] as const)if(typeof v[key]==='number' && Number.isFinite(v[key]))result[key]=Math.min(max,Math.max(min,v[key] as number))
  if(v.wallpaper && typeof v.wallpaper==='object')result.wallpaper=normalizeWallpaper(v.wallpaper)
  return result
}
