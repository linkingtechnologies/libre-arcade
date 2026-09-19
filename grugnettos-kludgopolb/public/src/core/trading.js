import { isProperty } from './board.js';

function trunc(n) {
  return Math.trunc(Number.isFinite(n) ? n : 0);
}

function addJavaLong(current, expression) {
  // Java compound assignment to long performs an implicit narrowing cast after
  // the addition: value += doubleExpr == value = (long)(value + doubleExpr).
  return trunc(current + expression);
}

function roundHalfUpPositive(n) {
  return Math.floor(n + 0.5);
}

function propertyIndexesOwnedBy(game, player, ownerMap = null) {
  return game.board.spaces
    .map((space, index) => ({ space, index }))
    .filter(({ space, index }) => isProperty(space) && (ownerMap ? ownerMap[index] : game.state[index].owner) === player.id)
    .map(({ index }) => index);
}

function groupIndexes(game, group) {
  return game.board.spaces
    .map((space, index) => ({ space, index }))
    .filter(({ space }) => space.type === 'site' && space.group === group)
    .map(({ index }) => index);
}

function pledgeGain(space) {
  return roundHalfUpPositive(space.price * 0.50);
}

function redeemPrice(space) {
  // Original Property defaults: 50% pledge gain + 5% redeem interest.
  return roundHalfUpPositive(space.price * 0.55);
}

function currentSiteSetGain(game, indexes, siteValues) {
  if (!indexes.length) return 0;
  const totalEmbellishments = game.board.development.maxEmbellishments;
  let totalBuildingCost = 0;
  for (const index of indexes) totalBuildingCost += game.board.spaces[index].buildCost * totalEmbellishments;

  let net = 0;
  for (const index of indexes) {
    const site = game.board.spaces[index];
    const firstRent = site.rents[0] ?? 0;
    const maxRent = site.rents[site.rents.length - 1] ?? firstRent;
    let diff = maxRent - firstRent;
    if (totalEmbellishments === 0) diff = firstRent;
    let ratio = 1;
    if (diff > 0) ratio = totalBuildingCost / diff + 1;
    net = addJavaLong(net, siteValues[1] * maxRent * (1 / ratio) / (2 * Math.sqrt(indexes.length)));
  }
  return net;
}

export function currentSiteGainCost(game, player, siteValues, ownerMap = null) {
  const owned = propertyIndexesOwnedBy(game, player, ownerMap)
    .filter(index => game.board.spaces[index].type === 'site');
  const groups = [...new Set(owned.map(index => game.board.spaces[index].group))].sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }));
  let cost = 0;

  for (const group of groups) {
    const ownedInGroup = owned.filter(index => game.board.spaces[index].group === group);
    const allInGroup = groupIndexes(game, group);
    for (const index of ownedInGroup) {
      const site = game.board.spaces[index];
      if (game.state[index].pledged) {
        cost = addJavaLong(cost, -siteValues[0] * (pledgeGain(site) + redeemPrice(site)) / 2);
      }
      cost = addJavaLong(cost, siteValues[0] * site.price + siteValues[1] * (site.rents[0] ?? 0) * (site.landingWeight ?? 1));
    }
    if (ownedInGroup.length === allInGroup.length) cost = addJavaLong(cost, currentSiteSetGain(game, allInGroup, siteValues));
  }
  return cost;
}

export function currentHubGainCost(game, player, hubValues, ownerMap = null) {
  const owned = propertyIndexesOwnedBy(game, player, ownerMap)
    .filter(index => game.board.spaces[index].type === 'hub');
  let cost = 0;
  for (const index of owned) {
    const hub = game.board.spaces[index];
    const rentIndex = Math.min(Math.max(owned.length - 1, 0), hub.rents.length - 1);
    cost = addJavaLong(cost, hubValues[1] * hub.rents[rentIndex] * (hub.landingWeight ?? 1));
    if (game.state[index].pledged) {
      cost = addJavaLong(cost, -hubValues[0] * (pledgeGain(hub) + redeemPrice(hub)) / 2);
    }
    cost = addJavaLong(cost, hubValues[0] * hub.price);
  }
  return cost;
}

