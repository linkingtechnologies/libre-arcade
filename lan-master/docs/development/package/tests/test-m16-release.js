const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
function ok(v,m){if(!v)throw new Error(m)}
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex')}
const m15={
 'index.html':'b9e0d7ff113a2b4ec3441f3db8e8ebc00ccf41c35aaeba0889d09d2bf0285ef0',
 'src/app.js':'edb42e45d467018f10169d44736b49000677df65719377808fcfc3462efc8287',
 'src/audio-data.js':'f31812de74d3ba1dd6051868abb41814b48737d883a771452c4b2190fda3d31a',
 'src/core.js':'692ff052b915e02d8fddafdf73cfdc3ac0e6db7b5dc9bc67645292540d14f9f4',
 'src/famitone.js':'cb5b35f88dac6bbfea3c8420229a370f322edf06e83a29a5c9717988f796146d',
 'src/levels.js':'2f3bd6fb07bac57e0fcdb5d3cf065993338a37d90eb0463971097a9f060d2732',
 'src/nes-assets.js':'ad5bde253b7189197569a5b5e3879926b5f4bf07313da76b1ed74d6b209628d7',
 'src/nes-audio.js':'c13ad3826796909d6b87ad256044acf58310daf9133d7b794916a8c6cfec1c1c',
 'src/nes-gfx.js':'ae2033830af5fd8e9ca2fefc947d8970eca5d6edbd3decb2526c98898ce81b3b',
 'src/transitions.js':'29de45bb2c7037ac9a31d58607704802c18054152823f0c0f64285c01b84cba5',
 'reference/Lan_Master.nes':'becfeafb80479c330333c9e9385417f68f3c88e85443dfb37b05ae9283f3ea45',
 'reference/levels-v1.09.json':'48dde7101031a8a3497558524f724bb9afef5fa4dff3c898da0c7de4302ef161'
};
for(const [f,h] of Object.entries(m15))ok(sha(f)===h,`M16 changed frozen runtime/reference file: ${f}`);
ok(sha('src/style.css')==='2e292f2a84fc17627612f63f3873cf9eb17b11b798a124c645bfb3feea2570cf','unexpected M16 stylesheet hash');
const css=fs.readFileSync(path.join(ROOT,'src/style.css'),'utf8');
ok(css.includes('#gameScreen .nes-frame{container-type:size}'),'M16 game container rule missing');
ok(css.includes('width:min(512px,100cqw,106.6667cqh)'),'M16 responsive board sizing rule missing');
const rel=JSON.parse(fs.readFileSync(path.join(ROOT,'release.json'),'utf8'));
ok(rel.milestone==='M16'&&rel.release_status==='1.0.1'&&rel.release_class==='patch','M16 metadata');
ok(rel.runtime_logic_changed_from_m15===false&&rel.stylesheet_changed_from_m15===true,'presentation-only metadata');
ok(fs.readFileSync(path.join(ROOT,'VERSION'),'utf8').trim()==='1.0.1','VERSION 1.0.1');
console.log('M16 release regression: PASS (stylesheet-only runtime delta, 1.0.1 metadata)');
