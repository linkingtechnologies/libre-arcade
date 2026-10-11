import { CroomPRNG } from './prng.js';
import { dealBoard } from './shuffle.js';
import { MODE } from './rules.js';
import { FrameGame, PLAY_STATE, NTSC } from './state-machine.js';
import { NesRenderer } from './renderer.js';
import {
  STORY_OPENING_LINES, SOLO_INSTRUCTION_LINES, TWO_PLAYER_INSTRUCTION_LINES,
  storyOutcome, storyScene, storyStageConfig,
} from './story.js';
import { StoryRenderer } from './story-renderer.js';
import { HistoricalAudio } from './audio.js';
import { MUSIC_ID } from './audio-data.js';
import { TitleFlow, TITLE_SCREEN } from './title-flow.js';
import { TitleRenderer } from './title-renderer.js';
import { HistoricalPads, browserPadBinding } from './input.js';
import { applyHistoricalGameInputFrame } from './frame-input.js';
import { loadPreferences, savePreferences, resetPreferences } from './preferences.js';
import { computeCanvasCssSize } from './viewport.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const renderer = new NesRenderer(canvas);
const titleRenderer = new TitleRenderer($('titleCanvas'));
const storyRenderer = new StoryRenderer($('storyCanvas'));
const audio = new HistoricalAudio();
const preferences = loadPreferences();
$('language').value = preferences.language;
document.documentElement.lang = preferences.language;
const titleFlow = new TitleFlow({ difficulty: preferences.difficulty });
const pads = new HistoricalPads();

// Hardware reset initializes this once and keeps the PRNG alive across
// returns to the title screen, matching the 0.02 titleLoop behavior.
const prng = new CroomPRNG();
let game = null;
let storyStage = null;
let storyHandledDone = false;
let titleVisible = true;
let sceneAction = null;
let sceneDescriptor = null;
let sceneInput = { up: false, down: false };
let panelKind = null;
let panelReturnFocus = null;
let raf = 0;
let accumulator = 0;
let previous = performance.now();
const FRAME_MS = 1000 / NTSC.fps;

function fitGameCanvases() {
  const stack = $('screenStack');
  if (!stack) return;
  const rect = stack.getBoundingClientRect();
  const fitted = computeCanvasCssSize(rect.width, rect.height);

  for (const id of ['game', 'titleCanvas']) {
    const el = $(id);
    el.style.width = `${fitted.width}px`;
    el.style.height = `${fitted.height}px`;
  }
}

const resizeObserver = new ResizeObserver(fitGameCanvases);
resizeObserver.observe($('screenStack'));
window.addEventListener('resize', fitGameCanvases, { passive: true });
requestAnimationFrame(fitGameCanvases);

const strings = {
  en: {
    menu: 'Menu', back: 'Back', help: 'Help', credits: 'Credits', close: 'Close', reset: 'Reset preferences',
    continue: 'Continue', audioOn: 'Audio: on', audioOff: 'Audio: off', resetDone: 'Preferences reset.',
    pass: (p) => `Player ${p}: A+B or Continue`, turn: (p) => `Player ${p}'s turn`, cpuTurn: 'CPU turn',
    won: (p) => `Player ${p} wins`, cpuWon: 'CPU wins', humanWon: 'You win',
    cleared: 'Table cleared', lost: 'No misses left',
    mainMenu: ['1 Player Story', '1 Player Solitaire', '2 Players', 'Vs. CPU'],
    difficulty: ['Preschool', 'Elementary', 'Junior High', 'High School', 'Lab Technician'],
    hint: 'Enter / Space · ↑ pause · ↓ faster',
    storyStage: (n, total, name) => `Story ${n}/${total}${name ? ` · ${name}` : ''}`,
    controls: 'P1: arrows + Z/X · P2: WASD + N/M · Help for details',
  },
  it: {
    menu: 'Menu', back: 'Indietro', help: 'Guida', credits: 'Crediti', close: 'Chiudi', reset: 'Azzera preferenze',
    continue: 'Continua', audioOn: 'Audio: sì', audioOff: 'Audio: no', resetDone: 'Preferenze azzerate.',
    pass: (p) => `Giocatore ${p}: A+B o Continua`, turn: (p) => `Turno giocatore ${p}`, cpuTurn: 'Turno CPU',
    won: (p) => `Vince il giocatore ${p}`, cpuWon: 'Vince la CPU', humanWon: 'Hai vinto',
    cleared: 'Tabellone completato', lost: 'Tentativi esauriti',
    mainMenu: ['Storia 1 giocatore', 'Solitario', '2 giocatori', 'Contro CPU'],
    difficulty: ['Prescolare', 'Elementari', 'Medie', 'Superiori', 'Tecnico lab.'],
    hint: 'Invio / Spazio · ↑ pausa · ↓ accelera',
    storyStage: (n, total, name) => `Storia ${n}/${total}${name ? ` · ${name}` : ''}`,
    controls: 'G1: frecce + Z/X · G2: WASD + N/M · Dettagli nella Guida',
  },
};

