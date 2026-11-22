# Changelog

## 1.0.0

- Kept the original Twine 1.4.2 story and engine byte for byte (`source/Trapped.original.html`, hash pinned); the playable English file differs only by two injected tags.
- Added a dark, readable page theme, keyboard play (1 to 9, arrows, Enter), focusable links, save and resume, and a page header with restart, language and credits.
- Added an Italian translation as a separate layer (`translations/it.json`), applied at build time.
- Headless tests run the real original engine in jsdom: passage graph, endings, antagonist, variables, Italian equivalence.
- Rights register and a build-time gate that refuses unresolved assets.
