# UI v0.12 — offline board pack

## Goal

Remove every runtime dependency on remote board artwork while preserving the
historical source ledger separately from the browser presentation.

## Runtime artwork

The game now loads board images only from the repository:

- `assets/boards/local/ganzenbord-pd-local.svg`
- `assets/boards/local/ganzenbordspel-local.svg`

These files are **project-local runtime renderings**. They are not presented as
the checksum-identical Wikimedia originals.

The historical originals remain documented in `/reference` and can be fetched
into `assets/boards/original/` with `scripts/fetch-original-boards.sh` from a
normal networked checkout.

## Separation of concerns

- historical source = provenance/reference;
- runtime board image = local presentation asset;
- square geometry = `data/board-layouts/*.json`;
- gameplay semantics = core/rules.

Changing or replacing a board image cannot change a game result.

## Offline contract

No `http://` or `https://` URL is allowed in the runtime roots (`index.html`,
`src/`, `data/`). Remote URLs may appear in documentation, provenance and the
optional acquisition script only.
