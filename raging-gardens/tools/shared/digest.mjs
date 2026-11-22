// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { createHash } from "node:crypto";

// Short, stable fingerprint of one canonical frame (see canon.mjs).
export function digest(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}
