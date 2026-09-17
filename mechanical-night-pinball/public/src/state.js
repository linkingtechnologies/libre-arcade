import { PARITY } from './config.js';

export function createGameState() {
  return {
    score: 0,
    highScore: 0,
    balls: PARITY.initialBalls,
    multiplier: PARITY.initialMultiplier,
    gameOver: false,
    language: 'it',
    audioEnabled: true,
    musicEnabled: true,
  };
}

export function addScore(state, basePoints) {
  if (state.gameOver) return 0;
  const awarded = basePoints * state.multiplier;
  state.score += awarded;
  state.highScore = Math.max(state.highScore, state.score);
  return awarded;
}

export function increaseMultiplier(state) {
  if (!state.gameOver && state.multiplier < PARITY.maxMultiplier) state.multiplier += 1;
  return state.multiplier;
}

export function addBall(state) {
  if (!state.gameOver) state.balls += 1;
  return state.balls;
}

export function loseBall(state) {
  if (state.gameOver) return;
  state.balls = Math.max(0, state.balls - 1);
  if (state.balls === 0) state.gameOver = true;
}

export function restartGame(state) {
  const preserved = {
    highScore: state.highScore,
    language: state.language,
    audioEnabled: state.audioEnabled,
    musicEnabled: state.musicEnabled,
  };
  Object.assign(state, createGameState(), preserved);
}
