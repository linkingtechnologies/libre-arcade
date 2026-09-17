import assert from 'node:assert/strict';
import { DocDonkeysParityPhysics } from '../public/src/physics/docdonkeys-parity.js';
import { createGameState, addScore, increaseMultiplier, addBall, loseBall, restartGame } from '../public/src/state.js';
import { FIXED_DT } from '../public/src/config.js';

const physics=new DocDonkeysParityPhysics(), state=createGameState();
const input={down:{left:false,right:false,launch:false,restart:false}};
const hooks={
  onScore:(v)=>addScore(state,v), onMultiplier:()=>increaseMultiplier(state), onAddBall:()=>addBall(state),
  onLoseBall:()=>{loseBall(state);if(state.gameOver){restartGame(state);physics.restartTable();}else physics.resetBall();},
  onSfx:()=>{}, onLaunch:()=>{},
};
for(let i=0;i<30000;i++){
  input.down.left=(i%83)<8;input.down.right=(i%97)<9;input.down.launch=(i%211)>150&&(i%211)<190;
  physics.update(FIXED_DT,input,state,hooks);
  const s=physics.snapshot();
  for(const v of [s.ball.x,s.ball.y,s.ball.vx,s.ball.vy,s.flippers.left.angle,s.flippers.right.angle,s.kicker.y,s.kicker.vy]) assert(Number.isFinite(v),`non-finite physics value at frame ${i}`);
}
console.log('30k-frame physics stress: PASS');
