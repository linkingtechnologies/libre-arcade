#!/usr/bin/env python3
"""Losslessly pack the original Keras HDF5 float32 tensors for browser inference."""
import base64
import json
import sys
from pathlib import Path

import h5py
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "reference/zeta36-connect4-alpha-zero/original/data/model/model_best_weight.h5"
OUTPUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public/src/players/zeta36-alpha-zero-weights.js"

ORDER = [
    *(f"conv2d_{i}/conv2d_{i}_4/kernel:0" for i in range(1, 8)),
    *(f"conv2d_{i}/conv2d_{i}_4/bias:0" for i in range(1, 8)),
    *(f"batch_normalization_{i}/batch_normalization_{i}_4/{v}:0" for i in range(1, 8) for v in ("gamma", "beta", "moving_mean", "moving_variance")),
    "policy_out/policy_out_4/kernel:0", "policy_out/policy_out_4/bias:0",
    "dense_1/dense_1_4/kernel:0", "dense_1/dense_1_4/bias:0",
    "value_out/value_out_4/kernel:0", "value_out/value_out_4/bias:0",
]

with h5py.File(SOURCE, "r") as handle:
    chunks, tensors, offset = [], {}, 0
    for name in ORDER:
        array = np.asarray(handle[name], dtype="<f4", order="C")
        raw = array.tobytes(order="C")
        tensors[name] = {"offset": offset // 4, "length": array.size, "shape": list(array.shape)}
        chunks.append(raw); offset += len(raw)

payload = b"".join(chunks)
metadata = {
    "sourceCommit": "511150874845335c8687a1a4a8e6bcbc43207fe3",
    "format": "lossless-float32-le",
    "bytes": len(payload),
    "tensors": tensors,
}
OUTPUT.write_text(
    "/* Lossless conversion of Zeta36's original model_best_weight.h5. */\n"
    f"export const zeta36Metadata = {json.dumps(metadata, separators=(',', ':'))};\n"
    f"export const zeta36WeightsBase64 = '{base64.b64encode(payload).decode()}';\n",
    encoding="utf-8",
    newline="\n",
)
print(json.dumps({"bytes": len(payload), "tensors": len(tensors)}))
