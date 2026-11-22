import { Board } from '../core/board.js';
import { cellsForShip, createRandomBoard } from '../core/fleet.js';
import { SeededRng } from '../core/prng.js';
import { BOARD_SIZE, CLASSIC_FLEET, coordKey } from '../core/rules.js';
import { Warboats2009Player, HistoricalAiStallError } from '../players/warboats-2009.js';
import { Os4ReconstructedPlayer } from '../players/os4-2009-reconstructed.js';

const root = document.querySelector('#app');
const CPU_DELAY_MS = 430;
const LETTERS = 'ABCDEFGHIJ'.split('');
const SHIPS = [
  { index: 0, length: 5, key: 'carrier' },
  { index: 1, length: 4, key: 'battleship' },
  { index: 2, length: 3, key: 'cruiser' },
  { index: 3, length: 3, key: 'submarine' },
  { index: 4, length: 2, key: 'destroyer' }
];
const OPPONENTS = [
  { id: 'w1', short: 'L1', kind: 'warboats', skill: 1 },
  { id: 'w2', short: 'L2', kind: 'warboats', skill: 2 },
  { id: 'w3', short: 'L3', kind: 'warboats', skill: 3 },
  { id: 'w4', short: 'L4', kind: 'warboats', skill: 4 },
  { id: 'os4', short: '2009', kind: 'os4' }
];

