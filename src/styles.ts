export const PHONE_STYLES = `
  .lumiphone-widget-root, .lumiphone-widget-root *, .lumiphone-drawer, .lumiphone-drawer * { box-sizing: border-box; }
  .lumiphone-widget-root {
    width: 100%; height: 100%; display: grid; place-items: center; overflow: visible;
    color: #f7f5ff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .lumiphone-handset-host { margin:auto; cursor:default; overscroll-behavior:contain; }
  .lumiphone-launcher {
    appearance: none; width: 58px; height: 58px; padding: 0; border: 1px solid rgba(255,255,255,.2);
    border-radius: 19px; display: grid; place-items: center; position: relative; cursor: pointer;
    color: #fff; background: linear-gradient(145deg,#9a8cff,#5746ce 58%,#2b216f);
    box-shadow: 0 18px 42px rgba(16,11,38,.38), inset 0 1px rgba(255,255,255,.28);
    transition: transform .2s ease, box-shadow .2s ease; touch-action: none;
  }
  .lumiphone-launcher:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 22px 48px rgba(16,11,38,.46), inset 0 1px rgba(255,255,255,.32); }
  .lumiphone-launcher:focus-visible { outline: 3px solid color-mix(in srgb,#9a8cff 58%,white); outline-offset: 3px; }
  .lumiphone-launcher svg { width: 27px; height: 27px; }
  .lumiphone-badge {
    position: absolute; top: -5px; right: -5px; min-width: 20px; height: 20px; padding: 0 5px;
    border: 2px solid #1b1722; border-radius: 999px; display: grid; place-items: center;
    background: #ff496d; color: white; font-size: 10px; font-weight: 850; line-height: 1;
  }
  .lumiphone-badge[hidden] { display: none; }

  .lumiphone-shell {
    --lp-accent: #8b7dff; --lp-bezel: #17151d; --lp-wallpaper: linear-gradient(145deg,#171327,#33235f 48%,#123a4a);
    --lp-chat-wallpaper: linear-gradient(180deg,rgba(139,125,255,.16),rgba(19,17,28,.03));
    --lp-bg: #0d0c12; --lp-surface: rgba(31,29,40,.88); --lp-surface-2: rgba(50,47,62,.78);
    --lp-text: #f7f5ff; --lp-muted: #aaa5b6; --lp-border: rgba(255,255,255,.11); --lp-shadow: rgba(0,0,0,.45);
    --lp-animation-ms: 280ms; --pocket-ui-scale:1;
    --pocket-font-xs:calc(8px * var(--pocket-ui-scale)); --pocket-font-sm:calc(10px * var(--pocket-ui-scale));
    --pocket-font-md:calc(13px * var(--pocket-ui-scale)); --pocket-control-h:calc(38px * var(--pocket-ui-scale));
    --pocket-gap:calc(10px * var(--pocket-ui-scale)); --pocket-icon:calc(54px * var(--pocket-ui-scale));
    width: 100%; height: 100%; min-width: 0; min-height: 0; aspect-ratio: 9 / 16; overflow: hidden; position: relative; isolation: isolate;
    border: 8px solid var(--lp-bezel); border-radius: 45px; background: var(--lp-bg); color: var(--lp-text);
    box-shadow: 0 36px 90px var(--lp-shadow), 0 0 0 1px rgba(255,255,255,.09) inset;
    display: grid; grid-template-rows: 34px minmax(0,1fr) 24px;
  }
  .lumiphone-shell[hidden], .lumiphone-launcher[hidden] { display: none !important; }
  .lumiphone-shell[data-theme="porcelain"] { --lp-bg:#f2f0ed; --lp-surface:rgba(255,255,255,.9); --lp-surface-2:rgba(226,222,218,.82); --lp-text:#231f2a; --lp-muted:#746e78; --lp-border:rgba(37,30,45,.12); --lp-shadow:rgba(35,28,46,.24); }
  .lumiphone-shell[data-theme="rose"] { --lp-bg:#1b1018; --lp-surface:rgba(53,27,43,.9); --lp-surface-2:rgba(94,43,69,.75); --lp-text:#fff4fa; --lp-muted:#ceaebb; --lp-border:rgba(255,209,229,.13); --lp-shadow:rgba(38,7,24,.5); }
  .lumiphone-shell[data-theme="forest"] { --lp-bg:#0d1713; --lp-surface:rgba(23,48,38,.9); --lp-surface-2:rgba(38,77,59,.76); --lp-text:#effcf5; --lp-muted:#9ebcad; --lp-border:rgba(204,255,224,.12); --lp-shadow:rgba(3,26,16,.54); }
  .lumiphone-statusbar {
    height: 34px; padding: 5px 16px 0; display: grid; grid-template-columns: 24px minmax(28px,1fr) auto minmax(60px,1fr); align-items: start;
    position: relative; z-index: 20; font-size: 10px; font-weight: 760; letter-spacing: .01em; user-select: none;
  }
  .lumiphone-dismiss { appearance:none; width:22px; height:22px; padding:4px; border:0; border-radius:50%; display:grid; place-items:center; background:color-mix(in srgb,var(--lp-surface) 72%,transparent); color:var(--lp-text); cursor:pointer; }
  .lumiphone-dismiss svg { width:14px; height:14px; }
  .lumiphone-time { padding-top: 3px; }
  .lumiphone-island {
    appearance:none; padding:0 9px; color:inherit; cursor:pointer;
    width: 92px; height: 23px; border-radius: 999px; background: #050506; border: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: flex-end; gap: 6px;
  }
  .lumiphone-island[data-unread="true"] { box-shadow:0 0 0 2px color-mix(in srgb,var(--lp-accent) 70%,transparent); }
  .lumiphone-island::before { content:""; width: 31px; height: 5px; border-radius: 99px; background: #111; }
  .lumiphone-island::after { content:""; width: 5px; height: 5px; border-radius: 50%; background: #17203c; box-shadow: inset 0 0 0 1px #253568; }
  .lumiphone-signals { padding-top: 3px; display: flex; justify-content: flex-end; align-items: center; gap: 5px; }
  .lumiphone-signal-bars { display:flex; align-items:flex-end; gap:1px; height:9px; }
  .lumiphone-signal-bars i { display:block; width:2px; border-radius:1px; background:currentColor; }
  .lumiphone-signal-bars i:nth-child(1){height:3px}.lumiphone-signal-bars i:nth-child(2){height:5px}.lumiphone-signal-bars i:nth-child(3){height:7px}.lumiphone-signal-bars i:nth-child(4){height:9px}
  .lumiphone-battery { width:14px; height:7px; border:1px solid currentColor; border-radius:2px; padding:1px; position:relative; opacity:.9; }
  .lumiphone-battery::before { content:""; display:block; width:75%; height:100%; border-radius:1px; background:currentColor; }
  .lumiphone-battery::after { content:""; position:absolute; width:1px; height:3px; top:1px; right:-3px; border-radius:0 1px 1px 0; background:currentColor; }
  .lumiphone-screen { min-height: 0; overflow: hidden; position: relative; background: var(--lp-bg); }
  .lumiphone-app-view { width:100%; height:100%; min-height:0; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:color-mix(in srgb,var(--lp-accent) 42%,transparent) transparent; }
  .lumiphone-app-view[data-animate="spring"] { animation: lp-spring var(--lp-animation-ms) cubic-bezier(.2,.9,.28,1.12); }
  .lumiphone-app-view[data-animate="slide"] { animation: lp-slide var(--lp-animation-ms) cubic-bezier(.2,.8,.2,1); }
  .lumiphone-app-view[data-animate="fade"] { animation: lp-fade var(--lp-animation-ms) ease; }
  @keyframes lp-spring { from{opacity:.25;transform:scale(.88) translateY(16px);filter:blur(4px)} to{opacity:1;transform:none;filter:none} }
  @keyframes lp-slide { from{opacity:.2;transform:translateX(32px)} to{opacity:1;transform:none} }
  @keyframes lp-fade { from{opacity:0} to{opacity:1} }
  .lumiphone-homebar { display:grid; place-items:start center; background:var(--lp-bg); position:relative; z-index:20; }
  .lumiphone-homebar button { appearance:none; width:112px; height:17px; padding:0; border:0; background:transparent; cursor:pointer; position:relative; }
  .lumiphone-homebar button::after { content:""; position:absolute; left:8px; right:8px; top:7px; height:4px; border-radius:99px; background:var(--lp-text); opacity:.88; }

  .lp-home { min-height:100%; padding: 14px 16px 18px; background-image:var(--lp-wallpaper); background-size:var(--lp-home-wallpaper-size,cover); background-position:var(--lp-home-wallpaper-position,center); background-repeat:no-repeat; color:#fff; display:flex; flex-direction:column; }
  .lp-home-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; padding:10px 3px 20px; text-shadow:0 2px 12px rgba(0,0,0,.35); }
  .lp-home-date { font-size:11px; font-weight:650; opacity:.82; }
  .lp-home-clock { margin-top:1px; font-size:34px; line-height:1; font-weight:310; letter-spacing:-.045em; }
  .lp-home-weather { display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px solid rgba(255,255,255,.18); border-radius:15px; background:rgba(15,13,24,.22); backdrop-filter:blur(18px); font-size:11px; }
  .lp-app-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:18px 10px; align-content:start; }
  .lp-app-icon { appearance:none; min-width:0; padding:0; border:0; background:transparent; color:#fff; cursor:pointer; display:grid; justify-items:center; gap:6px; font:inherit; }
  .lp-app-icon:hover .lp-app-icon-box { transform:translateY(-2px) scale(1.035); }
  .lp-app-icon-box { width:54px; height:54px; border-radius:16px; display:grid; place-items:center; position:relative; box-shadow:0 8px 22px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.25); transition:transform .18s ease; }
  .lp-app-icon-box svg { width:27px; height:27px; stroke-width:1.7; }
  .lp-app-label { max-width:76px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:10px; font-weight:600; text-shadow:0 1px 6px rgba(0,0,0,.65); }
  .lp-app-dot { position:absolute; top:-5px; right:-5px; min-width:18px; height:18px; padding:0 4px; display:grid; place-items:center; border:2px solid rgba(22,17,35,.9); border-radius:99px; background:#ff4164; font-size:9px; font-weight:850; }
  .lp-home-dock { margin-top:auto; min-height:74px; padding:10px; border:1px solid rgba(255,255,255,.18); border-radius:24px; background:rgba(15,13,24,.28); backdrop-filter:blur(24px) saturate(1.3); display:grid; grid-template-columns:repeat(4,1fr); align-items:center; }
  .lp-home-dock .lp-app-icon-box { width:50px; height:50px; }
  .lp-home-dock .lp-app-label { display:none; }
  .lp-home-activity { margin:12px 0; display:grid; gap:5px; }
  .lp-home-activity-item { appearance:none; min-height:38px; padding:7px 9px; border:1px solid rgba(255,255,255,.16); border-radius:13px; display:grid; grid-template-columns:minmax(0,auto) minmax(0,1fr) auto; align-items:center; gap:7px; background:rgba(15,13,24,.28); color:#fff; backdrop-filter:blur(18px); font:inherit; text-align:left; cursor:pointer; }
  .lp-home-activity-item strong,.lp-home-activity-item span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-home-activity-item strong { font-size:10px; }
  .lp-home-activity-item > span:not(.lp-home-activity-arrow) { opacity:.68; font-size:9px; }
  .lp-home-activity-arrow { font-size:17px; }
  .lp-home-notifications-all { appearance:none; min-height:25px; border:0; background:transparent; color:#fff; opacity:.78; font:inherit; font-size:9px; cursor:pointer; }
  .lp-icon-messages { background:linear-gradient(145deg,#4ee580,#12aa4b); }
  .lp-icon-contacts { background:linear-gradient(145deg,#63b8ff,#3468d9); }
  .lp-icon-camera { background:linear-gradient(145deg,#74757c,#18191d); }
  .lp-icon-gallery { background:linear-gradient(145deg,#fff,#e9e8ec); color:#6d49da; }
  .lp-icon-notes { background:linear-gradient(#ffd84a 0 24%,#fff7c4 24%); color:#725d00; }
  .lp-icon-weather { background:linear-gradient(145deg,#48b5ff,#4166d7); }
  .lp-icon-calendar { background:linear-gradient(#fff 0 26%,#ff4f68 26%); color:#24212b; }
  .lp-icon-trackers { background:linear-gradient(145deg,#a269ff,#5632d3); }
  .lp-icon-settings { background:linear-gradient(145deg,#a8a9af,#4c4e54); }

  .lp-page { min-height:100%; background:var(--lp-bg); color:var(--lp-text); }
  .lp-nav { min-height:48px; padding:7px 12px 8px; display:grid; grid-template-columns:74px minmax(0,1fr) 74px; align-items:center; gap:4px; position:sticky; top:0; z-index:15; background:color-mix(in srgb,var(--lp-bg) 88%,transparent); border-bottom:1px solid var(--lp-border); backdrop-filter:blur(20px) saturate(1.25); }
  .lp-nav-title { min-width:0; text-align:center; font-size:14px; font-weight:780; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-nav-subtitle { display:block; color:var(--lp-muted); font-size:9px; font-weight:550; margin-top:2px; }
  .lp-nav-action { appearance:none; min-height:30px; padding:5px 4px; border:0; background:transparent; color:var(--lp-accent); font:inherit; font-size:11px; font-weight:680; cursor:pointer; text-align:left; }
  .lp-nav-action:last-child { text-align:right; }
  .lp-content { padding:12px; display:grid; gap:10px; }
  .lp-card { padding:12px; border:1px solid var(--lp-border); border-radius:17px; background:var(--lp-surface); box-shadow:0 8px 24px rgba(0,0,0,.06); }
  .lp-card[data-clickable="true"] { cursor:pointer; transition:transform .18s ease,border-color .18s ease; }
  .lp-card[data-clickable="true"]:hover { transform:translateY(-1px); border-color:color-mix(in srgb,var(--lp-accent) 38%,var(--lp-border)); }
  .lp-row { display:flex; align-items:center; gap:10px; min-width:0; }
  .lp-row-between { display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; }
  .lp-stack { display:grid; gap:8px; min-width:0; }
  .lp-grow { flex:1; min-width:0; }
  .lp-title { margin:0; font-size:13px; font-weight:760; line-height:1.3; overflow-wrap:anywhere; }
  .lp-copy { margin:0; color:var(--lp-muted); font-size:10px; line-height:1.5; overflow-wrap:anywhere; }
  .lp-eyebrow { color:var(--lp-muted); font-size:8px; line-height:1.2; font-weight:780; letter-spacing:.11em; text-transform:uppercase; }
  .lp-empty { min-height:190px; padding:32px 20px; display:grid; place-items:center; text-align:center; color:var(--lp-muted); }
  .lp-empty svg { width:44px; height:44px; margin-bottom:10px; color:var(--lp-accent); opacity:.8; }
  .lp-button { appearance:none; min-height:34px; padding:7px 11px; border:1px solid var(--lp-border); border-radius:11px; background:var(--lp-surface-2); color:var(--lp-text); font:inherit; font-size:10px; font-weight:720; cursor:pointer; }
  .lp-button:hover { border-color:color-mix(in srgb,var(--lp-accent) 45%,var(--lp-border)); }
  .lp-button:disabled { cursor:not-allowed; opacity:.45; }
  .lp-button-primary { border-color:transparent; background:var(--lp-accent); color:#fff; }
  .lp-button-danger { color:#ff6f87; }
  .lp-button-icon { width:34px; padding:6px; display:grid; place-items:center; }
  .lp-button-icon svg { width:16px; height:16px; }
  .lp-input, .lp-textarea, .lp-select { width:100%; min-height:38px; padding:9px 10px; border:1px solid var(--lp-border); border-radius:11px; outline:none; background:var(--lp-surface); color:var(--lp-text); font:inherit; font-size:11px; }
  .lp-input:focus, .lp-textarea:focus, .lp-select:focus { border-color:color-mix(in srgb,var(--lp-accent) 58%,var(--lp-border)); box-shadow:0 0 0 2px color-mix(in srgb,var(--lp-accent) 16%,transparent); }
  .lp-textarea { min-height:96px; resize:vertical; line-height:1.5; }
  .lp-label { display:grid; gap:5px; color:var(--lp-muted); font-size:9px; font-weight:680; }
  .lp-fields { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .lp-chipbar { display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
  .lp-chip { appearance:none; white-space:nowrap; min-height:29px; padding:5px 9px; border:1px solid var(--lp-border); border-radius:99px; background:var(--lp-surface); color:var(--lp-muted); font:inherit; font-size:9px; font-weight:700; cursor:pointer; }
  .lp-chip[aria-pressed="true"] { border-color:transparent; background:var(--lp-accent); color:#fff; }
  .lp-avatar { width:42px; height:42px; flex:0 0 42px; border-radius:50%; overflow:hidden; display:grid; place-items:center; background:linear-gradient(145deg,color-mix(in srgb,var(--lp-accent) 85%,white),var(--lp-accent)); color:#fff; font-size:15px; font-weight:820; }
  .lp-avatar img { width:100%; height:100%; object-fit:cover; }
  .lp-list-separator { height:1px; margin-left:52px; background:var(--lp-border); }
  .lp-unread { min-width:20px; height:20px; padding:0 5px; display:grid; place-items:center; border-radius:99px; background:var(--lp-accent); color:#fff; font-size:9px; font-weight:800; }

  .lp-thread { height:100%; min-height:0; overflow:hidden; display:grid; grid-template-rows:auto auto minmax(0,1fr) auto; background-image:var(--lp-chat-wallpaper); background-color:var(--lp-bg); background-size:var(--lp-chat-wallpaper-size,cover); background-position:var(--lp-chat-wallpaper-position,center); background-repeat:no-repeat; }
  .lp-thread .lp-nav { position:relative; }
  .lp-conversation-menu { position:relative; justify-self:end; }
  .lp-conversation-menu > summary { display:grid; place-items:center; min-width:30px; cursor:pointer; list-style:none; font-size:18px; line-height:1; }
  .lp-conversation-menu > summary::-webkit-details-marker { display:none; }
  .lp-conversation-menu-sheet { position:absolute; z-index:30; top:calc(100% + 5px); right:0; width:190px; padding:6px; display:grid; gap:2px; border:1px solid var(--lp-border); border-radius:13px; background:var(--lp-bg); box-shadow:0 16px 34px rgba(0,0,0,.28); }
  .lp-conversation-menu-action { appearance:none; min-height:34px; padding:7px 9px; border:0; border-radius:8px; background:transparent; color:var(--lp-text); font:inherit; font-size:var(--pocket-font-sm); text-align:left; cursor:pointer; }
  .lp-conversation-menu-action:hover { background:var(--lp-surface-2); }
  .lp-conversation-menu-action:disabled { opacity:.42; cursor:not-allowed; }
  .lp-reference-slot:empty { min-height:0; }
  .lp-reference-attachment { margin:7px 9px 0; padding:8px 9px; display:grid; gap:5px; border:1px solid color-mix(in srgb,var(--lp-accent) 35%,var(--lp-border)); border-radius:13px; background:color-mix(in srgb,var(--lp-surface) 94%,transparent); box-shadow:0 5px 16px rgba(0,0,0,.09); }
  .lp-reference-head { display:flex; align-items:center; gap:8px; }
  .lp-reference-head .lp-grow { display:grid; gap:1px; }
  .lp-reference-mark { width:21px; height:21px; flex:0 0 21px; display:grid; place-items:center; border-radius:50%; background:color-mix(in srgb,var(--lp-accent) 15%,transparent); color:var(--lp-accent); font-size:10px; font-weight:900; }
  .lp-reference-attachment[data-state="injected"] .lp-reference-mark { animation:lp-reference-pulse 1.4s ease-in-out infinite; }
  .lp-reference-attachment[data-state="failed"] { border-color:color-mix(in srgb,#ff6f87 55%,var(--lp-border)); }
  .lp-reference-attachment[data-state="failed"] .lp-reference-mark { color:#ff6f87; background:color-mix(in srgb,#ff6f87 15%,transparent); }
  .lp-reference-actions { display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end; }
  .lp-reference-action { appearance:none; min-height:27px; padding:5px 7px; border:1px solid var(--lp-border); border-radius:8px; background:var(--lp-accent); color:#fff; font:inherit; font-size:var(--pocket-font-xs); font-weight:750; cursor:pointer; }
  .lp-reference-action-quiet { background:transparent; color:var(--lp-muted); }
  .lp-reference-safety { margin:0 0 0 29px; color:var(--lp-muted); font-size:var(--pocket-font-xs); line-height:1.35; }
  .lp-reference-diagnostics { margin-left:29px; color:var(--lp-muted); font-size:var(--pocket-font-xs); }
  .lp-reference-diagnostics > summary { cursor:pointer; }
  .lp-reference-sheet { display:grid; gap:9px; }
  .lp-reference-scope,.lp-reference-message-choice { padding:9px; display:flex; align-items:flex-start; gap:8px; border:1px solid var(--lp-border); border-radius:11px; background:var(--lp-surface); cursor:pointer; }
  .lp-reference-scope .lp-grow,.lp-reference-message-choice .lp-grow { display:grid; gap:2px; }
  .lp-reference-message-list { max-height:260px; padding:7px; overflow:auto; display:grid; gap:5px; border:1px solid var(--lp-border); border-radius:12px; background:var(--lp-surface-2); }
  .lp-reference-message-choice:has(input:disabled) { opacity:.48; cursor:default; }
  @keyframes lp-reference-pulse { 50% { transform:translateY(-1px); box-shadow:0 0 0 5px color-mix(in srgb,var(--lp-accent) 10%,transparent); } }
  .lp-bubbles { min-height:0; overflow:auto; padding:14px 12px; display:flex; flex-direction:column; gap:7px; }
  .lp-bubble { max-width:79%; padding:8px 10px; border-radius:16px; font-size:11px; line-height:1.42; white-space:pre-wrap; overflow-wrap:anywhere; box-shadow:0 3px 10px rgba(0,0,0,.08); }
  .lp-bubble[data-sender="persona"] { align-self:flex-end; border-bottom-right-radius:5px; background:var(--lp-accent); color:#fff; }
  .lp-bubble[data-sender="contact"] { align-self:flex-start; border-bottom-left-radius:5px; background:var(--lp-surface-2); color:var(--lp-text); }
  .lp-bubble[data-sender="system"] { align-self:center; max-width:90%; background:transparent; color:var(--lp-muted); text-align:center; font-size:9px; box-shadow:none; }
  .lp-bubble-time { display:block; margin-top:4px; opacity:.58; font-size:7px; text-align:right; }
  .lp-bubble-sender { display:block; margin-bottom:2px; color:var(--lp-accent); font-size:8px; }
  .lp-actor-link { appearance:none; border:0; padding:0; background:transparent; font:inherit; font-weight:800; text-align:left; cursor:pointer; }
  .lp-group-message { max-width:88%; align-self:flex-start; display:grid; grid-template-columns:25px minmax(0,1fr); align-items:end; gap:6px; }
  .lp-group-message .lp-bubble { max-width:100%; border-left:2px solid color-mix(in srgb,var(--message-accent) 72%,transparent); }
  .lp-group-avatar { width:24px; height:24px; overflow:hidden; display:grid; place-items:center; border:2px solid var(--message-accent); border-radius:50%; background:var(--lp-surface-2); color:var(--message-accent); font-size:8px; font-weight:800; }
  .lp-group-avatar[data-clickable="true"] { cursor:pointer; }
  .lp-group-avatar img { width:100%; height:100%; object-fit:cover; }
  .lp-group-avatar-spacer { visibility:hidden; }
  .lp-group-typing { align-self:flex-start; min-height:30px; padding:6px 10px; display:flex; align-items:center; gap:7px; border-radius:13px; background:var(--lp-surface-2); color:var(--lp-muted); font-size:var(--pocket-font-sm); }
  .lp-bubble-pending { opacity:.82; min-width:42px; }
  .lp-typing-dots { min-height:12px; display:flex; align-items:center; justify-content:center; gap:3px; }
  .lp-typing-dots i { width:5px; height:5px; border-radius:50%; background:currentColor; opacity:.42; animation:lp-typing 1s ease-in-out infinite; }
  .lp-typing-dots i:nth-child(2) { animation-delay:.14s; }
  .lp-typing-dots i:nth-child(3) { animation-delay:.28s; }
  .lp-compose-stack { border-top:1px solid var(--lp-border); background:color-mix(in srgb,var(--lp-bg) 90%,transparent); backdrop-filter:blur(18px); }
  .lp-compose { padding:8px 9px 10px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:6px; align-items:end; }
  .lp-speaker-menu { position:relative; padding:5px 9px 0; color:var(--lp-muted); font-size:var(--pocket-font-xs); }
  .lp-speaker-menu summary { width:max-content; max-width:100%; padding:4px 8px; border:1px solid var(--lp-border); border-radius:99px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:pointer; list-style:none; }
  .lp-speaker-menu summary::-webkit-details-marker { display:none; }
  .lp-speaker-sheet { position:absolute; z-index:4; left:9px; right:9px; bottom:calc(100% + 5px); max-height:220px; padding:9px; overflow:auto; display:grid; gap:4px; border:1px solid var(--lp-border); border-radius:14px; background:var(--lp-bg); box-shadow:0 14px 30px rgba(0,0,0,.26); }
  .lp-speaker-option { appearance:none; padding:7px 8px; border:0; border-radius:9px; background:transparent; color:var(--lp-text); text-align:left; font:inherit; cursor:pointer; }
  .lp-speaker-option:hover { background:var(--lp-surface-2); }
  .lp-compose .lp-textarea { min-height:34px; max-height:96px; padding:8px 10px; resize:none; border-radius:17px; }
  .lp-compose .lp-button-icon { border-radius:50%; }

  .lp-operation-progress { padding:10px; display:grid; gap:7px; border:1px solid color-mix(in srgb,var(--lp-accent) 35%,var(--lp-border)); border-radius:12px; background:var(--lp-surface); font-size:10px; }
  .lp-indeterminate { display:block; height:4px; overflow:hidden; border-radius:99px; background:color-mix(in srgb,var(--lp-accent) 16%,var(--lp-surface-2)); position:relative; }
  .lp-indeterminate::after { content:""; position:absolute; inset:0 auto 0 -42%; width:42%; border-radius:inherit; background:var(--lp-accent); animation:lp-indeterminate 1.1s ease-in-out infinite; }
  @keyframes lp-indeterminate { to { left:100%; } }
  .lp-npc-draft { display:grid; gap:7px; border-color:color-mix(in srgb,var(--lp-accent) 42%,var(--lp-border)); }
  .lp-draft-actions { display:flex; flex-wrap:wrap; gap:6px; }
  .lp-style-control { padding:9px 2px; display:grid; gap:6px; color:var(--lp-text); font-size:var(--pocket-font-sm); }
  .lp-style-control input { width:100%; accent-color:var(--lp-accent); }
  .lp-range-ends { display:flex; justify-content:space-between; white-space:pre; color:var(--lp-muted); font-size:var(--pocket-font-xs); }

  .lp-notification-group { display:grid; gap:7px; }
  .lp-notification-row { padding:0; display:grid; grid-template-columns:minmax(0,1fr) auto; overflow:hidden; }
  .lp-notification-row[data-read="false"] { border-left:3px solid var(--lp-accent); }
  .lp-notification-row[data-severity="error"] { border-left-color:#ff6a80; }
  .lp-notification-open { appearance:none; min-width:0; padding:11px 8px 11px 12px; border:0; display:flex; text-align:left; background:transparent; color:var(--lp-text); font:inherit; cursor:pointer; }
  .lp-notification-open > span { display:grid; gap:2px; }
  .lp-notification-open strong,.lp-notification-open span { overflow-wrap:anywhere; }
  .lp-notification-dismiss { appearance:none; width:38px; border:0; background:transparent; color:var(--lp-muted); font-size:20px; cursor:pointer; }
  .lp-notification-empty { margin:36px 12px; color:var(--lp-muted); font-size:10px; line-height:1.5; text-align:center; }
  .lp-floating-notification { appearance:none; position:absolute; z-index:45; top:39px; left:10px; right:10px; min-height:54px; padding:8px 10px; border:1px solid color-mix(in srgb,var(--lp-accent) 35%,var(--lp-border)); border-radius:15px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:8px; background:color-mix(in srgb,var(--lp-surface) 94%,transparent); color:var(--lp-text); backdrop-filter:blur(22px); box-shadow:0 14px 36px rgba(0,0,0,.28); text-align:left; cursor:pointer; }
  .lp-floating-notification > span:first-child svg { width:20px; height:20px; }
  .lp-floating-notification > .lp-grow { display:grid; gap:2px; }
  .lp-floating-notification > .lp-grow span { color:var(--lp-muted); font-size:9px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-generation-effective,.lp-generation-run { padding:8px 9px; border:1px solid var(--lp-border); border-radius:10px; display:grid; gap:2px; }
  .lp-model-combobox { min-height:40px; }
  .lp-context-preview { border-top:1px solid var(--lp-border); padding-top:8px; }
  .lp-context-stats { display:grid; gap:6px; margin:8px 0; }
  .lp-context-exact { max-height:220px; overflow:auto; white-space:pre-wrap; word-break:break-word; padding:9px; border-radius:9px; background:color-mix(in srgb,var(--lp-bg) 75%,black); font:8px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace; }
  .lp-generation-history { display:grid; gap:5px; }
  .lp-generation-run[data-status="failed"] { border-color:color-mix(in srgb,#ff6a80 42%,var(--lp-border)); }

  .lp-contact-list,.lp-contact-checklist,.lp-contact-source-section,.lp-contact-import { display:grid; gap:7px; }
  .lp-contact-row { width:100%; display:flex; align-items:center; gap:10px; text-align:left; }
  .lp-contact-row .lp-avatar { background:linear-gradient(145deg,color-mix(in srgb,var(--contact-accent,var(--lp-accent)) 82%,white),var(--contact-accent,var(--lp-accent))); }
  .lp-presence { width:9px; height:9px; flex:0 0 9px; border:2px solid var(--lp-surface); border-radius:50%; background:#43d67f; box-shadow:0 0 0 1px color-mix(in srgb,#43d67f 45%,transparent); }
  .lp-presence-away { background:var(--lp-muted); box-shadow:none; opacity:.42; }
  .lp-contact-detail { display:grid; justify-items:center; gap:9px; text-align:center; }
  .lp-contact-detail .lp-avatar { width:72px; height:72px; font-size:24px; }
  .lp-contact-checklist .lp-card span { display:grid; gap:2px; }

  .lp-gallery-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:3px; }
  .lp-gallery-item { appearance:none; aspect-ratio:1; padding:0; border:0; background:var(--lp-surface); cursor:pointer; overflow:hidden; position:relative; }
  .lp-gallery-item img { width:100%; height:100%; object-fit:cover; transition:transform .25s ease; }
  .lp-gallery-item:hover img { transform:scale(1.04); }
  .lp-gallery-meta { position:absolute; left:0; right:0; bottom:0; padding:14px 5px 4px; background:linear-gradient(transparent,rgba(0,0,0,.68)); color:white; font-size:7px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; }
  .lp-gallery-item[data-missing="true"] { display:grid; place-items:center; border:1px dashed var(--lp-border); }
  .lp-gallery-missing { padding:8px; color:var(--lp-muted); font-size:9px; line-height:1.35; }
  .lp-camera { min-height:100%; background:#050505; color:#fff; display:grid; grid-template-rows:auto minmax(0,1fr) auto; }
  .lp-camera .lp-nav { background:rgba(4,4,4,.82); border-color:rgba(255,255,255,.1); color:#fff; }
  .lp-viewfinder { min-height:0; margin:0 10px; border-radius:20px; overflow:hidden; position:relative; display:grid; place-items:center; background:radial-gradient(circle at 50% 42%,#2c2a31,#0b0b0d 62%); border:1px solid rgba(255,255,255,.1); }
  .lp-viewfinder::before,.lp-viewfinder::after { content:""; position:absolute; background:rgba(255,255,255,.12); pointer-events:none; }
  .lp-viewfinder::before { left:33.33%; top:0; bottom:0; width:1px; box-shadow:calc(33.33vw - 8px) 0 rgba(255,255,255,.12); }
  .lp-viewfinder::after { top:33.33%; left:0; right:0; height:1px; box-shadow:0 calc(33.33vh - 70px) rgba(255,255,255,.12); }
  .lp-viewfinder img { width:100%; height:100%; object-fit:contain; position:relative; z-index:2; background:#050505; }
  .lp-camera-placeholder { max-width:240px; padding:22px; text-align:center; color:rgba(255,255,255,.65); font-size:10px; line-height:1.5; position:relative; z-index:3; }
  .lp-camera-placeholder svg { width:44px; height:44px; margin-bottom:8px; }
  .lp-camera-controls { padding:10px 12px 14px; display:grid; gap:8px; background:#050505; }
  .lp-shutter-row { display:grid; grid-template-columns:1fr 66px 1fr; align-items:center; }
  .lp-shutter { appearance:none; width:58px; height:58px; padding:5px; border:3px solid #fff; border-radius:50%; background:transparent; cursor:pointer; justify-self:center; }
  .lp-shutter::after { content:""; display:block; width:100%; height:100%; border-radius:50%; background:#fff; transition:transform .12s ease; }
  .lp-shutter:active::after { transform:scale(.84); }
  .lp-shutter:disabled { opacity:.45; cursor:not-allowed; }
  .lp-shutter:disabled::after { animation:lp-pulse 1s ease-in-out infinite; }
  @keyframes lp-pulse { 50%{transform:scale(.72);opacity:.65} }
  @keyframes lp-typing { 0%,60%,100%{transform:translateY(0);opacity:.38} 30%{transform:translateY(-3px);opacity:1} }
  .lp-camera-progress { color:rgba(255,255,255,.65); font-size:9px; text-align:center; min-height:14px; }

  .lp-note-card[data-pinned="true"] { border-color:color-mix(in srgb,#ffd653 45%,var(--lp-border)); background:color-mix(in srgb,#ffd653 8%,var(--lp-surface)); }
  .lp-note-preview { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; white-space:pre-wrap; }
  .lp-weather-hero { min-height:210px; padding:24px 18px; border-radius:22px; color:#fff; background:linear-gradient(155deg,#4eabf2,#5264c9 58%,#302b72); display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 20px 42px rgba(47,70,151,.28); }
  .lp-weather-temp { font-size:64px; line-height:1; font-weight:240; letter-spacing:-.06em; }
  .lp-weather-condition { font-size:14px; font-weight:720; }
  .lp-weather-range { opacity:.75; font-size:10px; }
  .lp-timeline { position:relative; display:grid; gap:10px; }
  .lp-timeline::before { content:""; position:absolute; left:14px; top:8px; bottom:8px; width:2px; border-radius:99px; background:var(--lp-border); }
  .lp-event { position:relative; padding-left:34px; }
  .lp-event-dot { position:absolute; left:8px; top:15px; width:14px; height:14px; border:3px solid var(--lp-bg); border-radius:50%; background:var(--event-color,var(--lp-accent)); box-shadow:0 0 0 1px var(--lp-border); z-index:2; }
  .lp-event[data-completed="true"] { opacity:.52; }
  .lp-event[data-completed="true"] .lp-title { text-decoration:line-through; }
  .lp-tracker-value { font-size:24px; font-weight:720; letter-spacing:-.035em; }
  .lp-progress { height:7px; overflow:hidden; border-radius:99px; background:var(--lp-surface-2); }
  .lp-progress span { display:block; height:100%; width:var(--progress,0%); border-radius:inherit; background:var(--tracker-color,var(--lp-accent)); transition:width .5s ease; }
  .lp-rate { color:var(--lp-muted); font-size:8px; }
  .lp-toggle { appearance:none; width:40px; height:23px; border:0; border-radius:99px; padding:2px; background:var(--lp-surface-2); cursor:pointer; transition:background .2s ease; }
  .lp-toggle::after { content:""; display:block; width:19px; height:19px; border-radius:50%; background:#fff; box-shadow:0 2px 7px rgba(0,0,0,.28); transition:transform .2s ease; }
  .lp-toggle[aria-pressed="true"] { background:var(--lp-accent); }
  .lp-toggle[aria-pressed="true"]::after { transform:translateX(17px); }
  .lp-color-input { width:42px; height:31px; padding:2px; border:1px solid var(--lp-border); border-radius:9px; background:var(--lp-surface); cursor:pointer; }
  .lp-theme-dot { width:30px; height:30px; border-radius:50%; border:2px solid transparent; box-shadow:0 0 0 1px var(--lp-border); cursor:pointer; }
  .lp-theme-dot[aria-pressed="true"] { border-color:var(--lp-bg); box-shadow:0 0 0 2px var(--lp-accent); }
  .lp-settings-section { display:grid; gap:9px; }
  .lp-color-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 12px; }
  .lp-color-grid > .lp-row-between { min-height:36px; padding:4px 7px; border:1px solid var(--lp-border); border-radius:10px; }
  .lp-slider-setting { display:grid; gap:6px; padding:6px 0; }
  .lp-slider-setting input[type="range"] { width:100%; accent-color:var(--lp-accent); }
  .lp-permission-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; }
  .lp-permission { padding:8px; border:1px solid var(--lp-border); border-radius:10px; color:var(--lp-muted); font-size:9px; }
  .lp-permission[data-granted="true"] { color:var(--lp-text); border-color:color-mix(in srgb,#43d17e 34%,var(--lp-border)); }
  .lp-permission::before { content:"○"; margin-right:5px; }
  .lp-permission[data-granted="true"]::before { content:"●"; color:#43d17e; }
  .lp-alert { margin:8px 12px 0; padding:9px 10px; border:1px solid color-mix(in srgb,#ff6a80 42%,var(--lp-border)); border-radius:12px; background:color-mix(in srgb,#ff6a80 10%,var(--lp-surface)); color:var(--lp-text); font-size:9px; line-height:1.4; position:absolute; left:0; right:0; top:34px; z-index:40; box-shadow:0 12px 30px rgba(0,0,0,.22); }
  .lp-alert[hidden] { display:none; }
  .lp-alert[data-severity="success"] { border-color:color-mix(in srgb,#55d69a 42%,var(--lp-border)); background:color-mix(in srgb,#55d69a 13%,var(--lp-surface)); }

  .lumiphone-drawer { min-height:100%; padding:18px; color:var(--lumiverse-text,inherit); display:grid; place-items:center; }
  .lumiphone-drawer-card { width:min(100%,500px); padding:22px; border:1px solid var(--lumiverse-border,rgba(127,127,127,.25)); border-radius:20px; background:var(--lumiverse-fill-subtle,rgba(127,127,127,.08)); text-align:center; display:grid; justify-items:center; gap:12px; }
  .lumiphone-drawer-icon { width:62px; height:62px; border-radius:20px; display:grid; place-items:center; color:white; background:linear-gradient(145deg,#9a8cff,#5746ce); box-shadow:0 16px 36px rgba(73,53,168,.3); }
  .lumiphone-drawer-icon svg { width:31px; height:31px; }
  .lumiphone-drawer-title { margin:0; font-size:20px; font-weight:780; }
  .lumiphone-drawer-copy { margin:0; max-width:390px; color:var(--lumiverse-text-muted,currentColor); font-size:12px; line-height:1.55; }
  .lumiphone-drawer-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; }
  .lumiphone-drawer-button { appearance:none; min-height:36px; padding:8px 13px; border:1px solid var(--lumiverse-border,rgba(127,127,127,.3)); border-radius:11px; background:var(--lumiverse-fill,rgba(127,127,127,.14)); color:inherit; font:inherit; font-size:11px; font-weight:720; cursor:pointer; }
  .lumiphone-drawer-button[data-primary="true"] { border-color:transparent; background:var(--lumiverse-primary,#7866e8); color:white; }

  @media (max-width: 720px) {
    .lumiphone-shell { border:0; border-radius:0; box-shadow:none; aspect-ratio:auto; }
    .lp-app-grid { gap:20px 8px; }
    .lp-app-icon-box { width:58px; height:58px; border-radius:17px; }
    .lp-gallery-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
  }
  .lumiphone-widget-root[data-fullscreen="true"] { width:100%; height:var(--lp-visual-height,100%); max-width:none; overflow:hidden; contain:layout paint; }
  .lumiphone-widget-root[data-fullscreen="true"] .lumiphone-shell { border:0; border-radius:0; box-shadow:none; aspect-ratio:auto; grid-template-rows:calc(34px + env(safe-area-inset-top)) minmax(0,1fr) calc(24px + env(safe-area-inset-bottom)); }
  .lumiphone-widget-root[data-fullscreen="true"] .lumiphone-statusbar { height:calc(34px + env(safe-area-inset-top)); padding-top:calc(5px + env(safe-area-inset-top)); }
  .lumiphone-widget-root[data-fullscreen="true"] .lumiphone-homebar { padding-bottom:env(safe-area-inset-bottom); }
  .lumiphone-widget-root[data-fullscreen="true"] .lp-compose { padding-bottom:max(8px,env(safe-area-inset-bottom)); }
  @media (max-width: 360px) {
    .lp-app-icon-box { width:50px; height:50px; border-radius:15px; }
    .lp-fields { grid-template-columns:1fr; }
    .lp-home { padding-inline:12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .lumiphone-app-view, .lumiphone-launcher, .lp-app-icon-box, .lp-gallery-item img, .lp-progress span, .lp-typing-dots i { animation:none !important; transition:none !important; }
  }
  .lumiphone-shell[data-reduced-motion="true"] *, .lumiphone-shell[data-reduced-motion="true"] *::before, .lumiphone-shell[data-reduced-motion="true"] *::after { animation-duration:0ms !important; transition-duration:0ms !important; }
  .lp-gallery-item[data-selected="true"] { outline:3px solid var(--lp-accent); outline-offset:2px; }
  .lp-bubble[data-selected="true"] { outline:3px solid color-mix(in srgb,var(--lp-accent) 62%,white); outline-offset:2px; }

  .pocket-receipt-host { display:block; margin:8px 0 2px; max-width:min(100%,420px); }
  .pocket-receipt {
    appearance:none; width:100%; min-height:48px; padding:8px 10px; border:1px solid color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 32%,transparent);
    border-radius:13px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:9px;
    background:color-mix(in srgb,var(--lumiverse-fill,#17151d) 92%,var(--lumiverse-primary,#8b7dff) 8%); color:var(--lumiverse-text,#f7f5ff);
    font:inherit; text-align:left; cursor:pointer; box-shadow:0 8px 22px rgba(0,0,0,.12); transition:transform .15s ease,border-color .15s ease;
  }
  .pocket-receipt:hover { transform:translateY(-1px); border-color:color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 68%,transparent); }
  .pocket-receipt:focus-visible { outline:3px solid color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 55%,white); outline-offset:2px; }
  .pocket-receipt-kind { padding:4px 7px; border-radius:8px; background:color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 18%,transparent); font-size:10px; font-weight:800; }
  .pocket-receipt-copy { min-width:0; display:grid; gap:1px; }
  .pocket-receipt-copy strong,.pocket-receipt-copy span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pocket-receipt-copy strong { font-size:12px; }
  .pocket-receipt-copy span { opacity:.68; font-size:10px; }
  .pocket-receipt-arrow { font-size:22px; opacity:.7; }
  .lp-tracker-filters { display:flex; gap:6px; overflow:auto; padding-bottom:2px; scrollbar-width:none; }
  .lp-tracker-card { display:grid; gap:9px; border-left:3px solid color-mix(in srgb,var(--lp-accent) 68%,transparent); }
  .lp-tracker-card[role="button"]:focus-visible { outline:3px solid color-mix(in srgb,var(--lp-accent) 52%,white); outline-offset:2px; }
  .lp-tracker-relationship { background:linear-gradient(135deg,color-mix(in srgb,#ec7eb5 12%,var(--lp-surface)),var(--lp-surface)); }
  .lp-tracker-vitals { border-left-color:#ef6b73; }
  .lp-tracker-counter .lp-tracker-value { padding:5px 9px; border-radius:10px; background:color-mix(in srgb,var(--lp-accent) 16%,transparent); }
  .lp-tracker-timer { border-left-color:#62b8e8; }
  .lp-tracker-state { border-left-color:#d59c50; }
  .lp-tracker-compact { padding-block:9px; }
  .lp-progress-segmented { background:repeating-linear-gradient(90deg,var(--lp-surface-2) 0 calc(10% - 2px),transparent calc(10% - 2px) 10%); }
  .lp-tracker-meta { display:flex; align-items:center; justify-content:space-between; gap:8px; color:var(--lp-muted); font-size:9px; font-weight:720; text-transform:capitalize; }
  .lp-tracker-policy { display:grid; gap:5px; }
  .lp-warning { margin:0; color:#f3bd65; font-size:10px; line-height:1.4; }
  .lp-tracker-operations { display:grid; gap:9px; }
  .lp-tracker-operation-row { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }
  .lp-tracker-history { display:grid; gap:7px; }
  .lp-history-row { display:grid; gap:3px; }
  .lp-history-row time { overflow-wrap:anywhere; }
  .lp-tracker-config-fields { display:grid; gap:9px; }

  /* Density primitives. These participate in layout; Pocket never transform-scales its fullscreen surface. */
  .lumiphone-shell .lp-content { padding:calc(12px * var(--pocket-ui-scale)); gap:var(--pocket-gap); }
  .lumiphone-shell .lp-card { padding:calc(12px * var(--pocket-ui-scale)); border-radius:calc(17px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-title { font-size:var(--pocket-font-md); }
  .lumiphone-shell .lp-copy { font-size:var(--pocket-font-sm); }
  .lumiphone-shell .lp-eyebrow { font-size:var(--pocket-font-xs); }
  .lumiphone-shell .lp-button { min-height:calc(34px * var(--pocket-ui-scale)); padding:calc(7px * var(--pocket-ui-scale)) calc(11px * var(--pocket-ui-scale)); font-size:var(--pocket-font-sm); }
  .lumiphone-shell .lp-button-icon { width:calc(34px * var(--pocket-ui-scale)); padding:calc(6px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-input,.lumiphone-shell .lp-textarea,.lumiphone-shell .lp-select { min-height:var(--pocket-control-h); padding:calc(9px * var(--pocket-ui-scale)) calc(10px * var(--pocket-ui-scale)); font-size:calc(11px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-label { gap:calc(5px * var(--pocket-ui-scale)); font-size:calc(9px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-nav { min-height:calc(48px * var(--pocket-ui-scale)); padding:calc(7px * var(--pocket-ui-scale)) calc(12px * var(--pocket-ui-scale)); grid-template-columns:calc(74px * var(--pocket-ui-scale)) minmax(0,1fr) calc(74px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-nav-title { font-size:calc(14px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-nav-subtitle { font-size:calc(9px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-nav-action { min-height:calc(30px * var(--pocket-ui-scale)); font-size:calc(11px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-app-grid { gap:calc(18px * var(--pocket-ui-scale)) calc(10px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-app-icon-box { width:var(--pocket-icon); height:var(--pocket-icon); border-radius:calc(16px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-app-icon-box svg { width:calc(27px * var(--pocket-ui-scale)); height:calc(27px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-app-label { font-size:var(--pocket-font-sm); }
  .lumiphone-shell .lp-avatar { width:calc(42px * var(--pocket-ui-scale)); height:calc(42px * var(--pocket-ui-scale)); flex-basis:calc(42px * var(--pocket-ui-scale)); font-size:calc(15px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-bubbles { padding:calc(14px * var(--pocket-ui-scale)) calc(12px * var(--pocket-ui-scale)); gap:calc(7px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-bubble { padding:calc(8px * var(--pocket-ui-scale)) calc(10px * var(--pocket-ui-scale)); border-radius:calc(16px * var(--pocket-ui-scale)); font-size:calc(11px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-compose { padding:calc(8px * var(--pocket-ui-scale)) calc(9px * var(--pocket-ui-scale)) calc(10px * var(--pocket-ui-scale)); gap:calc(6px * var(--pocket-ui-scale)); grid-template-columns:auto minmax(0,1fr) auto; }
  .lumiphone-shell .lp-compose .lp-textarea { min-height:calc(34px * var(--pocket-ui-scale)); max-height:calc(112px * var(--pocket-ui-scale)); border-radius:calc(17px * var(--pocket-ui-scale)); }
  .lp-conversation-status { align-self:center; max-width:92%; margin:5px 0; padding:6px 11px; border-top:1px solid var(--lp-border); border-bottom:1px solid var(--lp-border); color:var(--lp-muted); font-size:var(--pocket-font-sm); text-align:center; }
  .lp-handoff-activity { align-self:stretch; margin:7px 0; border:1px solid color-mix(in srgb,var(--lp-accent) 28%,var(--lp-border)); border-radius:14px; background:color-mix(in srgb,var(--lp-surface) 92%,transparent); box-shadow:0 6px 20px rgba(0,0,0,.10); overflow:hidden; }
  .lp-handoff-primary { min-height:52px; padding:9px 10px; display:flex; align-items:center; gap:9px; }
  .lp-handoff-primary .lp-grow { display:grid; gap:2px; min-width:0; }
  .lp-handoff-mark { width:22px; height:22px; flex:0 0 22px; display:grid; place-items:center; border-radius:50%; background:color-mix(in srgb,var(--lp-accent) 15%,transparent); color:var(--lp-accent); font-size:11px; font-weight:900; }
  .lp-handoff-activity[data-state="preparing"] .lp-handoff-mark::after,.lp-handoff-activity[data-state="accepted"] .lp-handoff-mark::after,.lp-handoff-activity[data-state="generating"] .lp-handoff-mark::after { content:""; width:9px; height:9px; border:2px solid color-mix(in srgb,var(--lp-accent) 25%,transparent); border-top-color:var(--lp-accent); border-radius:50%; animation:lp-handoff-spin .9s linear infinite; }
  .lp-handoff-activity[data-state="generating"] { border-color:color-mix(in srgb,var(--lp-accent) 58%,var(--lp-border)); animation:lp-handoff-glow 1.8s ease-in-out infinite; }
  .lp-handoff-activity[data-state="completed"] { box-shadow:none; }
  .lp-handoff-activity[data-state="failed"] { border-color:color-mix(in srgb,#ff6f87 58%,var(--lp-border)); }
  .lp-handoff-activity[data-state="failed"] .lp-handoff-mark { background:color-mix(in srgb,#ff6f87 15%,transparent); color:#ff6f87; }
  .lp-handoff-action { appearance:none; min-height:27px; padding:5px 8px; border:1px solid var(--lp-border); border-radius:9px; background:transparent; color:var(--lp-accent); font:inherit; font-size:var(--pocket-font-xs); font-weight:750; cursor:pointer; }
  .lp-handoff-more { border-top:1px solid var(--lp-border); color:var(--lp-muted); font-size:var(--pocket-font-xs); }
  .lp-handoff-more > summary { padding:5px 10px; cursor:pointer; text-align:right; list-style:none; }
  .lp-handoff-more > summary::-webkit-details-marker { display:none; }
  .lp-handoff-secondary { padding:0 10px 10px; display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .lp-handoff-diagnostics { grid-column:1/-1; padding-top:6px; display:grid; gap:3px; border-top:1px solid var(--lp-border); }
  .lp-handoff-diagnostics > span { overflow-wrap:anywhere; }
  @keyframes lp-handoff-spin { to { transform:rotate(360deg); } }
  @keyframes lp-handoff-glow { 50% { box-shadow:0 7px 24px color-mix(in srgb,var(--lp-accent) 20%,transparent); } }
  .lumiphone-shell[data-reduced-motion="true"] .lp-handoff-activity,.lumiphone-shell[data-reduced-motion="true"] .lp-handoff-mark::after,.lumiphone-shell[data-reduced-motion="true"] .lp-reference-mark { animation:none !important; }
  .lp-channel-diagnostic { grid-column:1/-1; color:var(--lp-muted); font-size:var(--pocket-font-xs); }
  .lp-channel-diagnostic summary { cursor:pointer; text-align:center; }
  .lp-channel-diagnostic > span { display:block; margin-top:4px; overflow-wrap:anywhere; text-align:center; }
  .lp-code-block { max-height:220px; margin:8px 0 0; padding:10px; overflow:auto; border-radius:10px; background:rgba(0,0,0,.22); color:var(--lp-text); font:var(--pocket-font-xs)/1.45 ui-monospace,SFMono-Regular,Consolas,monospace; white-space:pre-wrap; overflow-wrap:anywhere; text-align:left; }
  .lp-manual-reply { color:var(--lp-muted); background:transparent; }
  .lp-bubble-action { appearance:none; margin:5px 0 0 7px; padding:0; border:0; background:transparent; color:inherit; opacity:.58; font:inherit; font-size:var(--pocket-font-xs); cursor:pointer; }
  .lp-bubble-action:hover { opacity:1; text-decoration:underline; }
  .lp-scene-note { margin:0; padding:7px 9px; border-radius:9px; background:color-mix(in srgb,var(--lp-accent) 10%,transparent); color:var(--lp-muted); font-size:var(--pocket-font-sm); }
  .lp-settings-category { width:100%; display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:10px; color:var(--lp-text); text-align:left; cursor:pointer; }
  .lp-settings-category > span:first-child { display:grid; gap:2px; }
  .lp-settings-chevron { color:var(--lp-muted); font-size:22px; }
  .lp-code-input { min-height:150px; font-family:ui-monospace,SFMono-Regular,Consolas,monospace; white-space:pre; }
  .lp-swarm-diagnostics { display:grid; gap:6px; }
  .lp-swarm-diagnostics summary { cursor:pointer; color:var(--lp-muted); font-size:var(--pocket-font-sm); }
  .lp-gallery-actions { margin-top:12px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  .lp-gallery-actions .lp-select { grid-column:1 / -1; }
  .lp-wallpaper-control { display:grid; gap:9px; padding:10px 0; border-top:1px solid var(--lp-border); }
  .lp-wallpaper-control:first-of-type { border-top:0; }
  .lp-wallpaper-preview { min-height:120px; display:grid; place-items:center; border:1px solid var(--lp-border); border-radius:14px; background-color:var(--lp-bg); background-repeat:no-repeat; color:var(--lp-muted); font-size:var(--pocket-font-sm); overflow:hidden; }
  .lp-wallpaper-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
  .lp-wallpaper-focal { display:grid; gap:6px; }
  .lp-wallpaper-range { display:grid; grid-template-columns:minmax(100px,auto) 1fr; align-items:center; gap:8px; }
  .lp-wallpaper-range input { width:100%; accent-color:var(--lp-accent); }
  .pocket-composer-reference {
    --pocket-reference-accent:var(--lumiverse-primary,#8b7dff); position:fixed; z-index:400; display:flex; align-items:center; gap:3px;
    max-width:calc(100vw - 16px); padding:3px; transform:translateY(calc(-100% - 7px)); border:1px solid color-mix(in srgb,var(--pocket-reference-accent) 38%,var(--lumiverse-border,transparent));
    border-radius:999px; background:color-mix(in srgb,var(--lumiverse-fill,#17151d) 92%,var(--pocket-reference-accent) 8%); color:var(--lumiverse-text,#f7f5ff);
    box-shadow:0 8px 24px rgba(0,0,0,.16); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); font:inherit;
  }
  .pocket-composer-reference[hidden] { display:none; }
  .pocket-composer-reference[data-status="injected"] { border-color:color-mix(in srgb,var(--pocket-reference-accent) 68%,transparent); }
  .pocket-composer-reference[data-status="failed"] { --pocket-reference-accent:#ff6f87; }
  .pocket-composer-reference-open {
    appearance:none; min-width:0; min-height:27px; flex:1; display:grid; grid-template-columns:auto auto minmax(0,1fr); align-items:center; gap:6px;
    padding:2px 5px 2px 3px; border:0; border-radius:999px; background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer;
  }
  .pocket-composer-reference-open:focus-visible,.pocket-composer-reference-clear:focus-visible { outline:2px solid color-mix(in srgb,var(--pocket-reference-accent) 62%,white); outline-offset:1px; }
  .pocket-composer-reference-mark { width:22px; height:22px; display:grid; place-items:center; border-radius:50%; flex:0 0 22px; background:color-mix(in srgb,var(--pocket-reference-accent) 17%,transparent); color:var(--pocket-reference-accent); }
  .pocket-composer-reference-mark svg { width:13px; height:13px; }
  .pocket-composer-reference-source { white-space:nowrap; font-size:10px; font-weight:800; letter-spacing:-.01em; }
  .pocket-composer-reference-preview { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:.7; font-size:10px; }
  .pocket-composer-reference-clear {
    appearance:none; width:25px; height:25px; flex:0 0 25px; display:grid; place-items:center; padding:0; border:0; border-radius:50%;
    background:transparent; color:inherit; opacity:.58; font:inherit; font-size:17px; line-height:1; cursor:pointer;
  }
  .pocket-composer-reference-clear:hover { opacity:1; background:color-mix(in srgb,var(--pocket-reference-accent) 12%,transparent); }
  @media (max-width: 520px) {
    .pocket-composer-reference { gap:1px; }
    .pocket-composer-reference-open { gap:5px; }
    .pocket-composer-reference-source { font-size:9px; }
    .pocket-composer-reference-preview { font-size:9px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pocket-composer-reference,.pocket-composer-reference * { animation:none !important; transition:none !important; }
  }
`
