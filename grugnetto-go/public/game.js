// game.js — shared mutable game state, plus a tiny pub/sub so the lit-html chrome
// (score/coins shown above the canvas, in app.js) can react to changes
// made deep inside melonJS entities without those entities depending on lit-html at all.
import * as me from "./vendor/melonjs-19.9.1.esm.js";

const listeners = new Set();

// Audio loads in the background, separately from the main preload gate (see resources.js for
// why) — a jump/coin/hurt sound can therefore be triggered before its clip has finished
// loading. me.audio.play()'s underlying getSoundOrThrow() throws in that case, which would
// otherwise crash whatever gameplay code (e.g. PlayerEntity.update()) just tried to play a
// cue. These wrappers make missing audio a silent no-op instead — sound is a nice-to-have
// here, never something gameplay should depend on succeeding.
export function playSound(name, loop) {
  try {
    me.audio.play(name, loop);
  } catch (e) {
    // not loaded yet (or audio unsupported) — skip the cue, not fatal
  }
}

export function playMusic(name, volume) {
  try {
    me.audio.playTrack(name, volume);
  } catch (e) {
    // not loaded yet (or audio unsupported) — skip the track, not fatal
  }
}

export function stopMusic() {
  try {
    me.audio.stopTrack();
  } catch (e) {
    // nothing playing / not loaded — nothing to stop
  }
}

// Master volume (0.0-1.0) — confirmed against melonJS 19.9.1's own source (audio.ts's
// setVolume() forwards straight to setGlobalVolume(), a single multiplier applied on top of
// every individual play()/playTrack() call's own volume, not a separate per-channel control) —
// same try/catch-as-silent-no-op pattern as playSound/playMusic/stopMusic above, since this can
// be called from app.js's settings screen before the engine has necessarily finished booting.
// Does NOT reach app.js's own raw-Web-Audio synthesized sounds (title screen grunt/jingle, the
// Arcade fanfare) — those bypass me.audio entirely (see their own comments for why) and scale
// their gain directly from settings.js's stored value instead.
export function setMasterVolume(volume) {
  try {
    me.audio.setVolume(volume);
  } catch (e) {
    // engine not booted yet — nothing to apply to; startEngine() re-applies this once it is
  }
}

// Starting life count for a fresh level attempt — see screens/play.js's loadLevel() (resets
// game.data.lives to this every time a level loads). Lives go down one at a time, both from
// falling into a pit (entities/player.js's respawn()) and from touching an enemy while not
// currently invincible (entities/player.js's hurt()).
export const STARTING_LIVES = 3;

// Arcade mode's own life count (see app.js's chooseArcade()/arcadeNextLevel()) — a single shared
// pool for the ENTIRE world1->world4 run, not reset per level the way Practice mode's
// STARTING_LIVES is (see screens/play.js's loadLevel() resetLives option). 8, not 3: a full,
// uninterrupted run is 32 levels long, so a per-level budget generous enough to make reaching the
// end feel achievable, not a first-level wall — same "arcade cabinet" framing as this mode's own
// name (limited continues, no free level-picking, game over sends you back to the title screen).
export const ARCADE_STARTING_LIVES = 8;

// How long a non-coin bonus pickup (apple/acorn/heart/key — see entities/bonus.js) makes the
// player immune to enemy contact, in ms. 8s: long enough to actually feel like a reward and
// carry the player past a cluster of enemies, short enough that it's a temporary boost, not a
// way to breeze through the rest of the level.
export const INVINCIBILITY_MS = 8000;

// Brief self-granted immunity right after taking an enemy hit, in ms — same game.data.invincibleUntil
// mechanism the bonus pickup uses above, just much shorter. Without this, standing inside a
// sensor enemy (no physical push-out — see entities/enemy.js) would drain a life every single
// frame of contact instead of once per encounter.
export const HIT_GRACE_MS = 1200;

// Super jump: a limited-charge extra mid-air jump. entities/player.js consumes one charge per
// airborne jump press (each press is its own edge-triggered isKeyPressed("jump") call — see that
// file's own comment on why a SECOND physically-stronger jump isn't how this works: melonJS's
// Body.update() hard-clamps vel.y to [-maxVel.y, maxVel.y] every single frame regardless of how
// vel.y was set, so no jump can ever exceed a normal jump's peak velocity — the "super" in "super
// jump" comes from re-triggering a full second (or third...) ascent before landing, not a stronger
// single kick). 5, not unlimited, and explicitly limited PER LEVEL, not per run — screens/play.js's
// loadLevel() and player.js's loseLife() both reset this back to SUPERJUMP_MAX, same "fresh
// attempt" treatment score/coins already get, so it's a per-ATTEMPT budget, not a one-time global
// currency.
export const SUPERJUMP_MAX = 5;

// --- Scoring variety (combo chain + level-completion bonuses) ------------------------------
// Four additions on top of the flat per-pickup point values coin.js/bonus.js/enemy.js already had,
// aimed at making scoring feel less flat: a combo multiplier for chaining pickups/stomps without
// getting hit, plus three one-time bonuses (speed, no-damage, full-coin-clear) evaluated once at
// goal.js's own "won" trigger.

