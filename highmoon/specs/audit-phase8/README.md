# HighMoon M8 asset review — public deployment boundary

There is no independently confirmed usable **historical visual or audio asset** in this M8 public port. The original author claims authorship of the *game* in `AUTHORS`, the original software `COPYING` and headers specify GPL, and package maintainers list the complete old release as GPL; none of those alone resolves the source and license of every earlier third-party image or sound. No pixel/PCM extract from the TAR was imported into the new game.

`ASSET_REVIEW.csv` lists every historical gfx/snd file from the exact user-provided 1.2.4 TAR with its SHA-256, category, source-evidence status, and public policy. An unknown copyright status is **not** a conclusion that an asset is infringing or forbidden: it marks a missing proof for our chosen GPLv3 public-reuse standard.

The visual M8 work is entirely new Canvas source in `public/src/presentation-art.js`. Upstream source files and docs remain byte-identical in the public reference. The full historical TAR/graphics/audio stay in the separate original archival package provided in the prior handoff, outside GitHub Pages.

Remaining potential reopening path: obtain express file-specific permission/provenance (e.g. author response or reliably attributable original project asset grant), record exact evidence and license compatibility, then update `ASSET_REVIEW.csv` and add only cleared files with attribution. The current public package does not require this reopening.
