import { NEXT_LEVEL_DELAY, PLAYER_MOVE_DURATION } from './constants';
import {
  FREEZE_TIME_AUDIO,
  LOSE_AUDIO,
  MOVE_AUDIO,
  REVERSE_AUDIO,
  TELEPORT_AUDIO,
  WIN_AUDIO,
} from './audio';
import {
  Door,
  Enemy,
  FreezeTime,
  Player,
  Reverse,
  Teleporter,
  Wall,
} from './entities';
import { LOST, PLAYING, WON } from './gamestate';
import levels from './levels';
import {
  createEntitiesFromLevel,
  findOverlappingEntities,
  playSoundEffect,
} from './util';

export default {
  canMove: true,
  frozenTurnsRemaining: 0,

  state: {
    boardSize: 0,
    currentLevelNumber: 0,
    entities: [],
    gameState: PLAYING,
  },

  get enemies () {
    return this.state.entities
      .filter(entity => entity instanceof Enemy)
      .filter(enemy => !enemy.isDisabled);
  },

  get isEnemiesFrozen () {
    return this.frozenTurnsRemaining > 0;
  },

  get isLossConditionMet () {
    const { x, y } = this.player;
    return this.enemies.some(enemy => enemy.isAt(x, y));
  },

  get isWinConditionMet () {
    const door = this.state.entities.find(entity => entity instanceof Door);
    const { x, y } = door;
    return this.player.isAt(x, y);
  },

  get player () {
    return this.state.entities.find(entity => entity instanceof Player);
  },

  get walls () {
    return this.state.entities
      .filter(entity => entity instanceof Wall)
      .filter(wall => !wall.isDisabled);
  },

  checkForWinOrLoss () {
    if (this.isLossConditionMet) {
      this.lose();
    } else if (this.isWinConditionMet) {
      this.win();
    }
  },

  isBeyondBoundary (x, y) {
    const { boardSize } = this.state;
    return x < 0 || x >= boardSize || y < 0 || y >= boardSize;
  },

  isWallAt (x, y) {
    return this.walls.some(wall => wall.isAt(x, y));
  },

  lose () {
    this.state.gameState = LOST;
    setTimeout(() => this.reloadLevel(), NEXT_LEVEL_DELAY);
    playSoundEffect(LOSE_AUDIO);
  },

  pickUpCollectablesAt (x, y) {
    const freezeTime = this.state.entities
      .filter(entity => entity instanceof FreezeTime)
      .filter(entity => !entity.isDisabled)
      .find(entity => entity.isAt(x, y));

    if (freezeTime) {
      this.frozenTurnsRemaining = freezeTime.forTurns;
      freezeTime.isDisabled = true;
      playSoundEffect(FREEZE_TIME_AUDIO);
    }

    const reverse = this.state.entities
      .filter(entity => entity instanceof Reverse)
      .filter(entity => !entity.isDisabled)
      .find(entity => entity.isAt(x, y));

    if (reverse) {
      this.reverseEnemiesAndWalls();
      this.frozenTurnsRemaining += 1;
      reverse.isDisabled = true;
      playSoundEffect(REVERSE_AUDIO);
    }
  },

  reverseEnemiesAndWalls () {
    const { enemies, walls } = this;

    // Remove the old enemies and walls:

    enemies.forEach(enemy => {
      enemy.isDisabled = true;
    });

    walls.forEach(wall => {
      wall.isDisabled = true;
    });

    // Create new enemies and walls where the old ones once were.
    const newEnemies = walls.map(({ x, y }) => new Enemy(x, y));
    const newWalls = enemies.map(({ x, y }) => new Wall(x, y));

    this.state.entities = this.state.entities.concat(newEnemies, newWalls);
  },

  teleportFrom (x, y) {
    const teleporters = this.state.entities.filter(entity => entity instanceof Teleporter);

    const firstTeleporter = teleporters.find(teleporter => teleporter.isAt(x, y));

    if (!firstTeleporter) {
      return false;
    }

    const secondTeleporter = teleporters.find(teleporter => teleporter != firstTeleporter);
    const { x: newX, y: newY } = secondTeleporter;
    this.player.moveTo(newX, newY);
    playSoundEffect(TELEPORT_AUDIO);
    return true;
  },

  win () {
    this.state.gameState = WON;
    playSoundEffect(WIN_AUDIO);
    setTimeout(() => this.loadNextLevel(), NEXT_LEVEL_DELAY);
  },


  // Level management:

  loadLevel (levelNumber) {
    const allLevelsComplete = levelNumber >= levels.length;

    if (allLevelsComplete) {
      alert('That\'s all for now. Thanks for playing!');
      location.reload();
      return;
    }

    const level = levels[levelNumber];
    this.state.boardSize = level.length;
    this.state.currentLevelNumber = levelNumber;
    this.state.entities = createEntitiesFromLevel(level);
    this.state.gameState = PLAYING;
  },

  loadNextLevel () {
    this.loadLevel(this.state.currentLevelNumber + 1);
  },

  reloadLevel () {
    this.loadLevel(this.state.currentLevelNumber);
  },


  // Enemy movement:

  killOverlappingEnemies () {
    findOverlappingEntities(this.enemies).forEach(enemy => {
      const { x, y } = enemy;

      if (!this.isWallAt(x, y)) {
        const wall = new Wall(x, y);
        this.state.entities.push(wall);
      }

      enemy.isDisabled = true;
    });
  },

  moveEnemies () {
    if (this.isEnemiesFrozen) {
      return;
    }

    this.enemies.forEach(this.moveEnemy, this);

    if (this.isLossConditionMet) {
      this.lose();
    } else if (this.isWinConditionMet) {
      this.win();
    } else {
      this.killOverlappingEnemies();
    }
  },

  moveEnemy (enemy) {
    const { player } = this;
    let { x, y } = enemy;

    // Move horizontally towards player.
    if (x < player.x) {
      x += 1;
    } else if (x > player.x) {
      x -= 1;
    }

    // Move vertically towards player.
    if (y < player.y) {
      y += 1;
    } else if (y > player.y) {
      y -= 1;
    }

    enemy.moveTo(x, y);

    if (this.isWallAt(x, y)) {
      enemy.isDisabled = true;
    }
  },


  // Player movement:

  movePlayerBy (xDelta, yDelta) {
    if (!this.canMove || this.state.gameState !== PLAYING) {
      return;
    }

    const { player } = this;
    let { x, y } = player;
    x += xDelta;
    y += yDelta;

    if (this.isBeyondBoundary(x, y) || player.isBeyondMovementRange(x, y) || this.isWallAt(x, y)) {
      return;
    }

    player.moveTo(x, y);
    playSoundEffect(MOVE_AUDIO);
    this.canMove = false;

    // Wait for player move animation to complete before reacting to it.
    setTimeout(() => {
      this.teleportFrom(x, y);
      this.pickUpCollectablesAt(x, y);
      this.moveEnemies();
      this.frozenTurnsRemaining = Math.max(this.frozenTurnsRemaining - 1, 0);
      this.canMove = true;
    }, PLAYER_MOVE_DURATION);
  },

  movePlayerDown () {
    this.movePlayerBy(0, 1);
  },

  movePlayerLeft () {
    this.movePlayerBy(-1, 0);
  },

  movePlayerRight () {
    this.movePlayerBy(1, 0);
  },

  movePlayerUp () {
    this.movePlayerBy(0, -1);
  },
};
