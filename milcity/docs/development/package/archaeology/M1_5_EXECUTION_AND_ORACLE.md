# MilCity Blue 1.0.5 — M1.5 execution/oracle audit

## Baseline

The source archive supplied by the user contains a deployable 1.0.5 JAR/JAD pair under `deployed/DefaultColorPhone/`.

- JAR manifest: `MIDlet-Version: 1.0.5`
- JAD: `MIDlet-Version: 1.0.5`
- Profile: MIDP 2.0
- Configuration: CLDC 1.0
- MIDlet: `fr.uha.ensisa.ir.walther.milcityblue.MilCityBlue`

The separately supplied JAR/JAD pair is 1.0.3 and is therefore retained only as a comparison artifact, not as the 1.0.5 behavioral oracle.

## Runtime availability

No J2ME emulator (FreeJ2ME/MicroEmulator) is installed in the current audit runtime. Therefore M1.5 does **not** claim visual/input parity by execution here. Instead, this milestone certifies the deployable 1.0.5 pair, reconstructs timing from source, and provides deterministic/static assertions for the future Java→JS oracle.

## Timing model

Two clocks coexist:

1. `GameEngine` render/input loop runs at the FPS supplied by the caller and sleeps for `1000/fps - render_time` milliseconds.
2. Every `AIPlayer` runs in its own thread, executes one logic iteration, then sleeps 1000 ms.

Consequences:

- AI strategic decisions are effectively evaluated once per second.
- `turn` is incremented once per AI iteration.
- A build decision is considered when `turn == 1`; after `turn >= 5` it resets to 0. Therefore the build policy is revisited about every 5 seconds.
- weapon firing is checked every AI second whenever `cannotFireBefore` permits it.

## Four AI levels

`AIPlayer.java` defines exactly four difficulty values:

- Easy = 0
- Medium = 1
- Hard = 2
- Madness = 3

They are one algorithm with level-dependent build policy, not four independent classes.

### Build policy

On a build turn, the first branch requires enough reserve money and `energy > 6`.

The AI first tries to reach `commercialCount < level * 2`; once this threshold is met it chooses:

- Easy → Missile Silo
- Medium → Factory
- Hard → Air Field
- Madness → Nuke Silo

Fallbacks can build Commercial or Power Plant depending on money/energy.

Notably, the AI does not construct House, Laboratory, or Shield Generator.

### Weapon policy

If firing is allowed, the AI checks ammunition in this fixed sequence:

1. Missile
2. Mortar
3. Aircraft
4. Nuke

It never fires Spy or Shield.

A single AI iteration may attempt more than one weapon in sequence; `fireOnAnotherPlayer`/`cannotFireBefore` determines what actually proceeds.

### Targeting

Each weapon attempt:

- creates a fresh `java.util.Random`;
- selects a random target player other than self using another fresh `Random`;
- selects a random 30×30 coordinate;
- retries at most ten times while the target's status grid marks the selected cell as known water;
- then submits the fire command.

The historical source itself contains `// TODO improve targeting ...`.

## Deterministic QA oracle

The historical Java implementation is not seedable because it repeatedly constructs `new Random()` with implicit seeds. For the browser restoration, deterministic mode must be a QA-only dependency injection and must not change normal gameplay semantics.

Recommended deterministic oracle interface:

```text
stepAI(state, level, rng) -> [commands, nextState]
```

The injected RNG must be consumed in the same logical places as historical randomness:

- random building x/y;
- random weapon x/y;
- random target player;
- random-walker map generation.

Do not make deterministic QA mode the user-visible default.

## Core oracle scenarios

1. Empty start, $100, energy 0: first strategic tendency is recovery/economy, not immediate weapon tech.
2. Energy <= 0: Power Plant fallback can be selected.
3. Level Easy with viable economy: military branch selects Missile Silo.
4. Level Medium with viable economy and >=2 Commercial: Factory.
5. Level Hard with viable economy and >=4 Commercial: Air Field.
6. Level Madness with viable economy and >=6 Commercial: Nuke Silo.
7. Known-water target cell: reroll, up to ten retries.
8. Non-water/unknown cell: accepted immediately.
9. Available Spy/Shield ammo: AI ignores it.
10. House/Laboratory/Shield Generator affordable: AI still never chooses them.

## Blackout behavior

`computeAccelerationFactor` sets acceleration to `-200` while energy <= 0. Normal time formulas subtract acceleration, making time-consuming operations effectively three times their base duration. Power Plant construction contains special handling that prevents the initial blackout from making recovery impossible.

## Emulator verification checklist

When run under FreeJ2ME or another MIDP 2.0 emulator, record:

- startup/splash success;
- actual canvas size and scaling at 320×240;
- menu navigation via keypad;
- pointer support if the emulator exposes pointer events;
- FPS responsiveness;
- first 120 seconds of Easy/Medium/Hard/Madness separately;
- build timestamps/types;
- fire timestamps/types/targets;
- blackout countdown and loss at approximately 120 s;
- Shield visual duration ~60 s;
- Spy reveal behavior;
- configurable Water %, Max Score, Default Money;
- win by score and win by last-player-standing.

Any discrepancy between emulator traces and source-derived expectations should be recorded as an emulator/device quirk before changing the future port.
