# PSY PONG 3D 0.9 parity notes

The web port intentionally starts from observed source behavior, including historical quirks.

## Core constants

- Floor: 128 x 64 logical units.
- Player size: 3; radius: 1.5; playable cylinder width: 12.
- Ball radius: 1.5.
- Default score limit: 5.
- Default camera FOV: 60 degrees.
- Initial camera transform: distance -128, X rotation 45 degrees.

## Timing

The original display loop sleeps for 5,000 microseconds after a rendered frame. Ball, collision, scoring and CPU logic execute from that display loop, while camera random rotation is scheduled with a 25 ms GLUT timer. This port therefore uses a deterministic 5 ms gameplay fixed step and a separate 25 ms camera accumulator.

The documented "every two seconds" level increase is implemented in the original with an odd-second test. It therefore first increments at roughly one second, then three, five, seven, and so on. The parity core deliberately preserves this quirk.

## Motion and collision

- Player speed per gameplay step: `level * 0.02`.
- Ball speed per gameplay step: `playerSpeed * 0.8`.
- Ball motion changes X and Z by the same magnitude, so trajectories are always diagonal.
- Floor-edge collision flips only the front/back (Z) direction.
- Paddle collision flips only left/right (X); contact position does not alter the rebound angle.
- After a score, the ball returns to the origin without choosing a new direction.

## CPU

Autopilot moves the paddle one player-speed step toward the ball. Each gameplay step grants movement when `level > random(0..level)`, matching the source-level probability pattern.

## Warp and swap

Warp moves a paddle to the opposite Z boundary after it travels beyond the extended floor limit.

A random side swap can occur only when the ball is exactly at X=0 after at least one point has been scored. The two PLAYER objects exchange their X positions, preserving score ownership.

## Renderer differences

The original third-party BMP textures are deliberately excluded because their redistributable licenses could not be established from the 0.9 archive. The web renderer uses newly created replacement artwork while preserving the original field dimensions and object colors. The replacements are documented in `assets/ASSET_PROVENANCE.md` and are not copies of the historical BMP files.
