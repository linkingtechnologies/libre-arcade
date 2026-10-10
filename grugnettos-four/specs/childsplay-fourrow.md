# Childsplay Fourrow — behavioral specification

## Identity

- Activity: `fourrow`
- Baseline: Childsplay 3.3 (2018 package baseline)
- Module author/modifier: Stas Zytkiewicz, header dated 2011
- Explicit upstream: Al Sweigart, *Four-In-A-Row (a Connect Four clone)*
- Board: 7 columns × 6 rows
- Human: red
- CPU: black
- Childsplay difficulty levels: 6

## Historical AI

The upstream Sweigart example exposes one `DIFFICULTY` look-ahead setting. Childsplay adds a six-level policy layer and a first-move centre bias.

| Childsplay level | Forced-random branch | Look-ahead | First CPU move special rule |
| --- | --- | --- | --- |
| 1 | 100% | effectively 0 | none |
| 2 | 1/4 | 1 when AI branch selected | none |
| 3 | 1/7 | 1 when AI branch selected | choose zero-based 3 or 4 if legal |
| 4 | 1/7 | 1 when AI branch selected | choose zero-based 3 or 4 if legal |
| 5 | none | 1 | choose zero-based 3 or 4 if legal |
| 6 | none | 2 | choose zero-based 3 or 4 if legal |

Important: levels **3 and 4 are behaviorally identical in the recovered code**. This is preserved rather than “fixed”.

Even levels 5 and 6 are not globally deterministic: when several moves have the same best score, the original code calls `random.choice(bestMoves)`.

## Evaluator

For each legal CPU move:

1. Immediate CPU win → fitness `1`.
2. Otherwise enumerate every legal opponent reply.
3. If any reply wins immediately → candidate fitness becomes `-1`.
4. Otherwise recurse for additional look-ahead.
5. Select a move with maximal fitness; ties are random.

The original code stops scanning later candidate columns when it encounters the first immediate winning candidate. Preserve this ordering quirk.

## Python 2 arithmetic oracle

Childsplay 3.3 is a Python 2 program. Its recursive expression is effectively:

`(sum(results) / 7) / 7`

with integer operands. In Python 2 that means floor integer division, including for negative values. A JavaScript port that simply uses floating-point `/` changes level-6 decisions. The port therefore uses two explicit `Math.floor` integer divisions.

## Turn behaviour

The first game in the original activity starts with the computer. Subsequent games randomly choose human/computer start. The AI's `firstmove` flag is reset for every new board.

For levels 3–6, on the CPU's first move it chooses from columns 4 or 5 in human 1-based numbering (zero-based 3 or 4), provided those columns are legal. This is not a general centre heuristic; it is a one-time opening rule.

## Scoring quirks

- User win: displayed score +100; `get_score()` returns 100.
- CPU win: `get_score()` returns 10.
- Tie: `get_score()` also returns 10.
- There is unreachable tie-score code inside `_show_winner`; the visible +50 tie increment is therefore not actually executed in the recovered control flow.

The ConnectLab AI adapter does not implement Childsplay profile/database scoring; it preserves move selection only.
