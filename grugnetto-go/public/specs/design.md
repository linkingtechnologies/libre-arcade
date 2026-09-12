# Grugnetto Go! — design

(project/folder codename remains "grugnetto-go" throughout the codebase — file paths, dashboard id, JS identifiers, etc. are all unchanged; only the player-visible name changed.)

## Structure

Two modes, chosen on `mode-select` (reached via `title`'s "Play" button), diverge from there:

```
                              +-- (Practice) --> world-select --pick world--> level-select --pick level-->+
title --Play--> mode-select --+                                                                           +--> loading --> playing --reach goal--> level-complete
                              +-- (Arcade) -----------------------------------------------------------------> (always world1/level1)
```

- **Practice** (`uiState.mode = "practice"`): identical to the original single-mode flow — any world, any level, freely, own `STARTING_LIVES` (3) per attempt. No lock on any world (see `progress.js`'s own header comment on why the old completion-gated lock was removed — this mode's whole point is trying anything freely).
- **Arcade** (`uiState.mode = "arcade"`): skips `world-select`/`level-select` entirely. Always starts at world1/level1; `level-complete` auto-advances to the next level in the GLOBAL sequence (crossing world boundaries — see `worlds.js`'s `findNextGlobalLevel()`) via a single button, no free pick. One shared life pool for the whole run (`ARCADE_STARTING_LIVES` = 8, `game.js`) — `screens/play.js`'s `loadLevel()` only resets `game.data.lives` when told to (`resetLives` option), so advancing between Arcade levels carries it forward instead. Both `gameover` (lives exhausted) and finishing the last level of world4 return straight to `title` (`backToTitleFromRun()`) — there's no level-select to fall back to in this mode, and no HUD "back" button during `playing` either (see `App()`'s own comment on why).

Forward path only — every screen after `title` also has a way back (except Arcade's `playing`, see above):
- `mode-select`: "Back" returns to `title`.
- `world-select` (Practice only): "Back" returns to `mode-select`.
- `level-select`: "Back" returns to `world-select`.
- `playing` (Practice only): the HUD's back button returns to `level-select` (current attempt discarded, overall progress unaffected).
- `level-complete` (Practice): "Level select" returns to `level-select`; "World select" returns to `world-select`; "Next level" (only shown if the world has one) loops straight back into `loading`/`playing` for the following level — no intermediate screen.

There is no path back to `title` from anywhere but a fresh visit (Practice) or finishing/losing a run (Arcade) — not needed otherwise, since `title` is only an entry gate.

## State shape

All navigation/progression state lives in `app.js`'s `uiState` — deliberately kept out of `game.js`'s `game.data`, which stays scoped to in-level HUD numbers (score/coins/status/etc.) exactly as before this feature:

```js
uiState = {
  loadError: null,          // fatal init error message, if any
  isFullscreen: false,
  engineReady: false,       // true once me.video.init() has succeeded — gates the fullscreen button
  engineBootStarted: false, // true once the lazy engine boot has been kicked off (guards a double me.video.init())
  screen: "title",          // "title" | "mode-select" | "world-select" | "level-select" | "credits" |
                             // "loading" | "playing" | "level-complete" | "gameover"
  mode: null,                // null | "practice" | "arcade" — set on mode-select, read by
                             // LevelCompleteOverlay()/GameOverOverlay()/App()'s HUD to branch behavior
  currentWorld: null,       // world id string, set when a level is picked (Arcade updates this too, as it crosses worlds)
  currentLevel: null,       // level number, set when a level is picked
}
```

`game.js`'s `game.data` — the actual in-level gameplay state, shared between the melonJS entities and the lit-html HUD through `game.js`'s own `onChange(fn)`/`notify()` pub/sub (every mutation is followed by a `notify()` call so the HUD re-renders):

```js
game.data = {
  score: 0,
  coins: 0,                     // this level's collected count
  totalCoins: 0,                // this level's total, read from the loaded level's own CoinEntity count
  lives: STARTING_LIVES,        // 3 in Practice (per attempt); one shared ARCADE_STARTING_LIVES (8) pool for a whole Arcade run
  superJumps: SUPERJUMP_MAX,    // 5 — per-attempt budget of extra mid-air jumps, see "Other technical notes"
  invincibleUntil: 0,           // epoch ms; player ignores enemy contact while Date.now() < this
  status: "playing",            // "playing" | "won" | "gameover"
  mode: null,                   // mirrors uiState.mode — see "Other technical notes" for why this is duplicated here
  combo: 0,                     // consecutive pickups/stomps with no hit and no COMBO_TIMEOUT_MS gap
  lastComboAt: 0,                // epoch ms of the most recent combo-extending pickup
  levelStartedAt: 0,             // epoch ms, set on every level load — TIME_BONUS_MAX's own clock
  tookDamageThisAttempt: false,  // NO_DAMAGE_BONUS eligibility for the current attempt
  lastTimeBonus: 0,              // last level-complete's computed bonuses, for the breakdown shown there
  lastNoDamageBonus: 0,
  lastCoinsBonus: 0,
}
```

`games/grugnetto-go/worlds.js` — the world/level content registry (plain data, not state). All 4 shipped worlds currently carry 8 levels each (32 total — see `chooseArcade()`'s own comment on why `ARCADE_STARTING_LIVES` is sized the way it is):

```js
[
  { id: "world1", music: "bgm-world1", accent: "#48c774", emoji: "🌼", levels: [ /* 8 */ ] },
  { id: "world2", music: "bgm-world2", accent: "#3298dc", emoji: "🐿️", levels: [ /* 8 */ ] },
  { id: "world3", music: "bgm-world3", accent: "#e6b800", emoji: "🏜️", levels: [ /* 8 */ ] },
  { id: "world4", music: "bgm-world4", accent: "#f14668", emoji: "⛏️", levels: [ /* 8 */ ] },
]
```
Each level entry is `{ level, resource }`; `resource` is the exact name a level was registered under as a `"tmx"` resource in `resources.js`. `music` names one of `resources.js`'s `audioResources` entries. `accent` matches `tools/compile-level.py`'s own goal-flag color for that world (ties the world-select tile to what the player actually sees in-level); `emoji` is a quick, font-independent visual hook. A world with an empty `levels` array renders as "coming soon" (see use-case.md's status classification) — not currently true for any shipped world, but still a live, reachable code path for whatever world is added next.

**No `name` field on worlds or levels** — display names go through `t()` instead, keyed off each world's own stable `id` (`grugnettogo.world.<id>.name` — "Prato di Casa"/"Home Meadow", "Bosco degli Scoiattoli"/"Squirrel Forest", "Dune Dorate"/"Golden Dunes", "Miniera di Pietra"/"Stone Mine") and a shared numbered-level template (`grugnettogo.level.number`, "Livello %s"/"Level %s") — requested live ("dobbiamo prevedere nome dei mondi anche in inglese"), since a raw string baked into this plain-data file could only ever be one language. See "Other technical notes" for the language-switcher this feeds into.

`games/grugnetto-go/progress.js` — persisted completion tracking only, `localStorage` key `"libre-arcade:grugnetto-go:progress"`:
```json
{ "world1": { "1": true, "2": false, "3": true }, ... }
```
Exposes only `isLevelComplete(worldId, level)` and `markLevelComplete(worldId, level)` — no lock/unlock computation lives here anymore (see "Other technical notes").

`games/grugnetto-go/settings.js` — persisted player preferences, same isolation pattern as `progress.js`, `localStorage` key `"libre-arcade:grugnetto-go:settings"`:
```json
{ "volume": 1, "lang": null }
```
`volume` is `0.0..1.0`. `lang` is `null` (follow the browser/host default) until the player explicitly picks one via the standalone page's language selector — see "Other technical notes".

## Tables involved

None. This SPA makes no `WorkTableClient` calls.

## Adding a level (content-author-facing)

1. Author a level-design JSON (`games/grugnetto-go/assets/worlds/LEVEL_FORMAT.md`), compile it with `tools/compile-level.py`, drop the output next to the existing `games/grugnetto-go/assets/world*-level*.json` files (see `resources.js`'s own comment on the `worldN-levelN` naming convention).
2. Register it as a `"tmx"` resource in `resources.js` (existing convention, unchanged by this feature).
3. Add one entry to the relevant world's `levels` array in `worlds.js`.

No other file needs to change — world-select/level-select/progress-gating all read from `worlds.js` and `progress.js`, not from anything hardcoded per-level.

## Other technical notes

- **Progress is intentionally local-only for now** (`localStorage`, not `WorkTableClient`) — see `plugins/libre-arcade/AGENTS.md`'s Data Access section, which explicitly sanctions this for a game that doesn't need shared/server data. `progress.js`'s public functions are the only thing every screen calls — deliberately never a raw `localStorage.getItem`/`setItem` outside that one file — specifically so a future move to account-bound, server-side progress only means rewriting that module's internals.
- **The engine boots lazily**, on the first level pick, not at page load — `me.video.init()` + `me.loader.preload()` only run once the player has actually chosen to play something, so title/world-select/level-select render instantly with no asset dependency.
- **`me.state.change(me.state.PLAY, ...)` is a no-op once already in the PLAY state** (confirmed against melonJS 19.9.1's own source — `state.ts`'s `change()` early-returns via `isCurrent()`). Every level switch after the very first one therefore calls `games/grugnetto-go/screens/play.js`'s exported `loadLevel(resource)` directly instead of going through `state.change()` again.
- **`me.level.load()` is only synchronous when the game loop isn't already running** (confirmed against `level.js`: it defers to a `setTimeout(0)` otherwise). `loadLevel()` reads `game.data.totalCoins` from `me.level.load()`'s own `onLoaded` callback rather than immediately after the call, so it's correct on both the very-first-level (synchronous) and every-later-level (deferred) path.
- **`#grugnetto-go-wrapper` is never conditionally removed from the lit-html template** — only its `display` style toggles between the screens that need the game canvas visible (`loading`/`playing`/`level-complete`) and the ones that don't. melonJS appends its `<canvas>` into `#grugnetto-go-screen` via a raw DOM call, entirely outside lit-html's own diffing; conditionally re-creating that div would orphan the canvas, since `me.video.init()` can only run once per page.
- **Practice mode has no world-lock at all** (requested live: "posso provare tutti i livelli" — try every level). `progress.js` used to expose `isWorldComplete()`/`isWorldUnlocked()` for exactly this gating; both were deleted once the Practice/Arcade split made world-select Practice-only and nothing called them anymore (see that file's own header comment). `isLevelComplete()`/`markLevelComplete()` stay — completion tracking (level-select's checkmarks) is unrelated to locking.
- **Arcade mode's shared life pool is threaded through `loadLevel()`'s own options**, not a second code path: `screens/play.js`'s `loadLevel(resource, music, { resetLives, startingLives })` defaults to resetting to `STARTING_LIVES` (matches every pre-Arcade caller unchanged); `app.js`'s `chooseArcade()`/`arcadeNextLevel()` are the only callers that ever pass `{ resetLives: false }` (between Arcade levels) or `{ resetLives: true, startingLives: ARCADE_STARTING_LIVES }` (Arcade's own first level). The very first level of a session goes through a different call path (`me.state.change()` → `PlayScreen.onResetEvent()`, not a direct `loadLevel()` call — see the `me.state.change()` bullet below), so `options` had to be threaded as a 3rd `extraArgs` entry there too, or picking Arcade as literally the first thing done on a fresh page load would've silently seeded 3 lives instead of 8.
- **Super jump is a limited-charge extra mid-air jump, not a literally stronger one** — melonJS's `Body.update()` hard-clamps `vel.y` to `[-maxVel.y, maxVel.y]` every single frame regardless of how it was set (confirmed by reading the vendored bundle directly), so no jump can ever exceed a normal jump's peak velocity; the "super" comes from re-triggering a full extra ascent before landing, stacking real height a single jump can't reach. `game.js`'s `SUPERJUMP_MAX` (5) is a per-LEVEL budget (requested live: "deve essere limitata per livello") — `screens/play.js`'s `loadLevel()` resets it unconditionally, every level, regardless of mode (unlike `lives`/`score`, which Arcade mode can carry forward — see the next bullet), and `entities/player.js`'s `loseLife()` resets it too, same "fresh attempt" treatment `coins` already gets. `entities/player.js`'s `update()` calls `me.input.isKeyPressed("jump")` exactly once per frame into a local, not inline in each branch's own `if` — it's edge-triggered with a side effect (`bindKey`'s `lock` flag), so a second separate call in the same frame would always see the press already consumed and silently return `false`, even for a genuinely fresh press.
- **Arcade mode's score is persistent for the whole run, not per-level** (requested live: "volevo un punteggio persistente per l'arcade") — `screens/play.js`'s `loadLevel(resource, music, { resetScore })` is its own flag, deliberately separate from `resetLives` even though `chooseArcade()`/`arcadeNextLevel()` always pass matching values for both (score and lives are conceptually different resources). `coins`/`totalCoins` are NOT part of this — they always reset every level regardless of mode, since they track THIS level's own `coinGoal` progress (see `goal.js`'s `isUnlocked()`); letting them persist would silently break `coinGoal` on every level after the first in a run (already "enough" coins before collecting any of the new ones). The trickier half: `entities/player.js`'s `loseLife()` ALSO needs to skip zeroing `score` in Arcade mode (a life lost mid-level shouldn't wipe a whole run's score) — but that decision has to be made from inside `player.js`, which has no visibility into `app.js`'s `uiState.mode`. Solved by mirroring the mode onto `game.data.mode` (set alongside `uiState.mode` at all 3 of its call sites: `choosePractice()`, `chooseArcade()`, `backToTitleFromRun()`) — the same shared-state-hub pattern `game.data` already uses for `status`/`lives`/`coins` between the UI and the entities.
- **No CDN, at all, at runtime.** melonJS, lit-html, Bulma, and Remix Icon are all vendored under `games/grugnetto-go/vendor/` (pinned filenames like `melonjs-19.9.1.esm.js` bake the exact version in) instead of loaded from jsDelivr — every `.js` file that touches melonJS imports it from a relative `vendor/` path (`./vendor/...` at the folder root, `../vendor/...` from `entities/`/`screens/`), and `index.html` points its Bulma/Remix Icon `<link>`s there too. `vendor/melonjs-19.9.1.esm.js` is jsDelivr's own `+esm` bundle output saved as a static file, not a hand-rolled build — melonJS's real npm build (`build/index.js`) uses bare `core-js`/`howler` import specifiers that only resolve via Node/bundler resolution, so the `+esm` transform (which inlines those deps into one flat browser-ready file) is a genuine, necessary step, not just a CDN proxy being cut out. `vendor/lit-html-3.3.2.js` is a byte-identical copy of the Camila framework's own already-vendored `camila/js/lit-html/lit-html.js`. `vendor/remixicon-4.9.1.css` was trimmed to a woff2-only `@font-face` (dropped eot/woff/ttf/svg — this app already requires "a modern browser"). Upgrading any of these later means re-running the same fetch-and-swap, not touching a build pipeline (there isn't one).
- **Player hitbox is a plain `me.Rect`, not a tapered `me.Polygon`**, despite the sprite's feet visibly being narrower than its head — a trapezoid was tried (to stop the feet floating past a ledge edge, purely cosmetic) and reverted after it broke landings on `bridge` platforms specifically (27px collision height, the thinnest in the game — reported live as "non riesco più a salire sul ponte"). Root cause (reasoned from melonJS's SAT implementation, not directly debugged live): a rectangle only has 2 candidate separating axes; a trapezoid's two slanted edges add 2 more, which can make SAT resolve a shallow overlap along a diagonal axis instead of straight up when the platform being landed on is thin enough that the "correct" vertical axis and a diagonal axis are both plausible. The cosmetic float-past-the-edge issue is an accepted tradeoff — a real fix would need a different approach (e.g. a rect that's simply narrower than the full sprite width, not tapered) if it's ever worth revisiting.
- **Scoring variety: a combo multiplier plus three level-completion bonuses**, added together (requested live: "capire se ci sono altre idee per rendere il punteggio più variabile"). `game.js` owns all of it: `addComboScore(basePoints)` (called by `coin.js`/`bonus.js`/`enemy.js`'s `stomp()` instead of each touching `game.data.score` directly) increments `game.data.combo`, multiplies by `comboMultiplier(combo)` (`1 + floor(combo/3)`, capped at x4), and resets on a 2.5s gap with no pickup (`COMBO_TIMEOUT_MS`, checked every frame in `player.js`'s `update()`) or on `loseLife()`. The HUD shows a `"Combo x%s"` tag only while `game.data.combo > 0`. Separately, `goal.js`'s `onCollision()` computes three flat bonuses once, at the moment of winning — a decaying time bonus (`TIME_BONUS_MAX` 500, minus `TIME_BONUS_DECAY_PER_SEC` 10 per elapsed second since `game.data.levelStartedAt`, floored at 0), a flat no-damage bonus (`NO_DAMAGE_BONUS` 200, gated on `game.data.tookDamageThisAttempt` staying false the whole attempt), and a flat coin-clear bonus (`COIN_CLEAR_BONUS` 200, gated on having every coin). These are intentionally NOT routed through `addComboScore()` (they're one-off rewards for the whole level, not a chained pickup), stashed on `game.data.lastTimeBonus`/`lastNoDamageBonus`/`lastCoinsBonus` so `app.js`'s shared `BonusBreakdown()` can list only the ones that actually fired on both `LevelCompleteOverlay()` branches. Worth noting: since `coinGoal: true` is universal across levels (see `goal.js`'s `isUnlocked()`), the coin-clear bonus fires on essentially every successful clear, not just as a rare achievement — it's still a real, named line item, just less "variable" in practice than the time/no-damage bonuses.
- **Enemy stomp hitboxes are deliberately shorter than the sprite's real silhouette for several kinds**, not full-tile — `entities/enemy.js`'s `KINDS` table measures each kind's actual alpha-channel bounding box (union across its rest/walkA/walkB frames) directly off the PNGs on disk, then for kinds whose measured box leaves only a few px of headroom above the stomp sensor, deliberately overrides it shorter anyway ("err toward more forgiving than the art strictly implies"): `saw` (measured 0px headroom, a full-tile circular blade) and `barnacle` (measured 3px headroom at the peak of its attack_b lunge frame) both got pushed to `h:50` (14px headroom) after being reported as practically unstompable ("se salto sopra questo nemico non lo uccido" / "non riesco ad uccidere il serpente saltandoci sopra" — no literal "snake" kind exists; `barnacle`, this roster's only elongated attacking creature, was the closest match). `frog` is the one exception left at the full-tile default (also 0px measured headroom) since nobody's reported it as a problem — it reads as something to route around, not hop over.
- **Enemies fall into 3 behavior modes**, per-kind in `entities/enemy.js`'s `KINDS` table (`behavior`, default `BEHAVIOR_PATROL` when unset), driven by each world manifest's own prose (`assets/worlds/*.json`) rather than auto-derived from it — that text is free-form description for humans, not a machine-readable enum, so each kind's `behavior` field is a deliberate, explicit translation of it: **patrol** (default — slides back and forth within a Tiled-object-driven `[minX, maxX]` lane, e.g. slime/snail/ladybug/worm/mouse/fish/bee/fly), **stationary** (`saw`, `barnacle` — never moves; a spinning/animated frame-swap alone reads as "active" without sliding sideways), and **jump** (`frog` — alternates a rest pause with a timed horizontal hop burst, `updateJump()`). All 3 modes converge on the same `EnemyEntity.onCollision()`/`stomp()` contract regardless of behavior — a stomp always defeats the enemy and awards `STOMP_POINTS` through `addComboScore()`, any other contact always calls the player's `hurt()`, unless the player is currently invincible.
- **A level's goal flag is locked until every coin in that level has been collected**, when the level's `coinGoal` property is set (currently `true` on every shipped level, via `compile-level.py`) — `entities/goal.js`'s `isUnlocked()` (`!this.coinGoal || game.data.coins >= game.data.totalCoins`) gates `onCollision()`: touching a still-locked flag plays a "denied" cue (rate-limited to avoid spamming it every frame of continued overlap) and does nothing else; the flag itself renders visibly dimmed while locked, back to full brightness the instant it unlocks, so the requirement reads as an intentional design choice rather than a bug.
- **On-screen touch controls use melonJS's own `me.input.triggerKeyEvent(keyCode, status)`**, not a hand-rolled input path — confirmed against the pinned 19.9.1 source (`packages/melonjs/src/input/keyboard.ts`): it's the library's own documented way to simulate a real key press/release, calling the exact same internal handlers a real `KeyboardEvent` would. Concretely, this means `player.js` needed zero changes — `isKeyPressed()` and the `bindKey()` "lock" edge-triggering the super-jump mechanic depends on both behave identically whether a press came from a physical key or a tap on `app.js`'s `TouchControls()` buttons. `HAS_TOUCH` (`"ontouchstart" in window || navigator.maxTouchPoints > 0`) is computed once as a device-capability check, not per-render; the overlay only renders during `"playing"`, bottom-left move pair + bottom-right jump, and is a plain sibling of the HUD overlay (same "absolutely-positioned, `pointer-events:none` on the wrapper / `auto` on the actual buttons" pattern).
- **Master volume is two separate mechanisms, not one**, because this game has two separate audio systems that don't share a channel — requested live ("mettiamo... 5" against a readiness review that flagged no volume control at all). `game.setMasterVolume(volume)` wraps `me.audio.setVolume()` (confirmed against melonJS 19.9.1's `audio.ts`: a single `0.0..1.0` multiplier applied on top of every individual `play()`/`playTrack()` call's own volume, not a per-channel control) — this reaches every sound routed through `me.audio` (jump/coin/hurt/bump SFX, the 4 world bgm tracks, the plain "win" jingle). It does NOT reach `app.js`'s own raw-Web-Audio synthesized cues (title screen grunt/jingle, the Arcade fanfare — see their own comments for why they bypass `me.audio` entirely); those instead scale their own gain nodes directly via `app.js`'s `synthGain(basePeak)` helper, reading the same `settings.js` value. Both paths are applied from the same single source of truth (`settings.getVolume()`), just through two different mechanisms, because there's no single volume knob that covers both audio systems at once.
- **The language switcher is standalone-page-only, by design** — the Camila-hosted tab's language comes from the surrounding dashboard session (`$_CAMILA['lang']`, PHP-side, same as every other plugin here), and this game overriding that on its own would be inconsistent with how the rest of the app behaves. `index.html`'s own inline bootstrap script is the only place `window.setGrugnettoLanguage()` / `window.grugnettoAvailableLanguages` / `window.grugnettoCurrentLanguage` ever get defined (it's already the one populating `window.I18N` in the first place, unlike the PHP-driven hosted case) — `app.js`'s `SettingsScreen()` checks for their mere presence to decide whether to show the language field at all, rather than checking `window.APP_CONFIG` or any other indirect proxy for "which hosting mode is this."
