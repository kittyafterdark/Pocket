/** Surface tokens shared by the handset and detached media viewer. */
export const SURFACE_TOKENS = `
  .lumiphone-shell, .lp-media-viewer {
    --lp-space-1:4px; --lp-space-2:8px; --lp-space-3:12px; --lp-space-4:16px; --lp-space-5:24px;
    --lp-radius:18px; --lp-radius-control:12px; --lp-radius-bubble:18px;
    --lp-touch:44px; --lp-row-height:64px; --lp-outgoing:var(--lp-accent);
    --lp-incoming:color-mix(in srgb,var(--lp-text) 8%,var(--lp-bg)); --lp-destructive:#ed7c8c; --lp-success:#71cfa1;
    --lp-ease:cubic-bezier(.2,.8,.2,1); --lp-sheet-bg:var(--lp-bg,#141319);
    --lp-elevation:0 12px 36px #0002;
    --pocket-font-xs:calc(10px * var(--pocket-ui-scale,1));
    --pocket-font-sm:calc(12px * var(--pocket-ui-scale,1));
    --pocket-font-md:calc(14px * var(--pocket-ui-scale,1));
    --pocket-control-h:44px;
  }
`
