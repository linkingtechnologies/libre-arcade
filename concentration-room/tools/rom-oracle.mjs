#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Executable oracle for the JavaScript port of Concentration Room 0.02.
//
//   node tools/rom-oracle.mjs check  [--games N] [--seed S] [--jobs J]
//   node tools/rom-oracle.mjs record [--games N] [--seed S] [--jobs J]
//   node tools/rom-oracle.mjs replay [--quick | --ids 3,7,11] [--jobs J]
//
// Scenarios are independent, so they run on worker threads (by default one fewer than the machine has cores).
//
// The preserved release ROM (reference/ConcentrationRoom-0.02/release/croom.nes) is run from reset on a minimal NES
// (tools/nes-machine.mjs, tools/mos6502.mjs). A scripted player steers it through the title menu into a game and then
// plays it with seeded random input. The port plays the same game: it takes the state the ROM's own code had when it
// dealt (the generator bytes and the frame counter that the original mixes into its seed), deals, and is then fed the
// same pad bits once per iteration of the original's main loop. At the start of every iteration the ROM's RAM is
// compared with the port's state.
//
// Nothing in the ROM was labelled by anyone: its variables sit at the addresses that the original's build tool
// shuffled them to. The addresses that matter for the harness (the frame counter, the generator bytes, the entry of
// read_pads, the two places where the program mixes the time into its seed) are found by their code, and the rest, the
// game's own variables, are found by elimination: an address is the home of a field of the port only if it held the
// same value as that field at every iteration of every game played. A field with no such address is a difference.
// `record` writes what was found to test/fixtures/rom-oracle.json; `replay` plays every recorded scenario again against the ROM
// with the recorded addresses (`npm run test:live`), and `npm test` replays the quick ones.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { NesMachine } from './nes-machine.mjs';
import { CroomPRNG } from '../public/src/prng.js';
import { dealBoard } from '../public/src/shuffle.js';
import { FrameGame, PLAY_STATE } from '../public/src/state-machine.js';
import { MODE } from '../public/src/rules.js';
import { HistoricalPads, KEY } from '../public/src/input.js';
import { applyHistoricalGameInputFrame } from '../public/src/frame-input.js';
import { storyStageConfig, storyOutcome } from '../public/src/story.js';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ROM_PATH = join(ROOT, 'reference', 'ConcentrationRoom-0.02', 'release', 'croom.nes');
export const FIXTURE = join(ROOT, 'test', 'fixtures', 'rom-oracle.json');
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const rel = (path) => relative(ROOT, path).split('\\').join('/');
const hex = (value, width = 2) => value.toString(16).padStart(width, '0');

export function loadRom(path = ROM_PATH) { return new Uint8Array(readFileSync(path)); }

// ---------------------------------------------------------------------------
// What the harness needs to know about the ROM, found from its code
// ---------------------------------------------------------------------------
export function analyseRom(rom) {
  const machine = new NesMachine(rom);
  const prg = machine.prg;
  const at = (address) => prg[(address - 0x8000) % prg.length];
  const nmiHandler = at(0xFFFA) | (at(0xFFFB) << 8);
  if (at(nmiHandler) !== 0xE6 || at(nmiHandler + 2) !== 0x40) throw new Error('the NMI handler is not INC zp / RTI');
  const nmis = at(nmiHandler + 1);
  const find = (predicate, from = 0) => { const found = []; for (let i = from; i < prg.length; i++) if (predicate(i)) found.push(i); return found; };
  const pc = (index) => 0x8000 + (prg.length === 0x4000 ? 0x4000 : 0) + index;

  // random: ASL rand3 / ROL rand2 / ROL rand1 / ROL rand0
  const random = find((i) => prg[i] === 0x06 && prg[i + 2] === 0x26 && prg[i + 4] === 0x26 && prg[i + 6] === 0x26);
  if (random.length !== 1) throw new Error(`found ${random.length} copies of the random-number routine`);
  const rand = [prg[random[0] + 7], prg[random[0] + 5], prg[random[0] + 3], prg[random[0] + 1]];   // rand0..rand3

  // the two places that mix the frame counter into the seed: LDA nmis ; EOR randN
  const mixes = find((i) => prg[i] === 0xA5 && prg[i + 1] === nmis && prg[i + 2] === 0x45);
  const titleMix = mixes.filter((i) => prg[i + 3] === rand[2]);
  const dealMix = mixes.filter((i) => prg[i + 3] === rand[3]);
  if (titleMix.length !== 1 || dealMix.length !== 1) throw new Error('could not tell the two seed-mixing sites apart');
  // titleDispatch begins ASL A / TAX / ADC rand0 / STA rand0
  const titleEntry = find((i) => prg[i] === 0x0A && prg[i + 1] === 0xAA && prg[i + 2] === 0x65 && prg[i + 3] === rand[0] && prg[i + 4] === 0x85 && prg[i + 5] === rand[0]);
  if (titleEntry.length !== 1) throw new Error('could not find the start of titleDispatch');
  // read_pads begins LDA cur_keys / STA $04 / LDA cur_keys+1 / STA $05
  const readPads = find((i) => prg[i] === 0xA5 && prg[i + 2] === 0x85 && prg[i + 3] === 0x04 && prg[i + 4] === 0xA5 && prg[i + 6] === 0x85 && prg[i + 7] === 0x05 && prg[i + 5] === prg[i + 1] + 1);
  if (readPads.length !== 1) throw new Error('could not find read_pads');
  // shuffleCards clears the board with STA abs,X / DEX / BPL
  const clear = find((i) => prg[i] === 0x9D && prg[i + 3] === 0xCA && prg[i + 4] === 0x10 && prg[i + 5] === 0xFA && (prg[i + 2] === 0x03));
  if (clear.length !== 1) throw new Error('could not find the board');
  return {
    nmis, rand,
    curKeys: prg[readPads[0] + 1],
    boardState: prg[clear[0] + 1] | (prg[clear[0] + 2] << 8),
    pcTitleEntry: pc(titleEntry[0]), pcTitleMix: pc(titleMix[0]), pcDealMix: pc(dealMix[0]), pcReadPads: pc(readPads[0]),
  };
}

