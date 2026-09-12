# Changelog

## 1.0.0 — 2026-09-06

- Vendored [Hextris](https://github.com/Hextris/hextris) into `public/`,
  restored and cleaned for safe standalone embedding — see
  [`specs/design.md`](specs/design.md) for the full list of what changed
  from upstream and why, and [`public/CREDITS.md`](public/CREDITS.md) for
  authorship and third-party libraries/fonts.
- Added dependency-free dev tooling (`npm run dev`/`build`/`start`/`test`/`lint`/`check`)
  so the game runs on any static web server with no framework or hosting
  platform required.
