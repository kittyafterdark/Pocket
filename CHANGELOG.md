# Changelog

## 0.4.0 — 2026-10-30

### Context and Freeform

- Added Context settings for full character profiles, lorebooks, and a per-Pocket custom scenario, available in Roleplay and Freeform.
- Added per-contact compact/full profile selection and a lorebook retrieval log. Freeform scans linked/global lorebooks independently of host chat activation.
- Added sidebar session management with Persona filtering, searchable Persona pickers, renaming, and confirmed deletion.
- Freeform appearance follows a selected base Persona by default, with optional independent session styling that survives profile edits.

### Messages and events

- Added chat photo attachments from Gallery, uploads, and image generation. Generated and uploaded photos can be reviewed before explicitly sending; generated photos support retry, stop, and live Swarm previews with step progress.
- Added opt-in character photo generation in direct and group chats, with inline progress, stop/retry, and protection against cancelled or stale results.
- Redesigned the attachment modal with separate Photo and Event tabs and centered the composer attachment control.
- Added manual event scheduling from conversations, linked Timeline plans, and plan updates when an event is edited. Event editor inputs survive background read-status updates.
- Added Timeskip to the conversation menu, advancing the Pocket clock and leaving a persistent separator that reaches future reply context.
- Added chat theme shortcuts, conversation wallpapers, bubble corner radius, and vertical padding controls, with more default breathing room around message text.
- Reused the Home Messages icon for empty chats and softened casual texting guidance around terminal periods.

### Appearance and fixes

- Added independent mobile/desktop interface scales.
- Added Classic, Paper, Midnight, Pastel, and Custom icon packs under Advanced theme colors in Device appearance and Persona identity. Persona/session overrides can inherit the device pack; custom colors use circular swatches.
- Fixed operator-scoped LLM tracker judging by forwarding the authenticated user ID through generation requests, including retries and streaming.
- Expanded release verification with context, appearance, timeskip, photo, and Freeform backend regression tests, plus mobile/desktop browser checks.

## 0.3.0 — 2026-10-30

This release includes Freeform sessions, the redesigned sidebar, and the launcher, social, messaging, event, contact, and media improvements from this development pass.

### Freeform and sidebar

- Redesigned the sidebar with Roleplay and Freeform entry points.
- Added a Persona lock screen with multiple named, persistent Freeform sessions per Persona and a session login dropdown.
- Reused Pocket's shared handset, apps, preferences, NPC Bank, and identity profiles while keeping each session's messages, app data, and timeline independent of host chats.
- Added session renaming and switching in Settings; changing the active Lumiverse chat or Persona does not replace the selected Freeform identity.
- Added copying a Freeform session into an open roleplay chat with Keep base Pocket / Override confirmation and a backup before replacement.
- The open phone automatically switches to the bound chat after a successful copy; subsequent messages go to that chat while the original Freeform session stays separate.
- Kept story-context reads, story review, and roleplay handoffs out of standalone Freeform sessions.
- Verified desktop/mobile session navigation, keyboard focus, safe-top handling, reload/remount persistence, and post-link message isolation.

### Home, dock, and app drawer

- Rebuilt Home, the dock, and the searchable app drawer with cleaner icons, centered app placement, and smaller editing controls.
- Added multiple Home screens with navigation dots, screen creation/removal, and app folders.
- Added linked Tracker widgets and movable Weather and Clock & date widgets.
- Fresh layouts include clock/date and weather on the first screen. Removing them stays respected.
- Clock/date uses a transparent, title-free layout. Weather defaults to a one-row stripe, with a two-row card and compact/wide options available.
- Added shortcut placement, reordering, folder placement, and dock-slot editing with Save/Cancel behavior.
- Preserved layouts per chat, character, and phone owner, including migration of older layouts.
- Fixed launcher placement at Lumiverse UI scales and kept screen navigation and the dock accessible while Home scrolls.

### App Store

- Added a Pocket App Store for installing and opening optional apps on each phone.
- Redesigned discovery with a rounded search field, illustrated SVG banners, spotlight cards, and horizontal collections.
- Added installed/available filters and Get, Open, and Remove actions.
- Removing an app preserves its data and layout; reinstalling restores its placement where possible.
- Fixed installation updates resetting the Store view, search, and scroll position.
- Moved the Socials are here collection directly above Everyday favorites.

### Social apps

- Added fictional Twitter, Instagram, Tumblr, and Discord apps through the Store.
- Gave each app its own feed, navigation, profile, composer, and discussion presentation.
- Added public bios, generated usernames, and editable Persona usernames.
- Added abstract SVG avatars for internet strangers and labelled sample feeds; Instagram also has sample stories.
- Added Gallery attachments, file uploads, and explicit photo generation for post drafts.
- Added optional generated feed images, with description placeholders retained when generation is disabled or fails.
- Added manual Refresh to feeds and per-app settings for Manual, After each turn, or Automatic timer-based refresh.
- Added generation progress and Stop controls without shifting the surrounding layout.
- Added strangers-first feeds, selectable familiar characters and NPC Bank friends, portable casts, and an optional installed-character-card posting toggle.
- Kept private memories out of stranger accounts and public feeds; familiar participants can use relevant context and continuity.
- Kept posts, authorship, follows, reactions, and membership scoped to the appropriate phone and story.

### Twitter

- Separated For you/Following feed filters from profile navigation.
- Distinguished replies from quote posts: replies remain in their original discussion; quotes create a new post with the original embedded.
- Added post discussions, follow controls, profile bios, and media/GIF support.
- Cleaned up profile, composer, follow-button, and header layouts.

