import { Game } from '../core/Game.js';
import { CpuPlayer } from '../ai/CpuPlayer.js';
import { translator } from '../i18n/strings.js';
import { HISTORIC_BOARD_THEMES, getHistoricBoardTheme } from './historicBoardLayout.js';
import { BoardCalibrator, clearCalibratedLayout, cloneBoardLayout, exportBoardLayout, fitBoardRect, loadCalibratedLayout, saveCalibratedLayout, updateDebugMarkerPlacement } from './BoardCalibrator.js';
import { Animator } from './Animator.js';
import { AudioEngine } from '../audio/AudioEngine.js';

const SAVE_KEY = 'grugnettos-goose.save.v1';
const LANGUAGE_KEY = 'grugnettos-goose.language';
const AUDIO_KEY = 'grugnettos-goose.audio';
const MOTION_KEY = 'grugnettos-goose.reduced-motion';
const BOARD_THEME_KEY = 'grugnettos-goose.board-theme';
const board = await fetch('./data/boards/classic-63.json').then((response) => response.json());
const boardLayouts = Object.fromEntries(await Promise.all(HISTORIC_BOARD_THEMES.map(async (theme) => {
  const layout = await fetch(`./data/board-layouts/${theme.id}.json`).then((response) => response.json());
  return [theme.id, layout];
})));
const debugBoard = new URLSearchParams(location.search).has('debugBoard');

let language = localStorage.getItem(LANGUAGE_KEY) || 'it';
let t = translator(language);
let game = null;
let cpuBusy = false;
let animating = false;
const storedMotion = localStorage.getItem(MOTION_KEY);
let reducedMotion = storedMotion === null
  ? globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  : storedMotion === 'true';
let audioEnabled = localStorage.getItem(AUDIO_KEY) !== 'false';
let boardThemeId = localStorage.getItem(BOARD_THEME_KEY) || 'ganzenbord-pd';
if (!boardLayouts[boardThemeId]) boardThemeId = 'ganzenbord-pd';
let activeLayouts = Object.fromEntries(Object.entries(boardLayouts).map(([id, layout]) => [id, loadCalibratedLayout(id, layout)]));
const cpu = new CpuPlayer({ delayMs: 550 });

const $ = (selector) => document.querySelector(selector);
const boardEl = $('#board');
const boardStageEl = boardEl.closest('.board-stage');
const playerCountEl = $('#playerCount');
const playerSetupEl = $('#playerSetup');
const rollButton = $('#rollButton');
const replayButton = $('#replayButton');
const continueButton = $('#continueButton');
const logEl = $('#gameLog');
const rulesDialog = $('#rulesDialog');
const setupDetails = $('#setupDetails');
const audioToggle = $('#audioToggle');
const motionToggle = $('#motionToggle');
const mobileRollButton = $('#mobileRollButton');
const mobileTurnLabel = $('#mobileTurnLabel');
const mobileRollLabel = $('#mobileRollLabel');
const mobileActionBar = $('#mobileActionBar');
const boardThemeSelect = $('#boardThemeSelect');
const boardThemeCaption = $('#boardThemeCaption');
const calibrationPanel = $('#calibrationPanel');
const calibrationStatus = $('#calibrationStatus');
const calibrationSaveButton = $('#calibrationSaveButton');
const calibrationResetButton = $('#calibrationResetButton');
const calibrationExportButton = $('#calibrationExportButton');
const turnNotice = $('#turnNotice');
const turnNoticeAvatar = $('#turnNoticeAvatar');
const turnNoticeTitle = $('#turnNoticeTitle');
const turnNoticeDetail = $('#turnNoticeDetail');
let turnNoticeTimer = null;

audioToggle.checked = audioEnabled;
motionToggle.checked = reducedMotion;

const audio = new AudioEngine({ enabled: audioEnabled });
const animator = new Animator({
  boardEl,
  startZoneEl: $('#startZone'),
  diceEl: $('#diceVisual'),
  finish: board.finish,
  reducedMotion: () => reducedMotion,
  audio
});

// Unlock Web Audio as early as possible from a direct user gesture. This is
// intentionally redundant with roll()/toggle unlocks because Safari/WebKit and
// some mobile browsers can otherwise keep an AudioContext suspended silently.
const unlockAudioFromGesture = () => {
  if (audioEnabled) void audio.unlock();
};
document.addEventListener('pointerdown', unlockAudioFromGesture, { capture: true, passive: true });
document.addEventListener('keydown', unlockAudioFromGesture, { capture: true });


