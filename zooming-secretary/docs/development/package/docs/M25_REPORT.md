# M25 — Release hardening / rights-boundary finalization

Version: **1.0.0-rc.2**  
Date: **2026-10-12**

## Verdict

**GAMEPLAY / CODE: GREEN**  
**SEMANTIC-TOPOLOGY RELEASE POLICY: ACCEPTED — PRESERVATION ROUTE**  
**ARCHIVAL NAMING PROJECT POLICY: ACCEPTED**  
**MANUAL VISUAL SMOKE: YELLOW / EXTERNAL**  
**PUBLIC VERSION: 1.0.0-rc.2**

M25 does not alter gameplay. It resolves the two project-policy gates left open by M24 without
sacrificing coordinate-for-coordinate restoration fidelity.

## 1. Historical topology separated from GPL code

Before M25, each `web/stage-*.js` file mixed new GPL adapter code with reconstructed historical
functional layout values. M25 physically separates the two domains:

- `web/stage-*.js` — new Libre Arcade adapter code, GPL-3.0-or-later;
- `data/stage-*-data.js` — historical semantic topology/coordinates/constants, redistributed under
  the original 2011 project's stated **Creative Commons Attribution / CC BY** grant, exact version
  **unspecified**.

The custom marker `LicenseRef-Zooming-Secretary-CC-BY-Unspecified` records this boundary without
inventing a CC version that the historical release never stated. `data/README.md` contains full
attribution, modification notes and source hashes.

All eight certified collision SHA-256 values remain unchanged after the refactor. The release still
contains no original nametable byte streams, CHR art, ROM, music, fact-message prose, manual/labels,
or historical C/assembly source.

## 2. Naming/title hardening

Current public sources continue to use `Zooming Secretary` as the historical identifier for the 2011
NES game and later ports. M25 therefore keeps the archival title but qualifies public document
metadata as **“Zooming Secretary — Libre Arcade Restoration”**.

The browser uses no original logo/trade dress. Credits now explicitly call the project an unofficial
restoration and state that no endorsement by the original authors or later port teams is implied.
The targeted web review did not surface an exact trademark registration in the search results
available to the audit, but M25 does not represent this as formal trademark clearance.

See `M25_TITLE_REVIEW.md`.

## 3. Browser smoke retry

M25 retried Chromium with a local system D-Bus daemon and `dbus-run-session`. Chromium still hangs
before DOM/screenshot output because `org.freedesktop.UPower` is unavailable and the D-Bus/zygote
connection eventually terminates. Static/server QA remains valid; visual smoke still has to be run
outside the container.

## 4. Automated results

- Full M9→M25 regression: **269/269 PASS**.
- New M25 tests: **18/18 PASS**.
- JavaScript/module syntax checks: **54/54 PASS**.
- Local HTTP smoke: **200 OK**.
- Forbidden historical binary/media files: **0**.
- Historical original source/map filenames: **0**.

## 5. Release artifacts

M25 produces two ZIP forms:

1. **web/deploy candidate** — runtime source, licensing/provenance and M25 release docs only;
2. **source/audit candidate** — complete restoration source, tests, fixtures and milestone history.

The deploy candidate intentionally excludes test fixtures and old milestone reports from the served
surface while keeping all source required by the browser runtime.

## Final step to 1.0.0

No further gameplay work is expected. Run the M24/M25 manual visual matrix on normal desktop/mobile
browsers. If it passes, change only release metadata from `1.0.0-rc.2` to `1.0.0`, regenerate the
manifest/ZIP and publish.
