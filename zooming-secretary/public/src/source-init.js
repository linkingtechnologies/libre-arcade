/*
 * Zooming Secretary M11 source-order initializer
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { PhoneSystem, PHONE } from './phone.js';
import { makeNpc } from './npc-full.js';

export const TOPIC_MESSAGE_COUNTS = Object.freeze([9, 9, 10, 20]);

export function binaryFactoidIndex(rawRand, count, staleXHigh = 0x06) {
  return (((staleXHigh & 0xff) << 8) | (rawRand & 0xff)) % count;
}

function hasScanIndex(v) { return v && Number.isInteger(v.scanIndex); }

export function initializeStageEntities(stage, rng) {
  const topics = stage.topics.map(t => ({ ...t, messageIndex: t.messageIndex ?? null }));
  let npc = null;
  const phones = new PhoneSystem({
    rng,
    callDelay:stage.callDelay,
    topicsActive:stage.topicsActive,
    phoneCount:stage.phones.length || (stage.bonus ? 1 : 0),
    bonus:stage.bonus
  });

  const geometry = stage.phones.map(p => ({
    level:PHONE.IDLE, counter:0, topic:null, x:p.x, y:p.y
  }));
  if (!geometry.length && stage.bonus) geometry.push({level:PHONE.IDLE,counter:0,topic:null,x:0,y:0});
  phones.phones = geometry;

  const sourceOrdered = stage.sourceOrderedInit || (
    [...stage.phones, ...stage.topics, ...(stage.npc ? [stage.npc] : [])].some(hasScanIndex)
  );

  if (sourceOrdered) {
    const ops = [];
    stage.phones.forEach((p,id) => {
      if (hasScanIndex(p)) ops.push({kind:'phone',scanIndex:p.scanIndex,id,p});
    });
    topics.forEach((t,id) => {
      if (hasScanIndex(t)) ops.push({kind:'topic',scanIndex:t.scanIndex,id,t});
    });
    if (hasScanIndex(stage.npc)) ops.push({kind:'npc',scanIndex:stage.npc.scanIndex,def:stage.npc});
    ops.sort((a,b)=>a.scanIndex-b.scanIndex);

    for (const op of ops) {
      if (op.kind === 'phone') {
        const delay = Number.isInteger(op.p.initDelay) ? op.p.initDelay : (op.id << 8);
        phones.resetPhone(op.id, delay, false);
      } else if (op.kind === 'topic') {
        const count = op.t.messageCount ?? TOPIC_MESSAGE_COUNTS[op.t.id];
        // v1.02 binary quirk: `_rand8` returns only A and leaves X untouched.
        // The cc65-generated promotion used by `rand8() % topicMessagesCount[id]`
        // pushes AX after X still contains $06 (high byte of topic_msg's address).
        // The ROM therefore computes ($0600 | rand8()) % count, not rand8() % count.
        // This affects factoid selection (counts 9/10/20) but not phone topics (2/3/4).
        op.t.messageIndex = binaryFactoidIndex(rng.rand8(), count);
      } else if (op.kind === 'npc') {
        npc = makeNpc(op.def, rng);
      }
    }

    return { phones, topics, npc, sourceOrdered:true };
  }

  // Legacy/synthetic M10 path: retained so clean-room unit fixtures do not need
  // archaeology-only scan metadata.
  npc = makeNpc(stage.npc, rng);
  if (stage.bonus) phones.initializeDreamPhone();
  else phones.initializeNormalPhones(stage.phones.length);
  for (let i=0;i<phones.phones.length;i++) {
    const pos=stage.phones[i] || stage.phones[0] || {x:0,y:0};
    phones.phones[i].x=pos.x; phones.phones[i].y=pos.y;
  }
  return { phones, topics, npc, sourceOrdered:false };
}
