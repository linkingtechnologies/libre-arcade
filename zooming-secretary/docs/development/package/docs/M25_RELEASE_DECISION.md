# M25 — Release decision

Version: **1.0.0-rc.2**  
Date: **2026-10-12**

## Gate status

- **Gameplay / deterministic core:** GREEN
- **Production UI / procedural audio / responsive static audit:** GREEN
- **Historical expressive-media exclusion:** GREEN
- **Semantic-topology redistribution policy:** ACCEPTED via M13 preservation route
- **Archival title/naming project policy:** ACCEPTED with qualified title + non-endorsement
- **Manual visual browser smoke:** YELLOW / external

M25 does **not** promote the build to `1.0.0` because the manual visual smoke requested in M24 has
not been completed in a normal desktop/mobile browser. The container's Chromium still fails before
DOM/screenshot output even after starting local system/session D-Bus daemons; UPower is unavailable
and Chromium eventually disconnects from D-Bus.

## Topology decision — preservation route accepted

M25 keeps coordinate-for-coordinate gameplay fidelity but removes the misleading single-license
presentation. Historical semantic level topology and object coordinates now live physically under
`data/` and are redistributed under the original project's stated **Creative Commons Attribution**
grant, with the exact CC version explicitly recorded as **unspecified**.

This component is **not relicensed under GPL**. The root GPL-3.0-or-later license continues to apply
to the new implementation algorithms, browser adapters, renderer/UI and procedural audio.

The preservation component contains no original NES nametable byte arrays, CHR/tile artwork, ROM,
music, fact-message prose, manual/labels, or historical C/assembly source.

## Naming decision

The archival title is retained as descriptive identification of the 2011 work. Public page metadata
uses **“Zooming Secretary — Libre Arcade Restoration”**, Credits state that the project is unofficial,
and no original logo/trade dress is reused. See `M25_TITLE_REVIEW.md`.

## What remains before final 1.0.0

Only the external visual smoke remains as a release-process blocker:

- desktop 1280×720 and 1024×600;
- mobile portrait 320×568 and 390×844;
- mobile landscape 568×320 and 844×390;
- touch controls, overlay scrolling, Credits pause/resume, IT/EN and audio persistence.

Once those checks pass, no gameplay/code change is expected: promote `1.0.0-rc.2` to `1.0.0` and
regenerate the manifest/ZIP.
