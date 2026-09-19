#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Umberto Bresciani
# SPDX-License-Identifier: GPL-3.0-only

"""Extract the outline of every board plaque into tile-outlines.json.

The illustrated board is a plain image, so the plaque shapes are recovered from
its pixels: the cream faces are segmented, matched to the spaces of layout.json
by position, and the dark border line around each face is traced.

Coordinates are written in the layout's own viewBox units. The background is
stretched onto the viewBox (object-fit: fill), so image pixels are rescaled per
axis; the outlines then line up with layout.json's x/y/w/h and tokenAnchor.

The output is derived data. Run this again whenever the background image or the
space positions in layout.json change:

    python scripts/extract-tile-outlines.py [--image PATH] [--out PATH]

Requires numpy and opencv-python (or opencv-python-headless). This is a
maintenance tool only: the game itself never runs it.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
LAYOUT_DIR = ROOT / "public/boards/layouts/grugnetto-islands"

# A plaque face is light and almost unsaturated (fractions of 255, HSV).
FACE_MAX_SAT, FACE_MIN_VAL = 0.22, 0.80
FACE_MIN_AREA = 1500        # px; smaller light blobs (daisies, sail, foam) are not plaques
MATCH_WINDOW = (45, 25)     # px (half width, half height) around a space centre
MAX_CENTRE_ERROR = 8.0      # viewBox units between a face centroid and its space centre (catches mismatches)

# The dark line around a plaque, read as luma along the outward normal of the face edge.
STEP = 0.5                  # px between samples
LINE_DARK = 110.0           # luma below which the line has started (face and bevel stay above 140, the line under 100)
LINE_SEARCH = 8.0           # px from the face edge where the line may start (the bevel leaves a gap)
LINE_CORE = 3.0             # px after the start searched for the darkest part of the line
LINE_WIDTH = 3.5            # px, thickest single line; touching plaques share one merged band, split in the middle
BEYOND = (3.5, 6.5)         # px past the line's darkest part sampled to learn what surrounds it
MAX_OFFSET = LINE_SEARCH + 5.0

SAFE_MARGIN = 3             # px kept clear inside the face for safeRect
SIMPLIFY = 0.5              # viewBox units, Douglas-Peucker tolerance


def smooth_closed(values, sigma):
    """Gaussian smoothing along a closed curve (the first axis wraps around)."""
    values = np.asarray(values, dtype=np.float64)
    columns = values.reshape(len(values), -1)
    radius = int(np.ceil(3 * sigma))
    kernel = np.exp(-0.5 * (np.arange(-radius, radius + 1) / sigma) ** 2)
    kernel /= kernel.sum()
    padded = np.pad(columns, ((radius, radius), (0, 0)), mode="wrap")
    smoothed = [np.convolve(padded[:, k], kernel, mode="valid") for k in range(columns.shape[1])]
    return np.stack(smoothed, axis=1).reshape(values.shape)


def find_faces(bgr, layout, sx, sy):
    """Return (space, filled face mask) for every layout space."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    light = (hsv[..., 1] < FACE_MAX_SAT * 255) & (hsv[..., 2] > FACE_MIN_VAL * 255)
    light = cv2.morphologyEx(light.astype(np.uint8), cv2.MORPH_OPEN,
                             cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3)))
    _, labels, stats, _ = cv2.connectedComponentsWithStats(light, connectivity=4)

    vx, vy = layout["viewBox"][:2]
    faces, used = [], set()
    for space in layout["spaces"]:
        cx = int(round((space["x"] + space["w"] / 2 - vx) / sx))
        cy = int(round((space["y"] + space["h"] / 2 - vy) / sy))
        window = labels[max(cy - MATCH_WINDOW[1], 0):cy + MATCH_WINDOW[1],
                        max(cx - MATCH_WINDOW[0], 0):cx + MATCH_WINDOW[0]]
        ids, counts = np.unique(window[window > 0], return_counts=True)
        big = [(n, i) for i, n in zip(ids, counts) if stats[i, cv2.CC_STAT_AREA] >= FACE_MIN_AREA]
        if not big:
            sys.exit(f"space {space['index']} ({space['id']}): no plaque face near ({cx}, {cy})")
        label = max(big)[1]
        if label in used:
            sys.exit(f"space {space['index']} ({space['id']}): plaque already matched to another space")
        used.add(label)

        contours, _ = cv2.findContours((labels == label).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        face = np.zeros(labels.shape, np.uint8)
        cv2.drawContours(face, contours, -1, 1, thickness=cv2.FILLED)   # fills anything painted inside
        faces.append((space, face))
    return faces


def face_contour(face):
    contours, _ = cv2.findContours(face, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    return max(contours, key=len).reshape(-1, 2).astype(np.float64)


def outward_normals(points, face):
    tangent = np.roll(points, -1, axis=0) - np.roll(points, 1, axis=0)
    tangent /= np.linalg.norm(tangent, axis=1, keepdims=True)
    normals = np.column_stack([tangent[:, 1], -tangent[:, 0]])
    probe = np.rint(points + 3 * normals).astype(int)
    height, width = face.shape
    inside = face[np.clip(probe[:, 1], 0, height - 1), np.clip(probe[:, 0], 0, width - 1)].mean()
    return -normals if inside > 0.5 else normals


def line_edge(row, steps):
    """Outer edge of the dark line in one luma profile (px from the face edge), NaN if there is none.

    The line starts where the luma drops below LINE_DARK. Its outer edge is where the luma climbs
    half way from the line's own level to the level of whatever surrounds it, so dark shadows or
    crevices next to the line do not stretch it; LINE_WIDTH caps what is left (a neighbouring
    plaque's line merged with this one).
    """
    below = np.flatnonzero((row < LINE_DARK) & (steps <= LINE_SEARCH))
    if below.size == 0:
        return np.nan
    j0 = below[0]
    start = steps[j0] if j0 == 0 else steps[j0 - 1] + STEP * (row[j0 - 1] - LINE_DARK) / (row[j0 - 1] - row[j0])
    core = row[j0:j0 + int(LINE_CORE / STEP) + 1]
    darkest = j0 + int(np.argmin(core))
    inner = np.sort(core)[:3].mean()
    beyond = row[min(darkest + int(BEYOND[0] / STEP), len(row) - 1):darkest + int(BEYOND[1] / STEP) + 1]
    half = inner + max(np.median(beyond) - inner, 30.0) / 2
    edge = np.inf
    for k in range(darkest + 1, len(row)):
        if row[k] >= half:
            fraction = (half - row[k - 1]) / (row[k] - row[k - 1]) if row[k] > row[k - 1] else 1.0
            edge = steps[k - 1] + STEP * float(np.clip(fraction, 0.0, 1.0))
            break
    return min(edge, start + LINE_WIDTH)


def border_offsets(luma, points, normals):
    steps = np.arange(0.0, MAX_OFFSET + BEYOND[1] + 2.0, STEP)
    xs = (points[:, :1] + normals[:, :1] * steps).astype(np.float32)
    ys = (points[:, 1:] + normals[:, 1:] * steps).astype(np.float32)
    profile = cv2.remap(luma, xs, ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return np.array([line_edge(row, steps) for row in profile])


def clean_offsets(offsets, fallback):
    """Fill gaps, then drop bumps caused by dark scenery touching the border."""
    ok = np.isfinite(offsets)
    if ok.sum() < len(offsets) / 4:
        return np.full(len(offsets), fallback), False
    n, index = len(offsets), np.arange(len(offsets))
    filled = np.interp(index, np.concatenate([index[ok] - n, index[ok], index[ok] + n]), np.tile(offsets[ok], 3))
    window = np.stack([np.roll(filled, k) for k in range(-7, 8)])
    smooth = smooth_closed(np.median(window, axis=0), 3.0)
    return np.clip(smooth, 1.5, MAX_OFFSET), True


def polygon_area(poly):
    x, y = poly[:, 0], poly[:, 1]
    return 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)


def contains(poly, point, slack=0.0):
    inside = cv2.pointPolygonTest(np.asarray(poly, np.float32).reshape(-1, 1, 2), (float(point[0]), float(point[1])), True)
    return inside >= -slack


def is_simple(poly):
    def side(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    n = len(poly)
    for i in range(n):
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            p1, p2, p3, p4 = poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n]
            if side(p3, p4, p1) * side(p3, p4, p2) < 0 and side(p1, p2, p3) * side(p1, p2, p4) < 0:
                return False
    return True


def normalise(poly):
    """Clockwise on screen (y grows downwards), starting at the topmost vertex, 0.1 unit precision."""
    poly = np.round(np.asarray(poly, dtype=np.float64), 1)
    if polygon_area(poly) < 0:
        poly = poly[::-1]
    first = min(range(len(poly)), key=lambda i: (poly[i][1], poly[i][0]))   # ties are decided on the rounded values
    return np.roll(poly, -first, axis=0)


def safe_rect(face, view, sx, sy, aspect):
    """Largest rectangle with the given aspect ratio that fits inside the face, in viewBox units."""
    core = cv2.erode(face, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * SAFE_MARGIN + 1,) * 2))
    ys, xs = np.nonzero(core)
    vx, vy = view
    gx0, gy0 = int(np.floor(vx + xs.min() * sx)), int(np.floor(vy + ys.min() * sy))
    gw = int(np.ceil(vx + (xs.max() + 1) * sx)) - gx0
    gh = int(np.ceil(vy + (ys.max() + 1) * sy)) - gy0
    # Raster of the face with one cell per viewBox unit, so the rectangle keeps its proportions on screen.
    to_image = np.float32([[1 / sx, 0, (gx0 + 0.5 - vx) / sx - 0.5],
                           [0, 1 / sy, (gy0 + 0.5 - vy) / sy - 0.5]])
    grid = cv2.warpAffine(core, to_image, (gw, gh), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP)
    table = cv2.integral(grid)

    def fits(w):
        h = max(1, int(round(w / aspect)))
        if w > gw or h > gh:
            return h, np.empty(0, int), np.empty(0, int)
        total = table[h:, w:] - table[:-h, w:] - table[h:, :-w] + table[:-h, :-w]
        top, left = np.nonzero(total == w * h)
        return h, left, top

    low, high = 1, gw + 1            # low always fits, high never does
    while high - low > 1:
        mid = (low + high) // 2
        low, high = (mid, high) if fits(mid)[1].size else (low, mid)
    h, left, top = fits(low)
    best = np.argmin((left - left.mean()) ** 2 + (top - top.mean()) ** 2)   # most central feasible position
    return {"x": int(gx0 + left[best]), "y": int(gy0 + top[best]), "w": int(low), "h": int(h)}


