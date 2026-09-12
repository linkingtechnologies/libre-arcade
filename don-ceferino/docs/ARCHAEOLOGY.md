# Don Ceferino Hazaña — software archaeology record

## Preservation baseline

This restoration uses **Don Ceferino Hazaña 0.97.8** as the normative historical baseline.

The exact source archive supplied for the restoration is preserved unchanged at:

`/reference/ceferino_0.97.8.orig.tar.gz`

SHA-256:

`6f0f2674a8a968950498570b89123e341dca50499d255e7bcdf3703a85aa3074`

The archive is also extracted under `/reference/ceferino-0.97.8/` for convenient inspection. Files in that directory are reference material and must not be silently edited.

`configure.ac` identifies the package as `ceferino` version `0.97.8`.

## Authorship recorded by the release

The historical `AUTHORS` file credits:

- Hugo Ruscitti — programming and project management
- Walter Velazquez — graphics and story
- Javier Da Silva — music
- José Jorge Enríquez Rodríguez (Geo) — Windows version
- Gabriel Valentin — English gettext translation
- YBSAR — French gettext translation
- Raül Cambeiro — Catalan gettext translation

The historical README describes the game as similar to Super Pang. This restoration treats that as a statement about gameplay inspiration, not as evidence that commercial Pang assets are included.

## Historical technology

The original release is a C++/SDL 1.x game using SDL_image and SDL_mixer. The original runtime supports 640×480 and 320×240 video modes. Logic and rendering are both scheduled at 100 Hz.

The web restoration deliberately does not compile or wrap the SDL application. Game rules are ported to browser-native JavaScript and rendered with Canvas.

## Level format

`data/levels/base.map` is 8,400 bytes. Each level is exactly 20×14 bytes (280 bytes), therefore the release contains exactly **30 levels**.

Each cell is one byte. Numeric values below ASCII `a` are tile indices except `-` (45), which is empty. Special markers are:

- `a`: player
- `b`..`e`: balls size 1..4 moving right
- `f`..`i`: balls size 1..4 moving left
- `j`: destructible block

The restoration loads the original binary map directly; it does not translate the levels into a new hand-authored format.

## Preservation rule

Parity fixes must be evidence-driven. A behavior that looks odd in 2026 is not automatically a bug to correct. Known historical quirks are documented in `PARITY.md` and locked by automated tests where practical.
