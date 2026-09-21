/* Copyright (C) 2026 Libre Arcade contributors; SPDX-License-Identifier: AGPL-3.0-or-later */
import { initialGame, clickCell, restart, undo, progress, BOARD_SIZE, CELL_COUNT, coordinates } from './game.js';
import { strings, preferredLanguage } from './i18n.js';
import { createSound } from './sound.js';

const byId = id => document.getElementById(id);
let language = preferredLanguage();
let state = initialGame();
let focusIndex = 0;
let dialogOrigin = null;
let isGameVisible = false;
const sound = createSound();
// Remember only that the first-play instructions were dismissed. No game state or analytics.
const INTRO_KEY = 'libre-arcade.100-square-challenge.intro-seen.v1';
let introDismissedThisVisit = false;
function introWasSeen() {
  if (introDismissedThisVisit) return true;
  try { return window.localStorage.getItem(INTRO_KEY) === '1'; }
  catch { return false; } // The game still works when storage is blocked.
}
function rememberIntro() {
  introDismissedThisVisit = true;
  try { window.localStorage.setItem(INTRO_KEY, '1'); }
  catch { /* Private browsing or disabled storage: remember for this visit only. */ }
}
const cells = [];
const board = byId('board');
const area = document.querySelector('.board-area');
const announce = byId('status');

function words() { return strings[language]; }
function renderSoundButton() {
  const button = byId('sound-button');
  const label = !sound.available ? words().soundUnavailable : sound.enabled ? words().soundOff : words().soundOn;
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.setAttribute('aria-pressed', String(sound.enabled));
  button.disabled = !sound.available;
  button.textContent = sound.enabled ? '🔊' : '🔇';
}
function setLanguage(nextLanguage) {
  language = nextLanguage;
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach(node => {
    node.textContent = words()[node.dataset.i18n];
  });
  byId('lang-button').textContent = language === 'it' ? 'EN' : 'IT';
  byId('lang-button').setAttribute('aria-label', words().language);
  byId('help-button').setAttribute('aria-label', words().help);
  byId('credits-button').setAttribute('aria-label', words().credits);
  renderSoundButton();
  byId('dialog-close').setAttribute('aria-label', words().close);
  board.setAttribute('aria-label', words().board);
  byId('score').parentNode.setAttribute('aria-label', words().progress);
  document.querySelector('.game-actions').setAttribute('aria-label', words().menu);
  render();
  if (!byId('dialog-backdrop').hidden) {
    showDialog(byId('dialog-backdrop').dataset.kind, false);
  }
}

function cellLabel(i) {
  const { x, y } = coordinates(i);
  const value = state.board[i];
  const parts = [`${words().cellNumber} ${x + 1}, ${y + 1}`];
  parts.push(value ? `${value}` : words().cellEmpty);
  if (state.last === i && value > 0) parts.push(words().selected);
  if (state.proposed.includes(i)) parts.push(words().available);
  return parts.join(', ');
}

function render() {
  const available = new Set(state.proposed);
  for (let i = 0; i < CELL_COUNT; i++) {
    const button = cells[i];
    button.textContent = state.board[i] ? String(state.board[i]) : '';
    button.classList.toggle('available', available.has(i));
    button.classList.toggle('latest', state.last === i && state.board[i] > 0);
    button.classList.toggle('selected', focusIndex === i && board.contains(document.activeElement));
    button.setAttribute('aria-label', cellLabel(i));
    button.setAttribute('aria-disabled', available.has(i) ? 'false' : 'true');
    button.tabIndex = i === focusIndex ? 0 : -1;
  }
  const count = progress(state);
  byId('score').textContent = String(count);
  byId('undo-button').disabled = !state.undoEnabled;
  announce.textContent = count === 100 ? words().complete
    : count === 0 ? words().ready
    : state.ended ? words().blocked : words().playing;
}

function resizeBoard() {
  const size = Math.max(0, Math.floor(Math.min(area.clientWidth, area.clientHeight, 560)));
  board.style.width = `${size}px`;
  board.style.height = `${size}px`;
}

function setFocus(index, focus = true) {
  focusIndex = index;
  render();
  if (focus) cells[index].focus({ preventScroll: true });
}

