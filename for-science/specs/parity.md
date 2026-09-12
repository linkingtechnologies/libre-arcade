# Parity status

## Browser restoration baseline 0.3

The primary behavioral target is the preserved **For Science! 1.0.1** tree under
`/reference/postcompo-1.0.1`. PyWeek `final2` remains the historical comparison
baseline.

### Core/gameplay parity implemented

- 640×480 logical canvas with responsive scaling.
- Original 10×10 board geometry and original image/audio/font assets.
- Six tile types and random initial board.
- Orthogonal swap rules and invalid-swap reversal.
- Directional match detection ported behaviorally, including duplicate score records.
- Original money/resource scoring quirks.
- Gravity/refill without automatic cascades.
- Original costs, shield repair and random damage ranges.
- Dr X human vs Dr Z AI and Demo AI vs AI.
- v1.0.1 pattern-search AI and attack-choice weighting.
- Two-consecutive-timeout board reset behavior.
- Menu, options, fullscreen toggle and music toggle.
- Web Audio API using the original audio assets.
- No framework; client-side ES modules only.

### Deterministic Python 2.7 oracle

`src/core/random.js` implements the MT19937 state initialization and 53-bit
`random()` construction used by CPython, plus the Python 2.7 `randint`/`randrange`
and `shuffle` behavior used by the original game.

Baseline 0.3 no longer relies on a single hand-picked seed. The independent
`tools/regenerate-python27-oracle.py` script generates fixtures using the Python
2.7 algorithms rather than importing the JavaScript port. Regression checks cover:

- initial 10×10 boards and original-AI moves for seeds 0, 1, 2, 7, 42, 123,
  999, 65535 and 4294967295;
- gravity/refill for four independent seeded states;
- repair, normal and aggressive AI asset decisions across multiple seeds;
- damage plus target-jitter RNG consumption for multiple seeds.

`npm run test:stress` additionally exercises seeds 0 through 999. At the 0.3
baseline all 1000 AI moves are adjacent and produce a valid match after swapping.

For manual parity work, opening the browser port with e.g. `?seed=123` uses that
seed without adding a user-facing debug control. `?autostart=game` and
`?autostart=demo` are test/capture hooks and are deliberately absent from the UI.

Unseeded runs are not expected to reproduce a particular historical playthrough:
the original seeded from OS entropy when available, and that entropy value was
never recorded.

### Input parity improved in 0.3

- `screen_to_board()` reproduces the original Cocos virtual-coordinate conversion,
  Python `int()` truncation and floor-division boundaries. The 2 px visual gaps
  therefore belong to a cell exactly as they did upstream.
- `screen_to_asset()` follows the original integer boundaries rather than enlarged
  browser-friendly hit boxes.
- Board clicks reproduce the original `clicked` flag: at most one board pointer
  action is accepted per rendered frame and the flag is reset after drawing.
- Right-click/non-primary behavior remains ignored as upstream.

### Visual/timing parity improved in 0.3

In addition to the 0.2 timing work:

- the menu-to-game/Demo transition reproduces the vendored Cocos
  `FadeTransition(..., 1.0)`: 0.5 s fade to black, scene switch at the midpoint,
  then 0.5 s fade from black;
- the incoming game scene begins its own intro timing when the transition starts,
  matching Cocos scene lifetime rather than delaying initialization until the
  screen is fully visible;
- meteor orientation now follows the exact upstream `meteorite_right`/`left`
  selection: Dr X uses the horizontally flipped sprite from the upper-left,
  Dr Z the unflipped sprite from the upper-right;
- cow and rocket launch transforms are source-derived for both players;
- attack target jitter consumes the original `randint(-10, 10)` in the correct
  RNG position;
- the explosion reproduces the original Cocos action-expression quirk. Its nominal
  delayed fade would last to 3 s, but the parallel scale branch kills the sprite
  at 2 s, when fade opacity is only about 50%; the browser now disappears at that
  same point rather than completing the fade;
- original fonts are awaited before first render to reduce avoidable metric changes;
- HUD cost/count labels use the source-derived Cocos coordinates rather than
  approximate browser offsets.

See `specs/timing.md` and `specs/visual-parity.md` for the detailed source anchors.

### Preservation guarantees

`npm test` currently contains **65** regression/audit checks. In addition to game
rules they verify:

- both original source archives against their SHA-256 values;
- every file in both expanded `/reference` trees against preservation manifests;
- all 35 files in `/assets/original` are byte-identical to the corresponding
  `/reference/postcompo-1.0.1/game/data` files;
- key parity decisions remain anchored to exact constructs still present in the
  preserved 1.0.1 source (input conversion, click gating, meteor flip, explosion
  action and Cocos FadeTransition).

## Preserved upstream quirks

These are intentionally not “cleaned up” in parity mode:

1. duplicate score records produced by directional match scanning;
2. long non-money matches can award more bonus money than the visual label alone
   suggests because the extra-money record is multiplied again by `add_score()`;
3. shield repair can raise the internal shield value above 100 while the drawn
   bar remains clamped;
4. refills do not auto-score cascades;
5. the AI can wait for timeout when its hard-coded pattern search finds no move;
6. an invalid swap does not reset the turn timer;
7. the explosion is killed halfway through its nominal delayed fade because of
   the original Cocos action composition.

## Deliberate browser reconstruction / divergence

- Browser audio must obey autoplay restrictions, so music may wait for a gesture.
- Quit cannot close an ordinary browser tab; the port tells the player to close it.
- The menu uses accessible HTML controls over the original title art instead of
  recreating the old Cocos menu widgets pixel-for-pixel.
- The original timeout can race an in-flight swap/AI callback and potentially
  leave invalid callback state. The browser avoids reproducing that crash-prone
  race while retaining normal timeout semantics.

## Remaining parity gaps

1. **A direct executable-vs-browser frame capture is still missing.** This work
   environment has no usable Python 2.7 runtime for the preserved Cocos/Pyglet
   executable, and a compatible runtime could not be installed here. Baseline 0.3
   therefore uses source anchors plus independent deterministic state oracles rather
   than claiming a visual comparison that was not actually run.
2. **Frame interpolation and rasterization are not pixel-identical by definition.**
   The timing, endpoints, transforms and original assets are source-faithful, but
   Canvas and Pyglet/OpenGL can differ in subpixel sampling, alpha blending and
   font rasterization.
3. A future archival environment with Python 2.7 + the original OpenGL/audio stack
   should execute the capture protocol in `specs/visual-parity.md` on the same
   fixed seeds and compare key frames.

There are currently no known rule, AI, scoring, board-generation or seeded-RNG
parity differences in the tested paths. Production browser-shell additions through release
1.1.0 are documented separately in `production-ready.md`.
