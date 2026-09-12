/*
 * Terramancers HTML5 restoration - browser renderer and UI shell.
 * Modified/ported for the HTML5 restoration: 2026-09-12.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See ../LICENSE and ../THIRD_PARTY_NOTICES.md.
 */
(function () {
  'use strict';

  const C = globalThis.TerramancersCore;
  const U = globalThis.TerramancersBrowserUtils;
  const TILESETS = globalThis.TERRAMANCERS_TILESETS;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', {alpha: false});
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const touch = document.getElementById('touch-controls');
  const padP1 = document.getElementById('pad-p1');
  const padP2 = document.getElementById('pad-p2');
  const gameMenuButton = document.getElementById('game-menu-button');

  const atlases = [];
  const chars = {};
  let treeImage = null;
  let renderer = null;
  let state = 'loading';
  let lastMode = 'single';
  let dpr = 1;
  let cssWidth = 800;
  let cssHeight = 600;
  let lastTime = performance.now();
  let simAccumulator = 0;
  let animationAccumulator = 0;
  const tickMs = 1000 / C.SIM_TPS;
  const animationMs = 1000 / C.FPS;
  const maxCatchUpTicks = 18; // approximately the original 100 ms frame-debt guard
  const maxAnimationSteps = 6;

  const translations = {
    en: {
      singlePlayer: 'Single Player', multiplayer: 'Multiplayer', instructions: 'Instructions', about: 'About', exit: 'Exit',
      easy: 'Easy', medium: 'Medium', hard: 'Hard', back: 'Back', playAgain: 'Play Again', returnMenu: 'Return to Main Menu',
      yourControl: 'Your territory', cpuControl: "Opponent's territory", player1: 'Player 1', player2: 'Player 2',
      youWin: 'You Win!', youLose: 'You Lose.', p1Wins: 'Player 1 Wins!', p2Wins: 'Player 2 Wins!', tie: 'Tie!',
      menu: 'Menu', closeTab: 'You can close this browser tab to exit.', language: 'Italiano',
      instructionsTitle: 'How to play',
      instructionsLines: [
        'Move across neutral tiles to claim them.',
        'If a newly claimed tile has a straight horizontal or vertical line to another of your tiles, with no obstacle in between, the tiles between them become yours too.',
        'In single player, trees continually claim territory for your opponent. Control more territory when the board is filled to win.',
        'Player 1: arrow keys. Player 2: W A S D. On phones and tablets, on-screen controls appear automatically.'
      ],
      aboutTitle: 'Terramancers',
      aboutLines: [
        'Created by Shai Shapira, 2012.'
      ],
      exitTitle: 'Exit'
    },
    it: {
      singlePlayer: 'Giocatore singolo', multiplayer: 'Multigiocatore', instructions: 'Istruzioni', about: 'Informazioni', exit: 'Esci',
      easy: 'Facile', medium: 'Medio', hard: 'Difficile', back: 'Indietro', playAgain: 'Gioca ancora', returnMenu: 'Torna al menu principale',
      yourControl: 'Il tuo territorio', cpuControl: 'Territorio avversario', player1: 'Giocatore 1', player2: 'Giocatore 2',
      youWin: 'Hai vinto!', youLose: 'Hai perso.', p1Wins: 'Vince il Giocatore 1!', p2Wins: 'Vince il Giocatore 2!', tie: 'Pareggio!',
      menu: 'Menu', closeTab: 'Puoi chiudere questa scheda del browser per uscire.', language: 'English',
      instructionsTitle: 'Come si gioca',
      instructionsLines: [
        'Muoviti sulle caselle neutrali per conquistarle.',
        'Se una nuova casella conquistata è collegata in linea orizzontale o verticale a un’altra tua casella, senza ostacoli in mezzo, conquisti anche tutte le caselle tra le due.',
        'In giocatore singolo, gli alberi conquistano continuamente territorio per l’avversario. Quando la mappa è piena, vince chi controlla più territorio.',
        'Giocatore 1: frecce. Giocatore 2: W A S D. Su telefoni e tablet compaiono automaticamente i comandi a schermo.'
      ],
      aboutTitle: 'Terramancers',
      aboutLines: [
        'Creato da Shai Shapira, 2012.'
      ],
      exitTitle: 'Esci'
    }
  };

  function initialLanguage() {
    try {
      const saved = localStorage.getItem('terramancers-language');
      if (saved === 'en' || saved === 'it') return saved;
    } catch { /* localStorage may be disabled */ }
    return (navigator.language || '').toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  let language = initialLanguage();
  const t = key => translations[language][key];

  const engine = new C.Engine({
    onEndGame: mode => openScoreboard(mode)
  });

  function image(url) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Could not load ' + url));
      im.src = url;
    });
  }

  async function loadAssets() {
    const terrain = await Promise.all([0,1,2,3,4,5].map(i => image(`assets/generated-tiles/terrain-${i}.png`)));
    terrain.forEach((im, i) => atlases[i] = im);
    const names = ['Astraea','Baldric','FBI','Mage','Professor','Princess'];
    const loaded = await Promise.all(names.map(n => image(`assets/Characters/${n}.png`)));
    names.forEach((n, i) => chars[n] = loaded[i]);
    treeImage = await image('assets/Trees/greenTrees.png');
  }

  function isMenuShellState() {
    return state === 'menu' || state === 'difficulty' || state === 'instructions' || state === 'about' || state === 'exit';
  }

  function resize() {
    cssWidth = Math.max(192, window.innerWidth || document.documentElement.clientWidth || 800);
    cssHeight = Math.max(192, window.innerHeight || document.documentElement.clientHeight || 600);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Active matches keep their original logical arena. Resizing only changes
    // how that frozen scene is letterboxed/scaled into the browser viewport.
    if (renderer) renderer.setViewport(cssWidth, cssHeight);

    // Menu exhibition arenas are intentionally rebuilt for the current viewport.
    if (renderer && isMenuShellState() && atlases.length) {
      engine.setScreenSize(cssWidth, cssHeight);
      engine.startExhibition();
      renderer.setSceneSize(cssWidth, cssHeight);
      renderer.attachMap(engine.currentLevel);
    }
  }

  class Renderer {
    constructor() {
      this.mapCanvas = document.createElement('canvas');
      this.mapCtx = this.mapCanvas.getContext('2d');
      this.sceneCanvas = document.createElement('canvas');
      this.sceneCtx = this.sceneCanvas.getContext('2d', {alpha: false});
      this.map = null;
      this.sceneWidth = cssWidth;
      this.sceneHeight = cssHeight;
      this.viewportWidth = cssWidth;
      this.viewportHeight = cssHeight;
      this.additions = [255,36,38,39,40,41,43,45,46,47,49];
      this.bases = [10,15,16,17];
      this.charForTerrain = ['Professor','Baldric','Princess','FBI','Astraea','Mage'];
      this.setSceneSize(cssWidth, cssHeight);
    }

    setViewport(width, height) {
      this.viewportWidth = width;
      this.viewportHeight = height;
    }

    setSceneSize(width, height) {
      this.sceneWidth = Math.max(192, Math.floor(width));
      this.sceneHeight = Math.max(192, Math.floor(height));
      if (this.sceneCanvas.width !== this.sceneWidth) this.sceneCanvas.width = this.sceneWidth;
      if (this.sceneCanvas.height !== this.sceneHeight) this.sceneCanvas.height = this.sceneHeight;
      this.sceneCtx.imageSmoothingEnabled = false;
    }

    attachMap(map) {
      this.map = map;
      this.mapCanvas.width = map.width;
      this.mapCanvas.height = map.height;
      this.mapCtx.imageSmoothingEnabled = false;
      map.onChange = (x, y) => this.drawMapTile(x, y);
      for (let x = 0; x < map.rowSize; x++) {
        for (let y = 0; y < map.columnSize; y++) this.drawMapTile(x, y);
      }
    }

    drawMapTile(x, y) {
      if (!this.map) return;
      const owner = this.map.tileset[x][y];
      const terrainId = engine.terrainTypes[owner];
      const atlas = atlases[terrainId];
      const base = this.map.base[x][y];
      const add = this.map.addition[x][y];
      const by = this.bases.indexOf(base);
      const ax = this.additions.indexOf(add);
      if (!atlas || by < 0 || ax < 0) return;
      this.mapCtx.drawImage(atlas, ax * 32, by * 32, 32, 32, x * 32, y * 32, 32, 32);
    }

    drawPlayer(target, player) {
      const terrain = engine.terrainTypes[player.tileset];
      const name = this.charForTerrain[terrain] || 'Mage';
      const im = chars[name];
      if (!im) return;

      let row;
      if (player.facing === C.DIRECTION_UP) row = 0;
      else if (player.facing === C.DIRECTION_LEFT || player.facing === C.DIRECTION_UP_LEFT || player.facing === C.DIRECTION_DOWN_LEFT) row = 1;
      else if (player.facing === C.DIRECTION_DOWN) row = 2;
      else row = 3;

      const frame = player.isMoving() ? player.animationFrame : 0;

      // Terramancer.draw -> Sprite.draw produces this historical anchor.
      const x = Math.trunc(player.x) - 48;
      const y = Math.trunc(player.y) - 80;
      target.drawImage(im, frame * 64, row * 64, 63, 63, x, y, 64, 64);
    }

    drawTree(target, tree) {
      if (!treeImage) return;
      const x = tree.xTile * 32 - 48 + 16;
      const y = tree.yTile * 32 - 150 + 16;
      target.drawImage(treeImage, 0, 0, 96, 150, x, y, 96, 150);
    }

    render() {
      const sctx = this.sceneCtx;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.imageSmoothingEnabled = false;
      sctx.fillStyle = '#000';
      sctx.fillRect(0, 0, this.sceneWidth, this.sceneHeight);

      if (this.map) {
        const mx = Math.trunc((this.sceneWidth - this.map.width) / 2);
        const my = Math.trunc((this.sceneHeight - this.map.height) / 2);
        sctx.drawImage(this.mapCanvas, mx, my);
      }
      for (const p of engine.players) this.drawPlayer(sctx, p);
      for (const obj of engine.objects) this.drawTree(sctx, obj);

      const fit = U.fitScene(this.sceneWidth, this.sceneHeight, this.viewportWidth, this.viewportHeight);
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cssWidth, cssHeight);
      ctx.drawImage(this.sceneCanvas, fit.left, fit.top, fit.drawWidth, fit.drawHeight);
      ctx.restore();
    }
  }

  function button(text, action, className) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    if (className) b.className = className;
    b.addEventListener('click', action);
    return b;
  }

  function setPanel(title, buttons, lines) {
    panel.replaceChildren();
    if (title) {
      const h = document.createElement('h1');
      h.textContent = title;
      panel.appendChild(h);
    }
    if (lines) {
      for (const line of lines) {
        const p = document.createElement('p');
        p.textContent = line;
        panel.appendChild(p);
      }
    }
    for (const spec of buttons) panel.appendChild(button(spec.text, spec.action, spec.className));
  }

  function updateControlsVisibility(overlayVisible) {
    const inGame = state === 'game';
    touch.hidden = overlayVisible || !inGame;
    padP1.hidden = !inGame;
    padP2.hidden = !inGame || lastMode !== 'multi';
    gameMenuButton.hidden = overlayVisible || !inGame;
    gameMenuButton.textContent = t('menu');
  }

  function showOverlay(show) {
    overlay.hidden = !show;
    updateControlsVisibility(show);
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    gameMenuButton.textContent = t('menu');
  }

  function toggleLanguage() {
    language = language === 'en' ? 'it' : 'en';
    try { localStorage.setItem('terramancers-language', language); } catch { /* ignored */ }
    applyLanguage();
    reopenCurrentPanel();
  }

  function menuButtons() {
    return [
      {text: t('singlePlayer'), action: openDifficulty},
      {text: t('multiplayer'), action: startMulti},
      {text: t('instructions'), action: openInstructions},
      {text: t('about'), action: openAbout},
      {text: t('exit'), action: openExit},
      {text: t('language'), action: toggleLanguage, className: 'secondary'}
    ];
  }

  function openMenu() {
    state = 'menu';
    clearKeys();
    engine.setScreenSize(cssWidth, cssHeight);
    engine.startExhibition();
    renderer.setSceneSize(cssWidth, cssHeight);
    renderer.attachMap(engine.currentLevel);
    setPanel('', menuButtons());
    showOverlay(true);
  }

  function openDifficulty() {
    state = 'difficulty';
    setPanel('', [
      {text: t('easy'), action: () => startSingle(1)},
      {text: t('medium'), action: () => startSingle(2)},
      {text: t('hard'), action: () => startSingle(3)},
      {text: t('back'), action: openMenu, className: 'secondary'}
    ]);
    showOverlay(true);
  }

  function openInstructions() {
    state = 'instructions';
    setPanel(t('instructionsTitle'), [
      {text: t('back'), action: openMenu}
    ], t('instructionsLines'));
    showOverlay(true);
  }

  function openAbout() {
    state = 'about';
    setPanel(t('aboutTitle'), [
      {text: t('back'), action: openMenu}
    ], t('aboutLines'));
    showOverlay(true);
  }

  function openExit() {
    state = 'exit';
    setPanel(t('exitTitle'), [
      {text: t('back'), action: openMenu}
    ], [t('closeTab')]);
    showOverlay(true);
    try { window.close(); } catch { /* browsers normally refuse this */ }
  }

  function reopenCurrentPanel() {
    if (state === 'menu') {
      setPanel('', menuButtons());
    } else if (state === 'difficulty') {
      openDifficulty();
    } else if (state === 'instructions') {
      openInstructions();
    } else if (state === 'about') {
      openAbout();
    } else if (state === 'exit') {
      openExit();
    } else if (state === 'single-score') {
      openScoreboard('single', true);
    } else if (state === 'multi-score') {
      openScoreboard('multi', true);
    }
  }

  function prepareGameScene() {
    engine.setScreenSize(cssWidth, cssHeight);
    renderer.setSceneSize(engine.screenWidth, engine.screenHeight);
    simAccumulator = 0;
    animationAccumulator = 0;
    clearKeys();
  }

  function startSingle(level) {
    lastMode = 'single';
    state = 'game';
    prepareGameScene();
    engine.startSinglePlayerGame(level);
    renderer.attachMap(engine.currentLevel);
    showOverlay(false);
  }

  function startMulti() {
    lastMode = 'multi';
    state = 'game';
    prepareGameScene();
    engine.startMultiplayerGame();
    renderer.attachMap(engine.currentLevel);
    showOverlay(false);
  }

  function openScoreboard(mode, force) {
    if (!force && state !== 'game') return;
    state = mode === 'single' ? 'single-score' : 'multi-score';
    clearKeys();
    const p1 = engine.getPlayerControl(1);
    const p2 = engine.getPlayerControl(2);
    let lines;
    if (mode === 'single') {
      lines = [`${t('yourControl')}: ${p1}%`, `${t('cpuControl')}: ${p2}%`, p1 > p2 ? t('youWin') : t('youLose')];
    } else {
      let result = t('tie');
      if (p1 > p2) result = t('p1Wins');
      if (p2 > p1) result = t('p2Wins');
      lines = [`${t('player1')}: ${p1}%`, `${t('player2')}: ${p2}%`, result];
    }
    setPanel('', [
      {text: t('playAgain'), action: () => mode === 'single' ? startSingle(engine.previousDifficulty) : startMulti()},
      {text: t('returnMenu'), action: openMenu}
    ], lines);
    showOverlay(true);
  }

  function leaveMatch() {
    if (state !== 'game') return;
    openMenu();
  }
  gameMenuButton.addEventListener('click', leaveMatch);

  const keyState = new Set();
  const keyMap = {
    ArrowLeft: [0, 'left'], ArrowRight: [0, 'right'], ArrowUp: [0, 'up'], ArrowDown: [0, 'down'],
    a: [1, 'left'], d: [1, 'right'], w: [1, 'up'], s: [1, 'down']
  };

  function applyKey(key, down) {
    const normalized = key.length === 1 ? key.toLowerCase() : key;
    const spec = keyMap[normalized];
    if (!spec || state !== 'game') return;
    const [pid, dir] = spec;
    if (pid >= engine.players.length) return;
    const p = engine.players[pid];
    const cap = dir[0].toUpperCase() + dir.slice(1);
    if (down) p['move' + cap]();
    else p['stopMoving' + cap]();
  }

  function clearKeys() {
    for (const key of keyState) applyKey(key, false);
    keyState.clear();
    for (const p of engine.players) {
      p.movingLeft = p.movingRight = p.movingUp = p.movingDown = false;
    }
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state === 'game') {
      e.preventDefault();
      leaveMatch();
      return;
    }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keyMap[k]) {
      e.preventDefault();
      if (!keyState.has(k)) {
        keyState.add(k);
        applyKey(k, true);
      }
    }
  }, {passive:false});

  window.addEventListener('keyup', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keyMap[k]) {
      e.preventDefault();
      keyState.delete(k);
      applyKey(k, false);
    }
  }, {passive:false});

  window.addEventListener('blur', clearKeys);

  function bindTouchPad(container, player) {
    container.querySelectorAll('[data-dir]').forEach(el => {
      const dir = el.dataset.dir;
      const cap = dir[0].toUpperCase() + dir.slice(1);
      const press = e => {
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch { /* optional */ }
        if (state === 'game' && engine.players[player]) engine.players[player]['move' + cap]();
      };
      const release = e => {
        e.preventDefault();
        if (engine.players[player]) engine.players[player]['stopMoving' + cap]();
        try {
          if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        } catch { /* optional */ }
      };
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('lostpointercapture', release);
    });
  }
  bindTouchPad(padP1, 0);
  bindTouchPad(padP2, 1);

  function advanceAnimations() {
    for (const player of engine.players) player.advanceAnimationFrame();
  }

  function frame(now) {
    let delta = now - lastTime;
    lastTime = now;
    if (!Number.isFinite(delta) || delta < 0) delta = 0;
    if (delta > 100) delta = 100;

    simAccumulator += delta;
    animationAccumulator += delta;

    let ticks = 0;
    while (simAccumulator >= tickMs && ticks < maxCatchUpTicks) {
      if (engine.currentLevel) engine.tick();
      simAccumulator -= tickMs;
      ticks++;
    }
    if (ticks === maxCatchUpTicks && simAccumulator >= tickMs) simAccumulator = 0;

    renderer.render();

    // The Java Sprite mutates its animation counter once per repaint. Repaint
    // targeted 60 Hz, so advance this state on a separate fixed 60 Hz clock;
    // requestAnimationFrame may be 60, 120, 144 Hz or another display rate.
    let animationSteps = 0;
    while (animationAccumulator >= animationMs && animationSteps < maxAnimationSteps) {
      advanceAnimations();
      animationAccumulator -= animationMs;
      animationSteps++;
    }
    if (animationSteps === maxAnimationSteps && animationAccumulator >= animationMs) animationAccumulator = 0;

    requestAnimationFrame(frame);
  }

  async function init() {
    applyLanguage();
    resize();
    try {
      await loadAssets();
      renderer = new Renderer();
      renderer.setViewport(cssWidth, cssHeight);
      if (!TILESETS || TILESETS.length !== 6) throw new Error('Tile definitions not loaded');
      openMenu();
      lastTime = performance.now();
      requestAnimationFrame(frame);
    } catch (err) {
      console.error(err);
      state = 'error';
      setPanel('Terramancers', [], [language === 'it' ? 'Impossibile caricare gli asset. Avvia il gioco da un server web statico e controlla la console del browser.' : 'Asset loading failed. Run the game from a static web server and check the browser console.']);
      showOverlay(true);
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => requestAnimationFrame(resize));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastTime = performance.now();
      simAccumulator = 0;
      animationAccumulator = 0;
      clearKeys();
    }
  });

  init();
})();
