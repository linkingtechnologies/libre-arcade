// SPDX-License-Identifier: GPL-3.0-or-later
import { HighMoonGame, GameMode, DIFFICULTY_NAMES } from './game-controller.js';
import { BodyKind } from './galaxy.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './constants.js';
import { AudioEngine } from './presentation-audio.js';
import { PresentationEffects } from './presentation-effects.js';
import { drawPlanetArt, drawSatelliteArt, drawUfoArt } from './presentation-art.js';

const TICK_MS = 30;
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const hudP1 = document.querySelector('#hudP1');
const hudP2 = document.querySelector('#hudP2');
const turnLabel = document.querySelector('#turnLabel');
const modeLabel = document.querySelector('#modeLabel');
const overlay = document.querySelector('#overlay');
const message = document.querySelector('#message');
const difficultyButton = document.querySelector('#difficulty');
const difficultyName = document.querySelector('#difficultyName');
const warpButton = document.querySelector('#warp');
const bonusButton = document.querySelector('#bonus');
const fireButton = document.querySelector('#fire');
const pauseButton = document.querySelector('#pause');
const restartButton = document.querySelector('#restart');
const audioButton = document.querySelector('#audioToggle');
const audioHint = document.querySelector('#audioHint');
const audioState = document.querySelector('#audioState');
const langState = document.querySelector('#langState');
const menuOpenButton = document.querySelector('#menuOpen');
const menuCloseButton = document.querySelector('#menuClose');
const menuPlayButton = document.querySelector('#menuPlay');
const menuBackdrop = document.querySelector('#menuBackdrop');
const gameMenu = document.querySelector('#gameMenu');
const angleLabel = document.querySelector('#angleLabel');
const powerLabel = document.querySelector('#powerLabel');
const stateLabel = document.querySelector('#stateLabel');

const storage = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private contexts */ } },
};

