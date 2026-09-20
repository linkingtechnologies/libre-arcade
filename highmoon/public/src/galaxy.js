// SPDX-License-Identifier: GPL-3.0-or-later
import { PI, SCREEN_WIDTH, SCREEN_HEIGHT } from "./constants.js";
import { sphereCollision } from "./simulation.js";
import { Vector2, VectorType } from "./vector2.js";

export const BodyKind = Object.freeze({
  PLANET: "planet",
  STORM: "storm",
  WORMHOLE: "wormhole",
});

export const PlanetType = Object.freeze({
  JUPITER: 0,
  EARTH: 1,
  MARS: 2,
  VENUS: 3,
  SATURN: 4,
});

const PLANET_DATA = Object.freeze({
  [PlanetType.JUPITER]: Object.freeze({ name: "jupiter", weight: 350, width: 141, spacing: 100 }),
  [PlanetType.EARTH]: Object.freeze({ name: "earth", weight: 300, width: 99, spacing: 80 }),
  [PlanetType.MARS]: Object.freeze({ name: "mars", weight: 200, width: 84, spacing: 60 }),
  [PlanetType.VENUS]: Object.freeze({ name: "venus", weight: 180, width: 70, spacing: 30 }),
  [PlanetType.SATURN]: Object.freeze({ name: "saturn", weight: 250, width: 99, spacing: 70 }),
});

function random(rng, max, min, trace, site) {
  return rng.random(max, min, trace, site);
}

function makeStone(rng, isMoon, trace, index) {
  const pos1 = random(rng, 2 * PI, 0, trace, `Stone[${index}].pos1`);
  let pos2;
  let speed;
  if (isMoon) {
    pos2 = random(rng, 2 * PI, 0, trace, `Stone[${index}].pos2`);
    // Literal historical argument order RANDOM(1,3), producing the historical reversed interval (1,3] via a
    // negative multiplier rather than normalizing min/max.
    speed = random(rng, 1, 3, trace, `Stone[${index}].speed`);
  } else {
    pos2 = null;
    speed = random(rng, 1, 2, trace, `Stone[${index}].speed`);
  }
  return {
    kind: isMoon ? "moon" : "stone",
    width: isMoon ? 16 : 6,
    pos1,
    pos2,
    speed,
    x: 0,
    y: 0,
    distance: 0,
  };
}

function makePlanet(rng, trace) {
  const planetType = Math.trunc(random(rng, 5, 0, trace, "Planet.type"));
  const data = PLANET_DATA[planetType];
  let childCount = 0;
  if (planetType === PlanetType.JUPITER) childCount = Math.trunc(random(rng, 4, 1, trace, "Planet.jupiter.children"));
  else if (planetType === PlanetType.EARTH || planetType === PlanetType.MARS) childCount = Math.trunc(random(rng, 2, 0, trace, "Planet.moon.children"));
  else if (planetType === PlanetType.SATURN) childCount = Math.trunc(random(rng, 35, 20, trace, "Planet.saturn.children"));

  const angleRing = random(rng, 2 * PI, 0, trace, "Planet.angle_ring");
  const children = [];
  for (let i = 0; i < childCount; i += 1) {
    const isMoon = childCount <= 3;
    const child = makeStone(rng, isMoon, trace, i);
    child.distance = data.width / 2 + (isMoon
      ? random(rng, 12, 10, trace, `Stone[${i}].distance`)
      : random(rng, 35, 15, trace, `Stone[${i}].distance`));
    child.angleRing = angleRing;
    children.push(child);
  }

  return {
    kind: BodyKind.PLANET,
    planetType,
    name: data.name,
    weight: data.weight,
    width: data.width,
    spacing: data.spacing,
    inBackground: false,
    children,
    hitVector: { x: 0, y: 0 },
    x: 0,
    y: 0,
    finalY: 0,
  };
}

function makeStorm(rng, trace) {
  // GCC used by the preserved oracle evaluates Vector_2 constructor arguments
  // right-to-left. The angle RANDOM() is therefore consumed before length.
  const particles = [];
  for (let i = 0; i < 60; i += 1) {
    const angle = random(rng, 2 * PI, 0, trace, `Storm.particle[${i}].angle`);
    const length = random(rng, 65, 5, trace, `Storm.particle[${i}].length`);
    particles.push({ length, angle });
  }
  return {
    kind: BodyKind.STORM,
    name: "storm",
    weight: -100,
    width: -1,
    spacing: 150,
    inBackground: true,
    particles,
    x: 0,
    y: 0,
    finalY: 0,
  };
}

