# Third-party notices

## 5ud0ku 1.8, by Ivonne Engemann and Marcus Wagner (Ive&Case)

- Authors: Ivonne Engemann and Marcus Wagner. The notice in all 32 Java files reads "Copyright (c) 2006 Ivonne Engemann and Marcus Wagner"; their pages (<http://wintermute.de/wap/5ud0kuman.html>, startofentry.de) call the pair Ive&Case.
- Release ported: 5ud0ku 1.8, for CLDC 1.0 and MIDP 1.0 phones. The source archive `5ud0ku.src.zip` (108,189 bytes, SHA-256 `41c57fb55c323530d09c1a0cf039e5e2ca39e675fa6a7f5de176beb742c42ddf`) is the one the authors' manual page links; its files are dated between January and 19 November 2006. The release jar `5ud0ku.jar` (63,862 bytes, SHA-256 `b7189ced0699cfe278b1d9d94b4675a29b85951f527f69329a10225bfad0d414`) is the "all devices" build the same page offers.
- Components ported: `Grid`, `GridSlot`, `Position`, `MoveStack`, `GridCreator`, `CreatorTask` (the choice of the best Hard candidate), `GridSolver`, `BruteForceSolver`, `Solver`, and the save layout of `Grid.toByteArray()`. They are preserved unmodified in `reference/5ud0ku-1.8/source/` together with the rest of the text files of the archive.
- Historical licence: GNU Lesser General Public License, version 2.1 or, at the recipient's option, any later version. The evidence is `LICENSE.txt` in the source archive (which carries that grant and a copy of the LGPL 2.1 as `lgp-license.txt`) and the authors' manual page, which says the sources and binaries are licensed under the LGPL. **The Java files themselves carry only a copyright banner and no licence text.**
- Licence of this port: GNU General Public License, version 3 or later, which the grant above permits.
- The manual page also describes the game as "Emailware (Freeware with a request)" and asks users to send the authors a short note. That is a request on the page, not a term of the licence file; it is recorded here and not enforced.

The JavaScript in `public/src/core/` is a function-by-function port of those classes. It keeps the order of every step, the candidate bit masks, the two separate random-number streams (the generator's and the digit relabelling's, both `java.util.Random`), the historical backtracking-depth measure and the quirks of the move ring. The port map in [`specs/port-map.md`](specs/port-map.md) lists the Java classes with their JavaScript counterparts and says how each was checked.

## Assets

None of the original images are redistributed. The source archive holds nine PNG files (the icon `5ud0ku-icon.png` and eight digit sheets `digits*.png`). Nothing in the archive says who drew them, so the browser game draws its own board and digits with HTML and CSS. The archive's `.zip`, the release `.jar` and the PNG files are not kept in this repository; `reference/5ud0ku-1.8/SOURCE.md` says where the archive can be fetched again and which hash to expect.

No AI-generated assets are used. The interface uses the system font stack and no external fonts, scripts or media. The only external request is the analytics beacon described in the collection's root `AGENTS.md`.
