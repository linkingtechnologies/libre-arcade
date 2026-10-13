# MilCity M3 — parity core

Baseline: MilCity Blue 1.0.5.

## Implemented in M3

- `java.util.Random` compatible 48-bit LCG for deterministic QA, verified against OpenJDK vectors.
- Random-walk terrain rewritten to follow the historical `RandomWalker` blocked/unblocked behaviour more closely.
- Runtime grid now uses original MilCity cell IDs (4–27) instead of building IDs, making Spy discovery semantics faithful.
- Shield semantics corrected: protected cells appear to the attacker as a normal miss and protection expires after 60 seconds.
- Spy discovers construction/building cells and shielded cells while preserving already-hit/destroyed status.
- Hit/destroy scoring verified: +10 first hit, then +10 per destroyed building cell.
- Human-vs-AI playable harness with all nine buildings, six weapons and Easy/Medium/Hard/Madness opponent selection.
- Power Plant fixed-time blackout construction retained.

## Determinism note

MilCity 1.0.5 repeatedly calls `new java.util.Random()` with implicit time-based seeds. Therefore there is no single historical seed that can replay a normal 2011 match bit-for-bit. M3's QA mode uses the exact Java RNG algorithm but injects explicit seeds and derives substreams. This preserves Java random-number semantics while making parity tests reproducible.

## Not yet claimed

- pixel/visual parity with the J2ME GUI;
- exact wall-clock interleaving between the original AI thread and GUI/game thread;
- Bluetooth parity;
- redistribution clearance for the three original PNG assets.
