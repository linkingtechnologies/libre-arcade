import { isProperty } from './board.js';

export function propertiesOwnedBy(game, player) {
  return game.board.spaces
    .map((space, index) => ({ space, index }))
    .filter(({ space, index }) => isProperty(space) && game.state[index].owner === player.id);
}

export function sameGroup(board, site) {
  return board.spaces.filter(s => s.type === 'site' && s.group === site.group);
}

function ownedGroupCount(game, player, group) {
  let n = 0;
  game.board.spaces.forEach((s, i) => {
    if (s.type === 'site' && s.group === group && game.state[i].owner === player.id) n += 1;
  });
  return n;
}

function siteSetBonus(game, player, candidateIndex, siteValues) {
  const site = game.board.spaces[candidateIndex];
  const group = sameGroup(game.board, site);
  const currently = ownedGroupCount(game, player, site.group);
  if (currently + 1 !== group.length) return 0;

  const maxEmbellishments = game.board.development.maxEmbellishments;
  const totalBuildCost = group.reduce((sum, s) => sum + s.buildCost * maxEmbellishments, 0);
  let gain = 0;
  for (const s of group) {
    const base = s.rents[0] ?? 0;
    const maxRent = s.rents[Math.min(maxEmbellishments, s.rents.length - 1)] ?? base;
    const diff = maxRent - base;
    if (diff > 0) {
      const ratio = totalBuildCost / diff + 1;
      gain += siteValues[1] * maxRent * (1 / ratio) / (2 * Math.sqrt(group.length));
    }
  }
  return gain;
}

export function propertyValue(game, player, index, profile, { randomUplift = false } = {}) {
  const s = game.board.spaces[index];
  if (!isProperty(s)) return 0;
  const freq = s.landingWeight ?? 1;
  let value = 0;

  if (s.type === 'site') {
    value = profile.siteValues[0] * s.price + profile.siteValues[1] * s.rents[0] * freq;
    value += siteSetBonus(game, player, index, profile.siteValues);
  } else if (s.type === 'hub') {
    const owned = propertiesOwnedBy(game, player).filter(x => x.space.type === 'hub').length;
    const rentIndex = Math.min(owned, s.rents.length - 1);
    value = profile.hubValues[0] * s.price + profile.hubValues[1] * s.rents[rentIndex] * freq;
  } else if (s.type === 'service') {
    const owned = propertiesOwnedBy(game, player).filter(x => x.space.type === 'service').length;
    const factorIndex = Math.min(owned, s.factors.length - 1);
    value = profile.serviceValues[0] * s.price + 7 * profile.serviceValues[1] * s.factors[factorIndex] * freq;
  }

  if (randomUplift) value *= 1 + game.rng.next() * 0.1;
  return Math.floor(value);
}

/**
 * The rent rule as pure data, shared by the engine, the board tiles and the place details. `states` is the
 * per-space state (owner, pledged, embellishments): the engine's `game.state` or the UI's `packet.state.spaces`.
 * Returns null when nothing is collected (unowned, or pledged unless `ifRedeemed`), otherwise
 * { kind: 'fixed', amount, level, doubled } or { kind: 'dice', factor, level }, where `level` indexes the
 * rent (or factor) schedule of the space. `ifRedeemed` asks what a pledged place would collect once redeemed.
 */
export function rentTerms(board, states, index, { ifRedeemed = false } = {}) {
  const space = board.spaces[index];
  const st = states[index];
  if (!isProperty(space) || st.owner == null) return null;
  if (st.pledged && !ifRedeemed) return null;
  // This place counts as collecting: either it is not pledged, or the caller asked what it would collect if redeemed.
  const collecting = i => !states[i].pledged || i === index;
  const ownedCollecting = type => board.spaces.reduce(
    (count, s, i) => count + (s.type === type && states[i].owner === st.owner && collecting(i) ? 1 : 0), 0);

  if (space.type === 'site') {
    const level = Math.min(st.embellishments ?? 0, space.rents.length - 1);
    const doubled = level === 0 && sameGroup(board, space).every(s => {
      const i = board.spaces.indexOf(s);
      return states[i].owner === st.owner && collecting(i);
    });
    return { kind: 'fixed', amount: space.rents[level] * (doubled ? 2 : 1), level, doubled };
  }

  const schedule = space.type === 'hub' ? space.rents : space.factors;
  const level = Math.min(Math.max(ownedCollecting(space.type) - 1, 0), schedule.length - 1);
  return space.type === 'hub'
    ? { kind: 'fixed', amount: space.rents[level], level, doubled: false }
    : { kind: 'dice', factor: space.factors[level], level };
}

export function rentFor(game, index, diceTotal = 7) {
  const owner = game.state[index].owner == null ? null : game.playerById(game.state[index].owner);
  if (!owner || owner.bankrupt) return 0;
  const terms = rentTerms(game.board, game.state, index);
  if (!terms) return 0;
  return terms.kind === 'dice' ? terms.factor * diceTotal : terms.amount;
}
