<!--
SPDX-FileCopyrightText: 2026 Umberto Bresciani
SPDX-License-Identifier: GPL-3.0-or-later
-->

# Changelog

## Unreleased

- Removed the Next.js/vinext/Cloudflare Worker application shell, the vendored
  shadcn UI kit, and the OpenAI Sites hosting integration (`.openai/`,
  ChatGPT sign-in, D1/R2 bindings). None of it was reachable from the
  standalone game.
- The repository now ships only the framework-free static site in `public/`;
  `npm run build` packages it into `game/` and `npm run dev`/`npm start` serve
  it with a small dependency-free Node server. Any static web server works
  equally well — there is no platform lock-in left.

## 1.0.0 — 2026-08-30

- Restored the Klondike engine and historical card sprite from `rjanjic/js-solitaire`.
- Ported the `MinimalKlondike` solver architecture to browser-native JavaScript.
- Added runtime-only generation and cross-verification of solvable random deals; no prebuilt games are bundled.
- Added draw-one and draw-three modes, undo, hints, safe auto-completion, autosave and local statistics.
- Added responsive mouse, touch and keyboard controls with Italian and English interfaces.
- Added interchangeable historical, high-readability and CC0 SVG decks with preload verification.
- Added complete provenance, file-level licensing and trademark documentation.