const panelCopy = {
  en: {
    helpTitle: 'How to play',
    helpHtml: `
      <p>Find matching pairs of cards. A match stays yours; a mismatch is turned back.</p>
      <h3>Modes</h3>
      <ul>
        <li><strong>Story:</strong> alternate solo rounds and matches against five opponents.</li>
        <li><strong>Solitaire:</strong> clear the table before you run out of misses.</li>
        <li><strong>2 Players:</strong> match a pair to keep the turn; miss and the turn passes.</li>
        <li><strong>Vs. CPU:</strong> play against an opponent that remembers some cards and forgets others.</li>
      </ul>
      <h3>Controls</h3>
      <p><strong>Mouse/touch:</strong> tap a card to select it. In 2-player mode, use Continue when passing a shared device.</p>
      <p><strong>Player 1:</strong> arrow keys to move, Z = A/select, X = B/random card.</p>
      <p><strong>Player 2:</strong> WASD to move, N = A/select, M = B/random card.</p>
      <p>After a 2-player mismatch, press A+B on the controller that takes the next turn.</p>
      <h3>Preferences</h3>
      <p>Language and the last selected difficulty are saved on this device. Reset restores English and the first difficulty.</p>`,
    creditsTitle: 'Credits',
    creditsHtml: `
      <p><strong>Concentration Room 0.02</strong> — original game © 2010 Damian Yerrick.</p>
      <p>Program by Damian Yerrick. Graphics by Damian Yerrick and Sara Crickard.</p>
      <p>HTML5 port by <a href="https://linkingtechnologies.github.io/libre-arcade/" target="_blank" rel="noopener">Libre Arcade</a>.</p>
      <p>Distributed under the <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener">GNU GPL v3 or later</a>. The original 0.02 sources and notices are preserved with the project.</p>
      <p>No AI-generated artwork is used.</p>`,
  },
  it: {
    helpTitle: 'Come si gioca',
    helpHtml: `
      <p>Trova le coppie di carte uguali. Se trovi una coppia la tieni; se sbagli, le carte vengono ricoperte.</p>
      <h3>Modalità</h3>
      <ul>
        <li><strong>Storia:</strong> alterna round in solitario e sfide contro cinque avversari.</li>
        <li><strong>Solitario:</strong> completa il tavolo prima di esaurire gli errori disponibili.</li>
        <li><strong>2 giocatori:</strong> una coppia corretta mantiene il turno; un errore lo passa all'altro giocatore.</li>
        <li><strong>Contro CPU:</strong> sfida un avversario che ricorda alcune carte e ne dimentica altre.</li>
      </ul>
      <h3>Comandi</h3>
      <p><strong>Mouse/touch:</strong> tocca una carta per selezionarla. In 2 giocatori puoi usare Continua quando passi lo stesso dispositivo.</p>
      <p><strong>Giocatore 1:</strong> frecce per muoversi, Z = A/seleziona, X = B/carta casuale.</p>
      <p><strong>Giocatore 2:</strong> WASD per muoversi, N = A/seleziona, M = B/carta casuale.</p>
      <p>Dopo un errore in 2 giocatori, premi A+B sul controller del giocatore che prende il turno.</p>
      <h3>Preferenze</h3>
      <p>Lingua e ultima difficoltà selezionata vengono salvate su questo dispositivo. Il reset ripristina inglese e prima difficoltà.</p>`,
    creditsTitle: 'Crediti',
    creditsHtml: `
      <p><strong>Concentration Room 0.02</strong> — gioco originale © 2010 Damian Yerrick.</p>
      <p>Programma di Damian Yerrick. Grafica di Damian Yerrick e Sara Crickard.</p>
      <p>Versione HTML5 a cura di <a href="https://linkingtechnologies.github.io/libre-arcade/" target="_blank" rel="noopener">Libre Arcade</a>.</p>
      <p>Distribuito secondo la <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener">GNU GPL v3 o successiva</a>. I sorgenti originali 0.02 e le relative note sono preservati insieme al progetto.</p>
      <p>Non sono state utilizzate immagini generate con AI.</p>`,
  },
};

