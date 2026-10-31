// Interaction/layout additions shared by all themes; native messaging stays scoped separately.
export const LUMISTRY_FLOW_STYLES = `
.lumistry .lumistry-hero.lumistry-described-photo {height:360px;min-height:320px;max-height:460px;aspect-ratio:auto}
.lumistry .lumistry-described-photo .lumistry-portrait-placeholder {display:none}
.lumistry .lumistry-photo-description-card {position:absolute;inset:52px 52px 78px;z-index:1;overflow:auto;overscroll-behavior:contain;background:var(--lp-surface);color:var(--lp-text);padding:14px;border-radius:12px;border:1px solid currentColor;user-select:text}
.lumistry .lumistry-photo-description-card p {font-size:14px;line-height:1.5;margin-block:8px}
.lumistry .lumistry-reaction {font-size:12px;padding:3px 7px;border:1px solid currentColor;border-radius:12px;display:inline-block}
.lumistry .lumistry-next-steps pre {white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}
.lumistry .lumistry-next-steps select,.lumistry .lumistry-next-steps textarea {max-width:100%;box-sizing:border-box;font:inherit;min-height:44px}

.lumistry .lumistry-browsing-tools,.lumistry .lumistry-evidence-tools {padding:10px;margin-block:8px}
.lumistry .lumistry-browsing-tools summary,.lumistry .lumistry-evidence-tools summary {min-height:44px;cursor:pointer}
.lumistry .lumistry-evidence-tools pre {white-space:pre-wrap;overflow-wrap:anywhere}
.lumistry .lumistry-profile[data-first=bio] {display:flex;flex-direction:column}
.lumistry .lumistry-profile[data-first=bio]>.lumistry-profile-body {order:0}
.lumistry .lumistry-profile[data-first=bio]>.lumistry-hero {order:1}
.lumistry .lumistry-profile[data-first=bio]>.lumistry-swipe {order:2}
.lumistry .lumistry-profile[data-first=bio]>.lumistry-profile-tools {order:3}

.lumistry .lumistry-shared-hints {display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.lumistry .lumistry-match-notice {padding:16px;border:1px solid currentColor;border-radius:16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.lumistry .lumistry-match-notice[data-new=true] {animation:lumistry-match-enter 180ms ease-out}
.lumistry .lumistry-next-steps {max-height:38vh;overflow:auto;overscroll-behavior:contain;padding:6px 12px}
.lumistry .lumistry-next-steps summary {cursor:pointer;min-height:44px;display:flex;align-items:center}
.lumistry .lumistry-next-steps .lp-button {min-height:44px;white-space:normal;margin:4px;max-width:100%;text-align:start}
.lumistry .lumistry-date-editor {display:grid;gap:8px}
.lumistry .lumistry-date-editor label {display:grid;gap:4px}
.lumistry .lumistry-date-editor input {width:100%;box-sizing:border-box;font:inherit;background:var(--lp-surface);color:var(--lp-text);padding:10px;border:1px solid currentColor;border-radius:8px}
@keyframes lumistry-match-enter {from {opacity:0;transform:translateY(4px)}to {opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.lumistry .lumistry-match-notice[data-new]{animation:none}}
.lumiphone-shell[data-reduced-motion=true] .lumistry .lumistry-match-notice {animation:none}

.lumistry:not(.lumistry-thread) .lumistry-context-menu {padding:8px 12px;margin:0;border:0;min-height:44px;}
.lumistry:not(.lumistry-thread) .lumistry-context-menu>summary {list-style:none;text-align:right;font-size:25px;line-height:1;min-height:32px;cursor:pointer;padding:0 8px;}
.lumistry:not(.lumistry-thread) .lumistry-context-menu>summary::-webkit-details-marker {display:none;}
.lumistry:not(.lumistry-thread) .lumistry-context-menu[open]>summary {margin-bottom:12px;}
.lumistry:not(.lumistry-thread) .lumistry-context-menu>.lumistry-actions {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
.lumistry:not(.lumistry-thread) .lumistry-context-menu .lp-button {white-space:normal;min-height:44px;}
.lumistry:not(.lumistry-thread) .lumistry-inline-status {display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;}
.lumistry:not(.lumistry-thread) .lumistry-progress {padding:10px 14px;border:1px solid currentColor;border-radius:14px;font-size:13px;}
.lumistry:not(.lumistry-thread) .lumistry-progress>summary {cursor:pointer;min-height:24px;}
.lumistry:not(.lumistry-thread) .lumistry-progress[open]>.lp-button {margin:8px 8px 0 0;}
.lumistry:not(.lumistry-thread) .lumistry-filter-group>summary {padding:12px 0;min-height:44px;cursor:pointer;}
.lumistry:not(.lumistry-thread) .lumistry-filter-selected {font-size:13px;line-height:1.5;margin:4px 0;overflow-wrap:anywhere;}
.lumistry:not(.lumistry-thread) .lumistry-filter-group>.lp-stack {padding:10px 0;}
.lumistry:not(.lumistry-thread) .lumistry-photo-copy:empty {display:none;}
.lumistry:not(.lumistry-thread) .lp-button:active:not(:disabled) {transform:translateY(1px) scale(.97);}
.lumistry[data-lumistry-enter="true"] .lumistry-profile {animation:lumistry-profile-arrive 180ms ease-out both;}
.lumiphone-shell[data-reduced-motion="true"] .lumistry:not(.lumistry-thread) .lp-button:active:not(:disabled) {transform:none;}
@keyframes lumistry-profile-arrive {from {opacity:.55;transform:translateY(8px);} to {opacity:1;transform:translateY(0);}}
@media (prefers-reduced-motion:reduce) {.lumistry[data-lumistry-enter="true"] .lumistry-profile {animation:none;} .lumistry:not(.lumistry-thread) .lp-button:active:not(:disabled) {transform:none;}}

.lumistry-photo-camera{position:absolute!important;right:14px;top:34px;z-index:3;width:54px;min-width:54px;height:54px;padding:3px!important;border-radius:16px;transform:rotate(5deg);box-shadow:0 3px 0 var(--lp-border,rgba(0,0,0,.2));font-size:0!important;gap:0!important}
.lumistry-photo-camera .lumistry-doodle{width:44px;height:44px;flex:none}
.lumistry-photo-camera:focus-visible{outline:3px solid currentColor;outline-offset:3px}
.lumistry .lumistry-height-control {gap:10px;min-width:0;padding:8px 0;}
.lumistry .lumistry-height-units {display:flex;gap:8px;flex-wrap:wrap;}
.lumistry .lumistry-height-units .lp-button {flex:1;min-width:100px;font-size:12px;}
.lumistry .lumistry-height-units [aria-pressed="true"] {outline:2px solid currentColor;outline-offset:-3px;font-weight:700;}
.lumistry .lumistry-height-slider {display:block;width:100%;min-width:0;min-height:44px;cursor:pointer;accent-color:var(--lp-accent,#7755a0);touch-action:pan-y;}
.lumistry .lumistry-height-slider:focus-visible {outline:2px solid currentColor;outline-offset:3px;border-radius:8px;}
`;

