// resources.js — every asset the game needs, declared once. BASE is resolved from this
// module's own URL (import.meta.url), not the hosting page's — the whole games/grugnetto-go/
// folder is meant to be self-contained and portable (assets/ sits right alongside this file),
// so the same resources.js works unmodified whether it's loaded from the Camila-hosted
// dashboard (dashboard-grugnetto-go.inc.php, served under plugins/libre-arcade/...) or the
// standalone index.html sitting directly in this folder — new URL() resolves "assets/" against
// wherever THIS file was actually fetched from, in either case.
//
// This is the "add a level = add a config file" entry point: to add a new level, drop a new
// Tiled JSON file next to world1-level1.json, add one "tmx" line here, and reference its name
// from play.js (see screens/play.js).
// Exported (not just module-local) so app.js can build a src for a plain <img> tag directly —
// e.g. the title screen's mascot artwork — using the exact same context-agnostic resolution
// every melonJS-loaded asset below already relies on, instead of a second, possibly-drifting
// way of finding this folder's assets.
export const BASE = new URL("assets/", import.meta.url).href;

const resources = [
  // Player animation frames — "Grugnetto", cropped from a user-supplied illustrated sheet
  // (background removed with rembg, each pose then padded onto a shared canvas with the
  // character bottom-aligned, then downsampled with LANCZOS — see player.js's FRAME_SIZE
  // comment for why). The source sheet's walk poses turned out to be a run-up progression
  // (gradually more lean), not a true mirrored left/right-leg gait, so alternating between two
  // of them read as barely-animated — reported live. Using a classic "contact/passing" 2-frame
  // cycle instead — each of the 3 walking poses (idle, walk-a, walk-b) is its own dedicated
  // file now, cycled with an idle step between each in player.js's WALK_FRAMES.
  { name: "player-idle",   type: "image", src: BASE + "grugnetto_idle.png" },
  { name: "player-walk-a", type: "image", src: BASE + "grugnetto_walk_a.png" },
  { name: "player-walk-b", type: "image", src: BASE + "grugnetto_walk_b.png" },
  { name: "player-jump",   type: "image", src: BASE + "grugnetto_jump.png" },
  { name: "player-hit",    type: "image", src: BASE + "grugnetto_hit.png" },

  // Collectables / goal — "coin" replaces the original Kenney coin_gold.png with a coin
  // cropped from the same illustrated sheet as Grugnetto (background removed with rembg, same
  // painterly style match as the character). 128x128 (2x the in-game 64px display size, same
  // "downsample once, small runtime scale left" approach used for the player — see coin.js).
  { name: "coin",        type: "image", src: BASE + "collectable_coin.png" },

  // Trap coin — a hazard disguised as a collectible (see entities/trapcoin.js): the plain coin
  // art unchanged, ringed with short grey spikes (procedurally generated from collectable_
  // coin.png's own alpha mask, not hand-drawn) as the only visual difference — earlier versions
  // also recolored the disc itself (near-black, then dark maroon) plus a red outline, both too
  // grim/alarming for the rest of this game's tone; the shape alone (spikes) carries the
  // "something's off" read now. Same 128x128 canvas/scale as
  // the plain coin. Touching one costs a life instead of granting points.
  { name: "trapcoin",    type: "image", src: BASE + "collectable_trapcoin.png" },

  // Goal flag — one color per world (see tools/compile-level.py's WORLD_FLAG, which sets each
  // compiled goal object's `type` to the matching color; entities/goal.js's KINDS table reads
  // it the same way bonus.js/enemy.js already read their own `type`). Each color ships 2 frames
  // (a/b) for a waving animation — previously only "_a" was registered/used at all, so the flag
  // was static despite the animation frame already sitting on disk.
  { name: "flag-green-a",  type: "image", src: BASE + "flag_green_a.png" },
  { name: "flag-green-b",  type: "image", src: BASE + "flag_green_b.png" },
  { name: "flag-blue-a",   type: "image", src: BASE + "flag_blue_a.png" },
  { name: "flag-blue-b",   type: "image", src: BASE + "flag_blue_b.png" },
  { name: "flag-red-a",    type: "image", src: BASE + "flag_red_a.png" },
  { name: "flag-red-b",    type: "image", src: BASE + "flag_red_b.png" },
  { name: "flag-yellow-a", type: "image", src: BASE + "flag_yellow_a.png" },
  { name: "flag-yellow-b", type: "image", src: BASE + "flag_yellow_b.png" },

  // Extra bonus pickups, same sheet/style/pipeline as "coin" above — see entities/bonus.js.
  // Not yet wired into scoring/mechanics beyond "collect it, get points" (this is a rendering
  // trial run in the level to see how they read visually before deciding e.g. whether key
  // should unlock the goal, heart should grant a hit, etc.).
  { name: "bonus-apple", type: "image", src: BASE + "collectable_apple.png" },
  { name: "bonus-acorn", type: "image", src: BASE + "collectable_acorn.png" },
  { name: "bonus-heart", type: "image", src: BASE + "collectable_heart.png" },
  { name: "bonus-key",   type: "image", src: BASE + "collectable_key.png" },

  // Level 1's tileset is a "collection of images" Tiled tileset (each tile is its own file,
  // see assets/tileset.json) — found live that melonJS does NOT auto-preload those
  // per-tile images the way it does a single packed tileset image; each one must be preloaded
  // here too, and — found live, the hard way, in two steps — under a specific `name`:
  // TMXTileset._parseTiles() resolves each tile's image via getImage(tile.image), and
  // getImage() itself normalizes its argument through getBasename() before looking it up.
  // getBasename() (src/utils/file.ts) strips BOTH the directory *and* the extension
  // (`path.replace(PATH, "").replace(EXT, "")`) — so "tiles/terrain_grass_block_top.png"
  // normalizes to just "terrain_grass_block_top", no ".png". preload(), on the other hand,
  // stores images under the literal `name` given here with no normalization at all. Registering
  // under the full path (attempt 1) and then under the basename *with* its extension (attempt
  // 2, "terrain_grass_block_top.png") both left preload()'s storage key and getImage()'s lookup
  // key mismatched; only the extension-less basename lines up with both. Add a matching
  // extension-less line here whenever a new tile image is added to the tileset.
  { name: "terrain_grass_block_top",      type: "image", src: BASE + "tiles/terrain_grass_block_top.png" },
  { name: "terrain_grass_block_center",   type: "image", src: BASE + "tiles/terrain_grass_block_center.png" },
  { name: "terrain_grass_horizontal_left",   type: "image", src: BASE + "tiles/terrain_grass_horizontal_left.png" },
  { name: "terrain_grass_horizontal_middle", type: "image", src: BASE + "tiles/terrain_grass_horizontal_middle.png" },
  { name: "terrain_grass_horizontal_right",  type: "image", src: BASE + "tiles/terrain_grass_horizontal_right.png" },
  // Isolated single-tile block (grass on top, not a left/middle/right run) — needed for
  // span:1 platforms, which tools/generate_level.py produces regularly in staircases/step_up
  // groups (the one-tile-up jump window is narrower than a normal platform_span). Using the
  // horizontal_left/middle/right set on a span:1 platform would draw a malformed tile (a "left
  // cap" with no middle/right to complete it) — see LEVEL_FORMAT.md.
  { name: "terrain_grass_block",  type: "image", src: BASE + "tiles/terrain_grass_block.png" },

  // World3 (sand) / World4 (stone) terrain — same 6-tile pattern as grass above (top/center/
  // horizontal left-middle-right/isolated block), registered under matching extension-less
  // names (see the grass block comment above for why the naming has to match tileset.json's
  // own basename-only lookup).
  { name: "terrain_sand_block_top",      type: "image", src: BASE + "tiles/terrain_sand_block_top.png" },
  { name: "terrain_sand_block_center",   type: "image", src: BASE + "tiles/terrain_sand_block_center.png" },
  { name: "terrain_sand_horizontal_left",   type: "image", src: BASE + "tiles/terrain_sand_horizontal_left.png" },
  { name: "terrain_sand_horizontal_middle", type: "image", src: BASE + "tiles/terrain_sand_horizontal_middle.png" },
  { name: "terrain_sand_horizontal_right",  type: "image", src: BASE + "tiles/terrain_sand_horizontal_right.png" },
  { name: "terrain_sand_block",  type: "image", src: BASE + "tiles/terrain_sand_block.png" },
  { name: "terrain_stone_block_top",      type: "image", src: BASE + "tiles/terrain_stone_block_top.png" },
  { name: "terrain_stone_block_center",   type: "image", src: BASE + "tiles/terrain_stone_block_center.png" },
  { name: "terrain_stone_horizontal_left",   type: "image", src: BASE + "tiles/terrain_stone_horizontal_left.png" },
  { name: "terrain_stone_horizontal_middle", type: "image", src: BASE + "tiles/terrain_stone_horizontal_middle.png" },
  { name: "terrain_stone_horizontal_right",  type: "image", src: BASE + "tiles/terrain_stone_horizontal_right.png" },
  { name: "terrain_stone_block",  type: "image", src: BASE + "tiles/terrain_stone_block.png" },

  // Ground-elevation-step corner/edge tiles — reported live: a "ground" breakpoint (see
  // LEVEL_FORMAT.md) drew the step with plain top/center tiles on both sides, leaving the
  // taller segment's exposed vertical face looking like an unfinished flat block instead of a
  // proper cliff edge. *_top_left/*_top_right cap the corner where the ground surface meets
  // the drop; *_left/*_right are the plain vertical face tiles for any additional rows the
  // drop spans beyond one tile. See tools/compile-level.py's corner-selection logic for which
  // side of a step gets which tile (only the TALLER segment's edge column needs one — the
  // shorter segment's own ground is already flush-buttressed against it, nothing exposed).
  { name: "terrain_grass_block_top_left",  type: "image", src: BASE + "tiles/terrain_grass_block_top_left.png" },
  { name: "terrain_grass_block_top_right", type: "image", src: BASE + "tiles/terrain_grass_block_top_right.png" },
  { name: "terrain_grass_block_left",      type: "image", src: BASE + "tiles/terrain_grass_block_left.png" },
  { name: "terrain_grass_block_right",     type: "image", src: BASE + "tiles/terrain_grass_block_right.png" },
  { name: "terrain_sand_block_top_left",  type: "image", src: BASE + "tiles/terrain_sand_block_top_left.png" },
  { name: "terrain_sand_block_top_right", type: "image", src: BASE + "tiles/terrain_sand_block_top_right.png" },
  { name: "terrain_sand_block_left",      type: "image", src: BASE + "tiles/terrain_sand_block_left.png" },
  { name: "terrain_sand_block_right",     type: "image", src: BASE + "tiles/terrain_sand_block_right.png" },
  { name: "terrain_stone_block_top_left",  type: "image", src: BASE + "tiles/terrain_stone_block_top_left.png" },
  { name: "terrain_stone_block_top_right", type: "image", src: BASE + "tiles/terrain_stone_block_top_right.png" },
  { name: "terrain_stone_block_left",      type: "image", src: BASE + "tiles/terrain_stone_block_left.png" },
  { name: "terrain_stone_block_right",     type: "image", src: BASE + "tiles/terrain_stone_block_right.png" },

  // Bridge walkway (tools/generate_level.py's "bridge" group, see LEVEL_FORMAT.md's platform
  // "material" field) — one tile, repeated across the whole span, no left/middle/right/isolated
  // set like terrain: bridge_logs.png is a seamless plank-with-rivets texture designed to tile,
  // and every generated bridge is at least 3 tiles wide, so there's no isolated-tile case to
  // cover the way span:1 terrain platforms needed one (see terrain_grass_block above). Shared
  // across all worlds/terrains, not per-theme — the pack has no sand/stone bridge variant.
  { name: "bridge_logs", type: "image", src: BASE + "tiles/bridge_logs.png" },

  // "Cloud" platform variant — rounded caps and a wavy underside, meant for a platform that
  // floats in open air, unlike the square-edged terrain_*_block set above (built to look like
  // ground, cut off mid-air, reported live as reading like a stray chunk of terrain rather than
  // an intentional platform). compile-level.py's PLATFORM_CLOUD_GIDS uses these for every
  // platform's tiles now — isolated (span:1) plus left/middle/right for span>=2, same pattern as
  // terrain_*_block/horizontal, one full set per world's own terrain (grass/sand/stone).
  // terrain_*_cloud_background.png exists in the pack too but isn't wired in — a background-
  // layer decoration, not needed for the platform tile itself.
  { name: "terrain_grass_cloud",        type: "image", src: BASE + "tiles/terrain_grass_cloud.png" },
  { name: "terrain_grass_cloud_left",   type: "image", src: BASE + "tiles/terrain_grass_cloud_left.png" },
  { name: "terrain_grass_cloud_middle", type: "image", src: BASE + "tiles/terrain_grass_cloud_middle.png" },
  { name: "terrain_grass_cloud_right",  type: "image", src: BASE + "tiles/terrain_grass_cloud_right.png" },
  { name: "terrain_sand_cloud",        type: "image", src: BASE + "tiles/terrain_sand_cloud.png" },
  { name: "terrain_sand_cloud_left",   type: "image", src: BASE + "tiles/terrain_sand_cloud_left.png" },
  { name: "terrain_sand_cloud_middle", type: "image", src: BASE + "tiles/terrain_sand_cloud_middle.png" },
  { name: "terrain_sand_cloud_right",  type: "image", src: BASE + "tiles/terrain_sand_cloud_right.png" },
  { name: "terrain_stone_cloud",        type: "image", src: BASE + "tiles/terrain_stone_cloud.png" },
  { name: "terrain_stone_cloud_left",   type: "image", src: BASE + "tiles/terrain_stone_cloud_left.png" },
  { name: "terrain_stone_cloud_middle", type: "image", src: BASE + "tiles/terrain_stone_cloud_middle.png" },
  { name: "terrain_stone_cloud_right",  type: "image", src: BASE + "tiles/terrain_stone_cloud_right.png" },

  // Real pit marker (tools/generate_level.py's "pit" group, see LEVEL_FORMAT.md's top-level
  // "pits" field) — a real break in the ground (no tile, no collision) a player falls through;
  // spikes.png is drawn across the opening purely as a warning/why-you-died visual, at the row
  // the ground surface would otherwise be. It carries no collision of its own: falling in is a
  // real drop, caught by entities/player.js's existing "fell below the viewport" respawn check
  // (previously dead code — no level design ever had a real gap before this). Two triangular
  // spikes on a transparent tile, so it reads correctly sitting right at the opening's edge
  // rather than as its own solid block.
  { name: "spikes", type: "image", src: BASE + "tiles/spikes.png" },

  // Decoration (tools/generate_level.py's usable_props/_scatter_props, see LEVEL_FORMAT.md's
  // top-level "props" field) — pure scenery, no collision/physics (entities/prop.js is a plain
  // me.Sprite, not me.Collectable). Which of these a given world's manifest actually lists
  // varies (world1: fence/fence_broken/bush/sign*/spring; world2: mushroom_brown/red; world3:
  // cactus/sign/sign_exit; world4: torch_off/chain) — registering every kind here regardless of
  // world is simplest, same as terrain art: an unused entry just never gets referenced by that
  // world's own generated levels.
  { name: "fence", type: "image", src: BASE + "tiles/fence.png" },
  { name: "fence_broken", type: "image", src: BASE + "tiles/fence_broken.png" },
  { name: "bush", type: "image", src: BASE + "tiles/bush.png" },
  { name: "sign", type: "image", src: BASE + "tiles/sign.png" },
  { name: "sign_left", type: "image", src: BASE + "tiles/sign_left.png" },
  // sign_right doubles as the always-on "go this way" marker at the start of every generated
  // level (see generate_level.py's build_level/START_SIGN_KIND) as well as an ordinary
  // world1 scatter prop — one registration covers both uses.
  { name: "sign_right", type: "image", src: BASE + "tiles/sign_right.png" },
  { name: "sign_exit", type: "image", src: BASE + "tiles/sign_exit.png" },
  { name: "spring", type: "image", src: BASE + "tiles/spring.png" },
  { name: "mushroom_brown", type: "image", src: BASE + "tiles/mushroom_brown.png" },
  { name: "mushroom_red", type: "image", src: BASE + "tiles/mushroom_red.png" },
  { name: "cactus", type: "image", src: BASE + "tiles/cactus.png" },
  { name: "torch_off", type: "image", src: BASE + "tiles/torch_off.png" },
  { name: "chain", type: "image", src: BASE + "tiles/chain.png" },

  // Sky background — a real Tiled "imagelayer" now (see tools/compile-level.py's
  // WORLD_CLOUD_BG), not just the flat "backgroundcolor" every world used to share. Verified in
  // melonJS's own source (packages/melonjs/src/level/tiled/TMXTileMap.js's readImageLayer,
  // packages/melonjs/src/renderable/imagelayer.js) before wiring this in — it's a first-class,
  // tested feature (repeatx for a seamless horizontal tile, parallaxx for a depth effect), not
  // a guess. Same getImage()-by-basename resolution as every other image here (see the
  // terrain_grass_block_top comment above for why the extension has to be dropped). Only
  // world1/world2's manifests list a matching asset (background_clouds.png) — world3/world4
  // still just use a flat color (WORLD_BACKGROUND), no invented backdrop for worlds the pack
  // doesn't actually have art for.
  { name: "background_clouds", type: "image", src: BASE + "backgrounds/background_clouds.png" },

  // NOT cache-busted with a ?v= query string, unlike the JS files above — found live that a
  // query string here breaks melonJS's internal matching between world1-level1.json's own
  // `"tilesets":[{"source":"tileset.json"}]` reference (no query string) and this preloaded
  // "tileset" resource, throwing "Failed loading resource ...tileset.json?v=1" even though the
  // plain HTTP fetch itself succeeds (200 OK) — some part of the tsx/tmx loading path does a
  // literal/suffix match against the bare filename. If world1-level1.json's content ever needs a
  // hard cache-bust, rename the file rather than adding a query string here.
  { name: "tileset", type: "tsx", src: BASE + "tileset.json" },
  // Every world's levels use the same worldN-levelN naming (world1's own 8 used to be the bare
  // "levelN" — a leftover from when this was still a single-world game — renamed for consistency
  // once someone actually went looking for "world1-level1.json" and it didn't exist).
  { name: "world1-level1", type: "tmx", src: BASE + "world1-level1.json" },
  { name: "world1-level2", type: "tmx", src: BASE + "world1-level2.json" },
  { name: "world1-level3", type: "tmx", src: BASE + "world1-level3.json" },
  { name: "world1-level4", type: "tmx", src: BASE + "world1-level4.json" },
  { name: "world1-level5", type: "tmx", src: BASE + "world1-level5.json" },
  { name: "world1-level6", type: "tmx", src: BASE + "world1-level6.json" },
  { name: "world1-level7", type: "tmx", src: BASE + "world1-level7.json" },
  { name: "world1-level8", type: "tmx", src: BASE + "world1-level8.json" },
  { name: "world2-level1", type: "tmx", src: BASE + "world2-level1.json" },
  { name: "world2-level2", type: "tmx", src: BASE + "world2-level2.json" },
  { name: "world2-level3", type: "tmx", src: BASE + "world2-level3.json" },
  { name: "world2-level4", type: "tmx", src: BASE + "world2-level4.json" },
  { name: "world2-level5", type: "tmx", src: BASE + "world2-level5.json" },
  { name: "world2-level6", type: "tmx", src: BASE + "world2-level6.json" },
  { name: "world2-level7", type: "tmx", src: BASE + "world2-level7.json" },
  { name: "world2-level8", type: "tmx", src: BASE + "world2-level8.json" },
  { name: "world3-level1", type: "tmx", src: BASE + "world3-level1.json" },
  { name: "world3-level2", type: "tmx", src: BASE + "world3-level2.json" },
  { name: "world3-level3", type: "tmx", src: BASE + "world3-level3.json" },
  { name: "world3-level4", type: "tmx", src: BASE + "world3-level4.json" },
  { name: "world3-level5", type: "tmx", src: BASE + "world3-level5.json" },
  { name: "world3-level6", type: "tmx", src: BASE + "world3-level6.json" },
  { name: "world3-level7", type: "tmx", src: BASE + "world3-level7.json" },
  { name: "world3-level8", type: "tmx", src: BASE + "world3-level8.json" },
  { name: "world4-level1", type: "tmx", src: BASE + "world4-level1.json" },
  { name: "world4-level2", type: "tmx", src: BASE + "world4-level2.json" },
  { name: "world4-level3", type: "tmx", src: BASE + "world4-level3.json" },
  { name: "world4-level4", type: "tmx", src: BASE + "world4-level4.json" },
  { name: "world4-level5", type: "tmx", src: BASE + "world4-level5.json" },
  { name: "world4-level6", type: "tmx", src: BASE + "world4-level6.json" },
  { name: "world4-level7", type: "tmx", src: BASE + "world4-level7.json" },
  { name: "world4-level8", type: "tmx", src: BASE + "world4-level8.json" },

  // Enemy sprite sets, all harmless patrollers — see entities/enemy.js's KINDS table, which
  // maps each Tiled object's `type` (world1's level jsons use "snail"/"ladybug", see
  // worlds/world1-prato-di-casa.json) to one of these three. All three sets are natively 64x64
  // (verified — same size as the design tile), no scale() needed, same as the original slime.
  { name: "enemy-slime-rest",   type: "image", src: BASE + "enemies/slime_normal_rest.png" },
  { name: "enemy-slime-walk-a", type: "image", src: BASE + "enemies/slime_normal_walk_a.png" },
  { name: "enemy-slime-walk-b", type: "image", src: BASE + "enemies/slime_normal_walk_b.png" },
  { name: "enemy-snail-rest",   type: "image", src: BASE + "enemies/snail_rest.png" },
  { name: "enemy-snail-walk-a", type: "image", src: BASE + "enemies/snail_walk_a.png" },
  { name: "enemy-snail-walk-b", type: "image", src: BASE + "enemies/snail_walk_b.png" },
  { name: "enemy-ladybug-rest",   type: "image", src: BASE + "enemies/ladybug_rest.png" },
  { name: "enemy-ladybug-walk-a", type: "image", src: BASE + "enemies/ladybug_walk_a.png" },
  { name: "enemy-ladybug-walk-b", type: "image", src: BASE + "enemies/ladybug_walk_b.png" },

  // World2 (Bosco degli Scoiattoli) enemies.
  { name: "enemy-worm-rest",   type: "image", src: BASE + "enemies/worm_normal_rest.png" },
  { name: "enemy-worm-walk-a", type: "image", src: BASE + "enemies/worm_normal_move_a.png" },
  { name: "enemy-worm-walk-b", type: "image", src: BASE + "enemies/worm_normal_move_b.png" },
  // frog has no walk cycle in the source pack (it hops, not walks) — idle/jump alternated as
  // the two "walk" frames reads as a hop cycle, which is the right animation for a frog anyway.
  { name: "enemy-frog-rest",   type: "image", src: BASE + "enemies/frog_rest.png" },
  { name: "enemy-frog-walk-a", type: "image", src: BASE + "enemies/frog_idle.png" },
  { name: "enemy-frog-walk-b", type: "image", src: BASE + "enemies/frog_jump.png" },
  { name: "enemy-bee-rest",   type: "image", src: BASE + "enemies/bee_rest.png" },
  { name: "enemy-bee-walk-a", type: "image", src: BASE + "enemies/bee_a.png" },
  { name: "enemy-bee-walk-b", type: "image", src: BASE + "enemies/bee_b.png" },
  { name: "enemy-fly-rest",   type: "image", src: BASE + "enemies/fly_rest.png" },
  { name: "enemy-fly-walk-a", type: "image", src: BASE + "enemies/fly_a.png" },
  { name: "enemy-fly-walk-b", type: "image", src: BASE + "enemies/fly_b.png" },

  // World3 (Dune Dorate) enemies.
  { name: "enemy-mouse-rest",   type: "image", src: BASE + "enemies/mouse_rest.png" },
  { name: "enemy-mouse-walk-a", type: "image", src: BASE + "enemies/mouse_walk_a.png" },
  { name: "enemy-mouse-walk-b", type: "image", src: BASE + "enemies/mouse_walk_b.png" },
  { name: "enemy-saw-rest",   type: "image", src: BASE + "enemies/saw_rest.png" },
  { name: "enemy-saw-walk-a", type: "image", src: BASE + "enemies/saw_a.png" },
  { name: "enemy-saw-walk-b", type: "image", src: BASE + "enemies/saw_b.png" },

  // World4 (Miniera di Pietra) enemies. barnacle's manifest describes it as fixed-in-place
  // ("fisso, attacca quando ci si avvicina") and fish as swimming in a pool — EnemyEntity only
  // ever patrols horizontally on the ground, so both will visibly patrol/slide instead of
  // attacking-in-place or swimming; wiring the sprites now is still correct (matches every
  // other kind's mechanical behavior), refining their movement is separate, later work. Fish
  // ships in 3 color variants (blue/purple/yellow) — blue picked arbitrarily as the one kind.
  { name: "enemy-barnacle-rest",   type: "image", src: BASE + "enemies/barnacle_attack_rest.png" },
  { name: "enemy-barnacle-walk-a", type: "image", src: BASE + "enemies/barnacle_attack_a.png" },
  { name: "enemy-barnacle-walk-b", type: "image", src: BASE + "enemies/barnacle_attack_b.png" },
  { name: "enemy-fish-rest",   type: "image", src: BASE + "enemies/fish_blue_rest.png" },
  { name: "enemy-fish-walk-a", type: "image", src: BASE + "enemies/fish_blue_swim_a.png" },
  { name: "enemy-fish-walk-b", type: "image", src: BASE + "enemies/fish_blue_swim_b.png" },
];

