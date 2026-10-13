// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

import {CONFIG} from './config.js';
import {CELL} from './grid.js';
export const STATUS={WATER:0,GROUND:1,BUILDING_HIT:2,BUILDING_DESTROYED:3,DISCOVERED:4,CELL_HIT:-1};
export function weaponCooldownMs(key,acceleration){ const w=CONFIG.weapons[key]; return 1000*w.w*w.h-acceleration*(10*w.w*w.h); }
export function fireWeapon(attacker,target,key,x,y,now){
  const w=CONFIG.weapons[key]; if(!w)return false;
  // The handset vibrates for the area of the weapon, in tenths of a second, when the person fires (LocalPlayer.fireOnAnotherPlayer and
  // fire(), before anything is checked, so for a shot that does not come off too), and when the computer's shot lands on the person's city.
  const game=attacker.game,vibration=w.w*w.h*100;
  if(attacker.index===0&&game)game.vibrate(vibration);
  if(attacker.ammo[key]<=0)return false;
  const selfTarget=key==='shield'; const board=selfTarget?attacker.grid:target?.grid;
  if(!board||x<0||y<0||x+w.w>board.w||y+w.h>board.h)return false;
  // Historical shield placement calls Player.fire() on self, not
  // fireOnAnotherPlayer(): it consumes ammo but DOES NOT set reuse delay.
  if(key==='shield'){
    attacker.ammo[key]--;
    return applyShield(attacker,x,y,now);
  }
  if(now<attacker.cannotFireBefore)return false;
  attacker.ammo[key]--;
  attacker.cannotFireBefore=now+weaponCooldownMs(key,attacker.acceleration);
  if(attacker.index!==0&&target.index===0&&game)game.vibrate(vibration);
  if(key==='spy')return applySpy(attacker,target,x,y);
  for(let yy=y;yy<y+w.h;yy++)for(let xx=x;xx<x+w.w;xx++)hitCell(attacker,target,xx,yy);
  return true;
}
// StatusGrid.update() adds the score with a command to "the other player" of the one hit, and Commander.execute() only applies a
// score to the local player (player 0). So the person scores for what they hit in the computer's city, and nobody scores for anything else:
// the computer, which hits the person's city, never scores.
function scoreFor(attacker,target,points){if(attacker.index===0&&target.index!==0)attacker.score+=points;}
// In the original a shielded cell is stored in the grid as its type, negated, until the player's next pass finds the shield over
// (now > end) and puts the type back. The port does the same.
export function isShielded(target,x,y){ return target.grid.get(x,y)<0; }
export function hitCell(attacker,target,x,y){
  // Water produces no COMMAND_HIT at all in Weapon.makeEffect().
  if(target.grid.get(x,y)===CELL.WATER)return {kind:'water'};
  // Weapon.makeEffect() changes every non-water, non-shielded target cell to
  // CELL_EXPLOSION_1. GridView then advances 30→31→32→33→34→28 one frame
  // at a time while CITY mode is rendered. This odd render-driven state change
  // is part of MilCity 1.0.5 and also leaves permanent craters that block builds.
  // Historical negative grid cell: generic Weapon sees non-water but type <= 0,
  // emits BUILDING_NULL HIT -> attacker sees a miss.
  if(isShielded(target,x,y)){attacker.status[y][x]=STATUS.CELL_HIT;return {kind:'shield-miss'};}
  target.grid.set(x,y,CELL.EXPLOSION_1);
  let found=null;
  // Deliberately include already-destroyed buildings. The Java 1.0.5 code does,
  // producing a repeat-hit scoring quirk on a destroyed cell (documented in M4).
  for(const b of target.grid.buildings){const c=b.cells.find(c=>c.x===x&&c.y===y);if(c){found={b,c};break;}}
  if(!found){attacker.status[y][x]=STATUS.CELL_HIT;return {kind:'miss'};}
  // COMMAND_HIT scores if status is not already BUILDING_HIT. A destroyed status
  // therefore becomes HIT and scores again when that same cell is attacked later.
  if(attacker.status[y][x]!==STATUS.BUILDING_HIT){attacker.status[y][x]=STATUS.BUILDING_HIT;scoreFor(attacker,target,10);}
  found.c.hit=true;
  if(found.b.cells.every(c=>c.hit)){
    const wasDestroyed=found.b.destroyed;
    found.b.destroyed=true;found.b.state='destroyed';
    for(const c of found.b.cells){
      if(attacker.status[c.y][c.x]!==STATUS.BUILDING_DESTROYED){attacker.status[c.y][c.x]=STATUS.BUILDING_DESTROYED;scoreFor(attacker,target,10);}
    }
    return {kind:wasDestroyed?'rehit-destroyed':'destroyed',building:found.b};
  }
  return {kind:'hit',building:found.b};
}
export function applyShield(player,x,y,now){
  const w=CONFIG.weapons.shield;
  for(let yy=y;yy<y+w.h;yy++)for(let xx=x;xx<x+w.w;xx++){
    const cell=player.grid.get(xx,yy);
    // Applying another shield over a shielded cell fails the `type > 0` guard: no refresh.
    if(cell>0&&cell!==CELL.WATER&&cell!==5){player.grid.set(xx,yy,-cell);player.grid.shields.push({x:xx,y:yy,type:cell,until:now+60000});}
  }
  return true;
}
export function applySpy(attacker,target,x,y){
  const w=CONFIG.weapons.spy;
  for(let yy=y;yy<y+w.h;yy++)for(let xx=x;xx<x+w.w;xx++){
    const shielded=isShielded(target,xx,yy), cell=target.grid.get(xx,yy);
    if(shielded||(cell>=CELL.CONSTRUCTION&&cell<28))
      if(attacker.status[yy][xx]!==STATUS.BUILDING_HIT&&attacker.status[yy][xx]!==STATUS.BUILDING_DESTROYED)attacker.status[yy][xx]=STATUS.DISCOVERED;
  }
  return true;
}
export function expireShields(player,now){
  const kept=[];
  for(const s of player.grid.shields){if(now>s.until)player.grid.set(s.x,s.y,s.type);else kept.push(s);}
  player.grid.shields=kept;
}
