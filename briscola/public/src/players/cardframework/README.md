# CardFramework.Maui Cpu0 / Cpu1 / Cpu2

Faithful JavaScript archaeology port of the three Briscola CPU helpers bundled in
**CardFramework.Maui 1.6.20** by Giulio Sorrentino / `GiulianoSpaghetti`.

Upstream project: `https://github.com/GiulianoSpaghetti/CardFramework.maui`
NuGet package: `CardFramework.Maui 1.6.20`
License: **GPL-3.0** (confirmed both by the package `LICENSE.txt` and repository).

## Recovered behavior

The port was reconstructed from the user-supplied `.nupkg`, its inline XML API
documentation, and direct IL decompilation of `CardFramework.Maui.dll`.

All three helpers inherit the same first-hand policy. In Briscola mode
(`stessoSeme=false`, the upstream default), the leader prefers in order:

1. the first sorted non-trump worth 2–4 points;
2. the first zero-point card;
3. the first trump;
4. slot 0 as final fallback.

Reply behavior differs:

- **Cpu0**: searches a trump using the original `i < numeroCarte - 1` loop;
  otherwise plays slot 0.
- **Cpu1**: if the lead is not trump, tries the highest same-suit card whose
  *point value* is greater than the lead; failing that, searches a trump using
  the same truncated scan; otherwise slot 0.
- **Cpu2**: adds probabilistic concealment decisions. It first tries the highest
  same-suit higher-point card. Against a valuable non-trump lead it may spend a
  trump (always against >4-point leads, otherwise 50% when its trump has points).
  Against a trump lead it has a 50% chance to try the smallest higher-point
  same-suit card.

## Faithfulness notes

Decision-relevant upstream quirks are retained instead of silently corrected.
The original `CartaHelper.CompareTo`, insertion/bubble ordering, point-based
`soprataglio`, truncated Cpu0/Cpu1 trump scan, and random draw structure are all
represented in the port. For deterministic Arena runs, .NET's process-global
`System.Random` is replaced with BriscoLab's seeded RNG while preserving the
original probabilities and number of decision-relevant draws.

The exact NuGet package used for archaeology is preserved under
`reference/cardframework/` with SHA-256 hashes in its README.
