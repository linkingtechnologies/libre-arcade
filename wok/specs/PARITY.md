# Gameplay parity notes

The first web version intentionally prioritizes movement and physics over visual
or mechanical modernization.

## Preserved constants and behavior

- Logical playfield: 640 × 480.
- Fixed simulation step: 10 ms (nominal 100 Hz).
- Pan dimensions: width 48, height 16, thickness 8.
- Pan tilt: horizontal movement changes angle by `-pan.vel.x * 0.005`, followed
  by damping `* 0.92`.
- Pan collision geometry: three moving quadrilateral regions, ported from the
  original `pan.c` / `ball.c` logic.
- Pan impulse: reflected ball velocity plus motion transferred from the pan;
  downward pan motion does not add downward launch energy.
- Ball radii: 7, 10, 15.
- Base gravity by color: 0.004, 0.008, 0.012 per tick², scaled by rank.
- Ball-ball collision coefficient: 0.8 with radius-weighted component exchange.
- Left wall restitution: 0.8.
- Scoring threshold: x > 90% of 640 (576 px).
- Visible yellow scoring zone begins at 93% of 640, matching the historical
  mismatch between drawing and scoring code.
- Ball base score: size + 3 → 3, 4, or 5.
- Combo multiplier uses the original integer/truncated sequence and resets after
  20 simulation ticks without another scored ball.
- Game over begins when any ball passes y > 480.
- MISS state lasts 120 ticks before the score is finalized.
- GAME OVER screen lasts 360 ticks or until a pointer press.
- Six generator types are ported: fire, volcano, tree, bucket, cloud, water tap.
- Four generator slots and 96 ball slots are retained.
- High score defaults to 1,000,000 as in the original and is saved in
  `localStorage` instead of `wok.prf`.

## Web-specific adaptations

- Mouse/touch position is mapped directly into the 640×480 logical canvas. This
  corresponds most closely to the original windowed input behavior and also
  makes touch input practical.
- The historical color-key backgrounds in the PNG files are removed at runtime;
  the asset files themselves remain unchanged.
- Browser audio is implemented with Web Audio. The three historical WAV effects
  are copied byte-for-byte to the runtime directory. The two beta-Vorbis music
  files are preserved unchanged but decoded once to 16-bit mono 16 kHz PCM WAV
  for runtime use, because current Chromium/FFmpeg Vorbis decoders reject the
  historical setup headers. No additional lossy encoding is introduced.
- The browser cannot reliably close its own tab. The historical QUIT action
  therefore shows a small close-tab message.
- A zero-distance ball-ball collision is given a tiny separation to prevent a
  JavaScript NaN cascade. All non-degenerate collision math is unchanged.
- Rendering-only randomness is kept separate from gameplay randomness so a
  browser's display refresh rate does not alter the simulation's random stream.

## Known parity boundary

The original SDL game rendered through an 8-bit custom palette. This port uses
the original PNG RGB values after reproducing the historical red/blue color-key
transparency. Physics and gameplay parity take priority; exact SDL palette
quantization is a future visual-parity task, not a gameplay change.
