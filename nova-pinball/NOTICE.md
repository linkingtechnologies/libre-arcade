# Nova Pinball — preservation notice

This package is an unofficial web restoration of **Nova Pinball v0.2.3** by Wesley "keyboard monkey" Werner.

- Historical upstream: `wesleywerner/nova-pinball`
- Historical code license: GNU GPL version 3 or later
- Web restoration license: **GPL-3.0-or-later**
- `public/data/table.json` is derived from the historical `nova.pinball` table definition and is distributed under the restoration's GPL-3.0-or-later terms.
- Browser physics, UI implementation, persistence and synthesized sound effects are new implementations.

## Historical upstream credits

The upstream project credits **Wesley Werner** as original author and the later project page credits **Eric Ahnell** for the 2019 LÖVE 11.2 update. The historical README also credits **Beyond** (music), **Sizenko Alexander** (Advanced LED Board-7), **Nate Halley** (Erbos Draco Open NBP), **Steve Dekorte** (Lua File Pickler) and **Tomas Pettersson** (SFXR).

The complete upstream credit record, source links, engine-repository lineage and Software Heritage reference are preserved in `docs/UPSTREAM_CREDITS.md`. Historical attribution is kept separate from the restoration's conservative redistribution policy.

## Presentation reconstruction

The v0.2.3 Lua presentation source and historical artwork were inspected to recover behavioural and visual parity. The web build recreates menu/HUD/LED/pause/About/Game Over behaviour and the table's visual language with new Canvas/CSS drawing. It does **not** copy or redistribute the historical raster-image bytes or restricted font files.

See `docs/UI_PARITY.md`, `docs/ASSET_REFERENCE.md` and `docs/PRESERVATION_MATRIX.md`.

## Media policy

The distributable does **not** include the historical tracker music, original WAV effects, original raster images, or the restrictive `Advanced LED Board-7` font. They remain part of the archaeological record but are not republished here.

The historical tracker soundtrack is attributed upstream to Beyond, but the surviving materials do not document terms that are sufficiently clear for redistribution/sublicensing in this modified web restoration. It therefore remains excluded.

The historical WAV effects also remain excluded. Source inspection found 19 WAV files in the v0.2.3 package, of which 18 are actually referenced by the runtime; `powerup-2.wav` appears present but unused. The web build synthesizes clean replacements for those 18 runtime roles.

Historical font binaries remain excluded. The in-canvas LED/HUD uses a new procedural 5×7 dot-matrix renderer.

The ambiguous historical `modules/pickle.lua` serializer is not used; persistence is implemented with guarded JSON/localStorage plus an in-memory fallback.

## Optional modern music

Three modern replacement tracks are bundled under `public/assets/music-modern/`. They are an explicit modernization and are **not** presented as historical Nova Pinball music. They are released under CC0 1.0; exact provenance and SHA-256 values are in `public/assets/music-modern/CREDITS.md`.

See `reference/MANIFEST.md` and `docs/HISTORY.md` for the historical baseline and `docs/RELEASE_AUDIT.md` for the final public-distribution audit.
