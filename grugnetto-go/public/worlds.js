// World / level registry — the single source of truth for which levels are actually loadable
// (as "tmx" resources in resources.js) and in which world/order they belong. Replaces the old
// per-level LEVEL_NAME/URL-param testing shortcut in screens/play.js.
//
// Deliberately NO "name" field on worlds or levels here (removed — see git history for the
// earlier hardcoded-Italian version): a raw string here can only ever be one language, so display
// names now go through the normal t() i18n system instead, keyed off each world's own stable `id`
// (`grugnettogo.world.<id>.name`, see lang/*.lang.php / i18n.js) and a shared numbered-level
// template (`grugnettogo.level.number`) rather than 32 near-identical "Livello N" strings. `id`
// itself is NOT translated (it's an internal key, never shown), which is exactly why it's the
// right join key for the i18n lookup — it can't drift out of sync with a displayed name the way a
// duplicated `name` field eventually would.
//
// A world with an empty levels array always renders as "coming soon" in world-select (Practice
// mode has no lock state to also be "regardless of" anymore — see progress.js's own header
// comment). Add a level here only once it's actually compiled (tools/compile-level.py) and
// registered as a "tmx" resource in resources.js.
//
// "music" names one of resources.js's audioResources entries (bgm-world1..4) — read by
// screens/play.js's loadLevel() so each world plays its own track instead of one shared bgm.
//
// "accent" matches tools/compile-level.py's own WORLD_FLAG color for that world (the goal flag
// planted at the end of each of its levels) — reusing that existing color choice ties the
// world-select tile directly to what the player actually sees in-level, rather than picking a
// second, unrelated color scheme. "emoji" is a quick, font-independent (no icon set to load
// correctly) visual hook for each world's theme — see app.js's WorldTile().
const WORLDS = [
  {
    id: "world1",
    music: "bgm-world1",
    accent: "#48c774",
    emoji: "🌼",
    levels: [
      { level: 1, resource: "world1-level1" },
      { level: 2, resource: "world1-level2" },
      { level: 3, resource: "world1-level3" },
      { level: 4, resource: "world1-level4" },
      { level: 5, resource: "world1-level5" },
      { level: 6, resource: "world1-level6" },
      { level: 7, resource: "world1-level7" },
      { level: 8, resource: "world1-level8" },
    ],
  },
  {
    id: "world2",
    music: "bgm-world2",
    accent: "#3298dc",
    emoji: "🐿️",
    levels: [
      { level: 1, resource: "world2-level1" },
      { level: 2, resource: "world2-level2" },
      { level: 3, resource: "world2-level3" },
      { level: 4, resource: "world2-level4" },
      { level: 5, resource: "world2-level5" },
      { level: 6, resource: "world2-level6" },
      { level: 7, resource: "world2-level7" },
      { level: 8, resource: "world2-level8" },
    ],
  },
  {
    id: "world3",
    music: "bgm-world3",
    accent: "#e6b800",
    emoji: "🏜️",
    levels: [
      { level: 1, resource: "world3-level1" },
      { level: 2, resource: "world3-level2" },
      { level: 3, resource: "world3-level3" },
      { level: 4, resource: "world3-level4" },
      { level: 5, resource: "world3-level5" },
      { level: 6, resource: "world3-level6" },
      { level: 7, resource: "world3-level7" },
      { level: 8, resource: "world3-level8" },
    ],
  },
  {
    id: "world4",
    music: "bgm-world4",
    accent: "#f14668",
    emoji: "⛏️",
    levels: [
      { level: 1, resource: "world4-level1" },
      { level: 2, resource: "world4-level2" },
      { level: 3, resource: "world4-level3" },
      { level: 4, resource: "world4-level4" },
      { level: 5, resource: "world4-level5" },
      { level: 6, resource: "world4-level6" },
      { level: 7, resource: "world4-level7" },
      { level: 8, resource: "world4-level8" },
    ],
  },
];

export function findLevel(worldId, level) {
  const world = WORLDS.find((w) => w.id === worldId);
  if (!world) return null;
  return world.levels.find((l) => l.level === level) || null;
}

// Arcade mode's own "next level" — unlike findLevel() above (a single world's own levels only),
// this crosses world boundaries: world1's last level rolls into world2's first, and so on, same
// order as this array itself. Returns null once there's nothing left (world4's last level) — the
// signal app.js's arcade-mode LevelCompleteOverlay() branch uses to show "you finished the whole
// run" instead of a "next level" button. Skips any world with an empty levels array (matches
// world-select's own "coming soon" treatment) rather than assuming every WORLDS entry is playable.
export function findNextGlobalLevel(worldId, level) {
  const worldIdx = WORLDS.findIndex((w) => w.id === worldId);
  if (worldIdx === -1) return null;
  const nextInWorld = findLevel(worldId, level + 1);
  if (nextInWorld) return { worldId, ...nextInWorld };
  for (let i = worldIdx + 1; i < WORLDS.length; i++) {
    if (WORLDS[i].levels.length > 0) {
      return { worldId: WORLDS[i].id, ...WORLDS[i].levels[0] };
    }
  }
  return null;
}

export default WORLDS;
