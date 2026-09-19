import { GameController, serializeSave, deserializeSave } from '../core/index.js';
import { UI_TEXT } from './i18n.js';
import { loadHowToPlay } from './how-to-play.js';
import { loadAiProfiles } from './ai-profiles.js';

const SAVE_KEY = 'grugnettos-kludgopolb.save.v1';
const AUTOSAVE_KEY = 'grugnettos-kludgopolb.autosave.v1';
const LANGUAGE_KEY = 'gk.lang';
const BOARD_ZOOM_KEY = 'grugnettos-kludgopolb.boardZoom';
const MIN_BOARD_ZOOM = 1;
const MAX_BOARD_ZOOM = 2.5;
const BOARD_ZOOM_STEP = 0.25;
// Space numbers only show from this zoom up (the plaques are too small below it); the editor always shows them.
const MIN_NUMBERS_ZOOM = 1.25;
const ANIMATION_SPEED_KEY = 'grugnettos-kludgopolb.animationSpeed';
const FOLLOW_TURN_KEY = 'grugnettos-kludgopolb.followTurn';
const NUMBER_POSITIONS_KEY = 'grugnettos-kludgopolb.numberPositions.v6';
const LOCAL_STORAGE_KEYS = [SAVE_KEY, AUTOSAVE_KEY, LANGUAGE_KEY, BOARD_ZOOM_KEY, ANIMATION_SPEED_KEY, FOLLOW_TURN_KEY, NUMBER_POSITIONS_KEY];
const MANUAL_FOLLOW_PAUSE_MS = 6000;
const DOUBLE_TAP_MS = 320;
const CPU_NAMES = ['Zilla','Queen','Wallace','Hans','Mimrock','Lost Soul','Pazifik','Lemming'];
const TOKEN_COLORS = ['#7c5ce0','#e95e9d','#d66a45','#526a78','#8a6f45','#5b5875','#3a9b63','#d79b2e'];
const HUMAN_TOKEN_ASSET = 'assets/grugnetto/grugnetto_token.svg';

const el = id => document.getElementById(id);
const boardViewport = el('boardViewport');
const boardEl = el('board');
const boardBackground = el('boardBackground');
const worldLabelsLayer = el('worldLabels');
const routeDirectionsLayer = el('routeDirections');
const centerPanel = boardEl?.querySelector('.center-panel');
const playersEl = el('players');
const decisionEl = el('decision');
const actionsTitle = el('actionsTitle');
const rollTrackerTitle = el('rollTrackerTitle');
const rollTrackerList = el('rollTrackerList');
const actionPanel = document.querySelector('.action-panel');
const turnReviewPanel = el('turnReviewPanel');
const turnReviewTitle = el('turnReviewTitle');
const turnReviewBody = el('turnReviewBody');
const mobilePlayers = el('mobilePlayers');
const mobileActions = el('mobileActions');
const langSelect = el('lang');
const statusLine = el('statusLine');
const turnPill = el('turnPill');
const currentName = el('currentName');
const currentCash = el('currentCash');
const centerHint = el('centerHint');
const eventStrip = el('eventStrip');
const setupDialog = el('setupDialog');
const recoveryDialog = el('recoveryDialog');
const recoveryContent = el('recoveryContent');
const helpDialog = el('helpDialog');
const helpContent = el('helpContent');
const friendDialog = el('friendDialog');
const friendContent = el('friendContent');
const manageDialog = el('manageDialog');
const cardDialog = el('cardDialog');
const tradeDialog = el('tradeDialog');
const tradeResultDialog = el('tradeResultDialog');
const tradeResultContent = el('tradeResultContent');
const liveRegion = el('liveRegion');
const zoomInBtn = el('zoomInBtn');
const zoomOutBtn = el('zoomOutBtn');
const zoomResetBtn = el('zoomResetBtn');
const followBtn = el('followBtn');
const followLabel = el('followLabel');
const speedSelect = el('speedSelect');
const numberEditBtn = el('numberEditBtn');
const numberEditLabel = el('numberEditLabel');
const numberExportBtn = el('numberExportBtn');
const numberResetBtn = el('numberResetBtn');

let registry, boardEntry, board, locale, pawnConfig;
let boardLayout = null;
let howToPlay = null;
let aiProfiles = null;
// Storage can throw (blocked site data, quota); the app must still start and play without it.
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* storage unavailable: nothing to remove */ } },
};
let language = storage.get(LANGUAGE_KEY) || 'it';
let controller = null;
let packet = null;
let lastEvents = [];
let lastRoll = null;
let latestCard = null;
let toastTimer = null;
let lastMovedPlayerId = null;
let activeMoveAnimationPlayerId = null;
let boardZoom = Number(storage.get(BOARD_ZOOM_KEY) || 1);
let animationSpeed = storage.get(ANIMATION_SPEED_KEY) || 'normal';
let followEnabled = storage.get(FOLLOW_TURN_KEY) !== '0';
let followSuspendedUntil = 0;
let followResumeTimer = null;
let suppressBoardClickUntil = 0;
let lastSpaceTap = { index: -1, time: 0, timer: null };
let notificationGeneration = 0;
let eventStripQueue = [];
let eventStripWorkerRunning = false;
let boardDrag = null;
let recoveryCandidate = null;
let cpuPopupQueue = [];
let cpuPopupWorkerRunning = false;
let turnPopupTimer = null;
let latestRollsByPlayer = new Map();
let suppressAutosave = false;
let inspectedPlayerId = null;
// The number editor is a maintainer tool: it exists only when the page is opened with ?numberEdit.
const NUMBER_EDIT_ENABLED = new URLSearchParams(location.search).has('numberEdit');
let boardNumberEditMode = false;
// Real plaque outlines (tile-outlines.json) drive tinting, the spotlight and click hit-testing.
let tileShapes = null;
let underShapeLayer = null;
let overShapeLayer = null;
let focusedTileIndex = null;
const tintedPlayerIds = new Set();
const SVG_NS = 'http://www.w3.org/2000/svg';
let boardNumberPositions = (() => { try { return JSON.parse(storage.get(NUMBER_POSITIONS_KEY) || '{}') || {}; } catch { return {}; } })();
let boardNumberDrag = null;

function t(key) { return UI_TEXT[language]?.[key] ?? UI_TEXT.it[key] ?? key; }
function tf(key, values={}) { return Object.entries(values).reduce((text,[name,value])=>text.replaceAll(`{${name}}`, String(value)), t(key)); }
function spaceName(spaceOrId) {
  const id = typeof spaceOrId === 'string' ? spaceOrId : spaceOrId?.id;
  return locale?.spaces?.[id] ?? id ?? '—';
}
function worldName(id) { return locale?.worlds?.[id] ?? id; }
function worldData(id) { return board?.worlds?.find(w => w.id === id) ?? null; }
function worldAccent(id) { return worldData(id)?.accent ?? '#8b948d'; }
function worldIconAsset(id) {
  const map = {
    world1: 'assets/grugnetto/world-icons/home-meadow.png',
    world2: 'assets/grugnetto/world-icons/squirrel-woods.png',
    world3: 'assets/grugnetto/world-icons/golden-dunes.png',
    world4: 'assets/grugnetto/world-icons/stone-mine.png',
  };
  return map[id] ?? null;
}
function worldIconHtml(worldId, className = 'world-inline-icon') {
  const asset = worldIconAsset(worldId);
  if (asset) return `<img class="${className}" src="${asset}" alt="">`;
  return `<span class="${className} world-inline-fallback" aria-hidden="true">${escapeHtml(worldEmoji(worldId))}</span>`;
}
function worldEmoji(id) { return worldData(id)?.emoji ?? '●'; }
function worldBadge(worldId, compact = false) {
  if (!worldId) return '';
  return `<span class="world-badge${compact ? ' compact' : ''}" style="--world:${worldAccent(worldId)}">${worldIconHtml(worldId, 'world-badge-image')}${escapeHtml(worldName(worldId))}</span>`;
}
function spaceTypeBadge(space) {
  const icons = { start: '🏁', event: '❓', tax: '🪙', hub: '🏕️', service: '🧰', neutral: '🍀', detention: '⛺', moveToDetention: '↩' };
  const icon = icons[space.type];
  if (!icon) return '';
  const label = locale?.types?.[space.type] ?? space.type;
  return `<span class="space-type-badge ${space.type}" title="${escapeHtml(label)}" aria-hidden="true">${icon}</span>`;
}

function worldCellSymbol(worldId) {
  if (!worldId) return '';
  return `<span class="space-world-symbol" style="--world:${worldAccent(worldId)}" aria-hidden="true">${worldIconHtml(worldId, 'space-world-image')}</span>`;
}
function placeNameWithWorld(space, compact = false) {
  if (!space) return '—';
  return `<span class="place-name-with-world">${escapeHtml(spaceName(space))}${space.world ? ` ${worldBadge(space.world, compact)}` : ''}</span>`;
}
function placeLineItem(space, compact = false) {
  return `<span class="place-line-item">${placeNameWithWorld(space, compact)}</span>`;
}


function worldProgressData(player) {
  if (!board || !player) return [];
  return board.worlds.map(world => {
    const siteIndexes = board.spaces.map((space,index)=>({space,index})).filter(item => item.space.type === 'site' && item.space.world === world.id).map(item => item.index);
    const owned = siteIndexes.filter(index => packet?.state?.spaces?.[index]?.owner === player.id).length;
    return { world, owned, total: siteIndexes.length };
  });
}
function worldProgressMarkup(player, compact = false) {
  const entries = worldProgressData(player).filter(item => item.owned > 0);
  if (!entries.length) return '';
  const shown = compact ? [...entries].sort((a,b) => (b.owned/b.total)-(a.owned/a.total)).slice(0,2) : entries;
  return `<div class="world-progress${compact ? ' compact' : ''}">${shown.map(item => `<span class="world-progress-chip${item.owned === item.total ? ' complete' : item.owned === item.total - 1 ? ' near' : ''}" style="--world:${item.world.accent}" title="${escapeHtml(worldName(item.world.id))}: ${item.owned}/${item.total}">${worldIconHtml(item.world.id, 'world-progress-image')}<strong>${item.owned}/${item.total}</strong></span>`).join('')}</div>`;
}
function gridPosition(index) {
  if (index <= 8) return { row: 9, col: index + 1 };
  if (index <= 16) return { row: 17 - index, col: 9 };
  if (index <= 24) return { row: 1, col: 25 - index };
  return { row: index - 23, col: 1 };
}
function validateBoardLayout(layout) {
  if (!layout || layout.schemaVersion !== 1 || !Array.isArray(layout.viewBox) || layout.viewBox.length !== 4) return false;
  if (!Array.isArray(layout.spaces) || layout.spaces.length !== board?.spaces?.length) return false;
  const [vx,vy,vw,vh] = layout.viewBox.map(Number);
  if (![vx,vy,vw,vh].every(Number.isFinite) || vw <= 0 || vh <= 0) return false;
  const validSpaces = layout.spaces.every((box,index) => box.index === index && box.id === board.spaces[index].id &&
    [box.x,box.y,box.w,box.h].every(Number.isFinite) && box.w > 0 && box.h > 0 &&
    box.x >= vx && box.y >= vy && box.x + box.w <= vx + vw && box.y + box.h <= vy + vh);
  const labels = layout.worldLabels || [];
  const validLabels = Array.isArray(labels) && labels.every(box => board?.worlds?.some(world => world.id === box.worldId) &&
    [box.x,box.y,box.w,box.h].every(Number.isFinite) && box.w > 0 && box.h > 0 &&
    box.x >= vx && box.y >= vy && box.x + box.w <= vx + vw && box.y + box.h <= vy + vh);
  return validSpaces && validLabels;
}

async function loadBoardLayout() {
  if (!boardEntry?.layout) return null;
  try {
    const response = await fetch(boardEntry.layout);
    if (!response.ok) throw new Error(`Board layout HTTP ${response.status}`);
    const layout = await response.json();
    if (!validateBoardLayout(layout)) throw new Error('Invalid board layout mapping');
    return layout;
  } catch (error) {
    console.warn('Falling back to legacy grid board layout', error);
    return null;
  }
}

function layoutBox(index) { return boardLayout?.spaces?.[Number(index)] ?? null; }

function layoutPoint(point) {
  if (!boardLayout || !point) return null;
  const boardRect = boardEl.getBoundingClientRect();
  const [, , viewWidth, viewHeight] = boardLayout.viewBox;
  return { x: (point.x / viewWidth) * boardRect.width, y: (point.y / viewHeight) * boardRect.height };
}

function connectorWaypoints(fromIndex, toIndex) {
  if (!boardLayout?.connectors?.length) return [];
  const direct = boardLayout.connectors.find(item => Number(item.from) === Number(fromIndex) && Number(item.to) === Number(toIndex));
  if (direct) return (direct.waypoints || []).map(layoutPoint).filter(Boolean);
  const reverse = boardLayout.connectors.find(item => Number(item.from) === Number(toIndex) && Number(item.to) === Number(fromIndex));
  if (reverse) return [...(reverse.waypoints || [])].reverse().map(layoutPoint).filter(Boolean);
  return [];
}

function renderWorldLabels() {
  if (!worldLabelsLayer) return;
  worldLabelsLayer.replaceChildren();
  if (!boardLayout?.worldLabels?.length) return;
  const [, , vw, vh] = boardLayout.viewBox;
  for (const label of boardLayout.worldLabels) {
    const node = document.createElement('div');
    node.className = 'board-world-label';
    node.dataset.worldId = label.worldId;
    node.style.left = `${(label.x / vw) * 100}%`;
    node.style.top = `${(label.y / vh) * 100}%`;
    node.style.width = `${(label.w / vw) * 100}%`;
    node.style.height = `${(label.h / vh) * 100}%`;
    node.style.textAlign = label.align || 'center';
    node.title = worldName(label.worldId);
    const labelMode = boardLayout?.worldLabelPresentation || (boardLayout?.presentation === 'illustrated' ? 'runtime-text' : 'default');
    if (labelMode === 'background-art') {
      node.hidden = true;
    } else if (labelMode === 'runtime-text') {
      node.classList.add('runtime-text-label');
      const text = document.createElement('span');
      text.className = 'world-label-text';
      text.textContent = worldName(label.worldId);
      node.append(text);
    } else if (boardLayout?.presentation === 'illustrated') {
      node.classList.add('banner-overlay-label');
      const scrub = document.createElement('span');
      scrub.className = 'world-label-scrub';
      scrub.setAttribute('aria-hidden','true');
      const text = document.createElement('span');
      text.className = 'world-label-text';
      text.textContent = worldName(label.worldId);
      node.append(scrub, text);
    } else {
      node.textContent = worldName(label.worldId);
    }
    worldLabelsLayer.append(node);
  }
  requestAnimationFrame(fitWorldLabels);
}

const ROUTE_ARROW_SPECS = [];

function layoutSpaceCenterRaw(index) {
  const box = layoutBox(index);
  if (!box) return null;
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

function rawConnectorPoints(fromIndex, toIndex) {
  const from = layoutSpaceCenterRaw(fromIndex);
  const to = layoutSpaceCenterRaw(toIndex);
  if (!from || !to) return [];
  const direct = boardLayout?.connectors?.find(item => Number(item.from) === Number(fromIndex) && Number(item.to) === Number(toIndex));
  if (direct) return [from, ...(direct.waypoints || []), to];
  const reverse = boardLayout?.connectors?.find(item => Number(item.from) === Number(toIndex) && Number(item.to) === Number(fromIndex));
  if (reverse) return [from, ...[...(reverse.waypoints || [])].reverse(), to];
  return [from, to];
}

function routePoint(points, fraction = .5) {
  if (points.length < 2) return null;
  const segments = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i], b = points[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, length });
    total += length;
  }
  let target = total * fraction;
  for (const segment of segments) {
    if (target <= segment.length) {
      const ratio = segment.length ? target / segment.length : 0;
      return {
        x: segment.a.x + (segment.b.x - segment.a.x) * ratio,
        y: segment.a.y + (segment.b.y - segment.a.y) * ratio,
        angle: Math.atan2(segment.b.y - segment.a.y, segment.b.x - segment.a.x) * 180 / Math.PI,
      };
    }
    target -= segment.length;
  }
  const last = segments.at(-1);
  return {
    x: last.b.x,
    y: last.b.y,
    angle: Math.atan2(last.b.y - last.a.y, last.b.x - last.a.x) * 180 / Math.PI,
  };
}

