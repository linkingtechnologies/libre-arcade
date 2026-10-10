# Third-party notices

## Childsplay / Schoolsplay Fourrow

`fourrow.py` is copyright © 2011 Stas Zytkiewicz and declares GNU GPL version 3. The ConnectLab JavaScript port preserves its six-level policy and historical quirks. The module itself is not preserved under `reference/`: only a source record (`reference/childsplay-3.3/fourrow/SOURCE.md`, with the 2018 archive checksum and a historical mirror link) is kept, so whether its header also grants "any later version" was not re-checked here and is not claimed.

## Al Sweigart Four-In-A-Row

The Childsplay module identifies Al Sweigart's Four-In-A-Row example as its source. That upstream source carries a Simplified BSD notice. Attribution and the applicable BSD terms must accompany redistribution.

No original image, font or audio asset is included. Interface graphics and sounds are generated with CSS and Web Audio.

## Marco Melilli — four-in-a-row-js-minimax

Copyright © 2017 Marco Melilli. The original JavaScript project is licensed under the MIT License. Its complete unmodified source snapshot and license are preserved under `reference/marco-melilli-minimax/original/`. The ConnectLab adapter retains the original scoring, search order, depth range and tie-breaking behaviour.

## Stratzilla Connect Four

The C++ project at `stratzilla/connect-four` is distributed under GNU GPL version 3: the repository carries the GPLv3 text in `LICENSE` but no per-file notice and no "or later" grant, so it is treated as GPL-3.0-only. The preserved snapshot is commit `fc1c912a369f3550e485d80c953e806009533941`. Its JavaScript port retains the original board orientation, alpha-beta traversal, asymmetric heuristic weights, terminal conditions and left-to-right tie-breaking.

## PetterS Monte Carlo Tree Search

Copyright © 2015 Petter Strandmark. The project at `PetterS/monte-carlo-tree-search` is distributed under the MIT License. The preserved snapshot is commit `52a6208afc4e697bb4e44c12b98cf022a5500516`. Its JavaScript adapter retains the UCT selection equation, random expansion and rollout policy, backpropagation convention, root-tree aggregation and Beta(1,1) prior used to choose the final move. The complete upstream MIT license remains in `reference/petters-mcts/original/LICENSE.txt`.

## Pascal Pons Connect4 Solver

Copyright © 2017–2019 Pascal Pons. `PascalPons/connect4` and the derived `public/src/players/pascal-pons-bitboard.js` module are licensed under GNU Affero General Public License version 3 or later. The preserved snapshot is commit `d6ba50d8aaf2308c769d9bf2abd42d90f34baf41`. The source snapshot and complete AGPL text are retained under `reference/pascal-pons-connect4/original/`. AGPLv3 is compatible with GPLv3 through GPLv3 section 13, but the derived module remains subject to AGPL obligations.

## Markus Thill Connect-Four

Copyright © 2014 `diedackel` / Markus Thill and contributors. The Java framework, n-tuple implementation and bundled trained agents are distributed under the MIT License. The preserved snapshot is commit `2a58844594ac022846385dd3ddc8bbbf0a26eae5`. ConnectLab includes the original `C4.TCL-EXP-lam0.0.txt.zip` weight export and a deterministic sparse conversion derived from it. The MIT notice remains in `reference/markus-thill-connect-four/original/LICENSE`.

The Markus Thill AlphaBeta adapter also derives a bounded browser adapter from `c4/AlphaBetaAgent.java`. It preserves the 42-bit field layout and alpha-beta/transposition design. The upstream optional 8-ply and 12-ply databases are not included in the retained repository or in ConnectLab; no replacement database is represented as original.

## Michael Bell — connectfour BotA

Copyright © 2012 Michael Bell. The historical `BotA`, board encoder and self-play trainer are licensed under GNU GPL version 3 or later. ConnectLab preserves commit `cb92ebe7350eb590ad4de783b860cc5e612c1943` under `reference/michael-bell-connectfour/original/`. The browser adapter preserves the base-3 state identity, horizontal symmetry, unseen-state probability, Beta(1,1) posterior mean and random tie selection. Because the upstream repository does not include a trained `games.db`, ConnectLab ships a clearly identified deterministic 10,000-game retraining snapshot generated from the preserved algorithm.

## Jacob Downing — Genetic Connect Four

Copyright © 2019 Jacob Downing. The project at `jacobjdowning/genetic-connect-four` is distributed under the MIT License. ConnectLab preserves commit `0b0f78f20c807f25fcfa027a02e407bd0b96b64c` and its license under `reference/jacob-downing-genetic-connect-four/original/`. The upstream project supplies the genetic trainer and network architecture but no trained population. ConnectLab therefore includes a reproducible 100-generation snapshot produced with seed `20190415`; it is derived ConnectLab data, not an upstream model.

## Zeta36 Connect4 AlphaZero

