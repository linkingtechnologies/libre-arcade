# Archaeology and preservation model

Mechanical Night Pinball is a behavioural preservation project, not a redistribution of the historical visual/audio assets.

## Reference lineage

1. Historical Flash **Pinup Pinball** — proprietary/unknown-rights behavioural ancestor.
2. **DocDonkeys/Pinup-Pinball 1.0 (2018)** — MIT-licensed C++/SDL/Box2D reimplementation and the principal table/rules parity target.
3. **Mechanical Night Pinball** — clean-room web restoration with newly authored artwork/audio.

The audit found strong evidence that several DocDonkeys graphics/audio assets derive from the older Flash game. They are therefore not treated as freely relicensable merely because they appear inside an MIT repository. Public builds use wholly new SVG artwork and procedural audio.

Exact hashes and source-snapshot verification are recorded in `../reference/`. Historical binaries are retained only in the private/local research archive and are deliberately absent from the public source repository.

## Physics policy

The 2018 table geometry, rules and physical parameters are the base parity target. The normal player profile explicitly restores the older Flash one-shot flipper press snap for play feel; `?flipper=docdonkeys` disables that restoration for strict 2018 comparison.