const I18N = {
  it: {
    documentTitle: '🐽’s Naval Battle',
    brandSub: 'Battaglia navale classica',
    home: 'Menu',
    instructions: 'Come si gioca',
    history: 'Informazioni',
    close: 'Chiudi',
    eyebrow: 'Gioco classico · 1 giocatore',
    heroTitle: 'Affonda la flotta<br>avversaria.',
    heroCopy: 'Posiziona le tue navi, scegli il livello e prova ad affondare tutta la flotta avversaria prima che il computer trovi la tua.',
    chooseOpponent: 'Scegli la difficoltà',
    play: 'Gioca',
    howToPlay: 'Come si gioca',
    heroFoot1: 'Griglia 10×10 · 5 navi',
    heroFoot2: 'Nessuna installazione',
    strongest: 'più difficile',
    classic: 'classico',
    opponents: {
      w1: { title: 'Facile', sub: 'Un avversario tranquillo, ideale per iniziare.' },
      w2: { title: 'Normale', sub: 'Se ti colpisce, prova a trovare il resto della nave.' },
      w3: { title: 'Difficile', sub: 'Usa meglio gli indizi lasciati dai colpi precedenti.' },
      w4: { title: 'Esperto', sub: 'Cerca la tua flotta in modo più efficace.', tag: 'più difficile' },
      os4: { title: 'Classico', sub: 'Uno stile semplice, imprevedibile e vecchia scuola.', tag: 'alternativo' }
    },
    ships: { carrier: 'Portaerei', battleship: 'Corazzata', cruiser: 'Incrociatore', submarine: 'Sottomarino', destroyer: 'Cacciatorpediniere' },
    placeFleet: 'Posiziona la tua flotta',
    opponentLabel: 'Livello',
    random: 'Casuale',
    rotate: 'Ruota',
    horizontal: 'orizzontale',
    vertical: 'verticale',
    start: 'Sono pronto',
    yourShips: 'Le tue navi',
    placed: 'piazzata',
    toPlace: 'da piazzare',
    placementHelp: 'Seleziona una nave e tocca una casella per spostarla. Usa Ruota per cambiare orientamento. Le navi possono toccarsi.',
    clearGrid: 'Ricomincia',
    yourTurn: 'Tocca a te',
    cpuTurn: 'Tocca all’avversario…',
    sunkYou: 'Avversarie: {n}/5 affondate',
    sunkCpu: 'Tue: {n}/5 affondate',
    yourFleet: 'La tua flotta',
    cpuArrow: 'colpi avversari →',
    enemyWaters: 'Acque nemiche',
    shootHere: '← spara qui',
    quit: 'Esci',
    quitConfirm: 'Vuoi abbandonare la partita?',
    afloat: 'A galla',
    sunk: 'Affondata',
    placeAt: 'Piazza la nave in {coord}',
    fireAt: 'Spara in {coord}',
    invalidPlacement: 'Qui la nave non entra oppure si sovrappone a un’altra.',
    alreadyShot: 'Hai già sparato qui.',
    enemySunk: 'Affondata!',
    yourShipSunk: 'Una delle tue navi è stata affondata.',
    recovery: 'L’avversario cambia bersaglio e la partita continua.',
    won: 'Hai vinto!',
    lost: 'Hai perso',
    winCopy: 'Hai affondato tutta la flotta avversaria.',
    loseCopy: 'La tua flotta è stata affondata. Puoi riprovare con la stessa disposizione.',
    yourShots: 'tuoi colpi',
    cpuShots: 'colpi avversari',
    totalTurns: 'turni totali',
    replay: 'Rigioca',
    newGame: 'Nuova partita',
    menu: 'Torna al menu',
    instructionsTitle: 'Come si gioca',
    instructionsIntro: 'Posiziona le cinque navi sulla tua griglia. A ogni turno scegli una casella nelle acque nemiche. Se trovi una nave, continua a cercarla finché non la affondi. Vince chi affonda per primo tutta la flotta avversaria.',
    level1: '<strong>Facile:</strong> perfetto per prendere confidenza con il gioco.',
    level2: '<strong>Normale:</strong> reagisce ai colpi a segno e cerca nelle vicinanze.',
    level3: '<strong>Difficile:</strong> segue meglio le tracce delle tue navi.',
    level4: '<strong>Esperto:</strong> è l’avversario più efficace.',
    levelOs4: '<strong>Classico:</strong> un avversario alternativo, semplice e imprevedibile.',
    replayHelp: '<strong>Rigioca</strong> mantiene la disposizione delle tue navi ma cambia quella avversaria. <strong>Nuova partita</strong> ti permette di riposizionare la flotta.',
    historyTitle: 'Informazioni',
    historyP1: '<strong>🐽’s Naval Battle</strong> nasce dal recupero di vecchi giochi open source di Battaglia Navale e delle loro strategie per il computer.',
    historyP2: 'Le modalità di gioco conservano idee provenienti da <strong>Warboats 0.51</strong> e <strong>Bataille Navale OS4</strong>, adattate per funzionare direttamente in un browser moderno.',
    historyP3: 'Il progetto conserva anche i sorgenti e la documentazione originali: il gioco resta semplice da usare, mentre la parte di archeologia software rimane disponibile a chi vuole approfondire.',
    language: 'Lingua'
  },
  en: {
    documentTitle: '🐽’s Naval Battle',
    brandSub: 'Classic Naval Battle',
    home: 'Menu',
    instructions: 'How to play',
    history: 'About',
    close: 'Close',
    eyebrow: 'Classic game · 1 player',
    heroTitle: 'Sink the enemy<br>fleet.',
    heroCopy: 'Place your ships, choose a level and sink the entire enemy fleet before the computer finds yours.',
    chooseOpponent: 'Choose difficulty',
    play: 'Play',
    howToPlay: 'How to play',
    heroFoot1: '10×10 board · 5 ships',
    heroFoot2: 'No installation required',
    strongest: 'hardest',
    classic: 'classic',
    opponents: {
      w1: { title: 'Easy', sub: 'A relaxed opponent, perfect for getting started.' },
      w2: { title: 'Normal', sub: 'After a hit, it searches nearby for the rest of the ship.' },
      w3: { title: 'Hard', sub: 'Makes better use of clues from previous shots.' },
      w4: { title: 'Expert', sub: 'Searches for your fleet more effectively.', tag: 'hardest' },
      os4: { title: 'Classic', sub: 'A simple, unpredictable old-school style.', tag: 'alternative' }
    },
    ships: { carrier: 'Carrier', battleship: 'Battleship', cruiser: 'Cruiser', submarine: 'Submarine', destroyer: 'Destroyer' },
    placeFleet: 'Place your fleet',
    opponentLabel: 'Level',
    random: 'Random',
    rotate: 'Rotate',
    horizontal: 'horizontal',
    vertical: 'vertical',
    start: 'I’m ready',
    yourShips: 'Your ships',
    placed: 'placed',
    toPlace: 'to place',
    placementHelp: 'Select a ship and tap a square to move it. Use Rotate to change its direction. Ships may touch each other.',
    clearGrid: 'Start over',
    yourTurn: 'Your turn',
    cpuTurn: 'Opponent’s turn…',
    sunkYou: 'Enemy: {n}/5 sunk',
    sunkCpu: 'Yours: {n}/5 sunk',
    yourFleet: 'Your fleet',
    cpuArrow: 'enemy shots →',
    enemyWaters: 'Enemy waters',
    shootHere: '← fire here',
    quit: 'Quit',
    quitConfirm: 'Do you want to quit this game?',
    afloat: 'Afloat',
    sunk: 'Sunk',
    placeAt: 'Place ship at {coord}',
    fireAt: 'Fire at {coord}',
    invalidPlacement: 'The ship does not fit here or overlaps another ship.',
    alreadyShot: 'You already fired here.',
    enemySunk: 'Sunk!',
    yourShipSunk: 'One of your ships has been sunk.',
    recovery: 'The opponent changes target and the game continues.',
    won: 'You win!',
    lost: 'You lose',
    winCopy: 'You sank the entire enemy fleet.',
    loseCopy: 'Your fleet was sunk. You can try again with the same layout.',
    yourShots: 'your shots',
    cpuShots: 'enemy shots',
    totalTurns: 'total turns',
    replay: 'Play again',
    newGame: 'New game',
    menu: 'Back to menu',
    instructionsTitle: 'How to play',
    instructionsIntro: 'Place your five ships on the grid. Each turn, choose a square in enemy waters. Hit a ship and keep hunting until you sink it. The first player to sink the entire enemy fleet wins.',
    level1: '<strong>Easy:</strong> perfect for learning the game.',
    level2: '<strong>Normal:</strong> reacts to hits and searches nearby.',
    level3: '<strong>Hard:</strong> follows the trail of your ships more carefully.',
    level4: '<strong>Expert:</strong> the most effective opponent.',
    levelOs4: '<strong>Classic:</strong> an alternative, simple and unpredictable opponent.',
    replayHelp: '<strong>Play again</strong> keeps your ship layout but changes the enemy fleet. <strong>New game</strong> lets you place your fleet again.',
    historyTitle: 'About',
    historyP1: '<strong>🐽’s Naval Battle</strong> grew out of the recovery of old open-source naval battle games and their computer strategies.',
    historyP2: 'Its play styles preserve ideas from <strong>Warboats 0.51</strong> and <strong>Bataille Navale OS4</strong>, adapted to run directly in a modern browser.',
    historyP3: 'The project also preserves the original source code and documentation. The game stays simple to play, while the software-archaeology material remains available for anyone who wants to dig deeper.',
    language: 'Language'
  }
};

