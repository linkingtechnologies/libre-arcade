# Concentration Room 0.02 source record

- Archive: `ConcentrationRoom-0.02.zip`, 100,162 bytes, 39 files, SHA-256 `0e9773924b5d8b53d727f3359b62f3730ec95f139d64242236cb9ec28f871566`, supplied inside the restoration package as `reference/ConcentrationRoom-0.02.zip`. The 39 files it contains were extracted and hashed; the package's list of those hashes was checked against them and agrees, and every file kept here is byte for byte the file of the archive (`CHECKSUMS.txt` against `ARCHIVE_SHA256.txt`).
- Release ROM: `croom.nes`, 24,592 bytes, SHA-256 `6a43202f8b7793f78832c47b67ca3aeb12165140a1e38f0a5043855b2e3d53cd`. An iNES file: 16 KiB of program and 8 KiB of graphics, mapper 0 (NROM-128), vertical mirroring. The archive's own makefile says `version = 0.02`, and the ROM is dated 18 July 2010 inside the zip.
- Author: Damian Yerrick ("Pin Eight"), "Copyright (C) 2010". The program is credited to him and the graphics to him and to Sara Crickard.
- Origin: the project page <https://pineight.com/croom/> offers the archive at <https://pineight.com/croom/ConcentrationRoom-0.02.zip>. **The archive is byte for byte the file the author serves.** On 11 October 2026 the address answered HTTP 200 with `Content-Length: 100162` and `Last-Modified: Fri, 17 Aug 2018 00:34:43 GMT`, and the file downloaded into a folder outside the repository has the SHA-256 above (the same as the archive supplied in the package). The Internet Archive's snapshot of 15 September 2026 of the same address reports the same size.
- The author's repository, <https://github.com/pinobatch/croom-nes> ("Concentration Room, a card matching game for NES"), begins with a commit of 19 November 2016, `8cad6d65a0ddff7f9ec9b1fc38a89bcfe3ff43f6`, "import 0.02 + terriblegate fix". Its patch (read on 11 October 2026, not downloaded as a file) adds a `croom.nes` of 24,592 bytes and the sources, and its `blitCardSprites` in `drawcards.s` writes `PPUCTRL` before the sprite upload, where the 0.02 archive writes it after. That is the "Terriblegate" fix the restoration package describes in its notes (`docs/development/post-release-2016-terriblegate.patch`, a reconstruction of that one change). It touches a hardware detail and no rule of the game; the release ROM, which is what this repository runs, predates it. The same patch writes the table `card_palettes` with `.dbyt` where 0.02 has `.byt` (the same bytes). The other files of that commit were not compared with the archive.

## Licence

The archive's `README.html` says in its "Legal" section that "the accompanying program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License, version 3 or later", with a special exception for exact copies of the program in iNES or UNIF form without source. The headers of `aidiocy.s`, `drawcards.s`, `litemain.s`, `liteopponents.s`, `litetitle.s`, `memorygame.s`, `shuffle.s`, `music.s` and `sound.s` say "either version 3 of the License, or (at your option) any later version". `GPLv3.txt` is the licence text. The remaining files carry the all-permissive notice "Copying and distribution of this file, with or without modification, are permitted in any medium without royalty provided the copyright notice and this notice are preserved".

## Preserved here, unmodified

`source/` holds every text or data file of the archive except the two tile atlases (which are in `public/assets/original/`): the sources in `src/` (`.s`, `.h` and the two packed tables `.pkb`), `tools/` (the four Python helpers), the makefile, the linker script `NROM.ini`, `make-nt.bat`, `zip.in`, `README.html`, `GPLv3.txt`, and the author's `docs/TODO.txt`, `docs/diary.txt` and `docs/croom.css`. `release/croom.nes` is the ROM. `CHECKSUMS.txt` lists their SHA-256 (check with `sha256sum -c CHECKSUMS.txt` from inside this folder), and each matches `ARCHIVE_SHA256.txt`, which lists all 39 files of the archive. The files are kept byte for byte; `.gitattributes` turns line-ending normalisation off for them.

## Not preserved

What is kept and what is not is the choice of this repository, not a property of the archive.

- `ConcentrationRoom-0.02.zip` itself, 100 KB.
- The three illustrations of the author's documentation: `docs/Hombon_logo.png`, `docs/croomlogo320.png` and `docs/croom_screenshot01.png`.
- `tilesets/gamegfx.png` and `tilesets/titlegfx.png`, which the game uses: they are `public/assets/original/gamegfx.png` and `titlegfx.png`.

The archive can be fetched again and checked:

```sh
curl -L -o ConcentrationRoom-0.02.zip https://pineight.com/croom/ConcentrationRoom-0.02.zip
sha256sum ConcentrationRoom-0.02.zip     # 0e9773924b5d8b53d727f3359b62f3730ec95f139d64242236cb9ec28f871566
```

`ARCHIVE_SHA256.txt` then identifies each of the 39 files inside it.

## How the ROM was built

The makefile builds with `ca65` and `ld65` and runs every source file through the author's own `tools/shuffle.py` first, with `shufflemode = -r`. That tool permutes the blocks between `.shuffle` and `.endshuffle` (and the procedures between `--procs--` markers), to expose code that depends on an order it should not. Its options are `-f`/`--forward` ("shuffle all blocks in forward order"), `-r`/`--reverse` ("shuffle all blocks in reverse order") and a seed; without one it shuffles at random. **The release ROM has its `.shuffle` blocks in the reverse of the order in which they are written in the source.** Wherever the order of a block does not matter, nothing shows; where it does, the ROM, not the text of the source, is what the game did. The executable oracle found where it shows (the four direction handlers of `memorygame.s` run Right, Down, Left, Up, and only Right is skipped while a controller is handed over; see `specs/port-map.md`), and the variables of the ROM are at the addresses that this shuffling gave them.