// ---------------------------------------------------------------------------
// The port's side: the fields that are compared, and how each is written as one byte
// ---------------------------------------------------------------------------
const STATE_INDEX = Object.values(PLAY_STATE);   // still, flipping, unflipping, collecting, pass-controller, cleared, game-over, done
const byte = (value) => (value < 0 ? 255 : value) & 0xFF;
const flag = (value) => (value ? 1 : 0);

export const SCALAR_FIELDS = [
  ['state', (g) => STATE_INDEX.indexOf(g.state)],
  ['stateTimer', (g) => g.stateTimer],
  ['selected0', (g) => byte(g.selected[0])], ['selected1', (g) => byte(g.selected[1])],
  ['score0', (g) => g.score[0]], ['score1', (g) => g.score[1]],
  ['curTurn', (g) => g.curTurn], ['activePad', (g) => g.activePad],
  ['card0FlipFrame', (g) => g.card0FlipFrame],
  ['cursorX', (g) => g.cursorX], ['cursorY', (g) => g.cursorY],
  ['bgcolor', (g) => g.bgcolor], ['isCombo', (g) => flag(g.isCombo), true],
  ['collectingX0', (g) => g.collectingX[0]], ['collectingX1', (g) => g.collectingX[1]],
  ['collectingY0', (g) => g.collectingY[0]], ['collectingY1', (g) => g.collectingY[1]],
  ['collectingDX', (g) => g.collectingDX & 0xFF], ['collectingDY', (g) => g.collectingDY & 0xFF],
  ['numPlayers', (g) => g.numPlayers], ['lastPlayerIsAI', (g) => flag(g.lastPlayerIsAI), true],
  ['difficulty', (g) => g.difficulty], ['scoreMethod', (g) => g.scoreMethod],
  ['aiState', (g) => g.ai?.state ?? null], ['aiTimer', (g) => g.ai?.timer ?? null], ['aiNoise', (g) => g.ai?.noiseLevel ?? null],
];

// Some of the original's variables hold stale values when the game does not use them (it never clears the collecting
// animation's velocities, nor the CPU's timer while a human is playing, nor the state timer at the start of a game), where
// the port keeps tidier ones. Those are compared only while they mean something.
function meaningful(name, game) {
  if (name === 'collectingDX' || name === 'collectingDY') return game.state === PLAY_STATE.COLLECTING && game.stateTimer <= 27;
  if (name === 'aiTimer') return game.ai && game.ai.state !== 0;
  // play_memory does not initialise it, so a new game starts with whatever the last one left (255 after a game over)
  if (name === 'stateTimer') return game.state !== PLAY_STATE.STILL;
  // solitaireMode sets score (the misses left) and never score+1, so after a game for two the second score is what that game left
  if (name === 'score1') return game.numPlayers >= 2;
  return true;
}

export function jsValues(game) {
  const values = new Map();
  for (const [name, get] of SCALAR_FIELDS) { const value = get(game); if (value !== null && meaningful(name, game)) values.set(name, value); }
  game.prng.snapshot && Object.values(game.prng.snapshot()).forEach((v, i) => values.set(`rand${i}`, v));
  for (let i = 0; i < 72; i++) values.set(`board${i}`, game.board[i]);
  if (game.lastPlayerIsAI) for (let i = 0; i < 72; i++) values.set(`remember${i}`, game.rememberState[i]);
  return values;
}
const FLAG_FIELDS = new Set(SCALAR_FIELDS.filter((f) => f[2]).map((f) => f[0]));
// the ROM marks a remembered card with any non-zero byte; the port with 1
const isFlag = (name) => FLAG_FIELDS.has(name) || name.startsWith('remember');

// ---------------------------------------------------------------------------
// Scenarios: how games are reached and how they are played
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const MODE_INDEX = { [MODE.STORY]: 0, [MODE.SOLITAIRE]: 1, [MODE.TWO_PLAYER]: 2, [MODE.VS_CPU]: 3 };