const SPECIALS = {
  goose: ['goose', 'specialGoose'],
  bridge: ['bridge', 'specialBridge'],
  inn: ['inn', 'specialInn'],
  well: ['well', 'specialWell'],
  maze: ['maze', 'specialMaze'],
  prison: ['prison', 'specialPrison'],
  death: ['death', 'specialDeath']
};

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const KLUDGOPOL_FRIENDS = Object.freeze(['Zilla', 'Queen', 'Wallace', 'Hans', 'Mimrock', 'Lost Soul', 'Pazifik', 'Lemming']);

const PLAYER_IDENTITIES = Object.freeze([
  Object.freeze({ symbol: '●', shapeKey: 'shapeCircle', patternKey: 'patternSolid' }),
  Object.freeze({ symbol: '▲', shapeKey: 'shapeTriangle', patternKey: 'patternStripes' }),
  Object.freeze({ symbol: '■', shapeKey: 'shapeSquare', patternKey: 'patternDots' }),
  Object.freeze({ symbol: '◆', shapeKey: 'shapeDiamond', patternKey: 'patternCrosshatch' })
]);

function playerIdentity(playerOrIndex) {
  const index = typeof playerOrIndex === 'number'
    ? playerOrIndex
    : Math.max(0, Number.parseInt(String(playerOrIndex?.id ?? 'p1').replace(/^p/, ''), 10) - 1 || 0);
  return PLAYER_IDENTITIES[index % PLAYER_IDENTITIES.length];
}

function playerPieceLabel(player, index = null) {
  const identity = playerIdentity(index ?? player);
  return t('playerPieceAria', {
    name: player?.name ?? `${t('player')} ${(index ?? 0) + 1}`,
    shape: t(identity.shapeKey),
    pattern: t(identity.patternKey)
  });
}

function fitDebugBoardToStage() {
  if (!debugBoard || !boardStageEl) return;
  const theme = currentBoardTheme();
  const rect = boardStageEl.getBoundingClientRect();
  const { width, height } = fitBoardRect(rect.width, rect.height, theme.nominalWidth / theme.nominalHeight);
  if (!(width > 0) || !(height > 0)) return;
  boardEl.style.width = `${Math.floor(width)}px`;
  boardEl.style.height = `${Math.floor(height)}px`;
}

function syncSetupNames() {
  const rows = [...playerSetupEl.querySelectorAll('.player-row')];
  let cpuIndex = 0;
  let humanIndex = 0;
  rows.forEach((row, index) => {
    const input = row.querySelector('input');
    const select = row.querySelector('select');
    if (!input || !select) return;
    if (select.value === 'cpu') {
      input.value = KLUDGOPOL_FRIENDS[cpuIndex] ?? `CPU ${cpuIndex + 1}`;
      cpuIndex += 1;
    } else {
      input.value = humanIndex === 0 ? 'Grugnetto' : `${t('player')} ${index + 1}`;
      humanIndex += 1;
    }
    input.readOnly = true;
    const preview = row.querySelector('.setup-player-symbol');
    if (preview) {
      const identity = playerIdentity(index);
      preview.setAttribute('aria-label', t('playerPieceAria', {
        name: input.value,
        shape: t(identity.shapeKey),
        pattern: t(identity.patternKey)
      }));
    }
  });
}

function normalizePlayerNames(players) {
  let cpuIndex = 0;
  let humanIndex = 0;
  for (const [index, player] of players.entries()) {
    player.symbol = playerIdentity(index).symbol;
    if (player.type === 'cpu') {
      player.name = KLUDGOPOL_FRIENDS[cpuIndex] ?? `CPU ${cpuIndex + 1}`;
      cpuIndex += 1;
    } else {
      player.name = humanIndex === 0 ? 'Grugnetto' : `${t('player')} ${index + 1}`;
      humanIndex += 1;
    }
  }
  return players;
}

function currentBoardTheme() {
  return getHistoricBoardTheme(boardThemeId);
}

function currentBoardLayout() {
  return activeLayouts[boardThemeId] ?? cloneBoardLayout(boardLayouts[boardThemeId]);
}

function setCalibrationStatus(messageKey, vars = {}) {
  if (!calibrationStatus) return;
  calibrationStatus.textContent = t(messageKey, vars);
}

