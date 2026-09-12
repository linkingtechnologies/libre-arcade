# Rules implemented by glParchis 20181125

This file documents observed program behaviour, not a generic description of every Parchís variant.

## Players and pawns

- Native board layouts: 3, 4, 6 and 8 seats.
- Seats can be disabled.
- Every enabled seat can independently be human or computer controlled.
- Four pawns per player.
- Before play, active players roll to decide the starter. The unique highest roll starts; tied leaders roll again.

## Leaving home

- A pawn leaves home on a **5**.
- Leaving home is represented as movement to route position 1.
- If a legal home exit exists, it is compulsory.
- The implementation contains special logic for a crowded starting square and can force a capture there.

## Six

- A 6 normally moves six squares and grants another throw.
- When all four pawns are already outside home, a rolled 6 moves **7** squares.
- If the player has a barrier and rolls 6, opening one of that player's barriers becomes compulsory.

## Three consecutive sixes

- Three literal die results of 6 in the same turn end the turn.
- The last moved pawn is normally sent home.
- A last-moved pawn already in the final ramp is exempt.
- The code also contains a legality check that can prevent sending the pawn home in a blocked/illegal state.

## Barriers

- Two pawns of the same player on one square form a barrier.
- A movement is rejected if any traversed square, including the destination, contains a barrier.

## Captures and safe squares

- A lone opposing pawn on a non-safe destination may be captured.
- Normal safe squares prevent captures.
- The starting-square case has dedicated capture logic.
- Capturing sends the victim home and awards an accumulated **20-square** bonus move.

## Final track and finish

- Final ramps are safe.
- Reaching the final square awards an accumulated **10-square** bonus move.
- Exact movement is required: moves that would pass the final square are rejected.
- There is no bounce-back rule.

## Victory

A player wins only when all four pawns have reached the final square.

## Turn order

Turns cycle through the seat array and skip disabled players. A 6 grants another throw after movement (subject to the three-sixes rule). Capture/finish bonus movement is resolved before the turn changes.
