export const LAUNCHER_STYLES = `
  .lumiphone-shell .lp-launcher { --lp-launcher-row:max(74px,calc(clamp(44px,calc(54px * var(--pocket-ui-scale)),64px) + 14px + clamp(10px,calc(11px * var(--pocket-ui-scale)),13px) * 1.4)); --lp-launcher-row-gap:22px; gap:18px; padding:10px 18px 14px; overflow:hidden; }
  .lp-launcher-body { flex:1; min-height:0; display:flex; flex-direction:column; gap:18px; overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain; scrollbar-width:thin; padding:6px; margin:-6px; }
  .lp-launcher-body > * { flex-shrink:0; }
  .lp-launcher-toolbar { display:flex; align-items:center; gap:6px; flex:none; position:sticky; top:0; z-index:3; }
  .lp-launcher-toolbar > :first-child { margin-right:auto; }
  .lp-launcher-action { appearance:none; min-height:32px; padding:6px 10px; border:0; border-radius:8px; background:transparent; color:#fff; font-family:inherit; font-size:12px; font-weight:600; line-height:1.3; cursor:pointer; }
  .lp-launcher .lp-sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; }
  .lp-launcher-toolbar .lp-launcher-action { font-size:12px; font-weight:600; }
  .lp-launcher-toolbar { border-radius:10px; background:#151b2b80; backdrop-filter:blur(18px); }
  .lp-launcher-action:hover:not(:disabled) { background:#ffffff12; }
  .lp-launcher-action:disabled { opacity:.45; cursor:default; }
  .lp-launcher :is(button,input):focus-visible { outline:2px solid #fff; outline-offset:4px; }
  .lumiphone-shell .lp-launcher .lp-home-head { padding:10px 2px 14px; flex-wrap:wrap; gap:16px; }
  .lumiphone-shell .lp-launcher .lp-home-clock { font-size:clamp(36px,calc(46px * var(--pocket-ui-scale)),58px); font-weight:300; letter-spacing:-.055em; }
  .lp-launcher .lp-home-date { margin-bottom:7px; font-weight:500; }
  .lp-launcher .lp-home-weather { min-height:44px; max-width:100%; cursor:pointer; }
  .lumiphone-shell .lp-launcher .lp-app-grid { gap:var(--lp-launcher-row-gap) 8px; grid-auto-rows:minmax(var(--lp-launcher-row),auto); flex:none; }
  .lp-launcher .lp-app-grid > .lp-app-icon { align-self:start; align-content:start; height:var(--lp-launcher-row); }
  .lumiphone-shell .lp-launcher .lp-app-icon { gap:8px; min-height:74px; border-radius:16px; padding:3px 0; }
  .lumiphone-shell .lp-launcher .lp-app-icon-box { width:min(100%,clamp(44px,calc(54px * var(--pocket-ui-scale)),64px)); height:auto; aspect-ratio:1; border-radius:26%; color:#fff; box-shadow:0 5px 12px #0003,inset 0 1px 1px #ffffff50; }
  .lp-launcher .lp-app-icon-box > [aria-hidden="true"] { display:grid; place-items:center; width:100%; height:100%; }
  .lumiphone-shell .lp-launcher .lp-app-icon-box svg { display:block; width:54%; height:54%; stroke-width:1.8; }
  .lumiphone-shell .lp-launcher .lp-app-label { font-size:clamp(10px,calc(11px * var(--pocket-ui-scale)),13px); line-height:1.4; text-shadow:0 1px 5px #000b; text-align:center; max-width:100%; overflow-wrap:anywhere; }
  .lp-launcher .lp-app-icon[aria-pressed="true"] { outline:2px solid #fff; outline-offset:4px; background:#ffffff14; }
  .lp-launcher [hidden] { display:none !important; }
  .lp-launcher-footer { margin-top:auto; padding-top:8px; flex:none; }
  .lp-launcher-pages { display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:0; padding-bottom:4px; }
  .lp-launcher-page-dot { display:grid; place-items:center; padding:0; width:28px; }
  .lp-launcher-page-dot > span { width:5px; height:5px; border-radius:5px; background:#ffffff60; }
  .lp-launcher-page-dot[aria-current="page"] > span { width:14px; background:#fff; }
  .lp-launcher-page-add { font-size:20px; padding:0; width:28px; }
  .lp-launcher-edit-tools { display:flex; flex-wrap:wrap; gap:4px; }
  .lp-launcher-edit-tools > button { font-size:11px; color:#ffffffbc; }
  .lp-launcher-folder-heading { display:flex; gap:8px; align-items:center; justify-content:space-between; }
  .lp-launcher-folder-heading h2 { min-width:0; overflow-wrap:anywhere; }
  .lp-launcher .lp-launcher-folder { background:#ffffff26; border:1px solid #ffffff30; box-shadow:0 4px 12px #0002; }
  .lp-launcher .lp-launcher-folder > .lp-launcher-folder-preview { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:repeat(2,minmax(0,1fr)); gap:4px; padding:7px; }
  .lumiphone-shell .lp-launcher .lp-launcher-folder-preview .lp-app-icon-box { width:100%; border-radius:5px; box-shadow:none; }
  .lp-launcher-location input { width:100%; min-width:0; min-height:34px; padding:5px 8px; border:1px solid #ffffff25; border-radius:8px; background:#232b3c; color:#fff; font:inherit; font-size:12px; }
  .lp-launcher-widget { grid-column:span 2; min-width:0; position:relative; }
  .lp-launcher-widget[data-size="wide"] { grid-column:1/-1; }
  .lp-launcher-widget[data-system-widget="clock"], .lp-launcher-widget[data-weather-variant="stripe"] { height:var(--lp-launcher-row); align-self:start; }
  .lp-launcher-widget[data-weather-variant="card"] { grid-row:span 2; height:calc(var(--lp-launcher-row) * 2 + var(--lp-launcher-row-gap)); align-self:start; }
  .lumiphone-shell .lp-launcher-widget > .lp-tracker-card { height:100%; width:100%; margin:0; padding:12px; border-radius:18px; }
  .lp-launcher-widget .lp-tracker-top { flex-wrap:wrap; gap:4px; }
  .lp-launcher-widget[data-size="compact"] .lp-tracker-update { display:none; }
  .lp-launcher-widget .lp-tracker-readout { overflow-wrap:anywhere; }
  .lp-launcher-widget .lp-tracker-reading { min-width:0; }
  .lp-launcher-weather-card { height:100%; padding:14px; border:1px solid #ffffff25; border-radius:18px; background:linear-gradient(145deg,#305e87,#20394f); color:#fff; display:grid; align-content:start; gap:6px; }
  .lp-launcher-weather-card h3, .lp-launcher-clock-card h3 { margin:0; font-family:inherit; font-size:12px; line-height:1.4; font-weight:600; }
  .lp-launcher-weather-card p { margin:0; font-size:12px; line-height:1.4; overflow-wrap:anywhere; }
  .lp-launcher-weather-location, .lp-launcher-weather-range { opacity:.75; }
  .lp-launcher-weather-reading { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; }
  .lp-launcher-weather-temp { font-size:clamp(24px,calc(28px * var(--pocket-ui-scale)),36px); font-weight:400; line-height:1.2; }
  .lp-launcher-weather-card .lp-weather-glyph { width:36px; height:36px; flex:none; color:#ffe6b2; }
  .lp-launcher-weather-card[data-variant="card"] { align-content:space-between; }
  .lp-launcher-weather-card[data-variant="stripe"] { padding:10px; container-type:inline-size; }
  .lp-launcher-weather-card[data-variant="stripe"] :is(h3,.lp-launcher-weather-location,.lp-launcher-weather-range) { display:none; }
  .lp-launcher-weather-card[data-variant="stripe"] .lp-weather-glyph { width:24px; height:24px; }
  .lp-launcher-weather-card[data-variant="stripe"] .lp-launcher-weather-reading { flex-wrap:nowrap; gap:6px; }
  .lp-launcher-weather-card[data-variant="stripe"] .lp-launcher-weather-temp { font-size:min(calc(26px * var(--pocket-ui-scale)),20cqw); }
  .lp-launcher-clock-card { height:100%; padding:4px 2px; border:0; background:transparent; color:#fff; display:grid; align-content:center; gap:4px; container-type:inline-size; text-shadow:0 2px 12px #0006; }
  .lp-launcher-clock-date { margin:0; font-size:clamp(10px,calc(11px * var(--pocket-ui-scale)),13px); line-height:1.4; opacity:.82; }
  .lp-launcher-clock-time { font-size:min(calc(34px * var(--pocket-ui-scale)),22cqw); line-height:1.1; font-weight:300; white-space:nowrap; letter-spacing:-.045em; }
  .lp-launcher-clock-card[data-clock-kind="label"] .lp-launcher-clock-time { font-size:min(calc(24px * var(--pocket-ui-scale)),18cqw); white-space:normal; overflow-wrap:anywhere; }
  .lp-launcher-widget-open { appearance:none; position:absolute; inset:0; width:100%; height:100%; border:0; border-radius:18px; background:transparent; cursor:pointer; }
  .lp-launcher-widget-open:disabled { cursor:default; }
  .lp-launcher-widget-open[aria-pressed="true"] { outline:2px solid #fff; outline-offset:3px; }
  .lp-launcher-missing-widget { min-height:100px; font-size:12px; line-height:1.5; color:var(--lp-muted); }
  .lp-launcher-widget-picker { flex:1; min-height:0; overflow:auto; display:grid; gap:12px; align-content:start; }
  .lp-launcher-widget-picker > button { text-align:left; background:#ffffff0c; }
  .lp-launcher-widget-picker .lp-launcher-subtitle { margin:0; }
  .lumiphone-shell .lp-launcher .lp-home-dock { margin:0; gap:8px; padding:14px 10px; min-height:84px; border-radius:28px; background:linear-gradient(135deg,#ffffff26,#ffffff12); border:1px solid #ffffff30; box-shadow:0 8px 24px #0002; }
  .lumiphone-shell .lp-launcher .lp-home-dock .lp-app-icon { min-height:44px; padding:0; }
  .lp-launcher-empty-slot { justify-self:center; width:44px; height:44px; border:1px dashed #ffffff40; background:#ffffff08; color:#ffffffb0; font-size:22px; }
  .lp-launcher-drawer { flex:1; min-height:0; overflow:auto; display:flex; flex-direction:column; gap:24px; padding:6px 6px 20px; margin:0 -6px; }
  .lp-launcher-title { font-size:28px; font-weight:600; letter-spacing:-.035em; margin:0; }
  .lp-launcher-subtitle { font-size:12px; line-height:1.5; margin:-16px 0 0; color:#ffffffb0; }
  .lp-launcher-search { display:block; }
  .lp-launcher-search input { box-sizing:border-box; width:100%; min-height:46px; padding:12px 16px; border:1px solid #ffffff30; border-radius:16px; background:#ffffff12; color:#fff; font:inherit; font-size:14px; }
  .lp-launcher-search input::placeholder { color:#ffffffb0; }
  .lp-launcher[data-drawer="true"] { background-image:linear-gradient(#141a2ae8,#141a2af2),var(--lp-wallpaper); }
  .lp-launcher-editor { display:grid; gap:8px; padding:10px 12px; border:1px solid #ffffff25; border-radius:14px; background:#151b2bc9; color:#fff; }
  .lp-launcher-editor-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .lp-launcher-editor-heading > strong { font-size:13px; font-weight:600; }
  .lp-launcher-editor-heading > button { color:#ffc0c5; font-size:11px; }
  .lp-launcher-editor p { margin:0; font-size:12px; line-height:1.5; color:#ffffffb0; }
  .lp-launcher-editor-actions { display:grid; grid-template-columns:minmax(0,1fr) 34px 34px; gap:6px; }
  .lp-launcher-editor-actions > button { padding:0; background:#ffffff0c; font-size:18px; }
  .lp-launcher-location { min-width:0; display:flex; }
  .lp-launcher-location select { width:100%; min-width:0; min-height:34px; padding:5px 8px; border:1px solid #ffffff25; border-radius:8px; background:#232b3c; color:#fff; font-family:inherit; font-size:12px; }
  .lp-launcher-location option { background:#232b3c; color:#fff; }
  .lp-launcher select:focus-visible { outline:2px solid #fff; outline-offset:3px; }
  @media (pointer:coarse) {
    .lp-launcher-action, .lp-launcher-location select, .lp-launcher-location input { min-height:44px; }
    .lp-launcher-page-dot, .lp-launcher-page-add { width:36px; }
    .lp-launcher-editor-actions { grid-template-columns:minmax(0,1fr) 44px 44px; }
  }
  .lp-launcher-empty { grid-column:1/-1; font-size:13px; line-height:1.6; color:#ffffffb0; padding:22px 10px; text-align:center; }
  .lp-launcher-error { padding:12px; border-radius:12px; background:#771d35; color:#fff; font-size:13px; }
  .lp-launcher .lp-home-activity { margin:4px 0 0; }
  .lp-launcher .lp-home-setup { margin-bottom:0; }
  :is(.lp-launcher,.lp-store) .lp-icon-messages { background:linear-gradient(145deg,#66d694,#249c69); }
  :is(.lp-launcher,.lp-store) .lp-icon-camera { background:linear-gradient(145deg,#657081,#323b4b); }
  :is(.lp-launcher,.lp-store) .lp-icon-gallery { background:linear-gradient(145deg,#edac79,#c66792); }
  :is(.lp-launcher,.lp-store) .lp-icon-notes { background:linear-gradient(145deg,#eed891,#bda35b); }
  :is(.lp-launcher,.lp-store) .lp-icon-weather { background:linear-gradient(145deg,#87c9ed,#4488c8); }
  :is(.lp-launcher,.lp-store) .lp-icon-contacts { background:linear-gradient(145deg,#c2afee,#8574c5); }
  :is(.lp-launcher,.lp-store) .lp-icon-calendar { background:linear-gradient(145deg,#eea6a7,#c66477); }
  :is(.lp-launcher,.lp-store) .lp-icon-trackers { background:linear-gradient(145deg,#8ccdc1,#469d93); }
  :is(.lp-launcher,.lp-store) .lp-icon-settings { background:linear-gradient(145deg,#a8b4c4,#64758b); }
`
