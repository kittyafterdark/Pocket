/** Shared Pocket surfaces. Static rules only; dynamic tokens stay on each handset. */
export const POCKET_DESIGN_SYSTEM = `
  .lumiphone-shell, .lp-media-viewer {
    --lp-space-1:4px; --lp-space-2:8px; --lp-space-3:12px; --lp-space-4:16px; --lp-space-5:24px;
    --lp-radius:18px; --lp-radius-control:12px; --lp-radius-bubble:18px;
    --lp-touch:44px; --lp-row-height:64px; --lp-outgoing:#51459c;
    --lp-incoming:var(--lp-surface-2); --lp-destructive:#ed7c8c; --lp-success:#71cfa1;
    --lp-ease:cubic-bezier(.2,.8,.2,1); --lp-sheet-bg:var(--lp-bg,#141319);
    --lp-elevation:0 12px 36px #0002;
    --pocket-font-xs:calc(10px * var(--pocket-ui-scale,1));
    --pocket-font-sm:calc(12px * var(--pocket-ui-scale,1));
    --pocket-font-md:calc(14px * var(--pocket-ui-scale,1));
    --pocket-control-h:44px;
  }
  .lumiphone-shell { container-type:inline-size; }
  .lumiphone-shell :is(button,input,textarea,select,summary) { font-family:inherit; }
  .lumiphone-shell :is(button,input,textarea,select,summary):focus-visible,
  .lp-sheet :is(button,input,textarea,select):focus-visible { outline:2px solid var(--lp-accent,#a99bff); outline-offset:3px; }
  .lumiphone-shell .lp-nav { grid-template-columns:minmax(44px,max-content) minmax(0,1fr) minmax(44px,max-content); min-height:64px; gap:8px; padding:4px 12px; }
  .lumiphone-shell .lp-nav-title { white-space:normal; overflow-wrap:anywhere; font-size:15px; line-height:1.2; text-wrap:balance; }
  .lumiphone-shell .lp-nav-subtitle { font-size:10px; line-height:1.35; margin-top:4px; }
  .lumiphone-shell .lp-nav-action { min-height:var(--lp-touch); font-size:12px; }
  .lumiphone-shell .lp-content { gap:var(--lp-space-3); padding:var(--lp-space-4); padding-bottom:calc(28px + env(safe-area-inset-bottom,0px)); }
  .lumiphone-shell .lp-card { border:0; border-radius:var(--lp-radius); box-shadow:none; padding:var(--lp-space-4); background:color-mix(in srgb,var(--lp-text) 5%,var(--lp-surface)); }
  .lumiphone-shell .lp-title { font-size:var(--pocket-font-md); }
  .lumiphone-shell .lp-copy { font-size:var(--pocket-font-sm); line-height:1.5; }
  .lumiphone-shell .lp-eyebrow { font-size:var(--pocket-font-xs); letter-spacing:.065em; line-height:1.4; }
  .lumiphone-shell .lp-fields { grid-template-columns:minmax(0,1fr); gap:var(--lp-space-4); }
  .lumiphone-shell :is(.lp-input,.lp-select,.lp-textarea) { width:100%; min-width:0; min-height:var(--lp-touch); border:1px solid var(--lp-border); border-radius:var(--lp-radius-control); padding:12px; font-size:var(--pocket-font-md); background:color-mix(in srgb,var(--lp-text) 3%,var(--lp-bg)); scroll-margin-block:80px; }
  .lumiphone-shell .lp-textarea { min-height:104px; resize:vertical; line-height:1.5; }
  .lumiphone-shell :is(.lp-field,.lp-label) { display:grid; gap:8px; min-width:0; font-size:12px; }
  .lumiphone-shell :is(.lp-field-label,.lp-control-label) { font-size:13px; font-weight:650; }
  .lumiphone-shell :is(.lp-field-help,.lp-control-help) { display:block; font-size:12px; line-height:1.45; margin-top:4px; }
  .lumiphone-shell .lp-button { min-height:var(--lp-touch); font-size:12px; border-radius:var(--lp-radius-control); }
  .lumiphone-shell .lp-button-quiet { background:transparent; border-color:transparent; }
  .lumiphone-shell .lp-button-danger { color:var(--lp-destructive); }
  .lumiphone-shell .lp-chip { min-height:36px; padding:8px 12px; font-size:11px; }
  .lumiphone-shell .lp-chipbar { gap:4px; flex-wrap:wrap; }
  .lumiphone-shell .lp-chip[aria-pressed="true"] { background:color-mix(in srgb,var(--lp-accent) 22%,var(--lp-surface)); color:var(--lp-text); border-color:transparent; }
  .lumiphone-shell .lp-setting-row { min-height:58px; padding:10px 0; border-bottom:1px solid var(--lp-border); gap:16px; }
  .lp-setting-row > span:first-child { min-width:0; display:grid; gap:4px; }
  .lp-setting-row strong { font-size:13px; font-weight:650; }
  .lp-setting-row .lp-copy { display:block; }
  .lp-wallpaper-control .lp-row-between > span { display:grid; gap:4px; min-width:0; }
  .lumiphone-shell .lp-contact-check { display:grid; grid-template-columns:24px minmax(0,1fr); gap:4px 8px; align-items:center; padding:10px 0; min-height:44px; border-bottom:1px solid var(--lp-border); }
  .lp-contact-check input { grid-row:1 / 3; width:18px; height:18px; margin:0; }
  .lp-contact-check > .lp-copy { grid-column:2; }
  .lumiphone-shell .lp-toggle { flex:0 0 40px; }
  .lumiphone-shell .lp-settings-list { gap:0; }
  .lumiphone-shell .lp-settings-category { min-height:var(--lp-row-height); border-radius:0; border-bottom:1px solid var(--lp-border); padding:14px 12px; }
  .lp-settings-category:first-child { border-radius:18px 18px 0 0; }
  .lp-settings-category:last-child { border-radius:0 0 18px 18px; border-bottom:0; }
  .lp-settings-category strong { font-size:14px; }
  .lp-disclosure { border-radius:var(--lp-radius,16px); background:color-mix(in srgb,var(--lp-text,#fff) 5%,var(--lp-surface,#18171e)); min-width:0; }
  .lp-disclosure > summary { cursor:pointer; min-height:44px; padding:14px; font-size:12px; font-weight:650; }
  .lp-disclosure > :not(summary) { margin:0 12px 12px; }
  .lp-theme-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
  .lp-theme-preview { min-width:0; min-height:60px; border:1px solid transparent; background:transparent; color:var(--lp-text); border-radius:12px; padding:8px 4px; font-size:11px; font-weight:550; display:grid; justify-items:center; align-content:center; gap:6px; cursor:pointer; }
  .lp-theme-preview::before { content:''; width:24px; height:24px; border-radius:50%; background:var(--theme-color); box-shadow:inset 0 0 0 1px #ffffff30; }
  .lp-theme-preview[aria-pressed="true"] { border-color:var(--lp-border); background:color-mix(in srgb,var(--lp-text) 7%,transparent); }
  .lumiphone-shell .lp-accent-control { min-height:56px; padding:6px 14px; border:0; border-radius:var(--lp-radius-control); background:color-mix(in srgb,var(--lp-text) 5%,var(--lp-surface)); }
  .lumiphone-shell .lp-palette-disclosure { padding:2px; }
  .lp-palette-disclosure > summary { padding:12px; }
  .lp-palette-disclosure > .lp-palette-sections { margin:0; padding:0 12px 14px; display:grid; gap:12px; }
  .lp-palette-group { min-width:0; }
  .lp-palette-heading { margin:0 0 6px; color:var(--lp-muted); font-size:11px; font-weight:600; }
  .lp-palette-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
  .lp-palette-grid:has(> :nth-child(2):last-child) { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .lumiphone-shell .lp-palette-grid .lp-setting-row { min-width:0; min-height:78px; padding:8px 3px; border:0; border-radius:12px; display:flex; flex-direction:column-reverse; justify-content:center; gap:4px; background:color-mix(in srgb,var(--lp-text) 4%,transparent); }
  .lp-palette-grid .lp-setting-row strong { font-size:10px; font-weight:550; overflow-wrap:anywhere; text-align:center; }
  .lumiphone-shell .lp-palette-bezel { min-height:48px; padding:2px 0 8px; }
  .lumiphone-shell :is(.lp-accent-control,.lp-palette-sections) .lp-color-input { flex-shrink:0; width:44px; height:44px; padding:5px; border:1px solid var(--lp-border); border-radius:50%; background:transparent; cursor:pointer; overflow:hidden; }
  .lumiphone-shell :is(.lp-accent-control,.lp-palette-sections) .lp-color-input::-webkit-color-swatch-wrapper { padding:0; }
  .lumiphone-shell :is(.lp-accent-control,.lp-palette-sections) .lp-color-input::-webkit-color-swatch { border:0; border-radius:50%; }
  .lumiphone-shell :is(.lp-accent-control,.lp-palette-sections) .lp-color-input::-moz-color-swatch { border:0; border-radius:50%; }
  .lp-theme-live { display:grid; gap:12px; border-radius:22px; padding:20px; min-height:145px; border:1px solid var(--lp-border); }
  .lp-theme-live .lp-message-surface { justify-self:end; }
  .lumiphone-shell .lp-color-grid { grid-template-columns:minmax(0,1fr); }
  .lumiphone-shell .lp-home-activity-item { grid-template-columns:minmax(0,1fr) 16px; gap:4px 8px; padding:12px; border-radius:18px; }
  .lp-home-activity-item strong { grid-column:1; font-size:12px; }
  .lp-home-activity-item > span:not(.lp-home-activity-arrow) { grid-row:2; grid-column:1; font-size:11px; }
  .lp-home-activity-arrow { grid-column:2; grid-row:1 / 3; }
  .lumiphone-shell .lp-conversation-row { width:100%; min-height:80px; background:transparent; color:var(--lp-text); border:0; border-bottom:1px solid var(--lp-border); text-align:left; padding:12px 0; }
  .lumiphone-shell .lp-avatar { width:44px; height:44px; flex-shrink:0; font-size:17px; }
  .lumiphone-shell .lp-identity-line { display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; }
  .lumiphone-shell .lp-identity-name { font-size:14px; line-height:1.35; }
  .lumiphone-shell .lp-identity-meta { font-size:10px; }
  .lumiphone-shell .lp-identity-description { font-size:12px; line-height:1.5; }
  .lp-conversation-row .lp-identity-line { flex-wrap:nowrap; justify-content:space-between; }
  .lp-conversation-row .lp-identity-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-conversation-row .lp-identity-meta { white-space:nowrap; flex-shrink:0; }
  .lumiphone-shell .lp-bubbles { gap:12px; padding:16px 12px 24px; }
  .lp-message-surface, .lumiphone-shell .lp-bubble { padding:10px 13px; border-radius:var(--lp-radius-bubble,18px); font-size:var(--pocket-font-md,14px); line-height:1.5; overflow-wrap:anywhere; box-shadow:none; }
  .lumiphone-shell .lp-bubble { max-width:86%; position:relative; }
  .lumiphone-shell .lp-bubble[data-sender="persona"] { background:var(--lp-outgoing); color:#fff; border-bottom-right-radius:7px; }
  .lumiphone-shell .lp-bubble[data-sender="contact"] { background:var(--lp-incoming); border-bottom-left-radius:7px; }
  .lumiphone-shell .lp-bubble::after { display:none; }
  .lumiphone-shell .lp-bubble[data-burst-continuation="true"] { margin-top:-8px; }
  .lumiphone-shell .lp-bubble[data-burst-continuation="true"][data-sender="persona"] { border-top-right-radius:7px; }
  .lumiphone-shell .lp-bubble[data-burst-continuation="true"][data-sender="contact"] { border-top-left-radius:7px; }
  .lumiphone-shell .lp-group-message { max-width:94%; margin-top:0; }
  .lumiphone-shell .lp-group-message[data-continuation="true"] { margin-top:-8px; }
  .lumiphone-shell .lp-group-message .lp-bubble { max-width:100%; margin-top:0; }
  .lumiphone-shell .lp-bubble-time { font-size:9px; opacity:.78; padding-right:30px; min-height:22px; margin-top:6px; }
  .lp-message-more { position:absolute; bottom:2px; right:2px; width:44px; height:44px; border:0; border-radius:50%; background:transparent; color:inherit; font-size:20px; cursor:pointer; }
  .lp-sheet { box-sizing:border-box; width:min(440px,calc(100% - 24px)); max-height:calc(100dvh - 48px); border:1px solid var(--lp-border,#ffffff25); border-radius:24px; padding:0; background:var(--lp-sheet-bg,#17151d); color:var(--lp-text,#f7f5ff); box-shadow:0 24px 80px #0008; }
  .lp-sheet::backdrop { background:#0006; backdrop-filter:blur(4px); }
  .lp-sheet-panel { display:grid; gap:16px; padding:20px; padding-bottom:max(20px,env(safe-area-inset-bottom)); }
  .lp-sheet-actions, .lp-sheet .lp-bubble-tools { display:grid; gap:6px; margin:0; }
  .lp-sheet .lp-bubble-action { width:100%; min-height:44px; opacity:1; font-size:14px; border-radius:12px; justify-content:start; padding:12px; background:#ffffff09; }
  .lp-sheet .lp-button { min-height:44px; }
  .lumiphone-shell .lp-notification-row { padding:0; border-radius:18px; }
  .lp-notification-open { gap:10px; align-items:flex-start; }
  .lp-notification-avatar { flex:0 0 32px; height:32px; border-radius:10px; background:var(--lp-incoming); display:grid!important; place-items:center; font-size:13px; }
  .lp-notification-dismiss { min-width:44px; align-self:start; height:44px; }
  .lp-notification-open time { margin-top:6px; }
  .lp-notification-open strong { font-size:13px; }
  .lumiphone-shell .lp-note-editor { display:flex; flex-direction:column; min-height:calc(100% - 64px); gap:8px; }
  .lumiphone-shell .lp-note-editor :is(.lp-note-title,.lp-note-body) { border:0; background:transparent; padding:8px 0; border-radius:0; }
  .lumiphone-shell .lp-note-editor .lp-note-title { font-size:24px; font-weight:700; }
  .lumiphone-shell .lp-note-editor .lp-note-body { flex:1; min-height:240px; line-height:1.8; resize:vertical; }
  .lumiphone-shell .lp-note-card { text-align:left; color:var(--lp-text); }
  .lumiphone-shell .lp-weather-hero { min-height:280px; border-radius:24px; padding:24px; }
  .lp-weather-note { margin:8px 4px; font-size:14px; line-height:1.7; color:var(--lp-muted); }
  .lumiphone-shell .lp-event[data-completed="true"] { opacity:1; }
  .lumiphone-shell .lp-event[data-completed="true"] .lp-title { text-decoration:none; color:var(--lp-muted); }
  .lp-event-card { width:100%; text-align:left; color:var(--lp-text); }
  .lp-event-card .lp-status-badge { margin-top:8px; }
  .lumiphone-shell .lp-status-badge { font-size:10px; }
  .lumiphone-shell .lp-camera { min-height:100%; }
  .lumiphone-shell .lp-viewfinder { min-height:240px; border-radius:0; margin:0; }
  .lumiphone-shell .lp-camera-controls { gap:6px; }
  .lp-camera .lp-disclosure { background:#16161a; }
  .lp-camera .lp-disclosure > summary { color:#e9e7ef; }
  .lp-media-viewer { --lp-text:#f7f5ff; --lp-bg:#141319; --lp-muted:#b9b5c5; --lp-border:#ffffff22; }
  .lp-media-viewer .lp-gallery-actions { display:flex; flex-wrap:wrap; justify-content:space-around; gap:8px; padding:16px 0; }
  .lp-media-viewer .lp-button { min-height:44px; font-size:13px; color:var(--lp-text); background:#ffffff0b; }
  .pocket-inline-anchor { margin:14px 0; }
  .pocket-artifact-stack { gap:4px; }
  .pocket-inline-artifact { width:min(100%,480px); min-height:0; padding:12px 13px; gap:6px; border:1px solid color-mix(in srgb,var(--lumiverse-text,#fff) 14%,transparent); border-radius:18px; background:color-mix(in srgb,var(--lumiverse-fill,#17151d) 88%,transparent); color:var(--lumiverse-text,#f7f5ff); box-shadow:0 10px 30px #0000001f; backdrop-filter:blur(18px) saturate(1.12); }
  .pocket-inline-artifact[data-kind="received"] { background:linear-gradient(180deg,color-mix(in srgb,var(--lumiverse-fill,#17151d) 86%,white 5%),color-mix(in srgb,var(--lumiverse-fill,#17151d) 94%,transparent)); }
  .pocket-inline-artifact[data-kind="observed"] { width:min(100%,460px); opacity:1; border-style:solid; background:linear-gradient(180deg,color-mix(in srgb,var(--lumiverse-fill,#17151d) 90%,white 3%),color-mix(in srgb,var(--lumiverse-fill,#17151d) 96%,transparent)); }
  .pocket-inline-artifact-chrome { min-height:18px; gap:10px; }
  .pocket-inline-artifact-app { display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:650; color:inherit; opacity:.72; letter-spacing:0; }
  .pocket-inline-artifact-app::before { content:''; width:14px; height:14px; border-radius:4px; background:linear-gradient(145deg,#4ee580,#12aa4b); box-shadow:inset 0 1px #ffffff35; }
  .pocket-inline-artifact-state { font-size:9px; text-transform:none; letter-spacing:0; opacity:.48; }
  .pocket-inline-artifact-device { display:block; margin-bottom:1px; color:var(--lumiverse-text,#f7f5ff); font-size:10px; font-weight:600; opacity:.55; }
  .pocket-inline-artifact-actors { display:block; margin-top:1px; white-space:normal; font-size:13px; line-height:1.3; font-weight:720; }
  .pocket-inline-artifact-copy { display:block; overflow:visible; font-size:13px; line-height:1.5; opacity:.94; -webkit-line-clamp:unset; }
  .pocket-inline-artifact[data-kind="sent"] { width:min(88%,420px); margin-left:auto; padding:0; border:0; border-radius:0; background:transparent; box-shadow:none; backdrop-filter:none; gap:4px; }
  .pocket-inline-artifact-recipient { display:block; padding-right:4px; color:var(--lumiverse-text,#f7f5ff); font-size:10px; text-align:right; opacity:.58; }
  .pocket-inline-chat-bubble { justify-self:end; width:auto; max-width:100%; padding:10px 12px; background:color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 58%,var(--lumiverse-fill,#17151d)); color:#fff; border-radius:18px 18px 6px 18px; box-shadow:none; }
  .pocket-inline-chat-bubble .pocket-inline-artifact-copy { font-size:13px; line-height:1.48; opacity:1; }
  .pocket-inline-sent-status { display:block; padding-right:4px; color:var(--lumiverse-text,#f7f5ff); font-size:9px; text-align:right; opacity:.42; }
  .pocket-receipt { min-height:22px; padding:2px 3px; grid-template-columns:auto minmax(0,1fr) auto; gap:5px; border-radius:6px; box-shadow:none; background:transparent; opacity:.48; }
  button.pocket-receipt:hover { opacity:.8; background:transparent; }
  .pocket-receipt-kind { padding:0; background:transparent; font-size:8px; font-weight:750; }
  .pocket-receipt-copy strong { font-size:8px; font-weight:600; }
  .pocket-receipt-arrow { font-size:11px; opacity:.4; }
  .pocket-receipt-details { margin:0 2px; font-size:9px; opacity:.42; order:3; }
  .pocket-receipt-details summary { width:max-content; cursor:pointer; }
  .pocket-receipt-details > span { display:block; margin-top:3px; max-width:460px; line-height:1.35; }
  @container (max-width:360px) {
    .lumiphone-shell .lp-content { padding-inline:12px; }
    .lumiphone-shell .lp-nav { padding-inline:8px; gap:4px; }
    .lumiphone-shell .lp-nav-title { font-size:14px; }
    .lumiphone-shell .lp-actions { flex-wrap:wrap; }
    .lumiphone-shell .lp-row { flex-wrap:wrap; }
  }
  @media (prefers-reduced-motion:reduce) { .lumiphone-shell *, .pocket-inline-artifact { animation:none!important; transition:none!important; scroll-behavior:auto!important; } }
`
