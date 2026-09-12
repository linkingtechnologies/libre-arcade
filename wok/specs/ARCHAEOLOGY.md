# Wok archaeology record

## Reperto

- Title: Wok
- Version: 1.0
- Author: Kenta Cho
- Copyright in archive: 2001 Kenta Cho
- Historical context: SDL Game Development Contest 2001
- Original source archive: `wok_src1_0.tar.gz`
- Original build stack documented in README: SDL 1.2.2, SDL_image 1.2.0,
  SDL_mixer 1.2.0, libao, libogg and libvorbis; compiled with egcs 2.91.66.

The archive carries CVS `$Id` metadata in the source files. The preserved
reference should be treated as primary evidence for gameplay and licensing.

## Game description from source

The player controls a wok with the mouse, catches falling balls and throws them
to the right. Consecutive throws increase score through a multiplier. Letting a
ball fall through the bottom ends the run.

There are no stage transitions in the source. Difficulty grows continuously via
`rank`, increasing gravity and spawn pressure and enabling temporary ball
sources: fire, volcano, tree, bucket, cloud and water tap.

## Separation of layers

`reference/` contains the historical artifact and is not modified by the port.
`src/`, `index.html`, and `style.css` are the modern browser reconstruction.
`assets/original/` contains unmodified convenience copies of historical media.
The canonical untouched source package remains under `reference/`. The two music
tracks use a pre-1.0 Vorbis beta bitstream that current browser decoders reject,
so runtime-only PCM WAV derivatives live under `assets/runtime/sounds/`.
