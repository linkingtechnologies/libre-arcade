export const LOGIC_HZ = 100;
export const STEP_MS = 1000 / LOGIC_HZ;
export const WORLD_W = 640;
export const WORLD_H = 480;
export const PLAYFIELD_H = 448;
export const GRID_W = 20;
export const GRID_H = 14;
export const TILE = 32;
export const LEVEL_BYTES = GRID_W * GRID_H;

export const EMPTY = 45; // '-'
export const PLAYER_MARKER = 97; // 'a'
export const BREAKABLE_MARKER = 106; // 'j'

// fuente.cc: a normal message is updated for 215 ticks and its dead list node
// is pruned on the following procesos::actualizar(), so hay_mensaje_activo()
// remains true for 216 process ticks. The quick variant is 113 + prune = 114.
export const NORMAL_MESSAGE_PROCESS_TICKS = 216;
export const QUICK_MESSAGE_PROCESS_TICKS = 114;

export const PLAYER_STATE = Object.freeze({
  IDLE: 0,
  WALK: 1,
  SHOOT: 2,
  DYING: 3,
  CLIMB: 5,
  CROUCH: 6,
  FALL: 7,
  SWEEP: 8,
  SPIN: 9,
  FALL_SPIN: 10,
  BOMB: 11
});

export const SHOT_STATE = Object.freeze({
  NORMAL: 0,
  STUCK: 1,
  ENDING: 2,
  ENDING_STUCK: 3,
  DEAD: -1
});

export const SHOT_TYPE = Object.freeze({ SIMPLE: 0, TRIDENT: 1 });
