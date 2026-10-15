/* SPDX-License-Identifier: GPL-3.0-or-later */
import { Rng8 } from './rng.js';
import { BUTTON, InputState, PadPoll, maskFrom } from './input.js';
import { makePlayer, tickPlayerMotion, updatePlayerSpeed } from './player.js';
import { processTopics, processCoffee, phoneOverlap } from './interactions.js';
import { tickNpc } from './npc-full.js';
import { initializeStageEntities, TOPIC_MESSAGE_COUNTS } from './source-init.js';
import { Hearts } from './hearts.js';

export class Simulation {
  // `padPolled` is what the pad read at the program's last poll before the stage said (START, if the player came from a screen that is left
  // with START): a START that is still down when the stage begins is not a new press.
  constructor(stage, { seed = 1, padPolled = 0 } = {}) {
    this.stage = stage.clone ? stage.clone() : stage;
    this.rng = new Rng8(seed);
    this.input = new InputState();
    this.pad = new PadPoll(padPolled);
    this.lastMask = 0;
    this.pause = 0;
    this.tickCount = 0;
    this.frameCnt = 0;
    this.ringCnt = 0;
    this.status = 'PLAYING';
    this.events = [];

    this.player = makePlayer(this.stage.spawn.x, this.stage.spawn.y);
    this.coffee = this.stage.coffee ? { ...this.stage.coffee, wait:150 } : null;
    this.sideFloors = this.stage.map.discoverSideFloors();
    this.hearts = new Hearts();

    // v1.02 initializes phone/NPC/topic RNG in row-major source scan order.
    const initialized = initializeStageEntities(this.stage, this.rng);
    this.phones = initialized.phones;
    this.topics = initialized.topics;
    this.npc = initialized.npc;
    this.sourceOrderedInit = initialized.sourceOrdered;

    this.missLimit = this.stage.missLimit;
    this.tableCurrent = this.stage.bonus && this.stage.tables.length ? Math.min(5,this.stage.tables.length-1) : 0;
    this.phoneRunawayMax = 5;
    this.phoneRunaway = this.phoneRunawayMax;
    if (this.stage.bonus && this.stage.tables.length && this.phones.phones[0]) {
      const p = this.stage.tables[this.tableCurrent];
      this.phones.phones[0].x=p.x; this.phones.phones[0].y=p.y;
    }
  }

  emit(type, detail={}) { const e={tick:this.tickCount,type,...detail}; this.events.push(e); return e; }

  processDreamRunaway(events=this.events) {
    if (!this.stage.bonus || !this.stage.tables.length || !this.phones.phones[0]) return;
    if (this.phoneRunaway) { this.phoneRunaway--; return; }
    const p = this.phones.phones[0];
    const px=this.player.xFp>>4, py=this.player.yFp>>4;
    if (py === p.y - 8 && !((px+32) < (p.x-16) || px > (p.x+40))) {
      let next=this.tableCurrent, guard=64;
      while (next===this.tableCurrent && guard-- > 0) next=this.rng.rand8()%this.stage.tables.length;
      this.tableCurrent=next;
      const pos=this.stage.tables[next]; p.x=pos.x; p.y=pos.y;
      if (this.phoneRunawayMax < 250) this.phoneRunawayMax += 10;
      this.phoneRunaway=this.phoneRunawayMax;
      events.push({type:'PHONE_TELEPORT',table:next});
    }
  }

  phoneAttempts() {
    const attempts=[];
    for(let id=0; id<this.phones.phones.length; id++) {
      const p=this.phones.phones[id];
      if (!p) continue;
      if (phoneOverlap(this.player,p)) attempts.push({id,playerTopic:this.player.topic,wisdom:this.player.wisdom,overlap:true});
    }
    return attempts;
  }

