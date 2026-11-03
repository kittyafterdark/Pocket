export const MESSAGE_MANAGEMENT_STYLES = `
  .lp-inbox-actions > summary { min-width:40px; min-height:40px; border-radius:10px; }
  .lp-inbox-actions .lp-conversation-menu-action { min-height:42px; font-size:12px; }
  .lp-inbox-actions > summary:focus-visible,.lp-inbox-actions button:focus-visible { outline:2px solid var(--lp-accent); outline-offset:2px; }
  .lp-conversation-selection-tools { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:6px 0; position:sticky; top:0; z-index:2; background:var(--lp-bg); }
  .lp-conversation-selection-tools .lp-button { min-height:42px; font-size:12px; padding:10px 12px; }
  .lp-conversation-select { cursor:pointer; }
  .lp-conversation-select input[type=checkbox] { flex:none; width:20px; height:20px; margin:0; accent-color:var(--lp-accent); }
  .lp-conversation-select:has(input:checked) { background:color-mix(in srgb,var(--lp-accent) 8%,transparent); }
  .lp-conversation-delete-confirm { display:grid; gap:16px; font-size:13px; line-height:1.65; min-width:0; }
  .lp-conversation-delete-confirm p { margin:0; }
  .lp-conversation-delete-confirm ul { margin:0; padding-left:20px; max-height:200px; overflow:auto; }
  .lp-conversation-delete-confirm li { padding:4px 0; overflow-wrap:anywhere; }
  .lp-button-destructive { background:color-mix(in srgb,var(--lp-destructive,#ff899a) 15%,var(--lp-surface)); color:var(--lp-destructive,#ff899a); border:1px solid color-mix(in srgb,var(--lp-destructive,#ff899a) 35%,transparent); }
  .lp-reply-failure { align-self:stretch; padding:15px 16px; margin:12px 0; border:1px solid color-mix(in srgb,var(--lp-accent) 35%,var(--lp-border)); border-radius:15px; background:color-mix(in srgb,var(--lp-accent) 7%,var(--lp-surface)); color:var(--lp-text); font-size:12px; line-height:1.6; }
  .lp-reply-failure strong { display:block; font-size:13px; font-weight:600; }
  .lp-reply-failure p { margin:6px 0 10px; color:var(--lp-muted); overflow-wrap:anywhere; }
  .lp-reply-failure .lp-button { min-height:42px; font-size:12px; }
  .lp-conversation-selection-tools button:focus-visible,.lp-conversation-select input:focus-visible,.lp-reply-failure button:focus-visible { outline:2px solid var(--lp-accent); outline-offset:3px; }
`
