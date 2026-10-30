export const CONTACTS_MEDIA_STYLES = `
  .lumiphone-shell .lp-directory,.lumiphone-shell .lp-npc-review { height:100%; min-height:0; display:flex; flex-direction:column; overflow:hidden; }
  .lp-directory > .lp-nav,.lp-npc-review > .lp-nav { flex:none; }
  .lumiphone-shell .lp-directory .lp-content { flex:1; min-height:0; display:block; padding:0 16px 20px; min-width:0; overflow:auto; scroll-padding-top:174px; }
  .lp-directory-sticky { position:sticky; top:0; z-index:4; display:grid; gap:10px; padding:14px 0 10px; background:var(--lp-bg); }
  .lp-directory .lp-input { min-height:40px; border-radius:13px; }
  .lp-directory-pills { display:flex; gap:6px; padding:2px; }
  .lp-directory-pill { appearance:none; border:0; background:transparent; color:var(--lp-muted); border-radius:10px; padding:9px 12px; min-height:36px; font:inherit; font-size:12px; font-weight:600; line-height:1.2; cursor:pointer; flex:1; }
  .lp-directory-pill:is([aria-pressed="true"],[aria-selected="true"]) { background:color-mix(in srgb,var(--lp-accent) 17%,var(--lp-surface)); color:var(--lp-text); }
  .lp-directory-library { display:flex; gap:16px; justify-content:space-between; border-bottom:1px solid var(--lp-border); padding-bottom:10px; }
  .lp-directory-link { font:inherit; font-size:11px; font-weight:600; line-height:1.4; color:var(--lp-accent); border:0; background:transparent; padding:8px 2px; cursor:pointer; min-height:34px; }
  .lp-directory-list { display:flex; flex-direction:column; min-width:0; }
  .lp-directory .lp-directory-row { display:flex; align-items:center; justify-content:flex-start; gap:12px; width:100%; min-width:0; min-height:62px; padding:10px 0; background:none; border:0; border-bottom:1px solid var(--lp-border); border-radius:0; color:var(--lp-text); font:inherit; text-align:left; box-shadow:none; }
  button.lp-directory-row { cursor:pointer; }
  button.lp-directory-row:hover { background:color-mix(in srgb,var(--lp-text) 4%,transparent); }
  .lp-directory-identity { display:flex; flex:1; flex-direction:column; min-width:0; gap:4px; }
  .lp-directory-identity strong { font-size:13px; line-height:1.35; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-directory-identity small { font-size:10px; color:var(--lp-muted); line-height:1.35; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-directory-avatar { flex:none; display:grid; place-items:center; width:38px; height:38px; border-radius:50%; overflow:hidden; font-size:16px; font-weight:600; background:color-mix(in srgb,var(--person-color,var(--lp-accent)) 38%,var(--lp-surface)); color:var(--lp-text); }
  .lp-directory-avatar img { width:100%; height:100%; object-fit:cover; }
  .lp-directory-here { flex:none; font-size:9px; color:var(--lp-accent); }
  .lp-directory-letter { font-size:10px; font-weight:650; color:var(--lp-muted); margin:0; padding:14px 0 4px; scroll-margin-top:180px; }
  .lp-directory-body { position:relative; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px; }
  .lp-directory-index { position:sticky; top:175px; align-self:start; display:flex; flex-direction:column; width:20px; background:var(--lp-bg); border-radius:10px; }
  .lp-directory-jump { border:0; background:transparent; color:var(--lp-accent); min-height:23px; min-width:22px; padding:2px; font:inherit; font-size:10px; font-weight:600; line-height:1.2; cursor:pointer; }
  .lp-directory-alphabet { display:flex; overflow-x:auto; }
  .lp-directory-alphabet .lp-directory-jump { flex:none; }
  .lp-directory-scene { margin:0 0 6px; border:0; background:none; padding:0; }
  .lp-directory-scene > summary { font-size:10px; color:var(--lp-muted); padding:8px 0; cursor:pointer; }
  .lp-directory-creator { padding:16px; margin:16px 0; background:var(--lp-surface); border:1px solid var(--lp-border); border-radius:18px; }
  .lp-directory-creator h2 { font-size:15px; margin:0 0 4px; }
  .lp-directory-creator p { margin:0 0 12px; }
  .lp-directory-creator .lp-textarea { min-height:60px; margin:0; }
  .lp-directory-creator-actions { display:flex; gap:12px; align-items:center; margin-top:10px; }
  .lp-directory-creator-actions .lp-button { flex:1; }
  .lp-directory-global-search { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
  .lp-directory-global-search .lp-input { min-width:0; flex:1; }
  .lp-directory-sources { display:flex; flex-direction:column; }
  .lp-directory-source { display:flex; align-items:center; width:100%; gap:12px; padding:15px 4px; border:0; border-bottom:1px solid var(--lp-border); color:var(--lp-text); background:none; text-align:left; font:inherit; cursor:pointer; }
  .lp-directory-source-count { font-size:11px; color:var(--lp-muted); }
  .lp-directory-chevron { font-size:22px; color:var(--lp-muted); }
  .lp-directory-add { border:0; border-radius:12px; background:color-mix(in srgb,var(--lp-accent) 18%,var(--lp-surface)); color:var(--lp-accent); padding:8px 12px; min-height:34px; min-width:48px; font:inherit; font-size:11px; font-weight:600; line-height:1.3; cursor:pointer; flex:none; }
  .lp-directory-add:disabled { background:none; color:var(--lp-muted); opacity:.7; }
  .lp-directory-stack { display:flex; width:65px; flex:none; padding-left:8px; }
  .lp-directory-stack .lp-directory-avatar { width:30px; height:30px; font-size:12px; margin-left:-8px; border:2px solid var(--lp-bg); }
  .lp-directory-count { margin:0; font-size:10px; color:var(--lp-muted); }
  .lp-directory-pagination { display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:12px 0; }
  .lp-directory-resume { display:flex; align-items:center; gap:12px; border:1px solid var(--lp-border); background:var(--lp-surface); padding:12px; border-radius:14px; width:100%; color:var(--lp-text); text-align:left; cursor:pointer; margin:6px 0; }
  .lp-bank-hero { display:grid; justify-items:center; gap:8px; padding:24px 0 12px; }
  .lp-bank-hero .lp-directory-avatar { width:84px; height:84px; font-size:30px; }
  .lp-bank-hero :is(h2,p) { margin:0; text-align:center; }
  .lp-bank-hero h2 { font-size:20px; }
  .lp-bank-bio { font-size:12px; line-height:1.65; }
  .lp-bank-tags { color:var(--lp-accent); font-size:9px; line-height:1.5; overflow-wrap:anywhere; }
  .lp-bank-info { padding:12px 0; border-top:1px solid var(--lp-border); }
  .lp-bank-info h3 { font-size:11px; margin:0 0 6px; }
  .lp-bank-info p { margin:0; }
  .lp-npc-library .lp-content > .lp-button { width:100%; margin-top:14px; }
  .lp-bank-remove { display:block; color:var(--lp-destructive,#ff899a); margin:10px auto; }
  .lumiphone-shell .lp-npc-review .lp-content { flex:1; min-height:0; overflow:auto; display:flex; flex-direction:column; gap:14px; padding:16px; align-items:stretch; }
  .lp-npc-review-photo { display:block; flex:none; width:100%; max-height:300px; aspect-ratio:4/3; border-radius:18px; object-fit:cover; }
  .lp-npc-review-placeholder { display:grid; place-items:center; height:150px; border-radius:18px; font-size:52px; background:linear-gradient(135deg,var(--lp-surface),color-mix(in srgb,var(--lp-accent) 30%,var(--lp-bg))); color:var(--lp-text); }
  .lp-npc-review-heading h2 { font-size:23px; margin:0 0 5px; }
  .lp-npc-review-heading p { margin:0; }
  .lp-npc-review-tools { display:flex; gap:8px; flex-wrap:wrap; }
  .lp-npc-review-tools .lp-button { flex:1; min-width:74px; padding:9px 5px; font-size:10px; }
  .lp-npc-review-tools .lp-directory-link { flex:1; }
  .lp-camera-option-basics { display:grid; gap:12px; min-width:0; }
  .lp-camera-enhance { display:flex; align-items:center; gap:10px; width:100%; min-height:42px; font-size:12px; }
  .lp-camera-enhance input { flex:none; }
  .lp-camera-profile-status { display:grid; gap:5px; padding:10px 12px; border-radius:12px; background:#ffffff0b; border:1px solid var(--lp-border); font-size:11px; }
  .lp-camera-profile-status small { color:var(--lp-muted); line-height:1.45; font-size:10px; }
  .lp-camera-advanced { padding:0; border:0; background:none; }
  .lp-camera-advanced > summary { padding:10px 0; cursor:pointer; font-size:12px; color:var(--lp-text); }
  .lp-camera-advanced > .lp-field { margin:12px 0; }
  .lp-camera-profile-detail { overflow-wrap:anywhere; }
  .lp-directory :is(button,input,select,textarea,summary):focus-visible,.lp-npc-review :is(button,summary):focus-visible { outline:2px solid var(--lp-accent); outline-offset:3px; }
  .lp-directory [hidden],.lp-npc-review [hidden] { display:none !important; }
  .lp-media-viewer { --lp-accent:#a99bff; font:400 13px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
  .lp-media-viewer .lp-sheet { font-family:inherit; }
  .lp-media-viewer .lp-wallpaper-choice .lp-button-primary { background:#8b7dff; color:#fff; }
  .lp-wallpaper-choice label:has(input:checked) { border-color:var(--lp-accent,#a99bff); background:#a99bff0d; }
  .lp-wallpaper-choice { display:grid; gap:14px; min-width:0; }
  .lp-wallpaper-choice fieldset { border:0; margin:0; padding:0; min-width:0; display:grid; gap:8px; }
  .lp-wallpaper-choice legend { margin:0 0 8px; color:var(--lp-muted); font-size:11px; }
  .lp-wallpaper-choice label { display:flex; align-items:center; gap:10px; padding:12px; border:1px solid var(--lp-border); border-radius:12px; font-size:13px; }
  .lp-wallpaper-choice input { accent-color:var(--lp-accent,#a99bff); }
  .lp-wallpaper-choice :is(input,button):focus-visible { outline:2px solid var(--lp-accent,#a99bff); outline-offset:3px; }
  .lp-wallpaper-result { font-size:12px; line-height:1.5; color:var(--lp-text); margin:0; }
`
