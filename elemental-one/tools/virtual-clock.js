// SPDX-License-Identifier: MIT
// Injected before page scripts by tools/trace.mjs. Replaces wall-clock time,
// requestAnimationFrame and Math.random with deterministic versions so the
// original and the restored game can be stepped frame by frame and compared.
(function () {
  var now = 1000000, queue = [], nextId = 0;
  var seed = 20131227;
  Math.random = function () {
    seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Date.now = function () { return Math.floor(now); };
  performance.now = function () { return now; };
  window.requestAnimationFrame = function (cb) { queue.push({ id: ++nextId, cb: cb }); return nextId; };
  window.cancelAnimationFrame = function (id) { queue = queue.filter(function (q) { return q.id !== id; }); };
  // Jump the clock forward to a fixed value so both builds share the same sub-frame phase
  // from here on (tweens are time based and otherwise differ by up to a frame).
  window.__align = function (t) { if (t > now) now = t; };
  window.__step = function (n) {
    for (var i = 0; i < (n || 1); i++) {
      now += 1000 / 60;
      var q = queue; queue = [];
      for (var j = 0; j < q.length; j++) q[j].cb(now);
    }
  };
  // Scene digest: every sprite/text in the Phaser world, in tree order.
  function walk(o, out) {
    var kids = o.children || [];
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c.children && c.children.length !== undefined && !c.texture) { walk(c, out); continue; }
      out.push([(typeof c.key === 'string' && c.key) || (c.text ? 'text:' + String(c.text).slice(0, 12) : (c.constructor && c.constructor.name) || '?'),
        +(c.x).toFixed(3), +(c.y).toFixed(3), c.exists === false ? 0 : 1, +((c.alpha === undefined ? 1 : c.alpha)).toFixed(3),
        c.body ? +(c.body.velocity.x).toFixed(3) : null, c.body ? +(c.body.velocity.y).toFixed(3) : null,
        c.animations && c.animations.currentAnim ? c.animations.currentAnim.name + ':' + c.animations.frame : null,
        (typeof c.element === 'string' && c.element) || null]);
      if (c.children && c.children.length) walk(c, out);
    }
  }
  // Test-only: move the player sprite (key 'p1') to a position, as a scenario step.
  window.__tp = function (x, y) {
    var out = [], g = Phaser.GAMES[0];
    (function find(o) { (o.children || []).forEach(function (c) { if (c.key === 'p1') out.push(c); else if (!c.texture) find(c); }); })(g.world._container);
    var p = out[0]; p.x = x; p.y = y; p.body.velocity.x = 0; p.body.velocity.y = 0;
    return [p.x, p.y];
  };
  window.__digest = function () {
    var g = Phaser.GAMES[0], out = [];
    walk(g.world._container, out);
    var cam = g.camera;
    return { state: g.state.current, cam: [cam.x, cam.y], objs: out };
  };
})();
