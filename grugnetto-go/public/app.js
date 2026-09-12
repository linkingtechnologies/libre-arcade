// app.js — Grugnetto Go!'s entry point. Lives inside games/grugnetto-go/ alongside every other
// file the game needs (assets included, see resources.js's own BASE) specifically so this whole
// folder is self-contained and portable: copy it anywhere a web server can serve static files
// and it runs — nothing here reaches outside this directory, not even over the network (see
// vendor/ below). dashboard-grugnetto-go.inc.php (the Camila-hosted tab) and index.html (the
// standalone fullscreen launcher, see its own comment) both just load this same file as a
// module; neither is a separate copy of the game logic.
//
// melonJS/lit-html used to be loaded straight from jsDelivr's CDN here — switched to vendored
// local copies (games/grugnetto-go/vendor/) per explicit request ("vorrei evitare CDN"): both
// this Camila-hosted tab AND the standalone index.html now work with zero outbound network
// calls, not just "portable to any web server" (the previous, weaker guarantee — a server
// without internet access, or a user's browser with third-party requests blocked, could still
// break the game before this). vendor/melonjs-19.9.1.esm.js is jsDelivr's own "+esm" bundle
// output saved as a static file (not just a redirect target) — melonJS's real npm build
// (build/index.js) uses bare "core-js"/"howler" import specifiers that only resolve via
// Node/bundler resolution, not in a plain browser <script type=module>; the +esm bundle is a
// real, necessary transform (inlines those deps into one flat file), not merely a CDN proxy —
// confirmed by fetching it directly and checking for zero further from"https://... imports
// inside, i.e. it's fully self-contained already. vendor/lit-html-3.3.2.js is a byte-identical
// copy of camila/js/lit-html/lit-html.js — the Camila framework's own already-vendored,
// version-verified stock lit-html build (see that file's own litHtmlVersions push("3.3.2")),
// reused here instead of fetching a second copy from CDN.
import { html, render } from "./vendor/lit-html-3.3.2.js";
import * as me from "./vendor/melonjs-19.9.1.esm.js";
const { device } = me;

import game, { stopMusic, setMasterVolume, ARCADE_STARTING_LIVES, SUPERJUMP_MAX, comboMultiplier } from "./game.js?v=11";
import resources, { audioResources, BASE } from "./resources.js?v=30";
import PlayerEntity from "./entities/player.js?v=35";
import CoinEntity from "./entities/coin.js?v=10";
import GoalEntity from "./entities/goal.js?v=12";
import EnemyEntity from "./entities/enemy.js?v=15";
import BonusEntity from "./entities/bonus.js?v=6";
import PropEntity from "./entities/prop.js?v=1";
import TrapCoinEntity from "./entities/trapcoin.js?v=3";
import PlayScreen, { loadLevel } from "./screens/play.js?v=13";
import WORLDS, { findLevel, findNextGlobalLevel } from "./worlds.js?v=8";
import * as progress from "./progress.js?v=3";
import * as settings from "./settings.js?v=1";

const root = document.getElementById("app");

const t = (key, ...args) => {
  let s = window.I18N?.[key] ?? key;
  args.forEach(a => { s = s.replace('%s', a); });
  return s;
};

// screen: "title" | "mode-select" | "world-select" | "level-select" | "credits" | "settings" |
// "loading" | "playing" | "level-complete" | "gameover".
// mode: null (not chosen yet) | "practice" (world-select/level-select, any level, no lock, own
// lives per level — see progress.js's own header comment on why the old lock/unlock logic was
// removed) | "arcade" (fixed world1->world4 sequence, no free level-select at all, ONE shared
// life pool for the whole run — see game.js's ARCADE_STARTING_LIVES, screens/play.js's loadLevel()
// resetLives option, and this file's chooseArcade()/arcadeNextLevel()).
// engineBootStarted guards against a second me.video.init() call (Application refuses a repeated
// init loudly) — in practice lit-html's synchronous re-render already removes the level tiles
// before a second click could ever be dispatched, but the flag costs nothing and a double-init
// would be a bad failure mode. engineReady keeps its original, narrower meaning (gates the
// fullscreen button specifically — unchanged from before this feature).
const uiState = {
  loadError: null,
  isFullscreen: false,
  engineReady: false,
  engineBootStarted: false,
  screen: "title",
  mode: null,
  currentWorld: null,
  currentLevel: null,
};

// Screens where #grugnetto-go-wrapper (the melonJS canvas + HUD) is actually shown — see App()'s
// own comment on why that div can never be conditionally removed from the template, only its
// `display` style toggled via this same list. Shared with mount() below (which needs to know
// when a navigation is about to HIDE the wrapper) so the two can't drift apart the way two
// separately-typed-out copies of this array eventually would.
const WRAPPER_VISIBLE_SCREENS = ["loading", "playing", "level-complete", "gameover"];

// Same frame sequence/timing as player.js's own WALK_FRAMES (walk-a -> idle -> walk-b -> idle),
// requested explicitly ("la stessa animazione di grugnetto quando corre") — but as raw filenames,
// not resource names: the title screen renders before the melonJS engine boots (see start()
// below), so me.loader.getImage() isn't available yet here. This is a plain lit-html <img>, swapped
// via a DOM-level src change on a timer instead of a melonJS-managed sprite.
const TITLE_MASCOT_FRAMES = ["grugnetto_walk_a.png", "grugnetto_idle.png", "grugnetto_walk_b.png", "grugnetto_idle.png"];
let titleMascotFrame = 0;
setInterval(() => {
  if (uiState.screen !== "title") return;
  titleMascotFrame = (titleMascotFrame + 1) % TITLE_MASCOT_FRAMES.length;
  mount();
}, 150);

// --- Title screen audio (jingle + keypress grunt) -----------------------------------------
// Deliberately NOT going through game.js's playSound()/playMusic() (me.audio) — those only
// exist once me.video.init() has run, and the title screen is shown BEFORE the melonJS engine
// ever boots (see TITLE_MASCOT_FRAMES's own comment, and start()/selectLevel() further down —
// the whole point of the lazy boot is an instant, engine-free title/world-select/level-select).
// A single lazily-created, page-lifetime AudioContext covers both effects here instead.
let titleAudioCtx = null;
function getTitleAudioCtx() {
  if (!titleAudioCtx) {
    titleAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return titleAudioCtx;
}

// Scales a raw synthesized sound's peak gain by the player's saved master volume — these sounds
// (grunt/jingle/fanfare below) run on their own independent AudioContext, entirely separate from
// melonJS's own me.audio (see playArcadeFanfare()'s own comment on why), so
// game.setMasterVolume()/me.audio.setVolume() never reaches them; without this the settings
// screen's slider would silently do nothing for these three specific cues. Floored at 0.0001, not
// 0 — Web Audio's exponentialRampToValueAtTime() throws a RangeError on a literal 0 target (every
// call site below already used that same epsilon for its own "silent" ramp endpoint, so this
// reuses the existing convention rather than inventing a new one).
function synthGain(basePeak) {
  return Math.max(0.0001, basePeak * settings.getVolume());
}

// A short burst of filtered white noise, reused by playGrunt() below for the breathy/rough
// texture a pure tone alone can't produce — real grunt/oink sounds are as much noise (air, vocal
// roughness) as tone. Builds a fresh buffer per call rather than caching one: cheap at this
// duration/sample rate, and avoids sharing (and thus fighting over playback state on) a single
// AudioBufferSourceNode, which can only ever be started once.
function createNoiseBurst(ctx, durationSec) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * durationSec), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

// Two short, low, buzzy pulses ("hnk-hnk") layered with filtered noise — not a sampled sound,
// synthesized on the fly with plain oscillator/filter/noise nodes. Requested live ("quando pigio
// i tasti si può emettere un grugnito?"): a real recorded pig grunt would mean sourcing + vetting
// + crediting yet another third-party asset (see CreditsScreen()) for a one-off keypress easter
// egg — synthesizing it instead keeps this fully self-contained, in the same spirit as this
// session's CDN-removal work (vendor/), and costs nothing to tweak.
//
// This is the SECOND pass at the sound itself — the first version (a single smooth sawtooth
// pitch sweep, no noise) was reported live as not actually reading as a grunt at all ("il grunt
// non è affatto il grugnito di un maiale"), more like a sci-fi descending blip. Two changes
// address that directly: a real grunt is a double, choppy sound, not one smooth sweep — hence two
// short pulses instead of one longer one; and a real grunt has a breathy, rough texture a pure
// tone can't produce alone — hence the noise layer under each pulse. Lower base frequency range
// too (85-105Hz vs the original 170-200Hz) — a chesty low register reads as an animal grunt,
// the higher range read as a zap. Randomized per pulse so rapid-fire key mashing doesn't sound
// like the exact same sound on a loop.
//
// Reported live as silent ("non sento i grugniti al click sui tasti"). Root cause: the FIRST
// call ever creates a brand-new AudioContext, which starts life "suspended" — calling resume()
// on it is necessary but NOT synchronous (it returns a Promise), so scheduling playback
// immediately afterward, in the same tick, could race a browser that hasn't actually finished
// resuming yet and silently drop the very first grunt. Every call AFTER that first one hits an
// already-"running" context (a real gesture already unlocked it), so schedules synchronously
// with no added latency — only the true first-ever press waits on the resume() promise.
function playGrunt() {
  const ctx = getTitleAudioCtx();
  const fire = () => {
    const now = ctx.currentTime;
    const PULSE_LEN = 0.1;
    [now, now + 0.11].forEach((startAt) => {
      const baseFreq = 85 + Math.random() * 20;
      const osc = ctx.createOscillator();
      const oscFilter = ctx.createBiquadFilter();
      const oscGain = ctx.createGain();
      oscFilter.type = "lowpass";
      oscFilter.frequency.value = 500;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(baseFreq, startAt);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, startAt + PULSE_LEN);
      oscGain.gain.setValueAtTime(0.0001, startAt);
      oscGain.gain.exponentialRampToValueAtTime(synthGain(0.4), startAt + 0.015);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startAt + PULSE_LEN);
      osc.connect(oscFilter);
      oscFilter.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + PULSE_LEN + 0.02);

      const noise = createNoiseBurst(ctx, PULSE_LEN);
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 400;
      noiseFilter.Q.value = 0.7;
      noiseGain.gain.setValueAtTime(0.0001, startAt);
      noiseGain.gain.exponentialRampToValueAtTime(synthGain(0.12), startAt + 0.015);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, startAt + PULSE_LEN);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(startAt);
      noise.stop(startAt + PULSE_LEN + 0.02);
    });
  };
  if (ctx.state === "suspended") {
    ctx.resume().then(fire);
  } else {
    fire();
  }
}

