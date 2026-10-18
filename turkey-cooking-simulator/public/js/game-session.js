/*
 * Turkey Cooking Simulator - Complete headless gameplay session
 * SPDX-License-Identifier: GPL-3.0-only
 *
 * Integrates the thermal preservation core, deterministic runtime/oven
 * interactions, and headless gameplay state into an end-to-end session.
 */
import { PreservationOvenModel, fToC, cToF } from './thermal-model.js';
import { RuntimeClock, TimingMode, AlarmClock, OvenInteractionController, DoorState } from './runtime.js';
import { HeadlessGameState, Difficulty, calculateLegacyScore } from './gameplay-state.js';

export const SessionPhase = Object.freeze({
  SHOPPING: 'shopping',
  COOKING: 'cooking',
  FINISHED: 'finished',
});

export class GameSession {
  constructor({
    gameState = new HeadlessGameState(),
    timingMode = TimingMode.FIXED_STEP,
    startTimeMs = 0,
  } = {}) {
    this.game = gameState;
    this.initialGameState = gameState.snapshot();
    this.phase = SessionPhase.SHOPPING;
    this.timingMode = timingMode;
    this.startTimeMs = startTimeMs;
    this.oven = null;
    this.clock = null;
    this.alarm = new AlarmClock();
    this.interactions = null;
    this.finalResult = null;
    this.actionLog = [];
  }

  record(type, data = {}) {
    const event = { index: this.actionLog.length, type, ...data };
    this.actionLog.push(event);
    return event;
  }

  visitStore() {
    this.game.visitStore();
    this.record('visit-store');
  }

  purchase(name) {
    if (this.phase !== SessionPhase.SHOPPING) return { ok:false, reason:'market-closed' };
    const result = this.game.purchase(name);
    this.record('purchase', { name, ok:result.ok, reason:result.reason ?? null });
    return result;
  }

  startCooking() {
    if (this.phase !== SessionPhase.SHOPPING) return { ok:false, reason:'invalid-phase' };
    if (!this.game.turkeyBought) return { ok:false, reason:'turkey-required' };
    this.oven = new PreservationOvenModel(this.game.turkeyWeight);
    this.clock = new RuntimeClock({ ovenModel:this.oven, startTimeMs:this.startTimeMs, timingMode:this.timingMode });
    this.interactions = new OvenInteractionController({ ovenModel:this.oven, runtimeClock:this.clock, alarm:this.alarm });
    this.phase = SessionPhase.COOKING;
    this.record('start-cooking', { turkeyType:this.game.turkeyType, turkeyWeight:this.game.turkeyWeight });
    return { ok:true };
  }

  setOvenF(tempF) {
    if (this.phase !== SessionPhase.COOKING) return { ok:false, reason:'not-cooking' };
    if (!Number.isFinite(tempF)) return { ok:false, reason:'invalid-temperature' };
    this.oven.changeTemp(fToC(tempF));
    this.record('set-oven', { tempF });
    return { ok:true, tempF };
  }

  advanceWallClock(nowMs) {
    if (this.phase !== SessionPhase.COOKING) return { ok:false, reason:'not-cooking' };
    const before = this.clock.thermalTicks;
    const snap = this.clock.advanceWallClock(nowMs);
    const added = this.clock.thermalTicks - before;
    this.game.turkeyCookCounter += added;
    if (added > 0 && this.alarm.active) this.alarm.tick(added);
    this.record('advance-wall-clock', { nowMs, thermalTicks:added });
    return { ok:true, thermalTicks:added, snapshot:snap };
  }

  addAlarmSeconds(seconds) {
    if (!this.game.alarmBought) return { ok:false, reason:'alarm-not-owned' };
    this.alarm.addSeconds(seconds);
    this.record('alarm-add', { seconds });
    return { ok:true, remainingSeconds:this.alarm.remainingSeconds };
  }

