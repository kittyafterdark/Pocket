export const VOICE_MESSAGE_STYLES = `
.lp-voice-message { display:grid; gap:calc(6px * var(--pocket-ui-scale, 1)); min-width:min(180px, 100%); max-width:100%; white-space:normal; }
.lp-voice-bar { display:flex; align-items:center; gap:calc(8px * var(--pocket-ui-scale, 1)); min-width:0; }
.lp-voice-play {
  appearance:none; width:calc(28px * var(--pocket-ui-scale, 1)); height:calc(28px * var(--pocket-ui-scale, 1));
  border-radius:50%; border:0; padding:0; display:grid; place-items:center; flex:none; cursor:pointer;
  background:var(--lp-outgoing, var(--lp-accent)); color:#fff;
  box-shadow:0 2px 8px rgba(0,0,0,.18); transition:transform .14s ease, opacity .14s ease;
}
.lp-bubble[data-sender="persona"] .lp-voice-play { background:rgba(255,255,255,.24); color:#fff; box-shadow:none; }
.lp-voice-play svg { width:calc(12px * var(--pocket-ui-scale, 1)); height:calc(12px * var(--pocket-ui-scale, 1)); }
.lp-voice-play:focus-visible, .lp-voice-transcript-toggle:focus-visible { outline:2px solid currentColor; outline-offset:3px; border-radius:8px; }
.lp-voice-play:focus-visible { border-radius:50%; }
.lp-voice-play:disabled { opacity:.55; cursor:default; }
.lp-voice-wave { flex:1 1 auto; min-width:48px; display:flex; align-items:center; gap:calc(3px * var(--pocket-ui-scale, 1)); height:calc(20px * var(--pocket-ui-scale, 1)); overflow:hidden; }
.lp-voice-wave i { flex:0 0 3px; width:3px; border-radius:99px; background:currentColor; opacity:.36; transition:opacity .15s ease, transform .15s ease; }
.lp-voice-message.is-playing .lp-voice-wave i { opacity:.92; animation:lp-voice-pulse .7s ease-in-out infinite alternate; }
.lp-voice-message.is-playing .lp-voice-wave i:nth-child(odd) { animation-delay:.15s; }
.lp-voice-message.is-playing .lp-voice-wave i:nth-child(3n) { animation-delay:.3s; }
.lp-voice-dur { font-size:calc(10px * var(--pocket-ui-scale, 1)); font-weight:700; font-variant-numeric:tabular-nums; opacity:.78; flex:none; }
.lp-voice-status { font-size:calc(10px * var(--pocket-ui-scale, 1)); font-weight:600; color:var(--lp-destructive, #ff697e); line-height:1.35; }
.lp-bubble[data-sender="persona"] .lp-voice-status { color:#fff; background:rgba(0,0,0,.2); padding:3px 7px; border-radius:7px; width:max-content; max-width:100%; }
.lp-voice-status:empty { display:none; }
.lp-voice-transcript-toggle {
  appearance:none; border:0; background:transparent; color:inherit; padding:2px 0;
  display:inline-flex; align-items:center; gap:5px; font:inherit;
  font-size:calc(10px * var(--pocket-ui-scale, 1)); font-weight:650; opacity:.8; cursor:pointer; width:max-content;
}
.lp-voice-transcript-toggle:hover { opacity:1; }
.lp-voice-transcript-toggle svg { width:calc(11px * var(--pocket-ui-scale, 1)); height:calc(11px * var(--pocket-ui-scale, 1)); flex:none; }
.lp-voice-transcript { padding-top:calc(6px * var(--pocket-ui-scale, 1)); border-top:1px solid color-mix(in srgb, currentColor 16%, transparent); font-size:1em; line-height:1.45; }
.lp-voice-transcript[hidden] { display:none; }
.lp-voice-transcript p { margin:0; white-space:pre-wrap; overflow-wrap:anywhere; }
@keyframes lp-voice-pulse { from { transform:scaleY(.65); } to { transform:scaleY(1.15); } }
.lumiphone-shell[data-reduced-motion="true"] .lp-voice-message.is-playing .lp-voice-wave i { animation:none; }
@media (prefers-reduced-motion:reduce) { .lp-voice-message.is-playing .lp-voice-wave i { animation:none; } }
`
