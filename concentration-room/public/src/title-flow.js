import { MODE } from './rules.js';

export const TITLE_SCREEN = Object.freeze({
  MAIN: 'main',
  DIFFICULTY: 'difficulty',
});

export const TITLE_MAIN_ITEMS = Object.freeze([
  MODE.STORY,
  MODE.SOLITAIRE,
  MODE.TWO_PLAYER,
  MODE.VS_CPU,
]);

export class TitleFlow {
  constructor({ difficulty = 0 } = {}) {
    this.difficulty = Math.max(0, Math.min(4, difficulty | 0));
    this.reset();
  }

  reset() {
    this.screen = TITLE_SCREEN.MAIN;
    this.selected = 0;
    this.pendingMode = null;
  }

  get itemCount() { return this.screen === TITLE_SCREEN.MAIN ? 4 : 5; }

  move(delta) {
    const n = this.itemCount;
    this.selected = Math.max(0, Math.min(n - 1, this.selected + Math.sign(delta || 0)));
    return this.selected;
  }

  select(index) {
    const n = this.itemCount;
    if (!Number.isInteger(index) || index < 0 || index >= n) return false;
    this.selected = index;
    return true;
  }

  back() {
    if (this.screen !== TITLE_SCREEN.DIFFICULTY) return false;
    this.screen = TITLE_SCREEN.MAIN;
    const idx = TITLE_MAIN_ITEMS.indexOf(this.pendingMode);
    this.selected = idx >= 0 ? idx : 0;
    this.pendingMode = null;
    return true;
  }

  activate() {
    if (this.screen === TITLE_SCREEN.MAIN) {
      const mode = TITLE_MAIN_ITEMS[this.selected];
      if (mode === MODE.STORY) return { type: 'start', mode, difficulty: this.difficulty };
      this.pendingMode = mode;
      this.screen = TITLE_SCREEN.DIFFICULTY;
      this.selected = this.difficulty;
      return { type: 'submenu', mode };
    }

    this.difficulty = this.selected;
    const mode = this.pendingMode;
    this.pendingMode = null;
    this.screen = TITLE_SCREEN.MAIN;
    this.selected = TITLE_MAIN_ITEMS.indexOf(mode);
    return { type: 'start', mode, difficulty: this.difficulty };
  }
}
