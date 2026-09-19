export function validateBoard(board) {
  const modern = Number(board.schemaVersion ?? 0) >= 1;
  if (modern && (!board.id || !board.contentVersion || board.frozen !== true)) {
    throw new Error('Board must have a stable id, contentVersion and frozen=true');
  }
  if (modern && (!Array.isArray(board.locales) || board.locales.length < 1 || !board.locales.includes(board.defaultLocale))) {
    throw new Error('Board locale configuration is invalid');
  }
  if (!Array.isArray(board.spaces) || board.spaces.length === 0 || board.spaces.length % 4 !== 0) {
    throw new Error('Board space count must be a positive multiple of four');
  }
  const ids = new Set();
  board.spaces.forEach((space, index) => {
    if (!space.type || (modern ? !space.id : !space.name)) throw new Error(`Invalid space at ${index}`);
    if (modern) {
      if (ids.has(space.id)) throw new Error(`Duplicate space id ${space.id}`);
      ids.add(space.id);
    }
    if (['site', 'hub', 'service'].includes(space.type)) {
      if (!(space.price >= 0)) throw new Error(`Property ${index} has invalid price`);
    }
    if (space.type === 'site') {
      if (!space.group || !Array.isArray(space.rents) || space.rents.length < 1) {
        throw new Error(`Site ${index} is incomplete`);
      }
    }
  });
  if (board.spaces[board.detentionIndex]?.type !== 'detention') {
    throw new Error('detentionIndex must point to a detention space');
  }
  return true;
}

export function isProperty(space) {
  return ['site', 'hub', 'service'].includes(space.type);
}
