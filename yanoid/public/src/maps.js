/* Faithful JavaScript rewrites of Yanoid 0.3.0 data/maps/map*.py. */

const I = Math.trunc;
const brick = (type, x, y, sprite, hit = 'basic') => ({ type, x: I(x), y: I(y), sprite, hit });
const staticRect = (x, y, w, h) => ({ type: 'static', x, y, w, h });
const hole = (x, y, w, h) => ({ type: 'hole', x, y, w, h });

function standardPlayField(entities) {
  entities.push(staticRect(-50, -50, 51, 700));
  entities.push(staticRect(799, -50, 51, 700));
  entities.push(staticRect(1, -10, 798, 11));
  entities.push(hole(1, 599, 798, 100));
}

function customPlayField(entities) {
  entities.push(staticRect(-10, -10, 11, 620));
  entities.push(staticRect(799, -10, 10, 620));
  entities.push(staticRect(1, -10, 798, 11));
  entities.push(hole(1, 550, 798, 50));
}

function finalize(name, entities, paddleX, ballX = 300, ballY = 400) {
  return { name, entities, paddle: { x: paddleX, y: 530 }, ball: { x: ballX, y: ballY } };
}

function map0() {
  const e = [];
  for (let y = 90; y < 250; y += 20) {
    e.push(brick('brick-stay', 335, 20 + y, 'gray_weird_48.png', 'stay'));
    e.push(brick('brick-stay', 420, y, 'gray_weird_48.png', 'stay'));
  }
  for (let x = 305; x > 0; x -= 50) e.push(brick('brick-stay', x, 90, 'gray_weird_48.png', 'stay'));
  for (let x = 449; x < 750; x += 50) e.push(brick('brick-stay', x, 250, 'gray_weird_48.png', 'stay'));
  for (let x = 480; x < 750; x += 78) for (let y = 100; y < 220; y += 28) {
    const row = y % 3;
    e.push(brick(row === 0 ? 'brick-stay-3' : 'brick', x, y,
      row === 0 ? 'red2_75.png' : row === 1 ? 'green2_75.png' : 'blue2_75.png'));
  }
  for (let x = 15; x < 305; x += 78) for (let y = 130; y < 250; y += 28) {
    const row = y % 3;
    e.push(brick(row === 0 ? 'brick-stay-3' : 'brick', x, y,
      row === 0 ? 'red2_75.png' : row === 1 ? 'green2_75.png' : 'blue2_75.png'));
  }
  customPlayField(e);
  return finalize('Tunnel to heaven - by JCD', e, 400);
}

function map1() {
  const e = [];
  for (let x = 6; x < 750; x += 79) for (let y = 91; y < 278; y += 29) {
    const row = y % 7;
    if (row === 0 || row === 6) e.push(brick('brick', x, y, 'blue2_75.png'));
    else if (row === 1 || row === 5) e.push(brick('brick', x, y, 'green2_75.png'));
    else if (row === 2 || row === 4) e.push(brick('brick', x, y, 'red2_75.png'));
    else e.push(brick('brick-stay-3', x, y, 'yellow_stay_75.png'));
  }
  standardPlayField(e);
  return finalize('Classic 1 - by MBD', e, 366);
}

function map2() {
  const e = [];
  for (let x = 340; x < 475; x += 75) for (let y = 170; y < 270; y += 25)
    e.push(brick('brick', x, y, 'red2_75.png'));
  const factor = Math.PI / 180;
  for (let t = 0; t < 360; t += 30) {
    const x = Math.cos(t * factor) * 1.7;
    const y = Math.sin(t * factor);
    e.push(brick('brick', 376 + x * 100, 212 + y * 100, 'red_75.png'));
    e.push(brick('brick', 376 + x * 150, 212 + y * 150, 'blue_75.png'));
    e.push(brick('brick', 376 + x * 200, 212 + y * 200, 'green_75.png'));
  }
  customPlayField(e);
  return finalize('Circular Paths - by MBD', e, 400);
}

function map3() {
  const e = [];
  for (let x = 1; x < 9; x++) {
    e.push(brick('brick', 400 - x * 40, 50 + x * 25, 'red2_75.png'));
    e.push(brick('brick', 400 + x * 40, 50 + x * 25, 'red2_75.png'));
    e.push(brick('brick-stay-3', 400 - x * 40, 150 + x * 25, 'gray_75.png'));
    e.push(brick('brick-stay-3', 400 + x * 40, 150 + x * 25, 'gray_75.png'));
  }
  e.push(brick('brick', 400, 50, 'red2_75.png'));
  e.push(brick('brick-stay-3', 400, 150, 'green2_75.png'));
  for (let x = 1; x < 3; x++) {
    e.push(brick('brick', 400 - x * 40, 250 + x * 25, 'blue2_75.png'));
    e.push(brick('brick', 400 + x * 40, 250 + x * 25, 'blue2_75.png'));
  }
  e.push(brick('brick', 400, 250, 'blue2_75.png'));
  for (let x = -3; x < 4; x++) e.push(brick('brick-stay', 410 - x * 40, 325, 'gray_weird_48.png', 'stay'));
  customPlayField(e);
  return finalize('VV - by JDC', e, 400);
}

