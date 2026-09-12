# Archaeology notes

## Audited releases

Yanoid `0.3.0` is the primary historical artifact and gameplay target. Yanoid `0.3.5` is the last published upstream release and was used to identify post-contest changes.

The 0.3.0 archive was downloaded from SourceForge and its SHA-256 verified independently before extraction; the verified tree is preserved under `reference/yanoid-0.3.0/`, minus ten specific files with genuinely unresolved or third-party-reused provenance (see `THIRD_PARTY_NOTICES.md`). Neither raw tarball is redistributed, and 0.3.5 is not extracted at all — its SourceForge location and SHA-256 are recorded in `reference/README.md` and `reference/UPSTREAM_SHA256SUMS` for independent verification.

## Licensing conclusion

The audited Yanoid README and C/C++ source headers state that the program may be redistributed and/or modified under GPL version 2 **or, at the recipient's option, any later version**. The web port is therefore distributed under GPL-3.0-or-later.

Two third-party code areas in 0.3.0 had insufficiently precise license notes in historical `CREDITS`: SDL_Console and pixel collision code attributed to libsge. The web port copies neither. The console is not needed, and collision behavior is reimplemented from the audited bounding-box semantics.

The historical `CREDITS` also listed menu/console fonts as originating with SDL_Console. Those fonts are neither used nor redistributed. Historical music and third-party WAV files are likewise excluded; Web Audio synthesizes replacement effects and new music.

Selected gameplay graphics used by the browser port were separated during the audit from the specifically credited third-party fonts/audio/code. The runtime uses only that selected artwork plus newly authored presentation assets; the full preserved reference tree is broader (see `reference/README.md`) but the ten specifically ambiguous files are physically absent from it too.

## Contest vs later development

The audited 0.3.0 materials identify that release as the contest entry prepared through 1 December 2001. Comparison with 0.3.5 showed later additions including the bonus map, ball-speed power-ups, animation work and a replacement console. Those are deliberately excluded from the initial web parity target.
