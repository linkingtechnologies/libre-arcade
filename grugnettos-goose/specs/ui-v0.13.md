# UI v0.13 — historical artwork correction

## Why this milestone exists

v0.12 made the game offline by replacing the historical board images with project-generated local SVG renderings. That was technically convenient but archaeologically wrong: a generated redraw must never masquerade as the selected historical source artwork.

v0.13 fixes that mistake.

## Runtime policy

For each historical theme the renderer now:

1. tries the exact expected local source file under `assets/boards/original/`;
2. if the file is absent, falls back to the exact Wikimedia Commons original URL;
3. if both fail, leaves the artwork unavailable rather than showing a generated substitute.

No generated/redrawn board is accepted as a historical-artwork fallback.

## Expected originals

### Ganzenbord PD 2008

`assets/boards/original/Ganzenbord_pd.svg`

- Pmathijssen;
- 956 × 684;
- public-domain dedication;
- known Commons SHA-1: `2324f0f685f17a39771bb4b42617b52dc0b2953f`.

### Daan Hoeksema board

`assets/boards/original/Ganzenbordspel.jpg`

- Daan Hoeksema;
- ca. 1910–1920;
- colour lithograph;
- 63 spaces;
- 6421 × 4609 source scan;
- public-domain historical artwork on Commons.

## Acquisition

Use either:

```bash
./scripts/fetch-original-boards.sh
```

or on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fetch-original-boards.ps1
```

The scripts validate file signatures, verify the known SHA-1 of `Ganzenbord_pd.svg`, and write local SHA-256 fingerprints.

## Geometry

Artwork and board geometry remain independent. The 1–63 hotspot maps are still loaded from:

- `data/board-layouts/ganzenbord-pd.json`
- `data/board-layouts/ganzenbordspel.json`

`?debugBoard=1` remains the calibration route.
