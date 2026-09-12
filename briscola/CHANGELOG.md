## v1.7.29

- Calibrated the masked CPU levels from the verified 296,400-game Arena sample:
  `Maestro` now always selects BriscolaBot v3, while the four former mixed-pool
  opponents move to `Esperto`.
- Alternate the opening player after every completed game, including successive
  best-of-three games and rematches with the same settings.

## v1.7.28

- Clarified the active series score as `Manche 👤 1–0 🤖`, making the human and
  opponent sides immediately recognizable on desktop and smartphone.

## v1.7.27

- During an active best-of-three series, the top-left game header now shows the
  completed-manche score (for example, `Manche 1–0`). It stays hidden during
  the first manche and the final modal continues to show the series result.

## v1.7.26

- Added a selectable **Al meglio delle 3** format. The UI keeps the series score,
  draws award no win, and the series ends when either side reaches two wins.
- Both **Rigioca** (or **Prossima manche**) and **Nuova partita** now generate a
  seed that is guaranteed to differ after the same uint32 normalization used by
  the game engine.

## v1.7.25

- Removed the decorative bullet shown on an empty table while preserving the empty placeholder element for layout stability.
- Realigned the player and Arena documentation with the current 39-player registry: 16 core/historical players plus 23 PoIAna agents.
- Added the software intelligence restoration mission statement to the README.
- Preloads and decodes every card face and back after deck selection before starting a game, preventing first-use image lag.
- Hides the BriscoLab attribution footer on smartphone-width screens while retaining it on larger displays.
- Replaces the pig shorthand in the compact smartphone game header with the explicit "Briscola" title.
- Ensures both rematches and new games opened through settings receive a seed different from the previous game, while preserving manual seed entry.
- Removes upstream win-rate percentages from PoIAna model names shown in difficulty information and player-facing selectors.
- Removes the unused empty `bergamasche`, `napoletane`, and `piacentine` deck directories.

## v1.7.24

- Historical card backs are no longer clipped or rounded at the image layer, preserving source pixels at the bitmap edges while keeping each deck's native aspect ratio.

## v1.7.23

- Removed per-deck back image insets. Historical backs now use the exact same card box, deck aspect ratio, 100% sizing, and `object-fit: contain` geometry as card fronts.

## v1.7.22

- Back-image inset is now configured per deck manifest instead of globally.
- Viterbesi Murari 1900 keeps a 1% safe inset to protect the historical lower frame.
- Napoletane Pignalosa 1882 uses 0% inset and renders the back at full size.
- Each deck continues to use its own manifest width/height aspect ratio.

## v1.7.21

- Added a minimal 0.5% safe inset around historical card-back images so tightly cropped printed frames remain fully visible at small browser sizes, without the thick border from v1.7.18.

## v1.7.20

- Removed the unnecessary desktop page scrollbar during gameplay by fitting the game shell to exactly 100dvh and letting the table flex into the remaining viewport space. Setup-page scrolling remains available where genuinely needed.

## v1.7.19

- Reverted the generic back-image inset and now render historical card backs at the exact deck aspect and full image size, avoiding the excessive border introduced in v1.7.18.

## v1.7.18

- Added a small inner margin to rendered card backs so historical deck backs do not appear visually cut at the bottom.

## v1.7.17

- Removed the opponent skill stars from the in-game table; difficulty stars remain available in setup and algorithm information.

## v1.7.16

- Replaced emoji-based card hover labels with full Italian card names such as `Asso di spade`, `Tre di denari` and `Cavallo di coppe`.
- The same readable labels are used for card accessibility text.

## v1.7.15

- Dated JBriscola to 2009 in the algorithm information panel.
- Added “Powered by BriscoLab” before the project payoff in both footers.
- Renamed in-game CPU-facing copy to “Avversario”.
- Moved turn/event notifications below the stock and exposed trump, including trick-point notices such as “Tu +5”.
- Moved “Tu” and “Avversario” to the left of their turn LEDs beside each hand.

## v1.7.14

- Corrected the BriscolaBot v3 year shown in the AI information UI to 2023.

## v1.7.13

- Corrected Italian end-of-game wording: “Hai vinto”, “Ha vinto la CPU”, and “Pareggio”.

## v1.7.12

- Moved the active-turn indicator from the player caption to the left of each hand, preserving the existing active/resolving states.

## v1.7.11