def stretch(edge, view, sx, sy):
    """Image pixel indexes to viewBox units: +0.5 gives the continuous position, then the per-axis stretch."""
    return np.column_stack([view[0] + (edge[:, 0] + 0.5) * sx, view[1] + (edge[:, 1] + 0.5) * sy])


def resolve_contacts(state, view, sx, sy):
    """Plaques whose borders touch share one dark band: split it down the middle.

    Wherever a plaque's outline enters another's, each of the two gives way by half of that depth.
    """
    unit = (sx + sy) / 2
    for _ in range(3):
        rings = [stretch(t["points"] + t["offsets"][:, None] * t["normals"], view, sx, sy).astype(np.float32) for t in state]
        boxes = [cv2.boundingRect(ring.reshape(-1, 1, 2)) for ring in rings]
        settled = True
        for a, tile in enumerate(state):
            retreat = np.zeros(len(rings[a]))
            for b, other in enumerate(rings):
                (xa, ya, wa, ha), (xb, yb, wb, hb) = boxes[a], boxes[b]
                if a == b or xa > xb + wb or xb > xa + wa or ya > yb + hb or yb > ya + ha:
                    continue
                contour = other.reshape(-1, 1, 2)
                depth = np.array([cv2.pointPolygonTest(contour, (float(x), float(y)), True) for x, y in rings[a]])
                retreat = np.maximum(retreat, np.where(depth > 0, depth / 2 + 0.25, 0.0))
            if retreat.any():
                settled = False
                tile["offsets"] = np.clip(smooth_closed(tile["offsets"] - retreat / unit, 1.0), 1.5, MAX_OFFSET)
        if settled:
            break