function initialLanguage() {
  const saved = localStorage.getItem('grugnetto-naval-battle-language') ?? localStorage.getItem('grugnetto-battleship-language') ?? localStorage.getItem('battlelab-language');
  if (saved === 'it' || saved === 'en') return saved;
  return navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en';
}

const state = {
  lang: initialLanguage(),
  screen: 'home',
  opponentId: 'w3',
  orientation: 'H',
  selectedShip: 0,
  placements: SHIPS.map(s => ({ ...s, cells: null })),
  playerBoard: null,
  enemyBoard: null,
  cpu: null,
  cpuRecoveryRng: null,
  history: [],
  humanTurn: true,
  busy: false,
  seed: null,
  lastHumanLayout: null,
  result: null,
  toastTimer: null
};

function t(key, vars = {}) {
  const parts = key.split('.');
  let value = I18N[state.lang];
  for (const part of parts) value = value?.[part];
  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

function opponentText(o = opponent()) { return I18N[state.lang].opponents[o.id]; }
function shipName(ship) { return I18N[state.lang].ships[ship.key]; }

function setLanguage(lang) {
  if (lang !== 'it' && lang !== 'en') return;
  state.lang = lang;
  localStorage.setItem('grugnetto-naval-battle-language', lang);
  render();
}

function randomSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] >>> 0;
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function opponent() { return OPPONENTS.find(o => o.id === state.opponentId); }
function cloneCells(cells) { return cells ? cells.map(c => ({ ...c })) : null; }
function cloneLayout(layout = state.placements) { return layout.map(s => ({ ...s, cells: cloneCells(s.cells) })); }

