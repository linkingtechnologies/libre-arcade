/*
 * Turkey Cooking Simulator - Preservation Core
 * SPDX-License-Identifier: GPL-3.0-only
 *
 * Port of the thermal core of commit 13afa1230761fa24d13d9df4324ccafb504398bc (the last commit of
 * 1 December 2013) of the original, js/model.js blob 267058590ab103deb91be4d1ff4c57a5ca6a961d.
 * It replaces the package's port of the earlier commit 56bcde6 (analytic series), which is kept in
 * docs/development/package/game/src/js/thermal-model.js. The arithmetic follows the original's
 * order of operations, so that test/model-oracle.test.mjs can compare the two exactly.
 *
 * The model: the turkey is a sphere of the radius of a box 1.4 x 2 as long as it is wide and high,
 * sampled at 20 radial points; every second the points are advanced by ten explicit finite-difference
 * steps of 0.1 s, with the oven's air temperature as a convective boundary. The skin, body and core
 * read points 19, 10 and 1. Water lost accumulates once per second from each layer's temperature,
 * and decides the cook state (the ranges differ between skin/body and core).
 *
 * Kept as the original has it: the oven's air temperature approaches the set point by 0.4 % of the
 * gap each second; the core and body points start at 20 C plus a tiny offset in metres; OFF is a
 * set point that the page chooses (125 F).
 */

export const ORIGINAL_COMMIT = '13afa1230761fa24d13d9df4324ccafb504398bc';

export const CONSTANTS = Object.freeze({
  density: 700,
  cp: 2810,
  heatConvection: 9,
  thermalConduct: 0.412,
  initialTemperatureC: 20,
  proportional: 0.004,
  errorToleranceC: 10,
  splitsNum: 20,
  deltat: 0.1,
  layerPoints: Object.freeze({ skin: 19, body: 10, core: 1 }),
});

export function cToF(celsius) { return (celsius * (9 / 5)) + 32; }
export function fToC(fahrenheit) { return (fahrenheit - 32) * (5 / 9); }
export function lbsToKg(pounds) { return pounds * 0.453592; }

export function calculateRadius(weightKg, density = CONSTANTS.density) {
  const ratioLvG = 1.4;
  const ratioLvH = 2;
  const length = Math.pow(weightKg / ((1 / ratioLvG) * (1 / ratioLvH) * density), (1 / 3));
  const depth = 1 / (ratioLvG / length);
  const height = 1 / (ratioLvH / length);
  const rectangleVolume = depth * height * length;
  return Math.pow(rectangleVolume / ((4 / 3) * Math.PI), 1 / 3);
}

export function waterLoss(temperatureC) {
  return Math.pow(10, (temperatureC - 20) / 80) - 1;
}

export function cookCondition(cookValue, layerName) {
  if (layerName === 'Skin' || layerName === 'Body') {
    if (cookValue >= 600000) return ['Fire', cookValue / 700000, 'fire'];
    if (cookValue >= 400000) return ['Burnt', cookValue / 600000, 'burnt'];
    if (cookValue >= 300000) return ['Dry', cookValue / 350000, 'dry'];
    if (cookValue >= 250000) return ['Cooked', cookValue / 300000, 'overcooked'];
    if (cookValue >= 80000) return ['Cooked', cookValue / 250000, 'cooked'];
    if (cookValue >= 50000) return ['Undercooked', cookValue / 80000, 'slightly cooked'];
    if (cookValue >= 25000) return ['Undercooked', cookValue / 50000, 'undercooked'];
    return ['Raw', 1, 'raw'];
  }
  if (cookValue >= 45000) return ['Fire', cookValue / 600000, 'fire'];
  if (cookValue >= 35000) return ['Burnt', cookValue / 45000, 'burnt'];
  if (cookValue >= 25000) return ['Dry', cookValue / 35000, 'dry'];
  if (cookValue >= 22000) return ['Cooked', cookValue / 25000, 'overcooked'];
  if (cookValue >= 12000) return ['Cooked', cookValue / 22000, 'cooked'];
  if (cookValue >= 7000) return ['Undercooked', cookValue / 12000, 'slightly cooked'];
  if (cookValue >= 3000) return ['Undercooked', cookValue / 7000, 'undercooked'];
  return ['Raw', 1, 'raw'];
}

// One second of heat flow through the sphere: ten explicit steps of 0.1 s, in place on globTemp (as the original does).
export function advanceTemperatures({ density, thermalConduct, heatConvection, cp, tempInfinity, splitsNum, deltar, globTemp, pointRadius }) {
  const deltat = CONSTANTS.deltat;
  const alpha = thermalConduct / (density * cp);

  for (let j = 0; j < (1 / deltat); j++) {
    const dTdr = [];
    for (let k = 0; k < splitsNum; k++) {
      if (k === 0) dTdr.push((globTemp[1] - globTemp[0]) / deltar);
      else if (k === splitsNum - 1) dTdr.push((globTemp[splitsNum - 1] - globTemp[splitsNum - 2]) / deltar);
      else dTdr.push((globTemp[k + 1] - globTemp[k - 1]) / (2 * deltar));
    }
    dTdr[splitsNum - 1] = heatConvection * (tempInfinity - globTemp[splitsNum - 1]) / thermalConduct;

    const parenthesis = [];
    for (let k = 0; k < splitsNum; k++) parenthesis.push(dTdr[k] * Math.pow(pointRadius[k], 2));

    const dPdr = [];
    for (let k = 0; k < splitsNum; k++) {
      if (k === 0) dPdr.push((parenthesis[1] - parenthesis[0]) / deltar);
      else if (k === splitsNum - 1) dPdr.push((parenthesis[splitsNum - 1] - parenthesis[splitsNum - 2]) / deltar);
      else dPdr.push((parenthesis[k + 1] - parenthesis[k - 1]) / (2 * deltar));
    }

    for (let k = 0; k < splitsNum; k++) {
      globTemp[k] = alpha * dPdr[k] / Math.pow(pointRadius[k], 2) * deltat + globTemp[k];
    }
  }
  return globTemp;
}

