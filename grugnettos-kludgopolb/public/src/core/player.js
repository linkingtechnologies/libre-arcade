import { SeededRng } from './rng.js';

function basePlayer(id, name, type, startingCash, decisionSeed) {
  return {
    id,
    name,
    type,
    profileName: type === 'cpu' ? name : null,
    profile: null,
    decisionRng: new SeededRng(decisionSeed),
    cash: startingCash,
    position: 0,
    detained: 0,
    detentionCards: 0,
    bankrupt: false,
    properties: [],
    turns: 0,
    laps: 0,
    paidRent: 0,
    receivedRent: 0,
    auctionWins: 0,
    purchases: 0,
    developments: 0,
    tradesProposed: 0,
    tradesAccepted: 0
  };
}

export function createPlayer(id, profileName, profile, startingCash, decisionSeed = id + 1) {
  const player = basePlayer(id, profileName, 'cpu', startingCash, decisionSeed);
  player.profileName = profileName;
  player.profile = profile;
  return player;
}

export function createHumanPlayer(id, name, startingCash, decisionSeed = id + 1) {
  return basePlayer(id, name, 'human', startingCash, decisionSeed);
}
