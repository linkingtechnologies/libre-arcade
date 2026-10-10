'use strict';
// The browser bundle is generated; the committed copy must be exactly what the
// build tool produces from src/, and the certified engine sources must still
// be the ones the delivery recorded (see docs/development/results/).
const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const {buildBundle}=require('../tools/build-browser');
const root=path.resolve(__dirname,'..');
const sha=(file)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');

assert.equal(fs.readFileSync(path.join(root,'public','xoworld-bundle.js'),'utf8'),buildBundle(),'public/xoworld-bundle.js is out of date: run npm run bundle');
assert.equal(sha('src/xoworld-engine.js'),'43f4f0a3add1a4584ba632ca45e1f66a3e124ab6acc1049947ede8a66b61226a','the certified engine source changed');
assert.equal(sha('src/game-model.js'),'27992dcdc410b59bb844e3138c9d6cd2978ca5eeb4806ee582503558b627fa40','the certified game model source changed');
console.log('BUNDLE AND ENGINE IDENTITY PASS');
