// SPDX-License-Identifier: GPL-3.0-or-later
export function identity() {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}

export function multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c*4+r] = a[r] * b[c*4] + a[4+r] * b[c*4+1] + a[8+r] * b[c*4+2] + a[12+r] * b[c*4+3];
    }
  }
  return out;
}

export function translation(x, y, z) {
  const m = identity(); m[12]=x; m[13]=y; m[14]=z; return m;
}
export function scale(x, y, z) {
  const m = identity(); m[0]=x; m[5]=y; m[10]=z; return m;
}
export function rotationX(rad) {
  const c=Math.cos(rad), s=Math.sin(rad); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
}
export function rotationY(rad) {
  const c=Math.cos(rad), s=Math.sin(rad); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
}
export function rotationZ(rad) {
  const c=Math.cos(rad), s=Math.sin(rad); return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
}
export function perspective(fovyRad, aspect, near, far) {
  const f=1/Math.tan(fovyRad/2), nf=1/(near-far);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
}
export const deg = (d) => d * Math.PI / 180;
