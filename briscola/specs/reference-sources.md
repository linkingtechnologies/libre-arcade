# Reference source policy

`reference/` preserves the evidence used to create faithful ports.

## Layout

There is one top-level reference folder per integrated player identity that originates from an external project. BriscoLab-native control/baseline players do not require a reference folder. Two imported players may therefore contain duplicated upstream source when they originate from different algorithms in the same historical file (for example smBrisCola Empirico1 and Empirico2).

## Preservation

- Keep upstream files verbatim whenever available.
- Preserve upstream license/copyright headers.
- Store BriscoLab provenance notes in separate Markdown files.
- Do not fabricate unavailable upstream files.
- Do not present reconstructed code as an original snapshot.
- Compatibility changes required for an oracle harness must be kept separate or
  precisely documented.

The root BriscoLab license applies to BriscoLab project code. Reference files
retain their own upstream licenses.


## PoIAna family note

A model family may have many BriscoLab player identities while sharing one top-level
reference folder. `reference/poiana/` therefore supports 23 independent PoIAna model
players. It preserves the inference/vectorization sources from the game repository and
the observation/export sources from the training repository; runtime ONNX binaries live
under `assets/models/poiana/`.


## Giacomelli policy family note

`reference/giacomelli/` currently contains provenance rather than a fabricated upstream snapshot.
The published paper fully specifies πG/πH/πC operationally, so BriscoLab can preserve the algorithms
while still distinguishing reconstructed code from verbatim historical source.

## CardFramework.Maui family note

`reference/cardframework/` preserves the exact `CardFramework.Maui 1.6.20`
NuGet package supplied for the archaeology pass plus its XML API documentation.
The three BriscoLab identities `cardframework-cpu0`, `cardframework-cpu1`, and
`cardframework-cpu2` share that evidence folder because they are implemented by
three helper classes in the same upstream assembly. The JavaScript port was
reconstructed from the package metadata, XML documentation, and decision-level
IL; it is not presented as a verbatim C# source snapshot.


## Briscola.js historical demo

- Author: Calogero Miraglia (`calogxro` / historical `calog3r0` handle).
- Historical project: `briscola.js`, 2015-era JavaScript/React browser game.
- Recovered artifact: deployed `app.bundle.js` from the public demo.
- Recovered algorithms: S0 heuristic, S1 heuristic→alpha-beta switch,
  `alpha_beta_search`, and an unused `minimax_decision` module.
- Single-player wiring: human `MAX` vs AI `MIN` using strategy `S1`.
- Licensing: no explicit license found for the author's own code in the
  recovered repository/package; original bundle is not redistributed.
- BriscoLab integration: fresh behavioral reconstruction in
  `src/players/briscolajs/`.
