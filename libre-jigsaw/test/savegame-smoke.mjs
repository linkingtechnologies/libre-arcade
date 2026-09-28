import assert from'node:assert/strict';
import{createSaveData,parseSaveText,stringifySaveData,SAVE_FORMAT,SAVE_VERSION}from'../src/savegame.js';
const pieces=[
 {index:0,x:12.5,y:20,rotation:1,group:0,z:1,layer:0},
 {index:1,x:72.5,y:20,rotation:1,group:0,z:0,layer:0}
];
const gallery=createSaveData({shape:'square',requestedPieces:12,seed:123456,board:{width:640,height:480},playfield:{width:1200,height:800},currentLayer:0,complete:false,image:{kind:'gallery',file:'Full-202-Tiger-Swallowtail.jpg',title:'Tiger Swallowtail'},pieces});
assert.equal(gallery.format,SAVE_FORMAT);assert.equal(gallery.formatVersion,SAVE_VERSION);assert.equal(gallery.actualPieces,2);
assert.deepEqual(parseSaveText(stringifySaveData(gallery)).pieces,gallery.pieces);
assert.deepEqual(parseSaveText(stringifySaveData(gallery)).playfield,{width:1200,height:800});
const embedded=createSaveData({shape:'hex',requestedPieces:24,seed:99,board:{width:500,height:400},playfield:{width:900,height:700},currentLayer:2,complete:true,image:{kind:'embedded',name:'mine.png',mime:'image/png',data:'data:image/png;base64,AAAA'},pieces});
assert.equal(parseSaveText(stringifySaveData(embedded)).image.data,'data:image/png;base64,AAAA');
// Beta 2 / format v1 saves remain readable. They are migrated to the current viewport on load.
const v1={...gallery,formatVersion:1};delete v1.playfield;
assert.equal(parseSaveText(JSON.stringify(v1)).formatVersion,1);
assert.throws(()=>parseSaveText('version:2012.02.06\n'),e=>e.code==='LEGACY_LJF');
assert.throws(()=>parseSaveText('{"format":"other"}'));
console.log('savegame smoke: OK');
