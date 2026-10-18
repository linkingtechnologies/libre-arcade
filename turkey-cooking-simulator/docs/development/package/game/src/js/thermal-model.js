/*
 * Turkey Cooking Simulator - Preservation Core
 * SPDX-License-Identifier: GPL-3.0-only
 *
 * Mathematical preservation port of the thermal core from commit
 * 56bcde6458af8957f8e439d98df8361a43d2f6e5.
 *
 * Important: intentional historical quirks are preserved in compatibility mode:
 * - water loss is accumulated once per thermal tick, not integrated against dt;
 * - cook state depends only on that accumulator;
 * - OvenModel advances thermal time by exactly one second per tick;
 * - large oven changes re-anchor layer initial temperatures every 80 ticks while
 *   error remains above 10 C;
 * - OFF is handled by the UI in the historical game as a 125 F setpoint.
 */

export const BASELINE_COMMIT = '56bcde6458af8957f8e439d98df8361a43d2f6e5';

export const CONSTANTS = Object.freeze({
  density: 1050,
  cp: 2000,
  heatConvection: 9,
  thermalConduct: 0.412,
  initialTemperatureC: 20,
  proportional: 0.004,
  errorToleranceC: 10,
  resetTicks: 80,
  layerFractions: Object.freeze({ skin: 0.85, body: 0.45, core: 0.01 }),
});

export function cToF(celsius) { return (celsius * (9 / 5)) + 32; }
export function fToC(fahrenheit) { return (fahrenheit - 32) * (5 / 9); }
export function lbsToKg(pounds) { return pounds * 0.453592; }

export function calculateRadius(weightKg, density = CONSTANTS.density) {
  const ratioLvG = 1.4;
  const ratioLvH = 2;
  const length = Math.pow(weightKg / ((1 / ratioLvG) * (1 / ratioLvH) * density), 1 / 3);
  const depth = 1 / (ratioLvG / length);
  const height = 1 / (ratioLvH / length);
  const rectangleVolume = depth * height * length;
  return Math.pow(rectangleVolume / ((4 / 3) * Math.PI), 1 / 3);
}

export function waterLoss(temperatureC) {
  return Math.pow(10, (temperatureC - 20) / 80) - 1;
}

export function cookCondition(cookValue) {
  const multiplier = 1;
  if (cookValue >= multiplier * 600000) {
    return ['Fire', (cookValue - 600000) / (multiplier * 600000), 'fire'];
  } else if (cookValue >= multiplier * 250000) {
    return ['Burnt', (cookValue - 250000) / (multiplier * 600000), 'burnt'];
  } else if (cookValue >= multiplier * 150000) {
    return ['Dry', (cookValue - 150000) / (multiplier * 250000), 'dry'];
  } else if (cookValue >= multiplier * 85000) {
    return ['Cooked', (cookValue - 12000) / (multiplier * 150000), 'overcooked'];
  } else if (cookValue >= multiplier * 12000) {
    return ['Cooked', (cookValue - 12000) / (multiplier * 150000), 'cooked'];
  } else if (cookValue >= multiplier * 10000) {
    return ['Undercooked', (cookValue - 5000) / (multiplier * 12000), 'slightly cooked'];
  } else if (cookValue >= multiplier * 5000) {
    return ['Undercooked', (cookValue - 5000) / (multiplier * 12000), 'undercooked'];
  }
  return ['Raw', 1, 'raw'];
}

function lambdaFormula(lambdaN, biot) {
  return 1 - lambdaN * (1 / Math.tan(lambdaN)) - biot;
}

function bisectionMethod(min0, max0, biot) {
  let min = min0;
  let max = max0;
  const errorTolerance = 1 / Math.pow(10, 8);
  let result = Infinity;
  const negativeTest = lambdaFormula(min, biot) * lambdaFormula(max, biot);
  if (negativeTest <= 0) {
    let antiFreeze = 0;
    while (Math.abs(result) > errorTolerance && antiFreeze <= 500) {
      const lambdaN = (min + max) / 2;
      result = lambdaFormula(lambdaN, biot);
      if (Math.abs(result) <= errorTolerance && result <= errorTolerance) {
        return lambdaN;
      } else if ((lambdaFormula(min, biot) * lambdaFormula(lambdaN, biot)) >= 0) {
        min = lambdaN;
      } else if ((lambdaFormula(max, biot) * lambdaFormula(lambdaN, biot)) >= 0) {
        max = lambdaN;
      }
      antiFreeze++;
    }
  }
  return undefined;
}

