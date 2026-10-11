import { BomberGame, TICK_MS } from './game-state.js';
import { Renderer } from './renderer.js';
import { AudioEngine } from './audio.js';
import { STRINGS } from './i18n.js';

const canvas=document.querySelector('#game');
const renderer=new Renderer(canvas); const audio=new AudioEngine();
const params=new URLSearchParams(location.search);
const qaSeed=params.get('seed');
const skipStartup=params.get('qa')==='1';
const game=new BomberGame({seed:qaSeed!==null?Number(qaSeed):Date.now()});
if(skipStartup||qaSeed!==null)window.__bomber={game,audio};   // QA only: lets automated browser tests read the state
let lang='en', held=false, latched=false, nextTick=performance.now(), freezeUntil=0;
let crashPhase='none', crashStep=-1, startupUntil=performance.now()+(skipStartup?0:3000);

function s(){return STRINGS[lang];}
function localize(){ const t=s(); document.documentElement.lang=lang; document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t[el.dataset.i18n]); const langBtn=document.querySelector('#langBtn'); langBtn.textContent=lang==='en'?'IT':'EN'; langBtn.setAttribute('aria-label',t.changeLanguage); document.querySelector('#toolbar').setAttribute('aria-label',t.controls); canvas.setAttribute('aria-label',t.gameArea); document.querySelector('#audioBtn').setAttribute('aria-label',t.audio); }
function resize(){
  const stage=document.querySelector('#stage');
  const scale=Math.max(.25,Math.min(stage.clientWidth/240,stage.clientHeight/320));
  canvas.style.width=`${Math.floor(240*scale)}px`;canvas.style.height=`${Math.floor(320*scale)}px`;
}
addEventListener('resize',resize); resize(); localize();

// A press is remembered until the next tick (latched), so a tap shorter than a tick still drops a bomb. The original reads the key
// only if it is still down when its loop looks, and loses shorter presses: this is a deliberate, documented difference (specs/port-map.md).
async function pressStart(){ if(game.state!=='title'){held=true; latched=true;} await audio.ensure(); if(game.state==='title'){game.newGame(); const dur=audio.startMelody(); freezeUntil=performance.now()+dur+TICK_MS;} }
function pressEnd(){held=false;}
addEventListener('keydown',e=>{if(['Space','Enter','ArrowDown'].includes(e.code)){e.preventDefault();pressStart();}});
addEventListener('keyup',e=>{if(['Space','Enter','ArrowDown'].includes(e.code))pressEnd();});
canvas.addEventListener('pointerdown',e=>{e.preventDefault();pressStart(); canvas.setPointerCapture?.(e.pointerId);});
canvas.addEventListener('pointerup',pressEnd); canvas.addEventListener('pointercancel',pressEnd);
const tap=document.querySelector('#tapButton'); tap.addEventListener('pointerdown',e=>{e.preventDefault();pressStart();}); tap.addEventListener('pointerup',pressEnd); tap.addEventListener('pointercancel',pressEnd);

document.querySelector('#langBtn').onclick=()=>{lang=lang==='en'?'it':'en';localize();};
document.querySelector('#audioBtn').onclick=e=>{audio.setEnabled(!audio.enabled);e.currentTarget.textContent=audio.enabled?'🔊':'🔇';e.currentTarget.setAttribute('aria-pressed',String(audio.enabled));};
const dialog=document.querySelector('#creditsDialog'); document.querySelector('#creditsBtn').onclick=()=>dialog.showModal(); document.querySelector('#closeCredits').onclick=()=>dialog.close();

function simulate(now){
  if(game.state==='startup') { if(now>=startupUntil) game.completeStartup(); return; }
  if(game.state!=='playing') latched=false;   // a press during a melody or a title belongs to no tick
  if(game.state==='city-intro' && now>=freezeUntil){game.beginPlay(); nextTick=now+TICK_MS;}
  if(game.state==='success'){
    if(freezeUntil===0 || freezeUntil<now-1000){ freezeUntil=now+audio.successMelody()+TICK_MS; }
    if(now>=freezeUntil){game.completeSuccess();freezeUntil=now+audio.startMelody()+TICK_MS;}
    return;
  }
  if(game.state==='crash'){
    if(crashPhase==='none'){crashPhase='flash';crashStep=0;freezeUntil=now+3000;game.randomCrashFrame();}
    if(crashPhase==='flash'){
      const step=Math.min(29,Math.floor((3000-(freezeUntil-now))/100));
      if(step!==crashStep && step>=0){crashStep=step;game.randomCrashFrame();}
      if(now>=freezeUntil){crashPhase='melody';freezeUntil=now+audio.crashMelody()+TICK_MS;}
      return;
    }
    if(crashPhase==='melody' && now>=freezeUntil){game.completeCrash();crashPhase='none';freezeUntil=0;}
    return;
  }
  if(game.state!=='playing') return;
  while(now>=nextTick){
    const r=game.tick(held||latched); latched=false;
    if(r.event==='motor') audio.motor();
    else if(r.event==='bomb-fall') audio.bomb(game.bombLife);
    else if(r.event==='impact') for(let i=0;i<r.destroyed;i++) audio.tone(10,25,100,i*25);
    nextTick+=TICK_MS+(r.blockingMs||0);
    if(game.state!=='playing'){ if(game.state==='success') freezeUntil=0; break; }
  }
}
function draw(){
  if(game.state==='startup') renderer.startup();
  else if(game.state==='title') renderer.title(game,s());
  else if(game.state==='crash' && crashPhase==='melody') renderer.black();
  else if(game.state==='crash') renderer.game(game,crashStep%2===0?'#ffffff':'#c5c5c5');
  else renderer.game(game);
}
function loop(now){simulate(now);draw();requestAnimationFrame(loop);} requestAnimationFrame(loop);