def extract_tiles(bgr, layout):
    """Trace every plaque; returns one dict per layout space (outline and safeRect in viewBox units)."""
    view = layout["viewBox"]
    height, width = bgr.shape[:2]
    sx, sy = view[2] / width, view[3] / height
    size = layout.get("defaultSpaceSize") or layout["spaces"][0]
    luma = cv2.GaussianBlur(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 0.7)

    traced = []
    for space, face in find_faces(bgr, layout, sx, sy):
        points = smooth_closed(face_contour(face), 2.5)
        normals = outward_normals(points, face)
        traced.append((space, face, points, normals, border_offsets(luma, points, normals)))
    fallback = float(np.nanmedian(np.concatenate([t[4] for t in traced])))

    state = []
    for space, face, points, normals, raw in traced:
        offsets, reliable = clean_offsets(raw, fallback)
        state.append({"space": space, "face": face, "points": points, "normals": normals,
                      "offsets": offsets, "reliable": reliable})
    resolve_contacts(state, view, sx, sy)

    tiles = []
    for t in state:
        space, face, offsets, reliable = t["space"], t["face"], t["offsets"], t["reliable"]
        stretched = stretch(t["points"] + offsets[:, None] * t["normals"], view, sx, sy)
        poly = normalise(cv2.approxPolyDP(stretched.astype(np.float32).reshape(-1, 1, 2), SIMPLIFY, True).reshape(-1, 2))

        # The layout centres sit on the cream faces, so compare with the face, not with the (lopsided) outline.
        moments = cv2.moments(face, binaryImage=True)
        face_centre = np.array([view[0] + (moments["m10"] / moments["m00"] + 0.5) * sx,
                                view[1] + (moments["m01"] / moments["m00"] + 0.5) * sy])
        centre = np.array([space["x"] + space["w"] / 2, space["y"] + space["h"] / 2])
        error = float(np.linalg.norm(face_centre - centre))
        anchor = space.get("tokenAnchor")
        sampled = face_contour(face)[::4]
        face_edge = np.column_stack([view[0] + (sampled[:, 0] + 0.5) * sx, view[1] + (sampled[:, 1] + 0.5) * sy])

        problems = []
        if not reliable:
            problems.append("border line not found, default thickness used")
        if not is_simple(poly):
            problems.append("outline crosses itself")
        if error > MAX_CENTRE_ERROR:
            problems.append(f"face centre {error:.1f} units from the space centre")
        if not contains(poly, centre) or (anchor and not contains(poly, (anchor["x"], anchor["y"]))):
            problems.append("space centre or token anchor falls outside the outline")
        if not all(contains(poly, p, slack=0.5) for p in face_edge):
            problems.append("outline does not contain the whole face")
        if poly[:, 0].min() < view[0] or poly[:, 1].min() < view[1] or \
                poly[:, 0].max() > view[0] + view[2] or poly[:, 1].max() > view[1] + view[3]:
            problems.append("outline leaves the viewBox")

        tiles.append({"index": space["index"], "id": space["id"], "outline": poly,
                      "safeRect": safe_rect(face, view[:2], sx, sy, size["w"] / size["h"]),
                      "border": (float(offsets.min()), float(np.median(offsets)), float(offsets.max())),
                      "centreError": error, "problems": problems})
    return tiles


