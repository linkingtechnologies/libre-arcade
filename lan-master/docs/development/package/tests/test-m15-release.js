const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
function ok(v,m){if(!v)throw new Error(m)}
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex')}
const frozen={
 'index.html':'b9e0d7ff113a2b4ec3441f3db8e8ebc00ccf41c35aaeba0889d09d2bf0285ef0',
 'src/app.js':'edb42e45d467018f10169d44736b49000677df65719377808fcfc3462efc8287',
 'src/audio-data.js':'f31812de74d3ba1dd6051868abb41814b48737d883a771452c4b2190fda3d31a',
 'src/core.js':'692ff052b915e02d8fddafdf73cfdc3ac0e6db7b5dc9bc67645292540d14f9f4',
 'src/famitone.js':'cb5b35f88dac6bbfea3c8420229a370f322edf06e83a29a5c9717988f796146d',
 'src/levels.js':'2f3bd6fb07bac57e0fcdb5d3cf065993338a37d90eb0463971097a9f060d2732',
 'src/nes-assets.js':'ad5bde253b7189197569a5b5e3879926b5f4bf07313da76b1ed74d6b209628d7',
 'src/nes-audio.js':'c13ad3826796909d6b87ad256044acf58310daf9133d7b794916a8c6cfec1c1c',
 'src/nes-gfx.js':'ae2033830af5fd8e9ca2fefc947d8970eca5d6edbd3decb2526c98898ce81b3b',
 'src/style.css':'56fd85398dd3f23c0142cbfe755adc8a04f100da63327a4e3bcc4a58a109d399',
 'src/transitions.js':'29de45bb2c7037ac9a31d58607704802c18054152823f0c0f64285c01b84cba5',
 'reference/Lan_Master.nes':'becfeafb80479c330333c9e9385417f68f3c88e85443dfb37b05ae9283f3ea45',
 'reference/levels-v1.09.json':'48dde7101031a8a3497558524f724bb9afef5fa4dff3c898da0c7de4302ef161',
 'reference/patternsChr.bin':'9c364b201c4a34c41b97e630f71f5a33674065045a62ad8e823c1b2847ee396d',
 'reference/titleRle.bin':'0918a7ca297a29894791648da2aff7b4eb55ef8f2950107837ea808d117f929c',
 'reference/gameBgRle.bin':'99798c55825b7e128de8b8854d3be3c05c1446ca92f5bd76b135ab2af07d34e2',
 'reference/wellDoneRle.bin':'3077b17b93fae030467635e5e5d1faa2fb0d57362ddb822487caa2d40edc991c'
};
for(const [f,h] of Object.entries(frozen)){const got=sha(f);if(f==='src/style.css')ok(got===h||got==='2e292f2a84fc17627612f63f3873cf9eb17b11b798a124c645bfb3feea2570cf',`known M16 stylesheet or M15 baseline required: ${f}`);else ok(got===h,`frozen production payload changed: ${f}`);}
const rel=JSON.parse(fs.readFileSync(path.join(ROOT,'release.json'),'utf8'));
ok(rel.milestone==='M15'||rel.milestone==='M16','M15/M16 metadata');
ok((rel.release_status==='1.0.0'&&rel.release_class==='final')||(rel.release_status==='1.0.1'&&rel.release_class==='patch'),'1.0.0 final or 1.0.1 patch metadata');
ok(rel.full_campaign_gate==='PASS-50-of-50-to-ending','campaign gate metadata');
ok(rel.passcode_gate==='PASS-49-of-49-plus-ending','passcode gate metadata');
if(rel.milestone!=='M16'){ok(rel.source_payload_changed_from_m14===false,'M14 frozen-source metadata');ok(rel.source_payload_changed_from_m13===false,'M13 frozen-source metadata')}else ok(rel.runtime_logic_changed_from_m15===false&&rel.stylesheet_changed_from_m15===true,'M16 presentation-only metadata');
ok(['1.0.0','1.0.1'].includes(fs.readFileSync(path.join(ROOT,'VERSION'),'utf8').trim()),'VERSION mismatch');
const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
ok(readme.includes(rel.milestone==='M16'?'Package status: 1.0.1':'FINAL 1.0.0'),'release status missing from README');
ok(!/Package status:\s*1\.0 RELEASE CANDIDATE/i.test(readme),'RC package status still active');
for(const f of ['M15-REPORT.md','PRODUCTION_CHECKLIST.md','THIRD_PARTY_NOTICES.md','LICENSE'])ok(fs.existsSync(path.join(ROOT,f)),`missing ${f}`);
console.log('M15 final-release regression: PASS (runtime/reference frozen; exact M16 stylesheet delta allowed)');
