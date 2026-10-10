import { assertPlayerDefinition } from '../core/player-contract.js';
import { childsplayFourrowPlayer } from './childsplay-fourrow.js';
import { melilliMinimaxPlayer } from './melilli-minimax.js';
import { stratzillaPlayer } from './stratzilla.js';
import { pettersMctsPlayer } from './petters-mcts.js';
import { pascalPonsPlayer } from './pascal-pons-bitboard.js';
import { markusThillTdPlayer } from './markus-thill-td.js';
import { markusThillMctsPlayer } from './markus-thill-mcts.js';
import { michaelBellBotaPlayer } from './michael-bell-bota.js';
import { jacobDowningGeneticPlayer } from './jacob-downing-genetic.js';
import { zeta36AlphaZeroPlayer } from './zeta36-alpha-zero.js';
import { amanVirmaniQlearningPlayer } from './aman-virmani-qlearning.js';
import { gcompris4stattackPlayer } from './gcompris-4stattack.js';
import { allisThreatSpacePlayer } from './allis-threat-space.js';
import { uciNaiveBayesPlayer } from './uci-naive-bayes.js';
import { gnomeVelenaTacticalPlayer } from './gnome-velena-tactical.js';
import { kdeKfourinlinePlayer } from './kde-kfourinline-humanlike.js';
import { gnomeVelenaProofNumberPlayer } from './gnome-velena-proof-number.js';
import { gnomeVelenaHybridPlayer } from './gnome-velena-hybrid.js';
import { gnomeVelenaRuleEnginePlayer } from './gnome-velena-rule-engine.js';
import { markusThillAlphaBetaPlayer } from './markus-thill-alphabeta.js';
import { gnomeVelenaFullIntegrationPlayer } from './gnome-velena-full-integration.js';
import { connectLabEnsemblePlayer } from './connectlab-ensemble.js';
import { controlBaselinePlayer } from './control-baseline.js';

const derivedIds=new Set(['allis-threat-space-cleanroom','uci-connect4-naive-bayes','gnome-velena-full-integration','connectlab-ensemble']);
export const provenanceLabels={historical:'Historical / source-based',derived:'ConnectLab-derived',control:'Control'};
export const players = [childsplayFourrowPlayer, melilliMinimaxPlayer, stratzillaPlayer, pettersMctsPlayer, pascalPonsPlayer, markusThillTdPlayer, markusThillMctsPlayer, michaelBellBotaPlayer, jacobDowningGeneticPlayer, zeta36AlphaZeroPlayer, amanVirmaniQlearningPlayer, gcompris4stattackPlayer, allisThreatSpacePlayer, uciNaiveBayesPlayer, gnomeVelenaTacticalPlayer, kdeKfourinlinePlayer, gnomeVelenaProofNumberPlayer, gnomeVelenaHybridPlayer, gnomeVelenaRuleEnginePlayer, markusThillAlphaBetaPlayer, gnomeVelenaFullIntegrationPlayer, connectLabEnsemblePlayer, controlBaselinePlayer].map(definition=>{
  const player=assertPlayerDefinition(definition);
  const provenance=player.category==='control'?'control':derivedIds.has(player.id)?'derived':'historical';
  return Object.freeze({...player,provenance});
});

export function playersByProvenance(provenance='all'){
  return provenance==='all'?players:players.filter(player=>player.provenance===provenance);
}

export function getPlayer(id) {
  const player = players.find((candidate) => candidate.id === id);
  if (!player) throw new Error(`Unknown player: ${id}`);
  return player;
}
