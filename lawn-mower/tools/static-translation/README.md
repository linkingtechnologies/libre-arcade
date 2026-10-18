# A bounded static translation of the stone collision

`experiment.py` takes two routines of Lawn Mower out of the preserved ROMs, translates them to C, and compares the result with the port. It is an experiment about
what a static translation keeps and what it does not, and it is **not** a recompilation of the game and **not** NESRecomp or any other recompiler.

## What it does

1. Finds `cutStone` in the 16 KiB program of each of the two ROMs under `reference/` (the competition ROM v1.1 and the author's own v1.12 build) by its fourteen bytes
   (`lda #1; sta $ba; lda #$4d; jsr fuelSubtract; lda #$0b; jmp sfxPlay`), and `fuelSubtract` by the address of that `jsr`. Each ROM has exactly one match.
2. Decodes only those two regions (11 opcodes: LDA, STA, SEC, SBC, CMP, BCS, BCC, JSR, JMP, RTS) and writes a C function that keeps the accumulator, the carry flag,
   a 256-byte page of memory and the program counter. The two calls to the sound routines (`sfxPlayFuel` with 8, `sfxPlay` with 11) are traps that count the request;
   no sound hardware is modelled.
3. Compiles it with `gcc` as a shared library and runs it from Python (`ctypes`) for every initial fuel from 0 to 232, with the stone's penalty as the ROM has it (77).
4. Runs the port's own `LawnMowerKernel` (a temporary copy of `public/src`, by `node`) on a stone tile for the same 233 values, and compares the fuel left, the camera
   shake, the number of low-fuel warnings and the number of stone events.
5. Repeats steps 2 to 4 with the penalty changed from 77 to 60: in the ROM's operand (in memory, the ROM file is not changed) and in a temporary copy of
   `STONE_PENALTY`, one line each.

Two ROMs, two penalties and 233 values make **932 comparisons**; all agree.

## Run it

```sh
python3 tools/static-translation/experiment.py        # from lawn-mower/; needs Python 3, gcc and Node 18 or later, on Linux or WSL
```

It prints one line per ROM and penalty and `TOTAL: 932/932 cases PASS`, and writes `results/`: for each of the four sweeps the generated C (`*.c`) and the
compared values (`*_trace.json`), and `results.json` with the addresses and bytes it found. These files are kept here, and they are the same on every run (the compiled
libraries, which depend on the compiler, are not kept). `--project <folder>` runs it on another copy of the project, `--out <folder>` writes somewhere else.

`python3 -I` is a good habit for any script read out of an archive; this one writes only to `--out` and to temporary folders.

## What it shows, and what it does not

- The C keeps the original's arithmetic exactly (8-bit truncation, the carry flag, the clamp at zero, the low-fuel threshold at 58) and its branches, and says nothing
  about what they mean: it works on `m[0xcb]` and a carry, and does not know that `$CB` is the fuel. In the port the same rule is `STONE_PENALTY`, `subtractFuel()` and the
  event `stone-hit`. That is the difference between recovering the execution and recovering the rule.
- Both agree, for these inputs, on the fuel left, the shake, the warning and the stone event. That checks two small routines, under the inputs listed, against two ROMs.
- It does not translate any other routine, the sound player, the picture or the rest of the machine, and it is not a playable program. How much of the
  game could be recompiled, and with what runtime, was not tried here.
- It is not part of `npm test` (it needs Python and gcc); the port's comparison with the ROMs is the oracle in `tools/oracle.mjs`.

## Origin

The script was written for an article about the project, in a session after the oracle was built, and then checked by running it on this folder on 18 October 2026
(932 of 932; the generated C and the traces were byte for byte the ones of the first run, which used a copy of this project's sources).
