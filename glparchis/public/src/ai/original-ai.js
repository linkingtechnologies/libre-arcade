// SPDX-License-Identifier: GPL-3.0-only
/**
 * Faithful translation of Jugador.IASelectFicha from glParchis 20181125.
 * Priority order and per-priority probability are preserved.
 * Threat evaluation preserves the historical SetAmenazas bug-for-bug; see docs/AI.md.
 */
export function selectOriginalAiPawn(game, player) {
  let candidates = game.legalMoves(player.id).map(m => m.pawn);
  if (!candidates.length) return null;

  const byProgress = () => candidates.sort((a, b) => b.pos - a.pos || a.number - b.number);
  byProgress();
  const chance = () => game.rng.chancePercent(game.difficulty);

  // 1) Capture when possible.
  if (chance()) {
    for (const pawn of candidates) {
      const info = game.moveInfo(pawn.id);
      if (info.ok && info.capturePawnId != null) return pawn;
    }
  }

  // 2) Prefer a move that reduces threats.
  if (chance()) {
    candidates.sort((a, b) => game.historicalThreatCount(b, b.pos) - game.historicalThreatCount(a, a.pos) || b.pos - a.pos);
    for (const pawn of candidates) {
      const info = game.moveInfo(pawn.id);
      const before = game.historicalThreatCount(pawn, pawn.pos);
      const after = game.historicalThreatCount(pawn, info.destPos);
      if (before > after) return pawn;
    }
  }

  // 3) Move from an unsafe square to a safe square.
  byProgress();
  if (chance()) {
    for (const pawn of candidates) {
      const info = game.moveInfo(pawn.id);
      if (!game.isSquareSafeForPlayer(game.squareIdAt(pawn), pawn.playerId, true) &&
          game.isSquareSafeForPlayer(game.routeFor(pawn.playerId)[info.destPos], pawn.playerId, false)) {
        return pawn;
      }
    }
  }

  // 4) Move an unprotected pawn.
  if (chance()) {
    for (const pawn of candidates) {
      if (!game.isSquareSafeForPlayer(game.squareIdAt(pawn), pawn.playerId, true)) return pawn;
    }
  }

  // 5) Fallback: most advanced pawn.
  byProgress();
  return candidates[0];
}
