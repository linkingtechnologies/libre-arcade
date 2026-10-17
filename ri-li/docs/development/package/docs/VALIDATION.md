# Release-candidate validation

The release candidate is validated at several layers.

## Behavioral parity

- original C++ reference scenarios: **16,265 comparisons**
- mismatches: **0**
- compared state includes float32 distance/spacing, board contents, RNG-derived wagon types, wagon geometry, score/lives and input priority

## Campaign and content

- 50/50 levels load and render
- full 1→50 campaign state machine: **623 checks**
- 50 quizzes, 49 level transitions and final high-score transition covered
- asset manifest: 2,506 extracted sprite frames, with required gameplay/quiz UI assets present

## Release shell

Automated checks cover:

- menu → game → Guide → menu → Options flow
- responsive no-page-scroll shell and touch controls
- localStorage persistence and reset
- audio-manager state transitions
- all 9 WAV effects byte-identical to the upstream originals
- all 12 browser audio files decode successfully with an independent FFmpeg pass

## All-level gameplay soak

A deterministic 60-second simulated-input soak is run independently from every one of the 50 levels. It exercises real movement, routing input, pickups, collisions, death pauses/reloads and rendering geometry while checking for invalid numbers, board corruption and trajectory-history overflow. The same run is repeated and required to produce an identical summary.

## Environment limitation

A full real-browser visual/audio device matrix cannot be certified inside this container. Its Chromium runtime hangs on DBus even for minimal local/data pages. Browser/module behavior is therefore tested with deterministic DOM/Canvas/Audio mocks, while the actual Canvas rendering formulas and gameplay core have separate validation.

Before tagging a final public release, a short manual check on desktop Chromium/Firefox and at least one touch device remains recommended, especially for audible output, viewport fit and touch comfort.

## Certified 50-level completion

A separate final gate performs an actual solution replay rather than merely loading, rendering or soaking each level. Every one of the 50 levels has been completed at the validated 16 ms simulation step using only legal directional-priority inputs.

- 50/50 levels won by collecting the final wagon
- 1,042/1,042 wagons collected
- 0 collisions across the certified per-level routes
- 2,154 junction decisions
- one continuous 1→50 campaign replay also reaches the final high-score state with `completedCampaign=true`

See `docs/PLAYTHROUGH.md`, `test/playthrough_solutions.json`, `reports/LEVEL_PLAYTHROUGH_RESULTS.csv` and `reports/FULL_CAMPAIGN_PLAYTHROUGH.json`.
