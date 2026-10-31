// Scoped to the selected Lumistry appearance; generated from the supplied UI kit.
export const LUMISTRY_STYLES_DISTILLERY = `/* Lumistry — Distillery.
   A night-shift laboratory: dark glass, glowing violet and mint liquid, rising bubbles,
   a star-field, neon doodles and a Chemistry test tube. Same goals as before: large type
   and touch targets, clear button hierarchy, visible focus, icon + label navigation, and
   state never carried by colour alone. */



.lumistry[data-lumistry-theme="distillery"] {
  container-type:inline-size;
  width:100%;
  min-width:0;
  /* Distillery palette */
  --dd-bg:#0f1224;
  --dd-glass:#1a1e3a;
  --dd-glass2:#232757;
  --dd-edge:#8f93d9;
  --dd-edge-soft:#3a3f6e;
  --dd-violet:#8b7cff;
  --dd-mint:#5fe3c0;
  --dd-pink:#ff8db3;
  --dd-gold:#ffe27a;
  --dd-text:#ecebfa;
  --dd-muted:#b9b7dd;
  --dd-alert:#ff8da1;
  --dd-glow:0 0 0 3px rgba(95,227,192,.16),0 0 18px rgba(95,227,192,.42);
  --dd-glow-violet:0 0 0 1px rgba(139,124,255,.5),0 0 20px rgba(139,124,255,.32);
  --dd-card:linear-gradient(180deg,#1d2142,#171a35);
  --dd-lift:0 14px 30px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.07);
  --dd-display:"Bricolage Grotesque","Sora","Outfit",system-ui,sans-serif;
  --dd-body:"DM Sans","Outfit",system-ui,sans-serif;
  /* Doodle palette: neon outline on dark glass */
  --d-line:#9c8fff;--d-face:#f4f1ff;--d-dark:#0f1224;--d-w:#2a2f66;--d-y:#ffe27a;--d-p:#1f9c86;--d-r:#ff8db3;--d-m:#5fe3c0;--d-m2:#1f4b55;--d-p2:#5a2f4a;--d-l:#6f63d9;--d-l2:#3a3378;--d-g1:#4fcf93;--d-g2:#8ff0c0;--d-c:#ff9e7a;--d-b:#7fa8ff;--d-hl:rgba(255,255,255,.55);--d-hl2:rgba(255,255,255,.45);
  /* Pocket variables, re-pointed so every inherited component reads as Distillery */
  --lp-bg:var(--dd-bg);
  --lp-surface:var(--dd-glass);
  --lp-surface-2:var(--dd-glass2);
  --lp-text:var(--dd-text);
  --lp-muted:var(--dd-muted);
  --lp-border:var(--dd-edge-soft);
  --lp-accent:var(--dd-mint);
  --lp-destructive:var(--dd-alert);
  /* Lumistry tokens (theme-distillery.css overrides these) */
  --lumistry-rose:var(--dd-pink);
  --lumistry-violet:var(--dd-violet);
  --lumistry-mint:var(--dd-mint);
  --lumistry-gold:var(--dd-gold);
  --lumistry-primary:var(--dd-mint);
  --lumistry-tint:rgba(95,227,192,.14);
  --lumistry-radius:22px;
  --lumistry-touch:48px;
  font-family:var(--dd-body);
}
/* rising bubbles, star-field and two soft glows behind everything */
.lp-page.lumistry[data-lumistry-theme="distillery"] {background-color:var(--dd-bg);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='520' viewBox='0 0 240 520' fill='none'%3E%3Cg stroke='%235FE3C0' stroke-opacity='.32' stroke-width='2'%3E%3Ccircle cx='50' cy='440' r='14'/%3E%3Ccircle cx='176' cy='388' r='9'/%3E%3Ccircle cx='112' cy='300' r='20'/%3E%3Ccircle cx='204' cy='226' r='7'/%3E%3Ccircle cx='60' cy='150' r='11'/%3E%3Ccircle cx='150' cy='72' r='16'/%3E%3C/g%3E%3Cg stroke='%23fff' stroke-opacity='.35' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M42 436a8 8 0 0 1 5-5'/%3E%3Cpath d='M102 294a13 13 0 0 1 8-8'/%3E%3Cpath d='M142 66a9 9 0 0 1 6-5'/%3E%3C/g%3E%3Cg fill='%238B7CFF' fill-opacity='.35'%3E%3Ccircle cx='20' cy='350' r='3'/%3E%3Ccircle cx='224' cy='460' r='3'/%3E%3Ccircle cx='120' cy='500' r='2.4'/%3E%3Ccircle cx='30' cy='40' r='2.6'/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg fill='%23ECEBFA'%3E%3Ccircle cx='20' cy='30' r='1.3' opacity='.55'/%3E%3Ccircle cx='88' cy='18' r='1.1' opacity='.45'/%3E%3Ccircle cx='168' cy='46' r='1.4' opacity='.6'/%3E%3Ccircle cx='132' cy='96' r='1.1' opacity='.45'/%3E%3Ccircle cx='52' cy='112' r='1.3' opacity='.5'/%3E%3Ccircle cx='186' cy='150' r='1.2' opacity='.5'/%3E%3Ccircle cx='100' cy='176' r='1.4' opacity='.55'/%3E%3Ccircle cx='14' cy='170' r='1.1' opacity='.4'/%3E%3Cpath d='M44 60l1.6 4.4 4.4 1.6-4.4 1.6L44 72l-1.6-4.4L38 66l4.4-1.6z' opacity='.55'/%3E%3Cpath d='M150 128l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z' opacity='.5'/%3E%3C/g%3E%3Cg fill='none' stroke='%238B7CFF' stroke-opacity='.28' stroke-width='1'%3E%3Cpath d='M88 18L132 96 168 46M52 112L100 176'/%3E%3C/g%3E%3C/svg%3E"),radial-gradient(circle at 0% 0%,rgba(139,124,255,.22),transparent 55%),radial-gradient(circle at 100% 100%,rgba(95,227,192,.16),transparent 50%);background-size:240px 520px,200px 200px,100% 100%,100% 100%;background-position:0 0,0 0,0 0,0 0;color:var(--dd-text);animation:dd-rise 70s linear infinite}
@keyframes dd-rise {to {background-position:0 -520px,0 0,0 0,0 0}}

/* ---------- doodles and icons ---------- */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-ico {width:1.3em;height:1.3em;flex:none}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle {display:block;width:36px;height:36px;flex:none}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .k {stroke:var(--d-line)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .ks {stroke:var(--d-face)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .kd {stroke:var(--d-dark)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .kdf {fill:var(--d-dark)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .kf {fill:var(--d-face)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .ms {stroke:var(--d-m)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .b {stroke:var(--d-b)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .hl {stroke:var(--d-hl)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .hl2 {stroke:var(--d-hl2)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .hlf {fill:var(--d-hl)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .w {fill:var(--d-w)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .y {fill:var(--d-y)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .p {fill:var(--d-p)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .r {fill:var(--d-r)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .m2 {fill:var(--d-m2)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .p2 {fill:var(--d-p2)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .l {fill:var(--d-l)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .l2 {fill:var(--d-l2)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .g1 {fill:var(--d-g1)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .g2 {fill:var(--d-g2)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-doodle .c {fill:var(--d-c)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-mascot {filter:drop-shadow(0 0 10px rgba(95,227,192,.55)) drop-shadow(0 0 22px rgba(139,124,255,.35))}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-sticker {position:absolute;z-index:6;pointer-events:none;width:58px;height:58px;filter:drop-shadow(0 0 8px rgba(139,124,255,.7))}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-sticker-tl {top:-18px;left:-12px;transform:rotate(-14deg)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-sticker-tr {top:-14px;right:-10px;width:50px;height:50px;transform:rotate(12deg);filter:drop-shadow(0 0 8px rgba(95,227,192,.7))}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-empty>.lumistry-doodle {filter:drop-shadow(0 0 10px rgba(95,227,192,.5))}

/* rising bubbles inside placeholders */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-bubbles {position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-bubbles i {position:absolute;bottom:-24px;left:10%;width:14px;height:14px;border-radius:50%;border:1.5px solid rgba(95,227,192,.75);background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.4),rgba(95,227,192,.08));animation:dd-bubble 7s ease-in infinite}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-bubbles i:nth-child(2) {left:24%;width:8px;height:8px;animation-duration:5.2s;animation-delay:-1.6s}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-bubbles i:nth-child(3) {left:38%;width:20px;height:20px;animation-duration:8.4s;animation-delay:-3.1s;border-color:rgba(139,124,255,.8)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-bubbles i:nth-child(4) {left:56%;width:10px;height:10px;animation-duration:6s;animation-delay:-4.4s}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-bubbles i:nth-child(5) {left:70%;width:16px;height:16px;animation-duration:7.6s;animation-delay:-2.2s;border-color:rgba(255,141,179,.8)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-bubbles i:nth-child(6) {left:82%;width:9px;height:9px;animation-duration:5.6s;animation-delay:-.6s}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-bubbles i:nth-child(7) {left:92%;width:12px;height:12px;animation-duration:6.8s;animation-delay:-5.1s;border-color:rgba(139,124,255,.8)}
@keyframes dd-bubble {0%{transform:translateY(0) scale(.5);opacity:0}12%{opacity:1}100%{transform:translateY(-320px) scale(1.05);opacity:0}}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-portrait-placeholder>:not(.lumistry-bubbles):not(.lumistry-monogram) {position:relative;z-index:1}

/* ---------- header ---------- */
.lumistry[data-lumistry-theme="distillery"] .lp-nav {background:color-mix(in srgb,var(--dd-bg) 86%,transparent);border-bottom:1.5px solid var(--dd-edge-soft)}
.lumistry[data-lumistry-theme="distillery"] .lp-nav-title {font-family:var(--dd-display);font-size:23px;font-weight:700;letter-spacing:-.02em}
.lumistry[data-lumistry-theme="distillery"] .lumistry-brand {justify-self:end;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--dd-glass2);border:2px solid var(--dd-violet);color:var(--dd-pink);font-size:22px;box-shadow:var(--dd-glow-violet)}
.lumistry[data-lumistry-theme="distillery"] .lp-nav .lp-button {min-height:40px;padding:6px 10px;border:0;background:transparent;box-shadow:none;color:var(--dd-mint);font-weight:700;justify-content:flex-start}
.lumistry[data-lumistry-theme="distillery"] .lp-nav .lp-button:hover:not(:disabled) {background:transparent;text-decoration:underline}

/* ---------- tabs: a glass dock ---------- */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tabs {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:14px 14px 4px;padding:6px;gap:4px;background:var(--dd-glass);border:1.5px solid var(--dd-edge-soft);border-radius:24px;box-shadow:var(--dd-lift)}
.lumistry[data-lumistry-theme="distillery"] .lumistry-tabs .lp-button {position:relative;flex-direction:column;justify-content:flex-start;gap:3px;text-align:center;line-height:1.15;min-width:0;min-height:56px;padding:8px 2px;font-size:12px;font-weight:700;color:#c9cce8;background:transparent;border:0;border-radius:18px;box-shadow:none}
.lumistry[data-lumistry-theme="distillery"] .lumistry-tabs .lp-button:hover:not(:disabled) {background:rgba(139,124,255,.16);transform:none}
.lumistry[data-lumistry-theme="distillery"] .lumistry-tabs [aria-current="page"] {background:var(--dd-mint);color:#0f1224;font-weight:800;box-shadow:var(--dd-glow)}
.lumistry[data-lumistry-theme="distillery"] .lumistry-tabs [aria-current="page"]:hover:not(:disabled) {background:var(--dd-mint)}
.lumistry[data-lumistry-theme="distillery"] .lumistry-tabs [aria-current="page"]::after {content:"";position:absolute;top:-6px;right:-3px;width:16px;height:16px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1.5l2.6 6.4 6.9.6-5.2 4.5 1.6 6.7L12 16l-5.9 3.7 1.6-6.7L2.5 8.5l6.9-.6z' fill='%23FFE27A' stroke='%230F1224' stroke-width='1.4' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat;filter:drop-shadow(0 0 5px rgba(255,226,122,.9))}

/* ---------- cards, text ---------- */
.lumistry[data-lumistry-theme="distillery"] .lp-content {padding:16px;gap:18px}
.lumistry[data-lumistry-theme="distillery"] .lp-card {padding:16px;border:1.5px solid rgba(139,124,255,.5);border-radius:var(--lumistry-radius);background:var(--dd-card);box-shadow:var(--dd-lift)}
.lumistry[data-lumistry-theme="distillery"] .lp-copy {color:var(--dd-muted);font-size:max(12px,var(--pocket-font-sm,12px));line-height:1.55}
.lumistry[data-lumistry-theme="distillery"] .lp-title {font-family:var(--dd-display);font-size:max(15px,var(--pocket-font-md,14px));font-weight:700}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile>h2.lp-title {font-size:calc(var(--pocket-font-md,14px) * 1.5);letter-spacing:-.02em}
.lumistry[data-lumistry-theme="distillery"] .lp-stack {display:grid;gap:12px;min-width:0}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-bio {white-space:pre-wrap;color:var(--dd-text);font-size:max(15px,var(--pocket-font-md,14px));line-height:1.55;overflow-wrap:anywhere}

/* ---------- buttons: glowing glass ---------- */
.lumistry[data-lumistry-theme="distillery"] .lp-button {display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:var(--lumistry-touch);padding:10px 16px;border:1.5px solid var(--dd-edge);border-radius:16px;background:var(--dd-glass2);color:var(--dd-text);font-size:max(13px,var(--pocket-font-sm,12px));font-weight:700;line-height:1.25;transition:background .15s,border-color .15s,box-shadow .15s,transform .1s}
.lumistry[data-lumistry-theme="distillery"] .lp-button:hover:not(:disabled) {border-color:var(--dd-mint);background:#2a3070;box-shadow:var(--dd-glow)}
.lumistry[data-lumistry-theme="distillery"] .lp-button:active:not(:disabled) {transform:scale(.97)}
.lumistry[data-lumistry-theme="distillery"] .lp-button-primary {background:var(--dd-mint);border-color:var(--dd-mint);color:#0f1224;box-shadow:var(--dd-glow)}
.lumistry[data-lumistry-theme="distillery"] .lp-button-primary:hover:not(:disabled) {background:#7bf0d1;border-color:#7bf0d1}
.lumistry[data-lumistry-theme="distillery"] .lp-button-danger {background:transparent;color:var(--dd-alert);border-color:var(--dd-alert)}
.lumistry[data-lumistry-theme="distillery"] .lp-button-danger:hover:not(:disabled) {border-color:var(--dd-alert);background:rgba(255,141,161,.12);box-shadow:0 0 0 3px rgba(255,141,161,.14),0 0 16px rgba(255,141,161,.32)}
.lumistry[data-lumistry-theme="distillery"] .lp-button:disabled {opacity:.5;cursor:not-allowed}
.lumistry[data-lumistry-theme="distillery"] .lumistry-icon-after {flex-direction:row-reverse}
:is(.lumistry[data-lumistry-theme="distillery"] .lp-button,.lumistry[data-lumistry-theme="distillery"] summary,.lumistry[data-lumistry-theme="distillery"] input,.lumistry[data-lumistry-theme="distillery"] select,.lumistry[data-lumistry-theme="distillery"] textarea):focus-visible {outline:3px solid var(--dd-gold);outline-offset:3px}

:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-actions {display:flex;flex-wrap:wrap;gap:10px;align-items:center}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-actions .lp-button {flex:1 1 150px}

/* Keep Pocket's native page scroller; actions sit right under the portrait. */
.lumistry[data-lumistry-theme="distillery"].lumistry-discover {height:100%;min-height:100%;display:block;overflow:auto}
.lumistry[data-lumistry-theme="distillery"].lumistry-discover>.lp-content {min-height:0;overflow:visible;align-content:start}
.lumistry[data-lumistry-theme="distillery"].lumistry-discover .lumistry-swipe {position:sticky;top:0;align-self:start}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-swipe {position:relative;z-index:5;display:grid;grid-template-columns:1fr 1.3fr 1.1fr;gap:12px;padding:10px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-swipe .lp-button {flex-direction:column;gap:3px;min-height:64px;padding:8px 4px;border-radius:22px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-swipe .lp-button .lumistry-ico {width:1.6em;height:1.6em}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-swipe .lp-button .lumistry-doodle {width:34px;height:34px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-swipe .lp-button-primary .lumistry-doodle {--d-line:#0f1224}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-swipe .lp-button:nth-child(3) {border-color:var(--dd-pink);box-shadow:0 0 0 3px rgba(255,141,179,.14),0 0 16px rgba(255,141,179,.35)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-swipe .lp-button:nth-child(3):hover:not(:disabled) {border-color:var(--dd-pink);box-shadow:0 0 0 3px rgba(255,141,179,.22),0 0 22px rgba(255,141,179,.5)}

/* ---------- portraits and authored profiles ---------- */
.lumistry[data-lumistry-theme="distillery"] .lumistry-profile {position:relative;padding:0;border-radius:28px;overflow:visible;background:var(--dd-card);border-color:rgba(139,124,255,.6);box-shadow:var(--dd-lift),var(--dd-glow-violet)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-portrait {display:block;position:relative;isolation:isolate;overflow:hidden;min-width:0;background:radial-gradient(circle at 50% 38%,hsl(var(--portrait-hue,260) 55% 30%),#151832 72%);color:var(--dd-text)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile>.lumistry-portrait {border-radius:26px 26px 0 0}
/* liquid surface where the portrait meets the card */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile>.lumistry-portrait::after {content:"";position:absolute;z-index:2;left:0;right:0;bottom:-1px;height:14px;pointer-events:none;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='14' viewBox='0 0 80 14'%3E%3Cpath d='M0 8Q10 2 20 8T40 8T60 8T80 8V14H0Z' fill='%231d2142'/%3E%3Cpath d='M0 8Q10 2 20 8T40 8T60 8T80 8' fill='none' stroke='%235FE3C0' stroke-width='2.2'/%3E%3C/svg%3E") repeat-x left bottom/80px 14px;animation:dd-wave 7s linear infinite}
@keyframes dd-wave {to {background-position:80px bottom}}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-portrait>img {position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-hero {aspect-ratio:4/5;min-height:250px;max-height:560px}
.lumistry[data-lumistry-theme="distillery"].lumistry-discover .lumistry-hero {aspect-ratio:1/1.08;min-height:220px;max-height:440px}
.lumistry[data-lumistry-theme="distillery"].lumistry-discover .lumistry-section-heading>p {display:none}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-portrait-placeholder {position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px 16px 100px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-portrait-fallback .lumistry-portrait-placeholder {display:flex}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-mascot {width:min(46%,150px);height:auto}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-monogram {position:absolute;z-index:3;right:14px;bottom:24px;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:var(--dd-glass2);border:2px solid var(--dd-violet);color:var(--dd-mint);font-family:var(--dd-display);font-size:26px;font-weight:700;line-height:1;box-shadow:var(--dd-glow-violet)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-photo-label {padding:3px 12px;border-radius:999px;background:rgba(15,18,36,.7);border:1px solid var(--dd-edge-soft);font-size:12px;font-weight:700;color:var(--dd-muted);text-align:center}
/* the name is a glass label on the bottle */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-portrait-identity {position:absolute;z-index:3;left:12px;bottom:24px;max-width:calc(100% - 92px);padding:8px 14px 9px;overflow-wrap:anywhere;pointer-events:none;background:rgba(15,18,36,.78);backdrop-filter:blur(10px);border:1.5px solid var(--dd-mint);border-radius:16px;box-shadow:0 0 16px rgba(95,227,192,.3)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-portrait-name {display:block;margin:0 0 2px;color:var(--dd-text);font-family:var(--dd-display);font-size:clamp(20px,6.2cqi,28px);font-weight:700;letter-spacing:-.02em;line-height:1.1}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-portrait-identity :is(p,small) {display:block;margin:2px 0 0;font-size:13px;font-weight:600;color:var(--dd-muted);line-height:1.3}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-portrait-identity .lumistry-portrait-distance {color:var(--dd-muted);font-size:12px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-photo-pagination {position:absolute;z-index:4;top:10px;left:50px;right:50px;display:flex;gap:6px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-photo-segment {flex:1;min-width:0;height:28px;padding:10px 0;border:0;background:transparent;cursor:pointer}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-photo-segment::after {content:"";display:block;height:8px;border-radius:8px;border:1.5px solid var(--dd-mint);background:rgba(15,18,36,.6)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-photo-segment[aria-current="true"]::after {background:var(--dd-mint);box-shadow:0 0 10px rgba(95,227,192,.8)}
.lumistry[data-lumistry-theme="distillery"] .lumistry-photo-arrow {position:absolute;z-index:4;top:calc(50% - 22px);width:44px;height:44px;min-height:44px;padding:0;border:1.5px solid var(--dd-mint);border-radius:50%;background:rgba(15,18,36,.72);color:var(--dd-mint);font-size:0;backdrop-filter:blur(8px);box-shadow:0 0 12px rgba(95,227,192,.3)}
.lumistry[data-lumistry-theme="distillery"] .lumistry-photo-arrow .lumistry-ico {width:22px;height:22px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-photo-previous {left:10px}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-photo-next {right:10px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile-body {display:grid;gap:16px;padding:20px 18px 22px;min-width:0}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile-body p {margin:0}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-caption {font-size:13px;color:var(--dd-muted);line-height:1.5;font-style:italic;overflow-wrap:anywhere}
/* photo descriptions and prompt answers are lab notes */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-photo-description,:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile-answer {position:relative;padding:18px 14px 14px;border:1.5px dashed var(--dd-mint);border-radius:14px;background:rgba(95,227,192,.07);color:var(--dd-text);font-size:13px;line-height:1.5;overflow-wrap:anywhere}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile-answer {display:grid;gap:8px;border-color:var(--dd-violet);background:rgba(139,124,255,.1)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-photo-description::before,:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile-answer::before {content:"LAB NOTE";content:"LAB NOTE" / "";position:absolute;top:-9px;left:12px;padding:0 8px;background:var(--dd-glass);color:var(--dd-mint);font-size:11px;font-weight:800;letter-spacing:.14em}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile-answer::before {color:var(--dd-violet);filter:brightness(1.35)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile-answer h3 {margin:0;color:var(--dd-muted);font-size:13px;font-weight:700}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile-tools>.lumistry-actions {padding:4px 0 12px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-detail-status {display:inline-block;justify-self:start;margin:0;padding:4px 12px;border:1.5px solid var(--dd-gold);border-radius:999px;background:rgba(255,226,122,.1);color:var(--dd-gold);font-size:13px;font-weight:700;box-shadow:0 0 12px rgba(255,226,122,.25)}

/* Chemistry test tube */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-meter {display:grid;grid-template-columns:auto 1fr;grid-template-areas:"label tube" "count count";align-items:center;gap:6px 12px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-meter-label {grid-area:label;font-family:var(--dd-display);font-size:14px;font-weight:700;color:var(--dd-text)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-meter-tube {grid-area:tube;position:relative;height:20px;border:2px solid var(--dd-violet);border-radius:12px;background:#12152e;overflow:hidden;box-shadow:inset 0 2px 5px rgba(0,0,0,.5)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-meter-fill {position:absolute;left:0;top:0;bottom:0;border-radius:10px;background:linear-gradient(180deg,#8ff0d6,#3fd2b5);box-shadow:0 0 12px rgba(95,227,192,.7)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-meter-fill::after {content:"";position:absolute;left:8px;right:8px;top:3px;height:4px;border-radius:4px;background:rgba(255,255,255,.45)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-meter-count {grid-area:count;font-size:12px;color:var(--dd-muted)}

/* ---------- connections: glass portrait cards ---------- */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-section-heading {min-width:0}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-section-heading h1 {font-family:var(--dd-display);font-size:28px;font-weight:700;letter-spacing:-.03em;line-height:1.15;margin:0 0 8px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-section-heading h1::after {content:"";display:block;width:96px;height:14px;margin-top:6px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 14' fill='none' stroke-width='2'%3E%3Ccircle cx='8' cy='7' r='4' stroke='%235FE3C0'/%3E%3Ccircle cx='26' cy='7' r='5.5' stroke='%238B7CFF'/%3E%3Ccircle cx='44' cy='7' r='3' stroke='%23FF8DB3'/%3E%3Ccircle cx='58' cy='7' r='2' stroke='%235FE3C0'/%3E%3Ccircle cx='70' cy='7' r='1.4' stroke='%238B7CFF'/%3E%3C/svg%3E") left center/contain no-repeat;filter:drop-shadow(0 0 4px rgba(95,227,192,.6))}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-section-heading p {margin:0;color:var(--dd-muted)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-section {min-width:0;display:grid;gap:14px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-section>h2 {margin:0;font-family:var(--dd-display);font-size:17px;font-weight:700}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card {appearance:none;display:block;min-width:0;padding:0;border:1.5px solid rgba(139,124,255,.55);border-radius:22px;background:var(--dd-glass);color:inherit;text-align:left;cursor:pointer;overflow:hidden;box-shadow:var(--dd-lift);transition:transform .15s,border-color .15s,box-shadow .15s}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card:hover {transform:translateY(-3px);border-color:var(--dd-mint);box-shadow:var(--dd-lift),var(--dd-glow)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card .lumistry-portrait {aspect-ratio:3/4;min-height:170px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card .lumistry-portrait-identity {left:8px;bottom:10px;max-width:calc(100% - 52px);padding:5px 8px 6px;border-radius:12px;border-width:1.5px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card .lumistry-portrait-name {font-size:16px;margin-bottom:1px;letter-spacing:-.02em}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card .lumistry-portrait-identity :is(p,small) {font-size:12px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card .lumistry-portrait-placeholder {padding:44px 8px 100px;gap:6px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card .lumistry-mascot {width:min(44%,76px)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card .lumistry-monogram {right:7px;bottom:10px;width:36px;height:36px;font-size:18px;border-width:1.5px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card .lumistry-photo-label {display:none}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-status {position:absolute;z-index:3;top:10px;left:10px;width:fit-content;max-width:calc(100% - 20px);padding:4px 10px;border:1.5px solid var(--dd-gold);border-radius:999px;background:rgba(15,18,36,.8);color:var(--dd-gold);font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:0 0 10px rgba(255,226,122,.3)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-connection-actions {padding-bottom:12px}

/* ---------- inbox: glass rows ---------- */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-list {min-width:0;border:1.5px solid rgba(139,124,255,.5);border-radius:22px;background:var(--dd-card);box-shadow:var(--dd-lift);overflow:hidden}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-row {appearance:none;display:flex;align-items:center;gap:14px;width:100%;min-width:0;min-height:84px;padding:14px;border:0;border-bottom:1px solid var(--dd-edge-soft);background:transparent;color:var(--dd-text);text-align:left;font:inherit;cursor:pointer}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-row:last-child {border-bottom:0}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-row:hover {background:rgba(139,124,255,.12)}
.lumistry[data-lumistry-theme="distillery"] .lumistry-inbox-row .lp-avatar {position:relative;width:54px;height:54px;flex:0 0 54px;border-radius:50%;border:2px solid var(--dd-violet);font-family:var(--dd-display);font-size:24px;font-weight:700;background:var(--dd-glass2);color:var(--dd-mint);box-shadow:var(--dd-glow-violet)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-row .lp-avatar img {position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-copy {display:grid;gap:5px;min-width:0;flex:1}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-top {display:flex;align-items:baseline;gap:8px;min-width:0}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-top strong {flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--dd-display);font-size:17px;font-weight:700}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-top time {color:var(--dd-muted);font-size:12px;white-space:nowrap}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-preview {color:var(--dd-muted);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.45}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-inbox-row.has-unread .lumistry-inbox-preview {color:var(--dd-text);font-weight:700}
.lumistry[data-lumistry-theme="distillery"] .lp-unread {min-width:26px;height:26px;background:var(--dd-pink);color:#0f1224;font-size:12px;font-weight:800;box-shadow:0 0 12px rgba(255,141,179,.55)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-chat-settings {margin-top:6px}

/* ---------- discovery controls ---------- */
.lumistry[data-lumistry-theme="distillery"].lumistry-discovery-toolbar {display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-toolbar-actions {display:flex;align-items:center;gap:8px;flex:none}
.lumistry[data-lumistry-theme="distillery"] .lumistry-toolbar-actions .lp-button {min-height:44px;padding:8px 12px;font-size:13px}
.lumistry[data-lumistry-theme="distillery"] .lumistry-options {position:relative;padding:0 12px;border:1.5px solid var(--dd-edge);border-radius:16px;background:var(--dd-glass2)}
.lumistry[data-lumistry-theme="distillery"] .lumistry-options>summary {min-height:38px;font-size:13px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-options-menu {position:absolute;right:0;top:calc(100% + 10px);z-index:20;display:grid;gap:8px;width:220px;padding:12px;border:1.5px solid var(--dd-violet);border-radius:18px;background:var(--dd-glass);box-shadow:0 18px 40px rgba(0,0,0,.6),var(--dd-glow-violet)}.lumistry[data-lumistry-theme="distillery"] .lumistry-options-menu>.lp-button {justify-content:flex-start;margin:0;width:100%}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-pool-status {display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--dd-muted)}
.lumistry[data-lumistry-theme="distillery"] .lumistry-pool-status .lp-button {min-height:44px;padding:6px 14px;font-size:13px;border-color:var(--dd-mint);color:var(--dd-mint);background:transparent}
.lumistry[data-lumistry-theme="distillery"] .lumistry-profile .lumistry-swipe {position:static;margin:0;border:0;border-radius:0;box-shadow:none;background:transparent;backdrop-filter:none;padding:18px 18px 4px}
.lumistry[data-lumistry-theme="distillery"] .lumistry-profile .lumistry-swipe .lp-button {flex-direction:column;min-height:66px;border-radius:22px;font-size:13px}
.lumistry[data-lumistry-theme="distillery"] .lumistry-busy .lp-button {min-height:40px;padding:6px 12px;font-size:12px}
.lumistry[data-lumistry-theme="distillery"] .lumistry-busy>p {flex:1 1 150px;margin:0;font-size:13px}
:where(.lumistry[data-lumistry-theme="distillery"]) :is(.lumistry-match-card,.lumistry-inbox-row,.lumistry-photo-segment):focus-visible {outline:3px solid var(--dd-gold);outline-offset:3px}
@container (min-width:520px) {:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-grid {grid-template-columns:repeat(3,minmax(0,1fr))}}
@container (max-width:340px) {.lumistry[data-lumistry-theme="distillery"].lumistry-discovery-toolbar {align-items:flex-start;flex-wrap:wrap}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-grid {gap:10px}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-match-card .lumistry-portrait-name {font-size:15px}.lumistry[data-lumistry-theme="distillery"] .lumistry-profile .lumistry-swipe {padding:14px 10px 4px;gap:8px}.lumistry[data-lumistry-theme="distillery"] .lumistry-profile .lumistry-swipe .lp-button {padding:8px 2px;font-size:12px}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-profile-body {padding:16px 14px 18px}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tabs {margin:12px 10px 4px}}

/* ---------- tags: glowing pills ---------- */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tags {display:flex;flex-wrap:wrap;gap:10px;margin:8px 0}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tag {display:inline-flex;align-items:baseline;gap:5px;padding:6px 13px 6px 11px;border-radius:999px;border:1.5px solid var(--tag,var(--dd-violet));background:rgba(255,255,255,.04);color:var(--dd-text);font-size:13px;font-weight:600;line-height:1.35;overflow-wrap:anywhere;max-width:100%;box-shadow:0 0 12px color-mix(in srgb,var(--tag,var(--dd-violet)) 30%,transparent)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tag::before {content:"";flex:none;align-self:center;width:8px;height:8px;border-radius:50%;background:var(--tag,var(--dd-violet));box-shadow:0 0 8px var(--tag,var(--dd-violet))}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tag:nth-child(4n+1) {--tag:var(--dd-mint)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tag:nth-child(4n+2) {--tag:var(--dd-violet)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tag:nth-child(4n+3) {--tag:var(--dd-pink)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tag:nth-child(4n) {--tag:var(--dd-gold)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-tag strong {font-weight:700;color:var(--dd-muted)}

/* ---------- forms ---------- */
.lumistry[data-lumistry-theme="distillery"] .lp-label {display:grid;gap:6px;font-size:14px;font-weight:700;color:var(--dd-text)}
.lumistry[data-lumistry-theme="distillery"] :is(.lp-input,.lp-select,.lp-textarea) {min-height:var(--lumistry-touch);padding:11px 14px;border:1.5px solid var(--dd-edge);border-radius:14px;background:#12152e;color:var(--dd-text);font-size:max(15px,var(--pocket-font-md,14px));box-shadow:inset 0 2px 6px rgba(0,0,0,.35)}
.lumistry[data-lumistry-theme="distillery"] .lp-textarea {min-height:100px;max-height:none;resize:vertical;line-height:1.5}
.lumistry[data-lumistry-theme="distillery"] :is(.lp-input,.lp-select,.lp-textarea):focus {border-color:var(--dd-mint);box-shadow:inset 0 2px 6px rgba(0,0,0,.35),0 0 0 3px rgba(95,227,192,.28),0 0 16px rgba(95,227,192,.3)}
.lumistry[data-lumistry-theme="distillery"] label.lp-row {display:flex;flex-wrap:nowrap;align-items:center;gap:12px;min-height:44px;cursor:pointer}
.lumistry[data-lumistry-theme="distillery"] input[type="checkbox"] {appearance:none;-webkit-appearance:none;display:inline-grid;place-content:center;width:26px;height:26px;margin:0;flex:none;border:1.5px solid var(--dd-edge);border-radius:9px;background:#12152e;cursor:pointer}
.lumistry[data-lumistry-theme="distillery"] input[type="checkbox"]:checked {background:var(--dd-mint);border-color:var(--dd-mint);box-shadow:0 0 12px rgba(95,227,192,.6)}
.lumistry[data-lumistry-theme="distillery"] input[type="checkbox"]:checked::after {content:"";width:7px;height:12px;border:solid #0f1224;border-width:0 3px 3px 0;transform:rotate(45deg) translate(-1px,-1px)}
.lumistry[data-lumistry-theme="distillery"] input[type="range"] {accent-color:var(--dd-mint)}

/* collapsible sections */
.lumistry[data-lumistry-theme="distillery"] details {border:1.5px solid var(--dd-edge-soft);border-radius:16px;padding:0 14px;background:var(--dd-glass2)}
.lumistry[data-lumistry-theme="distillery"] details details {background:rgba(255,255,255,.03)}
.lumistry[data-lumistry-theme="distillery"] summary {display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:var(--lumistry-touch);cursor:pointer;list-style:none;color:var(--dd-text);font-size:14px;font-weight:700;overflow-wrap:anywhere}
.lumistry[data-lumistry-theme="distillery"] summary::-webkit-details-marker {display:none}
.lumistry[data-lumistry-theme="distillery"] summary::after {content:"";flex:none;width:9px;height:9px;margin-right:4px;border-right:2.5px solid var(--dd-mint);border-bottom:2.5px solid var(--dd-mint);transform:rotate(45deg);transition:transform .2s}
.lumistry[data-lumistry-theme="distillery"] details[open]>summary::after {transform:rotate(-135deg)}
.lumistry[data-lumistry-theme="distillery"] details[open]>summary {border-bottom:1px solid var(--dd-edge-soft);margin-bottom:10px}
.lumistry[data-lumistry-theme="distillery"] details>.lp-label,.lumistry[data-lumistry-theme="distillery"] details>.lp-stack {margin:10px 0}
.lumistry[data-lumistry-theme="distillery"] details>.lp-button {margin:0 0 14px;width:100%}

/* multi-choice lists read as tappable glass chips */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-choice-list {display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;max-height:260px;overflow:auto;padding:4px 2px 10px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-choice-list label {display:flex;align-items:center;gap:10px;min-width:0;min-height:46px;padding:8px 12px;border:1.5px solid var(--dd-edge-soft);border-radius:14px;background:var(--dd-glass);cursor:pointer;font-size:14px;color:var(--dd-text)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-choice-list label:has(input:checked) {border-color:var(--dd-mint);background:rgba(95,227,192,.15);font-weight:800;box-shadow:0 0 12px rgba(95,227,192,.25)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-choice-list label .lp-copy {color:inherit;font-size:14px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-choice summary {overflow-wrap:anywhere}

/* ---------- age range ---------- */
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-range-label {font-size:15px;font-weight:800;color:var(--dd-text)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-age-range {position:relative;height:48px;margin:0 14px;background:linear-gradient(to right,#2e3360 var(--range-start),var(--dd-mint) var(--range-start),var(--dd-mint) var(--range-end),#2e3360 var(--range-end)) center/100% 10px no-repeat;border-radius:10px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-age-range input {position:absolute;inset:0;width:100%;margin:0;pointer-events:none;appearance:none;background:transparent;accent-color:var(--dd-mint)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-age-range input::-webkit-slider-thumb {pointer-events:auto;appearance:none;width:30px;height:30px;border-radius:50%;background:#12152e;border:3px solid var(--dd-mint);box-shadow:0 0 14px rgba(95,227,192,.7);cursor:grab}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-age-range input::-moz-range-thumb {pointer-events:auto;width:24px;height:24px;border-radius:50%;background:#12152e;border:3px solid var(--dd-mint);box-shadow:0 0 14px rgba(95,227,192,.7);cursor:grab}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-age-range input:focus-visible {outline:none}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-age-range input:focus-visible::-webkit-slider-thumb {box-shadow:0 0 0 4px var(--dd-bg),0 0 0 7px var(--dd-gold)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-age-range input:focus-visible::-moz-range-thumb {box-shadow:0 0 0 4px var(--dd-bg),0 0 0 7px var(--dd-gold)}

/* ---------- states ---------- */
.lumistry[data-lumistry-theme="distillery"] .lumistry-empty {display:grid;gap:12px;justify-items:center;text-align:center;padding:28px 16px;border:1.5px dashed var(--dd-violet);box-shadow:none;background:rgba(26,30,58,.7)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-empty .lumistry-ico {width:48px;height:48px;color:var(--dd-mint);stroke-width:1.5}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-empty>.lumistry-doodle {width:84px;height:84px}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-empty .lp-copy {color:var(--dd-text);font-size:14px}
.lumistry[data-lumistry-theme="distillery"] .lumistry-busy {display:flex;flex-wrap:wrap;align-items:center;gap:12px;border:1.5px dashed var(--dd-mint);background:rgba(95,227,192,.07)}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-busy>.lumistry-ico,:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-busy>.lumistry-doodle {color:var(--dd-mint);animation:lumistry-distillery-bob 1.6s ease-in-out infinite}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-busy>.lumistry-doodle {width:42px;height:42px;filter:drop-shadow(0 0 8px rgba(95,227,192,.6))}
.lumistry[data-lumistry-theme="distillery"] .lumistry-error {display:flex;align-items:flex-start;gap:10px;border:1.5px solid var(--dd-alert);background:rgba(255,141,161,.1);color:var(--dd-text);overflow-wrap:anywhere}
:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-error>.lumistry-ico {color:var(--dd-alert);margin-top:2px}
@keyframes lumistry-distillery-bob {0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-3px) rotate(4deg)}}

/* ---------- responsive / accessibility ---------- */
@container (max-width:380px) {.lumistry[data-lumistry-theme="distillery"] .lp-content{padding:12px}.lumistry[data-lumistry-theme="distillery"] .lumistry-tabs .lp-button{font-size:11px}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-swipe{gap:8px;padding:8px}}
@media (prefers-reduced-motion:reduce) {.lumistry[data-lumistry-theme="distillery"] *,.lumistry[data-lumistry-theme="distillery"] *::before,.lumistry[data-lumistry-theme="distillery"] *::after,.lp-page.lumistry[data-lumistry-theme="distillery"]{animation:none!important;transition:none!important}}
@media (forced-colors:active) {.lumistry[data-lumistry-theme="distillery"] .lumistry-tabs [aria-current="page"]{outline:3px solid Highlight}:where(.lumistry[data-lumistry-theme="distillery"]) .lumistry-choice-list label:has(input:checked){outline:3px solid Highlight}.lumistry[data-lumistry-theme="distillery"] .lp-button,.lumistry[data-lumistry-theme="distillery"] .lp-card{border-color:CanvasText}}
`;
