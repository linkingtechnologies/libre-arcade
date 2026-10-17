# Strider

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/strider/public/index.html)**

A 2D sci-fi platformer: climb a moon-base facility to the extraction ship,
with a double jump and a rifle that aims for you. By Petar Petrov (KENAMICK
Entertainment) for GitHub's Game Off 2015
([kenamick/strider](https://github.com/kenamick/strider), MIT, archived by
its owner in April 2026), built on the Crafty engine and descended from
Octocat Jump (Game Off 2012). Restored and re-hosted here.

`public/js/` holds upstream's own four source files, loaded as separate
scripts instead of Grunt's concatenated bundle, plus a small
`fit.js` that scales the 400 by 640 stage down in short browser windows (upstream
clipped it). Game Jolt's library and
trophy art are not shipped (the game's own `GJAPI` stub already turns every
call into a no-op), and five assets whose licenses could not be cleared
(two CC BY-NC sounds, one "Sampling" sound, one sound whose page is gone, and
the smoke sprite whose site is gone) were replaced with new ones generated
by [`tools/make-replacements.mjs`](tools/make-replacements.mjs). Full
account: [`specs/design.md`](specs/design.md). Authorship and the license of
every asset: [`public/CREDITS.md`](public/CREDITS.md).

**Open license question:** Octocat Jump, which Strider is a fork of, has no
license file. Strider's own author relicensed his version as MIT, and only
about 3% of its code lines also appear in the original, but that is his
statement, not something verified here. Details in `specs/design.md`.

## Controls

Arrow keys or WASD to move, Up or W twice to double jump, X, Z or Y to shoot
at the nearest enemy (it aims by itself), 1 to trade one health for a full
energy refill. Sound and music can be toggled with the icons at the bottom
right. Under Safari the sound is off (upstream's own limit).

## Running it

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. `npm run check` runs lint and tests.

## License

The game is MIT, see [`public/LICENSE`](public/LICENSE); third-party assets
keep their own licenses, listed in [`public/CREDITS.md`](public/CREDITS.md).
This folder's own dev tooling (`scripts/`, `test/`, `tools/`,
`eslint.config.mjs`) and the replacement assets it generates are separately
MIT, see [`LICENSE`](LICENSE).