// Fires on clicking any menu button (title's "Gioca"/credits, mode-select's "Esercitazione"/
// "Arcade", world/level tiles, credits' back button, ...) — NOT on raw keydown as the first cut
// of this feature did. Reported live, twice, as inaudible ("non sento i grugniti al click sui
// tasti") even after fixing a real AudioContext race (see playGrunt() below) — the actual gap was
// the trigger itself: the report's own wording ("clicco i pulsanti", a mouse-click verb + "the
// buttons") was a real signal that testing has been via clicking on-screen buttons, which a
// keydown-only listener never sees at all. Scoped to GRUNT_SCREENS (menu screens only, not
// "playing"/"loading"/"level-complete"/"gameover" — those buttons live inside
// #grugnetto-go-wrapper, mixed with actual gameplay chrome, where a random grunt over the HUD's
// fullscreen/back button would read as an odd interruption rather than the title-screen easter
// egg it started as). A keyboard-activated button (Enter/Space on a focused menu button, or a
// gamepad confirm press synthesizing a .click() — see pollGamepadMenuNav()) already dispatches a
// real "click" event too, so this one listener covers mouse, touch, keyboard, and gamepad
// activation alike — no separate keydown listener needed alongside it.
const GRUNT_SCREENS = ["title", "mode-select", "world-select", "level-select", "credits", "settings"];
document.addEventListener("click", (e) => {
  if (!GRUNT_SCREENS.includes(uiState.screen)) return;
  if (e.target.closest("button")) playGrunt();
});

// A short, soft ascending arpeggio (three notes, sine waves) — synthesized, not a sampled clip.
// Replaces an earlier version that played a recorded Kenney "Music Jingles" stinger: even after
// fading its volume in (a first attempt at "più dolce"), the clip's own sharp, punchy character
// was the actual problem, not just its loudness — reported live again ("cambiamo anche il jingle
// con uno più soft"). A sine wave has none of a sawtooth/square's harsh upper harmonics, so a
// gentle envelope on top of it reads as soft by construction, not just quiet. Reuses the exact
// same getTitleAudioCtx()/resume()-race-safety pattern as playGrunt() below (this is now also a
// Web Audio API synth, same as the grunt, not a separate HTMLAudioElement) — see playGrunt()'s own
// comment for why that race matters specifically on the first-ever call. Played once, on the
// first interaction with the page, while still on the title screen — see the click listener's own
// comment for why autoplay on page load itself isn't an option.
let titleJinglePlayed = false;
function playTitleJingleOnce() {
  if (titleJinglePlayed || uiState.screen !== "title") return;
  titleJinglePlayed = true;
  const ctx = getTitleAudioCtx();
  const fire = () => {
    const now = ctx.currentTime;
    const NOTE_HZ = [523.25, 659.25, 783.99]; // C5, E5, G5 — a plain, pleasant major triad
    const NOTE_GAP = 0.16;
    const NOTE_LEN = 0.22;
    NOTE_HZ.forEach((freq, i) => {
      const startAt = now + i * NOTE_GAP;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      // Soft attack (30ms ramp up, not an instant jump to peak) and a low peak (0.18) — both
      // directly aimed at "non mi deve far sobbalzare" (shouldn't startle), same reasoning as
      // playGrunt()'s own envelope, just gentler across the board.
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(synthGain(0.18), startAt + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + NOTE_LEN);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + NOTE_LEN + 0.02);
    });
  };
  if (ctx.state === "suspended") {
    ctx.resume().then(fire);
  } else {
    fire();
  }
}
document.addEventListener("keydown", playTitleJingleOnce, { once: true });
document.addEventListener("pointerdown", playTitleJingleOnce, { once: true });

// Bigger celebratory fanfare for Arcade's "run complete" moment specifically — requested live
// ("nessun jingle fanfara?"), distinct from playTitleJingleOnce() above (that one deliberately
// stays gentle since it can fire on every visit to the title screen; this one only ever fires
// once per entire Arcade run, so it can afford to actually sound like a "ta-da"). Reuses the same
// shared getTitleAudioCtx()/resume()-race-safety pattern — see playGrunt()'s own comment for why
// that race matters on a context's first-ever use. A separate, independent AudioContext from
// melonJS's own me.audio (used for every other in-game sound, including the plain "win" jingle
// goal.js already plays on every level) rather than routing through game.js's playSound() —
// melonJS's audio system plays pre-loaded samples, it has no oscillator-synthesis API, so a
// synthesized cue has to bypass it the same way the title screen's own sounds already do. Called
// from startEngine()'s game.onChange() listener, NOT from LevelCompleteOverlay()'s own render —
// that function re-runs on every mount(), which would replay the fanfare on every single
// re-render of the finale screen instead of exactly once.
function playArcadeFanfare() {
  const ctx = getTitleAudioCtx();
  const fire = () => {
    const now = ctx.currentTime;
    // Rising arpeggio across TWO octaves (C5-E5-G5-C6-E6-G6, not just one) into a sustained major
    // chord (C6+E6+G6) — reported live as too short/quiet ("pensavo fosse più lungo e audibile")
    // for a first pass at ~1.1s total and a 0.16-0.22 peak gain; this version runs ~2.5s
    // (0.9s arpeggio build + 1.6s held chord) at a noticeably louder 0.3-0.35 peak — still 3 sine
    // oscillators at once at the chord's worst case (peak sum ~0.9), comfortably under the 1.0
    // clipping ceiling.
    const ARPEGGIO_HZ = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    const NOTE_GAP = 0.15;
    const NOTE_LEN = 0.24;
    ARPEGGIO_HZ.forEach((freq, i) => {
      const startAt = now + i * NOTE_GAP;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(synthGain(0.35), startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + NOTE_LEN);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + NOTE_LEN + 0.02);
    });
    const chordStart = now + ARPEGGIO_HZ.length * NOTE_GAP;
    const CHORD_HZ = [1046.5, 1318.51, 1567.98]; // C6, E6, G6 — lands back on the arpeggio's own peak octave
    const CHORD_LEN = 1.6;
    CHORD_HZ.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, chordStart);
      gain.gain.exponentialRampToValueAtTime(synthGain(0.3), chordStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + CHORD_LEN);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(chordStart);
      osc.stop(chordStart + CHORD_LEN + 0.02);
    });
  };
  if (ctx.state === "suspended") {
    ctx.resume().then(fire);
  } else {
    fire();
  }
}

// requestFullscreen/exitFullscreen are deprecated since 19.7.0 on me.device — confirmed live
// (console warning: "please use Application#exitFullscreen"). me.game *is* the default
// Application instance created internally by me.video.init() (same object already used below
// for me.game.world.gpuTilemap), so it exposes the non-deprecated requestFullscreen/
// exitFullscreen/isFullscreen trio directly. Targeting #grugnetto-go-wrapper (not just
// #grugnetto-go-screen) is what brings the coins/score/fullscreen-button overlay along into
// fullscreen too — see app.css's :fullscreen rule on the wrapper, and #grugnetto-go-screen's own
// (always-on, not fullscreen-only) flex centering for how the canvas gets centered inside it.
function toggleFullscreen() {
  if (me.game.isFullscreen()) {
    me.game.exitFullscreen();
  } else {
    me.game.requestFullscreen(document.getElementById("grugnetto-go-wrapper"));
  }
}

// melonJS/browsers can also leave fullscreen via Esc or the browser's own UI, bypassing our
// button entirely — listening for the vendor-prefixed change events keeps uiState.isFullscreen
// (and thus the button icon/label) in sync regardless of how fullscreen was exited. This is also
// the only reliable place to force a resize: neither entering nor exiting fullscreen fires a
// window "resize" event in every browser, and melonJS otherwise only re-measures on that event
// (or window "orientationchange", or a childList/subtree DOM mutation of the parent element —
// see application.ts's MutationObserver — none of which a pure fullscreen transition triggers).
["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"].forEach(evt => {
  document.addEventListener(evt, () => {
    uiState.isFullscreen = me.game.isFullscreen();
    if (uiState.engineReady) me.game.resize();
    mount();
  });
});

// --- Menu navigation (gamepad + arrow keys) -----------------------------------------------
// title/world-select/level-select are shown before the melonJS engine ever boots (see start()
// below) — its own gamepad support (me.input.bindGamepad, used in-game by PlayerEntity) isn't
// available yet at that point, and even once it is, that binding only maps buttons into virtual
// keys PlayerEntity's own update() reads, nothing DOM/menu-aware. So menu navigation is entirely
// separate: it polls the raw browser Gamepad API directly and moves real DOM focus between the
// current screen's <button> elements — Enter/Space then activates a focused button natively (no
// extra code needed for keyboard confirm), and a synthesized .click() does the same for a
// gamepad's confirm button. Scoped to MENU_SCREENS only: during "playing"/"loading" the D-pad/
// stick and arrow keys are the actual game controls and must never be hijacked here.
// "settings" included so its back button is gamepad/keyboard-navigable like every other menu
// screen's — getMenuFocusables() below only ever picks up <button> elements, though, so the
// volume slider/language <select> themselves still need touch, mouse, or Tab+arrow keys; that's
// an accepted scope limit, not an oversight.
const MENU_SCREENS = ["title", "mode-select", "world-select", "level-select", "credits", "settings", "level-complete", "gameover"];