function downloadLayoutJson() {
  const layout = currentBoardLayout();
  const blob = new Blob([exportBoardLayout(layout)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${layout.id}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function renderBoardThemePicker() {
  const theme = currentBoardTheme();
  boardThemeSelect.innerHTML = '';
  for (const candidate of HISTORIC_BOARD_THEMES) {
    const option = document.createElement('option');
    option.value = candidate.id;
    option.textContent = t(candidate.labelKey);
    boardThemeSelect.append(option);
  }
  boardThemeSelect.value = theme.id;
  boardThemeCaption.textContent = t(theme.captionKey);
}

function applyLanguage() {
  document.documentElement.lang = language;
  t = translator(language);
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  });
  $('#languageButton').textContent = language === 'it' ? 'EN' : 'IT';
  renderBoardThemePicker();
  if (calibrationPanel) calibrationPanel.hidden = !debugBoard;
  setCalibrationStatus(currentBoardLayout().calibrationStatus === 'local' ? 'calibrationLoaded' : 'calibrationReady');
  renderSetup();
  renderLegend();
  render();
}

function renderSetup() {
  const count = Number(playerCountEl.value);
  const previousTypes = [...playerSetupEl.querySelectorAll('.player-row')].map((row) => row.querySelector('select')?.value);

  playerSetupEl.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const row = document.createElement('div');
    row.className = 'player-row';

    const identity = playerIdentity(i);
    const preview = document.createElement('span');
    preview.className = `player-symbol setup-player-symbol token-p${i + 1}`;
    preview.innerHTML = `<span class="token-mark" aria-hidden="true">${identity.symbol}</span>`;
    preview.setAttribute('role', 'img');
    preview.setAttribute('aria-label', t('playerPieceAria', {
      name: `${t('player')} ${i + 1}`,
      shape: t(identity.shapeKey),
      pattern: t(identity.patternKey)
    }));

    const name = document.createElement('input');
    name.maxLength = 20;
    name.readOnly = true;
    name.setAttribute('aria-label', `${t('player')} ${i + 1}`);

    const type = document.createElement('select');
    type.innerHTML = `<option value="human">${t('human')}</option><option value="cpu">${t('cpu')}</option>`;
    type.value = previousTypes[i] || (i === 1 ? 'cpu' : 'human');
    type.addEventListener('change', syncSetupNames);

    row.append(preview, name, type);
    playerSetupEl.append(row);
  }
  syncSetupNames();
}

function renderLegend() {
  const legend = $('#specialLegend');
  legend.innerHTML = '';
  for (const [type, [icon, key]] of Object.entries(SPECIALS)) {
    const item = document.createElement('span');
    item.className = `legend-item legend-${type}`;
    item.innerHTML = `<span class="legend-icon asset-icon icon-${icon}" aria-hidden="true"></span><span>${escapeHtml(t(key))}</span>`;
    legend.append(item);
  }
}

function makeSeed() {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return `${values[0].toString(16)}-${values[1].toString(16)}`;
}

function setupPlayers() {
  return [...playerSetupEl.querySelectorAll('.player-row')].map((row, index) => ({
    id: `p${index + 1}`,
    name: row.querySelector('input').value.trim() || `${t('player')} ${index + 1}`,
    type: row.querySelector('select').value,
    symbol: playerIdentity(index).symbol
  }));
}

async function startNewGame() {
  await audio.unlock();
  hideTurnNotice();
  game = new Game({ board, seed: makeSeed(), players: setupPlayers() });
  logEl.innerHTML = '';
  setupDetails.open = false;
  saveGame();
  render();
  maybeCpuTurn();
}

async function replayGame() {
  await audio.unlock();
  hideTurnNotice();
  if (!game) return;
  const players = game.state.players.map(({ id, name, type, symbol }) => ({ id, name, type, symbol }));
  const seed = game.state.gameSeed;
  game = new Game({ board, seed, players });
  logEl.innerHTML = '';
  saveGame();
  render();
  maybeCpuTurn();
}

function saveGame() {
  if (!game) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(game.save()));
  continueButton.disabled = false;
  continueButton.hidden = false;
}

async function continueGame() {
  await audio.unlock();
  hideTurnNotice();
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    addLog(t('noSave'));
    return;
  }
  game = Game.restore({ board, snapshot: JSON.parse(raw) });
  normalizePlayerNames(game.state.players);
  logEl.innerHTML = '';
  setupDetails.open = false;
  render();
  maybeCpuTurn();
}

