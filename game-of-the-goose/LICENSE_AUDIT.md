# License audit — restored static edition

The playable runtime has no npm, CDN, font, image, audio, Socket.IO, boardgame.io or other third-party runtime dependency.

The upstream project by Robert Riesebos declared `ISC` in its historical `package.json` but did not ship a standalone LICENSE file. The restored edition preserves that provenance in `UPSTREAM_NOTICE.md` and distributes the restoration under GPL-3.0-or-later.

Previously unresolved upstream SVG player assets and the unattributed `roll-a-die` source are not included in the restored runtime. Player pieces and event pictograms are newly drawn inline SVG primitives; dice are restoration-owned HTML/CSS. No quarantined upstream artwork is reused.

The complete unmodified upstream snapshot lives in `reference/game-of-the-goose-e8b804f/` and must not be confused with this clean runtime distribution.
