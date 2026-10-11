# Third-party notices

## Bomber J2ME, by Juan Jose Luna Espinosa

- Author, from the source headers: Juan Jose Luna Espinosa, "Copyright (C) 2007". The archive was published on SourceForge (project `bomberj2me`, <https://sourceforge.net/projects/bomberj2me/>) by the account `yomboprime`, which is his, as two other projects of the same account show: the Files page of Colorator ("Brought to you by: yomboprime") shows a `README.txt` that reads "Copyright (C) 2010 Juan Jose Luna Espinosa", and the discussion forum of Batiscafo (also "Brought to you by: yomboprime") has a post, "version 1.0" of 18 January 2014, whose author is displayed as "Juan José Luna Espinosa" with a profile link to `yomboprime`. Both pages were read on 11 October 2026.
- Historical release: `Bomber.zip`, SHA-256 `274c78e5b4060aaab52b6fc336fc16245566b9c0b66bde7532e0738f3840e560` (identical to the file SourceForge serves), files dated December 2008, target CLDC 1.1 and MIDP 2.1.
- Components ported: `GameCanvasBomber.java` (the whole game) and `Bomber.java` (the MIDlet that starts it), preserved unmodified in `reference/bomber-1.0/src/` with the GPL text that came with them.
- Licence: GNU General Public License, "version 3 of the License". The "or later" grant is not there: the headers stop at version 3, so the original is GPL-3.0-only and so is this port. The SourceForge project page labels the project "GNU General Public License version 2.0 (GPLv2)"; the files themselves, and the `GPL.txt` that ships with them, say version 3, and this port follows the files.

The JavaScript game state in `public/src/game-state.js` is a port of the loop in `GameCanvasBomber.java`: the plane and bomb movement, the collision test, the impact that destroys up to three blocks, the city generation with its difficulty growth, and the order in which the original draws its random numbers. `public/src/rng.js` is a port of `java.util.Random`, and `public/src/audio.js` carries the original's three melodies and its tone parameters. The port map, [`specs/port-map.md`](specs/port-map.md), says how each was checked.

## The original game credited by Bomber J2ME: Joseph Duffy

Several historical programs are called Bomber. They include a ZX Spectrum game attributed to Joseph Duffy and dated 1983 in World of Spectrum's catalogue (<https://worldofspectrum.org/archive/software/games/bomber-spectrum-computing>), other Spectrum games of the same name published in the following years (one of them by Paul Shreeve, 1984), and separate Java ME projects such as `j2mebomber`.

Bomber J2ME states on its own title card "ORIGINAL GAME BY JOSEPH DUFFY", and the port shows the same lines. That is the historical link documented by the game itself, and it is the basis of the attribution used here. The SourceForge project page adds that the game is "based on a Spectrum 48k classic original game". It is not independently shown that the Bomber by Joseph Duffy now catalogued in the Spectrum archives is exactly the program the J2ME author took as his reference: the identification is plausible, not certified. A direct comparison of the Spectrum game with Bomber J2ME could strengthen it; it is not needed to preserve the Java ME version faithfully.

No code, graphics or sound of any Spectrum game is used here.

## Graphics and sound

The archive's four PNG resources (plane, bomb, buildings and the loading screen) have no authorship or licence information, so none is redistributed and the browser game draws its own plane, bomb and buildings with Canvas primitives. No AI-generated assets are used. The sounds are square waves generated with Web Audio from the note numbers and durations of the original's `Manager.playTone` calls; no recorded sound is used.

The page uses the system font stack and loads no external fonts, scripts or media. The only external request is the analytics beacon described in the collection's root `AGENTS.md`.
