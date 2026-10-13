// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// java.util.Random-compatible 48-bit LCG for deterministic QA.
// Historical MilCity repeatedly instantiated new Random() from wall-clock time;
// M3 injects an explicit seed so Java/JS behavioural tests are reproducible.
const MASK=(1n<<48n)-1n, MULT=0x5DEECE66Dn, ADD=0xBn;
export class JavaRandom {
  constructor(seed=0){ this.setSeed(seed); }
  setSeed(seed){ this.seed=(BigInt.asUintN(64,BigInt(seed))^MULT)&MASK; }
  next(bits){ this.seed=(this.seed*MULT+ADD)&MASK; return Number(this.seed>>(48n-BigInt(bits))); }
  nextInt(bound){
    if(bound===undefined) return this.next(32)|0;
    if(!Number.isInteger(bound)||bound<=0) throw new RangeError('bound');
    if((bound & -bound)===bound) return Number((BigInt(bound)*BigInt(this.next(31)))>>31n);
    let bits,val; do { bits=this.next(31); val=bits%bound; } while((bits-val+(bound-1))>0x7fffffff); return val;
  }
  int(max){ return this.nextInt(max); }
  pick(a){ if(!a.length) return undefined; return a[this.nextInt(a.length)]; }
  clone(){ const r=Object.create(JavaRandom.prototype); r.seed=this.seed; return r; }
  stateHex(){ return '0x'+this.seed.toString(16).padStart(12,'0'); }
}
export const RNG=JavaRandom;

// ---- Added for the comparison with the original (see docs/development/CHANGES.md) ----
// The original makes a new, unseeded java.util.Random whenever it needs random numbers: one per coastline walker, and one per
// choice of the computer's. A "seed source" is where those seeds come from: the browser's random numbers when a person plays, and a
// SplitMix64 sequence when the oracle (or a test) needs the game to be repeatable. The oracle's Java side takes its seeds from the
// same sequence (test/java-oracle/oracle/SeedSource.java), in the order the original asks for them.
export function splitMix64(seed){
  let state=BigInt.asUintN(64,BigInt(seed)),count=0;
  return {
    next(){
      count++;
      state=BigInt.asUintN(64,state+0x9E3779B97F4A7C15n);
      let z=state;
      z=BigInt.asUintN(64,(z^(z>>30n))*0xBF58476D1CE4E5B9n);
      z=BigInt.asUintN(64,(z^(z>>27n))*0x94D049BB133111EBn);
      return BigInt.asUintN(64,z^(z>>31n));
    },
    get count(){return count;}
  };
}
export function browserSeeds(){
  return {next(){const w=new Uint32Array(2);globalThis.crypto.getRandomValues(w);return (BigInt(w[0])<<32n)|BigInt(w[1]);}};
}
