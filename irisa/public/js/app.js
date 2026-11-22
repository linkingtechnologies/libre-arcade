// SPDX-License-Identifier: GPL-3.0-only
// Libre Arcade addition: wires upstream's game logic (js/game/) to the page.
// The key map and the no-repeat rule are upstream's src/index.js.

import { A, D, DOWN, LEFT, R, RIGHT, S, UP, W } from './game/keycodes.js';
import levels from './game/levels.js';
import store from './game/store.js';
import { createClock } from './clock.js';
import { createI18n, LANG_KEY, pickLanguage, STRINGS } from './i18n.js';
import { createRenderer } from './render.js';
import { createSound } from './sound.js';

const $ = id => document.getElementById(id);

function storageGet (key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet (key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

const MUTE_KEY = 'irisa-muted';
const P = 80;
const M = 77;
const ESC = 27;
const SWIPE_DISTANCE = 24;

const i18n = createI18n(pickLanguage(storageGet(LANG_KEY), navigator.languages || [navigator.language]));
const sound = createSound({ muted: storageGet(MUTE_KEY) === '1' });
const clock = createClock();

store.clock = clock;
store.playSound = name => sound.play(name);

let screen = 'title'; // title | playing | paused | complete

// ---- Text -------------------------------------------------------------

function applyLanguage () {
  const lang = i18n.lang;
  document.documentElement.lang = lang;
  document.title = i18n.t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = i18n.t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    el.setAttribute('aria-label', i18n.t(el.dataset.i18nLabel));
  });
  $('howList').replaceChildren(...i18n.t('how').map(text => {
    const li = document.createElement('li');
    li.textContent = text;
    return li;
  }));
  $('credits').innerHTML = [i18n.t('creditsGame'), i18n.t('creditsSound'), i18n.t('creditsArcade')]
    .map(line => `<span>${line}</span>`).join('');
  $('langBtn').textContent = lang.toUpperCase();
  $('langBtn').title = i18n.t('language');
  $('pauseBtn').title = i18n.t('pause');
  $('restartBtn').title = i18n.t('restart');
  renderSoundButton();
  renderLevelLabels();
}

function renderSoundButton () {
  const btn = $('soundBtn');
  btn.setAttribute('aria-pressed', String(!sound.muted));
  btn.setAttribute('aria-label', i18n.t(sound.muted ? 'soundOff' : 'soundOn'));
  btn.title = i18n.t(sound.muted ? 'soundOff' : 'soundOn');
  btn.classList.toggle('is-muted', sound.muted);
}

function renderLevelLabels () {
  renderer.dots.forEach((dot, n) => {
    dot.setAttribute('aria-label', i18n.t('levelLabel', { n: n + 1 }));
    dot.title = i18n.t('levelLabel', { n: n + 1 });
  });
}

function announce (text) {
  $('live').textContent = text;
}

// ---- Screens ----------------------------------------------------------

function setScreen (next) {
  screen = next;
  document.body.className = document.body.className
    .replace(/\bscreen-\w+/g, '').trim() + ` screen-${next}`;
  $('titleScreen').classList.toggle('open', next === 'title');
  $('pauseScreen').classList.toggle('open', next === 'paused');
  $('completeScreen').classList.toggle('open', next === 'complete');
  const focusTarget = { title: 'playBtn', paused: 'resumeBtn', complete: 'againBtn' }[next];
  if (focusTarget) {
    $(focusTarget).focus({ preventScroll: true });
  } else if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}

function startGame () {
  sound.unlock();
  clock.resume();
  store.loadLevel(0);
  setScreen('playing');
}

function pauseGame () {
  if (screen !== 'playing') {
    return;
  }
  clock.pause();
  setScreen('paused');
}

function resumeGame () {
  if (screen !== 'paused') {
    return;
  }
  clock.resume();
  setScreen('playing');
}

function toMenu () {
  clock.resume();
  clock.cancelAll();
  setScreen('title');
}

function restartLevel () {
  if (screen === 'paused') {
    clock.resume();
    setScreen('playing');
  }
  if (screen === 'playing' || screen === 'paused') {
    store.reloadLevel();
  }
}

function toggleMute () {
  sound.setMuted(!sound.muted);
  storageSet(MUTE_KEY, sound.muted ? '1' : '0');
  renderSoundButton();
}

function toggleLanguage () {
  const langs = Object.keys(STRINGS);
  i18n.set(langs[(langs.indexOf(i18n.lang) + 1) % langs.length]);
  storageSet(LANG_KEY, i18n.lang);
  applyLanguage();
  announceState({ level: store.state.currentLevelNumber, gameState: store.state.gameState });
}

store.onAllComplete = () => {
  clock.cancelAll();
  setScreen('complete');
};

// ---- Rendering --------------------------------------------------------

function announceState ({ level, gameState }) {
  if (screen !== 'playing') {
    return;
  }
  if (gameState === 'WON') {
    announce(i18n.t('won'));
  } else if (gameState === 'LOST') {
    announce(i18n.t('lost'));
  } else {
    announce(i18n.t('levelN', { n: level + 1, total: levels.length }));
  }
}

