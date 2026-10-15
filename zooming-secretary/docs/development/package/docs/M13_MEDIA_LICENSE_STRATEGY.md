# Zooming Secretary — M13 Media / Licence Strategy

## Decision

**PORT IMPLEMENTATION GATE: GREEN.**

**FINAL PUBLIC RELEASE GATE: YELLOW only for exact original level topology and final naming/trademark review.**

M13 deliberately separates the ability to build a faithful HTML5 implementation from permission to redistribute every historical byte. The deterministic M12 core may now be integrated into an HTML5 shell because the distributable implementation does not need the original graphics, music, manual, label art or C/assembly source.

## Why the original 2011 grant is not being “upgraded”

The preserved package says Creative Commons Attribution / “CC BY 2011”, but no version or legal-code URL has been found. The project therefore records the historical grant exactly as found and does **not** rewrite it as CC BY 3.0, CC BY 4.0, GPL-compatible, or Public Domain.

Creative Commons itself says a user should identify the exact CC licence and version and recommends software-specific licences rather than CC licences for code. This project therefore avoids importing the ambiguous game-specific source into the GPLv3 implementation.

## Component policy

### Code — GREEN

All browser/game code is new work under `GPL-3.0-or-later`. No original `game.c`, `npc.h`, `neslib.s`, map header or other game-specific source is shipped as implementation code. M12 behavioral tests remain the oracle.

### SFX — GREEN

Use effects from Shiru's 2019 “NES 8-bit sound effects” collection under **CC0**. That collection explicitly says it contains effects taken from freeware games including Zooming Secretary and allows choosing CC0 or CC-BY. Each selected sound must still be logged in the asset manifest with source URL/name and checksum.

### Graphics — GREEN strategy / replacement required

Create a new human-authored visual set. It may preserve functional readability (secretary, telephone, cabinet, ladder/platform, coffee, NPC roles), but must not be a pixel trace, recolor, upscale, vectorization or close redraw of PinWizz's original art.

**No AI-generated assets.**

Recommended licence for new project-specific graphics: GPL-3.0-or-later or CC0-1.0.

### Music — GREEN strategy / replacement required

Do not ship or transcribe the original Shiru music under the unresolved 2011 grant. M14/M15 may run with SFX only. Final music should be newly human-composed and released under GPL-3.0-or-later or CC0-1.0, or be separately sourced from a clearly compatible licence.

### Factoids — GREEN strategy / replacement required

Keep the mechanics: four categories, same pool sizes if desired, 30-character presentation envelope and deterministic advancement. Replace the actual sentences with newly written factual messages.

### Original artwork/manual/labels/screenshots — YELLOW / reference-only

Do not place these files in the distributable repository. Keep only checksums and provenance in public `reference/`. Historical bytes may exist only in the private archaeology workspace.

### Level data — split policy

Original nametable/map byte arrays and tile art are **not shipped**.

The engine uses a semantic `StageDefinition` describing functional collision topology, spawn/object positions and behaviors. For development, exact oracle geometry may be loaded privately so that M12 parity remains testable.

For a final public release there are two acceptable routes:

1. **Preservation route:** publish the semantic topology as a separately attributed historical-data component, without pretending it is GPL, after a final legal review of the unversioned CC-BY grant; or
2. **Clean release route:** redesign the stage topology while preserving mechanics/difficulty goals, which removes the remaining level-expression question but means the public build is no longer coordinate-for-coordinate identical.

M13 does not silently choose between those two for final publication. It only establishes that this choice no longer blocks implementation.

### Name / logo

Use “Zooming Secretary” as the historical project identifier during restoration. The original logo/label artwork is not reused. A new text treatment/logo must be created. Before public launch, perform a final naming/trademark check; M13 does not infer trademark clearance from a web search.

## Repository layout from M14 onward

```text
/src                 GPLv3+ JS
/data                semantic game data; explicit provenance/licence per file
/assets/sfx          CC0 only, manifest required
/assets/graphics     new human-authored GPLv3+/CC0
/assets/music        new human-composed GPLv3+/CC0 (optional until later)
/reference           metadata/checksums only
/docs                archaeology + parity reports
```

## Mandatory asset manifest fields

Every distributable non-code asset must record:

- logical asset ID;
- filename;
- author;
- source URL or “original Libre Arcade work”;
- licence + version;
- SHA-256;
- whether modified;
- attribution text;
- approval status.

Missing licence/version means the asset does not ship.

## Credits policy

Credits page (not gameplay home screen) must retain historical attribution:

- Original NES game / original idea: Shiru and Alexei “PinWizz” Bespalko;
- Shiru: original code, gameplay design, sound/music, direction, some graphics;
- PinWizz: original visual design, most graphics, fact messages;
- Gibson: original testing;
- Libre Arcade restoration: new GPLv3 implementation and replacement media.

Do not imply endorsement by the original authors.

## M13 conclusion

The unresolved CC-BY version remains documented, but it is no longer an implementation blocker because M13 removes ambiguous media/code from the distributable dependency chain.

**Result: GREEN GO to start the HTML5 shell/port.**

The next milestone should build the minimal HTML5 shell around the frozen M12 core using only neutral programmer placeholders/new simple shapes; it must not yet introduce final art or original music.