Copyright © 2017 Samuel Gravan; portions are credited upstream to Ken Morishita. The project `Zeta36/connect4-alpha-zero` is distributed under the MIT License. ConnectLab preserves commit `511150874845335c8687a1a4a8e6bcbc43207fe3`, the original Keras architecture and the original `model_best_weight.h5`. The browser payload is a lossless repacking of all 48 float32 tensors. The JavaScript module implements inference and the project's policy/value-guided PUCT search without TensorFlow or runtime dependencies.

## Aman Virmani — Connect4-AI

Copyright © 2020 Aman Virmani. `AmanVirmani/Connect4-AI` is distributed under the BSD 3-Clause License. ConnectLab preserves commit `0d08f2ba9408218936ddc82987ba5bd6b1afa346`, its license and Q-learning source under `reference/aman-virmani-connect4-ai/`. The upstream repository references but does not contain `q_table_1.pickle`. The Q-learning adapter therefore includes a clearly identified, reproducible derived table trained for 10,000 episodes per seat with seed `20200521`; it is not represented as an upstream model.

## GCompris Connect4 / 4st Attack 2

Copyright © 2005, 2008 Laurent Lacheny. The preserved GCompris Connect4 source identifies its AI as coming from Jeroen Vloothuis' 4st Attack 2 and licenses the combined Python files under GNU GPL version 3 or later. ConnectLab preserves the final archived GTK repository commit `09adaa111b827df53fc370a75a3cba7f4dceba3b`, the complete GPL text and the relevant gameplay files under `reference/gcompris-connect4-4stattack/original/`. No GCompris or 4st Attack media is redistributed.

## Victor Allis threat-space reference

`public/src/players/allis-threat-space.js` is original ConnectLab code under GPLv3, informed by the algorithmic description in Victor Allis' 1988 thesis *A Knowledge-based Approach of Connect-Four*. The thesis PDF and the original VICTOR source are not redistributed. `reference/allis-threat-space/SOURCE.md` records the publication URL and checksum. No code was copied from unlicensed third-party VICTOR reconstructions.

## John Tromp — UCI Connect-4 dataset

Tromp, J. (1995). *Connect-4* [Dataset]. UCI Machine Learning Repository, https://doi.org/10.24432/C59P43. The dataset is licensed under Creative Commons Attribution 4.0 International. The Naive Bayes adapter preserves the original compressed data and metadata under `reference/uci-connect-4/`. The Naive Bayes counts are a reproducible adaptation generated by `tools/train-uci-naive-bayes.py`; the adapter and trainer are original GPLv3 ConnectLab code. Changes: categorical counts were derived from the unmodified rows for dependency-free browser inference.

## GNOME Gnect / Velena

Copyright © 1996–1997 Giuliano Bertoletti & GBE 32241 Software PR; subsequent GNOME Gnect contributors. The retained GNOME Games 2.8.3 source headers state that changes were made for Gnect and that the code was released under the GNU GPL with Giuliano Bertoletti's approval. The headers name the GNU GPL without a version number and without an "or later" clause; GPLv2 section 9 lets a recipient choose any published version in that case, and the ConnectLab adapters are distributed under GPLv3 on that basis. ConnectLab preserves the relevant C source, package GPLv2 text and checksums under `reference/gnome-gnect-velena/`. Separate adapters port its tactical evaluator, proof-number controller and hybrid cascade. The rule-engine adapter additionally derives all nine strategic rule families from `evaluate.c` and a bounded compatibility solver from `pbsolver.c`; its compatibility representation is documented as an adaptation rather than bit-identical C parity. None claims the absent binary opening book or perfect play. The separately licensed standalone Velena archive is not redistributed.

The **GNOME Velena Full Integration** adapter composes the retained GPL-authorized opening controller, nine-rule adaptation, proof-number search and tactical evaluator. “Full Integration” refers to the recovered ConnectLab components, not to the separately licensed standalone Velena distribution or the absent binary opening database.

## ConnectLab Ensemble

The ensemble controller is original ConnectLab code under GPL version 3. It invokes five separately documented adapters—Markus Thill TD, Markus Thill AlphaBeta, GNOME Velena Full Integration, Allis Threat-Space and Stratzilla—without changing their respective provenance or license notices. Its weights are hand-documented orchestration constants, not a third-party trained model.

## ConnectLab Control Baseline

The Random, Tactical 1-ply and depth-4 Negamax profiles are original ConnectLab GPLv3 code. They use no third-party data, model, book or media and are labeled as experimental controls rather than historical intelligences.

## KDE KFourInLine 4.0.0

Copyright © 2000 Martin Heni and KDE contributors. The historical AI files are licensed under GNU LGPL version 2 or later; KFourInLine as an application is GPL version 2 or later. ConnectLab preserves the January 2008 source snapshot, license texts and checksums under `reference/kde-kfourinline-4.0.0/`. The JavaScript adapter retains the MinMax structure, evaluation tables, column bias and stochastic offsets while replacing Qt randomness with the Arena seed. No KDE visual assets are redistributed.
