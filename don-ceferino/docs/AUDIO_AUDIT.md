# Audio audit — Don Ceferino Hazaña 0.97.8

## Historical license evidence

The original archive contains `data/sounds/LICENSE-KIND.FILES` and `data/music/LICENSE-KIND.FILES`. Both are byte-identical to the other data-directory notices and grant GNU GPL version 2 or, at the recipient's option, any later version.

That is direct package evidence that the historical project distributed both directories under GPL-2.0-or-later. The audit still records provenance separately because a license notice and a complete chain of authorship/source metadata are not the same thing.

## Sound effects

`reference/ceferino-0.97.8/src/audio.cc` loads these 12 WAV files, in this exact order:

1. `tiro.wav`
2. `mata.wav`
3. `pierde.wav`
4. `tecla1.wav`
5. `tecla2.wav`
6. `tic.wav`
7. `gancho.wav`
8. `toc.wav`
9. `romper.wav`
10. `alarma.wav`
11. `item.wav`
12. `boom.wav`

`explo.wav` is present in the historical directory but is not loaded by the 0.97.8 audio subsystem, so it remains reference-only.

Most effects are mono 8-bit PCM at 11025 Hz. `tiro.wav` is mono 8-bit PCM at 44100 Hz; `boom.wav` is mono 16-bit PCM at 22050 Hz. No WAV contains an embedded author or third-party license tag. `boom.wav` contains only an `ISFT` tool tag identifying GoldWave as the editor; that is software metadata, not a rights claim over the audio content.

The exact author/source of each individual SFX is not stated in `AUTHORS`. However, the files are directly covered by the package's explicit per-directory GPL-2.0-or-later notice and no conflicting embedded term was found. For this restoration they are therefore cleared for runtime use, with the lack of individual source attribution documented here rather than hidden.

The active copies under `/public/assets/audio` are byte-identical to the originals and are checked by the automated test suite.

### Playback semantics

The original calls `Mix_PlayChannel(0, ..., 0)`: every SFX uses SDL_mixer channel 0. A new effect therefore interrupts the previous effect instead of mixing many effects simultaneously. The browser audio player reproduces that single-channel behavior.

The browser maps the source events that are actually called by the 0.97.8 code: shot, ball hit, life loss, menu tick/select, trident hook, normal shot touching the ceiling, block break and item pickup. `boom.wav` is loaded historically, but its only call in `bomba.cc` is commented out, so the parity build does not invent a bomb sound.

### Historical C++ defect not reproduced

`audio.h` declares `Mix_Chunk *sonidos[11]`, while `audio.cc` loops from 0 through 11 and loads 12 entries. That is an out-of-bounds write in the original C++ implementation. It is documented as archaeology but intentionally not reproduced in JavaScript because it is memory corruption, not meaningful gameplay behavior.

## Music: `menu.xm`

The module is 132,408 bytes and identifies itself as:

- title: `oooooooooootro tema`
- encoder: `Converted by MID2XM`
- duration as decoded by FFmpeg: about 50.848 seconds
- 8 channels
- 25 patterns
- 3 instruments

The embedded sample names include:

- `Marimba`
- `Fingered Bass A1`
- `Fingered Bass G2`
- `Fingered Bass A#2`
- `Bass`
- `Snare`
- `Hand Clap`
- `Tom`
- `Open hi-hat`

`AUTHORS` credits **Javier Da Silva** for music, and the music directory is explicitly GPL-2.0-or-later. What the release does not document is the origin of the General-MIDI-style sample material inserted by MID2XM. No contradictory license statement was found, but no independent sample-bank provenance was found either.

For the strict preservation policy used by this project, `menu.xm` therefore remains under `/quarantine/music` and is not converted to another format for runtime playback. Converting it would reproduce the same unresolved embedded samples, not solve the provenance question.

## Result

- historical SFX: **enabled**, package license verified, individual source attribution incomplete but no conflicting evidence;
- historical XM music: **preserved but disabled**, package license verified, embedded sample provenance unresolved;
- historical bitmap fonts: unaffected by this audit and remain quarantined separately.
