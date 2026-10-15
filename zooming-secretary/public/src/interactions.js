/* SPDX-License-Identifier: GPL-3.0-or-later */

export function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return !(bx >= ax + aw || bx + bw < ax || by >= ay + ah || by + bh < ay);
}

export function processTopics(player, topics, events = []) {
  if (player.wisdom) return events;
  const px = player.xFp >> 4;
  const py = player.yFp >> 4;
  for (const topic of topics) {
    if (player.topic === topic.id) continue;
    // Matches source geometry: topic area is 12x8 vs player 16x24.
    if (overlaps(px, py, 16, 24, topic.x, topic.y, 12, 8)) {
      player.topic = topic.id;
      events.push({ type:'TOPIC', topic:topic.id });
      break;
    }
  }
  return events;
}

export function processCoffee(player, coffee, events = []) {
  if (!coffee) return events;
  if (coffee.wait > 0) {
    coffee.wait--;
    if (coffee.wait === 16) events.push({type:'COFFEE_READY'});
    return events;
  }
  const px = player.xFp >> 4;
  const py = player.yFp >> 4;
  if (overlaps(px, py, 16, 24, coffee.x, coffee.y, 8, 8)) {
    player.coffee = 20;
    coffee.wait = 20 * 50;
    events.push({type:'COFFEE_PICKUP'});
  }
  return events;
}

export function phoneOverlap(player, phone) {
  return overlaps(player.xFp >> 4, player.yFp >> 4, 16, 24, phone.x, phone.y, 8, 8);
}
