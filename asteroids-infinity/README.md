# Asteroids Infinity — web adaptation

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/asteroids-infinity/public/index.html)**

Play an HTML5 adaptation of Ben Whittaker's 2009 **Asteroids Infinity**. Fly with inertia, destroy asteroids, dodge flying saucers and compete for a local high score. The elastic camera follows the original code's model. English and Italian interfaces are available, with keyboard, mouse and on-screen touch controls.

## Play

```sh
npm run dev      # serve public/ at http://localhost:8080
npm run build    # package public/ into game/
npm start        # build, then serve game/
```

Any static web server works as well (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). A real HTTP(S) server is required because the game uses native JavaScript modules. On a phone, open the hosted page and use the on-screen controls. The main menu includes **How to play / Come si gioca**, which explains the goal, keyboard and touch controls, shield, scoring, lives and waves. You can change language or sound at the top of the screen, including during a game.

The original four menu actions (Play, Highscores, Options, Quit) remain grouped together. How to play and Credits are clearly separated as modern informational screens. Libre Arcade is linked **only from Credits**, not from the game's start screen or gameplay HUD. Sound and language controls are available at the top; all gameplay and saved scores remain on this device.

For a short story of what makes this browser edition different, open **Credits → About the web version** (in Italian, **Riconoscimenti → La versione per il browser**), or read [`STORY.md`](STORY.md). For background and preservation details, see [`PORTING_NOTES.md`](PORTING_NOTES.md), [`PROVENANCE.md`](PROVENANCE.md), [`specs/port-map.md`](specs/port-map.md), [`specs/AUDIT.md`](specs/AUDIT.md) and [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md).

## Audio

There are seven optional, newly synthesized Web Audio effects for firing, propulsion, impacts, ship destruction, saucers, shield and the next wave. They generate their sound on the device without audio files, and can be turned off. Audio starts after a user gesture, subject to browser support. **These are not the original sounds and no audiovisual parity is claimed.** The original WAV assets and Vector Battle font are not included; their redistribution rights remain unresolved.

## Design and status

Client-side Canvas 2D + JavaScript, no framework or backend. Browser storage holds scores, keyboard bindings and audio preference. Advanced options allow text import/export for original `highscores.txt` and `controls.txt`; the browser's internal storage format is different. The original gameplay code is preserved unchanged in `reference/` for inspection and licensed as documented in the notices. The original game and this web adaptation are GPL-3.0-or-later, subject to the separate notices.

The page carries the collection's GoatCounter snippet (visit counts only, no cookies and no personal data); see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). There is no other third-party script.

**Beta, not whole-game parity certified.** Numeric/logical tests and diagnostic Chromium desktop/phone layout and sound-trigger tests have been performed. Real-device sound output and actual saved-state persistence after reload still require independent testing. The historical Python 2/Pygame version has not been run natively in this environment.

## Verification

- `npm run check` — ESLint plus the 113 Node gameplay/UI/audio unit and regression tests.
- `python3 test/make_oracle_asteroids_m2.py` — re-runs the original asteroid code from `reference/` and rewrites the oracle fixture; it is expected to come out byte-identical.
- `python3 test/original_file_oracle_m7.py` — runs the original `controls.txt` / `highscores.txt` routines and round-trips them through the JavaScript parser.
- `python3 test/test_http_assets_m10.py` — confirms ordinary HTTP asset responses and import paths, without browser execution.
- `python3 test/browser_smoke_m12.py` — diagnostic Chromium test using inlined modules (requires Playwright/Chromium); does **not** certify a normal HTTP browser load.
- `sha256sum -c SHA256SUMS.txt` — verifies the packaged files.

## Credits

Original game: **Ben Whittaker**, 2009. HTML5 adaptation and new synthesized sound: Libre Arcade contributors, 2026. The original project is at https://sourceforge.net/projects/asteroidsinf/ and the preservation project is at https://linkingtechnologies.github.io/libre-arcade/ . This is an independent historical adaptation and does not claim affiliation with the commercial *Asteroids* game.
