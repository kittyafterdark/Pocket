export const SHARE_STYLES = `
  .lp-song-home { align-content:start; }
  .lp-song-player { display:grid; gap:14px; min-width:0; padding:20px; border:1px solid color-mix(in srgb,var(--lp-accent) 24%,var(--lp-border)); border-radius:26px; background:linear-gradient(155deg,color-mix(in srgb,var(--lp-accent) 14%,var(--lp-bg)),var(--lp-surface)); color:var(--lp-text); }
  .lp-song-player-top { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .lp-share-eyebrow { display:block; font:700 9px/1.4 ui-sans-serif,system-ui,sans-serif; letter-spacing:.16em; color:var(--lp-muted); }
  .lp-song-refresh { display:grid; place-items:center; flex:none; width:40px; height:40px; border:1px solid var(--lp-border); border-radius:50%; font:24px/1 system-ui; background:transparent; color:var(--lp-text); cursor:pointer; }
  .lp-song-art { position:relative; width:min(100%,240px); aspect-ratio:1; margin:0 auto 2px; border-radius:13px; box-shadow:0 14px 30px #0003; overflow:hidden; }
  .lp-song-art > img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .lp-record-sleeve { position:relative; display:grid; place-items:center; width:100%; height:100%; min-height:0; overflow:hidden; background:#d4e5c1; color:#244b3d; }
  .lp-record-sleeve::before { content:''; position:absolute; width:70%; height:140%; right:-35%; background:#b9d8c4; transform:rotate(28deg); }
  .lp-record-edition { position:absolute; left:8%; top:7%; font:700 7px/1.4 ui-monospace,monospace; letter-spacing:.08em; }
  .lp-record-disc { display:grid; place-items:center; width:66%; aspect-ratio:1; border-radius:50%; border:1px solid #163a3030; background:repeating-radial-gradient(circle,#244b3d 0px,#244b3d 2px,#335e4f 3px,#244b3d 4px); box-shadow:5px 6px 0 #21443420; }
  .lp-record-heart { display:grid; place-items:center; width:34%; aspect-ratio:1; border:5px solid #e8b5c8; border-radius:50%; background:#f8d4de; color:#244b3d; font-size:22px; }
  .lp-record-label { position:absolute; bottom:6%; left:8%; font:italic 700 25px/1 Georgia,serif; letter-spacing:-.04em; }
  .lp-song-details { display:grid; gap:5px; min-width:0; }
  .lp-song-details h2 { margin:0; font:750 22px/1.2 ui-sans-serif,system-ui,sans-serif; letter-spacing:-.035em; overflow-wrap:anywhere; }
  .lp-song-details p { margin:0; font-size:14px; color:var(--lp-muted); }
  .lp-song-album { color:var(--lp-muted); font-size:11px; overflow-wrap:anywhere; }
  .lp-song-progress { height:4px; border-radius:9px; background:color-mix(in srgb,var(--lp-text) 12%,transparent); }
  .lp-song-progress > span { position:relative; display:block; width:34%; height:100%; border-radius:inherit; background:var(--lp-accent); }
  .lp-song-progress > span::after { content:''; position:absolute; right:-3px; top:-2px; height:8px; width:8px; border-radius:50%; background:var(--lp-text); }
  .lp-song-player-foot { display:flex; gap:8px; align-items:center; color:var(--lp-muted); font-size:10px; }
  .lp-song-heart { margin-left:auto; font-size:24px; color:var(--lp-accent); }
  .lp-song-waves { display:flex; height:12px; gap:2px; align-items:center; color:var(--lp-accent); }
  .lp-song-waves i { width:3px; height:45%; border-radius:2px; background:currentColor; }.lp-song-waves i:nth-child(2n){height:100%}.lp-song-waves i:nth-child(3){height:75%}
  .lp-song-status { margin:0; color:var(--lp-muted); font-size:12px; line-height:1.5; overflow-wrap:anywhere; }.lp-song-status:empty { display:none; }
  .lp-song-source { margin:0; text-align:center; color:var(--lp-muted); font-size:10px; line-height:1.5; }
  .lp-song-player .lp-song-share { width:100%; min-height:46px; border-radius:24px; font-size:13px; }
  .lp-share-dialog { color:var(--lp-text); background:var(--lp-bg); font:400 13px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif; }
  .lp-share-dialog *, .lp-pocket-share * { box-sizing:border-box; }
  .lp-share-dialog .lp-settings-section { display:block; }
  .lp-spotify-sheet { display:grid; gap:18px; min-width:0; }
  .lp-share-intro { margin:0; color:var(--lp-muted); font:italic 17px/1.4 Georgia,serif; }
  .lp-share-dialog .lp-field { display:grid; gap:8px; margin:0; }
  .lp-share-dialog .lp-field-label { font-size:12px; color:var(--lp-text); }
  .lp-share-dialog :is(.lp-select,.lp-textarea) { width:100%; min-height:44px; padding:12px 14px; border:1px solid var(--lp-border); border-radius:14px; background:var(--lp-surface); color:var(--lp-text); font:inherit; }
  .lp-share-dialog .lp-textarea { min-height:74px; resize:vertical; }
  .lp-share-dialog .lp-copy { margin:0; font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif; color:var(--lp-muted); }
  .lp-share-dialog .lp-button-primary { width:100%; min-height:46px; border:0; border-radius:23px; background:var(--lp-outgoing,#544493); color:#fff; font-weight:700; }
  .lp-share-dialog :is(button,input,select,textarea):focus-visible,.lp-pocket-share :is(button,input,select,textarea):focus-visible,.lp-song-player button:focus-visible { outline:2px solid var(--lp-accent); outline-offset:3px; }
  .lp-spotify-card { display:grid; grid-template-columns:70px minmax(0,1fr); gap:12px; padding:14px; margin-bottom:0; border:1px solid var(--lp-border); border-radius:18px; background:color-mix(in srgb,var(--lp-accent) 7%,var(--lp-bg)); color:var(--lp-text); font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif; white-space:normal; overflow-wrap:anywhere; }
  .lp-spotify-cover { position:relative; width:70px; height:70px; overflow:hidden; border-radius:9px; box-shadow:0 4px 10px #0002; }
  .lp-spotify-cover .lp-record-edition { display:none; }.lp-spotify-cover .lp-record-label { font-size:11px; }.lp-spotify-cover .lp-record-heart { font-size:7px; border-width:2px; }
  .lp-spotify-cover .lp-spotify-art { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:0; }
  .lp-spotify-copy { display:grid; align-content:center; gap:4px; min-width:0; }.lp-spotify-copy .lp-share-eyebrow { font-size:8px; letter-spacing:.1em; color:var(--lp-accent); }
  .lp-spotify-title { font-size:14px; line-height:1.35; }.lp-spotify-card .lp-copy { color:var(--lp-muted); font-size:11px; margin:0; }
  .lp-spotify-card .lp-spotify-lyrics,.lp-spotify-note { grid-column:1 / -1; }
  .lp-spotify-lyrics { margin:0; max-height:240px; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; font:inherit; line-height:1.7; }
  .lp-spotify-note { margin:0; padding-top:10px; border-top:1px dashed var(--lp-border); }
  .lp-spotify-line-list { display:grid; gap:10px; min-width:0; padding:14px 0 0; margin:0; border:0; border-top:1px solid var(--lp-border); }
  .lp-spotify-line-list legend { padding:0 8px 0 0; font-weight:700; font-size:13px; color:var(--lp-text); }
  .lp-spotify-line-scroll { display:grid; grid-auto-rows:max-content; align-content:start; gap:7px; max-height:min(32dvh,270px); overflow:auto; overscroll-behavior:contain; padding:3px; scrollbar-width:thin; scrollbar-color:var(--lp-accent) transparent; }
  .lp-spotify-line { display:grid; grid-template-columns:18px 22px minmax(0,1fr); align-items:start; gap:9px; min-height:44px; padding:12px 10px; margin:0; border:1px solid var(--lp-border); border-radius:12px; background:var(--lp-surface); color:var(--lp-text); cursor:pointer; font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif; }
  .lp-spotify-line:has(:checked) { border-color:var(--lp-accent); background:color-mix(in srgb,var(--lp-accent) 14%,var(--lp-bg)); }.lp-spotify-line:has(:focus-visible) { outline:2px solid var(--lp-accent); outline-offset:1px; }
  .lp-spotify-line input { appearance:auto; width:17px; height:17px; margin:3px 0 0; accent-color:var(--lp-accent); }
  .lp-spotify-line-number { color:var(--lp-muted); font:10px/2.1 ui-monospace,monospace; }.lp-spotify-line-text { display:block; min-width:0; white-space:pre-wrap; overflow-wrap:anywhere; }
  .lp-spotify-line:has(:disabled) { opacity:.5; cursor:default; }
  .lp-spotify-sheet [hidden] { display:none !important; }
  .lp-share-send { display:grid; gap:9px; }.lp-share-send > [role=status] { min-height:18px; margin:0; font-size:11px; line-height:1.5; color:var(--lp-muted); }.lp-share-send > [role=status]:empty { display:none; }
  .lp-share-send > button { width:100%; }
  .lp-spotify-sheet > .lp-share-send { position:sticky; bottom:0; z-index:2; padding:12px 0 2px; border-top:1px solid var(--lp-border); background:var(--lp-bg); }
  .lp-pocket-share { display:grid; gap:20px; min-width:0; }
  .lp-clippings-hero { display:grid; grid-template-columns:minmax(0,1fr) 90px; align-items:center; gap:16px; padding:6px 0 14px; border-bottom:1px dashed var(--lp-border); }
  .lp-clippings-hero h2 { margin:9px 0; max-width:220px; font:italic 700 27px/1.1 Georgia,serif; letter-spacing:-.035em; color:var(--lp-text); }
  .lp-clippings-hero p { margin:0; color:var(--lp-muted); font-size:12px; line-height:1.6; }
  .lp-clippings-art { position:relative; height:105px; }
  .lp-clippings-art > span { position:absolute; display:grid; place-items:center; width:70px; height:85px; padding:10px; border:4px solid #fff4dd; border-bottom-width:15px; border-radius:3px; box-shadow:0 5px 9px #0002; }
  .lp-clipping-back { top:2px; left:0; transform:rotate(-14deg); background:#c9e0d5; color:#41634f; font:35px Georgia,serif; }
  .lp-clipping-front { top:15px; right:0; transform:rotate(10deg); background:#eec5d4; color:#6b3b50; white-space:pre-line; text-align:center; font:italic 700 12px/1.3 Georgia,serif; }
  .lp-clipping-front::before { content:''; position:absolute; top:-10px; width:30px; height:12px; background:#f2dca9c9; transform:rotate(-8deg); }
  .lp-clipping-pickers { display:grid; gap:14px; }
  .lp-pocket-share .lp-pocket-share-choices { display:grid; gap:12px; min-width:0; padding:0; margin:0; border:0; }
  .lp-pocket-share-choices legend { padding:0; font:650 13px/1.5 ui-sans-serif,system-ui,sans-serif; color:var(--lp-text); }
  .lp-clipping-toolbar { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:7px; }
  .lp-selection-count { color:var(--lp-accent); font:650 11px/1.5 ui-sans-serif,system-ui,sans-serif; }
  .lp-share-clear { padding:5px 10px; min-height:32px; border:1px solid var(--lp-border); border-radius:16px; background:transparent; color:var(--lp-muted); font:inherit; font-size:11px; cursor:pointer; }
  .lp-clipping-list { display:grid; grid-auto-rows:max-content; align-content:start; gap:8px; max-height:290px; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:var(--lp-accent) transparent; padding:3px; }
  .lp-clipping-choice { display:grid; grid-template-columns:16px 27px minmax(0,1fr); gap:10px; align-items:start; padding:12px; border:1px solid var(--lp-border); border-radius:15px; background:color-mix(in srgb,var(--lp-text) 3%,var(--lp-bg)); cursor:pointer; }
  .lp-clipping-choice:has(:checked) { border-color:var(--lp-accent); background:color-mix(in srgb,var(--lp-accent) 10%,var(--lp-bg)); }.lp-clipping-choice:has(:focus-visible) { outline:2px solid var(--lp-accent); outline-offset:1px; }
  .lp-clipping-choice input { appearance:auto; width:16px; height:16px; margin:5px 0 0; accent-color:var(--lp-accent); }
  .lp-clipping-avatar { display:grid; place-items:center; width:27px; height:27px; border-radius:9px; background:color-mix(in srgb,var(--lp-accent) 17%,var(--lp-bg)); color:var(--lp-accent); font:650 11px/1 ui-sans-serif,system-ui,sans-serif; }
  .lp-clipping-copy { display:grid; gap:4px; min-width:0; white-space:pre-wrap; overflow-wrap:anywhere; font-size:12px; line-height:1.6; }.lp-clipping-copy strong { font-size:11px; color:var(--lp-muted); }
  .lp-clipping-choice:has(:disabled) { opacity:.5; cursor:default; }
  .lp-pocket-share-preview { display:grid; gap:14px; min-width:0; padding:18px; border:1px dashed color-mix(in srgb,var(--lp-accent) 35%,var(--lp-border)); border-radius:20px; background:color-mix(in srgb,var(--lp-accent) 4%,var(--lp-bg)); }
  .lp-clipping-empty { display:grid; gap:8px; justify-items:center; padding:12px 4px; text-align:center; font-size:12px; }.lp-clipping-empty > span { font-size:24px; color:var(--lp-accent); }.lp-clipping-empty p { margin:0; color:var(--lp-muted); font-size:11px; }
  .lp-share-disclaimer { margin:0; text-align:center; color:var(--lp-muted); font-size:10px; line-height:1.5; }
  .lp-shared-capture { position:relative; display:grid; gap:12px; min-width:0; padding:16px; border:1px solid var(--lp-border); border-radius:4px 4px 15px 15px; background:color-mix(in srgb,var(--lp-accent) 6%,var(--lp-bg)); color:var(--lp-text); font:400 12px/1.6 ui-sans-serif,system-ui,sans-serif; white-space:normal; overflow-wrap:anywhere; box-shadow:0 3px 0 color-mix(in srgb,var(--lp-accent) 14%,var(--lp-bg)); }
  .lp-shared-capture::before { content:''; position:absolute; left:35%; right:35%; top:-5px; height:9px; background:color-mix(in srgb,var(--lp-accent) 35%,var(--lp-surface)); transform:rotate(-2deg); }
  .lp-shared-capture-heading { display:flex; gap:8px; align-items:center; padding-bottom:10px; border-bottom:1px dashed var(--lp-border); font-size:10px; color:var(--lp-muted); }.lp-shared-capture-mark { color:var(--lp-accent); font-size:17px; }
  .lp-shared-capture-row { display:grid; gap:4px; }.lp-shared-capture-row > strong { font-size:10px; color:var(--lp-muted); }.lp-shared-capture-row p { margin:0; white-space:pre-wrap; }.lp-shared-capture-photo { font-style:italic; }
  .lp-shared-capture-caption { margin:0; padding-top:10px; border-top:1px dashed var(--lp-border); white-space:pre-wrap; font-style:italic; }
  .lp-reference-dialog .lp-reference-sheet { display:grid; gap:18px; }
  .lp-reference-intro { display:flex; gap:12px; align-items:center; padding-left:6px; }
  .lp-reference-intro p { margin:0; max-width:280px; font:italic 700 24px/1.2 Georgia,serif; letter-spacing:-.025em; }
  .lp-reference-intro-mark { display:grid; place-items:center; flex:none; width:46px; height:54px; border-radius:6px; border:1px solid color-mix(in srgb,var(--lp-accent) 40%,var(--lp-border)); color:var(--lp-accent); background:color-mix(in srgb,var(--lp-accent) 12%,var(--lp-bg)); font-size:28px; transform:rotate(-8deg); box-shadow:3px 3px 0 color-mix(in srgb,var(--lp-accent) 8%,var(--lp-bg)); }
  .lp-reference-modes,.lp-reference-selection { display:grid; gap:10px; min-width:0; margin:0; padding:0; border:0; }
  .lp-reference-modes > legend,.lp-reference-selection > legend { margin-bottom:10px; padding:0; font-size:12px; font-weight:700; color:var(--lp-text); }
  .lp-reference-dialog .lp-reference-scope { display:grid; grid-template-columns:18px minmax(0,1fr); gap:12px; padding:14px; margin:0; min-height:64px; border:1px solid var(--lp-border); border-radius:15px; background:var(--lp-surface); font-size:13px; line-height:1.5; }
  .lp-reference-scope:has(:checked) { border-color:var(--lp-accent); background:color-mix(in srgb,var(--lp-accent) 12%,var(--lp-bg)); }.lp-reference-scope:has(:focus-visible) { outline:2px solid var(--lp-accent); outline-offset:2px; }
  .lp-reference-dialog .lp-reference-scope input { appearance:auto; width:17px; height:17px; margin:3px 0 0; accent-color:var(--lp-accent); }
  .lp-reference-dialog .lp-reference-scope .lp-grow { display:grid; gap:4px; }
  .lp-reference-dialog .lp-reference-message-list { max-height:260px; padding:3px; border:0; background:none; }
  .lp-reference-dialog .lp-reference-message-choice { display:grid; grid-template-columns:16px 27px minmax(0,1fr); padding:12px; }
  .lp-reference-dialog [hidden] { display:none !important; }
  .lp-reference-scope,.lp-clipping-choice,.lp-spotify-line { -webkit-tap-highlight-color:transparent; }
  .lp-reference-footer { position:sticky; bottom:0; z-index:1; padding:12px 0 0; border-top:1px solid var(--lp-border); background:var(--lp-bg); }
  @media (max-width:380px) { .lp-share-dialog .lp-spotify-card { grid-template-columns:58px minmax(0,1fr); padding:12px; }.lp-share-dialog .lp-spotify-cover { width:58px; height:58px; } }
`
