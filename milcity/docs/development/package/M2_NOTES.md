# MilCity M2 — simulation-first restoration

Scope: faithful JavaScript simulation skeleton derived from MilCity Blue 1.0.5. No claim of visual parity yet.

Implemented: 30x30 terrain, deterministic QA RNG, 9 canonical building definitions, 6 weapon footprints, money/energy/acceleration, production/construction timing, score model, shield/spy primitives, four historical AI difficulty policies, random build/target retry behavior, win/loss scaffolding, and a browser simulation harness.

Important fidelity choices:
- AI remains one algorithm with Easy/Medium/Hard/Madness policy branches.
- AI firing order is Missile -> Mortar -> Aircraft -> Nuke and omits Spy/Shield.
- Power Plant ignores blackout acceleration while constructing.
- Normal building timing honors the historical acceleration equation, including -200 blackout slowdown.
- QA uses a seedable RNG even though 1.0.5 repeatedly instantiated java.util.Random. This is a testability layer, not a claim that original sessions were seed-reproducible.

Known M2 limitations:
- Terrain random-walker behavior is structurally faithful but not byte/sequence-identical to java.util.Random.
- Cell sprite IDs and rotations are not rendered.
- Bluetooth is not implemented.
- Browser UI is an engineering harness, not production Libre Arcade UI.
- Full Java-vs-JS behavioral certification still requires running the original JAR in a J2ME emulator.
