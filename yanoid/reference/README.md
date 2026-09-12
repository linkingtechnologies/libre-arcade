# Historical reference manifest

`reference/yanoid-0.3.0/` is the extracted upstream source tree, verified
against the audited archive's own SHA-256 before being copied in — see
"Verification" below. **Ten specific binary files are physically omitted**
from that tree because their historical `CREDITS` entry is genuinely
unresolved (`"License: ? (Probably GPL, fill in)"`, never filled in) or
because they are third-party media reused from other GPL projects without a
per-file license/version pinned down. Nothing else is touched: the rest of
the source — including the SDL_Console code and the libsge-derived collision
fragment the audit calls out — is preserved exactly as shipped, under its
own original notices, for archaeology. See `THIRD_PARTY_NOTICES.md` for why
each omitted file was excluded.

## Verification

The archive was downloaded directly from SourceForge and its SHA-256 was
computed independently before extraction — it matches the value below
exactly:

- `yanoid-0.3.0.tar.gz` — SDL Game Development Contest 2001 submission,
  the authoritative gameplay target.
  - SourceForge: https://sourceforge.net/projects/yanoid/files/yanoid/yanoid-0.3.0/yanoid-0.3.0.tar.gz/download
  - SHA-256: `dc9c71d0f507aa8cdc86e9d830e656d78aab952bff772ff2487409487e49f5d1`
- `yanoid-0.3.5.tar.gz` — last published upstream release, used only to
  identify post-contest changes; not extracted or redistributed here.
  - SourceForge: https://sourceforge.net/projects/yanoid/files/yanoid/0.3.5/yanoid-0.3.5.tar.gz/download
  - SHA-256: `afa44924d13b10b9e20cd418cdd4d6f8101fb1448808144e514b0c5d5c787a90`

The same digests are recorded in `UPSTREAM_SHA256SUMS`. A full per-file
manifest of everything actually included under `reference/yanoid-0.3.0/`
is in `reference/yanoid-0.3.0.SHA256SUMS`.

## What is omitted, and why

Ten files are excluded from the extracted tree (full list and reasoning in
`THIRD_PARTY_NOTICES.md`):

- `data/graphics/fonts/ConsoleFont.png`, `LargeFont.png` — from SDL_Console,
  credited "Author: Garrett Banuk... License: ? (Probably GPL, fill in)".
- `data/music/yanoid.xm` — from the Plutonic demo group, marked GPL but
  with no version and no independent verification performed.
- `data/sounds/{fire,menu_choose,menu_move,peep,pop,powerup_bad,powerup_collect}.wav` —
  reused from gnibbles, defendguin, KDE, and EgoBoo, each marked "GPL" in
  Yanoid's own `CREDITS` with no version or per-file provenance pinned down.

The raw `.tar.gz` archives themselves are not redistributed either, since a
"byte-for-byte preserved" tarball would necessarily still contain the ten
omitted files inside it. Anyone who wants the complete original, including
those ten files, can fetch and verify it independently using the SHA-256
values above.

`reference/yanoid-0.3.5/` is not extracted or redistributed at all — it was
consulted only during the audit (see `specs/CONTEST_VS_035.md`) to identify
which features came after the contest and must stay out of Contest mode.

## Local archaeology workspace

For a private/local audit workspace, download the two upstream archives
yourself and keep the full, unredacted copies outside the committed tree.
Do not commit the ten omitted files back into this repository unless their
provenance is independently cleared file-by-file.