- Removed the trump-suit badge shown next to the exposed trump card in the center table UI.

## v1.7.10

- Fixed the difficulty-algorithm information dialog inheriting white text from the dark game theme.
- Added explicit high-contrast light-dialog colors and a regression test.

## v1.7.9

- Difficulty info popup now states that years refer to the restored code/artifact.
- Corrected Cuperativa restored-code year to 2021.
- Confirmed removal of the obsolete Arena aggregation/masked-engine warning from the setup UI.

## v1.7.7

- Simplified the new-game setup copy.
- Removed the benchmark/masked-engine explanatory sentence.
- Removed deck technical metadata from the setup screen.
- Hid the internal CSS fallback deck from the user-selectable deck list.
- Renamed `Opzioni laboratorio` to `Opzioni avanzate`.

## v1.7.6

- Moved the project payoff to an actual footer in both setup and game screens.
- Added explicit anti-regression tests for restored setup/menu/debug, animations, responsive card geometry, historical decks, and v1.7 archaeology engines.

## v1.7.5

- Setup label changed from `🤖 Bravura CPU` to `Bravura avversario`.

## v1.7.4

- Renamed the player-facing title to **Grugnetto's Briscola**.
- Setup branding now renders as `🐽's` on the first line and `Briscola` on the second.
- Updated compact in-game branding and browser title consistently.

## v1.7.3 — full UI restoration

- Restores the complete v1.6.1 player UI/UX instead of selectively reimplementing it.
- Restores the pre-game setup screen, compact in-game menu, reveal-hand control, AI debug panel, game-over modal, card/deal/trick animations, safe-area handling, responsive card geometry, and presentation hold for resolved tricks.
- Restores the bundled **Viterbesi–Murari 1900** deck that was accidentally dropped in the v1.7 line.
- Keeps the bundled **Napoletane Pignalosa 1882** deck and loads both decks through the manifest-driven registry.
- Keeps all v1.7 archaeology engines: πG/πH/πC, Briscola.js S0/S1, CardFramework Cpu0/1/2, PoIAna, BriscolaBot and historical engines.
- Adds regression tests covering UI features, both historical decks and the archaeology roster.

## v1.7.2

- Restored the pre-game **Nuova partita** setup screen removed in the 1.7.x UI rewrite.
- Difficulty and deck are selected before starting a match again.
- Laboratory options preserve explicit engine selection and seed control.
- The in-game **Nuova partita** button now returns to setup instead of immediately redealing.
- Preserves all v1.7.1 archaeology engines and the bundled Pignalosa 1882 deck.

# Changelog

## 1.7.0 — recovered Briscola.js AI

- Recovered the historical single-player AI behavior from the deployed
  `calogxro/briscola.js` demo bundle.
- Added `Briscola.js S0`, the handcrafted early/mid-game heuristic.
- Added `Briscola.js S1`, the actual demo CPU: S0 through trick 17, then
  full alpha-beta search for tricks 18–20.
- Preserved the upstream `minimax_decision` discovery in documentation without
  exposing it as a separate player because the single-player demo does not
  select it.
- The original Briscola.js bundle is **not redistributed** because no explicit
  upstream license was found; BriscoLab contains a fresh GPLv3 behavioral
  reconstruction only.
- Endgame opponent cards are inferred solely from public information after the
  stock is exhausted; no hidden engine state is used.
- Final 39-player global Arena benchmark: **148,200 games** (100 paired seeds per matchup). Briscola.js S1 ranks **17th at 51.49%** (Medio); S0 ranks **30th at 44.96%** (Facile).
- Updated the player-facing difficulty calibration to the v1.7.0 39-player results.

# BriscoLab changelog

## v1.6.0 — player-facing responsive UI and CPU difficulty bands