function boardFromLayout(layout = state.placements) {
  const board = new Board(BOARD_SIZE);
  for (const ship of layout) {
    if (!ship.cells) continue;
    board.placeShip(ship.cells, `ship-${ship.index}-L${ship.length}`);
  }
  return board;
}

function randomizeHumanFleet() {
  const rng = new SeededRng(randomSeed());
  const board = createRandomBoard(rng, CLASSIC_FLEET);
  state.placements = SHIPS.map((spec, i) => ({ ...spec, cells: board.ships[i].cells.map(c => ({ ...c })) }));
  state.selectedShip = 0;
}

function allPlaced() { return state.placements.every(s => Array.isArray(s.cells)); }

function placeSelectedAt(x, y) {
  const current = state.placements[state.selectedShip];
  const cells = cellsForShip(x, y, current.length, state.orientation === 'H');
  const otherLayout = state.placements.map((s, i) => i === state.selectedShip ? { ...s, cells: null } : s);
  const board = boardFromLayout(otherLayout);
  if (!board.canPlace(cells)) {
    toast(t('invalidPlacement'));
    return;
  }
  state.placements[state.selectedShip] = { ...current, cells };
  const next = state.placements.findIndex((s, i) => i > state.selectedShip && !s.cells);
  if (next >= 0) state.selectedShip = next;
  render();
}

function createCpu(seed) {
  const o = opponent();
  const rng = new SeededRng((seed ^ 0x9e3779b9) >>> 0);
  if (o.kind === 'os4') return new Os4ReconstructedPlayer(rng, 'Bataille Navale OS4 2009');
  return new Warboats2009Player(rng, o.skill, `Warboats 0.51 L${o.skill}`);
}

function startBattle({ keepLayout = false } = {}) {
  if (!keepLayout && !allPlaced()) return;
  if (keepLayout && state.lastHumanLayout) state.placements = cloneLayout(state.lastHumanLayout);
  state.seed = randomSeed();
  state.playerBoard = boardFromLayout();
  state.enemyBoard = createRandomBoard(new SeededRng((state.seed ^ 0xa5a5a5a5) >>> 0), CLASSIC_FLEET);
  state.cpu = createCpu(state.seed);
  state.cpuRecoveryRng = new SeededRng((state.seed ^ 0x51ed270b) >>> 0);
  state.history = [];
  state.humanTurn = true;
  state.busy = false;
  state.result = null;
  state.lastHumanLayout = cloneLayout();
  state.screen = 'battle';
  render();
}

function resetToPlacement() {
  randomizeHumanFleet();
  state.orientation = 'H';
  state.screen = 'placement';
  render();
}

function openPlacement() {
  randomizeHumanFleet();
  state.screen = 'placement';
  render();
}

function humanFire(x, y) {
  if (state.screen !== 'battle' || state.busy || !state.humanTurn) return;
  const key = coordKey({ x, y });
  if (state.enemyBoard.shots.has(key)) {
    toast(t('alreadyShot'));
    return;
  }
  const result = state.enemyBoard.fire({ x, y });
  const event = { turn: state.history.length, actor: 0, ...result };
  state.history.push(event);
  if (result.sunk) toast(t('enemySunk'));
  state.humanTurn = false;
  state.busy = true;
  render();
  if (state.enemyBoard.allSunk()) return finish(0);
  setTimeout(cpuFire, CPU_DELAY_MS);
}

function recoveryShot() {
  const available = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const key = coordKey({ x, y });
      if (!state.playerBoard.shots.has(key)) available.push({ x, y });
    }
  }
  const shot = state.cpuRecoveryRng.pick(available);
  state.cpu.tried?.add(coordKey(shot));
  return shot;
}

function cpuFire() {
  if (state.screen !== 'battle' || state.result) return;
  let shot;
  try {
    shot = state.cpu.nextShot({ boardSize: BOARD_SIZE, history: state.history.map(e => ({ ...e, coord: { ...e.coord } })) });
  } catch (error) {
    if (!(error instanceof HistoricalAiStallError)) throw error;
    shot = recoveryShot();
    toast(t('recovery'), 3200);
  }
  const result = state.playerBoard.fire(shot);
  const event = { turn: state.history.length, actor: 1, ...result };
  state.history.push(event);
  if (result.sunk) toast(t('yourShipSunk'));
  state.cpu.observe?.(event, { boardSize: BOARD_SIZE, history: state.history });
  if (state.playerBoard.allSunk()) return finish(1);
  state.humanTurn = true;
  state.busy = false;
  render();
}

