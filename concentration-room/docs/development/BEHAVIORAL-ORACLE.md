# Behavioral oracle

## Canonical game facts

- Logical field: 9 columns × 8 rows = 72 slots.
- Active card counts: 10, 20, 36, 52, 72.
- Pair counts: 5, 10, 18, 26, 36.
- Solitaire miss budgets: 20, 40, 60, 80, 100.
- 2P / Vs CPU: a match scores one pair and the same player continues.
- A mismatch passes the turn.
- Competitive game ends when the current score is already unreachable by the opponent; this implements the original "first to half the pairs" rule without awarding a skill-free final pair.
- Standalone Vs CPU uses `aiNoiseLevel = 8`.

## NTSC timing constants

- flip state timer: 5 frames;
- match/mismatch decision state: 90 frames;
- second-card unflip tail: 6 frames;
- CPU delay before its second choice: 30 frames;
- win hold: 180 frames;
- loss hold: 90 frames.

The renderer/state machine reproduces frame semantics rather than replacing them with arbitrary CSS delays.

## PRNG and shuffle

Reset seed bytes are:

`rand0=0x26 rand1=0x25 rand2=0x24 rand3=0x23`.

The historical 0.02 PRNG shifts this 32-bit register and conditionally XORs polynomial `0x04C11DB7`.

Before entering a mode, the selected title-mode index and the NMI counter are mixed into the seed, followed by two PRNG steps. Before a deal, the then-current NMI counter is XORed into `rand3`, followed by eight PRNG steps.

For each deal, pairs are built first, then each deck position from last to first swaps with:

`(rand6 + shufflePos + 1) % nCards`

where `rand6 = rand3 & 0x3f` after six PRNG bit steps.

This is intentional historical behavior and must not be silently replaced by Fisher-Yates.

## Frozen deal vectors

Parameters for each independent deal:

- reset bytes: `26 25 24 23` (`rand0..rand3`);
- title mode index: `2` (2 Players);
- title `nmis`: `0x11`;
- deal `nmis`: `0x5d`.

Values below are card identities (`boardState & 0x3f`) in ascending active-slot order.

```text
D0: 32 30 29 28 28 29 31 30 31 32
D1: 31 31 35 29 35 36 30 30 37 33 32 29 37 32 28 34 36 33 28 34
D2: 48 45 49 38 62 61 60 39 61 49 38 51 47 44 54 48 60 44 50 46 47 45 50 39 51 55 52 63 46 54 52 63 53 55 53 62
D3: 56 45 57 46 50 54 41 44 50 45 55 58 38 40 61 63 52 49 61 38 47 49 56 62 44 42 54 62 41 48 60 55 40 53 63 59 60 53 47 39 51 43 51 39 57 42 52 48 59 43 46 58
D4: 48 49 42 34 42 47 35 46 32 54 54 61 51 39 39 53 45 56 33 63 30 31 50 32 36 47 41 57 36 31 45 58 55 52 59 52 38 56 61 28 55 51 40 57 44 29 50 48 41 28 46 33 58 59 49 35 60 53 62 29 37 43 37 62 44 30 38 34 63 43 40 60
```
