# Netrok 0.95 source recovered from OpenPandora PND

Source: user-supplied `netrok.pnd`, OpenPandora package version 0.95.1.01.
The game source itself defines VERSION and ALPHAVERSION as 0.95.

Recovered source files include the complete SDL/C++ game, the map editor,
SFont helper code, and Pandora build/run scripts.

License:
Netrok source headers state GNU GPL version 2 or, at your option, any later version
(GPL-2.0-or-later). The included COPYING file contains GPLv2 text.

Original game build script in the PND:
    g++ `.../sdl-config --cflags` `.../sdl-config --libs` -lSDL_mixer \
      main.cc kortenhandling.cc menu.cc putsprites.cc collisiondetect.cc \
      scrolling.cc gameinitialize.cc loadfiles.cc specialblockhandling.cc \
      graphicengine.cc SFont.c -o netrok

Map editor build script:
    g++ `sdl-config --cflags` `sdl-config --libs` mapeditor.cc SFont.c -o mapeditor

Map format confirmed by source:
- `unsigned short int leveldat[13][400]` per level
- 5200 newline-separated integer values
- 16x16 tiles
- editor stores background RGB in leveldat[0][0..2]
- game has storage for 32 levels; distributed package uses 1..20

This directory contains only recovered source/documentation files, not the game assets.
