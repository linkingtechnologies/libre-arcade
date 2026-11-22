// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Compatibility shim for the 2013 game (specs/design.md lists every change; COMPATIBILITY-ISSUES.md the reasons).
// It changes no gameplay rule: it prepares the page, loads the original scripts/game.js, then (after it) adds
// text translation (i18n.js) and a refit of the canvas when the window changes size.
(function () {
  "use strict";

  // C4: the original calls ga('send', ...) for analytics (pause, mute, level summary...). The tracker was removed;
  // this no-op keeps those 12 call sites from throwing.
  if (typeof window.ga !== "function") { window.ga = function () {}; }

  // C6: Quintus reads the window size once, when the game starts. A window that has no size yet (hidden tab or pane)
  // produced a 0 px wide canvas. Start the game only once the window has a size.
  function hasSize() { return window.innerWidth > 0 && window.innerHeight > 0; }

  // Canvas text uses web fonts. Wait for them (at most 3 s) so the first screens never draw in a fallback font.
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) { return Promise.resolve(); }
    var loads = Promise.all([document.fonts.load('36px "Boogaloo"'), document.fonts.load('100px "Jolly Lodger"')]);
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 3000); });
    return Promise.race([loads, timeout]).catch(function () {});
  }

  // ---- Italian / English: translate a label when its sprite measures it (Text.calcSize) or is created (Button.init) ----
  function installTranslation(Q) {
    var t = window.HealI18n && window.HealI18n.t;
    if (!t || window.HealI18n.lang === "en") { return; }
    var textProto = Q.UI.Text.prototype, calcSize = textProto.calcSize;
    textProto.calcSize = function () {
      if (typeof this.p.label === "string") { this.p.label = t(this.p.label); }
      return calcSize.apply(this, arguments);
    };
    var buttonProto = Q.UI.Button.prototype, buttonInit = buttonProto.init;
    buttonProto.init = function (p, defaults, callback) {
      if (p && typeof p.label === "string") { p.label = t(p.label); }
      return buttonInit.call(this, p, defaults, callback);
    };
  }

  // ---- Resize / rotation: the original sized the canvas once. Same sizing rules as Q.setup (maximize, upsample 640x320),
  //      then the current screen is built again so its layout follows the new size. ----
  function installRefit(Game) {
    var Q = Game.Q, timer = null;

    function refit() {
      if (!hasSize()) { return; }
      var w = Math.min(window.innerWidth, 5000), h = Q.touchDevice ? Math.min(window.innerHeight, 5000) : Math.min(window.innerHeight - 5, 5000);
      if (w === Q.cssWidth && h === Q.cssHeight) { return; }
      var upsample = w <= 640 || h <= 320;             // Q.setup({upsampleWidth: 640, upsampleHeight: 320})
      Q.el.style.height = h + "px"; Q.el.style.width = w + "px";
      Q.el.width = upsample ? w * 2 : w; Q.el.height = upsample ? h * 2 : h;
      if (Q.wrapper) { Q.wrapper.style.width = w + "px"; }
      Q.width = Q.el.width; Q.height = Q.el.height; Q.cssWidth = w; Q.cssHeight = h;
      restageCurrentScreen();
    }

    function restageCurrentScreen() {
      var s = Game.currentScreen || "";
      if (s === "start") { Game.stageStartScreen(); }
      else if (s === "levelSelect") { Game.stageLevelSelectScreen(); }
      else if (s === "controls") { Game.stageControlsScreen(); }
      else if (s === "gameOver") { Game.stageGameOverScreen(); }
      else if (s === "end") { Game.stageEndScreen(); }
      else if (s.indexOf("levelSummary") === 0) { Game.stageEndLevelScreen(); }
      else if (/^level\d/.test(s) && Q.stage(0) && !Q.stage(0).paused) {
        // in a level only the HUD and the touch pad depend on the window size; the world keeps running
        Q.stageScene("hud", 1, { sort: true });
        if (Q.touchDevice) { Q.input.touchControls(); }
      }
    }

    function later() { clearTimeout(timer); timer = setTimeout(refit, 250); }
    window.addEventListener("resize", later);
    window.addEventListener("orientationchange", later);
    window.HealCompat = { refit: refit };
  }

  function loadGame() {
    var script = document.createElement("script");
    script.src = "scripts/game.js";
    script.onload = function () {
      installTranslation(window.Game.Q);
      installRefit(window.Game);
    };
    document.body.appendChild(script);
  }

  function boot() { fontsReady().then(loadGame); }

  if (hasSize()) {
    boot();
  } else {
    window.addEventListener("resize", function onResize() {
      if (hasSize()) { window.removeEventListener("resize", onResize); boot(); }
    });
  }
})();
