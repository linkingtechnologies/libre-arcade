// SPDX-License-Identifier: GPL-3.0-or-later
import { PI, SCREEN_WIDTH, SCREEN_HEIGHT } from './constants.js';
import { createGalaxy, animateBigBang, advancePlanetDynamics, BodyKind, bodyCollision } from './galaxy.js';

const MAX_STARS = 100;
const MAX_GOLDRAIN = 150;

function random(rng, max, min, trace, site) {
  return rng.random(max, min, trace, site);
}

/**
 * Replays the non-gameplay constructors that happen before Galaxy::create().
 * Their state matters because Star/Shootingstar may later consume the same
 * global rand() stream during draw(). Goldrain is not drawn during gameplay,
 * but its constructor must consume the historical 900 calls before Galaxy
 * reseeds rand() with the galaxy id.
 */
export function createHistoricalVisualState(rng, trace = null) {
  const stars = [];
  for (let i = 0; i < MAX_STARS; i += 1) {
    stars.push({
      x: Math.trunc(random(rng, SCREEN_WIDTH - 20, 20, trace, `Star[${i}].x`)),
      y: Math.trunc(random(rng, SCREEN_HEIGHT - 20, 20, trace, `Star[${i}].y`)),
      b: Math.trunc(random(rng, 2000, 1, trace, `Star[${i}].blink`)),
      c: Math.trunc(random(rng, 245, 25, trace, `Star[${i}].color`)),
    });
  }

  // Goldrain constructor: x, y, sp, b, color selector, color.
  for (let i = 0; i < MAX_GOLDRAIN; i += 1) {
    random(rng, 40, -40, trace, `Goldrain[${i}].x`);
    random(rng, 100, 0, trace, `Goldrain[${i}].y`);
    random(rng, 2, 1, trace, `Goldrain[${i}].speed`);
    random(rng, 10, 0, trace, `Goldrain[${i}].blink`);
    random(rng, 4, 0, trace, `Goldrain[${i}].channel`);
    random(rng, 255, 100, trace, `Goldrain[${i}].color`);
  }

  const shootingStar = {
    x: Math.trunc(random(rng, SCREEN_WIDTH - 200, 200, trace, 'Shootingstar.x')),
    y: Math.trunc(random(rng, SCREEN_HEIGHT - 200, 100, trace, 'Shootingstar.y')),
    s: Math.trunc(random(rng, 2, 0, trace, 'Shootingstar.speed')) === 1 ? 1 : -1,
    w: Math.trunc(random(rng, 2000, 1000, trace, 'Shootingstar.wait')),
  };

  return { stars, shootingStar, extra: { wait: 250, waiting: 9999 } };
}

export function advanceBackgroundVisualRng(visual, rng, trace = null) {
  for (let i = 0; i < visual.stars.length; i += 1) {
    const star = visual.stars[i];
    const old = star.b;
    star.b -= 1;
    if (old === 0) star.b = Math.trunc(random(rng, 2000, 1, trace, `Star[${i}].blink.reset`));
  }

  const ss = visual.shootingStar;
  const oldWait = ss.w;
  ss.w -= 1;
  if (oldWait === 0) {
    ss.w = Math.trunc(random(rng, 2000, 1000, trace, 'Shootingstar.wait.reset'));
    ss.x = Math.trunc(random(rng, SCREEN_WIDTH - 200, 200, trace, 'Shootingstar.x.reset'));
    ss.y = Math.trunc(random(rng, SCREEN_HEIGHT - 200, 100, trace, 'Shootingstar.y.reset'));
    ss.s = Math.trunc(random(rng, 2, 0, trace, 'Shootingstar.speed.reset')) === 1 ? 1 : -1;
  }
}

function advanceExtra(visual, galaxy, rng, trace = null) {
  const e = visual.extra;
  if (e.wait > 0) e.wait -= 1;
  if (e.waiting > 0) {
    e.waiting -= 1;
    if (e.waiting === 0) e.wait = 100;
  }

  if (e.wait === 35) {
    // Not reached by M3's canonical scenario, but implemented for stream fidelity.
    let x; let y; let collides;
    do {
      x = random(rng, SCREEN_WIDTH - 150, 150, trace, 'Extra.x');
      y = random(rng, SCREEN_HEIGHT - 50, 50, trace, 'Extra.y');
      const width = 36 + 20;
      collides = galaxy.bodies.some((b) => bodyCollision(b, x, y, width, true));
    } while (collides);
    e.x = x; e.y = y;
    e.waiting = Math.trunc(random(rng, 4000, 3000, trace, 'Extra.waiting'));
  }

  if (e.wait < 30) {
    // Extra::draw always consumes one alpha jitter call while visible.
    random(rng, 15, 0, trace, 'Extra.alpha');
  }
}

