// SPDX-License-Identifier: GPL-3.0-or-later
// The page around the game: keyboard and touch input, the 60 Hz loop, the canvas, the sound, the language and the information panel.
// The game itself (session.js) and its picture (display.js) know nothing about the page.
import { LawnSession } from './src/session.js';
import { composeDisplay } from './src/display.js';
import { PAD } from './src/constants.js';
import { LawnAudioEngine } from './src/audio-engine.js';
import { loadUiPrefs, saveUiPrefs, resetUiPrefs } from './src/ui-preferences.js';

const NTSC_HZ = 60.0988;                       // the console's frame rate: one step of the game per NMI
const STEP_MS = 1000 / NTSC_HZ;
const START_HOLD_STEPS = 10;                   // how long a press of START is kept down (the game polls the pad in only some of its NMIs)
const appRoot = document.querySelector('#app');
const canvas = document.querySelector('canvas');
async function bytes(url) { return new Uint8Array(await (await fetch(url)).arrayBuffer()); }
const [chr, title, done] = await Promise.all([bytes('./assets/patterns.chr'), bytes('./assets/title.rle'), bytes('./assets/done.rle')]);
const session = new LawnSession({ seed: 1, screens: { title, done } });
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;
const image = ctx.createImageData(256, 240);
const audio = new LawnAudioEngine();
let prefs = loadUiPrefs();
audio.setEnabled(prefs.audio);

const held = { left: false, right: false, up: false, down: false, a: false, b: false, select: false };
const pointerControls = new Map();
let startHold = 0;
let acc = 0, prev = performance.now();
let dirty = true;

const STRINGS = {
  en: {
    audioOn: 'Mute audio', audioOff: 'Enable audio', switchLang: 'Passa all’italiano', info: 'Instructions and credits',
    title: 'Lawn Mower', how: 'How to play', howText: 'Cut all the grass before the fuel runs out. Fuel cans refill the tank. Flowers and stones cost fuel.',
    controls: 'Controls', desktop: 'Keyboard: arrow keys move, Z or X boost, Enter starts, pauses and confirms.', touch: 'Touch: the pad moves, A or B boost, START starts, pauses and confirms.',
    credits: 'Credits', creditsText: 'Original NES game, code, graphics and music: Shiru (2011), released into the Public Domain. Browser version: Libre Arcade.',
    fidelity: 'About this version', fidelityText: 'The ten levels, the movement, the fuel, the pictures and the music follow the original game, which this version was compared with frame by frame.',
    restart: 'Restart game', reset: 'Reset settings', close: 'Close', project: 'Libre Arcade project',
  },
  it: {
    audioOn: 'Disattiva audio', audioOff: 'Attiva audio', switchLang: 'Switch to English', info: 'Istruzioni e crediti',
    title: 'Lawn Mower', how: 'Come si gioca', howText: 'Taglia tutta l’erba prima di finire il carburante. Le taniche riempiono il serbatoio. Fiori e pietre consumano carburante.',
    controls: 'Controlli', desktop: 'Tastiera: frecce per muoversi, Z o X per il boost, Invio per iniziare, mettere in pausa e confermare.', touch: 'Touch: la croce muove, A o B danno il boost, START per iniziare, mettere in pausa e confermare.',
    credits: 'Crediti', creditsText: 'Gioco NES originale, codice, grafica e musica: Shiru (2011), rilasciato nel Public Domain. Versione browser: Libre Arcade.',
    fidelity: 'Su questa versione', fidelityText: 'I dieci livelli, il movimento, il carburante, le immagini e la musica seguono il gioco originale, con cui questa versione è stata confrontata fotogramma per fotogramma.',
    restart: 'Ricomincia partita', reset: 'Reimposta impostazioni', close: 'Chiudi', project: 'Progetto Libre Arcade',
  },
};
const audioToggle = document.querySelector('#audioToggle');
const languageToggle = document.querySelector('#languageToggle');
const infoButton = document.querySelector('#infoButton');
const panelBackdrop = document.querySelector('#panelBackdrop');
const infoPanel = document.querySelector('#infoPanel');
let panelReturnFocus = null;

