# reference/

The historical material behind this game is kept light and reproducible, not as a copy of the whole archive.

- `ConcentrationRoom-0.02/SOURCE.md` says where the archive comes from (the author's site, the Internet Archive's snapshot of it, and the first commit of the author's repository), gives the size and SHA-256 of the zip and of the ROM, the licence and the evidence for it, and says what is kept and what is not.
- `ConcentrationRoom-0.02/ARCHIVE_SHA256.txt` lists all 39 files of the archive with their SHA-256.
- `ConcentrationRoom-0.02/source/` keeps, unmodified, the 6502 assembly sources, the headers, the packed data, the build files, the Python tools, the licence text and the author's notes: everything in the archive that is text or data of the program.
- `ConcentrationRoom-0.02/release/croom.nes` is the release ROM. It is kept because it is what the executable oracle (`tools/rom-oracle.mjs`) runs, and because the author's licence allows exact copies of it ("in iNES or UNIF executable form without source code"). The ROM cannot be rebuilt in this repository's environment (no `ca65`, no `ld65`).
- The zip itself and the three illustrations of the author's documentation are not redistributed. The two tile atlases of the archive are byte for byte the files in `public/assets/original/`, where the game needs them; `CHECKSUMS.txt` and `ARCHIVE_SHA256.txt` show it.
