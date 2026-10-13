// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

import {CONFIG} from './config.js';
import {CELL} from './grid.js';

export class Player {
  constructor(index,grid,scoreToWin=CONFIG.scoreToWin,money=CONFIG.moneyAtStart){
    this.index=index;
    this.grid=grid;
    this.scoreToWin=scoreToWin;
    this.money=money;
    this.score=0;
    this.energy=0;
    // Java PlayerAbstract starts at 0; the first 1-second player update recalculates it.
    this.acceleration=0;
    this.ammo={missile:0,shield:0,aircraft:0,mortar:0,nuke:0,spy:0};
    this.status=Array.from({length:grid.h},(_,y)=>Array.from({length:grid.w},(_,x)=>grid.get(x,y)===CELL.WATER?0:1));
    this.cannotFireBefore=0;
    this.belowZeroSince=0;
    this.energyBelowZero=true;
    this.lost=false;
    this.won=false;
    this.constructedBuildings=0;
    this.destroyedBuildings=0;
    this.destroyedCells=0;
  }
  operational(){ return this.grid.buildings.filter(b=>b.state==='operational'&&!b.destroyed); }
  computeEnergy(now){
    const count=this.operational().reduce((s,b)=>s+b.def.energy,0);
    if(this.energy>0&&count<=0){this.energyBelowZero=true;this.belowZeroSince=now;}
    else if(count>0)this.energyBelowZero=false;
    this.energy=count;
  }
  computeAcceleration(){
    if(this.energy>0){
      const houses=this.operational().filter(b=>b.key==='house').length;
      this.acceleration=Math.min(CONFIG.maxAcceleration,houses*CONFIG.accelerationPerHouse);
    } else this.acceleration=-200;
  }
  computeMoney(){
    if(this.energy>0)this.money+=this.operational().filter(b=>b.key==='commercial').length*CONFIG.moneyPerCommercialPerSecond;
  }
  canBuild(def,x,y){return this.money>=def.cost&&this.grid.freeGrass(x,y,def.w,def.h)}
  build(key,x,y,now){
    const def=CONFIG.buildings[key];
    if(!def||!this.canBuild(def,x,y))return false;
    const b={key,def,x,y,state:'construction',createdAt:now,updatedAt:now,destroyed:false,cells:[]};
    for(let yy=0;yy<def.h;yy++)for(let xx=0;xx<def.w;xx++){
      b.cells.push({x:x+xx,y:y+yy,hit:false});
      this.grid.set(x+xx,y+yy,CELL.CONSTRUCTION);
    }
    this.grid.buildings.push(b);
    this.money-=def.cost;
    this.constructedBuildings++;
    if(this.constructedBuildings===1){this.belowZeroSince=now;this.energyBelowZero=true;}
    return true;
  }
  constructionMs(b){
    // PowerPlant overrides Building.update() and always uses its raw construction time.
    if(b.def.specialBuildTiming)return b.def.build*1000;
    // Commercial overrides Building.update() only when acceleration > 0, suppressing acceleration.
    if(b.def.specialPositiveAccelerationTiming&&this.acceleration>0)return b.def.build*1000;
    return b.def.build*1000-10*b.def.build*this.acceleration;
  }
  productionMs(b){return b.def.production*1000-10*b.def.production*this.acceleration;}
  updateBuildings(now){
    for(const b of this.grid.buildings){
      if(b.destroyed)continue;
      // Historical Building.update() checks the production clock FIRST, even while
      // the building is still under construction. A due production clock is reset,
      // but ammo is awarded only if the state was already operational.
      if(!b.def.specialBuildTiming&&b.def.production>0){
        const prodMs=this.productionMs(b);
        if(now-b.updatedAt>=prodMs){
          b.updatedAt=now;
          if(b.state==='operational'&&this.energy>0)this.ammo[b.def.produces]++;
        }
      }
      if(b.state==='construction'&&now-b.createdAt>=this.constructionMs(b)){
        b.state='operational';
        b.cells.forEach((c,i)=>this.grid.set(c.x,c.y,c.hit?CELL.BURNING:(b.def.cellTypes?.[i]??b.def.id)));
      }
    }
  }
  checkLoss(now){
    if(this.lost)return true;
    if(this.energyBelowZero&&this.energy<=0&&this.constructedBuildings>0){
      if(this.belowZeroSince+CONFIG.maxBelowZeroSeconds*1000<now)this.lost=true;
      else {
        const need=Math.ceil((-this.energy)/10);
        this.lost=this.money<need*CONFIG.buildings.powerPlant.cost;
      }
    }
    return this.lost;
  }
}