// Button presses that take the title menu to a game, as frame -> pad 1 byte, starting `base` frames from reset.
export function menuScript({ mode, difficulty, startDelay, textDelay }, base = 0) {
  const steps = [];
  let f = base + 8 + startDelay;
  const tap = (key, wait) => { steps.push([f, key], [f + 1, 0]); f += wait; };
  for (let i = 0; i < MODE_INDEX[mode]; i++) tap(KEY.DOWN, 4);
  tap(KEY.A, 8);
  if (mode !== MODE.STORY) {
    for (let i = 0; i < 5; i++) tap(KEY.UP, 4);
    for (let i = 0; i < difficulty; i++) tap(KEY.DOWN, 4);
    tap(KEY.A, 8);
  }
  f += 40 + textDelay;                                  // the opening text scrolls until A is pressed
  tap(KEY.A, 1);
  return new Map(steps);
}

// A player that holds buttons at random, with a bias towards flipping cards and towards the A+B that hands the pad over.
function randomPlayer(rng) {
  const held = [0, 0];
  const bits = [KEY.A, KEY.B, KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT];
  const rates = [0.18, 0.02, 0.12, 0.12, 0.12, 0.12];
  return (game) => {
    for (let pad = 0; pad < 2; pad++) {
      const noise = pad !== game.activePad;
      bits.forEach((bit, i) => { if (rng() < (noise ? rates[i] / 3 : rates[i])) held[pad] ^= bit; });
      if (rng() < 0.01) held[pad] ^= KEY.START;
      if (rng() < 0.002) held[pad] ^= KEY.SELECT;
      if (rng() < 0.04) held[pad] &= KEY.START | KEY.SELECT;
    }
    if (game.state === PLAY_STATE.PASS_CONTROLLER && rng() < 0.15) { const pad = rng() < 0.5 ? 0 : 1; held[pad] |= KEY.A | KEY.B; }
    return [held[0], held[1]];
  };
}

// A player that knows the board: it walks the cursor to a card and presses A, choosing the partner of the open card
// with probability `skill`, so that matches, collections and the end of a game are reached on every board size.
// With probability `fidget` it also holds a stray button, so that the CPU's turns see the human pad being used.
function seekingPlayer(rng, skill, fidget) {
  let target = -1, phase = 0, wait = 0;
  return (game) => {
    const pads = [0, 0];
    if (rng() < fidget) pads[0] |= [KEY.A, KEY.B, KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT][Math.floor(rng() * 6)];
    if (game.state === PLAY_STATE.PASS_CONTROLLER) {
      if (rng() < 0.3) pads[rng() < 0.5 ? 0 : 1] |= KEY.A | KEY.B;
      return pads;
    }
    const cpuTurn = game.lastPlayerIsAI && game.curTurn === game.numPlayers - 1;
    if (game.state !== PLAY_STATE.STILL || cpuTurn) { target = -1; return pads; }
    const pad = game.activePad & 1;
    if (target < 0 || !game.canSelect(target)) {
      const faceDown = []; for (let i = 0; i < 72; i++) if (game.canSelect(i)) faceDown.push(i);
      if (!faceDown.length) return pads;
      const open = game.selected[1];
      let choice = faceDown[Math.floor(rng() * faceDown.length)];
      if (open >= 0 && rng() < skill) {
        const partners = faceDown.filter((i) => (game.board[i] & 0x3F) === (game.board[open] & 0x3F));
        if (partners.length) choice = partners[0];
      }
      target = choice; phase = 0;
    }
    const dx = Math.floor(target / 8) - game.cursorX, dy = (target & 7) - game.cursorY;
    if (dx === 0 && dy === 0) { pads[pad] |= (phase++ % 2 === 0) ? KEY.A : 0; if (rng() < 0.05) pads[pad] |= KEY.B; return pads; }
    wait = (wait + 1) % 2;
    if (wait === 0) return pads;                                                  // tap, release: one step per two iterations
    pads[pad] |= dx > 0 ? KEY.RIGHT : dx < 0 ? KEY.LEFT : dy > 0 ? KEY.DOWN : KEY.UP;
    return pads;
  };
}

// ---------------------------------------------------------------------------
// Elimination of addresses
// ---------------------------------------------------------------------------
export class Locator {
  constructor() { this.candidates = new Map(); this.samples = 0; this.emptied = new Map(); }

  observe(name, value, ram, where = null) {
    const norm = isFlag(name);
    const expect = norm ? flag(value) : value;
    let list = this.candidates.get(name);
    if (!list) {
      list = [];
      for (let a = 0; a < 0x800; a++) if ((norm ? flag(ram[a]) : ram[a]) === expect) list.push(a);
    } else {
      const keep = [];
      for (const a of list) if ((norm ? flag(ram[a]) : ram[a]) === expect) keep.push(a);
      if (!keep.length && list.length) this.emptied.set(name, { ...where, value, hadAddresses: list.slice(0, 4).map((a) => `${a.toString(16)}=${ram[a]}`) });
      list = keep;
    }
    this.candidates.set(name, list);
    this.samples++;
    return list.length;
  }