function finish(winner) {
  state.result = {
    winner,
    turns: state.history.length,
    humanShots: state.history.filter(e => e.actor === 0).length,
    cpuShots: state.history.filter(e => e.actor === 1).length
  };
  state.busy = false;
  state.screen = 'result';
  render();
}

function sunkCount(board) { return board?.ships.filter(s => s.hits.size === s.cells.length).length ?? 0; }
function isShipSunk(board, shipIndex) { const s = board.ships[shipIndex]; return s && s.hits.size === s.cells.length; }

function shell(content, { showBack = false } = {}) {
  document.documentElement.lang = state.lang;
  document.title = t('documentTitle');
  root.innerHTML = `
    <header class="app-header">
      <div class="brand"><div class="brand-mark">⚓</div><div class="brand-text"><div class="brand-title">🐽’s Naval Battle</div><div class="brand-sub">${t('brandSub')}</div></div></div>
      <div class="header-actions">
        <div class="language-switch" role="group" aria-label="${t('language')}">
          <button class="lang-btn ${state.lang === 'it' ? 'active' : ''}" data-lang="it" aria-pressed="${state.lang === 'it'}">IT</button>
          <button class="lang-btn ${state.lang === 'en' ? 'active' : ''}" data-lang="en" aria-pressed="${state.lang === 'en'}">EN</button>
        </div>
        ${showBack ? `<button class="ghost-btn small-btn" data-action="home">${t('home')}</button>` : ''}
        <button class="icon-btn" data-modal="instructions" aria-label="${t('instructions')}"><span class="label">${t('instructions')}</span> ?</button>
        <button class="icon-btn" data-modal="history" aria-label="${t('history')}"><span class="label">${t('history')}</span> ◈</button>
      </div>
    </header>
    <main class="stage">${content}</main>
    <div class="toast" id="toast"></div>`;
  bindGlobal();
}

function renderHome() {
  const cards = OPPONENTS.map(o => {
    const copy = opponentText(o);
    return `<button class="difficulty ${o.id === state.opponentId ? 'selected' : ''}" data-opponent="${o.id}">
      ${copy.tag ? `<span class="tag">${copy.tag}</span>` : ''}
      <strong>${copy.title}</strong><small>${copy.sub}</small>
    </button>`;
  }).join('');
  shell(`<section class="screen screen-center"><div class="hero panel">
    <div class="eyebrow">${t('eyebrow')}</div>
    <h1>${t('heroTitle')}</h1>
    <div class="hero-copy">${t('heroCopy')}</div>
    <div class="difficulty-title">${t('chooseOpponent')}</div>
    <div class="difficulty-grid">${cards}</div>
    <div class="hero-actions"><button class="primary-btn" data-action="play">${t('play')}</button><button class="secondary-btn" data-modal="instructions">${t('howToPlay')}</button></div>
    <div class="hero-foot"><span>${t('heroFoot1')}</span><span>${t('heroFoot2')}</span></div>
  </div></section>`);
  document.querySelectorAll('[data-opponent]').forEach(btn => btn.addEventListener('click', () => { state.opponentId = btn.dataset.opponent; render(); }));
}

function renderPlacement() {
  const board = boardFromLayout();
  const o = opponent();
  const copy = opponentText(o);
  const shipButtons = state.placements.map((s, i) => `<button class="ship-choice ${i === state.selectedShip ? 'selected' : ''} ${s.cells ? 'placed' : ''}" data-ship="${i}"><span class="ship-meta"><span class="ship-name">${shipName(s)}</span><span class="ship-dots">${'<i></i>'.repeat(s.length)}</span></span><span class="ship-state">${s.cells ? t('placed') : t('toPlace')}</span></button>`).join('');
  shell(`<section class="screen">
    <div class="phase-head"><div><h1>${t('placeFleet')}</h1><p>${t('opponentLabel')}: <strong>${copy.title}</strong> · ${copy.sub}</p></div><div class="phase-actions"><button class="secondary-btn" data-action="randomize">${t('random')}</button><button class="secondary-btn" data-action="rotate">${t('rotate')} · ${state.orientation === 'H' ? t('horizontal') : t('vertical')}</button><button class="primary-btn" data-action="start" ${allPlaced() ? '' : 'disabled'}>${t('start')}</button></div></div>
    <div class="placement-layout">
      <div class="board-panel panel">${boardHtml(board,{placement:true})}</div>
      <aside class="placement-side panel"><h2>${t('yourShips')}</h2><div class="ship-list">${shipButtons}</div><div class="placement-help">${t('placementHelp')}</div><button class="ghost-btn" data-action="clear">${t('clearGrid')}</button></aside>
    </div>
  </section>`, { showBack: true });
  document.querySelectorAll('[data-ship]').forEach(b => b.addEventListener('click', () => { state.selectedShip = Number(b.dataset.ship); render(); }));
  document.querySelectorAll('.cell[data-place]').forEach(b => b.addEventListener('click', () => placeSelectedAt(Number(b.dataset.x), Number(b.dataset.y))));
}

