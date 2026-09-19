# Presentation board layout

The distributable game intentionally contains **one presentation layout only**: `grugnetto-islands`.

## Files

- `boards/layouts/grugnetto-islands/board_blank_tiles.webp`: illustrated four-world archipelago with the central Grugnetto home hub.
- `boards/layouts/grugnetto-islands/layout.json`: positions for all 32 logical spaces, center panel, token anchors, level references, local visual icons and bridge waypoints.
- `boards/layouts/grugnetto-islands/tile-outlines.json`: the outer outline of each of the 32 painted plaques (a polygon) and the largest content rectangle that fits inside it, in the same viewBox units as `layout.json`. It is derived from the background image (whose hash is recorded inside) and is not used by the game yet. Regenerate it with `scripts/extract-tile-outlines.py` whenever the image or the space positions change.

`boards/index.json` points the packaged 32-space board (`v1.4`) at this layout. Space IDs remain identical, so presentation can change without modifying frozen mechanics/content.

The browser validates the mapping against the selected board IDs before using it. If the layout cannot be loaded or validated, the legacy 9×9 renderer remains only as a defensive runtime fallback.

## Canonical visual progression

RC39 continues to present the logical route in four blocks of eight, matching the Grugnetto Go level order:

1. spaces 0–7 — **Prato di Casa** (`world1-level1` … `world1-level8`)
2. spaces 8–15 — **Bosco degli Scoiattoli** (`world2-level1` … `world2-level8`)
3. spaces 16–23 — **Dune Dorate** (`world3-level1` … `world3-level8`)
4. spaces 24–31 — **Miniera di Pietra** (`world4-level1` … `world4-level8`)

These are presentation references only. The underlying space type at each index is unchanged. A special space can therefore live visually inside a world without becoming a property in that world.

Each mapped space carries an `iconAsset` drawn from an image actually used by its corresponding Grugnetto Go level, using the local audited copies already present in this package.

## Central hub and movement

All four islands are visually connected through the central Grugnetto home hub. The four logical boundary transitions (7→8, 15→16, 23→24 and 31→0) carry presentation-only `waypoints`. Token animation follows those bridge/hub points rather than moving diagonally over the sea. Reverse movement uses the same waypoint sequence in reverse.

This layer is presentation-only: movement order, landing probability, prices, rent, cards, AI, save data and deterministic behavior remain unchanged.


### RC39 central hub

The central grassy island is presentation-only. It contains no logical board spaces. It exists to connect the four illustrated worlds visually and to host a compact current-turn HUD without competing with the 32 playable positions.

## Plaque outlines

`tileOutlines` in `layout.json` points at `tile-outlines.json`: for each of the 32 plaques, the outer outline polygon (`outline`) and the largest content rectangle inside the cream face (`safeRect`), in the layout's viewBox units. The UI uses the outlines to tint a player's properties, to spotlight plaques during auctions, trade offers and property inspection, to hit-test clicks and to draw the keyboard focus ring. The file is derived from the background image: do not edit it by hand, regenerate it with `python scripts/extract-tile-outlines.py` (numpy and opencv-python required) and refresh its line in `SHA256SUMS`.
