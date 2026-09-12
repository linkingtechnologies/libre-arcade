# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, scoring, AI, timing (match-3 board, turn economy, `original-ai.js` heuristic) | [For Science!](https://www.usebox.net/jjm/for-science/) by Juan J. Martínez (reidrac), [PyWeek 16](https://pyweek.org/e/useboxnet3/) entry | Post-compo release **1.0.1** (22 Apr 2013) as primary baseline; PyWeek final release 2 (20 Apr 2013) as historical comparison — both archived byte-for-byte with SHA-256 manifests in `reference/` | GPL-3.0-or-later (see `specs/legal-audit.md`) | Preserved unmodified in `reference/postcompo-1.0.1/` and `reference/pyweek-final2/`; ported function-by-function to JavaScript in `public/src/core/`, `public/src/ai/`, and `public/src/render/` — see `specs/version-diff.md` and `specs/parity.md` |
| Original game assets (sprites, sounds, fonts, background) | same source | same releases | GPL-3.0-or-later, except four explicitly excepted assets (below) | Copied byte-identical into `public/assets/original/`, verified by `test/asset-integrity.test.js` against `reference/postcompo-1.0.1/game/data/` |
| NASA Blue Marble background (`background.png`) | NASA/GSFC, Reto Stöckli | Blue Marble 2007 East | CC BY 2.0 | Preserved unmodified |
| Russo One font (`RussoOne-Regular.ttf`) | Jovanny Lemonad | — | SIL OFL 1.1 | Preserved unmodified |
| Droid Sans Mono font (`DroidSansMono.ttf`) | Android Open Source Project | — | Apache License 2.0 | Preserved unmodified |
| Cow sound (`cow.wav`) | BuffBill84 (SoundBible) | — | CC BY 3.0 | Preserved unmodified |
| Web UI, canvas rendering, i18n shell, production hardening | this repository | — | GPL-3.0-or-later | New code; no original counterpart (the original ran on Cocos2d/Pyglet with a native window, not a browser) |

Full legal reasoning — including the upstream `setup.py` GPL/MIT metadata
inconsistency (treated as an upstream mistake, not a separate MIT grant) and
the exact asset exceptions — is in [`specs/legal-audit.md`](specs/legal-audit.md).
Exact archive hashes and upstream URLs are in
[`reference/SOURCES.md`](reference/SOURCES.md). The frozen upstream trees in
`reference/` retain their original GPL-3.0-or-later license and copyright
notices unmodified; see [`LICENSE`](LICENSE) and
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## What was not ported, and why

- **Cocos2d/Pyglet rendering, window management, and OS-level audio drivers**
  (`reference/*/cocos/`, `reference/*/pyglet/`) — a native-window Python
  game framework, replaced by HTML5 Canvas 2D and Web Audio, which have no
  original counterpart to be faithful to. Preserved unmodified in
  `reference/` for archaeology; not a dependency of the browser port.
- **Desktop-only concerns** (window resizing via a native toolkit, OS audio
  mixer selection) — meaningless inside a browser tab; replaced with the
  browser's own equivalents (responsive canvas scaling, Web Audio) without
  changing observable gameplay.

None of this is "a faithful port, improved" — it is scope a browser
environment cannot meaningfully carry over. The turn-based board rules,
scoring quirks, AI decision logic, and timing are preserved exactly,
including the quirks listed in `AGENTS.md`.
