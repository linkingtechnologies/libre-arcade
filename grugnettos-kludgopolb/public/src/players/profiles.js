// Values transcribed from gui/outofgame/PlayerSelectionWindow.java.
const base = {
  strategy: 'kludgopolb',
  randomBid: false,
  estimationInaccuracies: [0, 0, 0],
  reasonableTradeValues: [0.3, 0.5],
  regardsGroups: true,
  regardsMoney: true,
  reserveFromStartKept: 6,
  tradeTendency: 1,
  siteValues: [1.0, 1.2, 0.5],
  hubValues: [1.3, 0.4],
  serviceValues: [1.1, 0.4],
  groupSteal: [0.1, 0],
  incGroupSite: [0.35, 0.8],
  incSiteFrag: [0.04, 0.10],
  incHub: [0.25, 0.15],
  incService: [0.25, 0.15]
};

export const CPU_PROFILES = Object.freeze({
  Mimrock: Object.freeze({ ...base,
    level: 1,
    estimationInaccuracies: [0.15, 0.15, 0.4],
    reasonableTradeValues: [0.35, 0.6],
    reserveFromStartKept: 9
  }),
  Zilla: Object.freeze({ ...base, level: 2 }),
  Queen: Object.freeze({ ...base,
    level: 2,
    incSiteFrag: [0.04, 0.05],
    incHub: [0.25, 0.1],
    incService: [0.25, 0.1]
  }),
  Wallace: Object.freeze({ ...base,
    level: 2,
    reasonableTradeValues: [0.35, 0.50],
    reserveFromStartKept: 7,
    siteValues: [1.0, 1.2, 0.4],
    hubValues: [1.3, 0.5],
    serviceValues: [1.3, 0.5],
    incGroupSite: [0.75, 0.9],
    incSiteFrag: [0.06, 0.45],
    incHub: [0.25, 0.25],
    incService: [0.25, 0.25]
  }),
  Hans: Object.freeze({ ...base,
    level: 2,
    reasonableTradeValues: [0.47, 0.52],
    reserveFromStartKept: 5,
    siteValues: [1.0, 1.1, 0.5],
    hubValues: [1.2, 0.55],
    serviceValues: [1.2, 0.55],
    incGroupSite: [0.75, 0.9],
    incSiteFrag: [0.06, 0.45],
    incHub: [0.25, 0.25],
    incService: [0.25, 0.25]
  }),
  'Lost Soul': Object.freeze({
    ...base,
    level: 0,
    randomBid: true,
    estimationInaccuracies: [200, 200, 0],
    reasonableTradeValues: [0, 1],
    regardsGroups: false,
    regardsMoney: false,
    reserveFromStartKept: 0,
    siteValues: [0, 0, 0],
    hubValues: [0, 0],
    serviceValues: [0, 0]
  }),

  Pazifik: Object.freeze({
    ...base,
    strategy: 'pazifik-simple-ai',
    level: 0,
    tradeTendency: 0,
    reserveFromStartKept: 0,
    historicalSource: 'JAtlantik r36 SimpleAI',
    historicalYear: 2007,
    deterministic: true
  }),
  Lemming: Object.freeze({
    ...base,
    level: 0,
    estimationInaccuracies: [200, 200, 0],
    reasonableTradeValues: [0, 1],
    regardsGroups: false,
    regardsMoney: false,
    reserveFromStartKept: 200,
    tradeTendency: 0,
    siteValues: [0, 0, 0],
    hubValues: [0, 0],
    serviceValues: [0, 0]
  })
});

export function getCpuProfile(name) {
  const profile = CPU_PROFILES[name];
  if (!profile) throw new Error(`Unknown CPU profile: ${name}`);
  return structuredClone(profile);
}


export function isPazifikProfile(profile) {
  return profile?.strategy === 'pazifik-simple-ai';
}

export function pazifikPurchaseDecision({ cash, price }) {
  return Number(cash) > Number(price) ? 'BUY' : 'AUCTION';
}

export function pazifikAuctionDecision({ highestBid, price, cash }) {
  const nextBid = Math.trunc(Number(highestBid)) + 1;
  if (nextBid < Number(price) && nextBid < Number(cash)) return { action: 'BID', bid: nextBid };
  return { action: 'PASS', bid: null };
}

export function pazifikAuctionCeiling({ price, cash }) {
  const ceiling = Math.min(Math.trunc(Number(price)) - 1, Math.trunc(Number(cash)) - 1);
  return Math.max(0, ceiling);
}

export function pazifikDetentionDecision({ hasCard = false, cash }) {
  if (hasCard) return 'USE_CARD';
  if (Number(cash) > 50) return 'PAY';
  return 'ROLL';
}
