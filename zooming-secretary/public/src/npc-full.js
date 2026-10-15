/* SPDX-License-Identifier: GPL-3.0-or-later */
import { DIR } from './npc.js';
import { manBoxContact, dibrovContact, tickGhost } from './npc.js';

export function makeNpc(def, rng) {
  if (!def) return null;
  const npc = {
    type:def.type,
    x:def.x,
    y:def.y,
    dir:rng.rand8() < 128 ? DIR.LEFT : DIR.RIGHT,
    counter:0,
    wait:0,
    speed:0,
    dx:0,
    dy:0
  };
  if (def.type === 'chief' || def.type === 'chatter') {
    npc.dir = DIR.NONE;
    npc.counter = 20;
  }
  if (def.type === 'chief') npc.ty = 240;
  if (def.type === 'dibrov') npc.speed = 1;
  if (def.type === 'ghost') {
    npc.xFp = 16 << 4;
    npc.yFp = 240 << 4;
    npc.x = 16;
    npc.y = 240;
    npc.counter = 50;
    npc.wait = 150;
  }
  return npc;
}

function closeSameFloor(player, npc, xRange) {
  const px = player.xFp >> 4, py = player.yFp >> 4;
  return py === npc.y && Math.abs(px - npc.x) < xRange;
}

export function tickNpc(npc, player, map, rng, frameCnt, topicsActive, events = [], sideFloors = null, hearts = null) {
  if (!npc) return events;
  // hearts_add(): two numbers from the generator when a heart slot is free (see hearts.js). Without a Hearts object (the unit tests of the
  // single NPC rules) it is taken that one is.
  const addHeart = () => { if (hearts) hearts.add(rng); else { rng.rand8(); rng.rand8(); } };
  const px = player.xFp >> 4;
  const py = player.yFp >> 4;

  switch (npc.type) {
    case 'chief': {
      const verticallyNear = !(npc.y >= py + 16 || npc.y + 24 < py + 8);
      // cc65 compares `(px-32)>=(player_px+16)` as unsigned 16-bit numbers (the generated code branches on the carry): with the Chief
      // left of x = 32 the difference wraps to a large number, the test is true, and he is never near enough to slow the player.
      const horizontallyNear = !(npc.x < 32 || (npc.x - 32) >= px + 16 || (npc.x + 48) < px);
      if (verticallyNear && horizontallyNear) {
        player.slowdown = true;
        npc.dir = DIR.NONE;
        if (!npc.counter || npc.counter > 25) {
          npc.counter = 25;
          // These two rand8 calls only position the original speech bubble, but
          // they are gameplay-significant because they advance the shared RNG.
          npc.tx = npc.x - 8 + (rng.rand8() & 15);
          npc.ty = npc.y - 12 + (rng.rand8() & 3);
        } else {
          npc.counter--;
          if (npc.counter < 10) npc.ty = 240;
        }
        events.push({type:'CHIEF_TALK'});
        return events;
      }

      npc.ty = 240;
      if (npc.counter) {
        switch (npc.dir) {
          case DIR.LEFT:
            npc.x--;
            if (npc.x < 9) {
              npc.dir = DIR.RIGHT;
              npc.counter = 64 + (rng.rand8() & 31);
            }
            break;
          case DIR.RIGHT:
            npc.x++;
            if (npc.x > 231) {
              npc.dir = DIR.LEFT;
              npc.counter = 64 + (rng.rand8() & 31);
            }
            break;
          default:
            // Sprite-facing choice in source. No visual state is needed in the
            // headless core, but the RNG consumption is mandatory for parity.
            if (!(npc.counter & 15)) rng.rand8();
            break;
        }
        npc.counter--;
      } else {
        if (npc.dir) {
          npc.dir = DIR.NONE;
        } else {
          if (npc.x < 64) npc.dir = DIR.RIGHT;
          if (npc.x > 192) npc.dir = DIR.LEFT;
          if (!npc.dir) npc.dir = 1 + (rng.rand8() & 1);
        }
        npc.counter = 64 + (rng.rand8() & 31);
      }
      break;
    }

    case 'bouncer': {
      // Source resolves player/NPC collision before the NPC movement step.
      if (!player.ladder && py === npc.y) {
        if (px + 8 < npc.x + 8) {
          if (px + 16 >= npc.x + 8) {
            player.xFp = (npc.x + 8 - 16) << 4;
            if (player.xFp < 0) player.xFp = 240 << 4;
            if (player.xFp > (240 << 4)) player.xFp = 0;
          }
        } else if (px < npc.x + 8) {
          player.xFp = (npc.x + 8) << 4;
          if (player.xFp < 0) player.xFp = 240 << 4;
          if (player.xFp > (240 << 4)) player.xFp = 0;
        }
      }
      if (frameCnt & 3) return events;
      if (npc.dir === DIR.LEFT) { npc.x--; if (npc.x < 9) npc.dir = DIR.RIGHT; }
      else if (npc.dir === DIR.RIGHT) { npc.x++; if (npc.x > 231) npc.dir = DIR.LEFT; }
      break;
    }

    case 'chatter': {
      if (npc.wait) {
        if (npc.counter) npc.counter--;
        else npc.wait--;
        return events;
      }

      if (py === npc.y) {
        const close = !((npc.x - 16) >= px + 16 || (npc.x + 32) < px);
        if (close) {
          player.topic = rng.rand8() % topicsActive;
          npc.dir = DIR.NONE;
          npc.wait = 100;
          npc.counter = 50;
          events.push({type:'CHATTER_TOPIC', topic:player.topic});
          return events;
        }
        npc.dir = px < npc.x ? DIR.LEFT : DIR.RIGHT;
      } else if (frameCnt & 1) {
        return events;
      }

      if (npc.counter) {
        switch (npc.dir) {
          case DIR.LEFT:
            npc.x--;
            if (npc.x < 9) {
              npc.dir = DIR.RIGHT;
              npc.counter = 25 + (rng.rand8() & 31);
            }
            break;
          case DIR.RIGHT:
            npc.x++;
            if (npc.x > 231) {
              npc.dir = DIR.LEFT;
              npc.counter = 25 + (rng.rand8() & 31);
            }
            break;
          default:
            // Source picks an idle sprite using RNG every 32 counter values.
            if (!(npc.counter & 31)) rng.rand8();
            break;
        }
        npc.counter--;
      } else {
        if (npc.dir) {
          npc.dir = DIR.NONE;
        } else {
          if (npc.x < 64) npc.dir = DIR.RIGHT;
          if (npc.x > 192) npc.dir = DIR.LEFT;
          if (!npc.dir) npc.dir = 1 + (rng.rand8() & 1);
        }
        npc.counter = 25 + (rng.rand8() & 31);
      }
      break;
    }

    case 'geek': {
      if (!player.ladder && closeSameFloor(player,npc,64)) {
        if (px + 8 < npc.x + 8 && npc.dir === DIR.LEFT) {
          if (px + 16 >= npc.x + 8 && player.dir === DIR.RIGHT) {
            player.xFp = (npc.x + 8 - 16) << 4;
            if (player.xFp < 0) player.xFp = 240 << 4;
            if (player.xFp > (240 << 4)) player.xFp = 0;
            if (frameCnt & 1 && npc.x < 240) npc.x++;
          }
          if (!(frameCnt & 31)) addHeart();
          return events;
        }
        if (px + 8 > npc.x + 8 && npc.dir === DIR.RIGHT) {
          if (px < npc.x + 8 && player.dir === DIR.LEFT) {
            player.xFp = (npc.x + 8) << 4;
            if (player.xFp < 0) player.xFp = 240 << 4;
            if (player.xFp > (240 << 4)) player.xFp = 0;
            if (frameCnt & 1 && npc.x > 0) npc.x--;
          }
          if (!(frameCnt & 31)) addHeart();
          return events;
        }
      }
      if (frameCnt & 1) return events;
      if (npc.dir === DIR.LEFT) { npc.x--; if (npc.x < 9) npc.dir = DIR.RIGHT; }
      else if (npc.dir === DIR.RIGHT) { npc.x++; if (npc.x > 231) npc.dir = DIR.LEFT; }
      break;
    }

    case 'manbox': {
      // Source waits before collision/movement when npc_cnt is active.
      if (npc.counter) { npc.counter--; return events; }
      const before = player.knocked;
      manBoxContact({npc,player:{
        get x(){return player.xFp>>4;}, get y(){return player.yFp>>4;},
        get knocked(){return player.knocked;}, set knocked(v){player.knocked=v;},
        get knockedAnim(){return player.knockedAnim;}, set knockedAnim(v){player.knockedAnim=v;}
      }});
      if (!before && player.knocked) events.push({type:'KNOCK'});
      if (frameCnt & 1) return events;

      if (npc.dir === DIR.LEFT) {
        npc.x--;
        if (npc.x < -7) {
          npc.x = -8; npc.dir=DIR.RIGHT; npc.counter=50;
          const floors=sideFloors?.left || []; if (floors.length) npc.y=floors[rng.rand8()%floors.length];
        } else if (!map.isSupportAt(npc.x + 3, npc.y + 24)) {
          npc.dir = DIR.RIGHT;
        }
      } else if (npc.dir === DIR.RIGHT) {
        npc.x++;
        if (npc.x >= 248) {
          npc.x=248; npc.dir=DIR.LEFT; npc.counter=50;
          const floors=sideFloors?.right || []; if (floors.length) npc.y=floors[rng.rand8()%floors.length];
        } else if (!map.isSupportAt(npc.x + 12, npc.y + 24)) {
          npc.dir = DIR.LEFT;
        }
      }
      break;
    }

    case 'dibrov': {
      // Source also applies npc_cnt before contact/wisdom checks.
      if (npc.counter) { npc.counter--; return events; }
      const before = player.wisdom;
      dibrovContact({npc,player:{
        get x(){return player.xFp>>4;}, get y(){return player.yFp>>4;},
        get wisdom(){return player.wisdom;}, set wisdom(v){player.wisdom=v;}
      }});
      if (!before && player.wisdom) {
        events.push({type:'WISDOM'});
        // Two hearts are spawned immediately; hearts_add consumes two rand8 calls each.
        addHeart(); addHeart();
      }

      if (py === npc.y) { npc.speed=2; npc.dir = px < npc.x ? DIR.RIGHT : DIR.LEFT; }
      else { npc.speed=1; if (Math.abs(px-npc.x)<64) npc.dir = px < npc.x ? DIR.RIGHT : DIR.LEFT; }
      if (npc.speed < 2 && (frameCnt & 1)) return events;
      const step = npc.speed === 2 && (frameCnt & 1) ? 1 : npc.speed;
      npc.x += npc.dir === DIR.LEFT ? -step : step;
      if (npc.x >= 248 || npc.x < -7) {
        npc.counter = player.wisdom ? player.wisdom + 25 : 25;
        if (px < 128) {
          npc.x=248; npc.dir=DIR.LEFT; const floors=sideFloors?.right || []; if(floors.length) npc.y=floors[rng.rand8()%floors.length];
        } else {
          npc.x=-8; npc.dir=DIR.RIGHT; const floors=sideFloors?.left || []; if(floors.length) npc.y=floors[rng.rand8()%floors.length];
        }
      }
      break;
    }

    case 'ghost': {
      const r = tickGhost(npc, {xFp:player.xFp,yFp:player.yFp});
      npc.x = npc.xFp >> 4; npc.y = npc.yFp >> 4;
      if (r.caught) { player.caught=true; events.push({type:'GHOST_CAUGHT'}); }
      break;
    }
  }
  return events;
}
