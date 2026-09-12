# Third-party notices

BriscoLab is distributed under **GNU GPL version 3 only** (`GPL-3.0-only`).
Some faithful AI ports are derived from third-party projects whose original
copyright notices and licenses are preserved below and in `THIRD_PARTY/` and
`reference/`.

The original upstream snapshots under `reference/` remain under their original
licenses. They are included for provenance, reproducibility, and source-to-port
comparison; the root BriscoLab license does not replace those historical
license grants.

## QBriscola

- Integrated player: `QBriscola`
- Upstream project: QBriscola 1.1
- Upstream authors: Betti Sorbelli Francesco and Ciotti Roberto
- Upstream license: GNU GPL version 2 or later (`GPL-2.0-or-later`)
- Source: https://sourceforge.net/p/qbriscola/code/HEAD/tree/trunk/src/
- Full upstream license text: `THIRD_PARTY/QBriscola-GPL-2.0-or-later.txt`
- Provenance notes: `reference/qbriscola/`

The JavaScript port is distributed as part of BriscoLab under
`GPL-3.0-only`, using the "or later" permission of the upstream license.

## Cuperativa / CuperativaSoloRuby

- Integrated player: `Cuperativa`
- Upstream project: CuperativaSoloRuby
- Upstream copyright: Copyright (c) 2018-2019 Invido.it
- Upstream license: MIT
- Source: https://github.com/aaaasmile/CuperativaSoloRuby
- Full upstream license text: `THIRD_PARTY/Cuperativa-MIT.LICENSE`
- Reference files: `reference/cuperativa/`

The MIT copyright and permission notice are retained with this distribution.
The JavaScript adaptation is distributed as part of BriscoLab under
`GPL-3.0-only`.

## smBrisCola — Empirico1 and Empirico2

- Integrated players: `smBrisCola Empirico1`, `smBrisCola Empirico2`
- Upstream project: smBrisCola 2005-09-27
- Upstream copyright: Copyright (C) 2005 Massimo Masson
- Empirico2 is identified in the upstream source as contributed by Licia Salce
- Upstream license: GNU GPL version 2 or later (`GPL-2.0-or-later`)
- Source: http://smbriscola.sourceforge.net/
- Full upstream license text: `THIRD_PARTY/smBrisCola-GPL-2.0-or-later.txt`
- Reference files: `reference/smbriscola-empirico1/` and `reference/smbriscola-empirico2/`

The JavaScript ports are distributed as part of BriscoLab under
`GPL-3.0-only`, using the "or later" permission of the upstream license.

## JBriscola

- Integrated player: `JBriscola`
- Upstream project: JBriscola 0.3.1
- Upstream repository: https://github.com/GiulianoSpaghetti/JBriscola
- Upstream license: GNU GPL version 3 (`GPL-3.0`)
- Full upstream license text: `THIRD_PARTY/JBriscola-GPL-3.0.txt`
- Reference files: `reference/jbriscola/`

No additional copyright statement was present in the Java files copied into the
reference snapshot. The JavaScript port is distributed under `GPL-3.0-only`.

## Pryscola

- Integrated player: `Pryscola`
- Upstream project: Pryscola, revision `20070908`
- Upstream copyright holders:
  - Copyright (C) 2007 Emanuele Rocca <ema@linux.it>
  - Copyright (C) 2007 Davide Pellerano <cycl0psg@gmail.com>
  - Copyright (C) 2007 Alessandro Arcidiacono <spidermacg@gmail.com>
- Upstream license: GNU GPL version 3 or later (`GPL-3.0-or-later`)
- Project site: https://www.nongnu.org/pryscola/
- Full upstream license text: `THIRD_PARTY/Pryscola-GPL-3.0-or-later.txt`
- Reference files: `reference/pryscola/`

The JavaScript port is distributed as part of BriscoLab under
`GPL-3.0-only`, which is permitted by the upstream "version 3 or later" grant.


## BriscolaBot

- Integrated player: `BriscolaBot v3`
- Upstream project: BriscolaBot
- Upstream author: Lorenzo Cavuoti
- Upstream repository: https://github.com/LetteraUnica/BriscolaBot
- Upstream license: MIT
- Model: `pretrained_models/briscola-bot-v3.onnx`
- Reference/provenance notes: `reference/briscolabot/`