// Every navigable menu control (world/level tiles, back buttons, next-level/retry/etc.) is a
// plain <button> inside .spa-title-box — no separate data-attribute bookkeeping needed for those.
// input[type=range]/select ADDED to the query (settings screen's volume slider/language picker)
// — reported live as unreachable by D-pad/TV-remote navigation ("può essere giocato anche con il
// telecomando... della mia smart tv?"): they exist in the DOM the whole time, they just weren't
// in this list, so moveMenuFocus() below could never land on them. Filters out disabled buttons
// (a locked world's tile) and hidden ones (offsetParent is null for a display:none ancestor —
// true for every button still sitting inert inside #grugnetto-go-wrapper while it's hidden on
// title/world-select/level-select, since that div is always present in the DOM, only its
// `display` toggles — see App()'s own comment on why).
function getMenuFocusables() {
  return Array.from(document.querySelectorAll(".spa-title-box button, .spa-title-box input[type=range], .spa-title-box select"))
    .filter(el => !el.disabled && el.offsetParent !== null);
}

function moveMenuFocus(delta) {
  const items = getMenuFocusables();
  if (items.length === 0) return;
  const idx = items.indexOf(document.activeElement);
  items[idx === -1 ? 0 : (idx + delta + items.length) % items.length].focus({ preventScroll: true });
}

// True for the two control types that consume their OWN Left/Right arrow presses natively (a
// focused <input type=range> decrements/increments its value on Left/Right; a focused <select>
// cycles its selection the same way) — see the keydown listener below for why this matters: once
// D-pad/arrow-key focus actually reaches one of these (see getMenuFocusables() above), Left/Right
// needs to fall through to that native behavior instead of being hijacked into "move to the next
// menu item" the way every <button> still expects. Up/Down are deliberately NOT included here —
// they keep moving focus even while a range/select is focused, so a TV-remote/gamepad user can
// always move on without first needing to figure out which direction "escapes" the control.
function isAdjustableControl(el) {
  return !!el && (el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type === "range"));
}

// Called at the end of every mount() — auto-focuses the current screen's "primary" menu button
// whenever nothing currently focused belongs to the freshly-rendered screen (a fresh page load,
// or the previous screen's focused button just got swapped out of the DOM by a screen change), so
// a gamepad-only player always has something useful focused without ever having had a mouse.
// Prefers a button explicitly marked [data-menu-default] (the first world/level tile, "Prossimo
// livello"/"Riprova", etc. — see each screen function below) over plain DOM order, since a
// screen's first <button> in markup is often a "Back"/nav control, not what should greet a
// player arriving on it (reported live: world-select was defaulting to "Indietro" instead of the
// first world). A no-op the rest of the time — never steals focus from a button just clicked.
function ensureMenuFocus() {
  if (!MENU_SCREENS.includes(uiState.screen)) return;
  const items = getMenuFocusables();
  if (items.length === 0 || items.includes(document.activeElement)) return;
  const preferred = items.find(el => el.hasAttribute("data-menu-default"));
  (preferred || items[0]).focus({ preventScroll: true });
}

document.addEventListener("keydown", (e) => {
  if (!MENU_SCREENS.includes(uiState.screen)) return;
  // Left/Right fall through to the browser's own native handling (adjust the value, don't move
  // focus) whenever a range/select is the one currently focused — see isAdjustableControl()'s own
  // comment. Up/Down always move focus regardless, so a TV-remote/gamepad user is never stuck on
  // the slider with no way off it.
  if (e.key === "ArrowRight") {
    if (isAdjustableControl(document.activeElement)) return;
    moveMenuFocus(1);
    e.preventDefault();
  } else if (e.key === "ArrowLeft") {
    if (isAdjustableControl(document.activeElement)) return;
    moveMenuFocus(-1);
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    moveMenuFocus(1);
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    moveMenuFocus(-1);
    e.preventDefault();
  } else if (e.key === "Escape") {
    // TV remote "Back"/"Return" buttons are inconsistently mapped across platforms (a Tizen-
    // specific keyCode, plain browser-history-back, or nothing this app can see at all) —
    // reported live as a real uncertainty ("può essere giocato anche con il telecomando... della
    // mia smart tv?"). Escape is at least the closest thing to a standardized "close/back" key
    // across browsers, so every menu screen's own visible back button gets a shared
    // [data-menu-back] marker (see each screen function) that this can target directly, giving
    // remote/keyboard users one more reliable way back besides D-pad-navigating to the button by
    // hand. A no-op on screens with no such button (title, level-complete, gameover — see each
    // screen's own reasoning for why "back" doesn't apply there).
    document.querySelector(".spa-title-box [data-menu-back]")?.click();
  }
});

// Raw Gamepad API polling (not melonJS's — see the section comment above). D-pad (buttons 12-15,
// standard mapping) or the left stick's axes move focus; button 0 OR 1 (A/B, Cross/Circle —
// mirrors player.js's own jump binding, which accepts EITHER FACE_1 or FACE_2, specifically so
// confirming a menu with "the jump button" always works regardless of which face button a given
// pad happens to call "jump" — reported live: "col joypad non posso... selezionare (premendo il
// pulsante di salto o altro)") activates whatever is focused. GAMEPAD_REPEAT_MS debounces a held
// direction so it doesn't sweep through every button in one frame; lastConfirmPressed (per
// gamepad index) is edge-detected the same way, so holding a confirm button doesn't repeatedly
// re-click. Runs unconditionally (every frame, for the page's whole lifetime) but is a cheap
// no-op outside MENU_SCREENS/without a connected pad.
//
// try/catch around the actual per-frame logic (NOT around the requestAnimationFrame reschedule
// itself, which always has to run) — added after the same live report above also mentioned "né
// muovere tasto selezionato per cambiare selezione" (menu movement not working either): a plain
// requestAnimationFrame(self) loop with no error boundary silently dies FOREVER the first time it
// throws once (nothing left to call it again), which would read as "gamepad menu nav stopped
// working" from exactly the point something odd happened onward — a real robustness gap
// regardless of whether it was actually the original cause, so guarding against a whole class of
// "one weird frame permanently kills navigation for the rest of the session" bugs here.
const GAMEPAD_REPEAT_MS = 220;
let lastGamepadMoveAt = 0;
const lastConfirmPressed = [];
function pollGamepadMenuNav() {
  requestAnimationFrame(pollGamepadMenuNav);
  if (!MENU_SCREENS.includes(uiState.screen) || !navigator.getGamepads) {
    return;
  }
  try {
    pollGamepadMenuNavFrame();
  } catch (e) {
    // Swallowed on purpose — see this function's own comment above for why silently continuing
    // (rather than letting the exception propagate and kill the RAF reschedule) is the point.
  }
}
function pollGamepadMenuNavFrame() {
  const pads = navigator.getGamepads();
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (!pad) continue;

    const now = performance.now();
    if (now - lastGamepadMoveAt > GAMEPAD_REPEAT_MS) {
      const axisX = pad.axes[0] || 0;
      const axisY = pad.axes[1] || 0;
      const goPrev = pad.buttons[14]?.pressed || pad.buttons[12]?.pressed || axisX < -0.5 || axisY < -0.5;
      const goNext = pad.buttons[15]?.pressed || pad.buttons[13]?.pressed || axisX > 0.5 || axisY > 0.5;
      if (goPrev) {
        moveMenuFocus(-1);
        lastGamepadMoveAt = now;
      } else if (goNext) {
        moveMenuFocus(1);
        lastGamepadMoveAt = now;
      }
    }

    const confirmPressed = !!(pad.buttons[0]?.pressed || pad.buttons[1]?.pressed);
    if (confirmPressed && !lastConfirmPressed[i] && getMenuFocusables().includes(document.activeElement)) {
      document.activeElement.click();
    }
    lastConfirmPressed[i] = confirmPressed;
  }
}
requestAnimationFrame(pollGamepadMenuNav);

// --- Navigation --------------------------------------------------------------------------
// Screen transitions only ever mutate uiState.screen (+ whichever world/level fields matter)
// and call mount() — none of them touch #grugnetto-go-screen's own DOM subtree, see App()'s
// comment below for why that distinction is load-bearing.

function goToModeSelect() {
  uiState.screen = "mode-select";
  mount();
}

function goToCredits() {
  uiState.screen = "credits";
  mount();
}

function goToSettings() {
  uiState.screen = "settings";
  mount();
}

function backToTitle() {
  uiState.screen = "title";
  mount();
}

// Practice mode: today's world-select/level-select flow, unchanged, just gated behind picking
// this mode first — see progress.js's own header comment for why world-select itself no longer
// checks any lock state (this mode's whole point is "provare tutti i livelli" — try every level
// freely, requested live — so nothing here is gated by prior completion).
function choosePractice() {
  uiState.mode = "practice";
  // Mirrored onto game.data.mode too — see game.js's own comment on why entities/player.js needs
  // this readable from outside app.js (its loseLife() branches on it for score persistence).
  game.data.mode = "practice";
  uiState.screen = "world-select";
  mount();
}

// Arcade mode: skips world-select/level-select entirely — always starts at world1's first level,
// requested live as "li devo fare in sequenza" (do them in sequence). Reuses selectLevel() itself
// (below) rather than duplicating its lazy-engine-boot-vs-already-running branch, just forcing the
// options a normal Practice-mode pick never needs: reset (this IS a fresh run) but to
// ARCADE_STARTING_LIVES (8, shared for the whole run), not the Practice-mode default of 3.
function chooseArcade() {
  uiState.mode = "arcade";
  game.data.mode = "arcade";
  // resetScore:true here even though it's already the default — this IS a fresh run, spelled
  // out explicitly alongside resetLives so the "start a run" call and arcadeNextLevel()'s own
  // "continue a run" call (resetLives:false, resetScore:false) read as the obvious pair they are.
  selectLevel("world1", 1, { resetLives: true, startingLives: ARCADE_STARTING_LIVES, resetScore: true });
}

