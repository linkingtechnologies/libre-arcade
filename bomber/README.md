# Bomber

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/bomber/public/index.html)**

HTML5 port of **Bomber**, the one-button plane-and-city game written for Java ME phones by Juan José Luna Espinosa (code copyright 2007, archive files dated December 2008), which credits Joseph Duffy as the author of the original game (a ZX Spectrum game, according to its SourceForge page). The rules, the city generator and the sounds are ported from the Java source and checked against the original loop itself.

## Play

- **Space**, **Enter**, a **click** or a **tap** (or the **DROP** button on a touch screen) drops a bomb, even if the press is short; the same key starts a game from the title screen. One bomb can be in the air at a time.
- The plane flies a row at a time and drops one column lower after each row. Bomb the buildings: each block you destroy scores a point. The plane crashes if it meets a block, and it lands only when every building on its path has been levelled.
- After a landing the next city is generated taller. **IT/EN** switches the language, the speaker button the sound, **Credits** opens the credits.

## What is preserved

The 141 ms turn, the 26-building city and its generator, the single bomb, the impact that destroys up to three blocks, the collision test, the difficulty growth (`landings * 3 + 8`), the three melodies and the tone data are the original's. The graphics are drawn on a canvas: none of the original's images is redistributed (see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)).

Where each part of the Java loop went and what was checked is in [`specs/port-map.md`](specs/port-map.md); the sources, their licence and the evidence are in [`PROVENANCE.md`](PROVENANCE.md).

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no framework and no build step: `public/` is plain HTML, CSS and JavaScript modules. Any static web server works (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). Do **not** open `index.html` over `file://`: browser module security blocks the local imports. `npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

For testing, `?seed=12345` reproduces the city generation with the Java-compatible random generator and `?qa=1` skips the startup delay; either one also exposes the running game as `window.__bomber`.

## Test

```sh
npm test         # node --test: all tests, no Java needed
npm run lint
npm run check    # lint + test
npm run test:live   # runs the original Java loop again and compares afresh (needs a JDK)
```

`npm test` includes the replay of a recorded run of the original loop: 750,000 iterations of its game loop, every state, city, tone and wait identical in the port. See [`specs/port-map.md`](specs/port-map.md) for what that proves and what it does not.

## License

GPL-3.0-only. The original's headers grant "version 3 of the License" and no later version, so the port cannot be offered as "or later". The original source and its licence text are in `reference/bomber-1.0/` and keep their own notices.