function resetData() {
  hideTurnNotice();
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(LANGUAGE_KEY);
  localStorage.removeItem(AUDIO_KEY);
  localStorage.removeItem(MOTION_KEY);
  localStorage.removeItem(BOARD_THEME_KEY);
  for (const theme of HISTORIC_BOARD_THEMES) clearCalibratedLayout(theme.id);
  game = null;
  language = 'it';
  audioEnabled = true;
  boardThemeId = 'ganzenbord-pd';
  activeLayouts = Object.fromEntries(Object.entries(boardLayouts).map(([id, layout]) => [id, cloneBoardLayout(layout)]));
  reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  audio.setEnabled(true);
  audioToggle.checked = true;
  motionToggle.checked = reducedMotion;
  document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  continueButton.disabled = true;
  continueButton.hidden = true;
  setupDetails.open = true;
  applyLanguage();
  addLog(t('resetDone'));
}

function tileFor(index) {
  return board.tiles.find((tile) => tile.index === index);
}

function createToken(player) {
  const token = document.createElement('span');
  token.className = `token token-${player.id}`;
  token.innerHTML = `<span class="token-mark" aria-hidden="true">${escapeHtml(player.symbol)}</span>`;
  const pieceLabel = playerPieceLabel(player);
  token.title = pieceLabel;
  token.setAttribute('aria-label', pieceLabel);
  return token;
}

function renderBoard() {
  boardEl.innerHTML = '';
  boardEl.classList.add('historic-board');
  boardEl.classList.toggle('debug-board', debugBoard);
  const theme = currentBoardTheme();
  const layout = currentBoardLayout();
  const positions = layout.positions;
  const startPoint = { x: layout.start[0], y: layout.start[1] };
  boardEl.dataset.theme = theme.id;
  delete boardEl.dataset.artworkMissing;
  boardEl.style.aspectRatio = `${theme.nominalWidth} / ${theme.nominalHeight}`;
  boardThemeCaption.textContent = t(theme.captionKey);
  const startZone = $('#startZone');
  startZone.style.left = `${startPoint.x}%`;
  startZone.style.top = `${startPoint.y}%`;
  const startTokens = $('#startTokens');
  startTokens.innerHTML = '';

  if (game) {
    game.state.players
      .filter((player) => player.position === 0)
      .forEach((player) => startTokens.append(createToken(player)));
  }

  const artwork = document.createElement('img');
  artwork.className = 'historic-board-image';
  artwork.src = theme.artworkUrl;
  artwork.alt = '';
  artwork.decoding = 'async';
  artwork.referrerPolicy = 'no-referrer';
  artwork.setAttribute('aria-hidden', 'true');
  artwork.addEventListener('error', () => {
    boardEl.dataset.artworkMissing = 'true';
  });

  const overlay = document.createElement('div');
  overlay.className = 'historic-board-overlay';

  for (let index = 1; index <= board.finish; index += 1) {
    const point = positions[index];
    const hotspot = document.createElement('div');
    const special = tileFor(index);
    const icon = special ? SPECIALS[special.type] : null;
    const isFinish = index === board.finish;
    const label = isFinish ? t('finish') : icon ? t(icon[1]) : '';
    const occupants = game ? game.state.players.filter((player) => player.position === index) : [];
    const occupantNames = occupants.map((player) => player.name).join(', ');

    hotspot.className = `board-hotspot${special ? ` special-${special.type}` : ''}${isFinish ? ' finish' : ''}`;
    hotspot.style.left = `${point[0]}%`;
    hotspot.style.top = `${point[1]}%`;
    hotspot.dataset.index = String(index);
    hotspot.dataset.type = special?.type ?? 'normal';
    hotspot.title = label ? `${index} · ${label}` : String(index);
    hotspot.setAttribute('aria-label', occupantNames ? `${hotspot.title} · ${occupantNames}` : hotspot.title);

    if (debugBoard) {
      const debugAnchor = document.createElement('span');
      debugAnchor.className = 'debug-anchor';
      debugAnchor.setAttribute('aria-hidden', 'true');

      const debugLabel = document.createElement('span');
      debugLabel.className = 'debug-label';
      debugLabel.textContent = String(index);
      debugLabel.setAttribute('aria-hidden', 'true');

      hotspot.append(debugAnchor, debugLabel);
      updateDebugMarkerPlacement(hotspot, point[0], point[1]);
    }

    const tokens = document.createElement('span');
    tokens.className = 'tokens';
    occupants.forEach((player) => tokens.append(createToken(player)));

    if (game?.state.status === 'playing' && game.state.currentPlayer.position === index) {
      hotspot.classList.add('current-player-tile');
    }

    hotspot.append(tokens);
    overlay.append(hotspot);
  }

  boardEl.append(artwork, overlay);
  if (debugBoard) requestAnimationFrame(fitDebugBoardToStage);
}
function renderPlayers() {
  const list = $('#playersList');
  list.innerHTML = '';
  if (!game) return;

  for (const player of game.state.players) {
    const current = player.id === game.state.currentPlayer?.id && game.state.status === 'playing';
    const row = document.createElement('div');
    row.className = `player-status${current ? ' current' : ''}`;
    if (current) row.setAttribute('aria-current', 'true');

    const symbol = document.createElement('span');
    symbol.className = `player-symbol token-${player.id}`;
    symbol.innerHTML = `<span class="token-mark" aria-hidden="true">${escapeHtml(player.symbol)}</span>`;
    symbol.setAttribute('role', 'img');
    symbol.setAttribute('aria-label', playerPieceLabel(player));

    const info = document.createElement('div');
    info.className = 'player-info';

    const nameLine = document.createElement('div');
    nameLine.className = 'player-name-line';

    const name = document.createElement('span');
    name.className = 'player-name';
    name.textContent = player.name;

    const role = document.createElement('span');
    role.className = 'player-badge role-badge';
    role.textContent = player.type === 'cpu' ? t('cpu') : t('human');

    nameLine.append(name, role);

    const metaLine = document.createElement('div');
    metaLine.className = 'player-meta-line';

    const position = document.createElement('span');
    position.className = 'player-place';
    position.textContent = player.position === 0 ? t('atStart') : t('position', { number: player.position });
    metaLine.append(position);

    const state = document.createElement('span');
    state.className = 'player-badge state-badge';

    if (player.blockedBy) {
      state.classList.add('warning');
      state.textContent = t('statusBlocked', { reason: t(`special${capitalize(player.blockedBy)}`) });
      metaLine.append(state);
    } else if (player.skipTurns) {
      state.classList.add('warning');
      state.textContent = t('statusSkipTurns', { number: player.skipTurns });
      metaLine.append(state);
    } else {
      state.classList.add(current ? 'current-badge' : 'idle');
      state.textContent = current ? t('statusCurrent') : t('statusWaiting');
      metaLine.append(state);
    }

    info.append(nameLine, metaLine);
    row.append(symbol, info);
    list.append(row);
  }
}

