/*
 * Yanoid Web Port
 * Copyright (C) 2026 Yanoid web port contributors
 *
 * Derived from Yanoid 0.3.0 (GPL-2.0-or-later).
 * This port is distributed under GPL-3.0-or-later.
 */

export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 600;
export const BALL_BASE_SPEED = 0.19;          // pixels / ms
export const BALL_ACCELERATION = 0.000003;    // pixels / ms^2, target-speed growth
export const PADDLE_TARGET_SPEED = 0.4;        // pixels / ms
export const PADDLE_ACCELERATION = 0.002;      // pixels / ms^2
export const PADDLE_DECELERATION = 0.001;      // pixels / ms^2
export const INITIAL_PADDLE_CURRENT_SPEED = 2.0; // historical SetPaddle quirk
export const INITIAL_PADDLE_ACCELERATION = -0.03;
export const ANGLE_MODIFIER = 0.05;
export const MOVEMENT_ANGLE_MODIFIER = 1.55;
export const MIN_PADDLE_BOUNCE_ANGLE = Math.PI / 7;
export const MAX_PADDLE_BOUNCE_ANGLE = 6 * Math.PI / 7;

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const normalizeAngle = a => {
  const tau = Math.PI * 2;
  return ((a % tau) + tau) % tau;
};

// Mirrors the TFreeMotion convention: angle 0 is right, pi/2 is up.
export function vectorFromDirection(direction, speed) {
  return {
    x: Math.cos(direction) * speed,
    y: Math.sin(-direction) * speed,
  };
}

export function directionFromVector(vx, vy) {
  return normalizeAngle(Math.atan2(-vy, vx));
}

export function updateAcceleratedVelocity(current, target, acceleration, dt) {
  let next = current + dt * acceleration;
  if (acceleration >= 0 && next >= target) next = target;
  if (acceleration <= 0 && next <= target) next = target;
  return next;
}

/**
 * Exact paddle-angle modifier from Yanoid 0.3.0 TEntity::OnCollision.
 * `incomingDirection` must describe a ball travelling down toward the paddle.
 */
export function paddleBounceDirection(incomingDirection, ballCenterX, paddleX, paddleWidth, paddleVelocity) {
  const half = paddleWidth / 2;
  let lx = clamp(ballCenterX - paddleX, 0, paddleWidth);
  let modangle = 0;
  if (lx !== half) {
    modangle = half < lx ? -Math.log(lx - half) : Math.log(half - lx);
  }
  if (Math.abs(half - lx) < paddleWidth * 0.3) modangle = 0;

  const modangle2 = -(MOVEMENT_ANGLE_MODIFIER * paddleVelocity);
  let newangle = normalizeAngle(2 * Math.PI - incomingDirection);
  newangle += modangle * ANGLE_MODIFIER + modangle2;
  return clamp(newangle, MIN_PADDLE_BOUNCE_ANGLE, MAX_PADDLE_BOUNCE_ANGLE);
}

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Determine which axis to reflect on. This intentionally uses bounding boxes,
 * matching the collision granularity actually used by the 0.3.0 release.
 */
export function collisionAxis(mover, target, prevX, prevY) {
  const prevRight = prevX + mover.w;
  const prevBottom = prevY + mover.h;
  const targetRight = target.x + target.w;
  const targetBottom = target.y + target.h;

  if (prevBottom <= target.y && mover.y + mover.h > target.y) return 'y';
  if (prevY >= targetBottom && mover.y < targetBottom) return 'y';
  if (prevRight <= target.x && mover.x + mover.w > target.x) return 'x';
  if (prevX >= targetRight && mover.x < targetRight) return 'x';

  const overlapLeft = mover.x + mover.w - target.x;
  const overlapRight = targetRight - mover.x;
  const overlapTop = mover.y + mover.h - target.y;
  const overlapBottom = targetBottom - mover.y;
  const minX = Math.min(overlapLeft, overlapRight);
  const minY = Math.min(overlapTop, overlapBottom);
  return minX < minY ? 'x' : 'y';
}

export function historicalPowerupShouldSpawn(randInt0to99, probability = 20) {
  // Original Python: randrange(0,100) > (100 - probability).
  // At the default 20 this means 81..99 => 19%, not 20%.
  return randInt0to99 > (100 - probability);
}

export const POWERUP_DEFS = [
  { weight: 9, id: 'ball', sprite: 'red_b.png' },
  { weight: 2, id: 'life', sprite: 'blue_1UP.png' },
  { weight: 2, id: 'remove-life', sprite: 'yellow_steallife.png' },
  { weight: 6, id: 'shot', sprite: 'green_s.png' },
  { weight: 3, id: 'super-shot', sprite: 'purple_ss.png' },
  { weight: 2, id: 'normal-paddle', sprite: 'powerup_normal.png' },
  { weight: 4, id: 'wide-paddle', sprite: 'powerup_larger.png' },
  { weight: 3, id: 'narrow-paddle', sprite: 'powerup_smaller.png' },
  { weight: 1, id: 'score--1000', sprite: 'lightblue_-1000.png', amount: -1000 },
  { weight: 2, id: 'score--500', sprite: 'lightblue_-500.png', amount: -500 },
  { weight: 3, id: 'score--100', sprite: 'lightblue_-100.png', amount: -100 },
  { weight: 3, id: 'score-100', sprite: 'lightblue_100.png', amount: 100 },
  { weight: 2, id: 'score-500', sprite: 'lightblue_500.png', amount: 500 },
  { weight: 1, id: 'score-1000', sprite: 'lightblue_1000.png', amount: 1000 },
];

