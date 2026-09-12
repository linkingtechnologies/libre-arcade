# Legal and licensing audit

## Gate result

**PASS for an HTML5/JavaScript GPLv3 restoration, with explicit asset-attribution caveats documented separately.**

This is an archaeology/licensing assessment, not legal advice.

## Code

The original `COPYING.TXT` states that the program may be redistributed and/or modified under the GNU General Public License **version 3 or, at the recipient's option, any later version**.

Every one of the 45 Java source files in the uploaded historical archive was scanned and contains the GPL notice referring to version 3 or later.

Result: **clear permission to modify and redistribute a GPLv3-compatible JavaScript port.**

## Artwork/content

The same historical `COPYING.TXT` states that artwork, music and other non-software content in the repository is dual-licensed under **CC-BY-SA 3.0** and **GPL version 3 or later**, and points to `AUTHORS.TXT` for authorship details.

Independent historical context strengthens that statement:

- LPC 2012 rules required art-phase entries to be available under both CC-BY-SA 3.0 and GPL 3.0.
- The LPC art-submission index explicitly states that LPC art submissions are dual-licensed CC-BY-SA 3.0 and GPL 3.0.
- The consolidated LPC base-asset page lists CC-BY-SA 3.0 and GPL 3.0.
- Daniel Eddeland's 2012 farming/sand submission lists CC-BY-SA 3.0 and GPL 3.0.

Sources:

- https://lpc.opengameart.org/content/lpc-rules
- https://lpc.opengameart.org/lpc-art-entries
- https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
- https://opengameart.org/content/lpc-farming-tilesets-magic-animations-and-ui-elements

## Caveat: file-level provenance is not perfectly documented

Terramancers' `AUTHORS.TXT` is good but not exhaustive. In particular, `Baldric.png`, `sand.png`, and `greenTrees.png` are not independently listed by filename there.

This does **not** presently block the port because:

1. the historical archive itself carries an explicit repository-wide asset licensing statement;
2. Baldric is an identified 2012 LPC entry by Stephen Challener;
3. Daniel Eddeland's licensed LPC submission explicitly contains sand tilesets;
4. `greenTrees.png` visibly derives from Lanea Zimmerman tree components that are specifically credited in the archive;
5. the LPC contest's own licensing rule covers contest art submissions.

Nevertheless, the restoration does not erase these documentation gaps. See `ASSET_PROVENANCE.md` and `THIRD_PARTY_NOTICES.md`.

## Distribution policy for this restoration

- Port code: GPL-3.0-or-later.
- Historical reference material: retain original notices; do not rewrite history by replacing old license files.
- Artwork: retain individual attribution and the historical LPC licensing record.
- Generated tile atlases: treat as derivatives/caches of the original artwork; keep the same notices.

## Gate decision

The user's rule was not to begin a port unless modification and redistribution compatible with GPLv3 were clear. On the evidence above, that condition is met. The port may proceed while preserving the attribution caveats rather than pretending the historical metadata is flawless.
