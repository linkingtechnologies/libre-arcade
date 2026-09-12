# Archaeology record

## Preserved input

File: `donkey-bolonkey_2001.orig.tar.gz`

SHA-256: `1119fa1caa17fb208ad7cf3b8260acfa54e74a49de82fca0e750547a7f2b1ecf`

The archive SHA-256 is preserved in the project record. The full laboratory package keeps the byte-for-byte archive under `/reference/archive`; the repo-safe public package intentionally omits that tarball. The historical source is unpacked under `/reference/dkbk` in both packages.

Despite the Debian upstream version label `2001`, file timestamps and changelog history show that this snapshot includes post-SpeedHack maintenance through 2003. It should therefore be described as a historical 2001–2003 upstream snapshot, not as a verified byte-identical copy of the original January 2001 contest submission.

## Source lineage

The historical C source explicitly states GPL version 2 **or any later version**. This is sufficient for a GPLv3 derivative without relying on the later MIT relicensing.

The six level matrices in `/public/src/core/levels.js` are a mechanical transcription of `/reference/dkbk/levels.h`.

Milestones 2–3 additionally use the following historical modules as behavioral specifications:

- `level.c` — exit doors and funnel geometry;
- `donkey.c` — death-donkey timing, crusher handoff and alarms;
- `crusher.c` — crusher placement and lamp timing;
- `particle.c` — particle equations, chains, limits and draw split;
- `player.c` — counter progression, game-over/retry behavior;
- `main.c` — update/draw ordering and title → game → credits → hi-score flow;
- `title.c` — warning, controls, credits and title animation timing;
- `banner.c` — five-banner cycle and interference/collapse timing;
- `hiscore.c` — table defaults, insertion rule and name editing.

## Preservation boundary

Faithfully preserved/ported: 16×9 topology and bit flags, six level parameter sets, 60 Hz model, ordered exit-hand logic, donkey spawn/movement ordering, bubble/trap exchange model, scoring table, counters/progression, door state timing, funnel calculation, crusher placement semantics, death trajectory timing, alarm timing and particle equations/cadence.

Reconstructed/adapted: runtime graphics, responsive shell, touch controls and tap navigation, previous-bubble convenience control, mobile high-score text entry, bilingual text, localStorage persistence, accessibility announcements, procedural title/banner/crusher/gates/particles and renderer-only visual jitter.
