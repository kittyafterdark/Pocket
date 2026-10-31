// Scoped to the selected Lumistry appearance; generated from the supplied UI kit.
export const LUMISTRY_STYLES_STICKER = `/* Lumistry — Sticker Lab.
   Die-cut stickers on cream paper: thick ink outline, white cut border, soft lift,
   pastel fills, cute doodles. Goals kept from the previous pass: large type and touch
   targets, clear button hierarchy, visible focus, icon + label navigation, and state
   never carried by colour alone. */

.lp-icon-dating {background:linear-gradient(145deg,#ffb3c7,#b3264f 60%,#2a1f3d);color:white}

.lumistry[data-lumistry-theme="sticker"] {
  container-type:inline-size;
  width:100%;
  min-width:0;
  /* Sticker palette */
  --st-ink:#2a1f3d;
  --st-cream:#fff1d6;
  --st-paper:#ffffff;
  --st-note:#fff0b3;
  --st-mint:#a6e8ce;
  --st-lilac:#cdbfff;
  --st-pink:#ffb3c7;
  --st-yellow:#ffd66b;
  --st-berry:#b3264f;
  --st-alert:#a3243b;
  --st-muted:#5b4e73;
  --st-die:0 0 0 5px #fff,0 8px 10px 3px rgba(42,31,61,.28);
  --st-die-sm:0 0 0 3px #fff,0 5px 7px 2px rgba(42,31,61,.25);
  --st-cut:drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff) drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff) drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff) drop-shadow(0 5px 4px rgba(42,31,61,.28));
  --st-display:"Fredoka","Baloo 2","Nunito",ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold",system-ui,sans-serif;
  --st-body:"Nunito","Quicksand",ui-rounded,"SF Pro Rounded",system-ui,sans-serif;
  /* Pocket variables, re-pointed so every inherited component reads as Sticker Lab */
  --lp-bg:var(--st-cream);
  --lp-surface:var(--st-paper);
  --lp-surface-2:#fff6e4;
  --lp-text:var(--st-ink);
  --lp-muted:var(--st-muted);
  --lp-border:var(--st-ink);
  --lp-accent:var(--st-berry);
  --lp-destructive:var(--st-alert);
  /* Doodle palette (see .lumistry-doodle rules below) */
  --d-line:var(--st-ink);--d-face:var(--st-ink);--d-dark:var(--st-ink);--d-w:#fff;--d-y:var(--st-yellow);--d-p:var(--st-pink);--d-r:#ff7fa3;--d-m:var(--st-mint);--d-m2:#d5f6ea;--d-p2:#ffd6e3;--d-l:var(--st-lilac);--d-l2:#dcd3ff;--d-g1:#8fd9a8;--d-g2:#b5e8c5;--d-c:#e9a08a;--d-b:#7fa8ff;--d-hl:#fff;--d-hl2:#cfe3ff;
  /* Lumistry tokens (theme.css overrides these) */
  --lumistry-rose:var(--st-berry);
  --lumistry-violet:#7f63d1;
  --lumistry-mint:var(--st-mint);
  --lumistry-gold:var(--st-yellow);
  --lumistry-primary:var(--st-berry);
  --lumistry-tint:#ffe3ec;
  --lumistry-radius:24px;
  --lumistry-touch:48px;
  font-family:var(--st-body);
}
.lp-page.lumistry[data-lumistry-theme="sticker"] {background-color:var(--st-cream);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240' fill='none' stroke='%232A1F3D' stroke-opacity='.13' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M30 40h12M36 34v12'/%3E%3Ccircle cx='140' cy='28' r='6'/%3E%3Cpath d='M208 56l2.4 6.6 6.6 2.4-6.6 2.4-2.4 6.6-2.4-6.6-6.6-2.4 6.6-2.4z'/%3E%3Cpath d='M64 142c-7-5-10-9-10-13a5.5 5.5 0 0 1 10-3 5.5 5.5 0 0 1 10 3c0 4-3 8-10 13z'/%3E%3Cpath d='M176 150h12M182 144v12'/%3E%3Ccircle cx='30' cy='208' r='5'/%3E%3Cpath d='M120 200l2.4 6.6 6.6 2.4-6.6 2.4-2.4 6.6-2.4-6.6-6.6-2.4 6.6-2.4z'/%3E%3Ccircle cx='214' cy='198' r='4'/%3E%3Ccircle cx='96' cy='88' r='3'/%3E%3C/svg%3E");background-size:240px 240px;color:var(--st-ink)}

/* ---------- doodles and icons ---------- */
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-ico {width:1.3em;height:1.3em;flex:none}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle {display:block;width:36px;height:36px;flex:none}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .k {stroke:var(--d-line)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .ks {stroke:var(--d-face)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .kd {stroke:var(--d-dark)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .kdf {fill:var(--d-dark)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .kf {fill:var(--d-face)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .ms {stroke:var(--d-m)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .b {stroke:var(--d-b)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .hl {stroke:var(--d-hl)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .hl2 {stroke:var(--d-hl2)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .hlf {fill:var(--d-hl)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .w {fill:var(--d-w)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .y {fill:var(--d-y)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .p {fill:var(--d-p)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .r {fill:var(--d-r)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .m2 {fill:var(--d-m2)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .p2 {fill:var(--d-p2)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .l {fill:var(--d-l)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .l2 {fill:var(--d-l2)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .g1 {fill:var(--d-g1)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .g2 {fill:var(--d-g2)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-doodle .c {fill:var(--d-c)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-bubbles,:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-meter {display:none}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-mascot,:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-sticker,:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-empty>.lumistry-doodle {filter:var(--st-cut)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-sticker {position:absolute;z-index:6;pointer-events:none;width:62px;height:62px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-sticker-tl {top:-20px;left:-14px;transform:rotate(-14deg)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-sticker-tr {top:-16px;right:-12px;width:54px;height:54px;transform:rotate(12deg)}

/* ---------- header ---------- */
.lumistry[data-lumistry-theme="sticker"] .lp-nav {background:color-mix(in srgb,var(--st-cream) 92%,transparent);border-bottom:3px solid var(--st-ink)}
.lumistry[data-lumistry-theme="sticker"] .lp-nav-title {font-family:var(--st-display);font-size:24px;font-weight:700;letter-spacing:-.01em}
.lumistry[data-lumistry-theme="sticker"] .lumistry-brand {justify-self:end;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--st-pink);border:3px solid var(--st-ink);color:var(--st-ink);font-size:22px;box-shadow:var(--st-die-sm)}
.lumistry[data-lumistry-theme="sticker"] .lp-nav .lp-button {min-height:40px;padding:6px 10px;border:0;background:transparent;box-shadow:none;color:var(--st-berry);font-weight:700;justify-content:flex-start}
.lumistry[data-lumistry-theme="sticker"] .lp-nav .lp-button:hover:not(:disabled) {background:transparent;text-decoration:underline}

/* ---------- tabs: four stickers ---------- */
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tabs {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:12px 14px 14px;gap:12px;background:transparent}
.lumistry[data-lumistry-theme="sticker"] .lumistry-tabs .lp-button {position:relative;flex-direction:column;justify-content:flex-start;gap:3px;text-align:center;line-height:1.15;min-width:0;min-height:58px;padding:8px 2px;font-size:12px;font-weight:700;color:var(--st-ink);background:var(--st-pink);border:3px solid var(--st-ink);border-radius:18px;box-shadow:var(--st-die-sm)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-tabs .lp-button:nth-child(2) {background:var(--st-mint)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-tabs .lp-button:nth-child(3) {background:var(--st-lilac)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-tabs .lp-button:nth-child(4) {background:var(--st-yellow)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-tabs .lp-button:hover:not(:disabled) {transform:translateY(-2px) rotate(-1deg);border-color:var(--st-ink);background:inherit}
.lumistry[data-lumistry-theme="sticker"] .lumistry-tabs [aria-current="page"] {font-weight:800;transform:rotate(-2deg);box-shadow:0 0 0 5px #fff,0 9px 10px 3px rgba(42,31,61,.3)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-tabs [aria-current="page"]::after {content:"";position:absolute;top:-14px;right:-9px;width:26px;height:26px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cpath d='M40 6l9.6 19.4 21.4 3.1-15.5 15.1 3.7 21.3L40 54.8 20.8 64.9l3.7-21.3L9 28.5l21.4-3.1z' fill='%23FFD66B' stroke='%232A1F3D' stroke-width='4' stroke-linejoin='round'/%3E%3Ccircle cx='33' cy='36' r='3' fill='%232A1F3D'/%3E%3Ccircle cx='47' cy='36' r='3' fill='%232A1F3D'/%3E%3Cpath d='M35 43q5 5 10 0' fill='none' stroke='%232A1F3D' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E") center/contain no-repeat;transform:rotate(14deg)}

/* ---------- cards, text ---------- */
.lumistry[data-lumistry-theme="sticker"] .lp-content {padding:16px;gap:20px}
.lumistry[data-lumistry-theme="sticker"] .lp-card {padding:16px;border:3px solid var(--st-ink);border-radius:var(--lumistry-radius);background:var(--st-paper);box-shadow:var(--st-die)}
.lumistry[data-lumistry-theme="sticker"] .lp-copy {color:var(--st-muted);font-size:max(12px,var(--pocket-font-sm,12px));line-height:1.55}
.lumistry[data-lumistry-theme="sticker"] .lp-title {font-family:var(--st-display);font-size:max(15px,var(--pocket-font-md,14px));font-weight:600}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile>h2.lp-title {font-size:calc(var(--pocket-font-md,14px) * 1.5);letter-spacing:-.01em}
.lumistry[data-lumistry-theme="sticker"] .lp-stack {display:grid;gap:12px;min-width:0}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-bio {white-space:pre-wrap;color:var(--st-ink);font-size:max(15px,var(--pocket-font-md,14px));line-height:1.55;overflow-wrap:anywhere}

/* ---------- buttons: pressable stickers ---------- */
.lumistry[data-lumistry-theme="sticker"] .lp-button {display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:var(--lumistry-touch);padding:10px 16px;border:3px solid var(--st-ink);border-radius:18px;background:#fff;color:var(--st-ink);font-size:max(13px,var(--pocket-font-sm,12px));font-weight:700;line-height:1.25;box-shadow:var(--st-die-sm);transition:background .15s,transform .1s}
.lumistry[data-lumistry-theme="sticker"] .lp-button:hover:not(:disabled) {border-color:var(--st-ink);background:#fff0b3;transform:translateY(-1px)}
.lumistry[data-lumistry-theme="sticker"] .lp-button:active:not(:disabled) {transform:translateY(2px) scale(.98);box-shadow:0 0 0 3px #fff,0 2px 3px 1px rgba(42,31,61,.25)}
.lumistry[data-lumistry-theme="sticker"] .lp-button-primary {background:var(--st-berry);border-color:var(--st-ink);color:#fff}
.lumistry[data-lumistry-theme="sticker"] .lp-button-primary:hover:not(:disabled) {background:color-mix(in srgb,var(--st-berry) 86%,black);border-color:var(--st-ink)}
.lumistry[data-lumistry-theme="sticker"] .lp-button-danger {background:#fff;color:var(--st-alert);border-color:var(--st-alert)}
.lumistry[data-lumistry-theme="sticker"] .lp-button-danger:hover:not(:disabled) {border-color:var(--st-alert);background:#ffe3e8}
.lumistry[data-lumistry-theme="sticker"] .lp-button:disabled {opacity:.5;cursor:not-allowed}
.lumistry[data-lumistry-theme="sticker"] .lumistry-icon-after {flex-direction:row-reverse}
:is(.lumistry[data-lumistry-theme="sticker"] .lp-button,.lumistry[data-lumistry-theme="sticker"] summary,.lumistry[data-lumistry-theme="sticker"] input,.lumistry[data-lumistry-theme="sticker"] select,.lumistry[data-lumistry-theme="sticker"] textarea):focus-visible {outline:3px solid var(--st-berry);outline-offset:3px}

:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-actions {display:flex;flex-wrap:wrap;gap:12px;align-items:center}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-actions .lp-button {flex:1 1 150px}

/* Keep Pocket's native page scroller; actions sit right under the portrait. */
.lumistry[data-lumistry-theme="sticker"].lumistry-discover {height:100%;min-height:100%;display:block;overflow:auto}
.lumistry[data-lumistry-theme="sticker"].lumistry-discover>.lp-content {min-height:0;overflow:visible;align-content:start}
.lumistry[data-lumistry-theme="sticker"].lumistry-discover .lumistry-swipe {position:sticky;top:0;align-self:start}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-swipe {position:relative;z-index:5;display:grid;grid-template-columns:1fr 1.3fr 1.1fr;gap:14px;padding:10px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-swipe .lp-button {flex-direction:column;gap:3px;min-height:64px;padding:8px 4px;border-radius:20px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-swipe .lp-button .lumistry-ico {width:1.6em;height:1.6em}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-swipe .lp-button .lumistry-doodle {width:34px;height:34px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-swipe .lp-button:nth-child(3) {background:var(--st-yellow)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-swipe .lp-button:nth-child(3):hover:not(:disabled) {background:#ffe08f}

/* ---------- portraits and authored profiles ---------- */
.lumistry[data-lumistry-theme="sticker"] .lumistry-profile {position:relative;padding:0;border-radius:30px;overflow:visible;background:var(--st-paper)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-portrait {display:block;position:relative;isolation:isolate;overflow:hidden;min-width:0;background:linear-gradient(150deg,hsl(var(--portrait-hue,320) 85% 88%),hsl(var(--portrait-hue,320) 75% 78%));color:var(--st-ink)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile>.lumistry-portrait {border-radius:27px 27px 0 0;border-bottom:3px solid var(--st-ink)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-portrait>img {position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-hero {aspect-ratio:4/5;min-height:250px;max-height:560px}
.lumistry[data-lumistry-theme="sticker"].lumistry-discover .lumistry-hero {aspect-ratio:1/1.08;min-height:220px;max-height:440px}
.lumistry[data-lumistry-theme="sticker"].lumistry-discover .lumistry-section-heading>p {display:none}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-portrait-placeholder {position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px 16px 96px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-portrait-fallback .lumistry-portrait-placeholder {display:flex}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-mascot {width:min(46%,150px);height:auto}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-monogram {position:absolute;z-index:3;right:14px;bottom:16px;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#fff;border:3px solid var(--st-ink);color:var(--st-ink);font-family:var(--st-display);font-size:26px;font-weight:600;line-height:1;box-shadow:var(--st-die-sm)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-photo-label {padding:3px 12px;border-radius:999px;background:rgba(255,255,255,.75);font-size:12px;font-weight:700;color:var(--st-ink);text-align:center}
/* the name is a name-tag sticker, never text over a photo gradient */
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-portrait-identity {position:absolute;z-index:3;left:12px;bottom:16px;max-width:calc(100% - 92px);padding:8px 14px 9px;overflow-wrap:anywhere;pointer-events:none;background:#fff;border:3px solid var(--st-ink);border-radius:18px;box-shadow:var(--st-die-sm);transform:rotate(-1.5deg)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-portrait-name {display:block;margin:0 0 2px;color:var(--st-ink);font-family:var(--st-display);font-size:clamp(20px,6.2cqi,28px);font-weight:700;letter-spacing:-.01em;line-height:1.1}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-portrait-identity :is(p,small) {display:block;margin:2px 0 0;font-size:13px;font-weight:700;color:var(--st-muted);line-height:1.3}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-portrait-identity .lumistry-portrait-distance {color:var(--st-muted);font-size:12px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-photo-pagination {position:absolute;z-index:4;top:10px;left:50px;right:50px;display:flex;gap:6px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-photo-segment {flex:1;min-width:0;height:28px;padding:10px 0;border:0;background:transparent;cursor:pointer}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-photo-segment::after {content:"";display:block;height:9px;border-radius:9px;border:2px solid var(--st-ink);background:#fff}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-photo-segment[aria-current="true"]::after {background:var(--st-ink)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-photo-arrow {position:absolute;z-index:4;top:calc(50% - 22px);width:44px;height:44px;min-height:44px;padding:0;border:3px solid var(--st-ink);border-radius:50%;background:#fff;color:var(--st-ink);font-size:0;box-shadow:var(--st-die-sm)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-photo-arrow .lumistry-ico {width:22px;height:22px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-photo-previous {left:10px}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-photo-next {right:10px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile-body {display:grid;gap:16px;padding:20px 18px 22px;min-width:0}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile-body p {margin:0}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-caption {font-size:13px;color:var(--st-muted);line-height:1.5;font-style:italic;overflow-wrap:anywhere}
/* photo descriptions and prompt answers are sticky notes */
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-photo-description {position:relative;padding:12px 14px;background:var(--st-note);border:3px solid var(--st-ink);border-radius:8px;box-shadow:0 4px 0 rgba(42,31,61,.22);transform:rotate(-.6deg);color:var(--st-ink);font-size:13px;line-height:1.5;overflow-wrap:anywhere}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-photo-description::before,:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile-answer::before {content:"";position:absolute;top:-11px;left:50%;width:56px;height:18px;margin-left:-28px;background:rgba(255,160,190,.8);transform:rotate(-3deg)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile-answer {position:relative;padding:16px;border:3px solid var(--st-ink);border-radius:18px;background:#e9e2ff;display:grid;gap:8px;transform:rotate(.4deg)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile-answer:nth-of-type(even) {transform:rotate(-.4deg);background:#d9f6ea}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile-answer h3 {margin:0;color:var(--st-muted);font-size:13px;font-weight:700}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile-tools>.lumistry-actions {padding:4px 0 12px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-detail-status {display:inline-block;justify-self:start;margin:0;padding:4px 12px;border:2.5px solid var(--st-ink);border-radius:999px;background:var(--st-yellow);color:var(--st-ink);font-size:13px;font-weight:700;box-shadow:var(--st-die-sm)}

/* ---------- connections: portrait stickers ---------- */
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-section-heading {min-width:0}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-section-heading h1 {font-family:var(--st-display);font-size:28px;font-weight:600;letter-spacing:-.01em;line-height:1.15;margin:0 0 8px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-section-heading h1::after {content:"";display:block;width:96px;height:10px;margin-top:4px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 10'%3E%3Cpath d='M2 5q6-6 12 0t12 0 12 0 12 0 12 0 12 0 12 0 12 0' fill='none' stroke='%23FF8DB3' stroke-width='3.5' stroke-linecap='round'/%3E%3C/svg%3E") left center/contain no-repeat}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-section-heading p {margin:0;color:var(--st-muted)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-section {min-width:0;display:grid;gap:16px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-section>h2 {margin:0;font-family:var(--st-display);font-size:17px;font-weight:600}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 18px;padding:4px 4px 6px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card {appearance:none;display:block;min-width:0;padding:0;border:3px solid var(--st-ink);border-radius:24px;background:#fff;color:inherit;text-align:left;cursor:pointer;overflow:hidden;box-shadow:var(--st-die);transform:rotate(-1.2deg);transition:transform .15s}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card:nth-child(even) {transform:rotate(1deg)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card:hover {transform:translateY(-3px) rotate(0)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card .lumistry-portrait {aspect-ratio:3/4;min-height:170px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card .lumistry-portrait-identity {left:8px;bottom:10px;max-width:calc(100% - 52px);padding:5px 8px 6px;border-radius:14px;border-width:2.5px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card .lumistry-portrait-name {font-size:16px;margin-bottom:1px;letter-spacing:-.02em}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card .lumistry-portrait-identity :is(p,small) {font-size:12px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card .lumistry-portrait-placeholder {padding:44px 8px 100px;gap:6px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card .lumistry-mascot {width:min(44%,76px)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card .lumistry-monogram {right:7px;bottom:10px;width:36px;height:36px;font-size:18px;border-width:2.5px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card .lumistry-photo-label {display:none}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-status {position:absolute;z-index:3;top:10px;left:10px;width:fit-content;max-width:calc(100% - 20px);padding:4px 10px;border:2.5px solid var(--st-ink);border-radius:999px;background:var(--st-yellow);color:var(--st-ink);font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-connection-actions {padding-bottom:12px}

/* ---------- inbox: sticker rows ---------- */
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-list {min-width:0;border:3px solid var(--st-ink);border-radius:24px;background:#fff;box-shadow:var(--st-die);overflow:hidden}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-row {appearance:none;display:flex;align-items:center;gap:14px;width:100%;min-width:0;min-height:84px;padding:14px;border:0;border-bottom:3px dashed rgba(42,31,61,.3);background:transparent;color:var(--st-ink);text-align:left;font:inherit;cursor:pointer}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-row:last-child {border-bottom:0}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-row:hover {background:#fff6e4}
.lumistry[data-lumistry-theme="sticker"] .lumistry-inbox-row .lp-avatar {position:relative;width:54px;height:54px;flex:0 0 54px;border-radius:50%;border:3px solid var(--st-ink);font-family:var(--st-display);font-size:24px;font-weight:600;background:var(--st-pink);color:var(--st-ink);box-shadow:var(--st-die-sm)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-row .lp-avatar img {position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-copy {display:grid;gap:5px;min-width:0;flex:1}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-top {display:flex;align-items:baseline;gap:8px;min-width:0}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-top strong {flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--st-display);font-size:17px;font-weight:600}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-top time {color:var(--st-muted);font-size:12px;white-space:nowrap}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-preview {color:var(--st-muted);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.45}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-inbox-row.has-unread .lumistry-inbox-preview {color:var(--st-ink);font-weight:700}
.lumistry[data-lumistry-theme="sticker"] .lp-unread {min-width:26px;height:26px;border:2.5px solid var(--st-ink);background:var(--st-berry);color:#fff;font-size:12px;font-weight:800}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-chat-settings {margin-top:6px}

/* ---------- discovery controls ---------- */
.lumistry[data-lumistry-theme="sticker"].lumistry-discovery-toolbar {display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-toolbar-actions {display:flex;align-items:center;gap:10px;flex:none}
.lumistry[data-lumistry-theme="sticker"] .lumistry-toolbar-actions .lp-button {min-height:44px;padding:8px 12px;font-size:13px}
.lumistry[data-lumistry-theme="sticker"] .lumistry-options {position:relative;padding:0 12px;border:3px solid var(--st-ink);border-radius:18px;background:#fff;box-shadow:var(--st-die-sm)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-options>summary {min-height:38px;font-size:13px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-options-menu {position:absolute;right:0;top:calc(100% + 12px);z-index:20;display:grid;gap:8px;width:220px;padding:12px;border:3px solid var(--st-ink);border-radius:20px;background:#fff;box-shadow:var(--st-die)}.lumistry[data-lumistry-theme="sticker"] .lumistry-options-menu>.lp-button {justify-content:flex-start;margin:0;width:100%}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-pool-status {display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--st-muted)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-pool-status .lp-button {min-height:44px;padding:6px 14px;font-size:13px;background:var(--st-mint)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-profile .lumistry-swipe {position:static;margin:0;border:0;border-radius:0;box-shadow:none;background:transparent;backdrop-filter:none;padding:20px 18px 4px}
.lumistry[data-lumistry-theme="sticker"] .lumistry-profile .lumistry-swipe .lp-button {flex-direction:column;min-height:66px;border-radius:20px;font-size:13px}
.lumistry[data-lumistry-theme="sticker"] .lumistry-profile .lumistry-swipe .lp-button:nth-child(1) {color:var(--st-ink)}
.lumistry[data-lumistry-theme="sticker"] .lumistry-busy .lp-button {min-height:40px;padding:6px 12px;font-size:12px}
.lumistry[data-lumistry-theme="sticker"] .lumistry-busy>p {flex:1 1 150px;margin:0;font-size:13px}
:where(.lumistry[data-lumistry-theme="sticker"]) :is(.lumistry-match-card,.lumistry-inbox-row,.lumistry-photo-segment):focus-visible {outline:3px solid var(--st-berry);outline-offset:4px}
@container (min-width:520px) {:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-grid {grid-template-columns:repeat(3,minmax(0,1fr))}}
@container (max-width:340px) {.lumistry[data-lumistry-theme="sticker"].lumistry-discovery-toolbar {align-items:flex-start;flex-wrap:wrap}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-grid {gap:16px 12px}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-match-card .lumistry-portrait-name {font-size:15px}.lumistry[data-lumistry-theme="sticker"] .lumistry-profile .lumistry-swipe {padding:16px 10px 4px;gap:8px}.lumistry[data-lumistry-theme="sticker"] .lumistry-profile .lumistry-swipe .lp-button {padding:8px 2px;font-size:12px}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-profile-body {padding:16px 14px 18px}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tabs {gap:8px;padding:12px 10px 14px}}

/* ---------- tags: pastel stickers ---------- */
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tags {display:flex;flex-wrap:wrap;gap:14px 10px;margin:8px 2px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tag {display:inline-block;padding:6px 13px;border-radius:999px;border:2.5px solid var(--st-ink);background:#fff1d6;color:var(--st-ink);font-size:13px;font-weight:700;line-height:1.35;overflow-wrap:anywhere;max-width:100%;box-shadow:var(--st-die-sm);transform:rotate(-1deg)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tag:nth-child(even) {transform:rotate(1deg)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tag:nth-child(4n+1) {background:#ffd9e4}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tag:nth-child(4n+2) {background:#d5f6ea}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tag:nth-child(4n+3) {background:#e9e2ff}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tag:nth-child(4n) {background:#fff0b3}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-tag strong {font-weight:800;color:var(--st-muted)}

/* ---------- forms ---------- */
.lumistry[data-lumistry-theme="sticker"] .lp-label {display:grid;gap:6px;font-size:14px;font-weight:700;color:var(--st-ink)}
.lumistry[data-lumistry-theme="sticker"] :is(.lp-input,.lp-select,.lp-textarea) {min-height:var(--lumistry-touch);padding:11px 14px;border:2.5px solid var(--st-ink);border-radius:16px;background:#fff;color:var(--st-ink);font-size:max(15px,var(--pocket-font-md,14px))}
.lumistry[data-lumistry-theme="sticker"] .lp-textarea {min-height:100px;max-height:none;resize:vertical;line-height:1.5}
.lumistry[data-lumistry-theme="sticker"] :is(.lp-input,.lp-select,.lp-textarea):focus {border-color:var(--st-berry);box-shadow:0 0 0 4px rgba(179,38,79,.22)}
.lumistry[data-lumistry-theme="sticker"] label.lp-row {display:flex;flex-wrap:nowrap;align-items:center;gap:12px;min-height:44px;cursor:pointer}
.lumistry[data-lumistry-theme="sticker"] input[type="checkbox"] {appearance:none;-webkit-appearance:none;display:inline-grid;place-content:center;width:26px;height:26px;margin:0;flex:none;border:2.5px solid var(--st-ink);border-radius:9px;background:#fff;cursor:pointer}
.lumistry[data-lumistry-theme="sticker"] input[type="checkbox"]:checked {background:var(--st-mint)}
.lumistry[data-lumistry-theme="sticker"] input[type="checkbox"]:checked::after {content:"";width:7px;height:12px;border:solid var(--st-ink);border-width:0 3px 3px 0;transform:rotate(45deg) translate(-1px,-1px)}
.lumistry[data-lumistry-theme="sticker"] input[type="range"] {accent-color:var(--st-berry)}

/* collapsible sections */
.lumistry[data-lumistry-theme="sticker"] details {border:2.5px solid var(--st-ink);border-radius:18px;padding:0 14px;background:var(--lp-surface-2)}
.lumistry[data-lumistry-theme="sticker"] details details {background:#fff}
.lumistry[data-lumistry-theme="sticker"] summary {display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:var(--lumistry-touch);cursor:pointer;list-style:none;color:var(--st-ink);font-size:14px;font-weight:700;overflow-wrap:anywhere}
.lumistry[data-lumistry-theme="sticker"] summary::-webkit-details-marker {display:none}
.lumistry[data-lumistry-theme="sticker"] summary::after {content:"";flex:none;width:9px;height:9px;margin-right:4px;border-right:3px solid currentColor;border-bottom:3px solid currentColor;transform:rotate(45deg);transition:transform .2s}
.lumistry[data-lumistry-theme="sticker"] details[open]>summary::after {transform:rotate(-135deg)}
.lumistry[data-lumistry-theme="sticker"] details[open]>summary {border-bottom:3px dashed rgba(42,31,61,.3);margin-bottom:10px}
.lumistry[data-lumistry-theme="sticker"] details>.lp-label,.lumistry[data-lumistry-theme="sticker"] details>.lp-stack {margin:10px 0}
.lumistry[data-lumistry-theme="sticker"] details>.lp-button {margin:0 0 14px;width:100%}

/* multi-choice lists read as tappable stickers */
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-choice-list {display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;max-height:260px;overflow:auto;padding:6px 4px 12px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-choice-list label {display:flex;align-items:center;gap:10px;min-width:0;min-height:46px;padding:8px 12px;border:2.5px solid var(--st-ink);border-radius:16px;background:#fff;cursor:pointer;font-size:14px;color:var(--st-ink)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-choice-list label:has(input:checked) {background:#d5f6ea;font-weight:800}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-choice-list label .lp-copy {color:inherit;font-size:14px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-choice summary {overflow-wrap:anywhere}

/* ---------- age range ---------- */
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-range-label {font-size:15px;font-weight:800;color:var(--st-ink)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-age-range {position:relative;height:48px;margin:0 14px;background:linear-gradient(to right,#e6dbc3 var(--range-start),var(--st-berry) var(--range-start),var(--st-berry) var(--range-end),#e6dbc3 var(--range-end)) center/100% 10px no-repeat;border-radius:10px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-age-range input {position:absolute;inset:0;width:100%;margin:0;pointer-events:none;appearance:none;background:transparent;accent-color:var(--st-berry)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-age-range input::-webkit-slider-thumb {pointer-events:auto;appearance:none;width:30px;height:30px;border-radius:50%;background:var(--st-pink);border:3px solid var(--st-ink);box-shadow:0 0 0 3px #fff,0 3px 5px rgba(42,31,61,.3);cursor:grab}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-age-range input::-moz-range-thumb {pointer-events:auto;width:24px;height:24px;border-radius:50%;background:var(--st-pink);border:3px solid var(--st-ink);box-shadow:0 0 0 3px #fff,0 3px 5px rgba(42,31,61,.3);cursor:grab}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-age-range input:focus-visible {outline:none}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-age-range input:focus-visible::-webkit-slider-thumb {box-shadow:0 0 0 3px #fff,0 0 0 7px var(--st-berry)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-age-range input:focus-visible::-moz-range-thumb {box-shadow:0 0 0 3px #fff,0 0 0 7px var(--st-berry)}

/* ---------- states ---------- */
.lumistry[data-lumistry-theme="sticker"] .lumistry-empty {display:grid;gap:12px;justify-items:center;text-align:center;padding:28px 16px;border:3px dashed var(--st-ink);box-shadow:none;background:rgba(255,255,255,.75)}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-empty .lumistry-ico {width:48px;height:48px;color:var(--st-berry);stroke-width:1.5}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-empty>.lumistry-doodle {width:84px;height:84px}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-empty .lp-copy {color:var(--st-ink);font-size:14px}
.lumistry[data-lumistry-theme="sticker"] .lumistry-busy {display:flex;flex-wrap:wrap;align-items:center;gap:12px;border:3px dashed var(--lumistry-violet);background:#f3eeff}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-busy>.lumistry-ico,:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-busy>.lumistry-doodle {color:var(--lumistry-violet);animation:lumistry-sticker-bob 1.6s ease-in-out infinite}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-busy>.lumistry-doodle {width:42px;height:42px}
.lumistry[data-lumistry-theme="sticker"] .lumistry-error {display:flex;align-items:flex-start;gap:10px;border:3px solid var(--st-alert);background:#ffe3e8;color:var(--st-ink);overflow-wrap:anywhere}
:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-error>.lumistry-ico {color:var(--st-alert);margin-top:2px}
@keyframes lumistry-sticker-bob {0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-3px) rotate(4deg)}}

/* ---------- responsive / accessibility ---------- */
@container (max-width:380px) {.lumistry[data-lumistry-theme="sticker"] .lp-content{padding:12px}.lumistry[data-lumistry-theme="sticker"] .lumistry-tabs .lp-button{font-size:11px}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-swipe{gap:8px;padding:8px}}
@media (prefers-reduced-motion:reduce) {.lumistry[data-lumistry-theme="sticker"] *,.lumistry[data-lumistry-theme="sticker"] *::before,.lumistry[data-lumistry-theme="sticker"] *::after{animation:none!important;transition:none!important}}
@media (forced-colors:active) {.lumistry[data-lumistry-theme="sticker"] .lumistry-tabs [aria-current="page"]{outline:3px solid Highlight}:where(.lumistry[data-lumistry-theme="sticker"]) .lumistry-choice-list label:has(input:checked){outline:3px solid Highlight}.lumistry[data-lumistry-theme="sticker"] .lp-button,.lumistry[data-lumistry-theme="sticker"] .lp-card{border-color:CanvasText}}
`;