  peekDoor() {
    if (this.phase !== SessionPhase.COOKING) return { ok:false, reason:'not-cooking' };
    const state = this.interactions.peek();
    if (state === DoorState.PEEK) {
      const turkey = this.oven.getTurkeyState();
      this.game.addRecord({ type:'peek', atMs:this.clock.currentTimeMs, appearance:turkey.skin.condition[2] });
    }
    this.record('door-peek', { doorState:state });
    return { ok:true, doorState:state };
  }

  fullOpenOrCloseDoor() {
    if (this.phase !== SessionPhase.COOKING) return { ok:false, reason:'not-cooking' };
    const before = this.interactions.doorState;
    const state = this.interactions.fullOpenOrClose();
    if (before !== DoorState.OPEN && state === DoorState.OPEN) {
      this.game.ovenOpened += 1;
      const turkey = this.oven.getTurkeyState();
      this.game.addRecord({ type:'open', atMs:this.clock.currentTimeMs, appearance:turkey.skin.condition[2] });
    }
    this.record('door-full', { doorState:state });
    return { ok:true, doorState:state };
  }

  readProbeF() {
    if (!this.game.hasProbe) return { ok:false, reason:'probe-not-owned' };
    if (this.phase !== SessionPhase.COOKING) return { ok:false, reason:'not-cooking' };
    const tempC = this.interactions.readCoreTemperatureC();
    if (tempC === null) return { ok:false, reason:'door-not-open' };
    const tempF = cToF(tempC);
    this.game.addRecord({ type:'probe', atMs:this.clock.currentTimeMs, coreTempF:tempF });
    this.record('probe', { coreTempF:tempF });
    return { ok:true, tempC, tempF };
  }

  casualSkip20Minutes({ legacyAlarm = true } = {}) {
    if (this.phase !== SessionPhase.COOKING) return { ok:false, reason:'not-cooking' };
    if (this.game.difficulty !== Difficulty.CASUAL) return { ok:false, reason:'hardcore-no-skip' };
    const before = this.clock.thermalTicks;
    const snap = this.interactions.casualSkip20Minutes({ legacyAlarm });
    const added = this.clock.thermalTicks - before;
    this.game.turkeyCookCounter += added;
    this.record('skip-20m', { thermalTicks:added, legacyAlarm });
    return { ok:true, thermalTicks:added, snapshot:snap };
  }

  finalize() {
    if (this.phase !== SessionPhase.COOKING) return { ok:false, reason:'not-cooking' };
    const turkey = this.oven.getTurkeyState();
    const score = calculateLegacyScore(turkey, {
      turkeyTypeModifier:this.game.turkeyTypeModifier,
      stuffingTypeModifier:this.game.stuffingTypeModifier,
      frillsModifier:this.game.frillsModifier,
      hardcoreModifier:this.game.hardcoreModifier,
    });
    this.finalResult = {
      turkey,
      score,
      turkeyCookCounter:this.game.turkeyCookCounter,
      gameTimeMs:this.clock.currentTimeMs - this.startTimeMs,
      difficulty:this.game.difficulty,
      modifiers:{
        turkeyTypeModifier:this.game.turkeyTypeModifier,
        stuffingTypeModifier:this.game.stuffingTypeModifier,
        frillsModifier:this.game.frillsModifier,
        hardcoreModifier:this.game.hardcoreModifier,
      },
    };
    this.phase = SessionPhase.FINISHED;
    this.record('finalize', { roundedTotal:score.roundedTotal });
    return { ok:true, result:this.finalResult };
  }

  snapshot() {
    return {
      schemaVersion:2,
      phase:this.phase,
      timingMode:this.timingMode,
      startTimeMs:this.startTimeMs,
      initialGameState:JSON.parse(JSON.stringify(this.initialGameState)),
      game:this.game.snapshot(),
      ovenState:this.oven ? this.oven.exportState() : null,
      runtime:this.clock ? this.clock.snapshot() : null,
      alarm:this.alarm.snapshot(),
      interaction:this.interactions ? {doorState:this.interactions.doorState,ovenOpened:this.interactions.ovenOpened} : null,
      finalResult:this.finalResult ? JSON.parse(JSON.stringify(this.finalResult)) : null,
      actionLog:this.actionLog.map(x=>({...x})),
    };
  }

