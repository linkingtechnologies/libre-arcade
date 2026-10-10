import {runRoundRobin} from './runner.js';

function wilson(points,games,z=1.96){
  if(!games)return[0,1];const p=points/games,z2=z*z,center=(p+z2/(2*games))/(1+z2/games),margin=z*Math.sqrt((p*(1-p)+z2/(4*games))/games)/(1+z2/games);return[Math.max(0,center-margin),Math.min(1,center+margin)];
}
const logitRating=p=>400*Math.log10(Math.max(.001,p)/Math.max(.001,1-p));

export function rateStandings(standings){
  const raw=standings.map(row=>{const smoothed=(row.points+.5)/(row.played+1),[low,high]=wilson(row.points,row.played);return{...row,score:row.points/row.played,rawRating:logitRating(smoothed),rawLow:logitRating(Math.max(.001,low)),rawHigh:logitRating(Math.min(.999,high))};});
  const mean=raw.reduce((sum,row)=>sum+row.rawRating,0)/raw.length;
  return raw.map(row=>({...row,rating:Math.round(1500+row.rawRating-mean),ratingLow:Math.round(1500+row.rawLow-mean),ratingHigh:Math.round(1500+row.rawHigh-mean)})).sort((a,b)=>b.rating-a.rating||b.points-a.points||a.player.localeCompare(b.player));
}

export function runStrengthLab(entries,seeds){
  if(!Array.isArray(seeds)||seeds.length<2)throw new Error('Strength Lab requires at least two seeds');
  const totals=Object.fromEntries(entries.map(entry=>[entry.id,{player:entry.id,played:0,wins:0,draws:0,losses:0,points:0}])),runs=[],matches=[];
  for(const seed of seeds){const run=runRoundRobin(entries,seed);runs.push({seed:run.seed,games:run.matches.length});matches.push(...run.matches.map(match=>({...match,labSeed:run.seed})));for(const row of run.standings){const total=totals[row.player];for(const key of['played','wins','draws','losses','points'])total[key]+=row[key];}}
  return{seeds:seeds.map(seed=>Number(seed)>>>0),games:matches.length,ratings:rateStandings(Object.values(totals)),runs,matches};
}

export const _test={wilson,logitRating};
