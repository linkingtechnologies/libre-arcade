// SPDX-License-Identifier: GPL-3.0-or-later
export const ORIGINAL = Object.freeze({
  floorWidth: 128,
  floorDepth: 64,
  playerSize: 3,
  playerRadius: 1.5,
  playerWidth: 12,
  ballRadius: 1.5,
  scoreLimit: 5,
  levelStart: 1,
  levelIncreaseSeconds: 2,
  simulationStepMs: 5,
  cameraStepMs: 25,
  cameraFovY: 60,
  cameraDistance: -128,
  cameraRotation: [45, 0, 0],
  colors: {
    player1: [0.71, 0.13, 0.51, 1],
    player2: [0.03, 0.73, 0.96, 1],
    ball: [1.0, 0.84, 0.0, 1],
    floor: [0.25, 0.25, 1.0, 0.8]
  }
});

export const DEFAULT_OPTIONS = Object.freeze({
  levelStart: 1,
  levelIncrease: true,
  scoreLimit: 5,
  warp: true,
  swap: true,
  cameraRotate: true,
  cameraReset: true,
  seed: 0x50535950
});