function renderRouteDirections() {
  if (!routeDirectionsLayer) return;
  routeDirectionsLayer.replaceChildren();
  if (!boardLayout?.viewBox || boardLayout.presentation !== 'illustrated') return;
  const [, , vw, vh] = boardLayout.viewBox;

  for (const spec of ROUTE_ARROW_SPECS) {
    const point = routePoint(rawConnectorPoints(spec.from, spec.to), spec.fraction);
    if (!point) continue;
    const arrow = document.createElement('span');
    arrow.className = `route-arrow route-arrow-${spec.kind}`;
    arrow.style.left = `${(point.x / vw) * 100}%`;
    arrow.style.top = `${(point.y / vh) * 100}%`;
    arrow.style.setProperty('--route-angle', `${point.angle}deg`);
    arrow.innerHTML = '<span aria-hidden="true">➜</span>';
    routeDirectionsLayer.append(arrow);
  }
}

function applyBoardLayoutGeometry() {
  const mapped = !!boardLayout;
  boardEl.classList.toggle('layout-map', mapped);
  boardEl.classList.toggle('layout-illustrated', mapped && boardLayout?.presentation === 'illustrated');
  boardEl.classList.toggle('layout-grid', !mapped);
  if (boardBackground) {
    if (mapped && boardLayout.background) { boardBackground.src = boardLayout.background; boardBackground.hidden = false; }
    else { boardBackground.removeAttribute('src'); boardBackground.hidden = true; }
  }
  if (!centerPanel) return;
  if (!mapped) {
    for (const property of ['left','top','width','height']) centerPanel.style.removeProperty(property);
    return;
  }
  const [, , vw, vh] = boardLayout.viewBox;
  const c = boardLayout.center;
  if (c) {
    centerPanel.style.left = `${(c.x / vw) * 100}%`;
    centerPanel.style.top = `${(c.y / vh) * 100}%`;
    centerPanel.style.width = `${(c.w / vw) * 100}%`;
    centerPanel.style.height = `${(c.h / vh) * 100}%`;
  }
}
function playerColor(player) {
  const index = controller?.game?.players?.findIndex(p => p.id === player.id) ?? player.id ?? 0;
  return TOKEN_COLORS[(index + 1) % TOKEN_COLORS.length];
}
function money(amount) {
  return `<span class="money"><img class="inline-coin" src="${board.currencyAsset}" alt=""> ${Math.trunc(amount ?? 0)}</span>`;
}

