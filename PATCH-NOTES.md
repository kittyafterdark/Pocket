# Pocket real-user feedback patch — 2026-09-15

## Changes

- Add Contact now has a search field that filters NPC Bank entries plus importable Lumiverse Character / Active Council rows, hides empty source sections, and shows an empty-search state.
- Weather Edit now preserves the `.lumiphone-app-view` scroll container when entering edit mode via the local page replacement path. This fixes fields below the fold being reachable by Tab but not by manual scrolling.
- Group Chat manual **Auto speaker** now treats the user's explicit generate action as a presence/remote-channel override while still respecting `generationPolicy.relevant`. Fully autonomous after-send group replies keep the existing remote + out-of-scene eligibility rules.
- Regression contracts cover Add Contact search presence/empty state, Weather's scrollable edit container, and manual group Auto with in-scene / remote-disabled participants.
- `dist/frontend.js` and `dist/backend.js` were synchronized manually with the source changes because Bun is unavailable in this sandbox.

## Validation in this sandbox

Passed:

- `node --experimental-strip-types --check src/frontend/apps/contacts.ts`
- `node --experimental-strip-types --check src/frontend/controller.ts`
- `node --experimental-strip-types --check src/backend.ts`
- `node --check tests/contracts.mjs`
- `node --check dist/frontend.js`
- `node --check dist/backend.js`
- Source-vs-backup diff review for all modified files.

Not runnable here:

- `bun run verify` — Bun is not installed in the sandbox.
- `node tests/contracts.mjs` — `jsdom` is not installed in the sandbox.
- `tsc --noEmit` reaches the project but cannot resolve `lumiverse-spindle-types` because dependencies are not installed; the resulting downstream implicit-any errors are dependency-context fallout, not a clean project typecheck.

## Recommended local verification

```text
bun run verify
```
