# Pocket context delivery

Settings → Context now groups controls into **Sources & scenario**, **Roleplay delivery**, **Prompt review**, and **Tracker macros**. Profile/lorebook preferences retain their device scope; scenario, memory delivery, and tracker delivery retain their Pocket chat scope. Existing Messages context-preview controls remain available.

## Delivery and placement

Pocket memory and live trackers have independent automatic/macro delivery choices. Existing saved phones retain system messages at the end of the assembled prompt. Changing memory delivery leaves phone tools, continuity relays, handoff memory, and one-shot references available.

Automatic delivery supports system, assistant, and user roles with these positions:

| Position | Boundary |
| --- | --- |
| After prompt (default) | After the entire incoming prompt, preserving original Pocket behavior |
| Before chat history | Before the oldest host-tagged chat turn |
| After chat history | Immediately after the newest host-tagged turn, before subsequent preset blocks |
| At depth | 0 after the newest turn; 1 before it; 2 before the preceding turn; excessive depth clamps to the oldest turn |

Depth counts only `__isChatHistory === true`, matching the inspected Lumiverse `resolveChatHistoryInsertionIndex` contract. Preset and extension messages do not count. Without tagged turns, before-history uses the beginning; after-history and depth use the prompt end, matching Lumiverse’s depth fallback. Interceptors do not expose the preset’s internal block markers, so these controls describe chat boundaries rather than individual preset-block slots. Use macro delivery for a specific preset slot.

Blocks sharing a boundary retain memory-before-trackers order. Prompt Breakdown indexes refer to their final positions after insertion. Original history messages and metadata are preserved.

## Macros and review

- `{{pocket_memory}}`: guidance, authorship rules, current snapshot, and phone recall. Resolves only in memory macro mode.
- `{{pocket_trackers}}`: tracker guidance, permissions, and visible live data. Resolves only in tracker macro mode.
- `{{pocket_tracker::stable_key}}`: one visible tracker value, including its unit; does not supply update instructions.

Macro handlers resolve the invocation’s chat and user, respect Pocket/tool suppression, and do not persist clock projections. The preset supplies role and position. Include each full block once to avoid duplicates. The Tracker macros shortcut exposes copy controls and a link to tracker delivery settings; visiting it does not change delivery mode.

Prompt review uses saved settings and the same serializers used for injection and macros. It includes memory, visible trackers, available handoff history, pending relay candidates, and the latest armed reference. Conditional blocks are labeled: generation matching and turn eligibility still determine which attachments are actually sent. Reviewing does not invoke generation, write storage, consume attachments, or create injection receipts. Refresh after saving or changing live data. Lumiverse’s Prompt Breakdown remains the place to inspect the full assembled prompt and provider formatting.

## Shared UI contracts

`promptPlacementControls(value, change)` owns the labeled role, position, and depth fields used by both memory and tracker settings. `trackerMacroLibrary(state)` supplies the same visible-tracker macro/copy controls to the shortcut and tracker settings. Canonical settings, field, category, and preview styles supply layout, hidden states, and scrolling; there are no new global host styles or UUID generators.

## Validation

- **PASS** `bun run verify`: typecheck, both bundles, 467 tests, and Pocket contracts.
- **PASS** `node scripts/check-prompt-delivery.mjs`: Chromium fixtures at 390px touch and 900px desktop widths; categories, existing sources/scenario, role/depth changes, draft refresh/back navigation, persistence/remount, macro switching/copying, tracker shortcut and placement save, read-only review/retry, console errors, and horizontal overflow.
- **PASS** `node scripts/check-tracker-context.mjs`: existing tracker menu, keyboard, save/draft, live preview, remount, and safe-top checks at both widths.
- **PASS** `git -c core.whitespace=cr-at-eol diff --check`; existing mixed line endings are preserved in settings/controller files.
- **NOT RUN** integration against a running Lumiverse instance, physical mobile/PWA devices, or live model providers. Browser evidence uses the repository’s public-boundary mock host.

For local Playwright installations, set `PLAYWRIGHT_BROWSERS_PATH` or `POCKET_CHROMIUM_EXECUTABLE` as needed. Generated screenshots and logs are in `tmp/prompt-delivery/`; the existing tracker diagnostic writes `tmp/tracker-context/`.

## Intended file manifest and rollback

- `src/domain/prompt-delivery.ts`: settings normalization, history boundaries, injection ordering, review types.
- `src/domain/tracker-context.ts`, `src/types.ts`: persisted settings contracts.
- `src/backend.ts`: settings save/review routes, shared memory serialization, configured injection, memory macro.
- `src/frontend/components/prompt-delivery.ts`: shared placement fields and tracker macro library.
- `src/frontend/apps/context-settings.ts`, `src/frontend/apps/settings.ts`: Context categories, delivery, sources, review, and macro shortcut.
- `src/frontend/apps/tracker-settings.ts`, `src/frontend/controller.ts`: tracker placement, navigation, scoped drafts, async save/review/error handling.
- `src/styles.ts`: canonical preview and hidden-state rules.
- `tests/prompt-delivery.test.ts`, `scripts/check-prompt-delivery.mjs`, `package.json`: targeted regression checks and verification commands.
- `dist/backend.js`, `dist/frontend.js`: rebuilt installable entrypoints.
- `docs/context-delivery.md`: this behavior and handoff report.

No Lumiverse core, local installation, credentials, or user storage files were edited. No branch changes, commits, or pushes were made. To roll back, restore only the listed source changes from the pre-change revision, remove the newly added files, and rebuild both entrypoints. Older code ignores the added settings fields; existing phone data does not need to be deleted or reset.
