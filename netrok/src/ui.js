/* Netrok 0.95 responsive UI - SPDX-License-Identifier: GPL-3.0-or-later */
(() => {
  'use strict';
  const I = window.NetrokI18n;
  const tr = (key, vars={}) => I ? I.t(key, vars) : key;
  const app = document.getElementById('app');
  const dialog = document.getElementById('appMenu');
  const open = document.getElementById('openMenu');
  const close = document.getElementById('closeMenu');
  const resume = document.getElementById('resumeGame');
  const newGame = document.getElementById('newGame');
  const restart = document.getElementById('restartLevel');
  const originalMenu = document.getElementById('originalMenu');
  const music = document.getElementById('musicToggle');
  const effects = document.getElementById('effectsToggle');
  const touchMode = document.getElementById('touchMode');
  const renderMode = document.getElementById('renderMode');
  const cheatEnable = document.getElementById('cheatEnable');
  const cheatLives = document.getElementById('cheatLives');
  const cheatInvulnerable = document.getElementById('cheatInvulnerable');
  const cheatFreezeTime = document.getElementById('cheatFreezeTime');
  const cheatShields = document.getElementById('cheatShields');
  const cheatUpgrade = document.getElementById('cheatUpgrade');
  const cheatLevel = document.getElementById('cheatLevel');
  const cheatGoLevel = document.getElementById('cheatGoLevel');
  const cheatFillShields = document.getElementById('cheatFillShields');
  const cheatAddScore = document.getElementById('cheatAddScore');
  const openEditor = document.getElementById('openEditor');
  const playCustomLevel = document.getElementById('playCustomLevel');
  const importCustomLevel = document.getElementById('importCustomLevel');
  const clearCustomLevel = document.getElementById('clearCustomLevel');
  const customLevelFile = document.getElementById('customLevelFile');
  const customLevelStatus = document.getElementById('customLevelStatus');
  const CUSTOM_LEVEL_KEY = 'netrok095.customLevel.v1';
  const SETTINGS_KEY = 'netrok095.settings.v1';
  const MAX_LEVEL_FILE_BYTES = 256 * 1024;
  const retryLoad = document.getElementById('retryLoad');
  const loadingText = document.getElementById('loadingText');
  const touch = document.getElementById('touchControls');
  const publicStatus = document.getElementById('publicStatus');
  const gameFrame = document.querySelector('.gameFrame');
  const internalStatus = document.getElementById('status');
  const loading = document.getElementById('loadingLabel');
  let pausedByMenu = false;

  function api() { return window.NetrokGameUI || null; }

  function readSettings() {
    const defaults = { music: true, effects: true, touch: 'auto', render: 'crisp' };
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return defaults;
      return {
        music: raw.music !== false, effects: raw.effects !== false,
        touch: ['auto','on','off'].includes(raw.touch) ? raw.touch : 'auto',
        render: ['crisp','smooth','cleanhd4x'].includes(raw.render) ? raw.render : 'crisp'
      };
    } catch (_) { return defaults; }
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ music: music.checked, effects: effects.checked, touch: touchMode.value, render: renderMode.value })); } catch (_) {}
  }
  const settings = readSettings();

  let fitRaf = 0;
  function fitGameFrame() {
    if (!gameFrame) return;
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => {
      // Measure all page chrome independently from the game frame, then fit
      // the original 320x200 (8:5) viewport by both width and height.
      gameFrame.style.width = '';
      gameFrame.style.height = '';
      const appStyle = getComputedStyle(app);
      const innerWidth = app.clientWidth
        - parseFloat(appStyle.paddingLeft || 0)
        - parseFloat(appStyle.paddingRight || 0);
      const appHeight = app.getBoundingClientRect().height;
      const frameHeight = gameFrame.getBoundingClientRect().height;
      const chromeHeight = Math.max(0, appHeight - frameHeight);
      const availableHeight = Math.max(80, window.innerHeight - chromeHeight - 2);
      const width = Math.max(128, Math.min(innerWidth, availableHeight * 8 / 5));
      gameFrame.style.width = `${Math.floor(width)}px`;
      gameFrame.style.height = `${Math.floor(width * 5 / 8)}px`;
    });
  }

  function parseLegacyLevel(text, name = tr('editor.import')) {
    const values = String(text).trim().split(/\s+/).filter(Boolean).map(Number);
    if (values.length !== 5200 || values.some(v => !Number.isInteger(v))) throw new Error(tr('file.invalid_level'));
    const background = values.slice(0, 3);
    if (background.some(v => v < 0 || v > 255)) throw new Error(tr('file.invalid_bg'));
    if (values.slice(3).some(v => v < 0 || v > 203)) throw new Error(tr('file.unsupported_blocks'));
    return { version: 1, name, background, tiles: values };
  }
  function getSavedCustomLevel() {
    try {
      const raw = localStorage.getItem(CUSTOM_LEVEL_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.tiles) || data.tiles.length !== 5200) return null;
      return data;
    } catch (_) { return null; }
  }
  function updateCustomStatus(message) {
    const data = getSavedCustomLevel();
    customLevelStatus.classList.toggle('hasCustom', !!data);
    customLevelStatus.textContent = message || (data ? tr('extras.ready',{name:data.name || tr('editor.untitled')}) : tr('extras.none'));
    playCustomLevel.disabled = !data; clearCustomLevel.disabled = !data;
  }
  function showPanel(id) {
    document.querySelectorAll('.menuPanel').forEach(p => p.classList.toggle('active', p.id === id));
    document.querySelectorAll('.menuNav [data-panel]').forEach(b => b.classList.toggle('active', b.dataset.panel === id));
  }
  function applyTouchMode(value) {
    touch.classList.remove('auto','show');
    if (value === 'auto') touch.classList.add('auto');
    if (value === 'on') touch.classList.add('show');
    fitGameFrame();
  }
  function applyRenderMode(value) { app.classList.toggle('smooth', value === 'smooth'); app.classList.toggle('cleanhd', value === 'cleanhd4x'); const a = api(); if (a && a.setRenderMode) a.setRenderMode(value); }
  function updateCheatAvailability() {
    const enabled = cheatEnable.checked;
    [cheatLives, cheatInvulnerable, cheatFreezeTime, cheatShields, cheatUpgrade, cheatLevel, cheatGoLevel, cheatFillShields, cheatAddScore].forEach(el => { if (el) el.disabled = !enabled; });
  }
  function syncCheatsFromState() {
    const a = api(); if (!a) return;
    const st = a.state(); const c = st.cheats || {};
    cheatEnable.checked = !!c.enabled;
    cheatLives.checked = !!c.infiniteLives;
    cheatInvulnerable.checked = !!c.invulnerable;
    cheatFreezeTime.checked = !!c.freezeTime;
    cheatShields.checked = !!c.infiniteShields;
    cheatUpgrade.value = String(st.upgrade ?? 0);
    cheatLevel.value = String(st.level || 1);
    updateCheatAvailability();
    updateCustomStatus();
  }
  function pushCheatToggles() {
    const a = api(); if (!a) return;
    a.setCheats({
      enabled: cheatEnable.checked,
      infiniteLives: cheatLives.checked,
      invulnerable: cheatInvulnerable.checked,
      freezeTime: cheatFreezeTime.checked,
      infiniteShields: cheatShields.checked
    });
  }
  function openMenu() {
    const a = api();
    pausedByMenu = false;
    if (a) {
      const st = a.state();
      syncCheatsFromState();
      if (st.mode === 'play' && !st.paused && !st.transition) { a.pause(); pausedByMenu = true; }
      resume.textContent = st.mode === 'play' ? tr('game.resume') : (st.hasSavedGame ? tr('game.continue_saved') : tr('game.back_to_game'));
    }
    showPanel('gamePanel');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
  }
  function closeMenu({resumeGame = true} = {}) {
    if (dialog.open && typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    if (resumeGame && pausedByMenu && api()) api().resume();
    pausedByMenu = false;
    document.getElementById('game').focus({preventScroll:true});
  }

  open.addEventListener('click', openMenu);
  close.addEventListener('click', () => closeMenu());
  dialog.addEventListener('cancel', e => { e.preventDefault(); closeMenu(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) closeMenu(); });
  document.querySelectorAll('.menuNav [data-panel]').forEach(b => b.addEventListener('click', () => showPanel(b.dataset.panel)));

  resume.addEventListener('click', () => { const a=api(); if(a){const st=a.state(); if(st.mode!=='play'&&st.hasSavedGame){if(a.continueSaved()){pausedByMenu=false;closeMenu({resumeGame:false});return;}}} closeMenu(); });
  newGame.addEventListener('click', () => { const a=api(); if(!a)return; const st=a.state(); if((st.mode==='play'||st.hasSavedGame)&&!window.confirm(tr('dialog.new_confirm')))return; a.newGame(); pausedByMenu=false; closeMenu({resumeGame:false}); });
  restart.addEventListener('click', () => { if(api()) api().restartLevel(); pausedByMenu=false; closeMenu({resumeGame:false}); });
  originalMenu.addEventListener('click', () => { if(api()) api().originalMenu(); pausedByMenu=false; closeMenu({resumeGame:false}); });
  music.addEventListener('change', () => { if(api()) api().setMusic(music.checked); saveSettings(); });
  effects.addEventListener('change', () => { if(api()) api().setEffects(effects.checked); saveSettings(); });
  touchMode.addEventListener('change', () => { applyTouchMode(touchMode.value); saveSettings(); });
  renderMode.addEventListener('change', () => { applyRenderMode(renderMode.value); saveSettings(); });
  cheatEnable.addEventListener('change', () => {
    if (!cheatEnable.checked) { cheatLives.checked = cheatInvulnerable.checked = cheatFreezeTime.checked = cheatShields.checked = false; }
    pushCheatToggles(); updateCheatAvailability();
  });
  [cheatLives, cheatInvulnerable, cheatFreezeTime, cheatShields].forEach(el => el.addEventListener('change', pushCheatToggles));
  cheatUpgrade.addEventListener('change', () => { if (api()) api().cheatSetUpgrade(Number(cheatUpgrade.value)); });
  cheatFillShields.addEventListener('click', () => { if (api()) api().cheatFillShields(); });
  cheatAddScore.addEventListener('click', () => { if (api()) api().cheatAddScore(5000); });
  cheatGoLevel.addEventListener('click', () => {
    if (api() && api().cheatSetLevel(Number(cheatLevel.value))) { pausedByMenu = false; closeMenu({resumeGame:false}); }
  });

  openEditor.addEventListener('click', () => { window.location.href = 'editor/index.html'; });
  playCustomLevel.addEventListener('click', () => {
    const data = getSavedCustomLevel();
    if (data && api() && api().playCustomLevel(data)) { pausedByMenu = false; closeMenu({resumeGame:false}); }
  });
  importCustomLevel.addEventListener('click', () => customLevelFile.click());
  customLevelFile.addEventListener('change', async () => {
    const file = customLevelFile.files && customLevelFile.files[0];
    if (!file) return;
    try {
      if (file.size > MAX_LEVEL_FILE_BYTES) throw new Error(tr('file.too_large'));
      const data = parseLegacyLevel(await file.text(), file.name);
      localStorage.setItem(CUSTOM_LEVEL_KEY, JSON.stringify(data));
      updateCustomStatus(tr('extras.imported',{name:file.name}));
    } catch (err) { updateCustomStatus(tr('extras.import_failed',{message:err.message})); }
    customLevelFile.value = '';
  });
  clearCustomLevel.addEventListener('click', () => {
    localStorage.removeItem(CUSTOM_LEVEL_KEY); updateCustomStatus(tr('extras.cleared'));
  });

  music.checked = settings.music; effects.checked = settings.effects; touchMode.value = settings.touch; renderMode.value = settings.render;
  applyTouchMode(settings.touch);
  applyRenderMode(settings.render);
  window.addEventListener('resize', fitGameFrame, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitGameFrame, { passive: true });
  fitGameFrame();
  updateCheatAvailability();
  updateCustomStatus();
  document.addEventListener('netrok-ready', () => {
    const a=api(); if(a){a.setMusic(settings.music);a.setEffects(settings.effects);}
    loading.classList.add('hidden'); publicStatus.textContent = a&&a.hasSavedGame() ? tr('common.saved_ready') : tr('common.ready');
  });
  document.addEventListener('netrok-load-error', e => {
    if (loadingText) loadingText.textContent = tr('load.failed',{message:e.detail && e.detail.message ? e.detail.message : tr('load.unknown')});
    if (retryLoad) retryLoad.hidden = false; publicStatus.textContent = tr('load.unable');
  });

  document.addEventListener('netrok-language-change', () => {
    updateCustomStatus();
    const a = api();
    if (a) {
      const st = a.state();
      resume.textContent = st.mode === 'play' ? tr('game.resume') : (st.hasSavedGame ? tr('game.continue_saved') : tr('game.back_to_game'));
    }
    if (internalStatus.textContent) publicStatus.textContent = I ? I.translateGameMessage(internalStatus.textContent) : internalStatus.textContent;
  });
  if (retryLoad) retryLoad.addEventListener('click', () => window.location.reload());
  const obs = new MutationObserver(() => { if (internalStatus.textContent) publicStatus.textContent = I ? I.translateGameMessage(internalStatus.textContent) : internalStatus.textContent; });
  obs.observe(internalStatus, { childList: true, characterData: true, subtree: true });
})();
