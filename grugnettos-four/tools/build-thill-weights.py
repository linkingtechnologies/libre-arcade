#!/usr/bin/env python3
"""Convert Markus Thill's textual n-tuple export to a compact sparse JS payload."""

import base64
import pathlib
import re
import struct
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "reference/markus-thill-connect-four/original/CFour/agents/C4.TCL-EXP-lam0.0.txt.zip"
TARGET = ROOT / "public/src/players/markus-thill-weights.js"
TOKEN = re.compile(r"[{}]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][-+]?\d+)?")


def parse(text):
    tokens = TOKEN.findall(text)
    cursor = 0

    def take(expected=None):
        nonlocal cursor
        token = tokens[cursor]
        cursor += 1
        if expected is not None and token != expected:
            raise ValueError(f"expected {expected}, got {token}")
        return token

    take("{")
    tuple_count = int(take())
    position_values = int(take())
    tuples = []
    for _ in range(tuple_count):
        take("{")
        length = int(take())
        set_count = int(take())
        point_sets = []
        for _ in range(set_count):
            take("{")
            point_sets.append([int(take()) for _ in range(length)])
            take("}")
        take("{")
        weights = [float(take()) for _ in range(position_values ** length)]
        take("}")
        take("}")
        tuples.append((point_sets, weights))
    take("}")
    if cursor != len(tokens):
        raise ValueError("trailing tokens")
    return position_values, tuples


with zipfile.ZipFile(SOURCE) as archive:
    parsed = [parse(archive.read(name).decode("utf-8")) for name in ("p0.txt", "p1.txt")]

position_values = parsed[0][0]
tuple_count = len(parsed[0][1])
tuple_length = len(parsed[0][1][0][0][0])
if any(item[0] != position_values or len(item[1]) != tuple_count for item in parsed):
    raise ValueError("player exports have different layouts")

payload = bytearray(b"C4TD")
payload.extend(struct.pack("<BBBB", 1, tuple_count, position_values, tuple_length))
for point_sets, _ in parsed[0][1]:
    payload.extend(bytes(point_sets[0]))

nonzero = 0
for _, tuples in parsed:
    for _, weights in tuples:
        entries = [(index, value) for index, value in enumerate(weights) if value != 0.0]
        nonzero += len(entries)
        payload.extend(struct.pack("<I", len(entries)))
        for index, value in entries:
            payload.extend(struct.pack("<Hf", index, value))

encoded = base64.b64encode(payload).decode("ascii")
TARGET.write_text(
    "/* Generated from the preserved MIT-licensed C4.TCL-EXP-lam0.0 weights. */\n"
    f"export const thillWeightsBase64 = '{encoded}';\n"
    f"export const thillWeightMetadata = Object.freeze({{ tuples: {tuple_count}, tupleLength: {tuple_length}, positionValues: {position_values}, nonzero: {nonzero}, bytes: {len(payload)} }});\n",
    encoding="utf-8",
    newline="\n",
)
print(f"wrote {TARGET}: {len(payload)} bytes, {nonzero} non-zero weights")