function t() { return STRINGS[prefs.language]; }
function updateShellText() {
  document.documentElement.lang = prefs.language;
  document.title = 'Lawn Mower — Libre Arcade';
  audioToggle.textContent = prefs.audio ? '🔊' : '🔇';
  audioToggle.setAttribute('aria-label', prefs.audio ? t().audioOn : t().audioOff); audioToggle.title = audioToggle.getAttribute('aria-label');
  languageToggle.textContent = prefs.language === 'en' ? 'IT' : 'EN'; languageToggle.setAttribute('aria-label', t().switchLang); languageToggle.title = t().switchLang;
  infoButton.setAttribute('aria-label', t().info); infoButton.title = t().info;
  if (panelBackdrop.classList.contains('open')) renderInfoPanel();
}
function renderInfoPanel() {
  const s = t();
  infoPanel.innerHTML = `<button class="close" id="closePanel" type="button" aria-label="${s.close}">×</button>
    <h1 id="panelTitle">${s.title}</h1>
    <h2>${s.how}</h2><p>${s.howText}</p>
    <h2>${s.controls}</h2><p>${s.desktop}</p><p>${s.touch}</p>
    <h2>${s.credits}</h2><p>${s.creditsText}</p>
    <h2>${s.fidelity}</h2><p>${s.fidelityText}</p>
    <p><a class="credits-link" href="https://linkingtechnologies.github.io/libre-arcade/" target="_blank" rel="noopener noreferrer">${s.project}</a></p>
    <div class="panel-actions"><button id="restartGame" type="button">${s.restart}</button><button id="resetPrefs" type="button">${s.reset}</button></div>`;
  infoPanel.querySelector('#closePanel').addEventListener('click', closePanel);
  infoPanel.querySelector('#restartGame').addEventListener('click', () => { restartGame(); closePanel(); });
  infoPanel.querySelector('#resetPrefs').addEventListener('click', () => { prefs = resetUiPrefs(); audio.setEnabled(prefs.audio); updateShellText(); });
}
function openPanel() {
  panelReturnFocus = document.activeElement;
  renderInfoPanel(); panelBackdrop.classList.add('open'); appRoot.setAttribute('inert', ''); clearHeld(); audio.suspendForUi(true); infoPanel.querySelector('#closePanel')?.focus();
}
function closePanel() {
  panelBackdrop.classList.remove('open'); appRoot.removeAttribute('inert'); audio.suspendForUi(false);
  const target = panelReturnFocus?.isConnected ? panelReturnFocus : infoButton; panelReturnFocus = null; target?.focus?.({ preventScroll: true });
}
function restartGame() {
  session.coldReset(1); clearHeld(); audio.resetForTitle(); if (prefs.audio) audio.unlock(); dirty = true;
}
function clearHeld() {
  for (const k of Object.keys(held)) held[k] = false;
  startHold = 0;
  for (const el of document.querySelectorAll('.touch-btn.active')) el.classList.remove('active');
  pointerControls.clear();
}

function setKey(code, down) {
  const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyZ: 'a', KeyX: 'b', ShiftLeft: 'select', ShiftRight: 'select', Backspace: 'select' };
  if (map[code]) { held[map[code]] = down; return true; }
  if (code === 'Enter') { if (down && startHold === 0) startHold = START_HOLD_STEPS; return true; }
  return false;
}
addEventListener('keydown', (e) => {
  if (panelBackdrop.classList.contains('open')) { if (e.code === 'Escape') { closePanel(); e.preventDefault(); } return; }
  audio.unlock(); if (!e.repeat && setKey(e.code, true)) e.preventDefault();
}, { passive: false });
addEventListener('keyup', (e) => { if (setKey(e.code, false)) e.preventDefault(); }, { passive: false });
addEventListener('blur', clearHeld);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearHeld(); acc = 0; }
  audio.suspendForVisibility(document.hidden);
});

for (const btn of document.querySelectorAll('[data-control]')) {
  const control = btn.dataset.control;
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); btn.setPointerCapture?.(e.pointerId); pointerControls.set(e.pointerId, { control, btn }); btn.classList.add('active'); audio.unlock();
    if (control === 'start') { if (startHold === 0) startHold = START_HOLD_STEPS; } else held[control] = true;
  });
  const release = (e) => {
    const rec = pointerControls.get(e.pointerId); if (!rec) return;
    pointerControls.delete(e.pointerId); rec.btn.classList.remove('active'); if (rec.control !== 'start') held[rec.control] = false;
  };
  btn.addEventListener('pointerup', release); btn.addEventListener('pointercancel', release); btn.addEventListener('lostpointercapture', release);
}

audioToggle.addEventListener('click', async () => { prefs.audio = !prefs.audio; prefs = saveUiPrefs(prefs); audio.setEnabled(prefs.audio); if (prefs.audio) await audio.unlock(); updateShellText(); });
languageToggle.addEventListener('click', () => { prefs.language = prefs.language === 'en' ? 'it' : 'en'; prefs = saveUiPrefs(prefs); updateShellText(); });
infoButton.addEventListener('click', openPanel);
panelBackdrop.addEventListener('pointerdown', (e) => { if (e.target === panelBackdrop) closePanel(); });
canvas.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
updateShellText();

// The pad as the original reads it. START is held for a few steps (see START_HOLD_STEPS).
function currentPad() {
  let pad = 0;
  if (held.a) pad |= PAD.A;
  if (held.b) pad |= PAD.B;
  if (held.select) pad |= PAD.SELECT;
  if (startHold > 0) pad |= PAD.START;
  if (held.up) pad |= PAD.UP;
  if (held.down) pad |= PAD.DOWN;
  if (held.left) pad |= PAD.LEFT;
  if (held.right) pad |= PAD.RIGHT;
  return pad;
}

function step() {
  const game = session.game;
  const settingUp = game.mode === 'setup';
  session.tick(currentPad());
  if (startHold > 0) startHold--;
  audio.step(game.drainEvents(), { setup: settingUp });
  dirty = true;
}
function draw() {
  image.data.set(composeDisplay(session.game, chr));
  ctx.putImageData(image, 0, 0);
  dirty = false;
}
function frame(now) {
  const dt = Math.min(100, now - prev); prev = now;
  if (!panelBackdrop.classList.contains('open')) { acc += dt; while (acc >= STEP_MS) { step(); acc -= STEP_MS; } }
  else acc = 0;
  if (dirty) draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