export const lumistryAuthoringStyles = `.lumistry-authoring-source{white-space:pre-wrap;overflow-wrap:anywhere;max-height:24rem;overflow:auto;font:inherit;line-height:1.5;padding:.75rem;border-radius:1rem;background:var(--lp-surface,#fff4);}
.lumistry .lumistry-settings {gap:16px;min-width:0;}
.lumistry .lumistry-settings-form {gap:14px;min-width:0;}
.lumistry .lumistry-settings .lp-title {margin:0;font-size:19px;line-height:1.3;}
.lumistry .lumistry-settings h3 {margin:10px 0 0;font-size:13px;line-height:1.4;}
.lumistry .lumistry-settings .lp-copy {margin:0;line-height:1.5;}
.lumistry .lumistry-settings .lp-label {gap:7px;min-width:0;}
.lumistry .lumistry-settings .lp-select {width:100%;min-width:0;}
.lumistry .lumistry-settings .lp-row {align-items:flex-start;gap:10px;min-width:0;line-height:1.45;}
.lumistry .lumistry-settings .lp-row input[type="checkbox"] {flex:0 0 auto;width:18px;height:18px;margin:2px 0;}
.lumistry .lumistry-settings .lumistry-actions {display:flex;flex-wrap:wrap;gap:8px;}
.lumistry .lumistry-settings .lumistry-actions>.lp-button {flex:1 1 90px;white-space:normal;min-height:44px;}
.lumistry .lumistry-settings-section>summary {cursor:pointer;min-height:44px;line-height:1.4;font-weight:650;padding-top:12px;padding-bottom:12px;overflow-wrap:anywhere;}
.lumistry .lumistry-settings-section[open]>summary {margin-bottom:12px;}
.lumistry .lumistry-settings-section>section,.lumistry .lumistry-settings-section>div.lp-stack {min-width:0;padding-bottom:12px;}
.lumistry .lumistry-settings-save>.lp-button {width:100%;min-height:44px;}
.lumistry .lumistry-settings pre,.lumistry .lumistry-settings .lumistry-bio {overflow-wrap:anywhere;max-width:100%;}

.lumistry .lumistry-world-overview {min-width:0;gap:12px;}
.lumistry .lumistry-world-overview>.lp-button {min-height:44px;width:100%;white-space:normal;}
.lumistry .lumistry-world-guide {gap:12px;min-width:0;}
.lumistry .lumistry-world-guide>details {margin:0;}
.lumistry .lumistry-catalog-browser,.lumistry .lumistry-species-palette {min-width:0;}
.lumistry .lumistry-catalog-record {gap:8px;padding:12px 0;min-width:0;border-bottom:1px solid var(--lp-border,currentColor);}
.lumistry .lumistry-catalog-record:last-child {border-bottom:0;}
.lumistry .lumistry-catalog-record>details>summary {font-size:12px;min-height:36px;cursor:pointer;}
.lumistry .lumistry-catalog-record .lp-label,.lumistry .lumistry-catalog-record .lp-row {margin:0;overflow-wrap:anywhere;}
.lumistry .lumistry-catalog-browser [hidden],.lumistry .lumistry-species-palette [hidden] {display:none!important;}
.lumistry .lumistry-editor-appearance>summary {min-height:44px;cursor:pointer;font-weight:650;}
.lumistry .lumistry-editor-appearance .lp-label {margin:12px 0;}
.lumistry .lumistry-settings input[type="search"],.lumistry .lumistry-editor input[type="search"] {width:100%;min-width:0;box-sizing:border-box;}

.lumistry .lumistry-settings-dashboard,.lumistry .lumistry-guided-setup {min-width:0;gap:16px;}
.lumistry .lumistry-settings-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px;}
.lumistry .lumistry-settings-destination.lp-button {display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;text-align:left;gap:8px;white-space:normal;min-height:112px;padding:18px;}
.lumistry .lumistry-settings-destination strong {font-size:17px;line-height:1.35;}
.lumistry .lumistry-settings-destination .lp-copy {font-weight:400;font-size:13px;}
.lumistry .lumistry-settings-dashboard>.lp-button,.lumistry .lumistry-guided-setup>.lp-button {min-height:44px;white-space:normal;}
.lumistry .lumistry-setup-question .lp-title {font-size:17px;}
.lumistry .lumistry-setup-question .lp-row {min-height:40px;align-items:center;}
.lumistry .lumistry-setup-question>.lp-button {align-self:flex-start;font-size:12px;}
.lumistry .lumistry-setup-steps {display:flex;flex-wrap:wrap;gap:6px;}
.lumistry .lumistry-setup-steps>.lp-button {flex:1 1 95px;min-height:44px;font-size:12px;white-space:normal;}
.lumistry .lumistry-setup-steps>[aria-current="step"] {outline:2px solid var(--lp-accent,currentColor);outline-offset:1px;}
.lumistry .lumistry-guided-setup progress {width:100%;height:8px;accent-color:var(--lp-accent);}
.lumistry .lumistry-setup-age {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.lumistry .lumistry-theme-picks {border:1px solid var(--lp-border,currentColor);border-radius:14px;padding:12px;min-width:0;}
.lumistry .lumistry-theme-picks legend {font-size:14px;font-weight:650;padding:0 6px;}
.lumistry .lumistry-theme-picks .lp-row {min-height:40px;}
.lumistry .lumistry-settings [hidden] {display:none!important;}
.lumistry .lumistry-setup-review details p {overflow-wrap:anywhere;}
`;

