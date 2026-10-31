/** Appearance only: native message rendering, directions and composer handlers stay intact. */
export const LUMISTRY_THREAD_STYLES = `
.lumistry-chat-tools{padding:3px 10px;min-height:0}.lumistry-chat-tools .lumistry-chat-tools-toggle{min-height:30px;padding:4px 10px;font-size:12px;box-shadow:none;background:transparent;border:0;opacity:.85}.lumistry-chat-tools-panel{max-height:min(40dvh,320px);overflow:auto;overscroll-behavior:contain;padding:0 2px 8px}.lumistry-chat-tools-panel .lumistry-next-steps{max-height:none;overflow:visible}

.lumistry.lumistry-thread[data-lumistry-theme="sticker"] {
  --chat-incoming:var(--st-paper);--chat-outgoing:var(--st-mint);--chat-outgoing-text:var(--st-ink);
  --chat-line:var(--st-ink);--chat-line-width:2.5px;--chat-shadow:var(--st-die-sm);
  --chat-photo:var(--st-note);--chat-send:var(--st-berry);--chat-send-text:#fff;
}
.lumistry.lumistry-thread[data-lumistry-theme="distillery"] {
  --chat-incoming:var(--dd-glass);--chat-outgoing:#25404d;--chat-outgoing-text:var(--dd-text);
  --chat-line:var(--dd-edge-soft);--chat-line-width:1px;--chat-shadow:var(--dd-lift);
  --chat-photo:var(--dd-glass2);--chat-send:var(--dd-mint);--chat-send-text:var(--dd-bg);
}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] {
  --chat-incoming:var(--md-card);--chat-outgoing:var(--md-grad);--chat-outgoing-text:#fff;
  --chat-line:var(--md-line);--chat-line-width:1px;--chat-shadow:var(--md-shadow-sm);
  --chat-photo:var(--md-soft);--chat-send:var(--md-grad);--chat-send-text:#fff;
}
.lumistry.lumistry-thread {height:100%;min-height:0;overflow:hidden;background-repeat:repeat;grid-template-rows:auto auto minmax(0,1fr) auto}
.lumistry.lumistry-thread .lp-nav {position:relative;min-height:58px;grid-template-columns:74px minmax(0,1fr) 44px}
.lumistry.lumistry-thread .lp-nav-title {font-size:18px;line-height:1.2}
.lumistry.lumistry-thread .lp-nav-subtitle {font-size:11px;color:var(--lp-muted);margin-top:4px}
.lumistry.lumistry-thread .lp-nav-action {min-height:40px;font-size:14px;font-weight:700;color:var(--lp-accent)}
.lumistry.lumistry-thread .lp-bubbles {gap:12px;padding:18px 16px;scroll-padding:16px;background:transparent}
.lumistry.lumistry-thread .lp-bubble {max-width:84%;padding:11px 13px;border:var(--chat-line-width) solid var(--chat-line);border-radius:20px;font-size:max(14px,var(--pocket-font-md,14px));line-height:1.5;box-shadow:var(--chat-shadow)}
.lumistry.lumistry-thread .lp-bubble[data-sender="contact"] {background:var(--chat-incoming);color:var(--lp-text);border-bottom-left-radius:6px}
.lumistry.lumistry-thread .lp-bubble[data-sender="persona"] {background:var(--chat-outgoing);color:var(--chat-outgoing-text);border-bottom-right-radius:6px}
.lumistry.lumistry-thread .lp-bubbles .lp-bubble::after {content:none}
.lumistry.lumistry-thread .lp-bubble[data-sender="system"] {padding:6px 10px;max-width:94%;border:0;background:transparent;color:var(--lp-muted);font-size:12px;box-shadow:none}
.lumistry.lumistry-thread .lp-bubble[data-burst-continuation="true"] {margin-top:-5px}
.lumistry.lumistry-thread .lp-bubble-time {font-size:10px;line-height:1.4;opacity:.8;margin-top:7px}
.lumistry.lumistry-thread .lp-bubble-tools {gap:4px;margin-top:5px}
.lumistry.lumistry-thread .lp-bubble-action {width:28px;height:28px;min-height:28px;opacity:.8;font-size:14px;border:1px solid transparent}
.lumistry.lumistry-thread .lp-bubble-action:hover {background:color-mix(in srgb,currentColor 10%,transparent);border-color:currentColor}
.lumistry.lumistry-thread .lp-bubble-pending {min-width:62px}
.lumistry.lumistry-thread .lp-typing-dots {gap:5px;min-height:18px}
.lumistry.lumistry-thread .lp-typing-dots i {width:6px;height:6px}
.lumistry.lumistry-thread .lp-conversation-status {align-self:center;max-width:95%;font-size:12px;color:var(--lp-muted);background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:14px;padding:8px 12px}
.lumistry.lumistry-thread .lp-compose-stack {border-top:var(--chat-line-width) solid var(--chat-line);background:var(--lp-bg);backdrop-filter:none}
.lumistry.lumistry-thread .lp-compose {grid-template-columns:44px minmax(0,1fr);align-items:end;gap:10px;padding:12px 12px max(12px,env(safe-area-inset-bottom))}
.lumistry.lumistry-thread .lp-compose[data-has-attachment="true"] {grid-template-columns:44px 44px minmax(0,1fr) 44px}
.lumistry.lumistry-thread .lp-compose .lp-textarea {min-width:0;min-height:44px;max-height:112px;padding:10px 12px;border-radius:18px;font-size:max(14px,var(--pocket-font-md,14px));line-height:1.45;resize:none;background:var(--lp-surface);color:var(--lp-text);border:var(--chat-line-width) solid var(--chat-line)}
.lumistry.lumistry-thread .lp-compose .lp-textarea::placeholder {color:var(--lp-muted);opacity:1}
.lumistry.lumistry-thread .lp-compose-input>.lp-textarea {border:0;box-shadow:none;background:transparent;min-width:0;flex:1}
.lumistry.lumistry-thread .lp-compose .lp-button {width:44px;height:44px;min-height:44px;padding:0;border-radius:15px;gap:0;display:grid;place-items:center;font-size:18px}
.lumistry.lumistry-thread .lp-compose .lp-button[type="submit"] {background:var(--chat-send);color:var(--chat-send-text);border-color:var(--chat-line)}
.lumistry.lumistry-thread .lp-compose .lp-reply-stop {color:var(--lp-destructive);background:var(--lp-surface)}
.lumistry.lumistry-thread .lp-conversation-menu {border:0;padding:0;background:transparent;border-radius:0}
.lumistry.lumistry-thread .lp-conversation-menu > summary {justify-content:center;min-height:40px;padding:0;margin:0;border:0;font-size:22px}
.lumistry.lumistry-thread .lp-conversation-menu[open] > summary {border:0;margin:0}
.lumistry.lumistry-thread .lp-conversation-menu > summary::after {content:none}
.lumistry.lumistry-thread .lp-conversation-menu-sheet {background:var(--lp-surface);color:var(--lp-text);border:var(--chat-line-width) solid var(--chat-line);border-radius:18px;box-shadow:var(--chat-shadow)}
.lumistry.lumistry-thread .lp-conversation-menu-action {min-height:40px;color:var(--lp-text);font-size:13px}
.lumistry.lumistry-thread .lp-conversation-menu-action:hover {background:var(--lp-surface-2)}
.lumistry.lumistry-thread .lumistry-chat-photo {padding:12px;background:var(--chat-photo);color:var(--lp-text);border:1px solid var(--chat-line);border-radius:14px;white-space:normal}
.lumistry.lumistry-thread .lumistry-chat-photo .lumistry-bio {font-size:14px;color:inherit;margin:0}
.lumistry.lumistry-thread .lumistry-chat-photo .lp-button {min-height:40px;padding:8px 12px;font-size:12px}
.lumistry.lumistry-thread :is(.lp-bubble-action,.lp-nav-action,.lp-conversation-menu-action):focus-visible {outline:3px solid var(--lp-accent);outline-offset:3px}
.lumistry.lumistry-thread[data-lumistry-theme="distillery"] .lp-bubble[data-sender="persona"] {border-color:var(--dd-mint);box-shadow:0 3px 14px #0004,inset 0 0 12px #5fe3c011}
.lumistry.lumistry-thread[data-lumistry-theme="sticker"] .lp-compose .lp-button {box-shadow:0 0 0 2px #fff,0 3px 4px #2a1f3d33}
/* Modern chat carries the kit's airy cards, soft glass and coral/violet accents. */
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-nav{background:color-mix(in srgb,var(--md-bg) 90%,transparent);border-bottom:1px solid var(--md-line);backdrop-filter:blur(12px)}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-nav-title{font-weight:800;letter-spacing:-.025em}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-bubble{border-radius:22px;padding:12px 15px}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-bubble[data-sender="contact"]{border-bottom-left-radius:7px}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-bubble[data-sender="persona"]{border-bottom-right-radius:7px;border-color:transparent;box-shadow:0 4px 14px #b8349f24}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-bubble[data-sender="system"]{border:0;box-shadow:none}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-compose-stack{background:var(--md-card);border-top:1px solid var(--md-line)}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-compose .lp-textarea{background:var(--md-soft);border-color:var(--md-line);border-radius:22px}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-compose .lp-button{border-radius:50%;box-shadow:none}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-compose .lp-button[type="submit"]{border:0;box-shadow:0 4px 12px #b8349f33}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lp-compose .lp-textarea:focus-visible{outline:2px solid var(--md-violet);outline-offset:2px}
.lumistry.lumistry-thread[data-lumistry-theme="modern"] .lumistry-chat-photo{border-radius:18px;border-color:var(--md-line)}
@container (max-width:340px) {
  .lumistry.lumistry-thread .lp-compose {gap:6px;padding-left:8px;padding-right:8px}
  .lumistry.lumistry-thread .lp-bubbles {padding:14px 12px}
  .lumistry.lumistry-thread .lp-bubble {max-width:88%}
}
@media (forced-colors:active) {
  .lumistry.lumistry-thread .lp-bubble {border:1px solid CanvasText}
  .lumistry.lumistry-thread .lp-compose .lp-button[type="submit"] {background:ButtonFace;color:ButtonText}
}
`;
