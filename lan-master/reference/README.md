# reference/: the original, untouched

Nothing in this folder is edited. It is what the game is checked against.

- `release/Lan_Master.nes`: the author's ROM, v1.09 of 14.06.11 (40,976 bytes: a 16-byte iNES header, 32 KiB of program, 8 KiB of character
  graphics; NROM, mapper 0). `release/notes.txt` is his own development notes.
- `source/`: the author's source, as he published it (NESASM 3 assembly, the compressed pictures, the character sheet and the music data).
  `tools/assemble.mjs` assembles it, and the result is **byte for byte** the ROM in `release/` (`test/reference.test.mjs` checks that on every run).
  The labels of the assembled source (where each routine and variable lives) are what the tests and the oracle read the ROM's memory by.
- `SHA256SUMS.txt`: the checksum of every file here. `SOURCE.md`: where the files came from, and what the author's two zips held that is not kept.

Both are Public Domain by the author's own words (see `../PROVENANCE.md`).
