import { TUMBLR_STYLES } from './tumblr-styles.js'
import { DISCORD_CHAT_STYLES } from './discord-chat-styles.js'
import { DISCORD_PEOPLE_STYLES } from './discord-people-styles.js'

export const SOCIAL_STYLES = `
  .lumiphone-shell .lp-social-page { --social-bg:#000; --social-surface:#000; --social-text:#e7e9ea; --social-muted:#8b98a5; --social-border:#2f3336; --social-accent:#1d9bf0; --lp-bg:var(--social-bg); --lp-surface:var(--social-surface); --lp-text:var(--social-text); --lp-muted:var(--social-muted); --lp-border:var(--social-border); display:flex; flex-direction:column; min-height:0; height:100%; overflow:hidden; background:var(--social-bg); color:var(--social-text); }
  .lumiphone-shell[data-theme="porcelain"] .lp-social-page,.lumiphone-shell[data-theme="pink"] .lp-social-page { --social-bg:#fff; --social-surface:#fff; --social-text:#0f1419; --social-muted:#536471; --social-border:#e5e9ed; }
  .lumiphone-shell .lp-social-page .lp-social-app-header { position:relative; flex:none; display:grid; grid-template-columns:44px minmax(0,1fr) 44px; min-height:52px; height:52px; padding:3px 10px; border-bottom:1px solid var(--social-border); gap:4px; background:var(--social-bg); color:var(--social-text); backdrop-filter:none; }
  .lumiphone-shell .lp-social-page .lp-nav-title { min-width:0; overflow:visible; line-height:1; }
  .lp-social-back { display:grid; place-items:center; color:var(--social-text); }
  .lp-social-wordmark { font-size:22px; font-weight:800; letter-spacing:-.04em; }
  .lp-social-wordmark > .lp-social-glyph { width:27px; height:27px; color:#1d9bf0; margin:auto; }
  .lp-social-toolbar { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; }
  .lumiphone-shell .lp-content.lp-social { flex:1; min-height:0; display:block; padding:0; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; background:var(--social-bg); }
  .lp-social-button,.lp-social-primary { appearance:none; border:0; background:transparent; color:inherit; font:inherit; font-size:12px; padding:8px 12px; min-height:40px; cursor:pointer; }
  .lp-social-glyph { display:inline-grid; place-items:center; width:21px; height:21px; flex:none; vertical-align:middle; }
  .lp-social-glyph svg { display:block; width:100%; height:100%; }
  .lp-social-icon-button { display:inline-flex; justify-content:center; align-items:center; gap:5px; padding:7px; width:40px; height:40px; }
  .lp-social-refresh { color:var(--social-text); }
  .lp-social-page button:disabled { opacity:.4; cursor:default; }
  .lp-social-page :is(button,input,textarea,select,summary):focus-visible { outline:2px solid var(--social-accent); outline-offset:-2px; }
  .lp-social-page [hidden] { display:none !important; }
  .lp-social-status { position:sticky; top:0; z-index:7; margin:0; padding:6px 12px; text-align:center; background:color-mix(in srgb,var(--social-accent) 15%,var(--social-bg)); color:var(--social-text); font-size:10px; line-height:1.5; }
  .lp-social-status:empty { display:none; }
  .lp-social-error { margin:8px 12px; border-left:3px solid #f36b7f; padding:10px 12px; background:#8d294022; font-size:12px; }
  .lp-social-stop { background:#e5484d; color:#fff; min-height:28px; padding:4px 14px; float:right; position:relative; z-index:10; }
  .lp-social-filters { display:flex; position:sticky; top:0; z-index:4; background:var(--social-bg); border-bottom:1px solid var(--social-border); }
  .lp-social-filters .lp-social-button { flex:1; position:relative; border:0; border-radius:0; height:48px; min-width:0; color:var(--social-muted); font-weight:650; }
  .lp-social-filters [aria-pressed="true"] { color:var(--social-text); }
  .lp-social-filters [aria-pressed="true"]::after { content:''; position:absolute; left:24%; right:24%; bottom:0; height:4px; border-radius:4px; background:var(--social-accent); }
  .lp-social-bottomnav { flex:none; display:flex; height:53px; align-items:center; justify-content:space-around; background:var(--social-bg); border-top:1px solid var(--social-border); color:var(--social-text); padding:2px 16px; }
  .lp-social-bottomnav .lp-social-icon-button { min-width:50px; }
  .lp-social-bottomnav [aria-pressed="true"] .lp-social-glyph { color:var(--social-accent); }
  .lp-social-bottomnav .lp-social-create { border-radius:50%; background:var(--social-accent); color:#fff; width:39px; min-width:39px; height:39px; }
  .lp-social-profile { display:block; min-width:0; border-bottom:1px solid var(--social-border); }
  .lp-social-compose-disclosure > summary { display:flex; align-items:center; gap:12px; list-style:none; padding:15px 16px; border-bottom:1px solid var(--social-border); cursor:pointer; font-size:14px; color:var(--social-muted); }
  .lp-social-compose-disclosure > summary::-webkit-details-marker { display:none; }
  .lp-social-compose-disclosure > summary .lp-social-glyph { color:var(--social-accent); }
  .lp-social-compose { display:grid; gap:10px; padding:15px 16px; background:var(--social-surface); border-bottom:1px solid var(--social-border); min-width:0; }
  .lp-social-compose-title { color:var(--social-muted); font-size:11px; }
  .lp-social-field { display:grid; gap:5px; min-width:0; font-size:11px; color:var(--social-muted); }
  .lumiphone-shell .lp-social-page .lp-social-field :is(input,textarea,select) { width:100%; min-width:0; min-height:38px; padding:9px 10px; border-radius:6px; font-size:13px; border:1px solid var(--social-border); background:var(--social-bg); color:var(--social-text); }
  .lp-social-field textarea { resize:vertical; min-height:70px; line-height:1.5; }
  .lp-social-compose-footer { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .lp-social-count { font-size:10px; color:var(--social-muted); }
  .lp-social-primary { min-width:66px; min-height:35px; border-radius:20px; background:var(--social-accent); color:#fff; font-weight:700; }
  .lp-social-media summary,.lp-social-server-create summary { cursor:pointer; font-size:12px; padding:9px 0; color:var(--social-muted); }
  .lp-social-media[open] > :not(summary) { margin-top:8px; }
  .lp-social-photo-picker { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
  .lp-social-photo-picker button { padding:2px; height:auto; border:2px solid transparent; border-radius:6px; }
  .lp-social-photo-picker [aria-pressed="true"] { border-color:var(--social-accent); }
  .lp-social-photo-picker img { width:100%; aspect-ratio:1; object-fit:cover; display:block; border-radius:3px; }
  .lp-social-feed { min-width:0; }
  .lp-social-post { min-width:0; padding:13px 14px 8px; background:var(--social-surface); border-bottom:1px solid var(--social-border); overflow:hidden; }
  .lp-social-post-heading { display:flex; align-items:center; gap:10px; min-width:0; }
  .lp-social-avatar { width:36px; height:36px; flex:none; border-radius:50%; display:grid; place-items:center; background:linear-gradient(145deg,#6b8d9c,#354a58); color:#fff; font-size:16px; font-weight:600; }
  .lp-social-avatar { position:relative; overflow:hidden; }
  .lp-social-avatar > img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .lp-social-post-identity { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 6px; flex:1; min-width:0; }
  .lp-social-post-identity strong { font-size:12px; font-weight:700; overflow-wrap:anywhere; }
  .lp-social-post-identity span,.lp-social-post-heading time { font-size:10px; color:var(--social-muted); overflow-wrap:anywhere; }
  .lp-social-post-heading time { flex:none; font-size:9px; }
  .lp-social-post-text { margin:5px 0 8px; font-size:13px; line-height:1.5; white-space:pre-wrap; overflow-wrap:anywhere; }
  .lp-social-post-body { min-width:0; }
  .lp-social-twitter .lp-social-post-body { margin-left:46px; margin-top:-12px; padding-top:0; }
  .lp-social-twitter .lp-social-post-heading { align-items:flex-start; }
  .lp-social-twitter .lp-social-post-identity { padding-top:1px; }
  .lp-social-twitter .lp-social-post-text { margin-top:0; font-size:15px; line-height:1.5; }
  .lp-social-twitter .lp-social-post-identity strong { font-size:14px; }
  .lp-social-twitter .lp-social-post-identity span,.lp-social-twitter .lp-social-post-heading time { font-size:11px; }
  .lp-social-post-actions { display:flex; align-items:center; justify-content:space-between; gap:3px; margin-top:6px; color:var(--social-muted); }
  .lp-social-post-actions .lp-social-icon-button { width:auto; min-width:30px; min-height:31px; height:31px; padding:5px; }
  .lp-social-post-actions .lp-social-glyph { width:18px; height:18px; }
  .lp-social-action-count { font-size:10px; }
  .lp-social-like[aria-pressed="true"] { color:#f91880; }
  .lp-social-like[aria-pressed="true"] svg { fill:currentColor; }
  .lp-social-quote { margin:8px 0; padding:10px 12px; border:1px solid var(--social-border); border-radius:12px; overflow-wrap:anywhere; font-size:11px; }
  .lp-social-quote p { white-space:pre-wrap; margin:5px 0 0; line-height:1.5; }
  .lp-social-reblog-label { display:block; margin-top:6px; font-size:10px; color:var(--social-muted); }
  .lp-social-photo { display:block; width:100%; max-height:420px; object-fit:contain; border-radius:12px; margin:9px 0; background:var(--social-bg); }
  .lp-social-photo-description { margin:10px 0; display:grid; align-content:center; justify-items:center; gap:10px; min-height:150px; padding:24px; border:1px solid var(--social-border); border-radius:8px; background:color-mix(in srgb,var(--social-text) 5%,var(--social-bg)); text-align:center; font-size:13px; line-height:1.6; overflow-wrap:anywhere; }
  .lp-social-photo-description > .lp-social-glyph { width:28px; height:28px; opacity:.5; }
  .lp-social-photo-description > span:not(.lp-social-glyph) { font-size:8px; letter-spacing:.14em; color:var(--social-muted); }
  .lp-social-tags { font-size:11px; color:var(--social-muted); line-height:1.6; margin:8px 0; overflow-wrap:anywhere; }
  .lp-social-empty { padding:48px 26px; text-align:center; }
  .lp-social-empty strong { font-size:22px; font-weight:800; letter-spacing:-.04em; } .lp-social-empty p { margin:12px auto 0; max-width:250px; font-size:13px; line-height:1.6; color:var(--social-muted); }

  /* Instagram: black/white chrome, large unframed media, actions before caption. */
  .lumiphone-shell .lp-social-page-instagram { --social-accent:#0095f6; }
  .lp-social-page-instagram .lp-social-wordmark { font:700 26px/1 'Segoe Script','Brush Script MT',cursive; letter-spacing:-1.4px; }
  .lp-social-instagram .lp-social-filters { display:none; }
  .lp-social-instagram .lp-social-compose-disclosure > summary { font-size:12px; padding:12px 15px; }
  .lp-social-instagram .lp-social-post { padding:0; border:0; margin-bottom:18px; }
  .lp-social-instagram .lp-social-post-heading { padding:12px 14px; }
  .lp-social-instagram .lp-social-avatar { width:29px; height:29px; outline:2px solid #d65087; outline-offset:2px; border:2px solid var(--social-bg); }
  .lp-social-instagram .lp-social-post-identity span { display:none; }
  .lp-social-instagram .lp-social-post-identity strong { font-size:13px; }
  .lp-social-instagram .lp-social-caption strong { font-size:13px; }
  .lp-social-instagram .lp-social-post-heading time { font-size:9px; }
  .lp-social-instagram .lp-social-post-body { display:flex; flex-direction:column; }
  .lp-social-instagram .lp-social-photo,.lp-social-instagram .lp-social-photo-description { order:0; width:100%; margin:0; border-radius:0; border:0; aspect-ratio:1; min-height:0; max-height:none; object-fit:cover; }
  .lp-social-instagram .lp-social-photo-description { padding:32px; background:linear-gradient(145deg,color-mix(in srgb,var(--social-text) 7%,var(--social-bg)),var(--social-bg)); }
  .lp-social-instagram .lp-social-post-actions { order:1; justify-content:flex-start; padding:8px 10px 0; margin:0; gap:5px; color:var(--social-text); }
  .lp-social-instagram .lp-social-post-actions .lp-social-glyph { width:23px; height:23px; }
  .lp-social-instagram .lp-social-post-actions [aria-label^="Delete"] { margin-left:auto; }
  .lp-social-instagram .lp-social-caption { order:2; margin:0; padding:7px 14px 0; font-size:14px; }
  .lp-social-instagram .lp-social-tags { order:3; padding:0 14px; color:#86b9df; margin:5px 0 0; }
  .lp-social-instagram .lp-social-quote { order:0; margin:0 12px 10px; }
  .lp-social-page-instagram .lp-social-bottomnav .lp-social-create { background:transparent; color:var(--social-text); border:2px solid currentColor; border-radius:7px; width:25px; min-width:25px; height:25px; padding:2px; }
  .lp-social-page-instagram .lp-social-bottomnav [aria-pressed="true"] .lp-social-glyph { color:var(--social-text); fill:currentColor; }

  /* Tumblr: a navy dashboard holding white paper posts and visible reblog trails. */
  .lumiphone-shell .lp-social-page-tumblr,.lumiphone-shell[data-theme="porcelain"] .lp-social-page-tumblr,.lumiphone-shell[data-theme="pink"] .lp-social-page-tumblr { --social-bg:#001935; --social-surface:#001935; --social-text:#fff; --social-muted:#a7b6c6; --social-border:#ffffff22; --social-accent:#00b8ff; }
  .lp-social-page-tumblr .lp-social-wordmark { font:bold 30px/.9 Georgia,serif; letter-spacing:-1.7px; }
  .lp-social-page-tumblr .lp-social-filters .lp-social-button { height:44px; }
  .lp-social-page-tumblr .lp-social-filters [aria-pressed="true"]::after { height:2px; left:14%; right:14%; }
  .lp-social-tumblr .lp-social-compose-disclosure { margin:12px 12px 16px; }
  .lp-social-tumblr .lp-social-compose-disclosure > summary { padding:14px; background:#fff; color:#516171; border-radius:3px; font-size:13px; }
  .lp-social-tumblr .lp-social-feed { padding:0 12px 12px; }
  .lp-social-tumblr .lp-social-post { border:0; border-radius:3px; background:#fff; color:#24323e; margin-bottom:18px; padding:0; --social-muted:#687681; --social-border:#dfe4e8; --social-bg:#fff; --social-text:#24323e; }
  .lp-social-tumblr .lp-social-post-heading { padding:12px 14px; border-bottom:1px solid #e6e9ec; }
  .lp-social-tumblr .lp-social-avatar { border-radius:3px; width:31px; height:31px; }
  .lp-social-tumblr .lp-social-post-identity { display:block; } .lp-social-tumblr .lp-social-post-identity span { display:none; }
  .lp-social-tumblr .lp-social-post-body { padding:10px 16px 6px; }
  .lp-social-tumblr .lp-social-post-title { font:700 22px/1.3 system-ui,sans-serif; margin:10px 0; overflow-wrap:anywhere; }
  .lp-social-tumblr .lp-social-post-text { font:14px/1.6 system-ui,sans-serif; margin:10px 0 14px; }
  .lp-social-tumblr .lp-social-quote { border:0; border-left:3px solid #d6dce2; border-radius:0; margin:12px 0; padding:2px 0 2px 12px; }
  .lp-social-tumblr .lp-social-reblog-label { color:#687681; font-size:10px; margin:0 0 10px; }
  .lp-social-tumblr .lp-social-post-actions { justify-content:flex-end; border-top:1px solid #eceff1; padding-top:6px; color:#667580; }
  .lp-tumblr-notes { margin-right:auto; color:#687681; font-size:11px; font-weight:650; }
  .lp-social-tumblr .lp-social-compose { --social-bg:#fff; --social-surface:#fff; --social-text:#24323e; --social-muted:#687681; --social-border:#dfe4e8; background:#fff; color:#24323e; border-radius:0 0 3px 3px; }
  .lp-social-page-tumblr .lp-social-bottomnav { background:#001935; border-color:#ffffff22; }
  .lp-social-page-tumblr .lp-social-bottomnav .lp-social-create { border-radius:5px; background:#00b8ff; color:#001935; }

  /* Discord: independent server rail, channel drawer, compact chat, pinned input. */
  .lumiphone-shell .lp-social-page-discord { --social-bg:#313338; --social-surface:#313338; --social-text:#dbdee1; --social-muted:#b5bac1; --social-border:#24262b; --social-accent:#949cf7; --discord-rail:#1e1f22; --discord-panel:#2b2d31; --discord-input:#383a40; }
  .lumiphone-shell[data-theme="porcelain"] .lp-social-page-discord,.lumiphone-shell[data-theme="pink"] .lp-social-page-discord { --social-bg:#fff; --social-surface:#fff; --social-text:#313338; --social-muted:#5c6068; --social-border:#e3e5e8; --discord-rail:#e3e5e8; --discord-panel:#f2f3f5; --discord-input:#ebedef; }
  .lp-social-page-discord .lp-social-wordmark { font-size:18px; font-weight:800; letter-spacing:-.04em; }
  .lumiphone-shell .lp-content.lp-social-discord { display:grid; grid-template-columns:54px minmax(0,1fr); gap:0; overflow:hidden; }
  .lp-discord-server-rail { display:flex; flex-direction:column; align-items:center; gap:9px; padding:12px 5px; background:var(--discord-rail); min-width:0; overflow-y:auto; }
  .lp-discord-server { position:relative; width:40px; height:40px; min-height:40px; padding:0; border:0; border-radius:14px; color:var(--social-text); background:var(--discord-input); font-size:12px; font-weight:700; cursor:pointer; flex:none; }
  .lp-discord-server[aria-pressed="true"] { background:#5865f2; color:#fff; border-radius:12px; }
  .lp-discord-server[aria-pressed="true"]::before { content:''; position:absolute; left:-5px; top:8px; height:24px; width:3px; border-radius:2px; background:#fff; }
  .lp-discord-add-server { color:#3ba55d; border-radius:50%; }
  .lp-discord-main { min-width:0; min-height:0; display:flex; flex-direction:column; overflow:hidden; position:relative; }
  .lp-discord-channel-heading { min-height:46px; flex:none; display:flex; align-items:center; gap:6px; padding:0 8px; border-bottom:1px solid var(--social-border); box-shadow:0 1px 3px #0002; }
  .lp-discord-channel-heading strong { font-size:13px; font-weight:700; overflow-wrap:anywhere; }
  .lp-discord-channel-heading .lp-social-icon-button { width:32px; height:36px; color:var(--social-muted); }
  .lp-discord-channel-panel { position:absolute; inset:46px 0 0; z-index:11; padding:14px; background:var(--discord-panel); overflow:auto; }
  .lp-discord-server-name { margin:0 0 18px; font-size:17px; letter-spacing:-.03em; }
  .lp-discord-channel-panel > .lp-social-field { margin-bottom:16px; }
  .lp-discord-channel-label { display:block; font-size:9px; letter-spacing:.06em; font-weight:750; color:var(--social-muted); margin:12px 0 6px; }
  .lp-discord-channel-panel .lp-social-channels { display:grid; gap:3px; }
  .lp-discord-channel-panel .lp-social-channels .lp-social-button { text-align:left; font-size:13px; border-radius:5px; padding:8px 10px; }
  .lp-discord-channel-panel .lp-social-channels [aria-pressed="true"] { color:var(--social-text); background:color-mix(in srgb,var(--social-text) 9%,transparent); }
  .lp-discord-channel-panel .lp-social-server-create { margin-top:18px; border-top:1px solid var(--social-border); }
  .lp-discord-channel-panel .lp-social-compose { padding:5px 0; border:0; }
  .lp-discord-messages { flex:1; min-height:0; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; }
  .lp-social-discord .lp-social-post { padding:12px 11px 4px; border:0; background:transparent; overflow:visible; }
  .lp-social-discord .lp-social-post-heading { align-items:flex-start; gap:8px; }
  .lp-social-discord .lp-social-avatar { width:30px; height:30px; background:#5865f2; font-size:13px; }
  .lp-social-discord .lp-social-post-identity span { display:none; }
  .lp-social-discord .lp-social-post-identity strong { color:#aab0ff; font-size:13px; }
  .lp-social-discord .lp-social-post-heading time { font-size:8px; padding-top:3px; }
  .lp-social-discord .lp-social-post-body { margin-left:38px; margin-top:-11px; }
  .lp-social-discord .lp-social-post-text { margin:0; font-size:14px; line-height:1.5; }
  .lp-social-discord .lp-social-post-actions { justify-content:flex-start; gap:4px; margin-top:1px; opacity:.65; }
  .lp-social-discord .lp-social-post-actions .lp-social-icon-button { height:26px; min-height:26px; padding:3px; }
  .lp-social-discord .lp-social-post-actions .lp-social-glyph { width:14px; height:14px; }
  .lp-discord-main > .lp-social-compose { flex:none; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:0; padding:8px; border:0; background:var(--social-bg); }
  .lp-discord-main > .lp-social-compose .lp-social-compose-title { grid-column:1/-1; padding:0 5px 4px; font-size:9px; }
  .lp-discord-main > .lp-social-compose .lp-social-field > span { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
  .lumiphone-shell .lp-social-page-discord .lp-discord-main > .lp-social-compose textarea { min-height:44px; height:44px; max-height:100px; border:0; resize:none; border-radius:7px 0 0 7px; background:var(--discord-input); }
  .lp-discord-main > .lp-social-compose .lp-social-compose-footer { background:var(--discord-input); border-radius:0 7px 7px 0; padding-right:5px; }
  .lp-discord-main > .lp-social-compose .lp-social-count { display:none; }
  .lp-discord-main > .lp-social-compose .lp-social-primary { min-width:44px; min-height:32px; padding:5px 8px; border-radius:4px; font-size:11px; background:#5865f2; }
  .lp-social-discord .lp-social-empty { padding:35px 18px; } .lp-social-discord .lp-social-empty strong { font-size:23px; }
  .lumiphone-shell .lp-icon-twitter { background:linear-gradient(140deg,#64c7f5,#3183c9); }
  .lumiphone-shell .lp-icon-discord { background:linear-gradient(140deg,#a49df7,#6654c7); }
  .lumiphone-shell .lp-icon-instagram { background:linear-gradient(140deg,#eeb66e,#d771a0 55%,#9e71c8); }
  .lumiphone-shell .lp-icon-tumblr { background:linear-gradient(140deg,#637d9c,#30425d); }
  .lp-social-avatar > svg { width:100%; height:100%; display:block; }
  .lp-social-post { position:relative; }
  .lp-social-open-discussion { position:absolute; z-index:1; inset:0; width:100%; height:100%; border:0; border-radius:inherit; background:transparent; padding:0; cursor:pointer; }
  .lp-social-post-actions,.lp-social-follow { position:relative; z-index:2; }
  .lp-social-open-discussion:focus-visible { outline:2px solid var(--social-accent); outline-offset:-3px; }
  .lp-social-follow { flex:none; align-self:center; min-height:28px; padding:4px 9px; border:1px solid var(--social-border); border-radius:16px; color:var(--social-text); background:var(--social-bg); font:inherit; font-size:10px; font-weight:600; line-height:1.2; cursor:pointer; }
  .lp-social-follow[aria-pressed="true"] { color:var(--social-muted); }
  .lp-social-profile > .lp-social-bio { grid-column:1/-1; font-size:13px; line-height:1.5; white-space:pre-wrap; margin:6px 0; }
  .lp-social-edit-profile { border:1px solid var(--social-border); border-radius:9px; font-weight:650; }
  .lp-social-bio-form { grid-column:1/-1; display:grid; gap:8px; }
  .lp-social-bio-form .lp-social-primary { justify-self:end; }
  .lp-social-username-hint { font-size:11px; line-height:1.5; color:var(--social-muted); margin:0; }
  .lp-social-profile-handle { overflow-wrap:anywhere; }
  .lp-discord-profile-launch { margin-top:auto; display:grid; place-items:center; border-radius:50%; }
  .lp-discord-profile-launch .lp-social-avatar { width:32px; height:32px; }
  .lp-discord-main > .lp-discord-profile { padding:22px 16px; overflow:auto; min-height:0; flex:1; }
  .lp-discord-profile .lp-social-profile-head { flex-direction:column; align-items:flex-start; margin-bottom:20px; }
  .lp-discord-profile .lp-social-avatar { width:64px; height:64px; }
  .lp-discord-profile > .lp-social-edit-profile { margin:12px 8px 0 0; }
  .lp-discord-profile .lp-social-bio-form { margin-top:16px; }
  .lp-social-preview-notice { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:5px 13px; border-bottom:1px solid var(--social-border); color:var(--social-muted); font-size:9px; line-height:1.4; }
  .lp-social-preview-notice .lp-social-button { font-size:9px; min-height:28px; padding:4px 8px; }
  .lp-social-preview-label { display:block; color:var(--social-muted); font-size:9px; line-height:1.45; }
  .lp-social-post[data-social-preview="true"] .lp-social-post-actions { min-height:23px; }
  .lp-instagram-stories { display:flex; gap:17px; overflow-x:auto; padding:14px 16px; border-bottom:1px solid var(--social-border); scrollbar-width:none; }
  .lp-instagram-story { display:grid; justify-items:center; gap:8px; flex:none; border:0; padding:3px; background:transparent; color:var(--social-text); font:inherit; font-size:10px; line-height:1.2; cursor:pointer; }
  .lp-instagram-story .lp-social-avatar { width:51px; height:51px; border:2px solid var(--social-bg); outline:2px solid #e06c8e; outline-offset:2px; }
  .lp-social-story-viewer { display:grid; gap:12px; min-width:0; text-align:center; }
  .lp-social-story-viewer > img { display:block; width:100%; max-height:55dvh; aspect-ratio:4/5; object-fit:cover; border-radius:12px; }
  .lp-social-story-viewer > p { margin:0; font-size:13px; line-height:1.5; }
  .lp-social-story-viewer > .lp-social-preview-label { font-size:10px; }
  .lp-social-photo-tools { display:flex; flex-wrap:wrap; gap:6px; }
  .lp-social-photo-tools .lp-social-button { border:1px solid var(--social-border); border-radius:6px; font-size:11px; }
  .lp-social-image-progress { margin:4px 0; font-size:11px; color:var(--social-muted); }
  .lp-social-attachment-preview { max-width:100%; max-height:180px; border-radius:8px; object-fit:contain; }
  .lp-discord-server-create { flex:1; min-height:0; overflow:auto; padding:16px; background:var(--discord-panel); }
  .lp-discord-server-create > h2 { font-size:21px; margin:14px 0 8px; }
  .lp-discord-server-create > p { line-height:1.6; }
  .lp-discord-server-create > .lp-social-compose { padding:12px 0; border:0; background:transparent; }
  .lp-discord-server-create .lp-social-compose > .lp-social-button { justify-self:start; background:#5865f2; color:#fff; border-radius:5px; }
  .lp-tumblr-palettes { margin:0 12px 9px; color:var(--social-text); font-size:11px; }
  .lp-tumblr-palettes > summary { cursor:pointer; padding:10px 2px; }
  .lp-tumblr-palette-options { display:flex; flex-wrap:wrap; gap:6px; padding-bottom:4px; }
  .lp-tumblr-palette-options .lp-social-button { border:2px solid transparent; border-radius:5px; min-height:34px; padding:6px 9px; font-size:10px; }
  .lp-tumblr-palette-options [data-palette="true-blue"] { background:#fff; color:#001935; }
  .lp-tumblr-palette-options [data-palette="goth-rave"] { background:#20102f; color:#d5a9ff; }
  .lp-tumblr-palette-options [data-palette="dark-mode"] { background:#080808; color:#fff; }
  .lp-tumblr-palette-options [data-palette="pride"] { background:linear-gradient(110deg,#f5b8d2 0 25%,#fff 25% 50%,#ffe66b 50% 75%,#74baf4 75%); color:#20263a; }
  .lp-tumblr-palette-options [aria-pressed="true"] { border-color:var(--social-accent); }
  .lumiphone-shell .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] { --social-bg:#000; --social-surface:#000; --social-text:#f5f4f8; --social-muted:#a6a0af; --social-border:#362347; --social-accent:#ad7aff; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-social-post,.lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-social-compose { --social-bg:#0a0a0d; --social-surface:#0a0a0d; --social-text:#f5f4f8; --social-muted:#a6a0af; --social-border:#362347; background:#0a0a0d; color:#f5f4f8; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] :is(.lp-social-post-heading,.lp-social-post-actions) { border-color:#522d82; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-social-compose-disclosure > summary { background:#0a0a0d; color:#c4a0f5; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-social-bottomnav { background:#000; }
  .lumiphone-shell .lp-social-page-tumblr[data-tumblr-theme="dark-mode"] { --social-bg:#000; --social-surface:#000; --social-text:#fff; --social-muted:#a7a7a7; --social-border:#333; --social-accent:#00b8ff; }
  .lp-social-page-tumblr[data-tumblr-theme="dark-mode"] .lp-social-post,.lp-social-page-tumblr[data-tumblr-theme="dark-mode"] .lp-social-compose { --social-bg:#171717; --social-surface:#171717; --social-text:#fff; --social-muted:#aaa; --social-border:#333; background:#171717; color:#fff; }
  .lp-social-page-tumblr[data-tumblr-theme="dark-mode"] :is(.lp-social-post-heading,.lp-social-post-actions) { border-color:#333; }
  .lp-social-page-tumblr[data-tumblr-theme="dark-mode"] .lp-social-compose-disclosure > summary { background:#171717; color:#eee; }
  .lp-social-page-tumblr[data-tumblr-theme="dark-mode"] .lp-social-bottomnav { background:#000; }
  .lumiphone-shell .lp-social-page-tumblr[data-tumblr-theme="pride"] { --social-bg:#f3b6d0; --social-surface:#f3b6d0; --social-text:#3c3157; --social-muted:#6e5170; --social-border:#d89db9; --social-accent:#168ee6; }
  .lp-social-page-tumblr[data-tumblr-theme="pride"] .lp-social-app-header,.lp-social-page-tumblr[data-tumblr-theme="pride"] .lp-social-bottomnav { background:#fff; color:#3c3157; }
  .lp-social-page-tumblr[data-tumblr-theme="pride"] .lp-social-bottomnav .lp-social-create { background:#ffe36b; color:#225d94; }
  .lp-social-page-tumblr[data-tumblr-theme="pride"] .lp-social-filters { background:#f3b6d0; }
  .lp-social-page-tumblr:is([data-tumblr-theme="goth-rave"],[data-tumblr-theme="dark-mode"]) :is(.lp-social-post-actions,.lp-social-reblog-label,.lp-tumblr-notes) { color:var(--social-muted); }
  .lp-social-operation { flex:none; display:grid; grid-template-columns:minmax(0,1fr) 48px; align-items:center; gap:6px; height:28px; min-height:28px; padding:0 10px; background:var(--social-bg); border-bottom:1px solid var(--social-border); }
  .lp-social-operation .lp-social-status { position:static; min-width:0; margin:0; padding:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:left; font-size:10px; line-height:1.4; background:transparent; }
  .lp-social-operation .lp-social-stop { float:none; position:static; margin:0; min-height:22px; height:22px; width:48px; padding:2px 6px; font-size:10px; border-radius:4px; }
  .lp-social-settings { padding:18px 16px 26px; background:var(--social-bg); color:var(--social-text); }
  .lp-social-settings > h2 { font-size:22px; letter-spacing:-.03em; margin:12px 0 20px; }
  .lp-social-settings > .lp-copy { font-size:11px; line-height:1.6; margin:16px 0; }
  .lp-social-settings > .lp-social-settings-refresh { border:1px solid var(--social-border); border-radius:7px; background:color-mix(in srgb,var(--social-text) 6%,var(--social-bg)); color:var(--social-text); min-height:40px; width:100%; text-align:left; padding:10px 12px; }
  .lp-social-settings-toggle { display:flex; align-items:center; gap:12px; padding:17px 0; border-bottom:1px solid var(--social-border); font-size:13px; line-height:1.5; cursor:pointer; }
  .lp-social-settings-toggle input { width:18px; height:18px; flex:none; accent-color:var(--social-accent); }
  .lp-discord-main > .lp-social-settings { flex:1; min-height:0; overflow:auto; }
  .lp-social-compose-context { margin:0; padding:12px; border:1px solid var(--social-border); border-radius:10px; background:color-mix(in srgb,var(--social-text) 4%,var(--social-bg)); font-size:12px; line-height:1.5; overflow-wrap:anywhere; }
  .lp-social-compose-context > p { margin:6px 0 0; white-space:pre-wrap; }
  .lp-social-page-twitter[data-social-compose-mode="quote"] .lp-social-filters { display:none; }
  .lp-social-page-twitter[data-social-compose-mode="quote"] .lp-social-compose { border-bottom:0; }
  .lp-discord-people { flex:1; min-height:0; overflow:auto; padding:16px; background:var(--discord-panel); }
  .lp-discord-people > h2 { font-size:20px; margin:14px 0 10px; overflow-wrap:anywhere; }
  .lp-discord-people > h3 { font-size:14px; margin:22px 0 12px; }
  .lp-discord-people > .lp-copy { font-size:12px; line-height:1.6; }
  .lp-discord-people > .lp-social-button { border:1px solid var(--social-border); border-radius:5px; }
  .lp-discord-people-list { padding:0; margin:18px 0; list-style:none; display:grid; gap:16px; }
  .lp-discord-people-list > li { display:flex; gap:10px; min-width:0; }
  .lp-discord-people-list > li > div { min-width:0; display:grid; gap:3px; font-size:12px; }
  .lp-discord-people-list strong { font-size:13px; } .lp-discord-people-list span { color:var(--social-muted); font-size:10px; }
  .lp-discord-people-list p { margin:4px 0 0; line-height:1.5; overflow-wrap:anywhere; }
  .lp-discord-person-form { display:grid; gap:10px; }
  .lp-discord-person-form .lp-social-primary { justify-self:end; border-radius:5px; background:#5865f2; }
  .lp-social-friend-picker { margin:18px 0; font-size:12px; }
  .lp-social-friend-picker > summary { cursor:pointer; padding:10px 0; font-weight:650; }
  .lp-social-friend-picker > .lp-social-settings-toggle { padding:12px 0; }
  .lp-social-settings-toggle small { margin-left:auto; font-size:10px; color:var(--social-muted); max-width:40%; }
  .lp-social-friend-picker > .lp-social-button { display:block; text-align:left; border-bottom:1px solid var(--social-border); width:100%; }
  .lp-tumblr-discussion-title { font-size:20px; margin:16px 14px 8px; }
  .lp-tumblr-notes-tabs { display:flex; gap:8px; border-bottom:1px solid var(--social-border); padding:0 12px; margin-bottom:14px; }
  .lp-tumblr-notes-tabs .lp-social-button { position:relative; flex:1; border-radius:0; font-size:12px; color:var(--social-muted); }
  .lp-tumblr-notes-tabs [aria-pressed="true"] { color:var(--social-text); border-bottom:3px solid var(--social-accent); }
  .lumiphone-shell .lp-social-page-instagram .lp-social-app-header { grid-template-columns:36px minmax(0,1fr) 36px 36px; gap:2px; }
  .lp-instagram-dms { padding:14px; min-height:100%; background:var(--social-bg); color:var(--social-text); }
  .lp-instagram-dms > h2 { font-size:22px; margin:12px 0 18px; }
  .lp-instagram-dms > .lp-copy { font-size:11px; line-height:1.6; }
  .lp-instagram-inbox-list { display:grid; gap:3px; }
  .lp-instagram-inbox-account { display:flex; align-items:center; gap:13px; padding:13px 0; border:0; background:transparent; color:var(--social-text); width:100%; text-align:left; cursor:pointer; }
  .lp-instagram-inbox-account > .lp-social-avatar { width:49px; height:49px; }
  .lp-instagram-inbox-account > span:not(.lp-social-avatar) { min-width:0; display:grid; gap:5px; }
  .lp-instagram-inbox-account strong { font-size:13px; }
  .lp-instagram-inbox-account span span { font-size:11px; color:var(--social-muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:240px; }
  .lp-instagram-dm-log { display:flex; flex-direction:column; align-items:flex-start; gap:9px; padding:12px 0 20px; min-height:130px; }
  .lp-instagram-dm-bubble { margin:0; max-width:85%; padding:11px 14px; border-radius:18px; font-size:13px; line-height:1.5; white-space:pre-wrap; overflow-wrap:anywhere; }
  .lp-instagram-dm-account { background:color-mix(in srgb,var(--social-text) 9%,var(--social-bg)); color:var(--social-text); border-bottom-left-radius:5px; }
  .lp-instagram-dm-owner { align-self:flex-end; background:#6757dc; color:#fff; border-bottom-right-radius:5px; }
  .lp-instagram-dm-compose { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:end; gap:8px; padding-top:12px; border-top:1px solid var(--social-border); }
  .lp-instagram-dm-compose .lp-social-primary { min-height:38px; border-radius:8px; font-size:11px; }
  .lp-instagram-message-account { position:relative; z-index:2; }
  @media (pointer:coarse) { .lp-social-page .lp-social-icon-button { min-width:40px; min-height:40px; } .lp-social-page .lp-social-primary { min-height:40px; } .lp-social-page summary { min-height:40px; } }

  /* App chrome is one compact row; the left control navigates within an app. */
  .lumiphone-shell .lp-social-page .lp-social-app-header,.lumiphone-shell .lp-social-page-instagram .lp-social-app-header { grid-template-columns:36px minmax(0,1fr) auto; height:52px; min-height:52px; padding:2px 8px; gap:4px; }
  .lp-social-header-actions { display:flex; align-items:center; gap:0; }
  .lp-social-header-actions > .lp-social-icon-button { width:34px; height:40px; padding:7px; min-width:34px; }
  .lp-social-header-actions .lp-social-glyph { width:19px; height:19px; }
  .lp-social-back { width:34px; height:40px; padding:7px; }
  .lp-social-back .lp-social-glyph { width:20px; height:20px; }
  .lp-social-page .lp-nav-title { text-align:left; }
  .lp-social-page-twitter .lp-nav-title { text-align:center; }
  .lp-social-page-twitter .lp-social-wordmark > .lp-social-glyph { margin:0 auto; }
  .lp-social-page-twitter .lp-social-wordmark,.lp-social-page-tumblr .lp-social-wordmark { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); }
  .lp-social-page-instagram .lp-social-wordmark { font-size:24px; }
  .lp-social-page-tumblr .lp-social-wordmark { font-size:27px; }
  .lp-social-page-discord .lp-social-wordmark { font-size:17px; }
  .lp-social-discussion-heading { font-size:15px; line-height:1.3; margin:0; padding:14px; font-weight:700; border-bottom:1px solid var(--social-border); }
  .lp-social-setting-field { margin:20px 0; gap:9px; font-size:12px; }
  .lp-social-setting-field :is(select,input) { background:var(--social-surface); color:var(--social-text); border:1px solid var(--social-border); padding:10px 12px; border-radius:9px; width:100%; min-height:42px; font:inherit; }
  .lp-social-settings .lp-tumblr-palettes { margin:24px 0; padding-top:4px; border-top:1px solid var(--social-border); }
  .lp-social-settings .lp-tumblr-palettes > summary { font-size:13px; padding:16px 0; font-weight:650; }
  .lp-social-settings .lp-tumblr-palette-options { gap:8px; }
  .lp-social-settings .lp-tumblr-palette-options .lp-social-button { flex:1 1 42%; border-radius:9px; min-height:45px; padding:9px; font-size:11px; }
  .lp-social-page-twitter .lp-social-follow { border:0; padding:0 0 0 5px; min-height:24px; height:24px; border-radius:0; color:var(--social-accent); background:transparent; font-size:12px; font-weight:700; white-space:nowrap; }
  .lp-social-page-twitter .lp-social-follow[aria-pressed="true"] { color:var(--social-muted); font-weight:500; }
  .lp-social-page-twitter .lp-social-post-heading { gap:7px; }
  .lp-social-page-twitter .lp-social-post-identity { padding-right:2px; }
  .lp-social-visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; }
  .lp-social-avatar > svg { display:block; width:100%; height:100%; }

  /* Discussions preserve a complete original post and render responses as responses. */
  .lp-social-comment { display:flex; align-items:flex-start; gap:10px; padding:13px 14px; min-width:0; border-bottom:1px solid var(--social-border); background:var(--social-surface); color:var(--social-text); }
  .lp-social-comment > .lp-social-avatar { width:32px; height:32px; }
  .lp-social-comment-body { flex:1; min-width:0; }
  .lp-social-comment-heading { display:flex; align-items:baseline; gap:6px; min-width:0; flex-wrap:wrap; }
  .lp-social-comment-heading strong { font-size:12px; overflow-wrap:anywhere; }
  .lp-social-comment-heading > :is(span,time) { font-size:10px; color:var(--social-muted); }
  .lp-social-comment-heading time { margin-left:auto; }
  .lp-social-comment-text { font:13px/1.5 system-ui,sans-serif; margin:4px 0; white-space:pre-wrap; overflow-wrap:anywhere; }
  .lp-social-comment-actions { display:flex; align-items:center; gap:13px; color:var(--social-muted); }
  .lp-social-comment-actions > button { appearance:none; border:0; background:transparent; color:inherit; font:inherit; padding:2px 0; min-height:26px; height:26px; width:auto; min-width:26px; font-size:10px; cursor:pointer; }
  .lp-social-comment-actions .lp-social-glyph { width:14px; height:14px; }
  .lp-social-reply-target { display:block; font-size:11px; color:var(--social-muted); margin-top:5px; }
  .lp-social-comment-prompt { appearance:none; border:0; font:inherit; cursor:pointer; display:block; width:100%; text-align:left; min-height:50px; padding:14px 18px; color:var(--social-muted); font-size:13px; border-top:1px solid var(--social-border); background:var(--social-surface); }
  .lp-social-reply-compose { position:relative; display:grid; grid-template-columns:32px minmax(0,1fr); gap:8px 10px; margin:0; }
  .lp-social-reply-compose > .lp-social-avatar { grid-column:1; grid-row:1 / 4; width:32px; height:32px; }
  .lp-social-reply-compose > :not(.lp-social-avatar) { grid-column:2; min-width:0; }
  .lp-social-reply-compose .lp-social-compose-title { display:flex; align-items:center; justify-content:space-between; font-size:10px; }
  .lp-social-reply-cancel { border:0; padding:0; min-height:24px; font-size:10px; color:var(--social-muted); background:transparent; cursor:pointer; }
  .lp-social-reply-compose .lp-social-field > span { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
  .lp-social-page-twitter[data-social-discussion] .lp-social-post { border-bottom:1px solid var(--social-border); }
  .lp-twitter-comment { position:relative; border-bottom:0; padding-top:12px; padding-bottom:15px; }
  .lp-twitter-comment::before { content:''; position:absolute; left:29px; top:47px; bottom:-10px; width:2px; background:var(--social-border); }
  .lp-twitter-comment:last-of-type::before { display:none; }
  .lp-twitter-comment .lp-social-comment-text { font-size:14px; }
  .lp-twitter-comment .lp-social-comment-heading strong { font-size:13px; }
  .lp-twitter-reply-compose { border-bottom:1px solid var(--social-border); padding:15px 14px; }
  .lumiphone-shell .lp-twitter-reply-compose .lp-social-field textarea { border:0; border-radius:0; padding:4px 0; background:transparent; font-size:15px; min-height:55px; resize:none; }
  .lp-twitter-reply-compose .lp-social-compose-footer { justify-content:flex-end; gap:14px; }
  .lp-instagram-comment { border:0; padding:11px 16px; background:var(--social-bg); }
  .lp-instagram-comment > .lp-social-avatar { width:29px; height:29px; outline:0; border:0; }
  .lp-instagram-comment .lp-social-comment-heading { display:inline; }
  .lp-instagram-comment .lp-social-comment-heading time { margin-left:8px; }
  .lp-instagram-comment .lp-social-comment-text { margin:3px 0 4px; font-size:12px; }
  .lp-instagram-comment .lp-social-comment-actions { gap:16px; }
  .lp-instagram-comment .lp-social-comment-actions > .lp-social-like { margin-left:auto; }
  .lp-instagram-comment-prompt { border:1px solid var(--social-border); border-radius:24px; width:calc(100% - 28px); margin:14px; min-height:42px; padding:10px 15px; background:var(--social-bg); }
  .lp-instagram-reply-compose { padding:13px 14px; border-top:1px solid var(--social-border); border-bottom:0; background:var(--social-bg); }
  .lp-instagram-reply-compose .lp-social-compose-footer { justify-content:flex-end; }
  .lp-instagram-reply-compose .lp-social-count { display:none; }
  .lumiphone-shell .lp-instagram-reply-compose .lp-social-field textarea { border-radius:20px; padding:10px 13px; min-height:40px; resize:none; font-size:12px; }
  .lp-instagram-reply-compose .lp-social-primary { color:#fff; background:linear-gradient(120deg,#8c3cce,#ce3a7c); padding:7px 15px; min-width:54px; border-radius:18px; }
  .lp-instagram-reply-compose { --social-accent:#b04cba; }
  .lp-tumblr-comment { margin:0; border:0; background:var(--social-surface); }
  .lp-tumblr-comment > .lp-social-avatar { border-radius:4px; }
  .lp-tumblr-comment .lp-social-comment-text { font-family:system-ui,sans-serif; font-size:13px; line-height:1.5; }
  .lp-social-tumblr .lp-tumblr-comment .lp-social-tags { padding:0; }
  .lp-tumblr-reply-compose { margin:10px 0 0; border:0; border-radius:8px; padding:14px; }
  .lp-tumblr-reply-compose .lp-social-count { display:none; }
  .lumiphone-shell .lp-tumblr-reply-compose .lp-social-field textarea { min-height:46px; border-radius:7px; font-size:13px; resize:none; }
  .lp-tumblr-reply-compose .lp-social-primary { border-radius:6px; color:#001935; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-social-glyph { color:#fff; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-social-bottomnav .lp-social-create { background:#ad7aff; color:#fff; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-social-comment { background:#000; color:#f5f4f8; }
  .lp-social-page-tumblr[data-tumblr-theme="goth-rave"] .lp-social-reply-compose { --social-bg:#0a0a0d; --social-surface:#0a0a0d; --social-text:#f5f4f8; --social-muted:#a6a0af; --social-border:#362347; background:#0a0a0d; color:#f5f4f8; }
  .lp-social-page-tumblr[data-tumblr-theme="dark-mode"] .lp-social-comment { background:#000; color:#fff; }
  .lp-social-page-tumblr[data-tumblr-theme="true-blue"] .lp-social-comment,.lp-social-page-tumblr[data-tumblr-theme="pride"] .lp-social-comment { --social-text:#24323e; --social-muted:#687681; --social-border:#dfe4e8; background:#fff; color:#24323e; }
  .lp-social-page-tumblr[data-tumblr-theme="true-blue"] .lp-social-comment-prompt,.lp-social-page-tumblr[data-tumblr-theme="pride"] .lp-social-comment-prompt { color:#687681; background:#fff; }

  /* Instagram messages occupy the phone, with a scrollable conversation and pinned input. */
  .lp-social-page-instagram .lp-instagram-message-title { font:700 17px/1.2 system-ui,sans-serif; letter-spacing:0; }
  .lp-instagram-recipient { display:flex; align-items:center; gap:9px; min-width:0; }
  .lp-instagram-recipient > .lp-social-avatar { width:31px; height:31px; }
  .lp-instagram-recipient > span:not(.lp-social-avatar) { display:grid; gap:2px; min-width:0; }
  .lp-instagram-recipient strong { font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-instagram-recipient small { font-size:10px; color:var(--social-muted); font-weight:400; }
  .lp-social-page-instagram[data-instagram-view="thread"] > .lp-content { display:flex; flex-direction:column; overflow:hidden; }
  .lp-instagram-dms { padding:0; min-height:0; background:var(--social-bg); }
  [data-instagram-view="thread"] .lp-instagram-dms { display:flex; flex:1; flex-direction:column; overflow:hidden; }
  .lp-instagram-inbox-heading { font-size:14px; margin:18px 16px 8px; }
  .lp-instagram-inbox-list { padding:0 16px 18px; }
  .lp-instagram-inbox-account { min-height:76px; gap:14px; }
  .lp-instagram-inbox-account > .lp-social-avatar { width:51px; height:51px; }
  .lp-instagram-inbox-account strong { font-size:14px; }
  .lp-instagram-inbox-account span span { font-size:12px; max-width:100%; }
  .lp-instagram-dm-log { flex:1; min-height:0; overflow:auto; display:flex; flex-direction:column; align-items:stretch; gap:14px; padding:20px 14px; overscroll-behavior:contain; }
  .lp-instagram-dm-intro { display:flex; flex-direction:column; align-items:center; gap:8px; padding:20px 15px 30px; text-align:center; }
  .lp-instagram-dm-intro > .lp-social-avatar { width:76px; height:76px; margin-bottom:6px; }
  .lp-instagram-dm-intro strong { font-size:20px; }
  .lp-instagram-dm-intro > span:not(.lp-social-avatar),.lp-instagram-dm-intro p { font-size:12px; color:var(--social-muted); }
  .lp-instagram-dm-row { display:flex; align-items:flex-end; gap:7px; width:100%; }
  .lp-instagram-dms .lp-social-avatar { outline:0; border:0; }
  .lp-instagram-dm-row > .lp-social-avatar { width:23px; height:23px; margin-bottom:15px; }
  .lp-instagram-dm-row-owner { justify-content:flex-end; }
  .lp-instagram-dm-message { min-width:0; max-width:80%; }
  .lp-instagram-dm-bubble { font-size:13px; line-height:1.45; max-width:none; padding:11px 14px; border-radius:19px; }
  .lp-instagram-dm-owner { background:linear-gradient(135deg,#6264e9,#9149de); color:#fff; border-bottom-right-radius:5px; }
  .lp-instagram-dm-account { background:color-mix(in srgb,var(--social-text) 10%,var(--social-bg)); border-bottom-left-radius:5px; }
  .lp-instagram-dm-time { display:block; font-size:9px; margin:4px 6px 0; color:var(--social-muted); }
  .lp-instagram-dm-row-owner .lp-instagram-dm-time { text-align:right; }
  .lp-instagram-typing { padding-left:31px; font-size:11px; color:var(--social-muted); margin:0; }
  .lp-instagram-dm-compose { flex:none; display:flex; align-items:flex-end; gap:10px; padding:10px 13px 14px; border-top:0; background:var(--social-bg); }
  .lp-instagram-dm-compose > label { flex:1; min-width:0; }
  .lumiphone-shell .lp-instagram-dm-compose .lp-social-field textarea { min-height:42px; max-height:120px; border:1px solid var(--social-border); border-radius:23px; padding:11px 15px; font-size:13px; resize:none; line-height:1.4; }
  .lp-instagram-dm-compose .lp-social-primary { flex:none; min-width:38px; min-height:42px; padding:6px 0; border:0; border-radius:0; background:transparent; color:#8e75f0; font-size:13px; }

  .lp-social-new-post { width:100%; padding:16px; text-align:left; border:0; border-bottom:1px solid var(--social-border); background:transparent; color:var(--social-accent); font:inherit; cursor:pointer; }
  .lp-social-editor-title { font-size:20px; margin:18px 16px; }

  .lp-social-settings .lp-section { margin:18px 0; border-bottom:1px solid var(--social-border); padding-bottom:18px; }
  .lp-social-settings .lp-section-label { font-size:14px; font-weight:750; }
  .lp-social-settings .lp-section-help { color:var(--social-muted); font-size:11px; margin:5px 0 12px; }
  .lp-social-settings .lp-section-body { display:grid; gap:10px; }
  .lp-social-settings .lp-control-row { background:var(--lp-surface); border:1px solid var(--social-border); border-radius:12px; padding:14px; justify-content:space-between; }
  .lp-social-settings .lp-field { display:grid; gap:7px; }
  .lp-social-friends-screen { display:block; }
  .lp-social-friends-screen .lp-social-friend-picker { margin:18px 0 0; }
  .lp-social-friends-heading { margin:20px 0 8px; font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--social-muted); }
  .lp-social-friends-screen .lp-social-friend-row { display:flex; justify-content:space-between; gap:14px; padding:12px; margin:0 0 8px; min-height:48px; box-sizing:border-box; }
  .lp-social-friend-identity { display:grid; gap:4px; min-width:0; text-align:left; }
  .lp-social-friends-screen .lp-social-friend-row small { margin:0; max-width:none; font-size:11px; line-height:1.4; }
  .lp-social-friends-screen .lp-social-friend-picker > .lp-button { display:block; width:100%; text-align:left; padding:12px; margin:0 0 8px; border:1px solid var(--social-border); border-radius:12px; background:var(--lp-surface); color:var(--social-text); }
  .lp-social-settings .lp-control-row input[type="checkbox"] { width:20px; height:20px; accent-color:var(--social-accent); margin-left:auto; }
  /* Profile anatomy belongs to each app; no implicit shared grid columns. */
  .lp-social-profile-head { display:flex; align-items:center; gap:14px; min-width:0; }
  .lp-social-profile-identity { display:grid; gap:5px; min-width:0; }
  .lp-social-profile-identity > strong { font-size:21px; overflow-wrap:anywhere; }
  .lp-social-profile-handle,.lp-social-profile-count { font-size:12px; color:var(--social-muted); }
  .lp-social-profile-banner { height:132px; background:var(--lp-wallpaper); background-size:var(--lp-home-wallpaper-size,cover); background-position:var(--lp-home-wallpaper-position,center); }
  .lp-social-profile .lp-social-bio-form { margin:16px 0 0; width:100%; }
  .lp-twitter-profile { padding:0 0 18px; }
  .lp-twitter-profile .lp-social-profile-head { padding:0 16px; margin-top:-25px; position:relative; }
  .lp-twitter-profile .lp-social-avatar { width:74px; height:74px; border:4px solid var(--social-bg); }
  .lp-twitter-profile .lp-social-profile-identity { padding-top:30px; }
  .lp-twitter-profile > .lp-social-bio,.lp-twitter-profile > .lp-social-edit-profile,.lp-twitter-profile > .lp-social-bio-form { margin:14px 16px 0; }
  .lp-twitter-profile > .lp-social-bio-form { width:calc(100% - 32px); }
  .lp-tumblr-profile { text-align:center; padding-bottom:22px; }
  .lp-tumblr-profile .lp-social-profile-banner { height:145px; }
  .lp-tumblr-profile .lp-social-profile-head { flex-direction:column; gap:10px; margin-top:-37px; position:relative; padding:0 20px; }
  .lp-tumblr-profile .lp-social-avatar { width:78px; height:78px; border:4px solid var(--social-bg); border-radius:12px; }
  .lp-tumblr-profile .lp-social-profile-identity > strong { font-size:24px; }
  .lp-tumblr-profile .lp-tumblr-blog-title { font-size:15px; margin:18px 20px 8px; }
  .lp-tumblr-profile > .lp-social-bio { margin:10px 20px 16px; }
  .lp-tumblr-profile > .lp-social-bio-form { width:calc(100% - 40px); margin:16px 20px 0; text-align:left; }
  .lp-instagram-profile { padding:22px 16px 18px; border:0; }
  .lp-instagram-profile .lp-social-profile-head { display:grid; grid-template-columns:78px minmax(0,1fr); gap:10px 18px; }
  .lp-instagram-profile .lp-social-avatar { width:76px; height:76px; grid-row:1 / 3; }
  .lp-instagram-profile .lp-social-profile-identity { grid-column:2; }
  .lp-instagram-profile .lp-social-profile-identity > strong { font-size:18px; }
  .lp-instagram-profile-stats { grid-column:2; display:flex; gap:28px; }
  .lp-instagram-profile-stats > div { display:grid; gap:3px; font-size:12px; }
  .lp-instagram-profile-stats strong { font-size:16px; }
  .lp-instagram-profile-stats span { color:var(--social-muted); }
  .lp-instagram-profile > .lp-social-bio { margin:18px 0 12px; }
  .lp-instagram-profile > .lp-social-edit-profile { display:block; width:100%; background:color-mix(in srgb,var(--social-text) 8%,var(--social-bg)); }
  .lp-instagram-profile > .lp-social-edit-profile ~ .lp-social-edit-profile { margin-top:8px; }
  .lp-instagram-profile-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:2px; border-top:1px solid var(--social-border); }
  .lp-instagram-profile-tile { aspect-ratio:1; overflow:hidden; margin:0; border:0; position:relative; }
  .lp-instagram-profile-tile .lp-social-post-heading,.lp-instagram-profile-tile .lp-social-post-text,.lp-instagram-profile-tile .lp-social-post-actions,.lp-instagram-profile-tile .lp-social-tags { display:none; }
  .lp-instagram-profile-tile .lp-social-post-body { padding:0; } .lp-instagram-profile-tile .lp-social-photo { width:100%; height:100%; aspect-ratio:1; object-fit:cover; }

  /* Standalone editors use flowing content, not viewport-sized grid tracks. */
  .lp-social-page[data-social-view="compose"] .lp-social-compose { display:flex; flex-direction:column; gap:16px; min-height:0; border:0; padding:0 16px 24px; }
  .lp-social-editor-bar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid var(--social-border); }
  .lp-social-editor-bar .lp-social-editor-title { margin:0; font-size:16px; letter-spacing:-.02em; }
  .lp-social-editor-bar .lp-social-primary { min-width:72px; min-height:34px; padding:6px 16px; }
  .lp-social-page[data-social-view="compose"] .lp-social-compose-title { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--social-text); }
  .lp-social-page[data-social-view="compose"] .lp-social-field { align-content:start; gap:7px; flex:none; }
  .lp-social-page[data-social-view="compose"] .lp-social-post-text-field > span,
  .lp-social-page[data-social-view="compose"] .lp-social-post-title-field > span,
  .lp-social-page[data-social-view="compose"] .lp-social-post-tags-field > span { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
  .lumiphone-shell .lp-social-page[data-social-view="compose"] .lp-social-post-text-field textarea { border:0; border-radius:0; padding:4px 0; font-size:18px; line-height:1.6; min-height:150px; resize:vertical; background:transparent; color:var(--social-text); }
  .lp-social-page[data-social-view="compose"] .lp-social-compose-footer { min-height:18px; justify-content:flex-end; }
  .lp-social-page[data-social-view="compose"] .lp-social-post-text-field textarea:focus-visible { outline:none; box-shadow:0 2px 0 -1px var(--social-accent); }
  .lp-social-page[data-social-view="compose"] .lp-tumblr-new-compose { min-height:100%; box-sizing:border-box; border-radius:0; }
  .lp-social-page[data-social-view="compose"] .lp-social-media { border-top:1px solid var(--social-border); padding-top:4px; }
  .lp-social-page[data-social-view="compose"] .lp-social-media > summary { color:var(--social-accent); font-weight:650; min-height:38px; display:list-item; align-content:center; }
  .lp-social-page[data-social-view="compose"] .lp-social-photo-tools { display:flex; flex-wrap:wrap; gap:6px; }
  .lp-social-page[data-social-view="compose"] .lp-social-photo-tools button { border:1px solid var(--social-border); border-radius:8px; }
  .lp-social-page-instagram[data-social-view="compose"] { --social-accent:#7385ff; }
  .lumiphone-shell[data-theme="porcelain"] .lp-social-page-instagram[data-social-view="compose"],.lumiphone-shell[data-theme="pink"] .lp-social-page-instagram[data-social-view="compose"] { --social-accent:#4a5df9; }
  .lp-instagram-new-compose .lp-social-editor-bar .lp-social-primary { border-radius:8px; background:#4a5df9; color:#fff; }
  .lp-social-photo-hint { margin:0; color:var(--social-muted); font-size:12px; line-height:1.5; }
  .lp-social-page[data-social-view="compose"] .lp-instagram-new-compose .lp-social-media { order:0; border:1px solid var(--social-border); border-radius:12px; padding:12px; }
  .lp-instagram-new-compose .lp-social-media:not([open]) > summary { min-height:112px; display:grid; place-items:center; list-style:none; color:var(--social-text); }
  .lp-instagram-new-compose .lp-social-media:not([open]) > summary::before { content:'+'; display:grid; place-items:center; width:38px; height:38px; border:1px solid var(--social-muted); border-radius:12px; font-size:28px; font-weight:400; }
  .lumiphone-shell .lp-social-page[data-social-view="compose"] .lp-instagram-new-compose .lp-social-post-text-field textarea { font-size:14px; min-height:86px; }
  .lp-instagram-new-compose .lp-social-media > summary { color:var(--social-text); }
  .lp-instagram-new-compose .lp-social-photo-tools button { color:var(--social-text); }
  .lp-instagram-new-compose .lp-social-compose-title { order:0; }
  .lumiphone-shell .lp-social-page[data-social-view="compose"] .lp-tumblr-new-compose .lp-social-post-title-field input { border:0; padding:0; background:transparent; font-size:24px; font-weight:750; }
  .lumiphone-shell .lp-social-page[data-social-view="compose"] .lp-tumblr-new-compose .lp-social-post-text-field textarea { min-height:190px; font-size:17px; }
  .lp-tumblr-new-compose .lp-social-compose-footer { display:none; }
  .lp-tumblr-new-compose .lp-social-post-tags-field input { border:0; border-radius:20px; background:color-mix(in srgb,var(--social-accent) 9%,var(--social-bg)); color:var(--social-accent); }
  .lp-tumblr-new-compose .lp-social-post-tags-field { order:2; }
  .lp-tumblr-new-compose .lp-social-media { order:3; }
  .lp-tumblr-new-compose .lp-social-editor-bar { border:0; }
  .lp-social-friends-group { border-top:1px solid var(--social-border); margin-top:12px; }
  .lp-social-friends-group > summary { display:flex; align-items:center; gap:10px; min-height:48px; cursor:pointer; font-weight:700; list-style:none; }
  .lp-social-friends-group > summary::before { content:'›'; font-size:20px; transition:transform .15s; }
  .lp-social-friends-group[open] > summary::before { transform:rotate(90deg); }
  .lp-social-group-count { margin-left:auto; color:var(--social-muted); font-size:11px; font-weight:400; }
  .lp-social-friends-group-body { display:grid; gap:8px; padding-bottom:8px; }
  .lp-social-friends-screen .lp-social-friend-row { display:flex; align-items:center; margin:0; border:1px solid var(--social-border); border-radius:12px; background:var(--social-surface); font-size:12px; }
  .lp-social-friend-row > .lp-social-avatar { width:32px; height:32px; }
  .lp-social-friend-row > input { flex:none; width:20px; height:20px; margin-left:auto; accent-color:var(--social-accent); }
  .lp-social-friend-row .lp-social-friend-identity { flex:1; }
  .lp-social-cast-choice { padding:14px; min-height:48px; text-align:left; background:var(--social-surface); border:1px solid var(--social-border); border-radius:12px; color:var(--social-text); font:inherit; font-size:12px; cursor:pointer; }
  ${TUMBLR_STYLES}
${DISCORD_PEOPLE_STYLES}
${DISCORD_CHAT_STYLES}
`
