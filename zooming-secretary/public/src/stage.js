/* SPDX-License-Identifier: GPL-3.0-or-later */
import { StageMap } from './map.js';

export class StageDefinition {
  constructor({
    name,
    map,
    targetCalls,
    topicsActive,
    callDelay,
    spawn,
    phones = [],
    topics = [],
    coffee = null,
    npc = null,
    tables = [],
    bonus = false,
    missLimit = 3,
    sourceOrderedInit = false
  }) {
    if (!(map instanceof StageMap)) throw new TypeError('stage.map must be StageMap');
    if (!spawn) throw new Error('stage.spawn is required');
    this.name = name;
    this.map = map;
    this.targetCalls = targetCalls;
    this.topicsActive = topicsActive;
    this.callDelay = callDelay;
    this.spawn = { ...spawn };
    this.phones = phones.map(p => ({ ...p }));
    this.topics = topics.map(t => ({ ...t }));
    this.coffee = coffee ? { ...coffee } : null;
    this.npc = npc ? { ...npc } : null;
    this.tables = tables.map(t => ({ ...t }));
    this.bonus = bonus;
    this.missLimit = missLimit;
    this.sourceOrderedInit = !!sourceOrderedInit;
  }

  clone() {
    return new StageDefinition({
      name: this.name,
      map: this.map.clone(),
      targetCalls: this.targetCalls,
      topicsActive: this.topicsActive,
      callDelay: this.callDelay,
      spawn: this.spawn,
      phones: this.phones,
      topics: this.topics,
      coffee: this.coffee,
      npc: this.npc,
      tables: this.tables,
      bonus: this.bonus,
      missLimit: this.missLimit,
      sourceOrderedInit: this.sourceOrderedInit
    });
  }
}

// Adapter for redacted behavioural fixtures. For strict ROM shadow parity use
// scanIndex/sourceOrderedInit data produced by the private M11 extractor.
export function stageFromBehaviorFixture({ map, stage, entities, targetCalls, topicsActive, callDelay, bonus = false, missLimit = 3 }) {
  const scanIndexOf = e => Number.isInteger(e.scan_index)
    ? e.scan_index
    : (Number.isInteger(e.nametable_row) && Number.isInteger(e.tile_col)
      ? (e.nametable_row - 6) * 32 + e.tile_col : undefined);
  const spawnEntity = entities.find(e => e.type === 'player');
  if (!spawnEntity) throw new Error('behavior fixture has no player spawn');
  const phones = entities.filter(e => e.type === 'phone').map((e,id) => {
    const p={x:e.runtime_x,y:e.runtime_y};
    const si=scanIndexOf(e);
    if(Number.isInteger(si)){p.scanIndex=si;p.initDelay=id<<8;}
    return p;
  });
  const topics = entities.filter(e => e.type.startsWith('topic_')).map(e => {
    const t={x:e.runtime_x,y:e.runtime_y,id:({topic_earth:0,topic_history:1,topic_books:2,topic_space:3})[e.type]};
    const si=scanIndexOf(e); if(Number.isInteger(si)) t.scanIndex=si;
    return t;
  });
  const c = entities.find(e => e.type === 'coffee');
  const npc = entities.find(e => ['chief','bouncer','chatter','geek','manbox','dibrov','ghost'].includes(e.type));
  const tables = entities.filter(e=>e.type==='table').map(e=>({x:e.runtime_x,y:e.runtime_y,scanIndex:scanIndexOf(e)}));
  const hasScanOrder = [...phones,...topics,...(npc?[npc]:[])].every(e => Number.isInteger(e.scanIndex ?? scanIndexOf(e)));
  return new StageDefinition({
    name: stage,
    map,
    targetCalls,
    topicsActive,
    callDelay,
    spawn: { x:spawnEntity.runtime_x, y:spawnEntity.runtime_y },
    phones,
    topics,
    // M7 recorded the coffee marker tile Y. Source game.c uses py+1.
    coffee: c ? {x:c.runtime_x,y:c.runtime_y + 1,scanIndex:scanIndexOf(c)} : null,
    npc: npc ? {type:npc.type,x:npc.runtime_x,y:npc.runtime_y,scanIndex:scanIndexOf(npc)} : null,
    tables,
    bonus,
    missLimit,
    sourceOrderedInit: !bonus && hasScanOrder
  });
}
