# Pocket

Pocket is a live-mounted Lumiverse Spindle extension that gives every chat + character pair its own persistent in-world phone.

The extension identifier and storage namespace intentionally remain `lumiphone` so existing installations and roleplay data upgrade in place.

## Included apps

- **Messages** — direct and group conversations with a chat-scoped Pocket Persona, outgoing-message bursts, explicit or automatic single-speaker generation, narrative pause/handoff states, generation diagnostics, and per-conversation unread state.
- **Contacts** — reusable Character, active Council, and Pocket NPC identities with search, compact context policy, direct-message entry, manual/generated creation, and a replaceable current-scene snapshot with source-turn freshness.
- **Gallery** — chat, character, Pocket-owned, or full Lumiverse image filters; full-resolution inspection, current-RP append, contact photos, and device/Persona wallpaper actions backed by stable Lumiverse image IDs.
- **Camera** — native Lumiverse image generation, streamed previews where supported, an optional LLM scene-planning sidecar, and automatic chat/character image ownership.
- **Notes** — a private or model-visible character journal with pinned memory entries.
- **Weather** — fictional scene weather rather than an external real-world feed.
- **Timeline** — roleplay clock, event lanes, completed story beats, and exact, approximate, relative, or unscheduled story time.
- **Trackers** — bounded values with optional automatic change-per-hour and model visibility.
- **Settings** — device-wide theme colors, home/chat image wallpapers, separate desktop handset and cross-device UI scales, real animation timing, context inspection, discovered-model selection, notification behavior, visual profiles, backup, import, and separate reset controls.

On desktop, the 58px draggable launcher opens a centered strict 9:16 phone in an opt-in transparent/chromeless host dock. Closing Pocket destroys that dock, and reopening creates a fresh one. `handsetScale` (`0.80`–`1.25`) controls only the physical desktop handset; pixel dimensions are derived again from the current viewport on every mount, open, resize, keyboard viewport change, and scale edit. `uiScale` (`0.70`–`1.30`) controls Pocket's primitive sizes and density on desktop and mobile. Narrow/mobile viewports always use the host's full available viewport and safe-area/visual-viewport handling rather than shrinking the surface. Use the visible top-left dismiss button or a deliberate up/left status-area gesture; the home indicator returns to Home first, then closes the phone.

## Model integration

With `tools` permission, Pocket registers `phone_action` with these actions:

```text
message | contact | scene | note | event | weather | tracker | camera | notify | open
```

The prompt interceptor adds a compact phone snapshot (pinned notes, in-scene/pinned contact briefs, timeline, weather, and model-visible trackers) to the current generation. It deliberately excludes arbitrary direct-message history; reply generation receives only the selected conversation's bounded recent thread. If the active provider/path does not expose extension tools, the same actions can be emitted as a hidden message tag:

```xml
<lumi-phone action="message" app="messages" title="Alice">Meet me by the station.</lumi-phone>
```

Structured content is supported:

```xml
<lumi-phone action="event" app="calendar">{"title":"Train arrives","start":"2026-09-01T20:00:00Z","lane":"Main timeline"}</lumi-phone>
```

A cooperating main model may also provide a bounded structured scene update with `<lumi-phone action="scene">`. Natural-language narration is never regex-parsed into scene state.

The frontend removes these tags from rendered prose. Frontend actions, model tools, and tags converge on one backend action path with durable request-id deduplication plus a short semantic duplicate window, so a tool/tag retry does not produce two entries. Settings control whether model actions also open the phone and whether to send rate-limited OS push notifications.

## Roleplay context and identity

Pocket keeps five concepts deliberately separate: source identity (Character Card, Council member, or Pocket NPC), replaceable scene snapshot, recent/story roleplay context, the selected phone thread, and the chat-scoped Pocket Persona.

The Messages context modes are deterministic:

- **Off** uses compact actor identity and the selected Pocket conversation only.
- **Recent** adds a bounded tail of the authoritative committed Lumiverse chat.
- **Story** adds Pocket's roleplay clock, weather, scene actors, relevant Timeline events and Trackers, and pinned model-visible Notes, without the main transcript.
- **Smart** includes Story and also includes Recent when a committed main-chat tail is available.

DM assembly is capped at 10,500 characters with separate budgets for actor identity, scene state, phone thread, recent RP, and story state. Settings → Messages can preview the exact sanitized block, its character/token estimate, source counts, the newest authoritative host-message anchor, and the newest included anchor. Generated incoming bubbles retain a non-secret Generation Info record with the actor source ID, context mode/budgets, scene freshness, Pocket Persona size, connection, and model.

The authoritative recent source is `spindle.chat.getMessages(chatId)` at the instant generation or preview begins. Pocket does not reuse an earlier event payload or timeout-based cache. Lumiverse emits `GENERATION_ENDED` after the final assistant row is persisted; Pocket uses that event to mark an existing snapshot stale, while the next preview/generation fetches the committed rows and their IDs/indexes directly.

Scene Sync replaces `sceneSnapshot` after validating the entire bounded result. It stores the actor/contact links, temporary scene briefs, capture time, and source message ID/index/revision. A later completed RP turn marks the snapshot potentially stale. Exact known names and conservative unambiguous single-token aliases prevent the active Character from becoming a duplicate NPC; the active Pocket Persona is always excluded from Contacts.

Each chat owns a compact Pocket Persona. It may follow the current Lumiverse Persona or use a manual/generated profile without modifying Lumiverse. Generated profiles are previews until explicitly accepted. A new chat receives one dismissible setup sheet; the offered/completed state persists with that chat.

