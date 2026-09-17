export const LOGICAL_WIDTH = 428;
export const LOGICAL_HEIGHT = 822;
// The physical table remains 428×822, but the player sees a 428×600 camera viewport.
// This mirrors the historical Flash presentation more closely and makes the ball easier to follow.
export const VIEWPORT_HEIGHT = 600;
export const FIXED_DT = 1 / 60;

export const PARITY = Object.freeze({
  sourceCommit: '220820357a6a9a455df920619e2240e4da130cb9',
  pixelsPerMeter: 50,
  gravityMetersPerSecond2: 7,
  gravityPixelsPerSecond2: 350,
  velocityIterations: 6,
  positionIterations: 2,
  initialBalls: 3,
  initialMultiplier: 1,
  maxMultiplier: 100,
  ballRadius: 9,
  ballRestitution: 0.3,
  ballFriction: 0.2,
  ballDensity: 1,
  ballStart: { x: 412, y: 700 },
  loseSensor: { x:199, y:812, width:64, height:8 },
  tunnelTimeSeconds: 2,
  tunnelExits: {
    left: { x:55, y:439, vx:200, vy:200 },
    right:{ x:408, y:303, vx:-250, vy:-200 },
  },
  flippers: {
    left: { pivot:{x:147,y:745}, lower:-Math.PI/4, upper:0, activeSpeed:-25, returnSpeed:25, activeTorque:25, returnTorque:10 },
    right:{ pivot:{x:252,y:745}, lower:0, upper:Math.PI/4, activeSpeed:25, returnSpeed:-25, activeTorque:25, returnTorque:10 },
  },
  kicker: {
    x:412, y:801, width:6, height:34,
    lowerTranslation:-0.43, upperTranslation:1.0,
    returnMotorSpeedMetersPerSecond:-15,
    heldMaxMotorForce:-1,
  },
  scores: {
    leftKicker: 5,
    topLeftLight: 3,
    bumper: 5,
    smallBumper: 44,
    tunnel: 33,
    pegRecovery: 9,
    topLights: 11,
    rampEntrance: 444,
    thirdRamp: 100000,
  },
});


// Behaviour intentionally restored from the older Flash ancestor rather than the
// 2018 DocDonkeys parity target. The raw Flash impulse cannot be transplanted
// numerically because the Flash table used a different pixels-per-meter scale,
// flipper mass/inertia and joint geometry. Instead we preserve its key-down
// impulse *effect* as a bounded angular-velocity assist on the flipper body.
export const RESTORATION = Object.freeze({
  defaultFlipperProfile: 'flash-enhanced',
  flashFlipperSnap: {
    historicalImpulse: { x: 0, y: -13.5 },
    historicalApplicationOffsetPixels: 45,
    historicalPixelsPerMeter: 30,
    angularVelocityAssistRadiansPerSecond: 6.0,
  },
});

export const CALIBRATION = Object.freeze({
  // Values below are derived from the vendored Box2D 2.3.2 and measured with a
  // headless reference harness built from the exact source snapshot in /reference.
  box2d: {
    linearSlopPixels: 0.25,
    angularSlopRadians: 2 * Math.PI / 180,
    maxLinearSpeedPixelsPerSecond: 6000,
    maxAngularSpeedRadiansPerSecond: 30 * Math.PI,
    velocityThresholdPixelsPerSecond: 50,
    timeToSleepSeconds: 0.5,
    linearSleepTolerancePixelsPerSecond: 0.5,
    angularSleepToleranceRadiansPerSecond: 2 * Math.PI / 180,
    baumgarte: 0.2,
    maxLinearCorrectionPixels: 10,
  },
  ball: {
    massKg: 0.10178760197630929,
    inertiaKgM2: 0.0016489591520162104,
  },
  flipper: {
    left: { massKg: 0.222, inertiaAboutPivotKgM2: 0.02746029333333326, comFromPivotMeters: { x: 0.221105105105105, y: 0.079723723723724 } },
    right: { massKg: 0.2528, inertiaAboutPivotKgM2: 0.03376397333333388, comFromPivotMeters: { x: -0.23089662447257453, y: 0.08343881856540092 } },
    // Box2D's joint + anchor solve converges to the 2 degree slop boundary.
    // 0.80 / 9deg reproduce the measured 2018 solver convergence closely.
    limitCorrectionFraction: 0.80,
    maxLimitCorrectionRadians: 9 * Math.PI / 180,
  },
  kicker: {
    massKg: 0.0816,
  },
  referenceHarness: {
    freefall60: { y: 277.916779, vy: 350.000275 },
    wallImpact: { vx: 99.033539, vy: -102.25, omega: 11.163641 },
    bigBumperVy: -596.458435,
    leftKickerVy: -1363.333496,
    leftFlipperPressFrame1: { angleDeg: -14.15896, omega: -14.96494 },
    leftFlipperPressFrame2: { angleDeg: -37.45394, omega: -25.03191 },
    leftFlipperSettledDeg: -47.0,
    rightFlipperPressFrame1: { angleDeg: 11.32836, omega: 12.13910 },
    rightFlipperPressFrame2: { angleDeg: 33.84320, omega: 24.15718 },
    rightFlipperSettledDeg: 47.0,
    // Full-table Box2D measurement: the right flipper contacts lower table geometry
    // before the bare joint slop boundary, so its effective powered stop is lower.
    rightFlipperFullTableHeldStopDeg: 46.523,
    heldRestingEquilibria: {
      left: { x:150.9724, y:724.5917 },
      right:{ x:247.2419, y:723.5103 },
    },
    kickerTopY: 779.25,
    kickerBottomY: 851.25,
    kickerFirstHeldVy: 16.0458,
    kickerFirstReturnVy: -219.0952,
    launcherPeakVy: -689.582031,
    // Exact one-tick flipper tap measurements from the vendored Box2D 2.3.2.
    // The left joint may overshoot its nominal -45 degree limit during an
    // inertial snap, then the constraint corrects it on the following solve.
    leftQuickTapFrame9: { angleDeg: -52.11601, omega: -7.48953 },
    leftQuickTapFrame10: { angleDeg: -48.01910, omega: 0.0 },
    representativeFlipperStrikes: {
      left165x724: { minVy: -117.6624 },
      left175x720: { minVy: -105.1119 },
      right233x720: { minVy: -95.5480 },
      right223x724: { minVy: -97.5223 },
    },
  },
});
