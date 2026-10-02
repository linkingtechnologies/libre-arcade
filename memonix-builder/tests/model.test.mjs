import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOUSE_TEMPLATES } from '../public/src/templates.js';
import { BUILDER_ASSETS, CATEGORY_ASSETS } from '../public/src/assets.js';
import { createRng, emptyBoard, chooseTemplate, generateBuilder, remainingCount, availableAssets, isSolved, wrongCells } from '../public/src/model.js';

test('11 historical structural templates are frozen',()=>assert.equal(HOUSE_TEMPLATES.length,11));

test('template selection never immediately repeats',()=>{
 for(let prev=0;prev<11;prev++)for(let seed=1;seed<50;seed++)assert.notEqual(chooseTemplate(prev,createRng(seed)),prev);
});

test('historical first-run quirk excludes template 0 when previous is initial 0',()=>{
 for(let seed=1;seed<100;seed++)assert.notEqual(generateBuilder({previousTemplate:0,random:createRng(seed)}).templateIndex,0);
});

test('center crop active-cell counts match M1 archaeological table',()=>{
 const csv=fs.readFileSync(new URL('../docs/template-active-cells.csv',import.meta.url),'utf8').trim().split(/\r?\n/);
 const header=csv.shift().split(',');
 for(const line of csv){
  const p=line.split(',');const template=Number(p[0]);
  for(const size of [2,4,6,8]){
   const expected=Number(p[header.indexOf(`${size}x${size}`)]);
   const g=generateBuilder({size,difficulty:0,templateIndex:template,random:createRng(1000+template*13+size)});
   let count=0;for(const col of g.target)for(const a of col)if(a!==null)count++;
   assert.equal(count,expected,`template ${template} ${size}x${size}`);
  }
 }
});

test('all generated pieces resolve to recovered Builder artwork',()=>{
 for(let d=0;d<5;d++)for(const size of [2,4,6,8])for(let seed=1;seed<=40;seed++){
  const g=generateBuilder({size,difficulty:d,previousTemplate:0,random:createRng(seed+d*1000+size*100)});
  for(const col of g.target)for(const a of col)if(a!==null)assert.ok(BUILDER_ASSETS[a],a);
 }
});

test('recovered category counts are 22/29/10/26',()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(CATEGORY_ASSETS).map(([k,v])=>[k,v.length])),{windows:22,walls:29,doors:10,roof:26});
});

test('D0 repeated facade cells use at most plain plus one cached alternative',()=>{
 for(let seed=1;seed<80;seed++){
  const g=generateBuilder({size:8,difficulty:0,templateIndex:6,random:createRng(seed)});
  const vals=new Set();
  // Template 6 is a rectangular facade dominated by structural code 203.
  for(let x=0;x<8;x++)for(let y=2;y<7;y++)if(g.target[x][y])vals.add(g.target[x][y]);
  assert.ok(vals.size<=2,`seed ${seed}: ${[...vals]}`);
 }
});

test('remaining inventory is target multiplicity minus placed copies',()=>{
 const g=generateBuilder({size:4,difficulty:0,templateIndex:0,random:createRng(17)});
 const counts=new Map();for(const col of g.target)for(const a of col)if(a)counts.set(a,(counts.get(a)||0)+1);
 const [asset,total]=[...counts][0];const player=emptyBoard();
 assert.equal(remainingCount(g.target,player,asset),total);
 outer:for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(g.target[x][y]===asset){player[x][y]=asset;break outer;}
 assert.equal(remainingCount(g.target,player,asset),total-1);
 assert.equal(remainingCount(g.target,player,asset,asset),Math.max(0,total-2));
});

test('availableAssets only exposes still-needed pieces in the chosen category',()=>{
 const g=generateBuilder({size:4,difficulty:2,templateIndex:0,random:createRng(55)});const player=emptyBoard();
 for(const cat of Object.keys(CATEGORY_ASSETS))for(const a of availableAssets(g.target,player,cat))assert.ok(g.target.some(col=>col.includes(a)));
});

test('win requires exact 8x8 matrix equality and wrongCells reports non-empty mistakes',()=>{
 const g=generateBuilder({size:2,difficulty:0,templateIndex:0,random:createRng(9)});const p=emptyBoard();assert.equal(isSolved(p,g.target),false);
 for(let x=0;x<8;x++)for(let y=0;y<8;y++)p[x][y]=g.target[x][y];assert.equal(isSolved(p,g.target),true);
 const active=[];for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(g.target[x][y])active.push([x,y]);
 const [x,y]=active[0];p[x][y]='12_03/a-19'===g.target[x][y]?'4_03/33':'12_03/a-19';assert.deepEqual(wrongCells(p,g.target),[[x,y]]);
});