- Reworked the browser UI for a single human player instead of a debugging/laboratory surface.
- Added five player-facing CPU difficulty bands derived from the 133,200-game global Arena benchmark: **Facile <45%**, **Medio 45–52%**, **Difficile 52–58%**, **Esperto 58–62%**, **Campione ≥62%**.
- The normal UI selects CPU strength; the exact historical/RL engine remains available only under **Impostazioni avanzate**.
- In difficulty mode, a reproducible engine from the selected band is chosen from the integrated 37-player pool for each seeded deal.
- Added a prominent turn banner: `Tocca a te`, `Tocca alla CPU`, `La CPU sta pensando…`, and trick-resolution states.
- Added a visual trick hold so the CPU card remains visible for about 1.2 seconds even when it completes the trick; this changes presentation only, never engine resolution.
- Removed live scores, seed display, opponent-hand reveal, and the debug JSON panel from the normal UI. Final scores appear only when the game ends.
- Kept laboratory internals available under `window.briscolab` in browser DevTools.
- Rebuilt the table/card layout around responsive `clamp()` sizing, dynamic viewport units, compact mobile controls, and landscape handling.
- Archived the final v1.5.0 37-player global benchmark JSON/Markdown under `arena/results/`, since it is now the calibration source for UI difficulty.
- Validation: **116/116 tests pass**.

## v1.5.0 — CardFramework.Maui Cpu0 / Cpu1 / Cpu2 archaeology

- Added **CardFramework Cpu0**, **Cpu1**, and **Cpu2** as three independent BriscoLab players from `CardFramework.Maui 1.6.20`.
- Preserved the exact GPLv3 NuGet package used for archaeology under `reference/cardframework/` together with its inline XML API documentation and SHA-256 hashes.
- Recovered the implementation by direct IL decompilation of `CardFramework.Maui.dll`, not by guessing from the public README.
- Preserved CardFramework's original insertion/bubble hand ordering, point-based `getSoprataglio`, Cpu0/Cpu1 truncated trump scan (`i < numeroCarte - 1`), and Cpu1's otherwise-unused random draw.
- Preserved Cpu2's probabilistic behavior: unconditional trumping of >4-point non-trump leads when a trump exists, 50% trump decisions in the lower-value branch, and 50% attempts to overtake a trump lead.
- CardFramework's optional `stessoSeme` flag defaults to `false`; BriscoLab uses that original default for Briscola mode rather than imposing a follow-suit rule that Briscola does not have.
- Replaced only the upstream process-global `System.Random` source with BriscoLab's seeded RNG so Arena runs are reproducible while preserving the original branch probabilities.
- Added all three players to the browser selector and the core Arena registry.

## v1.4.0 — Giacomelli deterministic policy archaeology

- Added **πG Greedy**, **πH Hoarder**, and **πC Counter** from Piero Giacomelli's 2026 Briscola Monte Carlo study as three independent BriscoLab players.
- Preserved the published cheapest-card comparator (`points → strength`), non-trump lead preference, πH's 10-point trump-spending threshold, and πC's public-memory `carico` trap.
- πC retains the initially exposed trump in public memory even after that card is later drawn.
- Added all three players to the browser selector and Arena registry.
- Added provenance/licensing notes for the MIT-declared upstream `.NET 8` simulator.
- No unavailable upstream `Program.cs` is fabricated; this release explicitly labels the port as reconstructed from the paper's operational definitions until a verbatim source snapshot is archived.
- Validation: **104/104 tests pass**, including pairwise completion against all previously integrated core algorithms.

## v1.3.0 — PoIAna multi-agent RL family

- Integrated all **23 pretrained PoIAna ONNX agents** as independent browser player identities.
- Added a faithful `float32[519]` observation vectorizer from upstream `OnnxState.FlatOneHot()`.
- Preserved PoIAna's exact 0/1/2 hand-index action contract, including its decrement behavior when fewer than three cards remain.
- Identified 21 standard DQN policies and two QR-DQN/50-quantile policies (`toasty-pine`, `devout-paper`) directly from the supplied ONNX graphs.
- Added deterministic pure-JavaScript neural evaluators for Arena use, with tensors extracted verbatim from the original ONNX binaries.
- Cross-checked all six ONNX tensors against the supplied Stable-Baselines3 `q_net` checkpoints for every matching DQN model: **21/21 bit-for-bit matches**.
- Added a separate `npm run arena:poiana` round robin so the historical eight-player benchmark remains stable by default.
- Added SHA-256 preservation manifest for all original ONNX models and derived Arena tensor bundles.
- Validation: 98/98 automated tests pass; a 23-player smoke round robin completed 506 games with no illegal moves or runtime failures.
- Preserved focused upstream game/training sources under `reference/poiana/` and added explicit licensing/provenance notices.
- The publisher page declares PoIAna code GPLv3 and assets CC BY 4.0; the supplied GitHub ZIP snapshots themselves contain no root LICENSE file, which is documented rather than silently inferred away.

## v1.2.0 — Random benchmark baseline

