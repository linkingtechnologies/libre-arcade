// Local addition, not upstream (see specs/html5-space-invaders/design.md's "Local
// modifications") — scales #game-canvas to the viewport instead of upstream's own fixed
// 672x768-on-the-page-at-native-size layout.
//
// Unlike html5-snake's own size.js (which resizes the canvas DRAWING BUFFER, i.e. the
// width/height *attributes*, because that game's own game.js recomputes every position from
// canvas.width/canvas.height), this game's game.js hardcodes absolute pixel positions throughout
// (672, 768, 672/2, 768/2, and more — grep game.js for the literal numbers) rather than deriving
// them from canvas.width/height at all. Changing the canvas *attributes* here would desync every
// hardcoded position from the actual drawing surface and visibly break the game (aliens/UI drawn
// as if the board were still 672x768, on a differently-sized buffer). So this script leaves
// canvas.width/canvas.height (the drawing-buffer resolution game.js's coordinate math assumes)
// untouched at their markup values (672x768) and instead sets the canvas element's CSS
// width/height (its on-page display size) — the browser scales the whole rendered buffer
// uniformly to fit, which preserves every relative position exactly since the internal coordinate
// space never changes.
//
// Loaded the same way as html5-snake's size.js: an external "defer" script, not an inline one at
// the canvas's own parse position — see specs/html5-snake/design.md's own account of why an
// inline version of that pattern was tried first and replaced for a different (deferred-script
// ordering) reason. Order relative to game.js doesn't actually matter here (this script never
// touches anything game.js defines, and vice versa) — listed first anyway, for consistency with
// the html5-snake file layout.
(function () {
  var canvas = document.getElementById('game-canvas');
  var aspect = canvas.width / canvas.height;
  var maxWidth = window.innerWidth * 0.9;
  var maxHeight = window.innerHeight * 0.9;
  var width = maxWidth;
  var height = width / aspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
})();
