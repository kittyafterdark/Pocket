import REDESIGN from './pocket-inline-redesign.css' with { type: 'text' }

// Kept in their original cascade order for global compatibility and isolated roots.
export const INLINE_BASE_STYLES = `
  .pocket-receipt-host { display:block; margin:8px 0 2px; max-width:min(100%,460px); }
  .pocket-inline-anchor { display:block; width:100%; margin:12px 0; min-height:0; }
  .pocket-inline-anchor[hidden] { display:none !important; }
  .pocket-inline-anchor .pocket-artifact-stack { width:100%; }
  .pocket-artifact-stack { display:grid; gap:5px; }
  .pocket-artifact-stack > .pocket-inline-frame { margin-inline:auto; }
  .pocket-inline-transcript-row[hidden] { display:none; }
  .pocket-receipt { appearance:none; width:100%; min-height:30px; padding:4px 7px; border:0; border-radius:9px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:7px; background:color-mix(in srgb,var(--lumiverse-fill,#17151d) 75%,transparent); color:var(--lumiverse-text,#f7f5ff); font:inherit; text-align:left; opacity:.72; }
  button.pocket-receipt { cursor:pointer; }
  button.pocket-receipt:hover { opacity:1; background:color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 9%,var(--lumiverse-fill,#17151d)); }
  button.pocket-receipt:focus-visible,.pocket-inline-artifact:focus-visible { outline:3px solid color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 55%,white); outline-offset:2px; }
  .pocket-receipt-kind { padding:2px 5px; border-radius:7px; background:color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 12%,transparent); font-size:8px; font-weight:800; }
  .pocket-receipt-copy { min-width:0; display:flex; align-items:baseline; gap:6px; }
  .pocket-receipt-copy strong,.pocket-receipt-copy span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pocket-receipt-copy strong { font-size:9px; }
  .pocket-receipt-copy span { opacity:.6; font-size:8px; }
  .pocket-receipt-arrow { font-size:14px; opacity:.45; }
`
export const INLINE_FINISH_STYLES = `
  .pocket-receipt { width:min(100%,420px); min-height:52px; padding:10px 12px; grid-template-columns:auto minmax(0,1fr) auto; gap:10px; border-radius:18px; border:1px solid color-mix(in srgb,var(--lumiverse-text,#fff) 12%,transparent); box-shadow:none; background:#222027; backdrop-filter:none; opacity:1; }
  button.pocket-receipt:hover { background:color-mix(in srgb,var(--lumiverse-fill,#17151d) 85%,var(--lumiverse-primary,#8b7dff)); }
  .pocket-receipt-kind { padding:7px; border-radius:10px; background:color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 22%,transparent); font-size:9px; font-weight:750; }
  .pocket-receipt-copy strong { font-size:11px; font-weight:650; }
  .pocket-receipt-copy { display:grid; gap:3px; }
  .pocket-receipt-copy span { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; white-space:normal; font-size:12px; line-height:1.35; opacity:.8; }
  .pocket-receipt-arrow { font-size:11px; opacity:.4; }
  .pocket-receipt-details { margin:0 2px; font-size:9px; opacity:.42; order:3; }
  .pocket-receipt-details summary { width:max-content; cursor:pointer; }
  .pocket-receipt-details > span { display:block; margin-top:3px; max-width:460px; line-height:1.35; }
@media (prefers-reduced-motion:reduce) { .pocket-inline-artifact { animation:none!important; transition:none!important; scroll-behavior:auto!important; } }
${REDESIGN}
`
export const INLINE_STYLES = INLINE_BASE_STYLES + INLINE_FINISH_STYLES
