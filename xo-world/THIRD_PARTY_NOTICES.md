# Third-party notices

## XO World, from JavaGames 1.0 by Milan Babuskov

- Author: Milan Babuskov (the restoration package spells the name Babuškov). The file headers read "Copyright 2000-2007 Milan Babuskov".
- Project named in the headers: JavaGames, <http://javagames.sourceforge.net>.
- Historical release: `javagames-1.0.tgz`, SHA-256 `259893181e230ce3cb006ea9dcd629cc16ba501d85e1a251ebb547a91056835d`, archive dated 7 February 2007.
- Component ported: `xoworld.java`, 1,180 lines, preserved unmodified in `reference/javagames-1.0/` together with its `README`, `COPYING` and the HTML page that embeds it.
- Historical licence: GNU General Public License, version 2 or, at the recipient's option, any later version. The "or later" grant is read in the header of the preserved source file, not assumed.
- Licence of this port: GNU General Public License, version 3 or later, which the grant above permits.

The JavaScript engine in `src/xoworld-engine.js` is a function-by-function port of the Java game logic and of the computer player. It keeps the rule order, the board indexing, the move counter, the search cap of seven and the behaviour of the original's known quirks. The port map in [`specs/port-map.md`](specs/port-map.md) lists every Java method with its JavaScript counterpart and says how each was checked.

The original author describes the code in its own comments as translated from an earlier C version written in Serbian, "a lot of code is just copy/pasted and left like that", and "probably not the example you'd want to learn Java from". The port keeps the Serbian identifiers so that the two sources can be read side by side.

## Assets

None of the original images are redistributed. The archive's eight XO World images (the empty square, the X and O marks, the highlighted last move, the three banners and the "New game" button) have no authorship or licence information of the standard of the source header, so the browser game draws its own board, marks and highlight with Canvas and CSS.

No AI-generated assets are used. The interface uses the system font stack and no external fonts, scripts or media. The only external request is the analytics beacon described in the collection's root `AGENTS.md`.