export default resources;

// Audio is preloaded separately from the array above — NOT passed to the main
// me.loader.preload() call that gates game start. Found live: browsers keep the
// WebAudio AudioContext "suspended" until a real user gesture happens, and melonJS's
// Howler-backed audio.load() then never fires either its onload or onerror callback
// (confirmed via me.audio.getAudioContext().state === "suspended" while a direct
// me.audio.load() call hung indefinitely) — so bundling audio into the blocking preload
// left the whole game stuck on the loading screen forever, with no console error at all.
// `name` must match the on-disk filename (minus extension) exactly: melonJS's audio
// loader builds the request URL itself as `${src}${name}.${ext}`, using the format(s)
// passed to me.audio.init() in app.js — it does not read `src` as a full
// filename the way image/tsx/tmx entries do.
export const audioResources = [
  { name: "sfx_jump", type: "audio", src: BASE + "audio/" },
  { name: "sfx_coin", type: "audio", src: BASE + "audio/" },
  { name: "sfx_hurt", type: "audio", src: BASE + "audio/" },
  { name: "sfx_bump", type: "audio", src: BASE + "audio/" },
  // One bgm track per world (see worlds.js's own "music" field, and play.js's loadLevel, which
  // picks between these by world id) — replaces a single shared bgm.ogg that was actually a
  // ~1.76s Kenney "Music Jingles" stinger looping the whole level, anxiety-inducing on that tight
  // a loop; those jingles were never meant for continuous looping (they're one-shot cues). That
  // original is kept as bgm.ogg.bak.
  //   world1 — "Flowerbed Fields [Loop]", Zane Little Music, CC0.
  //     opengameart.org/content/flowerbed-fields-loop
  //   world2 — "Fort Fairy", iamoneabe, CC0. Source was MP3-only; converted to ogg with ffmpeg
  //     (imageio-ffmpeg's bundled binary — soundfile/libsndfile's OGG *write* silently produced
  //     a 0-sample file on this machine, no exception raised; its OGG *read* path is fine, this
  //     build just has no working Vorbis encoder linked in).
  //     opengameart.org/content/fort-fairy
  //   world3 — "Desert 03", Fantasy Musica (Beau Buckley), CC-BY 3.0 — credit required.
  //     opengameart.org/content/desert-03
  //   world4 — "Cave 01", Fantasy Musica (Beau Buckley), CC-BY-SA 4.0 — credit + share-alike
  //     required. opengameart.org/content/cave-01
  { name: "bgm-world1", type: "audio", src: BASE + "audio/" },
  { name: "bgm-world2", type: "audio", src: BASE + "audio/" },
  { name: "bgm-world3", type: "audio", src: BASE + "audio/" },
  { name: "bgm-world4", type: "audio", src: BASE + "audio/" },
  { name: "win",      type: "audio", src: BASE + "audio/" },
];
