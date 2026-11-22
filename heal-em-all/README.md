# Heal'em All

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/heal-em-all/public/index.html)**

A platformer where you do not kill zombies, you cure them. Find the key and the healing gun, turn zombies back into humans, protect them, and get out through the door. If you lose your lives you turn into a zombie yourself. Six levels. English, and Italian when the browser is in Italian.

*Restored.* Made for GitHub Game Off 2013 by Krzysztof Urbas (code, story) and Paweł Madeja (graphics), from
[krzysu/game-off-2013](https://github.com/krzysu/game-off-2013) at commit `66950cd`. The original code, levels and
Quintus engine run as the authors wrote them; this folder changes three lines of `game.js` and adds a small shim
(local fonts, no analytics, Italian, resize and touch refit). **The sounds are new:** the 2013 ones could not be traced to an author or licence,
so seven replacements (four CC0 from Kenney, three synthesised here) are used. [STORY.md](STORY.md) tells the story.

Code GPL-3.0, graphics CC BY 4.0, Quintus MIT, fonts SIL OFL 1.1, Kenney sounds CC0. See
[`public/CREDITS.md`](public/CREDITS.md), [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), [`PROVENANCE.md`](PROVENANCE.md).

| Folder | Contents |
|---|---|
| `public/` | The game (open `public/index.html`; `npm run dev` serves it). |
| `specs/design.md` | Every change from upstream and why. |
| `reference/` | Frozen upstream snapshot and history. The original audio and the archives that contain it are **not committed** (`.gitignore`), only their hashes. |
| `replacement-audio/` | The seven new sounds, their provenance, and `audition.html` to listen to them. |
| `evidence/`, `tools/` | Baseline of the original, parity probes and browser checks, manifests. |
| `*.md` (root) | The M1 archaeological report and its companions (licence audit, asset inventory, architecture, gameplay spec, parity plan, roadmap). |

```powershell
npm install ; npm run check          # lint + static tests
npm run dev                          # http://localhost:8080
```

Browser checks need a `playwright-core` install kept outside the repo: `PLAYWRIGHT_CORE=<path> node tools/browser-gate.mjs`,
`tools/m3-gate.mjs`, `tools/m4-check.mjs` (start `node tools/serve-baseline.mjs 8765` for the original and `node scripts/serve.mjs public 8768` for this page).