  static restore(snapshot) {
    if (!snapshot || snapshot.schemaVersion !== 2) throw new Error('unsupported session snapshot');
    const game=HeadlessGameState.fromState(snapshot.game);
    const session=new GameSession({gameState:game,timingMode:snapshot.timingMode,startTimeMs:snapshot.startTimeMs});
    session.initialGameState=JSON.parse(JSON.stringify(snapshot.initialGameState));
    session.phase=snapshot.phase;
    session.alarm=AlarmClock.fromState(snapshot.alarm ?? {remainingSeconds:0,active:false,rang:false});
    session.finalResult=snapshot.finalResult ? JSON.parse(JSON.stringify(snapshot.finalResult)) : null;
    session.actionLog=(snapshot.actionLog ?? []).map(x=>({...x}));
    if (snapshot.ovenState) {
      session.oven=PreservationOvenModel.fromState(snapshot.ovenState);
      session.clock=RuntimeClock.fromState({ovenModel:session.oven,state:snapshot.runtime});
      session.interactions=new OvenInteractionController({ovenModel:session.oven,runtimeClock:session.clock,alarm:session.alarm});
      if (snapshot.interaction) session.interactions.importState(snapshot.interaction);
    }
    return session;
  }
}

export function replayActionLog(snapshotOrSession) {
  const source=snapshotOrSession instanceof GameSession ? snapshotOrSession.snapshot() : snapshotOrSession;
  if (!source || source.schemaVersion!==2) throw new Error('replay requires a compatible session snapshot');
  const game=HeadlessGameState.fromState(source.initialGameState);
  const replay=new GameSession({gameState:game,timingMode:source.timingMode,startTimeMs:source.startTimeMs});
  for (const event of source.actionLog) {
    switch(event.type) {
      case 'visit-store': replay.visitStore(); break;
      case 'purchase': replay.purchase(event.name); break;
      case 'start-cooking': replay.startCooking(); break;
      case 'set-oven': replay.setOvenF(event.tempF); break;
      case 'advance-wall-clock': replay.advanceWallClock(event.nowMs); break;
      case 'alarm-add': replay.addAlarmSeconds(event.seconds); break;
      case 'door-peek': replay.peekDoor(); break;
      case 'door-full': replay.fullOpenOrCloseDoor(); break;
      case 'probe': replay.readProbeF(); break;
      case 'skip-20m': replay.casualSkip20Minutes({legacyAlarm:event.legacyAlarm}); break;
      case 'finalize': replay.finalize(); break;
      default: throw new Error(`unsupported replay event: ${event.type}`);
    }
  }
  return replay;
}


export function runHeadlessScenario({
  difficulty = Difficulty.CASUAL,
  gameState,
  ovenF = 350,
  skipCount = 0,
  realSeconds = 0,
  buy = [],
  openForProbe = false,
} = {}) {
  const state = gameState ?? new HeadlessGameState({ difficulty });
  state.setDifficulty(difficulty);
  const session = new GameSession({ gameState:state });
  session.visitStore();
  const purchases = buy.map(name=>session.purchase(name));
  const started = session.startCooking();
  if (!started.ok) return { session, purchases, started, finalized:null };
  session.setOvenF(ovenF);
  for (let i=0;i<skipCount;i++) session.casualSkip20Minutes();
  if (realSeconds > 0) session.advanceWallClock(realSeconds * 1000);
  if (openForProbe) session.fullOpenOrCloseDoor();
  const probe = openForProbe ? session.readProbeF() : null;
  const finalized = session.finalize();
  return { session, purchases, started, probe, finalized };
}
