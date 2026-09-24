/* Explicit, restricted text interchange with Ben Whittaker's 1.2 controls.txt
 * and highscores.txt. This is NOT a native game-state save: only key bindings
 * and the top-ten table transfer. Original source in reference/, lines 78-133.
 * GPL-3.0-or-later, (C) 2026 Libre Arcade contributors.
 */
import {CONTROL_ORDER} from './menu.js';
import {validBindings,validScores} from './storage.js';

// Pygame 1.x/SDL1 key values used by the historical game. Unknown SDL keys
// cannot be translated safely to modern KeyboardEvent.code, so reject them.
const PYGAME_KEYS=Object.freeze({
  ArrowUp:273,ArrowDown:274,ArrowRight:275,ArrowLeft:276,
  Space:32,ControlLeft:306,ControlRight:305,
  Enter:13,Tab:9,Backspace:8,Escape:27,
  ShiftLeft:304,ShiftRight:303,AltLeft:308,AltRight:307,
  Home:278,End:279,PageUp:280,PageDown:281,Insert:277,Delete:127,
  F1:282,F2:283,F3:284,F4:285,F5:286,F6:287,F7:288,F8:289,F9:290,F10:291,F11:292,F12:293
});
const codeToNative=new Map(Object.entries(PYGAME_KEYS));
for(let i=0;i<26;i++)codeToNative.set('Key'+String.fromCharCode(65+i),97+i);
for(let i=0;i<10;i++)codeToNative.set('Digit'+i,48+i);
const nativeToCode=new Map([...codeToNative].map(([code,n])=>[n,code]));
const SCORE_NAME=/^[\x20-\x39\x3b-\x7e]{0,10}$/; // portable ASCII excluding ':'
const decimal=/^(0|[1-9][0-9]*)$/;
function requireText(text,max){if(typeof text!=='string'||text.length>max||text.includes('\0'))throw new Error('Invalid or oversized text file');}
function lines(text,max){requireText(text,max);if(!text.endsWith('\n'))throw new Error('Original text format requires a final newline');
  const result=text.slice(0,-1).split('\n').map(v=>v.endsWith('\r')?v.slice(0,-1):v);
  if(result.some(v=>v.includes('\r')))throw new Error('Unexpected line ending');return result;
}
function unsigned(s){if(!decimal.test(s))throw new Error('Invalid numeric value');const v=Number(s);if(!Number.isSafeInteger(v))throw new Error('Numeric value outside safe range');return v;}
export function parseNativeControls(text){const ls=lines(text,256);if(ls.length!==CONTROL_ORDER.length)throw new Error('controls.txt requires exactly six lines');
  const bindings={};for(let i=0;i<CONTROL_ORDER.length;i++){
    const n=unsigned(ls[i]),code=nativeToCode.get(n);if(!code)throw new Error(`Unsupported Pygame key code at line ${i+1}: ${n}`);
    bindings[CONTROL_ORDER[i]]=code;
  }
  if(!validBindings(bindings))throw new Error('Invalid mapped bindings');return bindings;
}
export function formatNativeControls(bindings){if(!validBindings(bindings))throw new Error('Invalid browser bindings');
  return CONTROL_ORDER.map(key=>{const code=codeToNative.get(bindings[key]);if(code===undefined)throw new Error(`Cannot export browser-only key: ${bindings[key]}`);return String(code);}).join('\n')+'\n';
}
export function parseNativeScores(text){const ls=lines(text,4096);if(ls.length<1||ls.length>10)throw new Error('highscores.txt requires 1 to 10 records');
  const scores=ls.map((line,i)=>{const colon=line.indexOf(':');if(colon<1)throw new Error(`Missing score/name separator at line ${i+1}`);
    const score=unsigned(line.slice(0,colon)),name=line.slice(colon+1);
    if(!portableName(name))throw new Error(`Unportable name at line ${i+1}`);
    return {score,name};
  });
  while(scores.length<10)scores.push({score:0,name:''});
  if(!validScores(scores))throw new Error('Score table is not in descending order');return scores;
}
export function formatNativeScores(scores){if(!validScores(scores)||scores.some(x=>!portableName(x.name)))throw new Error('Unportable score table');
  return scores.map(x=>`${x.score}:${x.name}`).join('\n')+'\n';
}
export function portableName(name){return typeof name==='string'&&SCORE_NAME.test(name)&&name===name.trim();}
