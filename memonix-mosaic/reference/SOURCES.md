# Historical reference sources

## Recovered source/runtime package

- Filename: `memonix_1.6_src.tar.bz2`
- Included in this package as: `reference/memonix_1.6_src.tar.bz2`
- SHA-256: `c5bd236c5cff2ffc07d98aff698368f32149c2428229fcde913e93bced250eab`
- Contents include the Memonix source tree and `gamedata.vfs`.
- Recovered `gamedata.vfs` SHA-256: `883cc09707ff645f264199eadbe5f22a0309699b8ac3716fd2ada69abae299f3`

The package's `MemonixSourceCode/License.txt` is preserved separately as `reference/MemonixSourceCode-License.txt` for quick audit access.

## Historical code archive identity

A separate historical code-only filename is documented as:

- `MemonixSourceCode_1.6_070713.zip`
- Known SHA-256 from FreeBSD ports metadata: `1e9e950c0a0bc78afde6c116fb3867dde6c9ad6d7560f80ab10ae65c18d5ac62`
- Known historical size: 188826 bytes
- Historical source-tree mirror: `https://github.com/gondur/Memonix/tree/master/MemonixSourceCode_1.6_070713`
- FreeBSD port metadata: `https://www.freshports.org/games/memonix/`

## Preferred editable source-art target

- Historical filename: `MemonixSourceArt_1.6_070717.zip`
- Approximate historical size: 122 MB
- Status: **not recovered**

This remains useful for long-term preservation of editable/source-format artwork, but it is no longer required to identify or reproduce the 50 Mosaic runtime tiles because those were recovered directly from the source/runtime package above.

## Visual reference

- Qweas Memonix 1.6 screenshot index: `https://www.qweas.com/download/game/kids/memonix_screen.htm`
- Surviving Mosaic gameplay screenshot: `https://www.qweas.com/download/game/kids/screen/memonix.jpg`

These screenshots remain external evidence links and are not copied into the distributable package.


## Menu/title assets recovered from `gamedata.vfs`

The runtime archive inside the preserved package contains the title-screen resources used by this restoration:

- `DATA/mainmenu.jpg` — SHA-256 `b80923760684034f5551d208c19464b9f94350c913d69ee1d40dc1da266f4ee9`
- `DATA/pr_m.bmp` — SHA-256 `1650ab0e849027d82fd07492b143a5c18ae86a42235b0b32b143ed49f12ef5b8`
- `DATA/main_game.bmp` — SHA-256 `20439a7ad548e5d23c18f39800586ada1631011cb1728f1c0c49a2b44a475e55`

The exact distributed transformations and resulting hashes are in `assets/ui/original/menu-asset-manifest.json`.