- Added `RandomAdapter`, a BriscoLab-native player that selects uniformly from the current legal hand.
- Uses `SeededRandom`, so Arena runs remain reproducible with independent per-player seeds.
- Added Random to the human-vs-AI browser selector and to the shared Arena registry.
- Added unit and multi-algorithm integration coverage for the eighth player identity.
- Updated benchmark/reference contracts to distinguish native control players from upstream-preserved players.
- BriscolaBot v3 remains the bundled browser ONNX player introduced before this release.
- Random baseline validation: 14,000 games against the seven existing players (1,000 seed pairs/opponent, both seats), 13.95% wins and 41.50 average points; artifact stored under `arena/results/benchmark-v1.2.0-random.*`.

## v1.1.0 — BriscoLab identity and repository contracts

- Renamed the project and package from Briscola Lab / `briscola-lab` to **BriscoLab** / `briscolab`.
- Adopted the tagline *Preserving, porting and benchmarking Briscola AIs*.
- Moved all AI-vs-AI simulation tooling under `arena/` and historical benchmark artifacts under `arena/results/`.
- Added dedicated round-robin, head-to-head, and single-player Arena scripts sharing one player registry.
- Added `specs/` as the normative home for architecture, observation, adapter, faithful-porting, reference, and benchmark contracts.
- Added root `AGENTS.md` with coding-agent/contributor rules.
- Kept the browser UI focused on human-vs-AI play.
- Added backward-compatible reads for the previous `briscola.*` localStorage keys while writing new preferences under `briscolab.*`.
- No faithful AI algorithm or Briscola rule was intentionally changed.

## Historical development notes

BriscoLab separates the application into independent layers:

1. **Web UI** (`src/ui/WebUI.js`)
2. **Briscola engine** (`src/core/`)
3. **AI ports and adapters** (`src/players/`)

The engine exposes `getObservation(playerId)` and `legalActions(playerId)` as
the boundary for players. Faithful ports keep original algorithm-specific names
when useful for source traceability; adapters and all new project code use
English names, comments, and documentation.

## Run

ES modules must be served over HTTP rather than opened with `file://`:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Alternatively:

```bash
npm run serve
```

## Tests

```bash
npm test
```

## Engine features

- 40-card Italian deck;
- Briscola ranking and scoring;
- trick winner evaluation;
- trick winner draws first;
- exposed trump is the final drawable card;
- 120 total points;
- deterministic seed for exact game reproduction;
- `getObservation(playerId)` never exposes the opponent's hand;
- DOM events: `cardplayed`, `trickwon`, `turnchanged`, `gameover`, `statechange`.

## UI

The browser UI is algorithm-agnostic. A `null` player is human-controlled; an
object implementing `chooseAction(observation)` is machine-controlled. The UI
currently allows the user to select QBriscola, Cuperativa, smBrisCola Empirico1, smBrisCola Empirico2, JBriscola, Pryscola, BriscolaBot v3, or the Random baseline as the opponent.
The user-facing UI remains Italian; internal code and project documentation are
English.

## v0.2 — multi-deck rendering

The UI includes a deck registry (`src/ui/DeckRegistry.js`) and a separate card
renderer (`src/ui/CardRenderer.js`). The engine does not know which artwork is
selected. Regional bitmap assets are not bundled yet; the symbolic renderer is
used until provenance and license evidence are packaged with each deck.

## v0.3 — faithful QBriscola AI port

Added `src/players/qbriscola/QBriscolaAI.js`, a JavaScript port of the QBriscola
1.1 CPU logic, kept separate from both UI and engine. Original Italian method
names are preserved to make source comparison straightforward.

## v0.4 — Human vs QBriscola

Added `src/players/qbriscola/QBriscolaAdapter.js`. The adapter translates only
the public `PlayerObservation` into the state expected by the faithful port and
returns a normal `PLAY_CARD` action. It also retains the originally exposed
trump after it is drawn, matching QBriscola behavior. `stockCount` maps 1:1 to
`mazzoMax`.

Integration tests include 100 deterministic complete games and verify that every
adapter-generated move is legal and every game ends with 120 distributed points.

## v0.5 — Cuperativa master and opponent selection

Added the faithful port of CuperativaSoloRuby's Briscola `:master` algorithm:

