# Port map

Original: `reference/bomber-1.0/src/GameCanvasBomber.java` (Java ME, 11,868 bytes) and `Bomber.java` (the MIDlet). Port: `public/src/game-state.js` (the rules), `rng.js` (`java.util.Random`), `audio.js` (tones and melodies), with the drawing in `renderer.js` and the loop, timing and input in `app.js`.

## Verification level

Following the collection's verification hierarchy (root `AGENTS.md`), the game logic, the random generator and the sound data are at **Level 1, an executable oracle**: the original loop is compiled unmodified and run, and the port is compared with what it does.

- **How.** `test/java-oracle/` holds minimal stand-ins for the MIDP classes the original uses (`GameCanvas`, `Graphics`, `Image`, `Sprite`, `Manager`) and a class named `Thread` in the unnamed package. The original is in the unnamed package too, and a class of the same package shadows `java.lang.Thread`, so its `Thread.sleep(141)` lands in the stand-in, which only adds up the milliseconds. The original loop then runs as fast as the machine allows, on the calling thread, with `random` replaced by a seeded `java.util.Random` (the original seeds it from the clock). `tools/java-oracle.mjs` runs the port with the same seed and the same key presses and compares one line per iteration: the original's `appStatus` before and after, score, landings, high score, plane and bomb positions, plane frame, the 26 heights, caps and colours of the city, the tones played and the milliseconds waited.
- **Keys.** The original has one key. A harness policy decides it (never; at random; always; on tall buildings; on any standing building) and the decisions are recorded, so the port replays exactly the same presses. The original's first `getKeyStates()` call of each iteration discards its result, so the policy answers on the second call, the one that counts.
- **What was compared.** 250 seeded runs of 3,000 iterations each: 750,000 iterations, 1,540 games, 1,290 crashes, 93 landings (two in one game at most), 46,278 bombs, 37,474 impacts destroying 106,779 blocks, best score 407. The port agrees after every iteration. Also `java.util.Random.nextInt` against `rng.js` for 7 seeds, including a negative one, with 1,000 bounds each from 1 to 100, so every power of two among them.
- **Coverage.** The transcript exercises 99.2% of the lines and 86% of the branches of `game-state.js`, and every line of `rng.js`.
- **Recorded and live.** `npm test` replays the recording (`test/fixtures/java-oracle.json`, tied by SHA-256 to the original source and to the harness) and needs no Java. `npm run test:live` runs the original again. `JAVA` and `JAVAC` choose the tools. To record again: `node tools/java-oracle.mjs record`.

**Limits.**
- The MIDP stack itself is not run: the real timing of a phone, the key latching of `getKeyStates()`, the rendering and the sound output are replaced by the stand-ins. The sizes of the screen are the stand-in's (240 by 320); the original uses them only for the background and the title text.
- The original's own compiled class is not in this repository, but it was run too (see "The compiled class" below), once, by hand.
- Five key policies reach most of the game, but cities beyond two landings (heights above 14) are rare in the sample. The generator is checked separately for every bound.
- The milliseconds the port's driver expects for the startup screen (3,000) and the crash flashes (30 times 100) are constants in `tools/java-oracle.mjs`, taken from `app.js` by reading, not by running it.

## The compiled class

The archive's `classes/GameCanvasBomber.class` (dated 18 December 2008, three days before the source) names `java.lang.Thread` in its constant pool, so the same-package trick does not reach it. `redirectThread()` in `tools/java-oracle.mjs` rewrites, on a copy held in memory, the two constant-pool entries that spell the class (`java/lang/Thread` and the field descriptor `Ljava/lang/Thread;`) to the stand-in's name, and refuses to run if anything else mentions it; the file itself is not changed. Run with `BOMBER_CLASS=path/to/GameCanvasBomber.class node tools/java-oracle.mjs check`, taking the class from the SourceForge `Bomber.zip` (it is not redistributed here).

