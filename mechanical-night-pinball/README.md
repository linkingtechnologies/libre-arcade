# Mechanical Night Pinball

**Version 1.1.0-rc2**

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/mechanical-night-pinball/public/index.html)**

A clean-room HTML5/JavaScript preservation of the gameplay structure of **DocDonkeys Pinup-Pinball 1.0 (2018)**, reconstructed through software archaeology and numerical comparison with its historical Box2D 2.3.2 implementation.

The table geometry, rules, scoring and calibrated physical behaviour follow the 2018 reference. The default player profile additionally restores the documented one-shot flipper press snap found in the older Flash ancestor and omitted by the C++ remake. Use `?flipper=docdonkeys` for the strict 2018 flipper profile.

## Play locally

```bash
npm run dev
```

Open `http://localhost:8080/`. This uses the dependency-free static server in
`scripts/serve.mjs`, the same one every game in this collection uses.

Flipper controls (all active simultaneously):

- left: `←`, `Z`, or `A`;
- right: `→`, `M`, or `L`;
- launcher: `↓`;
- restart after game over: `Space`.

Touch controls appear on mobile.

## Production build

```bash
npm run release
```

This runs the complete regression suite, verifies the public source tree, generates `/game`, and verifies that the production build contains no quarantined historical material.

`/game` is ready for static hosting such as GitHub Pages.

## Diagnostics

- `?debug=states` — live gameplay state-machine inspector and event injector.
- `?debug=colliders` — collision/sensor overlay.
- `?debug=1` — compact physics readout.

Diagnostics are invisible in normal play.

## Architecture

- vanilla JavaScript + Canvas 2D;
- Web Audio procedural SFX plus a bundled optional CC0 background-music loop;
- 428×822 physical table, viewed through a 428×600 vertical follow camera;
- custom deterministic clean-room physics solver calibrated against the archived Box2D 2.3.2 reference;
- no runtime framework and no external runtime dependency.

## Licensing and clean-room policy

- web source code: **GPL-3.0-or-later** (`LICENSE`);
- newly authored SVG artwork: **CC0-1.0** (`ASSETS_LICENSE`);
- historical Flash/DocDonkeys binaries and derived expressive assets are **not redistributed** in this public repository or `/game`.

See `LICENSING.md`, `THIRD_PARTY_NOTICES.md`, `reference/PROVENANCE.md` and `docs/ARCHAEOLOGY.md`.

## Verification

The automated release gate covers Box2D calibration, gameplay state machines, resting contacts, flipper input/strike behaviour, collision visibility, long-run stress, camera, UI/audio, source cleanliness and production distribution cleanliness.

The remaining human release checks are listed in `docs/RELEASE_CHECKLIST.md`, primarily real-device/browser acceptance and a long gameplay session.

Historical development notes are preserved under `docs/history/` and `specs/history/`; they are not part of the player-facing runtime.


## Audio controls

Sound effects and background music are independent. The bundled `public/assets/music/mechanical-night-loop.ogg` is newly synthesized for this project and released under CC0-1.0. The previous barely audible procedural drone remains only as a fallback if the music asset cannot be decoded.


## Keyboard aliases (1.1.0-rc2)

The three desktop flipper mappings are enabled simultaneously: `←/→`, `Z/M`, and `A/L`. Multiple aliases for the same side are source-aggregated, so releasing one key does not release the flipper while another alias remains held.
