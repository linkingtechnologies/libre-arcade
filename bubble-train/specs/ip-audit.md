# IP / genre audit

## Conclusion

Bubble Train is sufficiently mechanically distinct from Puzzle Bobble/Bust-A-Move to treat its code/behavior as an autonomous restoration target. The principal reuse risk is not the abstract match mechanic; it is unlicensed audiovisual content.

## Generic genre elements

These are common puzzle/action ideas and are not treated here as Bubble Train-specific branding:

- coloured projectiles/bubbles;
- matching three or more of a colour;
- aiming and firing;
- escalating level difficulty;
- time/ranking systems.

## Bubble Train-specific combination

The audited implementation centers on:

- bubble carriages moving along explicit tracks;
- the rear/last carriage as driving end;
- tracks built from line, arc and exponential-spiral primitives;
- insertion causing bidirectional ripple spacing;
- physically split chain segments;
- speed bubbles that can reverse the driving segment and push carriages back into the station;
- multiple independent trains/tracks in one level;
- an integrated XML level editor.

## Puzzle Bobble / Bust-A-Move comparison

Bubble Train does **not** implement the defining hanging ceiling-cluster layout of Puzzle Bobble. It has no support-drop/gravity rule and, critically, the audited projectile has **no side-wall bounce**. Do not add Taito names, characters, logos, bubble art, music or layout motifs.

## Worms Blast comparison

The historical OS4 description calls Bubble Train a Worms Blast/Puzzle Bubble relative, but the audited source contains no Worms characters/branding and does not reproduce Worms Blast's character/weapon presentation. Avoid Team17 assets and branding.

## Puzz Loop / Zuma family

Mechanically the moving chain-on-a-path concept is closer to the Puzz Loop/Zuma lineage than to Puzzle Bobble. That similarity argues for extra care in visual identity: use a clean Bubble Train-specific presentation, not imitation Zuma frogs, temples, fonts, sound language or branded visual composition.

## Name / branding

`Bubble Train` is the historical project name. No Taito-branded name was found in the supplied source/data. Before a public remaster release, a separate contemporary trademark/name availability check is advisable; this audit does not assert current trademark clearance.

## Clean-room audiovisual rule

The faithful port may reproduce verified mechanics, numeric behavior and clean-room data formats, but its public visual/audio identity should be rebuilt from cleared assets.

## Decision

**GO WITH CLEAN ASSETS**, subject to the code exception for `List.h` and the strict quarantine of original level layouts/data until their license scope is clarified.
