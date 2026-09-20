'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const credit=fs.readFileSync(path.join(root,'public/js/comet.js'),'utf8');
const url='https://linkingtechnologies.github.io/libre-arcade/';
// public/ is deployed on its own, so it carries its own copy of the legal notices; they must not drift.
for(const name of ['LICENSE','NOTICE','ASSETS_LICENSE','MUSIC-CREDITS.md'])assert.equal(fs.readFileSync(path.join(root,'public',name),'utf8'),fs.readFileSync(path.join(root,name),'utf8'),`public/${name} must match the project copy`);
assert.equal(credit.split(url).length-1,1,'exactly one project link in Credits');
assert(credit.includes('rel="noopener noreferrer"'),'new-window link must use safe rel');
assert.equal(fs.existsSync(path.join(root,'reference/releases/comet-pinball-1.1.0-b480.jar')),false,
  'public-repo candidate must not bundle original JAR pending resource license check');
assert(fs.readFileSync(path.join(root,'.gitignore'),'utf8').includes('reference/releases/*.jar'));
assert(fs.readFileSync(path.join(root,'JAR-LICENSE-REVIEW.md'),'utf8').includes('NOT been cleared'));
console.log('PASS Credits Libre Arcade URL and public-repo JAR guard');
