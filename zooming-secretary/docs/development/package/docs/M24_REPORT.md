# M24 — Final release audit

Version: **1.0.0-rc.1**  
Date: **2026-10-12**

## Verdict

**TECHNICAL GATE: GREEN**  
**MANUAL VISUAL SMOKE: YELLOW / EXTERNAL**  
**PUBLIC RELEASE GATE: YELLOW**

The complete deterministic campaign is implemented from Day 1 through the Dream, Day 7 and the
new clean-room ending. M24 adds no new gameplay rules. It audits and hardens the release package.

The public-release gate is deliberately not promoted to GREEN by this milestone. M13 already
identified two final-release questions that code/tests cannot answer by themselves:

1. redistribution of the **exact semantic topology** reconstructed from the historical oracle;
2. final **naming/title** review for public release under the archival name *Zooming Secretary*.

A current public-web check on 2026-10-12 shows that the same title remains in active use by modern
ports and catalog/archive pages. This supports the archival identification, but it is **not** a
trademark clearance or permission grant. Examples include the existing Mega Drive port page and
RGCD's historical 2011 coverage.

## M24 changes

- release metadata moved from milestone version `0.23.0` to `1.0.0-rc.1`;
- obsolete standalone `demo.mjs` and `m10-demo.mjs` harnesses removed from the release root;
- old milestone version tests made forward-compatible with semantic version 1.x;
- full campaign success path tested through `Ending`;
- Dream Ghost-catch branch tested through Day 5–7 and `Ending` with miss allowance 3;
- Dream success branch tested through Day 5–7 and `Ending` with miss allowance 5;
- short mobile-landscape bug fixed: touch controls no longer disappear;
- overlay cards now use bounded height and internal scrolling on very small screens;
- overlay status is announced with `aria-live="polite"`;
- final distribution/media/network-dependency checks added.

## Gameplay/campaign audit

M24 drives all eight playable stages through their real `Simulation` completion path. It then
uses the campaign state machine to verify both complete campaign outcomes:

- Dream answered → miss allowance **5** → Day 5 → Day 6 → Day 7 → Ending;
- Ghost catches player → miss allowance **3** → Day 5 → Day 6 → Day 7 → Ending.

Restart from the ending resets the next campaign to the base allowance of **3**.

## Responsive audit

M23 had a real touch usability defect in short landscape orientation: the generic landscape rule
hid `.controls`, which also removed the only touch direction pad. M24 adds a coarse-pointer
landscape override that keeps a compact 3×2 directional pad visible. The overlay card is also
bounded to the canvas and can scroll internally, avoiding instruction/ending overflow.

Target manual smoke sizes are listed in `M24_RELEASE_CHECKLIST.md`.

## Browser environment

The local Python HTTP server is reachable in the container. Chromium itself still hangs before DOM
output because the runtime has no working DBus/UPower service. This is an environment limitation,
not counted as a browser pass. Therefore manual browser visual smoke remains explicitly required.


## Final automated results

- Full regression M9→M24: **251/251 PASS**.
- New M24 final-audit tests: **20/20 PASS**.
- JavaScript/module syntax checks: **45/45 PASS**.
- Local HTTP smoke: **200 OK**.
- Forbidden historical/binary media scan: **0 files**.

## Licensing/media boundary

No original ROM, CHR, nametable byte streams, graphics, music, manual, labels, fact-message text,
or historical C/assembly source are part of the release package. Runtime visuals and audio are new
programmatic GPL-3.0-or-later work. No AI-generated assets are used.

The exact semantic topology remains provenance-explicit and is the reason the **public-release
rights gate remains YELLOW** pending the M13 final review decision.
