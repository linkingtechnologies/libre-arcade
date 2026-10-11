# Behavioral oracle

1. New game: score=0, landings=0, plane=(22,0).
2. 26 buildings; first city heights 1..8.
3. Plane advances one logical cell per 141 ms tick.
4. At planeY>=29: if planeX>0, wrap planeY=0 and planeX--; if planeX==0, landing succeeds.
5. Only one bomb may be active.
6. Bomb launch is allowed after the plane reaches planeY>=3.
7. Bomb advances by decrementing bombX once per game tick.
8. Impact targets building index bombY-3.
9. Impact removes up to 3 blocks and scores 1 point per removed iteration, preserving the original loop semantics.
10. Collision predicate: `planeY < 25 && buildingHeight[planeY]-1 >= planeX`.
11. Crash animation nominally 30 x 100 ms, then blocking crash melody semantics.
12. Success melody completes before landings increments/new-city initialization, matching the original blocking behavior.
13. Java-compatible Random is available for seeded QA through `?seed=<integer>`; normal play uses current time.

## Parity corrections
- Target display is 240×320 (Nokia 6234); gameplay geometry still occupies the original upper area derived from 8 px cells.
- An impact blocks for 25 ms per destroyed block in addition to the regular 141 ms loop delay.
- Crash flashes 30 times at 100 ms intervals, selects crash sprite frames randomly, then displays black during the blocking crash melody.
- Startup holds for 3000 ms before the title state.