class TurkeyLayer {
  constructor(name, layerNumber, turkeyModel) {
    this.name = name;
    this.layerNumber = layerNumber;
    this.turkeyModel = turkeyModel;
    this.waterLost = 0;
    this.finalTemperature = CONSTANTS.initialTemperatureC;
    this.condition = ['Raw', 1, 'raw'];
    this.highestTemp = 0;
  }

  updateTemperatureTick() {
    this.finalTemperature = this.turkeyModel.globTemp[this.layerNumber];
    this.highestTemp = this.finalTemperature > this.highestTemp ? this.finalTemperature : this.highestTemp;
    this.waterLost += waterLoss(this.finalTemperature);
    this.condition = cookCondition(this.waterLost, this.name);
  }

  snapshot() {
    return {
      tempC: this.finalTemperature,
      waterLost: this.waterLost,
      condition: [...this.condition],
      highestC: this.highestTemp,
    };
  }

  exportState() {
    return {
      waterLost: this.waterLost,
      finalTemperature: this.finalTemperature,
      highestTemp: this.highestTemp,
      condition: [...this.condition],
    };
  }

  importState(state) {
    this.waterLost = Number(state.waterLost);
    this.finalTemperature = Number(state.finalTemperature);
    this.highestTemp = Number(state.highestTemp);
    this.condition = [...state.condition];
  }
}

class TurkeyModel {
  constructor(weightLb) {
    this.density = CONSTANTS.density;
    this.cp = CONSTANTS.cp;
    this.heatConvection = CONSTANTS.heatConvection;
    this.thermalConduct = CONSTANTS.thermalConduct;
    this.splitsNum = CONSTANTS.splitsNum;
    this.totalRadius = calculateRadius(lbsToKg(weightLb), this.density);
    this.layers = {
      skin: new TurkeyLayer('Skin', CONSTANTS.layerPoints.skin, this),
      body: new TurkeyLayer('Body', CONSTANTS.layerPoints.body, this),
      core: new TurkeyLayer('Core', CONSTANTS.layerPoints.core, this),
    };
    this.globTemp = [];
    this.pointRadius = [];
    this.deltar = this.totalRadius / this.splitsNum;
    const step = (this.totalRadius - this.deltar) / (this.splitsNum - 1);
    for (let i = 0; i < this.splitsNum; i++) {
      this.pointRadius.push(step * i + this.deltar);
      this.globTemp.push(20 + step * i);
    }
  }

  updateLayerTemps(tempInfinity) {
    this.globTemp = advanceTemperatures({
      density: this.density,
      thermalConduct: this.thermalConduct,
      heatConvection: this.heatConvection,
      cp: this.cp,
      tempInfinity,
      splitsNum: this.splitsNum,
      deltar: this.deltar,
      globTemp: this.globTemp,
      pointRadius: this.pointRadius,
    });
    this.layers.skin.updateTemperatureTick();
    this.layers.body.updateTemperatureTick();
    this.layers.core.updateTemperatureTick();
  }
}

export class PreservationOvenModel {
  constructor(weightLb) {
    this.weightLb = Number(weightLb);
    this.tempInfini = 20;
    this.setTemp = 20;
    this.globalTime = 0;
    this.turkey = new TurkeyModel(weightLb);
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
    return error > CONSTANTS.errorToleranceC ? true : undefined;
  }

  secondTick() {
    this.globalTime += 1;
    this.equalizeTemp();
    this.turkey.updateLayerTemps(this.tempInfini);
  }

  tickMany(seconds) {
    for (let i = 0; i < seconds; i++) this.secondTick();
    return this.getTurkeyState();
  }

  exportState() {
    return {
      schemaVersion: 3,
      weightLb: this.weightLb,
      tempInfini: this.tempInfini,
      setTemp: this.setTemp,
      globalTime: this.globalTime,
      globTemp: [...this.turkey.globTemp],
      layers: {
        skin: this.turkey.layers.skin.exportState(),
        body: this.turkey.layers.body.exportState(),
        core: this.turkey.layers.core.exportState(),
      },
    };
  }

  importState(state) {
    if (!state || state.schemaVersion !== 3) throw new Error('unsupported thermal state');
    this.tempInfini = Number(state.tempInfini);
    this.setTemp = Number(state.setTemp);
    this.globalTime = Number(state.globalTime);
    this.turkey.globTemp = state.globTemp.map(Number);
    this.turkey.layers.skin.importState(state.layers.skin);
    this.turkey.layers.body.importState(state.layers.body);
    this.turkey.layers.core.importState(state.layers.core);
    return this;
  }

  static fromState(state) {
    if (!state || state.schemaVersion !== 3) throw new Error('unsupported thermal state');
    return new PreservationOvenModel(Number(state.weightLb)).importState(state);
  }

  getTurkeyState() {
    return {
      skin: this.turkey.layers.skin.snapshot(),
      body: this.turkey.layers.body.snapshot(),
      core: this.turkey.layers.core.snapshot(),
      oven: {
        rawTempC: this.tempInfini,
        globalTime: this.globalTime,
      },
    };
  }
}

export function simulate({ weightLb, ovenF, seconds }) {
  const oven = new PreservationOvenModel(weightLb);
  oven.changeTemp(fToC(ovenF));
  oven.tickMany(seconds);
  return oven.getTurkeyState();
}
