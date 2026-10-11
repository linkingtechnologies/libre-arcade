# Third-party notices

## Concentration Room 0.02, by Damian Yerrick

- Author: Damian Yerrick ("Pin Eight"), "Copyright (C) 2010". The program is credited to him, and the graphics to him and to Sara Crickard.
- Release ported: Concentration Room 0.02, a game for the Nintendo Entertainment System (an NROM-128 cartridge: 16 KiB of program, 8 KiB of graphics). The archive `ConcentrationRoom-0.02.zip` (100,162 bytes, SHA-256 `0e9773924b5d8b53d727f3359b62f3730ec95f139d64242236cb9ec28f871566`) holds the 6502 assembly sources, the build files, the two tile atlases and the release ROM `croom.nes` (24,592 bytes, SHA-256 `6a43202f8b7793f78832c47b67ca3aeb12165140a1e38f0a5043855b2e3d53cd`).
- Licence: GNU General Public License, version 3 or, at the recipient's option, any later version. The evidence is the "Legal" section of the archive's `README.html` ("version 3 or later") and the header of nine of the assembly files ("either version 3 of the License, or (at your option) any later version"). The other files of the archive (`bcd.s`, `pads.s`, `unpkb.s`, `musicseq.s`, the headers, the makefile, the linker script and the Python tools) carry the all-permissive notice "Copying and distribution of this file, with or without modification, are permitted in any medium without royalty provided the copyright notice and this notice are preserved".
- Special exception, from the same page: "you may copy and distribute exact copies of the program, as published by Damian Yerrick, in iNES or UNIF executable form without source code". That is why the release ROM is kept here unmodified, next to the sources, for the executable oracle.
- Licence of this port: GNU General Public License, version 3 or later, which the grant above permits.

The JavaScript game logic in `public/src/` (rules, the generator and the deal, the frame state machine, the CPU player, the pad model, the story tables) is a port of `memorygame.s`, `shuffle.s`, `aidiocy.s`, `pads.s`, `drawcards.s`, `litemain.s`, `litetitle.s` and `liteopponents.s`. `specs/port-map.md` lists the source file behind each module and how each was checked.

The original's own notes (`README.html`) say the logo lettering uses the font Wasted Collection as a design source, and that the bitmap font of the menus is based on Susan Kare's Chicago, by way of the "Who's Cuter" demo. No font file is redistributed, but the tile atlas `public/assets/original/gamegfx.png` and the title atlas contain bitmap letters drawn from those designs; the archive gives them no separate licence, and the game cannot draw its text without them. See `PROVENANCE.md`.

## Graphics

`public/assets/original/gamegfx.png` and `titlegfx.png` are byte for byte the archive's `tilesets/gamegfx.png` and `tilesets/titlegfx.png`; the game draws its cards, symbols, score boxes, arrow and title from them. The images under `public/assets/derived/` (the five opponents, the Hombon logo sprites and the title screen) are frames that the preserved ROM itself draws (the ROM is run on a minimal NES and its own routines are called), composed by `tools/render-assets.mjs`, without the text, which the page types over them. The three illustrations of the original's documentation (`docs/Hombon_logo.png`, `croomlogo320.png`, `croom_screenshot01.png`) are not redistributed. No AI-generated replacement art is used.

## Audio

No audio file is bundled. Sound and music are synthesised in the browser from the notes, timings and triggers of `sound.s`, `music.s` and `musicseq.s` (the sequence data carries the all-permissive notice above). Web Audio approximates the timbre of the NES sound chip; it is not an emulation of it.

## Text

The English text of the story, the opponents' lines and the instruction screens is the text of `litetitle.s` and `liteopponents.s`; every line of it was found in the release ROM (see `specs/port-map.md`). The Italian text is a translation made for Libre Arcade and is not the author's.

## Browser shell

The pages, the Help and Credits dialogs, the saved language and difficulty, the responsive scaling, the mouse and touch input and the "Continue" button for passing a shared device are new code of this port. The interface uses the system font stack and no external fonts, scripts or media. The only external request is the analytics beacon described in the collection's root `AGENTS.md`.
