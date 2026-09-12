import { AudioSystem } from '../audio/audio.js';
import { FixedStepLoop } from '../core/fixed-step.js';
import { Game } from '../core/game.js';
import { DEFAULT_HIGH_SCORES, insertHighScore, isHighScore, normalizeHighScores } from '../core/high-scores.js';
import { LevelSet } from '../core/level.js';
import { MenuTitleAnimation } from '../core/menu-title.js';
import { PresentationSequence } from '../core/presentation.js';
import { loadAssets } from './assets.js';
import { createInput } from './input.js';
import { readPreference, writePreference } from './preferences.js';
import { TEXT } from './i18n.js';
import { Renderer } from './renderer.js';

const canvas = document.querySelector('#game');
const loading = document.querySelector('#loading');
const loadingText = document.querySelector('#loading-text');
const fatal = document.querySelector('#fatal');
const fatalTitle = document.querySelector('#fatal-title');
const fatalBody = document.querySelector('#fatal-body');
const fatalRetry = document.querySelector('#fatal-retry');
const menu = document.querySelector('#menu');
const panel = document.querySelector('#panel');
const panelTitle = document.querySelector('#panel-title');
const panelBody = document.querySelector('#panel-body');
const panelBack = document.querySelector('#panel-back');
const panelNext = document.querySelector('#panel-next');
const newGame = document.querySelector('#new-game');
const instructions = document.querySelector('#instructions');
const options = document.querySelector('#options');
const credits = document.querySelector('#credits');
const scores = document.querySelector('#scores');
const outcome = document.querySelector('#outcome');
const outcomeTitle = document.querySelector('#outcome-title');
const outcomeBody = document.querySelector('#outcome-body');
const outcomeContinue = document.querySelector('#outcome-continue');
const outcomeMenu = document.querySelector('#outcome-menu');
const scoreEntry = document.querySelector('#score-entry');
const scoreTitle = document.querySelector('#score-title');
const scorePrompt = document.querySelector('#score-prompt');
const scoreForm = document.querySelector('#score-form');
const scoreName = document.querySelector('#score-name');
const scoreSave = document.querySelector('#score-save');
const scoreSkip = document.querySelector('#score-skip');
const touchControls = document.querySelector('#touch-controls');
const pauseTouch = document.querySelector('#pause-touch');

