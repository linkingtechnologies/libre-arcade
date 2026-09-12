# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, tick timing, capture logic, level generation, tree AI | [Terramancers](reference/extracted/) by Shai Shapira, Liberated Pixel Cup 2012 | Preserved archive `Terramancers-LPC-2012.zip`, SHA-256 verified byte-for-byte | GPL-3.0-or-later | Preserved unmodified in `reference/extracted/` and `reference/originals/`; faithfully ported to JavaScript in `public/src/core.js` — see `reference/audit/GAMEPLAY_SPEC.md` and `reference/audit/PARITY_STATUS.md` |
| Active gameplay artwork (six character sheets, terrain tiles, tree image, UI arrows) | same source, individual artists credited in `AUTHORS.TXT` (Lanea Zimmerman, Stephen Challener, Skyler Robert Colladay, Emilio J. Sanchez-Sierra, Daniel Eddeland, Thane Brimhall) | same archive | Dual-licensed CC-BY-SA-3.0 / GPL-3.0-or-later, stated explicitly in the archive's own `COPYING.TXT` | Copied into `public/assets/`, used directly by the runtime under the GPL-3.0-or-later path — see `reference/audit/ASSET_PROVENANCE.md` |
| Generated terrain atlases (`public/assets/generated-tiles/terrain-*.png`) | derived from the above at restoration-build time | — | Same as source tiles (faithful cache, no new art) | Reproduces `SpriteGenerator.mergeColors`' alpha-128 overlay rule exactly |
| Web UI, Canvas 2D renderer, input, responsive letterboxing, localization | this repository | — | GPL-3.0-or-later | New reconstruction work |

## Licensing: independently re-verified against the included archive

`reference/audit/LEGAL_AUDIT.md` already reached the right conclusion; before
integrating this restoration into the collection, that conclusion was
checked again directly rather than taken on trust. The included
`reference/originals/Terramancers-LPC-2012.zip` was hashed and matches the
documented SHA-256
(`100a77340a9004a271ccd8a00e2387a368ade52e7a96882da0feaa01147f081a`)
exactly, and its own `COPYING.TXT` was read directly:

> This program is free software: you can redistribute it and/or modify it
> under the terms of the GNU General Public License... either version 3 of
> the License, or (at your option) any later version.
>
> Artwork, music, and other non-software assets/content in this repository
> are dual licensed under the Creative Commons Attribution-ShareAlike 3.0
> Unported and the GNU General Public License... version 3... or (at your
> option) any later version.

Both statements were also spot-checked against individual file headers
(every scanned `.java` source file carries the same GPL-3.0-or-later
notice). This is the cleanest license basis of any restoration in this
collection so far: rather than an author's placeholder or a site-wide policy
that has to be tracked down separately, the archive's own `COPYING.TXT`
explicitly and separately licenses *both* code and artwork, naming the exact
dual-license path for assets. This matches the well-documented 2012
Liberated Pixel Cup contest rule that required all art-phase entries to be
released under CC-BY-SA 3.0 and GPL 3.0.

## Honest gaps, kept as gaps

Three asset files aren't individually named in Terramancers' own
`AUTHORS.TXT` — `Baldric.png`, `sand.png`, `greenTrees.png`. Each is traced
to a specific, plausible LPC source in `THIRD_PARTY_NOTICES.md` and
`reference/audit/ASSET_PROVENANCE.md` (a named contest entry, a specific
farming-asset submission, an inferred assembly from credited tree parts),
but none of the three is presented as a certain, individually-documented
attribution. The port includes them anyway, on the strength of the
archive's own repository-wide dual-license statement (which covers all
"artwork, music, and other non-software content" regardless of per-file
`AUTHORS.TXT` completeness) — not on the strength of the per-file trace,
which is recorded as supporting context, not as the reason for inclusion.

## What was not ported, and why

- **Java AWT/Swing rendering, windowing, and input** — replaced by Canvas 2D
  and browser input events, which have no original counterpart to be
  faithful to.
- **The old Vakho Arena combat/tavern/league code** (`combat/`, `model/`,
  `ui/TavernPanel.java`, `ui/HallOfRecordsPanel.java`, clothing-layer sprite
  generators, `Map.map`) — this archive is a later Terramancers pivot inside
  an earlier, differently-scoped project; the completed game's own `Main.java`
  never calls any of it. Preserved in `reference/` as historical evidence,
  not ported — see `SOFTWARE_ARCHAEOLOGY.md` and
  `reference/audit/ASSET_PROVENANCE.md`, "Stale / predecessor material."
- **The historical point-collision `TODO`** — the original source itself
  flags its own collision check as incomplete; the port preserves that exact
  point-based check rather than "fixing" it into something more precise,
  per `reference/audit/GAMEPLAY_SPEC.md`.
- **Native executable-to-executable trace** — the preserved `.jar` was run
  directly and its menu captured for comparison (see
  `reference/audit/EXECUTABLE_PARITY.md`), but this is observational
  comparison, not an automated differential test suite.
