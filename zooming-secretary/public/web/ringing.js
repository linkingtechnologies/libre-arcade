/* SPDX-License-Identifier: GPL-3.0-or-later */

// Browser-audio policy only: gameplay phone state remains owned by the deterministic core.
export function isPhoneRinging(phone) {
  return Boolean(phone && phone.level > 0 && phone.level !== 255);
}

export function anyPhoneRinging(sim) {
  return Boolean(sim?.phones?.phones?.some(isPhoneRinging));
}

export function shouldRepeatRing(sim, repeatTicks = 50) {
  if (!sim || !anyPhoneRinging(sim) || repeatTicks <= 0) return false;
  return sim.ringCnt > 0 && (sim.ringCnt % repeatTicks) === 0;
}
