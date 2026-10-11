// Behaviour of the original phone interface that the browser version adds on top of the engine
// (read from SudokuUI.java, SudokuStateControl.java and SudokuMidlet.java; see specs/port-map.md):
// entering the digit already there clears the cell, pencil mode gives way to pen mode on a cell that
// shows a digit, "Reset Game", "edit current game" and the display of the solution.
import fs from 'node:fs';
import {
  Grid, GameSession, customSolutionToGrid, editableGrid, solutionViewCell, normalizeCustomPuzzle,
} from '../public/src/core/index.js';
import { handleWorkerRequest } from '../public/src/workers/worker-handler.js';

let pass = 0, fail = 0;
function ok(name, value, detail = '') { console.log(`${value ? 'PASS' : 'FAIL'} | ${name}${detail ? ` | ${detail}` : ''}`); value ? pass++ : fail++; }

const root = new URL('../', import.meta.url);
const read = (rel) => fs.readFileSync(new URL(rel, root), 'utf8');
const expected = JSON.parse(read('test/oracles.json'));
const fixture = expected.solver_fixtures.find((entry) => entry.name === 'unique');
const html = read('public/index.html');
const app = read('public/src/browser/app.js');

try {
  const makeGame = () => customSolutionToGrid(fixture.puzzle, fixture.solution1, { play: true });
  const empty = [];
  for (let i = 0; i < 81; i++) if (fixture.puzzle[i] === '0') empty.push([Math.trunc(i / 9), i % 9]);
  const [r, c] = empty[0];
  const [r2, c2] = empty[1];

  // Entering the digit that is already there clears the cell, and the move can be undone.
  {
    const game = makeGame(), session = new GameSession(game), slot = game.getSlot(r, c);
    session.inputDigit(r, c, 5);
    ok('a digit is entered', slot.getShown() === 5);
    session.inputDigit(r, c, 5);
    ok('entering the same digit again clears the cell', slot.getShown() === 0);
    session.undo();
    ok('undo brings the cleared digit back', slot.getShown() === 5);
    session.undo();
    ok('undo again empties the cell', slot.getShown() === 0 && !session.moves.canUndo());
    session.inputDigit(r, c, 5); session.inputDigit(r, c, 6);
    ok('a different digit replaces the one shown', slot.getShown() === 6);
    session.inputDigit(r, c, 0);
    ok('digit 0 still clears, and clearing an empty cell leaves it empty', slot.getShown() === 0 && (session.inputDigit(r, c, 0), slot.getShown() === 0));
  }

  // Pencil mode gives way to pen mode on a cell that shows a digit (SudokuUI.numberPressed).
  {
    const game = makeGame(), session = new GameSession(game), slot = game.getSlot(r, c);
    session.setPencilMode(true);
    session.inputDigit(r, c, 3);
    ok('in pencil mode on an empty cell a mark is toggled', session.pencilMode && slot.isPencilMark(2) && slot.getShown() === 0);
    session.setPencilMode(false); session.inputDigit(r, c, 4); session.setPencilMode(true);
    session.inputDigit(r, c, 3);
    ok('on a cell that shows a digit, pencil mode switches off and the digit is entered', !session.pencilMode && slot.getShown() === 3);
    ok('the marks are left as they were', slot.isPencilMark(2) && !slot.isPencilMark(3));
    const given = game.getSlot(...[...Array(81).keys()].filter((i) => fixture.puzzle[i] !== '0').map((i) => [Math.trunc(i / 9), i % 9])[0]);
    session.setPencilMode(true);
    ok('a given number cannot be changed and pencil mode stays', !session.inputDigit(...[...Array(81).keys()].filter((i) => fixture.puzzle[i] !== '0').map((i) => [Math.trunc(i / 9), i % 9])[0], 2) && session.pencilMode && given.getShown() !== 0);
  }

  // Reset Game: digits, marks, time and history are cleared, the given numbers stay.
  {
    const game = makeGame(), session = new GameSession(game);
    session.inputDigit(r, c, 5); session.setPencilMode(true); session.inputDigit(r2, c2, 7);
    game.setElapsedTime(123456);
    session.reset();
    ok('reset clears the digits and keeps the given numbers', game.shownString() === fixture.puzzle);
    ok('reset clears the marks', game.getSlot(r2, c2).getPencilMarks() === 0);
    ok('reset clears the elapsed time and the history', game.getElapsedTime() === 0 && !session.moves.canUndo() && !session.moves.canRedo());
  }

  // Edit current game: the given numbers become plain digits, the rest is cleared, on a copy.
  {
    const game = makeGame(), session = new GameSession(game);
    session.inputDigit(r, c, 5); game.getSlot(r2, c2).setPencilMark(1, true); game.setElapsedTime(5000);
    const edit = editableGrid(game);
    ok('the edit grid shows the given numbers only', edit.shownString() === fixture.puzzle);
    let plain = true, cleared = true;
    for (let i = 0; i < 81; i++) {
      const slot = edit.getSlot(Math.trunc(i / 9), i % 9);
      if (slot.isOriginalDigit()) plain = false;
      if (slot.getAnswer() !== 0 && fixture.puzzle[i] === '0') cleared = false;
      if (slot.getPencilMarks() !== 0) cleared = false;
    }
    ok('no cell is a fixed given while editing and nothing else is left over', plain && cleared);
    ok('the edit grid is a custom puzzle with the clock at zero', edit.getType() === 'user' && edit.getElapsedTime() === 0);
    ok('the game being played is untouched', game.getSlot(r, c).getShown() === 5 && game.getSlot(r, c).getAnswer() !== 0 && game.getSlot(2, 2) !== edit.getSlot(2, 2) && game.getElapsedTime() === 5000 && game.getSlot(r2, c2).isPencilMark(1));
    ok('the edit grid is accepted as a puzzle', normalizeCustomPuzzle(edit.shownString()) === fixture.puzzle);
    const solved = handleWorkerRequest({ version: 1, op: 'solve', payload: { puzzle: edit.shownString() } }).result;
    ok('solving the edited puzzle gives back the original solution', solved.rules && solved.solutions === 1 && solved.solution1 === fixture.solution1);
  }

  // Display Solution: the answer everywhere, the player's digits marked right or wrong.
  {
    const game = makeGame(), session = new GameSession(game);
    const answer = (row, col) => Number(fixture.solution1[row * 9 + col]);
    session.inputDigit(r, c, answer(r, c));
    session.inputDigit(r2, c2, answer(r2, c2) === 9 ? 1 : answer(r2, c2) + 1);
    const right = solutionViewCell(game.getSlot(r, c)), wrong = solutionViewCell(game.getSlot(r2, c2));
    const [r3, c3] = empty[2];
    const blank = solutionViewCell(game.getSlot(r3, c3));
    const given = solutionViewCell(game.getSlot(...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((col) => [0, col]).find(([row, col]) => fixture.puzzle[row * 9 + col] !== '0')));
    ok('a correct digit is shown as the answer and marked correct', right.digit === answer(r, c) && right.mark === 'correct');
    ok('a wrong digit is replaced by the answer and marked wrong', wrong.digit === answer(r2, c2) && wrong.mark === 'wrong');
    ok('an empty cell shows the answer without a mark', blank.digit === answer(r3, c3) && blank.mark === 'empty');
    ok('a given number carries the given mark', given.mark === 'given');
    ok('showing the solution does not change the board', game.getSlot(r2, c2).getShown() !== answer(r2, c2));
  }

  // The browser page exposes the commands and guards them.
  for (const id of ['solutionMenuButton', 'resetGameMenuButton', 'editPuzzleMenuButton']) ok(`menu has ${id}`, html.includes(`id="${id}"`));
  ok('input is ignored while the solution is shown', app.includes('if(showSolution)return;') && app.includes('button.disabled = showSolution'));
  ok('Escape leaves the solution view', app.includes("if(e.key==='Escape'){e.preventDefault();setSolutionView(false);}"));
  ok('reset asks before it clears anything', app.includes("window.confirm(t('resetGameConfirm'))"));
  ok('the right/wrong marks use a glyph as well as a colour', read('public/src/browser/styles.css').includes("content:'✓'") && read('public/src/browser/styles.css').includes("content:'✗'"));
  for (const key of ['showSolution', 'showPuzzle', 'resetGame', 'editPuzzle', 'solutionShown', 'puzzleShown', 'resetGameConfirm', 'gameReset', 'solutionA11y', 'digitRightA11y', 'digitWrongA11y']) {
    ok(`text ${key} exists in English and Italian`, (app.match(new RegExp(`\\b${key}\\s*:`, 'g')) || []).length === 2);
  }
  ok('the empty custom grid is still available', new Grid('user').getSlot(0, 0).getShown() === 0);
} catch (error) { console.error(error); fail++; }

console.log(`SUMMARY | pass=${pass} fail=${fail}`);
if (fail) process.exit(1);
