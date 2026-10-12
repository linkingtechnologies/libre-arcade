# docs/development/

What is kept here is the paperwork of the restoration package this game was integrated from (`Lawn_Mower_M9_RC6`, a JavaScript restoration of Shiru's Lawn Mower made in nine milestones and six release candidates by an earlier effort), and two tools of it. It is kept as history, not as a description of this folder's game: **where it differs from what is in this repository, this repository wins**, and the differences are the point of the changelog of the root.

- `PACKAGE-README.md`, `PACKAGE-CHANGELOG.md`: the package's own readme and its list of milestones (M1 to M9, RC2 to RC6).
- `M2_REPORT.md`: the comparison of the competition ROM v1.1 with the v1.12 source, done by reading and by an assembler that could not be run here. Its main findings stand and were re-checked by running both (one behavioural difference, in `checkPad`; the character memory and the ten levels are identical). Its claim that a derived ROM is "the same" as v1.12 is what `tools/assemble.mjs` can now reproduce byte for byte.
- `M3_REPORT.md`: the extraction of the levels and the rules (movement, fuel, the random generator, the 4-in-5 pacing) that the package's tests were written against. Two of its statements were corrected by its own later reading (the seed, and the pacing); the oracle added more (see the root `CHANGELOG.md`: what the comparison with the ROM found).
- `LEVEL_MAPS.md`: the ten levels drawn as text.
- `generate_famitone_data.py`: the Python script that made `public/src/famitone-data.js` from the author's exports. It could not be run here; `test/famitone-data.test.js` rebuilds the same data from the preserved sources with `tools/assemble.mjs` and compares.
- `mini_nesasm_verifier.py`: the Python assembler of the package, of which `tools/assemble.mjs` is a port. Kept so that the port can be read against it.

The package's other material (about 100 audit files: screenshots, reports of milestones M4 to RC6 and the tests that checked its own renderer against pictures its own scripts had drawn) is not kept. Its screenshot-based visual "oracles" were replaced by the comparison with the ROM's own pictures, which found places where the package's drawing was not the original's (the sprites' priority, the fade, the flash band of the message by two lines, and others).
