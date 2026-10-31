# Sticker packs and Discord emotes

Open **Stickers → Browse packs** to add the bundled packs:

| Pack | Images | Format |
| --- | ---: | --- |
| Double Underlined | 50 | PNG |
| Gatos Cartoon | 52 | PNG and GIF |
| Nyas | 50 | GIF |
| Forbidden Emotes 2.0 | 47 | PNG |

The packs are optional and shared between Messages and Discord on the current Persona phone. Each Freeform session and roleplay Pocket keeps its own library. Adding a pack stores its ID; its images are already bundled with the extension. It needs no network request, Gallery upload, image permission or image generation connection. Removing a pack hides it from pickers while preserving images in messages already sent.

Use **New pack** beside **Save to pack** when adding, reviewing or editing a sticker, or **Create sticker pack** on the packs screen. New collections are selected automatically when returning to the sticker form. Rename or remove it there. Removing a collection moves its images back to **My stickers**. In the library, **Edit stickers** lets you select custom images, move them to a pack, or delete them. New uploads, Gallery selections and generated stickers have a **Save to pack** selector. Existing images remain in **My stickers**. Custom collections hold references to the same Gallery images; grouping does not duplicate the image files. The library supports up to 500 custom stickers and 40 custom collections, plus bundled packs.

Open a custom sticker preview and choose **Edit sticker** to change its name, model-facing description, caption and pack. Editing keeps the image and sticker ID, so its Discord short code stays stable. Gallery selections open **Review sticker**, prefilled from the filename; give it a name and choose **Save sticker** before it enters the library. Uploads use their filename unless a name was supplied.

Generation shows streamed Swarm previews and step progress when available. The completed image opens **Review generated sticker**, with editable name, description, caption and pack. The Accept/Retry/Discard controls stay below the scrolling form so they remain visible on mobile. **Accept sticker** saves it, **Retry generation** replaces the pending preview, and **Discard sticker** leaves the library untouched. Cancelling or failing generation cannot add a sticker. Generated host images may still be available in Gallery; rejecting the collection entry does not delete Gallery assets.

In Messages, open **+ → Stickers**, choose a pack, search, then select a sticker to send it to the current conversation. The tray uses space above the composer and leaves chat visible.

In Discord, the smile button opens an inline drawer with **Emoji**, **Emotes** and **GIFs** tabs. **Emotes** uses the same pack library. Selecting an emote inserts its short code at the text cursor and shows a preview; **Send** posts it with the message. Emotes render within text, or larger when the message contains only emotes. Escape or the close button dismisses the drawer and restores focus. **Browse & manage packs** opens the pack screen, or the App Store if Stickers is not installed. Unicode emoji and Tenor GIFs keep their existing behavior.

## Assets and persistence

The 199 images were supplied in `DoubleUnderlined_static.zip`, `GatosCartoon.zip`, `nyas_animated.zip` and `Forbidden%20Emotes%202.0_static.zip`. The archives contain images only, with no creator or license metadata. Original PNG/GIF bytes are embedded in `src/frontend/builtin-sticker-assets.ts`; animations are not flattened or re-encoded. Names and stable IDs live in `src/domain/builtin-sticker-packs.ts`, without image bytes in the backend bundle. Case-colliding filenames keep distinct IDs.

Messages store a bundled sticker ID. Discord stores bounded emote snapshots containing a bundled ID or a custom Gallery image reference. Message text retains readable short codes for generation context. Only known library references become emote images; arbitrary short codes stay text. Snapshots preserve historical display when a pack or custom sticker is removed.

## Verification

- `bun run test:native-apps` covers migration, grouping, removal, pack references, image signatures, permissions, user scope and Discord persistence.
- `bun run test:sticker-packs:browser` exercises the real frontend/backend with controlled data at 390px and 900px, including animations, grouping, inline emotes, keyboard dismissal, removal and remounting.
- `bun run test:socials` checks the existing Discord emoji, GIF, reply, reaction and profile flows.

Browser checks use synthetic accounts and mocked providers; they do not modify personal chats or call live generation services.
