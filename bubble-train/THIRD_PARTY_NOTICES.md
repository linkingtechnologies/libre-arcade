# Third-party notices and quarantine register

This file documents material present in preserved references. Presence here does **not** mean the new project has permission to redistribute or incorporate it.

## Bubble Train C++

Adam Child and Craig Marshall, copyright 2004. 93 audited C/C++ files explicitly state GNU GPL version 2 or (at your option) any later version. See `specs/source-license-inventory.csv`.

## `src/List.h`

Attributed in-file to Ron Penton, *Data Structures For Game Programmers*, `DLinkedList.h`. No license grant was found in the supplied file. **QUARANTINE CODE.** Future port must independently implement required collection behavior.

## Original dependencies

The historical README names SDL, SDL_image, SDL_mixer and libxml2. The OS4 Makefile additionally links Vorbis/Ogg, JPEG, PNG, zlib, pthread and platform libraries. These dependencies are reference-only for the browser project.

## Audiovisual assets

All original graphics, bitmap fonts, music and effects are quarantined unless independently cleared. Embedded metadata includes at least:

- `snd/click.wav`: `copyright=1995-1998 Microsoft Corporation`
- `snd/cannon_move.wav`: `copyright=A1 Free Sound Effects`
- `snd/cannon_fire.wav`: historical conversion metadata naming `Convert (c) 1994 Jesus Villena`

Bitmap font filenames reference Arial, Agent Orange and BubbleBoy; no bundled licenses were found for those font-derived images.

## GP2X GBAX 2006

Preserved as a derivative historical artifact. It contains changed graphics/music/levels and no C/C++ source tree in the supplied contest ZIP. Do not use it as the original parity baseline or as a clean asset source.

## Faithful-port Milestone 1

The new JavaScript engine under `public/src`, automated tests under `/tests`, and diagnostic material under `/demo` are clean-room project code/data licensed under GPL-3.0-or-later. They do not copy the quarantined historical `List.h`, original audiovisual assets, or shipped level layouts. The project currently has no npm/runtime third-party dependencies.

## Milestone 4 runnable presentation

The runnable M4 browser restoration uses the cleared byte-preserved historical `.lvl/.gms` data, but its presentation remains newly authored geometric Canvas drawing, system UI fonts and oscillator-generated Web Audio tones. No quarantined Bubble Train graphics, bitmap-font images, WAV/OGG audio or historical theme artwork is referenced by the runnable build.

## Historical Bubble Train `.lvl` / `.gms` data

A later scope audit found high-confidence evidence that the **61 bundled original `.lvl` and 5 bundled `.gms` files** fall within Bubble Train's upstream project-level GPL grant. They are no longer classified as unknown-license data. Their original XML should remain byte-identical and be accompanied by the upstream README/GPL text and `specs/level-data-license-memo.md`. This conclusion does not cover audiovisual assets or later third-party/user-contributed levels.

## Milestone 5A clean vector assets

The new SVG files under `public/assets-clean/` were created specifically for this restoration and were not traced from or sampled from historical Bubble Train artwork. They are intended for distribution under **CC0-1.0**. Their separate asset license does not alter the GPL status of the JavaScript port or the preserved historical data.
