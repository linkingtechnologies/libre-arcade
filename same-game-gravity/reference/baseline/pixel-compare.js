// Paste in the browser console of (a) the ORIGINAL game.html and (b) the restored
// public/index.html, both in a 1000x700 viewport, then run:  await __px(false)  /  await __px(true)
// Virtual clock, seeded Math.random, render() driven by hand; hashes both canvases (main + highlight)
// after every frame of: initial gravity, hover, three removals, then rotations 90/180/-90/0 each
// followed by a removal. Result on 2026-11-22: 534 frames, identical (all = 4cf48959b488).
window.__px = async function(restored){
 const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,12);
 let now=1e6; window.Date=class{getTime(){return now} static now(){return now}};
 let seed=777; Math.random=function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
 const sg=samegame; const Orig=sg.Game; let g; sg.Game=function(o){g=new Orig(o);return g};
 if(restored) sg.GAME_BAR_SIZE=30; // upstream's bar height, so both canvases have the same size
 sg.SameGame.route('/game/new/normal'); sg.SameGame.route('/'); sg.Game=Orig;
 let ori=0; util.Orientation.get=()=>ori;
 const main=document.querySelector('canvas.main'), hl=document.querySelector('canvas.highlight');
 const frames=[]; const sections=[];
 const step=async()=>{ now+=16; g.render(); frames.push(await sha(main.toDataURL()+'|'+hl.toDataURL())); };
 const section=async(name,n,pre)=>{ const start=frames.length; if(pre) pre(); for(let i=0;i<n;i++) await step(); sections.push(name+':'+await sha(frames.slice(start).join(','))); };
 const first=()=>{ const c=g.grid.columns; for(let x=0;x<c.length;x++) for(let y=0;y<c[x].length;y++) if(g.grid.isDestroyable(x,y)) return {x,y}; return null; };
 g.windowHasChanged=true;
 await section('init',30);
 for(let k=0;k<3;k++){ await section('hover'+k,3,()=>{ g.brickHovered=first(); g.brickHoverChanged=true; }); await section('click'+k,45,()=>{ g.brickClicked=first(); }); }
 for(const [name,o] of [['rot90',90],['rot180',180],['rotm90',-90],['rot0',0]]){ await section(name,45,()=>{ ori=o; }); await section(name+'click',45,()=>{ g.brickClicked=first(); }); }
 return {canvas:[main.width,main.height], blocks:g.grid.countBlocks(), n:frames.length, all:await sha(frames.join()), sections};
};
