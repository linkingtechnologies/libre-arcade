const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),path=require('path');
const ROOT=path.resolve(__dirname,'..');vm.runInThisContext(fs.readFileSync(path.join(ROOT,'src/levels.js'),'utf8'));const C=require(path.join(ROOT,'src/core.js'));
function sha(board){return crypto.createHash('sha256').update(Buffer.from(board)).digest('hex')}function ok(x,m){if(!x)throw new Error(m)}
let s=1,first=[];for(let i=0;i<10;i++){s=C.randStep(s).seed;first.push(s)}ok(JSON.stringify(first)===JSON.stringify([2,4,8,16,32,64,128,207,81,162]),'rng outputs');
s=1;for(let i=1;i<=255;i++){s=C.randStep(s).seed;if(s===1){ok(i===255,'period');break}}
const menu=C.randStep(1).seed;ok(menu===2,'menu seed');let l1=C.unpackLevel(globalThis.LAN_MASTER_LEVELS[0],menu);ok(l1.seed===48,'L1 seed');ok(sha(l1.board)==='c582833d1004b4c202fc35f22dff5a756a72e3f0c56a9c765e635c8478fe2267','L1 hash');
let rs=l1.seed;for(const expected of [209,141,145]){const x=C.unpackLevel(globalThis.LAN_MASTER_LEVELS[0],rs);ok(x.seed===expected,'restart '+expected);rs=x.seed}
ok(C.counterTicksToZero(1000)===744,'counter1000');ok(C.counterTicksToZero(610)===354,'counter610');
ok(globalThis.LAN_MASTER_PASSWORDS.length===49,'49 level passwords');ok(globalThis.LAN_MASTER_PASSWORDS[48]==='4752','level50 password');ok(globalThis.LAN_MASTER_ENDING_CODE==='6502','ending code');
const wdir=path.join(ROOT,'tests','witnesses');let count=0;for(let n=1;n<=50;n++){const b=JSON.parse(fs.readFileSync(path.join(wdir,`level${String(n).padStart(2,'0')}.json`),'utf8'));const map=new Array(256).fill(0);for(let y=0;y<12;y++)for(let x=0;x<12;x++)map[(y+1)*16+(x+1)]=b[y*12+x];const t=C.trace(map,0);ok(t.all,`L${n} ${t.reached}/${t.total}`);count++}
console.log(`M8 core regression: PASS (${count}/50 witnesses)`);
