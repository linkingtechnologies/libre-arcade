# HighMoon — Duel in Space

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/highmoon/public/index.html)**

A two-player or solo space-artillery game. Aim, charge and fire around planets whose gravity bends each shot; navigate storms and wormholes, collect bonuses, and challenge the CPU at five difficulty levels.

## Play

Serve `public/` with any static web server. There is no build step, framework or network dependency; `npm run dev` starts a dependency-free one, and `npm run build` only copies `public/` verbatim into a throwaway, gitignored `game/`.

```sh
npm run dev
```

Then visit `http://localhost:8080/`. The game opens on the **main menu**, with the simulation paused. Choose a mode and CPU difficulty, read **How to play** (IT/EN), then press **Play**. The menu also includes **Credits** for the original author and Libre Arcade, with links to the original site and the port license. During a match, Menu gives access to language, audio, fullscreen, a new galaxy, restart and mode selection; Pause remains available. On touch devices, use the on-screen controls.

**Sound:** There is no background music. You should hear a short confirmation when you press **Play**, then shots and impacts during the game. The menu has an Audio On/Off switch, remembered between sessions. If you hear nothing, check the device volume, tab mute state and selected audio output.

Keyboard: ↑/↓ move, ←/→ aim, hold/release Space to shoot, Enter to use a bonus, Tab for a new galaxy. P/Esc pauses, M toggles audio, F toggles fullscreen, R restarts, C changes difficulty, 1/2/3 chooses the mode.

## Sources and preservation

The game uses GPLv3-compatible code inspired by the original HighMoon 1.2.4 (GPL-2.0-or-later). The original physics/CPU logic is checked against a native reference oracle; its historical source, license, changelog and archaeological research are preserved under `reference/` and `specs/` in the Libre Arcade repository. See `docs/ARCHITECTURE.md` for the implementation and `docs/FINAL_QA_RC5.md` for the current QA limits.

Visuals are newly drawn with Canvas and sounds are synthesized using Web Audio. Original graphic and audio files are **not included** in the published game because their individual provenance is not fully established; the original full-media archive is retained separately from the public repository.

## Development and release validation

```sh
npm test        # the deterministic regression suite
npm run check   # lint, then the suite
```

This is a release candidate, not a certification of total gameplay parity on all devices. Firefox, Safari/iOS and a live hosted-path smoke test remain open before a final `1.0.0` tag.