export function currentServiceGainCost(game, player, serviceValues, ownerMap = null) {
  const owned = propertyIndexesOwnedBy(game, player, ownerMap)
    .filter(index => game.board.spaces[index].type === 'service');
  let cost = 0;
  for (const index of owned) {
    const service = game.board.spaces[index];
    const factorIndex = Math.min(Math.max(owned.length - 1, 0), service.factors.length - 1);
    cost = addJavaLong(cost, 7 * serviceValues[1] * service.factors[factorIndex] * (service.landingWeight ?? 1));
    if (game.state[index].pledged) {
      cost = addJavaLong(cost, -serviceValues[0] * (pledgeGain(service) + redeemPrice(service)) / 2);
    }
    cost = addJavaLong(cost, serviceValues[0] * service.price);
  }
  return cost;
}

export function totalPortfolioGainCost(game, player, profile, ownerMap = null) {
  return currentSiteGainCost(game, player, profile.siteValues, ownerMap)
    + currentHubGainCost(game, player, profile.hubValues, ownerMap)
    + currentServiceGainCost(game, player, profile.serviceValues, ownerMap);
}

function ownerMapFromGame(game) {
  return game.state.map(st => Object.hasOwn(st, 'owner') ? st.owner : null);
}

function applyTransfers(ownerMap, trader, target, traderToGive, targetToGive) {
  const out = [...ownerMap];
  for (const index of traderToGive) if (out[index] === trader.id) out[index] = target.id;
  for (const index of targetToGive) if (out[index] === target.id) out[index] = trader.id;
  return out;
}

export function totalGainCostLoss(game, trader, target, traderToGive, targetToGive, profile) {
  const beforeMap = ownerMapFromGame(game);
  const beforeTrader = totalPortfolioGainCost(game, trader, profile, beforeMap);
  const beforeTarget = totalPortfolioGainCost(game, target, profile, beforeMap);
  const afterMap = applyTransfers(beforeMap, trader, target, traderToGive, targetToGive);
  const afterTrader = totalPortfolioGainCost(game, trader, profile, afterMap);
  const afterTarget = totalPortfolioGainCost(game, target, profile, afterMap);
  return [afterTrader - beforeTrader, beforeTarget - afterTarget];
}

export function tradingChanges(game, trader, target, traderToGive, targetToGive, profile) {
  const baseMap = ownerMapFromGame(game);

  // Mirrors CurrentState.getTradingChanges(): first calculate the value of the
  // target properties to the trader, then temporarily assign those properties
  // before calculating the value of the trader properties to the target.
  const targetOnlyMap = applyTransfers(baseMap, trader, target, [], targetToGive);
  const beforeTrader = totalPortfolioGainCost(game, trader, profile, baseMap);
  const beforeTargetForTargetOnly = totalPortfolioGainCost(game, target, profile, baseMap);
  const afterTrader = totalPortfolioGainCost(game, trader, profile, targetOnlyMap);
  const afterTargetForTargetOnly = totalPortfolioGainCost(game, target, profile, targetOnlyMap);
  const traderCost = (afterTrader - beforeTrader) + (beforeTargetForTargetOnly - afterTargetForTargetOnly);

  const beforeTarget = totalPortfolioGainCost(game, target, profile, targetOnlyMap);
  const beforeTraderForSecond = totalPortfolioGainCost(game, trader, profile, targetOnlyMap);
  const finalMap = applyTransfers(targetOnlyMap, trader, target, traderToGive, []);
  const afterTarget = totalPortfolioGainCost(game, target, profile, finalMap);
  const afterTraderForSecond = totalPortfolioGainCost(game, trader, profile, finalMap);
  const targetCost = (afterTarget - beforeTarget) + (beforeTraderForSecond - afterTraderForSecond);

  return [traderCost, targetCost];
}

