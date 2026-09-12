/* SPDX-License-Identifier: GPL-3.0-or-later */
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const loading = document.getElementById('loading');
  const quitOverlay = document.getElementById('quit-overlay');
  const backButton = document.getElementById('back-button');

  function readHiScore() {
    try {
      const n = Number(localStorage.getItem('wok.hiScore'));
      return Number.isFinite(n) && n > 0 ? n : 1000000;
    } catch { return 1000000; }
  }
  function saveHiScore(n) {
    try { localStorage.setItem('wok.hiScore', String(n)); } catch { /* ignored */ }
  }

  async function boot() {
    const assets = new Wok.Assets.AssetLoader();
    const audio = new Wok.Audio.AudioManager();
    audio.preload();

    try {
      await assets.load();
    } catch (err) {
      console.error(err);
      loading.textContent = 'Unable to load Wok assets.';
      return;
    }

    const game = new Wok.Core.Game({ hiScore: readHiScore() });
    const renderer = new Wok.Renderer.Renderer(canvas, assets);
    new Wok.Input.Input(canvas, game, () => audio.unlock());

    loading.hidden = true;
    canvas.hidden = false;
    canvas.focus();

    backButton.addEventListener('click', () => {
      quitOverlay.hidden = true;
      game.quitRequested = false;
      canvas.focus();
    });

    let previous = performance.now();
    let accumulator = 0;
    const STEP_MS = 10;

    function frame(now) {
      let elapsed = now - previous;
      previous = now;
      if (elapsed > 250) elapsed = 250;
      accumulator += elapsed;

      let steps = 0;
      while (accumulator >= STEP_MS && steps < 5) {
        game.step();
        accumulator -= STEP_MS;
        steps++;
      }
      if (steps === 5 && accumulator >= STEP_MS) accumulator = 0;

      renderer.draw(game);
      audio.process(game.drainAudio());

      if (game.hiScoreChanged) {
        saveHiScore(game.hiScore);
        game.hiScoreChanged = false;
      }
      if (game.quitRequested && quitOverlay.hidden) quitOverlay.hidden = false;

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  boot();
})();
