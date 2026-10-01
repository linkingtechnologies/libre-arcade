import test from 'node:test';
import assert from 'node:assert/strict';
import {createRng, emptyBoard, generateMosaic, isSolved, wrongCells, MOSAIC_MASKS, MOSAIC_FAMILY_NAMES, MOSAIC_SLOT_SUFFIXES, tileArchiveId, tileArchivePath, tileFromFamilySlot, tileFamily, tileSlot} from '../public/src/model.js';

test('D0 4x4 uses one family and is x-symmetric', () => {
  const {target}=generateMosaic({size:4,difficulty:0,random:createRng(1234),family:3});
  const ids=[];
  for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(target[x][y]!==null)ids.push(target[x][y]);
  assert.ok(ids.length===16);
  assert.ok(ids.every(v=>Math.floor(v/10)===3));
  for(let x=0;x<4;x++)for(let y=0;y<8;y++)assert.equal(target[x][y],target[7-x][y]);
});

test('D1 4x4 uses one family but not forced symmetric', () => {
  const {target}=generateMosaic({size:4,difficulty:1,random:createRng(4),family:2});
  const ids=[];for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(target[x][y]!==null)ids.push(target[x][y]);
  assert.ok(ids.every(v=>Math.floor(v/10)===2));
  let differs=false;for(let x=0;x<4;x++)for(let y=0;y<8;y++)if(target[x][y]!==target[7-x][y])differs=true;
  assert.ok(differs);
});

test('D2 can use multiple families', () => {
  const {target}=generateMosaic({size:8,difficulty:2,random:createRng(88),family:0});
  const fam=new Set();for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(target[x][y]!==null)fam.add(Math.floor(target[x][y]/10));
  assert.ok(fam.size>1);
});

test('6x6/8x8 use one of the four historical masks', () => {
  const {maskIndex}=generateMosaic({size:8,difficulty:3,random:createRng(7),family:0});
  assert.ok(maskIndex>=0&&maskIndex<MOSAIC_MASKS.length);
});

test('solve and mistake helpers', () => {
  const {target}=generateMosaic({size:2,difficulty:1,random:createRng(9),family:1});
  const player=emptyBoard();assert.equal(isSolved(player,target),false);
  for(let x=0;x<8;x++)for(let y=0;y<8;y++)player[x][y]=target[x][y];
  assert.equal(isSolved(player,target),true);
  const active=[];for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(target[x][y]!==null)active.push([x,y]);
  const [x,y]=active[0];player[x][y]=(target[x][y]+1)%50;
  assert.deepEqual(wrongCells(player,target),[[x,y]]);
});

test('all generated active cells remain inside the selected centered board', () => {
  for (const size of [2,4,6,8]) {
    const start=4-size/2, end=4+size/2;
    for (const difficulty of [0,1,2,3,4]) {
      const {target}=generateMosaic({size,difficulty,random:createRng(1000+size*10+difficulty),family:1});
      for(let x=0;x<8;x++)for(let y=0;y<8;y++){
        if(target[x][y]!==null) assert.ok(x>=start&&x<end&&y>=start&&y<end, `active cell ${x},${y} outside ${size}x${size}`);
      }
    }
  }
});

test('D0 symmetry survives the 6x6/8x8 historical mask stage', () => {
  for(const size of [6,8]){
    const {target}=generateMosaic({size,difficulty:0,random:createRng(777+size),family:4});
    for(let x=0;x<4;x++)for(let y=0;y<8;y++)assert.equal(target[x][y],target[7-x][y]);
  }
});


test('historical tile archive order is family 1..5 with suffixes 1..9,0', () => {
  assert.deepEqual(MOSAIC_FAMILY_NAMES, ['red','cyan','green','lilac','blue']);
  assert.deepEqual(MOSAIC_SLOT_SUFFIXES, [1,2,3,4,5,6,7,8,9,0]);
  assert.equal(tileArchiveId(0), '1_1');
  assert.equal(tileArchiveId(8), '1_9');
  assert.equal(tileArchiveId(9), '1_0');
  assert.equal(tileArchiveId(10), '2_1');
  assert.equal(tileArchiveId(49), '5_0');
  assert.equal(tileArchivePath(49), 'DATA\\MOSAIC\\5_0.bmp');
});

test('family/slot helpers cover all 50 logical tiles bijectively', () => {
  const ids = new Set();
  const paths = new Set();
  for (let family=0; family<5; family++) {
    for (let slot=0; slot<10; slot++) {
      const tile = tileFromFamilySlot(family, slot);
      assert.equal(tileFamily(tile), family);
      assert.equal(tileSlot(tile), slot);
      ids.add(tileArchiveId(tile));
      paths.add(tileArchivePath(tile));
    }
  }
  assert.equal(ids.size, 50);
  assert.equal(paths.size, 50);
});
