# MilCity - Blue source record

- Archive: `MilCity-Blue_v1.0.5_src.zip`, 298,593 bytes, 81 files, SHA-256 `6149db64b8acf3fc3e65df8050212ff53b3a48cfde16bf6c9fc7ba1a1311d47e`. It was supplied inside the restoration package this game was integrated from (`milcity-libre-arcade-1.0.0-archaeology.zip`, SHA-256 `2be85d5ea2df6b165595558023628045ab961687e12c25d5352dbb4d9f1ccae4`) as `reference/MilCity-Blue_v1.0.5_src.zip`. Its 81 files were extracted and hashed (`ARCHIVE_SHA256.txt`), and every file kept here is byte for byte a file of the archive (`milcity-blue-1.0.5/CHECKSUMS.txt` against `ARCHIVE_SHA256.txt`). The zip itself is not kept.
- Version: the program says 1.0.5 (`Config.GAME_VERSION`, `Application Descriptor`, the manifest and the descriptor of the deployed jar); the README's own changelog ends at 1.0.5. The package dates it 19 February 2011, which is the date of every file in the archive and of the files SourceForge lists.
- Author: Jérémy Walther. The source's headers spell it "Jeremy WALTHER"; the README spells it with the accents. Three different addresses appear: `jeremy.walther@gmail.com` (the headers and the descriptor), `milcityblue@gmail.com` (the README) and `golflima5@gmail.com` (the about screen in `MilCityBlue.java`).
- Origin: the SourceForge project `milcity` (<https://sourceforge.net/projects/milcity/>). Its file list, read on 12 October 2026, has the folder `MilCity - Blue / Version 1.0.5 / Sources` with one file, `MilCity-Blue_v1.0.5_src.zip`, 298.6 kB, 2011-02-19, and the folder `Binaries` with `MilCity-Blue.jar`, 156.5 kB, released 2011-02-19 21:20:38 UTC. The sizes agree with the archive (298,593 bytes) and with its deployed jar (156,464 bytes). SourceForge shows no checksum, so on 12 October 2026, with the integrator's permission, `MilCity-Blue_v1.0.5_src.zip` was downloaded from SourceForge (`https://sourceforge.net/projects/milcity/files/MilCity%20-%20Blue/Version%201.0.5/Sources/MilCity-Blue_v1.0.5_src.zip/download`, 298,593 bytes, a zip) and hashed: its SHA-256 is `6149db64b8acf3fc3e65df8050212ff53b3a48cfde16bf6c9fc7ba1a1311d47e`, **identical to the archive's, so the archive is byte for byte the file SourceForge serves** (the downloaded copy was not kept). The deployed jar was not downloaded and not compared (its size agrees). The package says its hash "matches the historical SourceForge artifact recorded during the audit"; no evidence of that comparison came with it, and the one above is this repository's own.

## Licence

`README`: "This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License." The sentence stops there, without "or (at your option) any later version". 63 of the 66 Java files (`src` and `tests`) carry the same notice in the same words, and none of the 63 says anything about a later version; the three that have no notice at all are `core/players/AIPlayer.java` (the computer's player), `gui/ImageDrawer.java` and `tests/.../TestRW.java`, which are part of the same project and under its notice. `COPYING`, in the archive's root and in the source folder, is the full text of version 3 (29 June 2007). The word "later" appears in the archive only inside the licence text itself. So the original is **GPL-3.0-only**, and so is the port (`test/reference.test.mjs` and `test/production.test.mjs` fail if either says otherwise).

The three pictures of `res/` (`images.png`, `MilCityLogo_Shiro_icon.png`, `Splash_MilCity_Koojoo.png`) are inside the GPL project but carry no statement of their own, and their file names credit "Shiro" and "Koojoo", whose licence terms nobody has established. They are not kept and the page does not use them.

## Preserved here, unmodified

The 66 Java files (`src/`: the core, the GUI, the Bluetooth classes and the MIDlet; `tests/`: one test of the map generator), `COPYING`, `README` (with its Latin-1 text and its CRLF line endings) and `Application Descriptor`. `CHECKSUMS.txt` lists their SHA-256 (`sha256sum -c CHECKSUMS.txt` from inside `milcity-blue-1.0.5/`). `.gitattributes` turns line-ending normalisation and text conversion off for them.

## Not preserved

What is kept and what is not is the choice of this repository, not a property of the archive.

| File of the archive | Bytes | SHA-256 |
|---|---:|---|
| `deployed/DefaultColorPhone/MilCity-Blue.jar` (the deployed 1.0.5 program) | 156,464 | `a9dba79bcde20a7f368a0225a78647b9f43d85bb507116a1f860ac80f9692910` |
| `deployed/DefaultColorPhone/MilCity-Blue.jad` | 335 | `3a983532394f264fd23d775aab7bf2dc39a43682b8e52aef15b9f21bb6a07955` |
| `res/images.png` (the tile sheet and the bitmap font) | 2,945 | `2802d4b6e998c4c219ff24f18a1c8429dc6f4af635484e917235211709300137` |
| `res/MilCityLogo_Shiro_icon.png` | 2,957 | `6ecdffb583b1228b1d7f5e05df1966cee4f3fac34ad6e282bd90e6dad030c4dc` |
| `res/Splash_MilCity_Koojoo.png` | 30,400 | `132ccabc1b85f7a18a9434d12d682a4aaa6552267c64185f11becb3bc0f11509` |
| `.classpath` (the IDE's project file) | 471 | `21492b7f6fefbdf08ee49db57074b01dc2417b1070eddbd0b055918c913d4ce1` |
| `.project` | 735 | `8abd3a389aca098a4626c1cecaaa4df7349b3d7d50991c191ec5215c40e885a9` |
| `.mtj` | 2,065 | `f0bce9fbbd2c392fc673099f1b6dbd3cbfb64b9b5fb3671922d3d3240c69112f` |
| `.settings/org.eclipse.jdt.core.prefs` | 633 | `23b31255fbfeae1add1835e52534b6e584a863d13191474408464bcc8213d808` |
| `.settings/org.eclipse.mtj.core.prefs` | 131 | `c7f4cdc8482dc249fe7e341457cc21fc8ee76f3b1ab810a32dfe7e4e047b26c0` |
| `build.properties` | 107 | `bba9b59bc2058eb6c7eeadb7593c3f5a69036a6ca1ac7afd35a41a6cb7a6596e` |

The package also carried a second pair of binaries, `MilCity-Blue_v1.0.3.jar` (162,468 bytes, SHA-256 `e06b8ac1c01ac95af84f3b6b3b863230209e788d7889a6fb413e812f566f4b31`) and `.jad` (335 bytes, `8dda77d3a68459314059827e1b732c9468d342bd7e3442af344fbd011cc9a355`), "separately recovered" and reporting version 1.0.3: they are not the version ported, their origin is not recorded, and they are not kept. The deployed 1.0.5 jar can be unzipped and given to the oracle, to run the author's own compiled classes instead of the ones compiled here (`MILCITY_CLASSES`, see `PROVENANCE.md`).
