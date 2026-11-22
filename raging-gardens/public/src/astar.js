// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later AND MIT AND CC-BY-3.0
//
// A* path search used by the enemy rabbits, transcribed from the two library
// files the original game shipped (lib/graph.js and lib/astar.js, kept
// verbatim in reference/original/lib/). Only the packaging changed (ES module,
// no globals); the algorithm, its tie-breaking and its quirks are untouched,
// because which of several equally short paths an enemy takes depends on them.
//
//   javascript-astar, http://github.com/bgrins/javascript-astar
//   Freely distributable under the MIT License. (c) Brian Grinstead.
//
//   The binary heap is by Marijn Haverbeke ("Eloquent JavaScript", appendix 2,
//   http://eloquentjavascript.net/1st_edition/appendix2.html), (c) Marijn
//   Haverbeke, Creative Commons Attribution 3.0, with the modifications made in
//   javascript-astar.

export const GraphNodeType = { OPEN: 1, WALL: 0 };

export class GraphNode {
  constructor(x, y, type) {
    this.data = {};
    this.x = x;
    this.y = y;
    this.pos = { x, y };
    this.type = type;
  }
  isWall() { return this.type == GraphNodeType.WALL; }
}

// grid[x][y] holds node types; the nodes are indexed the same way.
export class Graph {
  constructor(grid) {
    const nodes = [];
    for (let x = 0; x < grid.length; x++) {
      nodes[x] = [];
      for (let y = 0, row = grid[x]; y < row.length; y++) nodes[x][y] = new GraphNode(x, y, row[y]);
    }
    this.input = grid;
    this.nodes = nodes;
  }
}

class BinaryHeap {
  constructor(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
  }
  push(element) {
    this.content.push(element);
    this.sinkDown(this.content.length - 1);
  }
  pop() {
    const result = this.content[0];
    const end = this.content.pop();
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  }
  size() { return this.content.length; }
  rescoreElement(node) { this.sinkDown(this.content.indexOf(node)); }
  sinkDown(n) {
    const element = this.content[n];
    while (n > 0) {
      const parentN = ((n + 1) >> 1) - 1;
      const parent = this.content[parentN];
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        n = parentN;
      } else {
        break;
      }
    }
  }
  bubbleUp(n) {
    const length = this.content.length;
    const element = this.content[n];
    const elemScore = this.scoreFunction(element);
    for (;;) {
      const child2N = (n + 1) << 1;
      const child1N = child2N - 1;
      let swap = null;
      let child1Score;
      if (child1N < length) {
        child1Score = this.scoreFunction(this.content[child1N]);
        if (child1Score < elemScore) swap = child1N;
      }
      if (child2N < length) {
        const child2Score = this.scoreFunction(this.content[child2N]);
        if (child2Score < (swap === null ? elemScore : child1Score)) swap = child2N;
      }
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      } else {
        break;
      }
    }
  }
}

function init(grid) {
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      const node = grid[x][y];
      node.f = 0;
      node.g = 0;
      node.h = 0;
      node.cost = node.type;
      node.visited = false;
      node.closed = false;
      node.parent = null;
    }
  }
}

function manhattan(pos0, pos1) {
  return Math.abs(pos1.x - pos0.x) + Math.abs(pos1.y - pos0.y);
}

function neighbors(grid, node, diagonals) {
  const ret = [];
  const x = node.x;
  const y = node.y;
  if (grid[x - 1] && grid[x - 1][y]) ret.push(grid[x - 1][y]); // West
  if (grid[x + 1] && grid[x + 1][y]) ret.push(grid[x + 1][y]); // East
  if (grid[x] && grid[x][y - 1]) ret.push(grid[x][y - 1]); // South
  if (grid[x] && grid[x][y + 1]) ret.push(grid[x][y + 1]); // North
  if (diagonals) {
    if (grid[x - 1] && grid[x - 1][y - 1]) ret.push(grid[x - 1][y - 1]); // Southwest
    if (grid[x + 1] && grid[x + 1][y - 1]) ret.push(grid[x + 1][y - 1]); // Southeast
    if (grid[x - 1] && grid[x - 1][y + 1]) ret.push(grid[x - 1][y + 1]); // Northwest
    if (grid[x + 1] && grid[x + 1][y + 1]) ret.push(grid[x + 1][y + 1]); // Northeast
  }
  return ret;
}

// Returns the nodes to walk through, excluding the start; [] when there is none (or none is needed).
export function search(grid, start, end, diagonal) {
  init(grid);
  const heuristic = manhattan;
  diagonal = !!diagonal;
  const openHeap = new BinaryHeap((node) => node.f);
  openHeap.push(start);
  while (openHeap.size() > 0) {
    const currentNode = openHeap.pop();
    if (currentNode === end) {
      let curr = currentNode;
      const ret = [];
      while (curr.parent) {
        ret.push(curr);
        curr = curr.parent;
      }
      return ret.reverse();
    }
    currentNode.closed = true;
    const list = neighbors(grid, currentNode, diagonal);
    for (let i = 0; i < list.length; i++) {
      const neighbor = list[i];
      if (neighbor.closed || neighbor.isWall()) continue;
      const gScore = currentNode.g + neighbor.cost;
      const beenVisited = neighbor.visited;
      if (!beenVisited || gScore < neighbor.g) {
        neighbor.visited = true;
        neighbor.parent = currentNode;
        neighbor.h = neighbor.h || heuristic(neighbor.pos, end.pos);
        neighbor.g = gScore;
        neighbor.f = neighbor.g + neighbor.h;
        if (!beenVisited) openHeap.push(neighbor);
        else openHeap.rescoreElement(neighbor);
      }
    }
  }
  return [];
}
