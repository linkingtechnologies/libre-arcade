/* Turkey Cooking Simulator - Responsive Canvas Gameplay Shell */
/* SPDX-License-Identifier: GPL-3.0-only */
import { GameSession, SessionPhase } from './game-session.js';
import { HeadlessGameState, Difficulty } from './gameplay-state.js';
import { TimingMode, DoorState } from './runtime.js';
import { cToF, fToC } from './thermal-model.js';
import {
  DESIGN, LayoutMode, fitAdaptiveCanvas, clientToCanvas, inRect, t, formatClock,
  conditionLabel, marketCategory, marketItemLabel, minimumTouchTarget, dayNightState, cookingVisualState, ovenGlow, itemVisualSpec, purchasedKitchenFeatures, temperatureBandF, scoreGrade, alarmUrgency
} from './ui-shell.js';

const SAVE_KEY='libreArcade.turkeyCookingSimulator.session.v3';
const PREF_KEY='libreArcade.turkeyCookingSimulator.preferences.v1';
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
const live=document.getElementById('live');

const app={
  lang:'en', units:'F', audio:true, screen:'home', session:null, hitboxes:[], message:'', messageUntil:0,
  ovenSetF:350, lastFrame:performance.now(), resetArmedUntil:0, audioContext:null,
  layoutMode:LayoutMode.LANDSCAPE, design:{...DESIGN}, marketCategory:'turkeys', ovenLightOn:false, lastProbeF:null, lastProbeAt:0, interactionKind:'', interactionAt:0,
};

loadPrefs(); syncDocumentLanguage(); resize();
window.addEventListener('resize',resize); window.addEventListener('orientationchange',resize);
canvas.addEventListener('pointerdown',onPointer); canvas.addEventListener('keydown',onKey); canvas.focus();
requestAnimationFrame(frame);

function loadPrefs(){ try{const p=JSON.parse(localStorage.getItem(PREF_KEY)||'null'); if(p){app.lang=p.lang==='it'?'it':'en'; app.audio=p.audio!==false; app.units=p.units==='C'?'C':'F';}}catch{} }
function savePrefs(){ localStorage.setItem(PREF_KEY,JSON.stringify({lang:app.lang,units:app.units,audio:app.audio})); }
function syncDocumentLanguage(){ document.documentElement.lang=app.lang; canvas.setAttribute('aria-label', app.lang==='it'?'Simulatore di cottura del tacchino':'Turkey Cooking Simulator'); }
function resize(){
  const f=fitAdaptiveCanvas(window.innerWidth,window.innerHeight);
  app.layoutMode=f.mode; app.design=f.design;
  canvas.style.width=`${f.cssWidth}px`; canvas.style.height=`${f.cssHeight}px`;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(app.design.width*dpr); canvas.height=Math.round(app.design.height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0); draw();
}
// The original's own sound files (public/sounds, see its README.txt): the effects it plays for these events, and its two tunes.
const SOUNDS={click:['sounds/click.mp3',1],error:['sounds/buzz.mp3',1],buy:['sounds/buy.mp3',.7],ding:['sounds/ding.mp3',1],beepbeep:['sounds/double-beep.mp3',1],entrance:['sounds/entrance.mp3',.3],
  doorFullOpen:['sounds/oven-door-full-open.mp3',1],doorFullClose:['sounds/oven-door-full-close.mp3',1],doorPeekOpen:['sounds/oven-door-peek-open.mp3',1],doorPeekClose:['sounds/oven-door-peek-close.mp3',1]};
