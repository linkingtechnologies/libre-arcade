// SPDX-License-Identifier: GPL-3.0-or-later
const buffer = new ArrayBuffer(8);
const view = new DataView(buffer);

export function float64Hex(value) {
  view.setFloat64(0, value, false);
  return view.getBigUint64(0, false).toString(16).padStart(16, "0");
}

export function ulpDistance(a, b) {
  view.setFloat64(0, a, false);
  let ai = view.getBigInt64(0, false);
  view.setFloat64(0, b, false);
  let bi = view.getBigInt64(0, false);
  // Map signed IEEE values into a monotonic integer domain.
  const bias = 1n << 63n;
  ai = ai < 0n ? bias - ai : bias + ai;
  bi = bi < 0n ? bias - bi : bias + bi;
  const d = ai - bi;
  return d < 0n ? -d : d;
}
