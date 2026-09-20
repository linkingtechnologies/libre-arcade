
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
function boot({desktop=false}={}){
  const els=new Map(),listeners={},frames=[];let now=1000;
  function el(id){
   if(els.has(id))return els.get(id);
   const cls=new Set();const o={id,hidden:false,textContent:'',innerHTML:'',value:'',attributes:{},
    classList:{add:x=>cls.add(x),remove:x=>cls.delete(x),contains:x=>cls.has(x),toggle:(x,on)=>on?cls.add(x):cls.delete(x)},
    addEventListener(k,fn){this[k]=fn;},setAttribute(k,v){this.attributes[k]=v;},focus(){},setPointerCapture(){},click(){this.onclick?.();}};
   els.set(id,o);return o;
  }
  const cv=el('game');cv.width=456;cv.height=840;
  cv.getContext=()=>new Proxy({createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}},{get(o,k){return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
  const document={getElementById:el,hidden:false,documentElement:{clientWidth:desktop?1280:390},addEventListener(k,fn){listeners['document:'+k]=fn;}};
  const ctx=vm.createContext({document,localStorage:{getItem(){return null;},setItem(){}},performance:{now:()=>now},requestAnimationFrame:cb=>frames.push(cb),console,Math,Number,Set,Map});
  ctx.window=ctx;ctx.globalThis=ctx;ctx.innerWidth=desktop?1280:390;
  ctx.matchMedia=q=>({matches:desktop && /min-width:\s*960px/.test(q),media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  ctx.addEventListener=(k,fn)=>listeners[k]=fn;
  for(const name of ['public/data/playfield.js','public/js/physics.js','public/js/camera.js','public/js/audio.js','public/js/visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
  ctx.navigator={language:'it-IT',languages:['it-IT']};
vm.runInContext(fs.readFileSync(path.join(root,'public/js/i18n.js'),'utf8'),ctx,{filename:'public/js/i18n.js'});
vm.runInContext(fs.readFileSync(path.join(root,'public/js/comet.js'),'utf8'),ctx,{filename:'public/js/comet.js'});
  return {el,listeners,frames,tick(n=1){for(let i=0;i<n;i++){now+=1000/60;const f=frames.shift();assert.equal(typeof f,'function');f(now);}}};
}
let app=boot({desktop:true});
assert.equal(app.el('viewBtn').attributes['aria-pressed'],'false');
assert.match(app.el('viewBtn').textContent,/Tavolo intero/);
app.el('startGame').click();app.tick(2);
assert.equal(app.el('viewBtn').attributes['aria-pressed'],'false','desktop starts in full-table view');
app.el('viewBtn').click();
assert.equal(app.el('viewBtn').attributes['aria-pressed'],'true','desktop can switch to follow-ball');
app.listeners['resize']();
assert.equal(app.el('viewBtn').attributes['aria-pressed'],'true','manual camera choice is preserved across resize');
app=boot({desktop:false});
assert.equal(app.el('viewBtn').attributes['aria-pressed'],'true');
assert.match(app.el('viewBtn').textContent,/Segui pallina/);
console.log('PASS M13.2 layout: desktop defaults to full-table, mobile defaults to follow-ball, manual toggle preserved');
