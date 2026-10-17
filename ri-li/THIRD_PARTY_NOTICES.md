# Third-party notices

## Ri-li 2.0.1, by Dominique Roux-Serret

- **Authors.** Dominique Roux-Serret: design, programming, graphics and the original website (`README` and `AUTHORS` of the source release: "Copyright (c) 2006"; the C++ headers carry dates from January 2006). Music:
  Maf464 (Charcosset B.). The game began in June 2006 (the first release, 1.0.0, is dated 23 June 2006 in the `NEWS` file) and version 2.0.1, the one that
  this folder follows, is dated 1 November 2007 there (the archive on SourceForge is dated 7 November 2007).
- **Licence of the original.** Every C++ file of the source release says: "This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as
  published by the Free Software Foundation; **either version 2 or version 3** of the License", and the `NEWS` of 2.0.1 says "License upgrade to 'GNU GPL Version 2 or Version 3'". It does not say "or any later version", so
  no later version is assumed. The archive's `COPYING` is the text of the GNU GPL version 3. This restoration uses the original under version 3 (the package it started from says the same); see `PROVENANCE.md`.
- **What of it is here.** The source archive, untouched (`reference/Ri-li-2.0.1.tar.bz2`, SHA-256 `f71ccc20c37c601358d963e087ac0d524de8c68e96df09c3aac1ae65edd38dbd`), which the oracle compiles. In `public/`: the 2,506 pictures of
  `assets/` (the frames of `sprites.dat`, decoded without loss, with their sizes and pivots in `data/sprites.json`), the 1,501 label pictures of `ui/` (the 79 pictures of each of the 19 `language.*` files: English and Italian as the package decoded them, the other 17 by `tools/extract-languages.mjs`), the 19 labels of the languages' names (`ui/lang/`, from `language.dat`),
  `data/levels.dat` (the 50 levels, as the original's file), and the sound (below). They are the author's, unchanged, and `tools/check-assets.mjs` checks the pictures against the original's files pixel for pixel.
- **The name.** "Ri-li" is the name the author gave to his game, and is used to say which game this is. No claim is made to the name.

## The music, by Maf464 (Charcosset B.)

`Sounds/menu.mod`, `jeu1.xm` and `jeu2.xm` of the source release are covered by `COPYING.Music`, which names "Copyright (c) 2006 - Maf464 - Charcosset B." and gives the GNU GPL version 3. The tracker originals are in the package's
`docs/development/package/reference/audio-original/` (and in the source archive). **`public/audio/menu.ogg`, `jeu1.ogg` and `jeu2.ogg` are derivatives of them** (the package made them for the browser; how, with what program and settings, is not
recorded anywhere that was found, and they were not compared with a rendering of the tracker files). They are under the same licence.

## The sound effects

The nine WAV files of `public/audio/` (`clic`, `crash`, `end`, `etire`, `live`, `lose`, `reduit`, `speed`, `wagon`) are byte for byte the ones in the source release's `Sounds/` (`test/reference.test.mjs` checks it against the copies the package kept, and they were compared by hand with the unpacked archive). The
source release does not say who made them, and no author is assigned here; they came in an archive whose headers and `COPYING` put the program under the GPL.

## Translations

The upstream `AUTHORS` thanks, for the translations and corrections of the 19 languages: Christian H. and Adrian F. (German), N. Y. (Japanese), David R. and David B.M. (Spanish), K. Tonnelle (Breton), V. Búr (Esperanto and Slovak), J. Jorge (Portuguese),
T. Gustavsson (Swedish), L. Serafinowski (Polish), R. Claudio and Bao (Italian), Mike (Russian), F. Doruk (Turkish), S. Etienne (Hungarian), W. Bas (Dutch), An and Sanggap (Korean), M. Juhasz (Hungarian). The pictures of all 19 languages are in `public/ui/`; the page's own texts (the bar, the guide, the credits) are in Italian and English only, and nobody is credited for a translation of them but the integrator.

## The restoration package

`public/index.html`, `public/styles.css`, `public/src/` and the data of `public/` started as the files of `rili-m18.zip` (SHA-256 `b7b771b46c098a161d50842f075964b46433854a38f245da3c5c37e0d79ad127`), a browser restoration written for Libre Arcade, which
says (`docs/development/package/THIRD_PARTY_NOTICES.md`) that it is GPL-3.0-only. The code was corrected here where the comparison with the original showed it to differ (`specs/port-map.md`, `docs/development/CHANGES.md`). The package's documents, tests and data are kept,
unmodified, in `docs/development/package/`.

## The oracle's tools

`tools/oracle/harness.cc` and `audio_stub.cc` are glue written for this collection (GPL-3.0-only): they run the original's own files on a virtual clock and record what it does. They contain nothing of the original's code beyond the names of its functions
and variables, which they have to use. `tools/oracle/stubs/` has two small headers written here so that a 2007 program compiles today (`iostream.h`, and declarations of the few SDL_mixer calls the original makes, whose library is not used).
The oracle links the original against **SDL 1.2.15** (LGPL 2.1), which `tools/oracle/build-sdl.sh` downloads from `libsdl.org`, checks by SHA-256 and builds into a folder of the user's choosing. SDL is not part of this repository, and the oracle's binary is not distributed.