- **Result.** 250 runs of 3,000 iterations with the recording's seeds: the 750,000 iterations come out with the same totals as the source build (1,540 games, 1,290 crashes, 93 landings, 37,474 impacts, best score 407) and the port agrees with them after every iteration, including the motor tone after a landing. A further 100 runs with another seed agree on Java 21 as well, and the source build agrees on Java 21.
- **What it shows.** On this sample the binary of 18 December and the source of 21 December behave identically, so whatever was edited in those three days did not change the game's behaviour.
- **One detail.** The binary calls `Graphics.drawImage` with a `void` descriptor, so the stand-in `Graphics` declares it `void` (the source ignores the result and compiles either way). Keep it `void`.
- **Not the same as a phone.** It is still the stand-in MIDP and virtual time, not a device.

## What the port does differently

| Original | Port | Effect |
|---|---|---|
| After a landing, the same iteration goes on into the "move the bomb" branch with no bomb and plays one motor tone | No such tone | Inaudible: 141 ms of the engine between two melodies. The oracle normalises it away and counts it (93 in the recording) |
| `LevelInitialization()` does not reset `bombLife` | `initLevel()` does | None: a launch resets it before it is read |
| A crash draws one random plane frame per flash, 30 in all | `app.js` draws one per 100 ms step, 30 in a normal run | Only with `?seed=`: if a browser frame is dropped, the random stream of the next city drifts. Normal play is seeded from the clock |
| Sleeps 141 ms after each iteration's work | A fixed 141 ms timer | The port is never slower than the original on a slow device |
| One key, read with `getKeyStates()` | Space, Enter, click, tap or the DROP button; a press is remembered until the next tick | **A deliberate difference, making the game easier on short taps.** The original's first call per iteration discards latched presses, so a press only counts if the key is down when the second call runs and a press shorter than a tick (141 ms) can be lost. The port first did the same (measured in a browser, two runs of 25 presses each: 12 to 16 of 25 presses of 30 ms and 14 to 20 of 25 of 70 ms registered). It now keeps a press until the next tick, so every press with no bomb in flight drops one: 25 of 25 key presses at 5, 30, 70 and 150 ms and 20 of 20 pointer presses of 15 ms on the canvas and on the DROP button. Holding the key still works. The oracle is not affected: the key presses are its input, not something the port decides |
| The title card names "ORIGINAL GAME BY JOSEPH DUFFY" and "J2ME ADAPTATION BY JUAN J LUNA" | The same two credits, with plain wording for the second ("MOBILE VERSION BY", "VERSIONE MOBILE DI" in Italian) and the first translated ("GIOCO ORIGINALE DI"); names unchanged | The package's title screen lacked them; they were added. "J2ME" is kept out of the player-facing text (the Credits dialog says "mobile phone version") because it is jargon; the documents keep the technical term |
| Graphics from four PNG files | Canvas primitives, one "crashed" look for plane frames 1 to 3 | None on the rules |
| Tones through `Manager.playTone` | Square waves through Web Audio from the same note numbers and durations | The sound differs from a phone's; the data is the original's |

## What the port adds

English and Italian text, a credits dialog, an audio switch, a DROP button for touch screens, a responsive layout on a fixed 240 by 320 canvas, and two query parameters: `?seed=N` reproduces the city generation, and `?qa=1` skips the startup delay; either also exposes the running game as `window.__bomber` for automated browser tests.

## Tests

| File | What it checks |
|---|---|
| `test/java-oracle.test.mjs` | Replay of the recorded original, see above |
| `test/parity.test.mjs` | The package's own parity assertions (constants, a seeded city, wrap, landing, bomb launch, impact) |
| `test/production.test.mjs` | What may ship in `public/`, the preserved original's checksums and licence header, the two languages, the documents |

The package's development notes, with their prose list of the original's rules, are kept unmodified in `docs/development/`.
