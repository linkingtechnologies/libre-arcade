import test from 'node:test';
import assert from 'node:assert/strict';
import { Cube } from '../public/src/core/cube.js';
import { MazeRunner, MAZE_CELL } from '../public/src/games/mazerunner.js';

function passageOpen(model, from, to) {
  const vf = Cube.indexToVector(from);
  const vt = Cube.indexToVector(to);
  let axis = -1;
  let diffCount = 0;
  for (let i = 0; i < Cube.DIMENSIONS; i += 1) {
    if (vf[i] !== vt[i]) {
      axis = i;
      diffCount += 1;
    }
  }
  if (diffCount !== 1) return false;

  const positive = (vf[axis] + 1) % Cube.SIDE_LENGTH === vt[axis];
  const wall = (positive ? MAZE_CELL.RIGHT : MAZE_CELL.LEFT) << (2 * axis);
  return (model.cube.get(from) & wall) === 0;
}

function openNeighborGraph(model) {
  const len = Cube.ARRAY_LENGTHS[model.dimensions];
  return Array.from({ length: len }, (_, index) =>
    Cube.getNeighbors(index, model.dimensions, model.wrap)
      .filter((neighbor) => passageOpen(model, index, neighbor))
  );
}

function bfsPath(model, start, finish) {
  const graph = openNeighborGraph(model);
  const previous = new Array(graph.length).fill(-1);
  const queue = [start];
  previous[start] = start;

  for (let q = 0; q < queue.length; q += 1) {
    const current = queue[q];
    if (current === finish) break;
    for (const next of graph[current]) {
      if (previous[next] !== -1) continue;
      previous[next] = current;
      queue.push(next);
    }
  }

  if (previous[finish] === -1) return null;
  const path = [];
  for (let current = finish; current !== start; current = previous[current]) path.push(current);
  path.push(start);
  return path.reverse();
}

test('Maze Runner generation is deterministic for a supplied seed', () => {
  const a = new MazeRunner({ dimensions: 4, skillLevel: 1, wrap: true, seed: 54321 });
  const b = new MazeRunner({ dimensions: 4, skillLevel: 1, wrap: true, seed: 54321 });
  assert.deepEqual([...a.cube.cells], [...b.cube.cells]);
});

test('start and finish match original wrap and non-wrap coordinates', () => {
  for (const dimensions of [2, 3, 4]) {
    const noWrap = new MazeRunner({ dimensions, wrap: false, seed: 1 });
    const wrap = new MazeRunner({ dimensions, wrap: true, seed: 1 });
    const far = [0, 0, 0, 0];
    const middle = [0, 0, 0, 0];
    for (let axis = 0; axis < dimensions; axis += 1) {
      far[axis] = 3;
      middle[axis] = 2;
    }
    assert.equal(noWrap.curIndex, 0);
    assert.equal(noWrap.finishIndex, Cube.vectorToIndex(far));
    assert.equal(wrap.finishIndex, Cube.vectorToIndex(middle));
  }
});

test('all generated mazes are connected in 2D/3D/4D', () => {
  for (const dimensions of [2, 3, 4]) {
    for (const skillLevel of [0, 1, 2]) {
      for (const wrap of [false, true]) {
        const model = new MazeRunner({ dimensions, skillLevel, wrap, seed: 20260912 });
        const graph = openNeighborGraph(model);
        const seen = new Set([0]);
        const queue = [0];
        for (let q = 0; q < queue.length; q += 1) {
          for (const next of graph[queue[q]]) {
            if (seen.has(next)) continue;
            seen.add(next);
            queue.push(next);
          }
        }
        assert.equal(seen.size, Cube.ARRAY_LENGTHS[dimensions]);
      }
    }
  }
});

