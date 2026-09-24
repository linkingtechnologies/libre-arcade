/* Input adapter (GPL-3.0-or-later); original primary controls configurable.
 * WASD and secondary right Ctrl are modern, optional aliases only when the
 * corresponding control still uses its default primary key.
 */
import {DEFAULT_BINDINGS} from './storage.js';
export function installInput({onReset,onPause,getBindings=()=>({...DEFAULT_BINDINGS}),isEnabled=()=>true}) {
  const keyboard=new Set(),touch=new Map();let queuedShoot=false;
  const activeActions=()=>{
    const bindings=getBindings(),actions=new Set();
    for(const [action,code] of Object.entries(bindings))if(keyboard.has(code))actions.add(action);
    for(const [action,code,alias] of [['left','ArrowLeft','KeyA'],['right','ArrowRight','KeyD'],['up','ArrowUp','KeyW'],['down','ArrowDown','KeyS'],['shield','ControlLeft','ControlRight']]){
      if(bindings[action]===code&&keyboard.has(alias))actions.add(action);
    }
    return actions;
  };
  const clear=()=>{keyboard.clear();touch.clear();queuedShoot=false;document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('held'));};
  const keydown=e=>{
    if(!isEnabled())return;
    const codes=Object.values(getBindings());
    if(codes.includes(e.code)||['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyS','KeyD','KeyW','Space','ControlLeft','ControlRight'].includes(e.code)){
      e.preventDefault();keyboard.add(e.code);
    }
    if(e.code==='KeyR'&&!e.repeat&&!codes.includes('KeyR')){e.preventDefault();onReset();}
    if(e.code==='KeyP'&&!e.repeat&&!codes.includes('KeyP')){e.preventDefault();onPause();}
  };
  const keyup=e=>{keyboard.delete(e.code);};
  window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
  window.addEventListener('blur',clear);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  for(const button of document.querySelectorAll('[data-control]')) {
    const dir=button.dataset.control;
    const sync=()=>button.classList.toggle('held',[...touch.values()].includes(dir));
    button.addEventListener('pointerdown',e=>{if(!isEnabled())return;e.preventDefault();button.setPointerCapture(e.pointerId);touch.set(e.pointerId,dir);if(dir==='shoot')queuedShoot=true;sync();});
    const release=e=>{touch.delete(e.pointerId);sync();};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);
    button.addEventListener('lostpointercapture',release);
  }
  return {get:()=>{
    const keys=activeActions(),active=new Set([...touch.values(),...keys]);const shoot=active.has('shoot')||queuedShoot;queuedShoot=false;
    return {left:active.has('left'),right:active.has('right'),up:active.has('up'),down:active.has('down'),shoot,shield:active.has('shield')};
  },clear};
}
