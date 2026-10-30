export const APP_STORE_STYLES = `
  .lumiphone-shell .lp-store { gap:18px; }
  .lp-store-discovery { display:grid; gap:24px; min-width:0; }
  .lp-store-intro h2 { margin:7px 0 0; font-size:clamp(23px,calc(25px * var(--pocket-ui-scale)),30px); line-height:1.13; letter-spacing:-.04em; font-weight:650; color:var(--lp-text); }
  .lp-store-eyebrow { display:block; font-size:9px; font-weight:650; letter-spacing:.12em; opacity:.7; }
  .lp-store-note { margin:0; font-size:11px; line-height:1.5; color:var(--lp-muted); }
  .lp-store .lp-sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; }
  .lp-store-search { display:flex; align-items:center; gap:9px; width:100%; min-width:0; position:sticky; top:0; z-index:4; border:1px solid var(--lp-border); border-radius:999px; padding:0 14px; background:color-mix(in srgb,var(--lp-surface) 94%,var(--lp-bg)); backdrop-filter:blur(20px); box-shadow:0 3px 14px #0000000a; }
  .lp-store-search-icon { width:19px; height:19px; flex:none; display:grid; place-items:center; color:var(--lp-muted); }
  .lp-store-search-icon svg { display:block; width:100%; height:100%; }
  .lumiphone-shell .lp-store-search input { flex:1; width:100%; min-width:0; min-height:46px; padding:10px 0; border:0; border-radius:0; background:transparent; box-shadow:none; font-size:clamp(12px,calc(13px * var(--pocket-ui-scale)),15px); }
  .lp-store-search:focus-within { border-color:var(--lp-accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--lp-accent) 18%,transparent); }
  .lp-store .lp-store-search input:focus-visible { outline:0; }
  .lp-store-filters { display:flex; flex-wrap:nowrap; gap:6px; overflow-x:auto; scrollbar-width:none; padding:2px; }
  .lp-store-filter { flex:none; border:1px solid var(--lp-border); border-radius:999px; padding:7px 12px; min-height:34px; font:inherit; font-size:11px; color:var(--lp-muted); background:transparent; cursor:pointer; }
  .lp-store-filter[aria-pressed="true"] { color:var(--lp-text); background:var(--lp-surface-2); border-color:var(--lp-accent); }
  .lp-store-collection { min-width:0; display:grid; gap:10px; }
  .lp-store-section-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .lp-store-section-heading h2, .lp-store-catalog-title { margin:0; font-size:clamp(17px,calc(18px * var(--pocket-ui-scale)),22px); font-weight:650; letter-spacing:-.025em; color:var(--lp-text); }
  .lp-store-rail-controls { display:flex; gap:4px; flex:none; }
  .lp-store-rail-control { width:30px; height:30px; border:1px solid var(--lp-border); border-radius:50%; padding:0; background:var(--lp-surface); color:var(--lp-text); font:inherit; font-size:20px; cursor:pointer; }
  .lp-store-rail { min-width:0; width:100%; display:grid; grid-auto-flow:column; grid-auto-columns:min(86%,300px); gap:12px; overflow-x:auto; overflow-y:hidden; scroll-snap-type:x proximity; scroll-padding:4px; overscroll-behavior-x:contain; scrollbar-width:none; padding:4px 4px 10px; border-radius:8px; }
  .lp-store-rail:focus-visible { outline:2px solid var(--lp-accent); outline-offset:2px; }
  .lp-store-rail > * { scroll-snap-align:start; min-width:0; }
  .lp-store-feature { border:1px solid var(--lp-border); border-radius:22px; overflow:hidden; background:var(--lp-surface); }
  .lp-store-banner { position:relative; overflow:hidden; width:100%; aspect-ratio:16/10; background:#434466; }
  .lp-store-banner > svg { display:block; width:100%; height:100%; }
  .lp-store-feature .lp-store-banner::after { content:''; position:absolute; inset:0; background:linear-gradient(transparent 24%,#172137a6); }
  .lp-store-feature-headline { position:absolute; z-index:1; left:14px; right:14px; bottom:14px; color:#fff; text-shadow:0 2px 9px #0003; }
  .lp-store-feature-headline .lp-store-eyebrow { font-size:8px; opacity:.85; }
  .lp-store-feature-headline h3 { margin:6px 0 0; font-size:clamp(20px,calc(22px * var(--pocket-ui-scale)),26px); line-height:1.07; font-weight:650; letter-spacing:-.035em; }
  .lp-store-feature-caption { display:grid; grid-template-columns:34px minmax(0,1fr) auto; align-items:center; gap:9px; min-height:78px; padding:12px; }
  .lp-store-feature-caption .lp-store-app-icon { width:34px; height:34px; border-radius:10px; }
  .lp-store-feature-caption .lp-store-app-icon svg { width:21px; height:21px; }
  .lp-store-feature-caption > div { display:grid; gap:3px; min-width:0; }
  .lp-store-feature-caption h3 { margin:0; color:var(--lp-text); font-size:12px; line-height:1.35; font-weight:650; }
  .lp-store-feature-caption > div > span { color:var(--lp-muted); font-size:10px; line-height:1.4; }
  .lp-store-rail-everyday { grid-auto-columns:min(43%,160px); }
  .lp-store-tile { display:flex; flex-direction:column; align-items:flex-start; text-align:left; gap:9px; padding:14px; min-height:186px; border:1px solid var(--lp-border); border-radius:20px; color:var(--lp-text); background:color-mix(in srgb,var(--lp-text) 4%,var(--lp-bg)); cursor:pointer; font:inherit; }
  .lp-store-tile strong { font-size:13px; font-weight:650; }
  .lp-store-tile-tagline { font-size:11px; line-height:1.4; color:var(--lp-muted); }
  .lp-store-tile-action { margin-top:auto; font-size:11px; font-weight:650; color:var(--lp-accent); }
  .lp-store-tile:hover, .lp-store-feature:focus-within { border-color:color-mix(in srgb,var(--lp-accent) 60%,var(--lp-border)); }
  .lp-store-list { display:grid; gap:4px; }
  .lp-store-app { display:grid; grid-template-columns:44px minmax(0,1fr) auto; gap:10px; align-items:center; padding:15px 0; border-bottom:1px solid var(--lp-border); }
  .lp-store-app[data-highlighted="true"] { outline:1px solid var(--lp-accent); outline-offset:4px; border-radius:12px; }
  .lp-store-app-icon { display:grid; place-items:center; width:44px; height:44px; border-radius:13px; color:#fff; box-shadow:inset 0 1px #ffffff40; }
  .lp-store-app-icon > span { width:100%; height:100%; display:grid; place-items:center; }
  .lp-store-app-icon svg { display:block; width:25px; height:25px; }
  .lp-store-copy { min-width:0; }
  .lp-store-copy h3 { margin:0 0 3px; font-size:13px; line-height:1.35; font-weight:650; color:var(--lp-text); }
  .lp-store-tagline { font-size:10px; line-height:1.4; color:var(--lp-muted); }
  .lp-store-copy p { margin:5px 0 0; font-size:10px; line-height:1.5; color:var(--lp-muted); overflow-wrap:anywhere; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .lp-store-actions { display:grid; justify-items:center; gap:4px; }
  .lp-store-get { min-width:56px; min-height:34px; border:1px solid color-mix(in srgb,var(--lp-accent) 35%,var(--lp-border)); border-radius:18px; background:color-mix(in srgb,var(--lp-accent) 14%,var(--lp-surface)); color:var(--lp-text); padding:6px 12px; font:inherit; font-size:11px; font-weight:650; cursor:pointer; }
  .lp-store-remove { appearance:none; border:0; background:transparent; color:var(--lp-muted); font:inherit; font-size:9px; min-height:28px; padding:4px 7px; cursor:pointer; }
  .lp-store-system { font-size:8px; color:var(--lp-muted); padding:6px 0; }
  .lp-store :is(button,input):focus-visible { outline:2px solid var(--lp-accent); outline-offset:3px; }
  .lp-store button:disabled { opacity:.5; cursor:default; }
  .lp-store [hidden] { display:none !important; }
  .lp-store-error { border:1px solid #f1859a60; border-radius:12px; padding:12px; color:var(--lp-text); background:#8d294022; font-size:12px; }
  .lp-store-soon { display:grid; gap:8px; padding:16px; border:1px solid var(--lp-border); border-radius:18px; background:var(--lp-surface); }
  .lp-store-soon .lp-store-banner { aspect-ratio:16/7; border-radius:12px; margin-bottom:5px; }
  .lp-store-soon strong { font-size:17px; font-weight:600; }
  .lp-store-soon p { margin:0; color:var(--lp-muted); font-size:11px; line-height:1.5; }
  .lp-store-coming { color:var(--lp-muted); font-size:10px; }
  .lp-launcher .lp-icon-appstore { background:linear-gradient(145deg,#89c9f4,#507cce); }
  @media (pointer:coarse) { .lp-store :is(.lp-store-get,.lp-store-remove,.lp-store-filter) { min-height:44px; } .lp-store-rail-control { width:44px; height:44px; } }
`
