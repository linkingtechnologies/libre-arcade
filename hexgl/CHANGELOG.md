# Changelog

## 1.0.0 — 2026-11-22

- Vendored [HexGL](https://github.com/BKcore/HexGL) into `public/` from the
  [HexGL-2026](https://github.com/flowerz88/HexGL-2026) fork (commit
  `9eb7647`), see [`PROVENANCE.md`](PROVENANCE.md).
- Connected the fork's gesture touch layer and audio unlock, which the fork
  shipped but never called (`launch.js`).
- Dropped Apache `.htaccess`, Firefox OS manifest, AppCache manifest, their
  icons and a saved editor page; added the shared analytics snippet and a
  favicon link.
- Added dependency-free dev tooling (`npm run dev`/`build`/`start`/`test`/
  `lint`/`check`) so the game runs on any static web server.