function renderDice() {
  const dice = $('#diceVisual');
  const values = game?.state.lastRoll?.values ?? [1, 1];
  dice.innerHTML = '';
  for (const value of values) {
    const die = document.createElement('span');
    die.className = 'die';
    die.textContent = DIE_FACES[value - 1] ?? DIE_FACES[0];
    dice.append(die);
  }
}

function syncMobileControls() {
  mobileActionBar.classList.toggle('has-game', Boolean(game));
  document.documentElement.classList.toggle('mobile-game-active', Boolean(game));
  document.documentElement.classList.toggle('game-active', Boolean(game));
  syncSetupOverlayState();
  if (!game) {
    mobileTurnLabel.textContent = t('noGame');
    mobileRollLabel.textContent = t('noRoll');
    mobileRollButton.disabled = true;
    return;
  }

  if (game.state.status === 'finished') {
    const winner = game.state.findPlayer(game.state.winnerId);
    mobileTurnLabel.textContent = t('winner', { name: winner?.name ?? '' });
  } else {
    mobileTurnLabel.textContent = t('currentTurn', { name: game.state.currentPlayer.name });
  }

  mobileRollLabel.textContent = game.state.lastRoll
    ? t('lastRoll', { dice: game.state.lastRoll.values.join(' + ') })
    : t('noRoll');
  mobileRollButton.disabled = !game
    || game.state.status !== 'playing'
    || animating
    || cpuBusy
    || game.state.currentPlayer.type === 'cpu';
}

