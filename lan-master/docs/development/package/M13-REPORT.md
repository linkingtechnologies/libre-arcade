# Lan Master — M13 UI / Keyboard Hardening

## Result

**PASS.** M13 is a web-shell hardening milestone built on the M12 production-ready baseline. Gameplay semantics and historical presentation data are intentionally unchanged.

## Defects fixed

1. The global NES keyboard listener previously called `preventDefault()` for Enter/arrows before checking whether a real HTML control had focus. This could block native keyboard activation in Help/Credits and could interfere with the passcode input.
2. Pressing Enter in the passcode field could reach both the input handler and the global menu handler, making submission non-isolated.
3. The visible A/B/SEL/START/D-pad HTML buttons were pointer-driven but did not have an explicit keyboard activation path.
4. Help/Credits did not explicitly transfer/restore focus when their full-screen panels opened and closed.

## M13 behavior

- Text controls own their keyboard events.
- Buttons/links retain native Enter/Space activation instead of being hijacked by the NES menu listener.
- Passcode Enter submits once; Escape returns to the title menu.
- The passcode cursor follows typed input and the field is focused/selected when Password is opened.
- On-screen game controls accept Enter/Space while retaining the existing pointerdown path for mouse/touch.
- Help/Credits focus their headings and restore focus to their opening buttons on return.
- The title canvas is focusable and has a visible keyboard focus ring.

## Fidelity boundary

Byte-for-byte unchanged from M12:

- `src/core.js`
- `src/levels.js`
- `src/nes-assets.js`
- `src/nes-gfx.js`
- `src/transitions.js`
- `src/audio-data.js`
- `src/famitone.js`
- `src/nes-audio.js`
- all files under `reference/`

Therefore M13 does not change the 50 historical levels, connectivity/RNG/scramble logic, timer/degradation rules, NES pixels, FamiTone-derived music/SFX/DPCM data, or transition timing.

## QA

All historical M8–M12 tests pass, plus `tests/test-m13-ui.js`.

A managed Chromium smoke test also passes at 1280×960, 390×844 and 320×568, covering no-overflow layout, Help/Credits keyboard activation and focus restoration, passcode focus/entry, and valid passcode launch.

The managed Chromium policy blocks direct `file://` and arbitrary local/HTTP navigation, so that smoke uses the exact production payload inline. It is not a claim of real-device Safari/Firefox acceptance.

## Remaining archaeological item

The independent M7.2 native reproducibility gate remains open: official historical source + NESASM 3.1 has not yet been executed here to prove a byte-identical rebuild of the reference ROM. This remains separate from the working HTML5 port.
