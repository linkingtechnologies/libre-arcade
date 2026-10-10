'use strict';
(() => {
  const canvas=document.getElementById('board');
  const ctx=canvas.getContext('2d');
  const statusEl=document.getElementById('status');
  const newBtn=document.getElementById('newBtn');
  const langBtn=document.getElementById('langBtn');
  const infoBtn=document.getElementById('infoBtn');
  const infoDialog=document.getElementById('infoDialog');
  const closeInfoBtn=document.getElementById('closeInfoBtn');
  const howTitle=document.getElementById('howTitle');
  const howText=document.getElementById('howText');
  const keysText=document.getElementById('keysText');
  const creditsTitle=document.getElementById('creditsTitle');
  const creditsText=document.getElementById('creditsText');
  const projectLink=document.getElementById('projectLink');
  const boardHelp=document.getElementById('boardHelp');

  const text={
    en:{lang:'IT',newGame:'New game',turn:'Your turn — place an X',win:'You WIN!!!',lose:'Computer wins',draw:'Draw',infoLabel:'Help and credits',close:'Close',how:'How to play',help:"Place X marks on the 10×10 board. Make five in a row horizontally, vertically or diagonally before the computer makes five O marks. The highlighted O is the computer's latest move.",keys:'Keyboard: arrow keys move the focus; Enter or Space places an X.',credits:'Credits',creditText:'Faithful HTML5 restoration and preservation work for Libre Arcade, based on the 2007 XO World Java applet by Milan Babuškov.',project:'Libre Arcade project',boardHelp:'Use the arrow keys to move the board cursor. Press Enter or Space to place an X. Mouse and touch are also supported.'},
    it:{lang:'EN',newGame:'Nuova partita',turn:'Tocca a te — piazza una X',win:'HAI VINTO!!!',lose:'Ha vinto il computer',draw:'Pareggio',infoLabel:'Aiuto e crediti',close:'Chiudi',how:'Come si gioca',help:"Piazza le X sulla griglia 10×10. Devi formarne cinque in fila, in orizzontale, verticale o diagonale, prima che il computer faccia lo stesso con le O. La O evidenziata indica l'ultima mossa della CPU.",keys:'Tastiera: usa le frecce per spostare il cursore; Invio o Spazio piazzano una X.',credits:'Crediti',creditText:'Restauro e preservazione HTML5 per Libre Arcade, basati sull’applet Java XO World del 2007 di Milan Babuškov.',project:'Progetto Libre Arcade',boardHelp:'Usa le frecce per spostare il cursore sulla griglia. Premi Invio o Spazio per piazzare una X. Sono supportati anche mouse e touch.'}
  };
  let lang='en';
  try{lang=localStorage.getItem('xoworld-lang')||'en';}catch(_){/* storage can be unavailable; English remains the safe default */}
  let game=new window.XOWorldGame();
  let snap=game.snapshot();
  let focusIndex=44;

  function gameOver(){return snap.status===2||snap.status===3||snap.turn>=50;}
  function applyLanguage(){
    const t=text[lang];
    document.documentElement.lang=lang;
    langBtn.textContent=t.lang;
    newBtn.textContent=t.newGame;
    infoBtn.setAttribute('aria-label',t.infoLabel);
    infoBtn.title=t.infoLabel;
    closeInfoBtn.setAttribute('aria-label',t.close);
    howTitle.textContent=t.how;
    howText.textContent=t.help;
    keysText.textContent=t.keys;
    creditsTitle.textContent=t.credits;
    creditsText.textContent=t.creditText;
    projectLink.textContent=t.project;
    boardHelp.textContent=t.boardHelp;
    updateStatus();
  }
  function updateStatus(){
    const t=text[lang];
    const isResult=gameOver();
    statusEl.textContent=snap.status===2?t.win:snap.status===3?t.lose:(snap.turn>=50?t.draw:t.turn);
    statusEl.classList.toggle('result',isResult);
    canvas.classList.toggle('game-over',isResult);
  }
  function resizeCanvas(){
    const card=canvas.parentElement;
    const style=getComputedStyle(card);
    const padX=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight);
    const padY=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
    const available=Math.max(140,Math.floor(Math.min(card.clientWidth-padX,card.clientHeight-padY)));
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.style.width=available+'px';
    canvas.style.height=available+'px';
    const px=Math.round(available*dpr);
    if(canvas.width!==px||canvas.height!==px){canvas.width=px;canvas.height=px;}
    draw();
  }
  function tile(x,y,s){
    const inset=s*.045;
    const grad=ctx.createLinearGradient(x,y,x+s,y+s);
    grad.addColorStop(0,'#9a8970');
    grad.addColorStop(.44,'#776752');
    grad.addColorStop(1,'#55483a');
    ctx.fillStyle=grad;
    ctx.fillRect(x+inset,y+inset,s-2*inset,s-2*inset);
    ctx.strokeStyle='#3d342a';
    ctx.lineWidth=Math.max(1,s*.032);
    ctx.strokeRect(x+inset,y+inset,s-2*inset,s-2*inset);
    ctx.strokeStyle='#b8a48955';
    ctx.lineWidth=Math.max(1,s*.016);
    ctx.strokeRect(x+inset*1.9,y+inset*1.9,s-3.8*inset,s-3.8*inset);
  }
  function drawX(cx,cy,s){
    const r=s*.26;
    ctx.strokeStyle='#fff3c9';
    ctx.lineWidth=s*.105;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(cx-r,cy-r);ctx.lineTo(cx+r,cy+r);
    ctx.moveTo(cx+r,cy-r);ctx.lineTo(cx-r,cy+r);
    ctx.stroke();
    ctx.strokeStyle='#3d332888';
    ctx.lineWidth=s*.022;
    ctx.stroke();
  }
  function drawO(cx,cy,s,last){
    const r=s*.255;
    if(last){
      ctx.beginPath();ctx.arc(cx,cy,s*.375,0,Math.PI*2);
      ctx.fillStyle='#f0c54d3d';ctx.fill();
      ctx.strokeStyle='#f0c54d';ctx.lineWidth=s*.038;ctx.stroke();
    }
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle='#cc2630';ctx.lineWidth=s*.095;ctx.stroke();
    ctx.strokeStyle='#4b171988';ctx.lineWidth=s*.022;ctx.stroke();
  }
  function drawFocus(s){
    if(document.activeElement!==canvas||gameOver())return;
    const c=focusIndex%10,r=Math.trunc(focusIndex/10);
    ctx.strokeStyle='#fff7cc';
    ctx.lineWidth=Math.max(2,s*.04);
    ctx.strokeRect(c*s+s*.09,r*s+s*.09,s*.82,s*.82);
  }
  function draw(){
    const W=canvas.width,s=W/10;
    ctx.clearRect(0,0,W,W);
    ctx.fillStyle='#4e4335';ctx.fillRect(0,0,W,W);
    for(let r=0;r<10;r++)for(let c=0;c<10;c++){
      const i=r*10+c,x=c*s,y=r*s;
      tile(x,y,s);
      if(snap.board[i]===1)drawX(x+s/2,y+s/2,s);
      else if(snap.board[i]===2)drawO(x+s/2,y+s/2,s,i===snap.lastCpuMove);
    }
    drawFocus(s);
  }
  function pointerToIndex(ev){
    const rect=canvas.getBoundingClientRect();
    const x=(ev.clientX-rect.left)/rect.width,y=(ev.clientY-rect.top)/rect.height;
    const c=Math.floor(x*10),r=Math.floor(y*10);
    if(c<0||c>9||r<0||r>9)return -1;
    return r*10+c;
  }
  function play(index){
    if(gameOver())return;
    const result=game.playHuman(index);
    snap=result;
    if(result.ok){focusIndex=index;draw();updateStatus();}
  }
  function openInfo(){
    if(typeof infoDialog.showModal==='function')infoDialog.showModal();
    else infoDialog.setAttribute('open','');
    closeInfoBtn.focus();
  }
  function closeInfo(){
    if(typeof infoDialog.close==='function')infoDialog.close();
    else infoDialog.removeAttribute('open');
    infoBtn.focus();
  }

  canvas.addEventListener('pointerup',ev=>{const i=pointerToIndex(ev);if(i>=0)play(i);});
  canvas.addEventListener('focus',draw);
  canvas.addEventListener('blur',draw);
  canvas.addEventListener('keydown',ev=>{
    let next=focusIndex;
    const row=Math.trunc(focusIndex/10),col=focusIndex%10;
    if(ev.key==='ArrowLeft')next=row*10+Math.max(0,col-1);
    else if(ev.key==='ArrowRight')next=row*10+Math.min(9,col+1);
    else if(ev.key==='ArrowUp')next=Math.max(0,row-1)*10+col;
    else if(ev.key==='ArrowDown')next=Math.min(9,row+1)*10+col;
    else if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();play(focusIndex);return;}
    else return;
    ev.preventDefault();focusIndex=next;draw();
  });
  newBtn.addEventListener('click',()=>{snap=game.newGame();focusIndex=44;draw();updateStatus();canvas.focus();});
  langBtn.addEventListener('click',()=>{lang=lang==='en'?'it':'en';try{localStorage.setItem('xoworld-lang',lang);}catch(_){/* non-fatal */}applyLanguage();});
  infoBtn.addEventListener('click',openInfo);
  closeInfoBtn.addEventListener('click',closeInfo);
  infoDialog.addEventListener('click',ev=>{if(ev.target===infoDialog)closeInfo();});
  infoDialog.addEventListener('cancel',ev=>{ev.preventDefault();closeInfo();});
  window.addEventListener('resize',resizeCanvas,{passive:true});
  if(window.ResizeObserver)new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
  applyLanguage();
  resizeCanvas();
})();
