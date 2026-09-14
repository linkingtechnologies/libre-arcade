# UI v0.9 — Ganzenbord public-domain board

## Purpose

Replace the synthetic square spiral as the main visual board with the historical public-domain `Ganzenbord_pd.svg` illustration by Pmathijssen, while leaving the deterministic game engine untouched.

## Position model

The renderer creates 63 transparent DOM hotspots over the board. Each hotspot keeps the same `data-index` contract used by the previous renderer, so `Animator` does not need board-specific logic.

Coordinates are stored as normalized percentages:

```text
square 1  -> x%, y%
square 2  -> x%, y%
...
square 63 -> x%, y%
```

At runtime CSS places each hotspot with `left: x%` and `top: y%`. Because the coordinates are relative to the artwork rather than screen pixels, the same map works at every responsive size.

## How the coordinates were derived

The preferred archival method is to inspect the original SVG XML, identify the numbered text/groups and transform their geometric centres through any SVG transforms. In this build environment the Commons SVG could be rendered and inspected but its binary source could not be materialized locally, so v0.9 uses a one-time calibration against the official **960 × 687 Commons rendering**, normalized to percentages.

The board's nominal SVG dimensions are 956 × 684, which has effectively the same aspect ratio. The coordinate map is therefore resolution-independent. `?debugBoard=1` displays all 63 hotspot boxes/numbers to make visual verification and future fine calibration straightforward.

When the exact SVG is vendored locally, these calibrated positions should be verified against the vector geometry and adjusted where necessary; this does not affect game rules.

## Separation of concerns

- `classic-63.json`: rules/special-square data.
- `historicBoardLayout.js`: visual coordinates and artwork URL.
- `app.js`: creates artwork + hotspot overlay.
- `Animator.js`: continues to locate positions by `[data-index]`.
- core: no knowledge of board pixels, SVG or DOM.

## Packaging note

v0.9 loads the exact original SVG from Wikimedia Commons at runtime. This makes the integration directly testable now, but an offline/final release should bundle the verified original SVG under `assets/boards/` and remove the network dependency.
