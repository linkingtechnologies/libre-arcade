# M9 — Libre Arcade candidate UX

M9 deliberately leaves the M8 gameplay/parity core unchanged and removes the development-harness feel around it.

## Added

- English / Italian UI toggle.
- Instructions and Credits as separate user-facing screens.
- Libre Arcade link in Credits and page footer.
- Responsive scale for the historical 240×320 viewport.
- `html/body` overflow disabled; controls compact automatically on low-height screens.
- Touch/click controls retained without QA-only pause/step controls.
- Historical Bluetooth exposed as reference-only instead of pretending it is implemented.
- Cleaner main menu: Solo, Bluetooth, Options, Instructions, Credits, Exit.

## Preserved

- M8 core simulation and historical AI implementation.
- Historical 240×320 game viewport.
- City / Military workflow and source-guided visual reconstruction.
- No original runtime PNG is loaded by the browser.

## Still not production-ready

- Real J2ME emulator visual comparison remains outstanding.
- Original asset provenance remains YELLOW.
- Browser accessibility and touch-device play need hands-on testing.
- Bluetooth/web multiplayer is intentionally absent.
