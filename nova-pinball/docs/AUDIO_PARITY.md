# Audio parity audit — Nova Pinball v0.2.3 → Web Restoration 1.0.0

The 1.0.0 release does **not** redistribute the historical WAV files. The original v0.2.3 package was inspected to recover trigger roles and approximate temporal/timbral behaviour, then each used effect was reimplemented with Web Audio oscillators/noise.

The original package contains **19 WAV files**. Static source inspection shows **18 are used by the v0.2.3 runtime**; `powerup-2.wav` is present but is not loaded/referenced by the game code.

| Original WAV | Original duration | Runtime role | 1.0.0 status |
| --- | ---: | --- | --- |
| `menu.wav` | 0.073 s | menu move/activation | synthesized |
| `flipper.wav` | 0.251 s | both flippers | synthesized |
| `wall.wav` | 0.033 s | tagged wall impact | synthesized |
| `bumper.wav` | 0.295 s | three bumpers and both kickers | synthesized |
| `target.wav` | 0.032 s | NOVA/side target switch | synthesized |
| `wordbonus.wav` | 0.389 s | completed NOVA word | synthesized |
| `ramp.wav` | 1.041 s | left/right ramp | synthesized |
| `launch.wav` | 0.305 s | new numbered ball | synthesized |
| `nudge.wav` | 0.475 s | table nudge | synthesized |
| `ball-drained.wav` | 0.549 s | drain | synthesized |
| `blackhole-lock.wav` | 0.285 s | ball enters Gravity Lock | synthesized |
| `blackhole-release.wav` | 0.279 s | locked ball released | synthesized |
| `blackhole.wav` | 2.522 s | black-hole appearance | synthesized |
| `hydrogen-released.wav` | 3.298 s | Hydrogen Release + Fusion I + Fusion II | synthesized |
| `wormhole.wav` | 2.310 s | wormhole ambience; loops until reset upstream | synthesized loop + entry layer |
| `timewarp.wav` | 2.548 s | wormhole/time-warp layer | synthesized |
| `wormhole-close.wav` | 1.456 s | reset closes wormhole | synthesized |
| `supergravity-bonus.wav` | 1.618 s | Supergravity reset bonus | synthesized |
| `powerup-2.wav` | 0.529 s | no v0.2.3 source reference found | preserved as archaeological observation only; no runtime equivalent |

The 1.0.0 synthesis is a **behavioural/timbral reconstruction**, not a copy or transcoding of the historical WAVs. This is intentionally documented as `reconstructed`, not `preserved`.
