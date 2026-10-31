# More little worlds inside Pocket

Get **Pocket Bank**, **Birthdays**, **Browser**, **Maps**, **Twitch**, and **Stickers** from the App Store. These optional apps work in chat-bound Pockets and Freeform sessions. Their saved data belongs to the current Pocket and Persona phone. Removing an app keeps its saved data; reinstalling restores it.

## Pocket Bank

The wallet is fictional and starts at zero. The home screen shows a debit card, balance, quick actions and recent transactions. Under **Wallet settings**, set the starting balance and choose a currency. The currency selector uses the runtime's currency catalog, with a separate custom name/symbol field for story-world currencies. An optional conversion factor rescales the wallet, transactions, loans and bills together. It never retrieves live exchange rates.

Use **Add money**, **Pay** or **Send money** from the home screen to open their separate editors. **Activity** shows transactions and a spending breakdown. **Paid by** defaults to You. Spending paid by someone else records the operation without debiting the phone owner. Ordinary transactions can be undone; loan, bill and stream transactions stay attached to their originating operation.

**Plans** holds loans and bills. Loans support principal, term, annual interest, monthly installments, early payments and full payoff. Bills support monthly and one-time obligations. Payments are explicit and use the story date from Timeline; there are no automatic debits. An installment or bill cannot charge the same story period twice.

In **Wallet settings → Money tracker**, connect an existing numeric counter or meter. Choose **Use tracker balance** or **Use bank balance** to decide the initial value. Subsequent bank payments and tracker edits update the same balance, including generated tracker changes. Tracker edits do not invent bank transactions. Disconnecting keeps both current values. Existing trackers are never migrated automatically.

## Birthdays

Browse a month calendar, select a day for its celebrations, or jump to a person under **Coming up**. Use **Add birthday** to open the date editor. Save names, month/day, an optional birth year and a note. Unknown years stay unknown. The next celebration uses the story date, including actual leap days. **Add to Timeline** creates a normal Pocket event.

**Find birthdays in contact briefs** asks the configured text model to extract explicitly stated dates from saved, visible contact briefs. Suggestions require an evidence excerpt and are presented for review; they are not saved until **Save birthday** is chosen. Private unexchanged Lumistry identities are excluded.

## Browser and Maps

Browser has an address/search bar, back/forward controls, a bottom toolbar and a tab overview. It creates fictional pages from the scene, Persona and custom scenario using Pocket's text generation settings. Independent tabs preserve their histories. The toolbar opens bookmarks and sharing; the browser menu holds history, quizzes and private browsing. Addresses are fictional labels. Browser does not fetch or execute external websites.

Private browsing uses temporary backend/frontend memory rather than saved Pocket state. Closing the private session clears it and cancels pending work. Opening a new private session starts fresh. Explicitly sharing a private page copies its selected excerpt into the receiving conversation.

**Quizzes** includes a local starter personality quiz, generated custom quizzes, local scoring, optional generated contact answers, and explicit result sharing. These are fictional entertainment. Private Lumistry contacts are excluded from the contact picker.

Maps generates fictional places on a neighborhood map with streets, parks and a river. Drag to pan, use the zoom controls, or focus the map and use arrow keys. Search and category filters narrow the pins and place shelf; selecting a pin opens a detail sheet. Save favourites, share a place or add a plan to Timeline from their separate editors. **Route** draws a schematic line from the map center. Positions and routes are illustrative, with no real geography, GPS or travel-distance calculation.

## Twitch

Browse **For You** and **Following** stream grids, follow channels, and open a stream with a player frame, channel details and live chat. Post messages and generate the next moment. **Generate a stream frame** uses the existing Camera image generation connection. **Your channel** and **Go live** open separate setup screens for your nickname, title and category. Continue or end your own stream from its watch screen.

Donations require Pocket Bank. A donation is debited only after a successful generated response is accepted. Failed responses and duplicate requests do not debit again. Generated viewer gifts to your own stream are bounded fictional wallet credits. Nothing connects to the actual Twitch service, moves money or inserts actions into the host transcript automatically.

## Stickers

The library uses a searchable thumbnail grid with a horizontal pack selector. **Browse packs** offers four bundled packs (199 images, including animations), plus custom collections you can create and rename. **Edit stickers** moves selected custom images between collections. Pack removal preserves already-sent messages. See the [sticker packs guide](sticker-packs.md). **Add stickers** opens a separate creation screen: generate a chibi sticker with the existing Camera connection, upload an image, or choose one from Gallery. A description is required for generation. Generated stickers show live previews where supported and wait for **Accept sticker**, **Retry generation** or **Discard sticker**. Gallery selections open a naming/review form before **Save sticker**. Custom previews offer **Edit sticker** for the name, description, caption and pack. A short caption is optional. The library stores stable Lumiverse image IDs. **Edit stickers** enables selection and batch deletion.

In Messages, choose **+ → Stickers** to open the thumbnail tray above the composer. Select a sticker to send it to the current conversation. The tray has no modal backdrop; chat remains visible. **Manage sticker library** opens the library.

Stickers use a small transparent message treatment and retain a readable description for the model. PNG/WebP uploads retain their original transparency; generated transparency depends on the configured image provider.

## Implementation and provenance

App concepts were reviewed from the supplied Phone-ST modules (`bank-ui`, `bank-protocol`, `birthday-ui`, currencies/picker, stickers, Twitch and web/quizzes). That project declares GPL-3.0. These Pocket modules are a new TypeScript implementation using Pocket/Spindle services; the ST host modules and separately licensed bank icon assets were not copied into this checkout.

The native boundary owns authenticated user scope, installation checks, permission changes, state locks, bounded normalization, stale-result rejection and cancellation. It reuses Pocket's generation settings, Camera, Gallery, message persistence and Timeline. No Lumiverse core changes or added dependencies are required.

## Verification

- `bun run test:native-apps` — wallet/currency/loan math, birthdays, tabs/quizzes, persistence isolation, private-page lifecycle, installation gates, donations, image/message boundaries and stale results.
- `bun run test:native-apps:browser` — controlled real frontend/backend fixtures at 390px and 900px widths, including Store installs, bank/tracker sync, calendar and place Timeline events, private browsing, quizzes, donations, a 25-sticker library, attachment-menu keyboard dismissal, sticker-tray sending and remount persistence.
- `bun run verify` — native regression suite, typecheck, live build and contracts.

Browser fixtures use synthetic data and mocked providers. They do not exercise live text or image providers or the user's personal account data.
