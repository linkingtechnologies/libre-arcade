# Disk Field HTML5 M5 — audio and typography pass

M5 replaces the temporary M4 presentation layer without changing `engine.mjs` or `levels.mjs`.

## Player-facing changes

- `Sounds` / `Suoni` and `Music` / `Musica` are separate settings again, matching the structure of the 2007 options screen.
- The technical disclaimer about historical font/audio assets has been removed from the in-game credits.
- Main Canvas headings/menu labels use a small procedural 5×7 arcade lettering renderer (`public/js/arcade-text.mjs`) instead of a bundled font file.
- Ordinary HTML controls and the short credits copy continue to use the platform UI font stack.

## Procedural replacement audio

No historical sound file is loaded by the playable build. `public/js/audio.mjs` generates all sound with Web Audio:

- interface navigation: short electronic beep;
- collisions: three rotating low-frequency thud profiles, with loudness scaled from the measured impact-speed loss;
- black-hole entry: downward two-oscillator sweep;
- white-hole exit: short rising pop;
- level complete: three-note ascending cue;
- final screen: five-note ending cue;
- music: an original low-volume generative arpeggio/bass loop, scheduled in Web Audio and unrelated melodically to the historical recording.

The replacement layer deliberately preserves the *roles* of the 2007 sounds, not their recordings or melodies.

## Historical audio mapping

The preserved 1.01 `DfSoundManager.py` associated the following historical files with these roles:

- `tradeyourkid.ogg` — looping music;
- `Electron-wwwbeat-1897.wav` — interface beep;
- `Arcade_S-wwwbeat-1889.wav` — level complete;
- `delay_me-dog-298.wav` — black-hole entry;
- `pop-SodaBush-1015.wav` — white-hole exit;
- `Applause-J_Fairba-1717.wav` — final screen;
- `thud.ogg`, `thud2.ogg`, `thud3.ogg` — collision variants.

These files remain preservation material only until their per-file redistribution terms are sufficiently established.

## Historical font mapping

The 2007 build uses `MAKISUPA.TTF`. Its bundled historical license is not clean enough for automatic inclusion in the public Libre Arcade package: software/collection redistribution requires written permission under the supplied terms.

M5 therefore ships **no font file at all**. The Canvas arcade lettering is code-generated; ordinary controls use installed system fonts.

## Fidelity boundary

M5 changes presentation only. Physics, level data, fixed-timestep behavior, oracle traces and preserved upstream archives are unchanged.
