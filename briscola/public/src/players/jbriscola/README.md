# JBriscola AI — faithful port

This directory contains a faithful JavaScript port of the CPU implemented in
JBriscola 0.3.1 `GiocatoreHelperCpu.java`.

The original project is a Java port of wxBriscola and is dated to **2009** for
BriscoLab archaeological metadata. It is distributed under GPL-3.0. The analyzed source snapshot was supplied as `JBriscola-master.zip`
(commit `c271cd3b10c3a780fd8fe85c72916b9b267913bb`).

## Files

- `JBriscolaAI.js` — faithful CPU decision logic.
- `JBriscolaCard.js` — legacy 0..39 card encoding and `Carta.Compara` behavior.
- `JavaRandom.js` — minimal `java.util.Random` compatible generator.
- `JBriscolaAdapter.js` — BriscoLab integration layer.

## Important legacy behavior

The CPU hand is always sorted by the original `Carta.Compara` function before a
move is chosen. The adapter reproduces that ordering and maps the selected legacy
index back to the BriscoLab card ID.

When replying to a trump, the original code uses `rand.nextInt() % 10 < 5` before
trying to overtake it. This quirk is preserved. In another branch the random
integer is overwritten by a hand index before `% 10 < 5` is evaluated; that is
also preserved rather than corrected.

Original Italian method names are kept where useful for direct source comparison.
All BriscoLab adapter code, comments, tests and documentation are in English.