function advanceStormDraw(body, rng, trace = null) {
  random(rng, 1, -1, trace, 'Storm.x_anim');
  random(rng, 1, -1, trace, 'Storm.y_anim');

  let tSpeed = 1;
  for (let i = 0; i < body.particles.length; i += 1) {
    const p = body.particles[i];
    let len = p.length;
    let ang = p.angle - PI / 180 * 3;
    if (ang < 0) ang += 2 * PI;
    len += tSpeed / 8 + 3;
    if (len > 60) len -= 60 + random(rng, 5, -5, trace, `Storm.particle[${i}].wrap`);
    p.length = len; p.angle = ang;

    const old = tSpeed;
    tSpeed += 1;
    if (old > 3) tSpeed -= 3;
  }
}

function advanceWormholeDraw(body, rng, trace = null) {
  const dx = body.exitX; const dy = body.exitY;
  const pathLen = Math.sqrt(dx * dx + dy * dy);
  for (let i = 0; i < body.particles.length; i += 1) {
    let p = body.particles[i];
    p += i % 3 + 1;
    if (p > pathLen) p -= pathLen;
    body.particles[i] = p;
  }

  for (let i = 0; i < body.startParticles.length; i += 1) {
    const sp = body.startParticles[i];
    let len = sp.length - random(rng, 3, 1, trace, `Wormhole.start_particle[${i}].decay`);
    let angle = sp.angle + 5 * PI / 180;
    if (len <= 2) {
      // GCC used for the oracle evaluates constructor arguments right-to-left:
      // angle RANDOM() first, then length RANDOM().
      angle = random(rng, 2 * PI, 0, trace, `Wormhole.start_particle[${i}].reset.angle`);
      // Archaeological macro-precedence bug. RANDOM(max,min) is defined as
      // ((max-min)*(rand()/(RAND_MAX+1.0))+min) without parenthesizing its
      // parameters. With min=`get_Width()-10`, width=25, the C++ expansion is
      // ((25*1.5-25-10)*u+25-10) => 15 + 2.5*u, NOT 15 + 22.5*u.
      const raw = rng.rand(trace, `Wormhole.start_particle[${i}].reset.length`);
      const u = raw / 2147483648.0;
      len = (body.width * 1.5 - body.width - 10) * u + body.width - 10;
    }
    sp.length = len; sp.angle = angle;
  }
}

export function advanceGalaxyHistoricalDraw(galaxy, visual, rng, trace = null) {
  animateBigBang(galaxy);
  advanceExtra(visual, galaxy, rng, trace);

  // Historical Galaxy::draw(): background objects first in array order.
  for (const body of galaxy.bodies) {
    if (!body.inBackground) continue;
    if (body.kind === BodyKind.STORM) advanceStormDraw(body, rng, trace);
    else if (body.kind === BodyKind.WORMHOLE) advanceWormholeDraw(body, rng, trace);
  }

  // Foreground planets. Their draw mutates moon/ring coordinates and recoil.
  for (const body of galaxy.bodies) {
    if (!body.inBackground) advancePlanetDynamics(body);
  }
}

export function advanceHistoricalFrame(runtime, trace = null) {
  advanceBackgroundVisualRng(runtime.visual, runtime.rng, trace);
  advanceGalaxyHistoricalDraw(runtime.galaxy, runtime.visual, runtime.rng, trace);
  runtime.frames += 1;
}

export function settleHistoricalRuntime(runtime, maxFrames = 1000, trace = null) {
  let frames = 0;
  while (runtime.galaxy.isImploding && frames < maxFrames) {
    advanceHistoricalFrame(runtime, trace);
    frames += 1;
  }
  return frames;
}

export function createHistoricalRuntime({ rng, startupSeed = 12345, galaxySeed = 54321, objects = 6, trace = null }) {
  rng.srand(startupSeed);
  const visual = createHistoricalVisualState(rng, trace);
  const galaxy = createGalaxy({ max: objects, seed: galaxySeed, rng, trace, collapsed: true });
  return { rng, visual, galaxy, frames: 0, startupSeed, galaxySeed };
}
