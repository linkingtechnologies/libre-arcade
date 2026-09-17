const bitBank = values => values.map(v => v ? '●' : '○').join(' ');
const boolWord = value => value ? 'ON' : 'off';

export class StateMachineDebugger {
  constructor({root, physics, state, input, inject, resetGame}) {
    this.root=root; this.physics=physics; this.state=state; this.input=input;
    this.inject=inject; this.resetGame=resetGame; this.log=[]; this.lastRender=0;
    this.stateEl=root.querySelector('[data-debug-state]');
    this.logEl=root.querySelector('[data-debug-log]');
    root.addEventListener('click', event => {
      const button=event.target.closest('button[data-debug-action]');
      if(!button)return;
      const action=button.dataset.debugAction;
      if(action==='reset'){this.resetGame();this.record('RESET GAME');return;}
      if(action==='tapLeft'||action==='tapRight'){
        const side=action==='tapLeft'?'left':'right';
        this.input.set(side,true);this.input.set(side,false);this.record(`TAP ${side.toUpperCase()}`);return;
      }
      if(action==='launcherDown'){this.input.set('launch',true);this.record('LAUNCHER DOWN');return;}
      if(action==='launcherUp'){this.input.set('launch',false);this.record('LAUNCHER UP');return;}
      const ok=this.inject(action);
      this.record(`${ok?'INJECT':'IGNORED'} ${action}`);
    });
  }
  record(message){
    this.log.unshift(message);this.log.length=Math.min(this.log.length,12);
    this.renderLog();
  }
  recordHook(message){this.record(message);}
  renderLog(){if(this.logEl)this.logEl.textContent=this.log.join('\n');}
  update(force=false){
    const now=performance.now(); if(!force&&now-this.lastRender<90)return; this.lastRender=now;
    const s=this.physics.snapshot(),f=s.flags,t=s.tunnel;
    const lines=[
      `GAME       score ${this.state.score}  mult x${this.state.multiplier}  balls ${this.state.balls}${this.state.gameOver?'  GAME OVER':''}`,
      `MULT       ${bitBank(f.lightsTop)}`,
      `RAMP KEY   ${bitBank(f.lightsTopLeft)}  third ${boolWord(f.thirdRamp)}  bumper ${boolWord(s.topRightBumperActive)}`,
      `RAMP EVENT middle ${bitBank(f.lightsMiddle)}  arrows ${bitBank(f.arrows.slice(0,2))}`,
      `           done   ${bitBank(f.rampEventDone)}  lastRamp ${bitBank(f.rampDone)}`,
      `RAMPS      collision ${boolWord(f.rampsActive)}  thirdArrow ${boolWord(f.arrows[2])}`,
      `PEGS       ${s.pegsActive.map(v=>v?'●':'○').join(' ')}  down ${bitBank(f.lightsDown)}`,
      `TUNNEL     ${t?`${t.exit.toUpperCase()} in ${t.remaining.toFixed(2)}s`:'idle'}`,
      `BALL       ${s.ball.active?'active':'hidden'}${s.ball.asleep?' / asleep':''}  x ${s.ball.x.toFixed(1)} y ${s.ball.y.toFixed(1)}`,
      `FLIPPERS   L ${(s.flippers.left.angle*180/Math.PI).toFixed(1)}°  R ${(s.flippers.right.angle*180/Math.PI).toFixed(1)}°`,
      `PROFILE    ${s.solver.flipperProfile}`,
    ];
    if(this.stateEl)this.stateEl.textContent=lines.join('\n');
  }
}
