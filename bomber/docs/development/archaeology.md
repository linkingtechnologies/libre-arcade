# Bomber J2ME — archaeology notes

Baseline: original `Bomber.zip` supplied from SourceForge release 1.0.
SHA-256: `274c78e5b4060aaab52b6fc336fc16245566b9c0b66bde7532e0738f3840e560`.

The HTML5 port targets behavioral parity with `GameCanvasBomber.java`, not a generic Blitz clone.
Key preserved constants: 141 ms logical tick, 8 px block, 26 buildings, plane start (22,0), one active bomb, up to three destroyed blocks per impact, +1 score per destroyed block, and difficulty `1..(landings*3+8)`.

Original resource PNGs are intentionally not used by the public build while their individual provenance remains unresolved. They remain inside `reference/Bomber.zip` only.
