# Netris

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/netris/public/index.html)**

A faithful port of the single-player core of [Netris](https://web.archive.org/web/20110831162119/http://netris.org/)
0.52 (1994–1999) by Mark H. Weaver — a compact, GPL-2.0-or-later Tetris
clone whose upstream site has been dead since at least 2011 and whose last
real code change dates to 1999. See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md)
for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly
what was and wasn't ported.

Board size, piece shapes (represented the original's own way, as short
turtle-graphics programs rather than coordinate grids), falling/locking,
line clearing, and even the exact random-number generator are preserved. So
is the original's own decision to ship single-player with no score and no
automatic speed-up — its own README calls that mode "very boring" and says
why.

## Running it

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output.

## Controls

`←`/`j` `→`/`l` move · `↑`/`k` rotate · `↓`/space soft drop · `p` hard drop ·
`f` faster (one-way, matching the original) · `s` pause · `r` restart ·
`a` autopilot.

Autopilot hands the board to `sr.c`'s 1994–1996 heuristic — the same
decision algorithm Mark Weaver wrote to demonstrate Netris's external-robot
protocol, ported to play directly against the engine instead. See
[`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md).

## Tests

```bash
npm test
```

No C compiler is available in this environment to build the original as an
executable oracle (the approach used for Klondike). Tests instead verify
the port against a documented reading of the original source, including
hand-computed exact values for the RNG — see [`specs/port-map.md`](specs/port-map.md).

## License

This project's own code is GPL-3.0-or-later, exercising the "or later"
permission of Netris's own GPL-2.0-or-later license — see
[`LICENSE`](LICENSE), [`PROVENANCE.md`](PROVENANCE.md), and
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## History

See [`CHANGELOG.md`](CHANGELOG.md).
