# Giacomelli policy-family provenance

Integrated BriscoLab identities:

- `πG Greedy`
- `πH Hoarder`
- `πC Counter`

Upstream project: **Briscola Paper (Source Code)**  
Author: Piero Giacomelli  
Repository: https://github.com/pgiacome/BriscolaPaperSourceCode  
Paper: *Beyond the Briscola Advantage: A Monte Carlo Dominance Test for Deterministic Strategies in Two-Player Briscola Game* (2026)  
Upstream runtime: .NET 8 / C#  
Declared upstream license: MIT.

The repository README identifies `Program.cs` as the deterministic round-robin simulator implementing Greedy, Hoarder and Counter and states that the repository is released under MIT.

## Preservation status

BriscoLab v1.4.0 does **not** fabricate an upstream `Program.cs` snapshot. The JavaScript port in `src/players/giacomelli/` was reconstructed from the paper's explicit operational definitions of πG, πH and πC and the repository metadata. If a verbatim upstream source snapshot is later supplied, it should be added here and used for an oracle-level equivalence check.
