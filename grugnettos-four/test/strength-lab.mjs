import assert from 'node:assert/strict';
import {rateStandings,runStrengthLab,_test} from '../public/arena/strength-lab.js';

const ratings=rateStandings([
  {player:'strong',played:20,wins:16,draws:2,losses:2,points:17},
  {player:'middle',played:20,wins:9,draws:2,losses:9,points:10},
  {player:'weak',played:20,wins:2,draws:2,losses:16,points:3},
]);
assert.deepEqual(ratings.map(row=>row.player),['strong','middle','weak']);assert(ratings[0].rating>1500&&ratings[2].rating<1500);assert(ratings.every(row=>row.ratingLow<row.ratingHigh));
const left={id:'left',factory:()=>({id:'left',reset(){},chooseMove:()=>0})},right={id:'right',factory:()=>({id:'right',reset(){},chooseMove:()=>1})};
const lab=runStrengthLab([left,right],[1,2]);assert.equal(lab.games,4);assert.equal(lab.ratings.length,2);assert.equal(lab.ratings[0].played,4);
assert.deepEqual(_test.wilson(0,0),[0,1]);assert.throws(()=>runStrengthLab([left,right],[1]),/two seeds/);
console.log('Strength Lab: multi-seed aggregation, rating and intervals passed.');
