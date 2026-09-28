import assert from'node:assert/strict';
import{LAYER_COUNT,normalizeLayer,visiblePieces,uniqueGroupsFromPieces,moveGroupsToLayer,normalizeRect,rectsIntersect}from'../src/layers.js';
assert.equal(LAYER_COUNT,3);
assert.equal(normalizeLayer(0),0);assert.equal(normalizeLayer(2),2);assert.equal(normalizeLayer(9),0);
const pieces=[
 {id:0,group:0,layer:0},{id:1,group:0,layer:0},{id:2,group:2,layer:0},
 {id:3,group:3,layer:1},{id:4,group:4,layer:2}
];
assert.deepEqual(visiblePieces(pieces,0).map(p=>p.id),[0,1,2]);
assert.deepEqual([...uniqueGroupsFromPieces(visiblePieces(pieces,0))],[0,2]);
assert.equal(moveGroupsToLayer(pieces,new Set([0]),1),2);
assert.deepEqual(pieces.filter(p=>p.group===0).map(p=>p.layer),[1,1]);
assert.equal(pieces.find(p=>p.id===2).layer,0,'unselected group must stay on its layer');
assert.equal(moveGroupsToLayer(pieces,new Set([0,2]),2),3);
assert.deepEqual(pieces.filter(p=>[0,2].includes(p.group)).map(p=>p.layer),[2,2,2]);
assert.deepEqual(normalizeRect({x:10,y:20},{x:3,y:8}),{x:3,y:8,w:7,h:12});
assert.equal(rectsIntersect({x:0,y:0,w:10,h:10},{x:9,y:9,w:3,h:3}),true);
assert.equal(rectsIntersect({x:0,y:0,w:10,h:10},{x:11,y:0,w:3,h:3}),false);
console.log('layers-selection smoke: OK');
