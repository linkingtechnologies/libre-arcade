/* Original ConnectLab ensemble, GPL-3.0-only. */
import {markusThillTdPlayer} from './markus-thill-td.js';
import {markusThillAlphaBetaPlayer} from './markus-thill-alphabeta.js';
import {gnomeVelenaFullIntegrationPlayer} from './gnome-velena-full-integration.js';
import {allisThreatSpacePlayer} from './allis-threat-space.js';
import {stratzillaPlayer} from './stratzilla.js';

const ORDER=[3,2,4,1,5,0,6];
const PROFILES={
  1:{td:0,alpha:1000,velena:1,allis:3,stratzilla:3},
  2:{td:0,alpha:10000,velena:2,allis:5,stratzilla:4},
  3:{td:1,alpha:100000,velena:3,allis:7,stratzilla:5},
};
const legal=board=>ORDER.filter(c=>board[c][0]===0);
function drop(board,column,player){const next=board.map(c=>c.slice());for(let y=5;y>=0;y--)if(!next[column][y]){next[column][y]=player;return next;}return next;}
function won(board,player){for(let x=0;x<7;x++)for(let y=0;y<6;y++)if(board[x][y]===player)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]])if([1,2,3].every(i=>board[x+dx*i]?.[y+dy*i]===player))return true;return false;}
function winningMoves(board,player){return legal(board).filter(c=>won(drop(board,c,player),player));}
function safeMoves(board,player){const opponent=3-player;return legal(board).filter(c=>winningMoves(drop(board,c,player),opponent).length===0);}

function makeAdvisors(profile){return[
  {name:'thill-td',base:4,actor:markusThillTdPlayer.create({lookahead:profile.td})},
  {name:'thill-alphabeta',base:2,actor:markusThillAlphaBetaPlayer.create({nodes:profile.alpha})},
  {name:'velena-full',base:2,actor:gnomeVelenaFullIntegrationPlayer.create({effort:profile.velena})},
  {name:'allis-threat-space',base:1.5,actor:allisThreatSpacePlayer.create({horizon:profile.allis})},
  {name:'stratzilla',base:1,actor:stratzillaPlayer.create({depth:profile.stratzilla})},
];}

function voteWeight(advisor,decision){
  if(advisor.name==='thill-alphabeta'&&decision.exact)return 5;
  if(advisor.name==='allis-threat-space'&&['win','double-threat'].includes(decision.threatKind))return 4;
  if(advisor.name==='velena-full'&&decision.kind==='validated-rule-proof')return 3;
  return advisor.base;
}

export function ensembleChoose(position,advisors,effort,context={}){
  const wins=winningMoves(position.board,position.player);
  if(wins.length)return{column:wins[0],kind:'immediate-win',nodes:0,effort,votes:[]};
  const blocks=winningMoves(position.board,3-position.player);
  if(blocks.length===1)return{column:blocks[0],kind:'forced-block',nodes:0,effort,votes:[]};
  const safe=safeMoves(position.board,position.player),eligible=safe.length?safe:legal(position.board);
  const totals=Object.fromEntries(eligible.map(c=>[c,0])),votes=[];
  let nodes=0;
  for(const advisor of advisors){
    const decision=advisor.actor.chooseMove(position,context),accepted=eligible.includes(decision.column),weight=voteWeight(advisor,decision);
    nodes+=decision.nodes??0;
    if(accepted)totals[decision.column]+=weight;
    votes.push({advisor:advisor.name,column:decision.column,weight,accepted,kind:decision.kind??decision.threatKind??null,exact:decision.exact??null,nodes:decision.nodes??0});
  }
  let column=eligible[0],best=-Infinity;
  for(const candidate of ORDER)if(candidate in totals&&totals[candidate]>best){best=totals[candidate];column=candidate;}
  return{column,kind:safe.length?'safe-weighted-vote':'forced-loss-vote',nodes,effort,voteScore:best,totals,votes,safeMoves:safe};
}

export const connectLabEnsemblePlayer={
  id:'connectlab-ensemble',name:'ConnectLab Ensemble',source:'Original ConnectLab weighted safety-constrained ensemble',license:'GPL-3.0-only',family:'multi-agent-weighted-ensemble',
  settings:{key:'effort',label:'Effort',values:[1,2,3],default:2},capabilities:{deterministic:false,supportsSeed:true,supportsDifficulty:true,reportsNodes:true,learnedWeights:true,perfectPlay:false,transparentVotes:true},
  create(options={}){const effort=Number(options.effort??2),profile=PROFILES[effort];if(!profile)throw new RangeError('Effort must be 1, 2 or 3');const advisors=makeAdvisors(profile);return{id:`connectlab-ensemble-e${effort}`,reset(){for(const a of advisors)a.actor.reset?.();},chooseMove(position,context={}){return ensembleChoose(position,advisors,effort,context);}};},
};
export const _test={PROFILES,legal,drop,won,winningMoves,safeMoves,makeAdvisors,voteWeight};