const browserLanguage = (navigator.language || '').toLowerCase().startsWith('it') ? 'it' : 'en';
let lang = storage.get('highmoon.lang', browserLanguage) === 'it' ? 'it' : 'en';
const text = {
  it: {
    subtitle: 'Duello nello spazio', menu: 'Menu', menuSubtitle: 'Scegli come giocare', gameMode: 'Modalità', play: 'Gioca', startNewMatch: 'Inizia nuova partita', backToGame: 'Torna alla partita', closeMenu: 'Chiudi menu', language: 'Lingua', audio: 'Audio', fullscreen: 'Schermo intero', pause: 'Pausa', resume: 'Riprendi', restart: 'Ricomincia', paused: 'IN PAUSA',
    up: 'Su', down: 'Giù', aimLeft: 'Mira −', aimRight: 'Mira +', bonus: 'Usa bonus', fire: 'TIENI / RILASCIA',
    pvc: 'Giocatore vs CPU', pvp: 'Giocatore vs Giocatore', demo: 'CPU vs CPU', warp: 'Nuova galassia', difficulty: 'Difficoltà CPU', controls: 'Controlli',
    instructions: 'Come si gioca', howGoal: "Due navicelle si sfidano a turni: colpisci l'avversario fino ad azzerare il suo scudo. La gravità dei pianeti devia i tuoi colpi: attenzione, possono anche tornare indietro!",
    howAim: 'Durante il tuo turno, sposta la navicella su o giù, regola la mira e tieni premuto il tiro per caricare la potenza; rilascia per sparare.',
    howWorld: 'Gli Storm respingono i proiettili; i Wormhole li teletrasportano. Raccogli i bonus colpendoli mentre attraversi la galassia.',
    howWeapons: 'Laser: colpo normale. Heavy: colpo più potente. Cluster: si divide in cinque proiettili all’impatto. Usa bonus: 1 o 4 per rinforzare lo scudo, 2 per Heavy, 3 per Cluster.',
    howKeyboard: 'Tastiera: ↑/↓ muovi · ←/→ mira · Spazio tieni premuto/rilascia per sparare · Invio usa bonus · P/Esc pausa. Su smartphone usa i pulsanti sotto il campo.',
    credits: 'Credits', originalGame: 'Gioco originale (2005–2006):', originalSite: 'Sito originale', restoration: 'Restauro HTML5, grafica e audio nuovi:', licenses: 'Codice originale GPL-2.0-or-later; port HTML5 GPLv3.', viewLicense: 'Licenza del port',
    player: 'Giocatore', computer: 'CPU', turn: 'Turno', winner: 'Vince', charging: 'Carica', flying: 'Tiro in volo', thinking: 'La CPU calcola il tiro…', ready: 'Pronto', collected: 'Bonus raccolto', bought: 'Bonus usato', galaxy: 'Galassia', newGame: 'Nuova partita',
    audioBlocked: 'Il browser non ha attivato l’audio. Controlla il volume o riattiva Audio dal menu.',
    audioUnavailable: 'Questo browser non consente la riproduzione audio.',
    hit: 'Colpito', weapon: { laser: 'Laser', heavy: 'Heavy', cluster: 'Cluster' },
    modes: { 'one-player': '1P vs CPU', 'two-player': '2 giocatori', demo: 'Demo CPU' },
  },
  en: {
    subtitle: 'Duel in Space', menu: 'Menu', menuSubtitle: 'Choose how to play', gameMode: 'Game mode', play: 'Play', startNewMatch: 'Start new game', backToGame: 'Back to game', closeMenu: 'Close menu', language: 'Language', audio: 'Audio', fullscreen: 'Fullscreen', pause: 'Pause', resume: 'Resume', restart: 'Restart', paused: 'PAUSED',
    up: 'Up', down: 'Down', aimLeft: 'Aim −', aimRight: 'Aim +', bonus: 'Use bonus', fire: 'HOLD / RELEASE',
    pvc: 'Player vs CPU', pvp: 'Player vs Player', demo: 'CPU vs CPU', warp: 'New galaxy', difficulty: 'CPU difficulty', controls: 'Controls',
    instructions: 'How to play', howGoal: 'Two spaceships take turns firing at each other. Hit your opponent until their shield reaches zero. Planet gravity bends shots — including back toward you!',
    howAim: 'On your turn, move your ship up or down, adjust the aim, then hold Fire to charge the power. Release to shoot.',
    howWorld: 'Storms repel projectiles; wormholes teleport them. Collect bonuses by hitting them while your shot travels through the galaxy.',
    howWeapons: 'Laser: standard shot. Heavy: stronger hit. Cluster: splits into five projectiles on impact. Use a bonus: 1 or 4 restores shields, 2 equips Heavy, 3 equips Cluster.',
    howKeyboard: 'Keyboard: ↑/↓ move · ←/→ aim · hold/release Space to shoot · Enter use bonus · P/Esc pause. On phones, use the buttons beneath the field.',
    credits: 'Credits', originalGame: 'Original game (2005–2006):', originalSite: 'Original website', restoration: 'HTML5 restoration, new graphics and audio:', licenses: 'Original code GPL-2.0-or-later; HTML5 port GPLv3.', viewLicense: 'Port license',
    player: 'Player', computer: 'CPU', turn: 'Turn', winner: 'Winner', charging: 'Charging', flying: 'Shot in flight', thinking: 'CPU is calculating a shot…', ready: 'Ready', collected: 'Bonus collected', bought: 'Bonus used', galaxy: 'Galaxy', newGame: 'New game',
    audioBlocked: 'The browser has not enabled sound. Check the volume or turn Audio off and on in the menu.',
    audioUnavailable: 'This browser cannot play audio.',
    hit: 'Hit', weapon: { laser: 'Laser', heavy: 'Heavy', cluster: 'Cluster' },
    modes: { 'one-player': '1P vs CPU', 'two-player': '2 players', demo: 'CPU demo' },
  },
};
const t = () => text[lang];

const game = new HighMoonGame({ mode: GameMode.ONE_PLAYER, difficulty: 2, startupSeed: 12345, galaxySeed: 54321, objects: 6 });
const audio = new AudioEngine({ enabled: storage.get('highmoon.audio', 'on') !== 'off' });
const effects = new PresentationEffects();
const held = { up: false, down: false, left: false, right: false, fire: false };
let pending = {};
let camera = { x: 0, y: 0 };
let shake = { x: 0, y: 0 };
let lastMessageFrame = 0;
let paused = true;
let pauseReason = 'welcome';
let hasStarted = false;
let selectedMode = game.mode;
let menuResumeOnClose = false;
let menuLastFocus = null;