- `src/players/cuperativa/CuperativaAI.js` — pure algorithm port using original labels;
- `src/players/cuperativa/CuperativaCard.js` — ranking, points, and label mapping;
- `src/players/cuperativa/CuperativaAdapter.js` — `PlayerObservation` to Cuperativa-state translation;
- `reference/cuperativa/` — untouched copies of the Ruby reference files and MIT license.

The reference snapshot is `CuperativaSoloRuby-master` from 2021-04-03, with
archive commit `e972b10ff072ef373325ab98cc8b055db35732bc`.

### Cuperativa fidelity check

The original Ruby algorithm was executed as an oracle, with one compatibility
change required for a Ruby 1.8-era numeric-character conversion on modern Ruby.
Across **500 randomly generated states**, the JavaScript port selected the same
card in **500/500 cases**. R1...R12 rule ordering, weights, `strozzi_on_suite`,
and implementation quirks are intentionally preserved.

### Benchmark

Run:

```bash
npm run benchmark
```

The benchmark executes 5,000 seeds twice while swapping player positions, for
10,000 total games. On the v0.5 development snapshot the initial result was:

- QBriscola: 5,101 wins;
- Cuperativa: 4,672 wins;
- draws: 227;
- average points: QBriscola 61.0712, Cuperativa 58.9288.

This measures the algorithms through BriscoLab's engine/adapters; it is not
an absolute measurement of the original applications' strength.

## Language policy from v0.6 onward

All new project code identifiers, adapter code, comments, tests, debug messages,
and technical documentation must be written in English. Original identifiers
inside faithful ports may remain in their source language when preserving them
improves traceability against the upstream implementation. Files stored under
`reference/` are untouched upstream source snapshots and are exempt from this
policy.

## v0.7 — smBrisCola Empirico1 and Empirico2

Added the two heuristic players from smBrisCola 2005-09-27 as **separate
BriscoLab players**:

- `SmBriscolaEmpirico1AI` / `SmBriscolaEmpirico1Adapter`;
- `SmBriscolaEmpirico2AI` / `SmBriscolaEmpirico2Adapter`.

The shared `SmBriscolaAI` module contains the faithful translation of the
legacy Python methods, while the two thin AI/adapter classes give each original
algorithm an independent identity in the UI, tests, and benchmark.

The original `briscola_player.py` is preserved under `reference/smbriscola-empirico1/` and `reference/smbriscola-empirico2/`.
Both upstream algorithms are memoryless hand-crafted heuristics. Empirico2 is
kept separate because its decisions differ materially from Empirico1, including
more conservative handling of zero-point tricks and trump cards.

### smBrisCola fidelity check

The translated JavaScript was compared with the original Python implementation
on **3,000 randomized decision states**, split evenly between Empirico1 and
Empirico2. The result was **3,000/3,000 identical card selections**.

### Round-robin benchmark

`npm run benchmark` now runs a reproducible round-robin among all exposed AI
players. For every pair and seed, the players also swap seats so first-player
position is balanced. Pass a different number of seed pairs if needed:

```bash
node arena/scripts/round-robin.mjs 5000
```

The v0.7 validation snapshot using 1,000 seed pairs per head-to-head matchup is
stored in `arena/results/benchmark-v0.7.json`. It is intended as a reproducible development
baseline rather than a definitive strength ranking.


## v0.8 — JBriscola

Added JBriscola 0.3.1 as a fifth independent player:

- `src/players/jbriscola/JBriscolaAI.js` — faithful `GiocatoreHelperCpu` port;
- `src/players/jbriscola/JBriscolaCard.js` — original 0..39 encoding and `Carta.Compara`;
- `src/players/jbriscola/JavaRandom.js` — `java.util.Random` compatible generator;
- `src/players/jbriscola/JBriscolaAdapter.js` — public observation adapter;
- `reference/jbriscola/` — untouched upstream Java reference files.

The adapter reproduces the CPU hand ordering performed by the original
`Giocatore` with `ordinaMano=true`, including the legacy behavior where a newly
drawn card is inserted before an existing card when `Carta.Compara` reports
equality.

### JBriscola fidelity check

The original Java `GiocatoreHelperCpu` was compiled and executed as an oracle.
A deterministic seed was injected only into its private `java.util.Random` so
the random branch could be compared exactly. Across **3,000 randomized decision
states**, the JavaScript port produced **3,000/3,000 identical hand indexes**.