function lang() { return $('language').value; }
function t() { return strings[lang()]; }
function currentNmi() { return Math.floor(performance.now() / FRAME_MS) & 0xff; }
function sceneVisible() { return !$('scene').hidden; }
function panelVisible() { return !$('infoPanel').hidden; }

function modeIndex(mode) {
  return ({ [MODE.STORY]: 0, [MODE.SOLITAIRE]: 1, [MODE.TWO_PLAYER]: 2, [MODE.VS_CPU]: 3 })[mode];
}

function titleLabels() {
  const s = t();
  return { main: s.mainMenu, difficulty: s.difficulty, backHint: '' };
}

function saveUiPreferences() {
  savePreferences({ language: lang(), difficulty: titleFlow.difficulty });
}

function updateChrome() {
  const s = t();
  const onDifficulty = titleVisible && titleFlow.screen === TITLE_SCREEN.DIFFICULTY;
  $('menuButton').hidden = titleVisible && !onDifficulty;
  $('menuButton').textContent = onDifficulty ? s.back : s.menu;
}

function renderPanel() {
  if (!panelKind) return;
  const copy = panelCopy[lang()];
  const s = t();
  const help = panelKind === 'help';
  $('panelTitle').textContent = help ? copy.helpTitle : copy.creditsTitle;
  $('panelBody').innerHTML = help ? copy.helpHtml : copy.creditsHtml;
  $('panelReset').hidden = !help;
  $('panelReset').textContent = s.reset;
  $('panelClose').textContent = s.close;
  $('panelMessage').textContent = '';
}

function showInfo(kind) {
  panelKind = kind;
  panelReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  renderPanel();
  $('infoPanel').hidden = false;
  $('topBar').inert = true;
  $('wrap').inert = true;
  $('footerArea').inert = true;
  // focusing a button at the foot of a card taller than the window would scroll the text to its end: start at the top
  const card = document.querySelector('.panel-card');
  if (card) card.scrollTop = 0;
  $('panelClose').focus({ preventScroll: true });
}

function closeInfo() {
  if (!panelVisible()) return;
  $('infoPanel').hidden = true;
  $('topBar').inert = false;
  $('wrap').inert = false;
  $('footerArea').inert = false;
  panelKind = null;
  $('panelMessage').textContent = '';
  panelReturnFocus?.focus?.();
  panelReturnFocus = null;
}

