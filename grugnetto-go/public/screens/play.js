import * as me from "../vendor/melonjs-19.9.1.esm.js";
import game, { playMusic, STARTING_LIVES, SUPERJUMP_MAX } from "../game.js?v=11";

// Loads a specific compiled level (a "tmx" resource name registered in resources.js — see
// worlds.js for which resource name belongs to which world/level) and resets gameplay state for
// it. Exported (not just called from onResetEvent below) because it's also called directly by
// app.js whenever the player picks a level while the engine is ALREADY running
// (next-level, or re-entering level-select and picking a different level) — melonJS's own
// me.state.change() is a no-op when the target state is already the current one (confirmed
// against the 19.9.1 source: state.ts's change() early-returns via isCurrent()), so a second
// me.state.change(me.state.PLAY) would never re-fire onResetEvent. Calling me.level.load()
// directly is melonJS's own supported mechanism for this — confirmed against level.js's
// safeLoadLevel(), which resets the container/world and destroys the previous level's content
// before adding the new one, so no manual cleanup is needed here.
// `resetLives`/`startingLives` exist for Arcade mode (see app.js's arcadeNextLevel()): its whole
// premise is a single shared life pool across the entire world1->world4 run, not a fresh set per
// level the way Practice mode (and every call before this option existed) works — so advancing to
// the next level in that mode must carry game.data.lives forward unchanged instead of resetting
// it. `resetScore` is the same idea for score (Arcade's score is meant to persist across the whole
// run) — kept as its OWN separate flag rather than reusing resetLives, since app.js's
// arcadeNextLevel() needs both true at once for BOTH normally, but they're conceptually
// independent (score and lives are different resources; a future call site might want to reset
// one without the other). Defaults preserve the original always-reset behavior for every other
// caller (Practice mode's selectLevel()/nextLevel()/retryLevel(), and Arcade's own very first
// level, which DOES still want a fresh 0 to start the run from).
export function loadLevel(resource, music, { resetLives = true, startingLives = STARTING_LIVES, resetScore = true } = {}) {
  if (resetScore) {
    game.data.score = 0;
  }
  // Unlike score above, coins/totalCoins ALWAYS reset here, every level, regardless of mode —
  // this isn't a scoring choice, it's just factually correct: it tracks THIS level's own
  // coinGoal progress (see goal.js's isUnlocked()), and a freshly loaded level's CoinEntity
  // objects are all back to uncollected regardless of what happened on the last one. Letting a
  // persistent-score Arcade run also carry `coins` forward would silently break coinGoal on
  // every level after the first (already "enough" coins before collecting any of the new ones).
  game.data.coins = 0;
  if (resetLives) {
    game.data.lives = startingLives;
  }
  // Unconditional, unlike lives above — super jumps are explicitly limited PER LEVEL, not per-run,
  // so this resets on every level load regardless of Arcade mode's resetLives:false
  // (which only exists to carry the LIFE pool across levels, a separate, deliberately different
  // resource — see game.js's own SUPERJUMP_MAX comment).
  game.data.superJumps = SUPERJUMP_MAX;
  // A bonus-granted (or post-hit) immunity window shouldn't carry over into a freshly (re)loaded
  // level either — same reasoning as lives above.
  game.data.invincibleUntil = 0;
  // Combo is a moment-to-moment skill streak, not a persistent resource — unlike score, it always
  // resets here regardless of mode (same reasoning as superJumps above). levelStartedAt feeds
  // TIME_BONUS_MAX's own clock, so it needs a fresh timestamp every level too. The 3 "last*Bonus"
  // fields are cleared so a freshly loaded level's complete screen (once it's eventually reached)
  // doesn't briefly show the PREVIOUS level's breakdown numbers before goal.js recomputes them.
  game.data.combo = 0;
  game.data.lastComboAt = 0;
  game.data.levelStartedAt = Date.now();
  game.data.lastTimeBonus = 0;
  game.data.lastNoDamageBonus = 0;
  game.data.lastCoinsBonus = 0;
  game.data.status = "playing";
  game.notify();

  // playTrack() auto-loops and replaces whatever the "current track" was (e.g. after
  // GoalEntity's stopTrack()+win jingle, a level reload here should bring the bgm back).
  // Kept quieter than the default SFX volume so it doesn't drown out jump/coin/hurt cues.
  // `music` is resolved by the caller from worlds.js's own per-world "music" field — falls back
  // to world1's track if a caller ever forgets to pass one, rather than silently playing nothing.
  playMusic(music || "bgm-world1", 0.4);

  // me.level.load() is only synchronous when the game loop isn't already running (confirmed
  // against level.js: if state.isRunning() it defers the actual load to a setTimeout(0) instead,
  // so state read immediately after the call would be stale on every call site EXCEPT the very
  // first one from onResetEvent below, where the loop hasn't started yet). The onLoaded callback
  // fires after the level's objects actually exist in both the sync and deferred case, so reading
  // totalCoins there instead of right after the call is correct regardless of which branch ran.
  // Every CoinEntity keeps the "CoinEntity" name compile-level.py gave its Tiled object (that
  // name is also how me.pool picks which class to spawn in the first place), so getChildByProp
  // reads it straight off the world without importing the CoinEntity class just to count them.
  me.level.load(resource, {
    onLoaded: () => {
      game.data.totalCoins = me.game.world.getChildByProp("name", "CoinEntity").length;
      game.notify();
    },
  });
}

class PlayScreen extends me.Stage {
  // `resource`/`music`/`options` arrive via me.state.change(me.state.PLAY, false, resource,
  // music, options)'s extraArgs — confirmed against state.ts: change() forwards ...extraArgs
  // straight into the target Stage's onResetEvent(app, ...extraArgs). Only used for the very
  // first level of a session; every subsequent level load bypasses this Stage lifecycle entirely
  // (see loadLevel() above). `options` (loadLevel()'s own resetLives/startingLives) matters here
  // too, not just on later calls: if the player's very first pick this page load is Arcade mode,
  // THIS is the call that has to seed game.data.lives with ARCADE_STARTING_LIVES instead of the
  // Practice-mode default — app.js's selectLevel() forwards whatever it was given straight
  // through to start()/startEngine() for exactly this reason.
  onResetEvent(app, resource, music, options) {
    loadLevel(resource, music, options);
  }
}

export default PlayScreen;