const MUSIC={title:['sounds/turkey-in-the-straw.mp3',.4,5.65],market:['sounds/waterford.mp3',.5,0]};
function playSound(name){if(!app.audio)return;const d=SOUNDS[name];if(!d)return;try{const a=new Audio(d[0]);a.volume=d[1];const p=a.play();if(p&&p.catch)p.catch(()=>{});}catch{}}
function doorSound(state,full){playSound(full?(state===DoorState.OPEN?'doorFullOpen':'doorFullClose'):(state===DoorState.PEEK?'doorPeekOpen':'doorPeekClose'));}
// One tune at a time, by screen: the title's on the title, the help, the credits and the result; the market's in the market; none in the kitchen. Browsers start sound only after a click or a key, so it is retried on every frame.
let music={name:null,el:null,retryAt:0};
function syncMusic(){const want=!app.audio?null:app.screen==='market'?'market':app.screen==='kitchen'?null:'title';
  if(want!==music.name){if(music.el){try{music.el.pause();}catch{}}music={name:want,el:null,retryAt:0};}
  if(want&&!music.el&&performance.now()>=music.retryAt){try{const d=MUSIC[want];const a=new Audio(d[0]);a.loop=true;a.volume=d[1];a.currentTime=d[2];const p=a.play();if(p&&p.catch)p.catch(()=>{music.el=null;music.retryAt=performance.now()+500;});music.el=a;}catch{music.el=null;music.retryAt=performance.now()+500;}}
}
function beep(freq=520){if(!app.audio)return;if(freq===180)return playSound('error');return playSound('click');}
function audioCue(kind='click'){if(!app.audio)return;const named={buy:'buy',alarm:'beepbeep',error:'error',serve:'ding',click:'click'};if(named[kind])return playSound(named[kind]);try{app.audioContext??=new (window.AudioContext||window.webkitAudioContext)();const ac=app.audioContext;const patterns={buy:[[620,.00,.045],[820,.055,.060]],probe:[[900,.00,.035],[1180,.045,.055]],door:[[220,.00,.055],[165,.045,.070]],alarm:[[880,.00,.07],[660,.09,.07],[880,.18,.08]],save:[[520,.00,.04],[700,.05,.05]],error:[[180,.00,.11]],light:[[420,.00,.035],[760,.04,.04]],serve:[[520,.00,.06],[690,.07,.06],[920,.14,.10]],click:[[520,.00,.04]]};for(const [freq,delay,dur] of (patterns[kind]||patterns.click)){const o=ac.createOscillator(),g=ac.createGain();o.type=kind==='door'?'triangle':'sine';o.frequency.setValueAtTime(freq,ac.currentTime+delay);g.gain.setValueAtTime(.0001,ac.currentTime+delay);g.gain.exponentialRampToValueAtTime(.035,ac.currentTime+delay+.008);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+delay+dur);o.connect(g).connect(ac.destination);o.start(ac.currentTime+delay);o.stop(ac.currentTime+delay+dur+.01);}}catch{}}
function announce(msg){app.message=msg;app.messageUntil=performance.now()+2400;live.textContent=msg;}
function interaction(kind){app.interactionKind=kind;app.interactionAt=performance.now();}
function isPortrait(){return app.layoutMode===LayoutMode.PORTRAIT;}
function minTouch(){return minimumTouchTarget(app.layoutMode);}
function W(){return app.design.width;} function H(){return app.design.height;}
function roundRect(x,y,w,h,r,fill=false,stroke=false){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill)ctx.fill();if(stroke)ctx.stroke();}
function panel(x,y,w,h,fill='#262922'){ctx.fillStyle=fill;roundRect(x,y,w,h,16,true);ctx.strokeStyle='#5b624f';ctx.lineWidth=2;roundRect(x,y,w,h,16,false,true);}
function text(txt,x,y,size=18,align='left',color='#f4f1e6',weight='400'){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(txt,x,y);}
function wrap(txt,x,y,maxW,lineH=22,size=16,color='#f4f1e6'){ctx.font=`${size}px system-ui`;ctx.textAlign='left';const words=txt.split(/\s+/);let line='',yy=y;for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxW&&line){text(line,x,yy,size,'left',color);line=word;yy+=lineH;}else line=test;}if(line)text(line,x,yy,size,'left',color);return yy;}
function btn(x,y,w,h,label,action,{disabled=false,small=false,accent=false}={}){
  const target=Math.max(h,minTouch()); const yy=y-(target-h)/2; h=target; y=yy;
  ctx.fillStyle=disabled?'#555a50':accent?'#f1cc78':'#d6aa57';roundRect(x,y,w,h,10,true);
  ctx.strokeStyle='#2b2a24';ctx.lineWidth=2;roundRect(x,y,w,h,10,false,true);
  ctx.fillStyle=disabled?'#aaa':'#1d1c18';ctx.font=`${small?13:16}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
  const maxChars=Math.max(8,Math.floor(w/(small?7.4:8.4)));const out=label.length>maxChars?label.slice(0,maxChars-1)+'…':label;ctx.fillText(out,x+w/2,y+h/2);
  if(!disabled)app.hitboxes.push({x,y,w,h,action});
}
function topbar(title){
  const p=isPortrait(); const barH=p?76:62;ctx.fillStyle='#20231d';ctx.fillRect(0,0,W(),barH);text(title,p?18:26,p?34:40,p?23:27,'left','#f6d68b','700');
  if(p){btn(W()-228,16,62,36,app.units==='C'?'°C':'°F',toggleUnits,{small:true});btn(W()-158,16,62,36,t(app.lang,'language'),toggleLang,{small:true});btn(W()-88,16,68,36,app.audio?'♪ ✓':'♪ ×',toggleAudio,{small:true});}
  else{btn(W()-356,13,76,36,app.units==='C'?'°C':'°F',toggleUnits,{small:true});btn(W()-270,13,76,36,t(app.lang,'language'),toggleLang,{small:true});btn(W()-184,13,78,36,app.audio?'♪ ✓':'♪ ×',toggleAudio,{small:true});btn(W()-96,13,78,36,t(app.lang,'credits'),()=>{app.screen='credits';beep();},{small:true});}
  return barH;
}
function draw(){
  ctx.clearRect(0,0,W(),H());ctx.fillStyle='#171814';ctx.fillRect(0,0,W(),H());app.hitboxes=[];
  switch(app.screen){case'home':drawHome();break;case'market':drawMarket();break;case'kitchen':drawKitchen();break;case'result':drawResult();break;case'credits':drawCredits();break;case'help':drawHelp();break;}
  if(app.message&&performance.now()<app.messageUntil){const w=Math.min(W()-32,isPortrait()?540:500),x=(W()-w)/2,y=H()-(isPortrait()?74:54);ctx.fillStyle='rgba(0,0,0,.86)';roundRect(x,y,w,42,12,true);text(app.message,W()/2,y+27,15,'center','#fff');}
}

function drawHome(){
  const top=topbar(t(app.lang,'title')),p=isPortrait();
  if(p){
    text(t(app.lang,'subtitle'),20,top+30,15,'left','#c9c6ba');panel(24,top+52,W()-48,520);
    drawTurkeyBadge(W()/2,top+148,72);
    text(t(app.lang,'newGame'),W()/2,top+250,24,'center','#fff','700');
    btn(70,top+282,W()-140,58,t(app.lang,'casual'),()=>newGame(Difficulty.CASUAL),{accent:true});
    btn(70,top+354,W()-140,58,t(app.lang,'hardcore'),()=>newGame(Difficulty.HARDCORE));
    btn(70,top+426,W()-140,58,t(app.lang,'resume'),resumeGame,{disabled:!localStorage.getItem(SAVE_KEY)});
    wrap(t(app.lang,'controls'),46,top+618,W()-92,22,15,'#c9c6ba');
    btn(150,H()-150,W()-300,46,t(app.lang,'howToPlay'),()=>app.screen='help',{small:true,accent:true});btn(150,H()-92,W()-300,46,performance.now()<app.resetArmedUntil?t(app.lang,'confirmReset'):t(app.lang,'reset'),resetData,{small:true});
  } else {
    text(t(app.lang,'subtitle'),28,top+22,16,'left','#c9c6ba');panel(60,112,W()-120,350);drawTurkeyBadge(205,270,88);
    text(t(app.lang,'newGame'),350,172,24,'left','#fff','700');btn(350,205,210,60,t(app.lang,'casual'),()=>newGame(Difficulty.CASUAL),{accent:true});btn(580,205,210,60,t(app.lang,'hardcore'),()=>newGame(Difficulty.HARDCORE));
    btn(350,286,440,56,t(app.lang,'resume'),resumeGame,{disabled:!localStorage.getItem(SAVE_KEY)});wrap(t(app.lang,'controls'),350,386,440,23,15,'#c9c6ba');
    btn(350,500,200,44,t(app.lang,'howToPlay'),()=>app.screen='help',{small:true,accent:true});btn(570,500,220,44,performance.now()<app.resetArmedUntil?t(app.lang,'confirmReset'):t(app.lang,'reset'),resetData,{small:true});
  }
}
function drawTurkeyBadge(cx,cy,r){ctx.save();ctx.translate(cx,cy);ctx.fillStyle='#c8894a';ctx.beginPath();ctx.ellipse(0,8,r*.88,r*.64,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ddad70';ctx.beginPath();ctx.ellipse(r*.55,-r*.2,r*.24,r*.3,-.25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d8563f';ctx.beginPath();ctx.arc(r*.7,r*.03,r*.08,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1d1c18';ctx.beginPath();ctx.arc(r*.62,-r*.28,3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8f552e';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-r*.5,r*.48);ctx.lineTo(-r*.72,r*.72);ctx.moveTo(r*.15,r*.54);ctx.lineTo(r*.28,r*.78);ctx.stroke();ctx.restore();}
function newGame(difficulty){const state=new HeadlessGameState({difficulty});app.session=new GameSession({gameState:state,timingMode:TimingMode.FIXED_STEP,startTimeMs:performance.now()});app.screen='market';app.marketCategory='turkeys';app.ovenSetF=350;app.ovenLightOn=false;app.lastProbeF=null;app.lastProbeAt=0;playSound('entrance');}
function resumeGame(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return announce(t(app.lang,'noSave'));app.session=GameSession.restore(JSON.parse(raw));if(app.session.clock)app.session.clock.lastWallTimeMs=performance.now();app.screen=app.session.phase===SessionPhase.FINISHED?'result':app.session.phase===SessionPhase.COOKING?'kitchen':'market';app.lastFrame=performance.now();announce(t(app.lang,'loaded'));beep(650);}catch{announce('Save error');}}
function saveGame(){if(!app.session)return;localStorage.setItem(SAVE_KEY,JSON.stringify(app.session.snapshot()));announce(t(app.lang,'saved'));audioCue('save');}
function resetData(){const now=performance.now();if(now>=app.resetArmedUntil){app.resetArmedUntil=now+2500;announce(t(app.lang,'confirmReset'));return;}localStorage.removeItem(SAVE_KEY);localStorage.removeItem(PREF_KEY);app.resetArmedUntil=0;app.lang='en';app.units='F';app.audio=true;syncDocumentLanguage();announce('Reset');}
// Temperatures are kept in Fahrenheit inside the page (as the original shows them) and in Celsius inside the model; the units are only how they are written.
const fmtF=(f,digits=1)=>app.units==='C'?`${fToC(f).toFixed(digits)} °C`:`${f.toFixed(digits)} °F`;
const fmtSet=()=>app.units==='C'?`${Math.round(fToC(app.ovenSetF))} °C`:`${app.ovenSetF} °F`;
const stepLabel=(dir)=>`${dir<0?'−':'+'}${app.units==='C'?10:25}`;
function doorActionLabel(){return app.session?.interactions?.doorState===DoorState.OPEN?t(app.lang,'closeDoor'):t(app.lang,'open');}
function toggleUnits(){app.units=app.units==='F'?'C':'F';savePrefs();beep();}
function toggleLang(){app.lang=app.lang==='en'?'it':'en';syncDocumentLanguage();savePrefs();beep();} function toggleAudio(){app.audio=!app.audio;savePrefs();if(app.audio)beep();}

function drawItemIcon(cx,cy,r,name,kind){const spec=itemVisualSpec(name,kind);ctx.save();ctx.translate(cx,cy);ctx.fillStyle='#e3c276';ctx.strokeStyle='#352e22';ctx.lineWidth=2;if(spec.glyph==='probe'){ctx.fillRect(-2,-r,4,r*1.7);ctx.beginPath();ctx.arc(0,r*.82,r*.30,0,Math.PI*2);ctx.fill();}else if(spec.glyph==='alarm'){ctx.beginPath();ctx.arc(0,0,r*.76,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-r*.44);ctx.moveTo(0,0);ctx.lineTo(r*.35,r*.16);ctx.stroke();}else if(spec.glyph==='light'){ctx.beginPath();ctx.arc(0,0,r*.55,0,Math.PI*2);ctx.fill();for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.72,Math.sin(a)*r*.72);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}else if(spec.glyph==='book'){ctx.fillRect(-r*.85,-r*.68,r*.75,r*1.36);ctx.fillRect(r*.10,-r*.68,r*.75,r*1.36);ctx.strokeRect(-r*.85,-r*.68,r*1.7,r*1.36);}else if(spec.glyph==='frills'){for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-r+i*r*.65,r*.6);ctx.lineTo(-r*.68+i*r*.65,-r*.55);ctx.lineTo(-r*.35+i*r*.65,r*.6);ctx.closePath();ctx.fill();}}else if(spec.glyph==='stuffing'){for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(-r*.7+i*r*.35,(i%2?1:-1)*r*.2,r*.22,0,Math.PI*2);ctx.fill();}}else{ctx.beginPath();ctx.arc(0,0,r*.72,0,Math.PI*2);ctx.fill();text(spec.label,0,5,Math.max(10,r),'center','#29251e','700');}ctx.restore();}
function drawOwnedKitchenItems(top,g){const f=purchasedKitchenFeatures(g.purchasedItems);const p=isPortrait();const items=[];if(f.cookbook)items.push([app.lang==='it'?'Ricettario':'Cookbook','cookbook']);if(f.probe)items.push([app.lang==='it'?'Sonda':'Probe','probe']);if(f.alarm)items.push([app.lang==='it'?'Timer':'Alarm','alarm']);if(f.light)items.push([app.lang==='it'?'Luce':'Light','ovenLight']);if(f.frills)items.push([app.lang==='it'?'Decorazioni':'Frills','frills']);if(f.stuffing.length)items.push([`${app.lang==='it'?'Ripieno':'Stuffing'} ×${f.stuffing.length}`,'stuffing']);if(!items.length)return;// In the top bar, beside the title: the strip used to sit over the header text (phone) and behind the controls (landscape).
  const y0=p?13:6,x0=p?150:200,step=p?34:58,r=p?11:13,shown=items.slice(0,6);ctx.fillStyle='rgba(32,35,29,.78)';roundRect(x0-12,y0,shown.length*step+16,50,12,true);shown.forEach(([name,kind],i)=>{drawItemIcon(x0+i*step+10,y0+25,r,name,kind);});}
function drawMarket(){
  if(!app.session)return app.screen='home'; const top=topbar(t(app.lang,'market')),p=isPortrait(),g=app.session.game;
  if(p){
    text(`${t(app.lang,'wallet')}: $${g.wallet.toFixed(2)}`,22,top+34,18);text(g.turkeyBought?`${t(app.lang,'ready')}: ${g.turkeyType}`:t(app.lang,'shopHint'),22,top+62,14,'left','#bbb');
    const tabs=['turkeys','essentials','extras'];tabs.forEach((cat,i)=>btn(20+i*190,top+94,180,42,t(app.lang,cat),()=>app.marketCategory=cat,{small:true,accent:app.marketCategory===cat}));
    const items=Object.entries(g.market).filter(([name,item])=>marketCategory({...item,name})===app.marketCategory);
    const startY=top+158;items.slice(0,6).forEach(([name,item],i)=>drawMarketCard(24,startY+i*104,W()-48,92,name,item));
    btn(24,H()-72,126,44,t(app.lang,'credits'),()=>app.screen='credits',{small:true});btn(162,H()-72,126,44,t(app.lang,'save'),saveGame,{small:true});btn(300,H()-72,W()-324,44,t(app.lang,'startCooking'),startCooking,{disabled:!g.turkeyBought,accent:true,small:true});
  } else {
    text(`${t(app.lang,'wallet')}: $${g.wallet.toFixed(2)}`,28,top+30,18);text(g.turkeyBought?`${t(app.lang,'ready')}: ${g.turkeyType}`:t(app.lang,'shopHint'),260,top+30,14,'left','#bbb');btn(W()-145,top+10,115,38,t(app.lang,'save'),saveGame,{small:true});
    const cats=['turkeys','essentials','extras']; const widths=[372,248,248];let x=30;cats.forEach((cat,ci)=>{panel(x,108,widths[ci],410);text(t(app.lang,cat),x+16,140,20,'left','#f6d68b','700');const items=Object.entries(g.market).filter(([name,item])=>marketCategory({...item,name})===cat);items.slice(0,5).forEach(([name,item],i)=>drawMarketCard(x+12,154+i*68,widths[ci]-24,60,name,item));x+=widths[ci]+15;});
    btn(330,540,300,42,t(app.lang,'startCooking'),startCooking,{disabled:!g.turkeyBought,accent:true,small:true});
  }
}
function drawMarketCard(x,y,w,h,name,item){panel(x,y,w,h,'#30342b');const cost=`$${item.cost.toFixed(2)}`;drawItemIcon(x+24,y+h/2,Math.min(17,h*.26),name,item.kind);const label=marketItemLabel(app.lang,name),avail=w-48-84;ctx.font='600 14px system-ui';let two=null;if(ctx.measureText(label).width>avail){const words=label.split(' ');let best=Infinity;ctx.font='600 13px system-ui';for(let k=1;k<words.length;k++){const a=words.slice(0,k).join(' '),b=words.slice(k).join(' '),m=Math.max(ctx.measureText(a).width,ctx.measureText(b).width);if(m<best){best=m;two=[a,b];}}}
  if(two){text(two[0],x+48,y+20,13,'left','#fff','600');text(two[1],x+48,y+34,13,'left','#fff','600');}else text(label,x+48,y+25,14,'left','#fff','600');text(item.kind==='turkey'?`${item.weightLb.toFixed(2)} lb · ${cost}`:cost,x+48,two?y+h-7:y+h-14,two?12:13,'left','#cfd0c8');btn(x+w-82,y+(h-36)/2,68,34,t(app.lang,'buy'),()=>buy(name),{small:true});}
function buy(name){const r=app.session.purchase(name);if(r.ok){announce(`${t(app.lang,'bought')}: ${marketItemLabel(app.lang,name)}`);audioCue('buy');}else{const map={'insufficient-funds':'notEnough','unavailable':'unavailable','turkey-already-bought':'turkeyOwned'};announce(t(app.lang,map[r.reason]||'unavailable'));audioCue('error');}}
function startCooking(){const r=app.session.startCooking();if(!r.ok)return announce(t(app.lang,'turkeyRequired'));app.session.setOvenF(app.ovenSetF);if(app.session.clock)app.session.clock.lastWallTimeMs=performance.now();app.screen='kitchen';app.lastFrame=performance.now();saveGame();beep(760);}

function drawStatusChip(x,y,w,label,value,accent='#f6d68b'){ctx.fillStyle='rgba(22,24,20,.78)';roundRect(x,y,w,38,10,true);text(label,x+12,y+16,11,'left','#aeb0a8');text(value,x+w-12,y+25,14,'right',accent,'700');}
function drawTempMeter(x,y,w,tempF,layer='core'){const band=temperatureBandF(tempF,layer);ctx.fillStyle='#272a24';roundRect(x,y,w,12,6,true);const ratio=Math.max(0,Math.min(1,(Number(tempF)-70)/250));ctx.fillStyle=band.key==='safe'?'#9bcf83':band.key==='over'||band.key==='very-hot'?'#d47b58':'#dfb85e';roundRect(x,y,Math.max(5,w*ratio),12,6,true);ctx.strokeStyle='#6a6e62';roundRect(x,y,w,12,6,false,true);if(layer==='core'){const safeX=x+w*((165-70)/250);ctx.strokeStyle='#e7efe0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(safeX,y-3);ctx.lineTo(safeX,y+15);ctx.stroke();}}
function drawInteractionFlash(){const age=performance.now()-app.interactionAt;if(age>520||!app.interactionKind)return;const a=1-age/520;ctx.save();ctx.globalAlpha=a*.42;ctx.strokeStyle=app.interactionKind==='error'?'#ef7968':'#f6d68b';ctx.lineWidth=6;roundRect(10,10,W()-20,H()-20,18,false,true);ctx.restore();}
function drawKitchen(){
  if(!app.session||!app.session.oven)return app.screen='home';const top=topbar(t(app.lang,'kitchen')),p=isPortrait(),s=app.session,g=s.game,turkey=s.oven.getTurkeyState();
  drawKitchenBackdrop(top,g.turkeyCookCounter);
  drawOwnedKitchenItems(top,g);
  drawInteractionFlash();
  if(p){
    text(`${g.turkeyType} · ${g.turkeyWeight.toFixed(2)} lb`,20,top+31,15);text(`${t(app.lang,'cookTime')}: ${formatClock(g.turkeyCookCounter)}`,20,top+56,15,'left','#ddd');
    drawStatusChip(330,top+16,246,t(app.lang,'probeReading'),app.lastProbeF==null?'—':fmtF(app.lastProbeF));
    drawOven(20,top+76,W()-40,330,turkey);drawKitchenControlsPortrait(top+424,turkey);
    btn(20,H()-64,126,42,t(app.lang,'market'),()=>app.screen='market',{small:true});btn(158,H()-64,126,42,t(app.lang,'save'),saveGame,{small:true});btn(296,H()-64,W()-316,42,t(app.lang,'finish'),finish,{accent:true,small:true});
  } else {
    text(`${g.turkeyType} · ${g.turkeyWeight.toFixed(2)} lb`,28,top+24,15);text(`${t(app.lang,'cookTime')}: ${formatClock(g.turkeyCookCounter)}`,325,top+24,15,'left','#ddd');drawStatusChip(560,top+3,220,t(app.lang,'probeReading'),app.lastProbeF==null?'—':fmtF(app.lastProbeF));btn(W()-145,top+5,115,38,t(app.lang,'save'),saveGame,{small:true});
    drawOven(28,112,505,380,turkey);drawKitchenControlsLandscape(558,112,374,380,turkey);btn(330,532,300,42,t(app.lang,'finish'),finish,{accent:true,small:true});
  }
}
function drawKitchenBackdrop(top,gameSeconds){
  const d=dayNightState(gameSeconds,14);const windowW=isPortrait()?150:205,windowH=isPortrait()?108:138,wx=W()-windowW-(isPortrait()?24:34),wy=top+(isPortrait()?18:30);
  ctx.fillStyle='#5a4636';ctx.fillRect(0,top,W(),H()-top);
  ctx.fillStyle='#785e46';for(let x=0;x<W();x+=72)ctx.fillRect(x,top,2,H()-top);
  ctx.fillStyle='#d6c2a1';ctx.fillRect(0,H()-88,W(),88);ctx.fillStyle='#b59b73';ctx.fillRect(0,H()-92,W(),8);
  const g=ctx.createLinearGradient(0,wy,0,wy+windowH);g.addColorStop(0,d.phase==='night'?'#17213b':d.phase==='evening'?'#d06f54':d.phase==='dawn'?'#d89e7b':'#79b7db');g.addColorStop(1,d.phase==='night'?'#26304a':d.phase==='evening'?'#6f6480':'#c6e0e8');ctx.fillStyle=g;roundRect(wx,wy,windowW,windowH,8,true);
  if(d.stars>0){ctx.fillStyle=`rgba(255,255,220,${d.stars})`;for(let i=0;i<13;i++){const sx=wx+12+((i*37)%Math.max(20,windowW-24)),sy=wy+10+((i*23)%Math.max(20,windowH-35));ctx.fillRect(sx,sy,2,2);}}
  ctx.strokeStyle='#e3d4b8';ctx.lineWidth=7;roundRect(wx,wy,windowW,windowH,8,false,true);ctx.beginPath();ctx.moveTo(wx+windowW/2,wy);ctx.lineTo(wx+windowW/2,wy+windowH);ctx.moveTo(wx,wy+windowH/2);ctx.lineTo(wx+windowW,wy+windowH/2);ctx.stroke();
  if(d.roomDim>0){ctx.fillStyle=`rgba(10,14,24,${d.roomDim})`;ctx.fillRect(0,top,W(),H()-top);}
  text(t(app.lang,d.phase),wx+windowW/2,wy+windowH+21,12,'center','#f2e8d7','600');
}
function drawKitchenControlsPortrait(y){
  const s=app.session,g=s.game;panel(20,y,W()-40,390);text(t(app.lang,'ovenStatus'),38,y+34,20,'left','#f6d68b','700');text(fmtSet(),W()/2,y+82,34,'center','#f6d68b','700');
  btn(38,y+103,112,46,stepLabel(-1),()=>changeTemp(-1));btn(162,y+103,112,46,stepLabel(1),()=>changeTemp(1));btn(286,y+103,W()-324,46,`${t(app.lang,'door')}: ${doorLabel()}`,()=>{doorSound(app.session.peekDoor().doorState,false);},{small:true});
  text(t(app.lang,'actions'),38,y+182,18,'left','#fff','700');btn(38,y+202,128,46,doorActionLabel(),()=>{doorSound(app.session.fullOpenOrCloseDoor().doorState,true);},{small:true});btn(178,y+202,128,46,t(app.lang,'probe'),probe,{disabled:!g.hasProbe,small:true});btn(318,y+202,116,46,t(app.lang,'light'),toggleOvenLight,{disabled:!g.boughtOvenLight,small:true,accent:app.ovenLightOn});btn(446,y+202,W()-484,46,t(app.lang,'skip'),skip,{disabled:g.difficulty!==Difficulty.CASUAL,small:true});
  if(g.alarmBought){const au=alarmUrgency(s.alarm.remainingSeconds,s.alarm.active);text(`Alarm: ${formatClock(s.alarm.remainingSeconds)}`,38,y+298,15,'left',au==='urgent'||au==='ring'?'#ff9b7a':'#f4f1e6',au==='urgent'||au==='ring'?'700':'400');btn(W()-142,y+274,104,42,'+5m',()=>{s.addAlarmSeconds(300);audioCue('alarm');},{small:true});}
  text(`${t(app.lang,'mode')}: ${g.difficulty.toUpperCase()}`,38,y+350,14,'left','#aaa');
}
function drawKitchenControlsLandscape(x,y,w,h){const s=app.session,g=s.game;panel(x,y,w,h);text(t(app.lang,'ovenStatus'),x+22,y+36,21,'left','#f6d68b','700');text(fmtSet(),x+w/2,y+92,36,'center','#f6d68b','700');btn(x+22,y+112,92,44,stepLabel(-1),()=>changeTemp(-1));btn(x+126,y+112,92,44,stepLabel(1),()=>changeTemp(1));btn(x+230,y+112,122,44,doorLabel(),()=>{doorSound(app.session.peekDoor().doorState,false);},{small:true});btn(x+22,y+176,102,44,doorActionLabel(),()=>{doorSound(app.session.fullOpenOrCloseDoor().doorState,true);},{small:true});btn(x+136,y+176,102,44,t(app.lang,'probe'),probe,{disabled:!g.hasProbe,small:true});btn(x+250,y+176,102,44,t(app.lang,'light'),toggleOvenLight,{disabled:!g.boughtOvenLight,small:true,accent:app.ovenLightOn});btn(x+22,y+240,154,44,t(app.lang,'skip'),skip,{disabled:g.difficulty!==Difficulty.CASUAL,small:true});btn(x+198,y+240,154,44,t(app.lang,'market'),()=>app.screen='market',{small:true});if(g.alarmBought){const au=alarmUrgency(s.alarm.remainingSeconds,s.alarm.active);text(`Alarm ${formatClock(s.alarm.remainingSeconds)}`,x+22,y+330,14,'left',au==='urgent'||au==='ring'?'#ff9b7a':'#f4f1e6',au==='urgent'||au==='ring'?'700':'400');btn(x+w-112,y+304,90,38,'+5m',()=>{s.addAlarmSeconds(300);audioCue('alarm');},{small:true});}}
function drawOven(x,y,w,h,turkey){
  panel(x,y,w,h,'#2c2925');text(t(app.lang,'turkeyStatus'),x+18,y+30,17,'left','#f6d68b','700');
  const chamberX=x+24,chamberY=y+46,chamberW=w-48,chamberH=h-142,state=app.session.interactions?.doorState??DoorState.CLOSED;
  const glow=ovenGlow(app.session.oven.getRawTemp?.() ?? 20), visual=cookingVisualState(turkey.skin.condition[2]);
  ctx.fillStyle='#4b4943';roundRect(chamberX,chamberY,chamberW,chamberH,14,true);ctx.fillStyle='#11100f';roundRect(chamberX+18,chamberY+18,chamberW-36,chamberH-36,10,true);
  if(glow>0){const gg=ctx.createRadialGradient(x+w/2,chamberY+chamberH*.55,10,x+w/2,chamberY+chamberH*.55,chamberW*.52);gg.addColorStop(0,`rgba(255,124,40,${.12+.28*glow})`);gg.addColorStop(1,'rgba(255,80,20,0)');ctx.fillStyle=gg;roundRect(chamberX+18,chamberY+18,chamberW-36,chamberH-36,10,true);}
  if(app.ovenLightOn&&app.session.game.boughtOvenLight){ctx.fillStyle='rgba(255,232,164,.24)';roundRect(chamberX+18,chamberY+18,chamberW-36,chamberH-36,10,true);ctx.fillStyle='#ffe4a3';ctx.beginPath();ctx.arc(chamberX+35,chamberY+35,6,0,Math.PI*2);ctx.fill();}
  const visible=state!==DoorState.CLOSED||app.ovenLightOn;
  if(visible){drawCookedTurkey(x+w/2,chamberY+chamberH*.55,Math.min(54,w*.105),visual,app.session.game);drawCookingEffects(x+w/2,chamberY+chamberH*.30,Math.min(95,w*.19),visual);}
  if(state===DoorState.PEEK){ctx.fillStyle='rgba(26,21,17,.38)';roundRect(chamberX+18,chamberY+18,chamberW-36,chamberH-36,10,true);ctx.strokeStyle='#b98b58';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(chamberX+18,chamberY+chamberH*.78);ctx.lineTo(chamberX+chamberW-18,chamberY+chamberH*.64);ctx.stroke();}
  if(state===DoorState.CLOSED){ctx.fillStyle='rgba(28,29,28,.66)';roundRect(chamberX+18,chamberY+18,chamberW-36,chamberH-36,10,true);ctx.strokeStyle='#77746b';ctx.lineWidth=5;roundRect(chamberX+18,chamberY+18,chamberW-36,chamberH-36,10,false,true);}
  if(state===DoorState.OPEN){ctx.fillStyle='#6a4935';ctx.beginPath();ctx.moveTo(chamberX+8,chamberY+chamberH+6);ctx.lineTo(chamberX+chamberW-8,chamberY+chamberH+6);ctx.lineTo(chamberX+chamberW-38,chamberY+chamberH+42);ctx.lineTo(chamberX+38,chamberY+chamberH+42);ctx.closePath();ctx.fill();}
  const rows=[['skin',turkey.skin],['body',turkey.body],['core',turkey.core]],base=y+h-76;rows.forEach(([key,l],i)=>{const f=cToF(l.tempC),col=i===2?'#f6d68b':'#e7e3d7';text(`${t(app.lang,key)}  ${fmtF(f)}  ·  ${conditionLabel(app.lang,l.condition[2])}`,x+24,base+i*23,13,'left',col,i===2?'700':'400');drawTempMeter(x+w-150,base-10+i*23,118,f,key);});
}
function drawCookedTurkey(cx,cy,r,v,game){ctx.save();ctx.translate(cx,cy);ctx.fillStyle='#5d3c2b';ctx.beginPath();ctx.ellipse(0,r*.62,r*1.15,r*.22,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=v.skin;ctx.strokeStyle=v.edge;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,r*.92,r*.62,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(r*.55,-r*.20,r*.30,r*.34,-.35,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle=v.edge;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-r*.48,r*.45);ctx.lineTo(-r*.72,r*.72);ctx.moveTo(r*.18,r*.50);ctx.lineTo(r*.34,r*.76);ctx.stroke();if(game?.stuffingTypeModifier>1){ctx.fillStyle='#d7b26a';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.arc(-r*.14+i*r*.10,-r*.05+(i%2)*4,4,0,Math.PI*2);ctx.fill();}}if(game?.frillsModifier>1){ctx.fillStyle='#f3f0e6';for(const sx of [-1,1]){ctx.beginPath();ctx.moveTo(sx*r*.55,r*.37);ctx.lineTo(sx*r*.86,r*.44);ctx.lineTo(sx*r*.67,r*.57);ctx.closePath();ctx.fill();}}ctx.restore();}
function drawCookingEffects(cx,cy,spread,v){const tick=performance.now()/700;if(v.steam>0){ctx.strokeStyle=`rgba(245,245,235,${.18+.38*v.steam})`;ctx.lineWidth=3;for(let i=-1;i<=1;i++){ctx.beginPath();for(let j=0;j<5;j++){const yy=cy-j*13,xx=cx+i*spread*.28+Math.sin(tick+j+i)*6; if(j===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.stroke();}}if(v.smoke>0){ctx.fillStyle=`rgba(45,42,40,${.18+.45*v.smoke})`;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(cx-spread*.25+i*spread*.17+Math.sin(tick+i)*6,cy-i*15,10+i*2,0,Math.PI*2);ctx.fill();}}if(v.fire){for(let i=-1;i<=1;i++){ctx.fillStyle=i===0?'#ffd14f':'#ef642f';ctx.beginPath();ctx.moveTo(cx+i*26,cy+52);ctx.quadraticCurveTo(cx+i*20-12,cy+18,cx+i*20,cy-4-Math.sin(tick+i)*10);ctx.quadraticCurveTo(cx+i*34,cy+18,cx+i*26,cy+52);ctx.fill();}}}
function toggleOvenLight(){if(!app.session?.game?.boughtOvenLight){announce(t(app.lang,'unavailable'));interaction('error');return;}app.ovenLightOn=!app.ovenLightOn;interaction('light');audioCue('light');}
function doorLabel(){const d=app.session?.interactions?.doorState??DoorState.CLOSED;return d===DoorState.CLOSED?t(app.lang,'closed'):d===DoorState.PEEK?t(app.lang,'peek'):t(app.lang,'open');}
// dir is +1 or -1: 25 F in Fahrenheit (the original's step, from 125 to 1100 F), 10 C in Celsius (from 50 to 590 C), from where the set point is now.
function changeTemp(dir){if(app.units==='C'){const c=Math.round(fToC(app.ovenSetF));const next=dir>0?(Math.floor(c/10)+1)*10:(Math.ceil(c/10)-1)*10;app.ovenSetF=cToF(Math.max(50,Math.min(590,next)));}else app.ovenSetF=Math.max(125,Math.min(1100,app.ovenSetF+25*dir));app.session.setOvenF(app.ovenSetF);announce(`${t(app.lang,'temperatureSet')} ${fmtSet()}`);interaction('temperature');beep();}
function probe(){const r=app.session.readProbeF();if(!r.ok){announce(r.reason==='probe-not-owned'?t(app.lang,'probeMissing'):t(app.lang,'probeNeedsOpen'));interaction('error');beep(180);return;}app.lastProbeF=r.tempF;app.lastProbeAt=performance.now();announce(`${t(app.lang,'core')}: ${fmtF(r.tempF)}`);interaction('probe');audioCue('probe');}
function skip(){const r=app.session.casualSkip20Minutes({legacyAlarm:true});if(!r.ok){announce(t(app.lang,'skipBlocked'));interaction('error');audioCue('error');return;}announce(t(app.lang,'skip'));interaction('skip');audioCue('click');}
function finish(){const r=app.session.finalize();if(r.ok){interaction('serve');app.screen='result';saveGame();audioCue('serve');}}

function drawResult(){
  const top=topbar(t(app.lang,'result')),p=isPortrait(),r=app.session?.finalResult;if(!r)return app.screen='home';
  const grade=scoreGrade(r.score.roundedTotal),x=p?24:150,y=p?top+55:102,w=p?W()-48:660,h=p?650:400;panel(x,y,w,h);
  text(t(app.lang,'serveSummary'),W()/2,y+42,17,'center','#d6d3c9');
  text(`${t(app.lang,'score')}: ${r.score.roundedTotal}`,W()/2,y+100,p?42:48,'center','#f6d68b','700');
  text(t(app.lang,grade),W()/2,y+134,20,'center',grade==='excellent'?'#a9db92':grade==='poor'?'#e38c76':'#e9d39b','700');
  const bx=x+30,by=y+174,bw=w-60;
  drawStatusChip(bx,by,bw/2-8,t(app.lang,'core'),fmtF(r.score.coreTempF));
  drawStatusChip(bx+bw/2+8,by,bw/2-8,t(app.lang,'skin'),fmtF(r.score.outerTempF));
  drawTempMeter(bx,by+56,bw,r.score.coreTempF,'core');
  text(`${t(app.lang,'safe')}: ${fmtF(165,0)}`,bx,by+91,13,'left','#c9c6ba');
  text(`${t(app.lang,'cookTime')}: ${formatClock(r.turkeyCookCounter)}`,bx,by+128,16,'left','#e6e2d7');
  text(`${t(app.lang,'mode')}: ${r.difficulty.toUpperCase()}`,bx+bw,by+128,16,'right','#e6e2d7');
  text(`${t(app.lang,'legacyScore')}: ${r.score.base} × modifiers`,bx,by+164,14,'left','#aaa');
  if(!p){text(`Skin ${r.score.components.skinCondition}  ·  Core ${r.score.components.coreCondition}  ·  Temp ${r.score.components.outerTempScore}+${r.score.components.coreTempScore}`,bx,by+195,13,'left','#8f938a');}
  btn(p?60:255,y+h+34,p?210:190,48,t(app.lang,'newGame'),()=>{app.session=null;app.screen='home';localStorage.removeItem(SAVE_KEY);});
  btn(p?330:515,y+h+34,p?210:190,48,t(app.lang,'credits'),()=>app.screen='credits');
}
function drawHelp(){
  const top=topbar(t(app.lang,'howToPlay')),p=isPortrait();
  const x=p?22:80,y=top+28,w=p?W()-44:800,h=p?H()-top-118:438;panel(x,y,w,h);
  const blocks=[
    ['helpGoal','helpGoalText'],['helpShop','helpShopText'],['helpCook','helpCookText'],
    ['helpCheck','helpCheckText'],['helpServe','helpServeText'],['helpModes','helpModesText'],['helpSave','helpSaveText']
  ];
  let yy=y+38; const titleSize=p?17:18, bodySize=p?14:14, lineH=p?20:19, gap=p?13:10;
  for(const [head,body] of blocks){
    text(t(app.lang,head),x+26,yy,titleSize,'left','#f6d68b','700');yy+=p?25:24;
    yy=wrap(t(app.lang,body),x+26,yy,w-52,lineH,bodySize,'#e3dfd3')+gap;
  }
  if(!p) wrap(t(app.lang,'controls'),x+26,y+h-35,w-52,18,12,'#aaa');
  btn((W()-220)/2,H()-70,220,44,t(app.lang,'back'),()=>app.screen='home',{small:true});
}

function drawCredits(){const top=topbar(t(app.lang,'credits')),p=isPortrait();const x=p?24:120,y=top+45,w=p?W()-48:720,h=p?650:370;panel(x,y,w,h);wrap(t(app.lang,'creditsBody'),x+28,y+55,w-56,p?30:28,p?17:18);wrap('Original version: 13afa1230761fa24d13d9df4324ccafb504398bc (1 December 2013)',x+28,y+(p?245:205),w-56,24,13,'#c8c8c0');text('Libre Arcade',x+28,y+(p?325:250),21,'left','#f6d68b','700');wrap(t(app.lang,'shellNote'),x+28,y+(p?375:295),w-56,23,14,'#aaa');btn((W()-240)/2,H()-80,240,46,t(app.lang,'back'),()=>{app.screen=app.session?(app.session.phase===SessionPhase.FINISHED?'result':app.session.phase===SessionPhase.COOKING?'kitchen':'market'):'home';});}

function onPointer(ev){ev.preventDefault();canvas.focus();const p=clientToCanvas(ev.clientX,ev.clientY,canvas.getBoundingClientRect(),app.design);const h=[...app.hitboxes].reverse().find(r=>inRect(p,r));if(h){h.action();draw();}}
function onKey(ev){if(ev.repeat)return;const k=ev.key.toLowerCase();if(k==='u')toggleUnits();else if(k==='l')toggleLang();else if(k==='a')toggleAudio();else if(k==='m'&&app.session)app.screen='market';else if(k==='k'&&app.session?.phase===SessionPhase.COOKING)app.screen='kitchen';else if(app.screen==='kitchen'){if(ev.key==='+'||ev.key==='=')changeTemp(1);else if(ev.key==='-')changeTemp(-1);else if(k==='p'){doorSound(app.session.peekDoor().doorState,false);}else if(k==='o'){doorSound(app.session.fullOpenOrCloseDoor().doorState,true);}else if(k==='t')probe();else if(k==='i')toggleOvenLight();else if(k==='s')skip();else if(k==='f')finish();}draw();}
function frame(now){if(app.session?.phase===SessionPhase.COOKING&&app.session.clock&&app.screen!=='result'&&now-app.lastFrame>=1000){try{app.session.advanceWallClock(now);app.lastFrame=now;}catch{app.session.clock.lastWallTimeMs=now;app.lastFrame=now;}}syncMusic();draw();requestAnimationFrame(frame);}
