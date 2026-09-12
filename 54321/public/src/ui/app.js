import { Cube } from '../core/cube.js';
import { FlipFlop } from '../games/flipflop.js';
import { BombSquad, BOMB_CELL } from '../games/bombsquad.js';
import { MazeRunner, MAZE_CELL } from '../games/mazerunner.js';
import { PegJumper, PEG_CELL } from '../games/pegjumper.js';
import { TileSlider } from '../games/tileslider.js';
import { VIEW, cellToScreen, screenToCell } from './layout.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const dialog = document.querySelector('#help-dialog');
const helpTitle = document.querySelector('#help-title');
const helpBody = document.querySelector('#help-body');
const status = document.querySelector('#status');
const gameSelect = document.querySelector('#game-select');
const languageSelect = document.querySelector('#language-select');
const contextAction = document.querySelector('#context-action');
const dimensionalHelpToggle = document.querySelector('#dimensional-help-toggle');
const soundToggle = document.querySelector('#sound-toggle');
const closeHelpButton = document.querySelector('#close-help');
const gameLabel = document.querySelector('#game-label');
const languageLabel = document.querySelector('#language-label');
const toolbar = document.querySelector('.toolbar');
const stage = document.querySelector('.stage');

const assets = {};
const assetNames = [
  'on', 'off', 'covered', 'uncovered', 'flagged', 'bomb',
  'unmarked', 'marked', 'goal', 'me',
  'wall0', 'wall1', 'wall2', 'wall3', 'wall4', 'wall5', 'wall6', 'wall7',
  'peg', 'hole', 'empty', 'selected', 'centers', 'borders',
  'panel', 'dimOn', 'dimOff', 'setOn', 'setOff', 'actOn', 'actOff',
  'helpOn', 'helpOff', 'victory', 'defeat',
];

const controls = [
  { id: 'dim2', x: 602, y: 2, w: 64, h: 64, kind: 'dim', value: 2 },
  { id: 'dim3', x: 668, y: 2, w: 64, h: 64, kind: 'dim', value: 3 },
  { id: 'dim4', x: 734, y: 2, w: 64, h: 64, kind: 'dim', value: 4 },
  { id: 'easy', x: 602, y: 68, w: 64, h: 32, kind: 'skill', value: 0 },
  { id: 'medium', x: 668, y: 68, w: 64, h: 32, kind: 'skill', value: 1 },
  { id: 'hard', x: 734, y: 68, w: 64, h: 32, kind: 'skill', value: 2 },
  { id: 'wrap', x: 668, y: 102, w: 64, h: 32, kind: 'wrap' },
  { id: 'new', x: 636, y: 180, w: 128, h: 64, kind: 'new' },
  { id: 'help', x: 602, y: 534, w: 196, h: 64, kind: 'help' },
];

