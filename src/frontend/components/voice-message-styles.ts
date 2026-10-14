export const VOICE_MESSAGE_STYLES = `
.lp-voice-message,.pocket-inline-frame[data-pocket-ui="true"] .lp-voice-message { display:grid; gap:8px; min-width:0; }
.lp-voice-play,.pocket-inline-frame[data-pocket-ui="true"] .lp-voice-play { display:block; min-height:44px; padding:9px 12px; border:1px solid currentColor; border-radius:10px; color:inherit; background:transparent; font:inherit; cursor:pointer; text-align:left; }
.lp-voice-play:focus-visible,.pocket-inline-frame[data-pocket-ui="true"] .lp-voice-play:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
.lp-voice-play:disabled,.pocket-inline-frame[data-pocket-ui="true"] .lp-voice-play:disabled { opacity:.6; cursor:default; }
.lp-voice-status,.pocket-inline-frame[data-pocket-ui="true"] .lp-voice-status { font-size:11px; }
.lp-voice-status:empty,.pocket-inline-frame[data-pocket-ui="true"] .lp-voice-status:empty { display:none; }
.lp-voice-transcript,.pocket-inline-frame[data-pocket-ui="true"] .lp-voice-transcript { font-size:12px; }
.lp-voice-transcript summary,.pocket-inline-frame[data-pocket-ui="true"] .lp-voice-transcript summary { cursor:pointer; }
.lp-voice-transcript p,.pocket-inline-frame[data-pocket-ui="true"] .lp-voice-transcript p { white-space:pre-wrap; overflow-wrap:anywhere; margin:8px 0 0; }
.pocket-inline-frame[data-pocket-ui="true"].pocket-phone-device .pocket-phone-lock .lp-voice-message { margin:12px 20px; }
`
