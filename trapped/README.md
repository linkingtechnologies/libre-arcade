# Trapped

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/trapped/public/index.html)**

An interactive horror story. You wake in the cold outside an isolated house, get in
through the roof, and have to find two keys while a killer changes rooms every time
you move. Contains violence and strong language.

*Restored.* Written by Andy Wang and Roberto Ortiz in Twine 1.4.2 in 2015
([Rysm/html-minigames](https://github.com/Rysm/html-minigames), MIT). The English story
and the Twine engine are the original file, untouched; this folder only adds a dark,
readable page around it, keyboard play, save and resume, and a separate Italian
translation.

Play with the mouse, or press **1 to 9** to pick a choice, **Up/Down** and **Enter** to
move between links. Progress is saved on the device; **Restart story** starts over.
English by default, Italian when the browser asks for it (switch in the header; the
story keeps its place).

## Run

```powershell
npm install      # only for the tests (jsdom)
npm run dev      # serve public/ on http://localhost:8080
npm run build    # rebuild nothing; rights gate, then copy public/ to game/
npm test         # 22 tests, the original engine is run headless in jsdom
npm run lint
node scripts/build-story.mjs   # regenerate public/story/*.html from source/ + translations/
```

## Layout

- `source/Trapped.original.html`: the untouched original, sha-256 pinned in the build and tests.
- `translations/it.json`: the Italian layer (exact English segment to Italian text; titles, macros and link targets never change).
- `public/story/trapped.en.html`: the original plus two injected tags (a stylesheet and an accessibility script).
- `public/story/trapped.it.html`: the same with the Italian layer applied.
- `public/index.html`, `app.js`: the page around the story (language, restart, credits, save/resume).

## Documents

[`PROVENANCE.md`](PROVENANCE.md) · [`specs/design.md`](specs/design.md) (story analysis, passage graph, parity) ·
[`specs/RIGHTS-REGISTER.md`](specs/RIGHTS-REGISTER.md) · [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) ·
[`public/CREDITS.md`](public/CREDITS.md) · [`CHANGELOG.md`](CHANGELOG.md) · [`STORY.md`](STORY.md)

## License

New code and the Italian translation: GPL-3.0-only (`LICENSE`). The story: MIT
(`LICENSE-MIT-ANDY-WANG.txt`). The Twine/Sugarcane engine: BSD 3-clause (Osmosoft),
see `THIRD_PARTY_NOTICES.md`. One open point on authorship is recorded in
`PROVENANCE.md`.
