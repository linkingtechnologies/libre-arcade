# Third-party and historical notices

## Wok 1.0 historical source and assets

Wok 1.0 is Copyright 2001 Kenta Cho. The original source archive includes the
following redistribution terms in `README`:

> Redistribution and use in source and binary forms, with or without
> modification, are permitted provided that the copyright notice, conditions,
> and disclaimer are retained as described in the original license.

The complete original README and its disclaimer are preserved unchanged at
`reference/wok-1.0/README`. The unmodified original archive is preserved at
`reference/original/wok_src1_0.tar.gz`.

The PNG, Ogg Vorbis, and WAV assets used by the web port come from that same
historical source package. No separate asset license or third-party attribution
was found in the archive. The port therefore preserves Kenta Cho's original
copyright and license notice for these materials rather than relabeling the
assets as GPL, CC0, or another license.

## Browser-runtime audio derivatives

The original `wok1.ogg` and `wok2.ogg` files are early Vorbis beta streams.
They remain unmodified in `reference/wok-1.0/sounds/` and
`assets/original/sounds/`. Current browser decoders reject their historical
Vorbis setup headers, so the web runtime uses PCM WAV files produced by decoding
the originals with SoX. The conversion adds no new creative content and no
second lossy compression stage; copyright and license remain those of the
historical Wok assets. The three sound-effect WAV files are copied unchanged.

## SDL_mixer internal header in the historical reference

`reference/wok-1.0/music_ogg.h` is an SDL_mixer-related historical header by
Sam Lantinga and carries GNU Library General Public License version 2 or later
terms in its source header. It is retained only as part of the untouched
historical reference and is not used by the JavaScript port.

## Web port

New JavaScript, HTML, CSS, tests, and documentation in this restoration are
licensed under GPL-3.0-or-later unless a file states otherwise. This does not
change the license of the preserved historical Wok source or assets.