function render() {
  renderBoard();
  renderPlayers();
  renderDice();
  continueButton.disabled = !localStorage.getItem(SAVE_KEY);
  continueButton.hidden = continueButton.disabled;
  replayButton.disabled = !game || animating || cpuBusy;

  if (!game) {
    $('#turnLabel').textContent = t('noGame');
    $('#turnBadge').textContent = '';
    $('#turnCounter').textContent = '';
    $('#lastRoll').textContent = t('noRoll');
    rollButton.disabled = true;
    syncMobileControls();
    return;
  }

  $('#turnCounter').textContent = t('turnNumber', { number: game.state.turnNumber });

  if (game.state.status === 'finished') {
    const winner = game.state.findPlayer(game.state.winnerId);
    const message = t('winner', { name: winner?.name ?? '' });
    $('#turnLabel').textContent = message;
    $('#turnBadge').textContent = message;
    rollButton.disabled = true;
  } else {
    const message = t('currentTurn', { name: game.state.currentPlayer.name });
    $('#turnLabel').textContent = message;
    $('#turnBadge').textContent = message;
    rollButton.disabled = animating || cpuBusy || game.state.currentPlayer.type === 'cpu';
  }

  $('#lastRoll').textContent = game.state.lastRoll
    ? t('lastRoll', { dice: game.state.lastRoll.values.join(' + ') })
    : t('noRoll');
  syncMobileControls();
}

function noticePlayer(playerId) {
  return game?.state.findPlayer(playerId) ?? null;
}

function showTurnNotice({ playerId = null, title = '', detail = '', tone = 'cpu', autoHideMs = 0 } = {}) {
  if (!turnNotice) return;
  if (turnNoticeTimer) {
    clearTimeout(turnNoticeTimer);
    turnNoticeTimer = null;
  }
  const player = noticePlayer(playerId);
  turnNotice.className = `turn-notice tone-${tone}`;
  turnNoticeAvatar.className = `turn-notice-avatar${player ? ` token-${player.id}` : ''}`;
  turnNoticeAvatar.textContent = player?.symbol ?? '•';
  if (player) {
    turnNoticeAvatar.setAttribute('role', 'img');
    turnNoticeAvatar.setAttribute('aria-label', playerPieceLabel(player));
  } else {
    turnNoticeAvatar.removeAttribute('role');
    turnNoticeAvatar.removeAttribute('aria-label');
  }
  turnNoticeTitle.textContent = title;
  turnNoticeDetail.textContent = detail;
  turnNotice.hidden = false;
  requestAnimationFrame(() => turnNotice.classList.add('is-visible'));
  if (autoHideMs > 0) {
    turnNoticeTimer = setTimeout(() => hideTurnNotice(), autoHideMs);
  }
}

function hideTurnNotice() {
  if (!turnNotice || turnNotice.hidden) return;
  if (turnNoticeTimer) {
    clearTimeout(turnNoticeTimer);
    turnNoticeTimer = null;
  }
  turnNotice.classList.remove('is-visible');
  const finish = () => {
    if (!turnNotice.classList.contains('is-visible')) turnNotice.hidden = true;
  };
  turnNotice.addEventListener('transitionend', finish, { once: true });
  setTimeout(finish, 220);
}

function cpuEventNotice(event) {
  const player = noticePlayer(event.playerId);
  const name = player?.name ?? t('cpu');
  switch (event.type) {
    case 'DICE_ROLLED':
      return { playerId: event.playerId, title: t('noticeRolled', { name }), detail: event.values.join(' + '), tone: 'dice' };
    case 'TOKEN_MOVED':
      return { playerId: event.playerId, title: t('noticeMoving', { name }), detail: t('noticeMoveDetail', { from: event.from, to: event.to }), tone: 'move' };
    case 'FIRST_ROLL_SPECIAL':
      return { playerId: event.playerId, title: t('noticeOpening'), detail: t('logFirstRoll', { name, to: event.to }), tone: 'special' };
    case 'BOUNCE':
      return { playerId: event.playerId, title: t('noticeBounce'), detail: t('logBounce', { name, to: event.to }), tone: 'special' };
    case 'GOOSE_TRIGGERED':
      return { playerId: event.playerId, title: t('specialGoose'), detail: t('logGoose', { name }), tone: 'special' };
    case 'BRIDGE_TRIGGERED':
      return { playerId: event.playerId, title: t('specialBridge'), detail: t('logBridge', { name }), tone: 'special' };
    case 'PLAYER_DELAYED':
      return { playerId: event.playerId, title: t('specialInn'), detail: t('logInn', { name }), tone: 'penalty' };
    case 'PLAYER_BLOCKED':
      return { playerId: event.playerId, title: event.reason === 'well' ? t('specialWell') : t('specialPrison'), detail: event.reason === 'well' ? t('logWell', { name }) : t('logPrison', { name }), tone: 'penalty' };
    case 'MAZE_TRIGGERED':
      return { playerId: event.playerId, title: t('specialMaze'), detail: t('logMaze', { name }), tone: 'penalty' };
    case 'DEATH_TRIGGERED':
      return { playerId: event.playerId, title: t('specialDeath'), detail: t('logDeath', { name }), tone: 'penalty' };
    case 'PLAYERS_SWAPPED': {
      const other = noticePlayer(event.otherPlayerId)?.name ?? '';
      return { playerId: event.playerId, title: t('noticeSwap'), detail: t('logSwap', { name, other }), tone: 'special' };
    }
    case 'TURN_SKIPPED':
    case 'BLOCKED_TURN_SKIPPED':
      return { playerId: event.playerId, title: t('noticeTurnSkipped'), detail: t('logSkip', { name }), tone: 'penalty' };
    case 'PLAYER_RELEASED':
    case 'SAFETY_RELEASE':
      return { playerId: event.playerId, title: t('noticeReleased'), detail: event.type === 'SAFETY_RELEASE' ? t('logSafety', { name }) : t('logReleased', { name }), tone: 'special' };
    case 'PLAYER_WON':
      return { playerId: event.playerId, title: t('winner', { name }), detail: t('logWin', { name }), tone: 'winner' };
    default:
      return null;
  }
}

