# 5ud0ku 1.8 source record

- Archive: `5ud0ku.src.zip`, 108,189 bytes, SHA-256 `41c57fb55c323530d09c1a0cf039e5e2ca39e675fa6a7f5de176beb742c42ddf`, supplied inside the restoration package as `reference/5ud0ku.src.zip`
- Release binary: `5ud0ku.jar`, 63,862 bytes, SHA-256 `b7189ced0699cfe278b1d9d94b4675a29b85951f527f69329a10225bfad0d414`, with its descriptor `5ud0ku.jad` (413 bytes, SHA-256 `1c933721e985eab904972cb6b54307ad2fc3b8c8036fcfc038df4ec128a723ea`, MIDlet-Version 1.8, `MIDlet-Jar-Size: 63862`, CLDC 1.0, MIDP 1.0)
- Authors, from the notice in all 32 Java files and in `LICENSE.txt`: Ivonne Engemann and Marcus Wagner, "Copyright (c) 2006", the Ive&Case duo
- Dates: the files of the source archive are dated between January and 19 November 2006 (the newest are `PreferencesScreen.java`, `Dict.java` and the `lang` file); the archive's own JAD is dated 26 October 2006
- Origin: the author's manual page, `http://wintermute.de/wap/5ud0kuman.html` (read through the Internet Archive's snapshot of 13 June 2026, <https://web.archive.org/web/20260613130649/https://wintermute.de/wap/5ud0kuman.html>, on 11 October 2026). It says "Current Version: 1.8", offers four builds (112K large graphics, 63K "all devices", 89K extended languages, 86K generic/LG) and links the sources at `http://startofentry.de/files/5ud0ku.src.zip`. The jar here, 63,862 bytes, is the "all devices, jar size 63K" build.
- The source zip: the Internet Archive holds a snapshot of that address, <http://web.archive.org/web/20131207043301/http://startofentry.de/files/5ud0ku.src.zip>, which the archive reports as 108,189 bytes. It was downloaded on 11 October 2026 from <https://web.archive.org/web/20131207043301id_/http://startofentry.de/files/5ud0ku.src.zip> (the `id_` form returns the stored bytes unchanged): 108,189 bytes with SHA-256 `41c57fb55c323530d09c1a0cf039e5e2ca39e675fa6a7f5de176beb742c42ddf`, **identical to this archive**, so the archive is the file the authors served from their own address. No snapshot of the jar's address (`wintermute.de/wap/5ud0ku.jar`) was found; one of the JAD's address exists.
- The package's `reference/5ud0ku.jad` (413 bytes) is the descriptor of the 63K jar; it is not the same file as `5ud0ku.jad` inside the source archive (399 bytes). Both are preserved.

## Licence

`LICENSE.txt`, inside the archive, says that "this library" may be redistributed and modified "under the terms of the GNU Lesser General Public License ... either version 2.1 of the License, or (at your option) any later version", and `lgp-license.txt` is the LGPL 2.1 text. The author's manual page says the same ("The 5ud0ku Midlet sources and binaries are licensed under the GNU Lesser General Public License", with that notice). **The Java files carry only the copyright notice** (a banner reading "Java Tools for common purposes ... Copyright (c) 2006 Ivonne Engemann and Marcus Wagner ... Enjoy."), no licence text: the evidence for the licence is the licence file and the author's page, not per-file headers.

The page also calls the Midlet "Emailware ... (Freeware with a request)" and asks users to send the authors a short note. That is a request on the page, not a term of the licence file.

## Preserved here, unmodified

`source/` holds every text file of the source archive: the 32 Java files under `source/src/de/wintermute/`, the five dictionaries `dict_*` and the `lang` file, the build files (`build.xml`, `eclipseme-build.*`, `user-build.properties`), `building.txt`, `LICENSE.txt`, `lgp-license.txt` and the archive's `5ud0ku.jad`. `release/5ud0ku.jad` is the package's descriptor of the jar. `CHECKSUMS.txt` lists their SHA-256 (check with `sha256sum -c CHECKSUMS.txt` from inside this folder), and each matches the archive manifest `ARCHIVE_SHA256.txt`, which lists all 55 files of the archive.

## Not preserved

What is kept and what is not is the choice of this repository, not a property of the archive.

- `5ud0ku.src.zip` and `5ud0ku.jar` themselves, 108 KB and 64 KB.
- The nine PNG files of the source archive: the icon `5ud0ku-icon.png` and the eight digit sheets `digits*.png`. The package-level `LICENSE.txt` covers the distribution, but nothing says who drew them, so they are not redistributed; the browser game does not use them and draws its own.

The source archive can be fetched again and checked:

```sh
curl -L -o 5ud0ku.src.zip "https://web.archive.org/web/20131207043301id_/http://startofentry.de/files/5ud0ku.src.zip"
sha256sum 5ud0ku.src.zip     # 41c57fb55c323530d09c1a0cf039e5e2ca39e675fa6a7f5de176beb742c42ddf
```

`ARCHIVE_SHA256.txt` then identifies each of the 55 files inside it.
