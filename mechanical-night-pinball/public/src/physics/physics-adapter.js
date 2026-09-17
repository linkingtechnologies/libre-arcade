/**
 * Physics boundary for the web restoration.
 * The implementation is a custom deterministic solver driven by audited
 * DocDonkeys geometry and parameters. It is calibrated against the archived
 * Box2D 2.3.2 reference but is not claimed to be bit-identical to Box2D.
 */
export class PhysicsAdapter {
  reset() { throw new Error('not implemented'); }
  resetBall() { throw new Error('not implemented'); }
  update(_dt, _input, _state, _hooks) { throw new Error('not implemented'); }
  snapshot() { throw new Error('not implemented'); }
}
