# Allis-inspired threat-space clean-room notes

## Why clean room

Victor Allis' thesis describes VICTOR and threat-space reasoning, but no GPLv3-compatible original VICTOR source was established. Public reconstructions inspected during scouting either had no license or did not offer the symmetric player contract required by ConnectLab. Fhourstones was also rejected because its non-commercial restriction is incompatible with GPLv3.

M13 therefore uses only the published algorithmic ideas and game rules. `src/players/allis-threat-space.js` was written independently and is GPLv3 code. The primary PDF is identified and checksummed in `reference/allis-threat-space/SOURCE.md`, but is not bundled.

## Implemented proof pattern

1. Play an attacking move.
2. Reject it if the defender can win immediately.
3. If it creates two immediate winning squares, the line is proven.
4. If it creates exactly one, play the defender's forced block.
5. Continue searching only threat-producing attacker moves.

This selective search is bounded to 3, 5 or 7 plies. It is far smaller than ordinary minimax because quiet defender alternatives disappear only when the preceding threat genuinely forces the reply.

## Fallback policy

When there is no proof within the horizon, the agent deterministically weighs open four-cell lines, gravity-playable threats, row parity and distance from the centre. This fallback is ConnectLab code, not a claimed VICTOR rule set.

## Verification boundary

Tests cover immediate vertical victory, compulsory defence and a three-move line ending in a double threat. Arena tests verify legal moves, symmetry and deterministic replay. M13 must be described as “Allis-inspired threat-space clean room”, not as a bit-identical port of VICTOR or as a perfect solver.
