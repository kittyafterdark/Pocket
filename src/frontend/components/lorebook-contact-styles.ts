export const LOREBOOK_CONTACT_STYLES = `
  .lp-lorebook-dialog { --lore-accent:var(--lp-accent,#ab9aff); height:min(780px,calc(100dvh - 48px - var(--app-interactive-safe-top,0px))); overflow:hidden; border-radius:24px; background:var(--lp-bg,#15131b); font:400 14px/1.5 Inter,ui-sans-serif,system-ui,sans-serif; }
  .lp-lorebook-dialog,.lp-lorebook-dialog * { box-sizing:border-box; }
  .lp-lorebook-dialog > .lp-sheet-panel { height:100%; min-height:0; display:grid; grid-template-rows:auto minmax(0,1fr); grid-template-columns:minmax(0,1fr); gap:0; padding:0; position:relative; }
  .lp-lorebook-dialog > .lp-sheet-panel > h2 { margin:0; padding:22px 90px 20px 24px; font-size:22px; font-weight:650; letter-spacing:-.6px; line-height:1.3; border-bottom:1px solid var(--lp-border,#ffffff15); background:radial-gradient(ellipse at 0 0,color-mix(in srgb,var(--lore-accent) 12%,transparent),transparent 75%); }
  .lp-lorebook-dialog > .lp-sheet-panel > .lp-sheet-close { position:absolute; right:16px; top:13px; min-height:40px; padding:8px 12px; width:auto; background:transparent; border:1px solid var(--lp-border,#ffffff15); color:var(--lp-muted,#b4acbe); font-size:12px; border-radius:12px; }
  .lp-lorebook { width:100%; min-width:0; min-height:0; overflow:hidden; display:flex; flex-direction:column; }
  .lp-lorebook-stage { flex:1; min-width:0; min-height:0; display:flex; flex-direction:column; }
  .lp-lorebook-intro { flex:none; margin:0; padding:14px 24px; color:var(--lp-muted,#b4acbe); font-size:12px; }
  .lp-lorebook-source-layout { flex:1; min-height:0; display:grid; grid-template-columns:260px minmax(0,1fr); border-top:1px solid var(--lp-border,#ffffff15); }
  .lp-lorebook-library { min-height:0; min-width:0; padding:20px 16px; display:flex; flex-direction:column; gap:14px; border-right:1px solid var(--lp-border,#ffffff15); background:color-mix(in srgb,var(--lp-surface,#24212c) 45%,transparent); }
  .lp-lorebook-dialog .lp-field { display:flex; flex-direction:column; gap:7px; margin:0; min-width:0; }
  .lp-lorebook-dialog .lp-field-label { font-size:11px; font-weight:600; color:var(--lp-muted,#b4acbe); letter-spacing:.15px; line-height:1.4; }
  .lp-lorebook-dialog :is(.lp-input,.lp-textarea) { width:100%; min-width:0; margin:0; padding:11px 13px; font:inherit; font-size:13px; line-height:1.65; border:1px solid var(--lp-border,#ffffff18); border-radius:12px; color:var(--lp-text,#f6f1ff); background:color-mix(in srgb,var(--lp-bg,#15131b) 78%,var(--lp-surface,#24212c)); }
  .lp-lorebook-dialog .lp-input { min-height:44px; }
  .lp-lorebook-dialog .lp-textarea { min-height:170px; resize:vertical; }
  .lp-lorebook-dialog input::placeholder { color:var(--lp-muted,#b4acbe); opacity:.65; }
  .lp-lorebook-dialog :is(button,input,textarea,summary):focus-visible { outline:2px solid var(--lore-accent); outline-offset:3px; }
  .lp-lorebook-dialog input[type=checkbox] { flex:none; width:18px; height:18px; margin:3px 0 0; accent-color:var(--lore-accent); cursor:pointer; }
  .lp-lorebook-scopes { display:flex; gap:4px; padding:3px; border:1px solid var(--lp-border,#ffffff15); border-radius:11px; }
  .lp-lorebook-filter { flex:1; border:0; border-radius:8px; padding:7px 9px; min-height:34px; background:transparent; color:var(--lp-muted,#b4acbe); font:inherit; font-size:11px; font-weight:600; cursor:pointer; }
  .lp-lorebook-filter[aria-pressed=true] { color:var(--lp-text,#f6f1ff); background:var(--lp-surface,#24212c); box-shadow:0 1px 4px #0002; }
  .lp-lorebook-books { width:100%; min-width:0; flex:1; min-height:0; overflow:auto; display:flex; flex-direction:column; gap:8px; padding:3px; margin:-3px; }
  .lp-lorebook-book { flex:none; width:100%; display:grid; gap:8px; text-align:left; padding:13px; border:1px solid transparent; border-radius:13px; background:transparent; color:var(--lp-text,#f6f1ff); font:inherit; cursor:pointer; }
  .lp-lorebook-book strong { font-size:13px; font-weight:550; overflow-wrap:anywhere; line-height:1.4; }
  .lp-lorebook-book[aria-pressed=true] { border-color:color-mix(in srgb,var(--lore-accent) 65%,transparent); background:color-mix(in srgb,var(--lore-accent) 10%,transparent); }
  .lp-lorebook-book:hover { background:color-mix(in srgb,var(--lore-accent) 7%,transparent); }
  .lp-lorebook-badges { display:flex; flex-wrap:wrap; gap:5px; }
  .lp-lorebook-badges span { border:1px solid var(--lp-border,#ffffff15); border-radius:6px; padding:2px 6px; font-size:9px; color:var(--lp-muted,#b4acbe); }
  .lp-lorebook-entries { min-height:0; min-width:0; padding:20px 24px 0; display:flex; flex-direction:column; gap:12px; }
  .lp-lorebook-entry-header { display:flex; align-items:baseline; justify-content:space-between; gap:12px; min-width:0; }
  .lp-lorebook-entry-header h3 { margin:0; font-size:17px; font-weight:600; line-height:1.4; overflow-wrap:anywhere; }
  .lp-lorebook-meta { flex:none; color:var(--lp-muted,#b4acbe); font-size:11px; }
  .lp-lorebook-tools { display:flex; justify-content:space-between; gap:12px; }
  .lp-lorebook-link { border:0; background:transparent; padding:4px 0; min-height:30px; color:var(--lore-accent); font:inherit; font-size:11px; font-weight:550; cursor:pointer; }
  .lp-lorebook-link:disabled { color:var(--lp-muted,#b4acbe); opacity:.5; cursor:default; }
  .lp-lorebook-rows { flex:1; min-height:0; overflow:auto; padding:4px 4px 20px; margin:0 -4px; display:flex; flex-direction:column; gap:10px; }
  .lp-lorebook-entry { flex:none; min-width:0; padding:14px 16px; border:1px solid var(--lp-border,#ffffff15); border-radius:14px; background:color-mix(in srgb,var(--lp-surface,#24212c) 45%,transparent); }
  .lp-lorebook-entry:has(input:checked) { border-color:color-mix(in srgb,var(--lore-accent) 65%,transparent); background:color-mix(in srgb,var(--lore-accent) 8%,transparent); }
  .lp-lorebook-choice { display:grid; grid-template-columns:18px minmax(0,1fr); align-items:start; gap:12px; min-height:30px; cursor:pointer; }
  .lp-lorebook-entry-text { display:grid; gap:5px; min-width:0; text-align:left; }
  .lp-lorebook-entry-text strong { font-size:14px; line-height:1.45; font-weight:550; overflow-wrap:anywhere; }
  .lp-lorebook-entry-text small { font-size:10px; line-height:1.4; color:var(--lp-muted,#b4acbe); overflow-wrap:anywhere; }
  .lp-lorebook-entry:has(input:disabled) { opacity:.5; }
  .lp-lorebook-preview { margin:9px 0 0 30px; font-size:11px; color:var(--lp-muted,#b4acbe); }
  .lp-lorebook-preview summary { cursor:pointer; min-height:28px; padding:3px 0; }
  .lp-lorebook-preview p { margin:9px 0 0; font-size:12px; line-height:1.7; color:var(--lp-text,#f6f1ff); white-space:pre-wrap; overflow-wrap:anywhere; }
  .lp-lorebook-footer { flex:none; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px 20px; padding:16px 24px; border-top:1px solid var(--lp-border,#ffffff15); background:var(--lp-bg,#15131b); }
  .lp-lorebook-selection { margin:0; color:var(--lp-text,#f6f1ff); font-size:12px; font-weight:550; }
  .lp-lorebook-dialog .lp-button { font:inherit; font-size:12px; border-radius:12px; padding:10px 17px; min-height:44px; }
  .lp-lorebook-dialog .lp-button-primary { box-shadow:0 4px 16px color-mix(in srgb,var(--lore-accent) 18%,transparent); }
  .lp-lorebook-target { color:var(--lp-muted,#b4acbe); font-size:11px; }
  .lp-lorebook-target summary { cursor:pointer; padding:8px 0; }
  .lp-lorebook-target[open] { flex-basis:100%; order:-1; }
  .lp-lorebook-target .lp-field { padding-top:6px; }
  .lp-lorebook-status { flex:none; padding:12px 24px; margin:0; font-size:12px; color:var(--lore-accent); background:color-mix(in srgb,var(--lore-accent) 6%,transparent); border-top:1px solid var(--lp-border,#ffffff15); }
  .lp-lorebook-status:empty { display:none; }
  .lp-lorebook-empty { margin:0; padding:20px 8px; color:var(--lp-muted,#b4acbe); font-size:12px; line-height:1.7; }
  .lp-lorebook-review-intro { flex:none; padding:20px 24px 16px; }
  .lp-lorebook-review-intro h3 { margin:0 0 5px; font-size:18px; font-weight:600; }
  .lp-lorebook-review-intro p { margin:0; color:var(--lp-muted,#b4acbe); font-size:12px; }
  .lp-lorebook-review-grid { flex:1; min-height:0; min-width:0; overflow:auto; padding:4px 24px 24px; margin:0; border:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); align-content:start; gap:18px; }
  .lp-lorebook-person { min-width:0; margin:0; padding:18px; border:1px solid var(--lp-border,#ffffff15); border-radius:18px; background:linear-gradient(145deg,color-mix(in srgb,var(--lore-accent) 5%,var(--lp-surface,#24212c)),var(--lp-surface,#24212c)); display:flex; flex-direction:column; gap:15px; }
  .lp-lorebook-person > legend { padding:0 6px; font-size:13px; font-weight:600; color:var(--lp-text,#f6f1ff); }
  .lp-lorebook-person-choice { display:grid; grid-template-columns:38px minmax(0,1fr) 18px; align-items:center; gap:11px; cursor:pointer; font-size:13px; font-weight:550; line-height:1.5; }
  .lp-lorebook-person-choice input { margin:0; }
  .lp-lorebook-monogram { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; color:var(--lore-accent); background:color-mix(in srgb,var(--lore-accent) 12%,transparent); border:1px solid color-mix(in srgb,var(--lore-accent) 20%,transparent); font-size:12px; font-weight:650; letter-spacing:.5px; }
  .lp-lorebook-person > .lp-copy { margin:0; font-size:11px; color:var(--lp-muted,#b4acbe); line-height:1.6; }
  .lp-lorebook-evidence { padding:9px 11px; border-radius:9px; background:color-mix(in srgb,var(--lp-bg,#15131b) 45%,transparent); color:var(--lp-muted,#b4acbe); font-size:10px; }
  .lp-lorebook-evidence summary { cursor:pointer; }
  .lp-lorebook-evidence p { margin:9px 0 0; line-height:1.7; overflow-wrap:anywhere; }
  .lp-lorebook-profile-details { border-top:1px solid var(--lp-border,#ffffff15); padding-top:12px; margin-top:auto; font-size:11px; color:var(--lp-muted,#b4acbe); }
  .lp-lorebook-profile-details summary { cursor:pointer; min-height:30px; }
  .lp-lorebook-profile-details .lp-field { margin-top:13px; }
  .lp-lorebook-result { width:100%; max-width:460px; margin:auto; padding:32px 24px; display:grid; justify-items:center; gap:14px; text-align:center; }
  .lp-lorebook-result h3 { margin:0; font-size:23px; font-weight:600; letter-spacing:-.5px; }
  .lp-lorebook-result .lp-copy { margin:0; font-size:13px; line-height:1.7; color:var(--lp-muted,#b4acbe); }
  .lp-lorebook-result .lp-button { min-width:120px; margin-top:8px; }
  .lp-lorebook-result .lp-lorebook-progress-symbol { margin:0 0 8px; }
  .lp-lorebook-progress { margin:auto; padding:32px 24px; max-width:420px; text-align:center; }
  .lp-lorebook-progress-symbol { margin:0 auto 24px; width:76px; height:76px; display:grid; place-items:center; border-radius:24px; font-size:32px; color:var(--lore-accent); background:color-mix(in srgb,var(--lore-accent) 12%,transparent); border:1px solid color-mix(in srgb,var(--lore-accent) 30%,transparent); box-shadow:0 0 60px color-mix(in srgb,var(--lore-accent) 12%,transparent); }
  .lp-lorebook-progress h3 { margin:0 0 8px; font-size:24px; font-weight:600; letter-spacing:-.6px; }
  .lp-lorebook-progress > p { margin:0; color:var(--lp-muted,#b4acbe); font-size:12px; }
  .lp-lorebook-progress ol { list-style:none; padding:0; margin:26px 0; display:grid; gap:12px; text-align:left; counter-reset:step; }
  .lp-lorebook-progress li { counter-increment:step; display:flex; align-items:center; gap:12px; font-size:12px; color:var(--lp-muted,#b4acbe); }
  .lp-lorebook-progress li::before { content:counter(step); display:grid; place-items:center; width:26px; height:26px; border:1px solid var(--lp-border,#ffffff15); border-radius:50%; font-size:10px; }
  .lp-lorebook-progress li[aria-current=step] { color:var(--lp-text,#f6f1ff); }
  .lp-lorebook-progress li[aria-current=step]::before,.lp-lorebook-progress li.is-done::before { border-color:var(--lore-accent); color:var(--lore-accent); background:color-mix(in srgb,var(--lore-accent) 10%,transparent); }
  .lp-lorebook-progress progress { display:block; width:100%; height:5px; margin:0 0 12px; accent-color:var(--lore-accent); }
  @media(max-width:767px) {
    .lp-lorebook-dialog { border-radius:20px; }
    .lp-lorebook-dialog > .lp-sheet-panel > h2 { padding:19px 78px 17px 18px; font-size:19px; }
    .lp-lorebook-dialog > .lp-sheet-panel > .lp-sheet-close { top:10px; right:12px; }
    .lp-lorebook-intro { padding:12px 18px; font-size:11px; }
    .lp-lorebook-source-layout { display:flex; flex-direction:column; }
    .lp-lorebook-library { flex:none; padding:14px 18px 10px; gap:10px; border-right:0; border-bottom:1px solid var(--lp-border,#ffffff15); }
    .lp-lorebook-library .lp-field-label { position:absolute; width:1px; height:1px; clip-path:inset(50%); overflow:hidden; white-space:nowrap; }
    .lp-lorebook-books { flex:none; flex-direction:row; overflow-x:auto; padding-bottom:5px; }
    .lp-lorebook-book { flex:0 0 200px; gap:5px; padding:10px 12px; }
    .lp-lorebook-book strong { font-size:12px; }
    .lp-lorebook-entries { flex:1; padding:14px 18px 0; gap:9px; }
    .lp-lorebook-entry-header h3 { font-size:14px; }
    .lp-lorebook-entry { padding:13px; }
    .lp-lorebook-entry-text strong { font-size:13px; }
    .lp-lorebook-footer { padding:13px 18px max(13px,env(safe-area-inset-bottom)); gap:8px 14px; }
    .lp-lorebook-footer > .lp-lorebook-selection { flex-basis:100%; font-size:11px; }
    .lp-lorebook-footer > .lp-button-primary { margin-left:auto; }
    .lp-lorebook-review-grid { grid-template-columns:minmax(0,1fr); padding:4px 18px 18px; gap:16px; }
    .lp-lorebook-review-intro { padding:16px 18px 14px; }
    .lp-lorebook-person { padding:16px; }
    .lp-lorebook-status { padding:10px 18px; font-size:11px; }
  }
`
