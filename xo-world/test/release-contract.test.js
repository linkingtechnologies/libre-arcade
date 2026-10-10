const fs=require('fs');
const path=require('path');
let fail=0;
function ok(cond,msg){if(!cond){console.error('RELEASE CONTRACT FAIL:',msg);fail++;}}
const web=path.join(__dirname,'..','public');
const files=fs.readdirSync(web).sort();
const allowed=new Set(['app.js','index.html','style.css','xoworld-bundle.js']);
ok(files.every(f=>allowed.has(f)),'unexpected file in public/: '+files.filter(f=>!allowed.has(f)).join(', '));
ok(files.length===allowed.size,'public/ should contain exactly the four release files');
for(const f of files){
  const full=path.join(web,f);
  const data=fs.readFileSync(full);
  const text=data.toString('utf8');
  ok(!/TODO|FIXME|localhost|127\.0\.0\.1|\/mnt\/data/i.test(text),`${f} contains development residue`);
}
const all=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else all.push(p);}})(web);
const raster=/\.(gif|jpe?g|png|webp|bmp|ico)$/i;
ok(!all.some(f=>raster.test(f)),'historical/uncertified raster asset present in public build');
const html=fs.readFileSync(path.join(web,'index.html'),'utf8');
ok(/https:\/\/linkingtechnologies\.github\.io\/libre-arcade\//.test(html),'Libre Arcade link missing');
ok(/lang="en"/.test(html),'default HTML language must be English');
const app=fs.readFileSync(path.join(web,'app.js'),'utf8');
ok(/addEventListener\('cancel'/.test(app),'dialog Escape/cancel handling missing');
if(fail)process.exit(1);
console.log('RELEASE CONTRACT PASS');
