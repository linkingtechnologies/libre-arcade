# Upstream source: Irisa

| | |
|---|---|
| Project | Irisa, a puzzle game made for the Global Game Jam 2017 |
| Author | Matthew Miner |
| Repository | https://github.com/mminer/irisa |
| Played at (by the author) | http://matthewminer.com/irisa (on 22 November 2026 that address answers with a page that says only "Irisa") |
| Commit used | `4dada410bae9df2cc849e6808663b6043d3e7fb3` ("Add MIT license", 25 May 2018, the last commit of the repository) |
| Last change to the game itself | `bd323e9`, 26 January 2017 ("Minor tweaks and fixes"); the 2018 commit only adds the license |
| Archive URL | https://github.com/mminer/irisa/archive/4dada410bae9df2cc849e6808663b6043d3e7fb3.zip |
| SHA-256 of that archive | `a0963021385d4302f5a9b02b375a5c91c547f18c1de53d440ccdbcd349104bae` (222,948 bytes, downloaded 22 November 2026) |
| License | MIT, "Copyright (c) 2018 Matthew Miner" (see `irisa-4dada41/LICENSE`) |

GitHub generates its archive on request, so the archive checksum is a record
of what was downloaded, not a promise that GitHub will produce the same bytes
forever. The per-file checksums in `SHA256SUMS.txt` do not depend on that:
they are the SHA-256 of each file's content as stored in commit `4dada41`
(taken with `git cat-file blob`, so unaffected by line-ending conversion).

## What is kept here

`irisa-4dada41/` holds every file of the commit **except** the six sound files
and ten images under `static/audio/` and `static/img/`. Those are used by the
game and live byte for byte in `../public/assets/audio/` and
`../public/assets/img/`; `SHA256SUMS.txt` covers them too and the tests check
both places. Nothing in `irisa-4dada41/` has been edited.

The folder exists for two reasons: the tests run upstream's own `src/store.js`
and `src/levels.js` from it as the oracle for the port, and it is the proof of
exactly what was restored.

## What the original is

- Vue 2 (`^2.1.10`) renders the page; the game itself is `src/store.js`,
  `src/entities.js`, `src/util.js`, `src/levels.js` (about 300 lines).
- webpack 2 + Babel 6 (es2015, stage-3) + PostCSS cssnext build
  `static/bundle.js` (75,671 bytes, Vue and the CSS included). The bundle is
  committed; `index.html` loads it with `defer`.
- Six `<audio>` elements, each playing one MP3, and only when the user agent
  string contains "chrome" (`src/util.js`).
- No network request of any kind apart from loading its own files.
