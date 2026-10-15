/*
 * Zooming Secretary M9 reference-run harness
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  Rng8, PhoneSystem, PHONE, Campaign, CoffeeState,
  wrapPlayerX, wrapLadderY,
  DIR, chiefRandomDelay, tickBouncer, chatterContact,
  tickChatterInteraction, manBoxContact, dibrovContact, tickGhost,
  runReferenceReplay
} from "../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(fs.readFileSync(path.join(here, "../fixtures/m9-vectors.json"), "utf8"));

const results = [];
function test(id, name, fn) {
  try {
    fn();
    results.push({ id, name, ok: true });
    console.log(`PASS ${id} ${name}`);
  } catch (err) {
    results.push({ id, name, ok: false, error: err.stack || String(err) });
    console.error(`FAIL ${id} ${name}`);
    console.error(err.stack || err);
  }
}

// 1. RNG
test("ZS-M8-001", "RNG vector", () => {
  const r = new Rng8(1);
  const got = Array.from({ length: 32 }, () => r.rand8());
  assert.deepEqual(got, fixtures.rng.first_32_rand8_outputs);
});

// 2. Title seeding
test("ZS-M8-002", "Title seed advancement", () => {
  for (const [frames, expected] of Object.entries(fixtures.rng.seed_after_title_idle_frames)) {
    const r = new Rng8(1);
    assert.equal(r.advanceTitleTicks(Number(frames)), expected);
  }
});

// 3. Map fingerprint fixture lock (no copyrighted map bytes are bundled in M9)
test("ZS-M8-003", "Eight map fingerprints locked", () => {
  const names = Object.keys(fixtures.maps);
  assert.equal(names.length, 8);
  for (const name of names) {
    assert.match(fixtures.maps[name].gameplay_704_sha256, /^[0-9a-f]{64}$/);
    assert.match(fixtures.maps[name].nametable_1024_sha256, /^[0-9a-f]{64}$/);
  }
});

// 4. Horizontal wrap
test("ZS-M8-004", "Horizontal wrap", () => {
  assert.equal(wrapPlayerX(-1), 240 << 4);
  assert.equal(wrapPlayerX((240 << 4) + 1), 0);
  assert.equal(wrapPlayerX(120 << 4), 120 << 4);
});

// 5. Vertical wrap
test("ZS-M8-005", "Vertical ladder wrap", () => {
  const up = (32 << 4) - 1;
  const down = (192 << 4) + 1;
  assert.equal(wrapLadderY(up, "UP"), up + (160 << 4));
  assert.equal(wrapLadderY(down, "DOWN"), down - (160 << 4));
});

// 6. Phone initial scheduling exact vectors
test("ZS-M8-006", "Phone initial scheduling", () => {
  for (const [stage, expected] of Object.entries(fixtures.phoneInitialExact)) {
    const cfg = {
      "Day 1":[250,2,2], "Day 2":[250,2,3], "Day 3":[250,3,3], "Day 4":[250,3,2],
      "Dream":[0,0,1], "Day 5":[275,4,3], "Day 6":[400,4,4], "Day 7":[450,4,4]
    }[stage];
    const [callDelay, topicsActive, phoneCount] = cfg;
    const rng = new Rng8(1);
    const sys = new PhoneSystem({ rng, callDelay, topicsActive, phoneCount, bonus: stage === "Dream" });
    if (stage === "Dream") sys.initializeDreamPhone(); else sys.initializeNormalPhones(phoneCount);

    assert.equal(sys.callDelay, expected.callDelayAfterSetup, stage);
    assert.equal(rng.state, expected.rngAfterSetup, stage);
    assert.deepEqual(sys.phones.map(p => p.counter), expected.phones.map(p => p.counter), stage);
    assert.deepEqual(sys.phones.map(p => p.topic), expected.phones.map(p => p.topic), stage);
  }
});

// 7. Phone lifecycle: 3 heat phases -> miss; answer state source-order behavior
test("ZS-M8-007", "Phone heat lifecycle", () => {
  const rng = new Rng8(1);
  const sys = new PhoneSystem({ rng, callDelay: 250, topicsActive: 2, phoneCount: 1 });
  sys.phones[0] = { level: PHONE.IDLE, counter: 0, topic: 0 };

  let events = sys.tick();
  assert.equal(sys.phones[0].level, PHONE.HEAT_1);
  assert.equal(sys.phones[0].counter, 200);
  assert.ok(events.some(e => e.type === "RING_START"));

  for (let i = 0; i < 200; i++) sys.tick();
  assert.equal(sys.phones[0].counter, 0);
  assert.equal(sys.phones[0].level, PHONE.HEAT_1);

  sys.tick();
  assert.equal(sys.phones[0].level, PHONE.HEAT_2);
  assert.equal(sys.phones[0].counter, 200);

  for (let phase = 2; phase <= 3; phase++) {
    for (let i = 0; i < 200; i++) sys.tick();
    if (phase === 2) {
      sys.tick();
      assert.equal(sys.phones[0].level, PHONE.HEAT_3);
      assert.equal(sys.phones[0].counter, 200);
    }
  }
  const missEvents = sys.tick();
  assert.equal(sys.callsMissed, 1);
  assert.ok(missEvents.some(e => e.type === "MISS"));

  // Answer source ordering: set heat phone, answer this tick => counter 25 then common block -> 24.
  sys.phones[0] = { level: PHONE.HEAT_1, counter: 100, topic: 1 };
  const answerEvents = sys.tick({ attempts: [{ id:0, playerTopic:1, wisdom:0, overlap:true }] });
  assert.ok(answerEvents.some(e => e.type === "ANSWER"));
  assert.equal(sys.phones[0].level, PHONE.ANSWERED);
  assert.equal(sys.phones[0].counter, 24);
});

// 8. Topic gating/wisdom
test("ZS-M8-008", "Topic and wisdom gating", () => {
  const mk = () => {
    const sys = new PhoneSystem({ rng:new Rng8(7), callDelay:250, topicsActive:2, phoneCount:1 });
    sys.phones[0] = { level: PHONE.HEAT_1, counter: 100, topic: 1 };
    return sys;
  };
  assert.equal(mk().attemptAnswer(0,{playerTopic:0,wisdom:0,overlap:true}), false);
  assert.equal(mk().attemptAnswer(0,{playerTopic:1,wisdom:0,overlap:true}), true);
  assert.equal(mk().attemptAnswer(0,{playerTopic:255,wisdom:1,overlap:true}), true);
});

// 9. Coffee
test("ZS-M8-009", "Coffee timing", () => {
  const c = new CoffeeState();
  let sawReady = false;
  for (let f = 1; f <= 150; f++) {
    const out = c.tick(f);
    if (out.events.includes("COFFEE_READY_SFX")) sawReady = true;
  }
  assert.equal(c.wait, 0);
  assert.equal(sawReady, true);

  let out = c.tick(151,{overlap:true});
  assert.ok(out.events.includes("COFFEE_PICKUP"));
  assert.equal(c.wait, 1000);
  assert.equal(c.strength, 20);
  assert.equal(out.targetFp, 34);
});

// 10. NPC effects and timings
test("ZS-M8-010", "NPC effect timings", () => {
  const rng = new Rng8(1);
  const d = chiefRandomDelay(rng);
  assert.ok(d >= 64 && d <= 95);

  const b = { x:100, dir:DIR.RIGHT };
  tickBouncer(b,1); assert.equal(b.x,100);
  tickBouncer(b,4); assert.equal(b.x,101);

  const chatter = { x:100,y:80,wait:0,counter:0,dir:DIR.LEFT };
  const cp = { x:90,y:80,topic:255 };
  assert.equal(chatterContact({npc:chatter,player:cp,rng:new Rng8(1),topicsActive:3}), true);
  assert.equal(chatter.counter,50); assert.equal(chatter.wait,100);
  for(let i=0;i<50;i++) assert.equal(tickChatterInteraction(chatter),"TALK");
  assert.equal(chatter.counter,0);
  for(let i=0;i<100;i++) assert.equal(tickChatterInteraction(chatter),"COOLDOWN");
  assert.equal(chatter.wait,0);

  const mb = { x:100,y:80,dir:DIR.LEFT };
  const mp = { x:90,y:80,knocked:0,knockedAnim:0 };
  assert.equal(manBoxContact({npc:mb,player:mp}),true);
  assert.equal(mp.knocked,48);
  assert.equal(mb.dir,DIR.RIGHT);

  const di = { x:100,y:80,dir:DIR.LEFT,speed:1 };
  const dp = { x:90,y:80,wisdom:0 };
  assert.equal(dibrovContact({npc:di,player:dp}),true);
  assert.equal(dp.wisdom,500);
  assert.equal(di.speed,2);

  const ghost = { xFp:16<<4,yFp:240<<4,dx:0,dy:0,wait:150,counter:50 };
  const gp = { xFp:120<<4,yFp:80<<4 };
  for(let i=0;i<150;i++) tickGhost(ghost,gp);
  assert.equal(ghost.wait,0);
  const beforeX = ghost.xFp;
  const beforeY = ghost.yFp;
  tickGhost(ghost,gp);
  // Original source gates horizontal acceleration on npc_y < 240px.
  // From the exact initial y=240 position the first active tick therefore
  // changes vertical velocity/position first; X may remain unchanged.
  assert.ok(ghost.yFp !== beforeY || ghost.xFp !== beforeX);
  assert.ok(ghost.dy < 0);
});

// 11. Dream caught
test("ZS-M8-011", "Dream caught path", () => {
  const c = new Campaign();
  c.stage = 4;
  const r = c.resolve({caught:true});
  assert.equal(r.advanced,true);
  assert.equal(c.stage,5);
  assert.equal(c.missLimit,3);
});

// 12. Dream win
test("ZS-M8-012", "Dream success path", () => {
  const c = new Campaign();
  c.stage = 4;
  const r = c.resolve({won:true});
  assert.equal(r.advanced,true);
  assert.equal(c.stage,5);
  assert.equal(c.missLimit,5);
});

// 13. Normal failure retry
test("ZS-M8-013", "Normal failure retries same stage", () => {
  const c = new Campaign();
  c.stage = 2;
  c.resolve({won:false});
  assert.equal(c.stage,2);
});

// 14. Full campaign
test("ZS-M8-014", "Full campaign progression", () => {
  const c = new Campaign();
  for(let stage=0; stage<4; stage++) {
    assert.equal(c.stage,stage);
    c.resolve({won:true});
  }
  assert.equal(c.stage,4);
  c.resolve({won:true});
  assert.equal(c.stage,5);
  assert.equal(c.missLimit,5);
  c.resolve({won:true}); c.resolve({won:true}); c.resolve({won:true});
  assert.equal(c.stage,8);
  assert.equal(c.name,"Ending");
});

// 15. Replay determinism
test("ZS-M8-015", "Deterministic replay", () => {
  const script = [
    {tick:300,id:0,playerTopic:0,wisdom:0,overlap:true},
    {tick:700,id:1,playerTopic:1,wisdom:0,overlap:true}
  ];
  const a = runReferenceReplay({seed:37,ticks:900,attempts:script});
  const b = runReferenceReplay({seed:37,ticks:900,attempts:script});
  assert.deepEqual(a,b);

  const c = runReferenceReplay({seed:38,ticks:900,attempts:script});
  assert.notDeepEqual(a,c);
});

const failed = results.filter(r => !r.ok);
const report = {
  baseline: "Zooming Secretary NES v1.02",
  milestone: "M9",
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results
};
fs.writeFileSync(path.join(here, "../docs/test-report.json"), JSON.stringify(report,null,2));
console.log(`\n${report.passed}/${report.total} tests passed`);
if (failed.length) process.exit(1);
