export const VOICE_MESSAGE_STYLES = `
.lp-voice-message { display:grid; gap:8px; min-width:0; }
.lp-voice-play { padding:9px 12px; border:1px solid currentColor; border-radius:10px; color:inherit; background:transparent; font:inherit; cursor:pointer; text-align:left; }
.lp-voice-play:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
.lp-voice-play:disabled { opacity:.6; cursor:default; }
.lp-voice-status { font-size:11px; }
.lp-voice-status:empty { display:none; }
.lp-voice-transcript { font-size:12px; }
.lp-voice-transcript summary { cursor:pointer; }
.lp-voice-transcript p { white-space:pre-wrap; overflow-wrap:anywhere; margin:8px 0 0; }
`
