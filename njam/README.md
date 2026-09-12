# Njam 1.21

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/njam/index.html)**

Player interface: **Italiano / English**, selectable from Options. The choice is remembered locally. — Browser preservation port

The browser UI is bilingual (Italian / English). Change **Lingua / Language** from **Opzioni / Options**; the choice is remembered locally.

A framework-free HTML5/JavaScript preservation port of **Njam**, the SDL Pac-Man-like game by Milan Babuskov.

The primary behavioural reference is the **AmigaOS4 Njam 1.21 package (8 Nov 2005)** ported by Kjell Breding/Sharakmir. Its complete C++ source, documentation, graphics, audio and level sets are preserved under `reference/`. Upstream/Debian 1.25 is retained only as a secondary comparison; later gameplay fixes are not silently substituted for 1.21.

## Current release — local/offline edition

This build targets the complete **local/offline** Njam 1.21 experience rather than only the game core:

- original 800×600 main-menu artwork, Pac-Man selector, version label, Top 10 table, scrolling ticker and scripted information window;
- original Options overlay semantics for Music, Sound and Skin, with browser persistence replacing `njam.conf`;
- One Player;
- Two Player cooperative play;
- Two Player Duel, including random DUEL maps, eight ghosts, injected power-ups, race-warning sounds and first-to-four match scoring;
- all five COOP and all four DUEL level sets shipped in the OS4 1.21 package;
- source-order 34 ms simulation loop, READY/SET/GO, life loss, scoring, statistics and source-timed end-of-game flows;
- Shaddy/Hunter/Assassin ghost behaviours, including nearest-visible-active-player targeting in multiplayer;
- cookie, juice, freezer, invisibility, trap, teleport and 50-point rules, including source quirks;
- original skins, sprites, bitmap fonts, HUD/result art, WAV effects and tracker music (with Ogg browser playback derivatives);
- original-style in-canvas high-score entry and Top 10 rules, with `localStorage` replacing `hiscore.dat`;
- COOP/DUEL level editor with the original 13,440-byte format, original keyboard workflow, bitmap-font sidebar, validation, load/save/save-as adaptations and **T TEST** behaviour;
- responsive presentation of the historical 800×600 surfaces plus optional touch controls, without page-level vertical scrolling;
- deterministic regression support via `?seed=12345`.

**Host network duel / Join network duel are deliberately not included in this release.** They have been removed from the player-facing menu so the interface only advertises working features. The historical network protocol remains preserved and documented in the source tree for possible future work; no WebRTC/WebSocket transport is enabled.

See `specs/PARITY.md` for the audited status.

## Run

Serve the directory over HTTP, for example:

```text
php -S 127.0.0.1:8000
```

or:

```text
caddy file-server --listen :8000
```

Then open `http://127.0.0.1:8000/`.

## Main controls

- Main menu: Up / Down / Enter / Esc, matching the original menu flow.
- Player 1: arrow keys; WASD is also accepted in One Player mode as a browser convenience.
- Player 2: R / F / D / G, matching the original 1.21 defaults.
- P: pause/resume.
- Esc during One/Two Player: forfeit a shared life; Esc again from LIVES LEFT exits, matching 1.21.
- Esc during Duel: end the current round and score current map points.
- Touch: optional P1/P2 D-pads outside the preserved 800×600 canvas.

## Editor

The editor opens as a blank COOP set, as in 1.21. Historical keyboard operations are preserved:

- `K` COOP/DUEL kind;
- `P` playable marker;
- `C` clear;
- `L` load;
- `S` save;
- `A` save as;
- `T` test;
- `U` undo;
- `W` swap;
- `Z` / `X` previous/next map;
- `0`–`9` paint the current tile;
- arrows move the editor cursor;
- `Esc` exits, with the original-style unsaved confirmation.

Browser sandboxing prevents an SDL-style unrestricted filesystem browser. Load/save therefore uses the File System Access API when available and a normal file-picker/download fallback otherwise. The exported `.COOP` / `.DUEL` bytes retain the original format.

## Verification

With Node.js 22+:

```text
node test/core.mjs
```

The suite checks original-vs-embedded map bytes, runtime corner clearing, One/Two/Duel setup, scoring/collisions, duel first-to-four and race-warning state, power-up edge cases, death/respawn flows, high-score insertion, editor binary round-trip and editor T TEST setup.

Basic syntax checks:

```text
node --check src/main.js
node --check src/game.js
node --check src/editor.js
node --check src/highscores.js
```

## Licensing

Njam's historical source explicitly permits redistribution/modification under **GPL-2.0-or-later**. New browser-port source is **GPL-3.0-or-later**. Historical material in `reference/` retains its original notices and terms. See `THIRD_PARTY_NOTICES.md` and `reference/PROVENANCE.md`.

## Production candidate

The hardened production-candidate checklist and remaining manual cross-browser acceptance gate are documented in `PRODUCTION_READINESS.md`. Runtime remains fully static and does not require a backend.
