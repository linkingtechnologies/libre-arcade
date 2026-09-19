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

export function rentFor(game, index, diceTotal = 7) {
  const s = game.board.spaces[index];
  const st = game.state[index];
  if (!isProperty(s) || st.owner == null || st.pledged) return 0;
  const owner = game.playerById(st.owner);
  if (!owner || owner.bankrupt) return 0;

  if (s.type === 'site') {
    const level = Math.min(st.embellishments, s.rents.length - 1);
    let rent = s.rents[level];
    if (level === 0) {
      const group = sameGroup(game.board, s);
      const complete = group.every(gs => {
        const gi = game.board.spaces.indexOf(gs);
        return game.state[gi].owner === owner.id && !game.state[gi].pledged;
      });
      if (complete) rent *= 2;
    }
    return rent;
  }

  if (s.type === 'hub') {
    const count = propertiesOwnedBy(game, owner).filter(x => x.space.type === 'hub' && !game.state[x.index].pledged).length;
    return s.rents[Math.min(Math.max(count - 1, 0), s.rents.length - 1)];
  }

  const count = propertiesOwnedBy(game, owner).filter(x => x.space.type === 'service' && !game.state[x.index].pledged).length;
  return s.factors[Math.min(Math.max(count - 1, 0), s.factors.length - 1)] * diceTotal;
}