function setLanguage(next) {
  lang = next;
  storage.set('highmoon.lang', lang);
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const key = el.dataset.i18n;
    if (t()[key]) el.textContent = t()[key];
  }
  pauseButton.textContent = paused ? t().resume : t().pause;
  message.textContent = '';
  if (langState) langState.textContent = lang === 'it' ? 'Italiano' : 'English';
  menuCloseButton.setAttribute('aria-label', t().closeMenu);
  updateAudioButton();
  if (audioHint.dataset.message) audioHint.textContent = t()[audioHint.dataset.message];
  renderHud(game.snapshot());
  syncMenuState();
}

function updateAudioButton() {
  audioButton.classList.toggle('muted', !audio.enabled);
  if (audioState) audioState.textContent = audio.enabled ? 'On' : 'Off';
  audioButton.setAttribute('aria-pressed', String(audio.enabled));
  audioButton.setAttribute('aria-label', audio.enabled ? t().audioOn : t().audioOff);
  audioButton.title = `${audio.enabled ? t().audioOn : t().audioOff} (M)`;
}

function showAudioHint(messageKey = '') {
  audioHint.dataset.message = messageKey;
  audioHint.textContent = messageKey ? t()[messageKey] : '';
}

function clearHeld() {
  for (const key of Object.keys(held)) held[key] = false;
  for (const button of document.querySelectorAll('.pressed')) button.classList.remove('pressed');
  fireButton.classList.remove('charge');
}

function setPaused(value, reason = 'manual') {
  paused = Boolean(value);
  pauseReason = reason;
  if (paused) {
    clearHeld();
    pending = {};
  }
  pauseButton.textContent = paused ? t().resume : t().pause;
  pauseButton.setAttribute('aria-pressed', String(paused));
}

function togglePaused(reason = 'manual') { setPaused(!paused, reason); }

function isMenuOpen() { return !menuBackdrop.hidden; }

function syncMenuState() {
  menuPlayButton.textContent = !hasStarted ? t().play : selectedMode !== game.mode ? t().startNewMatch : t().backToGame;
  menuCloseButton.hidden = !hasStarted;
  pauseButton.disabled = !hasStarted;
  restartButton.hidden = !hasStarted;
  warpButton.hidden = !hasStarted;
  for (const b of document.querySelectorAll('[data-mode]')) {
    const selected = b.dataset.mode === selectedMode;
    b.classList.toggle('active', selected);
    b.setAttribute('aria-pressed', String(selected));
  }
}

function openMenu() {
  if (isMenuOpen()) return;
  selectedMode = game.mode;
  menuLastFocus = document.activeElement;
  menuResumeOnClose = hasStarted && !paused;
  if (menuResumeOnClose) setPaused(true, 'menu');
  menuBackdrop.hidden = false;
  document.querySelector('.shell').inert = true;
  syncMenuState();
  requestAnimationFrame(() => gameMenu.focus());
}

function closeMenu(resume = true) {
  if (!isMenuOpen() || !hasStarted) return;
  menuBackdrop.hidden = true;
  document.querySelector('.shell').inert = false;
  if (resume && menuResumeOnClose && pauseReason === 'menu') setPaused(false, 'menu');
  menuResumeOnClose = false;
  selectedMode = game.mode;
  syncMenuState();
  const target = menuLastFocus instanceof HTMLElement ? menuLastFocus : menuOpenButton;
  menuLastFocus = null;
  requestAnimationFrame(() => target?.focus?.());
}

function playFromMenu() {
  if (!isMenuOpen()) return;
  if (audio.enabled) {
    // Play is a user gesture: unlock sound and confirm with an audible cue.
    void audio.unlock().then(ready => {
      if (ready) audio.handle({ event: 'menu_confirm' });
      else showAudioHint(audio.status === 'unavailable' ? 'audioUnavailable' : 'audioBlocked');
    });
  }
  const newMode = selectedMode !== game.mode;
  if (newMode) pending.newMode = selectedMode;
  const firstStart = !hasStarted;
  hasStarted = true;
  closeMenu(!newMode && !firstStart);
  if (firstStart || newMode) setPaused(false, 'start');
}

