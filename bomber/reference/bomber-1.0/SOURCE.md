# Bomber 1.0 (J2ME) source record

- Archive: `Bomber.zip`, 33,120 bytes, supplied inside the restoration package as `reference/Bomber.zip`
- SHA-256: `274c78e5b4060aaab52b6fc336fc16245566b9c0b66bde7532e0738f3840e560`. It is the value the package's own notes give, and it is also the SHA-256 of the file downloaded from SourceForge on 11 October 2026 (see below).
- Contents: 12 files in the folders `bin/`, `classes/`, `res/` and `src/`, plus an empty `lib/`. All entries are dated between 5 and 21 December 2008.
- Author, from the source headers: Juan Jose Luna Espinosa, "Copyright (C) 2007". The SourceForge project that published the archive names the account `yomboprime` as the one that brought it. The Bomber page itself does not give the account's real name; two other SourceForge projects of the same account confirm that `yomboprime` is Juan José Luna Espinosa: the Files page of Colorator ("Brought to you by: yomboprime") shows a `README.txt` that reads "Copyright (C) 2010 Juan Jose Luna Espinosa", and the discussion forum of Batiscafo (also "Brought to you by: yomboprime") has a post, "version 1.0" of 18 January 2014, whose author is displayed as "Juan José Luna Espinosa" with a profile link to `yomboprime`. Both pages were read on 11 October 2026.
- Origin of the archive: the project page <https://sourceforge.net/projects/bomberj2me/> (SourceForge project `bomberj2me`, titled "Bomber", registered 2008-12-21, "Brought to you by: yomboprime"). Its Files page lists `Bomber.zip`, 33.1 kB, released 2008-12-22 21:11:50 UTC, in a folder whose path reads "Bomber 1.0". The package's `Bomber.zip` is 33,120 bytes and its newest entry is dated 21 December 2008, which fits. The page shows no checksum, so the file was downloaded to compare: on 11 October 2026 `https://downloads.sourceforge.net/project/bomberj2me/bomberj2me/Bomber%201.0/Bomber.zip` served 33,120 bytes whose SHA-256 is `274c78e5b4060aaab52b6fc336fc16245566b9c0b66bde7532e0738f3840e560`, and `cmp` finds them byte for byte identical to the package's `Bomber.zip`. The page was read on the same day.
- What the project page says: "Bomber is a j2me MIDP 2.0 game based on a Spectrum 48k classic original game. It was developed using Sun Java Wireless Toolkit and is tested on Nokia 6234 mobile phone." It lists the licence as "GNU General Public License version 2.0 (GPLv2)". That label disagrees with the files: both headers and the shipped `GPL.txt` say version 3. This record follows the files, the grant the author put in the source (see `PROVENANCE.md`).
- Not to be confused with the SourceForge project `j2mebomber`, which is a different game (a port of While True's Nokia Series 60 Bomber).
- Licence: GNU General Public License, "version 3 of the License", read in the headers of `Bomber.java` and `GameCanvasBomber.java`. The headers do not add "or (at your option) any later version", so the licence is GPL-3.0-only. `src/GPL.txt` is the GPL version 3 text.
- Target: the JAD and the manifest name CLDC 1.1 and MIDP 2.1, vendor "Unknown", version 1.0. The JAD says `MIDlet-Jar-Size: 100` for a 9,061-byte jar and names an icon `Bomber.png` that is not in the archive.

## Preserved here, unmodified

| File | What it is |
| --- | --- |
| `src/GameCanvasBomber.java` | the whole game: the loop, the rules, the sounds and the drawing, 11,868 bytes, dated 21 December 2008 01:01 |
| `src/Bomber.java` | the MIDlet that starts it, 1,313 bytes |
| `src/GPL.txt` | the GPL version 3 text shipped with the source |
| `bin/Bomber.jad`, `bin/MANIFEST.MF` | the descriptor and manifest of the 1.0 build |

The two Java files are CRLF text. The `.gitattributes` one level up turns line-ending normalisation off for them so they keep the checksums in `CHECKSUMS.txt` (check them with `sha256sum -c CHECKSUMS.txt` from inside this folder).

## Recovering the archive

The archive itself is not kept in this repository (the choice of this repository, not a property of the archive: it holds a jar, two compiled classes and four images whose licence is not established). It can be fetched again and checked:

```sh
curl -L -o Bomber.zip "https://downloads.sourceforge.net/project/bomberj2me/bomberj2me/Bomber%201.0/Bomber.zip"
sha256sum Bomber.zip     # 274c78e5b4060aaab52b6fc336fc16245566b9c0b66bde7532e0738f3840e560
```

(The project page, <https://sourceforge.net/projects/bomberj2me/files/>, links to the same file. A plain `.../download` link was refused with a 403 when tried with `curl`.) `ARCHIVE_SHA256.txt` then identifies each of the 12 files inside it.

## Not preserved

`ARCHIVE_SHA256.txt` lists all 12 files of the archive with their SHA-256, so each can be identified in a fresh copy.

- `bin/Bomber.jar` (9,061 bytes) and `classes/*.class` (dated 18 December 2008, three days before the source). Compiled code is not redistributed because the source is.
- The four PNG resources `res/bomb.png`, `res/buildings.png`, `res/loadscreen.png` and `res/plane.png` (118, 549, 665 and 1,725 bytes, dated 5 December 2008). Nothing in the archive establishes who drew them or under which licence, so they are not redistributed; the browser game draws its own graphics.
