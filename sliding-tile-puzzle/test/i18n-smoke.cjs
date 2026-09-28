const assert=require('assert');
require('../src/i18n.js');
const I=global.STPI18N;
const en=Object.keys(I.en).sort(), it=Object.keys(I.it).sort();
assert.deepEqual(it,en,'IT/EN key sets differ');
for(const lang of ['en','it']) for(const [k,v] of Object.entries(I[lang])) assert(String(v).trim(),`${lang}.${k} is empty`);
console.log('i18n-smoke: ok');
