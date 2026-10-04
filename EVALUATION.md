# Pocket evaluation pass

Implemented from the pipeline/UX mapping, including the first Open JEV tracker pass.

## Open JEV
- Settings → Open JEV: enable the integration, use the public pngwn/open-jev Space or a compatible base URL, optionally evaluate after completed normal story turns.
- Tracker settings → Updates → Open JEV: a short question, numeric rubric anchors (meters), or allowed options (states), and a confidence threshold.
- Evaluate one tracker from its detail page or all opted-in trackers from Settings.
- Open JEV uses its published Gradio v2 submission and SSE result protocol; comparison and verification workloads are disabled.
- Scores interpolate one-based Open JEV expectations across explicit numeric anchors. Confidence is the maximum option probability. Low confidence, invalid results, and request failures preserve values.
- Timers and counters retain exact/manual/story/time behavior; JEV inference applies to meters and state trackers.
- Automatic evaluations deduplicate unchanged story/rubric inputs. Manual evaluation allows a retry. Completion preserves intervening manual/configuration edits and rejects changed story context.
- Accepted changes use existing tracker operations and history with `jev` provenance; model tools cannot write JEV-owned trackers.
- Defaults are disabled. Evaluation sends the last six story messages and selected tracker targets to the configured Space.
- Live synthetic API diagnostic passed; user-chat inference remains for evaluation. The host proxy has a 30-second request timeout, so queued/cold public Space requests can fail safely.

## Messages
- New Message: intrinsic avatar column, stacked name/role, search, recent recipients, contact-group shortcuts, Add Contact.
- Group editor: real route, persistent title/membership, search, selected member chips/count, pending save and acknowledgement.
- Start a group from Contacts and verify Back returns to the expected screen.

## Trackers
- Template-first setup, actor/relationship/scene/world pickers, type-specific fields, row-based bands, meaning, advanced controls, persistent drafts, actual display preview.
- Distinct relationship, vitals, meter, counter, state, timer, segmented, and compact displays.
- Semantic Health/Hunger/Trust/Tension bands; generic ranges have neutral meaning.
- Real-time refresh on both dashboard and detail; formatted durations, clock/paused/finished state.
- Explicit create/configure/update commands, unique keys, validated configuration, history-producing operations and model write policy.

## Images
- Ready-made Pocket Wallpapers: 14 bundled SVG patterns, gradients, and landscape scenes; category filters, selected preview and explicit apply for Home/Chat and Persona overrides. Stable catalog IDs survive exports without uploads or network access.
- Camera and contact portrait camera: top/bottom strips, portrait viewfinder and floating prompt.
- Subject selection for scene/Character/Persona; contacts and unsaved NPC drafts have their own identity path.
- Framing, connection, checkpoint, enhancer; Swarm aspect becomes effective dimensions.
- Preview/retry/accept, avatar focal positioning, permission/pending/error/cancelled states.
- Shared generation service; streamed and ordinary providers; user-scoped jobs; stale UI result suppression; completion reloads state under lock.
- Stable avatar image references with legacy URL migration and Bank portability.
- Draft NPC profile and portrait can be accepted together. Saving the Bank copy is explicit.

## Contacts and casts
- Local contact collections with membership editing and group-chat shortcuts.
- Portable Bank casts containing saved NPC IDs, preview and selected/all import, ID-based reuse, local group remapping.
- Re-import preserves existing contact scene state, messages, relationships and tracker values.
- Independent Bank profile editing with aliases/tags; edits affect future imports.
- Bank v1 to v2 migration, member-reference cleanup, newer-schema write protection and capacity checks.

## Validation
- Typecheck, production builds, domain tests and mocked-host contracts.
- Regression coverage for cross-chat cast import/re-import, Bank-only editing, missing targets, portrait acceptance, image identity/aspect isolation and concurrent edit preservation.
- Live Lumi visual checks use the installed extension through Extensions → Pocket → Update.
- Real provider image generation and the subjective end-to-end evaluation remain for the user review.