const renderer = createRenderer({
  app: $('app'),
  board: $('board'),
  nav: $('levels'),
  store,
  levelCount: levels.length,
  // Upstream's hidden switch for jumping to any level (levelbutton.js).
  isDevMode: () => storageGet('dev') === 'true',
  onLevelButton: n => {
    if (screen === 'playing') {
      store.loadLevel(n);
    }
  },
  onChange: announceState,
});

function frame () {
  renderer.render();
  requestAnimationFrame(frame);
}

// ---- Input ------------------------------------------------------------

const moves = {
  up: () => store.movePlayerUp(),
  left: () => store.movePlayerLeft(),
  down: () => store.movePlayerDown(),
  right: () => store.movePlayerRight(),
};

const keyHandlers = {
  [UP]: moves.up,
  [LEFT]: moves.left,
  [DOWN]: moves.down,
  [RIGHT]: moves.right,

  [W]: moves.up,
  [A]: moves.left,
  [S]: moves.down,
  [D]: moves.right,

  [R]: () => store.reloadLevel(),
};

const keysCurrentlyPressed = new Set();

document.addEventListener('keydown', evt => {
  const { keyCode } = evt;

  if (evt.ctrlKey || evt.metaKey || evt.altKey) {
    return;
  }

  if (keyCode === M) {
    if (!evt.repeat) {
      toggleMute();
    }
    return;
  }

  if (keyCode === P || keyCode === ESC) {
    if (screen === 'playing' || screen === 'paused') {
      evt.preventDefault();
      if (!evt.repeat) {
        (screen === 'playing' ? pauseGame : resumeGame)();
      }
    }
    return;
  }

  if (screen !== 'playing') {
    return;
  }

  // Prevent keys from repeating.
  if (keysCurrentlyPressed.has(keyCode)) {
    evt.preventDefault();
    return;
  }

  const handler = keyHandlers[keyCode];

  // Ignore keys that we lack a handler for.
  if (!handler) {
    return;
  }

  handler();
  keysCurrentlyPressed.add(keyCode);

  evt.preventDefault();
  evt.stopPropagation();
});

document.addEventListener('keyup', evt => {
  keysCurrentlyPressed.delete(evt.keyCode);
});

// A key released while the window had no focus would otherwise stay "held".
window.addEventListener('blur', () => keysCurrentlyPressed.clear());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    keysCurrentlyPressed.clear();
    pauseGame();
  }
});

function markTouch () {
  document.body.classList.add('touch');
}
if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
  markTouch();
}
window.addEventListener('touchstart', markTouch, { once: true, passive: true });

document.querySelectorAll('#dpad .pad').forEach(btn => {
  const move = () => {
    if (screen === 'playing') {
      moves[btn.dataset.dir]();
    }
  };
  btn.addEventListener('pointerdown', evt => {
    evt.preventDefault();
    sound.unlock();
    move();
  });
  // Keyboard or screen-reader activation (a real pointer click has detail > 0).
  btn.addEventListener('click', evt => {
    if (evt.detail === 0) {
      move();
    }
  });
});

// Swipe on the board.
let swipe = null;
const stage = $('stage');
stage.addEventListener('pointerdown', evt => {
  if (evt.pointerType === 'mouse') {
    return;
  }
  swipe = { id: evt.pointerId, x: evt.clientX, y: evt.clientY };
});
stage.addEventListener('pointerup', evt => {
  if (!swipe || swipe.id !== evt.pointerId) {
    return;
  }
  const dx = evt.clientX - swipe.x;
  const dy = evt.clientY - swipe.y;
  swipe = null;
  if (screen !== 'playing' || Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) {
    return;
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    (dx > 0 ? moves.right : moves.left)();
  } else {
    (dy > 0 ? moves.down : moves.up)();
  }
});
stage.addEventListener('pointercancel', () => { swipe = null; });

// ---- Buttons ----------------------------------------------------------

$('playBtn').addEventListener('click', startGame);
$('againBtn').addEventListener('click', startGame);
$('pauseBtn').addEventListener('click', () => (screen === 'paused' ? resumeGame() : pauseGame()));
$('resumeBtn').addEventListener('click', resumeGame);
$('restartBtn').addEventListener('click', restartLevel);
$('pauseRestartBtn').addEventListener('click', restartLevel);
$('menuBtn').addEventListener('click', toMenu);
$('completeMenuBtn').addEventListener('click', toMenu);
$('soundBtn').addEventListener('click', () => { sound.unlock(); toggleMute(); });
$('langBtn').addEventListener('click', toggleLanguage);

// ---- Start ------------------------------------------------------------

store.reloadLevel();
applyLanguage();
setScreen('title');
requestAnimationFrame(frame);

// Handles for the browser tests, only when the page is opened with ?irisa-test.
if (new URLSearchParams(location.search).has('irisa-test')) {
  window.__irisa = { store, clock, sound, i18n, get screen () { return screen; } };
}