function refillLabels() {
  const s = t();
  document.documentElement.lang = lang();
  $('help').textContent = s.help;
  $('credits').textContent = s.credits;
  $('continue').textContent = s.continue;
  $('sceneContinue').textContent = s.continue;
  $('sceneHint').textContent = s.hint;
  $('audio').textContent = audio.enabled ? s.audioOn : s.audioOff;
  $('audio').setAttribute('aria-pressed', String(audio.enabled));
  $('language').setAttribute('aria-label', lang() === 'it' ? 'Lingua' : 'Language');
  $('game').setAttribute('aria-label', lang() === 'it' ? 'Tabellone di Concentration Room' : 'Concentration Room game board');
  $('titleCanvas').setAttribute('aria-label', lang() === 'it' ? 'Menu principale di Concentration Room' : 'Concentration Room title menu');
  $('storyCanvas').setAttribute('aria-label', lang() === 'it' ? 'Scena della storia di Concentration Room' : 'Concentration Room story scene');
  $('controls').textContent = s.controls;
  refreshSceneLanguage();
  if (panelVisible()) renderPanel();
  updateChrome();
  updateStatus();
}

function scrollingLines(descriptor) {
  const language = lang();
  switch (descriptor.type) {
    case 'opening': return STORY_OPENING_LINES[language];
    case 'solo-instructions': return SOLO_INSTRUCTION_LINES[language];
    case 'two-instructions': return TWO_PLAYER_INSTRUCTION_LINES[language];
    default: return [];
  }
}

function showScene(descriptor, action = null) {
  sceneDescriptor = descriptor;
  sceneAction = action;
  sceneInput = { up: false, down: false };
  if (descriptor.type !== 'story-scene') audio.startMusic(MUSIC_ID.INTRO);
  refreshSceneLanguage();
  $('scene').hidden = false;
}

function refreshSceneLanguage() {
  if (!sceneDescriptor) return;
  if (sceneDescriptor.type === 'story-scene') {
    storyRenderer.showOpponent(storyScene(sceneDescriptor.id, lang()));
  } else {
    storyRenderer.showOpening(scrollingLines(sceneDescriptor));
  }
}

function closeSceneAndRun() {
  const wasScrolling = sceneDescriptor?.type !== 'story-scene';
  $('scene').hidden = true;
  storyRenderer.clear();
  const action = sceneAction;
  sceneAction = null;
  sceneDescriptor = null;
  sceneInput = { up: false, down: false };
  if (wasScrolling) audio.stopMusic();
  action?.();
}

function advanceScene() {
  if (!sceneVisible()) return;
  const closeNow = storyRenderer.advance();
  if (closeNow) closeSceneAndRun();
}

function hideSceneImmediately() {
  if (!sceneVisible()) return;
  $('scene').hidden = true;
  storyRenderer.clear();
  sceneAction = null;
  sceneDescriptor = null;
  sceneInput = { up: false, down: false };
  audio.stopMusic();
}

function showTitle({ reset = true } = {}) {
  hideSceneImmediately();
  audio.stopMusic();
  game = null;
  storyStage = null;
  storyHandledDone = false;
  titleVisible = true;
  if (reset) titleFlow.reset();
  $('titleCanvas').hidden = false;
  $('game').hidden = true;
  $('continue').hidden = true;
  updateChrome();
  updateStatus();
}

function showGameCanvas() {
  titleVisible = false;
  $('titleCanvas').hidden = true;
  $('game').hidden = false;
  updateChrome();
}

function createGame({ mode, difficulty, aiNoiseLevel = 8 }) {
  const { board } = dealBoard({ difficulty, prng, dealNmis: currentNmi() });
  game = new FrameGame({ board, mode, difficulty, prng, aiNoiseLevel });
  storyHandledDone = false;
  $('continue').hidden = true;
  updateStatus();
}

function startStoryStage(index) {
  storyStage = index;
  const cfg = storyStageConfig(index);
  createGame({ mode: cfg.mode, difficulty: cfg.difficulty, aiNoiseLevel: Math.max(0, cfg.aiNoiseLevel) });
}

function beginMode(mode, difficulty) {
  hideSceneImmediately();
  showGameCanvas();
  prng.mixTitleSelection(modeIndex(mode), currentNmi());
  storyStage = null;
  storyHandledDone = false;
  game = null;

  if (mode === MODE.STORY) {
    storyStage = 0;
    showScene({ type: 'opening' }, () => startStoryStage(0));
    return;
  }

  const descriptor = mode === MODE.SOLITAIRE ? { type: 'solo-instructions' } : { type: 'two-instructions' };
  showScene(descriptor, () => createGame({ mode, difficulty, aiNoiseLevel: 8 }));
}

