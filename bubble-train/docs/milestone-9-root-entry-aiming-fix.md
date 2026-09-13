# Milestone 9 — root release entry point and cannon aiming fix

## User-facing fixes

### Root entry point

The playable restoration now starts directly from the project root:

- `index.html`
- `main.js`

The old runtime `demo/` directory has been removed. Its three clean-room prototype levels were retained only as test fixtures under `tests/fixtures/clean-demo/`.

Local URL:

```text
http://127.0.0.1:8080/
```

This matches the packaging convention used by the other restoration projects and is directly suitable for a GitHub Pages repository root.

### Cannon visual direction

The game/source angle convention uses **positive angle = left**:

- positive angle moves the barrel/projectile X position left;
- negative angle moves it right.

Canvas `rotate()` uses the opposite visual sign for an upward-pointing sprite in screen coordinates. The renderer had therefore been drawing the SVG barrel mirrored relative to the actual aiming/projectile direction.

The renderer now uses:

```js
ctx.rotate(-cannon.angle)
```

through the tested `cannonCanvasRotation()` helper. The gameplay angle and projectile physics were not changed.

Result:

- Left arrow / left touch control visually aims left.
- Right arrow / right touch control visually aims right.
- Pointer X position and visual barrel agree.
- Fired projectile direction continues to agree with the source-derived cannon mathematics.

## Regression coverage

Two tests were added to lock the sign convention for left/right aiming.

Total automated suite: **62/62 PASS**.

The full `npm run release:check` gate also passes, including preserved hashes, quarantine scan, 61-level soak and root HTTP/MIME smoke checks.
