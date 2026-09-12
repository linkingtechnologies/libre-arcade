# 🐽’s Naval Battle

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/naval-battle/index.html)**

**Classic naval battle, rebuilt from preserved open-source game AIs.**

🐽’s Naval Battle is the production-ready player-facing edition of the BattleLab software-archaeology project. It keeps the historical source material and AI ports, but presents them as a simple browser game with a clean Italian/English interface.

## Play

- single-player naval battle on a 10×10 grid;
- classic fleet: `5,4,3,3,2`;
- five opponent styles: Easy, Normal, Hard, Expert and Classic;
- manual or random fleet placement;
- responsive desktop/mobile UI;
- Italian and English;
- no framework, build step or backend.

Serve the folder with any static web server and open `index.html`. ES modules are used, so opening the file directly with `file://` is not recommended.

## Software archaeology

The playable opponents preserve ideas from historical naval battle implementations, mainly **Warboats 0.51 (2009)** and **Bataille Navale OS4 (2009)**. Original artifacts and provenance notes remain under `/reference` and `/specs`. The player-facing UI deliberately uses simple difficulty names instead of implementation names.

### Historical behaviour

The deterministic Arena preserves historical AI behaviour. The interactive game includes a documented recovery path for the rare Warboats targeting stall so a browser match cannot freeze.

## Development

```sh
npm test
npm run arena
npm run arena:warboats
npm run reference:status
```

The JavaScript derivative is distributed under GPLv3. See `LICENSE` and `THIRD_PARTY_NOTICES.md` for details.

## Release

Version **1.0.0** is the first production release. The optional `test/ui_smoke.py` Playwright smoke test checks the main Italian/English flow and guards against viewport overflow at representative desktop and mobile sizes. It is a development-only test; the game itself has no Python or Playwright runtime dependency.