function makeWormhole(rng, trace) {
  let exitX = random(rng, 350, 150, trace, "Wormhole.exit_x");
  let exitY = random(rng, 350, 150, trace, "Wormhole.exit_y");
  if (Math.trunc(random(rng, 2, 0, trace, "Wormhole.exit_x_sign")) === 1) exitX = -exitX;
  if (Math.trunc(random(rng, 2, 0, trace, "Wormhole.exit_y_sign")) === 1) exitY = -exitY;

  // Constructor-side visual particles consume RNG in the historical game.
  const particles = [];
  for (let i = 0; i < 150; i += 1) particles.push(Math.trunc(random(rng, 800, 0, trace, `Wormhole.particle[${i}]`)) & 0x0000fff0);
  const startParticles = [];
  for (let i = 0; i < 10; i += 1) {
    // Same GCC right-to-left argument evaluation as the native oracle:
    // angle is sampled before length.
    const angle = random(rng, 2 * PI, 0, trace, `Wormhole.start_particle[${i}].angle`);
    const length = random(rng, 25 * 1.5, 5, trace, `Wormhole.start_particle[${i}].length`);
    startParticles.push({ length, angle });
  }

  return {
    kind: BodyKind.WORMHOLE,
    name: "wormhole",
    weight: 50, // literal constructor value; WEIGHT_WORMHOLE=100 is stale in 1.2.4
    width: 25,
    spacing: 60,
    inBackground: true,
    exitX,
    exitY,
    particles,
    startParticles,
    x: 0,
    y: 0,
    finalY: 0,
  };
}

export function bodyCollision(body, x, y, width, spacing = false) {
  const bodyWidth = body.width + (spacing ? body.spacing : 0);
  if (sphereCollision(body.x, body.y, bodyWidth, x, y, width)) return true;

  // During Galaxy::create() children have not yet been drawn, so their
  // collision centers remain their constructor values (0,0). This is kept for
  // fidelity even though generated top-level bodies normally live far away.
  if (body.kind === BodyKind.PLANET) {
    for (const child of body.children) {
      if (sphereCollision(child.x, child.y, child.width, x, y, width)) return true;
    }
  }
  return false;
}

/** Literal Galaxy::create(max,id) RNG + placement semantics. */
export function createGalaxy({ max = 6, seed, rng, trace = null, collapsed = false }) {
  rng.srand(seed);
  const bodies = [];
  const count = Math.min(max, 9);

  for (let i = 0; i < count; i += 1) {
    const type = Math.trunc(random(rng, 8, 0, trace, `Galaxy[${i}].type`));
    let body;
    if (type === 5) body = makeStorm(rng, trace);
    else if (type === 6) body = makeWormhole(rng, trace);
    else body = makePlanet(rng, trace);

    let x;
    let y;
    const widthTest = body.width + body.spacing;
    do {
      x = random(rng, SCREEN_WIDTH - 220, 220, trace, `Galaxy[${i}].x`);
      y = random(rng, SCREEN_HEIGHT, 0, trace, `Galaxy[${i}].y`);
    } while (bodies.some((existing) => bodyCollision(existing, x, y, widthTest, true)));

    body.x = x;
    body.finalY = y;
    body.y = collapsed ? -600 : y;
    bodies.push(body);
  }
  return { seed, bodies, isImploding: collapsed };
}

/** One historical BigBang/implosion animation step from Galaxy::animate_BigBang. */
export function advancePlanetDynamics(body) {
  if (body.kind !== BodyKind.PLANET) return;

  const hv = new Vector2(body.hitVector?.x ?? 0, body.hitVector?.y ?? 0, VectorType.K);
  if (hv.length > 1) {
    body.x += hv.x;
    body.y += hv.y;
    const half = hv.newLength(hv.length / 2);
    body.hitVector = { x: half.x, y: half.y };
  }

  for (const child of body.children) {
    if (child.kind === "moon") {
      child.x = Math.sin(child.pos1) * child.distance + body.x;
      child.y = Math.sin(child.pos2) * child.distance + body.y;
      child.pos1 += PI / 180 * child.speed;
      child.pos2 += PI / 180 * child.speed;
    } else {
      child.x = Math.sin(child.pos1) * child.distance + body.x;
      child.y = Math.sin(-45 * PI / 180) * Math.cos(child.pos1) / 2 * child.distance + body.y;
      child.pos1 += PI / 180 * child.speed;
      child.pos2 += PI / 180;
    }
    if (child.pos1 >= 2 * PI) child.pos1 -= 2 * PI;
    if (child.pos2 >= 2 * PI) child.pos2 -= 2 * PI;
  }
}

export function applyPlanetRecoil(body, projectile) {
  if (body.kind !== BodyKind.PLANET) return;
  let hit = new Vector2(body.x, body.y, VectorType.K).minus(new Vector2(projectile.x, projectile.y, VectorType.K));
  hit.addInPlace(new Vector2(projectile.speed, projectile.direction, VectorType.P));
  hit = hit.newLength(10 / body.weight + 2);
  body.hitVector = { x: hit.x, y: hit.y };
}

/** Non-visual state mutations performed by Planet::draw(). */
export function advanceGalaxyDrawDynamics(galaxy) {
  for (const body of galaxy.bodies) advancePlanetDynamics(body);
}

export function animateBigBang(galaxy) {
  if (!galaxy.isImploding) return false;
  let stillMoving = false;
  for (const body of galaxy.bodies) {
    let y = body.y;
    if (body.finalY > y) {
      stillMoving = true;
      y += ((body.finalY - y) / 10 + 1);
      if (body.finalY < y) y = body.finalY;
    }
    body.y = y;
  }
  galaxy.isImploding = stillMoving;
  return stillMoving;
}

export function settleGalaxy(galaxy, maxFrames = 1000) {
  let frames = 0;
  while (galaxy.isImploding && frames < maxFrames) {
    animateBigBang(galaxy);
    advanceGalaxyDrawDynamics(galaxy);
    frames += 1;
  }
  return frames;
}