const I18N = {
  en: {
    game: 'Game', language: 'Language', loading: 'Loading…', back: 'Back to game',
    pageTitle: '54321 — Preservation Port', toolbarAria: 'Game controls', stageAria: '54321 game', boardAria: '54321 game board', languageAria: 'Language',
    victoryText: 'VICTORY', defeatText: 'DEFEAT',
    newGame: 'NEW GAME', help: 'HELP', wrap: 'WRAP', easy: 'EASY', medium: 'MED', hard: 'HARD',
    moves: 'Moves', scramble: 'Scramble', flags: 'Flags', covered: 'Covered', steps: 'Steps', repeats: 'Repeats',
    pegs: 'Pegs', jumps: 'Jumps', shuffle: 'Shuffle swaps', removePeg: 'Remove a peg to start',
    chooseJumped: 'Choose peg to jump over', choosePeg: 'Choose peg to jump with',
    solvedShowing: 'Showing solved positions', alignBlank: 'Click a tile aligned with the blank',
    wrapOn: 'Wrap on', wrapOff: 'Wrap off',
    dimHelpOn: 'Dimensional help: on', dimHelpOff: 'Dimensional help: off',
    soundOn: 'Sound: on', soundOff: 'Sound: off',
    touchFlag: 'Touch: Flag', touchReveal: 'Touch: Reveal', goalShowing: 'Goal: showing', holdGoal: 'Hold: show goal',
    assetsError: 'Could not load original assets.', localMove: 'Blue: local', dimensionalMove: 'Gold: 3D / 4D', wrapRoute: 'Dashed: wrap', landingCell: 'Green: landing',
    helpNote: '<strong>Optional aid:</strong> “Dimensional help” explains the 3rd/4th-axis geometry without solving the game. Flip-Flop previews affected cells; Bomb Squad shows orthogonal neighbours only; Maze Runner shows legal destinations; Peg Jumper shows legal jumps and landings; Tile Slider shows tiles that can slide into the blank. Blue is local, gold is 3D/4D and dashed outlines use Wrap.',
  },
  it: {
    game: 'Gioco', language: 'Lingua', loading: 'Caricamento…', back: 'Torna al gioco',
    pageTitle: '54321 — Port di preservazione', toolbarAria: 'Controlli di gioco', stageAria: 'Gioco 54321', boardAria: 'Tavola di gioco 54321', languageAria: 'Lingua',
    victoryText: 'VITTORIA', defeatText: 'SCONFITTA',
    newGame: 'NUOVA', help: 'AIUTO', wrap: 'WRAP', easy: 'FACILE', medium: 'MEDIA', hard: 'DIFF.',
    moves: 'Mosse', scramble: 'Mosse iniz.', flags: 'Bandiere', covered: 'Coperte', steps: 'Passi', repeats: 'Ripetuti',
    pegs: 'Pedine', jumps: 'Salti', shuffle: 'Scambi iniz.', removePeg: 'Rimuovi una pedina per iniziare',
    chooseJumped: 'Scegli la pedina da saltare', choosePeg: 'Scegli la pedina che salta',
    solvedShowing: 'Posizioni risolte visibili', alignBlank: 'Clicca una tessera allineata al vuoto',
    wrapOn: 'Wrap attivo', wrapOff: 'Wrap disattivo',
    dimHelpOn: 'Aiuto dimensionale: sì', dimHelpOff: 'Aiuto dimensionale: no',
    soundOn: 'Suono: sì', soundOff: 'Suono: no',
    touchFlag: 'Tocco: Bandiera', touchReveal: 'Tocco: Scopri', goalShowing: 'Soluzione: visibile', holdGoal: 'Tieni premuto: soluzione',
    assetsError: 'Impossibile caricare gli asset originali.', localMove: 'Azzurro: locale', dimensionalMove: 'Oro: 3D / 4D', wrapRoute: 'Tratteggio: wrap', landingCell: 'Verde: arrivo',
    helpNote: '<strong>Aiuto opzionale:</strong> “Aiuto dimensionale” rende leggibile la geometria della 3ª/4ª dimensione senza risolvere il gioco. Flip-Flop mostra le celle coinvolte; Bomb Squad solo i vicini ortogonali; Maze Runner le destinazioni legali; Peg Jumper salti e arrivi; Tile Slider le tessere che possono scorrere nel vuoto. Azzurro = locale, oro = 3D/4D, tratteggio = Wrap.',
  },
};

