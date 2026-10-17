import fs from 'node:fs';
const m=JSON.parse(fs.readFileSync('data/sprites.json','utf8'));const counts={};let missing=[];
for(const x of m){const g=x.png.split('/')[1];counts[g]=(counts[g]||0)+1;if(!fs.existsSync(x.png))missing.push(x.png);}
const expected={'000_locomotive':320,'001_charbon':320,'002_buches':320,'003_balles':320,'004_moteur':320,'005_citerne':320,'006_wagon':50,'007_pluslong':50,'008_pluscourt':50,'009_vitesse':50,'010_vie':50,'011_nouveau_wagon':50,'012_logo_vie':1,'013_rail':11,'014_dir':12,'016_chiffres':10,'019_deco':24,'021_fleche_gauche':20,'022_fleche_droite':20,'031_menu':1,'032_fond_hr':1,'033_fond_hrr':1,'034_fond_menu':1,'035_fond':1};
for(const [g,n] of Object.entries(expected))if(counts[g]!==n)throw Error(`${g}: ${counts[g]} != ${n}`);
for(const lang of ['it','en']){for(const n of ['T_level','T_lives','T_options','T_score','T_press_any_key','T_question','T_better_scores'])if(!fs.existsSync(`ui/${lang}/${n}.png`))missing.push(`ui/${lang}/${n}.png`);for(let i=1;i<=30;i++)for(const prefix of ['T_tart','T_art'])if(!fs.existsSync(`ui/${lang}/${prefix}${i}.png`))missing.push(`ui/${lang}/${prefix}${i}.png`);}
if(missing.length)throw Error(`missing ${missing.slice(0,10).join(',')}`);
console.log(JSON.stringify({status:'PASS',manifest_entries:m.length,groups:expected,quiz_and_score_ui_files:124,missing:0},null,2));
