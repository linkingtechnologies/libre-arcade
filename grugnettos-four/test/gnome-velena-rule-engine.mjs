import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';
import { oracleOutput, compile, binaryPath, CC } from './oracle-fixtures.mjs';
import{createGame,playMove,snapshot,legalMoves}from'../public/src/core/game.js';import{analyzeRules,chooseRuleMove,gnomeVelenaRuleEnginePlayer,RULES}from'../public/src/players/gnome-velena-rule-engine.js';
const seqs=['','4','443322','142536','43425261'];const native=oracleOutput('gnome-velena-rule-engine',seqs,()=>{const bin=binaryPath('velena-rules-oracle');compile(CC,['-O2','-o',bin,'test/gnome-velena-rules-native-oracle.c']);return execFileSync(bin,seqs,{encoding:'utf8'});},[CC]).trim().split('\n').map(x=>x.split(' ').map(Number));
for(let i=0;i<seqs.length;i++){const game=createGame();for(const c of seqs[i])playMove(game,+c-1);const a=analyzeRules(game.board,game.player,1000);assert.deepEqual([69,a.instances[1],a.instances[2],a.instances[3]],native[i]);assert.equal(a.instances.length,10);assert.equal(a.ruleNames.length,10);}
const win=createGame();for(const c of[0,1,0,1,0,2])playMove(win,c);assert.equal(chooseRuleMove(snapshot(win),1000).column,0);
const mid=createGame();for(const c of[3,2,4,3,2,4,1,5])playMove(mid,c);const a=chooseRuleMove(snapshot(mid),1000),b=chooseRuleMove(snapshot(mid),1000);assert.deepEqual(a,b);assert(legalMoves(mid).includes(a.column));assert(a.solutions>0);assert.equal(RULES[9],'specialbefore');
assert.throws(()=>gnomeVelenaRuleEnginePlayer.create({budget:999}),/Solver budget/);console.log('GNOME Velena native-C rule primitives and JavaScript compatibility search passed.');