const HELP = {
  en: {
    flipflop: ['Flip-Flop', `
      <p>Clear every lit cell. Selecting a cell flips that cell and each orthogonal neighbour.</p>
      <p>2D, 3D and 4D use the same rule. With Wrap enabled, cells at an edge are neighbours with cells on the opposite edge.</p>
      <p>Every generated position is created from a solved board by applying legal moves, so it is always solvable.</p>`],
    bombsquad: ['Bomb Squad', `
      <p>Find and flag every bomb. Revealed cells show how many <strong>orthogonal</strong> neighbours contain bombs; diagonals never count.</p>
      <p>Click to reveal. Right-click or Shift-click to flag. On touch screens, use the Reveal/Flag toggle above the game.</p>
      <p>A zero cell automatically uncovers its orthogonal neighbours. Uncovering a bomb loses immediately. Unlike modern Minesweeper variants, the original does not protect the first click.</p>`],
    mazerunner: ['Maze Runner', `
      <p>Reach the target. Click a cell that lies in a direct logical line from your current position; you move there only if a passage is open all the way.</p>
      <p>In 3D/4D, moving between blocks means clicking the <strong>same relative cell</strong> in another block. Horizontal changes between blocks are the 3rd logical axis; vertical changes between rows of blocks are the 4th.</p>
      <p>Marked cells show where you have travelled. Light-blue wall marks inside a cell represent blocked passages along higher-dimensional axes.</p>
      <p>With Wrap enabled, passages may continue across the opposite edge of a tier. Easy and Medium remove extra walls and create more loops; Hard preserves a single-path perfect maze.</p>`],
    pegjumper: ['Peg Jumper', `
      <p>The goal is to remove pegs until only one remains.</p>
      <p>At the start, click any peg to remove it and open a hole. Then click the peg you want to move, followed by the neighbouring peg you want to jump over. The landing cell immediately beyond it must be a hole.</p>
      <p>Only orthogonal jumps are legal. With Wrap enabled, jumps may cross an edge into the opposite side of the same logical axis. Easy, Medium and Hard load the original 2001 board patterns.</p>`],
    tileslider: ['Tile Slider', `
      <p>Put every tile back in its ordered position. The black cell is the blank.</p>
      <p>Click any tile that lies on a direct logical axis from the blank. Every tile between the click and the blank slides one cell; the step counter counts each shifted tile, not just each click.</p>
      <p>With Wrap enabled, slides may cross an edge and the original four-cell topology chooses the shorter route. Hold right-click or Shift-click on the board to preview the solved arrangement.</p>
      <p>The center artwork encodes the first two coordinates of a tile and the border encodes the higher-dimensional coordinates.</p>`],
  },
  it: {
    flipflop: ['Flip-Flop', `
      <p>Spegni tutte le celle illuminate. Selezionando una cella si invertono quella cella e tutti i vicini ortogonali.</p>
      <p>La regola è identica in 2D, 3D e 4D. Con Wrap attivo, i bordi opposti sono adiacenti.</p>
      <p>Ogni posizione iniziale viene creata partendo dalla soluzione e applicando mosse legali: è quindi sempre risolvibile.</p>`],
    bombsquad: ['Bomb Squad', `
      <p>Trova e marca tutte le bombe. I numeri indicano quante bombe si trovano nei vicini <strong>ortogonali</strong>; le diagonali non contano.</p>
      <p>Clic per scoprire. Clic destro o Shift-clic per mettere una bandiera. Su touch usa il selettore Scopri/Bandiera sopra il gioco.</p>
      <p>Una cella con zero scopre automaticamente i vicini ortogonali. Scoprire una bomba fa perdere subito. L'originale non protegge la prima mossa.</p>`],
    mazerunner: ['Maze Runner', `
      <p>Raggiungi il bersaglio. Clicca una cella allineata lungo un solo asse logico rispetto alla posizione corrente: ti muovi solo se il passaggio è libero per tutta la distanza.</p>
      <p>In 3D/4D, per passare a un altro blocco devi cliccare la <strong>stessa posizione relativa</strong> nel blocco di destinazione. Lo spostamento orizzontale tra blocchi è la 3ª dimensione; quello verticale tra file di blocchi è la 4ª.</p>
      <p>Le celle marcate mostrano dove sei già passato. I segni azzurri dentro le celle rappresentano muri sulle dimensioni superiori.</p>
      <p>Con Wrap attivo, un passaggio può continuare dal bordo opposto. Facile e Media aggiungono cicli; Difficile mantiene un labirinto perfetto con un solo percorso tra due celle.</p>`],
    pegjumper: ['Peg Jumper', `
      <p>L'obiettivo è rimuovere le pedine fino a lasciarne una sola.</p>
      <p>All'inizio clicca una pedina per rimuoverla e creare un buco. Poi scegli la pedina che deve saltare e quindi la pedina adiacente da scavalcare. La cella subito oltre deve essere un buco.</p>
      <p>Sono validi solo salti ortogonali. Con Wrap attivo i salti possono attraversare un bordo. Facile, Media e Difficile caricano le configurazioni originali del 2001.</p>`],
    tileslider: ['Tile Slider', `
      <p>Riporta tutte le tessere nella posizione ordinata. La cella nera è lo spazio vuoto.</p>
      <p>Clicca una tessera allineata lungo un solo asse logico con il vuoto. Tutte le tessere intermedie scorrono di una cella; il contatore conta ogni tessera spostata, non solo i clic.</p>
      <p>Con Wrap attivo lo scorrimento può attraversare un bordo e la topologia originale sceglie il percorso più corto. Tieni premuto il clic destro o usa Shift-clic per vedere temporaneamente la soluzione.</p>
      <p>Il centro della tessera codifica le prime due coordinate; il bordo codifica le dimensioni superiori.</p>`],
  },
};

function readSetting(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeSetting(key, value) {
  try { localStorage.setItem(key, value); } catch { /* persistence is optional */ }
}

let gameId = 'flipflop';
let model = new FlipFlop();
let overlayUntil = 0;
let overlayKind = null;
let touchFlagMode = false;
let showTileGoal = false;
let dimensionalHelp = readSetting('54321-dimensional-help', readSetting('54321-maze-move-help', 'false')) === 'true';
let aidFocusIndex = null;
let soundEnabled = readSetting('54321-sound', 'true') !== 'false';
let language = readSetting('54321-language') || (navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en');
if (!I18N[language]) language = 'en';
let audioContext = null;

function tr(key) { return I18N[language][key] ?? I18N.en[key] ?? key; }

function loadImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { assets[name] = img; resolve(); };
    img.onerror = reject;
    img.src = `./src/assets/original/${name}.png`;
  });
}

