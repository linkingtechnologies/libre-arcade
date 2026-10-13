# Third-party notices

## MilCity - Blue, by Jérémy Walther

- Author: Jérémy Walther (the source's headers spell it "Jeremy WALTHER"), "Copyright (C) 2010, 2011". MilCity - Blue Edition is a real-time strategy game for J2ME phones (CLDC 1.0, MIDP 2.0, 320 by 240 pixels) that he published on SourceForge, in which each player builds a city, earns money, produces energy and weapons, and shoots at the other's city as in Battleship.
- Release ported: 1.0.5, 19 February 2011. The source archive `MilCity-Blue_v1.0.5_src.zip` (298,593 bytes, SHA-256 `6149db64b8acf3fc3e65df8050212ff53b3a48cfde16bf6c9fc7ba1a1311d47e`) came inside the package and is byte for byte the file SourceForge serves: it was downloaded from there on 12 October 2026 and its SHA-256 is the same (`reference/SOURCE.md`).
- Licence: **GNU General Public License, version 3 only.** The README and 63 of the 66 Java files say "either version 3 of the License." and stop there, without "or (at your option) any later version"; the other three files have no notice (`reference/SOURCE.md`). The full text of version 3 is `COPYING` in the archive and `LICENSE` here.
- What is kept in `reference/`: the 66 Java files, `COPYING`, `README` and `Application Descriptor`, byte for byte. Not kept: the deployed jar and descriptor, the three pictures of `res/`, and the IDE's project files (`reference/SOURCE.md` lists them with their hashes).
- Licence of this port: GNU General Public License, version 3 **only**, because it is derived from code that grants nothing more. `package.json`, `LICENSE`, the headers of the JavaScript files and `AGENTS.md` say so, and `test/production.test.mjs` fails if any of them is changed to "or later".

## The pictures of the original

`res/images.png` (the tiles and the bitmap font), `res/MilCityLogo_Shiro_icon.png` and `res/Splash_MilCity_Koojoo.png` are bundled with the GPL project and have no statement of their own; the last two have names that credit "Shiro" and "Koojoo". Nobody has established who they are or under what terms the pictures were given. The page does not use any of them, and they are not in this repository.

The page draws its own tiles and splash, as drawings made of rectangles. The package that this port started from measured the colours of the original's tile sheet and drew each tile "in the same vocabulary" without copying pixels; the likeness is deliberate. Whether a drawing in the style of art whose licence is unknown is free of it is not something the evidence settles, and `PROVENANCE.md` lists it among the open points.

## The restoration package

The JavaScript in `public/src/` started as the port in the package `milcity-libre-arcade-1.0.0-archaeology.zip` (SHA-256 `2be85d5ea2df6b165595558023628045ab961687e12c25d5352dbb4d9f1ccae4`), a browser restoration written for Libre Arcade, and was corrected here where the comparison with the original showed it to differ (`specs/port-map.md`, `docs/development/CHANGES.md`). The package's documents are kept, unmodified, in `docs/development/package/`.

## The oracle's stand-ins

`test/java-oracle/` has small classes of this repository's own that stand in for the handset's API and for the clock, the threads and the random numbers of the Java platform. They are GPL-3.0-only like the rest of the code written here. They contain nothing from the MIDP implementations of any vendor.
