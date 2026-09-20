# Final QA — HighMoon 1.0.0-rc.5

**Result:** Release candidate is fit for a public **RC commit**, not yet certified as the final `1.0.0` production release. No adjustments were made to historical physics, shared RNG or AI.

## Automated tests

- Original physical oracle regression: 102 ticks, 816 scalar comparisons, 688 bit-identical values, maximum absolute difference 7.105427357601002e-15; differences from C++ vs browser libm are not tuned away.
- Native canonical AI reference: all 7 candidates and 12,585 shared RNG calls match; shield 100 -> 80.
- 100 deterministic galaxy seeds; Storm, Wormhole, collision order, bonus and 5-fragment Cluster tests; 3,000-frame CPU-vs-CPU stress run.
- **New RC5 scenario suite:** actual winner event, 400-frame reset, all three player modes, and 2,200 frames at each of five historical CPU difficulty levels. At least three CPU shots observed for every level, no NaN or invalid shield values.
- Public bundle checksum, preserved upstream source/docs checksums, absence of original media, absence of external runtime URLs and runtime `Math.random()` checks.

## Chromium end-to-end and responsive tests

Chromium executed actual `game-app.js` and all original JS modules, combined as in-memory ES modules in a document created with `set_content` because this environment denies browser navigation even to `127.0.0.1` and `file://` pages. This is a genuine browser-engine + Canvas + Web Audio test, but **not a live HTTP browser/deployment test**.

- Desktop 1366×768, 1440×900, 1366×600: 0 horizontal or vertical page overflow, modal menu functional, no JavaScript errors.
- Mobile emulation 390×844, 375×667 and landscape 844×390: 0 horizontal or vertical page overflow, touch hold/release launches a shot, difficulty and language changes, mute on/off and menu close function, no JavaScript errors.
- At 375×667 and 844×390, menu contents scroll *inside the dialog* (109 and 141 px respectively), not the game page. This is expected and usable; do **not** claim that all menu controls are visible at once.
- In actual Chromium, touch interaction unlocked Web Audio to a `running` AudioContext (sample rate 44,100 Hz). This confirms browser API operation, **not audible speaker/headphone quality or iOS autoplay behavior**.
- Audio check added before the initial commit: pressing **Play** produces a short confirmation after audio unlock. A previous QA build also exercised a two-note diagnostic test and detected a non-zero output (~0.11 on normalized samples); that diagnostic button is not included in the consumer menu. Chromium verified the Play confirmation and a real fired shot through the browser Web Audio graph. Physical device mute/output and subjective loudness are still unverified.
- A real keyboard-fired two-player shot reached the next player's turn without page errors.
- Static HTTP smoke via `python3 -m http.server` and curl: `/highmoon/`, `styles.css`, `src/game-app.js`, `src/presentation-art.js` and `src/presentation-audio.js` returned HTTP 200. This does not verify the real GitHub Pages deploy path.

The two JSON records and representative screenshots under `specs/qa-evidence/chromium/` at repository root preserve observed results; these are QA records rather than runtime assets.

## Still open before final 1.0.0

1. Firefox desktop game/audio input and a completed match on a real user device.
2. Safari on iPhone/iPad: real touch, Web Audio unlock, device rotation, pause/background restore.
3. Smoke test under the final Libre Arcade GitHub Pages URL, including refresh/relative paths/fullscreen.
4. Human visual and audible sign-off. Automated testing cannot establish whether an effect *sounds good* or artwork is legible on every actual device.
5. Broader native-vs-browser end-to-end parity scenarios. Oracle regression proves specified scenarios, **not universal full-playthrough equivalence**.

No legacy GIF/WAV is used by the public release. The historical full-media archive stays separate and is not part of this commit.
