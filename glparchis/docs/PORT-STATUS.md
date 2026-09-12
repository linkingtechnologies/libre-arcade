# Browser restoration status — Phase 5

## Production status

**The standalone browser game is production ready for static hosting.** It has no build step, runtime dependency, framework, server requirement or remote service call. It can be hosted directly on GitHub Pages or any static web server.

The playable build uses GPLv3 rule/AI/board data from glParchis 20181125 and newly written HTML/CSS/Canvas/Web Audio presentation. Original media remain preserved only inside `reference/` and are not loaded by the web application.

## Implemented gameplay

- native 3, 4, 6 and 8-seat boards;
- four pawns per player;
- arbitrary human/CPU mix and local hot-seat play;
- historical start-player dice contest and tie rerolls;
- compulsory home exit on 5;
- special start-square capture behaviour;
- 6 grants another throw and counts as 7 when all pawns are out;
- barriers and compulsory barrier opening on 6;
- safe squares;
- capture +20;
- goal +10;
- exact finish/no bounce;
- three consecutive 6s and final-ramp exemption;
- victory with all four pawns at goal;
- historical scoring formula in the core;
- original probabilistic AI priority order and thresholds;
- historical AI threat-analysis bug preserved bug-for-bug;
- local save/resume;
- responsive Canvas board;
- Italian and English UI;
- optional clean-room Web Audio sound cues;
- deterministic seeded/scripted core for regression testing.

## Intentionally different from the native application

The OpenGL desktop presentation is replaced by responsive Canvas graphics. Historical raster icons, textures, avatars and WAV files are not used because their provenance is not sufficiently clean for the web release. Audio is generated from new oscillator code.

The old global installation/game statistics and update HTTP calls are intentionally omitted. They are not required for gameplay and do not belong in a privacy-friendly static restoration. Native high-score file import is also outside scope; the original score formula remains implemented and tested at core level.

## Validation

Phase 5 passes the automated core/UI/audio suite, including complete deterministic CPU-only games on all four board sizes. The playable source was also statically checked to ensure it contains no remote HTTP calls and no references to the quarantined PNG/WAV media.


## Phase 5 responsive fix

On desktop, the square board now fits to the smaller of the available column width and the remaining viewport height. This prevents a wide layout on a short screen from pushing the lower half of the board below the fold. On screens up to 900 px wide the normal stacked, full-width mobile layout is retained. Extremely short desktop viewports keep a small usability floor and may scroll rather than rendering an impractically tiny board.