function eventToMessage(event) {
  if (!game) return null;
  const name = game.state.findPlayer(event.playerId)?.name ?? '';
  switch (event.type) {
    case 'DICE_ROLLED': return t('logDice', { name, dice: event.values.join(' + ') });
    case 'FIRST_ROLL_SPECIAL': return t('logFirstRoll', { name, to: event.to });
    case 'BOUNCE': return t('logBounce', { name, to: event.to });
    case 'GOOSE_TRIGGERED': return t('logGoose', { name });
    case 'BRIDGE_TRIGGERED': return t('logBridge', { name });
    case 'PLAYER_DELAYED': return t('logInn', { name });
    case 'PLAYER_BLOCKED': return event.reason === 'well' ? t('logWell', { name }) : t('logPrison', { name });
    case 'MAZE_TRIGGERED': return t('logMaze', { name });
    case 'DEATH_TRIGGERED': return t('logDeath', { name });
    case 'PLAYERS_SWAPPED': {
      const other = game.state.findPlayer(event.otherPlayerId)?.name ?? '';
      return t('logSwap', { name, other });
    }
    case 'PLAYER_RELEASED': return t('logReleased', { name });
    case 'TURN_SKIPPED':
    case 'BLOCKED_TURN_SKIPPED': return t('logSkip', { name });
    case 'SAFETY_RELEASE': return t('logSafety', { name });
    case 'PLAYER_WON': return t('logWin', { name });
    default: return null;
  }
}

function addLog(message) {
  const line = document.createElement('p');
  line.textContent = message;
  logEl.prepend(line);
}

async function playEvents(events, { announceCpu = false } = {}) {
  const passiveEvents = new Set(['TURN_SKIPPED', 'BLOCKED_TURN_SKIPPED', 'PLAYER_RELEASED', 'SAFETY_RELEASE']);
  await animator.play(events, {
    onEventStart(event) {
      if (event.type === 'PLAYER_WON') {
        const notice = cpuEventNotice(event);
        if (notice) showTurnNotice(notice);
        return;
      }
      if (!announceCpu) return;
      const notice = cpuEventNotice(event);
      if (notice) showTurnNotice(notice);
    },
    async onEvent(event) {
      const message = eventToMessage(event);
      if (message) addLog(message);
      if (announceCpu && passiveEvents.has(event.type)) {
        await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 300 : 650));
      }
    }
  });
}

async function roll() {
  if (!game || game.state.status !== 'playing' || cpuBusy || animating) return;
  hideTurnNotice();
  await audio.unlock();
  animating = true;
  rollButton.disabled = true;
  replayButton.disabled = true;
  const events = game.rollCurrent();
  await playEvents(events);
  saveGame();
  animating = false;
  render();
  await maybeCpuTurn();
}

