# MilCity — HTML5 restoration for Libre Arcade

Faithful browser restoration of **MilCity - Blue Edition 1.0.5 (2011)** by Jérémy Walther.

## Play

Serve this directory with any static HTTP server and open `index.html`.

The game is client-side only and supports keyboard, mouse/touch, English and Italian. An unfinished match is autosaved in browser local storage and can be resumed after a reload. Historical Bluetooth multiplayer is documented for archaeology but is intentionally not exposed in the browser UI.

## Preserved gameplay

- 30×30 shared terrain map and configurable water percentage.
- Economy, energy, construction and blackout behavior from 1.0.5.
- Nine historical buildings and six weapons/actions.
- Easy, Medium, Hard and Madness AI behavior.
- Spy, Shield, cell damage, scoring and permanent craters.
- Java-compatible RNG for deterministic QA.
- Historical 10 FPS presentation timing.
- Complete-match certification through victory and defeat paths.

## Archaeological material

The package deliberately keeps the historical evidence separate from the playable port:

- `reference/` — unmodified original archives/binaries and reference-only original art.
- `docs/archaeology/` — source audit, rules, AI reconstruction, asset audit and oracle material.
- `docs/` — parity, visual/audio, UX and full-playthrough certification produced during restoration.

The original PNG artwork is **reference-only** and is not loaded by the browser because its file-specific provenance remains unresolved. The playable renderer is procedural.

See `docs/ARCHAEOLOGY_INDEX.md` and `reference/PROVENANCE.md` for the preservation map.

## License

See `COPYING`. The restoration is distributed as **GPL-3.0-only**, conservatively matching the upstream grant identified during the audit. Original graphical assets under `reference/original-assets/` are preserved as archaeological reference material and are not asserted to inherit the code license.

## Tests

```bash
npm test
```

The full-playthrough certification is documented in `docs/M15_FULL_PLAYTHROUGH_CERTIFICATION.md`.

## Changelog

The public changelog was reset for this release. See `CHANGELOG.md`. Earlier restoration milestones remain available as technical evidence in `docs/`, but are not represented as public release history.