function makeModel(id, options = {}) {
  const config = {
    dimensions: options.dimensions ?? model?.dimensions ?? 2,
    skillLevel: options.skillLevel ?? model?.skillLevel ?? 0,
    wrap: options.wrap ?? model?.wrap ?? true,
    seed: options.seed ?? Date.now(),
  };
  if (id === 'bombsquad') return new BombSquad(config);
  if (id === 'mazerunner') return new MazeRunner(config);
  if (id === 'pegjumper') return new PegJumper(config);
  if (id === 'tileslider') return new TileSlider(config);
  return new FlipFlop(config);
}

function playDing() {
  if (!soundEnabled) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});

  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  // Faithful reconstruction of SoundDev::ding(): a very short ~512 Hz sine
  // pulse with fast attack and exponential decay, synthesized at runtime.
  osc.type = 'sine';
  osc.frequency.setValueAtTime(512, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.24, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

function roundedLabel(text, x, y, width, active = false, fontSize = 15) {
  ctx.save();
  ctx.fillStyle = active ? '#fff' : '#2a0a0a';
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y);
  ctx.restore();
}

function drawSidebar() {
  ctx.drawImage(assets.panel, VIEW.SIDEBAR_X, 0);

  for (const c of controls.slice(0, 3)) {
    const active = model.dimensions === c.value;
    ctx.drawImage(assets[active ? 'dimOn' : 'dimOff'], c.x, c.y, c.w, c.h);
    roundedLabel(`${c.value}D`, c.x, c.y + c.h / 2, c.w, active);
  }

  const skills = [tr('easy'), tr('medium'), tr('hard')];
  for (const c of controls.slice(3, 6)) {
    const active = model.skillLevel === c.value;
    ctx.drawImage(assets[active ? 'setOn' : 'setOff'], c.x, c.y, c.w, c.h);
    roundedLabel(skills[c.value], c.x, c.y + c.h / 2, c.w, active, language === 'it' && c.value === 2 ? 12 : 14);
  }

  const wrap = controls.find((c) => c.id === 'wrap');
  ctx.drawImage(assets[model.wrap ? 'actOn' : 'actOff'], wrap.x, wrap.y, wrap.w, wrap.h);
  roundedLabel(tr('wrap'), wrap.x, wrap.y + wrap.h / 2, wrap.w, model.wrap, 13);

  const newer = controls.find((c) => c.id === 'new');
  ctx.fillStyle = '#36050a';
  ctx.fillRect(newer.x, newer.y, newer.w, newer.h);
  ctx.strokeStyle = '#f1a0a5';
  ctx.strokeRect(newer.x + 1, newer.y + 1, newer.w - 2, newer.h - 2);
  roundedLabel(tr('newGame'), newer.x, newer.y + newer.h / 2, newer.w, true, language === 'it' ? 14 : 13);

  ctx.fillStyle = '#f7d9db';
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  if (gameId === 'flipflop') {
    ctx.fillText(`${tr('moves')} ${model.actualMoves}`, 700, 350);
    ctx.fillText(`${tr('scramble')} ${model.expectedMoves}`, 700, 374);
  } else if (gameId === 'bombsquad') {
    ctx.fillText(`${tr('flags')} ${model.flagCount}/${model.bombCount}`, 700, 350);
    ctx.fillText(`${tr('covered')} ${model.coveredCount}`, 700, 374);
  } else if (gameId === 'mazerunner') {
    ctx.fillText(`${tr('steps')} ${model.stepsTaken}`, 700, 350);
    ctx.fillText(`${tr('repeats')} ${model.repeatsTaken}`, 700, 374);
  } else if (gameId === 'pegjumper') {
    ctx.fillText(`${tr('pegs')} ${model.pegsRemaining}`, 700, 350);
    ctx.fillText(`${tr('jumps')} ${model.stepsTaken}`, 700, 374);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(model.firstMove ? tr('removePeg') : (model.isSelected() ? tr('chooseJumped') : tr('choosePeg')), 700, 410);
  } else {
    ctx.fillText(`${tr('steps')} ${model.stepsTaken}`, 700, 350);
    ctx.fillText(`${tr('shuffle')} ${model.state().swapCount}`, 700, 374);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(showTileGoal ? tr('solvedShowing') : tr('alignBlank'), 700, 410);
  }

  if (dimensionalHelp && model.dimensions >= 3) {
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#80e5ff';
    ctx.fillText(tr('localMove'), 700, 458);
    ctx.fillStyle = '#ffe28a';
    ctx.fillText(tr('dimensionalMove'), 700, 476);
    ctx.fillStyle = '#f7d9db';
    ctx.fillText(tr('wrapRoute'), 700, 494);
    if (gameId === 'pegjumper') {
      ctx.fillStyle = '#9cff9c';
      ctx.fillText(tr('landingCell'), 700, 512);
    }
  }

  const help = controls.find((c) => c.id === 'help');
  ctx.drawImage(assets.helpOff, help.x, help.y, help.w, help.h);
  roundedLabel(tr('help'), help.x, help.y + help.h / 2, help.w, false, 14);
}

