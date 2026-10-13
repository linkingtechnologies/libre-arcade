// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

import {CONFIG} from '../core/config.js';
import {fireWeapon} from '../core/combat.js';

export const CITY_ACTIONS=['powerPlant','commercial','house','missileSilo','factory','airField','laboratory','shieldGenerator','nukeSilo','shield'];
export const MIL_ACTIONS=['missile','mortar','aircraft','nuke','spy'];
export const UI_NAME={powerPlant:'Power Plant',commercial:'Commercial',house:'House',missileSilo:'Missile Silo',factory:'Factory',airField:'Air Field',laboratory:'Laboratory',shieldGenerator:'Shield Generator',nukeSilo:'Nuke Silo',shield:'Shield',missile:'Missile',mortar:'Mortar',aircraft:'Aircraft',nuke:'Nuke',spy:'Spy'};

export class M5Controller{
  constructor(game){this.game=game;this.mode=-1;this.cityAction=0;this.militaryAction=0;this.x=0;this.y=0;}
  human(){return this.game.players[0]}
  target(){return this.mode<0?this.human():this.game.players[this.mode]}
  actions(){return this.mode<0?CITY_ACTIONS:MIL_ACTIONS}
  actionIndex(){return this.mode<0?this.cityAction:this.militaryAction}
  actionKey(){return this.actions()[this.actionIndex()]}
  actionName(){return UI_NAME[this.actionKey()]||this.actionKey()}
  footprint(){const k=this.actionKey(); return this.mode<0?(k==='shield'?CONFIG.weapons.shield:CONFIG.buildings[k]):CONFIG.weapons[k]}
  modeName(){return this.mode<0?'City':`Military(P${this.mode+1})`}
  setMode(mode){this.mode=mode;this.clampCursor();}
  setAction(key){const a=this.actions(),i=a.indexOf(key);if(i<0)return false;if(this.mode<0)this.cityAction=i;else this.militaryAction=i;this.clampCursor();return true;}
  cycleAction(delta){const a=this.actions();let i=(this.actionIndex()+delta)%a.length;if(i<0)i+=a.length;if(this.mode<0)this.cityAction=i;else this.militaryAction=i;this.clampCursor();}
  cycleMode(delta){const n=this.game.players.length;if(n<=1){this.mode=-1;return;}const modes=[-1,...Array.from({length:n},(_,i)=>i).filter(i=>i!==0)];let idx=modes.indexOf(this.mode);idx=(idx+delta)%modes.length;if(idx<0)idx+=modes.length;this.mode=modes[idx];this.clampCursor();}
  clampCursor(){const f=this.footprint();this.x=Math.max(0,Math.min(30-f.w,this.x));this.y=Math.max(0,Math.min(30-f.h,this.y));}
  move(dx,dy){this.x+=dx;this.y+=dy;this.clampCursor();}
  setCursor(x,y){this.x=x;this.y=y;this.clampCursor();}
  canPerform(now=this.game.time){const p=this.human(),k=this.actionKey();if(this.mode<0){if(k==='shield')return p.ammo.shield>0;const d=CONFIG.buildings[k];return p.canBuild(d,this.x,this.y);} const w=CONFIG.weapons[k];return !!w&&p.ammo[k]>0&&now>=p.cannotFireBefore&&this.x+w.w<=30&&this.y+w.h<=30;}
  perform(now=this.game.time){const p=this.human(),k=this.actionKey();if(!this.canPerform(now))return false;if(this.mode<0){return k==='shield'?fireWeapon(p,p,'shield',this.x,this.y,now):p.build(k,this.x,this.y,now);}return fireWeapon(p,this.target(),k,this.x,this.y,now);}
}
