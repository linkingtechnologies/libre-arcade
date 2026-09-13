# Architecture

## Platform and libraries

Original/OS4 snapshot: C++ using SDL 1.x, SDL_image, SDL_mixer and libxml2. The OS4 Makefile additionally links Vorbis/Ogg, JPEG, PNG, zlib, pthread and AmigaOS4 compatibility libraries.

Native coordinate system: **800x600**. Main simulation target: **25 FPS**.

## Main loop

`BubbleTrainWorld.cpp` performs:

1. frame start `SDL_GetTicks()`;
2. SDL event polling;
3. window/input dispatch;
4. current widget animation;
5. drawing;
6. screen flip/update;
7. sleep until the 40 ms frame budget expires.

The simulation is therefore frame-step based rather than delta-time based. A web port should use a fixed 25 Hz simulation accumulator and decouple rendering.

## Module map

- `Game` — campaign/game-manifest progression, credits/retries, cumulative time, high-score transitions.
- `Level` — owns cannons, train stations and active bullets; collision dispatch; win/loss state.
- `TrainStation` — owns one `Track`, one active `Train`, one `CarriageFactory`; feeds/returns carriages.
- `Train` — active carriage list, spacing/ripple movement, insertion, match removal, bombs and speed effects.
- `Carriage` — wrapper around `Bubble` plus track/station state.
- `Bubble` — colour/effect state and animation for rainbow/speed effects.
- `Cannon` — input-controlled orientation, reload timing, current/next bullet.
- `Bullet` — straight-line projectile state.
- `BulletFactory` — random/limited bullet population from XML.
- `CarriageFactory` — random or explicit train population from XML, with no-initial-triple constraint.
- `Track` — ordered section dispatcher and transition logic.
- `TrackLine`, `TrackArc`, `TrackSpiral` — geometry, movement and insertion-side calculation.
- `Theme` — graphics, bitmap fonts, sounds, music and drawing helpers.
- `LevelEditor` — XML level authoring UI.
- `Options` — credits, sound, mouse and key configuration.
- `WindowManager` + widgets — menu/dialog UI layer.
- `FastestTime` — persistent ranking table.
- `LevelTimer` — pause-aware elapsed time.

## Persistence/config

Runtime state includes XML configuration and a high-score file (`bubbletrain.hsc`). Game and level definitions are XML. No gameplay save-state system was found; persistence is configuration/high-score oriented.

## Random

Startup calls `srand((unsigned)time(NULL))`; gameplay and cosmetic code then call global `rand()`. Randomness affects carriage generation, bullets, rainbow colours, speed-bubble multiplier and explosion particles.

For the web port, preserve normal nondeterministic play by generating a fresh seed, but route all **gameplay-affecting** randomness through a seeded RNG object. Use a separate cosmetic RNG for particles so replay determinism is not polluted by rendering effects.

## Browser target mapping

Faithful target:

- C++/SDL surfaces -> Canvas 2D
- SDL event loop -> fixed-step simulation + browser events
- SDL_mixer -> Web Audio
- libxml2 level/theme loaders -> DOMParser or a small validated XML loader
- linked-list dependency -> native JS arrays/data structures, **not a translation of quarantined `List.h`**
- filesystem paths -> static client-side URLs / bundled data

No framework is required.