  failures() { return [...this.candidates].filter(([, list]) => list.length === 0).map(([name]) => name); }
  unique() { const map = {}; for (const [name, list] of this.candidates) if (list.length === 1) map[name] = list[0]; return map; }
}

// ---------------------------------------------------------------------------
// A session played on both sides: one or more games, from reset
// ---------------------------------------------------------------------------
function newGame(gameSpec, stage, ctx) {
  const cfg = stage != null ? storyStageConfig(stage) : null;
  const mode = cfg ? cfg.mode : gameSpec.mode;
  const difficulty = cfg ? cfg.difficulty : gameSpec.difficulty;
  const aiNoiseLevel = cfg ? Math.max(0, cfg.aiNoiseLevel) : 8;
  const { board } = dealBoard({ difficulty, prng: ctx.prng, dealNmis: ctx.dealNmis });
  return new FrameGame({ board, mode, difficulty, prng: ctx.prng, aiNoiseLevel });
}

export const SESSION_FRAMES = 400000;

// Runs one scenario. `locator` collects candidate addresses; `map` (when given) is checked instead.
export function runScenario(spec, { rom, info, locator = null, map = null, collect = false, maxIterations = spec.player === 'random' ? 5000 : 30000, onIteration = null, sceneInput = null }) {
  const machine = new NesMachine(rom);
  const rng = mulberry32(spec.seed);
  const prng = new CroomPRNG();
  const pads = new HistoricalPads();
  const result = {
    spec, games: [], iterations: 0, states: {}, events: {}, divergence: null, fieldFirst: new Map(), frames: 0, unfinished: 0, finished: 0,
  };
  let phase = 'menu', gi = 0, stage = null, game = null, player = null, script = null, error = null;
  let titleBefore = null, dealBefore = null, boardAtDeal = null, spDeal = -1, spPlay = -1, gameIterations = 0, sceneStart = 0;

  const gameSpecs = spec.games;
  const startMenu = () => { script = menuScript(gameSpecs[gi], machine.frames); };
  if (gameSpecs[0].mode === MODE.STORY) stage = 0;
  startMenu();

  const fail = (what, detail) => { if (!result.divergence) result.divergence = { what, game: gi, ...detail, iteration: gameIterations, frame: machine.frames }; };
  const compare = (label) => {
    const values = jsValues(game);
    if (locator) {
      for (const [name, value] of values) locator.observe(name, value, machine.ram, { scenario: spec.id, game: gi, mode: game.mode, iteration: gameIterations, state: game.state, label });
    } else if (map) {
      for (const [name, value] of values) {
        const address = map[name];
        if (address === undefined) continue;
        const actual = machine.ram[address];
        if ((isFlag(name) ? flag(actual) : actual) !== (isFlag(name) ? flag(value) : value)) {
          if (!result.fieldFirst.has(name)) result.fieldFirst.set(name, { game: gi, iteration: gameIterations, rom: actual, port: value, state: game.state });
          if (!collect) { fail('state', { name, rom: actual, port: value, label }); return; }
        }
      }
    }
  };
  const stop = (what, detail) => { fail(what, detail); error = new Error(what); };
  const gen = () => [prng.rand0, prng.rand1, prng.rand2, prng.rand3];
  const same = (a, b) => a.every((v, i) => v === b[i]);
  const romGen = () => info.rand.map((a) => machine.ram[a]);
  const hexes = (list) => list.map((v) => hex(v)).join(' ');

  machine.beforeStep = (cpu) => {
    if (error) return;
    const pc = cpu.pc;
    if (pc === info.pcTitleEntry) {
      titleBefore = romGen();
      if (!same(gen(), titleBefore)) stop('generator at the title', { rom: hexes(titleBefore), port: hexes(gen()) });
    } else if (pc === info.pcTitleMix && titleBefore) {
      // the mode is what the program has just added to rand0; the same time is mixed into the port's generator
      prng.mixTitleSelection(((machine.ram[info.rand[0]] - titleBefore[0]) >> 1) & 0xFF, machine.ram[info.nmis]);
    } else if (pc === info.pcDealMix) {
      dealBefore = { rand: romGen(), nmis: machine.ram[info.nmis] };
      if (!same(gen(), dealBefore.rand)) { stop('generator before the deal', { rom: hexes(dealBefore.rand), port: hexes(gen()) }); return; }
      spDeal = cpu.sp;
      phase = 'dealing';
    } else if (phase === 'dealing' && cpu.sp === spDeal && machine.read(pc) === 0x60) {
      // shuffleCards is about to return: the board is complete
      boardAtDeal = [...machine.ram.subarray(info.boardState, info.boardState + 72)];
      try { game = newGame(gameSpecs[gi], stage, { prng, dealNmis: dealBefore.nmis }); }
      catch (e) { stop('port could not start', { message: e.message }); return; }
      player = spec.player === 'random' ? randomPlayer(rng) : seekingPlayer(rng, spec.skill, spec.fidget);
      const mine = [...game.board];
      if (!mine.every((v, i) => v === boardAtDeal[i])) { stop('the deal', { rom: hexes(boardAtDeal), port: hexes(mine) }); return; }
      gameIterations = 0;
      phase = 'dealt';
    } else if (pc === info.pcReadPads) {
      if (phase === 'dealt' || phase === 'play') iteration(cpu);
      else if (phase === 'menu') machine.pad[0] = script.get(machine.frames) ?? machine.pad[0];
      else if (phase === 'scenes') {
        // the scenes between Story stages: A is tapped every 12 frames unless the caller drives the pad (and may stop the run by returning null)
        const custom = sceneInput ? sceneInput({ machine, info, stage, sceneFrames: machine.frames - sceneStart }) : undefined;
        if (custom === null) { stop('stopped by the caller', {}); return; }
        machine.pad[0] = custom !== undefined ? custom : ((machine.frames % 12 === 0) ? KEY.A : 0);
        if (machine.frames - sceneStart > 6000) stop('the story did not go on', { stage });
      }
    } else if (phase === 'play' && cpu.sp === spPlay && machine.read(pc) === 0x60) {
      // play_memory returns: the last iteration has been completed
      compare('end');
      if (!same(gen(), romGen())) { stop('generator at the end of the game', { rom: hexes(romGen()), port: hexes(gen()), end: game.state }); return; }
      endGame();
    }
  };

  function endGame() {
    result.games.push({ mode: game.mode, difficulty: game.difficulty, iterations: gameIterations, end: game.state, stage });
    result.finished++;
    if (stage != null) {
      const outcome = storyOutcome(stage, game);
      result.games.at(-1).won = outcome.won;
      if (outcome.nextStage < 0 || result.games.length >= (spec.stages ?? 4)) { phase = 'over'; return; }
      stage = outcome.nextStage; phase = 'scenes'; sceneStart = machine.frames; machine.pad[0] = 0;
      return;
    }
    gi++;
    if (gi >= gameSpecs.length) { phase = 'over'; return; }
    phase = 'menu'; startMenu();
  }

  function iteration(cpu) {
    // the pads were being read by menus and scenes: the held buttons carry over into the first iteration (autorepeat state too, as in the page, where one pad object lives for the whole session)
    if (phase === 'dealt') { phase = 'play'; spPlay = cpu.sp + 2; pads.current = [machine.ram[info.curKeys], machine.ram[info.curKeys + 1]]; pads.previous = [...pads.current]; }
    // the ROM's RAM now holds the state the previous iteration left
    compare(`iteration ${gameIterations}`);
    result.states[game.state] = (result.states[game.state] ?? 0) + 1;
    if (result.divergence && !collect) { error = new Error('difference'); return; }
    // the port's state and the ROM's are the same here (compared above): a place to compare what each draws
    if (onIteration && onIteration({ game, machine, info, iteration: gameIterations, gameIndex: gi, stage }) === false) { error = new Error('stopped by the caller'); return; }
    if (gameIterations >= maxIterations) {
      // a game that has not ended after this many iterations is left unfinished, not failed
      result.unfinished++; result.games.push({ mode: game.mode, difficulty: game.difficulty, iterations: gameIterations, end: 'unfinished' }); phase = 'over'; error = new Error('unfinished'); return;
    }
    const input = player(game);
    machine.pad[0] = input[0]; machine.pad[1] = input[1];
    pads.current = [input[0], input[1]];
    applyHistoricalGameInputFrame(game, pads);
    for (const event of game.drainEvents()) { const key = event.action ? `${event.type}:${event.action}` : event.type; result.events[key] = (result.events[key] ?? 0) + 1; }
    gameIterations++; result.iterations++;
  }

  try {
    for (let f = 0; f < SESSION_FRAMES && !error && phase !== 'over'; f++) machine.frame();
  } catch (e) { if (!result.divergence) fail('the ROM stopped', { message: e.message }); }
  if (phase !== 'over' && !result.divergence) fail('session did not finish', { phase, frames: machine.frames });
  result.frames = machine.frames;
  return result;
}