function fleetHealthHtml(board) {
  if (!board) return '';
  return board.ships.map((ship, i) => `<span class="mini-ship ${isShipSunk(board,i) ? 'sunk' : ''}" title="${isShipSunk(board,i) ? t('sunk') : t('afloat')}">${'<i></i>'.repeat(ship.cells.length)}</span>`).join('');
}

function renderBattle() {
  const o = opponent();
  const copy = opponentText(o);
  const turnText = state.humanTurn && !state.busy ? t('yourTurn') : t('cpuTurn');
  const detail = `${t('sunkYou', { n: sunkCount(state.enemyBoard) })} · ${t('sunkCpu', { n: sunkCount(state.playerBoard) })}`;
  shell(`<section class="screen combat-layout">
    <div class="status-bar panel"><div><div class="turn">${turnText}</div><div style="font-size:.72rem;color:var(--muted)">${copy.title} · ${copy.sub}</div></div><div class="status-detail">${detail}</div></div>
    <div class="battle-boards">
      <section class="battle-board panel"><div class="board-wrap"><div class="board-caption"><span>${t('yourFleet')}</span><span>${t('cpuArrow')}</span></div>${boardHtml(state.playerBoard,{own:true})}</div></section>
      <section class="battle-board enemy panel"><div class="board-wrap"><div class="board-caption"><span>${t('enemyWaters')}</span><span>${t('shootHere')}</span></div>${boardHtml(state.enemyBoard,{enemy:true,reveal:false})}</div></section>
    </div>
    <div class="battle-footer panel"><div class="fleet-health">${fleetHealthHtml(state.playerBoard)}</div><button class="ghost-btn small-btn" data-action="quit">${t('quit')}</button></div>
  </section>`, { showBack: false });
  document.querySelectorAll('.cell[data-fire]').forEach(b => b.addEventListener('click', () => humanFire(Number(b.dataset.x), Number(b.dataset.y))));
}

function renderResult() {
  const won = state.result.winner === 0;
  const copy = opponentText();
  shell(`<section class="screen screen-center"><div class="result-card panel">
    <div class="result-icon">${won ? '🏆' : '🌊'}</div><div class="eyebrow">${copy.title}</div><h1>${won ? t('won') : t('lost')}</h1>
    <p>${won ? t('winCopy') : t('loseCopy')}</p>
    <div class="result-stats"><div class="stat"><strong>${state.result.humanShots}</strong><small>${t('yourShots')}</small></div><div class="stat"><strong>${state.result.cpuShots}</strong><small>${t('cpuShots')}</small></div><div class="stat"><strong>${state.result.turns}</strong><small>${t('totalTurns')}</small></div></div>
    <div class="result-actions"><button class="primary-btn" data-action="replay">${t('replay')}</button><button class="secondary-btn" data-action="placement">${t('newGame')}</button><button class="ghost-btn" data-action="home">${t('menu')}</button></div>
  </div></section>`);
}

