import fs from "node:fs";
import vm from "node:vm";

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(...names) { names.forEach((name) => this.values.add(name)); }
  remove(...names) { names.forEach((name) => this.values.delete(name)); }
}

class FakeElement {
  constructor(tag = "div") {
    this.tagName = tag;
    this.children = [];
    this.classList = new FakeClassList();
    this.style = {};
    this.parentNode = null;
  }
  appendChild(child) {
    if (child?.parentNode) child.parentNode.children = child.parentNode.children.filter((item) => item !== child);
    this.children.push(child);
    if (child && typeof child === "object") child.parentNode = this;
    return child;
  }
  removeChild(child) { this.children = this.children.filter((item) => item !== child); }
  getBoundingClientRect() { return { top: 0, left: 0, width: 71, height: 96 }; }
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

export function createOriginalOracle(seed = 1) {
  const sourcePath = new URL("../../reference/rjanjic-js-solitaire/src/index.js", import.meta.url);
  const original = fs.readFileSync(sourcePath, "utf8").replace(/^import .*;\s*$/gm, "");
  const elements = new Map();
  const document = {
    head: new FakeElement("head"),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement: (tag) => new FakeElement(tag),
    createTextNode: (text) => ({ text }),
    addEventListener() {},
    removeEventListener() {},
  };
  const math = Object.create(Math);
  math.random = seededRandom(seed);
  const context = {
    document,
    window: {},
    Math: math,
    requestAnimationFrame: (callback) => callback(),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    console,
  };
  context.globalThis = context;
  const expose = `
    globalThis.__oracle = {
      state,
      draw() {
        const pile = state.deal.pile.cards;
        if (pile.length) handleClick(pile[pile.length - 1])({ stopPropagation() {} });
      },
      click(card) { handleClick(card)({ stopPropagation() {} }); },
      recycle: restartDeal,
      destinations(card, first = false) {
        return getAvailableDestinations(card, first).map(({ target }) => ({
          area: target.dest === 'finish' ? 'foundations' : 'tableau',
          pile: target.pile
        }));
      }
    };
  `;
  vm.runInNewContext(`const spriteImg = '';\n${original}\n${expose}`, context, { filename: "original-index.js" });
  context.window.onload();
  const oracle = context.__oracle;
  return {
    state: oracle.state,
    draw: () => oracle.draw(),
    click: (card) => oracle.click(card),
    recycle: () => oracle.recycle(),
    destinations: (card, first = false) => JSON.parse(JSON.stringify(oracle.destinations(card, first))),
  };
}

export function snapshotOriginal(oracle) {
  const state = oracle.state;
  return JSON.parse(JSON.stringify({
    cards: state.cards.map(({ type, number, facingUp }) => ({ suit: type, rank: number, faceUp: facingUp })),
    stock: [...state.deal.pile.cards],
    waste: [...state.deal.deal.cards],
    foundations: state.finish.map(({ cards }) => [...cards]),
    tableau: state.desk.map(({ cards }) => [...cards]),
  }));
}
