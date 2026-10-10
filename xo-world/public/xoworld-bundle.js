/* Generated from the unchanged M3 headless sources. Do not edit directly. */
(function(global){
'use strict';
const engineModule=(function(){
  const module={exports:{}}; const exports=module.exports;
'use strict';

class XOWorldEngine {
  static DUBINA = 7;
  static NONE = 100;
  static TACNO = 1;
  static NETACNO = 0;
  static znakO = 2;
  static znakX = 1;
  static SAFE = 1;
  static CLEAN = 3;
  static COUNT = 2;
  static SETFLAGS = 1;
  static CHECK = 0;

  constructor(randomFn = Math.random) {
    this.randomFn = randomFn;
    this.potez = -1;
    this.st = 0;
    this.LastMove = XOWorldEngine.NONE;
    this.brojac = Array(8).fill(0);
    this.t = Array.from({length: 3}, () => Array(100).fill(0));
    this.tr = Array.from({length: 7}, () => Array(100).fill(0));
    this.tp = Array(100).fill(0);
    this.tf = Array(100).fill(0);
    this.p = Array(10).fill(0);
    this.maxDepthObserved = -1;
  }

  reset() {
    for (const a of this.t) a.fill(0);
    for (const a of this.tr) a.fill(0);
    this.tp.fill(0); this.tf.fill(0); this.p.fill(0); this.brojac.fill(0);
    this.potez = 0; this.st = 0; this.LastMove = XOWorldEngine.NONE;
    this.maxDepthObserved = -1;
  }

  trtotp(dub) { for (let k=0;k<100;k++) this.tp[k]=this.tr[dub][k]; }
  tptotr(dub) { for (let k=0;k<100;k++) this.tr[dub][k]=this.tp[k]; }

  check5(znak,x,type) {
    const {NETACNO,TACNO,SETFLAGS,CLEAN,CHECK,NONE}=XOWorldEngine;
    let mesto=0,mesto2=0;
    for(let l=0;l<6;l++) {
      for(let j=0;j<10;j++) {
        for(let k=0;k<4;k++) this.brojac[k]=0;
        for(let k=0;k<5;k++) {
          if(this.t[x][j*10+l+k]===znak) this.brojac[0]++;
          else if(this.t[x][j*10+l+k]===NETACNO) {
            mesto=10*j+l+k; this.p[this.brojac[1]]=mesto; this.brojac[1]++;
          } else break;
        }
        if(this.brojac[0]===3 && this.brojac[1]===2) {
          if(type===SETFLAGS){this.tf[this.p[0]]=TACNO;this.tf[this.p[1]]=TACNO;}
          if(type===CLEAN) return this.p[0];
        }
        if(this.brojac[0]===4 && this.brojac[1]===1 && type===CHECK) return mesto;

        for(let k=0;k<5;k++) {
          if(this.t[x][l*10+j+k*10]===znak) this.brojac[2]++;
          else if(this.t[x][l*10+j+k*10]===NETACNO) {
            mesto=10*l+j+k*10; this.p[this.brojac[3]]=mesto; this.brojac[3]++;
          } else break;
        }
        if(this.brojac[2]===3 && this.brojac[3]===2) {
          if(type===SETFLAGS){this.tf[this.p[0]]=TACNO;this.tf[this.p[1]]=TACNO;}
          if(type===CLEAN) return this.p[0];
        }
        if(this.brojac[2]===4 && this.brojac[3]===1 && type===CHECK) return mesto;
      }
      for(let j=0;j<6;j++) {
        for(let k=0;k<4;k++) this.brojac[k]=0;
        for(let k=0;k<5;k++) {
          if(this.t[x][l*10+j+k*11]===znak) this.brojac[0]++;
          if(this.t[x][l*10+j+k*11]===NETACNO) {mesto=l*10+j+k*11;this.p[this.brojac[1]]=mesto;this.brojac[1]++;}
          if(this.t[x][l*10+j-k*9+40]===znak) this.brojac[2]++;
          if(this.t[x][l*10+j-k*9+40]===NETACNO) {mesto2=l*10+j-k*9+40;this.p[this.brojac[3]]=mesto2;this.brojac[3]++;}
        }
        if(this.brojac[0]===3 && this.brojac[1]===2) {
          if(type===SETFLAGS){this.tf[this.p[0]]=TACNO;this.tf[this.p[1]]=TACNO;}
          if(type===CLEAN) return this.p[0];
        }
        if(this.brojac[0]===4 && this.brojac[1]===1 && type===CHECK) return mesto;
        if(this.brojac[2]===3 && this.brojac[3]===2) {
          if(type===SETFLAGS){this.tf[this.p[0]]=TACNO;this.tf[this.p[1]]=TACNO;}
          if(type===CLEAN) return this.p[0];
        }
        if(this.brojac[2]===4 && this.brojac[3]===1 && type===CHECK) return mesto2;
      }
    }
    return NONE;
  }

  countc4(znak,x,type) {
    const {NETACNO,TACNO,SAFE}=XOWorldEngine;
    let zbir=0,flag,flag2;
    flag=NETACNO;
    for(let j=0;j<10;j++) {
      for(let l=0;l<6;l++) {
        this.brojac[0]=this.brojac[1]=this.brojac[2]=0;
        for(let k=0;k<5;k++) this.brojac[this.t[x][j*10+l+k]]++;
        if(this.brojac[znak]===4 && this.brojac[NETACNO]===1) {
          if(type===SAFE) {
            flag2=NETACNO;
            for(let k=0;k<5;k++) if(this.t[x][j*10+l+k]===NETACNO && this.tf[j*10+l+k]===TACNO) flag2=TACNO;
            if(flag2===NETACNO){zbir++;flag=TACNO;break;}
          } else {zbir++;flag=TACNO;break;}
        }
      }
      if(flag===TACNO) break;
    }
    flag=NETACNO;
    for(let j=0;j<10;j++) {
      for(let l=0;l<6;l++) {
        this.brojac[0]=this.brojac[1]=this.brojac[2]=0;
        for(let k=0;k<5;k++) this.brojac[this.t[x][l*10+j+k*10]]++;
        if(this.brojac[znak]===4 && this.brojac[NETACNO]===1) {
          if(type===SAFE) {
            flag2=NETACNO;
            for(let k=0;k<5;k++) if(this.t[x][l*10+j+k*10]===NETACNO && this.tf[l*10+j+k*10]===TACNO) flag2=TACNO;
            if(flag2===NETACNO){zbir++;flag=TACNO;break;}
          } else {zbir++;flag=TACNO;break;}
        }
      }
      if(flag===TACNO) break;
    }
    flag=NETACNO;
    for(let l=0;l<6;l++) {
      for(let j=0;j<6;j++) {
        this.brojac[0]=this.brojac[1]=this.brojac[2]=0;
        for(let k=0;k<5;k++) this.brojac[this.t[x][l*10+j+k*11]]++;
        if(this.brojac[znak]===4 && this.brojac[NETACNO]===1) {
          if(type===SAFE) {
            flag2=NETACNO;
            for(let k=0;k<5;k++) if(this.t[x][l*10+j+k*11]===NETACNO && this.tf[l*10+j+k*11]===TACNO) flag2=TACNO;
            if(flag2===NETACNO){zbir++;flag=TACNO;break;}
          } else {zbir++;flag=TACNO;break;}
        }
      }
      if(flag===TACNO) break;
    }
    flag=NETACNO;
    for(let l=0;l<6;l++) {
      for(let j=0;j<6;j++) {
        this.brojac[0]=this.brojac[1]=this.brojac[2]=0;
        for(let k=0;k<5;k++) this.brojac[this.t[x][l*10+j-k*9+40]]++;
        if(this.brojac[znak]===4 && this.brojac[NETACNO]===1) {
          if(type===SAFE) {
            flag2=NETACNO;
            for(let k=0;k<5;k++) if(this.t[x][l*10+j-k*9+40]===NETACNO && this.tf[l*10+j-k*9+40]===TACNO) flag2=TACNO;
            if(flag2===NETACNO){zbir++;flag=TACNO;break;}
          } else {zbir++;flag=TACNO;break;}
        }
      }
      if(flag===TACNO) break;
    }
    return zbir;
  }

  check24c(znak,x) {
    const {NETACNO,CLEAN,NONE}=XOWorldEngine;
    for(let j=0;j<100;j++) this.t[1][j]=this.t[x][j];
    for(let k=0;k<100;k++) if(this.t[1][k]===NETACNO) {
      this.t[1][k]=znak;
      if(this.countc4(znak,1,CLEAN)>1) return k;
      this.t[1][k]=NETACNO;
    }
    return NONE;
  }

  checko4c(znak,x,type) {
    const {NETACNO,TACNO,CLEAN,CHECK,SETFLAGS,COUNT,NONE}=XOWorldEngine;
    let mesto=0;
    for(let k=0;k<4;k++) this.p[k]=0;
    for(let l=0;l<5;l++) {
      for(let j=0;j<10;j++) {
        for(let k=0;k<4;k++) this.brojac[k]=0;
        if(this.t[x][j*10+l]===NETACNO && this.t[x][j*10+l+5]===NETACNO) {
          for(let k=1;k<5;k++) {
            if(this.t[x][j*10+l+k]===znak) this.brojac[0]++;
            else if(this.t[x][j*10+l+k]===NETACNO){mesto=10*j+l+k;this.brojac[1]++;}
            else break;
          }
          if(type!==CLEAN && this.brojac[0]===3 && this.brojac[1]===1){this.p[0]=1;if(type===CHECK)return mesto;if(type===SETFLAGS)this.tf[mesto]=TACNO;}
          if(type===CLEAN && this.brojac[0]===2 && this.brojac[1]===2)return mesto;
        }
        if(this.t[x][l*10+j]===NETACNO && this.t[x][l*10+j+50]===NETACNO) {
          for(let k=1;k<5;k++) {
            if(this.t[x][l*10+j+k*10]===znak) this.brojac[2]++;
            else if(this.t[x][l*10+j+k*10]===NETACNO){mesto=10*l+j+k*10;this.brojac[3]++;}
            else break;
          }
          if(type!==CLEAN && this.brojac[2]===3 && this.brojac[3]===1){this.p[1]=1;if(type===CHECK)return mesto;if(type===SETFLAGS)this.tf[mesto]=TACNO;}
          if(type===CLEAN && this.brojac[2]===2 && this.brojac[3]===2)return mesto;
        }
      }
      for(let j=0;j<5;j++) {
        for(let k=0;k<4;k++) this.brojac[k]=0;
        if(this.t[x][l*10+j]===NETACNO && this.t[x][l*10+j+55]===NETACNO) {
          for(let k=1;k<5;k++) {
            if(this.t[x][l*10+j+k*11]===znak) this.brojac[0]++;
            if(this.t[x][l*10+j+k*11]===NETACNO){mesto=l*10+j+k*11;this.brojac[1]++;}
          }
          if(type!==CLEAN && this.brojac[0]===3 && this.brojac[1]===1){this.p[2]=1;if(type===CHECK)return mesto;if(type===SETFLAGS)this.tf[mesto]=TACNO;}
          if(type===CLEAN && this.brojac[0]===2 && this.brojac[1]===2)return mesto;
        }
        if(this.t[x][l*10+j+50]===NETACNO && this.t[x][l*10+j+5]===NETACNO) {
          for(let k=1;k<5;k++) {
            if(this.t[x][l*10+j-k*9+50]===znak) this.brojac[2]++;
            if(this.t[x][l*10+j-k*9+50]===NETACNO){mesto=l*10+j-k*9+50;this.brojac[3]++;}
          }
          if(type!==CLEAN && this.brojac[2]===3 && this.brojac[3]===1){this.p[3]=1;if(type===CHECK)return mesto;if(type===SETFLAGS)this.tf[mesto]=TACNO;}
          if(type===CLEAN && this.brojac[2]===2 && this.brojac[3]===2)return mesto;
        }
      }
    }
    if(type===COUNT) return this.p[0]+this.p[1]+this.p[2]+this.p[3];
    return NONE;
  }

  checkc4o3(znak,x) {
    const {NETACNO,CHECK,SAFE,NONE}=XOWorldEngine;
    for(let k=0;k<100;k++) this.t[1][k]=this.t[x][k];
    for(let k=0;k<100;k++) if(this.t[1][k]===NETACNO) {
      this.t[1][k]=znak;
      if(this.checko4c(znak,1,CHECK)!==NONE && this.countc4(znak,1,SAFE)>0) return k;
      this.t[1][k]=NETACNO;
    }
    return NONE;
  }

  PostaviFlags(znak) {
    const {NETACNO,SETFLAGS}=XOWorldEngine;
    this.tf.fill(NETACNO); this.check5(znak,0,SETFLAGS); this.checko4c(znak,0,SETFLAGS);
  }

  setc4c(znak) {
    const {NETACNO,TACNO}=XOWorldEngine; const x=2;
    this.tp.fill(NETACNO);
    for(let j=0;j<10;j++) for(let k=0;k<6;k++) {
      this.brojac[0]=this.brojac[1]=0;
      for(let l=0;l<5;l++){const po=this.t[x][j*10+k+l];if(po===znak)this.brojac[0]++;if(po===NETACNO){this.p[this.brojac[1]]=j*10+k+l;this.brojac[1]++;}}
      if(this.brojac[0]===3&&this.brojac[1]===2)for(let l=0;l<2;l++)this.tp[this.p[l]]=TACNO;
    }
    for(let j=0;j<10;j++) for(let k=0;k<6;k++) {
      this.brojac[0]=this.brojac[1]=0;
      for(let l=0;l<5;l++){const po=this.t[x][k*10+j+l*10];if(po===znak)this.brojac[0]++;if(po===NETACNO){this.p[this.brojac[1]]=k*10+j+l*10;this.brojac[1]++;}}
      if(this.brojac[0]===3&&this.brojac[1]===2)for(let l=0;l<2;l++)this.tp[this.p[l]]=TACNO;
    }
    for(let j=0;j<6;j++) for(let k=0;k<6;k++) {
      this.brojac[0]=this.brojac[1]=0;
      for(let l=0;l<5;l++){const po=this.t[x][j*10+k+l*11];if(po===znak)this.brojac[0]++;if(po===NETACNO){this.p[this.brojac[1]]=j*10+k+l*11;this.brojac[1]++;}}
      if(this.brojac[0]===3&&this.brojac[1]===2)for(let l=0;l<2;l++)this.tp[this.p[l]]=TACNO;
    }
    for(let j=0;j<6;j++) for(let k=0;k<6;k++) {
      this.brojac[0]=this.brojac[1]=0;
      for(let l=0;l<5;l++){const po=this.t[x][j*10+k-l*9+40];if(po===znak)this.brojac[0]++;if(po===NETACNO){this.p[this.brojac[1]]=j*10+k-l*9+40;this.brojac[1]++;}}
      if(this.brojac[0]===3&&this.brojac[1]===2)for(let l=0;l<2;l++)this.tp[this.p[l]]=TACNO;
    }
  }

  seto4cc(znak) {
    const {NETACNO,TACNO}=XOWorldEngine; const x=2;
    this.tp.fill(NETACNO);
    for(let j=0;j<10;j++) for(let k=0;k<5;k++) {let po=j*10+k;if(this.t[x][po]===NETACNO&&this.t[x][po+5]===NETACNO){this.brojac[0]=this.brojac[1]=0;for(let l=1;l<5;l++){po=this.t[x][j*10+k+l];if(po===znak)this.brojac[0]++;if(po===NETACNO){this.p[this.brojac[1]]=j*10+k+l;this.brojac[1]++;}}if(this.brojac[0]===2&&this.brojac[1]===2)for(let l=0;l<2;l++)this.tp[this.p[l]]=TACNO;}}
    for(let j=0;j<10;j++) for(let k=0;k<5;k++) {let po=k*10+j;if(this.t[x][po]===NETACNO&&this.t[x][po+50]===NETACNO){this.brojac[0]=this.brojac[1]=0;for(let l=1;l<5;l++){po=this.t[x][k*10+j+l*10];if(po===znak)this.brojac[0]++;if(po===NETACNO){this.p[this.brojac[1]]=k*10+j+l*10;this.brojac[1]++;}}if(this.brojac[0]===2&&this.brojac[1]===2)for(let l=0;l<2;l++)this.tp[this.p[l]]=TACNO;}}
    for(let j=0;j<5;j++) for(let k=0;k<5;k++) {let po=j*10+k;if(this.t[x][po]===NETACNO&&this.t[x][po+55]===NETACNO){this.brojac[0]=this.brojac[1]=0;for(let l=1;l<5;l++){po=this.t[x][j*10+k+l*11];if(po===znak)this.brojac[0]++;if(po===NETACNO){this.p[this.brojac[1]]=j*10+k+l*11;this.brojac[1]++;}}if(this.brojac[0]===2&&this.brojac[1]===2)for(let l=0;l<2;l++)this.tp[this.p[l]]=TACNO;}}
    for(let j=0;j<5;j++) for(let k=0;k<5;k++) {let po=j*10+k;if(this.t[x][po+50]===NETACNO&&this.t[x][po+5]===NETACNO){this.brojac[0]=this.brojac[1]=0;for(let l=1;l<5;l++){po=this.t[x][j*10+k-l*9+50];if(po===znak)this.brojac[0]++;if(po===NETACNO){this.p[this.brojac[1]]=j*10+k-l*9+50;this.brojac[1]++;}}if(this.brojac[0]===2&&this.brojac[1]===2)for(let l=0;l<2;l++)this.tp[this.p[l]]=TACNO;}}
  }

  check2o3c(znak,x) {
    const {NETACNO,COUNT,NONE}=XOWorldEngine;
    for(let k=0;k<100;k++) {
      if(this.t[x][k]!==NETACNO) continue;
      this.t[x][k]=znak;
      if(this.checko4c(znak,x,COUNT)>1) return k; // historical mutation quirk intentionally preserved
      this.t[x][k]=NETACNO;
    }
    return NONE;
  }

  checkIzmedju(){const {znakX,NONE}=XOWorldEngine;for(let k=1;k<7;k++)for(let l=1;l<9;l++){const x=k+10*l,y=l+k*10;if(this.t[0][x]===znakX&&this.t[0][x+2]===znakX&&this.t[0][x+1]===0)return x+1;if(this.t[0][y]===znakX&&this.t[0][y+20]===znakX&&this.t[0][y+10]===0)return y+10;}return NONE;}
  checkCross(znak){const {NONE}=XOWorldEngine;for(let k=1;k<7;k++)for(let l=1;l<7;l++){const x=k+10*l;if(this.t[0][x]===znak&&this.t[0][x+2]===znak&&this.t[0][x+20]===znak&&this.t[0][x+22]===znak&&this.t[0][x+11]===0)return x+11;}return NONE;}
  checkBox(znak){const {NONE}=XOWorldEngine;for(let k=1;k<8;k++)for(let l=1;l<8;l++){let cnt=0,pos=-1;for(let a=0;a<2;a++)for(let b=0;b<2;b++){const x=k+a+10*(l+b),c=this.t[0][x];if(c===znak)cnt++;else if(c===0)pos=x;}if(cnt===3&&pos!==-1)return pos;}return NONE;}

  pobeda(){const {znakX,znakO,NETACNO}=XOWorldEngine;for(let l=0;l<6;l++){for(let j=0;j<10;j++){for(let k=0;k<8;k++)this.brojac[k]=0;for(let k=0;k<5;k++){this.brojac[this.t[0][j*10+l+k]]++;this.brojac[4+this.t[0][l*10+j+k*10]]++;}if(this.brojac[1]===5||this.brojac[5]===5)return znakX;if(this.brojac[2]===5||this.brojac[6]===5)return znakO;}for(let j=0;j<6;j++){for(let k=0;k<8;k++)this.brojac[k]=0;for(let k=0;k<5;k++){this.brojac[this.t[0][l*10+j+k*11]]++;this.brojac[4+this.t[0][l*10+j-k*9+40]]++;}if(this.brojac[1]===5||this.brojac[5]===5)return znakX;if(this.brojac[2]===5||this.brojac[6]===5)return znakO;}}return NETACNO;}

  OdigrajPotez(znak,x){const {CHECK,NONE}=XOWorldEngine;let mesto;if((mesto=this.check5(3-znak,x,CHECK))!==NONE)return mesto;if((mesto=this.checko4c(3-znak,x,CHECK))!==NONE)return mesto;return NONE;}

  checkSerie(znak,dub){const {DUBINA,NETACNO,CHECK,NONE}=XOWorldEngine;this.maxDepthObserved=Math.max(this.maxDepthObserved,dub);if(dub===DUBINA)return NONE;this.setc4c(znak);for(let k=0;k<100;k++){if(this.tp[k]===NETACNO||this.t[2][k]!==NETACNO)continue;this.tptotr(dub);this.t[2][k]=znak;const odg=this.OdigrajPotez(3-znak,2);if(odg===NONE)return NONE;this.t[2][odg]=3-znak;if(this.check5(znak,2,CHECK)!==NONE)return k;if(this.check5(3-znak,2,CHECK)!==NONE){this.t[2][k]=NETACNO;this.t[2][odg]=NETACNO;this.trtotp(dub);continue;}if(this.checkSerie(znak,dub+1)!==NONE)return k;this.t[2][k]=NETACNO;this.t[2][odg]=NETACNO;this.trtotp(dub);}return NONE;}

  igraj(x,y){
    const {NONE,znakO,znakX,CHECK,CLEAN,TACNO,NETACNO}=XOWorldEngine; let mesto=0;
    if(this.potez===1){if(y>5)return y*10+x-11;else return y*10+x+11;}
    if(this.potez===2 && (mesto=this.checkIzmedju())!==NONE)return mesto;
    if(this.potez>3){if((mesto=this.check5(znakO,0,CHECK))!==NONE)return mesto;if((mesto=this.check5(znakX,0,CHECK))!==NONE)return mesto;}
    if(this.potez>2 && (mesto=this.checko4c(znakO,0,CHECK))!==NONE)return mesto;
    if(this.potez>5 && (mesto=this.check24c(znakO,0))!==NONE)return mesto;
    this.PostaviFlags(znakX);
    if(this.potez>4 && (mesto=this.checkc4o3(znakO,0))!==NONE)return mesto;
    if(this.potez>2 && (mesto=this.checko4c(znakX,0,CHECK))!==NONE)return mesto;
    if(this.potez>5 && (mesto=this.check24c(znakX,0))!==NONE)return mesto;
    this.PostaviFlags(znakO);
    if(this.potez>4 && (mesto=this.checkc4o3(znakX,0))!==NONE)return mesto;
    for(let i=0;i<100;i++)this.t[2][i]=this.t[0][i];
    if(this.potez>3 && (mesto=this.checkSerie(znakO,0))!==NONE)return mesto;
    if(this.potez>3 && (mesto=this.checkSerie(znakX,0))!==NONE)return mesto;
    if(this.potez>2 && (mesto=this.check2o3c(znakO,0))!==NONE)return mesto;
    if(this.potez>2 && (mesto=this.check2o3c(znakX,0))!==NONE)return mesto;
    if(this.potez>3 && (mesto=this.checkCross(znakX))!==NONE)return mesto;
    if(this.potez>3 && (mesto=this.checkCross(znakO))!==NONE)return mesto;
    if(this.potez>2 && (mesto=this.checkBox(znakX))!==NONE)return mesto;
    if(this.potez>2 && (mesto=this.checkIzmedju())!==NONE)return mesto;
    this.seto4cc(znakX);
    for(let i=11;i<89;i++) if(this.tp[i]===TACNO && (this.t[0][i-11]===znakX||this.t[0][i-10]===znakX||this.t[0][i-9]===znakX||this.t[0][i-1]===znakX||this.t[0][i+1]===znakX||this.t[0][i+9]===znakX||this.t[0][i+10]===znakX||this.t[0][i+11]===znakX))return i;
    if((mesto=this.checko4c(znakO,0,CLEAN))!==NONE)return mesto;
    if((mesto=this.check5(znakX,0,CLEAN))!==NONE)return mesto;
    let i=NETACNO;
    do {
      mesto=Math.trunc(this.randomFn()*100);
      if(this.t[0][mesto]!==NETACNO)continue;
      if((mesto>0&&this.t[0][mesto-1]!==NETACNO)||(mesto>10&&(this.t[0][mesto-11]!==NETACNO||this.t[0][mesto-10]!==NETACNO||this.t[0][mesto-9]!==NETACNO))||(mesto<99&&this.t[0][mesto+1]!==NETACNO)||(mesto<88&&(this.t[0][mesto+9]!==NETACNO||this.t[0][mesto+10]!==NETACNO||this.t[0][mesto+11]!==NETACNO)))i=TACNO;
    } while(i===NETACNO);
    return mesto;
  }
}

module.exports = { XOWorldEngine };

  return module.exports;
})();
const modelModule=(function(){
  const module={exports:{}}; const exports=module.exports;
  function require(name){ if(name==='./xoworld-engine') return engineModule; throw new Error('Unknown module '+name); }
'use strict';
const {XOWorldEngine}=require('./xoworld-engine');

class XOWorldGame {
  constructor({randomFn=Math.random}={}) {
    this.engine=new XOWorldEngine(randomFn);
    this.newGame();
  }
  newGame(){this.engine.reset();return this.snapshot();}
  snapshot(){return {board:this.engine.t[0].slice(),turn:this.engine.potez,status:this.engine.st,lastCpuMove:this.engine.LastMove,winner:this.engine.pobeda()};}
  playHuman(index){
    if(!Number.isInteger(index)||index<0||index>99)return {ok:false,reason:'out-of-range',...this.snapshot()};
    const e=this.engine;
    if(e.t[0][index]!==0||e.st!==0||e.potez>49)return {ok:false,reason:'illegal',...this.snapshot()};
    e.potez++;
    e.t[0][index]=XOWorldEngine.znakX;
    if(e.pobeda()===0){
      const x=index%10,y=Math.trunc(index/10);
      e.LastMove=e.igraj(x,y);
      if(e.LastMove!==XOWorldEngine.NONE)e.t[0][e.LastMove]=XOWorldEngine.znakO;
      e.st=0;
    }
    if(e.pobeda()===XOWorldEngine.znakO)e.st=3;
    if(e.pobeda()===XOWorldEngine.znakX)e.st=2;
    return {ok:true,humanMove:index,cpuMove:e.LastMove,...this.snapshot()};
  }
}
module.exports={XOWorldGame};

  return module.exports;
})();
global.XOWorldEngine=engineModule.XOWorldEngine;
global.XOWorldGame=modelModule.XOWorldGame;
})(window);