### Instagram

- Reworked the feed around images, stories, captions, and photo-focused composition.
- Added comment threads and targeted generated replies instead of treating every response as a separate post.
- Added private inboxes and message-style DM conversations with pinned composers and per-recipient drafts.
- Restricted new DM suggestions to followed accounts and selected friends, while keeping saved conversations available.
- Connected known participants’ Instagram DMs to relevant Pocket memories without turning them into public posts or duplicating Pocket Message rows.
- Removed redundant create-post controls and cleaned up profiles and comment styling.

### Tumblr

- Added a dashboard, blog profiles, a notes-style post editor, comments, reblogs, and reblog tags.
- Added Explore/search with trending-tag preview rails and fixed horizontal viewport overflow.
- Added a combined activity/messages screen with pill navigation and private messaging.
- Added a floating compose action and distinct Home, Search, Activity/Messages, and Profile navigation.
- Added per-phone True Blue, Goth Rave, Dark Mode, and Pride palettes in settings. Goth Rave uses black backgrounds, purple accents, and white icons.
- Removed redundant create-post rows and repaired profile and composer layouts.

### Discord

- Added servers, channels, per-server participant banks, generated community members, and server picture uploads.
- Separated channel navigation, server management, and server creation, with a server-name/caret menu above the channel list.
- Added bulk portable-cast selection and compact participant-source browsing.
- Replaced social-post-style discussions with direct channel replies and conversational reply generation after sending.
- Added reply previews, emoji reactions for Persona and members, message menus, pins, and a pinned-message list.
- Added saved name colors, richer profiles, profile gradients, and gray, AMOLED, and custom-gradient themes.
- Added Tenor GIF browsing and character GIF support.
- Rebuilt the composer as a contained rounded bar with a circular Send control and an Emoji/GIF popover.
- Removed the accidental Notes-style message view and fixed reply-composer overflow.

### Messages and continuity

- Refined bubble shapes, outgoing alignment, text spacing, timestamps, and message-menu placement.
- Made message menus close after choosing an action and reduced redundant notifications while viewing a conversation.
- Added cleanup for leaked DM context metadata and stronger guidance against unnatural, overly staged text-message formatting.
- Stabilized the composer and force-generation control as replies arrive; preserved reading position during updates.
- Added story-day separators and current-state context that distinguishes historical messages, presence, consumed handoffs, and completed or open plans.
- Improved retrieval of current roleplay context and the handling of stale invitations, old countdowns, and already-performed actions.
- Styled call-start/call-end entries as conversation stripes rather than ordinary bubbles.

### Events and roleplay handoffs

- Replaced bulky invitation dropdowns with a slim pinned plan stripe.
- Kept vague offers conversational until their timing is grounded; allowed proposed revisions to update the existing Timeline event.
- Removed deleted, completed, and successfully quickstarted plans from the upcoming stripe.
- Added styled event Quickstart cards and richer chronological phone context to preserve the lead-up and established rapport.
- Strengthened post-event boundaries so completed scenes and consumed handoffs are treated as history.

### Contacts, Add Contact, and NPC Bank

- Rebuilt Contacts as a compact alphabetical directory with All, Recent, Here, and Groups filters and A–Z navigation.
- Recent now reflects actual message history rather than scene-presence timestamps.
- Preserved browsing search and scroll position through navigation and asynchronous updates.
- Reordered Add Contact to Pocket NPC, Portable casts, NPC Bank, Characters, then Council.
- Added dedicated searchable, paged source pickers for large libraries instead of mounting hundreds of oversized cards.
- Split NPC Bank into NPCs and Casts, with compact rows and full profile/edit/remove actions in detail views.
- Added clear Added/Open contact states and bulk cast selection while reusing linked contacts.
- Made Generate NPC start profile generation immediately and retain completed previews when leaving Contacts and returning.
- Replaced the obscured camera-style finished preview with a clean portrait review and explicit Save contact/Save without photo actions.
- Fixed late progress reviving a completed Writing profile state and removed completed creation steps from Back history.

### Camera, portraits, and wallpapers

- Simplified Camera options: subject and framing first, a full-width enhancement control, and a compact Swarm Studio status.
- Moved connection/checkpoint overrides and detailed pipeline information under Advanced image settings.
- Distinguished the portrait subject from the character whose image settings are inherited.
- Kept generated portrait choices, upload/Gallery selection, framing, retake, and explicit acceptance available.
- Stopped contact/draft portrait jobs from producing in-world Photo ready notifications and photo activities.
- Fixed Gallery wallpaper actions losing their original Persona or silently applying globally.
- Added a centered wallpaper chooser with Home/Chat destinations and explicit Persona-only or All phones scope.
- Made Persona wallpapers independent of enabling a whole Persona theme; Use default restores inheritance.
- Added saving feedback and retryable errors, retained the selected destination across Persona changes, and refreshed previews after Gallery, Upload, and Image URL saves.

### Interaction and verification

- Reviewed labels, keyboard controls, tabs, native dialogs, focus restoration, mobile safe-top behavior, and UI-scale layouts.
- Fixed Escape navigating back twice and detached scroll callbacks overwriting saved browsing positions.
- Added regression coverage and controlled desktop/notched-phone browser diagnostics for the affected flows.
- The completed Contacts/media pass passed 312 tests, integration contracts, NPC lifecycle checks, and desktop/mobile Contacts and social-app browser checks.

These social apps simulate the roleplay world; they do not publish to real social services. Image and feed generation remain dependent on the configured providers and permissions.
