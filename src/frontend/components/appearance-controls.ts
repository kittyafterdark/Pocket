import {button,el} from '../shared.js'
import {launcherIcon} from './launcher-icons.js'
import type {DevicePreferences} from '../../types.js'

export const ICON_PACKS = {classic:{label:'Classic',background:'#329e6b',glyph:'#ffffff'},paper:{label:'Paper',background:'#f3ead6',glyph:'#40382f'},midnight:{label:'Midnight',background:'#302442',glyph:'#e6d6ff'},pastel:{label:'Pastel',background:'#edcbd5',glyph:'#593450'},custom:{label:'Custom',background:'#524478',glyph:'#ffffff'}} as const

export function iconPackPicker(preferences:DevicePreferences,save:(value:DevicePreferences)=>void):HTMLElement {
  const root=el('div','lp-icon-pack-picker'),group=el('div','lp-icon-pack-grid')
  group.setAttribute('role','group');group.setAttribute('aria-label','Icon packs')
  let draft=structuredClone(preferences)
  const choices:HTMLButtonElement[]=[]
  for(const [id,pack] of Object.entries(ICON_PACKS)) {
    const choose=button('','lp-icon-pack-choice'),sample=el('span','lp-app-icon-box lp-icon-messages')
    choose.setAttribute('aria-label',`${pack.label} icon pack`);choose.setAttribute('aria-pressed',String(draft.iconPack===id))
    sample.style.background=id==='custom'?draft.iconBackground:pack.background;sample.style.color=id==='custom'?draft.iconForeground:pack.glyph
    sample.style.setProperty('--preview-icon-bg',id==='custom'?draft.iconBackground:pack.background)
    sample.append(launcherIcon('messages'));choose.append(sample,el('span','',pack.label))
    choose.onclick=()=>{draft.iconPack=id as DevicePreferences['iconPack'];for(const node of choices)node.setAttribute('aria-pressed',String(node===choose));save(structuredClone(draft))}
    choices.push(choose);group.append(choose)
  }
  const colors=el('div','lp-icon-pack-colors')
  root.append(group,colors)
  for(const [key,title] of [['iconBackground','Custom icon background'],['iconForeground','Custom icon color']] as const) {
    const label=el('label','lp-field',title),input=el('input','lp-color-input');input.type='color';input.value=draft[key]
    input.oninput=()=>{draft[key]=input.value;draft.iconPack='custom';for(const node of choices)node.setAttribute('aria-pressed',String(node===choices.at(-1)));const sample=choices.at(-1)!.querySelector<HTMLElement>('.lp-app-icon-box')!;sample.style.background=draft.iconBackground;sample.style.color=draft.iconForeground;sample.style.setProperty('--preview-icon-bg',draft.iconBackground);save(structuredClone(draft))}
    label.append(input);colors.append(label)
  }
  return root
}

export const APPEARANCE_CONTROL_STYLES=`
.lumiphone-shell .lp-empty-app-icon{display:grid;place-items:center;width:58px;height:58px;border-radius:16px;color:#fff;margin-bottom:12px}.lumiphone-shell .lp-empty-app-icon svg{width:34px;height:34px;margin:0;color:inherit;opacity:1}
.lumiphone-shell .lp-bubble:not([data-sender=system]){padding:calc(var(--lp-bubble-padding,8px)*var(--pocket-ui-scale)) calc(10px*var(--pocket-ui-scale));border-radius:calc(var(--lp-bubble-radius,19px)*var(--pocket-ui-scale))}
.lumiphone-shell .lp-bubble[data-sender=persona]{border-bottom-right-radius:calc(min(6px,var(--lp-bubble-radius,19px))*var(--pocket-ui-scale))}.lumiphone-shell .lp-bubble[data-sender=contact]{border-bottom-left-radius:calc(min(6px,var(--lp-bubble-radius,19px))*var(--pocket-ui-scale))}
.lumiphone-shell[data-icon-pack]:not([data-icon-pack=classic]) :is(.lp-app-icon-box,.lp-store-app-icon){background:var(--lp-icon-bg);color:var(--lp-icon-fg)}
.lumiphone-shell[data-icon-pack]:not([data-icon-pack=classic]) :is(.lp-app-icon-box,.lp-store-app-icon) svg [stroke^="#"]{stroke:var(--lp-icon-bg)}
.lumiphone-shell[data-icon-pack]:not([data-icon-pack=classic]) :is(.lp-app-icon-box,.lp-store-app-icon) svg [fill^="#"]{fill:var(--lp-icon-bg)}
.lp-icon-pack-choice svg [stroke^="#"]{stroke:var(--preview-icon-bg)}.lp-icon-pack-choice svg [fill^="#"]{fill:var(--preview-icon-bg)}
.lp-icon-pack-picker{display:grid;gap:20px;padding:4px}.lp-icon-pack-colors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.lp-icon-pack-colors .lp-field{display:flex;flex-direction:column-reverse;align-items:center;gap:9px;padding:14px 8px;border:1px solid var(--lp-border,#ffffff22);border-radius:12px;font-size:12px;text-align:center}.lp-icon-pack-colors input:focus-visible{outline:2px solid var(--lp-accent,#b6a5ee);outline-offset:3px}.lp-icon-pack-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:12px}.lp-icon-pack-choice{display:grid;justify-items:center;gap:10px;min-height:100px;border:1px solid #ffffff22;border-radius:12px;background:transparent;color:inherit;font:inherit;cursor:pointer}.lp-icon-pack-choice[aria-pressed=true]{outline:2px solid var(--lp-accent,#b6a5ee)}.lp-icon-pack-choice:focus-visible{outline:2px solid var(--lp-accent,#b6a5ee);outline-offset:3px}.lp-icon-pack-choice .lp-app-icon-box{display:grid;place-items:center;width:48px;height:48px;border-radius:14px}.lp-icon-pack-choice svg{width:28px;height:28px}.lp-chat-theme-controls label{display:grid;gap:8px}.lp-chat-theme-controls input:not([type=range]){min-height:44px}
`