// Every coin/stomp/bonus pickup adds 1 to game.data.combo (see addComboScore() below) — this is
// how many "steps" of COMBO_STEP each raises the multiplier by one, capped at
// COMBO_MAX_MULTIPLIER. 3 and x4: a player chaining ~9+ pickups in one uninterrupted streak (not
// an unreasonable ask on a coin-dense stretch of level) reaches the cap, rewarding sustained play
// without letting the multiplier run away to something that trivializes the base point values.
const COMBO_STEP = 3;
const COMBO_MAX_MULTIPLIER = 4;
// How long, in ms, a combo survives with no further pickups before resetting to 0 — checked every
// frame in entities/player.js's own update() (nothing else runs continuously enough to poll a
// timeout). 2.5s: long enough to cover ordinary platforming between pickups (a jump, a patrol
// enemy to route around), short enough that standing still doesn't just passively keep a streak
// alive.
export const COMBO_TIMEOUT_MS = 2500;

// Derives the current score multiplier from a raw combo count — exported so app.js's HUD can
// show the same "xN" a pickup is about to score without duplicating the formula.
export function comboMultiplier(combo) {
  return Math.min(1 + Math.floor(combo / COMBO_STEP), COMBO_MAX_MULTIPLIER);
}

// The one shared place every point-scoring pickup (coin.js/bonus.js/enemy.js's stomp()) routes
// through, instead of writing straight to game.data.score — centralizes the combo bookkeeping
// (increment, timeout timestamp, multiplier, notify) so none of those three files need to know
// this mechanic exists beyond calling this instead of `game.data.score += x`.
export function addComboScore(basePoints) {
  game.data.combo += 1;
  game.data.lastComboAt = Date.now();
  game.data.score += basePoints * comboMultiplier(game.data.combo);
  game.notify();
}

// Level-completion bonuses — all evaluated once, together, at goal.js's own "won" trigger; each
// result is stashed on game.data (lastTimeBonus/lastNoDamageBonus/lastCoinsBonus) purely so
// app.js's LevelCompleteOverlay() can show a breakdown of where the extra points came from,
// instead of the total just silently jumping. None of these three route through addComboScore()
// above — they're one-time end-of-level rewards, not chainable pickups, so combo-multiplying them
// would conflate two different mechanics for no real benefit.

// TIME_BONUS_MAX (500, roughly 5 coins' worth) decaying by TIME_BONUS_DECAY_PER_SEC (10) for
// every second the level took, floored at 0 — reaches 0 at 50s, comfortably past how long a
// normal, unhurried clear of one of these levels takes, so this rewards genuine speed without
// punishing a careful/cautious playstyle down to nothing.
export const TIME_BONUS_MAX = 500;
export const TIME_BONUS_DECAY_PER_SEC = 10;
// Flat bonus for finishing a level without losing a single life on the way — see
// entities/player.js's own constructor (resets game.data.tookDamageThisAttempt to false on every
// fresh PlayerEntity, which a reload always creates, whether from screens/play.js's loadLevel()
// or a mid-level death's own me.level.reload()) and loseLife() (sets it true).
export const NO_DAMAGE_BONUS = 200;
// Flat bonus for reaching the goal with every coin in the level collected. Every level currently
// has coinGoal:true (the flag itself won't even unlock without full collection — see
// goal.js's isUnlocked()), so in practice this fires on every successful clear today; it's kept
// as its own named, visible line item anyway (not just folded into a bigger coin value) in case a
// future level ever ships coinGoal:false, at which point this stops being automatic.
export const COIN_CLEAR_BONUS = 200;

const game = {
  data: {
    score: 0,
    coins: 0,
    totalCoins: 0,
    lives: STARTING_LIVES,
    superJumps: SUPERJUMP_MAX,
    invincibleUntil: 0, // epoch ms; player is immune to enemy contact while Date.now() < this
    status: "playing", // "playing" | "won" | "gameover"
    // Mirrors app.js's own uiState.mode (null | "practice" | "arcade") — kept here, not just in
    // app.js, so entities/player.js's loseLife() can read it without a reverse import (app.js
    // already imports game.js, not the other way around). Only reason this exists: Arcade mode's
    // score needs to survive a life lost mid-level (see loseLife()'s own comment), and that
    // decision has to be made from inside player.js, which has no other way to know which mode
    // is currently running.
    mode: null,
    combo: 0, // consecutive pickups/stomps with no hit and no COMBO_TIMEOUT_MS gap — see comboMultiplier()
    lastComboAt: 0, // epoch ms of the most recent combo-extending pickup, for the timeout check above
    levelStartedAt: 0, // epoch ms, set by screens/play.js's loadLevel() — TIME_BONUS_MAX's own clock
    tookDamageThisAttempt: false, // see entities/player.js's constructor/loseLife()
    lastTimeBonus: 0,
    lastNoDamageBonus: 0,
    lastCoinsBonus: 0,
  },
  texture: null,

  onChange(fn) {
    listeners.add(fn);
  },

  notify() {
    listeners.forEach(fn => fn(game.data));
  },
};

export default game;
