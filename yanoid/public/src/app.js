import { AudioFX } from './audio.js';
import { YanoidGame } from './game.js';
import { storageGet, storageSet } from './storage.js';

const $ = s => document.querySelector(s);
const canvas = $('#game');
const audio = new AudioFX();
const fxEnabled = storageGet('yanoid.fx', '1') !== '0';
const musicEnabled = storageGet('yanoid.music', '1') !== '0';
audio.setFxEnabled(fxEnabled);
audio.setMusicEnabled(musicEnabled);
let lang = storageGet('yanoid.lang', 'en');
if (!validLanguage(lang)) lang = 'en';

function validLanguage(value) { return value === 'en' || value === 'it'; }

const t = {
  en: {
    start: 'Start game', resume: 'Resume', restart: 'New game', instructions: 'How to play', about: 'About', close: 'Close',
    score: 'Score', lives: 'Lives', best: 'Best', stage: 'Stage', time: 'Time', shot: 'Shot', superShot: 'Super shot',
    ballLost: 'Ball lost', levelComplete: 'Level complete!', timeBonus: 'Time bonus {bonus} points', noTimeBonus: 'No time bonus', pausedOverlay: 'PAUSED', gameOverOverlay: 'GAME OVER',
    helpTitle: 'How to play', help: 'Move the paddle with the left and right arrow keys. Catch power-ups and press Space when you have a shot. Clear every breakable brick to advance. On touch screens, use the controls below the game.',
    aboutTitle: 'Yanoid', aboutText: 'A browser preservation port of Yanoid 0.3.0, the SDL Game Development Contest 2001 submission. The original gameplay and level order are the reference; later 0.3.5 features are not mixed into Contest mode.',
    pause: 'Pause', sound: 'Effects', music: 'Music', fullscreen: 'Fullscreen', language: 'Italiano', gameover: 'Game over',
  },
  it: {
    start: 'Gioca', resume: 'Riprendi', restart: 'Nuova partita', instructions: 'Come si gioca', about: 'Informazioni', close: 'Chiudi',
    score: 'Punti', lives: 'Vite', best: 'Record', stage: 'Livello', time: 'Tempo', shot: 'Colpo', superShot: 'Super colpo',
    ballLost: 'Pallina persa', levelComplete: 'Livello completato!', timeBonus: 'Bonus tempo: {bonus} punti', noTimeBonus: 'Nessun bonus tempo', pausedOverlay: 'PAUSA', gameOverOverlay: 'PARTITA FINITA',
    helpTitle: 'Come si gioca', help: 'Muovi la racchetta con le frecce sinistra e destra. Raccogli i bonus e premi Spazio quando hai un colpo disponibile. Elimina tutti i mattoni distruttibili per avanzare. Su touch usa i comandi sotto al gioco.',
    aboutTitle: 'Yanoid', aboutText: 'Port di preservazione per browser di Yanoid 0.3.0, la versione presentata allo SDL Game Development Contest 2001. Gameplay e ordine dei livelli originali sono il riferimento; le funzioni introdotte nella 0.3.5 restano separate dalla modalità Contest.',
    pause: 'Pausa', sound: 'Effetti', music: 'Musica', fullscreen: 'Schermo intero', language: 'English', gameover: 'Partita finita',
  }
};

function tr(k) { return t[lang][k]; }
function focusGameCanvas() { canvas.focus({ preventScroll: true }); }