// ---------------------------------------------------------------------------
export function planScenarios({ games, seed }) {
  const rng = mulberry32(seed);
  const modes = [MODE.SOLITAIRE, MODE.TWO_PLAYER, MODE.VS_CPU];
  const out = [];
  for (let i = 0; i < games; i++) {
    const kind = i % 8;
    const player = kind === 5 ? 'random' : 'seeking';
    const pick = (mode) => ({ mode, difficulty: mode === MODE.STORY ? 0 : (player === 'random' ? Math.floor(rng() * 2) : Math.floor(rng() * 5)), startDelay: Math.floor(rng() * 40), textDelay: Math.floor(rng() * 60) });
    let list;
    if (kind === 3 || kind === 7) list = [pick(MODE.STORY)];                                   // a chain of story stages
    else if (kind === 6) list = [pick(modes[Math.floor(rng() * 3)]), pick(modes[Math.floor(rng() * 3)]), pick(modes[Math.floor(rng() * 3)])];   // three games in one session
    else list = [pick(modes[i % 3])];
    out.push({ id: i, games: list, seed: Math.floor(rng() * 2 ** 31), player, skill: [0.5, 0.8, 0.97][Math.floor(rng() * 3)], fidget: [0, 0.03, 0.12][Math.floor(rng() * 3)], stages: 4 });
  }
  return out;
}

