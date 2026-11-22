/* Netrok 0.95 browser preservation shell - SPDX-License-Identifier: GPL-3.0-or-later */
(() => {
  'use strict';

  const C = window.NetrokCore;
  const { Game, TILE, ROWS, COLS, SCREEN_W, SCREEN_H, PLAYER_SCREEN_X, MAX_SCROLL, DIR, UPGRADE, PLATFORM_LENGTH } = C;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const levelSelect = document.getElementById('levelSelect');
  const modeButton = document.getElementById('modeButton');
  const restartButton = document.getElementById('restartButton');
  const newRunButton = document.getElementById('newRunButton');
  const pauseButton = document.getElementById('pauseButton');
  const musicButton = document.getElementById('musicButton');
  const gridBox = document.getElementById('showGrid');
  const idsBox = document.getElementById('showIds');
  const cameraSlider = document.getElementById('camera');
  const cameraOut = document.getElementById('cameraOut');
  const status = document.getElementById('status');
  const fidelity = document.getElementById('fidelity');

  const images = new Map();
  const cleanHdImages = new Map();
  const presentation = new Map();
  const cleanHdPresentation = new Map();
  const audio = new Map();
  let sfont = null;
  let loaded = false;
  let mode = 'classic'; // classic | play | view
  let paused = false;
  let viewerCamera = 0;
  let accumulator = 0;
  let lastTime = performance.now();
  const TICK_MS = 11; // original SDL endtiming(10) waits until elapsed > 10 ms
  const heldCodes = new Set();
  let transition = null;
  let queuedGameOver = null;
  let musicEnabled = true;
  let effectsEnabled = true;
  let customLevelActive = false;
  let customReturnUrl = null;
  const CUSTOM_LEVEL_KEY = 'netrok095.customLevel.v1';
  const SAVE_KEY = 'netrok095.save.v1';
  let lastAutosaveAt = 0;
  let currentMusic = 0;
  let renderMode = 'crisp';
  let renderScale = 1;
  let audioUnlocked = false;
  let timeWarningOn = false;
  const MUSIC_VOLUME = 0.34;
  let musicFadeTicks = 0;
  let musicFadeStartTicks = 0;

  const soundFiles = {
    jump: 'sprung.wav', ceiling: 'andecke.wav', cannon: 'kanone.wav', coin: 'coins.wav',
    hit: 'treffer.wav', death: 'tot.wav', gameOver: 'gameover.wav', levelFinish: 'levelfinish.wav',
    flag: 'boing.wav', crane: 'kran.wav', button: 'button.wav', enemySide: 'punch.wav',
    enemyTop: 'punch2.wav', boss: 'boss_tot.wav', gameFinish: 'gamefinish.wav',
    highscore: 'highscore.wav', timeWarning: 'TIC_TOC.wav'
  };

  // Exact mapping from recovered kortenhandling.cc::liednumber().
  const LEVEL_MUSIC = [0, 1,4,6,5,3,1,4,2,7,6,1,4,2,4,3,1,5,2,7,3];
  const musicAudio = new Audio();
  musicAudio.loop = true;
  musicAudio.preload = 'auto';
  musicAudio.volume = MUSIC_VOLUME;

  function unlockAudio() {
    audioUnlocked = true;
    if (musicEnabled && currentMusic) musicAudio.play().catch(() => {});
  }

  function playSound(name) {
    if (!effectsEnabled) return;
    const a = audio.get(name);
    if (!a || !audioUnlocked) return;
    try { a.currentTime = 0; a.play().catch(() => {}); } catch (_) {}
  }

  function stopAllEffects() {
    for (const a of audio.values()) {
      try { a.pause(); a.currentTime = 0; } catch (_) {}
    }
    timeWarningOn = false;
  }

  function stopTimeWarning() {
    const a = audio.get('timeWarning');
    if (a) { a.pause(); a.currentTime = 0; }
    timeWarningOn = false;
  }

  function syncTimeWarning() {
    if (!loaded || mode !== 'play' || transition || paused || game.state !== 'playing' || game.timeLeft >= 40) {
      stopTimeWarning(); return;
    }
    if (timeWarningOn || !audioUnlocked) return;
    const a = audio.get('timeWarning');
    if (!a) return;
    a.loop = true; a.currentTime = 0; a.play().catch(() => {}); timeWarningOn = true;
  }

  function cancelMusicFade() {
    musicFadeTicks = 0; musicFadeStartTicks = 0; musicAudio.volume = MUSIC_VOLUME;
  }

  function beginMusicFade(ms = 3000) {
    musicFadeStartTicks = Math.max(1, Math.round(ms / TICK_MS));
    musicFadeTicks = musicFadeStartTicks;
  }

  function stepMusicFade() {
    if (musicFadeTicks <= 0) return;
    musicFadeTicks--;
    musicAudio.volume = MUSIC_VOLUME * (musicFadeTicks / musicFadeStartTicks);
    if (musicFadeTicks === 0) { musicAudio.pause(); musicAudio.volume = MUSIC_VOLUME; }
  }

  function playMusic(track, restart = true) {
    cancelMusicFade();
    currentMusic = track;
    if (!track) { musicAudio.pause(); return; }
    const wanted = `assets/music/musik${track}.ogg`;
    const changed = !musicAudio.src.endsWith(wanted);
    if (changed) musicAudio.src = wanted;
    if (restart || changed) { try { musicAudio.currentTime = 0; } catch (_) {} }
    if (musicEnabled && audioUnlocked) musicAudio.play().catch(() => {});
  }

  function playLevelMusic(level, restart = true) { playMusic(LEVEL_MUSIC[level] || 1, restart); }
  function stopMusic() { cancelMusicFade(); musicAudio.pause(); }
  function updateMusicButton() { if (musicButton) musicButton.textContent = `Music: ${musicEnabled ? 'On' : 'Off'}`; }

  function updateRenderModeState() {
    renderScale = renderMode === 'cleanhd4x' ? 4 : 1;
    const targetW = SCREEN_W * renderScale;
    const targetH = SCREEN_H * renderScale;
    if (canvas.width !== targetW) canvas.width = targetW;
    if (canvas.height !== targetH) canvas.height = targetH;
    ctx.imageSmoothingEnabled = renderMode === 'smooth';
  }

  function prepareFrame() {
    updateRenderModeState();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    ctx.imageSmoothingEnabled = renderMode === 'smooth';
  }

  function setRenderMode(value) {
    renderMode = ['crisp', 'smooth', 'cleanhd4x'].includes(value) ? value : 'crisp';
    updateRenderModeState();
  }

  const classic = {
    state: 'intro', introY: 260, introCounter: 0,
    menuY: -124, selection: 0, menuScore: 0, pendingAction: null,
    panelType: null, panelY: 0, textStart: 0,
    bgX: [], bgY: [], exited: false
  };

  function resetClassicBackground() {
    classic.bgX = []; classic.bgY = [];
    for (let x=-60; x>-280; x-=20) classic.bgX.push(x);
    for (let y=0; y<=240; y+=24) classic.bgY.push(y);
  }
  resetClassicBackground();

  function stepClassicBackground() {
    for (let i=0;i<classic.bgX.length;i++) {
      classic.bgX[i]++;
      classic.bgY[i]--;
      if (classic.bgY[i] === -24) { classic.bgY[i] = 240; classic.bgX[i] = -260; }
    }
  }

  function openClassic(showIntro = false) {
    stopTimeWarning();
    mode = 'classic'; paused = false; transition = null; queuedGameOver = null;
    heldCodes.clear(); syncHeld();
    classic.selection = 0; classic.menuY = -124; classic.menuScore = 0; classic.pendingAction = null;
    classic.panelType = null; classic.textStart = 0; classic.exited = false;
    classic.state = showIntro ? 'intro' : 'menuIn';
    classic.introY = 260; classic.introCounter = 0;
    resetClassicBackground();
    playMusic(1, !showIntro);
    updateModeButton();
    status.textContent = showIntro ? 'Press Enter to skip the intro.' : 'Classic menu.';
  }

  function beginGameFromMenu() {
    mode = 'play'; transition = null; queuedGameOver = null; paused = false;
    game.resetRun();
    // Original menu() mutates the score before entering gameplay.
    game.score += classic.menuScore;
    game.oneUpScore += classic.menuScore;
    classic.menuScore = 0;
    playLevelMusic(1, true);
    updateModeButton();
    status.textContent = 'Playing.';
  }

  function getHighScore() {
    try {
      const raw = localStorage.getItem('netrok095.highscore');
      if (raw != null && Number.isFinite(Number(raw))) return Number(raw);
    } catch (_) {}
    return 46488; // recovered original `scr` value
  }
  function saveHighScore(score) { try { localStorage.setItem('netrok095.highscore', String(score)); } catch (_) {} }

  function safeReturnUrl(value) {
    return value === 'editor/index.html' ? value : null;
  }

  function clearSavedGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
  }

  function readSavedGame() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!data || data.version !== 1 || !data.state || data.state.version !== 1) return null;
      return data;
    } catch (_) { return null; }
  }

  function saveCurrentGame() {
    if (!loaded || customLevelActive || mode !== 'play' || transition || game.runCheated) return false;
    const coreState = game.exportState();
    if (!coreState) return false;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), state: coreState }));
      return true;
    } catch (_) { return false; }
  }

  function restoreSavedGame() {
    const saved = readSavedGame();
    if (!saved || !game.importState(saved.state)) { clearSavedGame(); return false; }
    customLevelActive = false; customReturnUrl = null;
    mode = 'play'; transition = null; queuedGameOver = null; paused = false; heldCodes.clear(); syncHeld();
    playLevelMusic(game.levelNo, true); updateModeButton();
    status.textContent = `Saved game restored at level ${game.levelNo}.`;
    return true;
  }

  function startDeath(detail) {
    if (transition && transition.type === 'death') return;
    clearSavedGame();
    stopAllEffects(); beginMusicFade(3000); queuedGameOver = null;
    const snap = detail.snapshot;
    transition = {
      type: 'death', snapshot: snap, map: detail.map.slice(),
      phase: 1, y: snap.player.y, startY: snap.player.y,
      blink: 0
    };
  }

  function queueGameOver(score) {
    queuedGameOver = score;
    if (!transition || transition.type !== 'death') startGameOver(score);
  }

  function startLevelComplete(detail) {
    clearSavedGame();
    stopAllEffects(); beginMusicFade(3000);
    transition = {
      type: 'levelComplete', phase: 'in', panelY: -124,
      completedLevel: detail.level, finalScore: detail.score,
      displayScore: detail.score - detail.timeLeft * 10,
      displayTime: detail.timeLeft, countTick: 0,
      highscore: getHighScore()
    };
  }

  function startBossDeath(detail) {
    stopTimeWarning();
    const boss = detail.boss || { x: 160, y: 100, type: 165 };
    transition = {
      type: 'bossDeath', boss: { ...boss }, bossY: boss.y,
      playerPose: { ...detail.snapshot.player }, playerSprite: game.playerSprite(),
      tick: 0, finalLevel: !!detail.finalLevel
    };
  }

  function startEnding() {
    clearSavedGame();
    playSound('gameFinish');
    transition = { type: 'ending', phase: 0, phaseTick: 0, trainY: -220, trainCycle: 0 };
  }

  function startGameOver(score, afterVictory = false) {
    clearSavedGame();
    stopTimeWarning();
    transition = {
      type: 'gameOver', phase: 'in', panelY: -124, score,
      highscore: getHighScore(), soundPlayed: false, afterVictory, cheated: !!game.runCheated, custom: customLevelActive
    };
  }

  const game = new Game(window.NETROK_LEVELS, {
    sound: playSound,
    message: msg => { status.textContent = msg; },
    levelLoaded: n => {
      if (levelSelect) levelSelect.value = String(n);
      if (loaded && mode === 'play' && !transition) status.textContent = customLevelActive ? 'Custom level ready.' : `Level ${n}`;
    },
    levelComplete: startLevelComplete,
    death: startDeath,
    gameOver: queueGameOver,
    bossDeath: startBossDeath
  });

  for (let n = 1; n <= 20; n++) {
    const o = document.createElement('option'); o.value = String(n); o.textContent = `Level ${n}`; levelSelect.appendChild(o);
  }
  cameraSlider.max = String(MAX_SCROLL);

  function assetIds() {
    const ids = [];
    for (let i=0;i<=17;i++) ids.push(i);
    for (let i=21;i<=41;i++) ids.push(i);
    for (let i=61;i<=87;i++) ids.push(i);
    ids.push(98);
    for (let i=100;i<=146;i++) ids.push(i);
    for (let i=150;i<=167;i++) ids.push(i);
    for (let i=200;i<=203;i++) ids.push(i);
    return [...new Set(ids)];
  }

  const presentationFiles = ['menu1','menu2','menu3','menu4','back','instructions','about','gameover','levelfinished','logo','itpsoft','font2'];

  function loadCriticalImage(url, store, key) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => { store.set(key, im); resolve(); };
      im.onerror = () => reject(new Error(`Unable to load ${url}`));
      im.src = url;
    });
  }

  function loadOptionalImage(url, store, key) {
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => { store.set(key, im); resolve(); };
      im.onerror = () => resolve();
      im.src = url;
    });
  }

  async function preload() {
    const promises = assetIds().map(id => loadCriticalImage(`assets/png/${id}.png`, images, id));
    for (const id of assetIds()) promises.push(loadOptionalImage(`assets/png-cleanhd4x/${id}.png`, cleanHdImages, id));
    for (const name of presentationFiles) {
      promises.push(loadCriticalImage(`assets/presentation/${name}.png`, presentation, name));
      if (name !== 'font2') promises.push(loadOptionalImage(`assets/presentation-cleanhd4x/${name}.png`, cleanHdPresentation, name));
    }
    for (const [name, file] of Object.entries(soundFiles)) {
      const a = new Audio(`assets/audio/${file}`); a.preload = 'auto'; a.volume = .68; audio.set(name, a);
    }
    await Promise.all(promises);
    if (!presentation.get('font2')) throw new Error('Original bitmap font is missing.');
    sfont = new window.NetrokSFont(presentation.get('font2'), window.NETROK_SFONT_CHARPOS);
    loaded = true;
    fidelity.textContent = '';
    openClassic(true);
  }

  function img(id) { return images.get(id); }
  function drawImage(id, x, y) {
    const im = img(id);
    if (!im) return;
    if (renderMode === 'cleanhd4x') {
      const hd = cleanHdImages.get(id);
      if (hd) {
        ctx.drawImage(hd, Math.round(x), Math.round(y), im.width, im.height);
        return;
      }
    }
    ctx.drawImage(im, Math.round(x), Math.round(y));
  }
  function drawPresentation(name, x, y) {
    const im = presentation.get(name);
    if (!im) return;
    if (renderMode === 'cleanhd4x' && name !== 'font2') {
      const hd = cleanHdPresentation.get(name);
      if (hd) {
        ctx.drawImage(hd, Math.round(x), Math.round(y), im.width, im.height);
        return;
      }
    }
    ctx.drawImage(im, Math.round(x), Math.round(y));
  }
  function writeText(x, y, text) {
    if (sfont) sfont.write(ctx, x, y, String(text));
    else { ctx.fillStyle='#fff';ctx.font='9px monospace';ctx.fillText(String(text),x,y); }
  }
  function writeCenter(y, text) { if (sfont) sfont.writeCenter(ctx,y,String(text),SCREEN_W); else writeText(10,y,text); }

  const lastDraw = new Set([33,34,40,41,80,81]);
  function drawTileMap(map, scroll, counter, viewer = false) {
    const start = Math.max(0, Math.floor(scroll / TILE) - 2);
    const end = Math.min(COLS - 1, Math.floor(scroll / TILE) + 20);
    const overlay = [];
    for (let r=0;r<ROWS;r++) for (let c=start;c<=end;c++) {
      let id = map[r*COLS+c] || 0;
      if (!id) continue;
      const x = c*TILE-scroll, y=r*TILE;
      if (!viewer && id >= 150 && id <= 179) continue;
      if (!viewer && id >= 200 && id <= 203) continue;
      if (lastDraw.has(id)) { overlay.push([id,x,y,c,r]); continue; }
      if (id === 37) id = counter <= 10 ? 38 : 39;
      if (viewer && id >= 150 && id <= 179) drawImage(id === 165 ? 164 : id, x-4, y-4);
      else drawImage(id, x, y);
      if (idsBox.checked) drawTileId(map[r*COLS+c] || 0, x, y);
    }
    return overlay;
  }

  function drawTileId(id, x, y) {
    ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(Math.round(x),Math.round(y),16,8);
    ctx.fillStyle='#fff'; ctx.font='6px monospace'; ctx.fillText(String(id),Math.round(x)+1,Math.round(y)+6);
  }

  function drawGrid(scroll) {
    if (!gridBox.checked) return;
    ctx.strokeStyle='rgba(0,0,0,.24)'; ctx.lineWidth=1; ctx.beginPath();
    for (let x=-(scroll%TILE);x<=SCREEN_W;x+=TILE) { ctx.moveTo(Math.round(x)+.5,0);ctx.lineTo(Math.round(x)+.5,SCREEN_H); }
    for (let y=0;y<=ROWS*TILE;y+=TILE) { ctx.moveTo(0,y+.5);ctx.lineTo(SCREEN_W,y+.5); }
    ctx.stroke();
  }

  function drawPlatforms(s) {
    for (const p of s.platforms) {
      const len = PLATFORM_LENGTH[p.lengthType] || 16;
      for (let x=0;x<len;x+=16) drawImage(22, p.x + x - s.player.scroll, p.y);
    }
  }
  function drawFlag(s) { if (s.flag) drawImage(144, s.flag.c*TILE-s.player.scroll, (s.flag.y===s.flag.r*TILE?s.flag.r*TILE:s.flag.y)-10); }

  function drawEnemies(s, opts = {}) {
    const enemyCounter = opts.enemyCounter == null ? game.enemyCounter : opts.enemyCounter;
    const blinkCounter = opts.blinkCounter == null ? game.invulnBlinkCounter : opts.blinkCounter;
    for (const e of s.enemies) {
      if (opts.skipBoss && e.type === 165) continue;
      if (e.type === 165) {
        let id = enemyCounter <= 25 ? 164 : 166;
        if (e.bossBlink > 0) id = blinkCounter < 10 ? 164 : 167;
        const ey = opts.bossY == null ? e.y : opts.bossY;
        drawImage(id, e.x-s.player.scroll-32, ey-36);
      } else {
        const id = enemyCounter <= 25 ? e.type : e.type+1;
        drawImage(id, e.x-s.player.scroll-4, e.y-4);
      }
    }
  }
  function drawPlayer(s, override = null) {
    if (override) { drawImage(override.sprite, PLAYER_SCREEN_X, override.y); return; }
    if (s.player.invulnTimer > 0 && game.invulnBlinkCounter > 10) return;
    const blockingY = s.blockingSequence && s.blockingSequence.type === 'cannon' && s.blockingSequence.visualY != null
      ? s.blockingSequence.visualY : s.player.y;
    drawImage(game.playerSprite(), PLAYER_SCREEN_X, blockingY);
  }
  function drawProjectiles(s) { for (const b of s.projectiles) drawImage(139,b.x-s.player.scroll,b.y); }
  function drawRocks(s) { for (const r of s.fallingRocks) if (r.state===2&&r.y<220) drawImage(5,r.x-s.player.scroll,r.y); }
  function drawUpgrade(s) {
    const u=s.upgradeSequence;if(!u)return;
    if(u.buttonDrop<15)drawImage(u.type===UPGRADE.SHOES?25:26,u.c*TILE-s.player.scroll,u.r*TILE+u.buttonDrop);
    drawImage(126,136,u.craneY);
  }
  function drawOverlayTiles(entries) { for (const [id,x,y] of entries) { drawImage(id,x,y); if(idsBox.checked)drawTileId(id,x,y); } }

  function drawHud(s) {
    const x=10,y=10;
    drawImage(100,x,y);
    if(s.shields[DIR.UP]>=1)drawImage(143,x,y-9);if(s.shields[DIR.UP]===2)drawImage(143,x,y-13);
    if(s.shields[DIR.DOWN]>=1)drawImage(142,x,y+20);if(s.shields[DIR.DOWN]===2)drawImage(142,x,y+24);
    if(s.shields[DIR.LEFT]>=1)drawImage(141,x-9,y);if(s.shields[DIR.LEFT]===2)drawImage(141,x-13,y);
    if(s.shields[DIR.RIGHT]>=1)drawImage(140,x+9,y);if(s.shields[DIR.RIGHT]===2)drawImage(140,x+13,y);
    drawImage(146,190,10);if(s.coins>0)for(let i=1;i<=s.coins;i++)drawImage(145,191-6+i*6,11);
    writeText(34,19,'x'); writeText(41,19,s.lives);
    writeText(59,19,'score:'); writeText(94,19,s.score);
    writeText(164,19,'time:'); writeText(201,19,s.timeLeft);
    writeText(234,19,'level:'); writeText(276,19,s.level);
    if(s.cheats&&s.cheats.enabled){ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(266,181,50,14);writeText(270,184,'CHEAT');}
    if(s.shieldSelection){ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(4,40,112,13);writeText(6,42,`shield ${dirName(s.shieldSelection)} -> ?`);}
  }
  function dirName(d){return d===DIR.LEFT?'LEFT':d===DIR.RIGHT?'RIGHT':d===DIR.UP?'UP':'DOWN';}

  function drawGameScene(s, map, opts = {}) {
    const [r,g,b]=s.background;ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(0,0,SCREEN_W,SCREEN_H);
    const overlay=drawTileMap(map,s.player.scroll,opts.blinkCounter??game.invulnBlinkCounter,false);
    drawFlag(s);drawPlatforms(s);drawEnemies(s,opts);
    if(opts.drawPlayer!==false) drawPlayer(s,opts.playerOverride||null);
    drawRocks(s);drawProjectiles(s);drawUpgrade(s);
    const craneY = opts.craneY != null ? opts.craneY : s.checkpointCraneY;
    if (craneY != null) drawImage(126,136,craneY);
    for(let rr=0;rr<ROWS;rr++)for(let cc=Math.max(0,Math.floor(s.player.scroll/16)-1);cc<=Math.min(COLS-1,Math.floor(s.player.scroll/16)+21);cc++){
      const id=map[rr*COLS+cc];if(id>=29&&id<=32)drawImage(id,cc*16-s.player.scroll,rr*16);
    }
    drawOverlayTiles(overlay);drawHud(s);drawGrid(s.player.scroll);
  }

  function drawDeathScene(t) {
    const s=t.snapshot;const [r,g,b]=s.background;ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(0,0,SCREEN_W,SCREEN_H);
    const overlay=drawTileMap(t.map,s.player.scroll,t.blink,false);
    drawPlayer(s,{sprite:t.phase===1?127:128,y:t.y});
    drawOverlayTiles(overlay);drawHud(s);drawGrid(s.player.scroll);
  }

  function drawBossDeathScene(t) {
    const s=game.snapshot();const [r,g,b]=s.background;ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(0,0,SCREEN_W,SCREEN_H);
    const overlay=drawTileMap(game.map,s.player.scroll,game.invulnBlinkCounter,false);
    const boss={...t.boss,y:t.bossY};const bossState={...s,enemies:[boss]};
    drawEnemies(bossState,{bossY:t.bossY,enemyCounter:game.enemyCounter,blinkCounter:game.invulnBlinkCounter});
    drawPlayer(s,{sprite:t.playerSprite,y:t.playerPose.y});drawRocks(s);drawProjectiles(s);
    for(let rr=0;rr<ROWS;rr++)for(let cc=Math.max(0,Math.floor(s.player.scroll/16)-1);cc<=Math.min(COLS-1,Math.floor(s.player.scroll/16)+21);cc++){
      const id=game.map[rr*COLS+cc];if(id>=29&&id<=32)drawImage(id,cc*16-s.player.scroll,rr*16);
    }
    drawOverlayTiles(overlay);drawHud(s);drawGrid(s.player.scroll);
  }

  function drawCheckpointScene() {
    const s=game.snapshot();const seq=s.blockingSequence;
    drawGameScene(s,game.map,{playerOverride:{sprite:100,y:s.player.y},craneY:seq?seq.craneY:null});
  }
  function drawPlay() {
    if (transition) { drawTransition(); return; }
    const s=game.snapshot();drawGameScene(s,game.map);
    cameraSlider.value=String(s.player.scroll);cameraOut.textContent=`${s.player.scroll} px · screen ${Math.floor(s.player.scroll/320)+1}/20`;
    if(paused){ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(90,82,140,36);writeCenter(92,'PAUSED');}
  }

  function viewerLevel(){const entry=window.NETROK_LEVELS[levelSelect.value]||window.NETROK_LEVELS[String(levelSelect.value)];const map=entry.tiles.slice();map[0]=map[1]=map[2]=0;return{entry,map};}
  function drawViewer(){const{entry,map}=viewerLevel();const[r,g,b]=entry.background;ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(0,0,SCREEN_W,SCREEN_H);const overlay=drawTileMap(map,viewerCamera,game.invulnBlinkCounter,true);drawOverlayTiles(overlay);drawGrid(viewerCamera);ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(4,4,180,14);ctx.fillStyle='#fff';ctx.font='9px monospace';ctx.fillText(`VIEWER · raw level ${levelSelect.value}`,7,7);cameraSlider.value=String(viewerCamera);cameraOut.textContent=`${viewerCamera} px · screen ${Math.floor(viewerCamera/320)+1}/20`;}

  function drawClassicBackground() {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SCREEN_W,SCREEN_H);
    for(let i=0;i<classic.bgX.length;i++)for(let j=0;j<=20;j++)drawPresentation('back',classic.bgX[i]+j*60,classic.bgY[i]);
  }

  function drawClassic() {
    drawClassicBackground();
    if(classic.state==='intro'){
      const y=classic.introY;drawPresentation('itpsoft',138,y);
      if(y+200>0)writeText(135,y+200,'presents');
      if(y+400>0)writeText(90,y+400,'an Ioan-Tudor Parvulescu game');
      drawPresentation('logo',95,y+600);
      if(y+800>0)writeText(10,y+800,"A big machine has taken control of Netrok's world.");
      if(y+820>0)writeText(10,y+820,'All his friends have been caught in metal cages');
      if(y+840>0)writeText(10,y+840,'and the only possibility to free them again');
      if(y+860>0)writeText(10,y+860,'is to find the button that turns it off...');
      drawPresentation('logo',95,y+1040);return;
    }
    if(classic.state.startsWith('panel')){
      const lines=classic.panelType==='instructions'?ORIGINAL_INSTRUCTIONS:ORIGINAL_ABOUT;
      if(classic.state==='panelWait'){
        const maxLines=classic.panelType==='instructions'?17:12;
        const x=classic.panelType==='instructions'?18:68;
        const y0=classic.panelType==='instructions'?13:38;
        for(let i=0;i<maxLines&&classic.textStart+i<lines.length;i++)writeText(x,y0+i*10,lines[classic.textStart+i]);
      }
      drawPresentation(classic.panelType,classic.panelType==='instructions'?10:60,classic.panelY);return;
    }
    if(classic.state==='exited'){
      drawPresentation('logo',95,50);writeCenter(105,'Netrok exited.');writeCenter(125,'Press Enter to return to the menu.');return;
    }
    drawPresentation(`menu${classic.selection+1}`,100,classic.menuY);
    drawPresentation('logo',95,4);writeText(130,165,'score:');writeText(175,165,classic.menuScore);
  }

  const ORIGINAL_INSTRUCTIONS = [
    'Move Netrok with CURSOR-KEYS,','jump with (B), run with (X).','',"Place your level jump'in flag with (A).",'From this position you can replay the level','if Netrok dies. You cannot redeploy','this flag within the same level, so think where','to place it.','', 'Change shield with WASZ.','Select first the shield you want to','move, and then the position where to move','it to. W is upper shield, Z lower, etc.','Collect 20 red shield power coins to','get a new shield.','', 'Kill enemies by jumping on them or simply','running in them. But look for the position of','theire prickles. You can kill an enemy from','the side where he has his prickles only with the','blue west from the blue button by running in','him or with the special red shoes, which allows','to jump on the prickles.','Netrok cannot beaten the big prickles, so try','to avoid them.','', 'Everything what makes playing the game','easier, costs you score! E.g. changing','shields, dropping jump`in flag etc.','On the other hand, you get score if you','beat the level in shorter time or kill enemies..','For every 5000 points score you get 1 UP.','', 'Good luck and have fun!'
  ];
  const ORIGINAL_ABOUT = [
    'Netrok (C) 2004 by','Ioan-Tudor Parvulescu','', 'Version: Beta 0.95','', 'SDL GPL open source platform','game for Windows/Linux','', 'design, graphics & program-','ming by Ioan-Tudor Parvulescu','', 'music & soundeffects: public','domain','', 'visit http://www.itpsoft.de','for news & updates','', 'game uses SDL library','www.libsdl.org and the','SFont Library by Karl Bartel','http://www.linux-games.com/','sfont/'
  ];

  function stepClassic() {
    stepClassicBackground();
    if(classic.state==='intro'){
      classic.introCounter++;if(classic.introCounter===2){classic.introCounter=0;classic.introY--;}
      if(classic.introY+1040<=4){classic.state='menuIn';classic.menuY=-124;}
    } else if(classic.state==='menuIn'){
      classic.menuY+=4;if(classic.menuY>=40){classic.menuY=40;classic.state='menu';}
    } else if(classic.state==='menuOut'){
      classic.menuY-=4;if(classic.menuY<=-124){
        const action=classic.pendingAction;classic.pendingAction=null;
        if(action===0){beginGameFromMenu();return;}
        if(action===1||action===2){classic.panelType=action===1?'instructions':'about';classic.panelY=action===1?-215:-160;classic.textStart=0;classic.state='panelIn';}
        if(action===3){classic.state='exited';classic.exited=true;stopMusic();try{window.close();}catch(_){} }
      }
    } else if(classic.state==='panelIn'){
      const target=classic.panelType==='instructions'?5:30;classic.panelY+=5;if(classic.panelY>=target){classic.panelY=target;classic.state='panelWait';}
    } else if(classic.state==='panelOut'){
      classic.panelY-=5;const limit=classic.panelType==='instructions'?-215:-160;if(classic.panelY<=limit){classic.state='menuIn';classic.menuY=-124;classic.panelType=null;}
    }
  }

  function handleClassicKey(code) {
    if(classic.state==='intro'){
      if(code==='Enter'||code==='Escape'||code==='Space'){classic.state='menuIn';classic.menuY=-124;return true;}return false;
    }
    if(classic.state==='menu'){
      if(code==='ArrowUp'){classic.selection=(classic.selection+3)%4;classic.menuScore++;return true;}
      if(code==='ArrowDown'){classic.selection=(classic.selection+1)%4;classic.menuScore++;return true;}
      if(code==='Enter'||code==='Space'){classic.menuScore+=2;classic.pendingAction=classic.selection;classic.state='menuOut';return true;}
      return false;
    }
    if(classic.state==='panelWait'){
      const lines=classic.panelType==='instructions'?ORIGINAL_INSTRUCTIONS:ORIGINAL_ABOUT;
      const visible=classic.panelType==='instructions'?17:12;
      if(code==='ArrowUp'&&classic.textStart>0){classic.textStart--;return true;}
      if(code==='ArrowDown'&&classic.textStart+visible<lines.length){classic.textStart++;return true;}
      if(code==='Enter'||code==='Escape'||code==='Space'){classic.state='panelOut';return true;}
    }
    if(classic.state==='exited'&&(code==='Enter'||code==='Space')){classic.state='menuIn';classic.menuY=-124;playMusic(1,true);return true;}
    return false;
  }

  function drawTransition() {
    const t=transition;if(!t)return;
    if(t.type==='death'){drawDeathScene(t);return;}
    if(t.type==='checkpoint'){drawCheckpointScene();return;}
    if(t.type==='bossDeath'){drawBossDeathScene(t);return;}
    if(t.type==='ending'){drawEnding(t);return;}
    if(t.type==='levelComplete'||t.type==='gameOver'){
      drawClassicBackground();
      if(t.type==='levelComplete'){
        writeText(70,90,'highscore:');writeText(70,105,'your score:');writeText(70,120,'time left:');
        writeText(130,90,t.highscore);writeText(130,105,t.displayScore);writeText(130,120,t.displayTime);drawPresentation('levelfinished',60,t.panelY);
      } else {
        writeText(70,90,'highscore:');writeText(70,105,'your score:');writeText(130,90,t.highscore);writeText(130,105,t.score);if(t.cheated)writeText(108,140,'cheat run');else if(t.custom)writeText(100,140,'custom level');drawPresentation('gameover',60,t.panelY);
      }
    }
  }
  function drawEnding(t) {
    ctx.fillStyle='rgb(126,181,255)';ctx.fillRect(0,0,SCREEN_W,SCREEN_H);
    if(t.phase===3){writeText(40,80,'Thank you for playing Netrok!');return;}
    const caged=t.phase===0||(t.phase===1&&t.phaseTick%20<10);
    for(let x=0;x<=21;x++){drawImage(caged?17:1,x*16,176);drawImage(caged?17:1,x*16,192);}
    if(caged){drawImage(83,64,160);drawImage(84,64,144);drawImage(85,64,128);drawImage(87,128,160);drawImage(86,160,160);drawImage(86,160,144);drawImage(86,160,128);drawImage(86,160,112);drawImage(87,160,96);}
    else {drawImage(70,64,160);drawImage(71,64,144);drawImage(72,64,128);drawImage(63,128,160);drawImage(61,160,160);drawImage(61,160,144);drawImage(61,160,128);drawImage(61,160,112);drawImage(62,160,96);}
    if(t.phase<2){drawImage(151,20,156);drawImage(154,80,156);drawImage(158,180,156);drawImage(162,280,156);return;}
    for(const x of [13,73,173,273])drawImage(126,x,t.trainY);
    if(t.trainCycle===0){drawImage(151,20,156);drawImage(154,80,156);drawImage(158,180,156);drawImage(162,280,156);}
    else if(t.trainCycle===1){drawImage(151,20,t.trainY+180);drawImage(154,80,t.trainY+180);drawImage(158,180,t.trainY+180);drawImage(162,280,t.trainY+180);}
    else if(t.trainCycle===2){for(const x of [20,80,180,280])drawImage(98,x,t.trainY+180);}
    else {for(const x of [20,80,180,280])drawImage(98,x,156);}
    writeText(40,60,'Thank you very much Netrok! You rescued us!');
  }

  function stepTransition() {
    const t=transition;if(!t)return;
    if(t.type==='death'){
      t.blink=(t.blink+1)%20;
      if(t.phase===1){t.y-=2;if(t.y<=t.startY-65)t.phase=2;}
      else {t.y+=2;if(t.y>220){
        const over=queuedGameOver;queuedGameOver=null;
        if(over!=null)startGameOver(over);
        else if(game.blockingSequence&&game.blockingSequence.type==='checkpoint') transition={type:'checkpoint'};
        else {transition=null;playLevelMusic(game.levelNo,true);}
      }}
      return;
    }
    if(t.type==='checkpoint'){
      if(game.stepCheckpointSequence()) {transition=null;playLevelMusic(game.levelNo,true);}
      return;
    }
    if(t.type==='bossDeath'){
      game.stepBossDeathFrame();
      t.tick++;t.bossY++;
      if(t.bossY>300){
        const result=game.completeBossDeath();
        if(result.finalLevel)startEnding();
        else {
          transition=null;
          game.stepGameplayPostEnemies(); // resume the interrupted outer SDL frame after bosstot()
          if(!transition)syncTimeWarning();
        }
      }
      return;
    }
    if(t.type==='ending'){
      t.phaseTick++;
      if(t.phase===0&&t.phaseTick>=400){t.phase=1;t.phaseTick=0;return;}
      if(t.phase===1&&t.phaseTick>=400){t.phase=2;t.phaseTick=0;t.trainY=-220;t.trainCycle=0;return;}
      if(t.phase===2){
        if(t.trainCycle%2===0){t.trainY++;if(t.trainY>=-25){t.trainY=-25;t.trainCycle++;}}
        else {t.trainY--;if(t.trainY<=-220){t.trainY=-220;t.trainCycle++;}}
        if(t.trainCycle>=4){t.phase=3;t.phaseTick=0;}
        return;
      }
      if(t.phase===3&&t.phaseTick>=400){startGameOver(game.score,true);}
      return;
    }
    if(t.type==='levelComplete'){
      stepClassicBackground();
      if(t.phase==='in'){t.panelY+=4;if(t.panelY>=60){t.panelY=60;t.phase='count';}}
      else if(t.phase==='count'){
        t.countTick++;if(t.countTick>=5&&t.displayTime>0){t.countTick=0;t.displayTime--;t.displayScore+=10;playSound('flag');}
      } else if(t.phase==='out'){
        t.panelY-=4;if(t.panelY<=-125){
          transition=null;
          if(customLevelActive){
            const returnUrl=customReturnUrl; customLevelActive=false; customReturnUrl=null;
            const safeReturn=safeReturnUrl(returnUrl); if(safeReturn){ window.location.href=safeReturn; return; }
            game.resetRun(); openClassic(false); return;
          }
          game.nextLevel();playLevelMusic(game.levelNo,true);
        }
      }
      return;
    }
    if(t.type==='gameOver'){
      stepClassicBackground();
      if(t.phase==='in'){t.panelY+=4;if(t.panelY>=60){t.panelY=60;t.phase='wait';if(!t.soundPlayed&&t.score<=t.highscore){playSound('gameOver');t.soundPlayed=true;}}}
      else if(t.phase==='out'){t.panelY-=4;if(t.panelY<=-125){customLevelActive=false;customReturnUrl=null;game.resetRun();openClassic(false);}}
    }
  }
  function handleTransitionKey(code) {
    const t=transition;if(!t)return false;
    if(t.type==='levelComplete'&&t.phase==='count'&&(code==='Enter'||code==='Space')){
      t.displayScore=t.finalScore;t.displayTime=0;t.phase='out';return true;
    }
    if(t.type==='gameOver'&&t.phase==='wait'&&(code==='Enter'||code==='Space')){
      if(!t.cheated&&!t.custom&&t.score>t.highscore){saveHighScore(t.score);playSound('highscore');t.highscore=t.score;}t.phase='out';return true;
    }
    // The original ending is non-interactive; no skip is introduced here.
    return false;
  }

  function fixedStep() {
    if(!loaded)return;
    stepMusicFade();
    if(mode==='classic'){stepClassic();return;}
    if(mode==='view')return;
    if(paused)return;
    if(transition){stepTransition();return;}
    game.step();syncTimeWarning();
  }
  function draw(){if(!loaded)return;prepareFrame();if(mode==='classic')drawClassic();else if(mode==='view')drawViewer();else drawPlay();}
  function loop(now){let delta=Math.min(100,now-lastTime);lastTime=now;accumulator+=delta;let guard=0;while(accumulator>=TICK_MS&&guard++<12){fixedStep();accumulator-=TICK_MS;}draw();if(now-lastAutosaveAt>=2000){lastAutosaveAt=now;saveCurrentGame();}requestAnimationFrame(loop);}

  function syncHeld(){game.input.left=heldCodes.has('ArrowLeft');game.input.right=heldCodes.has('ArrowRight');game.input.up=heldCodes.has('ArrowUp');game.input.down=heldCodes.has('ArrowDown');game.input.run=['ControlLeft','ControlRight','PageDown','ShiftLeft','ShiftRight'].some(k=>heldCodes.has(k));game.input.jump=['AltLeft','AltRight','End','Space'].some(k=>heldCodes.has(k));}

  const handled=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','AltLeft','AltRight','ControlLeft','ControlRight','ShiftLeft','ShiftRight','Space','End','PageDown','Home','Delete','Numpad2','Numpad4','Numpad6','Numpad8','Enter','Escape','KeyP']);
  window.addEventListener('keydown',e=>{
    if(handled.has(e.code))e.preventDefault();unlockAudio();
    if(mode==='classic'){if(!e.repeat)handleClassicKey(e.code);return;}
    if(transition){if(!e.repeat)handleTransitionKey(e.code);return;}
    if(mode==='view'){
      if(e.code==='ArrowLeft')setViewerCamera(viewerCamera-TILE);if(e.code==='ArrowRight')setViewerCamera(viewerCamera+TILE);if(e.code==='KeyP')togglePause();return;
    }
    heldCodes.add(e.code);syncHeld();if(e.repeat)return;
    if(['AltLeft','AltRight','End','Space'].includes(e.code))game.input.jumpPressed=true;
    if(e.code==='Home'||e.code==='Delete')game.input.flagPressed=true;
    if(e.code==='Numpad4')game.input.shieldPressed=DIR.LEFT;if(e.code==='Numpad6')game.input.shieldPressed=DIR.RIGHT;if(e.code==='Numpad8')game.input.shieldPressed=DIR.UP;if(e.code==='Numpad2')game.input.shieldPressed=DIR.DOWN;
    if(e.code==='KeyP')togglePause();
  },{passive:false});
  window.addEventListener('keyup',e=>{heldCodes.delete(e.code);syncHeld();});
  window.addEventListener('blur',()=>{heldCodes.clear();syncHeld();if(mode==='play'&&!transition)paused=true;saveCurrentGame();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){heldCodes.clear();syncHeld();if(mode==='play'&&!transition)paused=true;musicAudio.pause();stopTimeWarning();saveCurrentGame();}
  });
  window.addEventListener('beforeunload',()=>{saveCurrentGame();});

  function bindHoldButton(el){const code=el.dataset.hold;const down=e=>{e.preventDefault();unlockAudio();if(mode==='classic'){handleClassicKey(code==='Space'?'Enter':code);return;}if(transition){handleTransitionKey(code==='Space'?'Enter':code);return;}heldCodes.add(code);syncHeld();if(code==='Space')game.input.jumpPressed=true;};const up=e=>{e.preventDefault();heldCodes.delete(code);syncHeld();};el.addEventListener('pointerdown',down);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('pointerleave',up);}
  document.querySelectorAll('[data-hold]').forEach(bindHoldButton);
  document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{unlockAudio();if(mode!=='play'||transition)return;if(el.dataset.action==='flag')game.input.flagPressed=true;if(el.dataset.action==='shield-left')game.input.shieldPressed=DIR.LEFT;if(el.dataset.action==='shield-right')game.input.shieldPressed=DIR.RIGHT;if(el.dataset.action==='shield-up')game.input.shieldPressed=DIR.UP;if(el.dataset.action==='shield-down')game.input.shieldPressed=DIR.DOWN;}));
  canvas.addEventListener('pointerdown',()=>{unlockAudio();if(mode==='classic')handleClassicKey('Enter');else if(transition)handleTransitionKey('Enter');});

  function togglePause(){if(mode!=='play'||transition)return;paused=!paused;pauseButton.textContent=paused?'Resume':'Pause';if(paused){musicAudio.pause();stopTimeWarning();}else{if(musicEnabled&&currentMusic)musicAudio.play().catch(()=>{});syncTimeWarning();}}
  function setViewerCamera(v){viewerCamera=Math.max(0,Math.min(MAX_SCROLL,Math.round(v/TILE)*TILE));}
  function updateModeButton(){modeButton.textContent=`Mode: ${mode==='classic'?'Classic':mode==='play'?'Play':'Viewer'}`;}
  function cycleMode(){
    if(mode==='classic'){mode='play';transition=null;game.resetRun();playLevelMusic(game.levelNo,true);}
    else if(mode==='play'){mode='view';stopTimeWarning();musicAudio.pause();viewerCamera=game.player.scroll;levelSelect.value=String(game.levelNo);}
    else{openClassic(false);return;}
    updateModeButton();
  }

  modeButton.addEventListener('click',()=>{unlockAudio();cycleMode();});
  restartButton.addEventListener('click',()=>{unlockAudio();mode='play';transition=null;queuedGameOver=null;game.loadLevel(game.levelNo,{preserveMeta:true});playLevelMusic(game.levelNo,true);updateModeButton();});
  newRunButton.addEventListener('click',()=>{unlockAudio();mode='play';transition=null;queuedGameOver=null;game.resetRun();playLevelMusic(1,true);updateModeButton();});
  pauseButton.addEventListener('click',()=>{unlockAudio();togglePause();});
  musicButton.addEventListener('click',()=>{unlockAudio();musicEnabled=!musicEnabled;if(musicEnabled&&currentMusic)musicAudio.play().catch(()=>{});else musicAudio.pause();updateMusicButton();});
  levelSelect.addEventListener('change',()=>{const n=Number(levelSelect.value);if(mode==='view'){viewerCamera=0;}else{mode='play';transition=null;queuedGameOver=null;game.loadLevel(n,{preserveMeta:true});playLevelMusic(n,true);updateModeButton();}});
  cameraSlider.addEventListener('input',()=>{if(mode==='view')setViewerCamera(Number(cameraSlider.value));});

  function normalizeCustomLevel(entry) {
    if(!entry || !Array.isArray(entry.tiles) || entry.tiles.length!==ROWS*COLS) return null;
    const tiles=entry.tiles.map(Number);
    if(tiles.some((v,i)=>!Number.isInteger(v)||v<0||(i<3?v>255:v>203))) return null;
    const background=Array.isArray(entry.background)&&entry.background.length>=3 ? entry.background.slice(0,3).map(Number) : tiles.slice(0,3);
    if(background.some(v=>!Number.isInteger(v)||v<0||v>255)) return null;
    return { background, tiles };
  }
  function playCustomLevel(entry, returnUrl=null) {
    const normalized=normalizeCustomLevel(entry); if(!normalized) return false;
    customLevelActive=true; customReturnUrl=safeReturnUrl(returnUrl);
    game.levels['0']=normalized;
    game.resetRun();
    game.state='playing'; game.flag=null; game.collectedCoinsByLevel.delete(0); game.loadLevel(0,{preserveMeta:true});
    mode='play'; transition=null; queuedGameOver=null; paused=false;
    playLevelMusic(1,true); updateModeButton(); status.textContent='Custom level ready.';
    return true;
  }

  window.NetrokGameUI = {
    newGame() { unlockAudio(); clearSavedGame(); customLevelActive=false; customReturnUrl=null; mode='play'; transition=null; queuedGameOver=null; paused=false; game.resetRun(); playLevelMusic(1,true); updateModeButton(); saveCurrentGame(); },
    restartLevel() { unlockAudio(); clearSavedGame(); mode='play'; transition=null; queuedGameOver=null; paused=false; game.loadLevel(game.levelNo,{preserveMeta:true}); playLevelMusic(game.levelNo,true); updateModeButton(); saveCurrentGame(); },
    originalMenu() { unlockAudio(); saveCurrentGame(); customLevelActive=false; customReturnUrl=null; openClassic(false); },
    pause() { if (mode==='play' && !transition && !paused) { togglePause(); saveCurrentGame(); } },
    resume() { unlockAudio(); if (mode==='play' && !transition && paused) togglePause(); },
    setMusic(enabled) { unlockAudio(); musicEnabled=!!enabled; if(musicEnabled&&currentMusic) musicAudio.play().catch(()=>{}); else musicAudio.pause(); updateMusicButton(); },
    setEffects(enabled) { effectsEnabled=!!enabled; if(!effectsEnabled) stopAllEffects(); },
    setRenderMode(value) { setRenderMode(value); },
    setCheats(next) { game.setCheats(next); if (game.cheats.enabled) clearSavedGame(); },
    cheatSetLevel(n) {
      if(!game.cheatSetLevel(n)) return false;
      customLevelActive=false; customReturnUrl=null;
      mode='play'; transition=null; queuedGameOver=null; paused=false; playLevelMusic(game.levelNo,true); updateModeButton(); return true;
    },
    cheatAddScore(points=5000) { return game.cheatAddScore(points); },
    cheatSetUpgrade(value) { return game.cheatSetUpgrade(value); },
    cheatFillShields() { return game.cheatFillShields(); },
    playCustomLevel(entry, options={}) { unlockAudio(); return playCustomLevel(entry, safeReturnUrl(options.returnUrl || null)); },
    continueSaved() { unlockAudio(); return restoreSavedGame(); },
    hasSavedGame() { return !!readSavedGame(); },
    discardSavedGame() { clearSavedGame(); },
    state() { return { mode, paused, transition: !!transition, loaded, musicEnabled, effectsEnabled, level: game.levelNo, customLevelActive, cheats: { ...game.cheats }, runCheated: game.runCheated, upgrade: game.upgrade, hasSavedGame: !!readSavedGame() }; }
  };

  updateMusicButton();updateModeButton();setRenderMode('crisp');
  preload().then(()=>{
    status.textContent='Ready.';
    const params=new URLSearchParams(window.location.search);
    if(params.get('custom')==='1'){
      try{const saved=JSON.parse(localStorage.getItem(CUSTOM_LEVEL_KEY)||'null');if(saved)playCustomLevel(saved,safeReturnUrl(params.get('return')));}catch(_){}
    }
    document.dispatchEvent(new CustomEvent('netrok-ready'));
  }).catch(err=>{
    console.error(err);
    status.textContent='The game could not load. Please retry.';
    document.dispatchEvent(new CustomEvent('netrok-load-error',{detail:{message:err && err.message ? err.message : 'Unknown loading error'}}));
  });
  requestAnimationFrame(loop);
})();
