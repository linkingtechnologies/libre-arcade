# The software archaeology behind Grugnetto's Four

This is the recovery story of this one game. The philosophy shared by every game in the collection (preserve the reasoning and not just the artifact, verify by execution rather than resemblance, record provenance instead of erasing it) is in [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## Sixteen sources, one board

Four-in-a-row is small enough that almost every programmer who has wanted to try a game-playing idea has written one. The sources behind this game span 1988 to 2020 and do not resemble each other: a doctoral thesis on threat spaces (Victor Allis, 1988) that describes a program but is not itself code; a 1995 dataset of 67,557 eight-ply positions labelled with their game-theoretic value; a 1996 engine by Giuliano Bertoletti, called Velena, that reached us through the GNOME Games package; a KDE game from 2000 whose AI was deliberately written to play like a person; a GCompris activity that took its AI from yet another project; a Pygame tutorial example; a browser minimax from 2017; two programs that learn from self-play; a genetic-algorithm trainer; an AlphaZero clone; and the exact bitboard solver Pascal Pons published in 2017.

None of the authors coordinated. Several were learning, and several wrote for a different board library, language or century. Python 2 programs sit next to a Keras model and a C engine from the 1990s. The game puts all of them behind one contract ([`specs/player-api.md`](specs/player-api.md)): given a position, an optional setting and a seed, return a column. The 23 players behind that contract are 21 ports or adaptations of historical work and 2 original ConnectLab players (an ensemble of five of the ports, and a control baseline).

## What was missing

The recovery was mostly about gaps, and each gap is recorded rather than filled in silently.

- Three of the learning programs shipped a trainer and no trained model: Michael Bell's `games.db`, Jacob Downing's evolved population and Aman Virmani's `q_table_1.pickle` do not exist upstream. The game trains them again, with the preserved algorithm and a fixed seed, and labels the result as a retraining snapshot. Their low placement in the ranking therefore measures a 10,000-game, 100-generation or 10,000-episode budget chosen here, not the authors' work.
- Velena's binary opening book and Markus Thill's 8-ply and 12-ply databases are absent. The ports say so and claim no perfect play.
- Pascal Pons wrote a solver that, given enough time, plays perfectly. A browser cannot give it that time, so the player is capped at 10,000 search nodes and marked as not exact. It lands in the middle of the table, which reflects the cap and not the solver.
- Two sources were examined and turned down. Fhourstones carries a notice that forbids sale for profit, and the standalone Velena archive has a custom licence that prohibits charging a fee. Neither is compatible with the GPL, so neither is redistributed.
- Allis's thesis is cited but not redistributed, and no code from unlicensed reconstructions of his program was used. The Allis player is a clean-room reading of the published method.

## Quirks kept on purpose

The Childsplay activity offers six levels, and levels 3 and 4 behave identically in the code that was recovered. The port keeps both, because a quirk in the original is data about the original. The same rule keeps the Python 2 floor division and the first-winner short-circuit in the Childsplay port, and the asymmetric heuristic weights in the Stratzilla one. Nothing was tuned to make a player stronger, weaker or more even.

## How the levels were measured

Every player plays every other player, twice per seed (once as each colour), over three seeds: 1,518 games. A rating with a confidence interval is computed for each player from the results alone and frozen in `public/src/strength/strength-snapshot.js`. The six difficulty levels are clusters of that ranking, so the difficulty a player picks is an observation about these programs on this board and not a claim about the programs in general. Two players at the bottom of the table finish with identical records, and the top player, the Markus Thill n-tuple network, is about 300 rating points above the second.

`tools/calibrate-strength.mjs` replays the whole calibration and compares it with the frozen snapshot, so the levels can be re-derived instead of trusted. It was run for this integration: all 23 rows (rating, interval and win/draw/loss counts) came back identical, in about eleven minutes.

## Evidence and its limits

Verification follows the collection's hierarchy, and the strongest level is not claimed for everything. The preserved JavaScript of the Melilli minimax is executed as an oracle. Jacob Downing's network is executed in Python and agrees with the browser port to 1e-12. The Stratzilla, PetterS and Pons checks compile the preserved C++ and compare outputs. They were run under Debian 12 with g++ 12.2, and their output is recorded so that the suite replays it without a compiler. PetterS is compared for state, winner and move generation only, because its seeded search draws a different random stream. The Velena and KFourInLine ports are compared with short C transcriptions written independently of the originals, which is a weaker kind of evidence. For the rest, the oracle is a source-level review. [`specs/port-map.md`](specs/port-map.md) states which is which, player by player.

All six large trained-data modules were regenerated from their preserved sources and match byte for byte. The Zeta36 weights were rebuilt from the original HDF5 file with a Python library installed in a scratch environment.