function activateTitle() {
  const event = titleFlow.activate();
  saveUiPreferences();
  updateChrome();
  if (event.type === 'start') beginMode(event.mode, event.difficulty);
}

function handleStoryDone() {
  if (storyStage == null || storyHandledDone || !game || game.state !== PLAY_STATE.DONE) return false;
  storyHandledDone = true;
  const outcome = storyOutcome(storyStage, game);
  const next = outcome.nextStage;
  const afterScene = () => {
    if (next < 0) {
      showTitle();
      return;
    }
    startStoryStage(next);
  };

  if (outcome.sceneId >= 64) showScene({ type: 'story-scene', id: outcome.sceneId }, afterScene);
  else afterScene();
  return true;
}

function humanCanPlay() {
  if (!game) return false;
  return !(game.lastPlayerIsAI && game.curTurn === game.numPlayers - 1);
}

function updateStatus() {
  const s = t();
  if (titleVisible) {
    $('status').textContent = '';
    return;
  }
  if (!game) {
    $('status').textContent = '';
    return;
  }

  const pass = game.state === PLAY_STATE.PASS_CONTROLLER && !game.lastPlayerIsAI;
  $('continue').hidden = !pass;

  if (pass) $('status').textContent = s.pass(game.curTurn + 1);
  else if (game.state === PLAY_STATE.CLEARED) {
    if (game.mode === MODE.VS_CPU) $('status').textContent = s.humanWon;
    else $('status').textContent = game.numPlayers >= 2 ? s.won((game.winner ?? 0) + 1) : s.cleared;
  } else if (game.state === PLAY_STATE.GAME_OVER) {
    $('status').textContent = game.mode === MODE.VS_CPU && game.winner === 1 ? s.cpuWon : s.lost;
  } else if (game.state === PLAY_STATE.DONE) {
    if (game.mode === MODE.VS_CPU) $('status').textContent = game.winner === 1 ? s.cpuWon : s.humanWon;
    else $('status').textContent = game.winner != null && game.numPlayers >= 2 ? s.won(game.winner + 1) : (game.winner != null ? s.cleared : s.lost);
  } else if (storyStage != null) {
    const cfg = storyStageConfig(storyStage);
    $('status').textContent = game.lastPlayerIsAI && game.curTurn === 1 ? s.cpuTurn : s.storyStage(storyStage + 1, 10, cfg.opponent ?? '');
  } else if (game.lastPlayerIsAI && game.curTurn === 1) $('status').textContent = s.cpuTurn;
  else $('status').textContent = game.numPlayers >= 2 ? s.turn(game.curTurn + 1) : '';
}

function applyGameInputFrame() {
  if (game) applyHistoricalGameInputFrame(game, pads);
}

canvas.addEventListener('pointerdown', (e) => {
  if (titleVisible || sceneVisible() || panelVisible() || !humanCanPlay()) return;
  const index = renderer.cardAt(e.clientX, e.clientY);
  if (index >= 0) game.setCursor(index);
  if (index >= 0 && game.select(index)) updateStatus();
});

$('titleCanvas').addEventListener('pointerdown', (e) => {
  if (!titleVisible || sceneVisible() || panelVisible()) return;
  const index = titleRenderer.itemAt(e.clientX, e.clientY, titleFlow.itemCount);
  if (index < 0) return;
  titleFlow.select(index);
  activateTitle();
});

