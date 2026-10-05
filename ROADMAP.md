# Pocket evaluation backlog — 2026-10-05

Main Lumi is the evaluation environment. Update LumiTest after this pass, not during it.
Preserve messaging/candidate commit behavior; changes below are targeted fixes and presentation work.

## Functional fixes

- [ ] Setup: wait for greeting selection, close/reset on chat changes, allow resume after configuring generation.
- [ ] Setup: clear hierarchy, unclipped authorship choices, native connection/model controls.
- [x] Setup controls/hierarchy first pass: theme-aware sections, short authorship labels, native select/model controls, resume action.
- [x] Enrichment: thinking/writing/completion/error feedback; unlock retry without losing edits.
- [ ] Generation: test uses current connection/model selection; investigate first-call failure.
- [x] Messages: cancellable generation with stop control.
- [x] Messages: quick manual Here/Away presence assignment.
- [ ] Profiles: reusable Pocket Persona and character phone profiles.
- [ ] Sidebar: restore hidden launcher; bounded Recent, search, single-pass interaction index.
- [x] Sidebar: explicit Show launcher recovery action.
- [x] Mobile fullscreen: convert visual viewport/keyboard offsets to host layout pixels under UI scale; observe scale changes.
- [ ] World: rerun seed after setup; weather outlook and timeline review with proposed event updates.
- [x] Camera: shutter doubles as stop; integrated acceptance.
- [ ] Camera: native image config controls.
- [ ] Swarm: carry actual published LoRA contract alongside positives/checkpoint/aspect.
- [ ] Gallery: deletion with host ownership/scope and confirmation appropriate to destructive operations.
- [ ] Avatar crop: accepted framing matches preview.

## Presentation and correctness

- [ ] Message actions sheet: balanced action list, clearer hierarchy, compact Done control; replace the empty/right-stacked layout.

- [x] Remove stale handset 9:16 descriptions (retain valid image aspect options).
- [ ] Remove fixed violet material/atmosphere; neutral incoming bubbles, theme accents and semantic colors.
- [x] Tracker compositions by type: participants/trajectory, state rail, compact vitals, instrumentation.
- [x] Remove duplicate tracker metadata and explain story-triggered versus elapsed-time updates.
- [ ] Weather, timeline, camera, settings and contacts presentation passes.
- [ ] Theme previews use real miniature UI; visual preset swatches with SVG wallpapers instead of names.
- [ ] Associate settings labels; audit custom keyboard Space handling.

## Protection and maintenance (after visible UI settles)

- [ ] Controlled visual regression matrix: home/scales/settings/dense chat/long lock/call/cards/full phone/sidebar/trackers/mobile.
- [ ] Hostile global-theme fixture verifies Shadow DOM isolation and visual stability.
- [ ] Split reset/tokens/handset/inline styles; only inline styles enter activity ShadowRoots.
- [ ] Incremental controller/backend extraction with unchanged behavior and regression coverage.

Verification claims must distinguish unit/contracts, controlled browser fixtures, real provider calls,
and live main Lumi checks. Do not use personal chat data as test fixtures or modify it for convenience.
