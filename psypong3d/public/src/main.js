// SPDX-License-Identifier: GPL-3.0-or-later
import { PsyPongGame, MODES } from './core/game.js';
import { DEFAULT_OPTIONS, ORIGINAL } from './core/config.js';
import { WebGLRenderer } from './render/webgl.js';
import { tr } from './ui/i18n.js';

const $=(s)=>document.querySelector(s);
const canvas=$('#game');
const STORAGE_OPTIONS='psypong3d.options';
const STORAGE_LANG='psypong3d.lang';
const urlSeed=Number(new URLSearchParams(location.search).get('seed'));
const fixedSeed=Number.isFinite(urlSeed)&&urlSeed>0 ? (urlSeed>>>0) : null;

function freshSeed(){
  try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]||1;}catch{return (Date.now()>>>0)||1;}
}
function safeGet(key){try{return localStorage.getItem(key);}catch{return null;}}
function safeSet(key,value){try{localStorage.setItem(key,value);}catch{/* storage may be unavailable */}}
function loadOptions(){
  const raw=safeGet(STORAGE_OPTIONS); if(!raw) return {};
  try{
    const v=JSON.parse(raw), out={};
    for(const k of ['warp','swap','cameraRotate','cameraReset','levelIncrease']) if(typeof v[k]==='boolean') out[k]=v[k];
    if(Number.isFinite(+v.levelStart)) out.levelStart=Math.max(1,Math.min(256,+v.levelStart));
    if(Number.isFinite(+v.scoreLimit)) out.scoreLimit=Math.max(1,Math.min(32,+v.scoreLimit));
    return out;
  }catch{return {};}
}
function persistOptions(options){
  const out={};
  for(const k of ['warp','swap','cameraRotate','cameraReset','levelIncrease','levelStart','scoreLimit']) out[k]=options[k];
  safeSet(STORAGE_OPTIONS,JSON.stringify(out));
}

const game=new PsyPongGame({...loadOptions(),seed:fixedSeed??freshSeed()});
let renderer=null;
let lang=safeGet(STORAGE_LANG)||((navigator.language||'en').startsWith('it')?'it':'en');
let last=performance.now(),acc=0,winSince=null,menuSince=performance.now(),fatal=false;

function text(){
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=tr(lang,e.dataset.i18n));
  $('#lang').textContent=lang==='it'?'EN':'IT';
  canvas.setAttribute('aria-label','PSY PONG 3D');
}
function showPanel(id){document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));if(id)$(id).classList.remove('hidden');}
function releaseInputs(){for(const name of Object.keys(game.input)) game.setInput(name,false);}
function enterMenu(){releaseInputs();game.toMenu();menuSince=performance.now();showPanel('#menu');}
function syncOptions(){
  const o=game.options;
  $('#opt-warp').checked=o.warp; $('#opt-swap').checked=o.swap; $('#opt-rotate').checked=o.cameraRotate;
  $('#opt-reset').checked=o.cameraReset; $('#opt-inc').checked=o.levelIncrease;
  $('#opt-level').value=o.levelStart; $('#opt-limit').value=o.scoreLimit;
}
function applyOptions(){
  const next={
    warp:$('#opt-warp').checked,swap:$('#opt-swap').checked,cameraRotate:$('#opt-rotate').checked,
    cameraReset:$('#opt-reset').checked,levelIncrease:$('#opt-inc').checked,
    levelStart:Math.max(1,Math.min(256,Number($('#opt-level').value)||1)),
    scoreLimit:Math.max(1,Math.min(32,Number($('#opt-limit').value)||5))
  };
  game.setOptions(next); persistOptions(game.options); syncOptions(); menuSince=performance.now(); showPanel('#menu');
}
function resetDefaults(){
  game.setOptions({...DEFAULT_OPTIONS,seed:game.options.seed});
  persistOptions(game.options); syncOptions();
}
function start(mode){
  releaseInputs();
  if(fixedSeed===null) game.setOptions({seed:freshSeed()}); else game.setOptions({seed:fixedSeed});
  game.start(mode);showPanel(null);winSince=null;acc=0;last=performance.now();
}
function failWebGL(){
  if(fatal) return; fatal=true; releaseInputs();
  if([MODES.SINGLE,MODES.DUAL].includes(game.mode)) game.togglePause();
  document.body.classList.add('webgl-failed');showPanel('#webgl-panel');text();
}

