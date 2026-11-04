/** Local implementation of the supplied showcase's individual card compositions. */
export const TRACKER_DESIGN_STYLES = `
.lumiphone-shell .lp-tracker-card[data-design] {
  --design-ink:#67e8f9; --design-rgb:34,211,238; --lp-text:#f8fafc; --lp-muted:#94a3b8;
  container:tracker-card / inline-size; position:relative; isolation:isolate; display:flex; flex-direction:column;
  gap:1.25em; min-width:0; padding:1.65em; border:1px solid rgba(var(--design-rgb),.35); border-radius:22px;
  background:linear-gradient(180deg,rgba(var(--design-rgb),.065),transparent),#060b13;
  color:var(--lp-text); box-shadow:0 12px 30px -8px #000a; font-size:calc(12px * var(--pocket-ui-scale,1)); overflow:hidden;
}
.lumiphone-shell .lp-tracker-card[data-design]::before { display:none; }
.lp-tracker-card[data-design] .lp-tracker-top { display:flex; align-items:start; justify-content:space-between; gap:1em; }
.lp-tracker-card[data-design] .lp-tracker-heading { display:grid; gap:.3em; min-width:0; }
.lp-tracker-card[data-design] .lp-title { margin:0; color:var(--lp-text); font:750 1.3em/1.3 system-ui,sans-serif; letter-spacing:-.015em; white-space:normal; overflow-wrap:anywhere; }
.lp-tracker-card[data-design] .lp-eyebrow { color:var(--design-ink); font:650 .75em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; letter-spacing:.1em; text-transform:uppercase; overflow-wrap:anywhere; }
.lp-tracker-card[data-design] .lp-tracker-update { flex:none; max-width:8em; color:var(--design-ink); font:600 .75em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; padding:.3em .65em; border:1px solid rgba(var(--design-rgb),.3); border-radius:5px; background:rgba(var(--design-rgb),.08); }
.lp-design-body { display:grid; grid-template-columns:minmax(0,1fr); gap:1em; min-width:0; }
.lp-design-body>* { min-width:0; }
.lp-design-vector { display:block; width:100%; height:auto; color:var(--design-ink); stroke-linecap:round; stroke-linejoin:round; }
.lp-template-mark .lp-design-vector { width:24px; height:24px; }
.lp-instrument-panel { display:grid; gap:1em; min-width:0; padding:1.25em; border:1px solid rgba(var(--design-rgb),.22); border-radius:14px; background:#000a; }
.lp-instrument-caption { display:block; color:var(--design-ink); font:600 .75em/1.45 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; letter-spacing:.07em; text-transform:uppercase; overflow-wrap:anywhere; }
.lp-instrument-meta { display:flex; align-items:baseline; justify-content:space-between; gap:.7em; min-width:0; color:var(--lp-muted); font:.75em/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; }
.lp-instrument-meta>span { min-width:0; overflow-wrap:anywhere; }.lp-instrument-meta>span:last-child { text-align:right; }
.lp-instrument-copy { margin:0; color:#cbd5e1; font:.92em/1.5 system-ui,sans-serif; white-space:pre-wrap; overflow-wrap:anywhere; }
.lp-tracker-card[data-design] .lp-tracker-reading { display:flex; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:.5em; min-width:0; }
.lp-tracker-card[data-design] .lp-tracker-readout { color:var(--design-ink); font:800 2.65em/1.15 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; letter-spacing:-.04em; font-variant-numeric:tabular-nums; min-width:0; overflow-wrap:anywhere; }
.lp-tracker-card[data-design] .lp-tracker-stage { padding:.3em .65em; color:var(--design-ink); background:rgba(var(--design-rgb),.1); border:1px solid rgba(var(--design-rgb),.25); border-radius:6px; font:600 .86em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; overflow-wrap:anywhere; }
.lp-tracker-card[data-design] .lp-tracker-rail { width:100%; height:.7em; border:1px solid #ffffff10; padding:2px; border-radius:99px; background:#0008; overflow:hidden; }
.lp-tracker-card[data-design] .lp-tracker-rail-fill { display:block; height:100%; width:var(--tracker-percent); border-radius:inherit; background:var(--design-ink); }
.lp-tracker-card[data-design] .lp-design-sr-value { position:absolute; width:1px; height:1px; padding:0; margin:-1px; border:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
.lp-tracker-card[data-design] .lp-tracker-last-change { margin:0; padding-top:1em; border-top:1px solid rgba(var(--design-rgb),.2); color:var(--lp-muted); font:.78em/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; overflow-wrap:anywhere; }
.lp-tracker-card[data-design] .lp-tracker-bank-sync { color:var(--lp-muted); font-size:.8em; }

.lumiphone-shell .lp-tracker-card[data-design="plain"] { background:var(--lp-surface); border-color:var(--lp-border); }.lp-tracker-card[data-design="plain"] .lp-design-field { color:var(--lp-text); font:1em/1.6 system-ui,sans-serif; }
.lp-tracker-header-icon { flex:none; display:grid; place-items:center; width:24px; height:28px; color:var(--tracker-color,var(--lp-accent)); }.lp-tracker-header-icon svg { width:22px; height:22px; }.lp-tracker-top>.lp-tracker-heading { flex:1; }
/* Clinical biomonitor: inset Lead-II screen, main reading, twelve phosphor bands. */
.lumiphone-shell .lp-tracker-card[data-design="health"] { --design-ink:#34d399; --design-rgb:16,185,129; background:radial-gradient(ellipse at 15% 15%,#10372780,transparent),#080e0b; border-radius:18px; }
.lp-biomonitor { position:relative; height:7.5em; padding:.65em; align-content:space-between; background:linear-gradient(#10b9810b 1px,transparent 1px),linear-gradient(90deg,#10b9810b 1px,transparent 1px),#0009; background-size:14px 14px; overflow:hidden; }
.lp-biomonitor .lp-instrument-meta { position:relative; z-index:1; color:#6ee7b7; font-size:.7em; }
.lp-biomonitor .lp-ekg-wave { position:absolute; inset:0; width:100%; height:100%; filter:drop-shadow(0 0 3px #10b98150); }
.lp-ekg-wave path { stroke-dasharray:400; animation:lp-ecg-sweep 2.4s linear infinite; }
.lp-tracker-card[data-design="health"] .lp-tracker-readout { color:#fff; }
.lp-tracker-card[data-design] .lp-biomonitor-segments { display:flex; gap:4px; border:0; padding:0; background:none; height:.85em; border-radius:0; }
.lp-biomonitor-segments>span { flex:1; min-width:0; border:1px solid #10b98130; border-radius:2px; background:#064e3b66; }.lp-biomonitor-segments>[data-filled="true"] { background:#34d399; box-shadow:0 0 8px #10b98140; }
@keyframes lp-ecg-sweep { from { stroke-dashoffset:400; } to { stroke-dashoffset:0; } }

/* Cast-iron hearth: segmented provision plate with the original ember core. */
.lumiphone-shell .lp-tracker-card[data-design="hunger"] { --design-ink:#fdba74; --design-rgb:234,88,12; background:linear-gradient(#1c100c,#0d0705); border-radius:22px; }
.lp-hearth-panel { display:grid; grid-template-columns:8em minmax(0,1fr); align-items:center; gap:1.2em; padding:1.2em; }
.lp-hearth-dial { width:8em; height:8em; flex:none; }.lp-hearth-dial svg { width:100%; height:100%; filter:drop-shadow(0 0 6px #ea580c30); }
.lp-hearth-copy { display:grid; gap:.6em; min-width:0; }.lp-hearth-copy .lp-instrument-caption { color:#a3a3a3; }
.lp-tracker-card[data-design="hunger"] .lp-tracker-readout { font-size:2em; }.lp-tracker-card[data-design="hunger"] .lp-tracker-stage { border:0; padding:0; background:none; }
.lp-hearth-copy .lp-instrument-copy { font-size:.85em; }

/* Editorial trust dossier: two portraits joined by the illuminated bond bridge. */
.lumiphone-shell .lp-tracker-card[data-design="relationship"] { --design-ink:#fda4af; --design-rgb:244,63,94; background:linear-gradient(135deg,#f43f5e1f,#8b5cf614 60%,#120c16); border-radius:26px; }
.lp-tracker-card[data-design="relationship"] .lp-title { font-family:Georgia,serif; font-size:1.6em; letter-spacing:.01em; }
.lp-tracker-card[data-design="relationship"] .lp-tracker-update { border-radius:99px; font-family:Georgia,serif; font-style:italic; }
.lp-dossier-pair { display:grid; grid-template-columns:minmax(0,1fr) minmax(4.8em,1.6fr) minmax(0,1fr); align-items:center; gap:.7em; }
.lp-dossier-person { display:grid; justify-items:center; align-content:start; gap:.45em; min-width:0; }
.lp-dossier-avatar { display:grid; place-items:center; width:4em; height:4em; padding:2px; border:2px solid #f43f5e88; border-radius:50%; color:#fff; background:linear-gradient(45deg,#523b73,#26232d); box-shadow:0 3px 12px #0008; font-weight:750; overflow:hidden; }
.lp-dossier-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
.lp-dossier-person .lp-tracker-person-name { color:#d4d4d8; font:.8em/1.4 system-ui,sans-serif; text-align:center; white-space:normal; overflow-wrap:anywhere; }
.lp-bond-bridge { display:grid; justify-items:center; align-content:center; position:relative; gap:.55em; min-width:0; padding-top:1.5em; }
.lp-bond-filament { width:100%; height:4px; border-radius:99px; background:linear-gradient(90deg,#f43f5e,#c084fc,#f43f5e); box-shadow:0 0 9px #f43f5e55; }
.lp-bond-link { position:absolute; top:-.5em; display:flex; align-items:center; gap:.35em; padding:.25em .6em; border:1px solid #f43f5e50; border-radius:99px; background:#17141c; color:#fda4af; font:.72em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; white-space:nowrap; }
.lp-bond-link svg { width:1.2em; height:1.2em; }.lp-bond-bridge small { font:italic .75em/1.4 Georgia,serif; text-align:center; color:#fda4afbb; }
.lp-tracker-card[data-design="relationship"] .lp-tracker-readout { color:#fff; font:750 2.7em/1.15 Georgia,serif; }.lp-tracker-card[data-design="relationship"] .lp-tracker-stage { font-family:Georgia,serif; }
.lp-tracker-card[data-design="relationship"] .lp-tracker-rail-fill { background:linear-gradient(90deg,#f43f5e,#a855f7,#f472b6); }
.lp-bond-ranges { display:flex; flex-wrap:wrap; gap:.4em .8em; padding-top:.7em; border-top:1px solid #f43f5e25; color:#a1a1aa; font:.7em/1.5 Georgia,serif; }

/* Milestone routes use connected numbered/checkmarked nodes, not orbital clip art. */
.lumiphone-shell .lp-tracker-card[data-design="orbit"] { --design-ink:#f0abfc; --design-rgb:217,70,239; background:linear-gradient(145deg,#150d1a,#09060c); }
.lp-phase-list { list-style:none; margin:0; padding:0; min-width:0; }
.lp-phase-list li { min-width:0; overflow-wrap:anywhere; }
.lp-phase-orbit,.lp-phase-waypoint { display:flex; gap:0; overflow-x:auto; padding:.25em 0 .7em; scrollbar-width:thin; }
.lp-phase-orbit>li,.lp-phase-waypoint>li { flex:1 0 calc(100% / var(--phase-count)); min-width:4.1em; display:flex; flex-direction:column; align-items:center; position:relative; gap:.65em; color:#737380; text-align:center; font:.75em/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; }
.lp-phase-orbit>li::before,.lp-phase-waypoint>li::before { content:''; position:absolute; top:1.3em; left:50%; width:100%; height:2px; background:#26262f; }
.lp-phase-orbit>li:last-child::before,.lp-phase-waypoint>li:last-child::before { display:none; }
.lp-phase-orbit>[data-phase="past"]::before,.lp-phase-waypoint>[data-phase="past"]::before { background:var(--design-ink); }
.lp-phase-marker { display:grid; place-items:center; width:2.7em; height:2.7em; border:1px solid #52525b; border-radius:50%; background:#16161e; position:relative; z-index:1; color:#a1a1aa; }
.lp-phase-marker:empty::before { content:attr(data-index); font-weight:750; }.lp-phase-marker svg { width:1.5em; height:1.5em; color:inherit; }
.lp-phase-list [data-phase="past"] .lp-phase-marker { background:rgba(var(--design-rgb),.55); border-color:var(--design-ink); color:white; }
.lp-phase-list [aria-current="step"] { color:var(--design-ink); }
.lp-phase-list [aria-current="step"] .lp-phase-marker { color:#fff; background:rgba(var(--design-rgb),.9); border-color:var(--design-ink); box-shadow:0 0 12px rgba(var(--design-rgb),.5); }
.lp-phase-label { display:block; position:relative; z-index:1; padding-inline:.2em; max-width:100%; }
.lp-phase-summary { display:flex; align-items:center; justify-content:space-between; gap:1em; padding:.9em; border:1px solid rgba(var(--design-rgb),.25); background:rgba(var(--design-rgb),.08); border-radius:11px; }
.lp-phase-summary>div { min-width:0; }.lp-phase-summary-value { display:block; color:#fff; font:700 1.1em/1.4 Georgia,serif; overflow-wrap:anywhere; }
.lp-phase-count { flex:none; color:var(--design-ink); font:.8em/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; }

/* DEFCON seismograph: grid, threshold, irregular trace, four threat bands. */
.lumiphone-shell .lp-tracker-card[data-design="tension"] { --design-ink:#f87171; --design-rgb:239,68,68; background:repeating-linear-gradient(-45deg,#ef44442f 0 8px,transparent 8px 16px) top/100% 7px no-repeat,linear-gradient(145deg,#180d0d,#0d0606); border-radius:18px; }
.lp-seismograph { position:relative; overflow:hidden; padding:1em; background:linear-gradient(#ef44440a 1px,transparent 1px),linear-gradient(90deg,#ef44440a 1px,transparent 1px),#000c; background-size:12px 12px; }
.lp-seismograph::after { content:''; position:absolute; top:48%; left:0; right:0; border-top:1px dashed #ef44444d; pointer-events:none; }
.lp-seismograph .lp-instrument-meta { color:#f87171bb; font-size:.7em; }.lp-threat-trace { height:4em; transform:scaleY(var(--threat-amplitude)); color:#ef4444; }
.lp-threat-tiers { display:flex; gap:.5em; height:.85em; }.lp-threat-tiers>span { flex:1; border-radius:2px; background:#ffffff0a; }.lp-threat-tiers>[data-filled="true"]:nth-child(1) { background:#10b981; }.lp-threat-tiers>[data-filled="true"]:nth-child(2) { background:#f59e0b; }.lp-threat-tiers>[data-filled="true"]:nth-child(3) { background:#f97316; }.lp-threat-tiers>[data-filled="true"]:nth-child(4) { background:#dc2626; box-shadow:0 0 8px #ef444455; }

/* Fractured lucidity: full-width chromatic paths inside recessed purple glass. */
.lumiphone-shell .lp-tracker-card[data-design="sanity"] { --design-ink:#d8b4fe; --design-rgb:168,85,247; border-width:2px; background:linear-gradient(135deg,#180a24,#0e0617 70%,#000); }
.lp-tracker-card[data-design="sanity"] .lp-title { font-family:Georgia,serif; font-size:1.5em; }
.lp-lucidity-glass { padding:1.4em; background:#000c; border-color:#a855f74d; position:relative; }
.lp-lucidity-metric { display:flex; align-items:baseline; gap:.6em; min-width:0; flex-wrap:wrap; }.lp-lucidity-glass .lp-instrument-caption { color:#c084fc; }
.lp-tracker-card[data-design="sanity"] .lp-tracker-readout { background:linear-gradient(90deg,#d8b4fe,#f472b6,#fb7185); color:transparent; background-clip:text; -webkit-background-clip:text; }
.lp-tracker-card[data-design="sanity"] .lp-tracker-stage { border:0; background:none; color:#f472b6; padding:0; font-size:.85em; }
.lp-lucidity-fracture { height:5.3em; width:100%; max-width:none; }
.lp-lucidity-stages { display:flex; flex-wrap:wrap; justify-content:space-between; gap:.4em; border-top:1px solid #581c8766; padding-top:.8em; font:.72em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; text-align:center; }
.lp-lucidity-stages>span { flex:1; padding:.35em; color:#71717a; min-width:3.5em; overflow-wrap:anywhere; border:1px solid transparent; }.lp-lucidity-stages>[data-active="true"] { border-color:#c084fc60; border-radius:4px; background:#a855f72b; color:#e9d5ff; font-weight:750; }

/* Heraldic faction duality: two crests, central stance, magnetic fulcrum beam. */
.lumiphone-shell .lp-tracker-card[data-design="alignment"] { --design-ink:#fcd34d; --design-rgb:99,102,241; border-width:2px; background:#090b12; }
.lp-faction-arena { padding:1.2em; background:#000e; border-color:#ffffff18; }
.lp-faction-poles { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr); gap:.6em; align-items:center; border-bottom:1px solid #ffffff18; padding-bottom:1em; }
.lp-faction-pole { display:flex; align-items:center; flex-wrap:wrap; gap:.5em; min-width:0; color:#f87171; }
.lp-faction-pole>div { min-width:0; flex:1; }.lp-faction-pole strong { display:block; font:700 .85em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; overflow-wrap:anywhere; }.lp-faction-pole small { display:block; color:#94a3b8; font:.68em/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; }
.lp-faction-high { color:#fcd34d; text-align:right; flex-direction:row-reverse; }.lp-faction-high strong { font-family:Georgia,serif; }
.lp-faction-crest { display:grid; place-items:center; width:2.7em; height:2.7em; border:1px solid currentColor; border-radius:7px; background:#7f1d1d30; color:inherit; flex:none; }.lp-faction-crest svg { width:1.6em; height:1.6em; color:inherit; }.lp-faction-high .lp-faction-crest { background:#78350f30; }
.lp-faction-lean { display:grid; justify-items:center; text-align:center; gap:.2em; min-width:0; }.lp-tracker-card[data-design="alignment"] .lp-faction-lean .lp-tracker-readout { font-size:1.8em; text-shadow:0 0 10px #eab30840; }.lp-faction-lean .lp-instrument-caption { font-size:.6em; color:#94a3b8; }.lp-tracker-card[data-design="alignment"] .lp-tracker-stage { border:0; background:none; font-size:.7em; padding:0; }
.lp-tracker-card[data-design] .lp-alignment-rail { position:relative; height:1.7em; border:1px solid #404047; padding:3px; background:#0a0a0c; }
.lp-tracker-card[data-design] .lp-alignment-rail::after { content:''; position:absolute; left:var(--alignment-origin); top:0; bottom:0; width:3px; background:#ffffff70; }
.lp-tracker-card[data-design] .lp-alignment-rail .lp-tracker-rail-fill { margin-left:var(--alignment-start); width:var(--alignment-span); background:linear-gradient(90deg,#f59e0b,#fde047); box-shadow:0 0 12px #eab30840; }
.lp-tracker-card[data-design] .lp-alignment-rail[data-lean="low"] .lp-tracker-rail-fill { background:linear-gradient(90deg,#ef4444,#fb7185); }

.lp-faction-scale-labels { display:flex; justify-content:space-between; gap:.7em; color:#94a3b8; font:.7em/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; }
/* Paramedic clipboard retains only the clinical values supplied by the user/story. */
.lumiphone-shell .lp-tracker-card[data-design="condition"] { --design-ink:#7dd3fc; --design-rgb:56,189,248; padding-top:2.1em; border:2px solid #334155; background:linear-gradient(#94a3b80a 1px,transparent 1px),linear-gradient(90deg,#94a3b80a 1px,transparent 1px),#14161d; background-size:16px 16px; }
.lp-clipboard-clamp { position:absolute; top:-.3em; left:36%; right:36%; height:1.7em; border:1px solid #64748b; border-radius:0 0 8px 8px; background:linear-gradient(#64748b,#334155); box-shadow:0 3px 6px #0007; }.lp-clipboard-clamp svg { width:1.5em; height:1.5em; margin:auto; color:#cbd5e1; }
.lp-condition-value { font:750 1.2em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; color:#7dd3fc; padding:.6em .75em; border:2px solid #7dd3fc65; border-radius:8px; background:#0c4a6e20; overflow-wrap:anywhere; }
.lp-clinical-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.7em; margin:0; }
.lp-clinical-grid>div { min-width:0; border:1px solid #ffffff12; border-radius:9px; padding:.8em; background:#0009; }.lp-clinical-grid dt { color:#94a3b8; font:.7em/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; text-transform:uppercase; }.lp-clinical-grid dd { margin:.4em 0 0; color:#cbd5e1; font:650 .92em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; overflow-wrap:anywhere; }
.lp-phase-condition,.lp-phase-world { display:flex; flex-wrap:wrap; gap:.5em; }.lp-phase-condition>li,.lp-phase-world>li { flex:1 1 4em; padding:.55em; border:1px solid #334155; border-radius:5px; color:#94a3b8; text-align:center; font:.75em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; }
.lp-phase-condition>[aria-current="step"] { border-color:#7dd3fc; background:#0c4a6e66; color:#bae6fd; }

/* Global satellite reconnaissance: radar sweep beside the posture readout. */
.lumiphone-shell .lp-tracker-card[data-design="world"] { --design-ink:#93c5fd; --design-rgb:59,130,246; background:radial-gradient(ellipse at 50% 15%,#0f1c30,#060912); }
.lp-world-recon { display:grid; grid-template-columns:6.7em minmax(0,1fr); align-items:center; gap:1.3em; padding:1em; }
.lp-recon-radar,.lp-timer-radar { position:relative; width:6.7em; height:6.7em; flex:none; border:1px solid #3b82f566; border-radius:50%; overflow:hidden; background:linear-gradient(transparent calc(50% - .5px),#3b82f533 calc(50% - .5px),#3b82f533 calc(50% + .5px),transparent calc(50% + .5px)),linear-gradient(90deg,transparent calc(50% - .5px),#3b82f533 calc(50% - .5px),#3b82f533 calc(50% + .5px),transparent calc(50% + .5px)),#17255455; }
.lp-radar-quadrant { position:absolute; inset:0; border-radius:50%; background:conic-gradient(from 0deg,transparent 270deg,rgba(var(--design-rgb),.4) 359deg,transparent); }
.lp-recon-blip { position:absolute; width:.6em; height:.6em; left:calc(50% - .3em); top:calc(50% - .3em); background:#22d3ee; border-radius:50%; box-shadow:0 0 10px #22d3ee; }
.lp-world-posture { display:grid; gap:.5em; min-width:0; }.lp-world-posture>strong { font:800 1.7em/1.2 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; color:#67e8f9; text-transform:uppercase; overflow-wrap:anywhere; }
.lp-phase-world>li:nth-child(4n+1) { color:#34d399; border-color:#10b98140; background:#064e3b40; }.lp-phase-world>li:nth-child(4n+2) { color:#22d3ee; border-color:#06b6d440; background:#164e6340; }.lp-phase-world>li:nth-child(4n+3) { color:#fbbf24; border-color:#f59e0b40; background:#78350f40; }.lp-phase-world>li:nth-child(4n+4) { color:#f87171; border-color:#ef444440; background:#7f1d1d40; }.lp-phase-world>[aria-current="step"] { border-color:currentColor; box-shadow:0 0 8px #06b6d440; font-weight:750; }

/* Architectural route, launch gates, indexed rotary selector and velvet ribbons. */
.lumiphone-shell .lp-tracker-card[data-design="waypoint"] { background:linear-gradient(#0a1424,#040810); border-width:2px; }
.lp-waypoint-map { padding:1.5em 1em; }.lp-phase-waypoint [data-phase="past"] .lp-phase-marker { color:#040810; background:#0891b2; }.lp-phase-waypoint [aria-current="step"] .lp-phase-marker { background:#22d3ee; color:#042f2e; }
.lp-waypoint-map+.lp-phase-summary .lp-phase-summary-value { font-family:system-ui,sans-serif; }
.lumiphone-shell .lp-tracker-card[data-design="gates"] { --design-ink:#d8b4fe; --design-rgb:168,85,247; background:linear-gradient(#140a20,#08040d); border-width:2px; }
.lp-phase-gates { display:flex; gap:.65em; overflow-x:auto; padding-bottom:.5em; scrollbar-width:thin; }
.lp-phase-gates>li { flex:1 0 calc((100% - (var(--phase-count) - 1) * .65em) / var(--phase-count)); min-width:4.8em; padding:1em .7em; color:#71717a; background:#000; border:2px solid #27272a; border-radius:10px; font:.9em/1.4 system-ui,sans-serif; }.lp-phase-gates>[data-phase="past"] { background:#18181b; border-color:#3f3f46; color:#a1a1aa; }.lp-phase-gates>[aria-current="step"] { background:#a855f726; border-color:#c084fc; color:#fff; box-shadow:0 0 12px #a855f72b; }
.lp-gate-heading { display:flex; align-items:center; justify-content:space-between; gap:.5em; margin-bottom:.65em; color:inherit; font:.65em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; text-transform:uppercase; }.lp-gate-led { width:.6em; height:.6em; border-radius:50%; background:#3f3f46; }.lp-phase-gates [aria-current="step"] .lp-gate-led { background:#d8b4fe; box-shadow:0 0 6px #c084fc; }
.lumiphone-shell .lp-tracker-card[data-design="rotary"] { --design-ink:#fbbf24; --design-rgb:245,158,11; background:#14120a; border-width:2px; }
.lp-rotary-selector { display:grid; grid-template-columns:5.3em minmax(0,1fr); gap:1.3em; align-items:center; padding:1.5em; }
.lp-rotary-index { display:grid; place-items:center; width:3.2em; height:3.2em; border:3px solid #f59e0b; border-radius:50%; color:#fbbf24; font:800 1.65em/1 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; background:#171717; box-shadow:0 0 15px #f59e0b30,inset 0 2px 8px #000; }
.lp-rotary-selected { min-width:0; display:grid; gap:.6em; }.lp-rotary-selected .lp-instrument-caption { color:#a3a3a3; font-size:.68em; }.lp-rotary-current { list-style:none; padding:0; margin:0; font:750 1.3em/1.3 system-ui,sans-serif; color:#fff; overflow-wrap:anywhere; }
.lumiphone-shell .lp-tracker-card[data-design="ribbons"] { --design-ink:#fda4af; --design-rgb:244,63,94; background:#181116; border-width:2px; }.lp-tracker-card[data-design="ribbons"] .lp-title { font-family:Georgia,serif; font-size:1.5em; }
.lp-phase-ribbons { display:flex; flex-wrap:wrap; gap:.8em; padding:.5em 0; }.lp-phase-ribbons>li { flex:0 1 auto; max-width:100%; padding:.75em 1.4em; color:#85808b; background:#17151a; border:1px solid #302730; border-radius:99px; font:1em/1.4 Georgia,serif; }.lp-phase-ribbons>[aria-current="step"] { background:linear-gradient(90deg,#f43f5e,#ec4899); border-color:#fb7185; color:white; box-shadow:0 4px 16px #f43f5e25; font-weight:750; }

/* Continuous-value instruments retain their own inset layout and scale geometry. */
.lumiphone-shell .lp-tracker-card[data-design="arc"] { background:linear-gradient(#0a1524,#040810); border-width:2px; }
.lp-value-panel-arc { padding:1.3em .8em; }.lp-arc-gauge { position:relative; max-width:24em; margin:auto; width:100%; }.lp-arc-gauge>svg { display:block; width:100%; height:auto; }.lp-tracker-card[data-design="arc"] .lp-arc-gauge>.lp-tracker-readout { position:absolute; bottom:9%; left:10%; right:10%; text-align:center; color:white; font-size:2.6em; }.lp-design-arc>.lp-tracker-stage { justify-self:center; }
.lumiphone-shell .lp-tracker-card[data-design="barcode"] { background:linear-gradient(#08121f,#04070d); border-width:2px; }
.lp-cyber-barcode { display:flex; gap:3px; height:3.4em; padding:.5em; border:1px solid #27272a; border-radius:6px; background:#050506; }.lp-cyber-barcode span { flex:1; min-width:0; background:#27272a; border-radius:1px; }.lp-cyber-barcode [data-filled="true"] { background:#22d3ee; box-shadow:0 0 6px #22d3ee60; }
.lumiphone-shell .lp-tracker-card[data-design="capsule"] { background:#0e111a; border:2px solid #ffffff25; }
.lp-capsule-reading { display:grid; grid-template-columns:3.4em minmax(0,1fr); align-items:center; gap:1em; }.lp-capsule-delta { display:grid; place-items:center; width:3.4em; height:3.4em; border-radius:10px; background:linear-gradient(45deg,#06b6d4,#2563eb); }.lp-capsule-delta svg { width:1.7em; height:1.7em; color:white; }
.lp-tracker-card[data-design="capsule"] .lp-tracker-rail { height:1.3em; background:#17171b; border-color:#3f3f46; }.lp-tracker-card[data-design="capsule"] .lp-tracker-rail-fill { background:linear-gradient(90deg,#22d3ee,#3b82f6,#6366f1); }
.lumiphone-shell .lp-tracker-card[data-design="caliper"] { --design-ink:#5eead4; --design-rgb:20,184,166; background:linear-gradient(#0a1816,#040c0b); border-width:2px; }
.lp-caliper-rule { display:flex; align-items:start; justify-content:space-between; position:relative; height:3.2em; padding:.4em; border:1px solid #52525b; border-radius:3px; background:#080f0d; }
.lp-caliper-rule span { width:1px; height:35%; background:#99f6e470; }.lp-caliper-rule span:nth-child(5n+1) { height:75%; }.lp-caliper-jaw { position:absolute; top:-4px; bottom:-4px; width:.8em; left:clamp(0px,var(--tracker-percent),calc(100% - .8em)); border:2px solid #5eead4; border-radius:2px; background:#2dd4bf55; box-shadow:0 0 10px #2dd4bf40; }

/* Inventory instruments: magazine well, brass register, LED screen, crates, tally rail. */
.lumiphone-shell .lp-tracker-card[data-design="ammo"] { --design-ink:#fbbf24; --design-rgb:161,98,7; border:2px solid #44403c; border-radius:16px; background:linear-gradient(135deg,#1c1917,#0c0a09); }
.lp-magazine-housing { border-color:#44403c; padding:1em; }.lp-ammo-visual { display:flex; gap:.5em; align-items:end; height:4.7em; padding:.65em; border:1px solid #292524; border-radius:7px; background:#171513; }
.lp-ammo-visual>span { position:relative; flex:1; min-width:0; height:3.4em; border-radius:4px 4px 2px 2px; border:1px dashed #78716c55; background:#292524; }.lp-ammo-visual>span[data-loaded="true"] { border:1px solid #a16207; background:linear-gradient(90deg,#eab308,#a16207 40%,#fcd34d 65%,#854d0e); box-shadow:inset 0 1px #fef08a80,0 2px 4px #0008; }.lp-ammo-visual>span[data-loaded="true"]::before { content:''; position:absolute; left:25%; right:25%; top:3px; height:3px; border-radius:50%; background:#fde68a; }.lp-ammo-visual>span::after { content:''; position:absolute; bottom:4px; left:10%; right:10%; border-bottom:2px solid #1c1917; }
.lumiphone-shell .lp-tracker-card[data-design="odometer"] { --design-ink:#fde0b6; --design-rgb:180,130,75; padding:2em 1.6em; border:4px solid #523924; border-radius:16px; background:linear-gradient(#241a12,#140e08,#050302); box-shadow:inset 0 4px 10px #0008,0 12px 24px #0009; }
.lp-tracker-card[data-design="odometer"]::after { content:''; position:absolute; inset:7px; border-radius:7px; pointer-events:none; background:radial-gradient(circle at 5px 5px,#d4a373 0 1px,#7c5636 2px 4px,transparent 5px),radial-gradient(circle at calc(100% - 5px) 5px,#d4a373 0 1px,#7c5636 2px 4px,transparent 5px),radial-gradient(circle at 5px calc(100% - 5px),#d4a373 0 1px,#7c5636 2px 4px,transparent 5px),radial-gradient(circle at calc(100% - 5px) calc(100% - 5px),#d4a373 0 1px,#7c5636 2px 4px,transparent 5px); }
.lp-register-housing { grid-template-columns:minmax(0,1.4fr) minmax(0,1fr); align-items:center; background:#000e; border:2px solid #78350f66; padding:1.1em; box-shadow:inset 0 2px 8px #000; }
.lp-odometer-drums { display:flex; gap:.3em; min-width:0; }.odometer-wheel { flex:1; min-width:0; display:grid; place-items:center; padding:.4em .05em; border:2px solid #523924; border-radius:5px; color:#fde0b6; font:800 2.3em/1.3 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; background:linear-gradient(#0a0806,#261c12 25%,#523924 48%,#7c5636 50%,#523924 52%,#261c12 75%,#0a0806); box-shadow:inset 0 6px 8px #000d,inset 0 -6px 8px #000d; }
.lp-tracker-card[data-design="odometer"] .lp-tracker-readout { font-size:1.6em; }.lp-tracker-card[data-design="odometer"] .lp-tracker-stage { background:none; border:0; padding:0; font-size:.7em; }
.lumiphone-shell .lp-tracker-card[data-design="led"] { --design-ink:#ef4444; --design-rgb:239,68,68; background:#000; border:2px solid #ef444480; }
.lp-led-screen { background:#090000; border:2px solid #450a0a; padding:1.7em; }.lp-led-digits { height:5em; width:100%; filter:drop-shadow(0 0 7px #ef444480); }.lp-design-led-unit { color:#fca5a5; font:.85em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; text-align:right; }
.lumiphone-shell .lp-tracker-card[data-design="crates"] { --design-ink:#fcd34d; --design-rgb:245,158,11; background:#14120e; border-width:2px; }
.lp-supply-crates { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.7em; }.lp-supply-crates>span { display:grid; place-items:center; min-height:4em; padding:.5em; border:1px solid #292524; border-radius:7px; color:#57534e; background:#0a0907; }.lp-supply-crates>span[data-filled="true"] { background:#f59e0b26; border-color:#fbbf24; color:#fcd34d; }.lp-supply-crates small { font:700 .75em/1.4 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; text-align:center; text-transform:uppercase; }
.lumiphone-shell .lp-tracker-card[data-design="tally"] { --design-ink:#fde047; --design-rgb:255,255,255; background:#121318; border:2px solid #ffffff30; }
.lp-tally-panel { background:#000b; border-color:#52525b; }.lp-tracker-card[data-design="tally"] .lp-tracker-readout { color:white; }
.lp-tracker-card[data-design] .lp-notched-tally { position:relative; height:1.4em; padding:4px; border:1px solid #52525b; border-radius:4px; background:repeating-linear-gradient(90deg,#ffffff12 0 1px,transparent 1px 10px),#18181b; }.lp-notched-tally .lp-tracker-rail-fill { background:#facc15; border-radius:2px; }

/* Field screens preserve the showcase's inset typography and metadata partitions. */
.lp-design-field { margin:0; min-width:0; white-space:pre-wrap; overflow-wrap:anywhere; font:400 1em/1.7 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; color:#d4d4d8; }
.lp-field-screen .lp-instrument-meta { border-top:1px solid rgba(var(--design-rgb),.22); padding-top:1em; color:var(--design-ink); }
.lumiphone-shell .lp-tracker-card[data-design="terminal"] { --design-ink:#d8b4fe; --design-rgb:168,85,247; background:#000; border:2px solid #a855f780; }
.lp-field-screen-terminal { background:#0a0a0a; border-color:#581c87; border-radius:12px; padding:1.4em; }.lp-field-screen-terminal .lp-design-field::before { content:'“'; }.lp-field-screen-terminal .lp-design-field::after { content:'”'; }
.lumiphone-shell .lp-tracker-card[data-design="vellum"] { --design-ink:#fda4af; --design-rgb:244,63,94; background:#161318; border:2px solid #ffffff25; }.lp-tracker-card[data-design="vellum"] .lp-title { font-family:Georgia,serif; font-size:1.5em; }.lp-field-screen-vellum { background:#0f0c11; border-color:#ffffff18; padding:1.7em; }.lp-field-screen-vellum .lp-design-field { color:#e4e4e7; font:italic 1.17em/1.8 Georgia,serif; }
.lumiphone-shell .lp-tracker-card[data-design="hud"] { background:#071318; border-width:2px; }.lp-field-screen-hud { position:relative; border-color:#22d3ee4d; padding:1.4em; border-radius:12px; background:#000c; }.lp-field-screen-hud::before,.lp-field-screen-hud::after { content:''; position:absolute; width:9px; height:9px; border-color:#22d3ee; border-style:solid; }.lp-field-screen-hud::before { top:4px; left:4px; border-width:1px 0 0 1px; }.lp-field-screen-hud::after { bottom:4px; right:4px; border-width:0 1px 1px 0; }.lp-field-screen-hud .lp-design-field { color:#cffafe; }
.lumiphone-shell .lp-tracker-card[data-design="report"] { --design-ink:#cbd5e1; --design-rgb:148,163,184; background:#0e111a; border:2px solid #ffffff25; }
.lp-field-screen-report { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,2fr); gap:1em; background:#000c; border-color:#ffffff18; }.lp-field-screen-report .lp-design-field { font-size:.92em; }.lp-field-metadata { margin:0; padding-right:.8em; border-right:1px solid #ffffff18; min-width:0; font:.72em/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; color:#94a3b8; overflow-wrap:anywhere; }.lp-field-metadata dd { margin:0 0 1em; color:#f8fafc; }

/* Recessed chronometer, OLED complications, orange radar and particle chamber. */
.lumiphone-shell .lp-tracker-card[data-design="timer"] { --design-ink:#fb923c; --design-rgb:249,115,22; background:linear-gradient(#1c222e,#090c12); border:2px solid #f9731680; }
.lp-clock-panel-timer { text-align:center; justify-items:center; background:#040609; border:2px solid #1f293d; box-shadow:inset 0 3px 8px #000e; padding:1.5em; }.lp-clock-panel-timer .lp-tracker-reading { justify-content:center; }.lp-tracker-card[data-design="timer"] .lp-tracker-readout { color:#fb923c; font-size:2.6em; letter-spacing:.04em; text-shadow:0 0 15px #f973163b; }.lp-clock-panel-timer>.lp-instrument-caption:last-child { color:#94a3b8; font-size:.65em; }.lp-tracker-card[data-design="timer"] .lp-tracker-stage { display:none; }
.lumiphone-shell .lp-tracker-card[data-design="watch"] { --design-ink:#67e8f9; --design-rgb:100,116,139; background:#0e111a; border:2px solid #475569; }
.lp-clock-panel-watch { display:grid; grid-template-columns:8em minmax(0,1fr); align-items:center; gap:1.3em; background:#000e; border-color:#404040; padding:1.5em; }
.lp-watch-display { width:8em; height:8em; position:relative; display:grid; place-items:center; border:4px solid #404040; border-radius:50%; background:#0a0a0a; box-shadow:inset 0 2px 10px #000; }.lp-watch-display::before { content:''; position:absolute; inset:4px; border:1px dashed #404040; border-radius:50%; pointer-events:none; }
.lp-watch-oled { position:relative; display:grid; gap:.3em; justify-items:center; text-align:center; padding:.4em; min-width:0; }.lp-tracker-card[data-design="watch"] .lp-watch-oled .lp-tracker-readout { font-size:1.05em; letter-spacing:-.03em; color:white; }.lp-watch-oled .lp-instrument-caption { font-size:.58em; color:#22d3ee; }
.lp-watch-complications { display:grid; gap:.8em; margin:0; min-width:0; }.lp-watch-complications>div { display:flex; flex-wrap:wrap; justify-content:space-between; gap:.3em .6em; min-width:0; font:.78em/1.5 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; }.lp-watch-complications dt { text-transform:uppercase; color:#a3a3a3; }.lp-watch-complications dd { margin:0; color:#67e8f9; font-weight:700; overflow-wrap:anywhere; }.lp-watch-complications>div:nth-child(2) dd { color:#34d399; }.lp-watch-complications>div:nth-child(3) dd { color:#fca5a5; }
.lumiphone-shell .lp-tracker-card[data-design="radar"] { --design-ink:#fb923c; --design-rgb:249,115,22; background:#0a121c; border:2px solid #f9731666; }
.lp-clock-panel-radar { display:grid; grid-template-columns:6.7em minmax(0,1fr); align-items:center; gap:1.4em; background:#000d; border-color:#262626; padding:1.3em; }
.lp-timer-radar { border-color:#f97316; background:#090a0c; display:grid; place-items:center; }.lp-radar-center { position:relative; max-width:90%; text-align:center; color:white; font:700 1em/1.2 ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace; overflow-wrap:anywhere; }
.lp-clock-reading { display:grid; gap:.6em; min-width:0; }.lp-tracker-card[data-design="radar"] .lp-tracker-readout { font-size:1.9em; }.lp-clock-reading .lp-instrument-caption { color:#94a3b8; font-size:.7em; }
.lumiphone-shell .lp-tracker-card[data-design="hourglass"] { --design-ink:#c084fc; --design-rgb:168,85,247; background:#140e1c; border:2px solid #a855f766; }
.lp-clock-panel-hourglass { display:grid; grid-template-columns:5.3em minmax(0,1fr); align-items:center; gap:2em; padding:1.5em; background:#000e; border-color:#581c8799; }
.lp-hourglass-chamber { position:relative; width:5.3em; height:8em; }.lp-hourglass-vector { width:100%; height:100%; color:#c084fc; stroke-width:2.5; }.lp-tracker-card[data-design="hourglass"] .lp-tracker-readout { color:#fff; font-size:2em; }.lp-tracker-card[data-design="hourglass"] .lp-tracker-stage { background:none; border:0; padding:0; font-size:.8em; }
.lp-hourglass-particle { position:absolute; left:calc(50% - 3px); top:48%; width:6px; height:6px; border-radius:50%; background:#67e8f9; box-shadow:0 0 8px #22d3ee; opacity:0; }
.lp-design-body[data-animating="true"] .lp-hourglass-particle { animation:lp-particle-trickle 1.2s cubic-bezier(.55,.055,.675,.19) infinite; }.lp-design-body[data-animating="true"] .lp-radar-quadrant,.lp-world-recon .lp-radar-quadrant { animation:lp-radar-sweep 4s linear infinite; }
@keyframes lp-radar-sweep { to { transform:rotate(360deg); } } @keyframes lp-particle-trickle { 0% { transform:translateY(-8px); opacity:0; } 20% { opacity:1; } 80% { opacity:1; } 100% { transform:translateY(34px); opacity:0; } }
.lp-tracker-preview:has(>.lp-tracker-card[data-design]) { display:block; padding:0; border:0; background:transparent; }
@container tracker-card (max-width:260px) { .lp-faction-poles { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }.lp-faction-lean { grid-column:1/-1; grid-row:1; }.lp-hearth-panel { grid-template-columns:6.7em minmax(0,1fr); gap:.8em; }.lp-hearth-dial { width:6.7em; height:6.7em; }.lp-clock-panel-watch { padding:1em; gap:1em; }.lp-tracker-card[data-design="radar"] .lp-tracker-readout,.lp-tracker-card[data-design="hourglass"] .lp-tracker-readout { font-size:1.6em; }.lp-clock-panel-hourglass { gap:1em; } }
.lp-phase-orbit[data-wide="true"]>li,.lp-phase-waypoint[data-wide="true"]>li,.lp-phase-gates[data-wide="true"]>li { flex:0 0 11em; min-width:11em; }
.lp-phase-condition[data-wide="true"]>li,.lp-phase-world[data-wide="true"]>li { flex-basis:10em; }
.lp-faction-poles[data-long-names="true"] { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }.lp-faction-poles[data-long-names="true"] .lp-faction-lean { grid-column:1/-1; grid-row:1; }.lp-faction-poles[data-long-names="true"] .lp-faction-pole { flex-direction:column; align-items:start; }.lp-faction-poles[data-long-names="true"] .lp-faction-high { align-items:end; }
.lp-watch-oled .lp-tracker-readout>span { display:block; }
.lp-register-housing[data-long-value="true"] { grid-template-columns:minmax(0,1fr); }.lp-register-housing[data-long-value="true"] .lp-odometer-drums { overflow-x:auto; }.lp-register-housing[data-long-value="true"] .odometer-wheel { flex:1 0 .6em; }
@media(prefers-reduced-motion:reduce) { .lp-tracker-card[data-design] * { animation:none; transition:none; }.lp-design-body[data-animating="true"] .lp-hourglass-particle { opacity:.8; } }
`
