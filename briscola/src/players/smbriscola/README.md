# smBrisCola players

This directory contains a faithful JavaScript port of the two heuristic players
shipped with **smBrisCola 2005-09-27**.

## Exposed players

- `SmBriscolaEmpirico1AI` / `SmBriscolaEmpirico1Adapter`
- `SmBriscolaEmpirico2AI` / `SmBriscolaEmpirico2Adapter`

They are intentionally exposed as two independent BriscoLab players. The
shared `SmBriscolaAI` class only avoids duplicating the translated legacy code;
it is not presented as a single configurable opponent in the UI.

## Fidelity policy

Original Italian method names such as `ScegliCarta_Empirico1`,
`ScegliCarta_Empirico2` and `Vince` are preserved to make comparison with the
Python source straightforward. New code, adapters, comments and documentation
are written in English.

The port was checked against the original Python implementation on 3,000
randomized decision states (1,500 for each algorithm) with zero mismatches.

## Algorithm notes

Both players are memoryless hand-crafted heuristics. `Empirico1` is the older
baseline strategy. `Empirico2`, contributed by Licia Salce in the original
source, is more conservative in several situations: it can avoid winning a
zero-point trick, is more selective when spending trump cards, and has special
handling for trump Ace/Three combinations.

## Source and license

Original source: `briscola_player.py`, smBrisCola 2005-09-27.
The upstream project is licensed under GNU GPL version 2 or, at your option,
any later version. A copy of the license is stored under `THIRD_PARTY/` and the
reference Python source is stored under `reference/smbriscola-empirico1/` and `reference/smbriscola-empirico2/`.
