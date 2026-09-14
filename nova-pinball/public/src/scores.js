// SPDX-License-Identifier: GPL-3.0-or-later
export const MAX_SCORES=8;

export const DEFAULT_SCORES=Object.freeze([
  {score:9000,initials:'AAA',date:'03/11/2015'},
  {score:8000,initials:'BBB',date:'03/11/2015'},
  {score:7000,initials:'CCC',date:'03/11/2015'},
  {score:6000,initials:'DDD',date:'03/11/2015'},
  {score:5000,initials:'EEE',date:'03/11/2015'},
  {score:4000,initials:'FFF',date:'03/11/2015'},
  {score:3000,initials:'GGG',date:'03/11/2015'},
  {score:2000,initials:'HHH',date:'03/11/2015'},
]);

export function cleanInitials(value=''){
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);
}

export function todayString(date=new Date()){
  const dd=String(date.getDate()).padStart(2,'0');
  const mm=String(date.getMonth()+1).padStart(2,'0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

export function normalizeScores(value){
  if(!Array.isArray(value))return DEFAULT_SCORES.map(x=>({...x}));
  const clean=value.filter(x=>x&&Number.isFinite(Number(x.score))&&typeof x.initials==='string'&&typeof x.date==='string')
    .map(x=>({score:Math.max(0,Math.floor(Number(x.score))),initials:cleanInitials(x.initials),date:x.date}))
    .sort((a,b)=>b.score-a.score)
    .slice(0,MAX_SCORES);
  return clean.length?clean:DEFAULT_SCORES.map(x=>({...x}));
}

export function qualifies(score,scores){
  const list=normalizeScores(scores);
  return list.length<MAX_SCORES || Number(score)>list[list.length-1].score;
}

export function insertScore(scores,score,initials,date=todayString()){
  const entry={score:Math.max(0,Math.floor(Number(score)||0)),initials:cleanInitials(initials),date};
  const out=[...normalizeScores(scores),entry].sort((a,b)=>b.score-a.score).slice(0,MAX_SCORES);
  return {scores:out,index:out.indexOf(entry)};
}
