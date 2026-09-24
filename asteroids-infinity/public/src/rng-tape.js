/* M9 forensic RNG tape. Records the sequence AND bounds of each draw.
 * NOT Python 2's Mersenne Twister, and not a game feature. It permits exact
 * repeatability of a JS gameplay run and future replay of a native call tape.
 * GPL-3.0-or-later.
 */
const TYPES=new Set(['random','randint','uniform']);
function argsFor(type,a,b){return type==='random'?[]:[a,b];}
export function recordRandom(rng){
  if(!rng||[...TYPES].some(type=>typeof rng[type]!=='function'))throw new TypeError('RNG needs random/randint/uniform');
  const tape=[];let cursor=0;
  const adapter={};
  for(const type of TYPES)adapter[type]=(...args)=>{
    const actual=argsFor(type,...args);const result=rng[type](...actual);
    if(!Number.isFinite(result))throw new RangeError('Non-finite RNG draw');
    tape.push({type,args:actual,result});cursor++;return result;
  };
  return {rng:adapter,tape,get count(){return cursor;}};
}
export function replayRandom(tape){
  if(!Array.isArray(tape))throw new TypeError('RNG tape must be array');
  let index=0;const adapter={};
  for(const type of TYPES)adapter[type]=(...args)=>{
    const expected=argsFor(type,...args), entry=tape[index];
    if(!entry||entry.type!==type||!Array.isArray(entry.args)||
       entry.args.length!==expected.length||
       !entry.args.every((v,i)=>Object.is(v,expected[i]))||
       !Number.isFinite(entry.result))
      throw new Error(`RNG trace mismatch at draw ${index} (${type})`);
    index++;return entry.result;
  };
  return {rng:adapter,get remaining(){return tape.length-index;},
    assertConsumed(){if(index!==tape.length)throw new Error(`Unused RNG draws: ${tape.length-index}`);}};
}
