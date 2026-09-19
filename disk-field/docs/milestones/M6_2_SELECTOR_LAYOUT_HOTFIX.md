# Disk Field M6.2 — selector layout hotfix

## Trigger

Manual acceptance testing in Italian exposed overlap between the left-hand `LIVELLO N` labels and the animated level preview. The M5 procedural 5×7 lettering is wider than the earlier system-font layout, while the selector still used the old fixed text size.

## Fix

- Added `fitArcadeTextSize()` to the procedural lettering module.
- Reserved a fixed 244 px text column and a separate cursor area.
- Selector labels are measured and reduced only when needed, with a 26 px minimum.
- Preview captions are independently fitted within 340 px.
- Hit regions were widened to match the visual selector column.
- No physics, level, audio, progress, RNG, or solvability code was changed.

## Regression gate

`npm test` passes in full, including:

- 7 historical oracle scenarios;
- 85 field samples;
- 17-level stress test;
- 17/17 canonical solvability replays;
- M6.1 Web Audio startup checks;
- new M6.2 layout checks covering `LIVELLO 1..17`, `LEVEL 1..17`, `INDIETRO`, `BACK`, and all Italian preview captions.