$('storyCanvas').addEventListener('pointerdown', advanceScene);
$('continue').addEventListener('click', () => {
  if (game?.acknowledgePass(0)) { pads.cancelRepeat(0); updateStatus(); }
});
$('sceneContinue').addEventListener('click', advanceScene);
$('menuButton').addEventListener('click', () => {
  if (titleVisible && !sceneVisible() && titleFlow.screen === TITLE_SCREEN.DIFFICULTY) { titleFlow.back(); updateChrome(); }
  else showTitle();
});
$('help').addEventListener('click', () => showInfo('help'));
$('credits').addEventListener('click', () => showInfo('credits'));
$('panelClose').addEventListener('click', closeInfo);
$('infoPanel').addEventListener('pointerdown', (e) => { if (e.target === $('infoPanel')) closeInfo(); });
$('panelReset').addEventListener('click', async () => {
  resetPreferences();
  await audio.setEnabled(false);
  $('language').value = 'en';
  titleFlow.difficulty = 0;
  showTitle();
  refillLabels();
  $('panelMessage').textContent = t().resetDone;
});
$('language').addEventListener('change', () => { saveUiPreferences(); refillLabels(); });
$('audio').addEventListener('click', async () => {
  await audio.setEnabled(!audio.enabled);
  refillLabels();
});

window.addEventListener('keydown', (e) => {
  if (panelVisible()) {
    if (e.key === 'Escape') { e.preventDefault(); closeInfo(); }
    return;
  }

  if (sceneVisible()) {
    if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'z') {
      e.preventDefault(); advanceScene();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); sceneInput.up = true;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); sceneInput.down = true;
    } else if (e.key === 'Escape') {
      e.preventDefault(); closeSceneAndRun();
    }
    return;
  }

  if (titleVisible) {
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowUp') { e.preventDefault(); titleFlow.move(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); titleFlow.move(1); }
    else if (e.key === 'Enter' || e.key === ' ' || k === 'z') { e.preventDefault(); activateTitle(); }
    else if (e.key === 'Escape' || e.key === 'Backspace' || k === 'x') { e.preventDefault(); if (titleFlow.back()) updateChrome(); }
    else if (k === 'h' || k === '?') { e.preventDefault(); showInfo('help'); }
    else if (k === 'c') { e.preventDefault(); showInfo('credits'); }
    return;
  }

  if (!game) return;

  // Enter/Space remain a browser/touch-friendly A/Continue alias. Exact NES
  // two-pad input is available through Z/X and N/M and is frame-clocked below.
  if (game.state === PLAY_STATE.PASS_CONTROLLER && humanCanPlay() && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    if (game.acknowledgePass(game.activePad)) pads.cancelRepeat(game.activePad);
    updateStatus();
    return;
  }
  if (game.state === PLAY_STATE.STILL && humanCanPlay() && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    game.select(game.cursorIndex);
    return;
  }

  const binding = browserPadBinding(e.key);
  if (binding) {
    e.preventDefault();
    pads.setButton(binding[0], binding[1], true);
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp') sceneInput.up = false;
  if (e.key === 'ArrowDown') sceneInput.down = false;
  const binding = browserPadBinding(e.key);
  if (binding) pads.setButton(binding[0], binding[1], false);
});

function loop(now) {
  accumulator += Math.min(100, now - previous);
  previous = now;
  while (accumulator >= FRAME_MS) {
    if (!panelVisible()) {
      if (sceneVisible()) storyRenderer.tick(sceneInput);
      else if (!titleVisible && game) {
        applyGameInputFrame();
        audio.handleGameEvents(game.drainEvents());
      }
      audio.tick(1);
    }
    accumulator -= FRAME_MS;
  }

  if (titleVisible) titleRenderer.render(titleFlow, titleLabels());
  else if (game) renderer.render(game);
  if (sceneVisible()) storyRenderer.render();
  if (!panelVisible() && storyRenderer.finished && sceneVisible()) closeSceneAndRun();

  const storyConsumedDone = panelVisible() ? false : handleStoryDone();
  if (!panelVisible() && !storyConsumedDone && !sceneVisible() && !titleVisible && storyStage == null && game?.state === PLAY_STATE.DONE) showTitle();
  updateStatus();
  raf = requestAnimationFrame(loop);
}

refillLabels();
showTitle();
raf = requestAnimationFrame(loop);
window.addEventListener('pagehide', () => cancelAnimationFrame(raf));
