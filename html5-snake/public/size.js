// Local addition, not upstream (see specs/html5-snake/design.md's "Local modifications") — sizes
// #the-game's canvas from the actual viewport instead of upstream's own hardcoded 320x240.
//
// A plain inline <script> (synchronous, runs immediately at its own parse position) was tried
// first and produced a canvas far smaller than expected (160x120 against a 1280x720 window) —
// found live: window.innerWidth/innerHeight can read a transient, not-yet-final value that early
// in page load in some contexts (confirmed against this project's own browser-preview tooling).
// This file is loaded the same way game.js is — "defer", not a bare <script src> — specifically
// so it runs after the browser has finished parsing the whole document (the same guarantee
// "defer" already gives game.js itself, see ../../dashboard-html5-snake.inc.php's own comment on
// why that was needed) instead of racing it. Deferred scripts run in the order they appear in the
// document, so this file's own <script defer> tag is placed BEFORE game.js's — this always
// finishes setting canvas.width/height before game.js's own top-level code (which reads
// canvas.width/height exactly once, to compute snake.size and every position derived from it —
// see that same design.md section) ever runs.
//
// Grid-aligned on purpose, not just "fits the window": COLS is forced to a multiple of 4 so ROWS
// (COLS * 3/4, keeping game.js's own original 4:3 ratio) is a whole number too, landing both
// canvas.width (COLS*40) and canvas.height (ROWS*40) on exact multiples of the 40px tile size
// snake.size derives from — the same "non-grid-aligned dimensions eventually drift the snake
// outside the board" lesson specs/react-simple-snake/design.md documents in detail for a very
// similar bug in a different game, applied here preemptively.
(function () {
  var canvas = document.getElementById('the-game');
  var maxWidth = window.innerWidth * 0.8;
  var maxHeight = window.innerHeight * 0.8;
  var colsByWidth = Math.floor(maxWidth / 40 / 4) * 4;
  var colsByHeight = Math.floor((maxHeight / 30) / 4) * 4;
  var cols = Math.max(4, Math.min(colsByWidth, colsByHeight));
  canvas.width = cols * 40;
  canvas.height = cols * 30;
})();
