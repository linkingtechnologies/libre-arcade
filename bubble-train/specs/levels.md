# Level and path format

## Shipped content

The final OS4/reference package contains **61 `.lvl` files** and **5 `.gms` game manifests**:

- Easy: 10
- Normal: 20
- Hard: 20
- BubbleTrain: 11 (B-U-B-B-L-E-T-R-A-I-N)
- Everything: manifest that sequences the broader set rather than adding unique `.lvl` files

Across the 61 levels there are 61 levels, with train-count distribution: {1: 43, 2: 14, 3: 4}. Every shipped level has one cannon.

Track-section totals: **134 lines, 127 arcs, 19 spirals**.

Shipped train speeds: [1.0, 1.2, 1.3, 1.5, 2.0] units/frame. Shipped carriage counts: [3, 5, 10, 15, 20, 25, 30, 40, 50]. Shipped colour counts: [2, 3, 4, 5].

Detailed per-level inventory: `levels-inventory.csv`.

## `.gms` schema

A game manifest is XML with root `<game>` and ordered `<level>` records:

```xml
<game>
  <level theme="sky" src="Easy/easy-1.lvl"/>
  <level theme="beach" src="Easy/easy-2.lvl"/>
</game>
```

Order defines progression. `theme` selects a theme directory; `src` identifies the level XML.

## `.lvl` schema

```xml
<level>
  <cannons>
    <cannon type="rotation" pos="400,575" bulletreloadtime="500" bulletspeed="10.00">
      <bullets random="1" colour-num="2"/>
    </cannon>
  </cannons>
  <trainstations>
    <train speed="1.00">
      <track colour="...">
        <line startpos="100,200" endpos="700,200"/>
      </track>
      <carriages random="1" colour-num="2" carriage-num="3"/>
    </train>
  </trainstations>
</level>
```

Observed attributes:

- `cannon`: `type`, `pos`, `bulletreloadtime`, `bulletspeed`
- `bullets`: `random`, `colour-num`; optional child `bullet type=... special=true number=N`
- `train`: `speed`
- `track`: optional `colour`
- `carriages`: `random`, `colour-num`, `carriage-num`; optional child `carriage` records

## Path primitives

### Line

`<line startpos="x,y" endpos="x,y"/>`

Movement is exact Euclidean distance along the line. If a frame's remaining movement reaches/passes the endpoint, the section returns leftover distance to the enclosing `Track`, which continues on the next section.

### Arc

`<arc startpos="..." endpos="..." centre="..." rotation="clockwise|anticlockwise"/>`

The radius is derived from geometry. Movement converts linear distance to angular displacement by `angle = distance / radius`, then returns leftover distance when the endpoint is reached.

### Spiral

`<spiral startpos="..." endpos="..." centre="..." rotation="clockwise|anticlockwise"/>`

The implemented radius law is:

`r(theta) = startRadius * exp(-abs(theta) / 10)`

The move routine locally treats distance as arc length (`angleToMove = dist/currentRadius`) then recomputes the exponential radius. Preserve this exact discrete algorithm for parity before attempting mathematically “better” integration.

## Section continuity

A `Track` is an ordered list of primitives. `Track::move` first identifies the section containing a carriage, moves within it, and carries any remainder into the next/previous primitive. Passing beyond the final section returns `CMS_CRASHED`; passing before the first returns `CMS_RETURN_TO_STATION`.

## Multiple tracks

A level can contain multiple independent `<train>` elements. Shipped levels contain **1 to 3 trains**. Their tracks may overlap visually; trains remain logically independent.

## Editor

The included level editor supports line/arc/spiral creation, multiple trains, reversing a track, train/cannon properties, grid alignment, load/save and section navigation. The help documentation explicitly warns that a track should not overlap itself because path following can become ambiguous.

## License status of historical level data

The 61 bundled `.lvl` and 5 `.gms` files are now classified **GPL-SCOPE — HIGH CONFIDENCE** based on the upstream package-level GPL statement, Bubble Train source notices, and the original documentation identifying these XML files as the editable game/level definitions. They may be used to preserve the original campaign while audiovisual themes are replaced with clean assets.

Keep the original XML byte-for-byte where possible and accompany it with the evidence documented in `level-data-license-memo.md`. This conclusion does not automatically apply to later third-party/user-authored level packs.