function map4() {
  const e = [];
  for (let x = 6; x < 750; x += 79) for (let y = 91; y < 250; y += 29) {
    if (y !== 207) {
      const row = y % 3;
      e.push(brick('brick', x, y, row === 0 ? 'blue_75.png' : row === 1 ? 'green_75.png' : 'red_75.png'));
    } else if (x % 2 === 1) {
      e.push(brick('brick-stay-3', x, y, 'yellow_stay_75.png'));
    } else {
      e.push(brick('brick', x + 13, y + 5, '../powerups/red_b.png', 'add-ball'));
    }
  }
  standardPlayField(e);
  for (let x = 401; x < 750; x += 79) for (let y = 500; y > 320; y -= 29) {
    if (x === 401 || y === 500) e.push(brick('brick-stay', x, y, 'gray_stay_75.png', 'stay'));
    else {
      const row = y % 3;
      e.push(brick('brick', x, y, row === 0 ? 'blue_75.png' : row === 1 ? 'green_75.png' : 'red_75.png'));
    }
  }
  return finalize('Buckets of balls - by MBD', e, 188);
}

function map5() {
  const e = [];
  for (let xc = 0; xc < 10; xc++) for (let yc = 0; yc < 9; yc++) {
    const x = 6 + xc * 79, y = 50 + yc * 29, row = yc % 3;
    if (xc === yc) e.push(brick('brick-stay', x, y, 'gray_stay_75.png', 'stay'));
    else e.push(brick('brick', x, y, row === 0 ? 'blue_75.png' : row === 1 ? 'green_75.png' : 'red_75.png'));
  }
  standardPlayField(e);
  return finalize('Diagonal Frustration - by MBD', e, 366);
}

function map6() {
  const e = [];
  const center = 400;
  for (let y = 100; y < 360; y += 20) {
    e.push(brick('brick-stay', center - 90, y, 'gray_weird_48.png', 'stay'));
    e.push(brick('brick-stay', center + 90, y, 'gray_weird_48.png', 'stay'));
  }
  for (let x = center - 90; x < center + 100; x += 45)
    e.push(brick('brick-stay', x, 360, 'gray_weird_48.png', 'stay'));
  for (let y = 100; y < 340; y += 25) e.push(brick('brick', center - 12, y, 'red2_75.png'));
  standardPlayField(e);
  return finalize('Bucket of candy - by JCD', e, 366);
}

function map7() {
  const e = [];
  const factor = Math.PI / 180;
  for (let t = 180; t < 370; t += 15) {
    const x = Math.cos(t * factor) * 3.6, y = Math.sin(t * factor) * 1.4;
    e.push(brick('brick', 362 + x * 100, 212 + y * 100, 'green2_75.png'));
  }
  for (let y = 105; y < 350; y += 30) e.push(brick('brick', 363, y, 'red2_75.png'));
  e.push(brick('brick-stay', 363, 375, 'blue2_75.png', 'stay'));
  e.push(brick('brick-stay', 325, 405, 'blue2_75.png', 'stay'));
  e.push(brick('brick-stay', 283, 375, 'blue2_75.png', 'stay'));
  standardPlayField(e);
  return finalize('Umbrella - by JCD', e, 366, 100, 450);
}

function map8() {
  const e = [];
  for (let x = 0; x < 4; x++) for (let y = 0; y < 10; y++)
    e.push(brick('brick', 276 + x * 75, 112 + y * 25, 'red2_75.png'));
  for (let y = 3; y < 7; y++) e.push(brick('brick', 201, 112 + y * 25, 'red2_75.png'));
  for (let y = 3; y < 7; y++) e.push(brick('brick', 576, 112 + y * 25, 'red2_75.png'));
  e.push(brick('brick', 351, 362, 'red2_75.png', 'magic-right-chain'));
  e.push(brick('brick', 426, 362, 'red2_75.png', 'magic-left-chain'));
  e.push(brick('brick', 351, 87, 'red2_75.png', 'magic-row'));
  e.push(brick('brick', 426, 87, 'red2_75.png', 'basic'));
  standardPlayField(e);
  return finalize('The magic ball - by JCD', e, 366, 10, 100);
}

export const MAP_FACTORIES = { map0, map1, map2, map3, map4, map5, map6, map7, map8 };
export const CONTEST_SEQUENCE = ['map1', 'map7', 'map2', 'map4', 'map8', 'map5', 'map3', 'map6', 'map0', 'map2', 'map3'];

export function createContestMap(id) {
  if (!MAP_FACTORIES[id]) throw new Error(`Unknown map: ${id}`);
  return MAP_FACTORIES[id]();
}
