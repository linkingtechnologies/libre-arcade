// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

import {CONFIG} from '../core/config.js'; import {fireWeapon} from '../core/combat.js';
export const AI_LEVELS=['Easy','Medium','Hard','Madness'];
const MILITARY=['missileSilo','factory','airField','nukeSilo'];
export class HistoricalAI {
 constructor(player,level=0,fresh){this.player=player;this.level=level;this.fresh=fresh;this.turn=0;}
 tick(game,now){ this.turn++; if(this.turn===1)this.buildDecision(now); else if(this.turn>=5)this.turn=0; if(now>=this.player.cannotFireBefore){for(const w of ['missile','mortar','aircraft','nuke'])if(this.player.ammo[w]>0)this.randomFire(game,w,now);} }
 count(key){return this.player.grid.buildings.filter(b=>b.key===key&&!b.destroyed).length}
 buildDecision(now){const p=this.player,bs=p.grid.buildings.filter(b=>!b.destroyed),buildingCount=bs.length,power=this.count('powerPlant'),commercial=this.count('commercial'); if(p.money>CONFIG.buildings.powerPlant.cost*(buildingCount-power+1)&&p.energy>6){ if(commercial<this.level*2)this.randomBuild('commercial',now); else this.randomBuild(MILITARY[this.level],now); } else if(p.money>CONFIG.buildings.powerPlant.cost+CONFIG.buildings.commercial.cost&&commercial<2)this.randomBuild('commercial',now); else if(p.energy<=6&&p.money>CONFIG.buildings.powerPlant.cost&&commercial>1)this.randomBuild('powerPlant',now); else if(p.energy<=0&&(power*10)-buildingCount<=0)this.randomBuild('powerPlant',now); }
 randomBuild(key,now){const d=CONFIG.buildings[key],rng=this.fresh();let x=rng.nextInt(30),y=rng.nextInt(30),tries=0;while(!this.player.grid.freeGrass(x,y,d.w,d.h)&&tries<10){x=rng.nextInt(30);y=rng.nextInt(30);tries++;}return this.player.build(key,x,y,now);}
 // AIPlayer.getRandomPlayerIndexButNotSelf(): the opponent is chosen with a generator of its own.
 randomOpponent(game){const rng=this.fresh(),n=game.players.length;let result=0;if(n>1){result=rng.nextInt(n);while(result===this.player.index)result=rng.nextInt(n);}return game.players[result];}
 randomFire(game,key,now){const targets=game.players.filter(p=>p!==this.player);if(!targets.length)return false;const rng=this.fresh();let x=rng.nextInt(30),y=rng.nextInt(30),tries=0;const t=this.randomOpponent(game);while(t.status[y][x]===0&&tries<10){x=rng.nextInt(30);y=rng.nextInt(30);tries++;}return fireWeapon(this.player,t,key,x,y,now);}
}
