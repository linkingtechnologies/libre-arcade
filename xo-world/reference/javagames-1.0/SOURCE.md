# JavaGames 1.0 (XO World) source record

- Archive: `javagames-1.0.tgz`, 131,643 bytes
- SHA-256: `259893181e230ce3cb006ea9dcd629cc16ba501d85e1a251ebb547a91056835d`
- Project named in the file headers: JavaGames, <http://javagames.sourceforge.net>
- Author: Milan Babuskov, "Copyright 2000-2007"
- Archive date: 7 February 2007 (the newest entries are `README` at 18:00 and the directory at 18:01)
- Obtained from: a copy in the maintainer's Downloads folder, next to the restoration package. Its SHA-256 equals the one the package's own `docs/behavioral-oracle-m2.md` gives for its baseline archive.
- Origin: the SourceForge project "On-Line Java Games", <https://sourceforge.net/projects/javagames/>, "Brought to you by: djgohan", registered 2007-02-07, categories Board Games and Puzzle Games. Its Files page lists `javagames-1.0.tgz`, 131.6 kB, in the folder `/javagames/1.0`, "released on 2007-02-07 17:04:20 UTC". The archive here is 131,643 bytes and its newest entries are dated 7 February 2007 18:01, without a time zone. The page shows no checksum, so the file was downloaded to compare: on 11 October 2026 `https://downloads.sourceforge.net/project/javagames/javagames/1.0/javagames-1.0.tgz` served 131,643 bytes whose SHA-256 is `259893181e230ce3cb006ea9dcd629cc16ba501d85e1a251ebb547a91056835d`, and `cmp` finds them byte for byte identical to the copy used here (the gzip header of both carries the time 7 February 2007 17:02:26 UTC). That the account `djgohan` is Milan Babuskov is not stated on the pages read. Read on 11 October 2026.
- What the project page says about the licence: "GNU General Public License version 2.0 (GPLv2)". The label does not mention "or later"; the header of `xoworld.java` does, and it is the header that is followed here (see `PROVENANCE.md`)
- Licence: GNU General Public License, version 2 **or (at your option) any later version**, read in the header of `xoworld.java` (lines 1 to 19, quoted below); `COPYING` is the GPL version 2 text of 1991

```
This file is part of JavaGames (http://javagames.sourceforge.net).

JavaGames is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
```

The archive holds four applets (the `README` lists XO World, 100 Mack, Memory and Tetris) and their images. Only XO World is used here.

## Preserved here, unmodified

| File | Why |
| --- | --- |
| `xoworld.java` | the game and its computer player, 1,180 lines, dated 6 February 2007 21:22 in the archive |
| `xoworld.html` | the page that embeds the applet (300 by 340 pixels) |
| `README` | the author's description of the collection |
| `COPYING` | the licence text shipped with the source |

These four files are CRLF text. The `.gitattributes` one level up turns line-ending normalisation off for this folder so that they keep the checksums in `CHECKSUMS.txt` (check them with `sha256sum -c CHECKSUMS.txt` from inside this folder).

## Recovering the archive

The archive itself is not kept in this repository. It can be fetched again and checked:

```sh
curl -L -o javagames-1.0.tgz "https://downloads.sourceforge.net/project/javagames/javagames/1.0/javagames-1.0.tgz"
sha256sum javagames-1.0.tgz     # 259893181e230ce3cb006ea9dcd629cc16ba501d85e1a251ebb547a91056835d
```

`ARCHIVE_SHA256.txt` then identifies each of the 63 files inside it.

## Not preserved

What is kept and what is not is the choice of this repository, not a property of the archive: the archive also holds the compiled class, the images and the sources of the other applets.

`ARCHIVE_SHA256.txt` lists all 63 files of the archive with their SHA-256, so each one can be identified in a fresh copy of the archive, which can be fetched from the SourceForge file above.

- The compiled `xoworld.class`, 13,484 bytes, 6 February 2007 21:32 (Java 5 class file format, version 49). It is not redistributed because the source is. It was used as a second oracle (see `specs/port-map.md`) and agreed with the source.
- The eight XO World images (`slikax.jpg`, `slikao.jpg`, `slikao2.jpg`, `slika.jpg`, `win.jpg`, `loose.jpg`, `plyturn.jpg`, `newgame.jpg`). Their authorship and licence were never established to the standard of the source header, so they are not redistributed; the browser game draws its own board and marks. Seven of them carry the date 5 April 2000 in the archive, `plyturn.jpg` 6 February 2007.
- The other games' sources and images (`tetris`, `pogodi`, `stomak`, `memory.html`, `100mack.html`, `index.php` and the remaining gif and jpg files), which belong to other applets.
