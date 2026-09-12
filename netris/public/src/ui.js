// SPDX-License-Identifier: GPL-3.0-or-later
//
// Browser shell around the ported engine: canvas rendering, keyboard input,
// and the tick loop. None of this exists in the original — netris.org's own
// UI was curses.c, a terminal renderer that has no counterpart in a browser
// — so this file carries no reference/ mapping of its own; see
// specs/port-map.md for exactly which original functions engine.js covers.

import { NetrisGame, BOARD_WIDTH, BOARD_VISIBLE, BT_NONE } from "./engine.js";
import { NetrisRobot } from "./robot.js";

// sr.c moved the piece at most once per 0.5 simulated seconds. This is
// faster, for a browser-attention-span pace, but keeps the same idea:
// moves happen one at a time, on their own clock, independent of the
// fall-speed timer.
const ROBOT_MOVE_INTERVAL_MS = 200;

// game.c DEFAULT_KEYS "jkl mspf^l": j=left, k=rotate, l=right, space=down,
// m=toggleSpy (n/a, no spectating here), s=pause, p=drop, f=faster.
// Preserved as the default binding, with arrow keys added as a modern
// convenience the original never had.
const KEYS = {
  left: ["j", "ArrowLeft"],
  rotate: ["k", "ArrowUp"],
  right: ["l", "ArrowRight"],
  down: [" ", "ArrowDown"],
  drop: ["p"],
  faster: ["f"],
  pause: ["s"],
  robot: ["a"],
};

const COLORS = {
  [BT_NONE]: null,
  1: "#e8e8e8", // BT_white
  2: "#4d6bd8", // BT_blue
  3: "#c24dd8", // BT_magenta
  4: "#4dd2d8", // BT_cyan
  5: "#d8c94d", // BT_yellow
  6: "#4dd86b", // BT_green
  7: "#d84d4d", // BT_red
};

const CELL = 24;

function keyAction(key) {
  const lower = key.length === 1 ? key.toLowerCase() : key;
  for (const [action, bindings] of Object.entries(KEYS)) {
    if (bindings.includes(lower) || bindings.includes(key)) return action;
  }
  return null;
}

class NetrisUI {
  constructor(root) {
    this.root = root;
    this.canvas = root.querySelector("#board");
    this.ctx = this.canvas.getContext("2d");
    this.linesEl = root.querySelector("#lines");
    this.statusEl = root.querySelector("#status");
    this.canvas.width = BOARD_WIDTH * CELL;
    this.canvas.height = BOARD_VISIBLE * CELL;
    this.paused = false;
    this.timer = null;
    this.robotTimer = null;
    this.robotOn = false;
    this.game = new NetrisGame({ seed: Date.now() });
    this.robot = new NetrisRobot(this.game, { boardHeight: BOARD_VISIBLE });
    this.bindKeys();
    this.startTimer();
    this.draw();
  }

  bindKeys() {
    window.addEventListener("keydown", (event) => {
      const action = keyAction(event.key);
      if (!action) return;
      event.preventDefault();
      this.handleAction(action);
    });
  }

  handleAction(action) {
    if (this.game.gameOver) return;
    if (action === "pause") {
      this.togglePause();
      return;
    }
    if (action === "robot") {
      this.toggleRobot();
      return;
    }
    if (this.paused) return;
    // game.c: when a robot is driving, the game's own key handling steps
    // aside entirely rather than fighting it — only Pause and Faster (and,
    // here, the robot toggle itself) still work.
    if (this.robotOn && action !== "faster") return;
    switch (action) {
      case "left": this.game.movePiece(0, -1); break;
      case "right": this.game.movePiece(0, 1); break;
      case "rotate": this.game.rotatePiece(); break;
      case "down": this.game.movePiece(-1, 0); break;
      case "drop":
        // game.c: a hard drop resets the fall timer rather than locking
        // immediately — the next tick is what locks the piece.
        this.game.dropPiece();
        this.startTimer();
        break;
      case "faster": this.game.goFaster(); this.startTimer(); break;
    }
    this.draw();
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      clearInterval(this.timer);
      this.timer = null;
      clearInterval(this.robotTimer);
      this.robotTimer = null;
    } else {
      this.startTimer();
      if (this.robotOn) this.startRobotTimer();
    }
    this.draw();
  }

  toggleRobot() {
    this.robotOn = !this.robotOn;
    if (this.robotOn && !this.paused) this.startRobotTimer();
    else {
      clearInterval(this.robotTimer);
      this.robotTimer = null;
    }
    this.draw();
  }

  startRobotTimer() {
    if (this.robotTimer) clearInterval(this.robotTimer);
    this.robotTimer = setInterval(() => {
      this.robot.step();
      this.draw();
    }, ROBOT_MOVE_INTERVAL_MS);
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    if (this.paused || this.game.gameOver) return;
    // game.c's speed is in microseconds (SetITimer); browsers tick in
    // milliseconds.
    this.timer = setInterval(() => this.onTick(), this.game.speed / 1000);
  }

  onTick() {
    const alive = this.game.tick();
    if (!alive) {
      clearInterval(this.timer);
      this.timer = null;
      clearInterval(this.robotTimer);
      this.robotTimer = null;
    }
    this.draw();
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.robotTimer) clearInterval(this.robotTimer);
    this.robotTimer = null;
  }

  draw() {
    const { ctx, game } = this;
    ctx.fillStyle = "#0f1613";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < BOARD_VISIBLE; ++y) {
      for (let x = 0; x < BOARD_WIDTH; ++x) {
        const block = game.board.getBlock(y, x);
        const color = COLORS[block];
        if (!color) continue;
        // The board's y grows upward (netris.h's D_up convention); canvas
        // rows grow downward, so flip when drawing.
        const py = (BOARD_VISIBLE - 1 - y) * CELL;
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL + 1, py + 1, CELL - 2, CELL - 2);
      }
    }
    this.linesEl.textContent = String(game.linesCleared);
    this.statusEl.textContent = game.gameOver
      ? "Game over — press R to restart"
      : this.paused
        ? "Paused"
        : this.robotOn
          ? "Autopilot (sr.c, 1994–1996) — press A to take back the keyboard"
          : "";
  }
}

function boot() {
  const root = document.querySelector("#app");
  let ui = new NetrisUI(root);
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "r") {
      ui.destroy();
      ui = new NetrisUI(root);
    }
  });
}

document.addEventListener("DOMContentLoaded", boot);