export const POWERUP_TOTAL_WEIGHT = POWERUP_DEFS.reduce((sum, p) => sum + p.weight, 0);

export function historicalWeightedPowerup(weightValue) {
  // Preserves the original <= cumulative comparison (including its small bias).
  let sum = 0;
  for (const p of POWERUP_DEFS) {
    sum += p.weight;
    if (weightValue <= sum) return p;
  }
  return POWERUP_DEFS.at(-1);
}

export function contestTimeBonus(levelElapsedMs) {
  // TClient resets game_start/game_lastupdate for every map and excludes
  // paused transition time. GameState.gametime therefore is per-level time.
  const belowPar = Math.floor(levelElapsedMs / 1000) - 180;
  return belowPar < 0 ? -5 * belowPar : 0;
}

/**
 * Reproduction of Yanoid 0.3.0 TEntity::boundingBoxCollision metadata.
 * Returns the corner/contact values consumed by TEntity::OnCollision.
 */
export function contestBoundingBoxInfo(a, b) {
  const x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
  const w1 = a.w, h1 = a.h, w2 = b.w, h2 = b.h;
  if (x1 < x2) {
    if (x1 + w1 > x2) {
      if (y1 < y2) {
        if (y1 + h1 > y2) {
          return { aPoint: {x:x1+w1,y:y1+h1}, bPoint:{x:x2,y:y2}, aCorner:3, bCorner:1 };
        }
      } else if (y2 + h2 > y1) {
        return { aPoint: {x:x1+w1,y:y1}, bPoint:{x:x2,y:y2+h2}, aCorner:4, bCorner:2 };
      }
    }
  } else if (x2 + w2 > x1) {
    if (y2 < y1) {
      if (y2 + h2 > y1) {
        return { aPoint:{x:x1,y:y1}, bPoint:{x:x2+w2,y:y2+h2}, aCorner:1, bCorner:3 };
      }
    } else if (y1 + h1 > y2) {
      return { aPoint:{x:x1,y:y1+h1}, bPoint:{x:x2+w2,y:y2}, aCorner:2, bCorner:4 };
    }
  }
  return null;
}

/**
 * Reproduction of the ball collision-response branch in Yanoid 0.3.0
 * `TEntity::OnCollision`, using the already-calculated contest contact info.
 */
export function resolveContestBallCollision(ball, target, info, paddleVelocity = 0) {
  const colx = ball.x, coly = ball.y;
  let x = ball.prevX, y = ball.prevY;
  let direction = ball.direction;

  // Original special case: after rewinding, a ball already below the paddle's
  // top is considered on its way down the drain.
  if (target.type === 'paddle' && y + ball.h > target.y) {
    if (!ball.dying &&
        ((direction > 3*Math.PI/2 && x < target.x + target.w/2) ||
         (direction < 3*Math.PI/2 && x > target.x + target.w/2))) {
      direction = normalizeAngle(3*Math.PI - direction);
    }
    return { x: colx, y: coly, direction, dying: true, targetSpeed: 0.5 };
  }

  let ballwidth = 0, ballheight = 0;
  switch (info.bCorner) {
    case 1: ballwidth = ball.w; ballheight = ball.h; break;
    case 2: ballwidth = ball.w; break;
    case 4: ballheight = ball.h; break;
  }

  const dx = info.aPoint.x - (x + ballwidth);
  const dy = info.aPoint.y - (y + ballheight);
  const linIntersectY = dy * ((info.bPoint.x - (x + ballwidth)) / dx) + y + ballheight;
  let verticalhit = false;
  switch (info.bCorner) {
    case 1: if (linIntersectY > info.bPoint.y && dx > 0) verticalhit = true; break;
    case 2: if (linIntersectY < info.bPoint.y && dx > 0) verticalhit = true; break;
    case 3: if (linIntersectY < info.bPoint.y && dx < 0) verticalhit = true; break;
    case 4: if (linIntersectY > info.bPoint.y && dx < 0) verticalhit = true; break;
  }

  let newangle;
  if (verticalhit) {
    newangle = dy < 0 ? Math.PI - direction : 3*Math.PI - direction;
    if (dx >= 0) x = colx - 2 * ((colx + ballwidth) - info.bPoint.x);
    else x = colx + 2 * (info.bPoint.x - colx);
    y = coly;
  } else {
    newangle = 2*Math.PI - direction;
    if (dy >= 0) {
      y = coly - 2 * ((coly + ballheight) - info.bPoint.y) - 1;
      if (target.type === 'paddle') {
        // The C++ code computes contact x while the ball's x is still rewound.
        newangle = paddleBounceDirection(direction, ball.prevX + ball.w/2, target.x, target.w, paddleVelocity);
      }
    } else {
      y = coly + 2 * (info.bPoint.y - coly) + 1;
    }
    x = colx;
  }

  return { x, y, direction: normalizeAngle(newangle), dying: ball.dying || false, targetSpeed: ball.targetSpeed };
}
