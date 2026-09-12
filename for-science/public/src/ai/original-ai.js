/**
 * Behavioral port of GameLayer.get_move() and the v1.0.1 combat choice logic.
 * The original source calls this its "artificial stupidity"; no strengthening
 * is done here because weak or odd decisions are part of the preserved work.
 */
export function findOriginalMove(board, rng) {
  const testCaseX = (x, y, tile, pattern) => {
    for (let j = 0; j < pattern.length; j += 1) {
      if (pattern[j] !== (board.get(x + j, y) === tile)) return false;
    }
    return true;
  };
  const testCaseXDown = (x, y, tile, pattern) => {
    for (let j = 0; j < pattern.length; j += 1) {
      if (pattern[j] !== (board.get(x + j, y) === tile)) return false;
      if (!pattern[j] && board.get(x + j, y + 1) !== tile) return false;
    }
    return true;
  };
  const testCaseXUp = (x, y, tile, pattern) => {
    for (let j = 0; j < pattern.length; j += 1) {
      if (pattern[j] !== (board.get(x + j, y) === tile)) return false;
      if (!pattern[j] && board.get(x + j, y - 1) !== tile) return false;
    }
    return true;
  };
  const testCaseY = (x, y, tile, pattern) => {
    for (let j = 0; j < pattern.length; j += 1) {
      if (pattern[j] !== (board.get(x, y + j) === tile)) return false;
    }
    return true;
  };
  const testCaseYRight = (x, y, tile, pattern) => {
    for (let j = 0; j < pattern.length; j += 1) {
      if (pattern[j] !== (board.get(x, y + j) === tile)) return false;
      if (!pattern[j] && board.get(x + 1, y + j) !== tile) return false;
    }
    return true;
  };
  const testCaseYLeft = (x, y, tile, pattern) => {
    for (let j = 0; j < pattern.length; j += 1) {
      if (pattern[j] !== (board.get(x, y + j) === tile)) return false;
      if (!pattern[j] && board.get(x - 1, y + j) !== tile) return false;
    }
    return true;
  };

  const moves = [];
  let combo = false;
  const push = (a, b) => moves.push([{ x: a[0], y: a[1] }, { x: b[0], y: b[1] }]);

  for (let tile = 0; tile < 6; tile += 1) {
    for (let y = 0; y < board.height; y += 1) {
      for (let x = 0; x < board.width - 4; x += 1) {
        if (testCaseX(x, y, tile, [true, false, true, true, true])) { push([x, y], [x + 1, y]); combo = true; }
        if (testCaseX(x, y, tile, [true, true, true, false, true])) { push([x + 3, y], [x + 4, y]); combo = true; }
      }
    }
    for (let y = 0; y < board.height; y += 1) {
      for (let x = 0; x < board.width - 3; x += 1) {
        if (testCaseX(x, y, tile, [true, false, true, true])) push([x, y], [x + 1, y]);
        if (testCaseX(x, y, tile, [true, true, false, true])) push([x + 2, y], [x + 3, y]);
      }
    }
    for (let y = 1; y < board.height; y += 1) {
      for (let x = 0; x < board.width - 2; x += 1) {
        if (testCaseXUp(x, y, tile, [false, true, true])) push([x, y], [x, y - 1]);
        if (testCaseXUp(x, y, tile, [true, false, true])) push([x + 1, y], [x + 1, y - 1]);
        if (testCaseXUp(x, y, tile, [true, true, false])) push([x + 2, y], [x + 2, y - 1]);
      }
    }
    for (let y = 0; y < board.height - 1; y += 1) {
      for (let x = 0; x < board.width - 2; x += 1) {
        if (testCaseXDown(x, y, tile, [false, true, true])) push([x, y], [x, y + 1]);
        if (testCaseXDown(x, y, tile, [true, false, true])) push([x + 1, y], [x + 1, y + 1]);
        if (testCaseXDown(x, y, tile, [true, true, false])) push([x + 2, y], [x + 2, y + 1]);
      }
    }
    for (let x = 0; x < board.width; x += 1) {
      for (let y = 0; y < board.height - 4; y += 1) {
        if (testCaseY(x, y, tile, [true, false, true, true, true])) { push([x, y], [x, y + 1]); combo = true; }
        if (testCaseY(x, y, tile, [true, true, true, false, true])) { push([x, y + 3], [x, y + 4]); combo = true; }
      }
    }
    for (let x = 0; x < board.width; x += 1) {
      for (let y = 0; y < board.height - 3; y += 1) {
        if (testCaseY(x, y, tile, [true, false, true, true])) push([x, y], [x, y + 1]);
        if (testCaseY(x, y, tile, [true, true, false, true])) push([x, y + 2], [x, y + 3]);
      }
    }
    for (let x = 0; x < board.width - 1; x += 1) {
      for (let y = 0; y < board.height - 2; y += 1) {
        if (testCaseYRight(x, y, tile, [false, true, true])) push([x, y], [x + 1, y]);
        if (testCaseYRight(x, y, tile, [true, false, true])) push([x, y + 1], [x + 1, y + 1]);
        if (testCaseYRight(x, y, tile, [true, true, false])) push([x, y + 2], [x + 1, y + 2]);
      }
    }
    for (let x = 1; x < board.width; x += 1) {
      for (let y = 0; y < board.height - 2; y += 1) {
        if (testCaseYLeft(x, y, tile, [false, true, true])) push([x, y], [x - 1, y]);
        if (testCaseYLeft(x, y, tile, [true, false, true])) push([x, y + 1], [x - 1, y + 1]);
        if (testCaseYLeft(x, y, tile, [true, true, false])) push([x, y + 2], [x - 1, y + 2]);
      }
    }

    // v1.0.1 change: money AND shield get priority.
    if ((tile === 0 || tile === 1) && moves.length) break;
    if (combo && moves.length) break;
  }

  if (!moves.length) return [];
  rng.shuffle(moves);
  return moves[0];
}

export function chooseOriginalAsset(currentPlayer, enemyPlayer, rng) {
  if (currentPlayer.shield < 45 && currentPlayer.canUse(0)) return 0;

  if (currentPlayer.score[0] > 90 || enemyPlayer.shield < 25) {
    const possible = [null];
    if (currentPlayer.canUse(4)) possible.push(4, 4, 4, 4);
    if (currentPlayer.canUse(3)) possible.push(3, 3, 3);
    if (currentPlayer.canUse(2)) possible.push(2, 2);
    if (currentPlayer.canUse(1)) possible.push(1);
    rng.shuffle(possible);
    return possible[0];
  }

  const possible = [null, null, null, null];
  if (currentPlayer.canUse(4)) possible.push(4, 4, 4);
  if (currentPlayer.canUse(3)) possible.push(3, 3);
  rng.shuffle(possible);
  return possible[0];
}
