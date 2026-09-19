# Commit and publishing boundary

Commit **this repo-clean + public archaeology package**, not the private full archival bundle. `public/` is the web deploy root. `tests/`, `tools/`, `docs/`, `archaeology/`, metadata-only `reference/`, `LICENSE`, `README.md`, `THIRD_PARTY_NOTICES.md`, `.gitignore`, and `package.json` are source and reproducibility material, not browser payload.

**Excluded by design:** the original 1.0/1.01 archives, extracted `reference/` source directories and historical audio/font assets. The checked-in `reference/` directory contains only an inventory and instructions. The historic archives contain material whose redistribution permissions are not uniformly verified. Keep those artifacts privately; do not copy them into a public repo, release attachment or GitHub Pages directory.

The `tools/export_levels.py` helper uses historical source as an external input; a small subset of original source files in `tools/oracle_compat/v1.01/lib/` is bundled for the existing oracle (line endings normalized to LF, two files lightly adapted, see `PROVENANCE.md`) and retains its original custom upstream grant; the complete historic ZIPs are not bundled here. `tests/oracle/` contains numeric traces rather than recorded font/audio assets.

Before marking this a *final release*, complete the unchecked manual items in `docs/PRODUCTION_CHECKLIST.md`. A passing Node regression suite does not establish real Safari/Android/browser audio behavior or 17-level human playability.