// Shared by Arcade mode's game-over overlay (8 lives spent) and its "you finished the whole run"
// panel — both requested live to return straight to the title screen, not level-select (there's
// no level-select to return TO in this mode). Clearing mode isn't strictly required (every mode
// picker below sets it fresh anyway) but leaves uiState in an unambiguous "nothing chosen yet"
// state rather than a stale "arcade" hanging around on the title screen.
function backToTitleFromRun() {
  stopArcadeAutoAdvance();
  stopMusic();
  uiState.mode = null;
  game.data.mode = null;
  uiState.screen = "title";
  mount();
}

function selectWorld(worldId) {
  const world = WORLDS.find(w => w.id === worldId);
  if (!world || world.levels.length === 0) return; // "coming soon" world — nothing to select
  uiState.currentWorld = worldId;
  uiState.screen = "level-select";
  mount();
}

function backToWorldSelect() {
  uiState.screen = "world-select";
  mount();
}

// Shared by the HUD's back button (leaving "playing") and the level-complete panel's "Livelli"
// button (leaving "level-complete") — both abandon the current attempt and stop the bgm, since
// leaving gameplay music playing under a menu screen would be a real, user-visible glitch. No
// mid-level pause/resume is being built: picking a level again always restarts it from scratch.
function backToLevelSelect() {
  stopMusic();
  uiState.screen = "level-select";
  mount();
}

function backToWorldSelectFromComplete() {
  stopMusic();
  uiState.screen = "world-select";
  mount();
}

// Picking a level for the very first time this page load boots the whole melonJS engine lazily
// (see startEngine below); every subsequent pick (a different level from level-select, or the
// level-complete panel's own selectLevel-based buttons) reuses the already-running engine via
// loadLevel() directly — see play.js's own comment for why me.state.change() can't be reused for
// that second case (it no-ops when already in the target state). `options` (loadLevel()'s own
// resetLives/startingLives) only exists so chooseArcade() above can force ARCADE_STARTING_LIVES —
// every Practice-mode call site (LevelTile's click handler) omits it and gets loadLevel()'s
// regular defaults, same as before this parameter existed.
function selectLevel(worldId, level, options) {
  const entry = findLevel(worldId, level);
  if (!entry) return;
  const world = WORLDS.find(w => w.id === worldId);
  uiState.currentWorld = worldId;
  uiState.currentLevel = level;
  uiState.screen = "loading";
  // Mount BEFORE any engine work: #grugnetto-go-wrapper must already be visible (not
  // display:none) the moment me.video.init() (first boot) or me.game.resize() (later boots)
  // measures it — a hidden element's getBoundingClientRect() is zero-size, which would corrupt
  // the very first canvas sizing calculation.
  mount();
  if (!uiState.engineBootStarted) {
    uiState.engineBootStarted = true;
    start(entry.resource, world.music, options);
  } else {
    // The wrapper just went hidden -> visible (it was display:none while browsing level-select).
    // Toggling a style attribute isn't a childList/subtree DOM mutation, so melonJS's own
    // resize-triggering MutationObserver won't necessarily catch it — same defensive-resize
    // reasoning as the fullscreenchange handler above, which doesn't trust auto-detection either.
    me.game.resize();
    loadLevel(entry.resource, world.music, options);
  }
}

// Arcade mode's own "next level", called from LevelCompleteOverlay() instead of nextLevel() below
// — that one only ever looks within the SAME world (Practice mode's "Prossimo livello" button
// never crosses a world boundary); this one crosses world1->world2->world3->world4 via worlds.js's
// findNextGlobalLevel(), and — the whole point of this mode — passes resetLives:false/
// resetScore:false so both game.data.lives AND game.data.score carry forward from the level just
// finished instead of topping back up / zeroing out. LevelCompleteOverlay() only ever renders the
// button that calls this when findNextGlobalLevel() already found something, so the
// `if (!next) return` below is unreachable in normal play, not a real error path — just cheap
// insurance against a stale click after some faster state change.
function arcadeNextLevel() {
  stopArcadeAutoAdvance();
  const next = findNextGlobalLevel(uiState.currentWorld, uiState.currentLevel);
  if (!next) return;
  const world = WORLDS.find(w => w.id === next.worldId);
  uiState.currentWorld = next.worldId;
  uiState.currentLevel = next.level;
  uiState.screen = "playing";
  mount();
  loadLevel(next.resource, world.music, { resetLives: false, resetScore: false });
}

// Auto-advance countdown for Arcade mode's "Prossimo livello" button, requested live — a classic
// arcade-cabinet touch (finish a level, the next one starts on its own after a beat) that also
// just saves a click on a run where the player's about to hit this same button 30+ times anyway.
// Deliberately scoped to ONLY the "there's a next level" case (see game.onChange() below, which
// starts this) — the "you finished the whole run" panel's "Torna alla home" button was NOT part
// of the request and auto-clicking a player back to the title screen without them asking for it
// would be a genuinely unwelcome surprise, not a convenience.
const ARCADE_AUTO_ADVANCE_SECONDS = 3;
let arcadeAutoAdvanceTimer = null;
let arcadeAutoAdvanceRemaining = 0;

function startArcadeAutoAdvance() {
  if (arcadeAutoAdvanceTimer !== null) return; // already counting down — don't stack a second interval
  arcadeAutoAdvanceRemaining = ARCADE_AUTO_ADVANCE_SECONDS;
  arcadeAutoAdvanceTimer = setInterval(() => {
    arcadeAutoAdvanceRemaining -= 1;
    if (arcadeAutoAdvanceRemaining <= 0) {
      // arcadeNextLevel() itself calls stopArcadeAutoAdvance() first, clearing this same
      // interval — safe even though we're currently inside its own callback (clearInterval on
      // an interval from within its own tick is well-defined: it simply cancels future ticks).
      arcadeNextLevel();
    } else {
      mount();
    }
  }, 1000);
}

// Called both by arcadeNextLevel() (a manual click shouldn't leave a stale interval still
// ticking toward a second, now-stale advance) and backToTitleFromRun() (leaving mid-run some
// other way — defensive; nothing currently reaches level-complete's countdown and then title
// except through the button itself, but a silently orphaned setInterval surviving a run would be
// a real, if currently unreachable, bug).
function stopArcadeAutoAdvance() {
  if (arcadeAutoAdvanceTimer !== null) {
    clearInterval(arcadeAutoAdvanceTimer);
    arcadeAutoAdvanceTimer = null;
  }
}

function nextLevel() {
  const next = findLevel(uiState.currentWorld, uiState.currentLevel + 1);
  if (!next) return; // last level of the world — the panel simply won't show this button
  const world = WORLDS.find(w => w.id === uiState.currentWorld);
  uiState.currentLevel = next.level;
  uiState.screen = "playing";
  mount();
  // Engine is already running (we only ever reach "level-complete" after having played a level),
  // so this always takes the loadLevel()-direct path, never the first-boot one. Same world as
  // before (next-level never crosses a world boundary), so the music track doesn't change.
  loadLevel(next.resource, world.music);
}

// From the "gameover" overlay's retry button — same level, same world, fresh lives (loadLevel
// itself resets game.data.lives back to STARTING_LIVES, same as any other level load).
function retryLevel() {
  const entry = findLevel(uiState.currentWorld, uiState.currentLevel);
  if (!entry) return;
  const world = WORLDS.find(w => w.id === uiState.currentWorld);
  uiState.screen = "playing";
  mount();
  loadLevel(entry.resource, world.music);
}

// --- Screens -------------------------------------------------------------------------------

// A plain painterly art style (see player.js's own comments on Grugnetto's illustrated frames)
// doesn't fit a hard 8-bit/CRT "arcade" look, so the arcade feel here comes from motion/glow
// instead of pixel-art trappings: the mascot bobbing, the title glowing, the button pulsing like
// a classic cabinet's "PRESS START" — see app.css's gg-* animation rules.
function TitleScreen() {
  return html`
    <div class="has-text-centered py-5">
      <img class="gg-mascot mb-3" src="${BASE}${TITLE_MASCOT_FRAMES[titleMascotFrame]}" alt="Grugnetto">
      <h1 class="title is-3 gg-title-glow">${t("grugnettogo.title")}</h1>
      <!-- Mission paragraph — requested live ("serve anche un paragrafo in home per raccontare la
           missione... qualcosa di epico relativo ai 4 mondi"): names all 4 worlds in their actual
           play order and ties the "epic" framing directly to the real coinGoal mechanic (every
           level's flag stays locked until every coin is collected — see goal.js's isUnlocked()),
           rather than inventing lore the game itself doesn't back up. Centered, capped width so it
           reads as a tight couple of sentences instead of sprawling edge-to-edge on a wide screen. -->
      <p class="subtitle is-6 mb-3 gg-mission" style="max-width: 32rem; margin-left: auto; margin-right: auto;">${t("grugnettogo.mission")}</p>
      <p class="help mb-4">${t("grugnettogo.controls")}</p>
      <button class="button is-primary is-medium gg-cta" data-menu-default @click=${goToModeSelect}>${t("grugnettogo.play")}</button>
      <p class="mt-3">
        <button class="button is-small mr-2" @click=${goToCredits}>
          <i class="ri-file-list-3-line mr-1"></i>${t("grugnettogo.credits")}
        </button>
        <button class="button is-small" @click=${goToSettings}>
          <i class="ri-settings-3-line mr-1"></i>${t("grugnettogo.settings")}
        </button>
      </p>
    </div>
  `;
}

