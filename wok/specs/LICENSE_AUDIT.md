# Wok 1.0 license audit

## Primary evidence

The audit is based on the supplied original archive `wok_src1_0.tar.gz`, not on
the historical web page's generic “free software” wording.

The root `README` identifies Wok 1.0, Copyright 2001 Kenta Cho, and grants
redistribution and use in source and binary forms, with or without modification,
subject to retention of the copyright notice, conditions, and disclaimer. The
terms are BSD-2-Clause-style and permit a GPLv3-compatible derivative port.

## Historical source

The original archive is preserved byte-for-byte under `reference/original/` and
its extracted contents are preserved under `reference/wok-1.0/`.

SHA-256 is recorded in `reference/original/SHA256SUMS.txt`.

## Assets

The historical source package includes PNG graphics, two Ogg Vorbis music files,
and three WAV sound effects. No separate asset license, alternate copyright
notice, or third-party attribution was found for those files. They are kept
under the original package notice and are not relicensed by this project.

## Exception retained only in /reference

`music_ogg.h` contains SDL_mixer-related code with a GNU Library GPL v2-or-later
notice. The browser port does not reuse this implementation; browser audio is
implemented independently with the Web Audio API.

## Port licensing

The new web implementation is GPL-3.0-or-later. The preserved original source
and assets retain their historical notices.
