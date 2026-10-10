# Changelog

## 1.0.0

First release in Libre Arcade, promoted from the restoration package's release candidate 1.0.0-rc.1 after a check in a real browser.

- 10×10 five-in-a-row against the computer player of the 2007 Java applet, whose decision logic is ported rule for rule from `xoworld.java`.
- Responsive Canvas interface with mouse, touch and keyboard input, English and Italian text, and a help and credits dialog. No original image is redistributed.
- Preserved the original source under `reference/javagames-1.0/` (`xoworld.java`, `README`, `COPYING`, the embedding page), with the archive's SHA-256, a checksum list for the preserved files and a manifest of all 63 files of the archive. The files are CRLF text and are kept byte for byte (`.gitattributes`).
- Added an executable oracle: the original applet is compiled unmodified and driven through its own `mouseUp()` and `igraj()`. The 22 expected moves of the package's behavioural oracle were re-derived from it and agree. A recorded run of 2,000 games and 27,287 clicks replays against the port in `npm test` with every reply identical; `npm run test:live` runs the original again. The same lockstep run also agrees on Java 21 and on the compiled `xoworld.class` of 2007.
- Fixed the board not being exactly square (644 by 646 pixels at full size): the canvas size now uses the card's real padding instead of a fixed 12 pixels.
- Fixed the phone-width layout: below 430 pixels the container was `99vw` wide inside a body with 6 pixels of padding, so it overflowed by 2 pixels, was not centred and pushed the "?" button off the right edge of the screen. It now fits the body. Checked at 72 window sizes between 320 by 360 and 1600 by 900, in English and Italian, with no clipped control, no overlap and a square board.
- Joined the Libre Arcade collection: the browser files moved from `web/` to `public/` and the tests from `qa/` to `test/`, `npm test` now runs `node --test`, and the collection scaffolding was added (`scripts/serve.mjs`, `scripts/build.mjs`, an ESLint config, `.gitignore`, the GoatCounter snippet, the "Play here" link, the provenance, archaeology and port-map documents). The engine and game model sources are unchanged (their SHA-256 values are checked by `test/bundle.test.js`).
- Kept the package's development notes and captured logs, with their milestone labels, unmodified in `docs/development/`.
