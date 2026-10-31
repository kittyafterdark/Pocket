// Imported from the supplied three-theme kit; selectors and animations scoped to Modern.
export const LUMISTRY_STYLES_MODERN = `
/* Lumistry — Modern.
   Airy, rounded and quick: soft white cards on a pale lilac ground, one coral-to-violet
   accent, immersive portraits with a bottom fade, glass tab dock, drifting colour orbs
   and gentle motion. Same goals as the other themes: large type and touch targets, clear
   button hierarchy, visible focus, icon + label navigation, and state never carried by
   colour alone. */
.lumistry[data-lumistry-theme="modern"] {
  container-type:inline-size;
  width:100%;
  min-width:0;
  /* Modern palette */
  --md-bg:#f5f3f9;
  --md-card:#ffffff;
  --md-soft:#f3effa;
  --md-ink:#14141c;
  --md-muted:#5e5c70;
  --md-line:#e4dff0;
  --md-edge:#8f8ba6;
  --md-accent:#ff4d6d;
  --md-accent-strong:#e0264f;
  --md-accent-text:#c71f45;
  --md-violet:#7c5cff;
  --md-mint:#00b894;
  --md-blue:#3b9bff;
  --md-alert:#d6243f;
  --md-grad:linear-gradient(135deg,#e0264f,#b8349f);
  --md-shadow:0 10px 30px rgba(30,20,60,.09);
  --md-shadow-sm:0 4px 14px rgba(30,20,60,.10);
  --md-display:"Plus Jakarta Sans","Inter",system-ui,sans-serif;
  /* Doodle palette: flat, clean icons with the cartoon faces switched off */
  --d-line:#14141c;--d-face:#14141c;--d-dark:#14141c;--d-w:#fff;--d-y:#ffb938;--d-p:#ff8fa3;--d-r:#ff4d6d;--d-m:#2ad1a3;--d-m2:#d9f7ee;--d-p2:#ffe0e8;--d-l:#a995ff;--d-l2:#e5deff;--d-g1:#46d39a;--d-g2:#9cebc7;--d-c:#ffa77a;--d-b:#3b9bff;--d-hl:#fff;--d-hl2:#cfe3ff;
  /* Pocket variables, re-pointed so every inherited component reads as Modern */
  --lp-bg:var(--md-bg);
  --lp-surface:var(--md-card);
  --lp-surface-2:var(--md-soft);
  --lp-text:var(--md-ink);
  --lp-muted:var(--md-muted);
  --lp-border:var(--md-line);
  --lp-accent:var(--md-accent-text);
  --lp-destructive:var(--md-alert);
  /* Lumistry tokens (theme-modern.css overrides these) */
  --lumistry-rose:var(--md-accent);
  --lumistry-violet:var(--md-violet);
  --lumistry-mint:var(--md-mint);
  --lumistry-gold:#ffb938;
  --lumistry-primary:var(--md-accent-strong);
  --lumistry-tint:rgba(255,77,109,.12);
  --lumistry-radius:28px;
  --lumistry-touch:48px;
  font-family:var(--md-display);
}
.lp-page.lumistry[data-lumistry-theme="modern"] {background-color:var(--md-bg);background-image:radial-gradient(circle at 0% 0%,rgba(255,77,109,.12),transparent 42%),radial-gradient(circle at 100% 0%,rgba(124,92,255,.12),transparent 40%);background-repeat:no-repeat;color:var(--md-ink)}
/* ---------- doodles and icons ---------- */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-ico {width:1.3em;height:1.3em;flex:none}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle {display:block;width:36px;height:36px;flex:none}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .k {stroke:var(--d-line)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .ks {stroke:var(--d-face)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .kd {stroke:var(--d-dark)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .kdf {fill:var(--d-dark)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .kf {fill:var(--d-face)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .ms {stroke:var(--d-m)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .b {stroke:var(--d-b)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .hl {stroke:var(--d-hl)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .hl2 {stroke:var(--d-hl2)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .hlf {fill:var(--d-hl)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .w {fill:var(--d-w)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .y {fill:var(--d-y)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .p {fill:var(--d-p)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .r {fill:var(--d-r)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .m2 {fill:var(--d-m2)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .p2 {fill:var(--d-p2)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .l {fill:var(--d-l)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .l2 {fill:var(--d-l2)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .g1 {fill:var(--d-g1)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .g2 {fill:var(--d-g2)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .c {fill:var(--d-c)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle :is(.kf,.ks,.kd,.kdf,.ch) {display:none}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-doodle .k {stroke-width:3}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-mascot,:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-sticker {display:none}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-empty > .lumistry-doodle {filter:drop-shadow(0 8px 14px rgba(30,20,60,.14))}
/* drifting colour orbs in placeholders (the renderer's bubble field) */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-bubbles {position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-bubbles i {position:absolute;border-radius:50%;filter:blur(42px);opacity:.75}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-bubbles i:nth-child(1) {top:-40px;left:-30px;width:200px;height:200px;background:hsl(calc(var(--portrait-hue,330) + 40) 95% 80%);animation:lumistry-modern-float-a 9s ease-in-out infinite}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-bubbles i:nth-child(2) {bottom:60px;right:-50px;width:220px;height:220px;background:hsl(calc(var(--portrait-hue,330) - 30) 85% 62%);animation:lumistry-modern-float-b 11s ease-in-out infinite}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-bubbles i:nth-child(3) {top:34%;left:30%;width:120px;height:120px;background:hsl(calc(var(--portrait-hue,330) + 80) 95% 82%);opacity:.5;animation:lumistry-modern-float-a 13s ease-in-out infinite reverse}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-bubbles i:nth-child(n+4) {display:none}
@keyframes lumistry-modern-float-a {0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(22px,-30px) scale(1.12)}}
@keyframes lumistry-modern-float-b {0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-26px,24px) scale(1.08)}}
/* ---------- header ---------- */
.lumistry[data-lumistry-theme="modern"] .lp-nav {background:color-mix(in srgb,var(--md-bg) 82%,transparent);border-bottom:0;backdrop-filter:blur(20px) saturate(1.3)}
.lumistry[data-lumistry-theme="modern"] .lp-nav-title {font-size:25px;font-weight:800;letter-spacing:-.04em}
.lumistry[data-lumistry-theme="modern"] .lumistry-brand {justify-self:end;position:relative;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#fff;color:var(--md-accent-strong);font-size:21px;box-shadow:var(--md-shadow-sm)}
.lumistry[data-lumistry-theme="modern"] .lp-nav .lp-button {min-height:40px;padding:6px 8px;gap:4px;white-space:nowrap;border:0;background:transparent;box-shadow:none;color:var(--md-accent-text);font-weight:700;justify-content:flex-start}
.lumistry[data-lumistry-theme="modern"] .lp-nav .lp-button:hover:not(:disabled) {background:transparent;text-decoration:underline}
.lumistry[data-lumistry-theme="modern"]:not(.lumistry-thread) .lp-nav {grid-template-columns:88px minmax(0,1fr) 88px}
/* ---------- tabs: a floating glass dock that stays under the header ---------- */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-tabs {position:sticky;top:54px;z-index:14;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:8px 14px 4px;padding:6px;gap:4px;background:rgba(255,255,255,.88);backdrop-filter:blur(16px);border-radius:26px;box-shadow:0 12px 34px rgba(30,20,60,.14)}
.lumistry[data-lumistry-theme="modern"] .lumistry-tabs .lp-button {position:relative;flex-direction:column;justify-content:flex-start;gap:3px;text-align:center;line-height:1.15;min-width:0;min-height:56px;padding:8px 2px;font-size:12px;font-weight:700;color:var(--md-muted);background:transparent;border:0;border-radius:20px;box-shadow:none;transition:background .2s ease,color .2s ease}
.lumistry[data-lumistry-theme="modern"] .lumistry-tabs .lp-button:hover:not(:disabled) {background:var(--md-soft);transform:none}
.lumistry[data-lumistry-theme="modern"] .lumistry-tabs [aria-current="page"] {background:rgba(255,77,109,.14);color:var(--md-accent-text);font-weight:800}
.lumistry[data-lumistry-theme="modern"] .lumistry-tabs [aria-current="page"]:hover:not(:disabled) {background:rgba(255,77,109,.18)}
.lumistry[data-lumistry-theme="modern"] .lumistry-tabs [aria-current="page"]::after {content:"";position:absolute;bottom:3px;left:50%;width:18px;height:3px;margin-left:-9px;border-radius:3px;background:var(--md-accent-strong);animation:lumistry-modern-grow .3s ease both}
@keyframes lumistry-modern-grow {from{transform:scaleX(0)}to{transform:scaleX(1)}}
/* ---------- cards, text ---------- */
.lumistry[data-lumistry-theme="modern"] .lp-content {padding:16px;gap:14px}
.lumistry[data-lumistry-theme="modern"] .lp-card {padding:16px;border:0;border-radius:var(--lumistry-radius);background:var(--md-card);box-shadow:var(--md-shadow)}
.lumistry[data-lumistry-theme="modern"] .lp-copy {color:var(--md-muted);font-size:max(12px,var(--pocket-font-sm,12px));line-height:1.55}
.lumistry[data-lumistry-theme="modern"] .lp-title {font-size:max(15px,var(--pocket-font-md,14px));font-weight:800;letter-spacing:-.02em}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-profile > h2.lp-title {font-size:calc(var(--pocket-font-md,14px) * 1.5)}
.lumistry[data-lumistry-theme="modern"] .lp-stack {display:grid;gap:12px;min-width:0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-bio {white-space:pre-wrap;color:var(--md-ink);font-size:max(15px,var(--pocket-font-md,14px));line-height:1.6;overflow-wrap:anywhere}
/* ---------- buttons ---------- */
.lumistry[data-lumistry-theme="modern"] .lp-button {display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:var(--lumistry-touch);padding:10px 18px;border:1.5px solid var(--md-line);border-radius:999px;background:#fff;color:var(--md-ink);font-size:max(13px,var(--pocket-font-sm,12px));font-weight:700;line-height:1.25;box-shadow:var(--md-shadow-sm);transition:transform .15s ease,box-shadow .2s ease,background .15s ease}
@media (hover:hover) {
.lumistry[data-lumistry-theme="modern"] .lp-button:hover:not(:disabled) {transform:translateY(-2px);background:#fff;box-shadow:0 10px 22px rgba(30,20,60,.14)}}
.lumistry[data-lumistry-theme="modern"] .lp-button:active:not(:disabled) {transform:scale(.95)}
.lumistry[data-lumistry-theme="modern"] .lp-button-primary {border-color:transparent;background:var(--md-grad);color:#fff;box-shadow:0 10px 24px rgba(224,38,79,.35)}
@media (hover:hover) {
.lumistry[data-lumistry-theme="modern"] .lp-button-primary:hover:not(:disabled) {background:var(--md-grad);box-shadow:0 14px 28px rgba(224,38,79,.45)}}
.lumistry[data-lumistry-theme="modern"] .lp-button-danger {color:var(--md-alert);background:#fff0f2;border-color:#f6c4cc;box-shadow:none}
.lumistry[data-lumistry-theme="modern"] .lp-button-danger:hover:not(:disabled) {background:#ffe3e8;box-shadow:0 8px 18px rgba(214,36,63,.18)}
.lumistry[data-lumistry-theme="modern"] .lp-button:disabled {opacity:.5;cursor:not-allowed}
.lumistry[data-lumistry-theme="modern"] .lumistry-icon-after {flex-direction:row-reverse}
:is(.lumistry[data-lumistry-theme="modern"] .lp-button,.lumistry[data-lumistry-theme="modern"] summary,.lumistry[data-lumistry-theme="modern"] input,.lumistry[data-lumistry-theme="modern"] select,.lumistry[data-lumistry-theme="modern"] textarea):focus-visible {outline:3px solid var(--md-violet);outline-offset:3px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-actions {display:flex;flex-wrap:wrap;gap:10px;align-items:center}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-actions .lp-button {flex:1 1 150px}
/* Keep Pocket's native page scroller; actions sit right under the portrait. */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-discover {height:100%;min-height:100%;display:block;overflow:auto}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-discover > .lp-content {min-height:0;overflow:visible;align-content:start}
/* ---------- portraits and authored profiles ---------- */
.lumistry[data-lumistry-theme="modern"] .lumistry-profile {position:relative;padding:0;border-radius:32px;overflow:visible;background:var(--md-card);box-shadow:0 24px 50px rgba(40,20,80,.16)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait {display:block;position:relative;isolation:isolate;overflow:hidden;min-width:0;background:linear-gradient(145deg,hsl(var(--portrait-hue,330) 85% 66%),hsl(calc(var(--portrait-hue,330) + 35) 75% 52%));color:#fff}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-profile > .lumistry-portrait {border-radius:32px 32px 0 0}
/* bottom fade so the name always reads */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait::after {content:"";position:absolute;z-index:2;left:0;right:0;bottom:0;height:62%;pointer-events:none;background:linear-gradient(to top,rgba(12,10,24,.86) 0%,rgba(12,10,24,.5) 52%,rgba(12,10,24,0) 100%)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait > img {position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-hero {aspect-ratio:4/5;min-height:250px;max-height:560px}
.lumistry[data-lumistry-theme="modern"].lumistry-discover .lumistry-hero:not(.lumistry-described-photo) {aspect-ratio:1/1;min-height:220px;max-height:380px}
.lumistry[data-lumistry-theme="modern"].lumistry-discover .lumistry-section-heading > p {display:none}
.lumistry[data-lumistry-theme="modern"].lumistry-discover .lumistry-section-heading h1 {margin:0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait-placeholder {position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px 16px 100px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait-fallback .lumistry-portrait-placeholder {display:flex}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait-placeholder::before {content:"";position:absolute;inset:0;z-index:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300' preserveAspectRatio='xMidYMax meet'%3E%3Ccircle cx='150' cy='104' r='52' fill='%23fff' fill-opacity='.32'/%3E%3Cpath d='M42 300c6-86 46-128 108-128s102 42 108 128z' fill='%23fff' fill-opacity='.28'/%3E%3C/svg%3E") center bottom/auto 78% no-repeat}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait-placeholder > :not(.lumistry-bubbles):not(.lumistry-monogram) {position:relative;z-index:1}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-monogram {position:absolute;z-index:3;right:16px;bottom:22px;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.2);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.6);color:#fff;font-size:24px;font-weight:800;line-height:1}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-photo-label {margin-top:90px;padding:4px 12px;border-radius:999px;background:rgba(12,10,24,.4);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.4);font-size:12px;font-weight:700;color:#fff;text-align:center}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait-identity {position:absolute;z-index:3;left:20px;bottom:20px;max-width:calc(100% - 96px);overflow-wrap:anywhere;pointer-events:none;color:#fff}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait-name {display:block;margin:0 0 4px;color:#fff;font-size:clamp(24px,8cqi,34px);font-weight:800;letter-spacing:-.03em;line-height:1.05}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait-identity :is(p,small) {display:block;margin:3px 0 0;font-size:14px;font-weight:600;color:rgba(255,255,255,.92);line-height:1.3}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-portrait-identity .lumistry-portrait-distance {color:rgba(255,255,255,.9);font-size:13px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-photo-pagination {position:absolute;z-index:4;top:12px;left:56px;right:56px;display:flex;gap:6px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-photo-segment {flex:1;min-width:0;height:28px;padding:12px 0;border:0;background:transparent;cursor:pointer}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-photo-segment::after {content:"";display:block;height:4px;border-radius:4px;background:rgba(255,255,255,.4);transition:background .3s ease}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-photo-segment[aria-current="true"]::after {background:#fff}
.lumistry[data-lumistry-theme="modern"] .lumistry-photo-arrow {position:absolute;z-index:4;top:calc(50% - 22px);width:44px;height:44px;min-height:44px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.22);color:#fff;font-size:0;backdrop-filter:blur(10px);box-shadow:none}
.lumistry[data-lumistry-theme="modern"] .lumistry-photo-arrow:hover:not(:disabled) {background:rgba(255,255,255,.34);box-shadow:none}
.lumistry[data-lumistry-theme="modern"] .lumistry-photo-arrow .lumistry-ico {width:22px;height:22px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-photo-previous {left:12px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-photo-next {right:12px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-profile-body {display:grid;gap:16px;padding:20px 18px 22px;min-width:0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-profile-body p {margin:0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-caption {font-size:13px;color:var(--md-muted);line-height:1.5;overflow-wrap:anywhere}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-photo-description {padding:12px 14px;border-radius:18px;background:var(--md-soft);color:var(--md-ink);font-size:13.5px;line-height:1.5;overflow-wrap:anywhere}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-profile-answer {display:grid;gap:6px;padding:16px;border-radius:22px;background:var(--md-soft)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-profile-answer h3 {margin:0;color:var(--md-muted);font-size:13px;font-weight:700}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-profile-answer p {font-size:17px;font-weight:700;line-height:1.4;letter-spacing:-.01em}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-profile-tools > .lumistry-actions {padding:4px 0 12px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-detail-status {display:inline-block;justify-self:start;margin:0;padding:5px 14px;border-radius:999px;background:rgba(0,184,148,.14);color:#007a63;font-size:13px;font-weight:700}
/* Chemistry bar */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-meter {display:grid;grid-template-columns:auto 1fr;grid-template-areas:"label tube" "count count";align-items:center;gap:6px 12px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-meter-label {grid-area:label;font-size:14px;font-weight:800;color:var(--md-ink)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-meter-tube {grid-area:tube;position:relative;height:10px;border-radius:10px;background:#e9e4f3;overflow:hidden}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-meter-fill {position:absolute;left:0;top:0;bottom:0;border-radius:10px;background:var(--md-grad);transition:width .6s cubic-bezier(.2,.8,.2,1)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-meter-count {grid-area:count;font-size:12px;color:var(--md-muted)}
/* ---------- connections ---------- */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-section-heading {min-width:0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-section-heading h1 {display:flex;align-items:center;gap:8px;font-size:30px;font-weight:800;letter-spacing:-.035em;line-height:1.1;margin:0 0 6px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-section-heading p {margin:0;color:var(--md-muted)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-section {min-width:0;display:grid;gap:14px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-section > h2 {margin:0;font-size:16px;font-weight:800;color:#5e5c70}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card {appearance:none;display:block;min-width:0;padding:0;border:0;border-radius:26px;background:#fff;color:inherit;text-align:left;cursor:pointer;overflow:hidden;box-shadow:var(--md-shadow);transition:transform .2s ease,box-shadow .2s ease;animation:lumistry-modern-fade-up .18s ease both}
@media (hover:hover) {
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card:hover {transform:translateY(-3px);box-shadow:0 18px 38px rgba(40,20,80,.18)}}
@keyframes lumistry-modern-fade-up {from{opacity:0}to{opacity:1}}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card .lumistry-portrait {aspect-ratio:3/4;min-height:170px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card .lumistry-portrait-identity {left:12px;bottom:12px;max-width:calc(100% - 60px)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card .lumistry-portrait-name {font-size:18px;margin-bottom:2px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card .lumistry-portrait-identity :is(p,small) {font-size:12px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card .lumistry-portrait-placeholder {padding:20px 8px 90px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card .lumistry-monogram {right:10px;bottom:12px;width:38px;height:38px;font-size:18px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card .lumistry-photo-label {display:none}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-status {position:absolute;z-index:3;top:10px;left:10px;width:fit-content;max-width:calc(100% - 20px);padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.92);color:var(--md-accent-text);font-size:12px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:var(--md-shadow-sm)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-connection-actions {padding-bottom:12px}
/* ---------- inbox ---------- */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-list {min-width:0;border-radius:28px;background:#fff;box-shadow:var(--md-shadow);overflow:hidden}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-row {appearance:none;display:flex;align-items:center;gap:14px;width:100%;min-width:0;min-height:84px;padding:14px 16px;border:0;border-bottom:1px solid #eeeaf5;background:transparent;color:var(--md-ink);text-align:left;font:inherit;cursor:pointer;transition:background .15s ease;animation:lumistry-modern-fade-up .18s ease both}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-row:last-child {border-bottom:0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-row:hover {background:#efebf7}
.lumistry[data-lumistry-theme="modern"] .lumistry-inbox-row .lp-avatar {position:relative;width:56px;height:56px;flex:0 0 56px;border-radius:50%;font-size:22px;font-weight:800;background:var(--md-grad);color:#fff}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-row .lp-avatar img {position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-copy {display:grid;gap:4px;min-width:0;flex:1}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-top {display:flex;align-items:baseline;gap:8px;min-width:0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-top strong {flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:700}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-top time {color:var(--md-muted);font-size:12px;white-space:nowrap}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-preview {color:var(--md-muted);font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.45}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-inbox-row.has-unread .lumistry-inbox-preview {color:var(--md-ink);font-weight:700}
.lumistry[data-lumistry-theme="modern"] .lp-unread {min-width:24px;height:24px;background:var(--md-accent-strong);color:#fff;font-size:12px;font-weight:700}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-chat-settings {margin-top:6px}
/* ---------- discovery controls ---------- */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-discovery-toolbar {display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-toolbar-actions {display:flex;align-items:center;gap:8px;flex:none}
.lumistry[data-lumistry-theme="modern"] .lumistry-toolbar-actions .lp-button {min-height:44px;padding:8px 14px;font-size:13px}
.lumistry[data-lumistry-theme="modern"] .lumistry-options {position:relative;padding:0 14px;border:0;border-radius:999px;background:#fff;box-shadow:var(--md-shadow-sm)}
.lumistry[data-lumistry-theme="modern"] .lumistry-options > summary {min-height:44px;font-size:13px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-options-menu {position:absolute;right:0;top:calc(100% + 10px);z-index:20;display:grid;gap:8px;width:220px;padding:12px;border-radius:22px;background:#fff;box-shadow:0 18px 44px rgba(30,20,60,.22)}
.lumistry[data-lumistry-theme="modern"] .lumistry-options-menu > .lp-button {justify-content:flex-start;margin:0;width:100%}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-pool-status {display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--md-muted)}
.lumistry[data-lumistry-theme="modern"] .lumistry-pool-status .lp-button {min-height:44px;padding:6px 16px;font-size:13px}
.lumistry[data-lumistry-theme="modern"] .lumistry-busy .lp-button {min-height:40px;padding:6px 12px;font-size:12px}
.lumistry[data-lumistry-theme="modern"] .lumistry-busy > p {flex:1 1 150px;margin:0;font-size:13px}
:where(.lumistry[data-lumistry-theme="modern"]) :is(.lumistry-match-card,.lumistry-inbox-row,.lumistry-photo-segment):focus-visible {outline:3px solid var(--md-violet);outline-offset:3px}
@container (min-width:520px) {
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-grid {grid-template-columns:repeat(3,minmax(0,1fr))}}
@container (max-width:340px) {
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-discovery-toolbar {align-items:flex-start;flex-wrap:wrap}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-grid {gap:10px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-match-card .lumistry-portrait-name {font-size:16px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-profile-body {padding:16px 14px 18px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-tabs {margin:8px 10px 4px}}
/* ---------- tags ---------- */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-tags {display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-tag {display:inline-block;padding:7px 14px;border-radius:999px;background:var(--md-soft);color:var(--md-ink);font-size:13px;font-weight:600;line-height:1.35;overflow-wrap:anywhere;max-width:100%}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-tag strong {font-weight:700;color:var(--md-muted)}
/* ---------- forms ---------- */
.lumistry[data-lumistry-theme="modern"] .lp-label {display:grid;gap:6px;font-size:14px;font-weight:700;color:var(--md-ink)}
.lumistry[data-lumistry-theme="modern"] :is(.lp-input,.lp-select,.lp-textarea) {min-height:var(--lumistry-touch);padding:11px 16px;border:1.5px solid var(--md-edge);border-radius:18px;background:#fff;color:var(--md-ink);font-size:max(15px,var(--pocket-font-md,14px))}
.lumistry[data-lumistry-theme="modern"] .lp-textarea {min-height:100px;max-height:none;resize:vertical;line-height:1.5}
.lumistry[data-lumistry-theme="modern"] :is(.lp-input,.lp-select,.lp-textarea):focus {border-color:var(--md-accent-strong);box-shadow:0 0 0 4px rgba(255,77,109,.2)}
.lumistry[data-lumistry-theme="modern"] label.lp-row {display:flex;flex-wrap:nowrap;align-items:center;gap:12px;min-height:44px;cursor:pointer}
.lumistry[data-lumistry-theme="modern"] input[type="checkbox"] {appearance:none;-webkit-appearance:none;display:inline-grid;place-content:center;width:26px;height:26px;margin:0;flex:none;border:1.5px solid var(--md-edge);border-radius:9px;background:#fff;cursor:pointer;transition:background .15s ease}
.lumistry[data-lumistry-theme="modern"] input[type="checkbox"]:checked {background:var(--md-grad);border-color:transparent}
.lumistry[data-lumistry-theme="modern"] input[type="checkbox"]:checked::after {content:"";width:7px;height:12px;border:solid #fff;border-width:0 3px 3px 0;transform:rotate(45deg) translate(-1px,-1px)}
.lumistry[data-lumistry-theme="modern"] input[type="range"] {accent-color:var(--md-accent-strong)}
/* collapsible sections */
.lumistry[data-lumistry-theme="modern"] details {border-radius:20px;padding:0 16px;background:var(--md-soft)}
.lumistry[data-lumistry-theme="modern"] details details {background:#fff}
.lumistry[data-lumistry-theme="modern"] summary {display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:var(--lumistry-touch);cursor:pointer;list-style:none;color:var(--md-ink);font-size:14px;font-weight:700;overflow-wrap:anywhere}
.lumistry[data-lumistry-theme="modern"] summary::-webkit-details-marker {display:none}
.lumistry[data-lumistry-theme="modern"] summary::after {content:"";flex:none;width:9px;height:9px;margin-right:4px;border-right:2.5px solid currentColor;border-bottom:2.5px solid currentColor;transform:rotate(45deg);transition:transform .2s}
.lumistry[data-lumistry-theme="modern"] details[open] > summary::after {transform:rotate(-135deg)}
.lumistry[data-lumistry-theme="modern"] details[open] > summary {border-bottom:1px solid var(--md-line);margin-bottom:10px}
.lumistry[data-lumistry-theme="modern"] details > .lp-label,.lumistry[data-lumistry-theme="modern"] details > .lp-stack {margin:10px 0}
.lumistry[data-lumistry-theme="modern"] details > .lp-button {margin:0 0 14px;width:100%}
/* multi-choice lists read as tappable chips */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-choice-list {display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;max-height:260px;overflow:auto;padding:4px 2px 10px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-choice-list label {display:flex;align-items:center;gap:10px;min-width:0;min-height:46px;padding:8px 14px;border:1.5px solid var(--md-edge);border-radius:999px;background:#fff;cursor:pointer;font-size:14px;color:var(--md-ink);transition:background .15s ease,border-color .15s ease}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-choice-list label:has(input:checked) {border-color:var(--md-accent-strong);background:rgba(255,77,109,.1);font-weight:800}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-choice-list label .lp-copy {color:inherit;font-size:14px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-choice summary {overflow-wrap:anywhere}
/* ---------- age range ---------- */
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-range-label {font-size:15px;font-weight:800;color:var(--md-ink)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-age-range {position:relative;height:48px;margin:0 14px;background:linear-gradient(to right,#e4dff0 var(--range-start),#e0264f var(--range-start),#b8349f var(--range-end),#e4dff0 var(--range-end)) center/100% 8px no-repeat;border-radius:8px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-age-range input {position:absolute;inset:0;width:100%;margin:0;pointer-events:none;appearance:none;background:transparent;accent-color:var(--md-accent-strong)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-age-range input::-webkit-slider-thumb {pointer-events:auto;appearance:none;width:30px;height:30px;border-radius:50%;background:#fff;border:3px solid var(--md-accent-strong);box-shadow:0 4px 12px rgba(30,20,60,.25);cursor:grab}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-age-range input::-moz-range-thumb {pointer-events:auto;width:24px;height:24px;border-radius:50%;background:#fff;border:3px solid var(--md-accent-strong);box-shadow:0 4px 12px rgba(30,20,60,.25);cursor:grab}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-age-range input:focus-visible {outline:none}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-age-range input:focus-visible::-webkit-slider-thumb {box-shadow:0 0 0 3px #fff,0 0 0 6px var(--md-violet)}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-age-range input:focus-visible::-moz-range-thumb {box-shadow:0 0 0 3px #fff,0 0 0 6px var(--md-violet)}
/* ---------- states ---------- */
.lumistry[data-lumistry-theme="modern"] .lumistry-empty {display:grid;gap:12px;justify-items:center;text-align:center;padding:30px 16px;box-shadow:none;background:rgba(255,255,255,.7);border:1.5px dashed #cfc9e0}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-empty .lumistry-ico {width:48px;height:48px;color:var(--md-accent-strong);stroke-width:1.5}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-empty > .lumistry-doodle {width:76px;height:76px}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-empty .lp-copy {color:var(--md-ink);font-size:14px}
.lumistry[data-lumistry-theme="modern"] .lumistry-busy {display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(255,77,109,.08),rgba(124,92,255,.1))}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-busy > .lumistry-ico,:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-busy > .lumistry-doodle {color:var(--md-violet);animation:lumistry-modern-bob 1.6s ease-in-out infinite}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-busy > .lumistry-doodle {width:42px;height:42px}
.lumistry[data-lumistry-theme="modern"] .lumistry-error {display:flex;align-items:flex-start;gap:10px;background:#fff0f2;color:var(--md-ink);overflow-wrap:anywhere;box-shadow:0 0 0 1.5px #f6c4cc}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-error > .lumistry-ico {color:var(--md-alert);margin-top:2px}
@keyframes lumistry-modern-bob {0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-3px) rotate(4deg)}}

/* ---------- responsive / accessibility ---------- */
@container (max-width:380px) {
.lumistry[data-lumistry-theme="modern"] .lp-content {padding:12px}
.lumistry[data-lumistry-theme="modern"] .lumistry-tabs .lp-button {font-size:12px}}
@media (prefers-reduced-motion:reduce) {
.lumistry[data-lumistry-theme="modern"] *,.lumistry[data-lumistry-theme="modern"] *::before,.lumistry[data-lumistry-theme="modern"] *::after {animation:none!important;transition:none!important}}
@media (forced-colors:active) {
.lumistry[data-lumistry-theme="modern"] .lumistry-tabs [aria-current="page"] {outline:3px solid Highlight}
:where(.lumistry[data-lumistry-theme="modern"]) .lumistry-choice-list label:has(input:checked) {outline:3px solid Highlight}
.lumistry[data-lumistry-theme="modern"] .lp-button,.lumistry[data-lumistry-theme="modern"] .lp-card {border:1.5px solid CanvasText}}

/* ---------- clarity pass (Modern only) ----------
   These rules sit above the shared polish layer (which loads last), so they use the
   full theme selector to win without !important. */
/* header: "Back" stays on one line; decorative badge no longer looks like a notification */
.lumistry[data-lumistry-theme="modern"] .lumistry-brand {width:36px;height:36px;font-size:19px}
/* Discover: three views read as one segmented control instead of three loose buttons */
.lumistry[data-lumistry-theme="modern"] .lp-content > .lumistry-actions:has(> .lp-button[aria-pressed]) {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:4px;border-radius:999px;background:var(--md-soft);box-shadow:inset 0 0 0 1px var(--md-line)}
.lumistry[data-lumistry-theme="modern"] .lp-content > .lumistry-actions:has(> .lp-button[aria-pressed]) .lp-button {flex:none;min-height:40px;padding:6px 8px;border:0;border-radius:999px;background:transparent;box-shadow:none;color:var(--md-muted);font-size:13px;font-weight:700;transform:none}
.lumistry[data-lumistry-theme="modern"] .lp-content > .lumistry-actions:has(> .lp-button[aria-pressed]) .lp-button[aria-pressed="true"] {background:#fff;color:var(--md-accent-text);font-weight:800;box-shadow:var(--md-shadow-sm)}
/* quieter disclosure rows so the profile card is the main thing on the page */
.lumistry[data-lumistry-theme="modern"] .lp-content > details {background:rgba(255,255,255,.72);box-shadow:inset 0 0 0 1px var(--md-line)}
.lumistry[data-lumistry-theme="modern"] .lp-content > details > summary {font-size:14px;color:var(--md-muted)}
.lumistry[data-lumistry-theme="modern"] .lumistry-pool-status {gap:12px}
.lumistry[data-lumistry-theme="modern"] .lumistry-pool-status .lumistry-finding {color:var(--md-muted);font-size:13px}
/* like / pass / super like: one clear primary action, two quiet ones */
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe {position:sticky;bottom:.5rem;z-index:8;display:grid;grid-template-columns:1fr 1.5fr 1fr;gap:10px;margin:.5rem 0 0;padding:8px;border:0;border-radius:30px;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);box-shadow:0 14px 36px rgba(30,20,60,.2)}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe .lp-button {flex:none;flex-direction:column;gap:2px;min-height:60px;padding:8px 4px;border:1.5px solid transparent;border-radius:24px;font-size:13px;font-weight:700;box-shadow:none}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe .lp-button .lumistry-ico {width:1.5em;height:1.5em}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe .lp-button .lumistry-doodle {width:28px;height:28px}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe [data-decision="pass"] {background:#fff;border-color:var(--md-line);color:var(--md-muted)}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe [data-decision="like"] {min-height:68px;background:var(--md-grad);border-color:transparent;color:#fff;box-shadow:0 8px 20px rgba(224,38,79,.32);font-size:14px;font-weight:800}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe [data-decision="like"] .lumistry-doodle {--d-r:#fff;--d-line:transparent}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe [data-decision="super"] {background:#efeaff;border-color:transparent;color:#5231d1}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe [data-decision="super"] .lumistry-doodle {--d-y:var(--md-violet);--d-line:transparent}
@media (hover:hover) {
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe [data-decision="pass"]:hover:not(:disabled) {background:var(--md-soft);box-shadow:none}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe [data-decision="super"]:hover:not(:disabled) {background:#e6deff;box-shadow:none}}
/* photo: name sits on the fade, not in a second dark box */
.lumistry[data-lumistry-theme="modern"] .lumistry-portrait .lumistry-portrait-identity {padding:0;border-radius:0;background:none;text-shadow:0 1px 10px rgba(12,10,24,.55)}
.lumistry[data-lumistry-theme="modern"] .lumistry-photo-pagination {left:16px;right:16px;max-width:none}
.lumistry[data-lumistry-theme="modern"] .lumistry-new-ribbon {left:14px;top:46px;padding:5px 11px;border:0;border-radius:999px;background:rgba(255,255,255,.92);color:var(--md-accent-text);font-size:12px;font-weight:800;box-shadow:var(--md-shadow-sm)}
.lumistry[data-lumistry-theme="modern"] .lumistry-photo-camera {top:46px;right:14px;width:44px;min-width:44px;height:44px;padding:0!important;border-radius:50%;background:rgba(255,255,255,.92);border:0;box-shadow:var(--md-shadow-sm)}
.lumistry[data-lumistry-theme="modern"] .lumistry-photo-camera .lumistry-doodle {width:28px;height:28px}
/* shared-interest chips are the one coloured tag: green = you have this in common */
.lumistry[data-lumistry-theme="modern"] .lumistry-shared-hints {margin-bottom:0}
.lumistry[data-lumistry-theme="modern"] .lumistry-shared-hints .lumistry-tag {background:rgba(0,184,148,.14);color:#00624f;font-weight:700}
/* connection tiles: name and status only; distance moves to the full profile */
.lumistry[data-lumistry-theme="modern"] .lumistry-match-card .lumistry-portrait-distance {display:none}
.lumistry[data-lumistry-theme="modern"] .lumistry-match-card .lumistry-monogram {right:auto;left:50%;top:36%;bottom:auto;width:56px;height:56px;font-size:26px;transform:translate(-50%,-50%)}
.lumistry[data-lumistry-theme="modern"] .lumistry-match-card .lumistry-bubbles i {animation:none;filter:blur(30px)}
/* new-match banner */
.lumistry[data-lumistry-theme="modern"] .lumistry-match-notice {padding:16px;border:0;border-radius:var(--lumistry-radius);background:linear-gradient(135deg,rgba(255,77,109,.14),rgba(124,92,255,.16));box-shadow:var(--md-shadow-sm);gap:10px}
.lumistry[data-lumistry-theme="modern"] .lumistry-match-notice > strong {flex:1 1 100%;font-size:18px;font-weight:800;letter-spacing:-.02em}
.lumistry[data-lumistry-theme="modern"] .lumistry-match-notice .lp-button {flex:1 1 auto;border-color:transparent;background:var(--md-grad);color:#fff;box-shadow:0 8px 18px rgba(224,38,79,.28)}
.lumistry[data-lumistry-theme="modern"] .lumistry-match-notice .lp-button:last-of-type {flex:0 0 auto;border-color:var(--md-line);background:#fff;color:var(--md-muted);box-shadow:none}
/* filter chips: compact and removable */
.lumistry[data-lumistry-theme="modern"] .lumistry-filter-chip {min-height:40px;padding:6px 14px;border:0;font-size:13px;box-shadow:inset 0 0 0 1.5px var(--md-line)}
/* settings destinations: left-aligned tiles with a forward arrow */
.lumistry[data-lumistry-theme="modern"] .lumistry-settings-destination.lp-button {position:relative;align-items:flex-start;justify-content:center;text-align:left;gap:4px;min-height:72px;padding:16px 48px 16px 20px;border-radius:24px}
.lumistry[data-lumistry-theme="modern"] .lumistry-settings-destination.lp-button::after {content:"";position:absolute;right:20px;top:50%;width:9px;height:9px;margin-top:-5px;border-right:2.5px solid var(--md-muted);border-top:2.5px solid var(--md-muted);transform:rotate(45deg)}
.lumistry[data-lumistry-theme="modern"] .lumistry-settings-destination strong {font-size:16px;font-weight:800;color:var(--md-ink)}
.lumistry[data-lumistry-theme="modern"] .lumistry-settings-destination .lp-copy {font-size:13px;font-weight:500;color:var(--md-muted)}
/* save bar: status on its own line, two equal buttons */
.lumistry[data-lumistry-theme="modern"] .lumistry-save-bar {gap:10px;padding:12px;border:0;border-radius:24px;background:rgba(255,255,255,.94);backdrop-filter:blur(16px);box-shadow:0 14px 36px rgba(30,20,60,.2)}
.lumistry[data-lumistry-theme="modern"] .lumistry-save-bar > span {flex:1 1 100%;font-size:14px;font-weight:700;color:var(--md-ink)}
.lumistry[data-lumistry-theme="modern"] .lumistry-save-bar button {flex:1 1 0;min-width:0}
/* confirmation sheet */
.lumistry[data-lumistry-theme="modern"] .lumistry-confirm-sheet {border:0;border-radius:var(--lumistry-radius);box-shadow:0 -6px 40px rgba(30,20,60,.28)}
.lumistry[data-lumistry-theme="modern"] .lumistry-confirm-sheet > strong {font-size:18px;font-weight:800}
.lumistry[data-lumistry-theme="modern"] .lumistry-confirm-sheet > p {margin:0;color:var(--md-muted);font-size:14px;line-height:1.5}
.lumistry[data-lumistry-theme="modern"] .lumistry-match-status {max-width:calc(100% - 20px);white-space:normal;line-height:1.2;border-radius:14px}
@container (max-width:340px) {
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe {grid-template-columns:1fr 1.3fr 1fr;gap:6px}
.lumistry[data-lumistry-theme="modern"] .lumistry-swipe .lp-button {font-size:12px;padding:8px 2px}}
/* empty states: one illustration, no extra glyph row */
.lumistry[data-lumistry-theme="modern"] .lumistry-empty-scene {display:none}
/* Match current interaction controls while keeping the supplied Modern palette. */
.lumistry[data-lumistry-theme="modern"] .lumistry-photo-camera{transform:none;border-radius:50%;background:var(--md-card);box-shadow:var(--md-shadow-sm);border:1px solid var(--md-line)}
.lumiphone-shell[data-reduced-motion="true"] .lumistry[data-lumistry-theme="modern"] *,
.lumiphone-shell[data-reduced-motion="true"] .lumistry[data-lumistry-theme="modern"] *::before,
.lumiphone-shell[data-reduced-motion="true"] .lumistry[data-lumistry-theme="modern"] *::after{animation:none!important;transition:none!important}
`;
