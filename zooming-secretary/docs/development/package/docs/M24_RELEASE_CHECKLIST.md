# M24 — Release checklist

Use this checklist before converting `1.0.0-rc.1` into the public `1.0.0` tag.

## Automated — complete

- [x] Run the full M9→M24 regression suite.
- [x] Run syntax checks on every `.js` / `.mjs` file.
- [x] Serve over local HTTP and confirm `index.html` returns HTTP 200.
- [x] Verify no forbidden historical binary/media files are bundled.
- [x] Verify no runtime network dependency is required.
- [x] Verify both Dream outcomes reach Day 5–7 and Ending with allowance 5/3 respectively.
- [x] Verify ending restart returns to Day 1 with allowance 3.
- [x] Verify Credits contain historical attribution, licensing note and Libre Arcade link.
- [x] Verify audio can be toggled and reset with preferences.
- [x] Verify IT/EN player-facing copy exists through Day 7 and Ending.

## Manual visual smoke — required externally

Open the release in a normal current desktop/mobile browser and check at least:

- [ ] Desktop 1280×720: no vertical scroll; canvas and overlay centered.
- [ ] Desktop 1024×600: no clipping of top controls or overlay card.
- [ ] Mobile portrait **320×568**: touch controls visible and usable.
- [ ] Mobile portrait 390×844: Credits fit and scroll inside the dialog.
- [ ] Mobile landscape 568×320: compact touch controls remain visible.
- [ ] Mobile landscape 844×390: overlay instructions fit/scroll without hiding the primary button.
- [ ] Pause with `P` / Esc and resume.
- [ ] Toggle audio with top button and `M`; reload and confirm preference persists.
- [ ] Switch IT/EN during intro and during an active stage.
- [ ] Open Credits during gameplay: game pauses; closing Credits resumes it.
- [ ] Libre Arcade link opens from Credits only.
- [ ] Complete/replay one normal stage and verify win/loss overlay.
- [ ] Reach Dream and verify runaway-phone/Ghost feedback.
- [ ] Reach Ending and verify restart begins Day 1.

## Public release gate — required decision

- [ ] Accept/resolve the M13 final redistribution review for exact semantic level topology.
- [ ] Complete final archival title/naming review for `Zooming Secretary`.
- [ ] After those decisions and manual visual smoke, change version to `1.0.0` and create the public tag.