export const LUMISTRY_LIBRARY_STYLES = `
.lumistry .lumistry-me-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:12px;min-width:0}
.lumistry .lumistry-me-grid{grid-template-columns:minmax(0,1fr)}
.lumistry .lumistry-me-grid .lumistry-settings-destination{display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.lumistry .lumistry-me-grid .lp-button{min-height:64px;text-align:left;white-space:normal;overflow-wrap:anywhere}
.lumistry .lumistry-library{min-width:0;gap:16px}
.lumistry .lumistry-library-list{list-style:none;padding:0;margin:0;display:grid;gap:10px;min-width:0}
.lumistry .lumistry-library-row{margin:0;min-width:0;overflow-wrap:anywhere}
.lumistry .lumistry-library-actions{display:flex;gap:8px;flex-wrap:wrap;min-width:0}
.lumistry .lumistry-library-actions>.lp-button{flex:1 1 120px;white-space:normal;min-height:44px}
.lumistry .lumistry-library select,.lumistry .lumistry-library input[type=search]{width:100%;min-width:0;max-width:100%;min-height:44px}
.lumistry .lumistry-library input[type=checkbox]{min-width:24px;min-height:24px}
.lumistry .lumistry-library [hidden]{display:none!important}
.lumistry .lumistry-library :focus-visible,.lumistry .lumistry-me-grid :focus-visible{outline:3px solid currentColor;outline-offset:3px}
.lumistry .lumistry-library [role=status]{overflow-wrap:anywhere}
`;
