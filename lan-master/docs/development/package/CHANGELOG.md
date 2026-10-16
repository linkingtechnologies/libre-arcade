# Changelog

## M16 — responsive board enlargement / 1.0.1
- enlarged only the gameplay canvas when the available viewport permits it;
- preserved the native 256×240 NES framebuffer and nearest-neighbor/pixelated presentation;
- caps roomy desktop presentation at 512×480 (2×), while smaller layouts use the largest fitting responsive size;
- kept controls visible and page overflow disabled on tested desktop/mobile viewports;
- changed only `src/style.css` in the shipped runtime; game logic, levels, graphics assets, audio and timing remain byte-identical to M15;
- added a dedicated M16 responsive browser gate and updated historical freeze sentinels to whitelist exactly this stylesheet hash.

## M15 — final release 1.0.0
- promoted the verified M14 RC1 to final 1.0.0 after the full regression and playability gates remained green;
- kept `index.html`, all `src/` files and all `reference/` files byte-identical to M14/M13;
- added final-release metadata, M15 regression, final report and package manifests;
- split distribution into a minimal player-facing web archive and a complete source/archaeology archive;
- documented physical-device/browser/audio checks and the M7.2 native rebuild as external validation, not claims of the automated web certification.

## M14 — playability acceptance / 1.0 RC1
- certified all 49 historical level passcodes plus the `6502` ending code through the production passcode UI;
- traversed a complete Level 1 -> 50 -> ending -> menu campaign through the production progression state machine;
- solved L1, L11, L25 and L50 through real pointer + keyboard rotation controls;
- solved L11 on a touch-emulated mobile viewport through the visible A/B/SEL controls;
- verified EN/IT persistence and scoped settings reset;
- added M14 release/static and browser playability gates;
- `index.html`, all `src/` files and all `reference/` files remain byte-identical to M13.

## M13 — UI / keyboard hardening
- fixed global keyboard interception on focused HTML inputs, buttons and links;
- prevented duplicate passcode submission from the focused code input;
- added Escape handling and cursor sync for the passcode field;
- made on-screen game controls keyboard-operable with Enter/Space without double-firing pointer actions;
- added focus transfer/restoration for Help and Credits;
- made the NES title canvas focusable with a visible focus ring;
- added a managed Chromium smoke test for keyboard focus, passcode entry and responsive overflow;
- gameplay core, level data, RNG, NES rendering, transition timing and audio payloads are unchanged from M12.

## M12 — Production Ready
- fixed hidden-menu keyboard input while Help/Credits are open;
- added reset of Libre Arcade local settings from Credits;
- completed accessibility labels and live status regions;
- added touch-action hardening for mobile play;
- localized pause, level-clear and timeout panels in Italian while preserving English as the NES parity baseline;
- added final packaging/offline/static QA.

## M11 — Transition parity
- original level reveal/hide, restart animation, clear/timeout tables, palette fades and runtime wellDone sequence.

## M10 — Original audio
- FamiTone-derived music player, four BGM modules, 12 SFX and DPCM.

## M9 — NES graphics
- original CHR/nametable/palette rendering and cursor graphics.

## M8 — Playable baseline
- certified 50-level gameplay core, passcodes, RNG, timer, connectivity and degradation.
