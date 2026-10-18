# Lawn Mower v1.12 source record

- Archive: `lawn_mower_src.zip`, 263,681 bytes, 30 files in 34 entries, SHA-256 `8986e2057ad0ef3ccc2ab8bb39c9c54819ff402980b3468efde89da15a5d9dd5`, MD5 `5928c65eb48429e8f61fd9b85bed5680`, SHA-1 `43169bc9f6614ae6810a8e7fb80a74ebba59baa9`. It was supplied inside the restoration package this game was integrated from, as `reference/source-v1.12/source-original.zip`; its 30 files were extracted and hashed (`ARCHIVE_SHA256.txt`), and every file kept here is byte for byte a file of the archive (`CHECKSUMS.txt` against `ARCHIVE_SHA256.txt`).
- Version: the source's own string is `Lawn Mower v1.12 01.07.11` (`game.asm`, dated 1 July 2011). The competition ROM, made a month earlier, says `v1.1 30.05.11` (`../competition/`). The source is a later revision of the same game; where the two differ in what the game does, `../../tools/rom-oracle.mjs` says exactly where (one place, the pad in the no-control path).
- Author: Shiru (shiru@mail.ru), "05'11" (May 2011) in the headers of `game.asm` and `famitone.asm`, revised until 1 July 2011. Everything in the game was made by Shiru (the competition entry form says so); the music tracker files and the level editor are his as well.
- Origin: the Internet Archive item <https://archive.org/details/lawn_mower> (uploaded on 3 April 2017, "Nes homebrew game ROM and source code. Retrieved from: https://shiru.untergrund.net/software.shtml") lists a file `lawn_mower_src.zip` of 263,681 bytes with MD5 `5928c65eb48429e8f61fd9b85bed5680` and SHA-1 `43169bc9f6614ae6810a8e7fb80a74ebba59baa9`. **Those three values are the supplied archive's: it is byte for byte the file that item serves.** They were read from the item's metadata (<https://archive.org/metadata/lawn_mower>) on 12 October 2026; the file was not downloaded. The author's page (`shiru.untergrund.net/software.shtml`) did not answer on that day (connection refused), so the original address was not read.

## Licence

`game.asm` line 4: "The game and its source code are released into Public Domain". `famitone.asm` line 4 (FamiTone v1.23, also by Shiru): "Feel free to do anything you want with this code, consider it Public Domain". Both were read in the files themselves. Two further statements agree with them and are not the author's: the Internet Archive item carries the licence URL <http://creativecommons.org/publicdomain/zero/1.0/> (CC0 1.0), and the list of homebrew whose authors allow everyone to reproduce and sell them, in a post by tepples of 20 August 2013 (<https://forums.nesdev.org/viewtopic.php?f=22&t=10404>), has "Lawn Mower (by Shiru, CC0)". The other files of the archive carry no header of their own; the statement of `game.asm` is for "the game and its source code", and they are its source.

## Preserved here, unmodified

The assembler sources (`game.asm`, `controller.asm`, `palette.asm`, `rle.asm`, `title.asm`, `famitone.asm`, `sounds.asm`, `bgm_*.asm`), `compile.bat`, the three binary inputs of the assembly (`patterns.chr`, 8,192 bytes, which is the cartridge's character memory and holds the ten levels; `title.rle` and `done.rle`, the two packed screens), `editor/levels.bin` (the levels in the editor's format), and the text sources of the level editor (`editor/src/Project1.cpp`, `Unit1.cpp`, `Unit1.h`). `CHECKSUMS.txt` lists their SHA-256 (check with `sha256sum -c CHECKSUMS.txt` from inside this folder). The files are kept byte for byte; `.gitattributes` turns line-ending normalisation off for them.

## Not preserved

What is kept and what is not is the choice of this repository, not a property of the archive.

- `lawn_mower_src.zip` itself, 264 KB.
- `editor/editor.exe` (469,504 bytes, a Windows program), the C++ Builder project and form files (`Project1.bdsproj`, `Project1.bdsproj.local`, `Project1.res`, `Unit1.dfm`), `editor/src/tileset.bmp` and `editor/patterns.chr` (the same bytes as `patterns.chr`).
- The two FamiTracker projects `sound/lawn_mower.ftm` and `sound/sounds.ftm` (41,303 and 4,964 bytes): the music and the effects are in the sources as the `bgm_*.asm` and `sounds.asm` exports, which is the form the game uses.

The archive can be checked again against the Internet Archive's metadata:

```sh
curl -s https://archive.org/metadata/lawn_mower | node -e "const m=JSON.parse(require('fs').readFileSync(0,'utf8')).files.find(f=>f.name==='lawn_mower_src.zip');console.log(m.size,m.md5,m.sha1)"
# 263681 5928c65eb48429e8f61fd9b85bed5680 43169bc9f6614ae6810a8e7fb80a74ebba59baa9
```

## How the ROM was built, and what was done here

`compile.bat` runs `..\nesasm.exe game.asm` (NESASM 3 by the author's note in `game.asm`); the assembler is not in the archive and cannot be run here. `../../tools/assemble.mjs` is a small assembler for the subset of NESASM that the source uses, ported from the verification assembler of the restoration package (which was in Python and could not be run here). It reproduces the package's two verification ROMs byte for byte (`../../test/assemble.test.js`). **What it builds is not the author's binary and is not offered as provenance**: the exact output of NESASM 3.1 has not been reproduced. Assembled with the origin the competition ROM has ($8000) it differs from that ROM in 7,638 bytes of the program (the author's cleanup moved most of the code when a loop was inlined) and is identical in the character memory. The author's own build of this source is in `../release-v1.12/` (it starts at $C000, as the source has it): the assembly made here differs from it in 7,013 of the 16,384 bytes of program, and is identical in the character memory. The assembler of Lan Master, which has the zero-page rule of NESASM that this one lacks, builds the source into that ROM byte for byte (checked on 18 October 2026; see `../../PROVENANCE.md`).
