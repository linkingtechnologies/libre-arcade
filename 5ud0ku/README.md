# 5ud0ku

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/5ud0ku/public/index.html)**

HTML5 port of **5ud0ku 1.8**, the Sudoku game for Java phones written by Ivonne Engemann and Marcus Wagner (Ive&Case) in 2006. The puzzles are made by the original generator, which runs on the player's own device: it fills three boxes at random, completes the grid, removes numbers in symmetric groups and keeps only puzzles with exactly one solution. The port runs that same generator in the browser, and its results were checked against the original Java code itself.

## Play

- Choose a cell (mouse, touch or the arrow keys) and enter a digit with the number pad or the keys 1 to 9. Delete, Backspace or 0 clears the cell, and so does entering the digit that is already in it.
- **Pencil** (or P) switches to candidate marks: the digits you enter become small notes in the cell instead of an answer. **Undo** and **Redo** (Ctrl or Cmd with Z and Y) cover digits, notes and hints.
- **Hint** fills the selected cell with its answer (you can undo it). **Check** highlights digits that clash with another one in the same row, column or box.
- **New game** asks for Easy, Normal or Hard, or lets you enter a Sudoku of your own and have it solved ("Solve") or played ("Solve & Play"). A puzzle can have no solution, one, or several; the game says which.
- The **menu** saves games under a name, loads and deletes them, shows the solution (your own digits are marked right or wrong; Esc goes back), restarts the game, turns the puzzle on the board into one you can edit and solve again, and holds the settings: beginner mode (the notes update by themselves), clash highlighting, and a button that erases everything the game stored in your browser. The game is also saved automatically and restored the next time you open it.
- **IT/EN** switches the language and the choice is remembered. **Help** and **Credits** are in the menu.

## What is preserved

The generator, both solvers, the move history and the save format are ported from the original Java and compared with it:

- **Generator.** Three diagonal boxes filled at random, completed by the original first-solution search, 36 numbers removed at the start, then removal in symmetric groups with a uniqueness check after each step, undone when uniqueness is lost. The targets are 40 numbers shown for Easy, 33 for Normal and 23 for Hard; the count reached differs a little, because numbers are removed in groups and uniqueness can stop the removal early (in 500 games of each level, most Easy puzzles showed 38 to 40 numbers, Normal ones 31 to 34 and Hard ones 24 to 29). Hard keeps the best of three puzzles by the original's own rule: deeper trial and error first, then fewer easy singles and shown numbers.
- **Solvers.** The mixed solver (singles, hidden singles, then trial and error) that proves uniqueness, and the plain row-by-row brute force that checks puzzles you enter, with the original's order of digits and its stop at a second solution.
- **History and saves.** The undo history keeps the original's 100-slot ring, which holds 99 moves. Saved games use the byte layout of the original application.

What was checked, and how far, is in [`specs/port-map.md`](specs/port-map.md); where the sources come from, their licence and the evidence are in [`PROVENANCE.md`](PROVENANCE.md). The look of the board, the controls, the languages (English and Italian here; the original had German, English, Hungarian, Polish and Slovak) and the dialogs are new. The images of the original are not redistributed (see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)).

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no framework and no build step to play: `public/` is plain HTML, CSS and JavaScript (ES modules, with the puzzle work in a Web Worker). Any static web server works (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). `npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Test

```sh
npm test         # node --test: all tests, no Java needed
npm run lint
npm run check    # lint + test
npm run test:live   # runs the original Java classes again and compares afresh (needs a JDK)
```

`npm test` includes the replay of a recorded run of the original classes: 500 Easy, 500 Normal and 300 Hard games, 514 solver puzzles, 600 sequences of moves and 10 random-number streams, 83,744 commands in all, with every answer identical in the port. See [`specs/port-map.md`](specs/port-map.md) for what that proves and what it does not.

## License

GPL-3.0-or-later. The game logic is a port of code that its authors released under the GNU Lesser General Public License, version 2.1 or any later version; that grant is stated in the licence file of the source archive and on the authors' manual page, not in the headers of the Java files. The preserved original sources and their licence texts are in `reference/5ud0ku-1.8/` and keep their own notices.
