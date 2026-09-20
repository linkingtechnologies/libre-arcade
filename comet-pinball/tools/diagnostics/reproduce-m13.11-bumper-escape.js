'use strict';
// Deterministic diagnostic on unmodified M13.11. Run:
// node riproduci-bumper.js /path/to/comet-pinball-html5-m13.11
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.argv[2];if(!root){console.error('Uso: node riproduci-bumper.js /percorso/comet-pinball-html5-m13.11');process.exit(2);}
const P=require(path.resolve(root,'public/js/physics.js'));
const sb={window:{}};vm.runInNewContext(fs.readFileSync(path.resolve(root,'public/data/playfield.js'),'utf8'),sb);
const pf=sb.window.COMET_PLAYFIELD,dt=1/60,r=P.constants.BALL_R;
function outsideUpperArc(b,margin=.004){return b.y>1.40+r+margin||(b.x<.30&&b.y>1.10&&Math.hypot(b.x-.30,b.y-1.10)>.295+r+margin)||(b.x>.46&&b.y>1.10&&Math.hypot(b.x-.46,b.y-1.10)>.295+r+margin);}
function run(seed,suppressReactive){const e=new P.Engine(pf);Object.assign(e.ball,{...seed,omega:0});const hits=[],impacts=[];let escape=null;
  for(let frame=0;frame<85;frame++){
    e.step(dt,1000+frame*1000/60,{left:false,right:false,plunge:false},{onHit:id=>{hits.push({frame,id});if(suppressReactive){e.pendingReactive.x=0;e.pendingReactive.y=0;}}});
    if(e.lastTopCurveTOI)impacts.push({frame,curve:e.lastTopCurveTOI.seed,alpha:e.lastTopCurveTOI.alpha});
    if(outsideUpperArc(e.ball)){escape={frame,x:e.ball.x,y:e.ball.y,vx:e.ball.vx,vy:e.ball.vy};break;}
    if(e.drainLatched)break;
  }
  return {hits,escape,upperCurveImpacts:impacts};
}
const seeds=[
 {name:'Arco sinistro dopo bumper',id:1,x:.265,y:1.1425,vx:3,vy:10,expectedFrame:11},
 {name:'Arco destro dopo bumper',id:2,x:.465,y:1.1425,vx:1,vy:4,expectedFrame:19}
];
for(const seed of seeds){const active=run(seed,false),disabled=run(seed,true);
  assert(active.hits.length>=1,seed.name+': no bumper impulse occurred');
  assert(active.escape?.frame===seed.expectedFrame,seed.name+': escape was not reproduced at the expected frame');
  assert.equal(disabled.escape,null,seed.name+': controllo senza impulso ha prodotto una fuga');
  assert(active.upperCurveImpacts.length>=1,seed.name+': upper curve was not involved');
  console.log(JSON.stringify({case:seed.name,seed,active,withoutBumperImpulse:{hits:disabled.hits,escaped:!!disabled.escape}},null,2));
}
console.log('REPRODUCED in the UNMODIFIED older build: two upper-arc escapes following bumper events; the control with no bumper impulse does not escape within 85 frames.');
