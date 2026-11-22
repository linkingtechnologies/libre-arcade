import { Entity } from './entities';

const isChrome = navigator.userAgent.toLowerCase().includes('chrome');

export function createEntitiesFromLevel (level) {
  return level.reduce((entityArray, rowLine, y) =>
    rowLine
      .split('')
      .map((glyph, x) => Entity.fromGlyph(glyph, x, y))
      .filter(entity => entity)
      .concat(entityArray),
    []);
}

export function findOverlappingEntities (entities) {
  const positionMap = entities
    // Create map where key = position, value = array of entities at position.
    .reduce((map, entity) => {
      const { x, y } = entity;
      const position = `${x}-${y}`;
      const entitiesPreviouslyAtPosition = map.get(position) || [];
      const entitiesAtPosition = entitiesPreviouslyAtPosition.concat(entity);
      map.set(position, entitiesAtPosition);
      return map;
    }, new Map());

  return Array.from(positionMap)
    .filter(([, entitiesAtPosition]) => entitiesAtPosition.length > 1)
    .reduce((entitiesArray, [, entitiesAtPosition]) =>
      entitiesArray.concat(entitiesAtPosition),
    []);
}

export function getEntityStyle (boardSize, x, y) {
  const squareSize = 100 / boardSize;

  return {
    height: `${squareSize}%`,
    left: `${x * squareSize}%`,
    top: `${y * squareSize}%`,
    width: `${squareSize}%`,
  };
}

export function playSoundEffect (audio) {
  // Playing short audio clips slows down Safari, so only play them on Chrome.
  if (!isChrome) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
  audio.play();
}
