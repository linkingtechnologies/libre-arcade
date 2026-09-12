// react-simple-snake — entry point (see AGENTS.md's "SPA Entry Points": this is the explicit,
// requested exception to "no React" — react-simple-snake IS a React component, vendored, not
// built by us; nothing else in this plugin uses React and this file doesn't set any precedent
// for that). Same manual-mount shape every other entry point here uses (root via
// document.getElementById("app"), no unused state, no framework beyond what the vendored game
// itself needs) — just React's own render call instead of lit-html's.
//
// No WorkTableClient: this game persists nothing but its own local high score
// (localStorage["snakeHighScore"], set directly by the vendored component — see
// specs/react-simple-snake/design.md's "State shape"), so per AGENTS.md's Data Access section a
// client isn't needed here at all.
import React from "./vendor/react.esm.js";
import ReactDOM from "./vendor/react-dom.esm.js";
import Snake from "./vendor/react-simple-snake.esm.js";

const root = document.getElementById("app");

// Idempotency guard: a module loaded via <script type="module"> only ever executes once per
// real page load, but re-running this file's own top-level code a second time (any future
// refactor that re-imports it, a dev-tools re-eval, etc.) would call ReactDOM.render() into the
// same #app a second time — react-simple-snake's own render() always includes an id="GameBoard"
// element, and a duplicate id in the DOM is exactly the kind of thing that produces the
// "snake looks split into disconnected pieces" symptom reported live (document.getElementById
// only ever returns the FIRST match, so the vendored component's own internal
// document.getElementById("GameBoard") calls could silently read stale/wrong-instance geometry
// once two copies exist). Cheap and harmless to check even though the normal single-page-load
// case never needs it.
if (root.dataset.mounted) {
  throw new Error("react-simple-snake app.js: already mounted, refusing a second render into #app");
}
root.dataset.mounted = "1";

// Local workaround, not upstream (see specs/react-simple-snake/design.md's "Local modifications"
// for the full writeup): the vendored component reads
// document.getElementById("GameBoard").parentElement.offsetWidth exactly once, synchronously,
// inside componentDidMount — no resize listener, no retry. Mounting immediately on module
// execution sometimes lands before the browser has committed a layout pass for this freshly
// loaded page, so that first read can come back near-zero, and the component permanently clamps
// itself to its 30x20 minimum-size fallback for the rest of the session (reported live as "the
// snake exits the board" — the board rendered far smaller than its own block grid expects,
// confirmed live by re-calling the component's own initGame() after load: it recomputes the
// correct size every time, the bug is purely about what offsetWidth reads on that one
// mount-time call).
//
// A single setTimeout(fn, 0) was tried first and fixed it in isolation, but a fixed one-macrotask
// delay is still just a guess at how long layout takes to stabilize — fine for a bare, minimal
// standalone page, not necessarily enough inside the full Camila page (its own stylesheets/tab
// bar/other chrome all loading and reflowing at the same time). Polling until #app itself
// actually reports a real width — not just "one tick has passed" — removes the guesswork
// entirely: mount only once the number react-simple-snake is about to read is known-good, however
// long that actually takes. requestAnimationFrame (tried before setTimeout) was rejected
// separately: confirmed live that it never fires at all in a backgrounded/non-composited tab
// (this project's own browser-preview tooling doesn't composite frames for an unfocused pane) —
// setTimeout has no such dependency, which is also why the retry loop below uses it too, not rAF.
// percentageWidth={100}: #app itself is now given a fixed, exact-multiple-of-30 pixel width
// (see ../../dashboard-react-simple-snake.inc.php and index.html's own <style> — 360px) instead
// of leaving Bulma's responsive .container/.box to decide it and asking the component for some
// percentage of that. 100% of an already-clean number, rather than "60% of whatever the page
// layout produces", is what actually keeps the vendored component's own accumulated
// blockWidth math free of floating-point drift — see this file's own comment above and
// dashboard-react-simple-snake.inc.php's for the full "why" (this was the actual cause of the
// snake visibly leaving the board, not the mount-timing race the retry loop above fixes).
function mountWhenSized(attempt = 0) {
  if (root.offsetWidth > 0 || attempt >= 20) {
    ReactDOM.render(React.createElement(Snake, { percentageWidth: 100 }), root);
    return;
  }
  setTimeout(() => mountWhenSized(attempt + 1), 25);
}
mountWhenSized();