function drawAidCell(item, { landing = false, focus = false, label = true } = {}) {
  const [x, y] = cellToScreen(item.index, model.dimensions);
  const dimensional = Boolean(item.dimensional);
  ctx.save();
  ctx.lineWidth = focus ? 3 : dimensional ? 3 : 2;
  ctx.strokeStyle = focus
    ? 'rgba(255, 255, 255, .96)'
    : landing
      ? 'rgba(118, 255, 135, .96)'
      : dimensional
        ? 'rgba(255, 206, 72, .95)'
        : 'rgba(93, 218, 255, .90)';
  ctx.fillStyle = focus
    ? 'rgba(255, 255, 255, .08)'
    : landing
      ? 'rgba(118, 255, 135, .14)'
      : dimensional
        ? 'rgba(255, 206, 72, .13)'
        : 'rgba(93, 218, 255, .10)';
  if (item.wrapped) ctx.setLineDash([5, 3]);
  ctx.fillRect(x + 3, y + 3, VIEW.SQUARE - 6, VIEW.SQUARE - 6);
  ctx.strokeRect(x + 3.5, y + 3.5, VIEW.SQUARE - 7, VIEW.SQUARE - 7);
  ctx.setLineDash([]);

  if (label && dimensional && Number.isInteger(item.axis)) {
    const text = `${item.axis + 1}D${item.wrapped ? ' W' : ''}`;
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const width = ctx.measureText(text).width + 5;
    ctx.fillStyle = 'rgba(0, 0, 0, .82)';
    ctx.fillRect(x + VIEW.SQUARE / 2 - width / 2, y + VIEW.SQUARE - 13, width, 11);
    ctx.fillStyle = landing ? '#9cff9c' : '#ffe28a';
    ctx.fillText(text, x + VIEW.SQUARE / 2, y + VIEW.SQUARE - 3);
  }
  ctx.restore();
}

function drawFlipFlopAid() {
  if (!dimensionalHelp || model.dimensions < 3 || aidFocusIndex === null) return;
  for (const item of model.affectedCells(aidFocusIndex)) {
    drawAidCell(item, { focus: item.center, label: !item.center });
  }
}

function drawBombSquadAid() {
  if (!dimensionalHelp || model.dimensions < 3 || aidFocusIndex === null) return;
  drawAidCell({ index: aidFocusIndex, dimensional: false, wrapped: false }, { focus: true, label: false });
  for (const item of model.neighborsOf(aidFocusIndex)) drawAidCell(item);
}

function drawFlipFlopBoard() {
  const max = Cube.ARRAY_LENGTHS[model.dimensions];
  for (let index = 0; index < max; index += 1) {
    const [x, y] = cellToScreen(index, model.dimensions);
    ctx.drawImage(assets[model.cube.get(index) ? 'on' : 'off'], x, y);
  }
}

function drawBombSquadBoard() {
  const max = Cube.ARRAY_LENGTHS[model.dimensions];
  for (let index = 0; index < max; index += 1) {
    const [x, y] = cellToScreen(index, model.dimensions);
    const cell = model.cube.get(index);
    const uncovered = (cell & BOMB_CELL.UNCOVERED) !== 0;
    const showContents = model.gameOver || uncovered;

    ctx.drawImage(assets[uncovered ? 'uncovered' : 'covered'], x, y);
    if (showContents) {
      if ((cell & BOMB_CELL.BOMB) !== 0) {
        ctx.drawImage(assets.bomb, x, y);
      } else {
        const count = cell & BOMB_CELL.COUNT_MASK;
        if (count > 0) {
          ctx.save();
          ctx.fillStyle = '#f5ece4';
          ctx.font = 'bold 18px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(count), x + VIEW.SQUARE / 2, y + VIEW.SQUARE / 2 + 1);
          ctx.restore();
        }
      }
    }
    if ((cell & BOMB_CELL.FLAG) !== 0) ctx.drawImage(assets.flagged, x, y);
  }
}

