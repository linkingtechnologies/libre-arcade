# reference/

What the port was compared with, and how to get it. **This directory holds no byte of the original**: the game's licence is a Creative
Commons Attribution grant whose version is not stated, the restoration package this port started from decided to keep the
original's media and source out of its distributable, and this collection kept that decision. What is here is the record.

- `SOURCE.md` says where the original comes from, what is known about its licence and what is not, and what was read.
- `ORIGINAL_SHA256.txt` lists, with sizes, the files of the original that were downloaded: the ten used to build and to check the oracle (the ROM
  `Zooming_Secretary.nes`, v1.02, 30.12.11, the author's notes `notes.txt` and eight files of his source: `game.c`, `npc.h`, `neslib.h`, `neslib.s`,
  `crt0.s`, `memmap.inc`, `nes.cfg`, `compile.bat`), and then the two archives of the Internet Archive's copy with the manual and the label that were read
  (names starting `ia/`).
- The restoration package's own metadata-only `reference/` is kept, unmodified, in `../docs/development/package/reference/`.

## Running the oracle

The oracle runs the ROM and needs it as a file. It is in the OpenEmu project's `OpenEmu-Update` repository, under
`Homebrew/NES/Zooming Secretary/` (`Zooming_Secretary.nes`, 40,976 bytes), and its SHA-256 must be the first line of
`ORIGINAL_SHA256.txt`; the oracle refuses any other file.

```sh
ZS_ROM=/path/to/Zooming_Secretary.nes npm run test:live
```

`npm test` does not need it: it replays a recording of what the ROM did (`test/fixtures/rom-oracle.json`, checksums of the game's
state after every iteration of its main loop), against the port.
