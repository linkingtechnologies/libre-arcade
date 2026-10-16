# Lan Master 1.0.1 — M16 Patch Checklist

- [x] 50/50 solver witnesses validate under the final connectivity oracle.
- [x] Deterministic RNG/scramble anchors pass.
- [x] NES graphics pixel anchors pass.
- [x] 4 BGM / 12 SFX / DPCM audio regression passes.
- [x] Reveal/restart/clear/timeout/wellDone transition regression passes.
- [x] 49/49 historical level passcodes open the intended levels.
- [x] Historical `6502` code opens the ending.
- [x] Full Level 1 → 50 → ending → menu production progression passes.
- [x] Representative levels 1, 11, 25 and 50 solved via real pointer + keyboard controls.
- [x] Level 11 solved on touch-emulated 390×844 viewport via visible A/B/SEL controls.
- [x] No external JavaScript/CSS/font/runtime dependency.
- [x] Responsive viewport; `html, body` prohibit vertical page scrolling.
- [x] Gameplay canvas expands beyond 256×240 when space permits.
- [x] 654×639 and 1280×960 render gameplay at 512×480 (2×).
- [x] 390×844 and 320×568 use viewport-fit enlarged gameplay canvases without overflow.
- [x] Title and ending canvases remain at the original display size.
- [x] Keyboard, pointer and touch controls present.
- [x] Help/Credits suspend hidden menu input.
- [x] Focused HTML inputs/buttons/links are not hijacked by global game shortcuts.
- [x] Passcode Enter submits exactly once; Escape returns to the title menu.
- [x] On-screen controls are keyboard-operable with Enter/Space.
- [x] Help/Credits focus moves into the page and returns to the opening control.
- [x] EN/IT guidance and Italian gameplay panels; historical English title/ending preserved.
- [x] Language preference persisted locally and scoped reset verified.
- [x] Credits are not placed on the main gameplay screen.
- [x] Libre Arcade project link is clickable from Credits.
- [x] No debug/provenance/test text is exposed in the gameplay UI.
- [x] Public Domain original attribution and GPLv3+ restoration notice included.
- [x] M16 changes only `src/style.css` in the shipped runtime; all other runtime/reference files remain byte-identical to M15.
- [x] Complete M8–M16 regression passes, with historical freeze sentinels whitelisting only the exact M16 stylesheet hash.
- [x] M13 keyboard smoke and M14 full playability gate remain green.
- [x] M16 responsive browser gate passes.
- [x] Source manifest generated and verified.
- [x] Minimal web package generated from the same M16 payload.
- [x] Package metadata reports `1.0.1` / M16.

## External validation not claimed by the automated final gate

Physical Android/iPhone interaction, unrestricted direct browser/file navigation, subjective real-speaker/headphone acceptance, and the separate strict native NES source → byte-identical ROM rebuild remain documented follow-up validation targets. They do not affect the certified M16 presentation-only patch or the preserved gameplay behavior.
