/* SPDX-License-Identifier: GPL-3.0-or-later */

// What the program does before a stage begins, one pass of its loops at a time (game.c: `title_screen` and `show_level_number`): the title
// screen, which reads a hidden code; the sound test, which START opens if A, B, SELECT and START were all down when it was pressed; and the
// screen with the number of the level, where the code lets the player choose the level. The page is not these screens (it has cards and
// its own sounds), but it uses the same rules: `stepCode`, `stepLevelSelect` and `stepSoundTest` are what `Frontend` is made of.

import { BUTTON, PadPoll } from './input.js';
import { Rng8 } from './rng.js';

export const LEVELS_ALL = 8;                 // the number of the final screen; 0 to 7 are Days 1 to 4, the Dream, and Days 5 to 7
export const SOUND_TEST_EFFECTS = 21;
export const SOUND_TEST_TUNES = 7;
export const SOUND_TEST_BUTTONS = BUTTON.A | BUTTON.B | BUTTON.SELECT | BUTTON.START;

// The title screen waits 72 passes after START, the program clears the screen in one, shows the number of the level for 150, and clears
// the screen in one more.
export const TRANSITION_PASSES = 72;
export const CHANGE_SCREEN_PASSES = 1;
export const LEVEL_SHOWN_PASSES = 150;

export const TEST_CODE = Object.freeze([BUTTON.B, BUTTON.A, BUTTON.B, BUTTON.A, BUTTON.LEFT, BUTTON.UP, BUTTON.B, BUTTON.A]);

// The title screen's code: each pass in which some button was newly pressed must have newly pressed exactly the next button of the code,
// or the code starts again. `index` is 255 once the code has been entered. Returns the new index and whether it was just completed.
export function stepCode(index, trigger) {
  if (!trigger || index >= 255) return { index, entered: false };
  if (trigger !== TEST_CODE[index]) return { index: 0, entered: false };
  index++;
  return index === TEST_CODE.length ? { index: 255, entered: true } : { index, entered: false };
}

// The screen with the number of the level, when the code has been entered: LEFT and RIGHT change the level (0 to LEVELS_ALL), START, A or B
// leave. A pass in which both LEFT and RIGHT were pressed does both.
export function stepLevelSelect(level, trigger) {
  if (trigger & (BUTTON.START | BUTTON.A | BUTTON.B)) return { level, done: true };
  if ((trigger & BUTTON.LEFT) && level > 0) level--;
  if ((trigger & BUTTON.RIGHT) && level < LEVELS_ALL) level++;
  return { level, done: false };
}

// The sound test: `column` 0 is the effects, 1 the tunes; UP and DOWN change the number in the column, B plays it, A stops the tune and
// START leaves. Changes the object it is given and returns what was played: [{type: 'EFFECT', number}, {type: 'TUNE', number},
// {type: 'TUNE_STOP'}], and {type: 'LEAVE'} for START.
export function stepSoundTest(test, trigger, { effects = SOUND_TEST_EFFECTS, tunes = SOUND_TEST_TUNES } = {}) {
  const out = [];
  if (trigger & BUTTON.START) return [{ type: 'LEAVE' }];
  if (trigger & BUTTON.LEFT) test.column = 0;
  if ((trigger & BUTTON.RIGHT) && tunes) test.column = 1;
  if (trigger & BUTTON.UP) { if (!test.column) { if (test.effect < effects - 1) test.effect++; } else if (test.tune < tunes - 1) test.tune++; }
  if (trigger & BUTTON.DOWN) { if (!test.column) { if (test.effect) test.effect--; } else if (test.tune) test.tune--; }
  if (trigger & BUTTON.A) out.push({ type: 'TUNE_STOP' });
  if (trigger & BUTTON.B) out.push(test.column ? { type: 'TUNE', number: test.tune } : { type: 'EFFECT', number: test.effect });
  return out;
}

export class Frontend {
  // `testMode` is whether the code has been entered before (the program keeps it from one game to the next, until it is switched off).
  constructor({ rng = new Rng8(1), testMode = false, effects = SOUND_TEST_EFFECTS, tunes = SOUND_TEST_TUNES } = {}) {
    this.rng = rng;
    this.testMode = testMode;
    this.limits = { effects, tunes };
    this.pad = new PadPoll();
    this.phase = 'title';          // title, transition, sound, change, level, shown, change2, done
    this.codeIndex = 0;
    this.wait = 0;
    this.level = 0;
    this.sound = null;
  }

  // One pass with `buttons` held. Returns what happened: {type: 'CODE'} when the code is completed, {type: 'START'} when START leaves
  // the title screen, and what the sound test plays.
  tick(buttons) {
    const out = [];
    switch (this.phase) {
      case 'title': {
        const trigger = this.pad.poll(buttons);
        const code = stepCode(this.codeIndex, trigger);
        this.codeIndex = code.index;
        if (code.entered) { this.testMode = true; out.push({ type: 'CODE' }); }
        if (trigger & BUTTON.START) { this.phase = 'transition'; this.wait = TRANSITION_PASSES; out.push({ type: 'START' }); break; }
        this.rng.rand16();
        break;
      }
      case 'transition':
        // the program does not read the pad here: what it looks at afterwards is the pad as it was read when START was pressed
        if (--this.wait === 0) {
          if (this.pad.state === SOUND_TEST_BUTTONS) { this.phase = 'sound'; this.sound = { column: 0, effect: 0, tune: 0 }; }
          else { this.phase = 'change'; this.wait = CHANGE_SCREEN_PASSES; }
        }
        break;
      case 'sound': {
        const played = stepSoundTest(this.sound, this.pad.poll(buttons), this.limits);
        for (const e of played) out.push(e);
        if (played[0]?.type === 'LEAVE') { this.phase = 'change'; this.wait = CHANGE_SCREEN_PASSES; }
        break;
      }
      case 'change':
        if (--this.wait === 0) this.enterLevel();
        break;
      case 'level': {
        const step = stepLevelSelect(this.level, this.pad.poll(buttons));
        this.level = step.level;
        if (step.done) { this.phase = 'shown'; this.wait = LEVEL_SHOWN_PASSES; }
        break;
      }
      case 'shown':
        if (--this.wait === 0) { this.phase = 'change2'; this.wait = CHANGE_SCREEN_PASSES; }
        break;
      case 'change2':
        if (--this.wait === 0) this.phase = 'done';
        break;
      default:
        break;
    }
    return out;
  }

  // The screen with the number of the level starts: without the code it shows the number for 150 passes and nothing else.
  enterLevel() {
    if (this.testMode) this.phase = 'level';
    else { this.phase = 'shown'; this.wait = LEVEL_SHOWN_PASSES; }
  }

  get done() { return this.phase === 'done'; }
}
