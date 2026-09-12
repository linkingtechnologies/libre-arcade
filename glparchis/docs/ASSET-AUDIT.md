# Asset audit — glParchis 20181125

## Safe foundation

The important gameplay presentation is largely reproducible from code rather than raster media:

- board topology, routes, safe squares and coordinates are data/code;
- pawns are rendered procedurally using OpenGL cylinder/disk geometry;
- the die is rendered in 3D from code;
- no bundled `.ttf` or `.otf` fonts were found.

These parts can be faithfully reimplemented without copying uncertain images.

## Quarantine

### Confirmed problematic

- `glparchis/images/play.png`
- `glparchis/images/stop.png`

Both files contain the embedded comment:

`Copyright INCORS GmbH (www.iconexperience.com) - Unlicensed preview image`

They must not be reused in the restoration.

### Third-party avatars

- `keka.png`
- `keke.png`
- `keki.png`
- `keko.png`

The About dialog says the avatars were taken from `nobleavatar.com`, but this archive does not contain an asset-specific license statement for these exact files. Preserve them only inside the untouched reference archive; do not ship them in the browser port without matching provenance/license evidence.

### Sounds — provenance unresolved

The package includes six WAV effects actually loaded by the game:

- `click.wav`
- `comer.wav`
- `dice.wav`
- `meter.wav`
- `shoot.wav`
- `win.wav`

No per-file author/license notices were found. Replace them with newly created or clearly licensed effects for the browser release.

### Other raster/vector media — provenance unresolved

The archive contains UI icons, flags, textures, number textures, pawn icons, die textures and an SVG report-bug icon without a complete asset manifest establishing authorship and license. Examples include `wood.png`, `transwood.png`, `seguro.png`, `configure.png`, `help.png`, `open.png`, `save.png`, `sound.png`, `soundoff.png`, `statistics.png`, `zoom-in.png`, `zoom-out.png` and `reportbug.svg`.

These should remain under `/reference` and be replaced in the browser UI unless individually cleared.

## Translation material

README credits Turulomio with English and Spanish translations and Nadejda Adam with French. Romanian and Russian catalogues are present but their individual authorship is not clearly documented in the package. The restoration will use a new Italian catalogue and a clean English catalogue derived from the restored UI, avoiding dependency on uncertain RO/RU material.

## Port policy

The browser port should use:

- procedural/SVG board, pawns and die;
- system font stack;
- newly drawn UI icons;
- newly created/clearly licensed sound effects;
- no original avatars.
