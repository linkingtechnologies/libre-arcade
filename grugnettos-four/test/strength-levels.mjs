import assert from 'node:assert/strict';
import {getPlayer} from '../public/src/players/registry.js';
import {strengthLevels,getStrengthLevel,selectStrengthMember} from '../public/src/strength/levels.js';
import {strengthSnapshot} from '../public/src/strength/strength-snapshot.js';
import {readFileSync} from 'node:fs';
assert.equal(strengthLevels.length,6);assert.deepEqual(strengthLevels.map(level=>level.members.length),[4,4,4,4,4,3]);
const members=strengthLevels.flatMap(level=>level.members);assert.equal(members.length,23);assert.equal(new Set(members.map(member=>member.playerId)).size,23);
for(const level of strengthLevels){assert(level.name.en&&level.name.it&&level.description.en&&level.description.it);for(const member of level.members){const player=getPlayer(member.playerId),actor=player.create({[player.settings.key]:member.setting});assert(actor);}}
assert.equal(selectStrengthMember('beginner',0).playerId,'michael-bell-bota');
assert.notEqual(selectStrengthMember('beginner',0,'michael-bell-bota').playerId,'michael-bell-bota');
assert.equal(selectStrengthMember('champion',2).playerId,'markus-thill-td-ntuple');assert.throws(()=>getStrengthLevel('unknown'),/Unknown/);
assert.equal(strengthSnapshot.games,1518);assert.equal(strengthSnapshot.ratings.length,23);assert.equal(strengthSnapshot.seeds.length,3);
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');for(const id of['menuPanel','quickPlay','laboratoryBtn','arenaBtn','strength','strengthBody','credits'])assert(html.includes(`id="${id}"`));
console.log('Strength levels: all 23 players clustered across six deterministic levels.');