Automatic replies settle a device-configurable `Instant`, `Quick`, `Natural`, or `Relaxed` outgoing burst. Consecutive bubbles join the same persisted burst, active composition holds evaluation, and exactly one reply decision runs after settlement. Manual sparkle generation flushes the burst immediately. The channel state is explicit: `remote`, `arriving`, `paused`, or `local`. Scene presence is checked before the reply model, and an impossible `none`/`reply` result is normalized to `handoff` if scene truth changed during evaluation. `arriving` remains textable until scene presence corroborates arrival.

A local handoff writes a linked Timeline event and a bounded pending continuity relay, then uses Lumiverse's native chat-mutation generation path to continue the main RP. The interceptor injects only pending relays at higher recency than older scene summaries; a relay is consumed only by its matching successful generation and remains retryable after failure or stop. A local conversation hides autonomous reply affordances and offers **Return to roleplay**, the Timeline handoff, and an explicit **Message anyway** override. Leaving the scene restores remote eligibility without erasing an unrelated pause.

## Text generation routing

Generation can follow the active roleplay connection or use a sidecar connection. For sidecar mode, Settings presents:

```text
Sidecar
Connection profile
Model override
```

The model override uses Lumiverse's host model combobox, so it receives the selected connection and discovers that provider's current model options. Leaving it empty uses the connection profile's configured model. The selected override is persisted device-side and passed through the supported per-generation `parameters.model` field; diagnostics report the effective connection/model without credentials.

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

Roleplay state (currently schema v6) contains the chat-scoped Pocket Persona and setup flag, reusable identities, a replaceable scene snapshot, separate conversations/messages and outgoing bursts, channel decisions, continuity relays, notes/provenance, fictional weather, timeline events, trackers, notifications, and bounded internal idempotency receipts. Device preferences (currently schema v5) contain theme colors, typed image-source wallpapers, Persona appearance overrides, `handsetScale`, `uiScale`, motion, reply cadence, notification behavior, and Camera/Swarm/generation routing. Uploaded backgrounds are persisted through Lumiverse's shared Images API; preferences retain only an asset ID (or a durable URL), plus fit, normalized focal coordinates, and scrim—not base64 data. Legacy URL wallpapers, embedded settings, and contact-owned message threads migrate on read; malformed records normalize safely; unknown future schemas fail closed. Import is validated and forced to the active chat/character rather than trusting IDs in a file. Settings exposes distinct reset actions for this phone, all roleplay phones, and device preferences.

State arrays and text fields are normalized and bounded on every read. Tracker rates are deterministically materialized from their last persisted timestamp, so they continue advancing across phone closes and process restarts. The main-model Pocket snapshot has a hard 5,600-character serialized ceiling rather than dumping storage; selected-conversation DM context uses the separate bounded assembler described above.

## Source layout

- `src/frontend.ts` — small host bootstrap and teardown relay.
- `src/frontend/controller.ts` — host lifecycle, scope switching, action routing, and app orchestration.
- `src/frontend/surface.ts` — semantic scale and fresh viewport-to-9:16 geometry.
- `src/frontend/apps/settings.ts` — Settings view and device-management controls.
- `src/frontend/apps/messages.ts` — conversation list, threads, group editing, compose, and reply controls.
- `src/frontend/apps/contacts.ts` — contact discovery, presence, import, detail, and configuration flows.
- `src/frontend/apps/trackers.ts` — tracker dashboard, detail, history, and configuration.
- `src/frontend/components/image-picker.ts` — reusable stable-reference wallpaper/image controls.
- `src/domain/contacts.ts` — contact/conversation normalization, migration, and direct-thread invariants.
- `src/domain/preferences.ts` — preference defaults, validation, and migration.
- `src/domain/projection.ts` — bounded model-context projection.
- `src/backend/roleplay-context.ts` — authoritative RP fetch, context-mode assembly, budgets, anchors, and diagnostics.
- `src/backend/continuity.ts` — bounded channel-decision normalization, snapshots, and pending relay projection.
- `src/backend/generation.ts` — roleplay/sidecar routing, connection inspection, model override, and run history.
- `src/backend.ts` — Spindle adapters and canonical command pipeline.
- `src/styles.ts` — centralized phone/design tokens and responsive states.

## Development

```bash
npm run verify
node scripts/mount-local.mjs --enable
```

`npm run verify` typechecks, bundles both entries, runs pure migration/projection/surface/context tests, and runs the backend + simulated-DOM host contract. The contract covers v6/v5 migration, deterministic local handoff and relay consumption, impossible-marker context freshness, source-specific Character/Council replies, scene Character/Persona exclusion and snapshot staleness, outgoing burst batching/typing hold/manual flush, pause/handoff behavior, stable Gallery/uploaded wallpaper references, group speaker bounds, duplicate tool delivery, sidecar connection/model override, scene-planner fallback, Gallery current-RP update, cancellation of a late Camera result, future import rejection, app mounting, click/Enter sending, Tracker Save/history behavior, tag routing, dock recreation, wallpaper layering, and semantic handset/UI scaling. A real Lumiverse backend startup remains a separate host-sensitive smoke step; a simulated DOM is not labeled as visual QA.

The live extension is mounted at `Lumiverse/data/extensions/lumiphone/repo`; its built entries are `dist/backend.js` and `dist/frontend.js`.
The local mount script registers/enables the exact folder in `data/lumiverse.db` but intentionally does not bypass Lumiverse's permission-consent flow.
