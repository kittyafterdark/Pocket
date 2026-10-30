export function timeskipMinutes(value:unknown):number {
  if(typeof value!=='number' || !Number.isSafeInteger(value) || value<1 || value>525600)throw new Error('Choose a timeskip from 1 minute to 365 days.')
  return value
}

export function timeskipLabel(minutes:number):string {
  const parts:string[]=[]
  for(const [size,label] of [[1440,'day'],[60,'hour'],[1,'minute']] as const) {
    const count=Math.floor(minutes/size);minutes%=size
    if(count)parts.push(`${count} ${label}${count===1?'':'s'}`)
  }
  return parts.join(' ')+ ' later'
}

export function normalizeTimeskip(value:unknown):{minutes:number}|undefined {
  if(!value || typeof value!=='object')return
  try{return {minutes:timeskipMinutes((value as {minutes?:unknown}).minutes)}}catch{return}
}
