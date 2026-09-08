# Pocket v14 validation

Performed in this container:

- `node --check tests/contracts.mjs` ✅
- TypeScript syntax parse (`typescript.transpileModule`) for all touched TS files ✅
- `tsc --noEmit` comparison against the v13 baseline:
  - v13: 23 diagnostics
  - v14: 23 diagnostics
  - normalized diagnostic sets: identical ✅
  - all diagnostics are the existing missing-local-`lumiverse-spindle-types` / derivative implicit-any baseline in this environment.

Not runnable here:

- `bun run verify` — Bun is not installed in this container.
- Full JSDOM contract execution — `jsdom` is not installed in this container.

New local contracts are designed to prove:

1. one no-tool `<lumi-phone action="message_batch">` can create/ensure a missing GC;
2. seven authored messages persist as seven ordinary `PhoneMessage`s;
3. all batch messages keep host-message/swipe provenance;
4. `Shōto Todoroki` and `Shoto Todoroki` resolve to one lightweight actor identity;
5. the raw fallback tag is replaced by one durable inline anchor;
6. the inline renderer shows the bounded seven-message riot as one coherent mini-chat surface.
