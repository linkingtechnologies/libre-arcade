// SPDX-License-Identifier: GPL-3.0-or-later
// M1 probe: evaluated INSIDE the unmodified original game page (served by tools/serve-baseline.mjs).
// It never edits upstream files; it drives the live game with a fixed-step loop and a seeded Math.random.
// Result is a JSON-able object; the run recorded in evidence/probe-original-result.json.
(() => {
  const Q = Game.Q, DT = 1 / 60;
  const r2 = v => Math.round(v * 1000) / 1000;
  let seed = 1;
  Math.random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const keys = { right: 0, left: 0, up: 0, fire: 0 };
  const frame = (n = 1) => { for (let i = 0; i < n; i++) { for (const k in keys) Q.inputs[k] = !!keys[k]; Q.stageGameLoop(DT); } };
  const fresh = (n) => { Q.pauseGame(); seed = 1; for (const k in keys) keys[k] = 0; Game.stageLevel(n); frame(1); return Q.stage(0); };
  const count = (st, n) => (st.lists[n] || []).length;
  const out = { env: { qwidth: Q.width, qheight: Q.height, ua: navigator.userAgent }, probes: {} };
  const probe = (name, fn) => { try { out.probes[name] = fn(); } catch (e) { out.probes[name] = { ERROR: String(e && e.stack || e) }; } };

  probe("levels", () => {
    const res = {};
    for (let n = 1; n <= 6; n++) {
      const st = fresh(n);
      res["level" + n] = { mapPx: [Game.map.p.w, Game.map.p.h], tiles: [Game.map.p.cols, Game.map.p.rows],
        player: [r2(Game.player.p.x), r2(Game.player.p.y)], lives: Q.state.get("lives"),
        zombies: count(st, "Zombie"), hearts: count(st, "Heart"), guns: count(st, "Gun"), keys: count(st, "Key"),
        doors: count(st, "Door"), exitSigns: count(st, "ExitSign"), bulletsOfGun: (st.lists.Gun || []).map(g => g.p.bullets),
        enemiesCounter: Q.state.get("enemiesCounter"), summaryData: JSON.parse(JSON.stringify(Game.currentLevelData)) };
    }
    return res;
  });

  probe("movement", () => {
    const st = fresh(1); const p = Game.player.p; const x0 = p.x; keys.right = 1; frame(30);
    const dx = p.x - x0; keys.right = 0; frame(30);
    const y0 = p.y; keys.up = 1; frame(1); const vyJump = p.vy; keys.up = 0; let apex = y0; for (let i = 0; i < 120; i++) { frame(1); apex = Math.min(apex, p.y); }
    return { speedPxPerSec: r2(dx / 0.5), jumpVy: r2(vyJump), jumpHeightPx: r2(y0 - apex), hitbox: p.points };
  });

  probe("heal_and_reinfect", () => {
    const st = fresh(1); const log = [];
    const z = st.lists.Zombie[0]; const p = Game.player;
    p.p.x = 760; p.p.y = z.p.y; p.p.direction = "right"; p.p.vx = 0; p.p.vy = 0;
    Q.state.set("hasGun", true); p.add("gun"); p.p.noOfBullets = 3; Q.state.set("bullets", 3);
    p.p.timeInvincible = 100;           // isolate the healing mechanic from contact damage
    log.push(["before", count(st, "Zombie"), count(st, "Human"), Q.state.get("enemiesCounter")]);
    p.fireGun(); let healedAt = null;
    for (let f = 0; f < 240 && healedAt === null; f++) { frame(1); if (count(st, "Human") > 0) healedAt = f; }
    log.push(["after-heal", count(st, "Zombie"), count(st, "Human"), Q.state.get("enemiesCounter"), "frame", healedAt]);
    // a zombie touching a human after its 4 s grace converts it back (wasHuman)
    const h = st.lists.Human[0];
    frame(60 * 4 + 20);                  // let the 4 s invincibility expire (keep player far left, invincible)
    const z2 = st.insert(new Q.Zombie({ x: h.p.x + 60, y: h.p.y, startLeft: true }));
    let reinfected = null;
    for (let f = 0; f < 60 * 8 && reinfected === null; f++) { frame(1); if (count(st, "Human") === 0) reinfected = f; }
    log.push(["reinfect", "zombies", count(st, "Zombie"), "humans", count(st, "Human"), "frame", reinfected, "wasHuman", (st.lists.Zombie || []).map(zz => !!zz.p.wasHuman)]);
    // shoot the re-infected zombie: it must NOT become human again (dead zombie instead)
    (st.lists.Zombie || []).filter(zz => !zz.p.wasHuman).forEach(zz => zz.destroy()); // keep only the re-infected one in the line of fire
    const zr = (st.lists.Zombie || []).find(zz => zz.p.wasHuman);
    if (zr) { p.p.x = zr.p.x - 200; p.p.y = zr.p.y; p.p.direction = "right"; p.p.noOfBullets = 3; p.p.nextFireTimeout = 0; p.fireGun(); frame(60); log.push(["shootReinfected", "zombies", count(st, "Zombie"), "humans", count(st, "Human"), "deadZombies", count(st, "DeadZombie")]); }
    return log;
  });

  probe("zombie_contact_damage_and_zombie_mode", () => {
    const st = fresh(1); const log = []; const p = Game.player;
    st.insert(new Q.Zombie({ x: p.p.x + 40, y: p.p.y, startLeft: true }));
    const lives = []; for (let f = 0; f < 60 * 8; f++) { frame(1); if (f % 10 === 0) lives.push([f, Q.state.get("lives")]); if (!Game.player || Game.player.isDestroyed) break; }
    log.push(["livesTimeline", lives.filter((v, i, a) => i === 0 || v[1] !== a[i - 1][1])]);
    log.push(["zombiePlayerPresent", count(st, "ZombiePlayer"), "playerDestroyed", !!Game.player.isDestroyed, "label", Game.infoLabel.p.label]);
    // zombie mode: ZombiePlayer speed/jump; falling out of the map ends it and respawns the player with 3 lives
    const zp = st.lists.ZombiePlayer && st.lists.ZombiePlayer[0];
    if (zp) {
      frame(60 * 5); log.push(["zombieModeReady", "speed", zp.p.speed, "jumpSpeed", zp.p.jumpSpeed, "hasControls", !!zp.p.platformerControls, "zombieModeFound", Game.currentLevelData.zombieModeFound]);
      zp.p.y = Game.map.p.h + 50; frame(3);
      log.push(["afterZombieModeEnds", "playerIsZombieFlag", !!Game.player.p.wasZombie, "lives", Q.state.get("lives"), "zombiePlayers", count(st, "ZombiePlayer"), "label", Game.infoLabel.p.label]);
      const p2 = Game.player; st.insert(new Q.Zombie({ x: p2.p.x + 40, y: p2.p.y, startLeft: true }));
      for (let f = 0; f < 60 * 6 && Game.currentScreen !== "gameOver"; f++) frame(1);
      log.push(["secondDeath", "screen", Game.currentScreen]);
    }
    return log;
  });

  probe("zombie_ai_sight", () => {
    const st = fresh(1); const z = st.lists.Zombie[0]; const p = Game.player;
    const log = [];
    z.p.x = 1015; z.p.y = 665; p.p.x = 1015 - 340; p.p.y = 665; frame(1); log.push(["inRange340", z.canSeeThePlayerObj.status]);
    p.p.x = 1015 - 360; frame(1); log.push(["outRange360", z.canSeeThePlayerObj.status]);
    p.p.x = 1015 - 100; p.p.y = 665 - 30; frame(1); log.push(["yOffset30", z.canSeeThePlayerObj.status]);
    return { lineOfSight: 350, log, patrolSpeed: Math.abs(z.p.vx) };
  });

  probe("random_variants", () => {
    const seen = {}; for (let n of [2, 3, 4, 5, 6]) { seen[n] = new Set(); for (let s = 1; s <= 40; s++) { Math.random = (() => { let q = s * 7919; return () => { q = (q * 1664525 + 1013904223) % 4294967296; return q / 4294967296; }; })(); Q.pauseGame(); Game.stageLevel(n); frame(1); const st = Q.stage(0); const k = st.lists.Key[0].p, d = st.lists.Door[0].p; seen[n].add(k.x + "," + k.y + "|" + d.x + "," + d.y); } seen[n] = seen[n].size; }
    return seen;
  });

  probe("stars_formula_and_progress", () => ({ keys: Game.storageKeys, availableLevel: Game.availableLevel, ls: Object.keys(localStorage).filter(k => /zombieGame/.test(k)) }));
  return out;
})()