export const DEFAULTS = { games: 24, seed: 20100718 };

function summary(spec, r) {
  const g = r.games.map((x) => `${x.mode}${x.stage != null ? '#' + x.stage : ''} d${x.difficulty} ${x.iterations}it ${x.end}${x.won === undefined ? '' : x.won ? ' won' : ' lost'}`).join('; ');
  return `${spec.player.padEnd(7)} ${g}`;
}

// What a scenario shows, as a set of labels: the way each game ended, the states and events seen, whether it was a chain or a story.
export function featuresOf(spec, r) {
  const set = new Set();
  for (const g of r.games) set.add(`end:${g.mode}:${g.end}${g.won === undefined ? '' : g.won ? ':won' : ':lost'}`);
  for (const state of Object.keys(r.states)) set.add(`state:${state}`);
  for (const event of Object.keys(r.events)) set.add(`event:${event}`);
  if (spec.games.length > 1) set.add('session:several-games');
  if (spec.games[0].mode === MODE.STORY) set.add('session:story-chain');
  set.add(`player:${spec.player}`);
  for (const g of spec.games) if (g.mode !== MODE.STORY) set.add(`difficulty:${g.difficulty}`);
  return set;
}

// The scenarios that `npm test` plays again: a greedy cover of everything the whole set showed, cheapest first, within a budget of iterations.
export function chooseQuick(items, budget = 9000) {
  const all = new Set(); for (const item of items) for (const f of item.features) all.add(f);
  const covered = new Set(), chosen = [];
  let spent = 0;
  while (covered.size < all.size) {
    let best = null, bestScore = 0;
    for (const item of items) {
      if (chosen.includes(item.id) || spent + item.iterations > budget) continue;
      let gain = 0; for (const f of item.features) if (!covered.has(f)) gain++;
      const score = gain / Math.max(item.iterations, 1);
      if (gain > 0 && score > bestScore) { best = item; bestScore = score; }
    }
    if (!best) break;
    chosen.push(best.id); spent += best.iterations; for (const f of best.features) covered.add(f);
  }
  return { ids: chosen.sort((a, b) => a - b), spent, missed: [...all].filter((f) => !covered.has(f)) };
}

export function newTotals() { return { iterations: 0, games: 0, unfinished: 0, scenarios: 0, differing: 0, states: {}, events: {}, endings: {} }; }
export function addTotals(totals, r) {
  totals.scenarios++; totals.iterations += r.iterations; totals.games += r.games.length; totals.unfinished += r.unfinished;
  for (const [k, v] of Object.entries(r.states)) totals.states[k] = (totals.states[k] ?? 0) + v;
  for (const [k, v] of Object.entries(r.events)) totals.events[k] = (totals.events[k] ?? 0) + v;
  for (const g of r.games) { const key = `${g.mode}:${g.end}${g.won === undefined ? '' : g.won ? ':won' : ':lost'}`; totals.endings[key] = (totals.endings[key] ?? 0) + 1; }
  if (r.divergence) totals.differing++;
}

// Plays the given scenarios against the ROM with the addresses in `map` and returns the totals and the first difference.
export function verify(specs, { rom, info, map, log = null }) {
  const totals = newTotals();
  let difference = null;
  for (const spec of specs) {
    const r = runScenario(spec, { rom, info, map });
    addTotals(totals, r);
    if (log) log(spec, r);
    if (r.divergence && !difference) difference = { scenario: spec.id, ...r.divergence };
  }
  return { totals, difference };
}

// ---------------------------------------------------------------------------
// Parallel runs. Scenarios are independent, so they are dealt out one at a time to worker threads running this same file.
// ---------------------------------------------------------------------------
const slim = (r) => ({ iterations: r.iterations, games: r.games, states: r.states, events: r.events, divergence: r.divergence, unfinished: r.unfinished, finished: r.finished, frames: r.frames });

if (!isMainThread && workerData?.role === 'rom-oracle') {
  const rom = loadRom();
  const info = analyseRom(rom);
  parentPort.on('message', ({ id, spec, map }) => {
    if (map) { parentPort.postMessage({ id, result: slim(runScenario(spec, { rom, info, map })) }); return; }
    const locator = new Locator();
    const r = runScenario(spec, { rom, info, locator });
    parentPort.postMessage({ id, result: slim(r), candidates: [...locator.candidates], emptied: [...locator.emptied] });
  });
}

