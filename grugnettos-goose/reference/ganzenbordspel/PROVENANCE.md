# Ganzenbordspel.jpg — provenance

- **Title:** `Ganzenbordspel.jpg`
- **Author:** Daan Hoeksema (1879–1935)
- **Date:** ca. 1910–1920
- **Source collection:** Collectie Stadsarchief Amsterdam: tekeningen en prenten
- **Commons page:** https://commons.wikimedia.org/wiki/File:Ganzenbordspel.jpg
- **Description:** `Ganzenbordspel met 63 vakjes; in het midden afbeelding van spelende ganzen. Techniek: kleurenlitho.`
- **Commons full-resolution dimensions:** 6421 × 4609
- **Rights status:** public-domain historical artwork (`PD-old` on Commons)
- **Role:** alternative historical board theme / visual archaeology

## Bundled v0.14 file

Path:

`public/assets/boards/original/Ganzenbordspel.jpg`

The image was supplied directly to the project on 2026-09-13. The bytes available to this project are a **2048 × 1470 JPEG** representation of the historical scan, not the 6421 × 4609 full-resolution Commons file.

Checksums of the bundled file:

- SHA-1: `8794dc21c769e9f3f0ded66b96f16670f40c3260`
- SHA-256: `b3de3ad4694963427bb70567327662641669c7adeb0589964c377d664cee73fc`

This distinction is intentional: the runtime uses the locally supplied historical scan, while the provenance record continues to identify the full-resolution Commons source.

## Calibration

v0.14 gives this board its own independent 1–63 geometry in `public/data/board-layouts/ganzenbordspel.json`.

The 63 numbered round spaces were detected from the supplied image and ordered along the continuous spiral. The resulting normalized centres were then verified visually against the board. The layout is therefore no longer inherited from `Ganzenbord_pd.svg`.

## Runtime decision

v0.14 loads only the bundled local image. There is no Wikimedia runtime fallback and no generated historical-style substitute.
