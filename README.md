# Pocket

Pocket is a live-mounted Lumiverse Spindle extension that gives every chat + character pair its own persistent in-world phone.

The extension identifier and storage namespace intentionally remain `lumiphone` so existing installations and roleplay data upgrade in place.

## Included apps

- **Messages** — direct and group conversations with persona/contact sender identity, explicit or automatic single-speaker generation, and per-conversation unread state.
- **Contacts** — reusable Character, active Council, and Pocket NPC profiles with search, Here/Recent presence, compact context policy, direct-message entry, manual/generated creation, and explicit scene sync.
- **Gallery** — chat, character, Pocket-owned, or full Lumiverse image filters.
- **Camera** — native Lumiverse image generation, streamed previews where supported, an optional LLM scene-planning sidecar, and automatic chat/character image ownership.
- **Notes** — a private or model-visible character journal with pinned memory entries.
- **Weather** — fictional scene weather rather than an external real-world feed.
- **Timeline** — roleplay clock, event lanes, completed story beats, and exact, approximate, relative, or unscheduled story time.
- **Trackers** — bounded values with optional automatic change-per-hour and model visibility.
- **Settings** — device-wide theme colors, safe home/chat gradients, semantic phone scale, real animation timing, notification behavior, permissions, visual profiles, backup, import, and separate reset controls.

On desktop, the 58px draggable launcher opens a centered strict 9:16 phone in an opt-in transparent/chromeless host dock. Closing Pocket destroys that dock, and reopening creates a fresh one. The only stored size value is `handsetScale` (`0.80`–`1.25`); pixel dimensions are derived again on every mount, open, resize, keyboard viewport change, and scale edit. On narrow/mobile viewports it uses the host's native fullscreen mode with safe-area padding. Use the visible top-left dismiss button or a deliberate up/left status-area gesture; the home indicator returns to Home first, then closes the phone.

## Model integration

With `tools` permission, Pocket registers `phone_action` with these actions:

```text
message | contact | note | event | weather | tracker | camera | notify | open
```

The prompt interceptor adds a compact phone snapshot (pinned notes, in-scene/pinned contact briefs, timeline, weather, and model-visible trackers) to the current generation. It deliberately excludes arbitrary direct-message history; reply generation receives only the selected conversation's bounded recent thread. If the active provider/path does not expose extension tools, the same actions can be emitted as a hidden message tag:

```xml
<lumi-phone action="message" app="messages" title="Alice">Meet me by the station.</lumi-phone>
```

Structured content is supported:

```xml
<lumi-phone action="event" app="calendar">{"title":"Train arrives","start":"2026-09-01T20:00:00Z","lane":"Main timeline"}</lumi-phone>
```

The frontend removes these tags from rendered prose. Frontend actions, model tools, and tags converge on one backend action path with durable request-id deduplication plus a short semantic duplicate window, so a tool/tag retry does not produce two entries. Settings control whether model actions also open the phone and whether to send rate-limited OS push notifications.

## Swarm Studio bridge

When **Sync active Swarm Studio profile** is enabled, Camera resolves Swarm Studio's live macros in the active chat:

- `{{char_base}}`
- `{{persona_base}}`
- `{{swarm_negative}}`
- `{{swarm_preset}}`
- `{{swarm_checkpoint}}`
- `{{swarm_aspect}}`

This carries the current character/persona positives, negative prompt, preset directives, checkpoint, and aspect into the photo request without reading another extension's private storage. The integration uses published macro contracts only; Swarm Studio remains optional and unchanged. Manual positive/negative text is additive, and manual connection, model, LoRA stack, and provider-parameter JSON remain available for users without Swarm Studio. If scene planning or profile resolution fails, Camera falls back to the original brief/manual profile. Cancellation suppresses association, notification, and UI completion from late results.

## Storage

State is kept under Lumiverse user storage at:

```text
users/{userId}/extensions/lumiphone/phones/{chatId}__{characterId}.json
```

Device preferences are deliberately separate:

```text
users/{userId}/extensions/lumiphone/device/preferences.json
```

Roleplay state contains reusable contacts, separate conversations/messages, notes/provenance, fictional weather, timeline events, trackers, notifications, and bounded internal idempotency receipts. Device state contains theme colors, scale, motion, notification behavior, and Camera/Swarm preferences. Legacy v0-v2 embedded settings and contact-owned message threads migrate on read; malformed records normalize safely; unknown future schemas fail closed. Import is validated and forced to the active chat/character rather than trusting IDs in a file. Settings exposes distinct reset actions for this phone, all roleplay phones, and device preferences.

State arrays and text fields are normalized and bounded on every read. Tracker rates are deterministically materialized from their last persisted timestamp, so they continue advancing across phone closes and process restarts. Model memory is an app-specific projection with a hard 5,600-character serialized ceiling rather than a dump of storage.

## Source layout

- `src/frontend.ts` — small host bootstrap and teardown relay.
- `src/frontend/controller.ts` — host lifecycle, scope switching, action routing, and app orchestration.
- `src/frontend/surface.ts` — semantic scale and fresh viewport-to-9:16 geometry.
- `src/frontend/apps/settings.ts` — Settings view and device-management controls.
- `src/frontend/apps/messages.ts` — conversation list, threads, group editing, compose, and reply controls.
- `src/frontend/apps/contacts.ts` — contact discovery, presence, import, detail, and configuration flows.
- `src/frontend/apps/trackers.ts` — tracker dashboard, detail, history, and configuration.
- `src/domain/contacts.ts` — contact/conversation normalization, migration, and direct-thread invariants.
- `src/domain/preferences.ts` — preference defaults, validation, and migration.
- `src/domain/projection.ts` — bounded model-context projection.
- `src/backend.ts` — Spindle adapters and canonical command pipeline.
- `src/styles.ts` — centralized phone/design tokens and responsive states.

## Development

```bash
npm run verify
node scripts/mount-local.mjs --enable
```

`npm run verify` typechecks, bundles both entries, runs pure migration/projection/surface tests, and runs the backend + simulated-DOM host contract. The contract covers schema-v3 migration/idempotence, source-specific Character/Council replies, group speaker bounds, explicit scene sync, duplicate tool delivery, scene-planner fallback, cancellation of a late non-streaming Camera result, future import rejection, app mounting, click/Enter sending, tracker Save, typing state, tag routing, dock recreation, and 9:16 scale changes. A real Lumiverse backend startup is a separate smoke step; a DOM harness is not labeled as visual QA.

The live extension is mounted at `Lumiverse/data/extensions/lumiphone/repo`; its built entries are `dist/backend.js` and `dist/frontend.js`.
The local mount script registers/enables the exact folder in `data/lumiverse.db` but intentionally does not bypass Lumiverse's permission-consent flow.
