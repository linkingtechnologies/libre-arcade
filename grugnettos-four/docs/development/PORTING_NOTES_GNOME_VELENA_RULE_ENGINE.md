# GNOME Velena strategic rule engine

## Source

M19 derives from `evaluate.c`, `rules.h`, `adjmtrx.c` and `pbsolver.c` in the preserved GNOME Games 2.8.3 Gnect/Velena source. Its headers explicitly place the modified Gnect version under the GNU GPL with Giuliano Bertoletti's approval. The headers give no GPL version number, so any version may be chosen (GPLv2 section 9); the adapter is distributed under GPLv3.

## Implemented rule families

The browser engine generates solution records for all identifiers exposed by historical `rules.h`:

1. Claimeven
2. Baseinverse
3. Vertical
4. Aftereven
5. Lowinverse
6. Highinverse
7. Baseclaim
8. Before
9. Specialbefore

Every solution records its involved squares and the opponent winning groups it covers. A bounded, most-constrained-first backtracking solver then searches for a mutually compatible set covering all remaining groups. Available budgets are 250, 1,000 and 5,000 nodes.

## Verification

An independent C oracle regenerates the 69 winning groups and the deterministic Claimeven, Baseinverse and Vertical instances. JavaScript matches their counts on five positions. Tests also cover all nine exported rule identities, deterministic decisions, immediate tactics, legal output, budget validation and the 19-player Arena.

## Compatibility boundary

This is a source-derived browser adaptation, not a bit-identical transcription of every internal side effect in the 1,341-line C evaluator. The C engine uses a detailed pairwise adjacency matrix and specialized recursive generators for compound Before instances; the browser represents those through explicit involved-square compatibility and a bounded set-cover search. The historical binary opening book remains absent.

Consequently the player is named **Rule Engine**, not “complete Velena”, “perfect” or “unbeatable”. A reported `rule-proof` means the bounded browser compatibility model covered all current threat groups; it is not a mathematical perfect-play certificate for Connect Four.
