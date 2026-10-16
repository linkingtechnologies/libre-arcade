# Lan Master — M15 Final Release 1.0.0

## Result

**PASS — final 1.0.0 package.**

M15 promotes the verified M14 RC1 to the first final release. No gameplay, rendering, audio, level, transition or UI runtime file is changed.

## Frozen production payload

The following remain byte-for-byte identical to M13 and M14:

- `index.html`;
- every file under `src/`;
- every file under `reference/` in the complete source/preservation package.

Therefore the certified 50 levels, RNG, connectivity, timers, automatic rotations, NES graphics, FamiTone-derived audio, transitions and M13 keyboard/focus hardening are unchanged.

## Final regression

M15 reruns the complete existing suite:

- M8 50/50 witness/core regression;
- M9 graphics pixel anchors;
- M10 audio and integration regression;
- M11 transition and integration regression;
- M12 production/offline/static regression;
- M13 keyboard/focus UI regression and managed Chromium smoke;
- M14 release/passcode regression and full playability gate;
- M15 final-package metadata/frozen-payload checks.

The M14 playability gate remains the end-to-end behavioral acceptance evidence: 49/49 level passcodes, ending code, 50-level campaign to ending/menu, representative real-control solves, mobile on-screen solve, and language/settings checks.

## Final packaging

M15 produces two deterministic release archives from the same web payload:

1. `lan-master-1.0.0-web.zip` — minimal player-facing static release;
2. `lan-master-1.0.0-m15-source.zip` — complete source, QA and archaeology/preservation release.

The source archive includes the certified historical `/reference` material; the web archive does not need that directory at runtime because the required restored data is self-contained in `src/`.

## Scope not claimed

The final package does not claim universal physical-device certification. The following remain external validation targets:

- physical Android touch/audio/heat/latency;
- physical iPhone touch/audio/heat/latency;
- unrestricted direct Safari/Firefox/Chromium hosted or `file://` navigation;
- subjective speaker/headphone acceptance of music/SFX/DPCM.

The strict historical NES source + NESASM 3.1 byte-identical rebuild is also still an independent M7.2 archaeology gate and is not a web-release blocker.
