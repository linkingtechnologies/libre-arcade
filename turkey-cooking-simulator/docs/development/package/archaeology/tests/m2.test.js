import assert from 'node:assert/strict';
import { PreservationOvenModel, fToC } from '../src/js/thermal-model.js';
import { RuntimeClock, TimingMode, DoorState, AlarmClock, OvenInteractionController } from '../src/js/runtime.js';

function close(a,b,tol=1e-10,msg='') { assert.ok(Math.abs(a-b) <= tol, `${msg}: ${a} != ${b}`); }

// M2-01: exact 1000 ms is NOT a legacy tick (historical condition was > 1000).
{
  const oven = new PreservationOvenModel(15); oven.changeTemp(fToC(350));
  const clock = new RuntimeClock({ ovenModel: oven, startTimeMs: 0, timingMode: TimingMode.LEGACY });
  clock.advanceWallClock(1000);
  assert.equal(oven.getCookTime(), 0);
  assert.equal(clock.currentTimeMs, 0);
  console.log('PASS M2-01 legacy boundary diff == 1000 ms');
}

// M2-02: legacy stall reproduces one thermal tick for five seconds elapsed.
{
  const oven = new PreservationOvenModel(15); oven.changeTemp(fToC(350));
  const clock = new RuntimeClock({ ovenModel: oven, startTimeMs: 0, timingMode: TimingMode.LEGACY });
  clock.advanceWallClock(5000);
  assert.equal(oven.getCookTime(), 1);
  assert.equal(clock.currentTimeMs, 5000);
  console.log('PASS M2-02 legacy browser-stall desynchronization');
}

// M2-03: fixed-step mode catches up five thermal seconds.
{
  const oven = new PreservationOvenModel(15); oven.changeTemp(fToC(350));
  const clock = new RuntimeClock({ ovenModel: oven, startTimeMs: 0, timingMode: TimingMode.FIXED_STEP });
  clock.advanceWallClock(5000);
  assert.equal(oven.getCookTime(), 5);
  assert.equal(clock.currentTimeMs, 5000);
  assert.equal(clock.pendingMs, 0);
  console.log('PASS M2-03 fixed-step stall catch-up');
}

// M2-04: fixed-step remainder is deterministic and frame-rate independent.
{
  const a = new PreservationOvenModel(10); a.changeTemp(fToC(325));
  const b = new PreservationOvenModel(10); b.changeTemp(fToC(325));
  const ca = new RuntimeClock({ ovenModel:a, timingMode:TimingMode.FIXED_STEP });
  const cb = new RuntimeClock({ ovenModel:b, timingMode:TimingMode.FIXED_STEP });
  for (let t = 250; t <= 5000; t += 250) ca.advanceWallClock(t);
  cb.advanceWallClock(5000);
  const sa=a.getTurkeyState(), sb=b.getTurkeyState();
  assert.equal(sa.oven.globalTime, sb.oven.globalTime);
  for (const layer of ['skin','body','core']) close(sa[layer].tempC, sb[layer].tempC, 1e-10, layer);
  console.log('PASS M2-04 fixed-step frame-rate independence');
}

// M2-05: skip is exactly 1200 thermal ticks and +20 game minutes.
{
  const oven = new PreservationOvenModel(15); oven.changeTemp(fToC(350));
  const clock = new RuntimeClock({ ovenModel:oven, startTimeMs:123456, timingMode:TimingMode.FIXED_STEP });
  clock.skipSeconds(1200);
  assert.equal(clock.thermalTicks,1200);
  assert.equal(clock.currentTimeMs,123456+1200000);
  assert.equal(oven.getCookTime(), oven.getTurkeyState().oven.globalTime);
  console.log('PASS M2-05 deterministic 20-minute skip');
}

// M2-06: opening the door has no thermal side effect in the frozen baseline.
{
  const oven = new PreservationOvenModel(15); oven.changeTemp(fToC(350));
  const clock = new RuntimeClock({ovenModel:oven});
  const ctl = new OvenInteractionController({ovenModel:oven,runtimeClock:clock});
  const before = oven.getRawTemp();
  assert.equal(ctl.fullOpenOrClose(),DoorState.OPEN);
  assert.equal(oven.getRawTemp(),before);
  assert.equal(ctl.ovenOpened,1);
  console.log('PASS M2-06 full-open baseline has no cooling');
}

// M2-07: historical full-open close lands in PEEK.
{
  const oven = new PreservationOvenModel(15); const clock = new RuntimeClock({ovenModel:oven});
  const ctl = new OvenInteractionController({ovenModel:oven,runtimeClock:clock});
  ctl.fullOpenOrClose();
  assert.equal(ctl.fullOpenOrClose(),DoorState.PEEK);
  assert.equal(ctl.peek(),DoorState.CLOSED);
  console.log('PASS M2-07 historical door state transitions');
}

// M2-08: thermometer requires fully-open door.
{
  const oven = new PreservationOvenModel(15); oven.changeTemp(fToC(350)); oven.tickMany(60);
  const clock = new RuntimeClock({ovenModel:oven});
  const ctl = new OvenInteractionController({ovenModel:oven,runtimeClock:clock});
  assert.equal(ctl.readCoreTemperatureC(),null);
  ctl.peek(); assert.equal(ctl.readCoreTemperatureC(),null);
  ctl.peek(); ctl.fullOpenOrClose();
  close(ctl.readCoreTemperatureC(),oven.getTurkeyState().core.tempC,1e-12,'probe');
  console.log('PASS M2-08 probe requires full-open door');
}

// M2-09: historical alarm skip can go negative and does not ring immediately.
{
  const oven = new PreservationOvenModel(15); const clock = new RuntimeClock({ovenModel:oven});
  const alarm = new AlarmClock(); alarm.addSeconds(300);
  const ctl = new OvenInteractionController({ovenModel:oven,runtimeClock:clock,alarm});
  ctl.casualSkip20Minutes({legacyAlarm:true});
  assert.equal(alarm.remainingSeconds,-900);
  assert.equal(alarm.active,true);
  assert.equal(alarm.rang,false);
  console.log('PASS M2-09 historical skip/alarm negative-counter quirk');
}

// M2-10: modern alarm policy clamps and rings when explicitly selected.
{
  const oven = new PreservationOvenModel(15); const clock = new RuntimeClock({ovenModel:oven});
  const alarm = new AlarmClock(); alarm.addSeconds(300);
  const ctl = new OvenInteractionController({ovenModel:oven,runtimeClock:clock,alarm});
  ctl.casualSkip20Minutes({legacyAlarm:false});
  assert.equal(alarm.remainingSeconds,0);
  assert.equal(alarm.rang,true);
  console.log('PASS M2-10 modern alarm skip policy is explicit');
}

console.log('\nM2 Runtime / Oven Interaction: 10/10 tests passed.');
