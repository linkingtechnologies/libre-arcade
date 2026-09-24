# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Gameplay, flight model, camera, asteroids, saucers, particles, scoring | Asteroids Infinity by Ben Whittaker (SourceForge project `asteroidsinf`, owner display name `zebbedy`) | `AsteroidsInfinity-1.2.py`, 46,601 bytes, 1012 lines, SHA-256 `1a806d89fa02ba599fed3c735a9c442fe5355128bbc66c0039e50eb160949e22` | GPL-3.0-or-later (verified in the file header, see below) | Reimplementation in JavaScript (`public/src/`), function by function, **not** a translation tool's output; the mapping is in `specs/port-map.md` |
| Original Python source | same release | the file above, preserved unchanged | GPL-3.0-or-later | `reference/AsteroidsInfinity-1.2.py`, byte-identical, listed in `SHA256SUMS.txt` |
| Original release archive | `AsteroidsInfinity1.2.zip` | SHA-256 `b0adc1fe656722e23142b9ee6a3cf51b2b3c743827e45356a50d4580dfbc2b20`, as recorded by the delivered `reference/README.md` | GPL-3.0-or-later | **Not** in this repository. The audit that produced the port kept it, with the font and the audio, in a separate bundle |
| `Vectorb.ttf` (Vector Battle) and the original WAV effects | the same archive | — | not established | Excluded on purpose. Redistribution rights were never resolved, so they are neither shipped nor reproduced |
| Oracle fixtures | the original Python methods, executed | `test/oracle-asteroids-m2.json` (asteroid construction and 87 ticks of drift, with the RNG draws taped), `test/oracle-camera-reversal-m0.json`, `test/oracle-corrected-m0.json` | measurements of the original | Used by the Node tests; the M2 fixture was regenerated during integration and came out byte-identical (below) |
| Browser adaptation: DOM interface, English/Italian strings, touch controls, help and credits screens, seven synthesized Web Audio cues, browser storage | this repository (2026) | — | GPL-3.0-or-later | New work. The synthesized cues contain no historical sample |

The port was built in twelve milestones, each of which delivered its own report, test record and release gate. Those 42 files are condensed into [`specs/AUDIT.md`](specs/AUDIT.md), which also lists what was dropped and why; the complete original set stays in the delivered archive.

## The license, and what kind of evidence we have

The original is the GNU General Public License **version 3 or, at the recipient's option, any later version**. The evidence is the header of the preserved source itself, lines 8 to 11:

> it under the terms of the GNU General Public License as published by
> the Free Software Foundation, either version 3 of the License, or
> (at your option) any later version.

This matters because the SourceForge project page states the shorter string "GNU General Public License version 3.0 (GPLv3)", with no "or later". Under the collection's rule the file header wins: it is the author's own statement inside the work. The port is therefore GPL-3.0-or-later, the same as the collection default, and `LICENSE` carries the full GPL v3 text.

## What was checked independently

- **The license header**, quoted above, read in `reference/AsteroidsInfinity-1.2.py`.
- **The SourceForge project page**, fetched on 24 September 2026. Title "Asteroids Infinity", owner `zebbedy`, registered 12 June 2009, last updated 16 July 2013, latest version 1.2, one downloadable file `AsteroidsInfinity1.2.zip` of 69.1 kB, license "GNU General Public License version 3.0 (GPLv3)". The summary on the page names the features the port keeps: "Nifty elastic viewpoint (viewpoint is loosely attached to the ship)", "Upholds Newtons 1st law", highscores and configurable controls. A page fetch is a snapshot; it says nothing about what the project holds today beyond what the page states.
- **The asteroid oracle.** `test/make_oracle_asteroids_m2.py` extracts `Asteroid.__init__`, `Obj.update` and the wave-spawning statement from the preserved source and executes them under Python 3 with a group-free stub. Re-running it during integration rewrote `test/oracle-asteroids-m2.json` byte for byte identically (SHA-256 `8a1fe2e98f24c5bfad572b122d16cd43ca9d30034b0e5609d8ffd2fdbbb965b6` before and after), so the fixture the tests compare against really does come from the original code.
- **The historical text formats.** `test/original_file_oracle_m7.py` executes the original `get_controls`, `save_controls`, `get_highscores` and `save_highscores` from the preserved source and compares the files they write with the JavaScript parser and formatter. Both round-trip byte for byte. This was run during integration and passes.
- **The line references in the port.** Each module names the lines of the original it follows. Four of them were checked by reading the preserved source: `Obj.update` (226 to 238), the first wave (810 to 821), the camera block (938 to 955) and the unconditional viewpoint integration (992 to 993). They match the JavaScript in `public/src/core.js` and `public/src/asteroids.js`, `dt` standing where the original divides by its measured `fps`.
- **The tests.** 113 Node tests pass after the move to `public/`, and `test/test_http_assets_m10.py` serves the page and checks that every module resolves over HTTP.

## What was not re-verified

- That `reference/AsteroidsInfinity-1.2.py` is byte-identical to the copy inside the `AsteroidsInfinity1.2.zip` offered on SourceForge. The archive is not in this repository and was not downloaded; the 69.1 kB figure on the page and the SHA-256 recorded in `reference/README.md` are the only links between them.
- The original as a running program. Python 2 and Pygame were not available, so no native session was ever executed: the oracles above run individual historical methods under Python 3. Nothing here claims frame-level or audiovisual parity.
- The Playwright tests (`test/browser_smoke_m*.py`, `test/browser_full_session_m10.py`). They need Playwright and Chromium, which are not installed here. The page was instead driven directly in a headless Chrome, on desktop and at phone width: the menu, a full game to level 2, the How to play and Credits screens.
- Real audio output, a physical phone, and the final hosted address.

## What was not ported, and why

- **The original sounds and the Vector Battle font**, for the rights reason above. The seven Web Audio cues are new, synthesized on the device, and can be switched off.
- **Python's random number generator.** The port calls the same draws in the same order (the degenerate `uniform(-2π, -2π)` included) but through `Math.random`, so the sequence of values differs. Tests that need exact values replay a taped sequence.
- **Pygame's frame scheduling.** `pygame.time.Clock.tick(100)` becomes a measured `requestAnimationFrame` step capped at 100 Hz, with gaps over 250 ms skipped.
- **The save format.** Browser storage holds JSON; the historical `controls.txt` and `highscores.txt` are supported as explicit import and export instead.

## Open acceptance items

Publishing still needs one look at the deployed address in an ordinary browser: first render, a full game, sound on real speakers, a phone in both orientations, and the score and control transfer tools.