function drawMazeRunnerBoard() {
  const max = Cube.ARRAY_LENGTHS[model.dimensions];
  for (let index = 0; index < max; index += 1) {
    const [x, y] = cellToScreen(index, model.dimensions);
    const cell = model.cube.get(index);

    ctx.drawImage(assets[(cell & MAZE_CELL.BEEN_HERE) !== 0 ? 'marked' : 'unmarked'], x, y);
    if ((cell & MAZE_CELL.FINISH_HERE) !== 0) ctx.drawImage(assets.goal, x, y);
    for (let wall = 0; wall < 2 * Cube.DIMENSIONS; wall += 1) {
      const mask = MAZE_CELL.LEFT << wall;
      if ((cell & mask) !== 0) ctx.drawImage(assets[`wall${wall}`], x, y);
    }
    if ((cell & MAZE_CELL.AM_HERE) !== 0) ctx.drawImage(assets.me, x, y);
  }
}

function drawMazeMoveOverlay() {
  if (!dimensionalHelp || gameId !== 'mazerunner' || model.dimensions < 3) return;
  for (const move of model.legalMoves()) drawAidCell(move);
}

function drawPegJumperBoard() {
  const max = Cube.ARRAY_LENGTHS[model.dimensions];
  for (let index = 0; index < max; index += 1) {
    const [x, y] = cellToScreen(index, model.dimensions);
    const cell = model.cube.get(index);
    if ((cell & PEG_CELL.PEG) !== 0) ctx.drawImage(assets.peg, x, y);
    else if ((cell & PEG_CELL.HOLE) !== 0) ctx.drawImage(assets.hole, x, y);
    else ctx.drawImage(assets.empty, x, y);
    if ((cell & PEG_CELL.SELECTED) !== 0) ctx.drawImage(assets.selected, x, y);
  }
}

function drawPegJumperAid() {
  if (!dimensionalHelp || model.dimensions < 3 || model.firstMove) return;
  if (model.isSelected()) {
    for (const jump of model.legalJumps(model.selectedSpot)) {
      drawAidCell({ index: jump.jumped, axis: jump.axis, dimensional: jump.dimensional, wrapped: jump.wrapped });
      drawAidCell({ index: jump.destination, axis: jump.axis, dimensional: jump.dimensional, wrapped: jump.wrapped }, { landing: true });
    }
    return;
  }

  const bySource = new Map();
  for (const jump of model.legalJumps()) {
    const current = bySource.get(jump.source);
    if (!current || (!current.dimensional && jump.dimensional) || (!current.wrapped && jump.wrapped)) {
      bySource.set(jump.source, { index: jump.source, axis: jump.axis, dimensional: jump.dimensional, wrapped: jump.wrapped });
    }
  }
  for (const item of bySource.values()) drawAidCell(item);
}

function drawTileSliderAid() {
  if (!dimensionalHelp || model.dimensions < 3 || showTileGoal) return;
  for (const move of model.legalMoves()) drawAidCell(move);
}

function drawTileSliderBoard() {
  const max = Cube.ARRAY_LENGTHS[model.dimensions];
  const blankValue = max - 1;
  for (let index = 0; index < max; index += 1) {
    const [x, y] = cellToScreen(index, model.dimensions);
    const value = showTileGoal ? index : model.cube.get(index);
    if (value === blankValue) continue;
    const coords = Cube.indexToVector(value);
    ctx.drawImage(assets.borders, coords[2] * VIEW.SQUARE, coords[3] * VIEW.SQUARE, VIEW.SQUARE, VIEW.SQUARE, x, y, VIEW.SQUARE, VIEW.SQUARE);
    ctx.drawImage(assets.centers, coords[0] * VIEW.SQUARE, coords[1] * VIEW.SQUARE, VIEW.SQUARE, VIEW.SQUARE, x, y, VIEW.SQUARE, VIEW.SQUARE);
  }
}

function drawBoard() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW.BOARD_SIZE, VIEW.BOARD_SIZE);
  if (gameId === 'bombsquad') { drawBombSquadBoard(); drawBombSquadAid(); }
  else if (gameId === 'mazerunner') { drawMazeRunnerBoard(); drawMazeMoveOverlay(); }
  else if (gameId === 'pegjumper') { drawPegJumperBoard(); drawPegJumperAid(); }
  else if (gameId === 'tileslider') { drawTileSliderBoard(); drawTileSliderAid(); }
  else { drawFlipFlopBoard(); drawFlipFlopAid(); }
}

