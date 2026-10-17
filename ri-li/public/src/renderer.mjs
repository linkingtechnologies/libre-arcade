/* Ri-li 2.0.1 Canvas renderer. SPDX-License-Identifier: GPL-3.0-only */
import { LT, HT } from './levels.mjs';
import { D_LEFT, D_RIGHT, D_UP, D_DOWN, C_RAIL, C_WAGON, C_STRETCH, C_SHRINK, C_SPEED, C_LIVE } from './core.mjs';
import { LABEL_NAMES, LANGUAGES } from './languages.mjs';

const CELL=40;
const NUM_RAIL=[-1,-1,-1,0,-1,1,2,3,-1,4,5,6,7,8,9,10];
const GROUP={
  locomotive:'000_locomotive',charbon:'001_charbon',buches:'002_buches',balles:'003_balles',
  moteur:'004_moteur',citerne:'005_citerne',wagon:'006_wagon',pluslong:'007_pluslong',
  pluscourt:'008_pluscourt',vitesse:'009_vitesse',vie:'010_vie',newwagon:'011_nouveau_wagon',
  lifeLogo:'012_logo_vie',rail:'013_rail',dir:'014_dir',letters:'015_lettres',digits:'016_chiffres',title:'017_titre',copyright:'018_copyright',deco:'019_deco',cursor:'020_curseur',
  arrowLeft:'021_fleche_gauche',arrowRight:'022_fleche_droite',arrows:'023_fleches',world:'024_monde',music:'025_music',sfx:'026_bruitage',fscreen:'027_fscreen',window:'028_window',keys:'029_keys',gmenu:'030_gmenu',menu:'031_menu',fondHr:'032_fond_hr',fondHrr:'033_fond_hrr',fondMenu:'034_fond_menu',fond:'035_fond'
};
const KEY=(g,n)=>`${g}:${n}`;

