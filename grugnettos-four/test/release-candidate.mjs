import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {players,playersByProvenance,provenanceLabels} from '../public/src/players/registry.js';

assert.equal(players.length,23);assert.equal(new Set(players.map(player=>player.id)).size,23);
assert.deepEqual(Object.fromEntries(['historical','derived','control'].map(key=>[key,playersByProvenance(key).length])),{historical:18,derived:4,control:1});
assert.equal(playersByProvenance('all'),players);assert.equal(provenanceLabels.control,'Control');
for(const player of players){assert(player.name&&player.source&&player.license&&player.family);assert(['historical','derived','control'].includes(player.provenance));assert(player.settings?.key);}
assert.equal(playersByProvenance('control')[0].id,'connectlab-control-baseline');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
for(const id of ['aiFilter','standingFilter','standingBody','arenaMeta','arenaResult'])assert(html.includes(`id="${id}"`));
const app=readFileSync(new URL('../public/src/ui/app.js',import.meta.url),'utf8');
assert(app.includes('renderStandings'));assert(app.includes("[CONTROL]"));
console.log('ConnectLab release gate: provenance, registry and Arena UI gates passed.');
