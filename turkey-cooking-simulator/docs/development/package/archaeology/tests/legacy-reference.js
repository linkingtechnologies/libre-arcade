/* Literal behavioral oracle derived from baseline js/model.js.
 * Kept deliberately close to the 2013 control flow. GPL-3.0-only.
 */
const U = {
  cachedBiot: null,
  cachedLambda: null,
  calculateRadius(weight, density) {
    const ratioLvG = 1.4;
    const ratioLvH = 2;
    const length = Math.pow(weight / ((1 / ratioLvG) * (1 / ratioLvH) * density), (1 / 3));
    const depth = 1 / (ratioLvG / length);
    const height = 1 / (ratioLvH / length);
    const rectangleVolume = depth * height * length;
    return Math.pow(rectangleVolume / ((4 / 3) * Math.PI), 1 / 3);
  },
  findAllRoots(min, max, splitsNum, Biot) {
    const step = (max - min) / (splitsNum - 1);
    const storage = [];
    for (let i = step; i < max; i = i + step) {
      const negativeTest = this.lambdaFormula(i - step, Biot) * this.lambdaFormula(i, Biot);
      if (negativeTest <= 0) {
        const answer = this.bisectionMethod(i - step, i, Biot);
        if (answer !== undefined) storage.push(answer);
      }
    }
    return storage;
  },
  waterLoss(temperature) { return Math.pow(10, (temperature - 20) / 80) - 1; },
  bisectionMethod(min0, max0, Biot) {
    let min = min0;
    let max = max0;
    const errorTolerance = 1 / Math.pow(10, 8);
    let result = Infinity;
    const negativeTest = this.lambdaFormula(min, Biot) * this.lambdaFormula(max, Biot);
    if (negativeTest <= 0) {
      let antiFreeze = 0;
      while (Math.abs(result) > errorTolerance && antiFreeze <= 500) {
        const lambdaN = (min + max) / 2;
        result = this.lambdaFormula(lambdaN, Biot);
        if (Math.abs(result) <= errorTolerance && result <= errorTolerance) return lambdaN;
        else if ((this.lambdaFormula(min, Biot) * this.lambdaFormula(lambdaN, Biot)) >= 0) min = lambdaN;
        else if ((this.lambdaFormula(max, Biot) * this.lambdaFormula(lambdaN, Biot)) >= 0) max = lambdaN;
        antiFreeze++;
      }
    }
    return undefined;
  },
  lambdaFormula(lambdaN, Biot) { return 1 - lambdaN * (1 / Math.tan(lambdaN)) - Biot; },
  transientSphereSeries(density, thermalConduct, heatConvection, cp, rPosition, rTotal, tempInitial, tempInfini, t) {
    const min = 0;
    const max = 10000;
    let sum = 0;
    const alpha = thermalConduct / (density * cp);
    const Fourier = (alpha * t) / Math.pow(rTotal, 2);
    const biotNum = heatConvection * rTotal / thermalConduct;
    if (biotNum != this.cachedBiot) {
      this.cachedLambda = this.findAllRoots(min, max, max * Math.PI * 10, biotNum);
      this.cachedBiot = biotNum;
    }
    for (let i = 0; i < this.cachedLambda.length; i++) {
      const lambdaN = this.cachedLambda[i];
      const sinPortion = Math.sin(lambdaN * rPosition / rTotal) / (lambdaN * rPosition / rTotal);
      const exponentialPortion = 1 / Math.exp(Math.pow(lambdaN, 2) * Fourier);
      const frontCoefficientPortion = 4 * (Math.sin(lambdaN) - (lambdaN * Math.cos(lambdaN))) / (2 * lambdaN - Math.sin(2 * lambdaN));
      sum = frontCoefficientPortion * exponentialPortion * sinPortion + sum;
    }
    return (sum * (tempInitial - tempInfini)) + tempInfini;
  },
  F2C(f) { return (f - 32) * (5 / 9); },
  lbs2kgs(p) { return p * 0.453592; },
  cookCondition(cookValue) {
    const multiplier = 1;
    if (cookValue >= multiplier * 600000) return ['Fire', (cookValue - 600000) / (multiplier * 600000), 'fire'];
    else if (cookValue >= multiplier * 250000) return ['Burnt', (cookValue - 250000) / (multiplier * 600000), 'burnt'];
    else if (cookValue >= multiplier * 150000) return ['Dry', (cookValue - 150000) / (multiplier * 250000), 'dry'];
    else if (cookValue >= multiplier * 85000) return ['Cooked', (cookValue - 12000) / (multiplier * 150000), 'overcooked'];
    else if (cookValue >= multiplier * 12000) return ['Cooked', (cookValue - 12000) / (multiplier * 150000), 'cooked'];
    else if (cookValue >= multiplier * 10000) return ['Undercooked', (cookValue - 5000) / (multiplier * 12000), 'slightly cooked'];
    else if (cookValue >= multiplier * 5000) return ['Undercooked', (cookValue - 5000) / (multiplier * 12000), 'undercooked'];
    return ['Raw', 1, 'raw'];
  },
};

