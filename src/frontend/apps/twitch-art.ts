import { el } from '../shared.js'

type Scene = 'game' | 'art' | 'code' | 'food' | 'music' | 'garden' | 'chat'
const categories: Array<[Scene, RegExp]> = [
  ['code', /software|develop|program|cod(e|ing)|python/],
  ['food', /cook|bak(e|ing)|food|kitchen|pastry/],
  ['art', /\bart\b|draw|paint|illustrat|craft/],
  ['music', /music|sing|guitar|piano|lo.?fi|\bdj\b/],
  ['garden', /garden|outdoor|plant|flower|nature/],
  ['game', /gam(e|ing|es)|speedrun|ranked|fps|rpg|valorant|minecraft/],
]

// Local illustrations are deterministic and decorative. User text never enters SVG markup.
export function streamArt(category: string, scene: string, identity = ''): HTMLElement {
  const kind = categories.find(([,match]) => match.test(category.toLowerCase()))?.[0]
    || categories.find(([,match]) => match.test(scene.toLowerCase()))?.[0] || 'chat'
  let seed = 2166136261
  for (const char of identity || category + scene) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0
  const variant = seed % 3
  const accent = ['#7ee5ca', '#f3ae72', '#c6a1ff'][variant]
  const rect = (x:number,y:number,w:number,h:number,fill:string,r=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`
  const circle = (x:number,y:number,r:number,fill:string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`
  const path = (d:string,fill:string) => `<path d="${d}" fill="${fill}"/>`
  const label = (x:number,y:number,text:string,color='#e8eaf2',size=9) => `<text x="${x}" y="${y}" fill="${color}" font-family="monospace" font-size="${size}" font-weight="600">${text}</text>`
  const person = (x:number,y:number,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})">${path('M-24 34Q-25 4 0 4T24 34',accent)}${circle(0,-7,14,'#deb49a')}${path('M-15-7Q-20-32 4-27Q20-27 15-5L8-16Q-3-7-15-7','#282339')}<path d="M-19-6v15m38-15v15M-19-6Q-19-32 0-32T19-6" fill="none" stroke="#f1e6df" stroke-width="4"/></g>`
  const webcam = () => `<g>${rect(248,110,64,61,'#14141e',5)}${rect(251,113,58,55,'#493d58',3)}${person(280,143,.75)}${rect(248,168,64,3,accent)}</g>`
  let drawing = ''
  if (kind === 'game') {
    drawing = rect(0,0,320,180,['#142c43','#261e48','#183c39'][variant])
      + circle(230,40,25,'#e4d9b8')
      + path('M0 104 45 51 92 88 137 31 208 100 267 55 320 91V180H0','#456478')
      + path('M0 121 65 83 108 115 174 76 250 123 320 98V180H0','#263e54')
      + path('M0 141 91 120 162 138 227 116 320 139V180H0','#162b38')
      + path('M121 180 161 121 176 121 211 180','#b5b499')
      + rect(25,98,50,30,'#817969') + path('M18 99 50 76 81 99','#aa7063')
      + rect(44,110,12,18,'#293a40')
      + person(170,124,.52)
      + rect(11,16,76,5,'#ffffff30',2) + rect(11,16,54,5,accent,2)
      + label(12,34,variant === 1 ? 'ANY% · 03:42' : 'LEVEL 24', '#fff',8)
      + '<path d="M160 70v10m-5-5h10" stroke="#ffffff99" fill="none"/>' + webcam()
  } else if (kind === 'art') {
    drawing = rect(0,0,320,180,'#aa7c67')
      + '<path d="M0 40H320M0 100H320M0 162H320" stroke="#986d5a"/>'
      + `<g transform="rotate(-7 154 90)">${rect(77,9,158,174,'#805b4d',2)}${rect(73,5,158,174,'#faf0d9',2)}`
      + circle(174,49,24,'#e9bf7a') + path('M83 128Q113 74 145 113T221 91V164H83','#9cb9b0')
      + path('M83 146Q145 103 221 141V166H83','#548783')
      + '<path d="M152 151V74m0 26-19-13m19 29 20-21" stroke="#375c59" stroke-width="3"/>'
      + [0,1,2,3,4].map(n=>circle(131+n*9,75+(n%2)*11,12,['#d78986','#ebac9f'][n%2])).join('') + '</g>'
      + circle(274,57,27,'#e6cfac') + [0,1,2,3].map(n=>circle(260+(n%2)*22,45+Math.floor(n/2)*22,7,['#d57b76','#467b81','#d8b552',accent][n])).join('')
      + '<path d="m252 158 29-66" stroke="#363745" stroke-width="5"/><path d="m252 158 4-14" stroke="#cbaa73" stroke-width="7"/>'
      + circle(34,137,20,'#e9d9bd') + circle(34,137,14,'#745440')
  } else if (kind === 'code') {
    drawing = rect(0,0,320,180,'#111b2b') + rect(0,0,320,19,'#29354a')
      + [0,1,2].map(n=>circle(12+n*11,10,3,['#ed8e96','#e6bc76','#8acdb3'][n])).join('')
      + label(64,13,'studio / little-side-project', '#a9b7cc',8)
      + rect(0,19,51,161,'#1b2639')
      + [0,1,2,3,4,5].map(n=>rect(10+n%2*7,35+n*13,28-n%3*5,3,'#52647e',1)).join('')
      + label(64,36,'function makeSomething() {',accent,9)
      + Array.from({length:8},(_,n)=>label(64,52+n*11,String(n+2),'#53627d',7)
        + rect(82+(n%3)*9,47+n*11,28+(seed>>>n)%68,4,['#c5a2e8','#8ecfc3','#e8c78c'][n%3],1)
        + rect(169+n%2*8,47+n*11,17+n%3*12,4,'#6f84a3',1)).join('')
      + rect(51,145,269,35,'#0d1623') + label(63,159,'> build complete',accent,8)
      + label(63,172,'ready for a little debugging', '#8a99af',7) + webcam()
  } else if (kind === 'food') {
    drawing = rect(0,0,320,180,'#b67c56')
      + '<path d="M0 36H320M0 101H320M0 161H320" stroke="#9e694b" stroke-width="2"/>'
      + `<g transform="rotate(8 164 92)">${rect(67,13,187,157,'#ddae77',14)}${rect(78,22,165,139,'#e9c392',10)}</g>`
      + [0,1,2,3,4,5].map(n=>{const x=108+n%3*51,y=58+Math.floor(n/3)*61;return circle(x+2,y+3,22,'#b67d4d')+circle(x,y,21,['#d89e58','#f0c07d','#c98a49'][variant])+path(`M${x-12} ${y-7}q12-11 24 0l-4 8-8-5-8 5z`,'#fff0cf')+circle(x-6,y+6,2,'#715040')+circle(x+7,y+8,2,'#715040')}).join('')
      + circle(28,48,24,'#e9e1cd') + circle(28,48,17,'#785948')
      + rect(280,67,6,99,'#3b4b48',3) + path('M276 15q25 16 11 62h-11z','#dae0d6')
      + '<path d="m17 153 31-31m-20 21-13-3m21-4 4-15" stroke="#5b7753" stroke-width="5"/>'
  } else if (kind === 'music' || kind === 'chat') {
    drawing = rect(0,0,320,180,kind==='music'?'#252e4b':'#544154')
      + rect(143,12,141,113,'#131e36',3)
      + Array.from({length:10},(_,n)=>rect(149+n*13,57+(seed>>>n)%31,10,68,'#354967')+rect(151+n*13,78+n%3*9,3,4,'#eac992')).join('')
      + '<path d="M213 13v112M144 66h140" stroke="#69788f" stroke-width="4"/>'
      + circle(253,37,12,'#f0d5b6') + rect(10,34,98,5,'#967f80')
      + [0,1,2,3,4].map(n=>rect(16+n*15,17+n%2*5,9,17-n%2*5,['#a9bfa7','#c7989c','#d9b180'][n%3])).join('')
      + person(111,111,1.65) + rect(0,159,320,21,'#8e6a65')
      + rect(175,112,68,45,'#151d32',4) + rect(179,116,60,34,'#5d6b87',2)
      + '<path d="M172 158h75" stroke="#adb4cb" stroke-width="4"/>'
      + rect(260,142,20,17,'#dbbcb0',3)
      + (kind==='music' ? Array.from({length:15},(_,n)=>rect(9+n*7,146-(n%5)*3,3,5+(n%5)*3,accent,1)).join('') : '')
  } else {
    drawing = rect(0,0,320,180,'#bdd8cc') + circle(262,35,23,'#fff0b5')
      + path('M0 120Q85 45 169 110T320 85V180H0','#739d85')
      + path('M0 155Q150 97 320 137V180H0','#426f60')
      + [0,1,2,3,4].map(n=>{const x=39+n*54,y=97+n%2*24;return `<path d="M${x} ${y}v67" stroke="#335748" stroke-width="4"/>`+circle(x-8,y,12,'#e8aaa5')+circle(x+8,y,12,'#e8aaa5')+circle(x,y-10,12,'#f4c1ae')+circle(x,y,7,'#eecb6c')}).join('')
  }
  const art = el('div','tw-placeholder')
  art.dataset.scene = kind
  art.setAttribute('aria-hidden','true')
  art.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" focusable="false">${drawing}</svg>`
  return art
}
