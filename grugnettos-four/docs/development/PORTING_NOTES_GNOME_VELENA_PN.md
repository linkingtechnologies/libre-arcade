# GNOME Velena proof-number port

## Source and licence

M17 derives its search controller from `her_pn_search` in GNOME Games 2.8.3 Gnect's modified Velena source, preserved at `reference/gnome-gnect-velena/src/heurist.c` (SHA-256 `ab4be9eafae9f09e0d44ae571237d87f7f31e6d586f8da66377bbd963933cbf9`). The retained headers say that this GNOME version was released under the GNU GPL with Giuliano Bertoletti's approval. The headers give no GPL version number, so any version may be chosen (GPLv2 section 9); the adapter is distributed under GPLv3.

## Preserved behaviour

- alternating OR and AND nodes;
- proof/disproof initialization and saturated `MAXVALUE = 200000000` arithmetic;
- selection of the most-proving node;
- center-first order `4, 3, 5, 6, 2, 1, 7`;
- historical 2,800-node setting, plus smaller visible budgets;
- immediate-win and forced-block guards used by Gnect before the PN phase.

## Deliberate boundary

This is a bounded browser adaptation of the proof-number controller, not the complete Velena solver. It does not port the original binary-tree transposition/symmetry store, opening database, or the complete nine-rule evaluation. Terminal Connect Four outcomes replace Velena's broader knowledge evaluator. Therefore the UI calls it **PN Search**, never “perfect” or “unbeatable”.

## Verification

`test/gnome-velena-pn-native-oracle.c` is an independent compact C model. Tests compare its selected move, root proof number, disproof number and node count with JavaScript on five positions. Separate vectors cover OR/AND aggregation, immediate wins, legal moves and invalid settings.
