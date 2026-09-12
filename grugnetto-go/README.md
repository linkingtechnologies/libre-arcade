# Grugnetto Go!

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/grugnetto-go/public/index.html)**

A platformer built for this collection from scratch — not a restoration —
starring Grugnetto, using [melonJS](https://melonjs.org/) and
[lit-html](https://lit.dev/), with CC0/CC-licensed art and music from
[Kenney](https://kenney.nl/) and a bilingual (Italian/English) interface.

[`public/`](public/) is fully self-contained: drop it on any static web
server and it runs, no build step, no other project in this collection
required. Its own `specs/` (inside `public/`, not alongside this README —
see below) documents its design and use case.

## Running it

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output.

## Why specs/ lives inside public/, not next to this README

Every other game in this collection keeps its `specs/` at the top level,
outside `public/`. Grugnetto Go! is the deliberate exception: the whole
point of `public/` is that it is droppable on its own, anywhere, with
nothing outside it required — which only holds if its own documentation
travels inside it too. See [`public/specs/design.md`](public/specs/design.md)
and [`public/specs/use-case.md`](public/specs/use-case.md).

## License

Three different licenses apply inside `public/` — game code (GPL-3.0-or-later),
Grugnetto's original art (all rights reserved), and third-party assets/libraries
(their own original licenses, itemized in-game on the Credits screen). See
[`public/LICENSE.txt`](public/LICENSE.txt) for the full breakdown. This
folder's own dev tooling (`scripts/`, `test/`, `eslint.config.mjs`) is
separately MIT and is not part of the game — see [`LICENSE`](LICENSE).

## History

See [`CHANGELOG.md`](CHANGELOG.md).
