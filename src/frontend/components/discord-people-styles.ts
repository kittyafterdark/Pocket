export const DISCORD_PEOPLE_STYLES = `
  .lp-discord-server-menu { margin-bottom:14px; }
  .lp-discord-server-menu-toggle { display:flex; align-items:center; gap:10px; width:100%; min-height:52px; padding:9px 10px; border:0; border-radius:10px; background:var(--discord-input); color:var(--social-text); cursor:pointer; text-align:left; }
  .lp-discord-server-menu-toggle > strong { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:15px; }
  .lp-discord-server-menu-picture { display:grid; place-items:center; width:32px; height:32px; flex:none; border-radius:10px; overflow:hidden; background:#5865f2; color:#fff; font-size:11px; font-weight:750; }
  .lp-discord-server-menu-picture img { width:100%; height:100%; object-fit:cover; }
  .lp-discord-server-menu-toggle > .lp-social-glyph { width:18px; height:18px; color:var(--social-muted); }
  .lp-discord-server-menu-toggle[aria-expanded="true"] > .lp-social-glyph { transform:rotate(180deg); }
  .lp-discord-server-menu-body { margin-top:5px; padding:4px; background:var(--discord-rail); border-radius:10px; }
  .lp-discord-server-menu-body .lp-discord-picture-editor { padding:12px 9px; gap:10px; }
  .lp-discord-server-menu-body .lp-discord-picture-preview { width:44px; height:44px; border-radius:13px; }
  .lp-discord-server-menu-body .lp-discord-picture-editor strong { font-size:13px; }
  .lp-discord-menu-people { display:block; width:100%; border:0; border-radius:7px; background:transparent; color:var(--social-text); font:650 12px/1.4 system-ui,sans-serif; text-align:left; padding:11px 12px; cursor:pointer; }
  .lp-discord-menu-people:hover { background:var(--discord-input); }
  .lp-social-page-discord .lp-discord-member-manager { padding:0; min-width:0; background:var(--discord-panel); color:var(--social-text); }
  .lp-discord-picture-editor { display:flex; align-items:center; gap:14px; padding:20px 16px; min-width:0; }
  .lp-discord-picture-preview { display:grid; place-items:center; width:64px; height:64px; flex:none; border-radius:20px; background:#5865f2; color:#fff; overflow:hidden; }
  .lp-discord-picture-preview img { width:100%; height:100%; object-fit:cover; }
  .lp-discord-picture-preview > .lp-social-glyph { width:26px; height:26px; }
  .lp-discord-picture-editor > div:last-child { display:grid; justify-items:start; gap:7px; min-width:0; }
  .lp-discord-picture-editor strong { font-size:17px; overflow-wrap:anywhere; }
  .lp-discord-picture-progress { font-size:11px; color:var(--social-muted); }
  .lp-social-page-discord .lp-discord-soft-button { appearance:none; min-height:34px; padding:8px 12px; border:0; border-radius:8px; background:var(--discord-input); color:var(--social-text); font:650 11px/1.3 system-ui,sans-serif; cursor:pointer; flex:none; }
  .lp-social-page-discord .lp-discord-soft-button:disabled { opacity:.5; cursor:default; }
  .lp-discord-text-button { appearance:none; border:0; padding:3px 0; background:transparent; color:var(--social-muted); font:inherit; font-size:11px; cursor:pointer; }
  .lp-discord-member-tabs { display:flex; gap:6px; margin:0 16px; padding:4px; border-radius:11px; background:var(--discord-rail); }
  .lp-discord-member-tab { appearance:none; flex:1; min-width:0; padding:10px 6px; min-height:40px; border:0; border-radius:8px; background:transparent; color:var(--social-muted); font:650 12px/1.3 system-ui,sans-serif; cursor:pointer; }
  .lp-discord-member-tab[aria-pressed="true"] { background:var(--discord-input); color:var(--social-text); }
  .lp-discord-member-body { padding:20px 16px 28px; min-width:0; }
  .lp-discord-member-body h2 { font-size:16px; margin:0; }
  .lp-discord-members-heading { display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; }
  .lp-discord-picker-hint,.lp-discord-member-empty { color:var(--social-muted); font-size:12px; line-height:1.5; margin:9px 0 18px; }
  .lp-discord-member-manager .lp-discord-people-list { gap:8px; margin:16px 0 0; }
  .lp-discord-member-manager .lp-discord-people-list > li { display:block; }
  .lp-discord-member-card { width:100%; border-radius:11px; background:var(--social-bg); overflow:hidden; }
  .lp-discord-member-card > summary { display:flex; align-items:center; gap:11px; padding:12px; cursor:pointer; list-style:none; }
  .lp-discord-member-card > summary::-webkit-details-marker,.lp-discord-picker-group > summary::-webkit-details-marker { display:none; }
  .lp-discord-member-copy { display:grid; flex:1; min-width:0; gap:4px; }
  .lp-discord-member-copy strong { font-size:13px; overflow-wrap:anywhere; }
  .lp-discord-member-copy small { color:var(--social-muted); font-size:11px; overflow-wrap:anywhere; }
  .lp-discord-member-chevron { margin-left:auto; color:var(--social-muted); font-size:22px; transform:rotate(0); }
  .lp-discord-member-card[open] .lp-discord-member-chevron { transform:rotate(90deg); }
  .lp-discord-member-card > div { padding:0 12px 13px 58px; }
  .lp-discord-member-card p { color:var(--social-muted); font-size:12px; line-height:1.6; margin:0; }
  .lp-discord-member-card .lp-social-avatar,.lp-discord-picker-row .lp-social-avatar { width:34px; height:34px; flex:none; }
  .lp-discord-picker-group { border-radius:12px; background:var(--discord-rail); margin-top:12px; overflow:hidden; }
  .lp-discord-picker-group > summary { display:flex; gap:10px; align-items:center; min-height:52px; padding:13px; list-style:none; cursor:pointer; font-size:12px; }
  .lp-discord-group-count { margin-left:auto; border-radius:6px; background:var(--discord-input); color:var(--social-muted); padding:3px 6px; font-size:10px; }
  .lp-discord-picker-group > summary::after { content:'›'; color:var(--social-muted); font-size:20px; }
  .lp-discord-picker-group[open] > summary::after { transform:rotate(90deg); }
  .lp-discord-picker-body { padding:0 10px 10px; }
  .lp-discord-picker-body > .lp-discord-picker-hint { margin:0; padding:0 4px 8px; }
  .lp-discord-picker-row { display:flex; align-items:center; gap:9px; padding:11px 2px; border-top:1px solid #ffffff09; min-width:0; }
  .lp-discord-cast-card { display:flex; flex-wrap:wrap; align-items:center; gap:10px; padding:13px 10px; border-radius:10px; background:var(--social-bg); margin-bottom:8px; min-width:0; }
  .lp-discord-cast-card:last-child { margin-bottom:0; }
  .lp-discord-cast-avatars { display:flex; padding-left:5px; }
  .lp-discord-cast-avatars .lp-social-avatar { width:25px; height:25px; margin-left:-5px; border:2px solid var(--social-bg); }
  .lp-discord-cast-copy { flex:1; min-width:85px; display:grid; gap:4px; }
  .lp-discord-cast-copy strong { font-size:12px; overflow-wrap:anywhere; }
  .lp-discord-cast-copy small { font-size:10px; color:var(--social-muted); }
  .lp-discord-cast-card .lp-discord-soft-button:not(:disabled) { background:#5865f2; color:#fff; }
  .lp-discord-member-manager .lp-discord-person-form { background:var(--social-bg); border-radius:10px; padding:12px; }
  .lp-discord-member-manager .lp-discord-person-form .lp-input { background:var(--discord-rail); color:var(--social-text); border:1px solid #ffffff0a; border-radius:8px; padding:10px; min-height:40px; width:100%; }
  .lp-discord-member-manager .lp-discord-person-form textarea { min-height:80px; resize:vertical; }
  .lp-discord-member-manager .lp-discord-person-form button { justify-self:end; background:#5865f2; }
  .lp-discord-server > img { width:100%; height:100%; object-fit:cover; border-radius:inherit; }
`