class Layer {
  constructor(name, p, turkey, oven) {
    this.name = name; this.p = p; this.turkey = turkey; this.oven = oven;
    this.initialTemp = 20; this.waterLost = 0; this.finalTemperature = 20; this.cookCondition = 'Raw';
  }
  tick() {
    const t = this.turkey, o = this.oven;
    this.finalTemperature = U.transientSphereSeries(t.density, t.thermalConduct, t.heatConvection, t.cp, this.p * t.totalRadius, t.totalRadius, this.initialTemp, o.steadyTemp, o.globalTime);
    this.waterLost += U.waterLoss(this.finalTemperature);
    this.cookCondition = U.cookCondition(this.waterLost);
  }
  reset() { this.initialTemp = this.finalTemperature; }
}
class Turkey {
  constructor(weightKg, oven) {
    this.density = 1050; this.cp = 2000; this.heatConvection = 9; this.thermalConduct = 0.412;
    this.totalRadius = U.calculateRadius(weightKg, this.density);
    this.totalLayers = [new Layer('Skin', .85, this, oven), new Layer('Body', .45, this, oven), new Layer('Core', .01, this, oven)];
  }
  update() { for (const l of this.totalLayers) l.tick(); }
  reset() { for (const l of this.totalLayers) l.reset(); }
}
export class LegacyOven {
  constructor(weightLb) {
    this.tempInfini = 20; this.setTemp = 20; this.steadyTemp = 20; this.steadyTimer = 0; this.globalTime = 0;
    this.turkey = new Turkey(U.lbs2kgs(weightLb), this);
    this.proportional = .004; this.errorTolerance = 10;
  }
  changeTemp(t) { this.setTemp = t; }
  equalizeTemp() {
    const error = Math.abs(this.setTemp - this.tempInfini);
    if (this.setTemp > this.tempInfini) this.tempInfini += error * this.proportional;
    else if (this.setTemp < this.tempInfini) this.tempInfini -= error * this.proportional;
    if (error > this.errorTolerance) {
      if (this.steadyTimer >= 80) {
        this.steadyTimer = 0; this.globalTime = 0; this.steadyTemp = this.tempInfini; this.turkey.reset();
      }
      return true;
    }
    return undefined;
  }
  secondTick() {
    this.globalTime++; this.steadyTimer++;
    if (!this.equalizeTemp()) this.steadyTemp = this.tempInfini;
    this.turkey.update();
  }
  tickMany(n) { for (let i = 0; i < n; i++) this.secondTick(); }
  state() {
    const names = ['skin','body','core']; const out = {};
    this.turkey.totalLayers.forEach((l,i) => out[names[i]] = { tempC:l.finalTemperature, waterLost:l.waterLost, condition:[...l.cookCondition] });
    out.oven = {rawTempC:this.tempInfini, steadyTempC:this.steadyTemp, globalTime:this.globalTime, steadyTimer:this.steadyTimer};
    return out;
  }
}
export function legacyScenario(weightLb, ovenF, seconds) {
  const o = new LegacyOven(weightLb); o.changeTemp(U.F2C(ovenF)); o.tickMany(seconds); return o.state();
}
export { U as LegacyUtility };
