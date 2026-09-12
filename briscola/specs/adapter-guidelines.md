# Adapter guidelines

Adapters isolate BriscoLab's public player contract from upstream algorithm data
models.

## Responsibilities

An adapter may:

- translate suits, ranks, IDs, and hand indexes;
- reconstruct legacy public-card collections;
- preserve legacy hand ordering;
- preserve decision-relevant public memory;
- initialize algorithm-specific random generators;
- translate a legacy card/index/action back to `PLAY_CARD`;
- attach non-semantic debug metadata.

An adapter must not:

- expose opponent cards or hidden stock order;
- alter the faithful algorithm to make translation easier;
- resolve tricks independently from the engine;
- accept an illegal legacy result silently;
- depend on DOM/UI state.

## Mapping rule

When upstream code selects by hand index, map the choice back to the canonical
card ID only after reproducing the upstream hand ordering exactly.

When upstream state mutates persistently (for example Pryscola's in-place hand
sort), the adapter must preserve that state across turns and clear it in
`reset()`.
