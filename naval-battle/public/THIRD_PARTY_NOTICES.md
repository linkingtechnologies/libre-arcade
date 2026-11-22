# Third-party notices

## Bataille Navale 1.0 / AmigaOS4 port (2009)

An unmodified preservation copy supplied for archaeology is stored under:

`reference/bataille-navale-os4-2009/bataillenavale.lha`

The archive identifies billux13 for concept/code and Hugues Nouvel (HunoPPC) for the AmigaOS4 port, and includes the GNU GPL version 3 license text.

BattleLab's `os4-2009-reconstructed.js` is explicitly a reconstruction from binary/debug archaeology, not a claim that the missing original C source was recovered.

## Warboats 0.51-ascii (2009)

Warboats was written by Trevor Chart. BattleLab preserves the user-supplied historical archive at:

`reference/warboats-0.51/warboats-0.51-ascii.tar.gz`

SHA-256: `a6e09b4b291621c47b449810fe49b8880a86277e9135263a4d59e72149dac174`

The headers in `AI.c` and `engine.c` grant GNU GPL version 2 or, at the recipient's option, any later version. BattleLab's `src/players/warboats-2009.js` is a JavaScript derivative of the AI logic and is distributed under GNU GPL version 3.

The deterministic BattleLab PRNG replaces platform-specific libc `rand()`; the original Warboats `RNG()` range-mapping formula is retained.