const SCORE_KEY = 'ceferino.highScores';
const TOUCH_KEY = 'ceferino.touchControls';
const SOUND_KEY = 'ceferino.sound';
const storage = (() => { try { return globalThis.localStorage; } catch { return null; } })();
let lang = readPreference(storage, 'ceferino.lang', navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en');
let touchMode = readPreference(storage, TOUCH_KEY, 'auto');
let soundEnabled = readPreference(storage, SOUND_KEY, 'on') !== 'off';
const audio = new AudioSystem({ enabled: soundEnabled });
let mode = 'loading';
let currentPanel = null;
let panelBackdrop = 'menu';
let creditsPage = 0;
let outcomeType = null;
let pendingScoreOutcome = null;
let presentation = null;
const menuTitle = new MenuTitleAnimation();
let presentationAdvance = false;
let presentationEscape = false;
let game, renderer, loop;
const heldKeys = new Set();

function t() { return TEXT[lang]; }
function hideOverlays() { loading.hidden = fatal.hidden = menu.hidden = panel.hidden = outcome.hidden = scoreEntry.hidden = true; }
function safeLoadScores() {
  try {
    const raw = storage?.getItem?.(SCORE_KEY);
    return raw ? normalizeHighScores(JSON.parse(raw)) : DEFAULT_HIGH_SCORES.map(x => ({...x}));
  } catch { return DEFAULT_HIGH_SCORES.map(x => ({...x})); }
}
function safeSaveScores(entries) {
  try { storage?.setItem?.(SCORE_KEY, JSON.stringify(normalizeHighScores(entries))); } catch { /* storage unavailable */ }
}
function score4(points) { return String(Math.abs(points) % 10000).padStart(4, '0'); }

function applyText() {
  newGame.textContent = t().newGame;
  instructions.textContent = t().instructions;
  options.textContent = t().options;
  credits.textContent = t().credits;
  scores.textContent = t().scores;
  panelBack.textContent = t().back;
  panelNext.textContent = t().next;
  outcomeContinue.textContent = t().continue;
  outcomeMenu.textContent = t().menu;
  scoreSave.textContent = t().save;
  scoreSkip.textContent = t().skip;
  loadingText.textContent = t().loading;
  fatalTitle.textContent = t().loadErrorTitle;
  fatalBody.textContent = t().loadErrorBody;
  fatalRetry.textContent = t().retry;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  if (mode === 'panel' && currentPanel) renderPanel(currentPanel);
  if (mode === 'outcome') renderOutcome();
  if (mode === 'score-entry') renderScoreEntry();
}

function wantsTouchControls() {
  if (touchMode === 'on') return true;
  if (touchMode === 'off') return false;
  return matchMedia('(pointer: coarse)').matches || innerWidth <= 760;
}
function updateTouchVisibility() {
  const visible = mode === 'game' && wantsTouchControls();
  touchControls.hidden = !visible;
  touchControls.classList.toggle('touch-visible', visible);
}

function showMenu() {
  mode = 'menu';
  menuTitle.reset();
  menu.classList.add('title-pending'); currentPanel = null; outcomeType = null; pendingScoreOutcome = null;
  hideOverlays(); menu.hidden = false; updateTouchVisibility();
}


function startNewGame() {
  game.restartGame();
  mode = 'game'; hideOverlays(); updateTouchVisibility(); canvas.focus();
}

function startPresentation(kind) {
  presentation = new PresentationSequence(6);
  presentationAdvance = presentationEscape = false;
  mode = kind;
  hideOverlays(); updateTouchVisibility(); canvas.focus();
}

function renderPanel(type) {
  currentPanel = type;
  panelNext.hidden = true;
  panelBackdrop = 'menu';

  if (type === 'instructions') {
    panelBackdrop = 'howTo';
    panelTitle.textContent = t().instructions;
    panelBody.innerHTML = `<p>${t().goal}</p><p class="howto-copy">${t().help}</p>`;
  } else if (type === 'scores') {
    panelTitle.textContent = t().bestPoints;
    const rows = safeLoadScores().map((entry, i) => `<tr><td>${i + 1}. ${escapeHtml(entry.name)}</td><td>${score4(entry.points)}</td></tr>`).join('');
    panelBody.innerHTML = `<table class="score-table"><tbody>${rows}</tbody></table>`;
  } else if (type === 'credits') {
    panelTitle.textContent = t().credits;
    panelBody.innerHTML = `<p>${t().creditsPages[creditsPage]}</p>`;
    panelNext.hidden = creditsPage >= t().creditsPages.length - 1;
  } else if (type === 'options') {
    panelTitle.textContent = t().options;
    panelBody.innerHTML = `
      <div class="option-row"><span>${t().fullscreen}</span><button id="toggle-fullscreen">${document.fullscreenElement ? t().on : t().off}</button></div>
      <div class="option-row"><span>${t().touch}</span><button id="toggle-touch">${touchMode === 'auto' ? t().auto : touchMode === 'on' ? t().on : t().off}</button></div>
      <div class="option-row"><span>${t().sound}</span><button id="toggle-sound">${soundEnabled ? t().on : t().off}</button></div>
      <div class="option-row"><span>${t().replayIntro}</span><button id="replay-intro">${t().replayIntro}</button></div>
      <p class="option-note">${t().optionsNote}</p>`;
    panelBody.querySelector('#toggle-fullscreen').addEventListener('click', toggleFullscreen);
    panelBody.querySelector('#toggle-touch').addEventListener('click', cycleTouchMode);
    panelBody.querySelector('#toggle-sound').addEventListener('click', toggleSound);
    panelBody.querySelector('#replay-intro').addEventListener('click', () => startPresentation('intro'));
  }
}

function showPanel(type) {
  mode = 'panel'; hideOverlays(); panel.hidden = false; creditsPage = type === 'credits' ? 0 : creditsPage;
  renderPanel(type); updateTouchVisibility(); panelBack.focus();
}

function nextCredits() {
  if (currentPanel !== 'credits') return;
  if (creditsPage < t().creditsPages.length - 1) { creditsPage++; renderPanel('credits'); }
  else showMenu();
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch { /* fullscreen unavailable or denied */ }
  if (mode === 'panel' && currentPanel === 'options') renderPanel('options');
}
function cycleTouchMode() {
  touchMode = touchMode === 'auto' ? 'on' : touchMode === 'on' ? 'off' : 'auto';
  writePreference(storage, TOUCH_KEY, touchMode);
  updateTouchVisibility();
  renderPanel('options');
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  audio.setEnabled(soundEnabled);
  writePreference(storage, SOUND_KEY, soundEnabled ? 'on' : 'off');
  if (soundEnabled) audio.play('select');
  renderPanel('options');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderOutcome() {
  outcomeTitle.textContent = t().gameOver;
  outcomeBody.textContent = t().continuePrompt;
  outcomeContinue.hidden = false;
}
function showGameOver() {
  mode = 'outcome'; outcomeType = 'gameover'; hideOverlays(); outcome.hidden = false; renderOutcome(); updateTouchVisibility(); outcomeContinue.focus();
}
function continueGame() {
  if (outcomeType !== 'gameover') return;
  game.continueGame();
  mode = 'game'; outcomeType = null; hideOverlays(); updateTouchVisibility(); canvas.focus();
}

function renderScoreEntry() {
  scoreTitle.textContent = t().highScoreTitle;
  scorePrompt.textContent = `${t().highScorePrompt} · ${score4(game.points)}`;
}
function showScoreEntry(type) {
  pendingScoreOutcome = type;
  mode = 'score-entry'; hideOverlays(); scoreEntry.hidden = false; renderScoreEntry();
  scoreName.value = ''; updateTouchVisibility(); setTimeout(() => scoreName.focus(), 0);
}
function finishScoreFlow(save) {
  if (save) {
    const name = scoreName.value.slice(0, 17);
    safeSaveScores(insertHighScore(safeLoadScores(), name, game.points));
  }
  const type = pendingScoreOutcome;
  pendingScoreOutcome = null;
  if (type === 'finished') startPresentation('final');
  else showGameOver();
}

function processTerminalState() {
  if (game.state === 'gameover') {
    if (isHighScore(game.points, safeLoadScores())) showScoreEntry('gameover');
    else showGameOver();
  } else if (game.state === 'finished') {
    if (isHighScore(game.points, safeLoadScores())) showScoreEntry('finished');
    else startPresentation('final');
  }
}

const input = createInput({
  onPause: () => { if (mode === 'game') game?.pause(); },
  onResume: () => { if (mode === 'game' && game?.state === 'paused') game.resume(); },
  onEscape: () => {
    if (mode === 'game') { audio.play('select'); showMenu(); }
    else if (mode === 'intro' || mode === 'final') { if (mode === 'intro') audio.play('tick'); presentationEscape = true; }
    else if (mode === 'panel' || mode === 'outcome') { audio.play('select'); showMenu(); }
    else if (mode === 'score-entry') { audio.play('select'); finishScoreFlow(false); }
  }
});

function logicUpdate() {
  if (mode === 'menu') {
    if (!menuTitle.done) {
      menuTitle.update();
      if (menuTitle.done) {
        menu.classList.remove('title-pending');
        requestAnimationFrame(() => newGame.focus());
      }
    }
    return;
  }
  if (mode === 'intro' || mode === 'final') {
    const result = presentation.update({ advance: presentationAdvance, escape: presentationEscape });
    presentationAdvance = presentationEscape = false;
    if (result === 'done') { if (mode === 'intro') audio.play('tick'); showMenu(); }
    return;
  }
  if (mode !== 'game') return;

  // BO belongs to gaucho::actualizar(), before juego checks JU/SJ.
  if (heldKeys.has('b') && heldKeys.has('o')) game.cheatBomb();
  game.update(input);
  if (game.state === 'playing') {
    if (heldKeys.has('j') && heldKeys.has('u')) game.cheatNextLevel();
    if (heldKeys.has('s') && heldKeys.has('j')) game.cheatSuperJump();
  }
  for (const event of game.drainEvents()) if (event.type === 'sound') audio.play(event.name);
  if (game.state === 'gameover' || game.state === 'finished') processTerminalState();
}

function render() {
  if (!renderer) return;
  if (mode === 'intro') renderer.renderPresentation(`intro${presentation.index}`, t().intro[presentation.index], t().introHint);
  else if (mode === 'final') renderer.renderPresentation(`final${presentation.index}`, t().ending[presentation.index], t().finalHint);
  else if (mode === 'menu') renderer.renderMenu(menuTitle);
  else if (mode === 'panel') renderer.renderBackdrop(panelBackdrop);
  else if (game) renderer.render(game, t());
}

for (const b of document.querySelectorAll('[data-lang]')) b.addEventListener('click', () => {
  lang = b.dataset.lang; writePreference(storage, 'ceferino.lang', lang); audio.play('tick'); applyText();
});
newGame.addEventListener('click', () => { audio.play('select'); startNewGame(); });
instructions.addEventListener('click', () => { audio.play('select'); showPanel('instructions'); });
options.addEventListener('click', () => { audio.play('select'); showPanel('options'); });
credits.addEventListener('click', () => { audio.play('select'); showPanel('credits'); });
scores.addEventListener('click', () => { audio.play('select'); showPanel('scores'); });
panelBack.addEventListener('click', () => { audio.play('select'); showMenu(); });
panelNext.addEventListener('click', () => { audio.play('tick'); nextCredits(); });
outcomeContinue.addEventListener('click', () => { audio.play('select'); continueGame(); });
outcomeMenu.addEventListener('click', () => { audio.play('select'); showMenu(); });
pauseTouch.addEventListener('click', () => { if (game?.state === 'paused') game.resume(); else game?.pause(); });
scoreForm.addEventListener('submit', e => { e.preventDefault(); audio.play('select'); finishScoreFlow(true); });
scoreSkip.addEventListener('click', () => { audio.play('select'); finishScoreFlow(false); });
fatalRetry.addEventListener('click', () => location.reload());
scoreName.addEventListener('input', () => { scoreName.value = scoreName.value.toLowerCase().replace(/[^a-z ]/g, '').slice(0, 17); });
canvas.addEventListener('pointerdown', () => { if (mode === 'intro' || mode === 'final') presentationAdvance = true; });

addEventListener('keydown', event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  heldKeys.add(key);
  if ((mode === 'intro' || mode === 'final') && (event.key === ' ' || event.key === 'Enter')) { presentationAdvance = true; event.preventDefault(); }
  if (mode === 'outcome' && outcomeType === 'gameover' && event.key === ' ') { audio.play('select'); continueGame(); event.preventDefault(); }
  if (mode === 'panel' && currentPanel === 'credits' && event.key === ' ') { audio.play('tick'); nextCredits(); event.preventDefault(); }
  if (mode === 'menu' && menuTitle.done && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    const buttons = [...menu.querySelectorAll('.menu-buttons button')];
    let i = Math.max(0, buttons.indexOf(document.activeElement));
    i = (i + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[i].focus(); audio.play('tick'); event.preventDefault();
  }
});
addEventListener('keyup', event => heldKeys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
function pauseForFocusLoss() {
  heldKeys.clear();
  for (const key of Object.keys(input)) input[key] = false;
  if (mode === 'game') game?.pause();
}
addEventListener('blur', pauseForFocusLoss);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseForFocusLoss(); });
addEventListener('pagehide', pauseForFocusLoss);
addEventListener('resize', updateTouchVisibility);
document.addEventListener('fullscreenchange', () => { if (mode === 'panel' && currentPanel === 'options') renderPanel('options'); });

async function init() {
  applyText();
  audio.preload();
  const [assets, mapResponse] = await Promise.all([loadAssets(), fetch('assets/levels/base.map')]);
  if (!mapResponse.ok) throw new Error(`Unable to load base.map (${mapResponse.status})`);
  const levelSet = new LevelSet(new Uint8Array(await mapResponse.arrayBuffer()));
  game = new Game(levelSet);
  renderer = new Renderer(canvas, assets);
  loop = new FixedStepLoop(logicUpdate, render);
  startPresentation('intro');
  loop.start();
}

init().catch(error => {
  console.error(error);
  hideOverlays();
  mode = 'fatal';
  fatal.hidden = false;
});
