import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import type { EventQuickstartCard } from '../../backend/event-quickstart.js'

const escape = (text: string) =>
  text.replace(/[&<>"']/g, letter => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[letter]!))

export function eventQuickstartHtml(card: EventQuickstartCard): string {
  const date = new Date(card.when)
  const when = Number.isFinite(date.getTime())
    ? date.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})
    : card.when

  const messageCount = Math.max(0, Math.round(card.messageCount))
  const serial = `PKT-${String(messageCount % 1000).padStart(3,'0')}`

  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  :root{color-scheme:dark;--bg:#0d0c12;--card:#17141d;--card-2:#121017;--ink:#f4f0fa;--muted:#9e95aa;--accent:#b9a3ff;--accent-2:#7fd8ff}
  *{box-sizing:border-box}
  h2,p,.when{overflow-wrap:anywhere}.body,.pass{min-width:0}
  body{margin:0;padding:4px;background:transparent;color:var(--ink);font:14px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  article{max-width:680px;margin:auto;position:relative;display:grid;grid-template-columns:154px minmax(0,1fr);overflow:hidden;border:1px solid #ffffff21;border-radius:22px;background:linear-gradient(120deg,#ffffff06,transparent 35%),linear-gradient(160deg,var(--card),var(--card-2));box-shadow:0 22px 54px #0000004a,inset 0 1px #ffffff0a}
  article:before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,#ffffff03 0 1px,transparent 1px 5px);mix-blend-mode:screen;opacity:.6}
  .stub{position:relative;min-height:250px;padding:18px 18px 16px;display:flex;flex-direction:column;justify-content:space-between;border-right:1px dashed #ffffff38;background:radial-gradient(circle at 18% 18%,#ffffff12,transparent 22%),linear-gradient(165deg,#b9a3ff3d,#7fd8ff0f)}
  .stub:before,.stub:after{content:"";position:absolute;right:-11px;width:22px;height:22px;border-radius:50%;background:var(--bg);box-shadow:inset 0 0 0 1px #ffffff08;z-index:3}.stub:before{top:-11px}.stub:after{bottom:-11px}
  .serial{display:flex;justify-content:space-between;gap:10px;align-items:center;font:700 8px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#d3c5ff}.serial code{font:inherit;color:#9187a0}
  .brand-wrap{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center}.brand{writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;font-weight:850;letter-spacing:.23em;color:#f0e9ff}
  .pass{min-width:0}.tiny{font:800 8px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:#a99dc0;margin-bottom:7px}.when{font-size:16px;line-height:1.2;font-weight:780;letter-spacing:-.025em;color:#f7f3ff}
  .admit{display:flex;align-items:center;gap:7px;font:800 8px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;text-transform:uppercase;letter-spacing:.14em;color:#92899f}.admit:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px #b9a3ffb3}
  .body{position:relative;padding:22px 24px 19px}.body-top{display:flex;justify-content:space-between;align-items:center;gap:16px}.kicker{font:800 9px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;text-transform:uppercase;letter-spacing:.14em;color:#9f94ac}
  .classification{padding:4px 7px;border:1px solid #b9a3ff33;border-radius:5px;background:#b9a3ff0e;font:750 8px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;text-transform:uppercase;letter-spacing:.12em;color:#cbbaff;white-space:nowrap}
  h2{margin:12px 0 8px;max-width:470px;font-size:27px;line-height:1.03;letter-spacing:-.05em}.people{margin:0;color:#c1b8ca;font-size:12px}.people:before{content:"WITH  ";font:750 8px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.12em;color:#786f82}
  .desc{margin:15px 0 0;max-width:500px;color:#e5dfe9}
  .route{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;margin-top:22px;color:#7e7588;font:750 8px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.13em;text-transform:uppercase}.route-line{position:relative;height:1px;background:linear-gradient(90deg,#b9a3ffa6,#7fd8ff59)}.route-line:before,.route-line:after{content:"";position:absolute;top:50%;width:5px;height:5px;border-radius:50%;transform:translateY(-50%);background:#c8b8ff}.route-line:before{left:0}.route-line:after{right:0;background:#90dcff}
  .footer{display:flex;justify-content:space-between;gap:18px;align-items:flex-end;margin-top:16px;padding-top:13px;border-top:1px solid #ffffff11}.carried{color:#8f8699;font-size:10px}.carried b{display:block;margin-bottom:2px;font-size:12px;color:#d5c8ff;font-weight:750}
  .barcode{width:92px;height:22px;opacity:.55;background:repeating-linear-gradient(90deg,#ddd6ed 0 1px,transparent 1px 3px,#ddd6ed 3px 5px,transparent 5px 8px,#ddd6ed 8px 9px,transparent 9px 12px);-webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
  @media(max-width:520px){article{grid-template-columns:1fr}.stub{min-height:auto;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;border-right:0;border-bottom:1px dashed #ffffff38}.stub:before,.stub:after{display:none}.serial{grid-column:1/-1}.brand-wrap{grid-template-columns:1fr}.brand{writing-mode:horizontal-tb;transform:none;letter-spacing:.18em}.tiny{display:none}.admit{justify-self:end}.body{padding:19px 18px 17px}h2{font-size:23px}.footer{align-items:center}.barcode{width:72px}}
  </style><article aria-label="Event quickstart: ${escape(card.title)}">
    <aside class="stub">
      <div class="serial"><span>POCKET // EVENT</span><code>${serial}</code></div>
      <div class="brand-wrap">
        <div class="brand">POCKET</div>
        <div class="pass"><div class="tiny">Valid for one scene</div><div class="when">${escape(when)}</div></div>
      </div>
      <div class="admit">Admit one jump</div>
    </aside>

    <section class="body">
      <div class="body-top"><div class="kicker">A little time skip</div><div class="classification">scene handoff</div></div>
      <h2>${escape(card.title)}</h2>
      <p class="people">${escape(card.people)}</p>
      ${card.description ? `<p class="desc">${escape(card.description)}</p>` : ''}

      <div class="route"><span>Messages</span><span class="route-line"></span><span>Scene</span></div>

      <div class="footer">
        <div class="carried"><b>${messageCount} texts carried forward</b>Context preserved from the preceding exchange</div>
        <div class="barcode" aria-hidden="true"></div>
      </div>
    </section>
  </article>`
}

/** Display-only replacement: the original handoff remains intact in model context. */
export function installEventQuickstartCards(ctx: SpindleFrontendContext): () => void {
  if (!ctx.messages.renderWidget) return ()=>{}
  const mounted = new Map<string,{source:string;dispose:()=>void}>()
  const clear = () => {for(const entry of mounted.values())entry.dispose();mounted.clear()}
  const unregister=ctx.messages.registerTagInterceptor({tagName:'pocket-event-start',removeFromMessage:true},payload=>{
    if(payload.isStreaming || payload.isUser===false || !payload.messageId) return
    if(payload.chatId && payload.chatId!==ctx.getActiveChat().chatId) return
    try {
      const data=JSON.parse(decodeURIComponent((payload.attrs.card||'').slice(0,24000)))
      if(!data || typeof data.eventId!=='string' || typeof data.title!=='string' || typeof data.when!=='string')return
      const clean=(value:unknown,max:number)=>typeof value==='string'?value.slice(0,max):''
      const card:EventQuickstartCard={eventId:clean(data.eventId,180),title:clean(data.title,180),description:clean(data.description,600),when:clean(data.when,80),people:clean(data.people,600),messageCount:Number.isFinite(data.messageCount)?data.messageCount:0}
      const key=`${payload.chatId}:${payload.messageId}`, source=JSON.stringify(card), existing=mounted.get(key)
      if(existing?.source===source)return
      existing?.dispose()
      mounted.set(key,{source,dispose:ctx.messages.renderWidget({messageId:payload.messageId,widgetId:'pocket-event-start',html:eventQuickstartHtml(card),minHeight:160,maxHeight:650})})
    } catch { /* malformed historical cards cannot break message rendering */ }
  })
  const stop=ctx.events.on('CHAT_SWITCHED',clear)
  return ()=>{unregister();stop();clear()}
}
