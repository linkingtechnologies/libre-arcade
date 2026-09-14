# Nova Pinball — upstream history

This document records the historical baseline used by the web restoration. It is intentionally separate from the restoration changelog.

## Identity

- Project: **Nova Pinball**
- Original author: Wesley "keyboard monkey" Werner
- Later LÖVE 11.2 compatibility credit: **Eric Ahnell** (2019 project-page credit)
- Upstream repository: `https://github.com/wesleywerner/nova-pinball`
- Implementation: Lua + LÖVE
- Historical code license: GNU GPL version 3 or later, as stated by the upstream README/source headers
- Restoration baseline: **v0.2.3**
- Earlier comparison baseline: **v0.2.2.2**

## Timeline

| Date | Upstream milestone |
|---|---|
| 2015-10-23 | First known upstream commit (`be9d88461bce1f4c4e3599159c4b4af5a7e6beda`). |
| 2015-11-04 | v0.1 — first playable release. |
| 2015-11-06 | v0.1.1 — layout/bounce refinements and additional flipper/bumper work. |
| 2015-11-11 | v0.2 — ramps, Safe Mode/wormhole refinements, table/canvas changes and frame limiting. |
| 2015-11-12 | v0.2.1 — Safe Mode ball-launch fix. |
| 2015-11-18 | v0.2.2.1 — faster flippers, scoring/layout refinements, tracker soundtrack and music controls. |
| 2015-12-10 | v0.2.2.2 — reverb and Windows compatibility build. This is the last major 2015 gameplay-era release preserved here. |
| 2015-12-23 | v0.2.3-alpha — Android/touch experiment. |
| 2017-12-22 | v0.2.3 — official release updated for LÖVE 0.10.1. This is the restoration baseline. |
| 2019–2021 | Compatibility maintenance for newer LÖVE versions, including LÖVE 11.2 and fullscreen-menu fixes; no comparable new gameplay phase was found. |
| 2021-02-12 | Latest known upstream commit at audit time (`9f505007a60e2459ca801a06ed4e68af3b268e0c`). |

The substantive game design was therefore already largely established in late 2015. The 2017 and later work is best treated as compatibility/maintenance rather than a new gameplay generation.

## Engine repository lineage

The v0.2.3 README identifies `https://github.com/wesleywerner/nova-pinball-engine` as the engine repository and says the engine is available under the same license. The later maintained project page points instead to `https://github.com/wrldwzrd89/nova-pinball-engine`, consistent with the later LÖVE 11.2 maintenance period credited to Eric Ahnell.

An independent Software Heritage origin record for the later engine repository is preserved at:

`https://archive.softwareheritage.org/browse/origin/directory/?origin_url=https://github.com/wrldwzrd89/nova-pinball-engine`

This lineage is contextual history; the restoration's v0.2.3 mechanical baseline remains tied to the engine submodule commit recorded below. Full historical third-party credits are in `UPSTREAM_CREDITS.md`.

## v0.2.3 source anchors

- v0.2.3 tag commit: `ce25d474ed89b4e5f584de44c08228f1556539a1`
- v0.2.3 annotated tag object: `5e7ebf12e073082a32b82e56100bb296918fbd76`
- Nova Pinball Engine submodule used by the baseline: `b8f7c1ef2e77006b547e6178cded09eb73c6c541`
- Requested LÖVE runtime in `conf.lua`: `0.10.1`
- Historical logical window: `800 × 600`

## Original release preservation

The public repository does **not** embed the original release archives because those packages contain media with redistribution terms that are not sufficiently documented for this modified web release. Exact filenames, sizes, hashes and official download locations are recorded in `../reference/MANIFEST.md` so a researcher can independently reacquire and verify the same artifacts.
