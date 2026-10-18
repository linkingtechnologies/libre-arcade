import fs from 'node:fs';
import { LegacyOven, legacyScenario, LegacyUtility } from './legacy-reference.js';
import { scenarios } from './scenarios.js';

const result = { baselineCommit:'56bcde6458af8957f8e439d98df8361a43d2f6e5', generatedBy:'tests/legacy-reference.js', tests:{} };
for (const s of scenarios) result.tests[s.id] = { input:s, expected:legacyScenario(s.weightLb, s.ovenF, s.seconds) };

// T11: force the historical temperature re-anchoring path.
const t11 = new LegacyOven(15);
t11.changeTemp(LegacyUtility.F2C(350)); t11.tickMany(1800);
const before = t11.state();
t11.changeTemp(LegacyUtility.F2C(425)); t11.tickMany(900);
result.tests.T11 = { input:{weightLb:15, phases:[{ovenF:350,seconds:1800},{ovenF:425,seconds:900}]}, beforeChange:before, expected:t11.state(), note:'temperature change exercises 80-tick re-anchor/reset behavior' };

// T12: UI/browser-clock semantics from ui.js. One callback => one thermal tick,
// regardless of actual diff; game clock advances by diff.
const t12 = new LegacyOven(15); t12.changeTemp(LegacyUtility.F2C(350));
let gameClockAdvanceMs = 0;
for (const diff of [1001, 5000, 1001]) { t12.secondTick(); gameClockAdvanceMs += diff; }
result.tests.T12 = { input:{weightLb:15,ovenF:350,callbackDiffMs:[1001,5000,1001]}, expected:{thermalState:t12.state(), thermalTicks:3, gameClockAdvanceMs}, note:'documents historical browser-stall desynchronization' };

fs.writeFileSync(new URL('./oracle.json', import.meta.url), JSON.stringify(result,null,2)+'\n');
console.log('wrote tests/oracle.json');
