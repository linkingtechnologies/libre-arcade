// Local addition, not upstream — upstream's own index.html starts the game with a second,
// un-deferred inline <script> right after game.js's own <script> tag:
//   var spaceInvaders = new SpaceInvaders.Game();
//   spaceInvaders.start();
// That works there because a plain inline script runs synchronously at its own parse position,
// immediately after the classic (non-deferred) game.js tag right before it. This plugin instead
// loads game.js with "defer" (see ../../dashboard-html5-space-invaders.inc.php's own comment for
// why — the same camila_add_js() script-position guarantee html5-snake's own game.js needed), so
// the bootstrap has to be "defer" too, in its own external file, with its <script> tag placed
// AFTER game.js's — deferred scripts run in document order, so this guarantees window.SpaceInvaders
// already exists by the time this file runs.
(function () {
  var spaceInvaders = new SpaceInvaders.Game();
  spaceInvaders.start();
})();
