# GNOME Gnect / Velena hybrid controller

## Historical source

M18 follows `ia_compute_move()` in GNOME Games 2.8.3 Gnect's GPL-released Velena adaptation (`reference/gnome-gnect-velena/src/ia_main.c`). That function is a controller rather than one search algorithm: it handles prescribed opening replies, immediate tactics, opening-book lookup, proof-number attack, a defensive proof attempt and finally `look_ahed()`.

## Browser mapping

The common-contract adapter preserves that cascade with components already independently tested in M15 and M17:

1. historical empty-board and one-ply opening replies;
2. immediate win and compulsory block;
3. bounded proof-number attack;
4. bounded opponent proof search after every legal candidate;
5. GNOME's group/threat lookahead as seeded fallback;
6. center-first safe override when the tactical choice fails defensive screening.

Effort 1/2/3 maps respectively to PN budgets 250/1,000/2,800, tactical depths 2/3/4 and defensive budgets 100/250/500.

## Deliberate differences

The binary opening-book data loaded by historical Gnect is not present in the preserved source package, so M18 does not synthesize or mislabel a replacement. The full nine-rule Velena oracle and graph deduplication are also outside this bounded browser controller. M18 is therefore named **GNOME Velena Hybrid**, not complete Velena, perfect play or an original eighteenth historical engine.

## Verification

The historical opening branches are tested exactly, while the immediate tactics, tactical evaluator and proof-number engine retain their native C parity suites. M18 adds seeded cascade replay, defensive-screen execution, legal-move checks, invalid-profile checks and the deterministic 18-player Arena test.
