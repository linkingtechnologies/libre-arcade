/*
 * Terramancers HTML5 restoration - parity core.
 * Based on Shai Shapira's 2012 GPL-3.0-or-later Java source.
 * Modified/ported for the HTML5 restoration: 2026-09-12.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See ../LICENSE and ../THIRD_PARTY_NOTICES.md.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TerramancersCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TILE_WIDTH = 32;
  const TILE_HEIGHT = 32;
  const FPS = 60;
  const TPF = 3;
  const SIM_TPS = FPS * TPF;

  const DIRECTION_UP = 0;
  const DIRECTION_RIGHT = 1;
  const DIRECTION_DOWN = 2;
  const DIRECTION_LEFT = 3;
  const DIRECTION_UP_RIGHT = 4;
  const DIRECTION_DOWN_RIGHT = 5;
  const DIRECTION_DOWN_LEFT = 6;
  const DIRECTION_UP_LEFT = 7;

  const BASIC_TILES = [10, 15, 16, 17];
  const TILE_WATER_BASIC = 46;
  const TILE_WATER_PATCH = 36;
  const TILE_WATER_INNER_SE = 38;
  const TILE_WATER_INNER_NE = 39;
  const TILE_WATER_INNER_SW = 40;
  const TILE_WATER_INNER_NW = 41;
  const TILE_WATER_OUTER_N = 43;
  const TILE_WATER_OUTER_W = 45;
  const TILE_WATER_OUTER_E = 47;
  const TILE_WATER_OUTER_S = 49;

  function randInt(rng, n) {
    return Math.floor(rng() * n);
  }

  function getBasicTile(rng) {
    return BASIC_TILES[randInt(rng, 4)];
  }

  function chooseDistinctTerrainTypes(rng) {
    const choices = [0, 1, 2, 3, 4, 5];
    const result = [];
    while (result.length < 3) {
      const idx = randInt(rng, choices.length);
      result.push(choices.splice(idx, 1)[0]);
    }
    return result;
  }

  class Tilemap {
    constructor(rowSize, columnSize, onEndGame) {
      this.rowSize = rowSize;
      this.columnSize = columnSize;
      this.base = Array.from({ length: rowSize }, () => Array(columnSize).fill(0));
      this.addition = Array.from({ length: rowSize }, () => Array(columnSize).fill(255));
      this.tileset = Array.from({ length: rowSize }, () => Array(columnSize).fill(0));
      this.obstacles = Array.from({ length: rowSize }, () => Array(columnSize).fill(false));
      this.tilesetCount = [rowSize * columnSize, 0, 0];
      this.onChange = null;
      this.onEndGame = onEndGame || null;
    }

    get width() { return this.rowSize * TILE_WIDTH; }
    get height() { return this.columnSize * TILE_HEIGHT; }

    inBounds(x, y) {
      return x >= 0 && y >= 0 && x < this.rowSize && y < this.columnSize;
    }

    getTileAt(x, y, base) { return base ? this.base[x][y] : this.addition[x][y]; }
    getTilesetAt(x, y) { return this.tileset[x][y]; }
    getTilesetCount(id) { return this.tilesetCount[id]; }
    isObstacle(x, y) { return this.obstacles[x][y]; }

    changed(x, y) {
      if (this.onChange) this.onChange(x, y);
    }

    setTile(x, y, tileType, base) {
      if (base) this.base[x][y] = tileType;
      else this.addition[x][y] = tileType;
      this.changed(x, y);
    }

    setIsObstacle(x, y, isObstacle) {
      if (!this.obstacles[x][y] && isObstacle) this.tilesetCount[0]--;
      else if (this.obstacles[x][y] && !isObstacle) this.tilesetCount[0]++;
      this.obstacles[x][y] = isObstacle;
    }

    setTileset(x, y, id, connect) {
      this.tilesetCount[this.tileset[x][y]]--;
      this.tileset[x][y] = id;
      this.tilesetCount[id]++;
      this.changed(x, y);

      // Preserve the original edge mirroring behavior. These mirrored cells are
      // deliberately not included in tilesetCount, just as in Tilemap.java.
      if (x === 1) {
        this.tileset[0][y] = id; this.changed(0, y);
      } else if (x === this.rowSize - 2) {
        this.tileset[this.rowSize - 1][y] = id; this.changed(this.rowSize - 1, y);
      }
      if (y === 1) {
        this.tileset[x][0] = id; this.changed(x, 0);
      } else if (y === this.columnSize - 2) {
        this.tileset[x][this.columnSize - 1] = id; this.changed(x, this.columnSize - 1);
      }

      if (x === 1 && y === 1) {
        this.tileset[0][0] = id; this.changed(0, 0);
      } else if (x === this.rowSize - 2 && y === this.columnSize - 2) {
        this.tileset[this.rowSize - 1][this.columnSize - 1] = id;
        this.changed(this.rowSize - 1, this.columnSize - 1);
      } else if (x === 1 && y === this.columnSize - 2) {
        this.tileset[0][this.columnSize - 1] = id;
        this.changed(0, this.columnSize - 1);
      } else if (x === this.rowSize - 2 && y === 1) {
        this.tileset[this.rowSize - 1][0] = id;
        this.changed(this.rowSize - 1, 0);
      }

      if (connect) {
        let tileX = x - 1;
        while (tileX >= 0 && this.tileset[tileX][y] !== id && !this.obstacles[tileX][y]) tileX--;
        if (tileX >= 0 && this.tileset[tileX][y] === id) {
          for (let i = tileX + 1; i < x; i++) this.setTileset(i, y, id, false);
        }

        tileX = x + 1;
        while (tileX < this.rowSize && this.tileset[tileX][y] !== id && !this.obstacles[tileX][y]) tileX++;
        if (tileX < this.rowSize && this.tileset[tileX][y] === id) {
          for (let i = tileX - 1; i > x; i--) this.setTileset(i, y, id, false);
        }

        let tileY = y - 1;
        while (tileY >= 0 && this.tileset[x][tileY] !== id && !this.obstacles[x][tileY]) tileY--;
        if (tileY >= 0 && this.tileset[x][tileY] === id) {
          for (let i = tileY + 1; i < y; i++) this.setTileset(x, i, id, false);
        }

        tileY = y + 1;
        while (tileY < this.columnSize && this.tileset[x][tileY] !== id && !this.obstacles[x][tileY]) tileY++;
        if (tileY < this.columnSize && this.tileset[x][tileY] === id) {
          for (let i = tileY - 1; i > y; i--) this.setTileset(x, i, id, false);
        }
      }

      if (this.tilesetCount[0] === 0 && this.onEndGame) this.onEndGame();
    }

    getPlayerControl(playerId) {
      const claimed = this.tilesetCount[1] + this.tilesetCount[2];
      if (!claimed) return 0;
      if (playerId === 1) return this.tilesetCount[1] / claimed;
      if (playerId === 2) return this.tilesetCount[2] / claimed;
      return 0;
    }
  }

  function generateLevel(rowSize, columnSize, obstacleRatio, multiplayer, rng, onEndGame) {
    rng = rng || Math.random;
    const map = new Tilemap(rowSize, columnSize, onEndGame);

    if (multiplayer) {
      for (let i = 0; i < Math.floor(rowSize / 2) + 1; i++) {
        for (let j = 0; j < columnSize; j++) {
          const mx = rowSize - i - 1;
          const my = columnSize - j - 1;
          map.setTile(i, j, getBasicTile(rng), true);
          map.setTile(mx, my, getBasicTile(rng), true);
          map.setIsObstacle(i, j, false);
          map.setIsObstacle(mx, my, false);
          if (rng() < obstacleRatio) {
            map.setTile(i, j, TILE_WATER_PATCH, false);
            map.setIsObstacle(i, j, true);
            map.setTile(mx, my, TILE_WATER_PATCH, false);
            map.setIsObstacle(mx, my, true);
          }
        }
      }
    } else {
      for (let i = 0; i < rowSize; i++) {
        for (let j = 0; j < columnSize; j++) {
          map.setTile(i, j, getBasicTile(rng), true);
          map.setIsObstacle(i, j, false);
          if (rng() < obstacleRatio) {
            map.setTile(i, j, TILE_WATER_PATCH, false);
            map.setIsObstacle(i, j, true);
          }
        }
      }
    }

    const cx = Math.floor(rowSize / 2);
    const cy = Math.floor(columnSize / 2);
    map.setTile(cx, cy, getBasicTile(rng), false);
    map.setIsObstacle(cx, cy, false);

    for (let i = 2; i < rowSize - 2; i++) {
      map.setIsObstacle(i, 0, true);
      map.setIsObstacle(i, 1, false);
      map.setTile(i, 0, TILE_WATER_BASIC, false);
      map.setTile(i, 1, TILE_WATER_OUTER_S, false);
      map.setTile(i, columnSize - 2, TILE_WATER_OUTER_N, false);
      map.setTile(i, columnSize - 1, TILE_WATER_BASIC, false);
      map.setIsObstacle(i, columnSize - 2, false);
      map.setIsObstacle(i, columnSize - 1, true);
    }

    for (let i = 2; i < columnSize - 2; i++) {
      map.setIsObstacle(0, i, true);
      map.setIsObstacle(1, i, false);
      map.setTile(0, i, TILE_WATER_BASIC, false);
      map.setTile(1, i, TILE_WATER_OUTER_E, false);
      map.setTile(rowSize - 2, i, TILE_WATER_OUTER_W, false);
      map.setTile(rowSize - 1, i, TILE_WATER_BASIC, false);
      map.setIsObstacle(rowSize - 2, i, false);
      map.setIsObstacle(rowSize - 1, i, true);
    }

    map.setIsObstacle(1, 1, false);
    map.setIsObstacle(1, columnSize - 1, false);
    map.setIsObstacle(rowSize - 1, columnSize - 1, false);
    map.setIsObstacle(rowSize - 1, 1, false);

    map.setTile(1, 1, TILE_WATER_INNER_SE, false);
    map.setTile(1, columnSize - 2, TILE_WATER_INNER_NE, false);
    map.setTile(rowSize - 2, 1, TILE_WATER_INNER_SW, false);
    map.setTile(rowSize - 2, columnSize - 2, TILE_WATER_INNER_NW, false);

    const borderCells = [
      [0,0],[1,0],[0,1],
      [rowSize-1,0],[rowSize-2,0],[rowSize-1,1],
      [0,columnSize-1],[1,columnSize-1],[0,columnSize-2],
      [rowSize-1,columnSize-1],[rowSize-2,columnSize-1],[rowSize-1,columnSize-2]
    ];
    for (const [x,y] of borderCells) map.setTile(x, y, TILE_WATER_BASIC, false);
    for (const [x,y] of borderCells) map.setIsObstacle(x, y, true);

    return map;
  }

  class Terramancer {
    constructor(tileset, engine) {
      this.engine = engine;
      this.x = 100.0;
      this.y = 100.0;
      this.width = 50;
      this.height = 100;
      this.tileset = tileset;
      this.movingLeft = false;
      this.movingRight = false;
      this.movingUp = false;
      this.movingDown = false;
      this.facing = DIRECTION_UP;
      this.animationFrame = 0;
      this.animationFrameCounter = 0;
    }

    setLocation(x, y) { this.x = x; this.y = y; }
    isMoving() { return this.movingUp || this.movingRight || this.movingDown || this.movingLeft; }

    // Mirrors the side effect in the original Sprite.draw(): animation state
    // advances once per 60 Hz repaint, not once per 180 Hz simulation tick.
    advanceAnimationFrame() {
      if (!this.isMoving()) return;
      if (this.animationFrameCounter === 0) {
        this.animationFrame++;
        if (this.animationFrame >= 9) this.animationFrame = 0;
        this.animationFrameCounter = 5;
      } else {
        this.animationFrameCounter--;
      }
    }

    tick() {
      let dx = 0;
      let dy = 0;
      const speed = 0.8; // Original hard-coded value; dynamic formula remains intentionally unused.

      if (this.isMoving()) {
        if (this.movingLeft) dx -= speed;
        if (this.movingRight) dx += speed;
        if (this.movingUp) dy -= speed;
        if (this.movingDown) dy += speed;

        if (this.engine.isPointFree(this.x + dx, this.y + dy)) {
          this.x += dx;
          this.y += dy;
        }

        const currentTileset = this.engine.getTilesetAtCoordinates(this.x, this.y);
        if (currentTileset === 0) this.engine.setTilesetAtCoordinates(this.x, this.y, this.tileset);
      }
    }

    moveLeft() {
      this.movingLeft = true;
      if (this.movingUp) this.facing = DIRECTION_UP_LEFT;
      else if (this.movingDown) this.facing = DIRECTION_DOWN_LEFT;
      else this.facing = DIRECTION_LEFT;
    }
    moveRight() {
      this.movingRight = true;
      if (this.movingUp) this.facing = DIRECTION_UP_RIGHT;
      else if (this.movingDown) this.facing = DIRECTION_DOWN_RIGHT;
      else this.facing = DIRECTION_RIGHT;
    }
    moveUp() {
      this.movingUp = true;
      if (this.movingLeft) this.facing = DIRECTION_UP_LEFT;
      else if (this.movingRight) this.facing = DIRECTION_UP_RIGHT;
      else this.facing = DIRECTION_UP;
    }
    moveDown() {
      this.movingDown = true;
      if (this.movingLeft) this.facing = DIRECTION_DOWN_LEFT;
      else if (this.movingRight) this.facing = DIRECTION_DOWN_RIGHT;
      else this.facing = DIRECTION_DOWN;
    }
    stopMovingLeft() {
      this.movingLeft = false;
      if (this.movingUp) this.facing = DIRECTION_UP;
      else if (this.movingDown) this.facing = DIRECTION_DOWN;
    }
    stopMovingRight() {
      this.movingRight = false;
      if (this.movingUp) this.facing = DIRECTION_UP;
      else if (this.movingDown) this.facing = DIRECTION_DOWN;
    }
    stopMovingUp() {
      this.movingUp = false;
      if (this.movingLeft) this.facing = DIRECTION_LEFT;
      else if (this.movingRight) this.facing = DIRECTION_RIGHT;
    }
    stopMovingDown() {
      this.movingDown = false;
      if (this.movingLeft) this.facing = DIRECTION_LEFT;
      else if (this.movingRight) this.facing = DIRECTION_RIGHT;
    }
  }

  class Tree {
    constructor(xTile, yTile, engine, rng) {
      this.engine = engine;
      this.rng = rng || Math.random;
      this.xTile = xTile;
      this.yTile = yTile;
      this.tileset = 2;
      this.reloadTime = 50;
      this.reloadIndex = 0;
      this.patience = 20;
      this.patienceRemaining = 0;
      this.levelWidth = engine.currentLevel.rowSize;
      this.levelHeight = engine.currentLevel.columnSize;
    }

    tick() {
      if (this.reloadIndex === 0) {
        this.patienceRemaining = this.patience;
        this.generatePaint(this.xTile, this.yTile);
        this.reloadIndex = this.reloadTime;
      } else {
        this.reloadIndex--;
      }
    }

    generatePaint(baseX, baseY) {
      if (this.engine.getTilesetAt(baseX, baseY) === 0 && this.engine.isTileFree(baseX, baseY)) {
        this.engine.setTilesetAt(baseX, baseY, this.tileset);
      } else if (this.patienceRemaining > 0) {
        this.patienceRemaining--;
        const direction = randInt(this.rng, 8) + 1;
        let x = baseX;
        let y = baseY;
        switch (direction) {
          case 1: x--; y--; break;
          case 2: y--; break;
          case 3: x++; y--; break;
          case 4: x--; break;
          case 5: x++; break;
          case 6: x--; y++; break;
          case 7: y++; break;
          case 8: x++; y++; break;
        }
        x = Math.max(0, Math.min(this.levelWidth - 1, x));
        y = Math.max(0, Math.min(this.levelHeight - 1, y));
        this.generatePaint(x, y);
      }
    }
  }

  function generateOpponents(level, count, engine, rng) {
    rng = rng || Math.random;
    const objects = [];
    const rowSize = level.rowSize;
    const columnSize = level.columnSize;
    for (let i = 0; i < count; i++) {
      let x = 2 + randInt(rng, rowSize - 4);
      let y = 2 + randInt(rng, columnSize - 4);
      while (level.isObstacle(x, y)) {
        x++;
        if (x >= rowSize - 2) {
          x = 2;
          y++;
          if (y >= columnSize - 2) y = 2;
        }
      }
      objects.push(new Tree(x, y, engine, rng));
      level.setIsObstacle(x, y, true);
    }
    return objects;
  }

  class Engine {
    constructor(options) {
      options = options || {};
      this.rng = options.rng || Math.random;
      this.onEndGame = options.onEndGame || null;
      this.players = [];
      this.objects = [];
      this.currentLevel = null;
      this.previousDifficulty = 1;
      this.screenWidth = 800;
      this.screenHeight = 600;
      this.mode = 'exhibition';
      this.terrainTypes = chooseDistinctTerrainTypes(this.rng);
    }

    setScreenSize(width, height) {
      this.screenWidth = Math.max(192, Math.floor(width));
      this.screenHeight = Math.max(192, Math.floor(height));
    }

    mapDimensions() {
      return {
        rows: Math.floor(this.screenWidth / TILE_WIDTH) + 1,
        cols: Math.floor(this.screenHeight / TILE_HEIGHT) + 1
      };
    }

    mapEndCallback() {
      return () => {
        if (this.onEndGame && this.players.length) this.onEndGame(this.players.length === 1 ? 'single' : 'multi');
      };
    }

    startExhibition() {
      this.mode = 'exhibition';
      const {rows, cols} = this.mapDimensions();
      this.currentLevel = generateLevel(rows, cols, 0.01, false, this.rng, this.mapEndCallback());
      this.players = [];
      this.objects = generateOpponents(this.currentLevel, 8, this, this.rng);
    }

    startSinglePlayerGame(difficultyLevel) {
      if (difficultyLevel == null) difficultyLevel = this.previousDifficulty;
      this.previousDifficulty = difficultyLevel;
      this.mode = 'single';
      this.terrainTypes = chooseDistinctTerrainTypes(this.rng);
      const {rows, cols} = this.mapDimensions();
      const treeCounts = {1:6, 2:8, 3:10};
      const ratios = {1:0.02, 2:0.05, 3:0.08};
      this.currentLevel = generateLevel(rows, cols, ratios[difficultyLevel] || 0, false, this.rng, this.mapEndCallback());
      const p = new Terramancer(1, this);
      p.setLocation(Math.floor(this.screenWidth / 2) - 32, Math.floor(this.screenHeight / 2) - 32);
      this.players = [p];
      this.objects = generateOpponents(this.currentLevel, treeCounts[difficultyLevel] || 0, this, this.rng);
    }

    startMultiplayerGame() {
      this.mode = 'multi';
      this.terrainTypes = chooseDistinctTerrainTypes(this.rng);
      const {rows, cols} = this.mapDimensions();
      this.currentLevel = generateLevel(rows, cols, 0.05, true, this.rng, this.mapEndCallback());
      const p1 = new Terramancer(1, this);
      p1.setLocation(TILE_WIDTH + 32, TILE_HEIGHT + 32);
      const p2 = new Terramancer(2, this);
      p2.setLocation(this.screenWidth - TILE_WIDTH, this.screenHeight - TILE_HEIGHT);
      this.players = [p1, p2];
      this.objects = [];
    }

    tick() {
      for (const player of this.players) player.tick();
      for (const object of this.objects) object.tick();
    }

    getPlayerControl(id) {
      return Math.trunc(this.currentLevel.getPlayerControl(id) * 100);
    }
    getTileXAtPoint(x) { return Math.trunc(x / TILE_WIDTH); }
    getTileYAtPoint(y) { return Math.trunc(y / TILE_HEIGHT); }
    isPointFree(x, y) {
      const tx = this.getTileXAtPoint(x);
      const ty = this.getTileYAtPoint(y);
      if (!this.currentLevel.inBounds(tx, ty)) return false;
      return !this.currentLevel.isObstacle(tx, ty);
    }
    isTileFree(x, y) { return !this.currentLevel.isObstacle(x, y); }
    getTilesetAt(x, y) { return this.currentLevel.getTilesetAt(x, y); }
    setTilesetAt(x, y, id) { this.currentLevel.setTileset(x, y, id, false); }
    getTilesetAtCoordinates(x, y) {
      return this.currentLevel.getTilesetAt(this.getTileXAtPoint(x), this.getTileYAtPoint(y));
    }
    setTilesetAtCoordinates(x, y, id) {
      this.currentLevel.setTileset(this.getTileXAtPoint(x), this.getTileYAtPoint(y), id, true);
    }
    getPlayerSpeed(id) {
      const friendly = this.currentLevel.getTilesetCount(id);
      const enemy = this.currentLevel.getTilesetCount(3 - id);
      const neutral = this.currentLevel.getTilesetCount(0);
      const total = friendly + enemy + neutral;
      return (((friendly * 5 + 0.1 * neutral) / total) * 2.0);
    }
  }

  function parseLegacyMap(bytes) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    if (bytes.length < 2) throw new Error('Map is too short');
    const width = bytes[0], height = bytes[1];
    const required = 2 + width * height * 2;
    if (bytes.length < required) throw new Error('Map data is truncated');
    const base = Array.from({length: width}, () => Array(height));
    const addition = Array.from({length: width}, () => Array(height));
    let p = 2;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        base[x][y] = bytes[p++];
        addition[x][y] = bytes[p++];
      }
    }
    return {width, height, base, addition};
  }

  return {
    TILE_WIDTH, TILE_HEIGHT, FPS, TPF, SIM_TPS,
    DIRECTION_UP, DIRECTION_RIGHT, DIRECTION_DOWN, DIRECTION_LEFT,
    DIRECTION_UP_RIGHT, DIRECTION_DOWN_RIGHT, DIRECTION_DOWN_LEFT, DIRECTION_UP_LEFT,
    BASIC_TILES,
    Tilemap, Terramancer, Tree, Engine,
    generateLevel, generateOpponents, chooseDistinctTerrainTypes, parseLegacyMap
  };
});
