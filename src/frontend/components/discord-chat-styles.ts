export const DISCORD_CHAT_STYLES = `
  .lumiphone-shell .lp-social-page-discord[data-discord-theme] { --social-bg:#313338;--social-surface:#313338;--social-text:#f2f3f5;--social-muted:#b5bac1;--social-border:#25262b;--social-accent:#b5baff;--discord-rail:#1e1f22;--discord-panel:#2b2d31;--discord-input:#383a40; }
  .lumiphone-shell .lp-social-page-discord[data-discord-theme="amoled"] { --social-bg:#000;--social-surface:#080808;--social-border:#202024;--discord-rail:#000;--discord-panel:#0c0c0f;--discord-input:#17171c; }
  .lumiphone-shell .lp-social-page-discord[data-discord-theme="gradient"] { --social-bg:transparent;--social-surface:#16151e88;--social-border:#ffffff16;--discord-rail:#0d0b168c;--discord-panel:#151220ec;--discord-input:#151220b3;background:linear-gradient(155deg,var(--discord-start),var(--discord-end)); }
  .lp-social-page-discord[data-discord-theme="gradient"] .lp-content.lp-social-discord,.lp-social-page-discord[data-discord-theme="gradient"] .lp-discord-main {background:transparent;}
  .lp-discord-channel-heading > strong {flex:1;min-width:0;}
  .lp-discord-pins-open {font-size:18px;flex:none;}
  .lumiphone-shell .lp-social-discord .lp-discord-message {display:grid;grid-template-columns:32px minmax(0,1fr);gap:9px;padding:7px 10px 8px;border:0;background:transparent;border-radius:0;position:relative;min-width:0;}
  .lp-discord-message:focus {outline:2px solid var(--social-accent);outline-offset:-2px;background:#5865f214;}
  .lp-discord-message-avatar {border:0;background:transparent;padding:0;align-self:start;cursor:pointer;}
  .lp-discord-message-avatar .lp-social-avatar {width:32px;height:32px;border-radius:50%;}
  .lp-discord-message-main {min-width:0;}
  .lp-discord-message-head {display:flex;align-items:baseline;gap:7px;min-width:0;line-height:20px;}
  .lp-discord-message-name {font:inherit;font-size:12px;font-weight:700;background:none;border:0;padding:0;text-align:left;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
  .lp-discord-message-head time {color:var(--social-muted);font-size:8px;white-space:nowrap;}
  .lp-discord-message-menu {margin-left:auto;flex:none;align-self:center;border:0;background:transparent;color:var(--social-muted);font-size:19px;line-height:20px;padding:0 4px;cursor:pointer;}
  .lp-discord-message-text {margin:1px 0 3px;font-size:12px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--social-text);}
  .lp-discord-reply-hook {display:flex;align-items:center;gap:5px;max-width:100%;min-width:0;height:23px;position:relative;margin:-2px 0 2px;padding:0;border:0;background:none;color:var(--social-muted);font-size:10px;text-align:left;cursor:pointer;}
  .lp-discord-reply-hook:before {content:'';position:absolute;width:19px;height:12px;border-left:2px solid #697078;border-top:2px solid #697078;border-radius:7px 0 0;left:-25px;top:11px;}
  .lp-discord-reply-hook .lp-social-avatar {width:15px;height:15px;flex:none;}
  .lp-discord-reply-hook > strong {max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lp-discord-reply-hook > span:last-child {overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lp-discord-message:has(.lp-discord-reply-hook) > .lp-discord-message-avatar {margin-top:24px;}
  .lp-discord-reactions {display:flex;gap:4px;flex-wrap:wrap;margin-top:5px;}
  .lp-discord-reaction {display:flex;align-items:center;gap:4px;border:1px solid #ffffff15;background:var(--discord-input);border-radius:7px;min-height:25px;padding:2px 6px;color:var(--social-text);font-size:12px;cursor:pointer;}
  .lp-discord-reaction[aria-pressed="true"] {background:#5865f240;border-color:#949cf7;}
  .lp-discord-pinned-label {font-size:8px;color:var(--social-muted);}
  .lumiphone-shell .lp-discord-main > .lp-social-compose {display:flex;flex-direction:column;gap:4px;padding:8px 10px 12px;border:0;background:var(--social-bg);flex:none;}
  .lumiphone-shell .lp-discord-main > .lp-social-compose > .lp-social-avatar {display:none;}
  .lumiphone-shell .lp-discord-main > .lp-social-compose .lp-social-compose-title {display:none;}
  .lumiphone-shell .lp-discord-main > .lp-social-compose.lp-discord-reply-compose .lp-social-compose-title {grid-column:1/-1;grid-row:auto;display:flex;align-items:center;justify-content:space-between;gap:5px;min-width:0;margin:0;padding:6px 9px;background:var(--discord-panel);border-radius:7px 7px 0 0;font-size:10px;color:var(--social-muted);}
  .lumiphone-shell .lp-discord-main > .lp-social-compose .lp-discord-composer-bar {display:flex;align-items:center;gap:3px;padding:5px 6px;min-width:0;max-width:100%;border-radius:24px;background:var(--discord-input);}
  .lumiphone-shell .lp-discord-main > .lp-social-compose .lp-discord-composer-bar .lp-social-post-text-field {display:block;flex:1;min-width:0;margin:0;}
  .lumiphone-shell .lp-discord-main > .lp-social-compose .lp-social-post-text-field > span {position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);}
  .lumiphone-shell .lp-discord-main > .lp-social-compose .lp-discord-composer-bar textarea {display:block;width:100%;height:34px;min-height:34px;max-height:100px;padding:8px 6px;font-size:12px;line-height:18px;box-sizing:border-box;border:0;resize:none;border-radius:16px;background:transparent;color:var(--social-text);}
  .lumiphone-shell .lp-discord-main > .lp-social-compose .lp-discord-composer-bar .lp-social-compose-footer {display:flex;align-items:center;flex:none;gap:4px;min-height:0;margin:0;padding:0;background:transparent;border-radius:0;}
  .lumiphone-shell .lp-discord-main > .lp-social-compose .lp-discord-composer-bar .lp-social-primary {display:grid;place-items:center;flex:none;padding:0;width:30px;min-width:30px;max-width:30px;height:30px;min-height:30px;max-height:30px;border:0;border-radius:50%;line-height:1;}
  .lp-discord-composer-bar .lp-social-primary .lp-social-glyph {width:17px;height:17px;}
  .lp-discord-expression-button {display:grid;place-items:center;flex:none;width:30px;height:30px;padding:0;border:0;border-radius:50%;color:var(--social-muted);background:transparent;cursor:pointer;}
  .lp-discord-expression-button .lp-social-glyph {width:22px;height:22px;}
  .lp-discord-expression-button:hover {color:var(--social-text);background:#ffffff0b;}
  .lp-discord-expression-tabs {display:flex;gap:5px;padding:4px;margin-bottom:16px;background:var(--discord-input,#33343d);border-radius:12px;}
  .lp-discord-expression-tabs [role="tab"] {flex:1;min-width:0;min-height:36px;padding:7px 12px;border:0;border-radius:9px;color:var(--social-muted,#b5bac1);background:transparent;font:inherit;font-weight:700;cursor:pointer;}
  .lp-discord-expression-tabs [aria-selected="true"] {color:var(--social-text,#fff);background:#ffffff17;}
  .lp-discord-expression-tabs [disabled] {opacity:.45;cursor:default;}
  .lp-discord-expression-picker [role="tabpanel"][hidden] {display:none;}
  .lp-discord-expression-picker .lp-discord-emoji-grid {max-height:240px;}

  .lp-discord-gif-button {border:1px solid #9da2ab;border-radius:3px;font-size:9px;font-weight:800;color:var(--social-text);background:transparent;cursor:pointer;padding:2px 4px;}
  .lp-social-gif {margin:7px 0;max-width:100%;width:fit-content;}
  .lp-social-gif img {display:block;max-width:100%;max-height:280px;object-fit:contain;border-radius:8px;}
  .lp-social-gif figcaption {font-size:8px;color:var(--social-muted);margin-top:3px;}
  .lumiphone-shell .lp-discord-main > .lp-social-compose > .lp-social-gif-draft {grid-column:1/-1;}
  .lp-social-gif-draft {grid-column:1/-1;max-height:160px;overflow:auto;position:relative;padding:5px;}
  .lp-social-gif-draft img {max-height:115px;}
  .lp-social-gif-draft button {font-size:10px;}
  .lumiphone-shell .lp-discord-main > .lp-discord-profile {padding:0;display:flex;flex-direction:column;background:linear-gradient(170deg,var(--profile-start),var(--profile-end));}
  .lp-discord-profile-banner {height:110px;background:linear-gradient(120deg,var(--profile-start),var(--profile-end));flex:none;}
  .lp-discord-profile-body {flex:1;padding:0 16px 22px;background:#15151a70;min-width:0;min-height:220px;display:flow-root;}
  .lp-discord-profile-body > .lp-social-profile-head {margin-top:-33px;gap:9px;margin-bottom:20px;display:flex;flex-direction:column;align-items:flex-start;}
  .lp-discord-profile-body .lp-social-profile-head > .lp-social-avatar,.lp-discord-member-profile .lp-social-avatar {width:74px;height:74px;outline:6px solid #282735;border-radius:50%;flex:none;}
  .lp-discord-profile-body .lp-social-profile-identity {display:grid;gap:4px;width:100%;}
  .lp-discord-profile-body .lp-social-profile-identity strong {font-size:23px;}
  .lp-discord-profile-body .lp-social-profile-handle {font-size:12px;color:#e0ddec;}
  .lp-discord-profile-body .lp-social-profile-count {font-size:9px;opacity:.65;margin-top:4px;}
  .lp-discord-about {background:#17131e70;border-radius:9px;padding:14px;margin:18px 0 12px;}
  .lp-discord-about h3,.lp-discord-member-profile h3 {font-size:10px;letter-spacing:.5px;margin:0 0 8px;}
  .lp-discord-about .lp-social-bio {margin:0;font-size:12px;line-height:1.6;}
  .lp-discord-profile-body > .lp-social-edit-profile {margin:4px 5px 4px 0;border:1px solid #ffffff22;background:#ffffff13;border-radius:6px;font-size:10px;min-height:30px;padding:6px 9px;color:#fff;}
  .lp-discord-profile-body .lp-social-bio-form {margin-top:12px;}
  .lp-discord-dialog {background:var(--social-surface,#232428);color:var(--social-text,#fff);}
  .lp-discord-sheet {font-size:12px;min-width:0;color:var(--social-text,#f2f3f5);}
  .lp-discord-quick-reactions {display:flex;gap:5px;justify-content:space-between;margin-bottom:14px;}
  .lp-discord-emoji {border:0;background:var(--discord-input,#33343d);border-radius:9px;width:34px;height:36px;display:grid;place-items:center;padding:0;font-size:22px;cursor:pointer;color:var(--social-text,#fff);}
  .lp-discord-context-action {display:block;text-align:left;width:100%;padding:14px 12px;border:0;border-bottom:1px solid var(--social-border,#ffffff12);background:var(--discord-input,#33343d);color:inherit;font-size:13px;cursor:pointer;}
  .lp-discord-context-action:first-of-type {border-radius:8px 8px 0 0;}
  .lp-discord-context-action:last-child {border:0;border-radius:0 0 8px 8px;}
  .lp-discord-emoji-grid {display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin-top:15px;max-height:280px;overflow:auto;}
  .lp-discord-search-label {display:grid;gap:8px;min-width:0;font-size:11px;}
  .lp-discord-gradient-editor {display:grid;gap:15px;}
  .lp-discord-gradient-editor > label {display:flex;align-items:center;justify-content:space-between;}
  .lp-discord-gradient-editor input[type="color"] {width:52px;height:32px;padding:2px;border:1px solid #ffffff30;border-radius:6px;}
  .lp-discord-gradient-preview {height:100px;border-radius:12px;}
  .lp-discord-member-profile {margin:-4px -4px 0;overflow:hidden;border-radius:10px;background:linear-gradient(170deg,var(--profile-start),var(--profile-end));color:#fff;}
  .lp-discord-member-profile .lp-discord-profile-body > .lp-social-avatar {margin-top:-34px;}
  .lp-discord-member-profile .lp-copy {color:#d2cfdf;}
  .lp-discord-member-profile h2 {margin:17px 0 5px;font-size:23px;}
  .lp-discord-member-profile h3 {margin-top:25px;}
  .lp-discord-member-bio {white-space:pre-wrap;line-height:1.6;}
  .lp-discord-pin-card {display:block;width:100%;padding:12px;border:1px solid var(--social-border,#555);background:var(--discord-input,#33343d);color:inherit;border-radius:8px;text-align:left;margin-bottom:10px;cursor:pointer;}
  .lp-discord-pin-card p {margin:5px 0 0;white-space:pre-wrap;line-height:1.5;}
  .lp-gif-picker form {display:flex;gap:8px;align-items:end;}
  .lp-gif-picker form label {flex:1;}
  .lp-gif-results {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;max-height:330px;overflow:auto;margin-top:12px;}
  .lp-gif-result {padding:0;border:0;background:transparent;cursor:pointer;min-width:0;}
  .lp-gif-result img {width:100%;border-radius:7px;display:block;}
`