The original trained ONNX model is bundled unmodified at
`assets/models/briscolabot/briscola-bot-v3.onnx`. Its upstream MIT license and
provenance are retained. The BriscoLab vectorizer/adapter/runtime code is
distributed under `GPL-3.0-only`.

ONNX Runtime Web is a Microsoft open-source runtime distributed under the MIT
license. It is also loaded lazily from jsDelivr rather than vendored in this
archive.

## Giacomelli πG / πH / πC

- Integrated players: `πG Greedy`, `πH Hoarder`, `πC Counter`
- Upstream author: Piero Giacomelli
- Upstream repository: https://github.com/pgiacome/BriscolaPaperSourceCode
- Upstream runtime: .NET 8 / C#
- Upstream declared license: MIT
- Provenance notes: `reference/giacomelli/`
- Notice: `THIRD_PARTY/Giacomelli.NOTICE`

The 2026 paper publishes exact deterministic operational definitions for all three
policies. BriscoLab ports those rules to JavaScript. No verbatim upstream `Program.cs`
is bundled in v1.4.0, so the project records this as a reconstruction from the
published specification rather than presenting reconstructed code as an original snapshot.

## CardFramework.Maui Cpu0 / Cpu1 / Cpu2

- Integrated players: `CardFramework Cpu0`, `CardFramework Cpu1`, `CardFramework Cpu2`
- Upstream author/copyright: Giulio Sorrentino, 2024-2026
- Upstream repository: https://github.com/GiulianoSpaghetti/CardFramework.maui
- NuGet package used for archaeology: `CardFramework.Maui 1.6.20`
- Upstream language/runtime: C# / .NET MAUI
- Upstream license: GNU GPL version 3 (`GPL-3.0`)
- Full license text: `THIRD_PARTY/CardFramework-GPL-3.0.txt`
- Preserved package + XML API documentation: `reference/cardframework/`

BriscoLab's JavaScript port was reconstructed from the user-supplied NuGet
package, the bundled XML inline documentation, and direct IL decompilation of
`CardFramework.Maui.dll`. Decision-relevant quirks are retained. The original
process-global `System.Random` is replaced only at the adapter boundary by a
seeded deterministic RNG for reproducible Arena runs; the documented 50% Cpu2
branches are preserved.

## Artwork and other assets

Regional card artwork is not bundled in this release. Any future card images,
audio, fonts, or other non-code assets must carry their own explicit provenance
and license information before being added to the distribution.

## PoIAna / briscola-rl

- Integrated players: **23 PoIAna pretrained agents**, one player identity per model
- Upstream author: Ivan Ravasi; the PoIAna UI credits Davide Zambelli for DRL model training
- Game repository: https://github.com/ivanrava/poiana
- Training repository: https://github.com/ivanrava/briscola-rl
- Publisher page: https://ivanrava.itch.io/poiana
- Publisher-declared code license: GNU GPL version 3
- Publisher-declared asset license: Creative Commons Attribution 4.0 International
- Provenance notice: `THIRD_PARTY/PoIAna.NOTICE`
- Reference files: `reference/poiana/`

The 23 original ONNX binaries supplied in the upstream PoIAna repository are
bundled unmodified under `assets/models/poiana/`. BriscoLab also contains
`*-policy.bin` files derived mechanically from those graphs for deterministic
Arena execution. The supplied GitHub ZIP snapshots did not include a standalone
root `LICENSE` file, so this distribution preserves the publisher's explicit
project-level code/asset license declarations rather than assigning a narrower
license to individual model binaries without evidence.


## Briscola.js historical demo (Calogero Miraglia)

BriscoLab v1.7.0 documents and behaviorally reconstructs the S0/S1 algorithms
observed in the historical public browser demo bundle. The recovered upstream
repository/package did not contain an explicit license for the author's own
code. Consequently the upstream bundle/source is **not redistributed** in this
project. The BriscoLab implementation under `src/players/briscolajs/` is newly
written and licensed GPL-3.0-only. Upstream licensing status remains
**UNVERIFIED**.
