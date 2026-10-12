# Third-party notices

## Lawn Mower and FamiTone, by Shiru

- Author: Shiru (shiru@mail.ru), 2011. The whole game is his: the program, the graphics, the levels, the music and the sound effects (the competition entry form says "Everything made by Shiru"; testers: Alone Coder, B00daW, Pinball Wizzard). The music routines are his FamiTone audio library, version 1.23, "the name is suggested by Memblers from NesDev".
- Release ported: Lawn Mower, a game for the Nintendo Entertainment System (an NROM-128 cartridge: 16 KiB of program, 8 KiB of graphics), made for the NintendoAge NES Coding Competition 2011. Three things are kept in `reference/`: the competition ROM `Lawn_Mower.nes` (v1.1, 30 May 2011, 24,592 bytes, SHA-256 `942f36376246dbdff99a0b94aad930b2cccf1f534e5390468ac9c0d50752d7dd`); the author's own build of v1.12, `release-v1.12/Lawn_Mower.nes` (24,592 bytes, SHA-256 `181ef3ff1769a85ae98736e02809e65e5d758b453ebb43ec4b9fe60c93ad224c`, from the Internet Archive's `lawn_mower.zip`, whose MD5 and size equal what the item lists); and the assembler source of the later revision v1.12 (1 July 2011), whose archive is byte for byte the Internet Archive's `lawn_mower_src.zip` (SHA-256 `8986e2057ad0ef3ccc2ab8bb39c9c54819ff402980b3468efde89da15a5d9dd5`).
- Licence: Public Domain, in the author's words. `game.asm` says "The game and its source code are released into Public Domain", and `famitone.asm` says "Feel free to do anything you want with this code, consider it Public Domain". Both were read in the files. Two statements that are not the author's agree: the Internet Archive item carries the CC0 1.0 licence URL, and the NESdev forum's list of homebrew that anyone may reproduce and sell has "Lawn Mower (by Shiru, CC0)". `reference/source-v1.12/SOURCE.md` has the details.
- What is not covered by that evidence: the author's manual (`manual.pdf`) and the cartridge label (`label.png`) of the competition archive have their own wording, which could not be read here (the manual's text is in embedded fonts). Neither is redistributed.
- Licence of this port: GNU General Public License, version 3 or later, for the code written for it. A public-domain original can be ported under any licence; GPL-3.0-or-later is the collection's.

The JavaScript game logic in `public/src/` (`kernel.js`, `session.js`, `ppu.js`, `display.js`, `rng.js`, `constants.js`) is a port of `game.asm`, `title.asm`, `palette.asm`, `controller.asm` and `rle.asm`; the sound player (`famitone-player.js`, `audio-engine.js`) of `famitone.asm`. `specs/port-map.md` lists the source behind each module and how each was checked.

## Data taken from the original

Every table of the port was found, byte for byte, in the competition ROM by `test/rom-data.test.js`: the ten levels (`levels-data.js`, from the 95-byte records in the character memory), the tile table, the palettes, the two messages, the status bar, the mower's sprites, the fade table, the note table, and the two packed screens. `public/assets/patterns.chr` (the 8 KiB of graphics, which also hold the levels), `title.rle` and `done.rle` are the archive's own files, byte for byte (`test/reference.test.js`). `public/src/famitone-data.js` is the seven FamiTracker export files of the archive assembled one after the other (`test/famitone-data.test.js` assembles them again). The colours of the screen are a table of RGB values chosen for this port: the console's colours differ between displays (the author's notes say the same), so they are not the original's.

## Audio

No audio file is bundled. The sound is the original's music and effects, played by a JavaScript port of the FamiTone player that is run against the ROM's own player (the 11 bytes it hands to the sound chip are compared at every frame), and then synthesised in the browser with Web Audio. Web Audio approximates the timbre of the NES sound chip; it is not an emulation of it.

## Browser shell

The page, the information panel, the touch controls, the saved language and sound setting, the Italian text and the way a press of START is held are new code of this port. The interface uses the system font stack and no external fonts, scripts or media. The only external request is the analytics beacon described in the collection's root `AGENTS.md`.

## Tools

`tools/assemble.mjs` is a port, to JavaScript, of the verification assembler (`docs/development/mini_nesasm_verifier.py`) of the restoration package this game came with. `tools/mos6502.mjs` and the machine of `tools/nes-machine.mjs` are copies, adapted, of those written for Concentration Room's oracle. None of these is part of the deployed game.
