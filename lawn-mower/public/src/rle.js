// SPDX-License-Identifier: GPL-3.0-or-later
// Exact JavaScript transcription of Shiru's small NES RLE stream format.
export function decodeShiruRle(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 3) throw new Error('invalid RLE stream');
  const tag = bytes[0];
  const out = [];
  let i = 1, last = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b !== tag) { out.push(b); last = b; continue; }
    if (i >= bytes.length) throw new Error('truncated RLE run');
    const count = bytes[i++];
    if (count === 0) break;
    for (let n = 0; n < count; n++) out.push(last);
  }
  return Uint8Array.from(out);
}
