/* SPDX-License-Identifier: GPL-3.0-or-later */
(function (root) {
  'use strict';
  const W = root.Wok;
  class Input {
    constructor(canvas, game, onUserGesture) {
      this.canvas = canvas;
      this.game = game;
      this.onUserGesture = onUserGesture || (() => {});
      this.bind();
    }
    point(e) {
      const r = this.canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * 640 / r.width,
        y: (e.clientY - r.top) * 480 / r.height
      };
    }
    bind() {
      this.canvas.addEventListener('pointermove', e => {
        const p = this.point(e);
        this.game.setPointer(p.x, p.y, this.game.mouse.down);
      });
      this.canvas.addEventListener('pointerdown', e => {
        e.preventDefault();
        const p = this.point(e);
        this.game.setPointer(p.x, p.y, true);
        this.onUserGesture();
        try { this.canvas.setPointerCapture(e.pointerId); } catch { /* ignored */ }
      });
      const up = e => {
        if (e) e.preventDefault();
        this.game.setPointerDown(false);
      };
      this.canvas.addEventListener('pointerup', up);
      this.canvas.addEventListener('pointercancel', up);
      this.canvas.addEventListener('contextmenu', e => e.preventDefault());
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.game.handleEscape();
        }
      });
    }
  }
  W.Input = { Input };
})(window);
