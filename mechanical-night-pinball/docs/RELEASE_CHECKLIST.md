# 1.1.0 release checklist

## Automated gates

Run:

```bash
npm run release
```

This must pass:

- core physics smoke and Box2D 2.3.2 calibration;
- gameplay/state-machine parity;
- physics hardening and resting-contact regressions;
- fixed-tick flipper input, DocDonkeys strike reference and Flash-enhanced snap;
- collision-visibility audit;
- 30k-frame stress;
- follow camera;
- focus/visibility input reset and multi-alias flipper keyboard mappings;
- player UI, separated SFX/music controls and bundled CC0 background loop;
- state diagnostic UI;
- public source-tree guardrail;
- production distribution guardrail.

## Manual browser/device acceptance

- [ ] Chrome/Edge desktop: all flipper aliases (`←/→`, `Z/M`, `A/L`), launcher, menu, separate SFX/music toggles, restart.
- [ ] Firefox desktop: all flipper aliases (`←/→`, `Z/M`, `A/L`), launcher, menu, separate SFX/music toggles, restart.
- [ ] Safari iPhone/iPad: touch flippers/launcher, audio unlock, background music audible and independently mutable, no unwanted page scrolling.
- [ ] Chrome Android: touch flippers/launcher, audio unlock, background music audible and independently mutable, no unwanted page scrolling.
- [ ] Lose focus while holding a flipper: it releases correctly.
- [ ] Fast tap on either flipper produces the expected snap.
- [ ] Slowly resting ball can settle on held flippers without perpetual micro-bounce.
- [ ] Full gameplay loop: multiplier, Ramp Key, third ramp, two-ramp extra ball, peg recovery, tunnel, drain, game over, restart/menu.
- [ ] Follow camera keeps the ball readable from launcher area to top table.
- [ ] 20–30 minute session: no unexplained invisible barriers, stuck ball, runaway velocity, duplicate scoring or state corruption.
- [ ] If a path looks suspicious, repeat with `?debug=colliders`.
- [ ] Challenge transitions can be inspected with `?debug=states`.

## Licensing/gameribution

- [x] Public source repository contains provenance/hash documentation only, not historical binaries.
- [x] `/game` contains no historical/quarantined material.
- [x] Code license: GPL-3.0-or-later.
- [x] New SVG artwork: CC0-1.0.
- [x] Third-party/reference notices included.