function dieFaceHtml(value) {
  const pips = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 6) return `<span class="die-placeholder">–</span>`;
  const active = new Set(pips[n]);
  return `<span class="die-face" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<span class="pip${active.has(i) ? ' on' : ''}"></span>`).join('')}</span>`;
}
function dieHtml(value) {
  const n = Number(value);
  const label = Number.isInteger(n) && n >= 1 && n <= 6 ? `${t('dice')} ${n}` : t('dice');
  return `<span class="die" aria-label="${escapeHtml(label)}">${dieFaceHtml(value)}</span>`;
}

function rollResultText(roll) {
  if (!roll) return t('noRollYet');
  return `${roll.a} + ${roll.b} = ${roll.total}`;
}

function rollStatusBadges(player, roll) {
  if (!roll) return '';
  const badges = [];
  const isLatest = lastRoll?.playerId === player.id && lastRoll?.id === roll.id;
  const extraRoll = packet?.pendingDecision?.type === 'ROLL_DICE'
    && packet.pendingDecision.extraRoll
    && packet.pendingDecision.playerId === player.id;
  if (isLatest) badges.push(`<span class="roll-status-badge latest">${escapeHtml(t('latestRollBadge'))}</span>`);
  if (roll.doubles) badges.push(`<span class="roll-status-badge double">${escapeHtml(t('doubleBadge'))}</span>`);
  if (extraRoll) badges.push(`<span class="roll-status-badge extra">${escapeHtml(t('extraRollBadge'))}</span>`);
  return badges.join('');
}

function rollTrackerMarkup() {
  const players = packet?.state?.players ?? [];
  if (!players.length) return `<div class="roll-tracker-empty">${escapeHtml(t('noRollYet'))}</div>`;
  return players.map(player => {
    const roll = latestRollsByPlayer.get(player.id) || null;
    const isLatest = Boolean(roll && lastRoll?.playerId === player.id && lastRoll?.id === roll.id);
    const extraRoll = Boolean(packet?.pendingDecision?.type === 'ROLL_DICE' && packet.pendingDecision.extraRoll && packet.pendingDecision.playerId === player.id);
    const classes = [roll ? 'has-roll' : 'no-roll', isLatest ? 'latest-roll' : '', roll?.doubles ? 'is-double' : '', extraRoll ? 'extra-roll' : ''].filter(Boolean).join(' ');
    return `<div class="roll-tracker-row ${classes}" data-player-id="${player.id}" style="--token:${playerColor(player)}">
      <div class="roll-tracker-player">${tokenHtml(player)}<div class="roll-tracker-copy"><div class="roll-tracker-name"><strong>${escapeHtml(player.name)}</strong>${rollStatusBadges(player, roll)}</div><span>${escapeHtml(rollResultText(roll))}</span></div></div>
      <div class="roll-tracker-dice">${roll ? dieHtml(roll.a) + dieHtml(roll.b) : ''}</div>
    </div>`;
  }).join('');
}

function renderRollTracker() {
  if (!rollTrackerList) return;
  if (rollTrackerTitle) rollTrackerTitle.textContent = t('rollTrackerTitle');
  rollTrackerList.innerHTML = rollTrackerMarkup();
}

function assetFor(space, index = null) {
  const mappedAsset = index != null ? layoutBox(index)?.iconAsset : null;
  if (mappedAsset) return mappedAsset;
  if (space.asset) return space.asset;
  if (space.type === 'start') return board.humanTokenAsset;
  if (space.type === 'tax') return board.currencyAsset;
  return null;
}
function boardIconMask(name, extraClass = '') {
  // url() inside a CSS custom property resolves relative to the stylesheet that
  // consumes it (app.css, in src/ui/), not relative to this page — hence "../../".
  return `<span class="emoji-icon board-icon-mask${extraClass ? ` ${extraClass}` : ''}" style="--icon-url:url('../../assets/third_party/kenney/board-icons/${name}.png')" aria-hidden="true"></span>`;
}
function inlineBoardIcon(name) {
  return `<span class="board-icon-mask inline-icon" style="--icon-url:url('../../assets/third_party/kenney/board-icons/${name}.png')" aria-hidden="true"></span>`;
}
function iconFor(space, index = null) {
  // These three types are meant to read as one consistent symbol board-wide, so their
  // Kenney icon wins over any decorative per-tile iconAsset mapped in the board layout.
  if (space.type === 'detention') return boardIconMask('campfire');
  if (space.type === 'moveToDetention') return boardIconMask('arrow_counterclockwise');
  if (space.type === 'neutral') return boardIconMask('hourglass');
  if (space.type === 'event') return boardIconMask('hexagon_question', `event-icon ${space.deck === 'avventure' ? 'adventure' : 'setback'}`);
  if (space.id === 'travel-toll') return boardIconMask('hand_token');
  if (space.id === 'repairs') return boardIconMask('resource_planks');
  const asset = assetFor(space, index);
  if (asset) return `<img class="space-icon" src="${asset}" alt="">`;
  if (space.type === 'hub') return '<span class="emoji-icon">🌀</span>';
  return '<span class="emoji-icon">•</span>';
}
function toast(message) {
  let node = document.querySelector('.toast');
  if (!node) { node = document.createElement('div'); node.className = 'toast'; document.body.append(node); }
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 1600);
}
function announce(message) {
  if (!message || !liveRegion) return;
  liveRegion.textContent = '';
  requestAnimationFrame(() => { liveRegion.textContent = message; });
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function numberPositionKey(index) { return String(index); }
function readNumberPosition(index) {
  // Browser-local drag edits win; otherwise use the numberPositions shipped in layout.json (keyed by 1-based space number, same as the export file).
  const entry = boardNumberPositions?.[numberPositionKey(index)] ?? boardLayout?.numberPositions?.[index + 1];
  if (!entry) return null;
  const left = Number(entry.left);
  const top = Number(entry.top);
  if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
  return { left, top };
}
function writeNumberPosition(index, left, top) {
  const clamped = { left: clamp(left, 0, 99.2), top: clamp(top, 0, 99.2) };
  boardNumberPositions[numberPositionKey(index)] = clamped;
  storage.set(NUMBER_POSITIONS_KEY, JSON.stringify(boardNumberPositions));
}
function clearNumberPositions() {
  boardNumberPositions = {};
  storage.remove(NUMBER_POSITIONS_KEY);
}
function updateNumberEditUi() {
  if (!numberEditBtn) return;
  const available = !!boardLayout && NUMBER_EDIT_ENABLED;
  numberEditBtn.hidden = !available;
  numberEditBtn.classList.toggle('active', boardNumberEditMode && available);
  numberEditBtn.setAttribute('aria-pressed', String(boardNumberEditMode && available));
  if (numberEditLabel) numberEditLabel.textContent = boardNumberEditMode ? t('numberEditOn') : t('numberEditOff');
  numberEditBtn.title = boardNumberEditMode ? t('numberEditDisable') : t('numberEditEnable');
  numberEditBtn.setAttribute('aria-label', numberEditBtn.title);
  if (numberExportBtn) {
    numberExportBtn.hidden = !(available && boardNumberEditMode);
    numberExportBtn.textContent = t('exportNumbers');
    numberExportBtn.title = t('exportNumbers');
  }
  if (numberResetBtn) {
    numberResetBtn.hidden = !(available && boardNumberEditMode);
    numberResetBtn.textContent = t('resetNumbers');
    numberResetBtn.title = t('resetNumbers');
  }
  boardEl.classList.toggle('number-edit-mode', boardNumberEditMode && available);
}
function setNumberEditMode(enabled) {
  boardNumberEditMode = !!enabled && !!boardLayout && NUMBER_EDIT_ENABLED;
  updateNumberEditUi();
  renderBoardSpaceNumbers();
  if (boardNumberEditMode) toast(t('numberEditHint'));
}
function exportBoardNumberPositions() {
  if (!boardLayout) return;
  const exported = {};
  boardEl.querySelectorAll('.space-number-overlay').forEach(node => {
    const index = Number(node.dataset.index);
    const left = Number(node.style.left.replace('%',''));
    const top = Number(node.style.top.replace('%',''));
    if (!Number.isFinite(index) || !Number.isFinite(left) || !Number.isFinite(top)) return;
    exported[index + 1] = { left: Number(left.toFixed(2)), top: Number(top.toFixed(2)) };
  });
  const payload = {
    boardId: board?.id || null,
    layout: boardEntry?.layout || boardEntry?.id || null,
    generatedAt: new Date().toISOString(),
    positions: exported,
  };
  const json = JSON.stringify(payload, null, 2);
  navigator.clipboard?.writeText(json).catch(() => {});
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'grugnetto-board-number-positions.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
  toast(t('numberExported'));
}
function resetBoardNumberPositions() {
  clearNumberPositions();
  renderBoardSpaceNumbers();
  toast(t('numberResetDone'));
}
function defaultNumberPositionForSpace(node, boardRect) {
  const rect = node.getBoundingClientRect();
  const left = (((rect.left - boardRect.left) + rect.width * 0.10) / boardRect.width) * 100;
  const top = (((rect.top - boardRect.top) + rect.height * 0.02) / boardRect.height) * 100;
  return { left, top };
}
function attachNumberDrag(badge, index) {
  if (!boardNumberEditMode) return;
  badge.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    suspendAutoFollow();
    const boardRect = boardEl.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    boardNumberDrag = {
      pointerId: event.pointerId,
      badge,
      index,
      boardRect,
      offsetX: event.clientX - badgeRect.left,
      offsetY: event.clientY - badgeRect.top,
    };
    badge.classList.add('dragging');
    badge.setPointerCapture?.(event.pointerId);
  });
}
function moveBoardNumber(event) {
  if (!boardNumberDrag || boardNumberDrag.pointerId !== event.pointerId) return;
  const { badge, boardRect, offsetX, offsetY, index } = boardNumberDrag;
  const badgeWidth = badge.offsetWidth || 20;
  const badgeHeight = badge.offsetHeight || 20;
  const leftPx = clamp(event.clientX - boardRect.left - offsetX, 0, Math.max(0, boardRect.width - badgeWidth));
  const topPx = clamp(event.clientY - boardRect.top - offsetY, 0, Math.max(0, boardRect.height - badgeHeight));
  const left = (leftPx / boardRect.width) * 100;
  const top = (topPx / boardRect.height) * 100;
  badge.style.left = `${left}%`;
  badge.style.top = `${top}%`;
  writeNumberPosition(index, left, top);
}
function finishBoardNumberDrag(event) {
  if (!boardNumberDrag || (event && boardNumberDrag.pointerId !== event.pointerId)) return;
  boardNumberDrag.badge.classList.remove('dragging');
  boardNumberDrag = null;
}

function speedMultiplier() { return animationSpeed === 'fast' ? 0.55 : 1; }
function motionMs(ms) { return Math.max(35, Math.round(ms * speedMultiplier())); }
function cpuPopupHoldMs() { return animationSpeed === 'fast' ? 1450 : 2700; }

function updateSpeedUi() {
  if (!speedSelect) return;
  speedSelect.value = animationSpeed;
  speedSelect.title = t('animationSpeed');
  speedSelect.setAttribute('aria-label', t('animationSpeed'));
  const normal = speedSelect.querySelector('option[value="normal"]');
  const fast = speedSelect.querySelector('option[value="fast"]');
  if (normal) normal.textContent = t('speedNormal');
  if (fast) fast.textContent = t('speedFast');
  document.documentElement.dataset.speed = animationSpeed;
}

function canAutoFollow() {
  return followEnabled && Date.now() >= followSuspendedUntil && !boardDrag;
}

function updateFollowButton() {
  if (!followBtn) return;
  const suspended = followEnabled && Date.now() < followSuspendedUntil;
  followBtn.classList.toggle('active', followEnabled && !suspended);
  followBtn.classList.toggle('suspended', suspended);
  followBtn.setAttribute('aria-pressed', String(followEnabled && !suspended));
  const label = suspended ? t('followPaused') : t('followTurn');
  if (followLabel) followLabel.textContent = suspended ? t('followResume') : t('followShort');
  followBtn.title = label;
  followBtn.setAttribute('aria-label', label);
}

function suspendAutoFollow(ms = MANUAL_FOLLOW_PAUSE_MS) {
  if (!followEnabled) return;
  followSuspendedUntil = Date.now() + ms;
  clearTimeout(followResumeTimer);
  updateFollowButton();
  followResumeTimer = setTimeout(() => {
    followSuspendedUntil = 0;
    updateFollowButton();
  }, ms + 30);
}

function centerBoardOnSpace(index, { behavior = 'smooth', force = false } = {}) {
  if (!boardViewport || !boardEl || !Number.isInteger(Number(index))) return;
  if (!force && !canAutoFollow()) return;
  const spaceNode = boardEl.querySelector(`.space[data-index="${Number(index)}"]`);
  if (!spaceNode) return;
  const viewportRect = boardViewport.getBoundingClientRect();
  const spaceRect = spaceNode.getBoundingClientRect();
  const deltaX = (spaceRect.left + spaceRect.width / 2) - (viewportRect.left + viewportRect.width / 2);
  const deltaY = (spaceRect.top + spaceRect.height / 2) - (viewportRect.top + viewportRect.height / 2);
  const left = clamp(boardViewport.scrollLeft + deltaX, 0, Math.max(0, boardViewport.scrollWidth - boardViewport.clientWidth));
  const top = clamp(boardViewport.scrollTop + deltaY, 0, Math.max(0, boardViewport.scrollHeight - boardViewport.clientHeight));
  boardViewport.scrollTo({ left, top, behavior });
}

function followCurrentTurn(force = false) {
  const player = packet?.state?.players?.find(item => item.id === packet?.state?.currentPlayerId);
  if (!player) return;
  centerBoardOnSpace(player.position, { force, behavior: 'smooth' });
}

function applyBoardZoom() {
  if (!boardEl || !boardViewport) return;
  const viewportWidth = Math.max(180, boardViewport.clientWidth - 10);
  const viewportHeight = Math.max(180, boardViewport.clientHeight - 10);
  boardZoom = clamp(Number.isFinite(boardZoom) ? boardZoom : 1, MIN_BOARD_ZOOM, MAX_BOARD_ZOOM);
  let baseWidth;
  let baseHeight;
  if (boardLayout) {
    const [, , viewWidth, viewHeight] = boardLayout.viewBox;
    const fitScale = Math.min(viewportWidth / viewWidth, viewportHeight / viewHeight);
    baseWidth = viewWidth * fitScale;
    baseHeight = viewHeight * fitScale;
  } else {
    const baseSize = Math.max(280, Math.min(viewportWidth, viewportHeight));
    baseWidth = baseHeight = baseSize;
  }
  const renderedWidth = Math.round(baseWidth * boardZoom);
  const renderedHeight = Math.round(baseHeight * boardZoom);
  boardEl.style.width = `${renderedWidth}px`;
  boardEl.style.height = `${renderedHeight}px`;
  if (zoomResetBtn) {
    zoomResetBtn.textContent = `${Math.round(boardZoom * 100)}%`;
    zoomResetBtn.title = t('zoomReset');
    zoomResetBtn.setAttribute('aria-label', `${t('zoomReset')} (${Math.round(boardZoom * 100)}%)`);
  }
  if (zoomInBtn) {
    zoomInBtn.disabled = boardZoom >= MAX_BOARD_ZOOM - 0.001;
    zoomInBtn.title = t('zoomIn');
    zoomInBtn.setAttribute('aria-label', t('zoomIn'));
  }
  if (zoomOutBtn) {
    zoomOutBtn.disabled = boardZoom <= MIN_BOARD_ZOOM + 0.001;
    zoomOutBtn.title = t('zoomOut');
    zoomOutBtn.setAttribute('aria-label', t('zoomOut'));
  }
  // Prices and small metadata can scale gently with the board. Space titles are
  // fitted separately against each cell's real width/height (see fitBoardSpaceTitles).
  const cellPixels = boardLayout
    ? (boardLayout.defaultSpaceSize?.h || 70) * (renderedHeight / boardLayout.viewBox[3])
    : renderedWidth / 9;
  const illustrated = boardLayout?.presentation === 'illustrated';
  const pricePx = illustrated
    ? clamp(cellPixels * 0.26, 9.4, 15.5)
    : clamp(cellPixels * 0.16, 7.2, 13.5);
  const metaPx = illustrated
    ? clamp(cellPixels * 0.15, 7.2, 11)
    : clamp(cellPixels * 0.115, 6.2, 10);
  boardEl.style.setProperty('--space-price-size', `${pricePx.toFixed(1)}px`);
  boardEl.style.setProperty('--space-meta-size', `${metaPx.toFixed(1)}px`);
  const worldLabelPx = clamp(renderedWidth * 0.018, 11.5, 26);
  boardEl.style.setProperty('--board-world-label-size', `${worldLabelPx.toFixed(1)}px`);
  refreshBoardViewportState();
  renderBoardTokens();
  renderBoardSpaceNumbers();
  requestAnimationFrame(fitBoardSpaceTitles);
  requestAnimationFrame(fitWorldLabels);
}

function titleFitProfile(space) {
  // Maxima intentionally grow sub-linearly with board zoom: zoom gives more room,
  // but labels should never turn into poster-sized text.
  const zoomScale = Math.pow(clamp(boardZoom, 1, MAX_BOARD_ZOOM), 0.28);
  const profiles = {
    site: { max: 10.6, min: 7.2, height: 0.34 },
    hub: { max: 10.0, min: 7.0, height: 0.31 },
    service: { max: 10.0, min: 7.0, height: 0.31 },
    event: { max: 9.2, min: 6.8, height: 0.28 },
    tax: { max: 9.2, min: 6.8, height: 0.28 },
    neutral: { max: 9.2, min: 6.8, height: 0.28 },
    start: { max: 9.0, min: 6.7, height: 0.30 },
    detention: { max: 8.9, min: 6.6, height: 0.31 },
    moveToDetention: { max: 8.9, min: 6.6, height: 0.31 },
  };
  const profile = profiles[space?.type] || profiles.neutral;
  return {
    maxPx: clamp(profile.max * zoomScale, profile.max, 14.2),
    minPx: clamp(profile.min * Math.pow(boardZoom, 0.12), profile.min, 8.2),
    heightRatio: profile.height,
  };
}

function fitOneSpaceTitle(node) {
  const title = node?.querySelector('.space-title');
  if (!title || !node.isConnected) return;
  const index = Number(node.dataset.index);
  const space = board?.spaces?.[index];
  if (!space) return;

  const rect = node.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return;
  const { maxPx, minPx, heightRatio } = titleFitProfile(space);
  const availableWidth = Math.max(20, node.clientWidth - 8);
  const availableHeight = Math.max(14, node.clientHeight * heightRatio);
  const clipGuard = 2.2;

  // Measure the real localized label in its actual cell. This avoids hard-coded
  // guesses based on character count and works for IT/EN/FR/DE and future boards.
  const previous = {
    width: title.style.width,
    maxHeight: title.style.maxHeight,
    overflow: title.style.overflow,
    fontSize: title.style.fontSize,
  };
  title.style.width = `${availableWidth}px`;
  title.style.maxHeight = 'none';
  title.style.overflow = 'visible';

  const fits = size => {
    title.style.fontSize = `${size}px`;
    const lineHeight = size * 1.10;
    // A tiny tolerance avoids oscillation from fractional browser pixels.
    return title.scrollHeight <= availableHeight + 1.25 && title.scrollWidth <= availableWidth + 1.25 &&
      title.scrollHeight <= lineHeight * 3.2;
  };

  let low = minPx;
  let high = maxPx;
  let best = minPx;
  if (fits(maxPx)) {
    best = maxPx;
  } else {
    for (let i = 0; i < 9; i += 1) {
      const mid = (low + high) / 2;
      if (fits(mid)) { best = mid; low = mid; }
      else high = mid;
    }
  }

  title.style.fontSize = `${best.toFixed(2)}px`;
  title.style.width = previous.width;
  title.style.maxHeight = `${(availableHeight + clipGuard).toFixed(1)}px`;
  title.style.overflow = 'hidden';
  title.dataset.fitted = 'true';
}

function fitBoardSpaceTitles() {
  if (!boardEl) return;
  boardEl.querySelectorAll('.space').forEach(fitOneSpaceTitle);
}

function fitOneWorldLabel(node) {
  const text = node?.querySelector('.world-label-text');
  if (!text || !node.isConnected) return;

  const rect = node.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return;
  // The parchment cartouche box is fixed by the layout (see worldLabels in
  // layout.json); world names range from four letters to two long words, so a
  // single board-wide font size either wastes space on short names or clips
  // long ones. Binary-search the largest size that actually fits this box,
  // the same technique fitOneSpaceTitle already uses for cell titles.
  const maxPx = parseFloat(getComputedStyle(boardEl).getPropertyValue('--board-world-label-size')) || 18;
  const minPx = 6.5;
  const availableWidth = Math.max(10, node.clientWidth * 0.84);
  const availableHeight = Math.max(8, node.clientHeight * 0.86);

  // .world-label-text is centered (flex + text-align:center) and clipped
  // (overflow:hidden). scrollWidth on a centered, overflowing, non-scrolling
  // box is unreliable across engines, and a flex container's scrollWidth
  // reflects the box itself rather than the overflowing content. Instead,
  // drop width/centering/clipping entirely during measurement so the element
  // sizes to its own natural content width, then compare that real width
  // directly, the least ambiguous way to ask "does this text fit at this size".
  const previous = {
    width: text.style.width, height: text.style.height, fontSize: text.style.fontSize, display: text.style.display,
    textAlign: text.style.textAlign, overflow: text.style.overflow,
  };
  text.style.width = 'auto';
  text.style.height = 'auto';
  text.style.display = 'inline-block';
  text.style.textAlign = 'left';
  text.style.overflow = 'visible';

  const fits = size => {
    text.style.fontSize = `${size}px`;
    return text.scrollWidth <= availableWidth + 1.25 && text.scrollHeight <= availableHeight + 1.25;
  };

  let low = minPx;
  let high = maxPx;
  let best = minPx;
  if (fits(maxPx)) {
    best = maxPx;
  } else {
    for (let i = 0; i < 9; i += 1) {
      const mid = (low + high) / 2;
      if (fits(mid)) { best = mid; low = mid; }
      else high = mid;
    }
  }

  text.style.fontSize = `${best.toFixed(2)}px`;
  text.style.width = previous.width;
  text.style.height = previous.height;
  text.style.display = previous.display;
  text.style.textAlign = previous.textAlign;
  text.style.overflow = previous.overflow;
}

function fitWorldLabels() {
  if (!worldLabelsLayer) return;
  const labels = [...worldLabelsLayer.querySelectorAll('.board-world-label')];
  labels.forEach(fitOneWorldLabel);
  // All four names share the smallest fitted size so no world looks styled differently.
  const texts = labels.map(node => node.querySelector('.world-label-text')).filter(Boolean);
  const sizes = texts.map(text => parseFloat(text.style.fontSize)).filter(Number.isFinite);
  if (!sizes.length) return;
  const uniform = Math.min(...sizes);
  texts.forEach(text => { text.style.fontSize = `${uniform.toFixed(2)}px`; });
}

function setBoardZoom(nextZoom) {
  boardZoom = clamp(nextZoom, MIN_BOARD_ZOOM, MAX_BOARD_ZOOM);
  storage.set(BOARD_ZOOM_KEY, String(boardZoom));
  applyBoardZoom();
  requestAnimationFrame(() => followCurrentTurn(false));
}

function boardCanPan() {
  return !!boardViewport && boardZoom > 1.01 && (boardViewport.scrollWidth > boardViewport.clientWidth + 4 || boardViewport.scrollHeight > boardViewport.clientHeight + 4);
}

function refreshBoardViewportState() {
  if (!boardViewport) return;
  boardViewport.classList.toggle('is-zoomed', boardZoom > 1.01);
  boardViewport.classList.toggle('is-pannable', boardCanPan());
}

function setupBoardPanControls() {
  if (!boardViewport) return;
  const finishDrag = () => {
    if (boardDrag?.moved) suppressBoardClickUntil = Date.now() + 260;
    boardDrag = null;
    boardViewport.classList.remove('dragging');
  };
  boardViewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !boardCanPan()) return;
    boardDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: boardViewport.scrollLeft,
      top: boardViewport.scrollTop,
      moved: false,
    };
  });
  boardViewport.addEventListener('pointermove', event => {
    if (!boardDrag || boardDrag.pointerId !== event.pointerId) return;
    const dx = event.clientX - boardDrag.startX;
    const dy = event.clientY - boardDrag.startY;
    if (!boardDrag.moved && Math.hypot(dx,dy) > 5) {
      boardDrag.moved = true;
      boardViewport.classList.add('dragging');
      // Capture only once a real drag starts: capturing on pointerdown retargets the click
      // to the viewport, so tapping a space never opened its details when zoomed in.
      boardViewport.setPointerCapture?.(event.pointerId);
      suspendAutoFollow();
    }
    if (!boardDrag.moved) return;
    boardViewport.scrollLeft = boardDrag.left - dx;
    boardViewport.scrollTop = boardDrag.top - dy;
    event.preventDefault();
  });
  for (const name of ['pointerup','pointercancel','pointerleave']) boardViewport.addEventListener(name, event => {
    if (boardDrag && boardDrag.pointerId === event.pointerId) finishDrag();
  });
}

function focusSpace(index) {
  suspendAutoFollow();
  if (boardZoom < 1.75) {
    boardZoom = 1.75;
    storage.set(BOARD_ZOOM_KEY, String(boardZoom));
    applyBoardZoom();
  }
  requestAnimationFrame(() => centerBoardOnSpace(index, { force: true, behavior: 'smooth' }));
}

function handleSpaceClick(index) {
  if (Date.now() < suppressBoardClickUntil) return;
  const now = Date.now();
  if (lastSpaceTap.index === index && now - lastSpaceTap.time <= DOUBLE_TAP_MS) {
    clearTimeout(lastSpaceTap.timer);
    lastSpaceTap = { index: -1, time: 0, timer: null };
    focusSpace(index);
    return;
  }
  clearTimeout(lastSpaceTap.timer);
  lastSpaceTap.index = index;
  lastSpaceTap.time = now;
  lastSpaceTap.timer = setTimeout(() => {
    showSpaceInfo(index);
    lastSpaceTap = { index: -1, time: 0, timer: null };
  }, DOUBLE_TAP_MS);
}

function setEventStripMessage(message='') {
  eventStrip.textContent = message;
  eventStrip.classList.remove('event-pop');
  void eventStrip.offsetWidth;
  eventStrip.classList.add('event-pop');
  setTimeout(() => eventStrip.classList.remove('event-pop'), motionMs(520));
  if (message) announce(message);
}

function enqueueEventStripNotifications(events=[]) {
  for (const event of events) {
    const message = describeEvent(event);
    if (message) eventStripQueue.push(message);
  }
  drainEventStripQueue();
}

async function drainEventStripQueue() {
  if (eventStripWorkerRunning) return;
  eventStripWorkerRunning = true;
  const generation = notificationGeneration;
  try {
    while (eventStripQueue.length) {
      if (generation !== notificationGeneration) return;
      const message = eventStripQueue.shift();
      setEventStripMessage(message);
      await wait(animationSpeed === 'fast' ? 260 : 520);
    }
  } finally {
    if (generation === notificationGeneration) eventStripWorkerRunning = false;
  }
}


function playerById(id) {
  return packet?.state?.players?.find(player => player.id === id) ?? null;
}

function eventActorId(event) {
  return event?.playerId ?? event?.winnerId ?? event?.traderId ?? event?.toPlayerId ?? event?.fromPlayerId ?? event?.ownerId ?? event?.targetId ?? null;
}

function popupPlayerForEvent(event) {
  const actor = playerById(eventActorId(event));
  if (!actor || actor.type === 'human') return null;
  return actor;
}

function popupActionLabel(event) {
  switch (event.type) {
    case 'DICE_ROLLED': return t('popupRolling');
    case 'PLAYER_MOVED': return t('popupMoving');
    case 'START_PASSED': return t('popupPassedStart');
    case 'PROPERTY_ACQUIRED': return t('popupBuying');
    case 'RENT_DUE': return t('popupPayingRent');
    case 'AUCTION_ENDED': return t('popupAuction');
    case 'CARD_DRAWN': return t('popupCard');
    case 'EMBELLISHMENT_BUILT':
    case 'EMBELLISHMENT_GRANTED': return t('popupBuilding');
    case 'EMBELLISHMENT_SOLD': return t('popupSellingEmbellishment');
    case 'EMBELLISHMENT_LOST': return t('popupLosingEmbellishment');
    case 'PROPERTY_PLEDGED': return t('popupPledging');
    case 'PROPERTY_REDEEMED': return t('popupRedeeming');
    case 'TRADE_PROPOSED': return t('popupTrading');
    case 'TRADE_ACCEPTED': return t('popupTradeAccepted');
    case 'TRADE_DECLINED': return t('popupTradeDeclined');
    case 'SENT_TO_BASE': return t('popupBaseCamp');
    case 'PLAYER_BANKRUPT': return t('popupBankrupt');
    case 'GAME_ENDED': return t('popupWinner');
    default: return t('popupAction');
  }
}

function cpuActionMessage(event) {
  switch (event.type) {
    case 'DICE_ROLLED': return `🎲 ${event.a} + ${event.b} = ${event.total}${event.doubles ? ' · ×2' : ''}`;
    case 'PLAYER_MOVED': return `→ ${spaceName(board?.spaces?.[event.to]?.id || event.spaceId || event.to)}`;
    case 'START_PASSED': return `🏁 +${event.amount || 0} 🪙`;
    case 'PROPERTY_ACQUIRED': return `🏷️ ${spaceName(event.spaceId)} · ${event.price} 🪙`;
    case 'RENT_DUE': return `💰 ${event.amount} 🪙 → ${playerById(event.ownerId)?.name || '—'}`;
    case 'AUCTION_ENDED': return event.winnerId == null ? `🔨 ${spaceName(event.spaceId)}` : `🔨 ${spaceName(event.spaceId)} · ${event.price} 🪙`;
    case 'CARD_DRAWN': return `🃏 ${locale.events?.[event.cardId]?.title ?? event.cardId}`;
    case 'EMBELLISHMENT_BUILT':
    case 'EMBELLISHMENT_GRANTED': return `⬆ ${spaceName(event.spaceId)}`;
    case 'EMBELLISHMENT_SOLD': return `⬇ ${spaceName(event.spaceId)}`;
    case 'EMBELLISHMENT_LOST': return `⚠ ${spaceName(event.spaceId)}`;
    case 'PROPERTY_PLEDGED': return `⛓️ ${spaceName(event.spaceId)}`;
    case 'PROPERTY_REDEEMED': return `🔓 ${spaceName(event.spaceId)}`;
    case 'TRADE_PROPOSED': return `🤝 ${playerById(event.targetId)?.name || '—'}`;
    case 'TRADE_ACCEPTED': return `✅ ${playerById(event.targetId)?.name || '—'}`;
    case 'TRADE_DECLINED': return `↩ ${playerById(event.targetId)?.name || '—'}`;
    case 'SENT_TO_BASE': return `🏕️ ${spaceName('base-camp')}`;
    case 'PLAYER_BANKRUPT': return `☁ ${t('bankrupt')}`;
    case 'GAME_ENDED': return `🏆 ${t('winner')}`;
    default: return describeEvent(event);
  }
}

const CPU_POPUP_EVENT_TYPES = new Set([
  'DICE_ROLLED','PLAYER_MOVED','START_PASSED','PROPERTY_ACQUIRED','RENT_DUE','AUCTION_ENDED','CARD_DRAWN',
  'EMBELLISHMENT_BUILT','EMBELLISHMENT_GRANTED','EMBELLISHMENT_SOLD','EMBELLISHMENT_LOST','PROPERTY_PLEDGED','PROPERTY_REDEEMED',
  'TRADE_PROPOSED','TRADE_ACCEPTED','TRADE_DECLINED','SENT_TO_BASE','PLAYER_BANKRUPT','GAME_ENDED'
]);

function buildCpuActionItems(events=[]) {
  const items = [];
  for (const event of events) {
    if (!CPU_POPUP_EVENT_TYPES.has(event.type)) continue;
    const player = popupPlayerForEvent(event);
    if (!player) continue;
    const message = cpuActionMessage(event);
    if (!message) continue;
    items.push({ playerId: player.id, actionLabel: popupActionLabel(event), message });
  }
  return items;
}

function enqueueCpuPopups(events=[]) {
  cpuPopupQueue.push(...buildCpuActionItems(events));
  drainCpuPopupQueue();
}

async function drainCpuPopupQueue() {
  if (cpuPopupWorkerRunning) return;
  cpuPopupWorkerRunning = true;
  const generation = notificationGeneration;
  try {
    while (cpuPopupQueue.length) {
      if (generation !== notificationGeneration) return;
      const item = cpuPopupQueue.shift();
      const player = playerById(item.playerId);
      if (!player || player.type === 'human') continue;
      showTurnPopup(player, item.actionLabel, item.message);
      await wait(cpuPopupHoldMs());
      hideTurnPopup();
      await wait(motionMs(140));
    }
  } finally {
    if (generation === notificationGeneration) cpuPopupWorkerRunning = false;
  }
}

function resetCpuPopupQueue() {
  notificationGeneration += 1;
  eventStripQueue = [];
  eventStripWorkerRunning = false;
  cpuPopupQueue = [];
  cpuPopupWorkerRunning = false;
  hideTurnPopup();
}

function ensureTurnPopup() {
  let node = document.querySelector('.turn-popup');
  if (!node) {
    node = document.createElement('div');
    node.className = 'turn-popup';
    document.body.append(node);
  }
  return node;
}

function hideTurnPopup() {
  clearTimeout(turnPopupTimer);
  const node = document.querySelector('.turn-popup');
  if (!node) return;
  node.classList.remove('show');
}

function showTurnPopup(player, actionLabel, message) {
  if (!player || !message) return;
  clearTimeout(turnPopupTimer);
  const node = ensureTurnPopup();
  const token = tokenHtml(player, 'turn-popup-token');
  node.innerHTML = `${token}<div class="turn-popup-copy"><span class="turn-popup-action">${escapeHtml(actionLabel || t('popupTurnSummary'))}</span><strong>${escapeHtml(player.name)}</strong><span class="turn-popup-detail">${escapeHtml(message)}</span></div>`;
  node.style.setProperty('--token', playerColor(player));
  node.classList.remove('show');
  void node.offsetWidth;
  node.classList.add('show');
  turnPopupTimer = setTimeout(() => node.classList.remove('show'), Math.max(900, cpuPopupHoldMs() - 120));
}

function setupBoardZoomControls() {
  zoomInBtn?.addEventListener('click', () => setBoardZoom(boardZoom + BOARD_ZOOM_STEP));
  zoomOutBtn?.addEventListener('click', () => setBoardZoom(boardZoom - BOARD_ZOOM_STEP));
  zoomResetBtn?.addEventListener('click', () => setBoardZoom(1));
  followBtn?.addEventListener('click', () => {
    if (!followEnabled || Date.now() < followSuspendedUntil) {
      followEnabled = true;
      followSuspendedUntil = 0;
      clearTimeout(followResumeTimer);
      storage.set(FOLLOW_TURN_KEY, '1');
      updateFollowButton();
      followCurrentTurn(true);
    } else {
      followEnabled = false;
      storage.set(FOLLOW_TURN_KEY, '0');
      updateFollowButton();
    }
  });
  speedSelect?.addEventListener('change', () => {
    animationSpeed = speedSelect.value === 'fast' ? 'fast' : 'normal';
    storage.set(ANIMATION_SPEED_KEY, animationSpeed);
    updateSpeedUi();
  });
  boardViewport?.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setBoardZoom(boardZoom + (event.deltaY < 0 ? BOARD_ZOOM_STEP : -BOARD_ZOOM_STEP));
  }, { passive: false });
  window.addEventListener('resize', () => applyBoardZoom());
  if ('ResizeObserver' in window) {
    const boardTitleResizeObserver = new ResizeObserver(() => { requestAnimationFrame(fitBoardSpaceTitles); requestAnimationFrame(fitWorldLabels); });
    boardTitleResizeObserver.observe(boardEl);
  }
  document.fonts?.ready?.then(() => { requestAnimationFrame(fitBoardSpaceTitles); requestAnimationFrame(fitWorldLabels); });
  applyBoardZoom();
  setupBoardPanControls();
  updateFollowButton();
  updateSpeedUi();
}

function renderLanguage() {
  langSelect.replaceChildren(...board.locales.map(code => {
    const o = document.createElement('option'); o.value = code; o.textContent = code.toUpperCase(); o.selected = code === language; return o;
  }));
  el('playersTitle').textContent = t('players');
  el('actionsTitle').textContent = t('actions');
  setupLabels();
  renderWorldLabels();
  renderRouteDirections();
  const helpBtn = el('helpBtn');
  helpBtn.title = t('howToPlay');
  helpBtn.setAttribute('aria-label', t('howToPlay'));
  updateFollowButton();
  updateSpeedUi();
  updateNumberEditUi();
  applyBoardZoom();
  document.documentElement.lang = language;
}

function cpuTokenAsset(name) { return pawnConfig?.cpu?.[name]?.asset ?? null; }
function tokenHtml(player, cls='player-token') {
  const human = player.type === 'human';
  const asset = human ? HUMAN_TOKEN_ASSET : cpuTokenAsset(player.profileName || player.name);
  const moved = cls === 'board-token' && player.id === lastMovedPlayerId ? ' just-moved' : '';
  const moving = cls === 'board-token' && player.id === activeMoveAnimationPlayerId ? ' moving-hidden' : '';
  const current = cls === 'board-token' && player.id === packet?.state?.currentPlayerId ? ' current-turn' : '';
  const classes = `${cls} ${human ? 'human grugnetto-token' : 'cpu'}${moved}${moving}${current}`;
  if (asset) return `<span class="${classes}" style="--token:${playerColor(player)}"><img class="${human ? 'grugnetto-token-art' : ''}" src="${asset}" alt=""></span>`;
  return `<span class="${classes}" style="--token:${playerColor(player)}">${escapeHtml(player.name.slice(0,2).toUpperCase())}</span>`;
}


function renderBoardSpaceNumbers() {
  boardEl.querySelectorAll('.space-number-overlay').forEach(node => node.remove());
  if (!boardNumberEditMode && boardZoom < MIN_NUMBERS_ZOOM - 0.001) return;
  if (!boardLayout) return;
  const boardRect = boardEl.getBoundingClientRect();
  if (!boardRect.width || !boardRect.height) return;
  boardEl.querySelectorAll('.space').forEach(node => {
    const index = Number(node.dataset.index);
    if (!Number.isFinite(index)) return;
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'space-number-overlay';
    badge.dataset.index = String(index);
    badge.textContent = String(index + 1);
    badge.title = `${t('space')} ${index + 1}`;
    badge.setAttribute('aria-label', `${t('space')} ${index + 1}`);
    const custom = readNumberPosition(index);
    const { left, top } = custom || defaultNumberPositionForSpace(node, boardRect);
    badge.style.left = `${left}%`;
    badge.style.top = `${top}%`;
    badge.disabled = !boardNumberEditMode;
    if (boardNumberEditMode) attachNumberDrag(badge, index);
    boardEl.append(badge);
  });
}

async function loadTileOutlines(layout) {
  if (!layout?.tileOutlines) return null;
  try {
    const response = await fetch(layout.tileOutlines);
    if (!response.ok) throw new Error(`Tile outlines HTTP ${response.status}`);
    const data = await response.json();
    const [, , viewWidth, viewHeight] = layout.viewBox;
    const valid = data.schemaVersion === 1 && Array.isArray(data.tiles) && data.tiles.length === layout.spaces.length
      && data.viewBox?.[2] === viewWidth && data.viewBox?.[3] === viewHeight
      && data.tiles.every((tile, index) => tile.index === index && tile.id === layout.spaces[index].id
        && Array.isArray(tile.outline) && tile.outline.length >= 3);
    if (!valid) throw new Error('Invalid tile outlines');
    return new Map(data.tiles.map(tile => [tile.index, tile.outline]));
  } catch (error) {
    console.warn('Tile outlines unavailable, shape effects disabled', error);
    return null;
  }
}

function shapePoints(index) {
  return tileShapes.get(index).map(([x, y]) => `${x},${y}`).join(' ');
}

function ensureShapeLayers() {
  if (!tileShapes || !boardLayout) return false;
  if (underShapeLayer?.isConnected && overShapeLayer?.isConnected) return true;
  const [vx, vy, vw, vh] = boardLayout.viewBox;
  const make = className => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', `board-shape-layer ${className}`);
    svg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    return svg;
  };
  underShapeLayer = make('under');
  overShapeLayer = make('over');
  underShapeLayer.innerHTML = '<g class="shapes-under"></g>';
  overShapeLayer.innerHTML = '<g class="shapes-over"></g>';
  boardEl.insertBefore(underShapeLayer, boardEl.querySelector('.space'));
  boardEl.append(overShapeLayer);
  return true;
}

function spotlightIndexes() {
  const state = packet?.state;
  if (!state) return [];
  const pending = packet?.pendingDecision;
  if (inspectedPlayerId != null) return state.spaces.flatMap((st, index) => (st.owner === inspectedPlayerId ? [index] : []));
  if (pending?.type === 'AUCTION_BIDS' && pending.index != null) return [pending.index];
  if (pending?.type === 'TRADE_OFFER' && pending.proposal) return [...(pending.proposal.traderToGive || []), ...(pending.proposal.targetToGive || [])];
  return [];
}

function renderTileShapes() {
  if (!ensureShapeLayers()) return;
  const state = packet?.state;
  const [vx, vy, vw, vh] = boardLayout.viewBox;
  const under = [];
  for (const [index, st] of (state?.spaces ?? []).entries()) {
    if (!tileShapes.has(index)) continue;
    const owner = st.owner != null ? state.players.find(p => p.id === st.owner) : null;
    if (owner && tintedPlayerIds.has(owner.id)) under.push(`<polygon class="tile-tint" points="${shapePoints(index)}" style="--tint:${playerColor(owner)}"/>`);
  }
  underShapeLayer.querySelector('.shapes-under').innerHTML = under.join('');

  const lit = spotlightIndexes().filter(index => tileShapes.has(index));
  const over = [];
  if (lit.length) {
    over.push(`<defs><mask id="spotlightMask" maskUnits="userSpaceOnUse" x="${vx}" y="${vy}" width="${vw}" height="${vh}"><rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="white"/>${lit.map(index => `<polygon points="${shapePoints(index)}" fill="black"/>`).join('')}</mask></defs>`);
    over.push(`<rect class="spot-dim" x="${vx}" y="${vy}" width="${vw}" height="${vh}" mask="url(#spotlightMask)"/>`);
    over.push(...lit.map(index => `<polygon class="spot-ring" points="${shapePoints(index)}"/>`));
  }
  if (focusedTileIndex != null && tileShapes.has(focusedTileIndex)) {
    over.push(`<polygon class="focus-ring-outer" points="${shapePoints(focusedTileIndex)}"/><polygon class="focus-ring" points="${shapePoints(focusedTileIndex)}"/>`);
  }
  overShapeLayer.querySelector('.shapes-over').innerHTML = over.join('');
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function tileIndexAtEvent(event) {
  const [vx, vy, vw, vh] = boardLayout.viewBox;
  const rect = boardEl.getBoundingClientRect();
  const x = vx + ((event.clientX - rect.left - boardEl.clientLeft) / boardEl.clientWidth) * vw;
  const y = vy + ((event.clientY - rect.top - boardEl.clientTop) / boardEl.clientHeight) * vh;
  for (const [index, points] of tileShapes) if (pointInPolygon(x, y, points)) return index;
  return -1;
}

function setupBoardShapeHitTesting() {
  if (!tileShapes || !boardEl) return;
  // Clicks are matched against the real plaque outlines, not the (larger, overlapping) layout rectangles.
  boardEl.addEventListener('click', event => {
    if (event.target.closest('button')) return;
    // Tiles ignore the pointer, so only synthetic clicks (assistive technology, element.click()) target one directly; real clicks are matched against the plaque outlines.
    const tile = event.target.closest('.space');
    const index = tile ? Number(tile.dataset.index) : tileIndexAtEvent(event);
    if (index >= 0) handleSpaceClick(index);
  });
  boardEl.addEventListener('pointermove', event => {
    if (boardNumberDrag || event.buttons) return;
    boardEl.style.cursor = tileIndexAtEvent(event) >= 0 ? 'pointer' : '';
  });
}

function togglePlayerTint(playerId) {
  if (tintedPlayerIds.has(playerId)) tintedPlayerIds.delete(playerId);
  else tintedPlayerIds.add(playerId);
  renderPlayers();
  renderTileShapes();
}

function renderBoard() {
  boardEl.querySelectorAll('.space').forEach(node => node.remove());
  focusedTileIndex = null;
  ensureShapeLayers();
  boardEl.classList.toggle('shape-hit', !!tileShapes);
  boardEl.classList.toggle('inspecting-player', inspectedPlayerId != null);
  const state = packet?.state;
  const worldById = Object.fromEntries(board.worlds.map(w => [w.id,w]));
  const currentPlayer = state?.players?.find(player => player.id === state.currentPlayerId);
  board.spaces.forEach((space,index) => {
    const pos = boardLayout ? layoutBox(index) : gridPosition(index);
    const st = state?.spaces?.[index] || {};
    const node = document.createElement('article');
    const inspectedOwner = inspectedPlayerId != null && st.owner === inspectedPlayerId;
    node.className = `space type-${space.type}${['site','hub','service'].includes(space.type) ? ' ownable-space' : ' special-space'}${st.owner != null ? ' owned':''}${st.pledged ? ' pledged':''}${st.embellishments > 0 ? ' embellished':''}${currentPlayer?.position === index ? ' active-player-space':''}${inspectedOwner ? ' inspected-owner-space':''}`;
    node.dataset.index = String(index);
    node.setAttribute('role','button');
    node.tabIndex = 0;
    if (boardLayout) {
      const [, , viewWidth, viewHeight] = boardLayout.viewBox;
      node.style.left = `${(pos.x / viewWidth) * 100}%`;
      node.style.top = `${(pos.y / viewHeight) * 100}%`;
      node.style.width = `${(pos.w / viewWidth) * 100}%`;
      node.style.height = `${(pos.h / viewHeight) * 100}%`;
    } else {
      node.style.gridRow = pos.row; node.style.gridColumn = pos.col;
    }
    const visualWorldId = pos?.visualWorldId || space.world || null;
    if (visualWorldId) node.style.setProperty('--world', worldById[visualWorldId]?.accent || '#999');
    if (pos?.levelRef) node.dataset.levelRef = pos.levelRef;
    const owner = state?.players?.find(p => p.id === st.owner);
    if (owner) node.style.setProperty('--owner', playerColor(owner));
    const price = ['site','hub','service'].includes(space.type) && Number.isFinite(space.price) ? `<span class="space-price"><img src="${board.currencyAsset}" alt="">${space.price}</span>` : '';
    const isOwnable = ['site','hub','service'].includes(space.type);
    const specialSymbol = isOwnable ? '' : (space.type === 'start' ? boardIconMask('flag_triangle') : iconFor(space,index));
    const worldSymbol = worldCellSymbol(space.world);
    const typeBadge = spaceTypeBadge(space);
    const spaceNumber = index + 1;
    node.innerHTML = `<span class="space-number" title="${escapeHtml(t('space'))} ${spaceNumber}">${spaceNumber}</span>${worldSymbol}${typeBadge}${specialSymbol}<strong class="space-title">${escapeHtml(spaceName(space))}</strong>${price}`;
    const ownerLabel = (owner ? ` · ${t('owner')}: ${owner.name}` : '') + (st.embellishments ? ` · ${t('embellishments')}: ${st.embellishments}` : '') + (st.pledged ? ` · ${t('pledged')}` : '');
    const priceLabel = Number.isFinite(space.price) ? ` · ${t('price')}: ${space.price}` : '';
    const worldLabel = space.world ? ` · ${t('world')}: ${worldName(space.world)}` : '';
    node.setAttribute('aria-label', `${t('space')} ${spaceNumber}: ${spaceName(space)}${worldLabel}${priceLabel}${ownerLabel}. ${t('accessibilitySpace')}`);
    if (!tileShapes) node.addEventListener('click', () => handleSpaceClick(index));
    node.addEventListener('focus', () => {
      if (tileShapes && node.matches(':focus-visible')) { focusedTileIndex = index; renderTileShapes(); }
    });
    node.addEventListener('blur', () => {
      if (focusedTileIndex === index) { focusedTileIndex = null; if (tileShapes) renderTileShapes(); }
    });
    node.addEventListener('dblclick', event => event.preventDefault());
    node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showSpaceInfo(index); } });
    boardEl.append(node);
  });
  renderBoardTokens();
  renderBoardSpaceNumbers();
  renderTileShapes();
  requestAnimationFrame(fitBoardSpaceTitles);
}

function tokenFanOffsets(count) {
  if (count <= 1) return [{ x: 0, y: 0 }];
  if (count === 2) return [{ x: -24, y: -4 }, { x: 24, y: 8 }];
  if (count === 3) return [{ x: 0, y: -24 }, { x: -26, y: 20 }, { x: 26, y: 20 }];
  if (count === 4) return [{ x: -24, y: -20 }, { x: 24, y: -20 }, { x: -24, y: 22 }, { x: 24, y: 22 }];
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index / count);
    const radius = count > 6 ? 34 : 30;
    return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
  });
}

function renderBoardTokens() {
  const state = packet?.state;
  if (!boardEl) return;
  const existing = boardEl.querySelector('.board-token-layer');
  if (existing) existing.remove();
  if (!state?.players?.length) return;
  const layer = document.createElement('div');
  layer.className = 'board-token-layer';
  const groups = new Map();
  state.players.filter(p => !p.bankrupt).forEach(player => {
    const index = Number(player.position ?? 0);
    const arr = groups.get(index) || [];
    arr.push(player);
    groups.set(index, arr);
  });
  const viewWidth = boardLayout?.viewBox?.[2] || null;
  const viewHeight = boardLayout?.viewBox?.[3] || null;
  groups.forEach((playersAtSpace, index) => {
    const anchor = boardPointFor(index);
    if (!anchor) return;
    playersAtSpace.sort((a,b) => Number(a.type === 'human') - Number(b.type === 'human'));
    const offsets = tokenFanOffsets(playersAtSpace.length);
    const count = playersAtSpace.length;
    const stackScale = count <= 1 ? 1 : count === 2 ? .78 : count === 3 ? .66 : count === 4 ? .58 : .50;
    playersAtSpace.forEach((player, i) => {
      const shell = document.createElement('div');
      shell.className = `board-token-shell token-stack-${Math.min(count,5)}${player.type === 'human' ? ' human-shell' : ''}`;
      shell.style.setProperty('--stack-scale', String(stackScale));
      if (player.type === 'human') shell.style.zIndex = '14';
      const off = offsets[i] || { x: 0, y: 0 };
      if (viewWidth && viewHeight && boardLayout && layoutBox(index)?.tokenAnchor) {
        const box = layoutBox(index);
        shell.style.left = `${(box.tokenAnchor.x / viewWidth) * 100}%`;
        shell.style.top = `${(box.tokenAnchor.y / viewHeight) * 100}%`;
        shell.style.setProperty('--dx', `${off.x}px`);
        shell.style.setProperty('--dy', `${off.y}px`);
      } else {
        shell.style.left = `${anchor.x + off.x}px`;
        shell.style.top = `${anchor.y + off.y}px`;
      }
      shell.innerHTML = tokenHtml(player, 'board-token');
      layer.appendChild(shell);
    });
  });
  boardEl.appendChild(layer);
}


const TURN_REVIEW_EVENT_TYPES = new Set([
  'DICE_ROLLED','PLAYER_MOVED','SPACE_LANDED','START_PASSED','PROPERTY_ACQUIRED','RENT_DUE','AUCTION_ENDED','CARD_DRAWN',
  'EMBELLISHMENT_BUILT','EMBELLISHMENT_GRANTED','EMBELLISHMENT_SOLD','EMBELLISHMENT_LOST','PROPERTY_PLEDGED','PROPERTY_REDEEMED',
  'TRADE_PROPOSED','TRADE_ACCEPTED','TRADE_DECLINED','SENT_TO_BASE','PLAYER_BANKRUPT','GAME_ENDED'
]);

function turnReviewLabel(event) {
  switch (event?.type) {
    case 'DICE_ROLLED': return t('turnActionRoll');
    case 'PLAYER_MOVED': return t('turnActionMove');
    case 'SPACE_LANDED': return t('turnActionLand');
    case 'START_PASSED': return t('turnActionPassedStart');
    case 'PROPERTY_ACQUIRED': return t('turnActionBuy');
    case 'RENT_DUE': return t('turnActionRent');
    case 'AUCTION_ENDED': return t('turnActionAuction');
    case 'CARD_DRAWN': return t('turnActionCard');
    case 'EMBELLISHMENT_BUILT':
    case 'EMBELLISHMENT_GRANTED': return t('turnActionBuild');
    case 'EMBELLISHMENT_SOLD': return t('turnActionSellEmbellishment');
    case 'EMBELLISHMENT_LOST': return t('turnActionLoseEmbellishment');
    case 'PROPERTY_PLEDGED': return t('turnActionPledge');
    case 'PROPERTY_REDEEMED': return t('turnActionRedeem');
    case 'TRADE_PROPOSED':
    case 'TRADE_ACCEPTED':
    case 'TRADE_DECLINED': return t('turnActionTrade');
    case 'SENT_TO_BASE': return t('turnActionSentToBase');
    case 'PLAYER_BANKRUPT': return t('turnActionBankrupt');
    case 'GAME_ENDED': return t('turnActionWinner');
    default: return t('popupAction');
  }
}

function turnReviewMessage(event) {
  switch (event?.type) {
    case 'SPACE_LANDED': return `📍 ${spaceName(event.spaceId)}`;
    default: return cpuActionMessage(event) || describeEvent(event);
  }
}

function reviewEvents(events=[]) {
  return events.filter(event => TURN_REVIEW_EVENT_TYPES.has(event?.type));
}

function currentTurnReview() {
  const pending = packet?.pendingDecision;
  if (pending?.type !== 'TURN_REVIEW') return null;
  const player = playerById(pending.playerId) || packet?.state?.players?.find(item => item.id === pending.playerId) || null;
  return { player, events: reviewEvents(pending.reviewEvents || []) };
}

function turnReviewMarkup() {
  if (!packet?.state) return `<div class="turn-review-empty">${escapeHtml(t('turnReviewHint'))}</div>`;
  const review = currentTurnReview();
  if (!review?.player) return `<div class="turn-review-empty">${escapeHtml(t('turnReviewHint'))}</div>`;
  const items = review.events;
  const token = tokenHtml(review.player);
  const list = items.length
    ? `<ol class="turn-review-list">${items.map(event => `<li class="turn-review-item"><span class="turn-review-item-label">${escapeHtml(turnReviewLabel(event))}</span><span class="turn-review-item-text">${escapeHtml(turnReviewMessage(event))}</span></li>`).join('')}</ol>`
    : `<div class="turn-review-empty">${escapeHtml(t('turnReviewEmpty'))}</div>`;
  const actions = packet?.pendingDecision?.type === 'TURN_REVIEW'
    ? `<div class="turn-review-actions"><button class="primary" type="button" data-action="ACK_TURN">OK</button></div>`
    : '';
  return `<div class="turn-review-card"><div class="turn-review-player">${token}<div class="turn-review-copy"><strong>${escapeHtml(review.player.name)}</strong></div></div>${list}${actions}</div>`;
}

function renderTurnReview() {
  if (!turnReviewBody || !turnReviewTitle || !turnReviewPanel) return;
  const review = currentTurnReview();
  const active = Boolean(review?.player && packet?.pendingDecision?.type === 'TURN_REVIEW');
  turnReviewPanel.closest('.action-panel')?.classList.toggle('review-mode', active);
  turnReviewPanel.hidden = !active;
  if (!active) {
    turnReviewBody.innerHTML = '';
    return;
  }
  turnReviewTitle.textContent = `${t('turnReviewTitle')} · ${review.player.name}`;
  const markup = turnReviewMarkup();
  turnReviewBody.innerHTML = markup;
  turnReviewBody.scrollTop = 0;
  turnReviewPanel.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => handleDecision(b.dataset.action, turnReviewPanel)));
  // Below ~780px .action-panel (and turnReviewPanel inside it) is hidden by
  // CSS in favor of the mobile-players strip, which has no room for the full
  // review. Without this, TURN_REVIEW has no visible OK button at all on
  // narrow/phone viewports and play cannot continue. Mirror the same review
  // markup into the mobile action dock, exactly like renderDecision() already
  // mirrors ordinary decisions there.
  if (mobileActions) {
    mobileActions.innerHTML = `<div class="turn-review-mobile">${markup}</div>`;
    mobileActions.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => handleDecision(b.dataset.action, mobileActions)));
  }
}

function renderPlayers() {
  const state = packet?.state;
  if (!state) { playersEl.innerHTML=''; mobilePlayers.innerHTML=''; return; }
  const currentId = state.currentPlayerId;
  playersEl.innerHTML = state.players.map(p => {
    const isReviewing = packet?.pendingDecision?.type==='TURN_REVIEW' && packet?.pendingDecision?.playerId===p.id;
    const reviewChip = isReviewing ? `<div class="player-review-chip">⏸ ${t('turnReviewDone')}</div>` : '';
    const detained = p.detained ? `<span>🏕️ ${t('baseCamp')}</span>` : '';
    const bankrupt = p.bankrupt ? `<span>⚠ ${t('bankrupt')}</span>` : '';
    return `
      <article data-player-id="${p.id}" class="player-card ${p.id===currentId?'current':''} ${p.bankrupt?'bankrupt':''} ${p.type==='human'?'human-player':''}" style="--token:${playerColor(p)}" role="button" tabindex="0" aria-label="${escapeHtml(tf('inspectPlayer',{name:p.name}))}">
        ${tokenHtml(p)}
        <div class="player-head">
          <strong class="player-name">${escapeHtml(p.name)}</strong>
          <span class="player-type">${p.type==='human'?t('you'):t('cpu')}</span>
        </div>
        <div class="player-money"><img src="${board.currencyAsset}" alt="">${p.cash}</div>
        <div class="player-meta"><span>${inlineBoardIcon('notepad')} ${p.properties.length}</span>${detained}${bankrupt}${tileShapes ? `<button type="button" class="player-tint-toggle${tintedPlayerIds.has(p.id) ? ' active' : ''}" data-tint-player="${p.id}" aria-pressed="${tintedPlayerIds.has(p.id)}" title="${escapeHtml(t('tintProperties'))}" aria-label="${escapeHtml(t('tintProperties'))}">${inlineBoardIcon('flag_square')}</button>` : ''}</div>
        ${reviewChip}
        ${worldProgressMarkup(p)}
      </article>`;
  }).join('');
  mobilePlayers.innerHTML = state.players.map(p => `
    <article data-player-id="${p.id}" class="mobile-player ${p.id===currentId?'current':''}" style="--token:${playerColor(p)}">${tokenHtml(p)}<strong>${escapeHtml(p.name)}</strong><span>🪙 ${p.cash} · ${inlineBoardIcon('notepad')} ${p.properties.length}</span>${worldProgressMarkup(p,true)}</article>`).join('');
  for (const card of playersEl.querySelectorAll('.player-card')) {
    const player = state.players.find(item => String(item.id) === card.dataset.playerId);
    if (!player) continue;
    card.title = tf('inspectPlayer', { name: player.name });
    const openHoldings = () => showPlayerHoldings(player.id);
    card.addEventListener('click', openHoldings);
    card.querySelector('.player-tint-toggle')?.addEventListener('click', event => {
      event.stopPropagation();
      togglePlayerTint(player.id);
    });
    card.addEventListener('keydown', event => {
      if (event.target !== card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openHoldings();
      }
    });
  }
  renderBoardTokens();
}


function renderCenter() {
  const state = packet?.state;
  if (!state) {
    currentName.textContent='Grugnetto'; currentCash.textContent='—'; centerHint.textContent=t('startHint'); turnPill.textContent='—'; return;
  }
  const cur = state.players.find(p => p.id === state.currentPlayerId);
  currentName.textContent = cur?.name || '—';
  currentCash.innerHTML = cur ? `${t('cash')}: ${cur.cash}` : '';
  turnPill.textContent = `${t('turn')} ${state.turnNumber} · ${t('round')} ${state.roundNumber}`;
  if (statusLine) statusLine.textContent = '';
  const pending = packet.pendingDecision;
  const reviewingTurn = pending?.type === 'TURN_REVIEW';
  boardEl?.classList.toggle('reviewing-turn', reviewingTurn);
  if (reviewingTurn && eventStrip) eventStrip.textContent = '';
  if (state.status === 'complete') {
    const ranked = [...state.players].sort((a,b) => (a.bankrupt-b.bankrupt) || b.netWorth-a.netWorth);
    centerHint.innerHTML = `<strong>${t('gameOver')}.</strong> ${t('winner')}: ${escapeHtml(ranked[0]?.name || '—')}!`;
  } else if (reviewingTurn) {
    centerHint.textContent = '';
  } else if (pending?.playerId != null) {
    const who = state.players.find(p => p.id === pending.playerId);
    centerHint.textContent = who?.type === 'human' ? t('yourTurn') : t('waiting');
  } else centerHint.textContent = t('waiting');
  if (!eventStrip.textContent) eventStrip.textContent = describeEvent(lastEvents.at(-1)) || '';
}

function decisionMarkup(pending) {
  if (!packet?.state) return `<div class="decision-card"><p>${t('startHint')}</p><button class="primary" data-ui="new">${t('newGame')}</button></div>`;
  if (packet.state.status === 'complete') {
    const ranked=[...packet.state.players].sort((a,b)=>(a.bankrupt-b.bankrupt)||b.netWorth-a.netWorth);
    return `<div class="decision-card"><h3>🏆 ${t('gameOver')}</h3><p>${t('winner')}: <strong>${escapeHtml(ranked[0]?.name||'—')}</strong></p><div class="action-buttons"><button class="primary" data-ui="new">${t('newGame')}</button></div></div>`;
  }
  if (!pending) return `<div class="decision-card"><p>${t('waiting')}</p></div>`;
  const space = pending.index != null ? board.spaces[pending.index] : null;
  if (pending.type === 'ROLL_DICE') return `<div class="decision-card roll-decision-card"><h3>🎲 ${pending.extraRoll?t('extraRoll'):t('yourTurn')}</h3><div class="action-buttons"><button class="primary roll-button" data-action="ROLL_DICE">${t('roll')}</button></div></div>`;
  if (pending.type === 'DETENTION_ACTION') return `<div class="decision-card detention-decision-card"><h3>🏕️ ${t('detention')}</h3><p class="decision-prompt">${t('detentionHint')}</p><div class="decision-stats"><div class="decision-stat"><span>${t('payBase')}</span><strong>${money(pending.fee)}</strong></div></div><div class="action-buttons two"><button class="primary roll-button" data-action="ROLL_DICE">${t('roll')}</button><button class="secondary" data-action="PAY_DETENTION">${t('payBase')} · ${pending.fee}</button></div></div>`;
  if (pending.type === 'BUY_PROPERTY') return `<div class="decision-card buy-property-card"><div class="property-header"><h3>${escapeHtml(spaceName(space))}</h3>${worldBadge(space?.world)}</div><p class="decision-prompt">${t('buyQuestion')}</p><div class="decision-stats"><div class="decision-stat"><span>${t('price')}</span><strong>${money(space.price)}</strong></div><div class="decision-stat"><span>${t('rent')}</span><strong>${money(space.rents?.[0] ?? 0)}</strong></div></div><div class="action-buttons two"><button class="primary" data-action="BUY" ${pending.cash<space.price?'disabled':''}>${t('buy')} · ${space.price}</button><button class="secondary" data-action="AUCTION">${t('auction')}</button></div></div>`;
  if (pending.type === 'AUCTION_BIDS') {
    const bidder = pending.humanBidders?.[0];
    return `<div class="decision-card"><div class="property-header"><h3>🔨 ${t('auction')}: ${escapeHtml(spaceName(space))}</h3>${worldBadge(space?.world)}</div><label class="field"><span>${t('bid')} (${t('max')} ${bidder?.maxBid??0})</span><input id="auctionBid" inputmode="numeric" type="number" min="0" max="${bidder?.maxBid??0}" value="0"><small class="auction-hint">${t('auctionPass')}</small></label><div class="action-buttons"><button class="primary" data-action="RESOLVE_AUCTION">${t('resolveAuction')}</button></div></div>`;
  }
  if (pending.type === 'TURN_ACTIONS') {
    const a=pending.actions||{}; const canManage=(a.develop?.length||a.pledge?.length||a.redeem?.length||a.sellEmbellishment?.length);
    return `<div class="decision-card"><h3>${t('yourTurn')}</h3><div class="decision-stats"><div class="decision-stat"><span>${t('cash')}</span><strong>${money(packet.state.players.find(p=>p.id===pending.playerId)?.cash)}</strong></div></div><div class="action-buttons"><button class="secondary" data-ui="manage" ${canManage?'':'disabled'}>${t('manage')}</button><button class="secondary" data-ui="trade" ${a.tradeTargets?.length?'':'disabled'}>${t('trade')}</button><button class="primary" data-action="END_TURN">${t('endTurn')}</button></div></div>`;
  }
  if (pending.type === 'TURN_REVIEW') return '';
  if (pending.type === 'TRADE_OFFER') return tradeOfferMarkup(pending.proposal);
  return `<div class="decision-card"><p>${escapeHtml(pending.type)}</p></div>`;
}


function renderDecision() {
  const reviewingTurn = packet?.pendingDecision?.type === 'TURN_REVIEW';
  if (actionsTitle) {
    actionsTitle.textContent = t('yourMove');
    actionsTitle.hidden = reviewingTurn;
  }
  if (decisionEl) decisionEl.hidden = reviewingTurn;
  if (actionPanel) actionPanel.classList.toggle('review-mode', reviewingTurn);
  const html = reviewingTurn ? '' : decisionMarkup(packet?.pendingDecision);
  decisionEl.innerHTML = html;
  // While reviewing a completed CPU turn, mobileActions belongs to
  // renderTurnReview() instead (it holds the action-by-action list and the OK
  // button there). Clearing it here too would race with that render — this
  // function can run on its own (e.g. after a DICE_ROLLED event) without a
  // paired renderTurnReview() call, and clobbering mobileActions to '' left
  // the review permanently unreachable on narrow/mobile viewports.
  if (!reviewingTurn) mobileActions.innerHTML = `<div class="decision">${html}</div>`;
  for (const root of reviewingTurn ? [decisionEl] : [decisionEl,mobileActions]) {
    root.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => handleDecision(b.dataset.action, root)));
    root.querySelectorAll('[data-ui="new"]').forEach(b=>b.addEventListener('click',openSetup));
    root.querySelectorAll('[data-ui="manage"]').forEach(b=>b.addEventListener('click',openManage));
    root.querySelectorAll('[data-ui="trade"]').forEach(b=>b.addEventListener('click',openTrade));
  }
}


function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function movementPath(move) {
  const total = board?.spaces?.length || 0;
  if (!total) return [];
  const from = Number(move?.from);
  const to = ((Number(move?.to) % total) + total) % total;
  if (!Number.isFinite(from)) return [to];
  if (move?.type === 'SENT_TO_BASE') return [to];
  const amount = Number(move?.amount);
  if (Number.isFinite(amount) && amount !== 0 && Math.abs(amount) <= total) {
    const step = amount > 0 ? 1 : -1;
    const path = [];
    let pos = ((from % total) + total) % total;
    for (let i = 0; i < Math.abs(amount); i += 1) {
      pos = (pos + step + total) % total;
      path.push(pos);
    }
    if (path.at(-1) !== to) path.push(to);
    return path;
  }
  return [to];
}

function boardPointFor(index) {
  const boardRect = boardEl.getBoundingClientRect();
  const box = layoutBox(index);
  if (boardLayout && box?.tokenAnchor) {
    const [, , viewWidth, viewHeight] = boardLayout.viewBox;
    return {
      x: (box.tokenAnchor.x / viewWidth) * boardRect.width,
      y: (box.tokenAnchor.y / viewHeight) * boardRect.height,
    };
  }
  const spaceNode = boardEl.querySelector(`.space[data-index="${index}"]`);
  if (!spaceNode) return null;
  const rect = spaceNode.getBoundingClientRect();
  return {
    x: rect.left - boardRect.left + rect.width / 2,
    y: rect.top - boardRect.top + rect.height / 2,
  };
}

async function animateTokenMovement(move) {
  const player = packet?.state?.players?.find(p => p.id === move?.playerId);
  if (!player || !boardEl) return;
  activeMoveAnimationPlayerId = player.id;
  renderBoard();
  const fromPoint = boardPointFor(move.from);
  const path = movementPath(move);
  if (!fromPoint || !path.length) { activeMoveAnimationPlayerId = null; renderBoard(); return; }
  if (canAutoFollow()) centerBoardOnSpace(move.from, { behavior: 'smooth' });
  const shell = document.createElement('div');
  shell.className = 'moving-token-shell';
  shell.innerHTML = tokenHtml(player, 'moving-token');
  shell.style.left = `${fromPoint.x}px`;
  shell.style.top = `${fromPoint.y}px`;
  boardEl.append(shell);
  await wait(motionMs(60));
  let previousIndex = Number(move.from);
  for (let i = 0; i < path.length; i += 1) {
    const stepIndex = path[i];
    for (const waypoint of connectorWaypoints(previousIndex, stepIndex)) {
      shell.style.left = `${waypoint.x}px`;
      shell.style.top = `${waypoint.y}px`;
      await wait(motionMs(path.length > 10 ? 65 : 88));
    }
    const point = boardPointFor(stepIndex);
    if (!point) { previousIndex = stepIndex; continue; }
    shell.style.left = `${point.x}px`;
    shell.style.top = `${point.y}px`;
    if (canAutoFollow() && (i % 2 === 0 || i === path.length - 1)) centerBoardOnSpace(stepIndex, { behavior: 'smooth' });
    await wait(motionMs(path.length > 10 ? 95 : 130));
    previousIndex = stepIndex;
  }
  await wait(motionMs(120));
  shell.remove();
  activeMoveAnimationPlayerId = null;
  renderBoard();
  centerBoardOnSpace(move.to, { behavior: 'smooth' });
}

function renderAll() { renderBoard(); renderPlayers(); renderCenter(); renderDecision(); renderTurnReview(); renderRollTracker(); }

async function animatePacketEvents(events=[]) {
  if (events.length) {
    if (packet?.pendingDecision?.type === 'TURN_REVIEW') {
      hideTurnPopup();
      if (eventStrip) eventStrip.textContent = '';
    } else {
      enqueueCpuPopups(events);
      enqueueEventStripNotifications(events);
    }
  }
  const diceEvents = events.filter(event => event.type === 'DICE_ROLLED');
  if (diceEvents.length) {
    const lastDice = diceEvents.at(-1);
    lastRoll = lastDice;
    renderCenter();
    renderDecision();
    renderRollTracker();
    const latestRow = rollTrackerList?.querySelector('.roll-tracker-row.latest-roll');
    if (latestRow) {
      latestRow.classList.remove('roll-pop');
      void latestRow.offsetWidth;
      latestRow.classList.add('roll-pop');
      setTimeout(() => latestRow.classList.remove('roll-pop'), motionMs(650));
    }
  }
  const moves = events.filter(event => event.type === 'PLAYER_MOVED' || event.type === 'SENT_TO_BASE');
  for (const move of moves) {
    await animateTokenMovement(move);
    lastMovedPlayerId = move.playerId;
    renderBoard();
    const spaceNode = boardEl.querySelector(`.space[data-index="${move.to}"]`);
    if (spaceNode) {
      spaceNode.classList.add('arrival-pulse');
      setTimeout(() => spaceNode.classList.remove('arrival-pulse'), motionMs(650));
    }
    await wait(motionMs(180));
    lastMovedPlayerId = null;
    renderBoard();
  }
  const cashIds = new Set(events.filter(e => e.type === 'CASH_CHANGED').map(e => e.playerId));
  for (const id of cashIds) {
    document.querySelectorAll(`[data-player-id="${id}"]`).forEach(node => {
      node.classList.add('cash-flash');
      setTimeout(() => node.classList.remove('cash-flash'), motionMs(650));
    });
  }
  const trade = [...events].reverse().find(e => e.type === 'TRADE_ACCEPTED');
  if (trade) for (const id of [trade.traderId, trade.targetId]) {
    document.querySelectorAll(`[data-player-id="${id}"]`).forEach(node => {
      node.classList.add('trade-flash');
      setTimeout(() => node.classList.remove('trade-flash'), motionMs(700));
    });
  }
  followCurrentTurn(false);
}


function describeEvent(e) {
  if (!e) return '';
  const p=id=>packet?.state?.players?.find(x=>x.id===id)?.name ?? '—';
  const s=id=>spaceName(id);
  const signed = amount => `${amount > 0 ? '+' : ''}${amount}`;
  switch(e.type) {
    case 'TURN_STARTED': return `▶ ${p(e.playerId)}`;
    case 'TURN_ENDED': return `⏹ ${p(e.playerId)}`;
    case 'DICE_ROLLED': return `${p(e.playerId)} · 🎲 ${e.a} + ${e.b} = ${e.total}${e.doubles?' · ×2':''}`;
    case 'PLAYER_MOVED': return `👣 ${p(e.playerId)} → ${s(board?.spaces?.[e.to]?.id || e.spaceId || e.to)}`;
    case 'SPACE_LANDED': return `📍 ${p(e.playerId)} · ${s(e.spaceId)}`;
    case 'START_PASSED': return `🏁 ${p(e.playerId)} · ${signed(e.amount || 0)} 🪙`;
    case 'PROPERTY_ACQUIRED': return `${p(e.playerId)} · 🏷️ ${s(e.spaceId)} · ${e.price} 🪙`;
    case 'PROPERTY_TRANSFERRED': return `🔁 ${p(e.fromPlayerId)} → ${p(e.toPlayerId)} · ${s(e.spaceId)}`;
    case 'PROPERTY_PLEDGED': return `⛓️ ${p(e.playerId)} · ${s(e.spaceId)}`;
    case 'PROPERTY_REDEEMED': return `🔓 ${p(e.playerId)} · ${s(e.spaceId)}`;
    case 'PAYMENT': return `💸 ${p(e.playerId)} · ${e.amount} 🪙`;
    case 'CASH_CHANGED': return `🪙 ${p(e.playerId)} · ${signed(e.amount || 0)}${Number.isFinite(e.balance) ? ` · ${e.balance}` : ''}`;
    case 'RENT_DUE': return `💰 ${p(e.playerId)} → ${p(e.ownerId)} · ${e.amount} 🪙`;
    case 'AUCTION_ENDED': return e.winnerId==null?`🔨 ${s(e.spaceId)} · —`:`🔨 ${p(e.winnerId)} · ${s(e.spaceId)} · ${e.price} 🪙`;
    case 'CARD_DRAWN': return `🃏 ${p(e.playerId)} · ${locale.events?.[e.cardId]?.title ?? e.cardId}`;
    case 'EMBELLISHMENT_BUILT': return `⬆ ${p(e.playerId)} · ${s(e.spaceId)}`;
    case 'EMBELLISHMENT_SOLD': return `⬇ ${p(e.playerId)} · ${s(e.spaceId)}`;
    case 'EMBELLISHMENT_GRANTED': return `✨ ${p(e.playerId)} · ${s(e.spaceId)}`;
    case 'EMBELLISHMENT_LOST': return `⚠ ${p(e.playerId)} · ${s(e.spaceId)}`;
    case 'TRADE_PROPOSED': return `🤝 ${p(e.traderId)} ↔ ${p(e.targetId)}`;
    case 'TRADE_ACCEPTED': return `✅ ${p(e.traderId)} ↔ ${p(e.targetId)}`;
    case 'TRADE_DECLINED': return `↩ ${p(e.traderId)} ↔ ${p(e.targetId)}`;
    case 'SENT_TO_BASE': return `🏕️ ${p(e.playerId)} → ${spaceName('base-camp')}`;
    case 'PLAYER_BANKRUPT': return `☁ ${p(e.playerId)} · ${t('bankrupt')}`;
    case 'GAME_ENDED': return `🏆 ${p(e.winnerId)}`;
    default: return '';
  }
}

function processPacket(nextPacket,{showCards=true}={}) {
  packet=nextPacket;
  const events = packet.events || [];
  lastEvents = [...lastEvents,...events].slice(-40);
  activeMoveAnimationPlayerId = null;
  lastMovedPlayerId = null;
  for (const e of events) {
    if (e.type==='DICE_ROLLED') { lastRoll=e; latestRollsByPlayer.set(e.playerId, { ...e }); }
    if (e.type==='CARD_DRAWN' && packet.state.players.find(p=>p.id===e.playerId)?.type==='human') latestCard=e;
  }
  renderAll();
  requestAnimationFrame(() => animatePacketEvents(events));
  if (showCards && latestCard) {
    const cardEvent=latestCard; latestCard=null;
    showCard(cardEvent);
  }
  autosaveGame();
}

function handleDecision(type,root) {
  if (!controller) return;
  try {
    let action={type};
    if (type==='RESOLVE_AUCTION') {
      const input=root.querySelector('#auctionBid') || document.querySelector('#auctionBid');
      const human=packet.pendingDecision.humanBidders?.[0];
      action.bids={ [human.playerId]: Math.max(0,Number(input?.value||0)) };
    }
    const next=controller.dispatch(action); processPacket(next);
  } catch(err) { toast(err.message); }
}

function showCard(event) {
  const card=locale.events?.[event.cardId]; if (!card) return;
  const adv=event.deck==='avventure';
  el('cardContent').innerHTML=`<div class="card-art ${adv?'adventure':'setback'}"><span class="card-symbol-img board-icon-mask card-symbol-mask" style="--icon-url:url('../../assets/third_party/kenney/board-icons/hexagon_question.png')" aria-hidden="true"></span><div class="card-kicker">${adv?t('cardAdventure'):t('cardSetback')}</div><h2>${escapeHtml(card.title)}</h2><p>${escapeHtml(card.text)}</p><button class="primary" id="closeCard" autofocus>${t('continue')}</button></div>`;
  el('closeCard').onclick=()=>cardDialog.close();
  if (!cardDialog.open) cardDialog.showModal();
}


function currentHoldingRent(index, owner) {
  const space = board?.spaces?.[index];
  const st = packet?.state?.spaces?.[index];
  if (!space || !st || !owner || st.pledged) return t('notCollecting');

  if (space.type === 'site' && Array.isArray(space.rents)) {
    const level = Math.min(st.embellishments || 0, space.rents.length - 1);
    let amount = space.rents[level] ?? 0;
    if (level === 0) {
      const group = board.spaces.map((s,i)=>({s,i})).filter(item => item.s.group === space.group);
      const complete = group.length > 0 && group.every(item => packet.state.spaces[item.i].owner === owner.id && !packet.state.spaces[item.i].pledged);
      if (complete) amount *= 2;
    }
    return `${amount} 🪙`;
  }

  if (space.type === 'hub' && Array.isArray(space.rents)) {
    const count = board.spaces.reduce((total,s,i) => total + (s.type === 'hub' && packet.state.spaces[i].owner === owner.id && !packet.state.spaces[i].pledged ? 1 : 0), 0);
    const level = Math.max(0, Math.min(count - 1, space.rents.length - 1));
    return `${space.rents[level] ?? 0} 🪙`;
  }

  if (space.type === 'service' && Array.isArray(space.factors)) {
    const count = board.spaces.reduce((total,s,i) => total + (s.type === 'service' && packet.state.spaces[i].owner === owner.id && !packet.state.spaces[i].pledged ? 1 : 0), 0);
    const level = Math.max(0, Math.min(count - 1, space.factors.length - 1));
    return tf('diceMultiplier', { n: space.factors[level] ?? 0 });
  }

  return t('notCollecting');
}

function holdingIcon(space, index) {
  const asset = assetFor(space, index);
  if (asset) return `<img src="${asset}" alt="">`;
  if (space.type === 'site') return inlineBoardIcon('notepad');
  return `<span aria-hidden="true">${space.type === 'hub' ? '🌀' : '🛠️'}</span>`;
}

function holdingRow(player, index) {
  const space = board.spaces[index];
  const st = packet.state.spaces[index];
  const statuses = [];
  if (st.pledged) statuses.push(`<span class="holding-status pledge"><img class="pledge-chain" src="assets/third_party/kenney/chain.png" alt=""> ${escapeHtml(t('pledged'))}</span>`);
  if (st.embellishments) statuses.push(`<span class="holding-status">⬆ ${st.embellishments}</span>`);
  const price = Number.isFinite(space.price) ? `<span>${escapeHtml(t('price'))}: ${money(space.price)}</span>` : '';
  const rent = `<span>${escapeHtml(t('currentRent'))}: <strong>${escapeHtml(currentHoldingRent(index, player))}</strong></span>`;
  return `<button class="holding-row" type="button" data-holding-index="${index}" style="--holding-world:${worldAccent(space.world)}">
    <span class="holding-icon">${holdingIcon(space,index)}</span>
    <span class="holding-copy">
      <strong>${escapeHtml(spaceName(space))}</strong>
      <small>${price}${rent}</small>
    </span>
    <span class="holding-statuses">${statuses.join('')}</span>
  </button>`;
}

function showPlayerHoldings(playerId) {
  const player = playerById(playerId);
  if (!player || !packet?.state) return;
  inspectedPlayerId = player.id;
  renderBoard();

  const owned = board.spaces
    .map((space,index) => ({ space, index, st: packet.state.spaces[index] }))
    .filter(item => item.st.owner === player.id);

  const sections = [];
  for (const world of board.worlds) {
    const items = owned.filter(item => item.space.world === world.id);
    if (!items.length) continue;
    const worldSites = board.spaces.filter(space => space.type === 'site' && space.world === world.id).length;
    const ownedSites = items.filter(item => item.space.type === 'site').length;
    sections.push(`<section class="holding-group">
      <div class="holding-group-head">${worldBadge(world.id)}<span>${ownedSites}/${worldSites}</span></div>
      <div class="holding-list">${items.map(item => holdingRow(player,item.index)).join('')}</div>
    </section>`);
  }

  const special = owned.filter(item => !item.space.world);
  if (special.length) {
    sections.push(`<section class="holding-group">
      <div class="holding-group-head"><strong>${escapeHtml(t('specialPlaces'))}</strong><span>${special.length}</span></div>
      <div class="holding-list">${special.map(item => holdingRow(player,item.index)).join('')}</div>
    </section>`);
  }

  const token = tokenHtml(player, 'holdings-token');
  el('manageContent').innerHTML = `<div class="player-holdings-head">${token}<div><h2>${escapeHtml(tf('playerHoldingsTitle',{name:player.name}))}</h2><p>${escapeHtml(t('cash'))}: <strong>${player.cash}</strong> · ${escapeHtml(t('worth'))}: <strong>${player.netWorth}</strong></p></div></div>
    <div class="holding-groups">${sections.join('') || `<p class="holding-empty">${escapeHtml(t('noProperties'))}</p>`}</div>
    <div class="dialog-actions"><button class="primary" id="closeHoldings">${escapeHtml(t('close'))}</button></div>`;

  el('manageContent').querySelectorAll('[data-holding-index]').forEach(button => {
    button.addEventListener('click', () => showSpaceInfo(Number(button.dataset.holdingIndex)));
  });
  el('closeHoldings').onclick = () => manageDialog.close();
  if (!manageDialog.open) manageDialog.showModal();
}

function showSpaceInfo(index) {
  if (!board) return;
  const space=board.spaces[index], st=packet?.state?.spaces?.[index];
  const owner=st?.owner!=null?packet.state.players.find(p=>p.id===st.owner):null;
  const rows=[];
  if(space.world) rows.push([t('world'), worldBadge(space.world)]);
  if(Number.isFinite(space.price)) rows.push([t('price'), `${space.price} 🪙`]);
  if(Number.isFinite(space.buildCost)) rows.push([t('embellishmentCost'), `${space.buildCost} 🪙`]);
  if(Number.isFinite(space.price)) rows.push([t('owner'), owner?escapeHtml(owner.name):t('unowned')]);
  if(st && Number.isFinite(st.embellishments)) rows.push([t('embellishments'), String(st.embellishments)]);
  if(Number.isFinite(space.price)) rows.push([t('pledgeStatus'), st?.pledged?t('yes'):t('no')]);

  let currentRent = null;
  let schedule = [];
  let scheduleNote = '';
  if (space.type === 'site' && Array.isArray(space.rents)) {
    const level=Math.min(st?.embellishments||0,space.rents.length-1);
    let active=space.rents[level]??0;
    if (owner && !st?.pledged && level===0) {
      const group=board.spaces.map((s,i)=>({s,i})).filter(x=>x.s.group===space.group);
      const complete=group.length>0 && group.every(x=>packet.state.spaces[x.i].owner===owner.id && !packet.state.spaces[x.i].pledged);
      if (complete) active*=2;
    }
    currentRent=owner&&!st?.pledged?`${active} 🪙`:t('notCollecting');
    schedule=space.rents.map((amount,levelIndex)=>({
      label:levelIndex===0?t('baseLevel'):tf(levelIndex===1?'embellishmentLevel':'embellishmentLevels',{n:levelIndex}),
      value:`${amount} 🪙`,
      active:owner&&!st?.pledged&&levelIndex===level
    }));
    scheduleNote=t('completeWorldBonus');
  } else if (space.type === 'hub' && Array.isArray(space.rents)) {
    let ownedCount=0;
    if(owner) ownedCount=board.spaces.reduce((count,s,i)=>count+(s.type==='hub'&&packet.state.spaces[i].owner===owner.id&&!packet.state.spaces[i].pledged?1:0),0);
    const level=Math.max(0,Math.min(ownedCount-1,space.rents.length-1));
    currentRent=owner&&!st?.pledged?`${space.rents[level]} 🪙`:t('notCollecting');
    schedule=space.rents.map((amount,i)=>({label:tf(i===0?'portalOwnedLevel':'portalsOwnedLevel',{n:i+1}),value:`${amount} 🪙`,active:owner&&!st?.pledged&&i===level}));
  } else if (space.type === 'service' && Array.isArray(space.factors)) {
    let ownedCount=0;
    if(owner) ownedCount=board.spaces.reduce((count,s,i)=>count+(s.type==='service'&&packet.state.spaces[i].owner===owner.id&&!packet.state.spaces[i].pledged?1:0),0);
    const level=Math.max(0,Math.min(ownedCount-1,space.factors.length-1));
    currentRent=owner&&!st?.pledged?tf('diceMultiplier',{n:space.factors[level]}):t('notCollecting');
    schedule=space.factors.map((factor,i)=>({label:tf(i===0?'specialOwnedLevel':'specialsOwnedLevel',{n:i+1}),value:tf('diceMultiplier',{n:factor}),active:owner&&!st?.pledged&&i===level}));
  }
  if(currentRent!==null) rows.push([t('currentRent'), `<strong class="current-rent">${escapeHtml(currentRent)}</strong>`]);

  const details=rows.map(([k,v])=>`<dt>${escapeHtml(k)}</dt><dd>${v}</dd>`).join('');
  const rentTable=schedule.length?`<section class="rent-card"><h3>${escapeHtml(t('rentByLevel'))}</h3><div class="rent-levels">${schedule.map(item=>`<div class="rent-level ${item.active?'is-current':''}"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`).join('')}</div>${scheduleNote?`<p class="rent-note">${escapeHtml(scheduleNote)}</p>`:''}</section>`:'';
  el('manageContent').innerHTML=`<div class="dialog-head"><div class="dialog-title-stack"><h2>${escapeHtml(spaceName(space))}</h2>${worldBadge(space.world)}</div><p>${t('placeInfo')}</p></div><dl class="space-info-grid">${details}</dl>${rentTable}<div class="dialog-actions"><button class="primary" id="closeInfo" autofocus>${t('close')}</button></div>`;
  el('closeInfo').onclick=()=>manageDialog.close(); manageDialog.showModal();
}

function openManage() {
  inspectedPlayerId = null;
  renderBoard();
  const pending=packet?.pendingDecision; if (pending?.type!=='TURN_ACTIONS') return;
  const actions=pending.actions||{};
  const byIndex={};
  for (const a of actions.develop||[]) (byIndex[a.index]??={}).develop=a;
  for (const a of actions.pledge||[]) (byIndex[a.index]??={}).pledge=a;
  for (const a of actions.redeem||[]) (byIndex[a.index]??={}).redeem=a;
  for (const a of actions.sellEmbellishment||[]) (byIndex[a.index]??={}).sellEmbellishment=a;
  const rows=Object.entries(byIndex).map(([idx,ops])=>{
    const index=Number(idx), space=board.spaces[index], st=packet.state.spaces[index];
    return `<div class="manage-row"><div><div class="manage-place-head"><strong>${escapeHtml(spaceName(space))}</strong>${worldBadge(space.world, true)}</div><small>${st.embellishments?`${st.embellishments} ${locale.terms.development}`:''}${st.pledged?` · ${t('pledged')}`:''}</small></div><div class="manage-actions">${ops.develop?`<button class="small-action" data-manage="BUILD_EMBELLISHMENT" data-index="${index}">${t('embellish')} · ${ops.develop.cost}</button>`:''}${ops.pledge?`<button class="small-action" data-manage="PLEDGE_PROPERTY" data-index="${index}">${t('pledge')} +${ops.pledge.proceeds}</button>`:''}${ops.redeem?`<button class="small-action" data-manage="REDEEM_PROPERTY" data-index="${index}">${t('redeem')} ${ops.redeem.cost}</button>`:''}${ops.sellEmbellishment?`<button class="small-action" data-manage="SELL_EMBELLISHMENT" data-index="${index}">${t('sellEmbellishment')} +${ops.sellEmbellishment.proceeds}</button>`:''}</div></div>`;
  }).join('');
  el('manageContent').innerHTML=`<h2>${t('manageTitle')}</h2><div class="manage-list">${rows||`<p>${t('noActions')}</p>`}</div><div class="dialog-actions"><button class="secondary" id="closeManage">${t('close')}</button></div>`;
  el('closeManage').onclick=()=>manageDialog.close();
  el('manageContent').querySelectorAll('[data-manage]').forEach(b=>b.onclick=()=>{ try{const next=controller.dispatch({type:b.dataset.manage,index:Number(b.dataset.index)});manageDialog.close();processPacket(next);}catch(err){toast(err.message);} });
  manageDialog.showModal();
}

function isTradeable(index,ownerId) {
  const space=board.spaces[index], st=packet.state.spaces[index];
  if (st.owner!==ownerId || st.pledged) return false;
  if (space.type!=='site') return true;
  const group=board.spaces.map((s,i)=>({s,i})).filter(x=>x.s.group===space.group);
  return !group.some(x=>packet.state.spaces[x.i].embellishments>0);
}
function tradePropertyList(playerId,prefix) {
  const player=packet.state.players.find(p=>p.id===playerId); if(!player)return'';
  return player.properties.filter(i=>isTradeable(i,playerId)).map(i=>`<label class="trade-place-option"><input type="checkbox" name="${prefix}" value="${i}"> ${placeLineItem(board.spaces[i], true)}</label>`).join('') || `<small>${t('noActions')}</small>`;
}
function tradeResultItems(ids, cashAmount=0) {
  const entries = (ids || []).map(index => `<div class="trade-result-item">${placeLineItem(board.spaces[index], true)}</div>`);
  if (cashAmount > 0) entries.push(`<div class="trade-result-item trade-result-cash">🪙 ${cashAmount}</div>`);
  return entries.length ? entries.join('') : '<div class="trade-result-empty">—</div>';
}

function showHumanTradeResult(summary, nextPacket) {
  if (!summary || !tradeResultDialog || !tradeResultContent) return;
  const events = nextPacket?.events || [];
  const result = [...events].reverse().find(event =>
    (event.type === 'TRADE_ACCEPTED' || event.type === 'TRADE_DECLINED') &&
    event.traderId === summary.traderId && event.targetId === summary.targetId
  );
  if (!result) return;
  const accepted = result.type === 'TRADE_ACCEPTED';
  const target = nextPacket.state?.players?.find(player => player.id === summary.targetId);
  const targetName = target?.name || '—';
  const title = accepted ? t('tradeAcceptedTitle') : t('tradeDeclinedTitle');
  const message = tf(accepted ? 'tradeAcceptedMessage' : 'tradeDeclinedMessage', { name: targetName });
  const giveCash = summary.cash > 0 ? summary.cash : 0;
  const receiveCash = summary.cash < 0 ? -summary.cash : 0;
  tradeResultContent.innerHTML = `<div class="trade-result-card ${accepted?'accepted':'declined'}">
    <div class="trade-result-symbol" aria-hidden="true">${accepted?'✅':'↩️'}</div>
    <h2>${escapeHtml(title)}</h2>
    <p class="trade-result-message">${escapeHtml(message)}</p>
    <section class="trade-result-summary">
      <h3>${escapeHtml(t('tradeResultSummary'))}</h3>
      <div class="trade-result-columns">
        <div><strong>${escapeHtml(t('tradeYouGive'))}</strong><div class="trade-result-items">${tradeResultItems(summary.give, giveCash)}</div></div>
        <div><strong>${escapeHtml(t('tradeYouReceive'))}</strong><div class="trade-result-items">${tradeResultItems(summary.receive, receiveCash)}</div></div>
      </div>
    </section>
    <div class="dialog-actions"><button class="primary" id="closeTradeResult" autofocus>${escapeHtml(t('close'))}</button></div>
  </div>`;
  el('closeTradeResult').onclick=()=>tradeResultDialog.close();
  if (!tradeResultDialog.open) tradeResultDialog.showModal();
}

function openTrade() {
  const pending=packet?.pendingDecision; if(pending?.type!=='TURN_ACTIONS')return;
  const me=packet.state.players.find(p=>p.id===pending.playerId); const targets=pending.actions.tradeTargets||[];
  if(!targets.length)return;
  el('tradeContent').innerHTML=`<h2>${t('tradeTitle')}</h2><label class="field"><span>${t('target')}</span><select id="tradeTarget">${targets.map(x=>`<option value="${x.playerId}">${escapeHtml(x.name)}</option>`).join('')}</select></label><div id="tradeLists"></div><fieldset class="cash-trade"><legend>${t('cashOffer')}</legend><label class="field"><span>${t('cashDirection')}</span><select id="tradeCashDirection"><option value="give">${t('cashFromYou')}</option><option value="receive">${t('cashFromThem')}</option></select></label><label class="field"><span>${t('cashAmount')}</span><input id="tradeCash" type="number" value="0" min="0" step="1"></label></fieldset><p class="form-error" id="tradeError"></p><div class="dialog-actions"><button class="secondary" id="closeTrade">${t('cancel')}</button><button class="primary" id="sendTrade">${t('propose')}</button></div>`;
  const targetSelect=el('tradeTarget'), cashDirection=el('tradeCashDirection'), cashInput=el('tradeCash');
  const redraw=()=>{const targetId=Number(targetSelect.value);el('tradeLists').innerHTML=`<div class="trade-columns"><div><strong>${t('tradeYouGive')}</strong><div class="trade-box">${tradePropertyList(me.id,'give')}</div></div><div><strong>${t('tradeYouReceive')}</strong><div class="trade-box">${tradePropertyList(targetId,'receive')}</div></div></div>`; const targetCash=packet.state.players.find(p=>p.id===targetId)?.cash||0; cashInput.max=cashDirection.value==='give'?me.cash:targetCash; if(Number(cashInput.value)>Number(cashInput.max)) cashInput.value=cashInput.max;}; redraw(); targetSelect.onchange=redraw; cashDirection.onchange=redraw;
  el('closeTrade').onclick=()=>tradeDialog.close();
  el('sendTrade').onclick=()=>{try{const targetId=Number(targetSelect.value);const give=[...el('tradeContent').querySelectorAll('input[name="give"]:checked')].map(x=>Number(x.value));const receive=[...el('tradeContent').querySelectorAll('input[name="receive"]:checked')].map(x=>Number(x.value));const amount=Math.max(0,Number(cashInput.value||0));const cash=cashDirection.value==='give'?amount:-amount;const traderId=me.id;const summary={traderId,targetId,give,receive,cash};const next=controller.dispatch({type:'PROPOSE_TRADE',targetId,traderToGive:give,targetToGive:receive,cash});tradeDialog.close();processPacket(next);showHumanTradeResult(summary,next);}catch(err){el('tradeError').textContent=err.message;}};
  tradeDialog.showModal();
}

function tradeItemsMarkup(ids) {
  if (!ids?.length) return '<span class="trade-empty">—</span>';
  return `<div class="trade-items-list">${ids.map(i => `<div class="trade-item">${placeLineItem(board.spaces[i], true)}</div>`).join('')}</div>`;
}

function tradeOfferMarkup(proposal) {
  if(!proposal)return'';
  const trader=packet.state.players.find(p=>p.id===proposal.traderId), target=packet.state.players.find(p=>p.id===proposal.targetId);
  const cash=proposal.traderGivesCash;
  return `<div class="decision-card"><h3>🤝 ${t('tradeOffer')}</h3><div class="trade-offer-side"><strong>${escapeHtml(trader?.name||'—')}</strong>${tradeItemsMarkup(proposal.traderToGive)}${cash>0?`<div class="trade-cash-line">+ ${cash} 🪙</div>`:''}</div><div class="trade-offer-side"><strong>${escapeHtml(target?.name||'—')}</strong>${tradeItemsMarkup(proposal.targetToGive)}${cash<0?`<div class="trade-cash-line">+ ${-cash} 🪙</div>`:''}</div><div class="action-buttons two"><button class="primary" data-action="ACCEPT_TRADE">${t('accept')}</button><button class="secondary" data-action="DECLINE_TRADE">${t('decline')}</button></div></div>`;
}


function howToPlayMarkup(data) {
  const { content, manifest } = data;
  const sections = manifest.sections.map((id, idx) => {
    const section = content.sections[id];
    const paragraphs = section.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    return `<details class="help-section" ${idx === 0 ? 'open' : ''}><summary>${escapeHtml(section.title)}</summary><div class="help-section-body">${paragraphs}</div></details>`;
  }).join('');
  return `<div class="help-shell"><header class="help-head"><div><h2>${escapeHtml(content.title)}</h2><p>${escapeHtml(content.subtitle)}</p></div><button class="icon-button help-close" id="closeHelp" type="button" aria-label="${escapeHtml(t('close'))}">×</button></header><div class="help-body" tabindex="0">${sections}</div><footer class="help-footer"><button class="danger help-clear-data" id="clearLocalDataBtn" type="button">${escapeHtml(t('clearLocalData'))}</button><button class="primary" id="doneHelp" type="button">${escapeHtml(t('close'))}</button></footer></div>`;
}

async function refreshHowToPlay() {
  howToPlay = await loadHowToPlay(language);
  helpContent.innerHTML = howToPlayMarkup(howToPlay);
  el('closeHelp').onclick = () => helpDialog.close();
  el('doneHelp').onclick = () => helpDialog.close();
  el('clearLocalDataBtn').onclick = clearLocalData;
}

async function openHowToPlay() {
  try {
    if (!howToPlay || howToPlay.locale !== language) await refreshHowToPlay();
    if (!helpDialog.open) helpDialog.showModal();
    requestAnimationFrame(() => helpContent.querySelector('.help-body')?.focus());
  } catch (err) {
    console.error(err);
    toast(t('howToPlayError'));
  }
}


function createInternalSeed() {
  // The deterministic seed is an implementation detail: useful for saves, replay and tests,
  // but deliberately hidden from the normal game setup.
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return (values[0] & 0x7fffffff) || 1;
  }
  return ((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) & 0x7fffffff) || 1;
}

function setupLabels() {
  el('setupTitle').textContent=t('setupTitle'); el('setupSubtitle').textContent=t('setupSubtitle'); el('nameLabel').textContent=t('yourName'); el('cpuLegend').textContent=t('opponents'); el('cancelSetup').textContent=t('cancel'); el('startGame').textContent=t('play');
  for (const [id,key] of [['saveBtn','save'],['loadBtn','load'],['newBtn','newGame']]) { const b=el(id); b.title=t(key); b.setAttribute('aria-label',t(key)); }
}
function friendProfile(name) {
  return { data: aiProfiles?.byId?.[name] ?? null, copy: aiProfiles?.content?.players?.[name] ?? null };
}
function openFriendProfile(name) {
  const { data, copy } = friendProfile(name);
  if (!data || !copy || !friendDialog || !friendContent) return;
  const asset = cpuTokenAsset(name);
  const tags = (data.tags || []).map(tag => aiProfiles.content.tags?.[tag]).filter(Boolean);
  const ratings = data.ratings ? Object.entries(data.ratings).map(([key,value]) => {
    const label = aiProfiles.content.ratings?.[key] || key;
    const n = Math.max(0, Math.min(5, Number(value)));
    return `<div class="friend-rating"><span>${escapeHtml(label)}</span><strong aria-label="${n} / 5">${'★'.repeat(n)}${'☆'.repeat(5-n)}</strong></div>`;
  }).join('') : '';
  friendContent.innerHTML = `<div class="friend-card"><header class="friend-card-head"><span class="friend-card-token" style="--token:${TOKEN_COLORS[(CPU_NAMES.indexOf(name)+2)%TOKEN_COLORS.length]}">${asset?`<img src="${asset}" alt="">`:escapeHtml(name.slice(0,2).toUpperCase())}</span><div><p class="friend-eyebrow">${escapeHtml(aiProfiles.content.friendOf)}</p><h2>${escapeHtml(name)}</h2><strong>${escapeHtml(copy.label)}</strong></div><button type="button" class="icon-button friend-card-close" aria-label="${escapeHtml(t('close'))}">×</button></header><p class="friend-description">${escapeHtml(copy.description)}</p><section><h3>${escapeHtml(aiProfiles.content.strengths)}</h3><div class="friend-tags">${tags.map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div></section>${ratings?`<section><h3>${escapeHtml(aiProfiles.content.ratingsTitle || '')}</h3><div class="friend-ratings">${ratings}</div></section>`:''}<section class="friend-best"><h3>${escapeHtml(aiProfiles.content.bestFor)}</h3><p>${escapeHtml(copy.bestFor)}</p></section><div class="dialog-actions"><button type="button" class="primary friend-done">${escapeHtml(t('close'))}</button></div></div>`;
  friendContent.querySelector('.friend-card-close').onclick=()=>friendDialog.close();
  friendContent.querySelector('.friend-done').onclick=()=>friendDialog.close();
  if (!friendDialog.open) friendDialog.showModal();
}
function renderCpuChoices() {
  el('cpuChoices').innerHTML=CPU_NAMES.map((name,i)=>{
    const asset=cpuTokenAsset(name);
    const copy=friendProfile(name).copy;
    return `<div class="cpu-choice-wrap" style="--token:${TOKEN_COLORS[(i+2)%TOKEN_COLORS.length]}"><label class="cpu-choice"><input type="checkbox" value="${escapeHtml(name)}" ${['Zilla','Queen','Hans'].includes(name)?'checked':''}><span class="cpu-dot">${asset?`<img src="${asset}" alt="">`:escapeHtml(name.slice(0,2).toUpperCase())}</span><span class="cpu-choice-copy"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(copy?.label || '')}</small></span></label><button class="cpu-info" type="button" data-friend="${escapeHtml(name)}" aria-label="${escapeHtml(t('friendInfo'))}: ${escapeHtml(name)}">ⓘ</button></div>`;
  }).join('');
  el('cpuChoices').querySelectorAll('[data-friend]').forEach(button=>button.onclick=()=>openFriendProfile(button.dataset.friend));
}
function openSetup() {
  el('setupError').textContent=''; renderCpuChoices(); setupLabels(); if(!setupDialog.open)setupDialog.showModal();
}
function startGameFromSetup() {
  const cpus=[...el('cpuChoices').querySelectorAll('input:checked')].map(x=>x.value); if(!cpus.length){el('setupError').textContent=t('chooseOpponent');return;} if(cpus.length>7){el('setupError').textContent=t('tooManyOpponents');return;}
  const name=el('humanName').value.trim()||'Grugnetto'; const seed=createInternalSeed();
  const participants=[{type:'human',name},...cpus.map(profile=>({type:'cpu',profile,name:profile}))];
  resetCpuPopupQueue();
  tintedPlayerIds.clear();
  clearAutosave();
  controller=GameController.create({board,participants,seed,maxTurns:6000}); lastEvents=[];lastRoll=null;latestCard=null; latestRollsByPlayer = new Map(); setupDialog.close(); processPacket(controller.advance());
}

function clearAutosave() {
  storage.remove(AUTOSAVE_KEY);
}

function clearLocalData() {
  if (!globalThis.confirm(t('clearLocalDataConfirm'))) return false;
  suppressAutosave = true;
  controller = null;
  packet = null;
  recoveryCandidate = null;
  for (const key of LOCAL_STORAGE_KEYS) storage.remove(key);
  globalThis.location.reload();
  return true;
}

function autosaveGame() {
  if (suppressAutosave || !controller) return false;
  try {
    const state = controller.getPublicState();
    if (state.status === 'complete') {
      clearAutosave();
      return false;
    }
    return storage.set(AUTOSAVE_KEY, serializeSave(controller));
  } catch (err) {
    console.warn('Could not autosave game state', err);
    return false;
  }
}

function restoreController(restored, { notify = true } = {}) {
  resetCpuPopupQueue();
  tintedPlayerIds.clear();
 
  controller=restored;
  lastEvents=[];
  lastRoll=null;
  latestCard=null;
  latestRollsByPlayer = new Map();
  packet={
    status:controller.status,
    pendingDecision:structuredClone(controller.pendingDecision),
    events:controller.game.drainEvents(),
    state:controller.getPublicState()
  };
  renderAll();
  followCurrentTurn(true);
  autosaveGame();
  if (notify) toast(t('loaded'));
}

function saveGame() {
  if(!controller){toast(t('saveUnavailable'));return;}
  try {
    if (!storage.set(SAVE_KEY,serializeSave(controller))) throw new Error('Storage unavailable');
    autosaveGame();
    toast(t('saved'));
    announce(t('savedGame'));
  } catch(err) {
    console.warn('Manual save failed',err);
    toast(t('saveError'));
  }
}

function loadGame() {
  const json=storage.get(SAVE_KEY);
  if(!json){toast(t('noSave'));return;}
  try {
    const restored=deserializeSave({board,json});
    restoreController(restored);
  } catch(err) {
    console.error(err);
    toast(t('loadCorrupt'));
  }
}

function recoverySummaryMarkup(state) {
  const current=state.players.find(player=>player.id===state.currentPlayerId);
  const names=state.players.map(player=>escapeHtml(player.name)).join(' · ');
  return `<div class="recovery-card">
    <div class="recovery-symbol" aria-hidden="true">↩</div>
    <h2>${escapeHtml(t('recoveryTitle'))}</h2>
    <p>${escapeHtml(t('recoveryText'))}</p>
    <div class="recovery-meta"><strong>${escapeHtml(tf('recoverySummary',{round:state.roundNumber,players:state.players.length}))}</strong>${current?`<span>${escapeHtml(tf('recoveryTurn',{name:current.name}))}</span>`:''}<small>${names}</small></div>
    <div class="dialog-actions recovery-actions"><button class="secondary" id="recoveryNewGame" type="button">${escapeHtml(t('recoveryNew'))}</button><button class="primary" id="recoveryResume" type="button">${escapeHtml(t('recoveryResume'))}</button></div>
  </div>`;
}

function startFreshFromRecovery() {
  clearAutosave();
  recoveryCandidate=null;
  if (recoveryDialog.open) recoveryDialog.close();
  openSetup();
}

function resumeRecoveredGame() {
  if (!recoveryCandidate) return startFreshFromRecovery();
  const restored=recoveryCandidate.controller;
  recoveryCandidate=null;
  if (recoveryDialog.open) recoveryDialog.close();
  restoreController(restored);
}

function offerRecoveryOrSetup() {
  const json=storage.get(AUTOSAVE_KEY);
  if (!json) { openSetup(); return; }
  try {
    const restored=deserializeSave({board,json});
    const state=restored.getPublicState();
    if (state.status === 'complete') {
      clearAutosave();
      openSetup();
      return;
    }
    recoveryCandidate={ controller:restored, state };
    recoveryContent.innerHTML=recoverySummaryMarkup(state);
    el('recoveryResume').onclick=resumeRecoveredGame;
    el('recoveryNewGame').onclick=startFreshFromRecovery;
    if (!recoveryDialog.open) recoveryDialog.showModal();
  } catch (err) {
    console.warn('Ignoring invalid autosave', err);
    clearAutosave();
    openSetup();
  }
}

function escapeHtml(value) { return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

async function loadLocale(code) { const r=await fetch(`${boardEntry.i18nBase}/${code}.json`);if(!r.ok)throw new Error(`Locale ${code} HTTP ${r.status}`);return r.json(); }
async function boot() {
  const [rr,pr]=await Promise.all([fetch('boards/index.json'),fetch('config/pawns.json')]); registry=await rr.json(); pawnConfig=await pr.json(); boardEntry=registry.boards.find(x=>x.id===registry.defaultBoard); const br=await fetch(boardEntry.path);board=await br.json();
  boardLayout=await loadBoardLayout();
  tileShapes = await loadTileOutlines(boardLayout);
  setupBoardShapeHitTesting();
  boardNumberEditMode = NUMBER_EDIT_ENABLED && !!boardLayout;
  applyBoardLayoutGeometry();
  if(!board.locales.includes(language))language=board.defaultLocale;
  [locale,aiProfiles]=await Promise.all([loadLocale(language),loadAiProfiles(language)]);
  renderLanguage();setupBoardZoomControls();renderAll();offerRecoveryOrSetup();
}

langSelect.addEventListener('change',async()=>{language=langSelect.value;storage.set(LANGUAGE_KEY,language);[locale,aiProfiles]=await Promise.all([loadLocale(language),loadAiProfiles(language)]);howToPlay=null;renderLanguage();renderAll();if(setupDialog.open)renderCpuChoices();if(friendDialog.open)friendDialog.close();if(helpDialog.open)await refreshHowToPlay();});
el('newBtn').onclick=openSetup; el('saveBtn').onclick=saveGame; el('loadBtn').onclick=loadGame; el('helpBtn').onclick=openHowToPlay; el('cancelSetup').onclick=()=>setupDialog.close();
recoveryDialog.addEventListener('cancel',e=>e.preventDefault());
manageDialog.addEventListener('close', () => {
  if (inspectedPlayerId != null) {
    inspectedPlayerId = null;
    renderBoard();
  }
});
if (numberEditBtn) numberEditBtn.addEventListener('click', () => setNumberEditMode(!boardNumberEditMode));
if (numberExportBtn) numberExportBtn.addEventListener('click', exportBoardNumberPositions);
if (numberResetBtn) numberResetBtn.addEventListener('click', resetBoardNumberPositions);
window.addEventListener('pointermove', moveBoardNumber);
window.addEventListener('pointerup', finishBoardNumberDrag);
window.addEventListener('pointercancel', finishBoardNumberDrag);
el('setupForm').addEventListener('submit',e=>{e.preventDefault();startGameFromSetup();});
window.addEventListener('pagehide',()=>autosaveGame());
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') autosaveGame(); });
boot().catch(err=>{console.error(err);document.body.innerHTML=`<main style="padding:2rem;font-family:system-ui"><h1>🐷 Grugnetto’s KludgopolB</h1><p>${escapeHtml(err.message)}</p><p>Serve un piccolo server HTTP: <code>npm run serve</code>.</p></main>`;});
