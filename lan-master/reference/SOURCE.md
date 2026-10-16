# Where the files in reference/ came from

Both zips are the author's own, as his site served them, fetched from the Internet Archive's copies of that site (the `id_` form of a Wayback URL
returns the stored bytes unchanged). They were fetched on 2026-10-15, and compared with the files of the restoration package this game was made
from: the ROM and `notes.txt` of the package's `reference/` are byte for byte the ones below.

| Zip | Wayback URL | Size | SHA-256 |
|---|---|---|---|
| `lan_master.zip` (the release) | `http://web.archive.org/web/20250916161847id_/https://shiru.untergrund.net/files/nes/lan_master.zip` | 1,126,553 | `79410cc133f1100d2fe5409fd49297a62afc748aeeb5faccb8fe69c68c16e6aa` |
| `lan_master_src.zip` (the source) | `http://web.archive.org/web/20260901180507id_/https://shiru.untergrund.net/files/src/lan_master_src.zip` | 85,742 | `d4058bd0f6d31fbd9ba71b2ec15e9646f00520de075c9c18f8520e8d18e0b3ee` |

The author's page that lists them (an archived copy of "Shiru's Stuff") calls the game "Simple logic game" and gives the source as 83K.

## What is kept, and what is not

Kept: `release/Lan_Master.nes` and `release/notes.txt`, and every file of the source that the build uses (`source/`: the `.asm` files, `compile.bat`, the
two compressed pictures of the screens, the title and the ending, the game background `gamebg.rle`, `patterns.chr` and `bgm_game_dpcm.bin`).

Not kept (the repository has no use for them, and some are large or binary tools), with the checksums so that they can be told apart from other copies:

| File in the zip | Bytes | SHA-256 |
|---|---|---|
| `lan_master.zip: manual.pdf` | 96,491 | `5d47e2e28e768de7d11ab50abb5bdbf909449032f74e994c90a67361d0c53a42` |
| `lan_master.zip: label_nes.png` | 367,632 | `3ad95b99343e83ba4574472c8950d41a07c1d15bbd81e0c1a3d1b66aa50c76fc` |
| `lan_master.zip: label_fami.png` | 654,070 | `7b8f9e5bdc1ae7f309ad342231a4c7dcdde127ea74ce553d5b13a7e121ca541f` |
| `lan_master_src.zip: lanme/lanme.exe` (the level editor) | 346,112 | `d2d1c17097002d4c3b22719ee3ea15aa37682f16b0f4d4b8264f8a6ced41b4df` |
| `lan_master_src.zip: lanme/levels.bin` | 7,250 | `3b5965e0ae44df6da35f42d7634dc2d8b4a5891c434ad1d2f85699cab5afd15f` |
| `lan_master_src.zip: lanme/src/Unit1.cpp` | 12,663 | `80c05eea4e3a17fc4dae3615df33f6ac04880bb73fdc9c8420c39f62d8cdeca4` |
| `lan_master_src.zip: lanme/src/Unit1.dfm` | 686,273 | `9723d2a509d0915ea1e1e8260be8ec7cf98d88a812d60d4cb09e420d99324f01` |
| `lan_master_src.zip: lanme/src/Unit1.h` | 1,849 | `1afd3d4eb16f474ca5515c17d03ed4b02eb97af9a1e1e2e82e8cb79cc197e801` |
| `lan_master_src.zip: lanme/src/lanme.bdsproj` | 16,016 | `3a2eb08abd1cb4e01c82b856ba8d99ad105f36315bc970ca1f8fa320b23e630d` |
| `lan_master_src.zip: lanme/src/lanme.bdsproj.local` | 969 | `1144f406d3b4b133485eddbce08654f2cb7f96c8c5f6bf609dffb8cd80e1db59` |
| `lan_master_src.zip: lanme/src/lanme.cpp` | 814 | `1431e5f7a249f19b11ba72f28b8a81cb6ce6c14eb93d0880e690ad699ab4f236` |
| `lan_master_src.zip: lanme/src/lanme.res` | 4,396 | `4a4b3565975d3f07e4a492af406dcc5c9a7346bf3999ed6d8ea7e28f554baa03` |
| `lan_master_src.zip: sound/lan_master.ftm` (FamiTracker project of the music) | 60,129 | `7739caf892484bef0f9ca20492f8219069f5158a3aa01af5484779e6fbc3725c` |
| `lan_master_src.zip: sound/sounds.ftm` (the effects) | 3,695 | `a3fe1269d4158ac93ecf34a19984e8b0c4d388c0ddaf1264467d5219fcce5c93` |

The level data the game uses is in the kept `levels.asm`; `lanme/levels.bin` is the level editor's own file, in the editor's format.
The manual and the two box labels are not redistributed here (the repository has no use for them), but they were read for a licence statement, and they say the same as the source:
the manual's cover has "PD 2011 Shiru", its introduction says the game is free of charge and "released into Public Domain", and both labels have "PD Shiru 2011".
The text of the manual was extracted from `manual.pdf` by the integrator (the PDF has the SHA-256 above; the Russian half came out garbled), and the labels were looked at in the zip.
The manual's credits also name the testers: Gibson, 0xabad1dea, Brad, Alone Coder and mbrenaman.