The original `rand.nextInt() % 10 < 5` behavior is intentionally preserved, as
is the branch where that random value is overwritten by a hand index before the
remainder check.

### Five-player benchmark

The v0.8 baseline uses 1,000 seed pairs for each head-to-head matchup, with both
seat orders. With five players this produces **20,000 games**. The reproducible
result is stored in `arena/results/benchmark-v0.8.json`.



## v0.9.1 — reference tree normalization

`reference/` now maps one-to-one to the six integrated AI players. QBriscola has
its own provenance folder, while smBrisCola Empirico1 and Empirico2 have separate
folders containing identical untouched copies of the shared upstream
`briscola_player.py`. No game logic, adapters, or benchmark behavior changed.

## v0.9 — Pryscola

Added Pryscola as a sixth independent player from the uploaded `pryscola.tar.gz`
upstream snapshot:

- `src/players/pryscola/PryscolaAI.js` — faithful port of `Player.aiplaycard()` / `getchoice()`;
- `src/players/pryscola/PryscolaCard.js` — legacy French-suit card model and `Card.beats()` behavior;
- `src/players/pryscola/PryscolaAdapter.js` — public observation adapter with persistent legacy hand ordering;
- `reference/pryscola/` — untouched upstream `briscola.py` and COPYING file.

The original CPU is intentionally simple. It leads with hand index 0. When
replying, it sorts `Player.hand` in place by card points, tries a same-suit
point-value overtake, may spend a trump only on a point-bearing current winner,
and otherwise falls back to index 0. The adapter preserves the resulting legacy
hand order across later tricks because subsequent draws are appended to that
mutated list in the original application.

### Pryscola fidelity check

The original Python implementation was executed as an oracle. Across **3,000
randomized decision states**, the JavaScript port matched both the selected card
and the post-decision hand ordering in **3,000/3,000 cases**.

### Six-player benchmark

The v0.9 baseline uses 1,000 seed pairs for every head-to-head matchup, with
both seat orders. With six players this produces **30,000 games**. The complete
reproducible result is stored in `arena/results/benchmark-v0.9.json`. Ranking by overall win
rate in this development baseline:

1. QBriscola — 61.82%, 65.07 average points;
2. Cuperativa — 59.77%, 63.68 average points;
3. smBrisCola Empirico2 — 58.42%, 64.74 average points;
4. smBrisCola Empirico1 — 58.10%, 64.29 average points;
5. Pryscola — 37.11%, 56.24 average points;
6. JBriscola — 18.49%, 45.99 average points.

These results measure the faithful ports through BriscoLab's common engine
and adapters; they are not absolute measurements of the original applications.

## Licensing

BriscoLab project code is distributed under **GNU GPL version 3 only**
(`GPL-3.0-only`). The complete license text is in `LICENSE`.

Faithful AI ports retain upstream attribution and provenance. Original upstream
snapshots under `reference/` remain under their original licenses rather than
being relicensed by the root project declaration. See `THIRD_PARTY_NOTICES.md`
and `THIRD_PARTY/` for the complete third-party notices and license texts.

Regional card artwork is not bundled yet; future non-code assets must be
licensed and documented independently before inclusion.

## v0.9.2 — licensing normalization

- Added root `LICENSE` with GNU GPL version 3.
- Declared project code as `GPL-3.0-only` in `package.json`.
- Added SPDX identifiers to BriscoLab source, test, benchmark, HTML, and CSS files.
- Added `THIRD_PARTY_NOTICES.md` with per-player provenance and upstream license information.
- Preserved untouched upstream source snapshots and their original licenses under `reference/`.
- No game logic or AI behavior changed.


## v1.0.0 — BriscolaBot v3 / ONNX Runtime Web

Added the pretrained PPO agent from `LetteraUnica/BriscolaBot` as the seventh
independent opponent:

- `src/players/briscolabot/BriscolaBotVectorizer.js` — exact 162-float public-state encoding and 40-action mask used by the upstream environment;
- `src/players/briscolabot/BriscolaBotRuntime.js` — lazy browser-only ONNX Runtime Web session;
- `src/players/briscolabot/BriscolaBotAdapter.js` — model action to normal `PLAY_CARD` translation;
- `reference/briscolabot/` — upstream provenance and verified model signature;
- `assets/models/briscolabot/briscola-bot-v3.onnx` — bundled original upstream model.

