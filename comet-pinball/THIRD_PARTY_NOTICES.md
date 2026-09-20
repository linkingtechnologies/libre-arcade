# Third-party notices and redistribution review

## Browser game

HTML5/JavaScript restoration code and Canvas artwork / generated sound effects are distributed under Apache License 2.0 (`LICENSE`). The background track `assets/music/comet-loop.ogg` and its MP3 format conversion are declared CC0-1.0, reused from Mechanical Night Pinball; see `MUSIC-CREDITS.md` for provenance and source checksum and `ASSETS_LICENSE` for the full CC0 legal text. No font binaries from the original game are loaded by the browser port.

## Historical JAR — not included in the public first-commit package

The original shaded JAR was inspected and its byte identity recorded but is **not bundled here**. Code authored by the original developers is Apache-2.0; third-party shaded dependencies and embedded bitmap font atlases (`Nueva Std Cond`) carry separate, incompletely verified obligations. We have **not established** permission to redistribute this complete binary as-is in a public Git repository. See `JAR-LICENSE-REVIEW.md` and `reference/releases/README.md` for direct evidence, upstream download, hash and conditions for optional local oracle runs. Publishing a JAR in Git LFS or a release would still be redistribution.

`reference/audit/` and `reference/SHA256SUMS` retain unmodified provenance and original JAR fingerprints, not the original binary.
