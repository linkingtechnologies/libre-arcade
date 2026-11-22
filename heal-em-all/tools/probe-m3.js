// SPDX-License-Identifier: GPL-3.0-or-later
// M3 probes P4 and P9-P12 of PARITY-TEST-PLAN.md, evaluated INSIDE a page running the original or the restored game.
// Same method as probe-original.js: fixed 1/60 s steps, seeded Math.random, no edits to the game.
(() => {
  const Q = Game.Q, DT = 1 / 60;
  const r2 = v => Math.round(v * 1000) / 1000;
  let seed = 7;
  Math.random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const keys = { right: 0, left: 0, up: 0, fire: 0, action: 0 };
  const frame = (n = 1) => { for (let i = 0; i < n; i++) { for (const k in keys) Q.inputs[k] = !!keys[k]; Q.stageGameLoop(DT); } };
  const fresh = n => { Q.pauseGame(); seed = 7; for (const k in keys) keys[k] = 0; Game.stageLevel(n); frame(1); return Q.stage(0); };
  const count = (st, n) => (st.lists[n] || []).length;
  const out = { viewport: [Q.width, Q.height], probes: {} };
  const probe = (name, fn) => { try { out.probes[name] = fn(); } catch (e) { out.probes[name] = { ERROR: String(e && e.stack || e) }; } };

  probe("P4_bullet_range", () => {
    const st = fresh(1); (st.lists.Zombie || []).slice().forEach(z => z.destroy());
    const p = Game.player; Q.state.set("hasGun", true); p.add("gun"); p.p.noOfBullets = 3; Q.state.set("bullets", 3);
    p.p.x = 150; p.p.y = 650; p.p.direction = "right"; frame(5); p.p.nextFireTimeout = 0;
    const x0 = p.p.x; p.fireGun(); frame(1);
    const b = (st.lists.Bullet || [])[0]; if (!b) return { error: "no bullet" };
    let maxDx = 0, frames = 0; const start = b.p.initialX;
    while ((st.lists.Bullet || []).length && frames < 600) { const bb = st.lists.Bullet[0]; maxDx = Math.max(maxDx, bb.p.x - start); frame(1); frames++; }
    return { qwidth: Q.width, half: Q.width / 2, travelled: r2(maxDx), frames, spawnedAtDxFromPlayer: r2(start - x0), bulletsWasted: Game.currentLevelData.bullets.waisted };
  });

  probe("P9_stars_and_progress", () => {
    for (const k of Object.keys(localStorage)) if (/^zombieGame:/.test(k)) localStorage.removeItem(k);
    Game.availableLevel = 1;
    const res = [], run = (level, healed, available) => {
      Q.pauseGame(); Q.state.reset({ currentLevel: level, enemiesCounter: 0, lives: 3, bullets: 0, hasKey: false, hasGun: false });
      Game.currentLevelData = { zombies: { healed, available }, health: { collected: 1, available: 2 }, bullets: { waisted: 0, available: 3 }, zombieModeFound: false };
      Game.stageEndLevelScreen();
      const stars = localStorage.getItem("zombieGame:levelProgress:" + level);
      const starSprites = (Q.stage(0).items || []).filter(i => i.className === "UI.LevelScoreImg" || /LevelScoreImg/.test(i.className || ""));
      res.push({ level, healed, available, stars: stars === null ? null : +stars, availableLevel: Game.availableLevel, stored: localStorage.getItem("zombieGame:availableLevel"), screen: Game.currentScreen, scoreImgs: starSprites.length });
    };
    run(1, 0, 4); run(1, 2, 4); run(1, 3, 4); run(1, 1, 4);  // 0 and 0.5 -> 1 star, 0.75 -> 2, then a worse result must not lower it
    run(2, 9, 10); run(3, 4, 4); run(6, 24, 24);
    return res;
  });

  probe("P10_fall_and_out_of_map", () => {
    const st = fresh(3); const p = Game.player; const log = [];
    frame(20); const saved = { x: p.p.savedPosition.x, y: p.p.savedPosition.y };
    p.p.invincible = 0; p.p.vy = 1200; frame(1); log.push(["vy1200 flagged", !!p.p.willBeDead, "lives", Q.state.get("lives")]);
    frame(1); p.p.vy = 0; frame(2); log.push(["after landing", "lives", Q.state.get("lives"), "willBeDead", !!p.p.willBeDead]);
    const before = Q.state.get("lives"); p.p.y = Game.map.p.h + 20; frame(2);
    log.push(["out of map", "lives", before, "->", Q.state.get("lives"), "restoredToSaved", r2(p.p.x) === r2(p.p.savedPosition.x) && r2(p.p.y) === r2(p.p.savedPosition.y), "savedBefore", saved]);
    return log;
  });

  probe("P11_key_door_completion", () => {
    const st = fresh(1); const p = Game.player; const log = [];
    const door = st.lists.Door[0], key = st.lists.Key[0];
    p.p.x = door.p.x; p.p.y = door.p.y; frame(3); log.push(["door without key", "opened", door.p.opened, "label", Game.infoLabel.p.label, "screen", Game.currentScreen]);
    keys.up = 1; frame(3); keys.up = 0; log.push(["up on closed door", Game.currentScreen]);
    p.p.x = key.p.x; p.p.y = key.p.y; frame(3); log.push(["key", "hasKey", Q.state.get("hasKey"), "keysLeft", count(st, "Key")]);
    p.p.x = door.p.x; p.p.y = door.p.y; frame(3); log.push(["door with key", "opened", door.p.opened, "hasKey", Q.state.get("hasKey"), "label", Game.infoLabel.p.label, "sheet", door.p.sheet]);
    keys.up = 1; frame(3); keys.up = 0; log.push(["up on open door", Game.currentScreen, "playerDestroyed", !!p.isDestroyed, "summary", JSON.parse(JSON.stringify(Game.currentLevelData))]);
    return log;
  });

  probe("P12_zombie_mode_controls", () => {
    const st = fresh(1); const log = []; const p = Game.player;
    for (const z of (st.lists.Zombie || []).slice()) z.destroy();
    Q.state.set("lives", 1); p.p.lifePoints = 1; p.updateLifePoints();
    const zp = (st.lists.ZombiePlayer || [])[0]; log.push(["zombie player", !!zp, "label", Game.infoLabel.p.label]);
    if (!zp) return log;
    frame(60 * 6);                                               // let the intro animation fire "ready"
    log.push(["after intro", "componentsOwnKeys", Object.keys(zp).filter(k => /platformer|controls/i.test(k)), "playerHud", Game.currentLevelData.zombieModeFound]);
    const x0 = zp.p.x; keys.right = 1; frame(30); keys.right = 0; const dx = zp.p.x - x0;
    log.push(["moves right 30 frames", "dx", r2(dx), "px/s", r2(dx * 2), "speed", zp.p.speed]);
    const y0 = zp.p.y; keys.up = 1; frame(1); keys.up = 0; log.push(["jump vy", r2(zp.p.vy), "jumpSpeed", zp.p.jumpSpeed, "y0", r2(y0)]);
    frame(60);
    const h = st.insert(new Q.Human({ x: zp.p.x + 5, y: zp.p.y })); frame(60 * 2);
    log.push(["human touched by zombie player", "humans", count(st, "Human"), "zombies", count(st, "Zombie"), "wasHuman", (st.lists.Zombie || []).map(z => !!z.p.wasHuman), "humanDestroyed", !!h.isDestroyed]);
    return log;
  });
  return out;
})()
