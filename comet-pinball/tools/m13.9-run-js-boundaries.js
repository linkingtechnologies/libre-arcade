'use strict';
/** Deterministic current-engine fixture runner; complements native oracle. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),P=require('../public/js/physics.js');
const sb={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'public/data/playfield.js'),'utf8'),sb);
const pf=sb.window.COMET_PLAYFIELD;
const cases=fs.readFileSync(path.join(root,'reports/M13.9-native-boundaries.csv'),'utf8').trim().split(/\r?\n/).slice(1);
const rows=['case,x,y,vx,vy,jsX,jsY,jsVX,jsVY,dividerTOI,ceilingTOI,rightWallTOI'];
for(const row of cases){const [kind,...q]=row.split(',');const [x,y,vx,vy]=q.slice(0,4).map(Number);const e=new P.Engine(pf);Object.assign(e.ball,{x,y,vx,vy,omega:0});e.step(1/60,1000,{left:false,right:false,plunge:false});const b=e.ball;rows.push([kind,x,y,vx,vy,b.x,b.y,b.vx,b.vy,e.lastPlungerDividerTOI?.alpha??'',e.lastCeilingTOI?.alpha??'',e.lastRightWallTOI?.alpha??''].join(','));}
const out=path.join(root,'reports/M13.9-current-js-boundaries.csv');fs.writeFileSync(out,rows.join('\n')+'\n');console.log(`Generated ${cases.length} current-engine boundary fixtures`);