$('#one').onclick=()=>start(MODES.SINGLE);
$('#two').onclick=()=>start(MODES.DUAL);
$('#how').onclick=()=>showPanel('#how-panel');
$('#options').onclick=()=>{syncOptions();showPanel('#options-panel');};
$('#about').onclick=()=>showPanel('#about-panel');
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{menuSince=performance.now();showPanel('#menu');});
$('#apply').onclick=applyOptions;
$('#defaults').onclick=resetDefaults;
$('#lang').onclick=()=>{lang=lang==='it'?'en':'it';safeSet(STORAGE_LANG,lang);text();};
$('#pause').onclick=()=>game.togglePause();
$('#menuBtn').onclick=enterMenu;
$('#reload').onclick=()=>location.reload();

const keyMap={q:'p1Up',Q:'p1Up',a:'p1Down',A:'p1Down',ArrowUp:'p2Up',ArrowDown:'p2Down'};
addEventListener('keydown',(e)=>{
  if(e.key in keyMap){game.setInput(keyMap[e.key],true);e.preventDefault();}
  if(e.code==='Space'){game.togglePause();e.preventDefault();}
  if(e.key==='Escape'){enterMenu();e.preventDefault();}
});
addEventListener('keyup',(e)=>{
  if(e.key in keyMap){game.setInput(keyMap[e.key],false);e.preventDefault();}
  const menuOpen=game.mode===MODES.MENU&&!$('#menu').classList.contains('hidden');
  if(menuOpen&&e.key==='F1')start(MODES.SINGLE);
  if(menuOpen&&e.key==='F2')start(MODES.DUAL);
});
addEventListener('blur',releaseInputs);
document.addEventListener('visibilitychange',()=>{releaseInputs();if(document.hidden&&[MODES.SINGLE,MODES.DUAL].includes(game.mode))game.togglePause();});

document.querySelectorAll('[data-input]').forEach(b=>{
  const name=b.dataset.input;
  const on=(e)=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);game.setInput(name,true);};
  const off=(e)=>{e.preventDefault();game.setInput(name,false);};
  b.addEventListener('pointerdown',on); b.addEventListener('pointerup',off); b.addEventListener('pointercancel',off); b.addEventListener('lostpointercapture',off);
});

canvas.addEventListener('webglcontextlost',(e)=>{e.preventDefault();failWebGL();},{passive:false});
canvas.addEventListener('webglcontextrestored',()=>location.reload());

function hud(s){
  const activeMode=s.mode===MODES.PAUSE||s.mode===MODES.WON?s.previousMode:s.mode;
  const playing=s.mode!==MODES.MENU;
  const interactive=[MODES.SINGLE,MODES.DUAL].includes(activeMode)&&s.mode!==MODES.WON;
  document.body.classList.toggle('playing',playing);
  document.body.classList.toggle('interactive',interactive);
  document.body.classList.toggle('demo',activeMode===MODES.DEMO);
  document.body.dataset.playMode=activeMode;
  $('#level').textContent=`${tr(lang,'level')}: ${s.level}`;
  $('#score1').textContent=`P1 ${tr(lang,'score')}: ${s.players[0].score}/${s.options.scoreLimit}`;
  $('#score2').textContent=`P2 ${tr(lang,'score')}: ${s.players[1].score}/${s.options.scoreLimit}`;
  $('#pause').textContent=tr(lang,s.mode===MODES.PAUSE?'resume':'pause');
  $('#status').textContent=s.mode===MODES.DEMO?tr(lang,'demo'):s.mode===MODES.PAUSE?tr(lang,'pause'):'';
  if(s.mode===MODES.WON){$('#status').textContent=tr(lang,'winner',{n:s.winner+1});if(winSince===null)winSince=performance.now();}else winSince=null;
}

function frame(now){
  if(fatal) return;
  const dt=Math.min(100,now-last);
  if(game.mode===MODES.MENU&&!$('#menu').classList.contains('hidden')&&now-menuSince>=6000) start(MODES.DEMO);
  last=now;
  if([MODES.SINGLE,MODES.DUAL,MODES.DEMO].includes(game.mode)){
    acc+=dt;let guard=0;
    while(acc>=ORIGINAL.simulationStepMs&&guard++<40){game.step(ORIGINAL.simulationStepMs);acc-=ORIGINAL.simulationStepMs;}
  }
  const s=game.snapshot();
  try{renderer.render(s);}catch{failWebGL();return;}
  hud(s);
  if(s.mode===MODES.WON&&winSince!==null&&now-winSince>=3000){enterMenu();winSince=null;}
  requestAnimationFrame(frame);
}

text();syncOptions();showPanel('#menu');
try{renderer=new WebGLRenderer(canvas);requestAnimationFrame(frame);}catch{failWebGL();}
