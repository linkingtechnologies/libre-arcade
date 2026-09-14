// Player progress (which levels are completed, per world) — persisted client-side only for now,
// deliberately NOT tied to a user account. Every localStorage touch is isolated behind this
// module's own functions (never called raw from a screen) so a future swap to server-side/
// account-bound persistence (see plugins/libre-arcade/AGENTS.md's Data Access section —
// WorkTableClient) only means rewriting read()/write() below, not touching every call site.
// Kept synchronous on purpose even with that future swap in mind: a synchronous localStorage
// read needs no loading state today, and forcing the public API to return Promises now would
// just push speculative async-handling complexity onto every screen for no present benefit.
//
// Key format matches the one existing localStorage precedent in this app
// (plugins/travel-planner/app-manage.js: "travel-planner:manage:lastCountry") — colon-namespaced
// "<plugin-dir>:<feature>:<key>".
//
// isWorldComplete()/isWorldUnlocked() (per-world completion gating world-select's lock icon)
// lived here until the Practice/Arcade mode split: Practice mode is meant to let the player try
// every level freely with no locks at all, and Arcade mode never visits world-select in the first
// place (it's a fixed world1->world4 sequence, see app.js's chooseArcade()/arcadeNextLevel()) — so
// nothing was calling either function anymore. Completion tracking itself (isLevelComplete/
// markLevelComplete below) stays; only the "compute a lock state from it" layer was removed.
const KEY = "libre-arcade:grugnetto-go:progress";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // private browsing, storage disabled, etc — non-essential, progress just won't persist
  }
}

export function isLevelComplete(worldId, level) {
  const data = read();
  return !!(data[worldId] && data[worldId][level]);
}

export function markLevelComplete(worldId, level) {
  const data = read();
  data[worldId] = data[worldId] || {};
  data[worldId][level] = true;
  write(data);
}

