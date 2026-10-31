# Community apps

Three optional apps are available through Pocket's App Store in both Roleplay and Freeform. Get an app on the current phone to add it to the launcher. Removing it keeps its saved data; reinstalling restores access.

## Lumistry

Lumistry is a fictional dating app with its own self profile, discovery preferences, generated profiles, matches and inbox. Start in **Me**, save a self profile, then configure discovery. Profile creation uses Pocket's configured text generation connection. Image generation and image inspection require their corresponding host permissions and capabilities.

Dating conversations use the existing Messages composer, persistence and generation lifecycle. Public aliases are used inside Lumistry. A match's private profile is not automatically exposed in ordinary Contacts or roleplay context. Phone exchanges do not automatically become roleplay events. Image descriptions can be sent without generating an image; generating the image is a separate explicit action.

Lumistry data belongs to the current Pocket chat or Freeform session and phone owner. Its saved-profile library and setup presets use user-scoped extension storage. Changing Personas or sessions does not silently merge dating histories.

## Spotify Share

Spotify Share depends on the existing **SpotifyControls** macros. It does not add a Spotify login or music player. The app opens a player-style preview with album art, track details and a recipient picker. **Refresh current song** reloads the track; **Share this song** opens the final preview. You can also open sharing from Messages attachments. Select lyric lines if desired, then confirm **Share song**. Lyrics appear as separate selectable rows, with a twelve-line limit and their own scroll area. Playback stays in Spotify. Song-only sharing is supported.

The backend validates the song snapshot and destination. Previews expire and can only be sent once; a changed track requires a fresh preview. SpotifyControls and a live Spotify session must be configured separately.

## Screenshots

Screenshots shares readable excerpt cards rather than bitmap screen captures. Choose a source and receiving conversation, then collect up to six items using the message-style selection rows. A counter and Clear control track your selection. Add a caption, review the scrapbook-style card and send. Sources include Messages, Lumistry conversations, Notes, Timeline, Trackers, Weather and social posts. Discord sources are restricted to servers joined by the phone owner. Other phones' conversations, archived threads, pending replies and private profile definitions are excluded.

The card stores the selected text and available photo descriptions. It cannot infer unseen image contents. Source edits after preview require another preview before sending. Once sent, the card is a snapshot, so later source edits do not rewrite the message.

## Integration provenance and boundaries

Integrated from the community packages `lumistry-app-20261030.zip`, `spotify-app-20261030.zip` and `screenshot-sharing-app-20261030.zip`. App modules and their domain tests were retained and adapted to current Pocket contracts. The archives' older reference backend, controller and stylesheet were not overlaid onto the live checkout.

Pocket continues to own authentication, chat/Freeform scopes, storage, permissions, generation, image resolution, conversation rendering and launcher installation. Lumistry authoring policy and recovery receipts live in a dedicated adapter. The screenshot sharing surface was generalized beyond Lumistry. Tests tied to the older reference host's image cache and message DOM cache were adapted to the current host behavior.

## Verification

- `bun run verify` — native Pocket typecheck, build, regression tests and contracts, including backend integration for these apps.
- `bun run test:community` — imported app/domain suites and cross-app capture checks.
- `bun run test:community:browser` — controlled frontend/backend fixture at mobile and desktop widths, installing the apps and exercising Lumistry setup, Spotify preview/confirmation and Notes sharing.

Browser diagnostics require Playwright and an installed Chromium browser; `POCKET_PLAYWRIGHT_ROOT` can identify a local Playwright installation. Fixtures use synthetic data and mocked providers. They do not test a live Spotify account, image provider or text model.