function boardHtml(board,{own=false,enemy=false,placement=false,reveal=false}={}) {
  const sunkIds = new Set(board.ships.filter(s => s.hits.size === s.cells.length).map(s => s.id));
  let html = '<div class="board-grid"><div class="axis"></div>';
  for (const l of LETTERS) html += `<div class="axis">${l}</div>`;
  for (let y=0;y<BOARD_SIZE;y++) {
    html += `<div class="axis">${y+1}</div>`;
    for (let x=0;x<BOARD_SIZE;x++) {
      const key = coordKey({x,y});
      const shipIndex = board.occupancy.get(key);
      const hasShip = shipIndex !== undefined;
      const shot = board.shots.get(key);
      const sunk = hasShip && sunkIds.has(board.ships[shipIndex].id);
      const classes = ['cell'];
      if ((own || placement || reveal) && hasShip) classes.push('ship');
      if (enemy && !shot) classes.push('target');
      if (shot && !shot.hit) classes.push('miss');
      if (shot?.hit) classes.push('hit');
      if (sunk) classes.push('sunk');
      if (reveal && hasShip && !shot) classes.push('reveal');
      const data = placement ? `data-place data-x="${x}" data-y="${y}"` : enemy && !shot ? `data-fire data-x="${x}" data-y="${y}"` : '';
      const coord = `${LETTERS[x]}${y+1}`;
      const label = placement ? t('placeAt', { coord }) : enemy ? t('fireAt', { coord }) : coord;
      html += `<button class="${classes.join(' ')}" ${data} aria-label="${label}"></button>`;
    }
  }
  return html + '</div>';
}

function instructionsModal() {
  return `<div class="modal-backdrop" data-close-modal><div class="modal panel" role="dialog" aria-modal="true" aria-label="${t('instructions')}" data-modal-panel><div class="modal-head"><h2>${t('instructionsTitle')}</h2><button class="close-x" data-close-modal aria-label="${t('close')}">×</button></div>
  <p>${t('instructionsIntro')}</p>
  <ul><li>${t('level1')}</li><li>${t('level2')}</li><li>${t('level3')}</li><li>${t('level4')}</li><li>${t('levelOs4')}</li></ul>
  <p>${t('replayHelp')}</p></div></div>`;
}

function historyModal() {
  return `<div class="modal-backdrop" data-close-modal><div class="modal panel" role="dialog" aria-modal="true" aria-label="${t('history')}" data-modal-panel><div class="modal-head"><h2>${t('historyTitle')}</h2><button class="close-x" data-close-modal aria-label="${t('close')}">×</button></div>
  <p>${t('historyP1')}</p>
  <p>${t('historyP2')}</p>
  <p>${t('historyP3')}</p></div></div>`;
}

function openModal(kind) {
  const wrap = document.createElement('div');
  wrap.innerHTML = kind === 'history' ? historyModal() : instructionsModal();
  document.body.appendChild(wrap.firstElementChild);
  const modal = document.querySelector('.modal-backdrop');
  modal.addEventListener('click', e => { if (e.target.hasAttribute('data-close-modal')) modal.remove(); });
  modal.querySelector('[data-modal-panel]').addEventListener('click', e => e.stopPropagation());
  modal.querySelector('.close-x').addEventListener('click', () => modal.remove());
}

function toast(message, duration=2200) {
  const el = document.querySelector('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

function bindGlobal() {
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => setLanguage(b.dataset.lang)));
  document.querySelectorAll('[data-modal]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.modal)));
  document.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => {
    const action = b.dataset.action;
    if (action === 'play') openPlacement();
    else if (action === 'home') { state.screen='home'; render(); }
    else if (action === 'randomize') { randomizeHumanFleet(); render(); }
    else if (action === 'rotate') { state.orientation = state.orientation === 'H' ? 'V' : 'H'; render(); }
    else if (action === 'clear') { state.placements = SHIPS.map(s=>({...s,cells:null})); state.selectedShip=0; render(); }
    else if (action === 'start') startBattle();
    else if (action === 'quit') { if (confirm(t('quitConfirm'))) { state.screen='home'; render(); } }
    else if (action === 'replay') startBattle({keepLayout:true});
    else if (action === 'placement') resetToPlacement();
  }));
}

function render() {
  if (state.screen === 'home') renderHome();
  else if (state.screen === 'placement') renderPlacement();
  else if (state.screen === 'battle') renderBattle();
  else if (state.screen === 'result') renderResult();
}

window.addEventListener('keydown', e => {
  if (state.screen === 'placement' && (e.key === 'r' || e.key === 'R')) {
    state.orientation = state.orientation === 'H' ? 'V' : 'H';
    render();
  }
});

render();
