# Zooming Secretary — M12 Differential Runtime Certification

Baseline: **NES v1.02 (30.12.11)**  
Certified ROM SHA-256: `315adee10052367298959d55256e9f2621381da9f7c839f50832e13516b61770`

## Result

**M12 status: GREEN for deterministic gameplay-state runtime parity.**

M12 executes the certified NES ROM machine code in a private headless tracer and compares its gameplay state with the GPLv3 JavaScript core. Original ROM/map bytes are not included in the distributable package.

M12 does **not** certify pixel-level PPU rendering, sprite timing limits, audio/APU waveforms, or exact wall-clock NTSC/PAL timing. It certifies the deterministic game-state layer needed by the future restoration.

## Private ROM tracer scope

The private tracer implements the subset required by this NROM game:

- official 6502 instruction execution;
- NROM 32 KiB PRG mapping and NES RAM mirroring;
- PPU control/status/address/data access sufficient for nametable unpack/read/write;
- PPU data-read buffering;
- NMI delivery and the game's `ppu_waitnmi` synchronization;
- controller `$4016` serial polling;
- OAM DMA storage;
- enough PPU state for the game logic to execute normally.

APU/FamiTone output writes are accepted but audio synthesis is intentionally not modeled.

Boot/screen-transition waiting is accelerated privately to reach a target stage. At the first gameplay iteration, the tracer switches to an NTSC CPU-frame interval of 29,780 cycles for the differential runtime runs. The compared unit remains the game's own synchronized gameplay iteration.

## Binary-level discoveries that supersede source-only assumptions

### 1. Factoid initialization has a cc65 stale-X quirk

The source expression is conceptually:

```text
rand8() % topicMessagesCount[topic]
```

The v1.02 binary, however, promotes the return value while register X still contains `$06`, the high byte of the `topic_msg` address. The generated machine code therefore behaves as if the dividend were:

```text
0x0600 | rand8()
```

For example:

```text
rand8 = 0x20
source-logical:  0x20 % 9   = 5
v1.02 binary:    0x0620 % 9 = 2
```

and:

```text
rand8 = 0x40
source-logical:  0x40 % 9   = 1
v1.02 binary:    0x0640 % 9 = 7
```

M12 preserves the **binary-real** values because they affect which factoid appears after answering a call.

### 2. A successful phone answer consumes two RNG values

For a normal stage the source/binary order is:

1. `phone_reset(answer=1)` — still consumes RNG for the next phone topic;
2. show the current factoid;
3. consume another `rand8()` to advance that topic's factoid index;
4. continue the common phone counter block, reducing the newly set 25 counter to 24 in that same gameplay tick.

M12 now reproduces that exact ordering.

### 3. Some purely visual effects are gameplay-RNG significant

The shared RNG is also consumed by visual-only code:

- Chief speech-bubble X/Y randomization;
- Chief idle-facing random choices;
- Chatter idle-facing random choices;
- `hearts_add()`, which consumes two RNG values per heart.

Dibrov spawns two hearts when wisdom is first granted, therefore consuming **four RNG values** immediately. During non-bonus wisdom, an additional decorative heart is spawned every eighth game frame and consumes another two RNG values.

Ignoring these graphics in a headless port would eventually desynchronize phone topics/NPC choices, so M12 explicitly consumes the same RNG values even though it does not render the effects.

### 4. ManBox platform-edge behavior

After a horizontal step, ManBox samples support beneath the leading side. If support is missing it reverses direction. M10/M11 had omitted this because the source contains several commented-out edge checks for other NPCs; M12 confirms that the ManBox checks are active and preserves them.

### 5. Dream runaway cooldown order

On telephone teleport the original increments `phone_runaway_max` first and then reloads `phone_runaway`. Thus the first successful teleport changes the cooldown from 5 to **15**, not from 5 to another 5.

## Natural runtime traces

Eight no-input runs execute naturally from source/binary stage initialization. The compared traces include RNG, player fixed-point state, phone state/counters/topics, factoid indices, NPC state, coffee state, Dream state and shared counters.

| Stage | Compared ticks | ROM == JS |
|---|---:|---|
| Day 1 | 64 | yes |
| Day 2 / Chief | 64 | yes |
| Day 3 / Bouncer | 64 | yes |
| Day 4 / Chatter | 64 | yes |
| Dream / Ghost | 200 | yes* |
| Day 5 / Geek | 64 | yes |
| Day 6 / ManBox | 64 | yes |
| Day 7 / Dibrov | 64 | yes |

`*` One deliberately normalized field: see Dream safety divergence below.

The complete normalized state sequence for each run has the same SHA-256 on the ROM and JS side. Hashes are retained in `docs/m12-runtime-vectors.json`; raw ROM-derived map/trace material is not shipped.

## Controlled differential micro-scenarios

Fourteen state-injected micro-scenarios were run against both the actual ROM and the JS core:

1. horizontal right wrap;
2. ladder upward vertical wrap;
3. ladder downward vertical wrap;
4. cabinet/topic pickup;
5. correct phone answer + factoid advance;
6. Chief proximity/slowdown latch;
7. Bouncer collision resolution;
8. Chatter topic overwrite;
9. Geek blocking/push interaction;
10. ManBox knockdown;
11. ManBox platform-edge reversal;
12. Dibrov wisdom + heart RNG consumption;
13. active Ghost pursuit;
14. Dream telephone teleport/cooldown.

After normalizing the one Dream-only unsafe field, **14/14 final machine-state snapshots match**.

## Long phone lifecycle run

Day 1 was also run for **900 natural gameplay ticks**, far enough to enter the full phone lifecycle and produce the first missed call.

ROM and JS final states match exactly:

```text
callsMissed = 1
RNG         = 207
callDelay   = 220
phoneCnt    = [186, 6]
phoneLevel  = [0, 2]
phoneTopic  = [1, 0]
ringCnt     = 395
```

This certifies the real binary path through idle delay → three heat phases → miss → reset, including RNG and global call-delay decay.

## Deliberate safety divergence: Dream modulo zero

Dream uses `topics_active == 0`, but the original binary still runs the phone-topic modulo path. In the certified ROM this leaves an internal `phone_topic[0]` value of **8** during the tested seed-1 initialization.

That value has no gameplay role because Dream continuously forces wisdom and therefore bypasses topic matching.

The JavaScript core intentionally stores:

```text
phone.topic = null
```

while consuming the same RNG call. This avoids encoding undefined/unsafe modulo-zero semantics into the clean implementation. Differential traces normalize only this field. No other gameplay-state field is normalized.

## Test status

Distributable tests:

```text
M9/M8 contract     15/15
M10 integration    15/15
M11 shadow vectors 10/10
M12 runtime         12/12
-------------------------
TOTAL               52/52
```

Private differential evidence:

```text
8/8  natural tick-by-tick ROM/JS traces
14/14 controlled runtime micro-scenarios
1/1  900-tick Day 1 phone-lifecycle run
```

M11's earlier 12/12 private map/init shadow checks also remain valid; M12 supersedes only the source-logical factoid-index interpretation.

## Archaeological decision

The **deterministic gameplay engine can now be frozen** as the v1.02 behavioral reference for Libre Arcade.

Remaining project risk is no longer game-logic archaeology. The unresolved gate is the M4–M6 media/license problem: original PinWizz graphics and original music remain YELLOW because the 2011 package says CC BY without identifying the license version.

Therefore M12 does not authorize copying original graphics/music into `/src`, and it does not by itself authorize production HTML5 work if the project policy requires the media gate to be GREEN first.
