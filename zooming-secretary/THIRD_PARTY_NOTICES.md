# Third-party notices

## Zooming Secretary, by Shiru and PinWizz

- **Authors.** Shiru (code, game design, sound and music, direction, some graphics) and Alexei "PinWizz" Bespalko (visual design, most
  of the graphics, the text messages, the label art). Testing: Gibson. Made in 2011 for the Nintendo Entertainment System; the version
  this port follows is v1.02 of 30 December 2011 (`reference/SOURCE.md`).
- **Licence of the original.** A Creative Commons Attribution licence whose version is not stated. The author's
  development notes say that the game was released under a Creative Commons licence because the two authors could not agree on public
  domain and on being credited. The release's manual ends its cover with "CC BY 2011 Alexei Bespalko and Shiru" and says in its
  introduction that the game is free of charge and "released under Creative Commons Attribution license"; the cartridge label says "CC BY
  2011 by PinWizz and Shiru". None of them gives a version, an address or the legal code (`reference/SOURCE.md`; the copy read is a third
  party's, the Internet Archive's). Nothing in this repository converts the grant into a particular version of CC BY, into the public
  domain, or into the GPL.
- **What is derived from the original, and under what terms.** `public/data/` holds the layouts of the eight stages (which cells are
  floor or ladder, where the phones, the filing cabinets, the coffee, the tables and the characters are, and the counts and times the
  stages use), written out as JavaScript from what the original's program does, with no tile art and none of its byte arrays. It is
  shared under the original's Creative Commons Attribution grant, attributed to the authors above, **not** relicensed as GPL
  (`public/data/LICENSE.txt`, `public/data/README.md`). The change made is that the layout is now JavaScript data. No endorsement by the
  authors is implied, and none of them has been asked.
- **What is not here.** The ROM, the graphics, the music and the sound effects, the manual and the label, the text of the fact messages,
  and the C and assembly source are not redistributed (`reference/README.md`). The page draws its own pictures and makes its sounds in
  the browser.
- **The name.** "Zooming Secretary" is used to say which game this is. The page's title is "Zooming Secretary — Libre Arcade
  Restoration", no logo of the original is used, and no claim is made to the name.

## The restoration package

`public/src/`, `public/web/` and `public/index.html` started as the port in the package
`zooming-secretary-1.0.0-rc9-m32-source.zip` (SHA-256 `1dcc94baede31bb4e14c66e7fcff99f03c1b068a2996d9e1266a3c3c1abd5ba6`), a browser
restoration written for Libre Arcade under the GPL-3.0-or-later, and were corrected here where the comparison with the ROM showed them to
differ (`specs/port-map.md`, `docs/development/CHANGES.md`). The package's documents, tests and fixtures are kept, unmodified, in
`docs/development/package/`.

## The oracle's tools

`tools/mos6502.mjs` and `tools/nes-machine.mjs` are a small 6502 core and a small NES that run the ROM for the executable oracle. They are
copies of the ones written for Lawn Mower's oracle (which started from Concentration Room's) and are GPL-3.0-or-later like the rest of the
code written for this collection. They contain nothing from any emulator.

## Sound effects that are not used

Shiru's 2019 OpenGameArt collection "NES 8-bit sound effects" says that it contains effects taken from several of his freeware games,
this one among them, to be taken under CC0 or CC BY 3.0. This port does not use it.
