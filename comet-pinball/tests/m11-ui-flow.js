'use strict';
// DOM/Canvas integration with real M10.1 geometry and a deliberately explicit,
// TEST-ONLY drain trigger. Physics is not replaced in the shipped browser.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');let now=1000,frames=[],hidden=false,storage='[]',writes=0,stepCount=0;
const elements=new Map(),listeners={};
function element(id){
  if(elements.has(id))return elements.get(id);
  const classes=new Set();const obj={id,hidden:false,textContent:'',innerHTML:'',value:'',attributes:{},listeners:{},
    classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)},
    addEventListener(k,fn){this.listeners[k]=fn;},setAttribute(k,v){this.attributes[k]=v;},focus(){},setPointerCapture(){},click(){this.onclick?.();}};
  elements.set(id,obj);return obj;
}
const canvas=element('game');canvas.width=456;canvas.height=840;
const context2d=new Proxy({createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}},{get(o,k){return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
canvas.getContext=()=>context2d;
const document={getElementById:element,get hidden(){return hidden;},addEventListener(k,fn){listeners['document:'+k]=fn;}};
const localStorage={getItem(){return storage;},setItem(k,v){storage=v;writes++;}};
const ctx=vm.createContext({document,localStorage,performance:{now:()=>now},requestAnimationFrame:fn=>frames.push(fn),console,Math,Number,Set,Map});
ctx.window=ctx;ctx.globalThis=ctx;ctx.addEventListener=(k,fn)=>listeners[k]=fn;
for(const p of ['public/data/playfield.js','public/js/physics.js','public/js/camera.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),ctx,{filename:p});
const Original=ctx.CometPhysics.Engine;
ctx.CometPhysics.Engine=class TestEngine extends Original{
  step(dt,ms,input,handlers){
    stepCount++;
    super.step(dt,ms,input,handlers);
    if(ctx.__testDrain&&this.lastPlunge>-Infinity&&!this.drainLatched){
      ctx.__testDrain=false;this.drainLatched=true;handlers.onDrain();
    }
  }
};
for(const dep of ['public/js/audio.js','public/js/visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,dep),'utf8'),ctx,{filename:dep});
ctx.navigator={language:'it-IT',languages:['it-IT']};
vm.runInContext(fs.readFileSync(path.join(root,'public/js/i18n.js'),'utf8'),ctx,{filename:'public/js/i18n.js'});
vm.runInContext(fs.readFileSync(path.join(root,'public/js/comet.js'),'utf8'),ctx,{filename:'public/js/comet.js'});
function tick(n=1){for(let i=0;i<n;i++){now+=1000/60;const cb=frames.shift();assert.equal(typeof cb,'function');cb(now);}}
function key(k,down=true,code=k===' '?'Space':''){listeners[down?'keydown':'keyup']({key:k,code,target:canvas,preventDefault(){}});}
function launch(){
  key(' ',true,'Space');tick(1);key(' ',false,'Space');
  let guard=0;while(element('launchHint').hidden===false&&guard++<60)tick(1);
  assert.equal(element('launchHint').hidden,true,'ball must be launched');
}
assert.match(element('overlay').innerHTML,/GIOCA/);
element('startGame').click();tick(1);launch();
// Pause via keyboard, no background simulation, resume via keyboard.
key('p');assert.match(element('overlay').innerHTML,/IN PAUSA/);
const pausedAt=stepCount;tick(120);assert.equal(stepCount,pausedAt,'pause stops physical simulation');
key('p');tick(1);assert.equal(stepCount,pausedAt+1,'resuming continues exactly one step');
// Visibility interruption must pause and reset held buttons, without auto-resume.
hidden=true;listeners['document:visibilitychange']();hidden=false;
const hiddenAt=stepCount;tick(90);assert.equal(stepCount,hiddenAt,'tab switch pauses indefinitely');
element('resumeGame').click();tick(1);assert.equal(stepCount,hiddenAt+1);
// Test-only natural drain: exact same onDrain callback as the unchanged Engine uses.
ctx.__testDrain=true;tick(1);assert.equal(element('overlay').innerHTML,'');
assert.match(element('turnToast').innerHTML,/Pallina persa/);
const drainedAt=stepCount;tick(30);assert.equal(stepCount,drainedAt,'drained ball never continues stepping while turn change is pending');
assert.match(element('ballText').textContent,/2 \/ 3/);
tick(35);assert.equal(element('overlay').innerHTML,'');
assert.equal(element('turnToast').hidden,false,'brief non-blocking turn toast remains visible during reset');
launch();
// User-only opt-in recovery, with cancel path and explicit confirmation.
element('pauseBtn').click();assert.match(element('overlay').innerHTML,/IN PAUSA/);
element('forfeitBall').click();assert.match(element('overlay').innerHTML,/Terminare questa pallina/);
element('cancelForfeit').click();assert.match(element('overlay').innerHTML,/IN PAUSA/);
element('forfeitBall').click();element('confirmForfeit').click();
assert.match(element('ballText').textContent,/2 \/ 3|3 \/ 3/);
assert.match(element('turnToast').innerHTML,/Pallina terminata/);
assert.equal(element('overlay').innerHTML,'');
tick(60);launch();
ctx.__testDrain=true;tick(1);
assert.match(element('overlay').innerHTML,/PARTITA FINITA/);
assert.match(element('ballText').textContent,/3 \/ 3/);
// High-score storage, sorting and XSS-safe name display.
element('playerName').value='<script>alert(1)</script>';element('saveName').click();
assert.equal(writes,1,'record saved once');
assert.match(element('overlay').innerHTML,/&lt;script&gt;/);
assert.doesNotMatch(element('overlay').innerHTML,/<script>/);
let rows=JSON.parse(storage);assert.equal(rows.length,1);assert.equal(rows[0].name,'<script>alert(1)</script');
// Previous corrupt/hostile localStorage must not crash record screen or game.
storage='{"unexpected":"object"}';element('backMenu').click();element('showScores').click();
assert.match(element('overlay').innerHTML,/Il primo record può essere il tuo/);
// Private/restricted storage: score is still visible in the active session.
localStorage.setItem=()=>{throw Error('storage blocked');};
element('backMenu').click();element('startGame').click();tick(1);
for(let ball=0;ball<3;ball++){
  element('pauseBtn').click();element('forfeitBall').click();element('confirmForfeit').click();
  if(ball<2){tick(60);}
}
assert.match(element('overlay').innerHTML,/PARTITA FINITA/);
element('playerName').value='Senza storage';element('saveName').click();
assert.match(element('overlay').innerHTML,/Senza storage/);
assert.match(element('overlay').innerHTML,/soltanto in questa sessione/);
console.log('PASS M11 UI game flow: menu > launch > pause/visibility/resume > natural drain > second ball opt-in recovery > third drain > high scores; safe corrupt storage');
