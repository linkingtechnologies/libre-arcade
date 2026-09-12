# Provenance

## Primary historical reference — AmigaOS4 1.21

Archive: `archives/njam-1.21-os4.lha`

SHA-256: `da2830bac7d526fb66fac080f71094ed7c1ab33877f9d0fbaccf6f569930ed36`

The included `ReadMe_OS4` identifies the package as a quick AmigaOS4 port of **Njam v1.21** by Milan Babuskov, compiled by **Kjell Breding (Sharakmir)** on **8 November 2005**. It explicitly states that all original source is included in the `Source` folder.

Preserved here:

- complete `Source/` tree from the OS4 package;
- original HTML documentation;
- original COOP and DUEL binary level sets;
- README, OS4 readme, COPYING, CHANGES and TODO.

The original OS4 executable is preserved inside the untouched `.lha` archive but is intentionally not duplicated into the extracted reference tree.

## Secondary upstream reference — 1.25

Archive: `archives/njam_1.25.orig.tar.gz`

SHA-256: `8ed3eee3f387ce5ecdab7dd528f98cf77f65971510964000f2f1dfbf8b6f3000`

Used to compare later upstream source and level material. It is not silently substituted for 1.21 when establishing gameplay parity.

## Debian packaging metadata

Archive: `archives/njam_1.25-12.2.debian.tar.xz`

SHA-256: `bb68ab7c7e2483a310a08bf835523436fcb8fdf29a94ffecbf0b1f050a7a5448`

The Debian copyright file identifies upstream Milan Babuskov's Njam package as `GPL-2.0+` and separately identifies `src/SDL_main.c` as public domain.

## Porting rule

When 1.21 and 1.25 differ, 1.21 is the primary behavioural reference for this port unless a later fix is adopted deliberately and documented in `specs/PARITY.md`.

## Browser runtime asset copies

The browser-ready sprite/skin/menu assets and the additional bitmap-font, statistics and tracker resources used by the parity milestone are reproducibly taken from the preserved upstream `njam_1.25.orig.tar.gz`. Njam 1.25 is described upstream as a minor maintenance release whose gameplay-source differences from 1.21 are limited to later fixes; it retains the same named core data resources loaded by the 1.21 source. Gameplay behaviour and COOP map data in this port continue to use the OS4 1.21 source/package as the authority.

XM/S3M files are retained unchanged in `assets/music/`; `.ogg` siblings are browser playback transcodes generated with FFmpeg/libopenmpt + Vorbis and are not treated as historical originals.
