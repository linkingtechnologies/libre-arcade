const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
vm.runInThisContext(fs.readFileSync(path.join(ROOT,'src/audio-data.js'),'utf8'));
const FT=require(path.join(ROOT,'src/famitone.js'));
const NA=require(path.join(ROOT,'src/nes-audio.js'));
const D=globalThis.LanMasterAudioData;
function ok(v,m){if(!v)throw new Error(m)}
function frameHash(addr,frames){
  const e=new FT.Engine(FT.b64(D.prgB64),{sfxTable:D.sfxTable,dpcmTable:D.dpcmTable});
  e.musicStart(addr);const h=crypto.createHash('sha256');let ev=0;
  for(let i=0;i<frames;i++){h.update(Buffer.from(e.update()));for(const x of e.sampleEvents){h.update(Buffer.from([255,x]));ev++}}
  return [h.digest('hex'),ev];
}
const golden={
  menu:['16b5b67b6da6809fd903526e269c9652a51c813b2526078744fdec159de83876',14],
  done:['9b492d7a4ccc90d6a82a0453b1338f5984693d9e779e099cd2bb81d4976e65bd',0],
  timeout:['aa95ba28c3284120cd6f0378cd16ae308ba2bdaad80f5bbaef32a2d0e2ea1d26',13],
  game:['1f9af7a77f7de5af798c05073c40ee4e3781897ff40673c670ced84487b0b52b',0]
};
for(const [name,addr] of Object.entries(D.music)){
  const got=frameHash(addr,600),exp=golden[name];
  ok(got[0]===exp[0]&&got[1]===exp[1],`${name} 600-frame stream`);
}
const e=new FT.Engine(FT.b64(D.prgB64),{sfxTable:D.sfxTable,dpcmTable:D.dpcmTable});
const d0=e.dpcmInfo(0),d2=e.dpcmInfo(2),d4=e.dpcmInfo(4);
ok(d0.addr===0xE000&&d0.bytes===81&&d0.rateIndex===15,'DPCM sample0');
ok(d2.addr===0xE080&&d2.bytes===161&&d2.rateIndex===15,'DPCM sample2');
ok(d4.addr===0xE140&&d4.bytes===305&&d4.rateIndex===15,'DPCM sample4');
const sfxGolden=[
'5a12dc60ffec72430307abb94b96669cf67f2951773a87a4e2efd1b293dafce0',
'67bc92affce1ba71c668c35186c54583eb07aa41915c145a6e72874d8e597b75',
'588a0bbf607a53dab1f3dc3676f27a46cd439f5ed20192bfc01abc7d1fb81355',
'6774501ecc3245c4488606eeb9c9c161ca5d606d5cb7d4c28fc1311956c546db',
'f8b805dadc2ceac80992d4bd34e82e48db84992eab0bbc941593829c47103a46',
'8784ed8d5c2a587f2c8e1d0504a3e070761c89beeda877d6542261597c5bcfce',
'9c175ac5c46bd569a4e5c334db07facdab0007c1008e59bd4ee67dc92d380d7f',
'9d20e07078b4dad599d8050eb05836f98150839714d8bffd9b14b397899b6eab',
'1604c69a146748eb5c52d1940aa1f4d3c9698dd9b9a582cbbf5aca2a3c0416da',
'0536cf45524da9940b29c78d233f4f1b7342437f6e7f2d0727bb52c0579b7d8f',
'253b16f0535d28dabd4c2c5500fd13ba34f6cb45fac451737a65e35b5027e72e',
'548bbb6d64b2cec0ca7827b34cc110ea2cd6b21252dd654939135203736a7d2f'];
for(let id=0;id<12;id++){
  const x=new FT.Engine(FT.b64(D.prgB64),{sfxTable:D.sfxTable,dpcmTable:D.dpcmTable});
  x.sfxStart(id,id===10?1:0);const h=crypto.createHash('sha256');
  for(let i=0;i<180;i++)h.update(Buffer.from(x.update()));
  ok(h.digest('hex')===sfxGolden[id],`SFX ${id}`);
}
function pcmHash(name){
  const x=new FT.Engine(FT.b64(D.prgB64),{sfxTable:D.sfxTable,dpcmTable:D.dpcmTable});
  x.musicStart(D.music[name]);const sy=new NA.Synth(x,{sampleRate:48000,cpuHz:D.cpuHz});
  const h=crypto.createHash('sha256'),b=Buffer.alloc(2);
  for(let i=0;i<48000;i++){const q=Math.round(Math.max(-1,Math.min(1,sy.step()))*32767);b.writeInt16LE(q,0);h.update(b)}
  return h.digest('hex');
}
ok(pcmHash('menu')==='c4541f64d8783864aa5df436152ecbbb8a19738b729f4a44458b6010fc0bd9ff','menu PCM');
ok(pcmHash('game')==='6192657de850433798969d2e1ca3334f6e2ebc4a1b4a7a388ac04a208c1dd704','game PCM');
console.log('M10 audio regression: PASS (4 BGM modules, 12 SFX, DPCM, PCM synth)');
