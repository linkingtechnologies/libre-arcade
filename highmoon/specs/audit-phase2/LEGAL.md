# Legal audit — HighMoon 1.2.4

## Code
`COPYING` contains GNU GPL version 2. More importantly, the C++ source headers state that redistribution/modification is permitted under GPL version 2 **or, at the recipient's option, any later version**. The correct code classification is therefore **GPL-2.0-or-later**, compatible with GPLv3.

## Assets
The upstream package/site presents HighMoon as GPL software, but the archive has no separate asset manifest or individual source/author/license notices. That is not enough to resolve provenance where assets may have originated elsewhere.

The audio audit found material evidence of third-party lineage. `curve.wav`, `kling.wav`, `laser.wav`, `pluck.wav`, and `strom.wav` correspond very closely to samples of the same names in the OpenOffice/LibreOffice gallery (same frame counts; several are direct/near-direct bit-depth conversions). This supports preservation history but requires a historical license-chain check before reuse.

## Decision
**Code legal gate: PASS. Original asset reuse gate: HOLD.**
