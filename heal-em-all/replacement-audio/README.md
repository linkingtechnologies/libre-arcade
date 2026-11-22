# Replacement audio for Heal'em All

Decision (user, 2026-11-22): the 14 original audio files have no recoverable licence, no authors were to be contacted, so the sounds are **replaced**.
These seven WAV files are the replacements. They are *new* material, not the original sounds; the soundscape will differ from the 2013 game.

| Game sound (`Game.audio.*`) | Replacement | Origin | Licence |
|---|---|---|---|
| `gunShot` (`gun_shot`) | `gun_shot.wav` | Kenney "Sci-fi Sounds" `laserSmall_000.ogg` | CC0 |
| `collected` | `collected.wav` | Kenney "Interface Sounds" `confirmation_001.ogg` | CC0 |
| `playerHit` (`player_hit`) | `player_hit.wav` | Kenney "Impact Sounds" `impactPunch_medium_000.ogg` | CC0 |
| `humanCreated` (`human_created`) | `human_created.wav` | Kenney "Interface Sounds" `confirmation_003.ogg` | CC0 |
| `zombieNotice` (`zombie_notice`) | `zombie_notice.wav` (0.9 s growl) | synthesised, `tools/synth-audio.mjs` | GPL-3.0, own work |
| `playerBg` (`player_bg`) | `player_bg.wav` (32 s seamless loop) | synthesised, same script | GPL-3.0, own work |
| `zombieMode` (`zombie_mode`) | `zombie_mode.wav` (24 s seamless loop, 80 bpm) | synthesised, same script | GPL-3.0, own work |

## Provenance

* Kenney packs were downloaded on 2026-11-22 from https://kenney.nl/assets/impact-sounds, `/interface-sounds`, `/sci-fi-sounds` (zip sizes 800,850 / 834,536 / 5,875,104 bytes). Each pack's own `License.txt` says "Creative Commons Zero, CC0 ... free to use in personal, educational and commercial projects. Support us by crediting Kenney or www.kenney.nl (this is not mandatory)". Copies are in `licenses/`. Crediting Kenney is still done, as a courtesy.
* The four Kenney sounds were decoded from `.ogg` in Chrome and re-saved as 16-bit mono WAV (`tools/ogg-to-wav.mjs`); nothing else was changed, so they are unmodified apart from the format and the mono mix-down.
* The three synthesised sounds contain no third-party samples. They are deterministic: re-running the script gives the same files.

## Status and limits

* **Not yet auditioned by a person.** The author of this work cannot listen; picks were made by file name. Expect to swap some choices after listening. `tools/ogg-to-wav.mjs` has the mapping in one table.
* Technical checks done: all seven decode in Chrome; durations 0.24, 0.29, 0.43, 0.32, 0.9, 32, 24 s; loop seam jump is within the normal sample-to-sample step; the unmodified original game loads with them and reaches the title with no errors (`evidence/replacement-audio-experiment.json`; WAV data was served at the `.ogg` URLs for that experiment).
* The game asks for `.mp3`/`.ogg`. Shipping WAVs needs one game-side change in M2 (`audioSupported: ['wav']`, or an ogg encode if a Vorbis encoder is available). Quintus already supports `wav`.
* Size: about 2.6 MB, dominated by the two loops. They can be shortened or encoded later.
* Not in the game yet: there is no `public/` folder. These files are staged here, outside any distributable package.