export function totalGain(game, trader, target, traderToGive, targetToGive, profile) {
  const gain = totalGainCostLoss(game, trader, target, traderToGive, targetToGive, profile)[0];
  // Original counts all non-bankrupt players, despite naming the variable "opponents".
  const active = game.activePlayers().length;
  const index = 1 + (active - 1);
  const multiplier = 2 * (1 - Math.pow(0.5, index));
  return trunc(gain * multiplier);
}

export function canTradeIndexes(game, player) {
  return propertyIndexesOwnedBy(game, player).filter(index => {
    const space = game.board.spaces[index];
    if (space.type !== 'site') return true;
    return groupIndexes(game, space.group).every(groupIndex => game.state[groupIndex].embellishments === 0);
  });
}

function selectedIndexes(indexes, decisionRng, regardsGroups) {
  return indexes.filter(() => decisionRng.bool() || regardsGroups);
}

function partitionSelectedSites(game, traderSelected, targetSelected) {
  const selected = [...traderSelected, ...targetSelected]
    .filter(index => game.board.spaces[index].type === 'site');
  const groups = [...new Set(selected.map(index => game.board.spaces[index].group))]
    .sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }));
  return groups.map(group => ({
    group,
    trader: traderSelected.filter(index => game.board.spaces[index].type === 'site' && game.board.spaces[index].group === group),
    target: targetSelected.filter(index => game.board.spaces[index].type === 'site' && game.board.spaces[index].group === group)
  }));
}

function removeFromTrade(game, trader, target, traderSelected, targetSelected, profile, stateRng) {
  const removeTrader = new Set();
  const removeTarget = new Set();
  const partitions = partitionSelectedSites(game, traderSelected, targetSelected);
  const decHub = stateRng.next();
  const decService = stateRng.next();

  for (const part of partitions) {
    const decTrader = stateRng.next();
    const decTarget = stateRng.next();
    const decFragment = stateRng.next();
    let rmTrader = true;
    let rmTarget = true;
    const fullGroup = groupIndexes(game, part.group);

    if (fullGroup.length === part.trader.length + part.target.length) {
      const ratioOwnedTrader = part.trader.length / fullGroup.length;
      const shouldSteal = profile.groupSteal[0] + (1 - profile.groupSteal[0] - profile.groupSteal[1]) * ratioOwnedTrader;
      if (stateRng.next() <= shouldSteal) {
        if (!(profile.incGroupSite[0] < decTrader)) rmTarget = false;
      } else if (!(profile.incGroupSite[1] < decTarget)) {
        rmTrader = false;
      }
    } else if (decFragment <= profile.incSiteFrag[0]) {
      rmTarget = false;
    } else if (decFragment <= profile.incSiteFrag[0] + profile.incSiteFrag[1]) {
      rmTrader = false;
    }

    if (rmTrader) for (const index of fullGroup) removeTrader.add(index);
    if (rmTarget) for (const index of fullGroup) removeTarget.add(index);
  }

  const traderHubs = propertyIndexesOwnedBy(game, trader).filter(index => game.board.spaces[index].type === 'hub');
  const targetHubs = propertyIndexesOwnedBy(game, target).filter(index => game.board.spaces[index].type === 'hub');
  if (decHub <= profile.incHub[0]) {
    for (const index of traderHubs) removeTrader.add(index);
  } else if (decHub <= profile.incHub[0] + profile.incHub[1]) {
    for (const index of targetHubs) removeTarget.add(index);
  } else {
    for (const index of traderHubs) removeTrader.add(index);
    for (const index of targetHubs) removeTarget.add(index);
  }

  const traderServices = propertyIndexesOwnedBy(game, trader).filter(index => game.board.spaces[index].type === 'service');
  const targetServices = propertyIndexesOwnedBy(game, target).filter(index => game.board.spaces[index].type === 'service');
  if (decService <= profile.incService[0]) {
    for (const index of traderServices) removeTrader.add(index);
  } else if (decService <= profile.incService[0] + profile.incService[1]) {
    for (const index of targetServices) removeTarget.add(index);
  } else {
    for (const index of traderServices) removeTrader.add(index);
    for (const index of targetServices) removeTarget.add(index);
  }

  return {
    traderToGive: traderSelected.filter(index => !removeTrader.has(index)),
    targetToGive: targetSelected.filter(index => !removeTarget.has(index))
  };
}

