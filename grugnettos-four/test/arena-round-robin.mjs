import assert from 'node:assert/strict';
import { runRoundRobin } from '../public/arena/runner.js';
import { childsplayFourrowPlayer as fourrow } from '../public/src/players/childsplay-fourrow.js';
import { melilliMinimaxPlayer as melilli } from '../public/src/players/melilli-minimax.js';
import { stratzillaPlayer as stratzilla } from '../public/src/players/stratzilla.js';
import { pettersMctsPlayer as petters } from '../public/src/players/petters-mcts.js';
import { pascalPonsPlayer as pons } from '../public/src/players/pascal-pons-bitboard.js';
import { markusThillTdPlayer as thill } from '../public/src/players/markus-thill-td.js';
import { markusThillMctsPlayer as thillMcts } from '../public/src/players/markus-thill-mcts.js';
import { michaelBellBotaPlayer as bell } from '../public/src/players/michael-bell-bota.js';
import { jacobDowningGeneticPlayer as downing } from '../public/src/players/jacob-downing-genetic.js';
import { zeta36AlphaZeroPlayer as zeta } from '../public/src/players/zeta36-alpha-zero.js';
import { amanVirmaniQlearningPlayer as virmani } from '../public/src/players/aman-virmani-qlearning.js';
import { gcompris4stattackPlayer as gcompris } from '../public/src/players/gcompris-4stattack.js';
import { allisThreatSpacePlayer as allis } from '../public/src/players/allis-threat-space.js';
import { uciNaiveBayesPlayer as uci } from '../public/src/players/uci-naive-bayes.js';
import { gnomeVelenaTacticalPlayer as velena } from '../public/src/players/gnome-velena-tactical.js';
import { kdeKfourinlinePlayer as kde } from '../public/src/players/kde-kfourinline-humanlike.js';
import { gnomeVelenaProofNumberPlayer as pn } from '../public/src/players/gnome-velena-proof-number.js';
import { gnomeVelenaHybridPlayer as hybrid } from '../public/src/players/gnome-velena-hybrid.js';
import { gnomeVelenaRuleEnginePlayer as rules } from '../public/src/players/gnome-velena-rule-engine.js';
import { markusThillAlphaBetaPlayer as thillAlphaBeta } from '../public/src/players/markus-thill-alphabeta.js';
import { gnomeVelenaFullIntegrationPlayer as fullVelena } from '../public/src/players/gnome-velena-full-integration.js';
import { connectLabEnsemblePlayer as ensemble } from '../public/src/players/connectlab-ensemble.js';
import { controlBaselinePlayer as baseline } from '../public/src/players/control-baseline.js';

const entries = () => [
  { id: 'fourrow-l3', factory: () => fourrow.create({ level: 3 }) },
  { id: 'melilli-d2', factory: () => melilli.create({ depth: 2 }) },
  { id: 'stratzilla-d3', factory: () => stratzilla.create({ depth: 3 }) },
  { id: 'petters-i20x2', factory: () => petters.create({ iterations: 20, trees: 2 }) },
  { id: 'pons-n100', factory: () => pons.create({ nodes: 100 }) },
  { id: 'thill-l0', factory: () => thill.create({ lookahead: 0 }) },
  { id: 'thill-mcts-i20', factory: () => thillMcts.create({ iterations: 20 }) },
  { id: 'bell-bota-10k', factory: () => bell.create({ trainingGames: 10000 }) },
  { id: 'downing-g100', factory: () => downing.create({ generations: 100 }) },
  { id: 'zeta-az-s2', factory: () => zeta.create({ simulations: 2 }) },
  { id: 'virmani-q-10k', factory: () => virmani.create({ trainingGames: 10000 }) },
  { id: 'gcompris-4st-d2', factory: () => gcompris.create({ depth: 2 }) },
  { id: 'allis-threat-h3', factory: () => allis.create({ horizon: 3 }) },
  { id: 'uci-nb-a1', factory: () => uci.create({ alpha: 1 }) },
  { id: 'gnome-velena-d2', factory: () => velena.create({ depth: 2 }) },
  { id: 'kfourinline-l1', factory: () => kde.create({ level: 1 }) },
  { id: 'gnome-velena-pn250', factory: () => pn.create({ nodes: 250 }) },
  { id: 'gnome-velena-hybrid-e1', factory: () => hybrid.create({ effort: 1 }) },
  { id: 'gnome-velena-rules-250', factory: () => rules.create({ budget: 250 }) },
  { id: 'thill-alphabeta-n1000', factory: () => thillAlphaBeta.create({ nodes: 1000 }) },
  { id: 'gnome-velena-full-e1', factory: () => fullVelena.create({ effort: 1 }) },
  { id: 'connectlab-ensemble-e1', factory: () => ensemble.create({ effort: 1 }) },
  { id: 'control-negamax-d4', factory: () => baseline.create({ profile: 2 }) },
];
const first = runRoundRobin(entries(), 424242);
const second = runRoundRobin(entries(), 424242);
assert.equal(first.matches.length, 506);
assert(first.standings.every((row) => row.played === 44));
assert.deepEqual(first.matches.map((m) => [m.winner, m.moves]), second.matches.map((m) => [m.winner, m.moves]));
assert.throws(() => runRoundRobin([entries()[0], entries()[0]], 1), /unique/);
console.log('ConnectLab round robin: all tests passed.');
