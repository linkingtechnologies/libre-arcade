/* Elemental One restoration - integration layer (Libre Arcade), not historical code.
 * SPDX-License-Identifier: MIT
 *
 * Wraps the unmodified historical game (js/phaser.js + js/game.js) with a title
 * screen, pause / restart / mute, English + Italian UI, responsive scaling and
 * touch buttons. It never touches game rules: touch buttons just dispatch the
 * same keyboard events the original reads, and the Italian text swap happens
 * when Phaser creates a text object. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var app = $('app');
  var game = null;          // the Phaser.Game instance, once started
  var paused = false;
  var muted = false;
  var lang = 'en';

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* storage may be blocked */ } return null; }

  /* ---------- language ---------- */
  var saved = store('elemental-one.lang');
  lang = saved === 'it' || saved === 'en' ? saved : ((navigator.language || 'en').toLowerCase().indexOf('it') === 0 ? 'it' : 'en');
  var query = /[?&]lang=(it|en)\b/.exec(location.search);
  if (query) lang = query[1];

  function t(key) { return (window.I18N.STR[lang] && window.I18N.STR[lang][key]) || window.I18N.STR.en[key] || key; }

  function applyLang() {
    document.documentElement.lang = lang;
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    var other = lang === 'en' ? 'IT' : 'EN';
    $('btn-lang').textContent = other; $('btn-lang2').textContent = other;
    $('btn-lang').setAttribute('aria-label', lang === 'en' ? 'Italiano' : 'English');
    $('btn-lang2').setAttribute('aria-label', lang === 'en' ? 'Italiano' : 'English');
    refreshToggles();
  }

  function refreshToggles() {
    $('btn-pause').textContent = t(paused ? 'ui.resume' : 'ui.pause');
    $('btn-mute').textContent = t(muted ? 'ui.unmute' : 'ui.mute');
    $('btn-mute').setAttribute('aria-pressed', muted ? 'true' : 'false');
  }

  function switchLang() {
    store('elemental-one.lang', lang === 'en' ? 'it' : 'en');
    // In-game texts are created per level, so a running game restarts from its menu.
    if (game) { location.hash = '#play'; location.reload(); } else { lang = lang === 'en' ? 'it' : 'en'; applyLang(); }
  }

  /* ---------- Italian text swap (keyed by the original English string) ---------- */
  function installTextHook() {
    var proto = Phaser.GameObjectFactory.prototype;
    var original = proto.text;
    proto.text = function (x, y, text, style, group) {
      if (lang === 'it' && window.I18N.GAME_TEXT_IT.hasOwnProperty(text)) text = window.I18N.GAME_TEXT_IT[text];
      return original.call(this, x, y, text, style, group);
    };
  }

  /* ---------- starting the historical game ---------- */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = function () { reject(new Error('failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  function start() {
    if (game || app.classList.contains('is-starting')) return;
    if (document.readyState !== 'complete') { window.addEventListener('load', start); return; }
    app.classList.add('is-starting');
    var fontReady = (document.fonts && document.fonts.load) ? document.fonts.load('18px minecraftiaregular').catch(function () {}) : Promise.resolve();
    Promise.all([fontReady, loadScript('js/phaser.js')]).then(function () {
      installTextHook();
      return loadScript('js/game.js');
    }).then(function () {
      window.ElementalOne.start();            // runs upstream main.js: creates the Phaser.Game
      var g = Phaser.GAMES[0];
      // Upstream does `window.onload = boot`. Our scripts arrive after the real load event,
      // so call that handler ourselves once Phaser itself has booted.
      (function waitBoot() {
        if (!g.isBooted) { setTimeout(waitBoot, 10); return; }
        game = g;
        if (typeof window.onload === 'function') window.onload();
        app.classList.remove('is-title', 'is-starting');
        app.classList.add('is-playing');
        game.sound.mute = muted;
        fit();
      })();
    }).catch(function (e) {
      app.classList.remove('is-starting');
      console.error(e);
    });
  }

  /* ---------- pause / restart / mute ---------- */
  function setPaused(p) {
    if (!game) return;
    paused = !!p;
    game.paused = paused;
    $('paused').hidden = !paused;
    refreshToggles();
  }

  function setMuted(m) {
    muted = !!m;
    store('elemental-one.mute', muted ? '1' : '0');
    if (game) game.sound.mute = muted;
    refreshToggles();
  }

  function levelEnded() {
    // Upstream shows the end screen by setting the stage background to 'black' on the last level.
    var bg = String(game.stage.backgroundColor).toLowerCase();
    return game.level === 'level4' && (bg === 'black' || bg === '#000' || bg === '#000000');
  }

  function restartLevel() {
    if (!game) return;
    if (paused) setPaused(false);
    if (/^level\d+$/.test(game.level) && !levelEnded()) {
      game.state.start(game.level);
    } else {
      location.hash = '#play'; location.reload();
    }
  }

  function toMenu() { location.hash = ''; location.reload(); }

  /* ---------- modal ---------- */
  var resumeAfterModal = false;
  function openModal(which) {
    var html = '<h2>' + t(which + '.title') + '</h2>' + t(which + '.body');
    $('modal-body').innerHTML = html;
    $('modal').hidden = false;
    if (game && !paused) { resumeAfterModal = true; setPaused(true); }
  }
  function closeModal() {
    $('modal').hidden = true;
    if (resumeAfterModal) { resumeAfterModal = false; setPaused(false); }
  }

  /* ---------- scaling ---------- */
  function fit() {
    var box = $('screen').getBoundingClientRect();
    var s = Math.max(0.1, Math.min(box.width / 806, box.height / 606));
    $('main').style.setProperty('--s', String(s));
  }

  /* ---------- keyboard + touch ---------- */
  var GAME_KEYS = { 37: 1, 38: 1, 39: 1, 40: 1, 32: 1, 90: 1, 88: 1, 13: 1 };

  function sendKey(type, code) {
    var e = new KeyboardEvent(type, { bubbles: true, cancelable: true, keyCode: code, which: code });
    if (e.keyCode !== code) {     // engines that ignore keyCode in the init dictionary
      Object.defineProperty(e, 'keyCode', { get: function () { return code; } });
      Object.defineProperty(e, 'which', { get: function () { return code; } });
    }
    window.dispatchEvent(e);
  }

  window.addEventListener('keydown', function (e) {
    if (!e.isTrusted) return;
    if (game && !paused && $('modal').hidden && GAME_KEYS[e.keyCode]) e.preventDefault();
    if (e.keyCode === 80 && game) { setPaused(!paused); }        // P
    else if (e.keyCode === 77) { setMuted(!muted); }              // M
    else if (e.keyCode === 27 && !$('modal').hidden) { closeModal(); }
  }, true);

  function wirePads() {
    var down = {};
    Array.prototype.forEach.call(document.querySelectorAll('.pbtn'), function (b) {
      var code = Number(b.getAttribute('data-key'));
      function press(e) {
        e.preventDefault();
        app.classList.add('touch');
        if (down[e.pointerId] !== undefined) return;
        down[e.pointerId] = code;
        b.classList.add('on');
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
        sendKey('keydown', code);
      }
      function release(e) {
        if (down[e.pointerId] === undefined) return;
        delete down[e.pointerId];
        b.classList.remove('on');
        sendKey('keyup', code);
      }
      b.addEventListener('pointerdown', press);
      b.addEventListener('pointerup', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('lostpointercapture', release);
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
  }

  /* ---------- wiring ---------- */
  function click(id, fn) { $(id).addEventListener('click', function (e) { fn(e); e.currentTarget.blur(); }); }

  click('btn-play', start);
  click('btn-how', function () { openModal('how'); });
  click('btn-credits', function () { openModal('credits'); });
  click('btn-info', function () { openModal('credits'); });
  click('modal-close', closeModal);
  click('btn-lang', switchLang);
  click('btn-lang2', switchLang);
  click('btn-pause', function () { setPaused(!paused); });
  click('btn-restart', restartLevel);
  click('btn-menu', toMenu);
  click('btn-mute', function () { setMuted(!muted); });

  // One-time gesture: browsers keep a pre-gesture AudioContext suspended.
  function unlockAudio() {
    if (game && game.sound && game.sound.context && game.sound.context.state === 'suspended') game.sound.context.resume();
  }
  ['pointerdown', 'keydown'].forEach(function (n) { window.addEventListener(n, unlockAudio, true); });

  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe($('screen'));
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) app.classList.add('touch');
  if (/[?&]pads=1\b/.test(location.search)) app.classList.add('touch');
  window.addEventListener('touchstart', function () { app.classList.add('touch'); }, { passive: true, once: true });

  muted = store('elemental-one.mute') === '1';
  wirePads();
  applyLang();
  fit();

  // Upstream's `window.onload = boot` must run exactly once: only auto-start after the real load event.
  if (location.hash === '#play') {
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  }
})();