export const defaultJobs = () => Math.max(1, Math.min(availableParallelism() - 1, 6));

// Runs every scenario on up to `jobs` threads: against the addresses in `map` when given, otherwise collecting candidate addresses.
// Resolves to one message per scenario, in the order of `specs`; `onResult(spec, message)` is called as each one arrives.
export function runAll(specs, { map = null, jobs = defaultJobs(), onResult = null } = {}) {
  return new Promise((resolveAll, rejectAll) => {
    const out = new Array(specs.length);
    const workers = [];
    let next = 0, done = 0;
    const stop = (error) => { for (const w of workers) w.terminate(); rejectAll(error); };
    const feed = (worker) => {
      if (next >= specs.length) { worker.terminate(); return; }
      const index = next++;
      worker.once('message', (message) => {
        out[index] = message; done++;
        if (onResult) onResult(specs[index], message);
        if (done === specs.length) { for (const w of workers) w.terminate(); resolveAll(out); } else feed(worker);
      });
      worker.postMessage({ id: index, spec: specs[index], map });
    };
    if (!specs.length) { resolveAll(out); return; }
    for (let i = 0; i < Math.min(jobs, specs.length); i++) {
      const worker = new Worker(new URL(import.meta.url), { workerData: { role: 'rom-oracle' } });
      worker.on('error', stop);
      workers.push(worker);
      feed(worker);
    }
  });
}

// The totals and the first difference of a parallel run against known addresses.
export function summarise(specs, messages) {
  const totals = newTotals();
  let difference = null;
  messages.forEach((m, i) => {
    addTotals(totals, m.result);
    if (m.result.divergence && !difference) difference = { scenario: specs[i].id, ...m.result.divergence };
  });
  return { totals, difference };
}

// What the candidate addresses of every scenario leave when they are intersected.
function mergeCandidates(messages) {
  const merged = new Map(), emptied = new Map();
  messages.forEach((m, scenario) => {
    for (const [name, list] of m.candidates) {
      const had = merged.get(name);
      const now = had ? had.filter((a) => list.includes(a)) : list;
      if (had && had.length && !now.length && !emptied.has(name)) emptied.set(name, { scenario, why: 'no address agrees with all scenarios so far' });
      merged.set(name, now);
    }
    for (const [name, info] of m.emptied) if (!emptied.has(name)) emptied.set(name, { scenario, ...info });
  });
  return { merged, emptied };
}

const line = (spec, r) => `  scenario ${String(spec.id).padStart(3)} ${r.divergence ? 'DIFFERS ' + JSON.stringify(r.divergence) : 'ok  ' + summary(spec, r)}`;
const readOption = (rest, name, fallback) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? Number(rest[i + 1]) : fallback; };

async function replay(rest) {
  const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const rom = loadRom();
  if (sha256(rom) !== fixture.rom.sha256) throw new Error('the ROM is not the one the fixture was recorded with');
  const quick = rest.includes('--quick');
  const ids = rest.includes('--ids') ? rest[rest.indexOf('--ids') + 1].split(',').map(Number) : null;
  const specs = planScenarios(fixture.generator).filter((spec) => (!quick || fixture.quick.includes(spec.id)) && (!ids || ids.includes(spec.id)));
  const jobs = readOption(rest, 'jobs', defaultJobs());
  console.log(`replaying ${specs.length} scenarios against ${rel(ROM_PATH)} on ${Math.min(jobs, specs.length)} threads`);
  const messages = await runAll(specs, { map: fixture.map, jobs, onResult: (spec, m) => console.log(line(spec, m.result)) });
  const { totals, difference } = summarise(specs, messages);
  console.log(`${totals.iterations} iterations in ${totals.games} games compared; ${difference ? 'FIRST DIFFERENCE: ' + JSON.stringify(difference) : 'no difference'}.`);
  if (difference) process.exitCode = 1;
}