The upstream observation is four 40-card one-hot planes (completed thrown cards,
original exposed trump card, current table card, current hand) plus the two
player scores normalized by 120. BriscoLab reconstructs this solely from
`PlayerObservation`; the opponent hand and hidden stock are never exposed to the
model.

ONNX Runtime Web and `briscola-bot-v3.onnx` are loaded only when BriscolaBot is
selected. Other opponents therefore pay no ML download or initialization cost.
The default implementation uses the WebAssembly execution provider and keeps one
ONNX session alive for the whole game.

The supplied upstream model has one input named `input` with shape
`float32[1,202]`: the first 162 values are the observation and the final 40
values are the legal-action mask. Its output is `action` with shape `int64[1]`.
The graph itself contains the final categorical `Multinomial` sampling step, so
the browser uses that selected action directly and the engine still performs its
normal legality validation.

The original 474,612-byte ONNX model is bundled locally and is no longer fetched
from the upstream repository. ONNX Runtime Web itself remains lazy-loaded only
when BriscolaBot is selected. Model SHA-256 is recorded alongside the asset.

The Node test suite validates the vectorizer, card mapping, exact 162+40 feed
construction, adapter state, and legal action translation. The real ONNX graph
was also inspected from the bundled binary: actor dimensions are
162 -> 256 -> 256 -> 40 with Mish activations, followed by legal masking and
`Multinomial` action selection.

### Benchmark note

The original ONNX graph performs stochastic `Multinomial` sampling internally,
so its random stream cannot be seeded by `BriscolaGame`. Starting with v1.0.2,
`arena/scripts/round-robin.mjs` uses the exact 117,800 actor parameters extracted from that same
upstream model, evaluates the same 162 -> 256 -> 256 -> 40 Mish network in
JavaScript, and performs the mathematically equivalent categorical sampling with
`SeededRandom`. This preserves the learned policy distribution while making the
round-robin reproducible.


## v1.0.1 — bundled BriscolaBot model and corrected ONNX signature

The real upstream `briscola-bot-v3.onnx` is now bundled under
`assets/models/briscolabot/`. Inspecting the binary exposed an integration bug in
v1.0.0: the exported model does **not** have separate observation and mask
inputs. It has a single `float32[1,202]` input. The runtime now concatenates the
162-float observation and 40-value legal mask exactly as required by the model.

No heuristic player behavior or Briscola engine rules changed in this release.


## v1.0.2 — deterministic BriscolaBot benchmark policy

BriscolaBot now participates in the normal deterministic round-robin without
changing the browser gameplay path. The normal UI still executes the untouched
upstream `briscola-bot-v3.onnx`; only the benchmark stops before the model's
internal `Multinomial` node and samples the resulting legal logits with the
laboratory seed.

New artifacts:

- `assets/models/briscolabot/briscola-bot-v3-policy.bin` — the six actor tensors
  extracted byte-for-byte from the upstream ONNX model (117,800 float32 values);
- `assets/models/briscolabot/briscola-bot-v3-policy.json` — offsets, shapes and
  provenance for those tensors;
- `assets/models/briscolabot/briscola-bot-v3-logits.onnx` — derived copy of the
  same graph exposing the masked 40 logits before stochastic sampling;
- `src/players/briscolabot/BriscolaBotDeterministicRuntime.js` — pure JavaScript
  actor inference for Node/browser benchmark use.

The JavaScript actor output is checked against an independent NumPy forward pass
with tolerance `1e-5`. Repeated benchmark runs with the same seeds produce
byte-identical JSON output.

### Seven-player baseline

The v1.0.2 baseline uses 1,000 seeds for each pair and swaps player positions,
for **42,000 complete games**:

| Player | Win rate | Average points |
|---|---:|---:|
| **BriscolaBot v3** | **65.89%** | **66.78** |
| QBriscola | 58.36% | 63.73 |
| Cuperativa | 56.20% | 62.49 |
| smBrisCola Empirico1 | 54.64% | 62.90 |
| smBrisCola Empirico2 | 54.23% | 63.08 |
| Pryscola | 35.16% | 55.53 |
| JBriscola | 17.71% | 45.51 |

Directly against QBriscola, BriscolaBot v3 scores **1,125 wins to 821**, with
54 draws over 2,000 games. Full pairwise data is stored in
`arena/results/benchmark-v1.0.2.json`.

The complete v1.0.2 Node suite contains **78 tests**, including all seven players in the cross-algorithm integration test.
