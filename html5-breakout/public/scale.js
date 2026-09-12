// Local addition, not upstream (see specs/html5-breakout/design.md's "Local modifications") —
// fits #game-canvas within the viewport instead of letting it run at whatever size game.js's own
// init() already picked.
//
// Unlike html5-space-invaders' own scale.js (which has to run BEFORE game.js, since that game
// never touches canvas.width/height itself), this file has to run AFTER game.js: this game's own
// init() (called synchronously by the "breakout.start();" line at the very bottom of game.js, its
// own top-level code) already sets canvas.height = window.screen.availHeight - 100 and
// canvas.width = canvas.height * 0.8, unmodified from upstream — every position elsewhere in the
// game is derived from canvas.width/canvas.height already (confirmed by reading game.js: no
// hardcoded 800/950 literals anywhere in its body), so, unlike html5-space-invaders, there's
// nothing to fight there; upstream's own author already made this game fully responsive to
// whatever canvas.width/canvas.height end up being.
//
// The one real problem: window.screen.availHeight is the PHYSICAL SCREEN's available height, not
// the browser window/tab's own viewport height — on a tall monitor this can end up larger than
// the actual space this game gets inside Camila's #app takeover (position:fixed;inset:0, bound to
// the viewport, not the screen), so the canvas game.js itself sized can end up taller than what's
// actually visible, clipped by the viewport edge with nothing to scroll it back into view. Rather
// than fight window.screen.availHeight itself (would mean monkey-patching a global browser API
// before game.js runs, solely to feed it a smaller number — fragile, and risks side effects on
// anything else on the page that reads the real screen size), this script leaves game.js's own
// sizing alone and, same technique as html5-space-invaders' own scale.js, sets the canvas
// element's CSS width/height (its on-page display size, distinct from the width/height
// *attributes* game.js already set) to fit ~90% of the actual viewport while preserving whatever
// aspect ratio game.js's own canvas.width/canvas.height ended up at (read live, not assumed to be
// upstream's original 800:950 — game.js's own 0.8 ratio is reproduced here as an emergent
// property of reading the actual values, not duplicated as a literal).
//
// Loaded as an external "defer" script, with its own <script> tag placed AFTER game.js's — since
// deferred scripts run in document order, this guarantees game.js's own top-level
// "breakout.start()" (which runs init() synchronously, setting canvas.width/height, before
// kicking off its own requestAnimationFrame loop) has already finished by the time this runs.
(function () {
  var canvas = document.getElementById('game-canvas');
  var aspect = canvas.width / canvas.height;
  var maxWidth = window.innerWidth * 0.9;
  var maxHeight = window.innerHeight * 0.9;
  var height = maxHeight;
  var width = height * aspect;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspect;
  }
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
})();
