export const ATTACHMENT_STYLES = `
  .lp-attachment-dialog { --attach-accent:var(--lumiverse-primary,#a99bff); --attach-border:var(--lumiverse-border,#ffffff20); }
  .lp-attachment { display:grid; gap:18px; min-width:0; color:var(--lumiverse-text,#f1eef8); }
  .lp-attachment *, .lp-attachment *::before { box-sizing:border-box; }
  .lp-attachment [hidden] { display:none !important; }
  .lp-attachment-tabs { display:grid; grid-template-columns:1fr 1fr; padding:4px; gap:4px; border:1px solid var(--attach-border); border-radius:14px; background:#ffffff04; }
  .lp-attachment-tab { display:flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:10px; padding:11px; background:transparent; color:var(--lumiverse-text-muted,#aaa5b7); font:inherit; font-size:13px; font-weight:600; cursor:pointer; }
  .lp-attachment-tab[aria-selected=true] { background:color-mix(in srgb,var(--attach-accent) 18%,transparent); color:var(--lumiverse-text,#f1eef8); }
  .lp-attachment svg { width:19px; height:19px; flex:none; }
  .lp-attachment-panel { display:grid; gap:16px; min-width:0; }
  .lp-attachment-sources { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .lp-attachment-action { display:flex; align-items:center; justify-content:center; gap:9px; min-height:44px; padding:11px 13px; border:1px solid var(--attach-border); border-radius:12px; background:#ffffff05; color:inherit; font:inherit; cursor:pointer; }
  .lp-attachment-action:hover:not(:disabled) { background:#ffffff0b; border-color:var(--attach-accent); }
  .lp-attachment-action:disabled { opacity:.45; cursor:default; }
  .lp-attachment-action[data-primary] { background:var(--attach-accent); color:#17131f; border-color:transparent; font-weight:650; }
  .lp-attachment .lp-field { display:grid; gap:7px; margin:0; min-width:0; }
  .lp-attachment .lp-field-label { font-size:12px; font-weight:600; color:inherit; }
  .lp-attachment .lp-input { display:block; width:100%; min-height:64px; resize:vertical; border:1px solid var(--attach-border); border-radius:12px; background:#ffffff04; padding:12px; color:inherit; font:inherit; line-height:1.5; }
  .lp-attachment .lp-input::placeholder { color:var(--lumiverse-text-muted,#aaa5b7); opacity:.8; }
  .lp-attachment-preview { display:grid; place-items:center; position:relative; aspect-ratio:16/10; min-height:120px; overflow:hidden; border:1px solid var(--attach-border); border-radius:14px; background:linear-gradient(145deg,#ffffff05,#ffffff01); }
  .lp-attachment-preview img { width:100%; height:100%; position:absolute; inset:0; object-fit:contain; }
  .lp-attachment-placeholder { display:grid; justify-items:center; gap:9px; padding:20px; text-align:center; color:var(--lumiverse-text-muted,#aaa5b7); font-size:12px; }
  .lp-attachment-placeholder svg { width:30px; height:30px; opacity:.65; }
  .lp-attachment-progress { width:100%; height:4px; accent-color:var(--attach-accent); }
  .lp-attachment-status { margin:0; font-size:12px; color:var(--lumiverse-text-muted,#aaa5b7); }
  .lp-attachment-footer { display:flex; flex-wrap:wrap; gap:10px; }
  .lp-attachment-footer > button { flex:1; }
  .lp-attachment-event { display:grid; justify-items:center; padding:28px 12px 14px; text-align:center; gap:14px; }
  .lp-attachment-event-art { display:grid; place-items:center; width:72px; height:72px; border:1px solid color-mix(in srgb,var(--attach-accent) 25%,transparent); background:color-mix(in srgb,var(--attach-accent) 10%,transparent); border-radius:22px; color:var(--attach-accent); }
  .lp-attachment-event-art svg { width:33px; height:33px; }
  .lp-attachment-event h3 { margin:4px 0 0; font-size:20px; line-height:1.3; }
  .lp-attachment-event p { margin:0 0 8px; max-width:290px; font-size:13px; line-height:1.7; color:var(--lumiverse-text-muted,#aaa5b7); }
  .lp-attachment-event > button { width:100%; }
  .lp-attachment :is(button,textarea):focus-visible { outline:2px solid var(--attach-accent); outline-offset:3px; }
  .lp-attachment-dialog { max-height:calc(100dvh - var(--app-interactive-safe-top,0px) - 24px); overflow:auto; scroll-padding-block:18px; }
`;