function move(index) {
  const after = clickCell(state, index);
  if (after === state) { render(); return; }
  state = after;
  focusIndex = index;
  render();
  const count = progress(state);
  sound.play(count === CELL_COUNT ? 'complete' : state.ended ? 'blocked' : 'move');
}

function enterGame() {
  isGameVisible = true;
  byId('menu').hidden = true;
  byId('game').hidden = false;
  render();
  if (!introWasSeen()) showDialog('help', true, true);
  requestAnimationFrame(() => {
    resizeBoard();
    if (byId('dialog-backdrop').hidden) cells[focusIndex].focus({ preventScroll:true });
  });
}

function leaveGame() {
  isGameVisible = false;
  byId('game').hidden = true;
  byId('menu').hidden = false;
  byId('play-button').focus({ preventScroll:true });
}

function showDialog(kind, rememberOrigin = true, intro = false) {
  if (rememberOrigin) dialogOrigin = intro ? cells[focusIndex] : document.activeElement;
  const w = words();
  const isCredits = kind === 'credits';
  const backdrop = byId('dialog-backdrop');
  backdrop.dataset.kind = kind;
  if (rememberOrigin) backdrop.dataset.intro = intro ? 'true' : 'false';
  byId('dialog-title').textContent = isCredits ? w.creditsTitle : w.help;
  byId('dialog-body').textContent = isCredits ? `${w.original} ${w.port}` : w.helpBody;
  byId('dialog-extra').textContent = isCredits ? w.license : w.helpControls;
  byId('dialog-links').hidden = !isCredits;
  byId('dialog-done').textContent = backdrop.dataset.intro === 'true' ? w.startPlaying : w.close;
  backdrop.hidden = false;
  if (rememberOrigin) byId('dialog-close').focus();
}
function hideDialog() {
  const backdrop = byId('dialog-backdrop');
  if (backdrop.dataset.intro === 'true') rememberIntro();
  backdrop.hidden = true;
  backdrop.dataset.intro = 'false';
  if (dialogOrigin?.focus) dialogOrigin.focus({ preventScroll:true });
}

for (let i = 0; i < CELL_COUNT; i++) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cell';
  button.dataset.index = String(i);
  button.addEventListener('click', () => {
    focusIndex = i;
    move(i);
  });
  cells.push(button);
  board.appendChild(button);
}

board.addEventListener('keydown', event => {
  let deltaX = 0, deltaY = 0;
  if (event.key === 'ArrowUp') deltaY = -1;
  else if (event.key === 'ArrowDown') deltaY = 1;
  else if (event.key === 'ArrowLeft') deltaX = -1;
  else if (event.key === 'ArrowRight') deltaX = 1;
  else return;
  event.preventDefault();
  const { x, y } = coordinates(focusIndex);
  const nx = Math.max(0, Math.min(BOARD_SIZE - 1, x + deltaX));
  const ny = Math.max(0, Math.min(BOARD_SIZE - 1, y + deltaY));
  setFocus(ny * BOARD_SIZE + nx);
});

byId('play-button').addEventListener('click', enterGame);
byId('back-button').addEventListener('click', leaveGame);
byId('new-button').addEventListener('click', () => { state = restart(state); focusIndex = 0; render(); });
byId('undo-button').addEventListener('click', () => { state = undo(state); focusIndex = state.last; render(); });
byId('lang-button').addEventListener('click', () => setLanguage(language === 'it' ? 'en' : 'it'));
byId('sound-button').addEventListener('click', () => { sound.toggle(); renderSoundButton(); });
byId('help-button').addEventListener('click', () => showDialog('help'));
byId('credits-button').addEventListener('click', () => showDialog('credits'));
byId('dialog-close').addEventListener('click', hideDialog);
byId('dialog-done').addEventListener('click', hideDialog);
byId('dialog-backdrop').addEventListener('click', event => { if (event.target === byId('dialog-backdrop')) hideDialog(); });

document.addEventListener('keydown', event => {
  if (byId('dialog-backdrop').hidden) return;
  if (event.key === 'Escape') { event.preventDefault(); hideDialog(); return; }
  if (event.key !== 'Tab') return;
  const focusables = [...byId('dialog-backdrop').querySelectorAll('button,a')].filter(node => node.getClientRects().length > 0);
  const first = focusables[0], last = focusables.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { if (isGameVisible) resizeBoard(); }).observe(area);
window.addEventListener('resize', resizeBoard);
setLanguage(language);
