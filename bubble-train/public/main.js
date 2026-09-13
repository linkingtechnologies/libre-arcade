// SPDX-License-Identifier: GPL-3.0-or-later
import {
  loadLevelXml, loadGameManifestXml, GameSession, CleanRenderer, ROTATION_STEP,
  FastestTimesStore, SettingsStore, CleanAudio, translator,
  ORIGINAL_CAMPAIGNS, getOriginalCampaign, originalManifestPath, resolveOriginalLevelPath
} from './src/index.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#game');
const renderer = new CleanRenderer(canvas, { assetBaseUrl: './assets-clean/svg/' });
const settings = new SettingsStore();
const fastest = new FastestTimesStore();
const audio = new CleanAudio({ enabled: settings.value.sound });
const DATA_ROOT = './data/original-levels/';

const campaignCache = new Map();
let currentCampaign = getOriginalCampaign(settings.value.campaign);
let manifest = [];
let levelDefinitions = new Map();
let game = null;
let accumulator = 0;
let lastFrame = performance.now();
let leftHeld = false;
let rightHeld = false;
let dialogPauseOwner = null;
const STEP = 40;

function checkResponse(r) { if (!r.ok) throw new Error(`${r.status} ${r.url}`); return r; }
function nowMs() { return performance.now(); }
function freshSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0];
  }
  return (Date.now() ^ Math.trunc(performance.now() * 1000)) >>> 0;
}
function t(key) { return translator(settings.value.language)(key); }
function formatTenths(tenths) {
  const n = Math.max(0, Math.trunc(tenths));
  const minutes = Math.trunc(n / 600);
  const seconds = Math.trunc((n % 600) / 10);
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${n % 10}`;
}

async function loadHistoricalCampaign(id) {
  const campaign = getOriginalCampaign(id);
  if (campaignCache.has(campaign.id)) return campaignCache.get(campaign.id);
  const manifestXml = await fetch(`${DATA_ROOT}${originalManifestPath(campaign.id)}`).then(checkResponse).then(r => r.text());
  const loadedManifest = loadGameManifestXml(manifestXml);
  const definitions = new Map();
  for (const entry of loadedManifest) {
    const actualPath = resolveOriginalLevelPath(entry.src);
    const xml = await fetch(`${DATA_ROOT}${actualPath}`).then(checkResponse).then(r => r.text());
    definitions.set(entry.src, loadLevelXml(xml));
  }
  const loaded = { campaign, manifest: loadedManifest, levelDefinitions: definitions };
  campaignCache.set(campaign.id, loaded);
  return loaded;
}

async function activateCampaign(id, { persist = false } = {}) {
  const loaded = await loadHistoricalCampaign(id);
  currentCampaign = loaded.campaign;
  manifest = loaded.manifest;
  levelDefinitions = loaded.levelDefinitions;
  audio.setTheme(loaded.manifest[0]?.theme ?? 'default');
  if (persist) settings.update({ campaign: currentCampaign.id });
  $('#campaignSelect').value = currentCampaign.id;
  game = null;
  accumulator = 0;
  updateHud();
  showStartOverlay();
}

await activateCampaign(settings.value.campaign);

function createGame() {
  return new GameSession({
    manifest,
    levelDefinitions,
    credits: settings.value.credits,
    seed: freshSeed(),
    fastestTimes: fastest,
    frameMs: STEP,
    game: currentCampaign.manifest
  });
}

function startGame() {
  void audio.unlock();
  game = createGame();
  game.start(nowMs());
  accumulator = 0;
  audio.setTheme(game.currentEntry?.theme ?? 'default');
  audio.playMusic('game');
  audio.cue('level');
  hideOverlay();
  updateHud();
}

function restartGame() { startGame(); }

function fire() {
  if (!game || game.state !== 'playing' || game.paused) return;
  const bullet = game.fireCannon(0);
  if (bullet) audio.cue('fire');
}

function currentCannon() { return game?.level?.cannons?.[0] ?? null; }
function rotate(direction) {
  const cannon = currentCannon();
  if (!cannon || game?.paused || game?.state !== 'playing') return;
  cannon.rotate(direction * ROTATION_STEP);
}

function pauseGame() {
  if (game?.state === 'playing' && !game.paused) {
    game.pause(nowMs());
    audio.pauseMusic();
    showPauseOverlay();
  }
}
function resumeGame() {
  if (game?.state === 'playing' && game.paused) game.resume(nowMs());
  audio.setTheme(game?.currentEntry?.theme ?? 'default');
  audio.playMusic('game');
  hideOverlay();
}

function processStep(stepNow) {
  if (!game || game.state !== 'playing' || game.paused) return;
  if (leftHeld) rotate(1);
  if (rightHeld) rotate(-1);
  const activeLevel = game.level;
  const beforeIndex = game.levelIndex;
  const beforeState = game.state;
  game.tick(stepNow);

  for (const e of activeLevel.lastEvents ?? []) {
    if (e.type === 'match') audio.cue('match');
    else if (e.type === 'bomb' || e.type === 'colour-bomb') audio.cue('bomb');
  }

  if (game.state === 'level-lost' || game.state === 'campaign-over') {
    audio.cue('lose');
    showEndOverlay();
  } else if (game.state === 'campaign-won') {
    audio.cue('win');
    showEndOverlay();
  } else if (beforeState === 'playing' && game.levelIndex !== beforeIndex) {
    audio.setTheme(game.currentEntry?.theme ?? 'default');
    audio.playMusic('game');
    audio.cue('level');
  }
}

function frame(now) {
  const dt = Math.min(250, now - lastFrame);
  lastFrame = now;
  if (game?.state === 'playing' && !game.paused) {
    accumulator += dt;
    while (accumulator >= STEP) {
      processStep(now - accumulator + STEP);
      accumulator -= STEP;
      if (game.state !== 'playing') break;
    }
  }
  if (game?.level) renderer.draw(game.level);
  else drawIdleCanvas();
  updateHud(now);
  requestAnimationFrame(frame);
}

function drawIdleCanvas() {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#151a21'; ctx.fillRect(0,0,800,600);
  ctx.strokeStyle = '#5c6674'; ctx.lineWidth = 5; ctx.setLineDash([8,8]);
  ctx.beginPath(); ctx.moveTo(90,230); ctx.lineTo(710,230); ctx.stroke(); ctx.setLineDash([]);
  const colours=['#4f8bd6','#d65757','#58a86b','#e6c84f','#e58e4d'];
  for(let i=0;i<11;i++){ctx.fillStyle=colours[i%colours.length];ctx.beginPath();ctx.arc(130+i*48,230,15,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#d9dde2';ctx.beginPath();ctx.moveTo(385,535);ctx.lineTo(415,535);ctx.lineTo(408,470);ctx.lineTo(392,470);ctx.closePath();ctx.fill();
}

function updateHud(now = nowMs()) {
  const level = game?.levelNumber ?? 1;
  const total = game?.totalLevels ?? manifest.length;
  $('#hudLevel').textContent = `${t('level')} ${level}/${total}`;
  const currentTenths = game?.state === 'playing' ? game.getLevelTenths(now) : (game?.timer?.getTenths(now) ?? 0);
  $('#hudTime').textContent = formatTenths(currentTenths);
  const credits = game?.credits ?? settings.value.credits;
  $('#hudCredits').textContent = `${t('remaining')} ${credits === -1 ? '∞' : credits}`;
}

function setOverlay(title, text, actions) {
  $('#overlayTitle').textContent = title;
  const overlayText = $('#overlayText');
  overlayText.textContent = text ?? '';
  overlayText.hidden = !text;
  const host = $('#overlayActions'); host.replaceChildren();
  for (const action of actions) {
    const b = document.createElement('button'); b.textContent = action.label;
    if (action.primary) b.classList.add('primary');
    b.addEventListener('click', action.run); host.appendChild(b);
  }
  $('#overlay').hidden = false;
}
function hideOverlay() { $('#overlay').hidden = true; }

function showStartOverlay() {
  audio.playMusic('menu');
  setOverlay(`${t('title')} — ${currentCampaign.name}`, '', [
    { label: t('play'), primary: true, run: startGame },
    { label: t('howToPlay'), run: () => openDialog($('#helpDialog')) },
    { label: t('fastest'), run: () => openDialog($('#scoresDialog')) },
    { label: t('options'), run: () => openDialog($('#optionsDialog')) }
  ]);
}
function showPauseOverlay() {
  audio.pauseMusic();
  setOverlay(t('pause'), `${currentCampaign.name} · ${t('level')} ${game.levelNumber}/${game.totalLevels} · ${t('total')} ${formatTenths(game.totalTenths)}`, [
    { label: t('resume'), primary: true, run: resumeGame },
    { label: t('howToPlay'), run: () => openDialog($('#helpDialog')) },
    { label: t('restart'), run: restartGame }
  ]);
}
function showEndOverlay() {
  if (!game) return;
  audio.playMusic('menu');
  if (game.state === 'level-lost') {
    setOverlay(t('lost'), `${currentCampaign.name} · ${t('level')} ${game.levelNumber}/${game.totalLevels}`, [
      { label: t('retry'), primary: true, run: () => { if (game.retry(nowMs())) { audio.cue('level'); hideOverlay(); } } },
      { label: t('restart'), run: restartGame }
    ]);
  } else if (game.state === 'campaign-won') {
    setOverlay(t('campaignWon'), `${currentCampaign.name} · ${t('total')} ${formatTenths(game.totalTenths)}`, [
      { label: t('restart'), primary: true, run: restartGame },
      { label: t('fastest'), run: () => openDialog($('#scoresDialog')) }
    ]);
  } else {
    setOverlay(t('gameOver'), `${currentCampaign.name} · ${t('level')} ${game.completedLevels}/${game.totalLevels} · ${t('total')} ${formatTenths(game.totalTenths)}`, [
      { label: t('restart'), primary: true, run: restartGame },
      { label: t('fastest'), run: () => openDialog($('#scoresDialog')) }
    ]);
  }
  renderScores();
}

function applyLanguage() {
  document.documentElement.lang = settings.value.language;
  $('#brandTitle').textContent = t('title');
  $('#scoresBtn').textContent = t('fastest'); $('#optionsBtn').textContent = t('options');
  $('#optionsTitle').textContent = t('options'); $('#scoresTitle').textContent = t('fastest');
  $('#helpTitle').textContent = t('howToPlay'); $('#helpGoalTitle').textContent = t('goal'); $('#helpGoalText').textContent = t('goalText');
  $('#helpControlsTitle').textContent = t('controlsTitle'); $('#helpControlsText').textContent = t('controlsHelp'); $('#helpSpecialsTitle').textContent = t('specials');
  $('#helpBombName').textContent = t('bombName'); $('#helpBombText').textContent = t('bombText');
  $('#helpColourBombName').textContent = t('colourBombName'); $('#helpColourBombText').textContent = t('colourBombText');
  $('#helpSpeedName').textContent = t('speedName'); $('#helpSpeedText').textContent = t('speedText');
  $('#helpRainbowName').textContent = t('rainbowName'); $('#helpRainbowText').textContent = t('rainbowText'); $('#helpAudioText').textContent = t('audioHelp');
  $('#languageLabel').textContent = t('language'); $('#campaignLabel').textContent = t('campaign'); $('#creditsLabel').textContent = t('credits'); $('#soundLabel').textContent = t('sound');
  $('#soundSelect').options[0].text = t('on'); $('#soundSelect').options[1].text = t('off');
  $('#creditsSelect').options[3].text = `∞ — ${t('infinite')}`;
  $('#footText').textContent = t('controls');
  if (!dialogPauseOwner) {
    if (!game) showStartOverlay(); else if (game.paused) showPauseOverlay(); else if (game.state !== 'playing') showEndOverlay();
  }
  renderScores(); updateHud();
}

function renderScores() {
  const list = $('#scoresList'); list.replaceChildren();
  const rows = fastest.list();
  if (!rows.length) {
    const li=document.createElement('li'); li.style.gridTemplateColumns='1fr'; li.textContent=t('noTimes'); list.appendChild(li); return;
  }
  rows.forEach((r,i)=>{
    const li=document.createElement('li');
    const rank=document.createElement('span'); rank.textContent=`${i+1}.`;
    const progress=document.createElement('span'); progress.textContent=`${r.game} · ${t('level')} ${r.completedLevels}/${r.totalLevels}`;
    const time=document.createElement('span'); time.textContent=formatTenths(r.totalTenths);
    li.append(rank,progress,time); list.appendChild(li);
  });
}

function openDialog(dialog) {
  if (game?.state === 'playing' && !game.paused) {
    game.pause(nowMs());
    audio.pauseMusic();
    dialogPauseOwner = dialog;
  }
  renderScores(); dialog.showModal();
}
function closeDialog(dialog) {
  dialog.close();
  if (dialogPauseOwner === dialog && game?.state === 'playing' && game.paused) {
    game.resume(nowMs());
    audio.setTheme(game.currentEntry?.theme ?? 'default');
    audio.playMusic('game');
    hideOverlay();
  }
  dialogPauseOwner = null;
}

window.addEventListener('keydown', event => {
  if (event.code === 'ArrowLeft') { event.preventDefault(); rotate(1); }
  else if (event.code === 'ArrowRight') { event.preventDefault(); rotate(-1); }
  else if (event.code === 'Space') { event.preventDefault(); fire(); }
  else if (event.code === 'KeyP') { event.preventDefault(); game?.paused ? resumeGame() : pauseGame(); }
});
canvas.addEventListener('pointermove', event => {
  const cannon = currentCannon(); if (!cannon || game?.paused) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  cannon.setAngle((cannon.position.x - x) * (Math.PI / canvas.width));
});
canvas.addEventListener('pointerdown', event => {
  const cannon=currentCannon();
  if (cannon) {
    const rect=canvas.getBoundingClientRect(); const x=(event.clientX-rect.left)*canvas.width/rect.width;
    cannon.setAngle((cannon.position.x-x)*(Math.PI/canvas.width));
  }
  fire();
});

function bindHold(button, direction) {
  const down=e=>{e.preventDefault(); direction>0?leftHeld=true:rightHeld=true; rotate(direction);};
  const up=()=>{direction>0?leftHeld=false:rightHeld=false;};
  button.addEventListener('pointerdown',down); button.addEventListener('pointerup',up); button.addEventListener('pointercancel',up); button.addEventListener('pointerleave',up);
}
bindHold($('#leftBtn'),1); bindHold($('#rightBtn'),-1); $('#fireBtn').addEventListener('pointerdown',e=>{e.preventDefault();fire();});

$('#optionsBtn').addEventListener('click',()=>openDialog($('#optionsDialog')));
$('#scoresBtn').addEventListener('click',()=>openDialog($('#scoresDialog')));
document.querySelectorAll('.closeDialog').forEach(b=>b.addEventListener('click',()=>closeDialog(b.closest('dialog'))));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{e.preventDefault();closeDialog(d);}));

for (const campaign of ORIGINAL_CAMPAIGNS) {
  const option = document.createElement('option'); option.value = campaign.id; option.textContent = campaign.name; $('#campaignSelect').appendChild(option);
}
$('#languageSelect').value=settings.value.language;
$('#campaignSelect').value=settings.value.campaign;
$('#creditsSelect').value=String(settings.value.credits);
$('#soundSelect').value=settings.value.sound?'on':'off';
$('#languageSelect').addEventListener('change',e=>{settings.update({language:e.target.value});applyLanguage();});
$('#campaignSelect').addEventListener('change',async e=>{await activateCampaign(e.target.value,{persist:true});applyLanguage();});
$('#creditsSelect').addEventListener('change',e=>{settings.update({credits:Number(e.target.value)});updateHud();});
$('#soundSelect').addEventListener('change',e=>{const sound=e.target.value==='on';settings.update({sound});audio.setEnabled(sound); if (sound) { audio.setTheme(game?.currentEntry?.theme ?? manifest[0]?.theme ?? 'default'); audio.playMusic(game?.state === 'playing' && !game?.paused ? 'game' : 'menu'); }});
const unlockAudio = () => { void audio.unlock(); };
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('touchstart', unlockAudio, { capture: true, passive: true });
window.addEventListener('keydown', unlockAudio, { capture: true });

applyLanguage();
showStartOverlay();
requestAnimationFrame(frame);