function updateExternalControls() {
  gameLabel.textContent = tr('game');
  languageLabel.textContent = tr('language');
  languageSelect.value = language;
  closeHelpButton.textContent = tr('back');

  dimensionalHelpToggle.hidden = model.dimensions < 3;
  dimensionalHelpToggle.textContent = dimensionalHelp ? tr('dimHelpOn') : tr('dimHelpOff');
  dimensionalHelpToggle.setAttribute('aria-pressed', String(dimensionalHelp));

  soundToggle.textContent = soundEnabled ? tr('soundOn') : tr('soundOff');
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));

  contextAction.hidden = gameId !== 'bombsquad' && gameId !== 'tileslider';
  if (gameId === 'bombsquad') {
    contextAction.textContent = touchFlagMode ? tr('touchFlag') : tr('touchReveal');
    contextAction.setAttribute('aria-pressed', String(touchFlagMode));
  } else if (gameId === 'tileslider') {
    contextAction.textContent = showTileGoal ? tr('goalShowing') : tr('holdGoal');
    contextAction.setAttribute('aria-pressed', String(showTileGoal));
  }
}

function drawLocalizedOutcome(kind) {
  const text = kind === 'victory' ? tr('victoryText') : tr('defeatText');
  ctx.save();
  ctx.font = '900 58px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const x = VIEW.BOARD_SIZE / 2;
  const y = VIEW.BOARD_SIZE / 2;
  ctx.lineWidth = 16;
  ctx.strokeStyle = 'rgba(175, 0, 0, .95)';
  ctx.strokeText(text, x, y);
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(0, 0, 0, .95)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#fff0a8';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function draw() {
  drawBoard();
  drawSidebar();

  if (performance.now() < overlayUntil && overlayKind) {
    if (language === 'en') {
      const image = assets[overlayKind];
      ctx.drawImage(image, (600 - image.width) / 2, (600 - image.height) / 2);
    } else {
      drawLocalizedOutcome(overlayKind);
    }
  }

  const skill = language === 'it' ? ['Facile', 'Media', 'Difficile'][model.skillLevel] : ['Easy', 'Medium', 'Hard'][model.skillLevel];
  const gameName = gameSelect.options[gameSelect.selectedIndex]?.textContent || '54321';
  status.textContent = `${gameName} · ${model.dimensions}D · ${skill} · ${model.wrap ? tr('wrapOn') : tr('wrapOff')}`;
  updateExternalControls();
}

function showOutcome(kind) {
  overlayKind = kind;
  overlayUntil = performance.now() + 1800;
  draw();
  setTimeout(draw, 1850);
}

function newGame() {
  model.reset(Date.now());
  overlayUntil = 0;
  overlayKind = null;
  showTileGoal = false;
  aidFocusIndex = null;
  draw();
}

function configure(partial) {
  model.configure(partial);
  overlayUntil = 0;
  overlayKind = null;
  showTileGoal = false;
  aidFocusIndex = null;
  draw();
}

function switchGame(nextGame) {
  const options = { dimensions: model.dimensions, skillLevel: model.skillLevel, wrap: model.wrap };
  gameId = nextGame;
  model = makeModel(gameId, options);
  touchFlagMode = false;
  showTileGoal = false;
  overlayUntil = 0;
  overlayKind = null;
  aidFocusIndex = null;
  draw();
}

