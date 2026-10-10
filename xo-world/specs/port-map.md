# Port map

Original: `reference/javagames-1.0/xoworld.java` (Java 1.x applet, 1,180 lines, Milan Babuskov). Port: `src/xoworld-engine.js` (class `XOWorldEngine`, the rules and the computer player) and `src/game-model.js` (class `XOWorldGame`, the move flow). The browser build wraps both without changing them (`tools/build-browser.js`, `public/xoworld-bundle.js`); the drawing and input are in `public/app.js`.

## Verification level

Following the collection's verification hierarchy (root `AGENTS.md`), the game logic is at **Level 1, an executable oracle**: the original source is compiled unmodified and run, and the port is compared with what it answers.

- **How.** `test/java-oracle/XOWorldOracle.java` instantiates the original class and drives it only through its own entry points: the "New game" and board clicks go through the original `mouseUp()`, and single positions through the original `igraj()`. No rule is re-implemented in the harness. `tools/java-oracle.js` plays seeded games in lockstep: the original answers, the port must give the same reply, board, move counter and game status after every click.
- **What was compared.** The 22 positions of the package's behavioural oracle, whose expected moves the original reproduces. Then 2,000 games: 27,287 clicks, including 2,467 clicks the original refused (occupied squares, clicks after the end of a game), 238 games abandoned halfway by a new game, 68 games won by X, 1,541 by O, 153 ending on a full board. The original object is kept between games exactly as the applet keeps it, while the port starts every game from a clean reset, so the lockstep also shows that the reset is equivalent to the applet's own "New game".
- **Coverage.** The recorded transcript exercises 100% of the lines and 98.9% of the branches of `xoworld-engine.js`, and 100% of the lines of `game-model.js` (`node --test --experimental-test-coverage test/java-oracle.test.js`). Search depth 7, the cap, was reached in 18 of the 2,000 games, in addition to the delivered case O-22.
- **Other runtimes.** The same lockstep run, 300 games each with other seeds, also agrees on Java 21 (the source recompiled for release 8) and on the compiled `xoworld.class` of 2007 from the archive (Java 5 class format).
- **Recorded and live.** `npm test` replays the recorded transcript (`test/fixtures/java-oracle.json`, tied by SHA-256 to the original source and to the harness) and needs no Java. `npm run test:live` runs the original again and compares afresh; it needs a JDK and a display, because the original extends `java.applet.Applet`, whose constructor refuses to run headless (use `xvfb-run` on a machine without one). `JAVA` and `JAVAC` choose the tools. To record again: `node tools/java-oracle.js record`.

**Limits.**
- The games are produced by four seeded styles of human play (random, near the stones, a greedy line builder, a builder that also blocks). They reach most of the CPU's tactics, but they are a sample, not an exhaustive enumeration of positions; the CPU wins most of them.
- The original's random fallback cannot be seeded. Whether it was used is decided by running sixteen copies of the original on the same state and seeing whether they disagree; with three or fewer empty squares the copies can agree by chance, and then the port is allowed to take the fallback and the reply is recorded as one. In a fallback reply, what is compared is that the original's choice is acceptable to the port's fallback rule, not the random draw itself.
- Java throws on an out-of-range array index where JavaScript returns `undefined`. No click in the recorded runs made the original throw, so no such difference was reached.

## Methods

| Java (`xoworld.java`) | JavaScript | Notes |
|---|---|---|
| `trtotp`, `tptotr` (61, 66) | `trtotp`, `tptotr` | Copy between the search stack `tr[dub]` and the work array `tp`. |
| `check5` (72) | `check5` | Five-window scan, three modes (`SETFLAGS`, `CHECK`, `CLEAN`). Both diagonals write into the shared array `p`, as the original does. |
| `countc4` (187) | `countc4` | Counts closed fours, the `SAFE` mode uses the flag board `tf`. |
| `check24c` (351) | `check24c` | Double closed four. |
| `checko4c` (372) | `checko4c` | Open four, four modes (`CHECK`, `SETFLAGS`, `COUNT`, `CLEAN`). |
| `checkc4o3` (499) | `checkc4o3` | Closed four plus open three. |
| `PostaviFlags` (519) | `PostaviFlags` | Marks risky squares in `tf`. |
| `setc4c`, `seto4cc` (529, 638) | `setc4c`, `seto4cc` | Mark candidate squares in `tp`, one for the search, one for the "dummy defence". |
| `check2o3c` (765) | `check2o3c` | Keeps the original's quirk: when it finds a hit it leaves its trial stone on the board it was given, which is the real board, and the caller then overwrites that square with the computer's O. |
| `checkIzmedju` (781), `checkCross` (801), `checkBox` (817) | same names | The three small pattern checks. |
| `pobeda` (844) | `pobeda` | Winner of the board. |
| `OdigrajPotez` (983) | `OdigrajPotez` | The reply tried inside the search. |
| `checkSerie` (996) | `checkSerie` | The bounded forced-sequence search, `DUBINA = 7`. The port also records `maxDepthObserved`, which the original does not, so tests can see how deep a decision went. |
| `igraj` (1032) | `igraj` | The decision ladder, rule order unchanged. The random fallback calls an injectable `randomFn` (default `Math.random`). |
| `mouseUp` (1133) | `XOWorldGame.playHuman`, `newGame` | The original reads pixel coordinates and handles the "New game" button; the port takes a square index (0 to 99) and checks it is an integer in range before the original's own test (occupied, game over, more than 49 human moves). A reset clears every working array, where the original's "New game" clears only the board, the move counter and the status; the lockstep run shows no difference. |
| `init`, `run`, `paint`, image loading (887 to 981) | none | The 300 by 340 pixel applet and its eight images are replaced by `public/app.js` drawing on a Canvas. |

## What the port adds

- A **draw banner** when the board fills up (the original draws nothing for it) and the text for English and Italian.
- Keyboard, touch and responsive layout, and a help and credits dialog. The win banner keeps the original's wording "You WIN!!!"; the original's other banners read "YOU LOSE" and "IT'S YOUR TURN...", which the port words differently.
- `randomFn` injection, `maxDepthObserved`, and range checks on the square index.

None of these changes a move the computer plays.

## Tests

| File | What it checks |
|---|---|
| `test/java-oracle.test.js` | Replay of the recorded original, see above. |
| `test/oracle.test.js` | The package's 22 positions against the port, in plain JavaScript. |
| `test/model.test.js` | Move flow and both terminal states. |
| `test/bundle.test.js` | The browser bundle is what the build tool makes, and the engine and model sources are the certified ones. |
| `test/browser-smoke.test.js` | The bundle loads in an empty VM and plays a move. |
| `test/ui-contract.test.js`, `keyboard-nav.test.js`, `viewport-contract.test.js` | Markup, keyboard and layout contracts of the browser build (text checks on the files, plus a real-browser check recorded in `screenshots/`). |
| `test/release-contract.test.js`, `test/package-contract.test.js` | What may ship in `public/`, and the licence, provenance and preserved-source checks. |

The package's own development notes and captured logs, with its milestone labels (M2 to M8), are kept unmodified in `docs/development/`. In them `qa/` is now `test/` and `web/` is now `public/`. The first line of the generated bundle also says "M3": that is the package's name for the milestone at which the engine was certified.