  // One pass of game_loop. The program's pause is START: the pass that reads it does nothing else, and then the loop goes round without
  // counting a frame (`pause` 50 down to 25) and waits for START again (at 25) with a read of the pad of its own, which sees the pad as it
  // was left at the end of the pass before; a START that ends the pause is followed by 24 passes in which START does nothing.
  tick(input={}) {
    if (this.status !== 'PLAYING') return [];
    const mask=maskFrom(input), before=this.lastMask;
    this.lastMask=mask;
    const out=[];
    this.events=[];

    if (this.pause===25) {
      if (this.pad.poll(before) & BUTTON.START) { this.pause=24; out.push({type:'RESUME'}); }
    } else if (this.pause) this.pause--;
    if (this.pause>=25) return this.endTick(out);

    this.input.sample(input);

    // game.c increments frame_cnt before movement/interaction processing.
    this.frameCnt=(this.frameCnt+1)&0xff;
    this.ringCnt=(this.ringCnt+1)&0xffff;

    if ((this.pad.poll(mask) & BUTTON.START) && !this.pause) { this.pause=50; out.push({type:'PAUSE'}); return this.endTick(out); }

    // 1) Player movement uses the speed computed by previous ticks.
    tickPlayerMotion(this.player,this.stage.map,this.input,out);
    if (this.player.answerTicks) this.player.answerTicks--;

    // 2) Coffee state/overlap.
    processCoffee(this.player,this.coffee,out);

    // 3) Speed target uses player_slowdown left by the PREVIOUS NPC phase.
    updatePlayerSpeed(this.player,this.frameCnt);

    // 4) Dream wisdom, then common decrement.
    if (this.stage.bonus) this.player.wisdom=100;
    if (this.player.wisdom) this.player.wisdom--;

    // 5) Cabinet interaction happens before phones and before this tick's NPC move.
    processTopics(this.player,this.topics,out);

    // 6) Dream runaway movement, then phone processing.
    this.processDreamRunaway(out);
    const pe=this.phones.tick({
      attempts:this.phoneAttempts(),
      onAnswer: () => {
        if (this.stage.bonus) return;
        this.player.answerTicks=25;
        // Source order: phone_reset(answer=1) consumes one RNG value, then the
        // displayed factoid index advances using a second rand8() immediately.
        const step = 1 + (this.rng.rand8() & 3);
        if (this.player.topic >= 0 && this.player.topic < TOPIC_MESSAGE_COUNTS.length) {
          const topic=this.topics.find(t=>t.id===this.player.topic);
          if (topic) topic.messageIndex=(topic.messageIndex + step) % TOPIC_MESSAGE_COUNTS[this.player.topic];
        } else {
          // The NES source can index topic_msg[255] when wisdom answers before any
          // cabinet pickup. Consume RNG for parity, but do not reproduce unsafe memory access.
          out.push({type:'SAFE_DIVERGENCE_WISDOM_TOPIC_NONE'});
        }
      }
    });
    if (pe.some(e=>e.type==='RING_START')) this.ringCnt=0;
    for(const e of pe) out.push(e);

    // 7) NPC phase is AFTER phones in v1.02. Chief/other NPC effects therefore
    // influence subsequent processing exactly as the source loop does.
    this.player.slowdown=false;
    tickNpc(this.npc,this.player,this.stage.map,this.rng,this.frameCnt,this.stage.topicsActive,out,this.sideFloors,this.hearts);

    // Source spawns one decorative heart every 8 frames while non-bonus wisdom is active, and then moves half of the hearts.
    // The graphics are not modeled, but hearts_add consumes two shared-RNG calls when it finds a free slot.
    if (this.player.wisdom && !this.stage.bonus && !(this.frameCnt & 7)) this.hearts.add(this.rng);
    this.hearts.update(this.frameCnt);

    // 8) Source checks clear/lose/catch after the rest of the gameplay frame.
    if (this.stage.bonus && this.phones.callsCount >= this.stage.targetCalls) {
      this.status='WON'; out.push({type:'STAGE_WON',bonus:true});
    } else if (this.phones.callsCount >= this.stage.targetCalls) {
      this.status='WON'; out.push({type:'STAGE_WON'});
    } else if (this.phones.callsMissed >= this.missLimit) {
      this.status='LOST'; out.push({type:'STAGE_LOST'});
    } else if (this.player.caught && this.stage.bonus) {
      this.status='DREAM_CAUGHT'; out.push({type:'DREAM_CAUGHT'});
    }

    return this.endTick(out);
  }

  endTick(out) {
    this.tickCount++;
    this.events=out.map(e => e.tick===undefined ? {tick:this.tickCount-1,...e} : e);
    return this.events;
  }

  snapshot() {
    return {
      tick:this.tickCount,
      frameCnt:this.frameCnt,
      ringCnt:this.ringCnt,
      status:this.status,
      pause:this.pause,
      rng:this.rng.state,
      missLimit:this.missLimit,
      sourceOrderedInit:this.sourceOrderedInit,
      player:{...this.player},
      coffee:this.coffee?{...this.coffee}:null,
      topics:this.topics.map(t=>({...t})),
      phones:this.phones.snapshot(),
      npc:this.npc?{...this.npc}:null,
      phoneRunaway:this.phoneRunaway,
      phoneRunawayMax:this.phoneRunawayMax,
      tableCurrent:this.tableCurrent,
      hearts:this.hearts.snapshot(),
      sideFloors:{left:[...this.sideFloors.left],right:[...this.sideFloors.right]}
    };
  }
}

export function runSimulation(stage, script, {seed=1, ticks=1000}={}) {
  const sim=new Simulation(stage,{seed});
  const trace=[];
  for(let t=0;t<ticks && sim.status==='PLAYING';t++) {
    const input=script?.[t] || {};
    const events=sim.tick(input);
    if(events.length || (t%100)===0) trace.push({tick:t,events,snapshot:sim.snapshot()});
  }
  return {sim,trace};
}
