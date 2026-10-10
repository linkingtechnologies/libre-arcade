export function normalizeDecision(decision) {
  if (Number.isInteger(decision)) return { column: decision };
  if (!decision || !Number.isInteger(decision.column)) {
    throw new TypeError('Player must return a column or { column }.');
  }
  return decision;
}

export function assertPlayerDefinition(definition) {
  for (const key of ['id', 'name', 'source', 'license', 'create']) {
    if (!definition || !definition[key]) throw new TypeError(`Player definition missing ${key}`);
  }
  if (typeof definition.create !== 'function') throw new TypeError('Player create must be a function');
  return definition;
}
