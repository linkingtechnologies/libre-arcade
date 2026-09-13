# Milestone 5B — clean historical theme-pack backgrounds

## Scope

Milestone 5B completes the first clean-room environmental art pass for the eight historical Bubble Train theme names:

- `default`
- `arctic`
- `beach`
- `mexico`
- `mountains`
- `sea`
- `sky`
- `space`

The historical `.gms` manifest metadata is now used at runtime to select one of eight newly authored CC0 SVG backgrounds. No original Bubble Train PNG/JPEG theme art is loaded, sampled or traced.

## Implementation

- Added `assets-clean/themes/<theme>/background.svg` for all eight historical theme names.
- Extended `CleanAssetLibrary` to preload theme backgrounds alongside bubble/cannon/HUD assets.
- Added `level.theme` propagation in `GameSession.loadLevel()` from the parsed `.gms` entry.
- Updated `CleanRenderer` to draw the theme background before tracks/trains/bullets/cannon.
- Added lightweight theme-specific track styling (stroke/dash/glow) to improve legibility against each background while remaining purely clean-room.

## Fidelity boundary

The backgrounds are not pixel-faithful recreations of the quarantined historical themes. Instead they preserve:

- the **theme identity** communicated by the original `.gms` metadata;
- the **campaign-to-theme mapping** of the historical data;
- the **functional readability** of tracks, bubbles and cannon in gameplay.

This is therefore still a **faithful historical restoration with clean audiovisual assets**.

## Files added

```
assets-clean/themes/default/background.svg
assets-clean/themes/arctic/background.svg
assets-clean/themes/beach/background.svg
assets-clean/themes/mexico/background.svg
assets-clean/themes/mountains/background.svg
assets-clean/themes/sea/background.svg
assets-clean/themes/sky/background.svg
assets-clean/themes/space/background.svg
```

## Validation

- Existing automated gameplay/data tests remain green: **55/55**.
- Historical level/game XML remains byte-identical and unchanged.
- No historical art/audio/font assets were introduced into the runnable build.

## Next recommended step

The next logical milestone is clean audiovisual polish beyond backgrounds:

1. richer Web Audio cues/music;
2. browser/device playtesting across all five historical campaigns;
3. parity verification against native runtime captures;
4. optional restoration of the historical level editor as a separate follow-up project.