export function proposeCpuTrade(game, trader, target, { decisionRng = trader.decisionRng ?? game.rng, stateRng = game.rng } = {}) {
  const profile = trader.profile;
  let traderToGive = selectedIndexes(canTradeIndexes(game, trader), decisionRng, profile.regardsGroups);
  let targetToGive = selectedIndexes(canTradeIndexes(game, target), decisionRng, profile.regardsGroups);

  if (profile.regardsGroups) {
    ({ traderToGive, targetToGive } = removeFromTrade(game, trader, target, traderToGive, targetToGive, profile, stateRng));
  }

  const dummy = tradingChanges(game, trader, target, traderToGive, targetToGive, profile);
  let benefit = profile.reasonableTradeValues[0]
    + (profile.reasonableTradeValues[1] - profile.reasonableTradeValues[0]) * decisionRng.next();
  benefit += (1 - benefit) * profile.estimationInaccuracies[2] * decisionRng.next();

  let traderGivesCash = 0;
  if (benefit < 1 && profile.regardsMoney) {
    traderGivesCash = -trunc((dummy[1] - benefit * (dummy[0] + dummy[1])) / (2 * (1 - benefit)));
  }

  let shouldTrade = false;
  if ((traderGivesCash > 0 && trader.cash < traderGivesCash)
    || (traderGivesCash < 0 && target.cash < -traderGivesCash)) {
    shouldTrade = false;
  } else {
    const threshold = (dummy[1] - dummy[0]) * (1 - decisionRng.next() * profile.estimationInaccuracies[2]);
    shouldTrade = totalGain(game, trader, target, traderToGive, targetToGive, profile) >= threshold
      && profile.tradeTendency > decisionRng.next();
  }

  return { trader, target, traderToGive, targetToGive, traderGivesCash, shouldTrade, transferValues: dummy, benefit };
}

export function targetAcceptsCpuTrade(game, proposal, { decisionRng = proposal.target.decisionRng ?? game.rng } = {}) {
  if (proposal.target.profile?.strategy === 'pazifik-simple-ai') return { accepted: false, chance: 0, targetValues: null, reason: 'pazifik-no-trading' };
  const { trader, target, traderToGive, targetToGive, traderGivesCash } = proposal;
  const profile = target.profile;
  const dummy = tradingChanges(game, trader, target, traderToGive, targetToGive, profile);

  if (traderGivesCash > 0 && profile.regardsMoney) dummy[1] += traderGivesCash;
  else if (profile.regardsMoney) dummy[0] -= traderGivesCash;

  let chance = 0.5;
  if (dummy[0] + dummy[1] > 0) chance = dummy[1] / (dummy[0] + dummy[1]);
  chance += decisionRng.next() * (1 - chance) * profile.estimationInaccuracies[2];
  const accepted = decisionRng.next() < chance;
  return { accepted, chance, targetValues: dummy };
}

export function executeTrade(game, proposal) {
  const { trader, target, traderToGive, targetToGive, traderGivesCash } = proposal;
  if (traderToGive.length + targetToGive.length === 0 && traderGivesCash === 0) return false;
  if (traderGivesCash > 0) {
    if (trader.cash < traderGivesCash) return false;
    trader.cash -= traderGivesCash;
    target.cash += traderGivesCash;
  } else if (traderGivesCash < 0) {
    if (target.cash < -traderGivesCash) return false;
    target.cash += traderGivesCash;
    trader.cash -= traderGivesCash;
  }
  for (const index of traderToGive) game.transferProperty(index, trader, target);
  for (const index of targetToGive) game.transferProperty(index, target, trader);
  trader.tradesAccepted += 1;
  target.tradesAccepted += 1;
  return true;
}