function findAllRoots(min, max, splitsNum, biot) {
  const step = (max - min) / (splitsNum - 1);
  const storage = [];
  for (let i = step; i < max; i += step) {
    const negativeTest = lambdaFormula(i - step, biot) * lambdaFormula(i, biot);
    if (negativeTest <= 0) {
      const answer = bisectionMethod(i - step, i, biot);
      if (answer !== undefined) storage.push(answer);
    }
  }
  return storage;
}

const lambdaCache = new Map();

function rootsForBiot(biot) {
  // Historical code caches one Biot value globally. A Map keeps the same
  // numerical root generation while avoiding needless regeneration in tests.
  // This optimization does not alter the roots or the series evaluation.
  const key = biot.toString();
  if (!lambdaCache.has(key)) {
    lambdaCache.set(key, findAllRoots(0, 10000, 10000 * Math.PI * 10, biot));
  }
  return lambdaCache.get(key);
}

export function transientSphereSeries({
  density,
  thermalConduct,
  heatConvection,
  cp,
  rPosition,
  rTotal,
  tempInitial,
  tempInfini,
  t,
}) {
  let sum = 0;
  const alpha = thermalConduct / (density * cp);
  const fourier = (alpha * t) / Math.pow(rTotal, 2);
  const biot = heatConvection * rTotal / thermalConduct;
  const roots = rootsForBiot(biot);

  for (let i = 0; i < roots.length; i++) {
    const lambdaN = roots[i];
    const x = lambdaN * rPosition / rTotal;
    const sinPortion = Math.sin(x) / x;
    const exponentialPortion = 1 / Math.exp(Math.pow(lambdaN, 2) * fourier);
    const frontCoefficientPortion = 4 * (Math.sin(lambdaN) - (lambdaN * Math.cos(lambdaN))) /
      (2 * lambdaN - Math.sin(2 * lambdaN));
    sum += frontCoefficientPortion * exponentialPortion * sinPortion;
  }

  return (sum * (tempInitial - tempInfini)) + tempInfini;
}

class TurkeyLayer {
  constructor(name, percentRadius, turkeyModel, ovenModel) {
    this.name = name;
    this.percentRadius = percentRadius;
    this.turkeyModel = turkeyModel;
    this.ovenModel = ovenModel;
    this.initialTemp = CONSTANTS.initialTemperatureC;
    this.waterLost = 0;
    this.finalTemperature = CONSTANTS.initialTemperatureC;
    this.condition = ['Raw', 1, 'raw'];
  }

  updateTemperatureTick() {
    const t = this.turkeyModel;
    const o = this.ovenModel;
    this.finalTemperature = transientSphereSeries({
      density: t.density,
      thermalConduct: t.thermalConduct,
      heatConvection: t.heatConvection,
      cp: t.cp,
      rPosition: this.percentRadius * t.totalRadius,
      rTotal: t.totalRadius,
      tempInitial: this.initialTemp,
      tempInfini: o.steadyTemp,
      t: o.globalTime,
    });
    this.waterLost += waterLoss(this.finalTemperature);
    this.condition = cookCondition(this.waterLost);
  }

  resetLayerTemps() {
    this.initialTemp = this.finalTemperature;
  }

  snapshot() {
    return {
      tempC: this.finalTemperature,
      waterLost: this.waterLost,
      condition: [...this.condition],
    };
  }

  exportState() {
    return {
      initialTemp:this.initialTemp,
      waterLost:this.waterLost,
      finalTemperature:this.finalTemperature,
      condition:[...this.condition],
    };
  }

  importState(state) {
    this.initialTemp=Number(state.initialTemp);
    this.waterLost=Number(state.waterLost);
    this.finalTemperature=Number(state.finalTemperature);
    this.condition=[...state.condition];
  }
}

class TurkeyModel {
  constructor(weightLb, ovenModel) {
    this.density = CONSTANTS.density;
    this.cp = CONSTANTS.cp;
    this.heatConvection = CONSTANTS.heatConvection;
    this.thermalConduct = CONSTANTS.thermalConduct;
    this.totalRadius = calculateRadius(lbsToKg(weightLb), this.density);
    this.layers = {
      skin: new TurkeyLayer('Skin', CONSTANTS.layerFractions.skin, this, ovenModel),
      body: new TurkeyLayer('Body', CONSTANTS.layerFractions.body, this, ovenModel),
      core: new TurkeyLayer('Core', CONSTANTS.layerFractions.core, this, ovenModel),
    };
  }

