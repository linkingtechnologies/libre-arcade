# GNOME Velena Full Integration

## Scope

M21 integrates the four source-derived GNOME Gnect/Velena layers already tested independently in M15–M19:

1. historical opening replies and immediate tactics;
2. all nine strategic rule families with bounded compatibility search;
3. proof-number attack plus opponent-response screening;
4. seeded group/threat tactical lookahead.

At effort 1/2/3, rule budgets are 250/1,000/5,000 nodes; PN budgets are 250/1,000/2,800; tactical depths are 2/3/4; defensive validation budgets are 100/250/500.

## Integration policy

The historical hybrid cascade remains the safe default. A move selected by the nine-rule compatibility model overrides it only when that model covers every current opposing winning group and a separate bounded opponent PN search does not prove an immediate counter-attack. Decisions expose both component choices and the validation result for Arena inspection.

## Historical boundary

“Full Integration” means that all recovered browser components are composed in one player. It does not mean a bit-identical build of standalone Velena, mathematical perfect play, or inclusion of the absent binary opening book. The separately licensed standalone Velena archive remains excluded; the source basis is GNOME Games 2.8.3's GPL-authorized adaptation.

## Verification

The component-native C parity suites remain active. M21 adds opening, immediate-win, forced-block, seeded replay, legality and invalid-profile tests, plus a position that exercises all four layers and accepts a rule result only after PN validation disproves the opponent attack.
