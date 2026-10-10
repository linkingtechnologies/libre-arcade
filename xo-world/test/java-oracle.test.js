'use strict';
// Replays, against the JavaScript port, a transcript recorded from the preserved
// original Java applet (reference/javagames-1.0/xoworld.java, run as it is).
// No Java is needed here. To run the original again, see: npm run test:live.
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const oracle=require('../tools/java-oracle');
const root=path.resolve(__dirname,'..');

const fixture=JSON.parse(fs.readFileSync(oracle.FIXTURE,'utf8'));

// The recording answers exactly these sources; if either changed, it must be redone.
for(const [file,hash] of Object.entries(fixture.sources)){
  assert.equal(oracle.sha256(path.join(root,file)),hash,`${file} changed since the oracle was recorded: run node tools/java-oracle.js record`);
}
assert.equal(fixture.sources['reference/javagames-1.0/xoworld.java'],'58ab426a470dd1c5933a14098667d8fdc8c7b800100c4e2db3b69beaa304f762','the oracle was not recorded against the preserved original');

// The recording must be a meaningful sample of the original's behaviour.
assert(fixture.games.length>=1000,'too few recorded games');
assert(fixture.stats.fallback>0,'no random-fallback replies recorded');
assert(fixture.stats.depth['7']>0,'the DUBINA=7 search cap was never reached in the recorded games');
assert(fixture.stats.humanWins>0&&fixture.stats.cpuWins>0&&fixture.stats.draws>0,'every kind of game ending must be recorded');

const result=oracle.replay(fixture);
for(const c of result.cases){
  assert.equal(c.original,c.expected,`${c.id}: the original Java answers ${c.original}, the delivered expectation is ${c.expected}`);
  assert.equal(c.port,c.original,`${c.id}: the port answers ${c.port}, the original Java ${c.original}`);
}
console.log(`JAVA ORACLE REPLAY PASS: ${fixture.games.length} games, ${result.steps} clicks (${result.fallback} random-fallback replies) and ${result.cases.length} positions agree with the original, recorded on ${fixture.recordedWith.java}.`);