  updateLayerTemps() {
    this.layers.skin.updateTemperatureTick();
    this.layers.body.updateTemperatureTick();
    this.layers.core.updateTemperatureTick();
  }

  resetLayerTemps() {
    this.layers.skin.resetLayerTemps();
    this.layers.body.resetLayerTemps();
    this.layers.core.resetLayerTemps();
  }
}

export class PreservationOvenModel {
  constructor(weightLb) {
    this.weightLb = Number(weightLb);
    this.tempInfini = 20;
    this.setTemp = 20;
    this.steadyTemp = 20;
    this.steadyTimer = 0;
    this.globalTime = 0;
    this.turkey = new TurkeyModel(weightLb, this);
  }

  changeTemp(setTempC) { this.setTemp = setTempC; }
  setRawTemp(newTempC) { this.tempInfini = newTempC; }
  getRawTemp() { return this.tempInfini; }
  getCookTime() { return this.globalTime; }

  equalizeTemp() {
    const error = Math.abs(this.setTemp - this.tempInfini);
    if (this.setTemp > this.tempInfini) {
      this.tempInfini += error * CONSTANTS.proportional;
    } else if (this.setTemp < this.tempInfini) {
      this.tempInfini -= error * CONSTANTS.proportional;
    }

    if (error > CONSTANTS.errorToleranceC) {
      if (this.steadyTimer >= CONSTANTS.resetTicks) {
        this.steadyTimer = 0;
        this.globalTime = 0;
        this.steadyTemp = this.tempInfini;
        this.turkey.resetLayerTemps();
      }
      return true;
    }
    return undefined;
  }

  secondTick() {
    this.globalTime += 1;
    this.steadyTimer += 1;
    if (!this.equalizeTemp()) {
      this.steadyTemp = this.tempInfini;
    }
    this.turkey.updateLayerTemps();
  }

  tickMany(seconds) {
    for (let i = 0; i < seconds; i++) this.secondTick();
    return this.getTurkeyState();
  }

  exportState() {
    return {
      schemaVersion:1,
      weightLb:this.weightLb,
      tempInfini:this.tempInfini,
      setTemp:this.setTemp,
      steadyTemp:this.steadyTemp,
      steadyTimer:this.steadyTimer,
      globalTime:this.globalTime,
      layers:{
        skin:this.turkey.layers.skin.exportState(),
        body:this.turkey.layers.body.exportState(),
        core:this.turkey.layers.core.exportState(),
      },
    };
  }

  importState(state) {
    if (!state || state.schemaVersion!==1) throw new Error('unsupported thermal state');
    this.tempInfini=Number(state.tempInfini);
    this.setTemp=Number(state.setTemp);
    this.steadyTemp=Number(state.steadyTemp);
    this.steadyTimer=Number(state.steadyTimer);
    this.globalTime=Number(state.globalTime);
    this.turkey.layers.skin.importState(state.layers.skin);
    this.turkey.layers.body.importState(state.layers.body);
    this.turkey.layers.core.importState(state.layers.core);
    return this;
  }

  static fromState(state) {
    if (!state || state.schemaVersion!==1) throw new Error('unsupported thermal state');
    const oven=new PreservationOvenModel(Number(state.weightLb));
    return oven.importState(state);
  }

  getTurkeyState() {
    return {
      skin: this.turkey.layers.skin.snapshot(),
      body: this.turkey.layers.body.snapshot(),
      core: this.turkey.layers.core.snapshot(),
      oven: {
        rawTempC: this.tempInfini,
        steadyTempC: this.steadyTemp,
        globalTime: this.globalTime,
        steadyTimer: this.steadyTimer,
      },
    };
  }
}

export function simulateBaseline({ weightLb, ovenF, seconds }) {
  const oven = new PreservationOvenModel(weightLb);
  oven.changeTemp(fToC(ovenF));
  oven.tickMany(seconds);
  return oven.getTurkeyState();
}

export function clearRootCache() { lambdaCache.clear(); }
