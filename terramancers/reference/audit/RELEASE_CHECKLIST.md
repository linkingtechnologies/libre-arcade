# v1.0.2 release checklist

## Archaeology and licensing

- [x] Original LPC ZIP preserved under `reference/originals/`
- [x] Original ZIP SHA-256 verified
- [x] Historical source and JAR preserved
- [x] Code license verified from source/package notices
- [x] Artwork attribution/provenance documented
- [x] Asset caveats documented rather than hidden
- [x] Preserved vs reconstructed boundary documented
- [x] Modified/ported status and 2026 modification date explicitly documented
- [x] SPDX GPL-3.0-or-later identifiers added to browser JavaScript sources
- [x] GPL licensing path for dual-licensed LPC artwork stated explicitly

## Runtime

- [x] Vanilla HTML/CSS/JavaScript only
- [x] Canvas 2D only
- [x] Entirely client-side
- [x] No required backend
- [x] No required external network calls
- [x] No build step
- [x] Static-hosting / GitHub Pages compatible
- [x] `.nojekyll` present
- [x] No vertical page scrolling
- [x] Responsive resize/orientation handling
- [x] Touch controls
- [x] Keyboard controls
- [x] In-game path back to menu
- [x] English and Italian browser UI
- [x] Instructions and About available
- [x] Player-facing UI contains no archaeology/license jargon

## Parity/hardening

- [x] Simulation fixed at nominal 180 ticks/s
- [x] Walking animation fixed to historical 60 Hz repaint cadence
- [x] 120/144 Hz displays cannot accelerate animation
- [x] Active match logical dimensions frozen after start
- [x] Resize/rotation cannot regenerate the active map
- [x] Single-player touch UI hides unused P2 controls
- [x] Historical case-sensitive sprite mismatch corrected only in browser implementation
- [x] Historical JAR launched in isolated 800×600 test environment
- [x] Original menu capture archived

## Automated verification

- [x] JavaScript syntax checks pass
- [x] 20/20 Node tests pass
- [x] Core gameplay tests pass
- [x] Timing/animation/tree cadence tests pass
- [x] Responsive fitting tests pass
- [x] Browser-shell menu/localization/touch-flow test passes
- [x] Original ZIP preservation hash test passes

## Release classification

**Ready for v1.0 static deployment.**

The release is production-ready within its declared scope: faithful gameplay preservation with a responsive browser UI. Pixel-identical Swing menu reproduction is intentionally not part of v1.0.
