// SPDX-License-Identifier: GPL-3.0-or-later
import { PI, MAX_CLUSTER_LASERS, CLUSTER_LASER_ANGLE_DEG } from "./constants.js";
import { Vector2, VectorType } from "./vector2.js";

export const Weapon = Object.freeze({
  LASER: Object.freeze({ id: "laser", weight: 1 }),
  HEAVY: Object.freeze({ id: "heavy", weight: 2 }),
  CLUSTER: Object.freeze({ id: "cluster", weight: 1 }),
});

/** Historical Cluster::hit() fragment initialization. */
export function spawnClusterFragments({ x, y, speed }, collider) {
  const hitVector = new Vector2(x, y, VectorType.K).minus(new Vector2(collider.x, collider.y, VectorType.K));
  let dir = hitVector.angle - (CLUSTER_LASER_ANGLE_DEG * MAX_CLUSTER_LASERS / 2) * PI / 180;
  const fragments = [];

  for (let i = 0; i < MAX_CLUSTER_LASERS; i += 1) {
    const velocity = new Vector2(speed / 5 * 3, dir, VectorType.P);
    const start = new Vector2(x, y, VectorType.K).plus(new Vector2(10, dir, VectorType.P));
    fragments.push({ x: start.x, y: start.y, speed: velocity.length, direction: velocity.angle, weight: 1 });
    dir += CLUSTER_LASER_ANGLE_DEG * PI / 180;
  }
  return fragments;
}
