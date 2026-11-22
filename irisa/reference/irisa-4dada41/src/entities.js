import { DOOR, ENEMY, PLAYER, REVERSE, TELEPORTER, WALL } from './glyphs';

export class Entity {
  constructor (className, x, y) {
    this.className = className;
    this.isDisabled = false;
    this.x = x;
    this.y = y;
  }

  get props () {
    const { className, isDisabled, x, y } = this;
    return { className, isDisabled, x, y };
  }

  isAt (x, y) {
    return this.x === x && this.y === y;
  }

  isBeyondMovementRange (x, y) {
    const xDelta = Math.abs(this.x - x);
    const yDelta = Math.abs(this.y - y);
    return xDelta > 1 || yDelta > 1;
  }

  moveTo (x, y) {
    this.x = x;
    this.y = y;
  }

  static fromGlyph (glyph, x, y) {
    const number = parseInt(glyph);

    // The freeze time collectable uses numbers 1 - 9 as its glyphs.
    if (number) {
      return new FreezeTime(x, y, number);
    }

    switch (glyph) {
      case DOOR:
        return new Door(x, y);

      case ENEMY:
        return new Enemy(x, y);

      case PLAYER:
        return new Player(x, y);

      case REVERSE:
        return new Reverse(x, y);

      case TELEPORTER:
        return new Teleporter(x, y);

      case WALL:
        return new Wall(x, y);

      default:
        return null;
    }
  }
}

export class Door extends Entity {
  constructor (x, y) {
    super('door', x, y);
  }
}

export class Enemy extends Entity {
  constructor (x, y) {
    super('enemy', x, y);
  }
}

export class FreezeTime extends Entity {
  constructor (x, y, forTurns) {
    super(`freeze-time for-${forTurns}-turns`, x, y);
    this.forTurns = forTurns;
  }
}

export class Player extends Entity {
  constructor (x, y) {
    super('player', x, y);
  }
}

export class Reverse extends Entity {
  constructor (x, y) {
    super('reverse', x, y);
  }
}

export class Teleporter extends Entity {
  constructor (x, y) {
    super('teleporter', x, y);
  }
}

export class Wall extends Entity {
  constructor (x, y) {
    super('wall', x, y);
  }
}