async function main() {
  const [command = 'check', ...rest] = process.argv.slice(2);
  if (command === 'replay') return replay(rest);
  const option = (name) => readOption(rest, name, DEFAULTS[name]);
  const jobs = readOption(rest, 'jobs', defaultJobs());
  const rom = loadRom();
  const info = analyseRom(rom);
  console.log(`ROM ${rel(ROM_PATH)} (${rom.length} bytes, SHA-256 ${sha256(rom)})`);
  console.log(`found by its code: frame counter $${hex(info.nmis)}, generator $${info.rand.map((a) => hex(a)).join(' $')}, board $${hex(info.boardState, 4)}, read_pads at $${hex(info.pcReadPads, 4)}`);
  const specs = planScenarios({ games: option('games'), seed: option('seed') });
  const messages = await runAll(specs, { jobs, onResult: (spec, m) => console.log(line(spec, m.result)) });
  const totals = newTotals();
  const results = [];
  messages.forEach((m, i) => {
    addTotals(totals, m.result);
    results.push({ id: specs[i].id, iterations: m.result.iterations, games: m.result.games.length, features: featuresOf(specs[i], m.result) });
    if (m.result.divergence) process.exitCode = 1;
  });
  const { merged, emptied } = mergeCandidates(messages);
  const failures = [...merged].filter(([, list]) => list.length === 0).map(([name]) => name);
  const unique = {};
  for (const [name, list] of merged) if (list.length === 1) unique[name] = list[0];
  let ambiguous = [...merged].filter(([, list]) => list.length > 1).map(([name]) => name);
  // The board and the CPU's memory are arrays of 72 bytes. When every entry the data pins down sits at base + i, an entry that never held a
  // value that told it apart from the other bytes (a card the CPU never remembered, in these scenarios) is placed by the same layout.
  const placedByLayout = [];
  for (const prefix of ['board', 'remember']) {
    const index = (name) => (name.startsWith(prefix) && /^[0-9]+$/.test(name.slice(prefix.length)) ? Number(name.slice(prefix.length)) : -1);
    const bases = new Set(Object.entries(unique).filter(([name]) => index(name) >= 0).map(([name, address]) => address - index(name)));
    if (bases.size > 1) {
      // an entry pinned down at an address off the line of the others is either a coincidence or a difference: say which entries
      const tally = new Map(); for (const base of bases) tally.set(base, 0);
      const known = Object.entries(unique).filter(([name]) => index(name) >= 0);
      for (const [name, address] of known) tally.set(address - index(name), tally.get(address - index(name)) + 1);
      const main = [...tally].sort((x, y) => y[1] - x[1])[0][0];
      console.log(`  the ${prefix} array does not lie on one line: most entries start at $${hex(main, 3)}; off the line: ${known.filter(([name, address]) => address - index(name) !== main).map(([name, address]) => `${name} at ${hex(address, 3)}`).join(', ')}`);
      process.exitCode = 1;
      continue;
    }
    if (bases.size !== 1) continue;
    const [base] = bases;
    for (const name of ambiguous.filter((n) => index(n) >= 0)) if (merged.get(name).includes(base + index(name))) { unique[name] = base + index(name); placedByLayout.push(name); }
    ambiguous = ambiguous.filter((n) => unique[n] === undefined);
  }
  console.log(`${totals.iterations} iterations in ${totals.games} games compared (${totals.unfinished} left unfinished at the iteration limit). Fields with no matching address: ${failures.length ? failures.join(', ') : 'none'}. Addresses found for ${Object.keys(unique).length} of ${merged.size} fields (${placedByLayout.length ? `${placedByLayout.join(', ')} placed by the layout of their array` : 'all pinned down by the data'}); undecided: ${ambiguous.length ? ambiguous.join(', ') : 'none'}.`);
  for (const name of failures) console.log(`  no address for ${name}: ${JSON.stringify(emptied.get(name))}`);
  for (const name of ambiguous) { const list = merged.get(name); console.log(`  ${name} could be at ${list.slice(0, 8).map((a) => `$${hex(a, 3)}`).join(', ')}${list.length > 8 ? `, and ${list.length - 8} more` : ''}`); }
  console.log('states visited:', JSON.stringify(totals.states));
  console.log('events:', JSON.stringify(totals.events));
  console.log('endings:', JSON.stringify(totals.endings));
  if (failures.length) process.exitCode = 1;

  if (command === 'record') {
    if (process.exitCode || ambiguous.length) { console.error('Not recorded: every scenario must agree and every field must have exactly one address (play more games with --games).'); process.exitCode = 1; return; }
    // the addresses found must now explain every scenario on their own
    const check = summarise(specs, await runAll(specs, { map: unique, jobs }));
    if (check.difference) { console.error('Not recorded: the addresses found do not explain scenario', JSON.stringify(check.difference)); process.exitCode = 1; return; }
    const quick = chooseQuick(results);
    console.log(`quick set for npm test: scenarios ${quick.ids.join(', ')} (${quick.spent} iterations); not covered by it: ${quick.missed.length ? quick.missed.join(', ') : 'nothing'}`);
    const fixture = {
      oracle: 'concentration-room-rom-0.02',
      rom: { path: rel(ROM_PATH), bytes: rom.length, sha256: sha256(rom) },
      foundByItsCode: { frameCounter: info.nmis, generator: info.rand, curKeys: info.curKeys, board: info.boardState, pcReadPads: info.pcReadPads, pcTitleMix: info.pcTitleMix, pcDealMix: info.pcDealMix },
      generator: { games: option('games'), seed: option('seed') },
      quick: quick.ids,
      quickIterations: quick.spent,
      map: unique,
      placedByLayout,
      totals: check.totals,
      recordedWith: { node: process.version, platform: process.platform },
    };
    mkdirSync(dirname(FIXTURE), { recursive: true });
    writeFileSync(FIXTURE, `${JSON.stringify(fixture)}\n`);
    console.log(`Recorded ${rel(FIXTURE)} (${statSync(FIXTURE).size} bytes).`);
  }
}

if (isMainThread && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.stack ?? error.message); process.exit(1); });
}
