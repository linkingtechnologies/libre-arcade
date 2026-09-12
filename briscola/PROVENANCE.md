# Provenance

BriscoLab is a composite software restoration, not a clean-room set of AI
opponents. This table gives the source, the most precise revision identifier
available, the license, and the treatment for every integrated player family
at a glance. Full detail, including copyright holders and exact upstream
URLs, lives in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md); untouched
snapshots and reconstruction notes live under [`reference/`](reference/README.md).

Several of these sources predate widely-used version control or were
recovered as a compiled package, a ZIP export, or a published paper rather
than a git history — "Exact revision" records the most precise identifier
that actually exists for that source, and says so plainly when none does.
A bounded search result of `unknown` (see the Arena) is never described as
impossible; likewise, an unpinned revision here is never presented as pinned.

| Player(s) | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| QBriscola | QBriscola, SourceForge (C++ / Qt) | v1.1 | GPL-2.0-or-later | Reconstructed JS port from the upstream C++ decision logic; the C++ source itself was not available to embed, so it is not reconstructed as a fake snapshot in `reference/` |
| Cuperativa | `aaaasmile/CuperativaSoloRuby` (Ruby) | unpinned (no commit recorded) | MIT | Ruby source preserved verbatim in `reference/cuperativa/`; ported to JS |
| smBrisCola Empirico1 / Empirico2 | smBriscola, SourceForge (Python) | revision `2005-09-27` | GPL-2.0-or-later | Python source preserved verbatim in `reference/smbriscola-empirico1/` and `.../empirico2/` (two independent BriscoLab identities from one upstream file); ported to JS |
| JBriscola | `GiulianoSpaghetti/JBriscola` (Java) | v0.3.1 | GPL-3.0 | Java source preserved in `reference/jbriscola/`; ported to JS |
| Pryscola | Pryscola, nongnu.org (Python) | revision `20070908` | GPL-3.0-or-later | Python source preserved in `reference/pryscola/`; ported to JS |
| BriscolaBot v3 | `LetteraUnica/BriscolaBot` (Python + ONNX) | unpinned (no commit recorded) | MIT | Original trained ONNX model bundled unmodified in `assets/models/briscolabot/`; BriscoLab vectorizer/adapter/runtime newly written |
| πG / πH / πC (Giacomelli) | `pgiacome/BriscolaPaperSourceCode`, 2026 paper (.NET/C#) | paper-derived, no bundled code snapshot | MIT (declared) | No verbatim `Program.cs` available; policies reconstructed from the paper's own operational definitions, recorded as reconstruction rather than an original snapshot |
| CardFramework Cpu0 / Cpu1 / Cpu2 | `GiulianoSpaghetti/CardFramework.maui` (C# / .NET MAUI) | NuGet package `CardFramework.Maui 1.6.20` | GPL-3.0 | Package + XML docs preserved in `reference/cardframework/`; JS reconstructed from package metadata, XML docs, and IL decompilation |
| PoIAna (23 agents) | `ivanrava/poiana` + `ivanrava/briscola-rl` (Godot + Python + ONNX) | unpinned GitHub ZIP snapshot (no commit recorded) | GPL-3.0 code / CC BY 4.0 assets (publisher-declared) | Original ONNX models bundled unmodified in `assets/models/poiana/`; deterministic policy tensors derived mechanically for the Arena |
| Briscola.js S0 / S1 | historical browser demo by Calogero Miraglia, 2015-era | deployed `app.bundle.js`, no source repository recovered | upstream license unverified; not redistributed | Behaviorally reconstructed in `src/players/briscolajs/` from the observed demo; original bundle not bundled here; BriscoLab's own code is `GPL-3.0-only` |
| Random | BriscoLab-native | — | GPL-3.0-only | Uniform-random baseline, no upstream source |
| Engine, adapters, web UI, Arena | this repository | — | GPL-3.0-only | New integration code: game engine, player adapters, browser UI, benchmark tooling |

The root `GPL-3.0-only` declaration covers BriscoLab's own engine, adapters,
UI, and Arena code. It does not replace the historical license of any file
preserved under `reference/`, nor the publisher-declared licenses of bundled
third-party model assets.
