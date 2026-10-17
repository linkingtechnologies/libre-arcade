# Changelog

## 1.0.0, 2026-10-17

- Vendored [The Lost Path](https://github.com/wrksp8/TheLostPath) (Ghazi, MIT)
  into `public/`. Removed upstream's Google Analytics tag, added GoatCounter,
  filled in the web manifest, added a torch (the maze is invisible upstream)
  drag-to-move touch controls
  (`src/touch.js`, `src/torch.js`), and the collection's usual toolbar: menu,
  instructions, credits and an Italian/English switch (`src/menu.js`,
  `src/i18n.js`, `src/menu.css`). Three difficulty levels (maze size, time and torch radius) chosen from a
  simulation (`tools/simulate-timing.mjs`). `src/script.js` has two small,
  test-checked edits (`rows`/`cols` and the timer made adjustable). See
  [`specs/design.md`](specs/design.md).
- Dependency-free dev tooling (`npm run dev`/`build`/`start`/`test`/`lint`/`check`).
