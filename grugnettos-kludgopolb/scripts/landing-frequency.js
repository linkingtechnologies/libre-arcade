import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { SeededRng } from '../public/src/core/rng.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));
const args = process.argv.slice(2);
const value = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(value('--runs') ?? 500);
const turnsPerRun = Number(value('--turns') ?? 4000);
const seedStart = Number(value('--seed') ?? 70000);
const landings = Array(board.spaces.length).fill(0);

function simulate(seed) {
  const rng = new SeededRng(seed);
  const decks = Object.fromEntries(Object.entries(board.events ?? {}).map(([k, cards]) => [k, rng.shuffle(cards)]));
  const cursors = Object.fromEntries(Object.keys(decks).map(k => [k, 0]));
  let pos = 0;
  let detained = 0;
  const roll = () => { const a=1+rng.int(6), b=1+rng.int(6); return {total:a+b,doubles:a===b}; };
  const move = amount => { pos=(pos+amount)%board.spaces.length; if(pos<0)pos+=board.spaces.length; };
  const resolve = (diceTotal, depth=0) => {
    if (depth>6) return;
    landings[pos] += 1;
    const s=board.spaces[pos];
    if (s.type==='moveToDetention') { pos=board.detentionIndex; detained=1; return; }
    if (s.type!=='event') return;
    const deck=decks[s.deck];
    const cursor=cursors[s.deck] % deck.length;
    const card=deck[cursor]; cursors[s.deck]=cursor+1;
    if (card.detain) { pos=board.detentionIndex; detained=1; return; }
    if (card.move) { move(card.move); resolve(diceTotal,depth+1); return; }
    if (card.moveTo) {
      const target=board.spaces.findIndex(space=>space.id===card.moveTo);
      if(target<0) throw new Error(`Missing destination ${card.moveTo}`);
      const amount=(target-pos+board.spaces.length)%board.spaces.length;
      move(amount); resolve(diceTotal,depth+1); return;
    }
    if (card.moveToNextType) {
      for(let step=1;step<=board.spaces.length;step++){
        const target=(pos+step)%board.spaces.length;
        if(board.spaces[target].type===card.moveToNextType){ move(step); resolve(diceTotal,depth+1); return; }
      }
      throw new Error(`Missing destination type ${card.moveToNextType}`);
    }
  };
  for (let t=0;t<turnsPerRun;t++) {
    if (detained) {
      const r=roll();
      if (r.doubles || detained>=board.detentionTurns) { detained=0; move(r.total); resolve(r.total); }
      else detained += 1;
      continue;
    }
    let doubles=0;
    for (let n=0;n<3;n++) {
      const r=roll();
      doubles=r.doubles?doubles+1:0;
      if(doubles>=3){pos=board.detentionIndex;detained=1;break;}
      move(r.total); resolve(r.total);
      if(detained || !r.doubles) break;
    }
  }
}
for(let i=0;i<runs;i++)simulate(seedStart+i);
const total=landings.reduce((a,b)=>a+b,0);
const propertyIndexes=board.spaces.map((s,i)=>({s,i})).filter(x=>['site','hub','service'].includes(x.s.type));
const propertyMean=propertyIndexes.reduce((a,x)=>a+landings[x.i],0)/propertyIndexes.length;
const spaces=board.spaces.map((s,i)=>({index:i,name:(s.name ?? s.id),type:s.type,world:s.world??null,landings:landings[i],share:landings[i]/total,landingWeight:landings[i]/propertyMean}));
console.log(JSON.stringify({runs,turnsPerRun,totalResolvedLandings:total,spaces},null,2));