// Requested live: "esercitazione" (try any level, no restrictions) vs "arcade" (fixed sequence,
// 8 shared lives, game over sends you back here) — two very different commitments, so this gets
// its own screen between title and world-select rather than, say, a toggle buried in world-select
// itself. Reuses the same .pj-tile/--pj-accent styling WorldTile/LevelTile already use (a plain
// Bulma .box with a themed left border, see app.css) instead of inventing a second card style for
// what's structurally the same "pick one of a few options" layout.
function ModeSelectScreen() {
  return html`
    <div class="py-3">
      <div class="level mb-3">
        <div class="level-left">
          <button class="button is-small" data-menu-back @click=${backToTitle}>
            <i class="ri-arrow-go-back-line mr-1"></i>${t("grugnettogo.back")}
          </button>
        </div>
      </div>
      <h2 class="title is-4 has-text-centered mb-4">${t("grugnettogo.mode.select")}</h2>
      <div class="columns is-centered is-multiline">
        <div class="column is-half-mobile is-one-third-tablet">
          <div class="box has-text-centered pj-tile" style="--pj-accent: #3298dc">
            <p class="title is-5 mb-2">${t("grugnettogo.mode.practice")}</p>
            <p class="help mb-3">${t("grugnettogo.mode.practice.desc")}</p>
            <button class="button is-primary" data-menu-default @click=${choosePractice}>${t("grugnettogo.mode.practice")}</button>
          </div>
        </div>
        <div class="column is-half-mobile is-one-third-tablet">
          <div class="box has-text-centered pj-tile" style="--pj-accent: #f14668">
            <p class="title is-5 mb-2">${t("grugnettogo.mode.arcade")}</p>
            <p class="help mb-3">${t("grugnettogo.mode.arcade.desc")}</p>
            <button class="button is-primary" @click=${chooseArcade}>${t("grugnettogo.mode.arcade")}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Every asset/library this game actually ships, grouped for CreditsScreen() below. Proper
// nouns/license names/URLs are the same in every language (see i18n keys used elsewhere in this
// screen for the section headers, which DO get translated) — kept here as plain data rather than
// pushed through t()/lang files, same reasoning coin/flag art doesn't need a translated name.
// Sourced directly from this project's own asset-provenance comments (resources.js's own header,
// entities/enemy.js/player.js, the Kenney License.txt files shipped under assets/kenney-extras/,
// and this session's own vendor/ downloads) — not guessed. World3/world4 music are CC-BY/CC-BY-SA
// (attribution required, not just "nice to have" like the CC0 entries) — this screen is what
// actually satisfies that requirement, not just a courtesy list.
const CREDITS = [
  { section: "graphics", items: [
    // Verified, not guessed: downloaded the actual pack zip from kenney.nl and diffed its file
    // list against assets/tiles/ and assets/kenney-extras/{animals,props,backgrounds,blocks} —
    // every sampled filename (bee_a, saw_a, barnacle_attack_a, worm_normal_*, terrain_grass_
    // block_top, background_clouds, fence, mushroom_brown, ...) matched exactly. Its own
    // License.txt (CC0) is now saved alongside the assets it covers, at
    // assets/kenney-extras/License.txt — same paper trail impact-sounds/ and digital-audio/
    // already had, requested live ("credits per materiali e librerie... OK?").
    { name: "Kenney — New Platformer Pack (1.1)", note: "Terrain, platforms, enemies, backgrounds, props", license: "CC0 1.0", url: "kenney.nl/assets/new-platformer-pack" },
    // Deliberately NOT a Creative Commons tag — requested live ("non voglio che riutilizzino i
    // miei asset di grugnetto"): even the most restrictive CC license (BY-NC-ND) still grants
    // some public reuse right, which is the opposite of what was asked for. Plain copyright
    // ("all rights reserved") is the correct, strongest fit — see this folder's own LICENSE.txt
    // for the fuller split (code vs. this art vs. every third-party asset above/below).
    { name: "Grugnetto — character, coin & collectible art", note: "Original illustration for this game", license: "All rights reserved", url: null },
  ]},
  { section: "audio", items: [
    { name: "Kenney — Impact Sounds", note: "Jump / coin / hurt / bump sound effects", license: "CC0 1.0", url: "kenney.nl" },
    { name: "Kenney — Digital Audio", note: "Win jingle", license: "CC0 1.0", url: "kenney.nl" },
    { name: "“Flowerbed Fields [Loop]” — Zane Little Music", note: "World 1 music", license: "CC0", url: "opengameart.org/content/flowerbed-fields-loop" },
    { name: "“Fort Fairy” — iamoneabe", note: "World 2 music", license: "CC0", url: "opengameart.org/content/fort-fairy" },
    { name: "“Desert 03” — Fantasy Musica (Beau Buckley)", note: "World 3 music", license: "CC BY 3.0", url: "opengameart.org/content/desert-03" },
    { name: "“Cave 01” — Fantasy Musica (Beau Buckley)", note: "World 4 music", license: "CC BY-SA 4.0", url: "opengameart.org/content/cave-01" },
  ]},
  { section: "libraries", items: [
    { name: "melonJS 19.9.1", note: "Game engine", license: "MIT", url: "melonjs.org" },
    { name: "lit-html 3.3.2", note: "UI rendering", license: "BSD-3-Clause", url: "lit.dev" },
    { name: "Bulma 1.0.4", note: "UI styling", license: "MIT", url: "bulma.io" },
    { name: "Remix Icon 4.9.1", note: "Icons", license: "Remix Icon License 1.0", url: "remixicon.com" },
  ]},
];

function CreditsScreen() {
  return html`
    <div class="py-3">
      <div class="level mb-3">
        <div class="level-left">
          <button class="button is-small" data-menu-default data-menu-back @click=${backToTitle}>
            <i class="ri-arrow-go-back-line mr-1"></i>${t("grugnettogo.back")}
          </button>
        </div>
      </div>
      <h2 class="title is-4 has-text-centered mb-4">${t("grugnettogo.credits.title")}</h2>
      <!-- gg-credits-content, not just the plain Bulma .content class: app.css's own text-color
           override needs to target THIS specific block (sitting directly on the screen's black
           background) without also catching BonusBreakdown()'s own .content div elsewhere, which
           sits on the level-complete overlay's white Bulma .box instead — see app.css's own
           comment on the bug that caused (reported live: "i box di fine livello... hanno a volte
           dei colori dei caratteri troppo chiari"). -->
      <div class="content gg-credits-content">
        ${CREDITS.map(group => html`
          <p class="title is-6 mb-2">${t(`grugnettogo.credits.${group.section}`)}</p>
          <ul class="mb-4">
            ${group.items.map(item => html`
              <li>
                <strong>${item.name}</strong> — ${item.note}
                ${item.license ? html` <span class="tag is-light">${item.license}</span>` : ""}
                ${item.url ? html` <span class="has-text-grey is-size-7">(${item.url})</span>` : ""}
              </li>
            `)}
          </ul>
        `)}
      </div>
    </div>
  `;
}

// Master volume slider — requested live ("mettiamo 3 e 5" against a readiness review that flagged
// no in-game volume control). Persists via settings.js, and applies immediately in two places
// that DON'T share a single audio system: game.setMasterVolume() (melonJS's own me.audio, used by
// every sound played once the engine has booted) and this file's own raw-Web-Audio synthesized
// cues (title screen grunt/jingle, Arcade fanfare — see synthGain()'s own comment below for why
// those need their gain scaled by hand instead).
function onVolumeInput(e) {
  const volume = Number(e.target.value) / 100;
  settings.setVolume(volume);
  setMasterVolume(volume);
  mount();
}

// Language selector — standalone page (index.html) only. The Camila-hosted tab's language comes
// from the surrounding dashboard session ($_CAMILA['lang'], PHP-side — see
// dashboard-grugnetto-go.inc.php), same as every other plugin here; this game overriding that on
// its own, only for itself, would be inconsistent with how the rest of the app behaves. index.html
// exposes window.setGrugnettoLanguage()/window.grugnettoAvailableLanguages/
// window.grugnettoCurrentLanguage ONLY when it's the one bootstrapping window.I18N in the first
// place (see its own inline module script) — the Camila-hosted dashboard mount injects
// window.I18N via PHP instead and never defines these, which is exactly the signal SettingsScreen()
// below uses to hide the whole language field there.
function onLanguageChange(e) {
  if (typeof window.setGrugnettoLanguage !== "function") return;
  window.setGrugnettoLanguage(e.target.value);
  mount();
}

function SettingsScreen() {
  const volumePercent = Math.round(settings.getVolume() * 100);
  const canSwitchLanguage = typeof window.setGrugnettoLanguage === "function";
  return html`
    <div class="py-3">
      <div class="level mb-3">
        <div class="level-left">
          <button class="button is-small" data-menu-default data-menu-back @click=${backToTitle}>
            <i class="ri-arrow-go-back-line mr-1"></i>${t("grugnettogo.back")}
          </button>
        </div>
      </div>
      <h2 class="title is-4 has-text-centered mb-4">${t("grugnettogo.settings")}</h2>
      <div style="max-width: 360px; margin: 0 auto;">
        <div class="field">
          <label class="label">${t("grugnettogo.settings.volume", volumePercent)}</label>
          <input class="grugnetto-go-volume-slider" type="range" min="0" max="100" step="5"
            .value=${String(volumePercent)} @input=${onVolumeInput}>
        </div>
        ${canSwitchLanguage ? html`
          <div class="field">
            <label class="label">${t("grugnettogo.settings.language")}</label>
            <div class="select is-fullwidth">
              <select @change=${onLanguageChange}>
                ${window.grugnettoAvailableLanguages.map(lang => html`
                  <option value=${lang} ?selected=${window.grugnettoCurrentLanguage === lang}>${lang.toUpperCase()}</option>
                `)}
              </select>
            </div>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

// isDefault marks the tile that should grab focus first when this screen appears (see
// ensureMenuFocus()) — always the first tile in the grid, never the "Indietro" button above it.
// Practice mode only reaches this screen (Arcade mode never visits world-select at all, see
// chooseArcade()) — no lock state left to check (see progress.js's own header comment on why
// isWorldUnlocked() was removed), so every world with real levels is always selectable. "coming
// soon" (an empty levels array) is a separate, unrelated concept — still checked.
function WorldTile(world, isDefault) {
  const hasLevels = world.levels.length > 0;
  const completed = world.levels.filter(l => progress.isLevelComplete(world.id, l.level)).length;
  return html`
    <div class="column is-half-mobile is-one-quarter-tablet">
      <div class="box has-text-centered pj-tile ${hasLevels ? "" : "pj-tile-locked"}" style="--pj-accent: ${world.accent}">
        <p class="pj-tile-emoji">${world.emoji}</p>
        <p class="title is-5 mb-2">${t(`grugnettogo.world.${world.id}.name`)}</p>
        ${!hasLevels ? html`<p class="tag is-light">${t("grugnettogo.world.comingsoon")}</p>` : ""}
        ${hasLevels ? html`<p class="help mb-3">${completed} / ${world.levels.length}</p>` : ""}
        <button
          class="button is-primary"
          ?disabled=${!hasLevels}
          ?data-menu-default=${isDefault}
          @click=${() => selectWorld(world.id)}
        >${t("grugnettogo.world.select")}</button>
      </div>
    </div>
  `;
}

function WorldSelectScreen() {
  return html`
    <div class="py-3">
      <div class="level mb-3">
        <div class="level-left">
          <button class="button is-small" data-menu-back @click=${goToModeSelect}>
            <i class="ri-arrow-go-back-line mr-1"></i>${t("grugnettogo.back")}
          </button>
        </div>
      </div>
      <h2 class="title is-4 has-text-centered mb-4">${t("grugnettogo.world.select")}</h2>
      <div class="columns is-multiline">
        ${WORLDS.map((w, i) => WorldTile(w, i === 0))}
      </div>
    </div>
  `;
}

// isDefault: same "first tile, not the back button" rule as WorldTile above.
function LevelTile(world, levelEntry, isDefault) {
  const done = progress.isLevelComplete(world.id, levelEntry.level);
  return html`
    <div class="column is-half-mobile is-one-quarter-tablet">
      <div class="box has-text-centered pj-tile ${done ? "pj-tile-done" : ""}" style="--pj-accent: ${world.accent}">
        <p class="pj-tile-badge">${levelEntry.level}</p>
        ${done ? html`<i class="ri-checkbox-circle-fill has-text-success mb-1"></i>` : ""}
        <p class="title is-6 mb-3">${t("grugnettogo.level.number", levelEntry.level)}</p>
        <button class="button is-primary" ?data-menu-default=${isDefault} @click=${() => selectLevel(world.id, levelEntry.level)}>
          ${t("grugnettogo.play")}
        </button>
      </div>
    </div>
  `;
}

function LevelSelectScreen() {
  const world = WORLDS.find(w => w.id === uiState.currentWorld);
  if (!world) return "";
  return html`
    <div class="py-3">
      <div class="level mb-3">
        <div class="level-left">
          <button class="button is-small" data-menu-back @click=${backToWorldSelect}>
            <i class="ri-arrow-go-back-line mr-1"></i>${t("grugnettogo.back")}
          </button>
        </div>
      </div>
      <h2 class="title is-4 has-text-centered mb-4">${t(`grugnettogo.world.${world.id}.name`)} — ${t("grugnettogo.level.select")}</h2>
      <div class="columns is-multiline">
        ${world.levels.map((l, i) => LevelTile(world, l, i === 0))}
      </div>
    </div>
  `;
}

function LoadingOverlay() {
  return html`
    <div class="grugnetto-go-loading-overlay">
      <p class="title is-5 has-text-white">${t("grugnettogo.loading")}</p>
    </div>
  `;
}

// Arcade mode branch requested live: "li devo fare in sequenza" means no free level-select/
// world-select to offer here at all, and finishing world4's last level is a genuinely different
// moment (the whole run is done) from finishing an ordinary level mid-run — findNextGlobalLevel()
// returning null is exactly that distinction (see worlds.js's own comment on it).
// Shared by both LevelCompleteOverlay() branches below — the three level-completion bonuses
// (see game.js's own comment on TIME_BONUS_MAX/NO_DAMAGE_BONUS/COIN_CLEAR_BONUS) are computed
// identically in Arcade and Practice (goal.js doesn't branch on mode), so the breakdown reads
// the same three game.data.last*Bonus fields either way. Each line only shows when its bonus
// actually fired (0 lines shown reads as "no bonuses this run" rather than a wall of "+0"s).
function BonusBreakdown() {
  if (!game.data.lastTimeBonus && !game.data.lastNoDamageBonus && !game.data.lastCoinsBonus) {
    return "";
  }
  return html`
    <div class="content is-small mb-4">
      ${game.data.lastTimeBonus > 0 ? html`<p class="mb-1">${t("grugnettogo.bonus.time", game.data.lastTimeBonus)}</p>` : ""}
      ${game.data.lastNoDamageBonus > 0 ? html`<p class="mb-1">${t("grugnettogo.bonus.nodamage", game.data.lastNoDamageBonus)}</p>` : ""}
      ${game.data.lastCoinsBonus > 0 ? html`<p class="mb-1">${t("grugnettogo.bonus.coins", game.data.lastCoinsBonus)}</p>` : ""}
    </div>
  `;
}

// Confetti burst — CSS-only animation (see app.css's own .grugnetto-go-confetti* rules), no new
// asset/library. Shown ONLY for Arcade's "run complete" moment (finishing world4's last level),
// not on any of the other 31 ordinary level-completes — requested live ("quale celebration?" /
// "cosa mi suggerisci?"): a burst on every single level would be gaudy noise, but the one time
// the whole run is actually finished deserves more than the same plain overlay every level gets.
// Randomized per render (position/timing/color/spin) — purely decorative, so this is exactly the
// "explicitly randomized, isolated to one spot" cosmetic case AGENTS.md's determinism principle
// carves out; it never reads or writes game.data or any gameplay state. Rotation is animated via
// the --rot custom property (not an inline transform:rotate()) specifically because a CSS
// animation's own keyframes fully own the `transform` property while running — a static inline
// transform on the same property would just be silently overridden the instant the animation
// starts, not combined with it.
const CONFETTI_COLORS = ["#f14668", "#ffce54", "#48c774", "#3298dc", "#ff6f91"];
const CONFETTI_PIECES = 40;
function Confetti() {
  return html`
    <div class="grugnetto-go-confetti" aria-hidden="true">
      ${Array.from({ length: CONFETTI_PIECES }, (_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = 2.5 + Math.random() * 1.5;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const spins = 1 + Math.round(Math.random() * 2);
        return html`
          <span class="grugnetto-go-confetti-piece" style="left:${left}%; animation-delay:${delay}s; animation-duration:${duration}s; background:${color}; --rot:${spins * 360}deg"></span>
        `;
      })}
    </div>
  `;
}

function LevelCompleteOverlay() {
  if (uiState.mode === "arcade") {
    const next = findNextGlobalLevel(uiState.currentWorld, uiState.currentLevel);
    return html`
      <div class="grugnetto-go-complete-overlay">
        <div class="box has-text-centered">
          <p class="title is-4 mb-4">${t(next ? "grugnettogo.won" : "grugnettogo.arcade.complete")}</p>
          ${BonusBreakdown()}
          ${next ? html`
            <button class="button is-primary is-medium" data-menu-default @click=${arcadeNextLevel}>
              ${t("grugnettogo.level.complete.next")} (${arcadeAutoAdvanceRemaining})
            </button>
          ` : html`
            <button class="button is-primary is-medium" data-menu-default @click=${backToTitleFromRun}>
              ${t("grugnettogo.hometitle")}
            </button>
          `}
        </div>
        ${!next ? Confetti() : ""}
      </div>
    `;
  }
  const hasNext = findLevel(uiState.currentWorld, uiState.currentLevel + 1) !== null;
  return html`
    <div class="grugnetto-go-complete-overlay">
      <div class="box has-text-centered">
        <p class="title is-4 mb-4">${t("grugnettogo.won")}</p>
        ${BonusBreakdown()}
        ${hasNext ? html`
          <button class="button is-primary is-medium mb-2" data-menu-default @click=${nextLevel}>
            ${t("grugnettogo.level.complete.next")}
          </button><br>
        ` : ""}
        <button class="button mb-2" ?data-menu-default=${!hasNext} @click=${backToLevelSelect}>${t("grugnettogo.level.complete.levels")}</button><br>
        <button class="button" @click=${backToWorldSelectFromComplete}>${t("grugnettogo.level.complete.worlds")}</button>
      </div>
    </div>
  `;
}

// Arcade mode branch requested live: 8 lives spent sends the player straight back to the title
// screen, no retry/level-select offered (there's no level-select to offer in this mode anyway,
// and a mid-run retry would undercut the "one shared life pool for the whole run" premise).
function GameOverOverlay() {
  if (uiState.mode === "arcade") {
    return html`
      <div class="grugnetto-go-complete-overlay">
        <div class="box has-text-centered">
          <p class="title is-4 mb-4">${t("grugnettogo.gameover")}</p>
          <button class="button is-primary is-medium" data-menu-default @click=${backToTitleFromRun}>${t("grugnettogo.hometitle")}</button>
        </div>
      </div>
    `;
  }
  return html`
    <div class="grugnetto-go-complete-overlay">
      <div class="box has-text-centered">
        <p class="title is-4 mb-4">${t("grugnettogo.gameover")}</p>
        <button class="button is-primary is-medium mb-2" data-menu-default @click=${retryLevel}>${t("grugnettogo.gameover.retry")}</button><br>
        <button class="button" @click=${backToLevelSelect}>${t("grugnettogo.level.complete.levels")}</button>
      </div>
    </div>
  `;
}

// On-screen touch controls — requested live ("mettiamo 3 e 5" against a readiness review that
// flagged no way to play on a touch-only device: keyboard and physical gamepad were the only
// input paths). HAS_TOUCH is a device capability, computed once (not per-render, not something
// that changes mid-session) — showing the overlay on any touch-capable device (including hybrid
// laptops with both a touchscreen and a keyboard) rather than trying to guess "is this really a
// phone" from screen size; extra on-screen buttons are harmless clutter for someone who'd rather
// use a real keyboard, but their total absence is a hard blocker for someone who can't.
//
// touchKey() drives me.input.triggerKeyEvent(keyCode, status) — confirmed against melonJS
// 19.9.1's own source (packages/melonjs/src/input/keyboard.ts): this is melonJS's own official,
// documented way to simulate a real key press/event ("me.input.triggerKeyEvent(me.input.KEY.LEFT,
// true)" is the library's own example), calling the exact same internal keyDownEvent/keyUpEvent
// handlers a real KeyboardEvent would. Concretely this means isKeyPressed() and the existing
// bindKey() "lock" edge-triggering (which the super-jump mechanic in player.js depends on) both
// behave identically regardless of whether a press came from a physical key or a touch button —
// zero changes needed anywhere in player.js. preventDefault() on every handler stops the browser's
// own touch gestures (scroll, double-tap-zoom) from firing on top of a control tap; CSS's
// touch-action:none (see app.css) is the belt-and-suspenders version of the same thing.
// pointerup/pointercancel/pointerleave all release the same key — a finger sliding off a button
// mid-press should stop moving/jumping, same as lifting a real key would; triggering a release for
// a key that's already up is a harmless no-op on melonJS's side.
const HAS_TOUCH = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
function touchKey(keyCode, status) {
  return (e) => {
    e.preventDefault();
    me.input.triggerKeyEvent(keyCode, status);
  };
}
function TouchControls() {
  if (!HAS_TOUCH || uiState.screen !== "playing") return "";
  return html`
    <div class="grugnetto-go-touch-controls">
      <div class="grugnetto-go-touch-move">
        <button class="grugnetto-go-touch-btn"
          @pointerdown=${touchKey(me.input.KEY.LEFT, true)}
          @pointerup=${touchKey(me.input.KEY.LEFT, false)}
          @pointercancel=${touchKey(me.input.KEY.LEFT, false)}
          @pointerleave=${touchKey(me.input.KEY.LEFT, false)}>
          <i class="ri-arrow-left-line"></i>
        </button>
        <button class="grugnetto-go-touch-btn"
          @pointerdown=${touchKey(me.input.KEY.RIGHT, true)}
          @pointerup=${touchKey(me.input.KEY.RIGHT, false)}
          @pointercancel=${touchKey(me.input.KEY.RIGHT, false)}
          @pointerleave=${touchKey(me.input.KEY.RIGHT, false)}>
          <i class="ri-arrow-right-line"></i>
        </button>
      </div>
      <button class="grugnetto-go-touch-btn grugnetto-go-touch-jump"
        @pointerdown=${touchKey(me.input.KEY.UP, true)}
        @pointerup=${touchKey(me.input.KEY.UP, false)}
        @pointercancel=${touchKey(me.input.KEY.UP, false)}
        @pointerleave=${touchKey(me.input.KEY.UP, false)}>
        <i class="ri-arrow-up-line"></i>
      </button>
    </div>
  `;
}

// The melonJS canvas is injected by the engine into #grugnetto-go-screen's DOM subtree directly
// (not through lit-html) — same reasoning as the Leaflet map containers elsewhere in this
// plugin's sibling SPAs: that div has no lit-html child expressions, so re-rendering the HUD
// around it never touches what melonJS put inside. This is why #grugnetto-go-wrapper stays
// UNCONDITIONALLY present in this template forever (never wrapped in a screen ternary) — only
// its `display` style toggles, via the wrapperVisible check below. Every other overlay
// (HUD/loading/level-complete) is a plain SIBLING of #grugnetto-go-screen, safe to conditionally
// add/remove since none of them touch that div.
//
// Outer container is "pt-0" only — its "pb-4" was removed (requested live: "è il pb-4 nel
// container... toglilo"), diagnosed as the root cause of an unwanted page scrollbar on the
// standalone page (index.html): that page's own CSS makes .spa-title-box below claim
// min-height:100vh (the whole viewport) on its own, so this container's leftover ~1rem bottom
// padding pushed the total rendered height past 100vh. Harmless to drop for the Camila-hosted tab
// too — that context never had min-height:100vh in the first place, so pb-4 there was just a
// small, non-functional bit of trailing whitespace below the box.
function App() {
  const wrapperVisible = WRAPPER_VISIBLE_SCREENS.includes(uiState.screen);
  return html`
    <div class="container pt-0">
      <div class="box spa-title-box">
        ${uiState.loadError ? html`
          <article class="message is-danger">
            <div class="message-body">${t("grugnettogo.error.load", uiState.loadError)}</div>
          </article>
        ` : ""}

        ${uiState.screen === "title" ? TitleScreen() : ""}
        ${uiState.screen === "mode-select" ? ModeSelectScreen() : ""}
        ${uiState.screen === "world-select" ? WorldSelectScreen() : ""}
        ${uiState.screen === "level-select" ? LevelSelectScreen() : ""}
        ${uiState.screen === "credits" ? CreditsScreen() : ""}
        ${uiState.screen === "settings" ? SettingsScreen() : ""}

        <div id="grugnetto-go-wrapper" style="display:${wrapperVisible ? "" : "none"}">
          <div id="grugnetto-go-screen"></div>
          <div class="grugnetto-go-hud-overlay">
            <!-- Counters group — requested live ("i contatori li sposterei in alto a sx nell'area
                 di gioco - tutto a sx tranne full screen e back"): every readout (world/level,
                 lives, super jump, invincibility, coins, score, combo) now anchors to the play
                 area's top-LEFT corner as its own flex group, instead of sharing one flex-end row
                 with the back/fullscreen buttons — see app.css's own .grugnetto-go-hud-overlay
                 (space-between, not flex-end) for the actual left/right split. -->
            <div class="grugnetto-go-hud-counters">
              <span class="tag is-primary is-medium mr-2">
                <i class="ri-map-2-line mr-1"></i>${t("grugnettogo.hud.worldlevel", WORLDS.findIndex(w => w.id === uiState.currentWorld) + 1, uiState.currentLevel)}
              </span>
              <span class="tag is-danger is-medium mr-2">
                <i class="ri-heart-3-fill mr-1"></i>${game.data.lives}
              </span>
              <!-- Super jump gauge — requested live ("una barra di consumo del supersalto"): the
                   outer shell reuses Bulma's own .tag.is-dark.is-medium (same sizing/padding/font
                   as every other HUD tag beside it), with a compact custom bar inside instead of
                   Bulma's block-level <progress> element, which wouldn't fit this single-row HUD.
                   Width is set via inline style since lit-html can't express a CSS calc() with a
                   dynamic ratio through a plain class — see app.css's own
                   .grugnetto-go-superjump-bar-* rules for the static track/fill styling. The
                   is-empty class (dims the whole tag) is a separate, explicit "this is currently
                   unusable" cue on top of the bar just reading 0% — requested live ("quando finisce
                   la super jump... deve essere disabilitato"): the mechanic itself was already
                   gated on game.data.superJumps > 0 (see player.js's update()), this only makes
                   that state visibly obvious rather than relying on the player to notice an empty
                   bar on their own. -->
              <span class="tag is-dark is-medium mr-2 grugnetto-go-superjump-bar ${game.data.superJumps <= 0 ? "is-empty" : ""}" title=${t("grugnettogo.superjump", game.data.superJumps, SUPERJUMP_MAX)}>
                <i class="ri-rocket-2-line mr-1"></i>
                <span class="grugnetto-go-superjump-bar-track">
                  <span class="grugnetto-go-superjump-bar-fill" style="width:${(game.data.superJumps / SUPERJUMP_MAX) * 100}%"></span>
                </span>
              </span>
              ${game.data.invincibleUntil > Date.now() ? html`
                <span class="tag is-link is-medium mr-2">
                  <i class="ri-shield-flash-line mr-1"></i>${t("grugnettogo.immune")}
                </span>
              ` : ""}
              <span class="tag is-warning is-medium mr-2">
                <i class="ri-coin-line mr-1"></i>${game.data.coins} / ${game.data.totalCoins}
              </span>
              <span class="tag is-info is-medium mr-2">${t("grugnettogo.score", game.data.score)}</span>
              <!-- Combo indicator — requested live ("capire se ci sono altre idee per rendere il
                   punteggio più variabile"): only shown once a chain is actually running (combo=0
                   right after a pickup resets/expires would just be visual noise every level).
                   comboMultiplier() is the same pure function game.js's addComboScore() uses
                   internally, kept in sync by construction rather than duplicating the x/3 math
                   here. -->
              ${game.data.combo > 0 ? html`
                <span class="tag is-success is-medium">
                  <i class="ri-fire-line mr-1"></i>${t("grugnettogo.combo", comboMultiplier(game.data.combo))}
                </span>
              ` : ""}
            </div>
            <!-- Back + fullscreen stay paired together on the opposite (right) side from the
                 counters group above — still hidden in Arcade mode: backToLevelSelect() would
                 drop into a free level-picker that mode deliberately doesn't have (see
                 chooseArcade()'s own comment) — there's no mid-run "abandon and go pick a
                 different level" escape hatch in this mode, only finishing the run or running
                 out of lives. -->
            <div class="grugnetto-go-hud-actions">
              ${uiState.screen === "playing" && uiState.mode !== "arcade" ? html`
                <button class="button is-small mr-2" @click=${backToLevelSelect} title=${t("grugnettogo.back")}>
                  <i class="ri-arrow-go-back-line"></i>
                </button>
              ` : ""}
              <button class="button is-small" ?disabled=${!uiState.engineReady} @click=${toggleFullscreen} title=${t("grugnettogo.fullscreen")}>
                <i class="ri-${uiState.isFullscreen ? "fullscreen-exit-line" : "fullscreen-line"}"></i>
              </button>
            </div>
          </div>
          ${TouchControls()}
          ${uiState.screen === "loading" ? LoadingOverlay() : ""}
          ${uiState.screen === "level-complete" ? LevelCompleteOverlay() : ""}
          ${uiState.screen === "gameover" ? GameOverOverlay() : ""}
        </div>
      </div>
    </div>
  `;
}

// A screen change that HIDES #grugnetto-go-wrapper while it's still the active fullscreen
// element (e.g. the HUD's own back button, reachable mid-fullscreen, going from "playing" to
// "level-select") left the browser stuck showing an empty fullscreen surface: the Fullscreen API
// doesn't auto-exit just because its target got display:none, but everything that screen is
// supposed to show (world/level tiles) lives OUTSIDE that element, so none of it was visible or
// clickable — reported live as "non riesco più a cliccare nulla". Exiting fullscreen first, right
// here before the render that would hide the wrapper, means the browser is back to its normal
// windowed layout by the time that content needs to be seen. The later "fullscreenchange" event
// (see its own listener above) still does the authoritative uiState.isFullscreen sync + resize
// once the exit actually completes — this call just kicks that off proactively instead of
// leaving the player stranded on a blank screen until they notice and hit Esc themselves.
function mount() {
  if (!WRAPPER_VISIBLE_SCREENS.includes(uiState.screen) && uiState.engineReady && me.game.isFullscreen()) {
    me.game.exitFullscreen();
  }
  render(App(), root);
  ensureMenuFocus();
}

mount();

// No longer starts automatically at page load — the engine (me.video.init + asset preload) only
// boots the first time the player actually picks a level, from selectLevel() above. This keeps
// the title/world-select/level-select screens instant (pure lit-html, no melonJS dependency at
// all) instead of making the player wait through a preload before they can even see a menu.
function start(initialResource, initialMusic, initialOptions) {
  return new Promise((resolve, reject) => {
    // melonJS requires the engine to signal readiness (device detection etc.) before any other
    // call — found live: "me.video.init() called before engine initialization" without this.
    device.onReady(() => {
      try {
        startEngine(initialResource, initialMusic, initialOptions);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }).catch(e => {
    uiState.loadError = e?.message || String(e);
    mount();
  });
}

function startEngine(initialResource, initialMusic, initialOptions) {
  if (!me.video.init(1024, 576, {
    parent: "grugnetto-go-screen",
    // Design resolution = 16x9 tiles at 64px, chosen for a 16:9 ratio (matching most screens,
    // to minimize fullscreen letterboxing — see app.css's :fullscreen rule) instead of the
    // original 960x640 (15x10 tiles, 3:2), which had no particular reason behind its own ratio
    // beyond being round tile counts. Purely a camera/viewport change — one tile more visible
    // horizontally, one less vertically; melonJS clamps the camera to the level's own bounds
    // regardless of this window size, so no level/entity code needed touching.
    //
    // "flex-width" only resizes the canvas's WIDTH to fit its container, leaving the height
    // fixed at the requested design height regardless of the actual browser window — reported
    // live as forcing a page scrollbar, since that height plus the HUD/nav chrome above it often
    // exceeds the visible viewport. "fit" (letterboxed) scales BOTH dimensions to stay inside
    // whatever size the measured element actually has — see scaleTarget below for which element
    // that is, and app.css for the sizing rules on #grugnetto-go-screen (including its own
    // :fullscreen rule).
    scaleMethod: "fit",
    // Without this, melonJS's resize logic (application/resize.ts) measures
    // device.getParentElement(parentElement) — i.e. #grugnetto-go-screen's DOM *parent*
    // (#grugnetto-go-wrapper), not #grugnetto-go-screen itself — confirmed by reading melonJS's
    // own source. That parent doesn't change size on its own when only #grugnetto-go-screen (not
    // the wrapper) is fullscreened — which is exactly why toggleFullscreen() above fullscreens
    // the wrapper instead: fullscreen only affects the requested element, not its ancestors, and
    // this way #grugnetto-go-screen's own parent IS the fullscreen element. scaleTarget still
    // makes melonJS measure #grugnetto-go-screen's own getBoundingClientRect() directly rather
    // than relying on that parent-measurement default at all — belt and suspenders, since
    // #grugnetto-go-screen fills its parent exactly either way (see app.css's inset:0 rule) —
    // and is what fixed the canvas staying pinned at its old small pre-fullscreen size in the
    // top-left corner, reported live before this was added.
    scaleTarget: "grugnetto-go-screen",
    renderer: me.video.AUTO,
    // Default is false ("crisp"/nearest-neighbor scaling) — fine for the tile/coin/flag/enemy
    // art, which is all drawn at native 1:1 size with no scaling involved anyway, but the
    // player sprite (Grugnetto) is a detailed painterly illustration scaled down ~4x (345px
    // art -> ~84px on screen), and nearest-neighbor downscaling of that much fine brushwork
    // reads as "sgranato" (grainy/jagged) — reported live. True enables smooth interpolation.
    antiAlias: true,
  })) {
    uiState.loadError = "HTML5 canvas not supported";
    mount();
    return;
  }

  // me.game (used by the fullscreen button's click handler) only exists from this point on —
  // it's created internally by me.video.init() above.
  uiState.engineReady = true;
  mount();

  // Our tileset is a "collection of images" (see resources.js), which the WebGL2 shader
  // tilemap path can't handle — it always falls back to the legacy per-tile renderer anyway,
  // just with a console.warn on every layer first. Disabling it up front skips that fallback
  // dance silently; no rendering change, since it was never actually eligible.
  me.game.world.gpuTilemap = false;

  // All of this game's sound assets are .ogg only (that's what the New Platformer Pack and
  // Music Jingles ship) — must run before loader.preload() below, since the audio loader
  // builds each request URL as `${src}${name}.${ext}` using whichever format(s) this lists.
  me.audio.init("ogg");

  // Apply the player's saved master volume the moment me.audio actually exists (right after
  // init(), not deferred to loadLevel()/etc.) — see settings.js/SettingsScreen()'s own comment;
  // setMasterVolume() itself is a try/catch no-op if this somehow still runs too early.
  setMasterVolume(settings.getVolume());

  me.loader.setOptions({ crossOrigin: "anonymous" });

  // Audio loads separately, in the background, via individual me.audio.load() calls — NOT
  // through a second me.loader.preload() — see resources.js for why it can't block game start
  // in the first place (browsers suspend the AudioContext until a real user gesture). Found
  // live: calling me.loader.preload() a *second* time (for audioResources, in parallel with
  // the main one below) intermittently made the main preload's callback fire before every one
  // of ITS OWN assets had actually finished loading — e.g. "tile '4' not found" for a tile
  // image whose network request just hadn't completed yet. me.loader.preload() apparently
  // tracks pending-asset count in shared/global state, so two concurrent calls stomp on each
  // other's counters. me.audio.load() has no such shared counter, so this is race-free.
  audioResources.forEach((sound) => me.audio.load(sound));

  // Browsers only allow the AudioContext to leave "suspended" from inside a real user gesture
  // handler — resuming it here, on the very first click/keypress anywhere on the page, is the
  // standard "click to unlock audio" pattern every browser game needs.
  const unlockAudio = () => {
    const ctx = me.audio.getAudioContext ? me.audio.getAudioContext() : null;
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  };
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });

  me.loader.preload(resources, () => {
    me.pool.register("mainPlayer", PlayerEntity);
    me.pool.register("CoinEntity", CoinEntity, true);
    me.pool.register("GoalEntity", GoalEntity);
    me.pool.register("EnemyEntity", EnemyEntity, true);
    me.pool.register("BonusEntity", BonusEntity, true);
    me.pool.register("PropEntity", PropEntity, true);
    me.pool.register("TrapCoinEntity", TrapCoinEntity, true);

    me.state.set(me.state.PLAY, new PlayScreen());
    // Passing initialResource/initialMusic/initialOptions as extraArgs — confirmed against
    // state.ts: change() forwards ...extraArgs straight into the target Stage's
    // onResetEvent(app, ...extraArgs). The explicit `false` is forceChange, NOT a spot for the
    // resource — change(id, resource) would silently misuse the (truthy string) resource as
    // forceChange instead. initialOptions is undefined for a Practice-mode first pick (PlayScreen
    // forwards it straight to loadLevel(), which already treats undefined as "use the defaults").
    me.state.change(me.state.PLAY, false, initialResource, initialMusic, initialOptions);
  });

  // Registered once, here, since startEngine() only ever runs once per page load. Three guarded
  // transitions live in the same listener: the first swing from "loading" to "playing" (fired by
  // loadLevel()'s own initial game.notify(), before its onLoaded/totalCoins follow-up — an
  // imperceptible ~1 frame where totalCoins is still 0, deliberately not worth a second pub/sub
  // channel just to close that gap), the win transition, and the game-over transition — both of
  // the latter guarded on screen==="playing" so each only fires once (re-mounts while already on
  // "level-complete"/"gameover" don't re-trigger them). player.js's respawn() is the only place
  // that ever sets status to "gameover" (see its own comment) — it just flips the flag, this
  // listener is what actually knows what a "screen" is and navigates.
  game.onChange(() => {
    if (uiState.screen === "loading") {
      uiState.screen = "playing";
    }
    if (game.data.status === "won" && uiState.screen === "playing") {
      progress.markLevelComplete(uiState.currentWorld, uiState.currentLevel);
      uiState.screen = "level-complete";
      // Arcade only, and only when there's actually a next level to advance to — see
      // startArcadeAutoAdvance()'s own comment for why the "you finished the whole run" case is
      // deliberately excluded. That case gets its own one-shot treatment instead — the confetti
      // (LevelCompleteOverlay()'s own Confetti() call, driven purely by render-time state) and
      // this fanfare (which, unlike confetti, has to fire exactly once HERE rather than from the
      // render function — see playArcadeFanfare()'s own comment on why).
      if (uiState.mode === "arcade" && findNextGlobalLevel(uiState.currentWorld, uiState.currentLevel)) {
        startArcadeAutoAdvance();
      } else if (uiState.mode === "arcade") {
        playArcadeFanfare();
      }
    }
    if (game.data.status === "gameover" && uiState.screen === "playing") {
      uiState.screen = "gameover";
    }
    mount();
  });
}
