# Gameplay parity status

## Source-faithful behaviour

- 11 structural templates and no-immediate-repeat selection rule
- generation traversal and structural-code resolution
- difficulty-dependent component probabilities and cached facade variants
- left/right drainpipe dependencies (`Ltr`, `Rtr`)
- centered board-size crop performed after full 8×8 generation
- preview → reconstruction flow
- finite remaining-piece palette inventory
- four component categories
- move/remove/drop-outside semantics
- Mist availability D0–D2
- D4 wrong-piece delay and full clear
- exact matrix win condition and best-time semantics

## Modern standalone adaptation

- standalone menu and options layout
- bilingual EN/IT labels
- pointer/touch support
- seedable RNG internally for deterministic tests (normal play auto-seeds)
- Web Audio click/error/win tones rather than recovered suite audio

No historical feature is intentionally replaced by a different gameplay rule.