function hitControl(x, y) {
  return controls.find((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
}

function openHelp() {
  const [title, body] = HELP[language][gameId];
  helpTitle.textContent = title;
  helpBody.innerHTML = body + `<p class="help-note">${tr('helpNote')}</p>`;
  closeHelpButton.textContent = tr('back');
  dialog.showModal();
}

function setLanguage(next, { redraw = true } = {}) {
  language = I18N[next] ? next : 'en';
  writeSetting('54321-language', language);
  document.documentElement.lang = language;
  document.title = tr('pageTitle');
  languageSelect.value = language;
  gameLabel.textContent = tr('game');
  languageLabel.textContent = tr('language');
  languageSelect.setAttribute('aria-label', tr('languageAria'));
  toolbar.setAttribute('aria-label', tr('toolbarAria'));
  stage.setAttribute('aria-label', tr('stageAria'));
  canvas.setAttribute('aria-label', tr('boardAria'));
  closeHelpButton.textContent = tr('back');
  soundToggle.textContent = soundEnabled ? tr('soundOn') : tr('soundOff');
  if (redraw) draw();
}

canvas.addEventListener('contextmenu', (event) => event.preventDefault());
canvas.addEventListener('pointermove', (event) => {
  if (!dimensionalHelp || model.dimensions < 3 || (gameId !== 'flipflop' && gameId !== 'bombsquad')) return;
  if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  const [x, y] = pointerPosition(event);
  const next = x < VIEW.BOARD_SIZE && y < VIEW.BOARD_SIZE ? screenToCell(x, y, model.dimensions) : null;
  if (next !== aidFocusIndex) {
    aidFocusIndex = next;
    draw();
  }
});
canvas.addEventListener('pointerleave', (event) => {
  if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  if (aidFocusIndex !== null && (gameId === 'flipflop' || gameId === 'bombsquad')) {
    aidFocusIndex = null;
    draw();
  }
});

canvas.addEventListener('pointerdown', (event) => {
  const [x, y] = pointerPosition(event);

  if (gameId === 'tileslider' && (event.button !== 0 || event.shiftKey)) {
    showTileGoal = true;
    draw();
    return;
  }

  const control = hitControl(x, y);
  if (control) {
    if (control.kind === 'dim') configure({ dimensions: control.value });
    else if (control.kind === 'skill') configure({ skillLevel: control.value });
    else if (control.kind === 'wrap') configure({ wrap: !model.wrap });
    else if (control.kind === 'new') newGame();
    else if (control.kind === 'help') openHelp();
    return;
  }

  if (x >= VIEW.BOARD_SIZE || y >= VIEW.BOARD_SIZE) return;
  const index = screenToCell(x, y, model.dimensions);
  if (index === null) return;
  if (dimensionalHelp && model.dimensions >= 3 && (gameId === 'flipflop' || gameId === 'bombsquad')) {
    aidFocusIndex = index;
  }

  if (gameId === 'flipflop') {
    const won = model.flip(index);
    playDing();
    draw();
    if (won) showOutcome('victory');
    return;
  }

  if (gameId === 'mazerunner') {
    const previousWon = model.hasWon;
    const result = model.move(index);
    if (result.moved) playDing();
    draw();
    if (!previousWon && model.hasWon) showOutcome('victory');
    return;
  }

  if (gameId === 'pegjumper') {
    const previousWon = model.hasWon;
    const result = model.click(index, { selectOnly: event.button !== 0 });
    if (result.changed) playDing();
    draw();
    if (!previousWon && model.hasWon) showOutcome('victory');
    return;
  }

  if (gameId === 'tileslider') {
    const previousWon = model.hasWon;
    const result = model.move(index);
    if (result.moved) playDing();
    draw();
    if (!previousWon && model.hasWon) showOutcome('victory');
    return;
  }

  const previousLost = model.hasLost;
  const previousWon = model.hasWon;
  const beforeCovered = model.coveredCount;
  const beforeFlags = model.flagCount;
  const wantsFlag = event.button !== 0 || event.shiftKey || (event.pointerType === 'touch' && touchFlagMode);
  if (wantsFlag) model.toggleFlag(index);
  else model.uncover(index);
  if (beforeCovered !== model.coveredCount || beforeFlags !== model.flagCount) playDing();
  draw();
  if (!previousLost && model.hasLost) showOutcome('defeat');
  else if (!previousWon && model.hasWon) showOutcome('victory');
});

gameSelect.addEventListener('change', () => switchGame(gameSelect.value));
languageSelect.addEventListener('change', () => setLanguage(languageSelect.value));
dimensionalHelpToggle.addEventListener('click', () => {
  dimensionalHelp = !dimensionalHelp;
  writeSetting('54321-dimensional-help', String(dimensionalHelp));
  aidFocusIndex = null;
  draw();
});
soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  writeSetting('54321-sound', String(soundEnabled));
  if (soundEnabled) playDing();
  draw();
});
contextAction.addEventListener('click', () => {
  if (gameId !== 'bombsquad') return;
  touchFlagMode = !touchFlagMode;
  draw();
});
contextAction.addEventListener('pointerdown', (event) => {
  if (gameId !== 'tileslider') return;
  event.preventDefault();
  showTileGoal = true;
  draw();
});
function hideTileGoal() {
  if (!showTileGoal) return;
  showTileGoal = false;
  draw();
}
window.addEventListener('pointerup', hideTileGoal);
window.addEventListener('pointercancel', hideTileGoal);
closeHelpButton.addEventListener('click', () => dialog.close());

setLanguage(language, { redraw: false });
status.textContent = tr('loading');
updateExternalControls();
Promise.all(assetNames.map(loadImage)).then(draw).catch((error) => {
  console.error(error);
  status.textContent = tr('assetsError');
});
