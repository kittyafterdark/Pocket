/** Shared app-owned styles; no host selectors, external assets or regional image work. */
export const LUMISTRY_VISUAL_POLISH_STYLES = `
.lumistry{--lm-fast:180ms;--lm-ease:cubic-bezier(.2,.75,.25,1);--lm-like:#176949;--lm-pass:#6b3d50;--lm-super:#4d3b9d;--lm-error:#a91e38;--lm-action:#825100;position:relative;isolation:isolate;container-type:inline-size}
.lumistry[data-lumistry-theme=distillery]{--lm-like:#91e4bb;--lm-pass:#e7b9c8;--lm-super:#cabdff;--lm-error:#ffafba;--lm-action:#ffda91}
.lumistry [hidden]{display:none!important}
.lumistry button,.lumistry input,.lumistry select,.lumistry textarea{font:inherit;max-width:100%;min-width:0}
.lumistry button,.lumistry summary,.lumistry input:not([type=checkbox]):not([type=radio]),.lumistry select{min-height:2.75rem}
.lumistry[data-lumistry-theme] .lp-button{white-space:normal;overflow-wrap:anywhere;transition:transform var(--lm-fast) var(--lm-ease),background-color var(--lm-fast) var(--lm-ease),box-shadow var(--lm-fast) var(--lm-ease)}
.lumistry .lp-button:active:not(:disabled){transform:scale(.97)}
.lumistry :focus-visible{outline:3px solid var(--lp-accent,currentColor);outline-offset:3px}
.lumistry .lumistry-tabs{position:sticky;top:3.4rem;z-index:14}
.lumistry .lumistry-photo-segment{min-width:2.75rem;min-height:2.75rem}
.lumistry .lumistry-photo-pagination{overflow-x:auto;max-width:calc(100% - 1.5rem)}
.lumistry .lumistry-semantic-error{border-inline-start:4px solid var(--lm-error)}
.lumistry .lumistry-semantic-action{border-inline-start:4px solid var(--lm-action)}
.lumistry .lumistry-swipe{position:sticky;bottom:.5rem;z-index:8;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem;margin:.75rem 0 0;padding:.65rem;background:var(--lp-surface,#fff);border:1px solid var(--lp-border,currentColor);border-radius:1.25rem;box-shadow:0 5px 18px #0002}
.lumistry .lumistry-swipe .lp-button{min-height:3.25rem;font-size:.875rem;padding:.65rem .35rem;justify-content:center}
.lumistry .lumistry-swipe [data-decision=pass]{color:var(--lm-pass);background:var(--lp-surface,#fff);border:2px solid currentColor}
.lumistry .lumistry-swipe [data-decision=like]{color:var(--lp-surface,#fff);background:var(--lm-like);border:2px solid var(--lm-like)}
.lumistry .lumistry-swipe [data-decision=super]{color:var(--lm-super);background:var(--lp-surface,#fff);border:2px solid currentColor}
.lumistry[data-lumistry-theme=distillery] .lumistry-swipe [data-decision=like]{color:#10212a}
.lumistry .lumistry-discovery-card{touch-action:pan-y;transform:translateX(var(--card-drag,0px)) rotate(var(--card-tilt,0deg));transition:transform var(--lm-fast) var(--lm-ease),opacity var(--lm-fast) var(--lm-ease);transform-origin:50% 75%}
.lumistry .lumistry-discovery-card[data-dragging=true]{transition:none;cursor:grabbing}
.lumistry .lumistry-discovery-card[data-exit=like]{transform:translateX(110%) rotate(8deg);opacity:0}
.lumistry .lumistry-discovery-card[data-exit=pass]{transform:translateX(-110%) rotate(-8deg);opacity:0}
.lumistry .lumistry-profile{overflow-wrap:anywhere}
.lumistry .lumistry-portrait .lumistry-portrait-identity{background:linear-gradient(#101019e6,#101019f2);padding:.6rem .75rem;border-radius:.75rem;color:#fff;text-shadow:0 1px 3px #000}
.lumistry .lumistry-portrait .lumistry-portrait-identity *{color:inherit}
.lumistry .lumistry-new-ribbon{position:absolute;left:.75rem;top:2.4rem;z-index:2;font-size:.75rem;font-weight:700;padding:.4rem .6rem;border-radius:.65rem;background:var(--lp-surface,#fff);color:var(--lp-text,#222);border:1px solid currentColor}
.lumistry[data-lumistry-theme=sticker] .lumistry-new-ribbon{border-width:2px;box-shadow:2px 3px 0 currentColor}
.lumistry .lumistry-portrait:not(.lumistry-pixels-ready)>img{opacity:0}
.lumistry .lumistry-portrait:not(.lumistry-pixels-ready)>.lumistry-portrait-placeholder{display:flex}
.lumistry .lumistry-portrait.lumistry-pixels-ready>img{animation:lm-pixels var(--lm-fast) var(--lm-ease) both}
.lumistry[data-lumistry-enter=true] .lumistry-discovery-card{animation:lm-card-arrive 200ms var(--lm-ease) both}
.lumistry .lp-label,.lumistry label.lp-row{min-height:2.75rem}
.lumistry .lumistry-loading-shapes{width:100%;display:grid;gap:.75rem;padding:.5rem;box-sizing:border-box}
.lumistry .lumistry-loading-portrait{height:clamp(10rem,32vh,19rem);border-radius:1.5rem}
.lumistry .lumistry-loading-line{height:1rem;border-radius:.5rem;width:85%}
.lumistry .lumistry-loading-line.short{width:55%}
.lumistry .lumistry-loading-shapes span{display:block;background:linear-gradient(110deg,var(--lp-border,#bbb) 8%,var(--lp-surface,#fff) 18%,var(--lp-border,#bbb) 33%);background-size:220% 100%;opacity:.35;animation:lm-shimmer 1.8s linear infinite}
.lumistry .lumistry-empty{position:relative;text-align:center;gap:1rem}
.lumistry .lumistry-empty-scene{font-size:2rem;display:block;color:var(--lp-muted,currentColor);letter-spacing:.25em}
.lumistry .lumistry-save-bar{position:sticky;bottom:.4rem;z-index:9;display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;padding:.75rem;border:1px solid var(--lp-border,currentColor);border-radius:1rem;background:var(--lp-surface,#fff);color:var(--lp-text,#222);box-shadow:0 -4px 18px #0001}
.lumistry .lumistry-save-bar>span{flex:1 1 10rem;font-size:.875rem}
.lumistry .lumistry-save-bar button{flex:1 1 7rem}
.lumistry .lumistry-editor-layout,.lumistry .lumistry-connections-layout{display:grid;gap:1rem;min-width:0;align-items:start}
.lumistry .lumistry-editor-preview{min-width:0}
.lumistry .lumistry-editor-preview>.lumistry-profile{pointer-events:auto}
.lumistry .lumistry-connections-sidebar{display:none}
.lumistry .lumistry-pool-progress{width:100%;height:.35rem;accent-color:var(--lp-accent,#7250a1)}
.lumistry[data-lumistry-theme=distillery] .lumistry-pool-progress::-webkit-progress-value{background:linear-gradient(90deg,#91e4bb,#cabdff);border-radius:1rem}
.lumistry[data-lumistry-theme=distillery] .lumistry-pool-progress::-moz-progress-bar{background:linear-gradient(90deg,#91e4bb,#cabdff)}
.lumistry .lumistry-match-notice{position:relative;overflow:hidden}
.lumistry .lumistry-match-burst{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.lumistry .lumistry-match-burst i{position:absolute;left:50%;top:50%;width:.6rem;height:.6rem;border:2px solid var(--lp-accent,currentColor);border-radius:50%;animation:lm-burst 220ms var(--lm-ease) both}
.lumistry .lumistry-match-burst i:nth-child(2){left:25%;top:20%}.lumistry .lumistry-match-burst i:nth-child(3){left:75%;top:25%}.lumistry .lumistry-match-burst i:nth-child(4){left:15%;top:70%}.lumistry .lumistry-match-burst i:nth-child(5){left:85%;top:65%}
.lumistry[data-lumistry-theme=sticker] .lumistry-match-burst i:nth-child(even){border-radius:0;transform:rotate(45deg)}
.lumistry[data-lumistry-theme=distillery] .lumistry-match-burst i{border-radius:70% 20% 70% 70%;background:var(--lp-accent);box-shadow:0 0 12px var(--lp-accent)}
.lumistry[data-lumistry-theme=modern] .lumistry-match-burst i{width:1.4rem;height:1.4rem;border-width:1px}
.lumistry .lp-unread[data-arrived=true]{animation:lm-pulse 200ms var(--lm-ease) 1}
.lumistry .lumistry-reaction[data-arrived=true]::after{content:attr(data-symbol);position:absolute;inset:auto 0 0;text-align:center;pointer-events:none;animation:lm-reaction 220ms var(--lm-ease) both}
.lumistry .lumistry-reaction{position:relative}
.lumistry.lumistry-thread[data-lumistry-theme=sticker] .lp-bubble{border-radius:1.2rem 1.5rem 1rem .4rem}
.lumistry.lumistry-thread[data-lumistry-theme=distillery] .lp-bubble{border-radius:.8rem;border-inline-start-width:3px}
.lumistry.lumistry-thread[data-lumistry-theme=modern] .lp-bubble{border-radius:1.5rem}
.lumistry .lumistry-ambient{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:-1;opacity:.14}
.lumistry .lumistry-ambient i{position:absolute;width:3rem;height:3rem;border:1px solid var(--lp-accent,currentColor);border-radius:50%;bottom:15%;left:5%;animation:lm-drift 18s ease-in-out infinite alternate}
.lumistry .lumistry-ambient i:nth-child(2){left:75%;bottom:55%;width:5rem;height:5rem;animation-delay:-5s}.lumistry .lumistry-ambient i:nth-child(3){left:42%;bottom:30%;width:1rem;height:1rem;animation-delay:-11s}.lumistry .lumistry-ambient i:nth-child(4){left:88%;bottom:10%;width:2rem;height:2rem;animation-delay:-8s}
.lumistry[data-lumistry-theme=modern] .lumistry-ambient{opacity:.05}
.lumistry[data-calendar-motif=stars] .lumistry-ambient i{border-radius:0;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);background:currentColor}
.lumistry[data-calendar-motif=leaves] .lumistry-ambient i{border-radius:80% 10% 80% 10%}
.lumistry .lumistry-confirm-sheet{position:sticky;bottom:.5rem;z-index:20;border:2px solid var(--lm-action);box-shadow:0 8px 30px #0004;margin:.75rem;color:var(--lp-text);background:var(--lp-surface,#fff)}
@container (min-width:42rem){
.lumistry .lumistry-editor-layout{grid-template-columns:minmax(0,1fr) minmax(16rem,.9fr)}
.lumistry .lumistry-editor-preview{position:sticky;top:1rem;max-height:calc(100dvh - 13rem);overflow:auto}
.lumistry .lumistry-connections-layout{grid-template-columns:minmax(12rem,.65fr) minmax(0,1.35fr)}
.lumistry .lumistry-connections-sidebar{display:grid;gap:.6rem;max-height:65dvh;overflow:auto}
.lumistry .lumistry-connections-sidebar .lumistry-match-card{min-height:5rem}.lumistry .lumistry-connections-sidebar .lumistry-portrait{height:9rem}
}
@keyframes lm-card-arrive{from{opacity:.6;scale:.98}to{opacity:1;scale:1}}
@keyframes lm-pixels{from{opacity:0;filter:blur(5px)}to{opacity:1;filter:blur(0)}}
@keyframes lm-shimmer{to{background-position:-220% 0}}
@keyframes lm-pulse{50%{transform:scale(1.15)}to{transform:none}}
@keyframes lm-reaction{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-1.5rem)}}
@keyframes lm-burst{from{opacity:.9;scale:.5}to{opacity:0;scale:2}}
@keyframes lm-drift{to{transform:translateY(-2rem)}}
@media(prefers-reduced-motion:reduce){.lumistry *,.lumistry *::before,.lumistry *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.lumistry .lumistry-discovery-card{transform:none!important}}
.lumiphone-shell[data-reduced-motion=true] .lumistry *,.lumiphone-shell[data-reduced-motion=true] .lumistry *::before,.lumiphone-shell[data-reduced-motion=true] .lumistry *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
.lumiphone-shell[data-reduced-motion=true] .lumistry .lumistry-discovery-card{transform:none!important}
`;