function trapMenuFocus(event) {
  if (!isMenuOpen() || event.key !== 'Tab') return;
  const focusable = [...gameMenu.querySelectorAll('button:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hidden && el.getClientRects().length);
  if (!focusable.length) return;
  const first = focusable[0]; const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  } catch { /* fullscreen is optional */ }
}

function modeFromKey(key) {
  if (key === '1') return GameMode.ONE_PLAYER;
  if (key === '2') return GameMode.TWO_PLAYER;
  if (key === '3') return GameMode.DEMO;
  return null;
}

function setHeldFromKey(key, value) {
  if (key === 'ArrowUp') held.up = value;
  if (key === 'ArrowDown') held.down = value;
  if (key === 'ArrowLeft') held.left = value;
  if (key === 'ArrowRight') held.right = value;
  if (key === ' ') held.fire = value;
}

function isTypingTarget(target) { return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable; }
function isModernKey(key) { return ['p', 'm', 'f', 'r', 'escape'].includes(key.toLowerCase()); }

window.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
window.addEventListener('keydown', (event) => {
  audio.unlock();
  if (isTypingTarget(event.target)) return;

  const lower = event.key.toLowerCase();
  if (event.key === 'Escape' && isMenuOpen()) { event.preventDefault(); if (hasStarted && !event.repeat) closeMenu(true); return; }
  if (isMenuOpen()) return;
  if (lower === 'p' || event.key === 'Escape') { event.preventDefault(); if (!event.repeat) togglePaused('manual'); return; }
  if (lower === 'm') { event.preventDefault(); if (!event.repeat) { audio.toggle(); storage.set('highmoon.audio', audio.enabled ? 'on' : 'off'); updateAudioButton(); } return; }
  if (lower === 'f') { event.preventDefault(); if (!event.repeat) toggleFullscreen(); return; }
  if (lower === 'r') { event.preventDefault(); if (!event.repeat) { pending.newMode = game.mode; setPaused(false); } return; }

  if (paused) return;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab','Enter'].includes(event.key)) event.preventDefault();
  setHeldFromKey(event.key, true);
  if (event.repeat) return;
  const mode = modeFromKey(event.key);
  if (mode) pending.newMode = mode;
  else if (event.key === 'Enter') pending.buyBonusPressed = true;
  else if (lower === 'c') pending.cycleDifficulty = true;
  else if (event.key === 'Tab') {
    pending.warpSeed = Date.now() | 0;
  }
});

window.addEventListener('keyup', (event) => {
  if (isTypingTarget(event.target)) return;
  setHeldFromKey(event.key, false);
  if (paused || isModernKey(event.key)) return;
  // Historical 1.2.4 SDL quirk: once charging, any historical keyboard KEYUP fires.
  pending.anyKeyReleased = true;
});

window.addEventListener('blur', () => { if (!paused) setPaused(true, 'focus'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && !paused) setPaused(true, 'visibility'); });

for (const button of document.querySelectorAll('[data-hold]')) {
  const key = button.dataset.hold;
  const down = (event) => {
    event.preventDefault(); audio.unlock(); if (paused) return;
    held[key] = true; button.classList.add('pressed'); button.setPointerCapture?.(event.pointerId);
  };
  const up = (event) => { event.preventDefault(); held[key] = false; button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointercancel', up);
}

fireButton.addEventListener('pointerdown', (event) => {
  event.preventDefault(); audio.unlock(); if (paused) return;
  held.fire = true; fireButton.classList.add('pressed', 'charge'); fireButton.setPointerCapture?.(event.pointerId);
});
function releaseFire(event) {
  event.preventDefault();
  const wasHeld = held.fire;
  held.fire = false; fireButton.classList.remove('pressed', 'charge');
  if (!paused && wasHeld) pending.anyKeyReleased = true;
}
fireButton.addEventListener('pointerup', releaseFire);
fireButton.addEventListener('pointercancel', releaseFire);
bonusButton.addEventListener('click', () => { if (!paused) pending.buyBonusPressed = true; });

for (const b of document.querySelectorAll('[data-mode]')) {
  b.addEventListener('click', () => { audio.unlock(); selectedMode = b.dataset.mode; syncMenuState(); renderHud(game.snapshot()); });
}
warpButton.addEventListener('click', () => {
  if (paused && pauseReason !== 'menu') return;
  pending.warpSeed = Date.now() | 0;
  closeMenu(true);
});
difficultyButton.addEventListener('click', () => {
  if (paused && pauseReason !== 'menu') return;
  game.cycleDifficulty();
  const snap = game.snapshot();
  handleEvents(game.drainEvents(), snap);
  renderHud(snap);
});
pauseButton.addEventListener('click', () => togglePaused('manual'));
restartButton.addEventListener('click', () => { pending.newMode = game.mode; closeMenu(true); });
audioButton.addEventListener('click', () => {
  audio.toggle(); storage.set('highmoon.audio', audio.enabled ? 'on' : 'off');
  showAudioHint(); updateAudioButton();
});
document.querySelector('#lang').addEventListener('click', () => setLanguage(lang === 'it' ? 'en' : 'it'));
document.querySelector('#fullscreen').addEventListener('click', toggleFullscreen);
menuOpenButton.addEventListener('click', openMenu);
menuCloseButton.addEventListener('click', () => closeMenu(true));
menuPlayButton.addEventListener('click', playFromMenu);
menuBackdrop.addEventListener('pointerdown', (event) => { if (event.target === menuBackdrop) closeMenu(true); });
gameMenu.addEventListener('keydown', trapMenuFocus);

function makeInput() {
  const input = { ...held, ...pending };
  pending = {};
  return input;
}

function handleEvents(events, snapshot) {
  for (const e of events) {
    audio.handle(e);
    effects.handle(e, snapshot);
    if (e.event === 'new_game') message.textContent = `${t().newGame}: ${t().modes[e.mode]}`;
    else if (e.event === 'galaxy_warp') message.textContent = t().warp;
    else if (e.event === 'fire') message.textContent = `${t().weapon[e.weapon]} · ${e.power}%`;
    else if (e.event === 'damage') message.textContent = `${t().hit}: −${e.amount}`;
    else if (e.event === 'bonus_collected') message.textContent = `${t().collected}: ${e.bonus}/4`;
    else if (e.event === 'bonus_bought') message.textContent = t().bought;
    else if (e.event === 'winner') message.textContent = `${t().winner}: ${playerName(game.players[e.player], e.player)}`;
    else if (e.event === 'difficulty') message.textContent = `${t().difficulty}: ${DIFFICULTY_NAMES[e.index]}`;
    if (['new_game','galaxy_warp','fire','damage','bonus_collected','bonus_bought','winner','difficulty'].includes(e.event)) lastMessageFrame = game.frame;
  }
}

function playerName(p, index) { return p.human ? `${t().player} ${index + 1}` : `${t().computer} ${index + 1}`; }
function weaponLabel(id) { return t().weapon[id] ?? id; }

function playerHud(p, index) {
  const shieldWidth = Math.max(0, Math.min(100, p.shield));
  const dots = [1,2,3,4].map((n) => `<i class="bonus-dot ${p.bonus === n ? 'on' : ''}"></i>`).join('');
  return `<span class="player-name">${playerName(p,index)}</span>
    <span class="weapon">${weaponLabel(p.boughtWeapon)}</span>
    <div class="shield-row"><div class="shield-track"><div class="shield-fill" style="width:${shieldWidth}%"></div></div><span class="shield-number">${p.shield}</span></div>
    <div class="bonus-row" title="Bonus ${p.bonus}/4">${dots}</div>`;
}

function renderHud(s) {
  hudP1.innerHTML = playerHud(s.players[0], 0);
  hudP2.innerHTML = playerHud(s.players[1], 1);
  hudP1.classList.toggle('active', s.activePlayer === 0 && s.winner < 0);
  hudP2.classList.toggle('active', s.activePlayer === 1 && s.winner < 0);
  const active = s.players[s.activePlayer];
  turnLabel.textContent = s.winner >= 0 ? `${t().winner}: ${playerName(s.players[s.winner], s.winner)}` : `${t().turn}: ${playerName(active, s.activePlayer)}`;
  modeLabel.textContent = t().modes[s.mode];
  difficultyName.textContent = DIFFICULTY_NAMES[s.difficulty];
  if (isMenuOpen()) syncMenuState();

  const humanTurn = active.human && s.winner < 0 && !paused;
  for (const b of document.querySelectorAll('.touch-controls button')) b.disabled = !humanTurn || s.targetLocked;
  bonusButton.disabled = bonusButton.disabled || active.bonus <= 0;
  warpButton.disabled = !hasStarted || (paused && pauseReason !== 'menu') || Boolean(s.shot?.active);
  difficultyButton.disabled = (paused && pauseReason !== 'menu' && pauseReason !== 'welcome') || (isMenuOpen() && selectedMode === GameMode.TWO_PLAYER);

  const degrees = ((active.shootAngle * 180 / Math.PI) % 360 + 360) % 360;
  angleLabel.textContent = `∠ ${degrees.toFixed(0)}°`;
  powerLabel.textContent = `⚡ ${active.shootPower}%`;
  stateLabel.textContent = paused ? (hasStarted ? t().paused : t().ready) : s.shot?.active ? t().flying : (!active.human && s.winner < 0 ? t().thinking : t().ready);

  if (s.targeting && humanTurn) message.textContent = `${t().charging}: ${active.shootPower}%`;
  else if (s.shot?.active) message.textContent = t().flying;
  else if (game.frame - lastMessageFrame > 120 && s.winner < 0 && !paused) message.textContent = '';
}

function updateCamera(s) {
  let tx = 0; let ty = 0;
  if (s.shot?.active) {
    const p = s.shot.primary;
    if (p.x < 20) tx = 20 - p.x;
    if (p.x > SCREEN_WIDTH - 20) tx = SCREEN_WIDTH - 20 - p.x;
    if (p.y < 20) ty = 20 - p.y;
    if (p.y > SCREEN_HEIGHT - 20) ty = SCREEN_HEIGHT - 20 - p.y;
  }
  camera.x += (tx - camera.x) * (s.shot?.active ? .5 : .12);
  camera.y += (ty - camera.y) * (s.shot?.active ? .5 : .12);
  if (Math.abs(camera.x) < .02) camera.x = 0;
  if (Math.abs(camera.y) < .02) camera.y = 0;
  shake = effects.cameraOffset(s.frame);
}

function worldX(x) { return x + camera.x + shake.x; }
function worldY(y) { return y + camera.y + shake.y; }

function drawBackground(s) {
  const gradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
  gradient.addColorStop(0, '#070b22'); gradient.addColorStop(1, '#02040d');
  ctx.fillStyle = gradient; ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
  for (const star of game.runtime.visual.stars) {
    const pulse = effects.reducedMotion ? .7 : .35 + .65 * Math.abs(Math.sin((s.frame + star.b) * .025));
    ctx.globalAlpha = pulse;
    ctx.fillStyle = `rgb(${Math.min(255,star.c+10)} ${Math.min(255,star.c+18)} 255)`;
    const r = star.c > 180 ? 1.4 : .8;
    ctx.fillRect(star.x-r, star.y-r, r*2, r*2);
  }
  ctx.globalAlpha = 1;
}

function drawPlanet(body) {
  const x=worldX(body.x), y=worldY(body.y);
  drawPlanetArt(ctx,body,x,y);
  for (const child of body.children) {
    drawSatelliteArt(ctx,child,worldX(child.x),worldY(child.y));
  }
}

function drawStorm(body) {
  const x=worldX(body.x), y=worldY(body.y);
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for (let i=0;i<body.particles.length;i+=3) {
    const p=body.particles[i]; const px=x+Math.cos(p.angle)*p.length; const py=y+Math.sin(p.angle)*p.length;
    ctx.globalAlpha=.18+(i%9)/20; ctx.fillStyle='#ff775f'; ctx.fillRect(px-1,py-1,2,2);
  }
  ctx.globalAlpha=.9; ctx.strokeStyle='#ff8e73'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,18,0,Math.PI*2); ctx.stroke(); ctx.restore();
}

function drawWormhole(body) {
  const x=worldX(body.x), y=worldY(body.y), ex=worldX(body.x+body.exitX), ey=worldY(body.y+body.exitY);
  ctx.save(); ctx.setLineDash([3,8]); ctx.strokeStyle='rgba(167,139,250,.22)'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(ex,ey); ctx.stroke(); ctx.setLineDash([]);
  for (let i=0;i<4;i++) { ctx.strokeStyle=`rgba(174,150,255,${.72-i*.12})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,7+i*5,0,Math.PI*2); ctx.stroke(); }
  ctx.fillStyle='rgba(196,181,253,.9)'; ctx.beginPath(); ctx.arc(ex,ey,3,0,Math.PI*2); ctx.fill(); ctx.restore();
}

function drawBodies(s) {
  for (const body of s.galaxy.bodies) {
    if (body.kind === BodyKind.PLANET) drawPlanet(body);
    else if (body.kind === BodyKind.STORM) drawStorm(body);
    else drawWormhole(body);
  }
}

function drawExtra(s) {
  if (!s.extra.visible || !Number.isFinite(s.extra.x)) return;
  const x=worldX(s.extra.x), y=worldY(s.extra.y); const a=s.frame*.08;
  ctx.save(); ctx.translate(x,y); ctx.rotate(a); ctx.fillStyle='#ffe18a'; ctx.shadowColor='#ffd75e'; ctx.shadowBlur=16; ctx.fillRect(-9,-9,18,18); ctx.restore();
}

function drawUfo(p,index,active) {
  drawUfoArt(ctx,p,index,active,worldX(p.x),worldY(p.y));
}

function drawPlayers(s) { s.players.forEach((p,i)=>drawUfo(p,i,i===s.activePlayer && s.winner<0)); }

function drawShot(s) {
  if (!s.shot?.active) return;
  const isHeavy=s.shot.weapon==='heavy'; const isCluster=s.shot.weapon==='cluster';
  s.shot.projectiles.forEach((p)=>{
    const x=worldX(p.x), y=worldY(p.y); ctx.save(); ctx.shadowBlur=12; ctx.shadowColor=isHeavy?'#ffb36a':isCluster?'#d9b4ff':'#dcecff'; ctx.fillStyle=isHeavy?'#ffb36a':isCluster?'#d9b4ff':'#eef6ff'; ctx.beginPath(); ctx.arc(x,y,isHeavy?5:3.2,0,Math.PI*2); ctx.fill(); ctx.restore();
  });
}

function drawPower(s) {
  const p=s.players[s.activePlayer]; if(!p.active || s.winner>=0) return;
  const x=s.activePlayer===0?24:SCREEN_WIDTH-24; const y=SCREEN_HEIGHT-24; const w=180; const h=8; const left=s.activePlayer===0?x:x-w;
  ctx.fillStyle='rgba(255,255,255,.12)'; ctx.fillRect(left,y,w,h); ctx.fillStyle=s.activePlayer===0?'#ff7d72':'#78b7ff'; ctx.fillRect(left,y,w*Math.min(100,p.shootPower)/100,h);
}

function render(s) {
  updateCamera(s);
  drawBackground(s); drawBodies(s); drawExtra(s); drawPlayers(s); drawShot(s); effects.draw(ctx, worldX, worldY); drawPower(s);
  if (paused && hasStarted) { overlay.hidden=false; overlay.textContent=t().paused; }
  else if (s.galaxy.isImploding) { overlay.hidden=false; overlay.textContent=t().warp; }
  else if (s.winner>=0) { overlay.hidden=false; overlay.textContent=`${t().winner}: ${playerName(s.players[s.winner],s.winner)}`; }
  else overlay.hidden=true;
  renderHud(s);
}

let last=performance.now(); let acc=0; let snapshot=game.snapshot();
function loop(now) {
  acc += Math.min(250, now-last); last=now;
  while(acc>=TICK_MS){
    if (!paused) {
      snapshot=game.step(makeInput());
      handleEvents(game.drainEvents(), snapshot);
      effects.update();
    }
    acc-=TICK_MS;
  }
  render(snapshot); requestAnimationFrame(loop);
}

handleEvents(game.drainEvents(), snapshot);
setLanguage(lang);
updateAudioButton();
openMenu(); // First visit: select a mode and press Play before the game advances.
requestAnimationFrame(loop);