def find_overlaps(tiles, view):
    """Pairs of tile indexes whose outlines share pixels of the viewBox grid.

    Each outline is eroded by one unit first: plaques that touch are allowed to share a hairline.
    """
    owner = np.zeros((int(view[3]), int(view[2])), np.int16)
    clashes = set()
    for n, tile in enumerate(tiles, start=1):
        layer = np.zeros(owner.shape, np.uint8)
        cv2.fillPoly(layer, [np.rint(tile["outline"]).astype(np.int32)], 1)
        layer = cv2.erode(layer, np.ones((3, 3), np.uint8))
        clashes |= {(tiles[h - 1]["index"], tile["index"]) for h in np.unique(owner[layer > 0]) if h}
        owner[layer > 0] = n
    return sorted(clashes)


def compact(poly):
    return "[" + ", ".join(f"[{x:.1f}, {y:.1f}]" for x, y in poly) + "]"


def render_json(layout, tiles, source, digest, size):
    view, default = layout["viewBox"], layout.get("defaultSpaceSize") or layout["spaces"][0]
    lines = [
        "{",
        '  "schemaVersion": 1,',
        f'  "layoutId": {json.dumps(layout["layoutId"])},',
        f'  "viewBox": {json.dumps(view)},',
        f'  "source": {{"image": {json.dumps(source)}, "sha256": "{digest}", "size": {json.dumps(size)}}},',
        '  "generator": "scripts/extract-tile-outlines.py",',
        '  "notes": [',
        '    "Derived from the board image named in source: regenerate with the generator whenever that image or the space positions in layout.json change.",',
        '    "Coordinates are viewBox units, the same as layout.json (the image is stretched onto the viewBox).",',
        '    "outline: outer edge of the dark border around the plaque, a simple polygon, clockwise on screen, starting at its topmost vertex.",',
        f'    "safeRect: largest rectangle with the default space proportions ({default["w"]}:{default["h"]}) that fits inside the cream face with a {SAFE_MARGIN} px margin, in viewBox units."',
        "  ],",
        '  "tiles": [',
    ]
    for i, tile in enumerate(tiles):
        rect = tile["safeRect"]
        lines += [
            "    {",
            f'      "index": {tile["index"]},',
            f'      "id": {json.dumps(tile["id"])},',
            f'      "outline": {compact(tile["outline"])},',
            f'      "safeRect": {{"x": {rect["x"]}, "y": {rect["y"]}, "w": {rect["w"]}, "h": {rect["h"]}}}',
            "    }" + ("," if i < len(tiles) - 1 else ""),
        ]
    return "\n".join(lines + ["  ]", "}"]) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--image", type=Path, help="board image (default: the background named in layout.json)")
    parser.add_argument("--out", type=Path, default=LAYOUT_DIR / "tile-outlines.json")
    args = parser.parse_args()

    layout = json.loads((LAYOUT_DIR / "layout.json").read_text(encoding="utf-8"))
    image_path = args.image or ROOT / "public" / layout["background"]
    data = image_path.read_bytes()
    bgr = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if bgr is None:
        sys.exit(f"cannot decode {image_path}")
    height, width = bgr.shape[:2]
    view = layout["viewBox"]
    print(f"{image_path.name}: {width}x{height} px -> viewBox {view[2]}x{view[3]}")

    tiles = extract_tiles(bgr, layout)
    failed = False
    for tile in tiles:
        low, mid, high = tile["border"]
        rect = tile["safeRect"]
        print(f"  {tile['index']:2d} {tile['id']:<19} {len(tile['outline']):2d} points  border {low:.1f}-{high:.1f} px "
              f"(median {mid:.1f})  centre off {tile['centreError']:.1f}  safeRect {rect['w']}x{rect['h']}")
        for problem in tile["problems"]:
            print(f"     ! {problem}")
            failed = True
    clashes = find_overlaps(tiles, view)
    if clashes:
        print("  ! outlines overlap:", ", ".join(f"{a}/{b}" for a, b in clashes))
        failed = True
    if failed:
        sys.exit("not written: fix the problems above")

    source = image_path.relative_to(ROOT / "public").as_posix() if image_path.is_relative_to(ROOT / "public") else image_path.name
    args.out.write_text(render_json(layout, tiles, source, hashlib.sha256(data).hexdigest(), [width, height]),
                        encoding="utf-8", newline="\n")
    print(f"wrote {args.out.relative_to(ROOT) if args.out.is_relative_to(ROOT) else args.out} ({len(tiles)} tiles)")


if __name__ == "__main__":
    main()