const game = new YanoidGame(canvas, audio, {
  text(key, data = {}) {
    const keyMap = { paused: 'pausedOverlay', gameOver: 'gameOverOverlay' };
    let value = t[lang][keyMap[key] || key] ?? key;
    for (const [name, replacement] of Object.entries(data)) value = value.replace(`{${name}}`, String(replacement));
    return value;
  },
  onState(state) {
    audio.setGameActive(state === 'playing');
    $('#startBtn').textContent = state === 'idle' ? tr('start') : state === 'paused' ? tr('resume') : tr('restart');
    $('#pauseBtn').textContent = state === 'paused' ? tr('resume') : tr('pause');
    document.body.dataset.gameState = state;
  },
  onHud(h) {
    $('#score').textContent = `${tr('score')}: ${h.score}`;
    $('#lives').textContent = `${tr('lives')}: ${h.lives}`;
    $('#stage').textContent = `${tr('stage')}: ${h.stage}/${h.totalStages}`;
    const seconds = Math.floor(h.levelElapsedMs / 1000);
    $('#time').textContent = `${tr('time')}: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    const powerup = $('#powerup');
    if (h.shotMode) {
      powerup.hidden = false;
      powerup.textContent = `${h.shotMode === 'super' ? tr('superShot') : tr('shot')}: ${Math.floor(h.remainingShotMs / 1000) + 1}`;
    } else {
      powerup.hidden = true;
      powerup.textContent = '';
    }
    $('#best').textContent = `${tr('best')}: ${h.highScore}`;
  }
});

function applyLanguage() {
  document.documentElement.lang = lang;
  $('#startBtn').textContent = game.state === 'idle' ? tr('start') : game.state === 'paused' ? tr('resume') : tr('restart');
  $('#helpBtn').textContent = tr('instructions'); $('#aboutBtn').textContent = tr('about');
  $('#pauseBtn').textContent = game.state === 'paused' ? tr('resume') : tr('pause'); $('#soundLabel').textContent = tr('sound');
  $('#musicLabel').textContent = tr('music');
  $('#fullscreenBtn').textContent = tr('fullscreen'); $('#langBtn').textContent = tr('language');
  $('#helpTitle').textContent = tr('helpTitle'); $('#helpText').textContent = tr('help');
  $('#aboutTitle').textContent = tr('aboutTitle'); $('#aboutText').textContent = tr('aboutText');
  $('#helpClose').textContent = tr('close'); $('#aboutClose').textContent = tr('close');
  game.callbacks.onHud?.(game.getHud());
}

$('#startBtn').addEventListener('click', async () => {
  await audio.unlock();
  if (game.state === 'paused') game.resume(); else game.newGame();
  focusGameCanvas();
});
$('#pauseBtn').addEventListener('click', () => {
  if (game.state === 'paused') { game.resume(); focusGameCanvas(); } else game.pause();
});
function releaseDirectionalInput() {
  game.setInput('left', false);
  game.setInput('right', false);
}
function openDialog(dialog) {
  releaseDirectionalInput();
  dialog.dataset.resumeAfter = game.state === 'playing' ? '1' : '0';
  if (game.state === 'playing') game.pause();
  dialog.showModal();
}
function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}
function resumeAfterDialog(dialog) {
  const resume = dialog.dataset.resumeAfter === '1';
  dialog.dataset.resumeAfter = '0';
  if (resume && game.state === 'paused') { game.resume(); focusGameCanvas(); }
}
$('#helpBtn').addEventListener('click', () => openDialog($('#helpDialog')));
$('#aboutBtn').addEventListener('click', () => openDialog($('#aboutDialog')));
$('#helpClose').addEventListener('click', () => closeDialog($('#helpDialog')));
$('#aboutClose').addEventListener('click', () => closeDialog($('#aboutDialog')));
$('#helpDialog').addEventListener('close', () => resumeAfterDialog($('#helpDialog')));
$('#aboutDialog').addEventListener('close', () => resumeAfterDialog($('#aboutDialog')));
$('#langBtn').addEventListener('click', () => { lang = lang === 'en' ? 'it' : 'en'; storageSet('yanoid.lang', lang); applyLanguage(); });
$('#soundToggle').checked = fxEnabled;
$('#musicToggle').checked = musicEnabled;
$('#soundToggle').addEventListener('change', async e => {
  if (e.target.checked) await audio.unlock();
  audio.setFxEnabled(e.target.checked);
  storageSet('yanoid.fx', e.target.checked ? '1' : '0');
  if (e.target.checked) audio.good();
});
$('#musicToggle').addEventListener('change', async e => {
  if (e.target.checked) await audio.unlock();
  audio.setMusicEnabled(e.target.checked);
  storageSet('yanoid.music', e.target.checked ? '1' : '0');
});
$('#fullscreenBtn').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : $('#app').requestFullscreen?.());

const keyDirection = k => k === 'ArrowLeft' ? 'left' : k === 'ArrowRight' ? 'right' : null;
window.addEventListener('keydown', e => {
  if (document.querySelector('dialog[open]')) return;
  const onUiControl = Boolean(e.target?.closest?.('button,input,select,textarea,a'));
  if (onUiControl && e.key !== 'Escape') return;
  audio.unlock();
  const d = keyDirection(e.key);
  if (d) { e.preventDefault(); game.setInput(d, true); }
  if (e.code === 'Space') { e.preventDefault(); game.fire(); }
  if (e.key === 'Escape') { e.preventDefault(); game.state === 'paused' ? game.resume() : game.pause(); }
});
window.addEventListener('keyup', e => { const d = keyDirection(e.key); if (d) { e.preventDefault(); game.setInput(d, false); } });

for (const button of document.querySelectorAll('[data-control]')) {
  const control = button.dataset.control;
  const down = e => { e.preventDefault(); focusGameCanvas(); audio.unlock(); if (control === 'fire') game.fire(); else game.setInput(control, true); };
  const up = e => { e.preventDefault(); if (control !== 'fire') game.setInput(control, false); };
  button.addEventListener('pointerdown', down); button.addEventListener('pointerup', up); button.addEventListener('pointercancel', up); button.addEventListener('pointerleave', up);
}

document.addEventListener('pointerdown', () => { audio.unlock(); }, { capture: true, once: true });

let autoPausedForVisibility = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') {
    releaseDirectionalInput();
    autoPausedForVisibility = true;
    game.pause();
  } else if (!document.hidden && autoPausedForVisibility && game.state === 'paused') {
    autoPausedForVisibility = false;
    game.resume();
  }
});
window.addEventListener('blur', releaseDirectionalInput);

applyLanguage();