async function maybeCpuTurn() {
  if (!game || game.state.status !== 'playing' || game.state.currentPlayer.type !== 'cpu' || animating) return;
  const cpuPlayer = game.state.currentPlayer;
  cpuBusy = true;
  showTurnNotice({
    playerId: cpuPlayer.id,
    title: t('noticeCpuTurn', { name: cpuPlayer.name }),
    detail: t('noticeCpuThinking'),
    tone: 'cpu'
  });
  render();
  const events = await cpu.takeTurn(game);
  animating = true;
  await playEvents(events, { announceCpu: true });
  saveGame();
  animating = false;
  cpuBusy = false;
  render();

  if (game.state.status === 'finished') {
    const winner = game.state.findPlayer(game.state.winnerId);
    showTurnNotice({
      playerId: winner?.id,
      title: t('winner', { name: winner?.name ?? '' }),
      detail: t('noticeGameOver'),
      tone: 'winner'
    });
    return;
  }

  if (game.state.currentPlayer.type === 'cpu') {
    await maybeCpuTurn();
    return;
  }

  const next = game.state.currentPlayer;
  showTurnNotice({
    playerId: next.id,
    title: t('noticeYourTurn', { name: next.name }),
    detail: t('noticeYourTurnHint'),
    tone: 'your-turn',
    autoHideMs: 1800
  });
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function syncSetupOverlayState() {
  const narrow = globalThis.matchMedia?.('(max-width: 610px)').matches ?? false;
  document.documentElement.classList.toggle('setup-overlay-open', Boolean(narrow && setupDetails.open && !game));
}

setupDetails.addEventListener('toggle', syncSetupOverlayState);
globalThis.addEventListener?.('resize', syncSetupOverlayState);

playerCountEl.addEventListener('change', renderSetup);
$('#startButton').addEventListener('click', startNewGame);
continueButton.addEventListener('click', continueGame);
rollButton.addEventListener('click', roll);
mobileRollButton.addEventListener('click', roll);
replayButton.addEventListener('click', replayGame);
$('#resetButton').addEventListener('click', resetData);
$('#rulesButton').addEventListener('click', () => rulesDialog.showModal());
$('#languageButton').addEventListener('click', () => {
  language = language === 'it' ? 'en' : 'it';
  localStorage.setItem(LANGUAGE_KEY, language);
  applyLanguage();
});
audioToggle.addEventListener('change', async () => {
  audioEnabled = audioToggle.checked;
  audio.setEnabled(audioEnabled);
  localStorage.setItem(AUDIO_KEY, String(audioEnabled));
  if (audioEnabled && await audio.unlock()) audio.enabledCue();
});
boardThemeSelect.addEventListener('change', () => {
  boardThemeId = boardThemeSelect.value;
  localStorage.setItem(BOARD_THEME_KEY, boardThemeId);
  activeLayouts[boardThemeId] = loadCalibratedLayout(boardThemeId, boardLayouts[boardThemeId]);
  setCalibrationStatus(activeLayouts[boardThemeId].calibrationStatus === 'local' ? 'calibrationLoaded' : 'calibrationReady');
  calibrator.setDirty(false);
  render();
});
const calibrator = new BoardCalibrator({
  boardEl,
  enabled: () => debugBoard,
  getLayout: () => currentBoardLayout(),
  onChange: (_layout, index) => setCalibrationStatus('calibrationMoved', { index }),
  onDirtyChange: (dirty) => calibrationSaveButton?.classList.toggle('attention', dirty)
});

calibrationSaveButton?.addEventListener('click', () => {
  const layout = currentBoardLayout();
  if (saveCalibratedLayout(boardThemeId, layout)) {
    layout.calibrationStatus = 'local';
    calibrator.setDirty(false);
    setCalibrationStatus('calibrationSaved');
  }
});
calibrationResetButton?.addEventListener('click', () => {
  clearCalibratedLayout(boardThemeId);
  activeLayouts[boardThemeId] = cloneBoardLayout(boardLayouts[boardThemeId]);
  calibrator.setDirty(false);
  setCalibrationStatus('calibrationReset');
  render();
});
calibrationExportButton?.addEventListener('click', () => {
  downloadLayoutJson();
  setCalibrationStatus('calibrationExported');
});

motionToggle.addEventListener('change', () => {
  reducedMotion = motionToggle.checked;
  localStorage.setItem(MOTION_KEY, String(reducedMotion));
  document.documentElement.classList.toggle('reduced-motion', reducedMotion);
});
document.documentElement.classList.toggle('reduced-motion', reducedMotion);

if (debugBoard && boardStageEl && 'ResizeObserver' in globalThis) {
  const debugBoardResizeObserver = new ResizeObserver(() => fitDebugBoardToStage());
  debugBoardResizeObserver.observe(boardStageEl);
}

renderSetup();
applyLanguage();
