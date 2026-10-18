# Lawn Mower v1.12 release ROM record

- Archive: `lawn_mower.zip`, 751,619 bytes, 5 files, SHA-256 `af7378b522a7d11efd0306aebf15c193a2de31f5a7b130919699d4f1e7219f70`, MD5 `cbff8bb3935a963c087db4d4071d5c69`. The MD5 and the size are the ones the Internet Archive item <https://archive.org/details/lawn_mower> lists for `lawn_mower.zip`, so the download is that file. It was downloaded on 12 October 2026 from <https://archive.org/download/lawn_mower/lawn_mower.zip> (the Archive redirects to one of its own storage nodes; the first request was answered with HTTP 500, the second delivered the file), on the request of the person integrating this game, to compare it with the competition archive. The 5 files were extracted into a scratch folder, hashed (`ARCHIVE_SHA256.txt`) and nothing in them was run.
- ROM: `Lawn_Mower.nes`, 24,592 bytes, SHA-256 `181ef3ff1769a85ae98736e02809e65e5d758b453ebb43ec4b9fe60c93ad224c`. An iNES file whose 16-byte header is the competition ROM's (NROM-128, vertical mirroring). It carries the string `Lawn Mower v1.12 01.07.11` (at offset 8054 of the file), the version of the source in `../source-v1.12/`; its file in the zip is dated 30 June 2011, 23:05. It is an executable of v1.12; that it is the author's own build rests on the Archive's statement below and on the ROM carrying his version string and his game, not on a signature or a copy from his own site.
- Where the Archive says it comes from: the item is described as "Nes homebrew game ROM and source code. Retrieved from: https://shiru.untergrund.net/software.shtml", uploaded on 3 April 2017. The author's page did not answer on 12 October 2026, so whether this is the file it served was not checked.
- **Not the competition ROM.** The zip is not the competition archive (`../competition/`): its ROM is v1.12, not v1.1, and the two ROMs differ in 7,728 of the 16,384 bytes of program (the header and the graphics are identical), and start at different addresses ($8000 for v1.1, $C000 here). Of its other four files, `notes.txt` and `label_nes.png` are byte for byte the competition archive's `notes.txt` and `label.png`; `manual.pdf` (92,476 bytes) is not the competition archive's manual (91,571 bytes) and was not read; `label_fami.png` (398,540 bytes, dated 28 November 2014) is in no other archive here; `blurb.txt`, the entry form, is not in this one. So this download found no upstream copy of the v1.1 ROM: the competition ROM is still known only as the file supplied in the restoration package.
- Compared with the source assembled here (`../../tools/assemble.mjs`): the assembly of `../source-v1.12/` is the same game, but it is not this file. Both start at $C000, as the source has it; they differ in 7,013 of the 16,384 bytes of program (the graphics are identical) and the version string is at offset 8019 in the assembly against 8054 here, so the code is laid out differently; why was not known when this was written. It is now: assembled with the assembler of Lan Master (`../../../lan-master/tools/assemble.mjs`), which has the zero-page rule of NESASM that this folder's assembler lacks, the source is this file byte for byte (SHA-256 `181ef3ff1769a85ae98736e02809e65e5d758b453ebb43ec4b9fe60c93ad224c`, checked on 18 October 2026), so the source is the one the author built from and the difference was the assembler. That the oracle finds the two equal in what the game does, up to the set-up length below, is a result of running them, not of comparing bytes.

## What running it showed

The port was run against it by the oracle (`../../tools/lockstep.mjs`, flavour `v1.12-release`), as against the other two programs: the game's variables at every NMI, the picture unit's memories, the sound player's output and the picture. On 12 October 2026, two seeds and the five scenarios of `tools/oracle.mjs` at their long lengths: 455,176 frames in ten runs, 537 screens set up, 455,157 pictures compared, and the sound sweep; no difference.

There is one thing the port's table gets wrong for this build. The black screen while a lawn is loaded lasts a number of NMIs that the port takes from a table (`LEVEL_SETUP_FRAMES`: 10, 10, 10, then 9). In this build the loading of the **fifth lawn** takes **10** NMIs where the table says 9 on some entries (after the fourth lawn is cut: 10 in four of six games tried with the cheat player, 9 in the other two; and on some of the entries from the tank running dry on the fifth); no other set-up differed. The competition ROM and the assembled source took 9 every time. The set-up of a lawn is timed by the cycles of its code, and this build's code is laid out differently from the assembly made here, so a small difference in cycles is the likely reason; that was not measured. The comparison above lets the port take the ROM's length for each set-up (`follow`, on by default for this flavour) and reports the lengths that differ; `test/oracle-release-v1.12.test.js` allows only this one to differ. The page uses the table as it is, and so the black screen before the fifth lawn can be one sixtieth of a second shorter on the page than in this build.

## Licence

The evidence in `../source-v1.12/SOURCE.md` covers the game itself: "The game and its source code are released into Public Domain" (`game.asm` line 4), the Internet Archive item's CC0 licence URL, and the NESdev forum's list. This ROM is the game built from that source by its author. The zip's manual and labels carry their own wording, which was not read for this purpose (the manual is a PDF in embedded fonts, and is not the one read for the competition archive either), and are not redistributed.

## Preserved here, unmodified

`Lawn_Mower.nes`. `CHECKSUMS.txt` lists its SHA-256 (`sha256sum -c CHECKSUMS.txt` from inside this folder) and it matches `ARCHIVE_SHA256.txt`, which lists all 5 files of the zip. `.gitattributes` turns line-ending normalisation off for it.

## Not preserved

- `lawn_mower.zip` itself, 752 KB.
- `manual.pdf`, `label_nes.png` (also the competition archive's label), `label_fami.png`, and `notes.txt` (the same as `../competition/notes.txt`, kept there).

The download can be checked again against the Archive's metadata:

```sh
curl -s https://archive.org/metadata/lawn_mower | node -e "const m=JSON.parse(require('fs').readFileSync(0,'utf8')).files.find(f=>f.name==='lawn_mower.zip');console.log(m.size,m.md5)"
# 751619 cbff8bb3935a963c087db4d4071d5c69
```