export class Renderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;this.meta=new Map();this.imgs=new Map();this.ui={it:{},en:{}};this.loaded=new Set();this.langLabel={};this.language='it';this.help=true;}
  async load(language='it'){
    const manifest=await fetch('data/sprites.json').then(r=>{if(!r.ok)throw Error('sprites.json');return r.json()});
    await Promise.all(manifest.map(async m=>{const g=m.png.split('/')[1],n=Number(m.frame),im=new Image();im.src=m.png;await im.decode();this.meta.set(KEY(g,n),{...m,width:Number(m.width),height:Number(m.height),cx:Number(m.cx),cy:Number(m.cy)});this.imgs.set(KEY(g,n),im);}));
    // the labels of the 19 languages' names, for the language menu, and the pictures of the language in use; the others are loaded when one is chosen (loadLanguage)
    await Promise.all([this.loadLanguage(language),...LANGUAGES.map(async code=>{const im=new Image();im.src=`ui/lang/${code}.png`;await im.decode();this.langLabel[code]=im;})]);
    this.setLanguage(language);
  }
  async loadLanguage(code){
    if(!LANGUAGES.includes(code))throw Error(`no language ${code}`);
    if(this.loaded.has(code))return;
    const ui=this.ui[code]??={};
    await Promise.all(LABEL_NAMES.map(async name=>{const im=new Image();im.src=`ui/${code}/${name}.png`;await im.decode();ui[name]=im;}));
    this.loaded.add(code);
  }
  setLanguage(lang){if(LANGUAGES.includes(lang))this.language=lang;}
  sprite(g,n,x,y){const k=KEY(g,n),im=this.imgs.get(k),m=this.meta.get(k);if(!im||!m)throw Error(`missing sprite ${k}`);this.ctx.drawImage(im,Math.trunc(x-m.cx),Math.trunc(y-m.cy));}
  uiSprite(name,x,y){const im=this.ui[this.language][name];if(!im)throw Error(`missing UI ${this.language}/${name}`);this.ctx.drawImage(im,Math.trunc(x)-(im.width>>1),Math.trunc(y)-(im.height>>1));}
  railFrame(cells,i){let m=0,x=i%LT,y=Math.trunc(i/LT);const active=j=>cells[j]>=C_RAIL&&cells[j]<7;if(y>0&&active(i-LT))m+=8;if(y<HT-1&&active(i+LT))m+=4;if(x>0&&cells[i-1]>=C_RAIL&&cells[i-1]<=7)m+=2;if(x<LT-1&&cells[i+1]>=C_RAIL&&cells[i+1]<=7)m+=1;return NUM_RAIL[m];}
  angleFrame(a,x,y){const ia=Math.trunc(a);if(ia===0)return Math.trunc(y+CELL/2)%CELL;if(ia===180)return Math.trunc(y+CELL/2)%CELL+40;if(ia===90)return Math.trunc(x+CELL/2)%CELL+80;if(ia===270)return Math.trunc(x+CELL/2)%CELL+120;let ns=Math.trunc(a*160/360);if(ns>=160)ns=0;return ns+160;}
  cable(dx,dy,fx,fy){const f=Math.fround;let lx=f(fx-dx),ly=f(fy-dy),d=f(Math.sqrt(f(f(lx*lx)+f(ly*ly)))),n=(Math.trunc(d)!==d)?Math.trunc(d)+1:Math.trunc(d);let x=f(dx),y=f(dy);lx=f(lx/n);ly=f(ly/n);this.ctx.fillStyle='#fff';for(let i=0;i<=n;i++){this.ctx.fillRect(Math.trunc(x),Math.trunc(y),1,1);x=f(x+lx);y=f(y+ly);}}
  numberWidth(value){const ds=String(Math.max(0,Math.trunc(value))).split('').map(Number);let w=0;ds.forEach((d,i)=>{w+=this.meta.get(KEY(GROUP.digits,d)).width;if(i+1<ds.length)w+=1;});return w;}
  number(value,x,y){let n=Math.max(0,Math.trunc(value)),px=x+Math.trunc(this.numberWidth(n)/2);do{const d=n%10,m=this.meta.get(KEY(GROUP.digits,d));this.sprite(GROUP.digits,d,px-Math.trunc(m.width/2),y);px-=m.width+1;n=Math.trunc(n/10);}while(n);}
  arrowFrame(board,pInter,pEntree,keys){if(pInter<0)return null;const x=pInter%LT,y=Math.trunc(pInter/LT);let map;if(pEntree===D_LEFT)map={[D_UP]:0,[D_DOWN]:2,[D_LEFT]:-1,[D_RIGHT]:1};else if(pEntree===D_RIGHT)map={[D_UP]:8,[D_DOWN]:6,[D_LEFT]:7,[D_RIGHT]:-1};else if(pEntree===D_UP)map={[D_UP]:-1,[D_DOWN]:4,[D_LEFT]:5,[D_RIGHT]:3};else map={[D_UP]:10,[D_DOWN]:-1,[D_LEFT]:9,[D_RIGHT]:11};for(const d of keys){if(map[d]===-1)continue;if(d===D_UP&&y>0&&board[pInter-LT]!==0)return map[d];if(d===D_DOWN&&y+1<HT&&board[pInter+LT]!==0)return map[d];if(d===D_LEFT&&x>0&&board[pInter-1]!==0)return map[d];if(d===D_RIGHT&&x+1<LT&&board[pInter+1]!==0)return map[d];}return 0;}
  renderBackground(level,board){this.sprite(GROUP.fond,0,400,300);for(let i=0;i<board.length;i++)if(board[i]>=C_RAIL&&board[i]<7){const rf=this.railFrame(board,i);if(rf>=0)this.sprite(GROUP.rail,rf,(i%LT)*CELL+20,Math.trunc(i/LT)*CELL+20);}for(const d of level.decorations)this.sprite(GROUP.deco,d[0],d[1],d[2]);this.uiSprite('T_level',740,110);this.uiSprite('T_score',740,180);this.uiSprite('T_options',740,260);this.uiSprite('T_lives',740,340);this.number(level.number,740,140);}
  renderTrain(geometry){let prevHook=null;for(let i=0;i<geometry.length;i++){const g=geometry[i],lv=i===1?18:20,a=Math.fround(g.angle*Math.PI/180);const cdx=g.center_x-Math.trunc(Math.fround(Math.fround(Math.sin(a))*lv)),cdy=g.center_y-Math.trunc(Math.fround(Math.fround(Math.cos(a))*lv));if(i>0&&prevHook)this.cable(cdx,cdy,prevHook.x,prevHook.y);const cfx=g.center_x-Math.trunc(Math.sin(a+Math.PI)*lv),cfy=g.center_y-Math.trunc(Math.cos(a+Math.PI)*lv);prevHook={x:cfx,y:cfy};this.sprite(GROUP[g.type],this.angleFrame(g.angle,g.center_x,g.center_y),g.center_x,g.center_y);if(g.newwagon_overlay_frame!==null&&g.newwagon_overlay_frame!==undefined)this.sprite(GROUP.newwagon,g.newwagon_overlay_frame,g.center_x,g.center_y);}}
  renderObjects(board,timeMs){const map={[C_WAGON]:GROUP.wagon,[C_STRETCH]:GROUP.pluslong,[C_SHRINK]:GROUP.pluscourt,[C_SPEED]:GROUP.vitesse,[C_LIVE]:GROUP.vie};for(let i=0;i<board.length;i++){const g=map[board[i]];if(g)this.sprite(g,(Math.trunc(timeMs*40/1000)+i*7)%50,(i%LT)*CELL+20,Math.trunc(i/LT)*CELL+20);}}
  renderHud(snap,oracle,paused){if(paused)this.uiSprite('T_press_any_key',LT*CELL/2,300);this.number(snap.score,740,215);const lives=Math.min(10,Math.max(0,snap.lives));for(let n=0;n<lives;n++)this.sprite(GROUP.lifeLogo,0,(n%2)*44+38+LT*CELL,Math.trunc(n/2)*46+384);const anim=(Math.trunc(snap.time_ms*40/1000))%50;if(snap.spacing<13)this.sprite(GROUP.pluscourt,anim,715,295);if(snap.spacing>13)this.sprite(GROUP.pluslong,anim,715,295);if(snap.speed>oracle.baseSpeed)this.sprite(GROUP.vitesse,(anim+7)%50,765,295);}
  draw(level,snap,oracle,{paused=false,gameOver=false}={}){const board=snap.board;this.renderBackground(level,board);this.renderTrain(snap.geometry);if(this.help&&oracle.pInter!==-1){const n=this.arrowFrame(board,oracle.pInter,oracle.pEntree,oracle.keys);this.sprite(GROUP.dir,n,(oracle.pInter%LT)*CELL+20,Math.trunc(oracle.pInter/LT)*CELL+20);}this.renderObjects(board,snap.time_ms);this.renderHud(snap,oracle,paused);if(gameOver){this.ctx.save();this.ctx.fillStyle='rgba(0,0,0,.68)';this.ctx.fillRect(95,245,490,110);this.ctx.fillStyle='#fff';this.ctx.textAlign='center';this.ctx.font='bold 30px system-ui,sans-serif';this.ctx.fillText(this.language==='it'?'Partita terminata':'Game over',340,292);this.ctx.restore();}}

  // Menu::SDLMain_Score: the best scores, in the letters' font, one row every 51 pixels; while a name is typed the row has the name and the two arrows instead of the dots
  drawScores(session,clockMs,{editing=false}={}){
    this.sprite(GROUP.fondMenu,0,400,300);
    this.uiSprite('T_better_scores',400,50);
    this.uiSprite('T_press_any_key',400,550);
    const edit=editing?session.highScoreSlot:-1;
    for(let i=0;i<8;i++){
      const y=120+i*51,entry=session.highScores[i];
      this.string(String(i+1),70,y);
      if(i!==edit)this.string(entry.name||'. . . . . . . . . . . . . .',140,y);
      const s=String(entry.score);this.string(s,740-this.textWidth(s),y);
    }
  }
  textWidth(text){const up="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-!?*+<>%$()&;",lo="abcdefghijklmnopqrstuvwxyz0123456789,_|?*+<>%$[]&;";let w=0;for(let i=0;i<text.length;i++){const c=text[i];let n=up.indexOf(c);if(n<0)n=lo.indexOf(c);if(n>=0){w+=this.meta.get(KEY(GROUP.letters,n)).width;if(i+1<text.length)w+=2;}else if(c===' ')w+=30;}return w;}   // LongueurString: 2 pixels between letters, a space is 30
  string(text,x,y){const up="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-!?*+<>%$()&;",lo="abcdefghijklmnopqrstuvwxyz0123456789,_|?*+<>%$[]&;";let px=x;for(const c of String(text)){let n=up.indexOf(c);if(n<0)n=lo.indexOf(c);if(n>=0){const m=this.meta.get(KEY(GROUP.letters,n));this.sprite(GROUP.letters,n,px+(m.width>>1),y);px+=m.width+2;}else if(c===' ')px+=28;}}   // AfficheString
  menuBase({panel=true,title=true,copyright=false}={}){this.sprite(GROUP.fondMenu,0,400,300);if(panel)this.sprite(GROUP.menu,0,400,340);if(title)this.sprite(GROUP.title,0,400,65);if(copyright)this.sprite(GROUP.copyright,0,400,587);}
  selectArrowsForUi(name,x,y,clockMs){const im=this.ui[this.language][name],f=Math.trunc(clockMs/50)%20;const x1=x-(im.width>>1)-25;this.sprite(GROUP.arrowLeft,f,x1,y);this.sprite(GROUP.arrowRight,f,(x-x1)+x,y);}
  drawMainMenu(selected,clockMs){this.menuBase({panel:true,title:true,copyright:true});const items=[['T_play',229],['T_scores',306],['T_moptions',384],['T_quit',461]];items.forEach(([n,y],i)=>{this.uiSprite(n,400,y);if(i===selected)this.selectArrowsForUi(n,400,y,clockMs);});}
  drawDifficulty(selected,clockMs){this.menuBase();const items=[['T_easy',225],['T_normal',340],['T_hard',455]];items.forEach(([n,y],i)=>{this.uiSprite(n,400,y);if(i===selected)this.selectArrowsForUi(n,400,y,clockMs);});}
  drawLevelMenu(selected,level,maxUnlocked,clockMs){this.menuBase();const items=[['T_new_game',225],['T_old_level',320],['T_menu',455]];items.forEach(([n,y],i)=>{this.uiSprite(n,400,y);if(i===selected)this.selectArrowsForUi(n,400,y,clockMs);});this.sprite(GROUP.arrows,level>1?1:0,330,380);this.sprite(GROUP.arrows,level<maxUnlocked?4:3,470,380);this.number(level,400,380);}
  frameSize(group,n=0){const m=this.meta.get(KEY(group,n));return [m.width,m.height];}
  // Menu::Affiche_Main: the arrows stand 25 pixels left of the button's box and mirror each other about `centre`; the button's box is [DepX,DepY,FinX,FinY]
  mainArrows(box,centre,clockMs){const f=Math.trunc(clockMs/50)%20,x1=box[0]-25;this.sprite(GROUP.arrowLeft,f,x1,(box[1]+box[3])>>1);this.sprite(GROUP.arrowRight,f,(centre-x1)+centre,(box[1]+box[3])>>1);}
  // Menu::InitMain_Options and the drawing of SDLMain_Options
  drawOptions(selected,prefs,clockMs,fullscreen=false){
    const T=Math.trunc,cm=120+(this.ui[this.language].T_menu.width>>1);
    this.sprite(GROUP.fondMenu,0,400,300);this.sprite(GROUP.gmenu,0,400,300);this.sprite(GROUP.keys,0,610,455);
    this.sprite(GROUP.fscreen,0,185,300);this.sprite(GROUP.window,0,625,300);
    this.uiSprite('T_menu',cm,490);
    this.sprite(GROUP.arrows,1,250,110);this.sprite(GROUP.arrows,4,700,110);this.sprite(GROUP.arrows,1,250,200);this.sprite(GROUP.arrows,4,700,200);
    this.sprite(GROUP.arrows,fullscreen?1:0,350,300);this.sprite(GROUP.arrows,fullscreen?3:4,450,300);
    const spin=T(clockMs/30)%25;
    this.sprite(GROUP.sfx,spin,150,110);this.sprite(GROUP.music,spin,150,200);this.sprite(GROUP.world,T(clockMs/50)%50,180,400);
    const wagon=T(clockMs/50)%40+120;
    for(const [volume,y] of [[prefs.sfxVolume,110],[prefs.musicVolume,200]]){const n=Math.round(volume*10);for(let i=0;i<n;i++)this.sprite(i===n-1?GROUP.locomotive:GROUP.buches,wagon,39*i+300,y);}
    const button=(group,x,y)=>{const [w,h]=this.frameSize(group);return [x-(w>>1),y-(h>>1),x+(w>>1),y+(h>>1)];};
    if(selected===0)this.mainArrows(button(GROUP.sfx,140,110),400,clockMs);
    else if(selected===1)this.mainArrows(button(GROUP.music,160,200),400,clockMs);
    else if(selected===2){const [w]=this.frameSize(GROUP.fscreen),b=button(GROUP.fscreen,190,300);b[0]-=40;b[2]=625+40+(w>>1);this.mainArrows(b,400,clockMs);}
    else if(selected===3)this.mainArrows(button(GROUP.world,180,400),180,clockMs);
    else{const w=this.ui[this.language].T_menu.width,h=this.ui[this.language].T_menu.height;this.mainArrows([cm-(w>>1),490-(h>>1),cm+(w>>1),490+(h>>1)],cm,clockMs);}
  }
  langSprite(code,x,y){const im=this.langLabel[code];this.ctx.drawImage(im,x-(im.width>>1),y-(im.height>>1));}
  // Menu::SDLMain_Langue: the languages in columns of NL, three columns at most; Affiche_Main_Centre puts the arrows 5 pixels outside the chosen label
  drawLanguage(selected,languages,clockMs){
    this.sprite(GROUP.fondMenu,0,400,300);
    const n=languages.length,nl=n%3===0?n/3:Math.trunc(n/3)+1,gap=Math.trunc(600/(nl+1));
    const place=(i)=>[Math.trunc(i/nl)*Math.trunc(800/3)+Math.trunc(800/6),(i%nl)*gap+gap];
    languages.forEach((code,i)=>{const [x,y]=place(i);this.langSprite(code,x,y);});
    const [x,y]=place(selected),w=this.langLabel[languages[selected]].width>>1,f=Math.trunc(clockMs/50)%20;
    this.sprite(GROUP.arrowLeft,f,x-w-5,y);this.sprite(GROUP.arrowRight,f,x+w+5,y);
  }
  // Menu::Affiche_InGame and SDLMain_InGame: the last picture of the game behind a panel with three buttons
  // the panel is drawn over what the screen has: the last picture of the game, or (after Options) the options screen that was left
  drawInGameMenu(level,snap,oracle,selected,clockMs,paused,behind=null){
    if(behind)behind();else this.draw(level,snap,oracle,{paused});
    this.sprite(GROUP.menu,0,340,300);
    const names=['T_continue','T_moptions','T_exit_game'],ys=[185,300,415];
    names.forEach((name,i)=>this.uiSprite(name,340,ys[i]));
    const im=this.ui[this.language][names[selected]],x1=340-(im.width>>1)-25,f=Math.trunc(clockMs/50)%20;
    this.sprite(GROUP.arrowLeft,f,x1,ys[selected]);this.sprite(GROUP.arrowRight,f,(340-x1)+340,ys[selected]);
  }
  drawNameEntry(session,clockMs,name){this.drawScores(session,clockMs,{editing:true});if(session.highScoreSlot==null)return;const y=120+session.highScoreSlot*51;this.string(name||'',140,y);const f=Math.trunc(clockMs/50)%20;this.sprite(GROUP.arrowLeft,f,110,y);this.sprite(GROUP.arrowRight,f,180+this.textWidth(name||''),y);}
  quizArrow(center,name,selected,clockMs){if(!selected)return;const im=this.ui[this.language][name],f=Math.trunc(clockMs/50)%20,x1=center-(im.width>>1)-25,x2=(center-x1)+center,y=492;this.sprite(GROUP.arrowLeft,f,x1,y);this.sprite(GROUP.arrowRight,f,x2,y);}
  drawQuiz(level,snap,oracle,quiz,clockMs){
    // SDLMain_HR copies the last gameplay screen into fmenu, then overlays this panel.
    this.draw(level,snap,oracle,{paused:false});
    this.sprite(GROUP.menu,0,340,300);this.sprite(GROUP.fondHr,0,340,74);this.uiSprite('T_question',338,70);
    this.sprite(GROUP.locomotive,quiz.visual.locomotiveFrame,115,110);
    const d=quiz.visual.decorations;this.sprite(GROUP.deco,d[0].frame,100,160+d[0].offset);this.sprite(GROUP.deco,d[1].frame,100,470-d[1].offset);this.sprite(GROUP.deco,d[2].frame,580,100+d[2].offset);this.sprite(GROUP.deco,d[3].frame,580,470-d[3].offset);
    this.uiSprite(`T_art${quiz.correctArticle}`,340,300);
    const correctX=quiz.correctOnLeft?240:440,wrongX=quiz.correctOnLeft?440:240;
    this.sprite(GROUP.fondHrr,0,correctX,492);this.uiSprite(`T_tart${quiz.correctArticle}`,correctX,492);
    if(!quiz.answered){this.sprite(GROUP.fondHrr,0,wrongX,492);this.uiSprite(`T_tart${quiz.decoyArticle}`,wrongX,492);this.quizArrow(quiz.pyE===0?correctX:wrongX,quiz.pyE===0?`T_tart${quiz.correctArticle}`:`T_tart${quiz.decoyArticle}`,true,clockMs);}
  }
}
