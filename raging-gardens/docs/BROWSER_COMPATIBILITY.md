# Browser compatibility report

Honest scope: what was actually run, and what is only read from the code.

## Tested

| Browser | How | Result |
|---|---|---|
| Microsoft Edge 157 (Chromium), headless, Windows 11 | `node tools/e2e/run.mjs` on `public/` and on the built `game/`: real `KeyboardEvent`s, `PointerEvent`s and clicks against the real page, 14 checks (menu, language switch, instructions and credits, rendering, movement, pulling, Q, W, pause and resume, restart, game over, play again, touch controls independent of the keyboard, no remote requests) | 14 of 14 pass, on both |
| The same Chromium in the desktop app's browser pane | Played by hand; viewports of the pane (about 800 x 600, desktop), 375 x 812 (phone, portrait, touch bar shown) and 812 x 375 (phone, landscape); screenshots checked for overflow; `scrollHeight` equals the viewport height (no vertical scroll) | Layout correct; after fixing an overflow of the header and of the touch buttons at 375 px |
| Node 24 | `npm test`: the logic, against the original's recordings | Pass |

## Not tested

- **Firefox, Safari (macOS and iOS), Chrome on Android, real touch hardware.** The touch controls were
  exercised with synthetic pointer events, and in a phone-sized emulated viewport, not on a phone.
- **Audio output.** The Web Audio effects and the music were checked to not throw; their sound was not heard
  in this session (headless).
- Low-end devices: the game runs a 1024 x 768 canvas redraw at display rate and 50 logic steps per second; no
  profiling was done.

## Features used and their support (from the code, not verified here)

| Feature | Needed for | Support |
|---|---|---|
| ES modules (`<script type="module">`) | everything | Chrome 61, Firefox 60, Safari 11 |
| Canvas 2D (`ellipse`, `drawImage`) | the field | all current browsers |
| Pointer Events with `setPointerCapture` | touch buttons | Chrome 55, Firefox 59, Safari 13 |
| `100dvh`, `env(safe-area-inset-*)`, `object-fit` on `<canvas>` | layout | Chrome 108, Firefox 101, Safari 15.4 (older browsers fall back to a shorter page; scrolling is still prevented by `overflow: hidden`) |
| Web Audio, `<audio>` with Ogg Vorbis | sound, music | Chrome, Firefox, Edge. **Safari's support for Ogg Vorbis is recent and was not checked**; if the music cannot be decoded it stays silent and the game plays on (the original had a similar Safari limitation and said so). The effects do not depend on audio files |
| `crypto.getRandomValues`, `matchMedia`, `localStorage` (wrapped in `try`) | seed, touch detection, language and best score | all current browsers |

Content-Security-Policy: `script-src 'self' https://gc.zgo.at`, no inline code; the analytics beacon is the
only external request. Served from `http://localhost` the beacon's protocol-relative URL resolves to
`http://`, which the policy blocks and logs as an error in the console; it works under `https://`, where the
game is published. The game is unaffected.

The original's own table (Chrome 23/24, Firefox 17/18, Safari 5.1.7, IE 10; no sound on IE and Safari) is
obsolete; Internet Explorer is not supported (no ES modules).
