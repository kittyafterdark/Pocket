export const TUMBLR_STYLES = `
  .lumiphone-shell .lp-social-page-tumblr { position:relative; }
  .lp-social-page-tumblr:not([data-social-discussion="true"]) > .lp-content > .lp-social-feed { padding-bottom:90px; }
  .lp-tumblr-floating-compose { position:absolute; z-index:8; right:17px; bottom:68px; display:grid; place-items:center; width:52px; height:52px; min-height:52px; padding:13px; border:0; border-radius:50%; background:var(--social-accent); color:#001935; box-shadow:0 5px 20px #0005; }
  .lp-tumblr-floating-compose .lp-social-glyph { width:27px; height:27px; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-tumblr-floating-compose { background:#c13de6; color:#08070d; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-tumblr-floating-compose .lp-social-glyph { color:inherit; }
  .lp-social-page-tumblr .lp-social-bottomnav { padding-inline:14px; }
  .lp-social-page-tumblr .lp-social-bottomnav [aria-pressed="true"] .lp-social-glyph { color:var(--social-accent); }
  .lp-tumblr-hub { min-height:100%; }
  .lp-tumblr-hub-tabs { position:sticky; top:0; z-index:5; display:flex; justify-content:center; gap:9px; padding:22px 16px; background:var(--social-bg); }
  .lp-tumblr-hub-pill { appearance:none; padding:12px 22px; min-height:44px; border:0; border-radius:30px; background:color-mix(in srgb,var(--social-text) 10%,var(--social-bg)); color:var(--social-text); font:650 13px/1.2 system-ui,sans-serif; cursor:pointer; }
  .lp-tumblr-hub-pill[aria-selected="true"] { background:var(--social-accent); color:#001935; }
  .lp-social-page-tumblr .lp-social-wordmark.lp-tumblr-hub-title { position:static !important; transform:none !important; font:700 17px/1.2 system-ui,sans-serif; letter-spacing:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-tumblr-activity > h2 { margin:0; padding:14px 18px; border-block:1px solid var(--social-border); color:var(--social-muted); font-size:12px; }
  .lp-tumblr-activity-row { appearance:none; display:flex; align-items:flex-start; gap:12px; width:100%; padding:18px 16px; border:0; border-bottom:1px solid var(--social-border); background:transparent; color:var(--social-text); text-align:left; font:inherit; cursor:pointer; }
  .lp-tumblr-activity-row > .lp-social-avatar { width:39px; height:39px; border-radius:6px; }
  .lp-tumblr-activity-copy { flex:1; min-width:0; font-size:12px; line-height:1.5; }
  .lp-tumblr-activity-copy strong { display:block; overflow-wrap:anywhere; font-size:13px; color:var(--social-accent); }
  .lp-tumblr-activity-copy > span { color:var(--social-muted); }
  .lp-tumblr-activity-copy p { margin:5px 0; overflow-wrap:anywhere; }
  .lp-tumblr-activity-copy time { color:var(--social-muted); font-size:10px; }
  .lp-tumblr-activity-preview { flex:none; width:43px; height:43px; border-radius:5px; overflow:hidden; background:color-mix(in srgb,var(--social-accent) 25%,var(--social-bg)); display:grid; place-items:center; font-size:21px; font-weight:700; }
  .lp-tumblr-activity-preview img { width:100%; height:100%; object-fit:cover; }
  .lp-tumblr-view-empty { margin:30px 24px; color:var(--social-muted); font-size:13px; line-height:1.6; text-align:center; }
  .lp-tumblr-explore-hero { position:relative; isolation:isolate; padding:23px 18px 42px; min-height:175px; display:flex; flex-direction:column; justify-content:space-between; gap:32px; background:var(--lp-wallpaper); background-size:cover; background-position:center; border-bottom:1px solid var(--social-border); }
  .lp-tumblr-explore-hero::before { content:''; position:absolute; inset:0; z-index:-1; background:linear-gradient(180deg,#001935b3,#00193540); }
  .lp-tumblr-explore-hero h2 { color:#fff; margin:0; font-size:20px; text-shadow:0 1px 10px #0005; }
  .lp-tumblr-search-form { display:flex; align-items:center; gap:8px; }
  .lp-tumblr-search-form > label { min-width:0; display:flex; align-items:center; gap:10px; flex:1; background:#fff; color:#59626d; border-radius:26px; padding:0 14px; min-height:46px; }
  .lumiphone-shell .lp-social-page .lp-tumblr-search-form input { min-width:0; width:100%; padding:12px 0; border:0; background:transparent; color:#24313d; font:14px/1.4 system-ui,sans-serif; box-shadow:none; }
  .lp-tumblr-search-form > label:focus-within { outline:2px solid var(--social-accent); outline-offset:3px; }
  .lumiphone-shell .lp-social-page .lp-tumblr-search-form input:focus-visible { outline:none; }
  .lp-tumblr-search-submit { border:0; border-radius:23px; min-height:44px; padding:10px 14px; background:var(--social-accent); color:#001935; font:700 12px/1 system-ui,sans-serif; cursor:pointer; }
  .lp-tumblr-search-heading { font-size:16px; margin:23px 16px 12px; }
  .lp-tumblr-trending-tag { padding:0 0 20px; }
  .lp-tumblr-tag-link { display:flex; align-items:center; gap:10px; padding:10px 16px; min-height:44px; width:100%; border:0; background:transparent; color:var(--social-text); font:15px/1.3 system-ui,sans-serif; text-align:left; cursor:pointer; }
  .lp-tumblr-tag-link strong { overflow-wrap:anywhere; }
  .lp-tumblr-trend-number { display:grid; place-items:center; flex:none; width:24px; height:24px; font-size:11px; background:var(--social-accent); color:#001935; border-radius:50%; }
  .lp-tumblr-trending-tag:nth-child(3n) .lp-tumblr-trend-number { background:#eb5fc1; }
  .lp-tumblr-trending-tag:nth-child(3n+1) .lp-tumblr-trend-number { background:#f5ba67; }
  .lp-tumblr-explore-rail { display:flex; gap:8px; padding:7px 16px; overflow:auto; scrollbar-width:thin; }
  .lp-tumblr-explore-tile { position:relative; width:132px; height:148px; flex:none; padding:0; border:0; border-radius:7px; background:color-mix(in srgb,var(--social-accent) 20%,var(--social-bg)); color:var(--social-text); overflow:hidden; cursor:pointer; text-align:left; }
  .lp-tumblr-explore-tile:nth-child(2n) { background:color-mix(in srgb,#a856aa 25%,var(--social-bg)); }
  .lp-tumblr-explore-tile img { width:100%; height:100%; object-fit:cover; display:block; }
  .lp-tumblr-tile-text { display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden; margin:12px 10px 30px; font:12px/1.4 system-ui,sans-serif; }
  .lp-tumblr-explore-tile small { position:absolute; inset:auto 0 0; display:block; padding:8px; background:#001935d9; color:#fff; font-size:9px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; }
  .lumiphone-shell .lp-social-page-tumblr[data-social-dm-view="thread"] > .lp-content { display:flex; flex-direction:column; overflow:hidden; }
  .lp-tumblr-dms { min-height:0; background:var(--social-bg); }
  [data-social-dm-view="thread"] .lp-tumblr-dms { display:flex; flex:1; flex-direction:column; overflow:hidden; }
  .lp-social-page-tumblr .lp-social-wordmark.lp-tumblr-recipient { position:static; transform:none; max-width:100%; overflow:hidden; letter-spacing:0; font:700 13px/1.2 system-ui,sans-serif; }
  .lp-tumblr-recipient { display:flex; align-items:center; gap:10px; font:700 13px/1.2 system-ui,sans-serif; }
  .lp-tumblr-recipient > .lp-social-avatar { width:32px; height:32px; border-radius:5px; }
  .lp-tumblr-recipient > span:not(.lp-social-avatar) { display:grid; gap:3px; min-width:0; }
  .lp-tumblr-recipient strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-tumblr-recipient small { color:var(--social-muted); font-size:10px; font-weight:400; }
  .lp-tumblr-inbox-heading { font-size:15px; margin:12px 16px; }
  .lp-tumblr-inbox-list { padding:0 16px; }
  .lp-tumblr-inbox-account { display:flex; align-items:center; gap:12px; width:100%; min-height:78px; padding:12px 0; border:0; border-bottom:1px solid var(--social-border); background:transparent; color:var(--social-text); text-align:left; cursor:pointer; }
  .lp-tumblr-inbox-account > .lp-social-avatar { width:45px; height:45px; border-radius:7px; }
  .lp-tumblr-inbox-account > span:not(.lp-social-avatar) { flex:1; min-width:0; display:grid; gap:6px; font-size:13px; }
  .lp-tumblr-inbox-account span span { font-size:11px; color:var(--social-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-tumblr-dm-log { flex:1; min-height:0; overflow:auto; overscroll-behavior:contain; display:flex; flex-direction:column; gap:15px; padding:20px 14px; }
  .lp-tumblr-dm-intro { display:grid; justify-items:center; gap:10px; text-align:center; padding:24px 10px; font-size:14px; }
  .lp-tumblr-dm-intro p { font-size:12px; color:var(--social-muted); }
  .lp-tumblr-dm-row { display:flex; align-items:flex-end; gap:7px; width:100%; }
  .lp-tumblr-dm-row-owner { justify-content:flex-end; }
  .lp-tumblr-dm-row > .lp-social-avatar { width:25px; height:25px; margin-bottom:16px; border-radius:4px; }
  .lp-tumblr-dm-message { max-width:82%; min-width:0; }
  .lp-tumblr-dm-bubble { margin:0; border-radius:14px; padding:11px 13px; font:13px/1.5 system-ui,sans-serif; overflow-wrap:anywhere; white-space:pre-wrap; }
  .lp-tumblr-dm-account { background:color-mix(in srgb,var(--social-text) 10%,var(--social-bg)); color:var(--social-text); border-bottom-left-radius:4px; }
  .lp-tumblr-dm-owner { background:var(--social-accent); color:#001935; border-bottom-right-radius:4px; }
  .lp-tumblr-dm-time { display:block; color:var(--social-muted); font-size:9px; margin:4px 5px 0; }
  .lp-tumblr-dm-row-owner .lp-tumblr-dm-time { text-align:right; }
  .lp-tumblr-typing { margin:0 14px 8px; font-size:11px; color:var(--social-muted); }
  .lp-tumblr-dm-compose { display:flex; align-items:flex-end; gap:10px; padding:10px 14px 14px; background:var(--social-bg); border-top:1px solid var(--social-border); }
  .lp-tumblr-dm-compose > label { min-width:0; flex:1; }
  .lumiphone-shell .lp-social-page .lp-tumblr-dm-compose textarea { min-height:42px; max-height:120px; border-radius:20px; padding:11px 14px; resize:none; }
  .lp-tumblr-dm-compose .lp-social-primary { align-self:center; min-height:38px; background:var(--social-accent); color:#001935; }
`
