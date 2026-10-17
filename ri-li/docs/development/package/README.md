# Ri-li 2.0.1 — Libre Arcade restoration

A faithful browser restoration of **Ri-li 2.0.1** (2007), the C++/SDL railway arcade game by Dominique Roux-Serret.

The locomotive follows the railway continuously; the player prioritizes the route at junctions, collects every wagon, and must manage an increasingly long train. This restoration preserves the original 50 levels, movement geometry, wagon-follow algorithm, collision rules, progression, Human Rights quiz, graphics and audio behavior while replacing SDL with vanilla JavaScript, Canvas 2D and browser audio.

## Run

Serve this directory through HTTP:

```bash
./serve.sh
```

or on Windows:

```bat
serve.bat
```

Then open the local address shown by the server. The game is entirely client-side.

## Controls

Desktop:

- arrow keys: prioritize the route at the next junction;
- Enter / Space: confirm menu and quiz choices;
- P: pause;
- H: show or hide the route arrow;
- Esc: return to the menu.

Touch devices use the on-screen D-pad. Tapping the playfield cycles the next available turn.

## Features

- all 50 original levels;
- Easy / Normal / Hard difficulty;
- Italian and English browser shell, with preserved original raster UI assets;
- original Human Rights quiz between levels;
- original score table behavior and local progress/high-score persistence;
- original WAV effects and browser-playable derivatives of the original tracker music;
- responsive no-page-scroll layout and touch controls;
- certified legal-input playthrough of all 50 levels: 1,042/1,042 wagons collected with zero collisions;
- Guide, Credits and local-data reset.

## Preservation reference

`reference/Ri-li-2.0.1.tar.bz2` is the original upstream source release used as the archaeological baseline.

SHA-256:

`f71ccc20c37c601358d963e087ac0d524de8c68e96df09c3aac1ae65edd38dbd`

See `reference/SOURCE.md`, `docs/ARCHAEOLOGY.md` and `docs/VALIDATION.md` for provenance and fidelity details.

## License and credits

This restored distribution is released under **GNU GPL v3.0**. See `COPYING` and `THIRD_PARTY_NOTICES.md`.

Original Ri-li design, programming and graphics: **Dominique Roux-Serret**. Original music: **Maf464 / Charcosset B.** Additional upstream translation credits are preserved in `THIRD_PARTY_NOTICES.md` and in the original source archive.

Libre Arcade: https://linkingtechnologies.github.io/libre-arcade/
