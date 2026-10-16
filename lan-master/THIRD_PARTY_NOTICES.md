# Third-party notices

## Lan Master, by Shiru

- **Author.** Shiru (code, game design, graphics, sound and music, level editor, manual and label). Made between November 2010 and the
  spring of 2011 for the Nintendo Entertainment System; the version this restoration follows is **v1.09 of 14 June 2011**, the ROM's own
  version string (`reference/SOURCE.md`). The author's notes thank those who tested it on a console: 0xabad1dea, who suggested different
  palettes for the levels (they were tried and removed), mbrenaman, who reported the ending screen and the missing part of the cursor on
  real hardware, and rainwarrior, who found the bug in entering the pause and provided its fix in 2015. The manual's credits name Gibson, 0xabad1dea, Brad,
  Alone Coder and mbrenaman as testers.
- **Licence of the original.** Public Domain, in the author's own words. The first lines of `reference/source/game.asm` say "The game and
  its source code are released into Public Domain". Nothing in this repository changes that, and nothing restricts what anyone does with
  the ROM, the source or the data taken from them.
- **What of it is here.** The ROM and the author's development notes (`reference/release/`), the source files that the build uses
  (`reference/source/`: the NESASM assembly, the compressed pictures of the screens, the character sheet, the data of the music), and,
  in `public/src/`, the data that the page needs: the 50 levels, the 49 passcodes, the character sheet, the pictures and palettes, and the
  data of the music and of the sound effects (the bytes of the ROM, as JavaScript). They are the author's, unchanged.
- **What is not here.** The manual (`manual.pdf`), the two box labels, the level editor and the FamiTracker projects of the author's two
  zips are not redistributed, and `reference/SOURCE.md` lists them with their checksums. The manual and the labels were read: the manual's cover
  says "PD 2011 Shiru", its introduction says that the game is "released into Public Domain" and free of charge, and both labels say "PD Shiru 2011".
- **The name.** "Lan Master" is the name the author gave to his game, and is used to say which game this is; the page's title says it is
  a restoration. No claim is made to the name.

## FamiTone v1.24, by Shiru

The sound library of the game. The first lines of `reference/source/famitone.asm` say that it was made by Shiru in June 2011, and "Feel
free to do anything you want with this code, consider it Public Domain". `public/src/famitone.js` is a translation to JavaScript of the
parts of the library that the game uses (the music player, the sound effects and the samples), written by the restoration package and
corrected here; the data it plays is the ROM's. The file is GPL-3.0-or-later like the rest of the page's code, and the library it translates is Public Domain.

## The restoration package

`public/index.html` and the files of `public/src/` other than the data started as the page in the package
`lan-master-1.0.1-m16-source.zip` (SHA-256 `7c11e72a8b3fd16f91b5a229315143909e2e87a75c573bdd90480e171ce70388`), a browser restoration written
for Libre Arcade under the GPL-3.0-or-later, and were corrected here where the comparison with the ROM showed them to differ
(`specs/port-map.md`, `docs/development/CHANGES.md`). The package's documents, tests and data are kept, unmodified, in
`docs/development/package/`; its own notice, which says the same of the original (Public Domain), is there too.

## The oracle's tools

`tools/mos6502.mjs` and `tools/nes-machine.mjs` are a small 6502 core and a small NES that run the ROM for the executable oracle. They are
copies of the ones written for Zooming Secretary's and Lawn Mower's oracles (which started from Concentration Room's), extended here (the PAL
console is one of the additions), and are GPL-3.0-or-later like the rest of the code written for this collection. They contain nothing from
any emulator. `tools/assemble.mjs` is a small assembler for the NESASM syntax that the author's source uses, copied from Lawn Mower's, which
was a port of the verification assembler that came with that game's restoration package: it assembles the author's source into the same
bytes as his ROM, which `test/reference.test.mjs` checks. The author's own assembler is not in his archive.