test('Hard mode is a perfect maze with exactly cells-1 undirected passages', () => {
  for (const dimensions of [2, 3, 4]) {
    for (const wrap of [false, true]) {
      const model = new MazeRunner({ dimensions, skillLevel: 2, wrap, seed: 9876 });
      const graph = openNeighborGraph(model);
      const directedOpenEdges = graph.reduce((sum, list) => sum + list.length, 0);
      assert.equal(directedOpenEdges / 2, Cube.ARRAY_LENGTHS[dimensions] - 1);
    }
  }
});

test('walls are symmetric across every neighbouring cell pair', () => {
  const model = new MazeRunner({ dimensions: 4, skillLevel: 0, wrap: true, seed: 42 });
  const len = Cube.ARRAY_LENGTHS[4];
  for (let index = 0; index < len; index += 1) {
    for (const neighbor of Cube.getNeighbors(index, 4, true)) {
      assert.equal(passageOpen(model, index, neighbor), passageOpen(model, neighbor, index));
    }
  }
});

test('a non-collinear click does not move the player', () => {
  const model = new MazeRunner({ dimensions: 2, skillLevel: 0, wrap: false, seed: 3 });
  const diagonal = Cube.vectorToIndex([1, 1, 0, 0]);
  const result = model.move(diagonal);
  assert.equal(result.moved, false);
  assert.equal(model.curIndex, 0);
  assert.equal(model.stepsTaken, 0);
});

test('an open neighbouring passage can always be traversed and marks the source visited', () => {
  const model = new MazeRunner({ dimensions: 3, skillLevel: 2, wrap: false, seed: 17 });
  const graph = openNeighborGraph(model);
  const next = graph[0][0];
  assert.notEqual(next, undefined);
  const result = model.move(next);
  assert.equal(result.moved, true);
  assert.equal(model.curIndex, next);
  assert.equal(model.stepsTaken, 1);
  assert.ok((model.cube.get(0) & MAZE_CELL.BEEN_HERE) !== 0);
});

test('following the carved graph to the target wins', () => {
  const model = new MazeRunner({ dimensions: 4, skillLevel: 2, wrap: true, seed: 1001 });
  const path = bfsPath(model, model.curIndex, model.finishIndex);
  assert.ok(path && path.length > 1);
  for (const next of path.slice(1)) {
    const result = model.move(next);
    assert.equal(result.moved, true);
  }
  assert.equal(model.curIndex, model.finishIndex);
  assert.equal(model.hasWon, true);
});

test('dimensional-help legalMoves reports only destinations the original move logic accepts', () => {
  const base = new MazeRunner({ dimensions: 4, skillLevel: 0, wrap: true, seed: 1 });
  const moves = base.legalMoves();
  assert.ok(moves.length > 0);
  for (const move of moves) {
    const copy = new MazeRunner({ dimensions: 4, skillLevel: 0, wrap: true, seed: 1 });
    const result = copy.move(move.index);
    assert.equal(result.moved, true, `reported target ${move.index} must be traversable`);
  }
});

test('dimensional-help classifies third/fourth-axis targets without exposing a solver path', () => {
  const model = new MazeRunner({ dimensions: 4, skillLevel: 0, wrap: true, seed: 1 });
  const moves = model.legalMoves();
  const dimensional = moves.filter((move) => move.dimensional);
  assert.ok(dimensional.some((move) => move.axis === 2));
  assert.ok(dimensional.some((move) => move.axis === 3));
  for (const move of dimensional) assert.ok(move.axis >= 2);
  assert.equal(moves.some((move) => Object.hasOwn(move, 'finishIndex')), false);
});

test('dimensional-help marks routes that actually cross a wrap boundary', () => {
  const model = new MazeRunner({ dimensions: 4, skillLevel: 0, wrap: true, seed: 1 });
  const wrapped = model.legalMoves().filter((move) => move.wrapped);
  assert.ok(wrapped.length > 0);
  for (const move of wrapped) {
    assert.equal(model.wrap, true);
    assert.ok(move.distance > 0);
  }

  const noWrap = new MazeRunner({ dimensions: 4, skillLevel: 0, wrap: false, seed: 1 });
  assert.equal(noWrap.legalMoves().some((move) => move.wrapped), false);
});
