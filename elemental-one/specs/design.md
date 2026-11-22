# Elemental One: restoration design

This is a **restored** game in the collection's sense (see the root `AGENTS.md`): the original JavaScript, levels and art are used as shipped, with a separate integration layer around them. There is no port-map because nothing was re-implemented.

## Decisions, in the order the task's M3 asks them

| Step | Decision | Why |
|---|---|---|
| A. Run the original with its own Phaser | **Done and sufficient.** Upstream's page runs as-is in current Chrome (one harmless console error, see below) | Nothing to repair in the game |
| B. Repair confirmed browser incompatibilities | **None in the game.** | The only real defect is inside Phaser's audio decode (double `decodeAudioData`); it does not affect play, so Phaser stays byte-identical |
| C. Replace obsolete infrastructure | **Browserify/Grunt/page shell only.** `tools/bundle.mjs` re-wraps the six unchanged `src/*.js` files in a tiny CommonJS prelude, so `public/js/game.js` is what Browserify would produce | The game needs no build step to *play*; the bundle is committed |
| D. Re-implement components | **None** | |

Phaser was **retained** (1.1.3, byte-identical). All 2,011 lines of upstream's `src/` are preserved byte for byte.

## Structure

```
public/
  index.html          shell: title, bar, canvas holder, touch pads, modal
  css/arcade.css      layout, scaling, @font-face for the replacement font
  js/i18n.js          EN/IT strings (UI + in-game texts keyed by the original English)
  js/arcade.js        integration layer: start, pause, mute, restart, language, touch, scaling
  js/phaser.js        Phaser 1.1.3, unchanged
  js/game.js          the six upstream modules, unchanged, in a CommonJS wrapper
  assets/             upstream art, music, effects, tilemaps (jump.wav replaced)
  fonts/              Jersey 10 (OFL) replacing Minecraftia
```

The integration layer sits entirely outside the game and reaches in through three public hooks only:

1. `Phaser.GAMES[0]` (Phaser's own registry) for `game.paused`, `game.sound.mute`, `game.state.start(game.level)`;
2. synthetic `keydown`/`keyup` events on `window` for the touch buttons: the original reads the keyboard through Phaser's `Keyboard` object, so a touch press is the very same input as a key press (`Left/Right/Up/Down`, `Z`, `X`, `Space`, `Enter`);
3. a wrapper around `Phaser.GameObjectFactory.prototype.text`, installed before the game script loads, which swaps a string for its Italian version when the language is Italian. The dictionary is keyed by the original English strings, so the historical source does not change and English stays exactly upstream's text.

## Behaviour decisions

- **Start.** The game is not created until Play is pressed (browsers need a user gesture before audio anyway). After that the historical title screen ("ELEMENTAL ONE / press enter") runs untouched. Upstream does `window.onload = boot`; since the scripts load after the real `load` event, `arcade.js` waits for `Phaser.GAMES[0].isBooted` and calls that handler itself, **once**. A first draft also let the real `load` event fire it a second time on `#play` reloads and that broke level loading (tilemaps missing); the shell now only starts after `load`.
- **Restart level** calls `game.state.start(game.level)`, the same call upstream uses to move between levels. On the end screen (black stage on level 4) it reloads, because upstream's `isDone` flag is never cleared (the author's own comment says changing state "fails completely on the last level"). That quirk is preserved.
- **Menu** reloads the page to the shell title; **language switch** during a game reloads into the historical menu, because texts are created per level.
- **Pause** uses Phaser's `game.paused`. Upstream has no pause; this does not change simulation, it stops it.
- **Mute** uses `game.sound.mute` and is remembered in `localStorage` (when available).
- **Keys:** arrows, `Z`, `X`, `Space`, `Enter` exactly as upstream; plus `P` pause and `M` mute (unused by the game).
- **Language:** English unless `navigator.language` starts with `it`; a choice made with the IT/EN button is remembered; `?lang=it|en` overrides.
- **Scaling:** the 800×600 canvas is never resized, its holder is scaled with a CSS transform to fit the space the page leaves it. The simulation resolution and physics are untouched.
- **Touch:** shown on coarse-pointer devices or after the first touch (`?pads=1` forces it). In landscape the buttons sit left and right of the screen, in portrait below it, so they never cover the game. Multi-touch works through Pointer Events (walk and jump at once).
- **Background and page chrome** of the original page (star pattern, footer) are replaced by the shell; the star pattern had no licence on record.

## Replaced assets

- **Minecraftia → Jersey 10.** Upstream's source names the CSS family `minecraftiaregular` in 6 places (`data.js`, `main.js`). `css/arcade.css` declares that family from the OFL font, with `size-adjust: 125%` so the unchanged 18/25/45 px text is about as large as before. No source edit.
- **`jump.wav`.** Same path, new content (`tools/make-jump.mjs`, a short rising square-wave chirp, deterministic).

Details and evidence: `LICENSE-AUDIT.md`.

## Known issues kept on purpose

- `DataCloneError: Cannot decode detached ArrayBuffer` appears once in the console (Phaser 1.1.3 decodes a sound twice). Audio plays.
- No restart or progress saving inside the game itself beyond the shell's restart button; no death, enemies or score exist upstream.
- After the end screen nothing can be played until the page reloads (upstream behaviour).

## Out of scope by design

New levels, enemies, abilities, scoring, rebalancing, WebGL, replacing Phaser.
